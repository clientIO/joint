import * as g from '../g/index.mjs';
import * as util from '../util/index.mjs';
import { orthogonal } from './orthogonal.mjs';

var config = {

    // size of the step to find a route (the grid of the manhattan pathfinder)
    step: 10,

    // the number of route finding loops that cause the router to abort
    // returns fallback route instead
    maximumLoops: 2000,

    // the number of decimal places to round floating point coordinates
    precision: 1,

    // maximum change of direction
    maxAllowedDirectionChange: 90,

    // should the router use perpendicular linkView option?
    // does not connect anchor of element but rather a point close-by that is orthogonal
    // this looks much better
    perpendicular: true,

    // should the source and/or target not be considered as obstacles?
    excludeEnds: [], // 'source', 'target'

    // should certain types of elements not be considered as obstacles?
    excludeTypes: [],

    // possible starting directions from an element
    startDirections: ['top', 'right', 'bottom', 'left'],

    // possible ending directions to an element
    endDirections: ['top', 'right', 'bottom', 'left'],

    // specify the directions used above and what they mean
    directionMap: {
        top: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        bottom: { x: 0, y: 1 },
        left: { x: -1, y: 0 }
    },

    // cost of an orthogonal step
    cost: function() {

        return this.step;
    },

    // an array of directions to find next points on the route
    // different from start/end directions
    directions: function() {

        var step = this.step;
        var cost = this.cost();

        return [
            { offsetX: step, offsetY: 0, cost: cost },
            { offsetX: -step, offsetY: 0, cost: cost },
            { offsetX: 0, offsetY: step, cost: cost },
            { offsetX: 0, offsetY: -step, cost: cost }
        ];
    },

    // a penalty received for direction change
    penalties: function() {

        return {
            0: 0,
            45: this.step / 2,
            90: this.step / 2
        };
    },

    // padding applied on the element bounding boxes
    paddingBox: function() {

        var step = this.step;

        return {
            x: -step,
            y: -step,
            width: 2 * step,
            height: 2 * step
        };
    },

    // A function that determines whether a given point is an obstacle or not.
    // If used, the `padding`, `excludeEnds`and `excludeTypes` options are ignored.
    // (point: dia.Point) => boolean;
    isPointObstacle: null,

    // a router to use when the manhattan router fails
    // (one of the partial routes returns null)
    fallbackRouter: function(vertices, opt, linkView) {

        if (!util.isFunction(orthogonal)) {
            throw new Error('Manhattan requires the orthogonal router as default fallback.');
        }

        return orthogonal(vertices, util.assign({}, config, opt), linkView);
    },

    /* Deprecated */
    // a simple route used in situations when main routing method fails
    // (exceed max number of loop iterations, inaccessible)
    fallbackRoute: function(from, to, opt) {

        return null; // null result will trigger the fallbackRouter

        // left for reference:
        /*// Find an orthogonal route ignoring obstacles.

        var point = ((opt.previousDirAngle || 0) % 180 === 0)
                ? new g.Point(from.x, to.y)
                : new g.Point(to.x, from.y);

        return [point];*/
    },

    // if a function is provided, it's used to route the link while dragging an end
    // i.e. function(from, to, opt) { return []; }
    draggingRoute: null
};

// HELPER CLASSES //

// Map of obstacles
// Helper structure to identify whether a point lies inside an obstacle.
function ObstacleMap(opt) {

    this.map = {};
    this.options = opt;
    // tells how to divide the paper when creating the elements map
    this.mapGridSize = 100;
}

ObstacleMap.prototype.build = function(graph, link) {

    var opt = this.options;

    // source or target element could be excluded from set of obstacles
    var excludedEnds = util.toArray(opt.excludeEnds).reduce(function(res, item) {

        var end = link.get(item);
        if (end) {
            var cell = graph.getCell(end.id);
            if (cell) {
                res.push(cell);
            }
        }

        return res;
    }, []);

    // Exclude any embedded elements from the source and the target element.
    var excludedAncestors = [];

    var source = graph.getCell(link.get('source').id);
    if (source) {
        excludedAncestors = util.union(excludedAncestors, source.getAncestors().map(function(cell) {
            return cell.id;
        }));
    }

    var target = graph.getCell(link.get('target').id);
    if (target) {
        excludedAncestors = util.union(excludedAncestors, target.getAncestors().map(function(cell) {
            return cell.id;
        }));
    }

    // Builds a map of all elements for quicker obstacle queries (i.e. is a point contained
    // in any obstacle?) (a simplified grid search).
    // The paper is divided into smaller cells, where each holds information about which
    // elements belong to it. When we query whether a point lies inside an obstacle we
    // don't need to go through all obstacles, we check only those in a particular cell.
    var mapGridSize = this.mapGridSize;

    graph.getElements().reduce(function(map, element) {

        var isExcludedType = util.toArray(opt.excludeTypes).includes(element.get('type'));
        var isExcludedEnd = excludedEnds.find(function(excluded) {
            return excluded.id === element.id;
        });
        var isExcludedAncestor = excludedAncestors.includes(element.id);

        var isExcluded = isExcludedType || isExcludedEnd || isExcludedAncestor;
        if (!isExcluded) {
            var bbox = element.getBBox().moveAndExpand(opt.paddingBox);

            var origin = bbox.origin().snapToGrid(mapGridSize);
            var corner = bbox.corner().snapToGrid(mapGridSize);

            for (var x = origin.x; x <= corner.x; x += mapGridSize) {
                for (var y = origin.y; y <= corner.y; y += mapGridSize) {
                    var gridKey = x + '@' + y;
                    map[gridKey] = map[gridKey] || [];
                    map[gridKey].push(bbox);
                }
            }
        }

        return map;
    }, this.map);

    return this;
};

ObstacleMap.prototype.isPointAccessible = function(point) {

    var mapKey = point.clone().snapToGrid(this.mapGridSize).toString();

    return util.toArray(this.map[mapKey]).every(function(obstacle) {
        return !obstacle.containsPoint(point);
    });
};

// Sorted Set
// Set of items sorted by given value.
function SortedSet() {
    this.items = [];
    this.hash = {};
    this.values = {};
    this.OPEN = 1;
    this.CLOSE = 2;
}

SortedSet.prototype.add = function(item, value) {

    if (this.hash[item]) {
        // item removal
        this.items.splice(this.items.indexOf(item), 1);
    } else {
        this.hash[item] = this.OPEN;
    }

    this.values[item] = value;

    var index = util.sortedIndex(this.items, item, function(i) {
        return this.values[i];
    }.bind(this));

    this.items.splice(index, 0, item);
};

SortedSet.prototype.remove = function(item) {

    this.hash[item] = this.CLOSE;
};

SortedSet.prototype.isOpen = function(item) {

    return this.hash[item] === this.OPEN;
};

SortedSet.prototype.isClose = function(item) {

    return this.hash[item] === this.CLOSE;
};

SortedSet.prototype.isEmpty = function() {

    return this.items.length === 0;
};

SortedSet.prototype.pop = function() {

    var item = this.items.shift();
    this.remove(item);
    return item;
};

// HELPERS //

// return source bbox
function getSourceBBox(linkView, opt) {

    // expand by padding box
    if (opt && opt.paddingBox) return linkView.sourceBBox.clone().moveAndExpand(opt.paddingBox);

    return linkView.sourceBBox.clone();
}

// return target bbox
function getTargetBBox(linkView, opt) {

    // expand by padding box
    if (opt && opt.paddingBox) return linkView.targetBBox.clone().moveAndExpand(opt.paddingBox);

    return linkView.targetBBox.clone();
}

// return source anchor
function getSourceAnchor(linkView, opt) {

    if (linkView.sourceAnchor) return linkView.sourceAnchor;

    // fallback: center of bbox
    var sourceBBox = getSourceBBox(linkView, opt);
    return sourceBBox.center();
}

// return target anchor
function getTargetAnchor(linkView, opt) {

    if (linkView.targetAnchor) return linkView.targetAnchor;

    // fallback: center of bbox
    var targetBBox = getTargetBBox(linkView, opt);
    return targetBBox.center(); // default
}

// returns a direction index from start point to end point
// corrects for grid deformation between start and end
function getDirectionAngle(start, end, numDirections, grid, opt) {

    var quadrant = 360 / numDirections;
    var angleTheta = start.theta(fixAngleEnd(start, end, grid, opt));
    var normalizedAngle = g.normalizeAngle(angleTheta + (quadrant / 2));
    return quadrant * Math.floor(normalizedAngle / quadrant);
}

// helper function for getDirectionAngle()
// corrects for grid deformation
// (if a point is one grid steps away from another in both dimensions,
// it is considered to be 45 degrees away, even if the real angle is different)
// this causes visible angle discrepancies if `opt.step` is much larger than `paper.gridSize`
function fixAngleEnd(start, end, grid, opt) {

    var step = opt.step;

    var diffX = end.x - start.x;
    var diffY = end.y - start.y;

    var gridStepsX = diffX / grid.x;
    var gridStepsY = diffY / grid.y;

    var distanceX = gridStepsX * step;
    var distanceY = gridStepsY * step;

    return new g.Point(start.x + distanceX, start.y + distanceY);
}

// return the change in direction between two direction angles
function getDirectionChange(angle1, angle2) {

    var directionChange = Math.abs(angle1 - angle2);
    return (directionChange > 180) ? (360 - directionChange) : directionChange;
}

// fix direction offsets according to current grid
function getGridOffsets(directions, grid, opt) {

    var step = opt.step;

    util.toArray(opt.directions).forEach(function(direction) {

        direction.gridOffsetX = (direction.offsetX / step) * grid.x;
        direction.gridOffsetY = (direction.offsetY / step) * grid.y;
    });
}

// get grid size in x and y dimensions, adapted to source and target positions
function getGrid(step, source, target) {

    return {
        source: source.clone(),
        x: getGridDimension(target.x - source.x, step),
        y: getGridDimension(target.y - source.y, step)
    };
}

// helper function for getGrid()
function getGridDimension(diff, step) {

    // return step if diff = 0
    if (!diff) return step;

    var absDiff = Math.abs(diff);
    var numSteps = Math.round(absDiff / step);

    // return absDiff if less than one step apart
    if (!numSteps) return absDiff;

    // otherwise, return corrected step
    var roundedDiff = numSteps * step;
    var remainder = absDiff - roundedDiff;
    var stepCorrection = remainder / numSteps;

    return step + stepCorrection;
}

// return a clone of point snapped to grid
function snapToGrid(point, grid) {

    var source = grid.source;

    var snappedX = g.snapToGrid(point.x - source.x, grid.x) + source.x;
    var snappedY = g.snapToGrid(point.y - source.y, grid.y) + source.y;

    return new g.Point(snappedX, snappedY);
}

// round the point to opt.precision
function round(point, precision) {

    return point.round(precision);
}

// snap to grid and then round the point
function align(point, grid, precision) {

    return round(snapToGrid(point.clone(), grid), precision);
}

// return a string representing the point
// string is rounded in both dimensions
function getKey(point) {

    return point.clone().toString();
}

// return a normalized vector from given point
// used to determine the direction of a difference of two points
function normalizePoint(point) {

    return new g.Point(
        point.x === 0 ? 0 : Math.abs(point.x) / point.x,
        point.y === 0 ? 0 : Math.abs(point.y) / point.y
    );
}

// PATHFINDING //

// reconstructs a route by concatenating points with their parents
function reconstructRoute(parents, points, tailPoint, from, to, grid, opt) {

    var route = [];

    var prevDiff = normalizePoint(to.difference(tailPoint));

    // tailPoint is assumed to be aligned already
    var currentKey = getKey(tailPoint);
    var parent = parents[currentKey];

    var point;
    while (parent) {

        // point is assumed to be aligned already
        point = points[currentKey];

        var diff = normalizePoint(point.difference(parent));
        if (!diff.equals(prevDiff)) {
            route.unshift(point);
            prevDiff = diff;
        }

        // parent is assumed to be aligned already
        currentKey = getKey(parent);
        parent = parents[currentKey];
    }

    // leadPoint is assumed to be aligned already
    var leadPoint = points[currentKey];

    var fromDiff = normalizePoint(leadPoint.difference(from));
    if (!fromDiff.equals(prevDiff)) {
        route.unshift(leadPoint);
    }

    return route;
}

// heuristic method to determine the distance between two points
function estimateCost(from, endPoints) {

    var min = Infinity;

    for (var i = 0, len = endPoints.length; i < len; i++) {
        var cost = from.manhattanDistance(endPoints[i]);
        if (cost < min) min = cost;
    }

    return min;
}

// find points around the bbox taking given directions into account
// lines are drawn from anchor in given directions, intersections recorded
// if anchor is outside bbox, only those directions that intersect get a rect point
// the anchor itself is returned as rect point (representing some directions)
// (since those directions are unobstructed by the bbox)
function getRectPoints(anchor, bbox, directionList, grid, opt) {

    var precision = opt.precision;
    var directionMap = opt.directionMap;

    var anchorCenterVector = anchor.difference(bbox.center());

    var keys = util.isObject(directionMap) ? Object.keys(directionMap) : [];
    var dirList = util.toArray(directionList);
    var rectPoints = keys.reduce(function(res, key) {

        if (dirList.includes(key)) {
            var direction = directionMap[key];

            // create a line that is guaranteed to intersect the bbox if bbox is in the direction
            // even if anchor lies outside of bbox
            var endpoint = new g.Point(
                anchor.x + direction.x * (Math.abs(anchorCenterVector.x) + bbox.width),
                anchor.y + direction.y * (Math.abs(anchorCenterVector.y) + bbox.height)
            );
            var intersectionLine = new g.Line(anchor, endpoint);

            // get the farther intersection, in case there are two
            // (that happens if anchor lies next to bbox)
            var intersections = intersectionLine.intersect(bbox) || [];
            var numIntersections = intersections.length;
            var farthestIntersectionDistance;
            var farthestIntersection = null;
            for (var i = 0; i < numIntersections; i++) {
                var currentIntersection = intersections[i];
                var distance = anchor.squaredDistance(currentIntersection);
                if ((farthestIntersectionDistance === undefined) || (distance > farthestIntersectionDistance)) {
                    farthestIntersectionDistance = distance;
                    farthestIntersection = currentIntersection;
                }
            }

            // if an intersection was found in this direction, it is our rectPoint
            if (farthestIntersection) {
                var point = align(farthestIntersection, grid, precision);

                // if the rectPoint lies inside the bbox, offset it by one more step
                if (bbox.containsPoint(point)) {
                    point = align(point.offset(direction.x * grid.x, direction.y * grid.y), grid, precision);
                }

                // then add the point to the result array
                // aligned
                res.push(point);
            }
        }

        return res;
    }, []);

    // if anchor lies outside of bbox, add it to the array of points
    if (!bbox.containsPoint(anchor)) {
        // aligned
        rectPoints.push(align(anchor, grid, precision));
    }

    return rectPoints;
}

// finds the route between two points/rectangles (`from`, `to`) implementing A* algorithm
// rectangles get rect points assigned by getRectPoints()
function findRoute(from, to, isPointObstacle, opt) {

    var precision = opt.precision;

    // Get grid for this route.

    var sourceAnchor, targetAnchor;

    if (from instanceof g.Rect) { // `from` is sourceBBox
        sourceAnchor = round(getSourceAnchor(this, opt).clone(), precision);
    } else {
        sourceAnchor = round(from.clone(), precision);
    }

    if (to instanceof g.Rect) { // `to` is targetBBox
        targetAnchor = round(getTargetAnchor(this, opt).clone(), precision);
    } else {
        targetAnchor = round(to.clone(), precision);
    }

    var grid = getGrid(opt.step, sourceAnchor, targetAnchor);

    // Get pathfinding points.

    var start, end; // aligned with grid by definition
    var startPoints, endPoints; // assumed to be aligned with grid already

    // set of points we start pathfinding from
    if (from instanceof g.Rect) { // `from` is sourceBBox
        start = sourceAnchor;
        startPoints = getRectPoints(start, from, opt.startDirections, grid, opt);

    } else {
        start = sourceAnchor;
        startPoints = [start];
    }

    // set of points we want the pathfinding to finish at
    if (to instanceof g.Rect) { // `to` is targetBBox
        end = targetAnchor;
        endPoints = getRectPoints(targetAnchor, to, opt.endDirections, grid, opt);

    } else {
        end = targetAnchor;
        endPoints = [end];
    }

    // take into account only accessible rect points (those not under obstacles)
    startPoints = startPoints.filter(p => !isPointObstacle(p));
    endPoints = endPoints.filter(p => !isPointObstacle(p));

    // Check that there is an accessible route point on both sides.
    // Otherwise, use fallbackRoute().
    if (startPoints.length > 0 && endPoints.length > 0) {

        // The set of tentative points to be evaluated, initially containing the start points.
        // Rounded to nearest integer for simplicity.
        var openSet = new SortedSet();
        // Keeps reference to actual points for given elements of the open set.
        var points = {};
        // Keeps reference to a point that is immediate predecessor of given element.
        var parents = {};
        // Cost from start to a point along best known path.
        var costs = {};

        for (var i = 0, n = startPoints.length; i < n; i++) {
            // startPoint is assumed to be aligned already
            var startPoint = startPoints[i];

            var key = getKey(startPoint);

            openSet.add(key, estimateCost(startPoint, endPoints));
            points[key] = startPoint;
            costs[key] = 0;
        }

        var previousRouteDirectionAngle = opt.previousDirectionAngle; // undefined for first route
        var isPathBeginning = (previousRouteDirectionAngle === undefined);

        // directions
        var direction, directionChange;
        var directions = opt.directions;
        getGridOffsets(directions, grid, opt);

        var numDirections = directions.length;

        var endPointsKeys = util.toArray(endPoints).reduce(function(res, endPoint) {
            // endPoint is assumed to be aligned already

            var key = getKey(endPoint);
            res.push(key);
            return res;
        }, []);

        // main route finding loop
        var loopsRemaining = opt.maximumLoops;
        while (!openSet.isEmpty() && loopsRemaining > 0) {

            // remove current from the open list
            var currentKey = openSet.pop();
            var currentPoint = points[currentKey];
            var currentParent = parents[currentKey];
            var currentCost = costs[currentKey];

            var isRouteBeginning = (currentParent === undefined); // undefined for route starts
            var isStart = currentPoint.equals(start); // (is source anchor or `from` point) = can leave in any direction

            var previousDirectionAngle;
            if (!isRouteBeginning) previousDirectionAngle = getDirectionAngle(currentParent, currentPoint, numDirections, grid, opt); // a vertex on the route
            else if (!isPathBeginning) previousDirectionAngle = previousRouteDirectionAngle; // beginning of route on the path
            else if (!isStart) previousDirectionAngle = getDirectionAngle(start, currentPoint, numDirections, grid, opt); // beginning of path, start rect point
            else previousDirectionAngle = null; // beginning of path, source anchor or `from` point

            // check if we reached any endpoint
            var samePoints = startPoints.length === endPoints.length;
            if (samePoints) {
                for (var j = 0; j < startPoints.length; j++) {
                    if (!startPoints[j].equals(endPoints[j])) {
                        samePoints = false;
                        break;
                    }
                }
            }
            var skipEndCheck = (isRouteBeginning && samePoints);
            if (!skipEndCheck && (endPointsKeys.indexOf(currentKey) >= 0)) {
                opt.previousDirectionAngle = previousDirectionAngle;
                return reconstructRoute(parents, points, currentPoint, start, end, grid, opt);
            }

            // go over all possible directions and find neighbors
            for (i = 0; i < numDirections; i++) {
                direction = directions[i];

                var directionAngle = direction.angle;
                directionChange = getDirectionChange(previousDirectionAngle, directionAngle);

                // if the direction changed rapidly, don't use this point
                // any direction is allowed for starting points
                if (!(isPathBeginning && isStart) && directionChange > opt.maxAllowedDirectionChange) continue;

                var neighborPoint = align(currentPoint.clone().offset(direction.gridOffsetX, direction.gridOffsetY), grid, precision);
                var neighborKey = getKey(neighborPoint);

                // Closed points from the openSet were already evaluated.
                if (openSet.isClose(neighborKey) || isPointObstacle(neighborPoint)) continue;

                // We can only enter end points at an acceptable angle.
                if (endPointsKeys.indexOf(neighborKey) >= 0) { // neighbor is an end point

                    var isNeighborEnd = neighborPoint.equals(end); // (is target anchor or `to` point) = can be entered in any direction

                    if (!isNeighborEnd) {
                        var endDirectionAngle = getDirectionAngle(neighborPoint, end, numDirections, grid, opt);
                        var endDirectionChange = getDirectionChange(directionAngle, endDirectionAngle);

                        if (endDirectionChange > opt.maxAllowedDirectionChange) continue;
                    }
                }

                // The current direction is ok.

                var neighborCost = direction.cost;
                var neighborPenalty = isStart ? 0 : opt.penalties[directionChange]; // no penalties for start point
                var costFromStart = currentCost + neighborCost + neighborPenalty;

                if (!openSet.isOpen(neighborKey) || (costFromStart < costs[neighborKey])) {
                    // neighbor point has not been processed yet
                    // or the cost of the path from start is lower than previously calculated

                    points[neighborKey] = neighborPoint;
                    parents[neighborKey] = currentPoint;
                    costs[neighborKey] = costFromStart;
                    openSet.add(neighborKey, costFromStart + estimateCost(neighborPoint, endPoints));
                }
            }

            loopsRemaining--;
        }
    }

    // no route found (`to` point either wasn't accessible or finding route took
    // way too much calculation)
    return opt.fallbackRoute.call(this, start, end, opt);
}

// resolve some of the options
function resolveOptions(opt) {

    opt.directions = util.result(opt, 'directions');
    opt.penalties = util.result(opt, 'penalties');
    opt.paddingBox = util.result(opt, 'paddingBox');
    opt.padding = util.result(opt, 'padding');

    if (opt.padding) {
        // if both provided, opt.padding wins over opt.paddingBox
        var sides = util.normalizeSides(opt.padding);
        opt.paddingBox = {
            x: -sides.left,
            y: -sides.top,
            width: sides.left + sides.right,
            height: sides.top + sides.bottom
        };
    }

    util.toArray(opt.directions).forEach(function(direction) {

        var point1 = new g.Point(0, 0);
        var point2 = new g.Point(direction.offsetX, direction.offsetY);

        direction.angle = g.normalizeAngle(point1.theta(point2));
    });
}

// initialization of the route finding
function router(vertices, opt, linkView) {

    resolveOptions(opt);

    // enable/disable linkView perpendicular option
    linkView.options.perpendicular = !!opt.perpendicular;

    var sourceBBox = getSourceBBox(linkView, opt);
    var targetBBox = getTargetBBox(linkView, opt);

    var sourceAnchor = getSourceAnchor(linkView, opt);
    //var targetAnchor = getTargetAnchor(linkView, opt);

    // pathfinding
    let isPointObstacle;
    if (typeof opt.isPointObstacle === 'function') {
        isPointObstacle = opt.isPointObstacle;
    } else {
        const map = new ObstacleMap(opt);
        map.build(linkView.paper.model, linkView.model);
        isPointObstacle = (point) => !map.isPointAccessible(point);
    }

    var oldVertices = util.toArray(vertices).map(g.Point);
    var newVertices = [];
    var tailPoint = sourceAnchor; // the origin of first route's grid, does not need snapping

    // find a route by concatenating all partial routes (routes need to pass through vertices)
    // source -> vertex[1] -> ... -> vertex[n] -> target
    var to, from;

    for (var i = 0, len = oldVertices.length; i <= len; i++) {

        var partialRoute = null;

        from = to || sourceBBox;
        to = oldVertices[i];

        if (!to) {
            // this is the last iteration
            // we ran through all vertices in oldVertices
            // 'to' is not a vertex.

            to = targetBBox;

            // If the target is a point (i.e. it's not an element), we
            // should use dragging route instead of main routing method if it has been provided.
            var isEndingAtPoint = !linkView.model.get('source').id || !linkView.model.get('target').id;

            if (isEndingAtPoint && util.isFunction(opt.draggingRoute)) {
                // Make sure we are passing points only (not rects).
                var dragFrom = (from === sourceBBox) ? sourceAnchor : from;
                var dragTo = to.origin();

                partialRoute = opt.draggingRoute.call(linkView, dragFrom, dragTo, opt);
            }
        }

        // if partial route has not been calculated yet use the main routing method to find one
        partialRoute = partialRoute || findRoute.call(linkView, from, to, isPointObstacle, opt);

        if (partialRoute === null) { // the partial route cannot be found
            return opt.fallbackRouter(vertices, opt, linkView);
        }

        var leadPoint = partialRoute[0];

        // remove the first point if the previous partial route had the same point as last
        if (leadPoint && leadPoint.equals(tailPoint)) partialRoute.shift();

        // save tailPoint for next iteration
        tailPoint = partialRoute[partialRoute.length - 1] || tailPoint;

        Array.prototype.push.apply(newVertices, partialRoute);
    }

    return newVertices;
}

// public function
export const manhattan = function(vertices, opt, linkView) {
    return router(vertices, util.assign({}, config, opt), linkView);
};
