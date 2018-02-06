joint.routers.manhattan = (function(g, _, joint, util) {

    'use strict';

    var config = {

        // size of the step to find a route (the grid of the manhattan pathfinder)
        step: 10,

        // should the router use perpendicular linkView option?
        // does not connect anchor of element but rather a point close-by that is orthogonal
        // this looks much better
        perpendicular: true,

        // should the source and/or target not be considered as obstacles?
        excludeEnds: [], // 'source', 'target'

        // should certain types of elements not be considered as obstacles?
        excludeTypes: ['basic.Text'],

        // the number of route finding loops that cause the router to abort
        // returns fallback route instead
        maximumLoops: 2000,

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

        // maximum change of direction
        maxAllowedDirectionChange: 90,

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
                { offsetX: step  , offsetY: 0     , cost: cost },
                { offsetX: 0     , offsetY: step  , cost: cost },
                { offsetX: -step , offsetY: 0     , cost: cost },
                { offsetX: 0     , offsetY: -step , cost: cost }
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

        // a router to use when the manhattan router fails
        // (one of the partial routes returns null)
        fallbackRouter: function(vertices, opt, linkView) {

            if (!util.isFunction(joint.routers.orthogonal)) {
                throw new Error('Manhattan requires the orthogonal router as default fallback.');
            }

            return joint.routers.orthogonal(vertices, util.assign({}, config, opt), linkView);
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
            excludedAncestors = util.union(excludedAncestors, source.getAncestors().map(function(cell) { return cell.id }));
        }

        var target = graph.getCell(link.get('target').id);
        if (target) {
            excludedAncestors = util.union(excludedAncestors, target.getAncestors().map(function(cell) { return cell.id }));
        }

        // Builds a map of all elements for quicker obstacle queries (i.e. is a point contained
        // in any obstacle?) (a simplified grid search).
        // The paper is divided into smaller cells, where each holds information about which
        // elements belong to it. When we query whether a point lies inside an obstacle we
        // don't need to go through all obstacles, we check only those in a particular cell.
        var mapGridSize = this.mapGridSize;

        graph.getElements().reduce(function(map, element) {

            var isExcludedType = util.toArray(opt.excludeTypes).includes(element.get('type'));
            var isExcludedEnd = excludedEnds.find(function(excluded) { return excluded.id === element.id });
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

        return util.toArray(this.map[mapKey]).every( function(obstacle) {
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

        var index = joint.util.sortedIndex(this.items, item, function(i) {
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

        var item =  this.items.shift();
        this.remove(item);
        return item;
    };

    function normalizePoint(point) {

        return new g.Point(
            point.x === 0 ? 0 : Math.abs(point.x) / point.x,
            point.y === 0 ? 0 : Math.abs(point.y) / point.y
        );
    }

    // reconstructs a route by concatenating points with their parents
    function reconstructRoute(parents, tailPoint, from, to) {

        var route = [];

        var prevDiff = normalizePoint(to.difference(tailPoint)); // always (0,0)
        var current = tailPoint;

        var parent;
        while ((parent = parents[current])) {

            var diff = normalizePoint(current.difference(parent));

            if (!diff.equals(prevDiff)) {
                route.unshift(current);
                prevDiff = diff;
            }

            current = parent;
        }

        var fromDiff = normalizePoint(current.difference(from));
        if (!fromDiff.equals(prevDiff)) {
            route.unshift(current);
        }

        return route;
    }

    // find points around the rectangle taking given directions into account
    function getRectPoints(anchor, bbox, directionList, opt) {

        var step = opt.step;

        var snappedAnchor = anchor.clone().snapToGrid(step);
        var snappedCenter = bbox.center().snapToGrid(step);
        var anchorCenterVector = snappedAnchor.difference(snappedCenter);

        var keys = util.isObject(opt.directionMap) ? Object.keys(opt.directionMap) : [];
        var dirList = util.toArray(directionList);
        var rectPoints = keys.reduce(function(res, key) {

            if (dirList.includes(key)) {
                var direction = opt.directionMap[key];

                // create a line that is guaranteed to intersect the bbox if bbox is in the direction
                // even if anchor lies outside of bbox
                var endpoint = new g.Point(
                    snappedAnchor.x + direction.x * (Math.abs(anchorCenterVector.x) + bbox.width),
                    snappedAnchor.y + direction.y * (Math.abs(anchorCenterVector.y) + bbox.height)
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
                    var distance = snappedAnchor.squaredDistance(currentIntersection);
                    if (farthestIntersectionDistance === undefined || (distance > farthestIntersectionDistance)) {
                        farthestIntersectionDistance = distance;
                        farthestIntersection = currentIntersection.snapToGrid(step);
                    }
                }
                var point = farthestIntersection;

                // if an intersection was found in this direction, it is our rectPoint
                if (point) {
                    // if the rectPoint lies inside the bbox, offset it by one more step
                    if (bbox.containsPoint(point)) {
                        point.offset(direction.x * step, direction.y * step);
                    }

                    // then add the point to the result array
                    res.push(point);
                }
            }

            return res;
        }, []);

        // if anchor lies outside of bbox, add it to the array of points
        if (!bbox.containsPoint(snappedAnchor)) rectPoints.push(snappedAnchor.snapToGrid(step));

        return rectPoints;
    }

    // returns a direction index from start point to end point
    function getDirectionAngle(start, end, numDirections) {

        var quadrant = 360 / numDirections;
        return quadrant * Math.floor(g.normalizeAngle(start.theta(end) + (quadrant / 2)) / quadrant);
    }

    function getDirectionChange(angle1, angle2) {

        var directionChange = Math.abs(angle1 - angle2);
        return (directionChange > 180) ? (360 - directionChange) : directionChange;
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

    // finds the route between two points/rectangles implementing A* algorithm
    function findRoute(from, to, map, opt) {

        var step = opt.step;
        var maxAllowedDirectionChange = opt.maxAllowedDirectionChange;

        var startPoints, endPoints;
        var start, end;

        // set of points we start pathfinding from
        if (from instanceof g.Rect) { // `from` is sourceBBox
            var sourceAnchor = getSourceAnchor(this, opt).clone().snapToGrid(step);
            startPoints = getRectPoints(sourceAnchor, from, opt.startDirections, opt);
            start = sourceAnchor;

        } else {
            start = from.clone().snapToGrid(step);
            startPoints = [start];
        }

        // set of points we want the pathfinding to finish at
        if (to instanceof g.Rect) { // `to` is targetBBox
            var targetAnchor = getTargetAnchor(this, opt).clone().snapToGrid(step);
            endPoints = getRectPoints(targetAnchor, to, opt.endDirections, opt);
            end = targetAnchor;

        } else {
            end = to.clone().snapToGrid(step);
            endPoints = [end];
        }

        // take into account only accessible rect points (those not under obstacles)
        startPoints = startPoints.filter(map.isPointAccessible, map);
        endPoints = endPoints.filter(map.isPointAccessible, map);

        // Check that there is an accessible route point on both sides.
        // Otherwise, use fallbackRoute().
        if (startPoints.length > 0 && endPoints.length > 0) {

            // The set of tentative points to be evaluated, initially containing the start points.
            var openSet = new SortedSet();
            // Keeps reference to a point that is immediate predecessor of given element.
            var parents = {};
            // Cost from start to a point along best known path.
            var costs = {};

            for (var i = 0, n = startPoints.length; i < n; i++) {
                var point = startPoints[i];

                var key = point.toString();
                openSet.add(key, estimateCost(point, endPoints));
                costs[key] = 0;
            }

            var previousRouteDirectionAngle = opt.previousDirectionAngle; // undefined for first route
            var isPathBeginning = (previousRouteDirectionAngle === undefined);

            // directions
            var direction, directionChange;
            var directions = opt.directions;
            var numDirections = directions.length;

            var endPointsKeys = util.invoke(endPoints, 'toString');

            // main route finding loop
            var loopsRemaining = opt.maximumLoops;
            while (!openSet.isEmpty() && loopsRemaining > 0) {

                // remove current from the open list
                var currentKey = openSet.pop();
                var currentPoint = new g.Point(currentKey);
                var currentCost = costs[currentKey];
                var currentParent = parents[currentKey];

                var isRouteBeginning = (currentParent === undefined); // undefined for route starts
                var isStart = currentPoint.equals(start); // (is source anchor or `from` point) = can leave in any direction

                var previousDirectionAngle;
                if (!isRouteBeginning) previousDirectionAngle = getDirectionAngle(currentParent, currentPoint, numDirections); // a vertex on the route
                else if (!isPathBeginning) previousDirectionAngle = previousRouteDirectionAngle; // beginning of route on the path
                else if (!isStart) previousDirectionAngle = getDirectionAngle(start, currentPoint, numDirections); // beginning of path, start rect point
                else previousDirectionAngle = null; // beginning of path, source anchor or `from` point

                // check if we reached any endpoint
                if (endPointsKeys.indexOf(currentKey) >= 0) {
                    opt.previousDirectionAngle = previousDirectionAngle;
                    return reconstructRoute(parents, currentPoint, start, end);
                }

                // go over all possible directions and find neighbors
                for (i = 0; i < numDirections; i++) {
                    direction = directions[i];

                    var directionAngle = direction.angle;
                    directionChange = getDirectionChange(previousDirectionAngle, directionAngle);

                    // if the direction changed rapidly, don't use this point
                    // any direction is allowed for starting points
                    if (!(isPathBeginning && isStart) && directionChange > maxAllowedDirectionChange) continue;

                    var neighborPoint = currentPoint.clone().offset(direction.offsetX, direction.offsetY);
                    var neighborKey = neighborPoint.toString();

                    // Closed points from the openSet were already evaluated.
                    if (openSet.isClose(neighborKey) || !map.isPointAccessible(neighborPoint)) continue;

                    // We can only enter end points at an acceptable angle.
                    if (endPointsKeys.indexOf(neighborKey) >= 0) { // neighbor is an end point
                        var isNeighborEnd = neighborPoint.equals(end); // (is target anchor or `to` point) = can be entered in any direction

                        if (!isNeighborEnd) {
                            var endDirectionAngle = getDirectionAngle(neighborPoint, end, numDirections);
                            var endDirectionChange = getDirectionChange(directionAngle, endDirectionAngle);

                            if (endDirectionChange > maxAllowedDirectionChange) continue;
                        }
                    }

                    // The current direction is ok.

                    var neighborCost = direction.cost;
                    var neighborPenalty = isStart ? 0 : opt.penalties[directionChange]; // no penalties for start point
                    var costFromStart = currentCost + neighborCost + neighborPenalty;

                    if (!openSet.isOpen(neighborKey) || (costFromStart < costs[neighborKey])) {
                        // neighbor point has not been processed yet
                        // or the cost of the path from start is lower than previously calculated

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
        var map = (new ObstacleMap(opt)).build(linkView.paper.model, linkView.model);
        var oldVertices = util.toArray(vertices).map(g.Point);
        var newVertices = [];
        var tailPoint = sourceAnchor.clone().snapToGrid(opt.step);

        // find a route by concatenating all partial routes (routes need to pass through vertices)
        // source -> vertex[1] -> ... -> vertex[n] -> target
        for (var i = 0, len = oldVertices.length; i <= len; i++) {

            var partialRoute = null;

            var from = to || sourceBBox;
            var to = oldVertices[i];

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
            partialRoute = partialRoute || findRoute.call(linkView, from, to, map, opt);

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
    return function(vertices, opt, linkView) {

        return router(vertices, util.assign({}, config, opt), linkView);
    };

})(g, _, joint, joint.util);
