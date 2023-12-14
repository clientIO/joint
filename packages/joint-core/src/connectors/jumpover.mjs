import * as util from '../util/index.mjs';
import * as g from '../g/index.mjs';

// default size of jump if not specified in options
var JUMP_SIZE = 5;

// available jump types
// first one taken as default
var JUMP_TYPES = ['arc', 'gap', 'cubic'];

// default radius
var RADIUS = 0;

// takes care of math. error for case when jump is too close to end of line
var CLOSE_PROXIMITY_PADDING = 1;

// list of connector types not to jump over.
var IGNORED_CONNECTORS = ['smooth'];

// internal constants for round segment
var _13 = 1 / 3;
var _23 = 2 / 3;

function sortPointsAscending(p1, p2) {

    let { x: x1, y: y1 } = p1;
    let { x: x2, y: y2 } = p2;

    if (x1 > x2) {

        let swap = x1;
        x1 = x2;
        x2 = swap;

        swap = y1;
        y1 = y2;
        y2 = swap;
    }

    if (y1 > y2) {
        let swap = x1;
        x1 = x2;
        x2 = swap;

        swap = y1;
        y1 = y2;
        y2 = swap;
    }

    return [new g.Point(x1, y1), new g.Point(x2, y2)];
}

function overlapExists(line1, line2) {

    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = sortPointsAscending(line1.start, line1.end);
    const [{ x: x3, y: y3 }, { x: x4, y: y4 }] = sortPointsAscending(line2.start, line2.end);

    const xMatch = x1 <= x4 && x3 <= x2;
    const yMatch = y1 <= y4 && y3 <= y2;

    return xMatch && yMatch;
}

/**
 * Transform start/end and route into series of lines
 * @param {g.point} sourcePoint start point
 * @param {g.point} targetPoint end point
 * @param {g.point[]} route optional list of route
 * @return {g.line[]} [description]
 */
function createLines(sourcePoint, targetPoint, route) {
    // make a flattened array of all points
    var points = [].concat(sourcePoint, route, targetPoint);
    return points.reduce(function(resultLines, point, idx) {
        // if there is a next point, make a line with it
        var nextPoint = points[idx + 1];
        if (nextPoint != null) {
            resultLines[idx] = g.line(point, nextPoint);
        }
        return resultLines;
    }, []);
}

function setupUpdating(jumpOverLinkView) {
    var paper = jumpOverLinkView.paper;
    var updateList = paper._jumpOverUpdateList;

    // first time setup for this paper
    if (updateList == null) {
        updateList = paper._jumpOverUpdateList = [];
        var graph = paper.model;
        graph.on('batch:stop', function() {
            if (this.hasActiveBatch()) return;
            updateJumpOver(paper);
        });
        graph.on('reset', function() {
            updateList = paper._jumpOverUpdateList = [];
        });
    }

    // add this link to a list so it can be updated when some other link is updated
    if (updateList.indexOf(jumpOverLinkView) < 0) {
        updateList.push(jumpOverLinkView);

        // watch for change of connector type or removal of link itself
        // to remove the link from a list of jump over connectors
        jumpOverLinkView.listenToOnce(jumpOverLinkView.model, 'change:connector remove', function() {
            updateList.splice(updateList.indexOf(jumpOverLinkView), 1);
        });
    }
}

/**
 * Handler for a batch:stop event to force
 * update of all registered links with jump over connector
 * @param {object} batchEvent optional object with info about batch
 */
function updateJumpOver(paper) {
    var updateList = paper._jumpOverUpdateList;
    for (var i = 0; i < updateList.length; i++) {
        const linkView = updateList[i];
        const updateFlag = linkView.getFlag(linkView.constructor.Flags.CONNECTOR);
        linkView.requestUpdate(updateFlag);
    }
}

/**
 * Utility function to collect all intersection points of a single
 * line against group of other lines.
 * @param {g.line} line where to find points
 * @param {g.line[]} crossCheckLines lines to cross
 * @return {g.point[]} list of intersection points
 */
function findLineIntersections(line, crossCheckLines) {
    return util.toArray(crossCheckLines).reduce(function(res, crossCheckLine) {
        var intersection = line.intersection(crossCheckLine);
        if (intersection) {
            res.push(intersection);
        }
        return res;
    }, []);
}

/**
 * Sorting function for list of points by their distance.
 * @param {g.point} p1 first point
 * @param {g.point} p2 second point
 * @return {number} squared distance between points
 */
function sortPoints(p1, p2) {
    return g.line(p1, p2).squaredLength();
}

/**
 * Split input line into multiple based on intersection points.
 * @param {g.line} line input line to split
 * @param {g.point[]} intersections points where to split the line
 * @param {number} jumpSize the size of jump arc (length empty spot on a line)
 * @return {g.line[]} list of lines being split
 */
function createJumps(line, intersections, jumpSize) {
    return intersections.reduce(function(resultLines, point, idx) {
        // skipping points that were merged with the previous line
        // to make bigger arc over multiple lines that are close to each other
        if (point.skip === true) {
            return resultLines;
        }

        // always grab the last line from buffer and modify it
        var lastLine = resultLines.pop() || line;

        // calculate start and end of jump by moving by a given size of jump
        var jumpStart = g.point(point).move(lastLine.start, -(jumpSize));
        var jumpEnd = g.point(point).move(lastLine.start, +(jumpSize));

        // now try to look at the next intersection point
        var nextPoint = intersections[idx + 1];
        if (nextPoint != null) {
            var distance = jumpEnd.distance(nextPoint);
            if (distance <= jumpSize) {
                // next point is close enough, move the jump end by this
                // difference and mark the next point to be skipped
                jumpEnd = nextPoint.move(lastLine.start, distance);
                nextPoint.skip = true;
            }
        } else {
            // this block is inside of `else` as an optimization so the distance is
            // not calculated when we know there are no other intersection points
            var endDistance = jumpStart.distance(lastLine.end);
            // if the end is too close to possible jump, draw remaining line instead of a jump
            if (endDistance < jumpSize * 2 + CLOSE_PROXIMITY_PADDING) {
                resultLines.push(lastLine);
                return resultLines;
            }
        }

        var startDistance = jumpEnd.distance(lastLine.start);
        if (startDistance < jumpSize * 2 + CLOSE_PROXIMITY_PADDING) {
            // if the start of line is too close to jump, draw that line instead of a jump
            resultLines.push(lastLine);
            return resultLines;
        }

        // finally create a jump line
        var jumpLine = g.line(jumpStart, jumpEnd);
        // it's just simple line but with a `isJump` property
        jumpLine.isJump = true;

        resultLines.push(
            g.line(lastLine.start, jumpStart),
            jumpLine,
            g.line(jumpEnd, lastLine.end)
        );
        return resultLines;
    }, []);
}

/**
 * Assemble `D` attribute of a SVG path by iterating given lines.
 * @param {g.line[]} lines source lines to use
 * @param {number} jumpSize the size of jump arc (length empty spot on a line)
 * @param {number} radius the radius
 * @return {string}
 */
function buildPath(lines, jumpSize, jumpType, radius) {

    var path = new g.Path();
    var segment;

    // first move to the start of a first line
    segment = g.Path.createSegment('M', lines[0].start);
    path.appendSegment(segment);

    // make a paths from lines
    util.toArray(lines).forEach(function(line, index) {

        if (line.isJump) {
            var angle, diff;

            var control1, control2;

            if (jumpType === 'arc') { // approximates semicircle with 2 curves
                angle = -90;
                // determine rotation of arc based on difference between points
                diff = line.start.difference(line.end);
                // make sure the arc always points up (or right)
                var xAxisRotate = Number((diff.x < 0) || (diff.x === 0 && diff.y < 0));
                if (xAxisRotate) angle += 180;

                var midpoint = line.midpoint();
                var centerLine = new g.Line(midpoint, line.end).rotate(midpoint, angle);

                var halfLine;

                // first half
                halfLine = new g.Line(line.start, midpoint);

                control1 = halfLine.pointAt(2 / 3).rotate(line.start, angle);
                control2 = centerLine.pointAt(1 / 3).rotate(centerLine.end, -angle);

                segment = g.Path.createSegment('C', control1, control2, centerLine.end);
                path.appendSegment(segment);

                // second half
                halfLine = new g.Line(midpoint, line.end);

                control1 = centerLine.pointAt(1 / 3).rotate(centerLine.end, angle);
                control2 = halfLine.pointAt(1 / 3).rotate(line.end, -angle);

                segment = g.Path.createSegment('C', control1, control2, line.end);
                path.appendSegment(segment);

            } else if (jumpType === 'gap') {
                segment = g.Path.createSegment('M', line.end);
                path.appendSegment(segment);

            } else if (jumpType === 'cubic') { // approximates semicircle with 1 curve
                angle = line.start.theta(line.end);

                var xOffset = jumpSize * 0.6;
                var yOffset = jumpSize * 1.35;

                // determine rotation of arc based on difference between points
                diff = line.start.difference(line.end);
                // make sure the arc always points up (or right)
                xAxisRotate = Number((diff.x < 0) || (diff.x === 0 && diff.y < 0));
                if (xAxisRotate) yOffset *= -1;

                control1 = g.Point(line.start.x + xOffset, line.start.y + yOffset).rotate(line.start, angle);
                control2 = g.Point(line.end.x - xOffset, line.end.y + yOffset).rotate(line.end, angle);

                segment = g.Path.createSegment('C', control1, control2, line.end);
                path.appendSegment(segment);
            }

        } else {
            var nextLine = lines[index + 1];
            if (radius == 0 || !nextLine || nextLine.isJump) {
                segment = g.Path.createSegment('L', line.end);
                path.appendSegment(segment);
            } else {
                buildRoundedSegment(radius, path, line.end, line.start, nextLine.end);
            }
        }
    });

    return path;
}

function buildRoundedSegment(offset, path, curr, prev, next) {
    var prevDistance = curr.distance(prev) / 2;
    var nextDistance = curr.distance(next) / 2;

    var startMove = -Math.min(offset, prevDistance);
    var endMove = -Math.min(offset, nextDistance);

    var roundedStart = curr.clone().move(prev, startMove).round();
    var roundedEnd = curr.clone().move(next, endMove).round();

    var control1 = new g.Point((_13 * roundedStart.x) + (_23 * curr.x), (_23 * curr.y) + (_13 * roundedStart.y));
    var control2 = new g.Point((_13 * roundedEnd.x) + (_23 * curr.x), (_23 * curr.y) + (_13 * roundedEnd.y));

    var segment;
    segment = g.Path.createSegment('L', roundedStart);
    path.appendSegment(segment);

    segment = g.Path.createSegment('C', control1, control2, roundedEnd);
    path.appendSegment(segment);
}

/**
 * Actual connector function that will be run on every update.
 * @param {g.point} sourcePoint start point of this link
 * @param {g.point} targetPoint end point of this link
 * @param {g.point[]} route of this link
 * @param {object} opt options
 * @property {number} size optional size of a jump arc
 * @return {string} created `D` attribute of SVG path
 */
export const jumpover = function(sourcePoint, targetPoint, route, opt) { // eslint-disable-line max-params

    setupUpdating(this);

    var raw = opt.raw;
    var jumpSize = opt.size || JUMP_SIZE;
    var jumpType = opt.jump && ('' + opt.jump).toLowerCase();
    var radius = opt.radius || RADIUS;
    var ignoreConnectors = opt.ignoreConnectors || IGNORED_CONNECTORS;

    // grab the first jump type as a default if specified one is invalid
    if (JUMP_TYPES.indexOf(jumpType) === -1) {
        jumpType = JUMP_TYPES[0];
    }

    var paper = this.paper;
    var graph = paper.model;
    var allLinks = graph.getLinks();

    // there is just one link, draw it directly
    if (allLinks.length === 1) {
        return buildPath(
            createLines(sourcePoint, targetPoint, route),
            jumpSize, jumpType, radius
        );
    }

    var thisModel = this.model;
    var thisIndex = allLinks.indexOf(thisModel);
    var defaultConnector = paper.options.defaultConnector || {};

    // not all links are meant to be jumped over.
    var links = allLinks.filter(function(link, idx) {

        var connector = link.get('connector') || defaultConnector;

        // avoid jumping over links with connector type listed in `ignored connectors`.
        if (util.toArray(ignoreConnectors).includes(connector.name)) {
            return false;
        }
        // filter out links that are above this one and  have the same connector type
        // otherwise there would double hoops for each intersection
        if (idx > thisIndex) {
            return connector.name !== 'jumpover';
        }
        return true;
    });

    // find views for all links
    var linkViews = links.map(function(link) {
        return paper.findViewByModel(link);
    });

    // create lines for this link
    var thisLines = createLines(
        sourcePoint,
        targetPoint,
        route
    );

    // create lines for all other links
    var linkLines = linkViews.map(function(linkView) {
        if (linkView == null) {
            return [];
        }
        if (linkView === this) {
            return thisLines;
        }
        return createLines(
            linkView.sourcePoint,
            linkView.targetPoint,
            linkView.route
        );
    }, this);

    // transform lines for this link by splitting with jump lines at
    // points of intersection with other links
    var jumpingLines = thisLines.reduce(function(resultLines, thisLine) {
        // iterate all links and grab the intersections with this line
        // these are then sorted by distance so the line can be split more easily
        var intersections = links.reduce(function(res, link, i) {
            // don't intersection with itself
            if (link !== thisModel) {

                const linkLinesToTest = linkLines[i].slice();
                const overlapIndex = linkLinesToTest.findIndex((line) => overlapExists(thisLine, line));

                // Overlap occurs and the end point of one segment lies on thisLine
                if (overlapIndex > -1 && thisLine.containsPoint(linkLinesToTest[overlapIndex].end)) {
                    // Remove the next segment because there will never be a jump
                    linkLinesToTest.splice(overlapIndex + 1, 1);
                }
                const lineIntersections = findLineIntersections(thisLine, linkLinesToTest);
                res.push.apply(res, lineIntersections);
            }
            return res;
        }, []).sort(function(a, b) {
            return sortPoints(thisLine.start, a) - sortPoints(thisLine.start, b);
        });

        if (intersections.length > 0) {
            // split the line based on found intersection points
            resultLines.push.apply(resultLines, createJumps(thisLine, intersections, jumpSize));
        } else {
            // without any intersection the line goes uninterrupted
            resultLines.push(thisLine);
        }
        return resultLines;
    }, []);

    var path = buildPath(jumpingLines, jumpSize, jumpType, radius);
    return (raw) ? path : path.serialize();
};
