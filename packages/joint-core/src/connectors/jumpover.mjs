import * as util from '../util/index.mjs';
import * as g from '../g/index.mjs';
import V from '../V/index.mjs';

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

// distance under which two coordinates are considered equal
const TOLERANCE = 1e-6;

// which of two crossing jumpover links draws the jump
// first one taken as default
const JUMP_PRIORITIES = ['paint-order', 'vertical', 'horizontal'];

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

function getPathBBox(sourcePoint, targetPoint, route) {
    return new g.Polyline([].concat(sourcePoint, route || [], targetPoint)).bbox();
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
        const start = lastLine.start;

        // the space a jump needs before the first and after the last crossing
        const margin = jumpSize + CLOSE_PROXIMITY_PADDING;

        // if the start or the end of the line is too close to the jump,
        // draw that line instead of a jump
        if (start.distance(point) < margin || lastLine.end.distance(point) < margin) {
            resultLines.push(lastLine);
            return resultLines;
        }

        // calculate start and end of jump by moving by a given size of jump
        const jumpStart = g.point(point).move(start, -(jumpSize));
        let jumpEnd = g.point(point).move(start, +(jumpSize));

        // Merge every following intersection that is close to the end of the
        // jump, so a track of parallel lines gets one jump instead of many.
        for (let next = idx + 1; next < intersections.length; next++) {
            const nextPoint = intersections[next];
            if (start.distance(nextPoint) - start.distance(jumpEnd) > jumpSize) break;
            // leave the intersections too close to the end out of the jump
            if (lastLine.end.distance(nextPoint) < margin) break;
            nextPoint.skip = true;
            jumpEnd = g.point(nextPoint).move(start, +(jumpSize));
        }

        // finally create a jump line
        var jumpLine = g.line(jumpStart, jumpEnd);
        // it's just simple line but with a `isJump` property
        jumpLine.isJump = true;

        resultLines.push(
            g.line(start, jumpStart),
            jumpLine,
            g.line(jumpEnd, lastLine.end)
        );
        return resultLines;
    }, []);
}

// Whether the jump has to be flipped so it points up (or right). A vertical
// line computed by a router can be a tiny bit off (e.g. `x` differs by 1e-13),
// which must not flip the jump.
function pointsLeftOrDown(diff) {
    if (Math.abs(diff.x) > TOLERANCE) return Number(diff.x < 0);
    return Number(diff.y < 0);
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
                var xAxisRotate = pointsLeftOrDown(diff);
                if (xAxisRotate) angle += 180;

                var midpoint = line.midpoint();
                var centerLine = new g.Line(midpoint, line.end).rotate(midpoint, angle);

                if (line.length() > 2 * jumpSize + TOLERANCE) {
                    // A merged jump over several lines: a quarter circle up,
                    // a straight top and a quarter circle down, so it bulges
                    // no more than a single jump (by `jumpSize`).
                    const along = new g.Point(line.end).difference(line.start).normalize(jumpSize);
                    const normal = new g.Point(centerLine.end).difference(midpoint).normalize(jumpSize);
                    const topStart = new g.Point(line.start).offset(along.x + normal.x, along.y + normal.y);
                    const topEnd = new g.Point(line.end).offset(-along.x + normal.x, -along.y + normal.y);
                    path.appendSegment(g.Path.createSegment('C',
                        new g.Point(line.start).offset(normal.x * V.KAPPA, normal.y * V.KAPPA),
                        new g.Point(topStart).offset(-along.x * V.KAPPA, -along.y * V.KAPPA),
                        topStart
                    ));
                    path.appendSegment(g.Path.createSegment('L', topEnd));
                    path.appendSegment(g.Path.createSegment('C',
                        new g.Point(topEnd).offset(along.x * V.KAPPA, along.y * V.KAPPA),
                        new g.Point(line.end).offset(normal.x * V.KAPPA, normal.y * V.KAPPA),
                        line.end
                    ));
                    return;
                }

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
                xAxisRotate = pointsLeftOrDown(diff);
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

// How vertical a line is: 0 for a horizontal line, 1 for a vertical one.
function getVerticality(line) {
    const dx = Math.abs(line.end.x - line.start.x);
    const dy = Math.abs(line.end.y - line.start.y);
    return (dx + dy === 0) ? 0 : dy / (dx + dy);
}

function getJumpPriority(args) {
    const jumpPriority = args && args.jumpPriority;
    return (JUMP_PRIORITIES.indexOf(jumpPriority) === -1) ? JUMP_PRIORITIES[0] : jumpPriority;
}

// Whether `thisLine` draws the jump where it crosses `otherLine` of another
// jumpover link. The `jumpPriority` of the link painted on top applies, and
// both links evaluate it from their own side, so exactly one of them draws
// the jump.
function drawsJump(thisLine, otherLine, jumpPriority, isOtherAbove) {
    const difference = getVerticality(thisLine) - getVerticality(otherLine);
    if (Math.abs(difference) > TOLERANCE) {
        return (jumpPriority === 'vertical') ? difference > 0 : difference < 0;
    }
    return !isOtherAbove;
}

/**
 * Actual connector function that will be run on every update.
 * @param {g.point} sourcePoint start point of this link
 * @param {g.point} targetPoint end point of this link
 * @param {g.point[]} route of this link
 * @param {object} opt options
 * @property {number} size optional size of a jump arc
 * @property {string} jumpPriority which of two crossing jumpover links draws the jump
 * @return {string} created `D` attribute of SVG path
 */
export const jumpover = function(sourcePoint, targetPoint, route, opt, linkView) {

    setupUpdating(linkView);

    var raw = opt.raw;
    var jumpSize = opt.size || JUMP_SIZE;
    var jumpType = opt.jump && ('' + opt.jump).toLowerCase();
    var radius = opt.radius || RADIUS;
    var ignoreConnectors = opt.ignoreConnectors || IGNORED_CONNECTORS;
    const jumpPriority = getJumpPriority(opt);

    // grab the first jump type as a default if specified one is invalid
    if (JUMP_TYPES.indexOf(jumpType) === -1) {
        jumpType = JUMP_TYPES[0];
    }

    var paper = linkView.paper;
    var graph = paper.model;
    var allLinks = graph.getLinks();

    // there is just one link, draw it directly
    if (allLinks.length === 1) {
        return buildPath(
            createLines(sourcePoint, targetPoint, route),
            jumpSize, jumpType, radius
        );
    }

    var thisModel = linkView.model;
    var thisIndex = allLinks.indexOf(thisModel);
    var defaultConnector = paper.options.defaultConnector || {};

    // Jumpover links that do not leave all their crossings with this link to
    // the link painted on top: which of the two draws each jump.
    const jumpRules = new Map();

    // not all links are meant to be jumped over.
    var links = allLinks.filter(function(link, idx) {

        var connector = link.get('connector') || defaultConnector;

        // avoid jumping over links with connector type listed in `ignored connectors`.
        if (util.toArray(ignoreConnectors).includes(connector.name)) {
            return false;
        }
        if (link !== thisModel && connector.name === 'jumpover') {
            const isAbove = idx > thisIndex;
            const priority = isAbove ? getJumpPriority(connector.args) : jumpPriority;
            if (priority !== 'paint-order') {
                jumpRules.set(link, { priority, isAbove });
            } else if (isAbove) {
                // filter out links that are above this one and  have the same connector type
                // otherwise there would double hoops for each intersection
                return false;
            }
        }
        return true;
    });

    // find views for all links
    var linkViews = links.map(function(link) {
        return paper.findViewByModel(link);
    });

    // Two links can cross only where the bounding boxes of their routes meet,
    // so the links outside of this link's bounding box are left out.
    // It is inflated, since `g.Rect.intersect()` misses boxes that only touch
    // (e.g. the zero-height box of a horizontal link).
    const thisBBox = getPathBBox(sourcePoint, targetPoint, route).inflate(1);
    const isCandidate = links.map((link, i) => {
        const view = linkViews[i];
        if (link === thisModel || !view || !view.sourcePoint || !view.targetPoint) return true;
        return thisBBox.intersect(getPathBBox(view.sourcePoint, view.targetPoint, view.route)) !== null;
    });
    links = links.filter((_, i) => isCandidate[i]);
    linkViews = linkViews.filter((_, i) => isCandidate[i]);

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

                // A segment next to one collinear with `thisLine` can meet the
                // infinite line of `thisLine` only at their shared vertex. If that
                // vertex is on `thisLine`, the two links merge or split there;
                // otherwise they do not touch at all. Neither is a crossing, so
                // leave such segments out.
                const lines = linkLines[i];
                const collinear = lines.map((line) => thisLine.isCollinear(line));
                let linkLinesToTest = lines.filter((_, index) => !collinear[index - 1] && !collinear[index + 1]);
                const jumpRule = jumpRules.get(link);
                if (jumpRule) {
                    const { priority, isAbove } = jumpRule;
                    linkLinesToTest = linkLinesToTest.filter((line) => drawsJump(thisLine, line, priority, isAbove));
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
