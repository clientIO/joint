joint.routers.manhattan = (function(g, _, joint, util) {

    'use strict';

    var config = {

        // size of the step to find a route
        step: 10,

        // use of the perpendicular linkView option to connect center of element with first vertex
        perpendicular: true,

        // should be source or target not to be consider as an obstacle
        excludeEnds: [], // 'source', 'target'

        // should be any element with a certain type not to be consider as an obstacle
        excludeTypes: ['basic.Text'],

        // if number of route finding loops exceed the maximum, stops searching and returns
        // fallback route
        maximumLoops: 2000,

        // possible starting directions from an element
        startDirections: ['left', 'right', 'top', 'bottom'],

        // possible ending directions to an element
        endDirections: ['left', 'right', 'top', 'bottom'],

        // specify directions above
        directionMap: {
            right: { x: 1, y: 0 },
            bottom: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            top: { x: 0, y: -1 }
        },

        // maximum change of the direction
        maxAllowedDirectionChange: 90,

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

        // an array of directions to find next points on the route
        directions: function() {

            var step = this.step;

            return [
                { offsetX: step  , offsetY: 0     , cost: step },
                { offsetX: 0     , offsetY: step  , cost: step },
                { offsetX: -step , offsetY: 0     , cost: step },
                { offsetX: 0     , offsetY: -step , cost: step }
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

        // * Deprecated *
        // a simple route used in situations, when main routing method fails
        // (exceed loops, inaccessible).
        /* i.e.
          function(from, to, opts) {
            // Find an orthogonal route ignoring obstacles.
            var point = ((opts.previousDirAngle || 0) % 180 === 0)
                    ? g.point(from.x, to.y)
                    : g.point(to.x, from.y);
            return [point, to];
          },
        */
        fallbackRoute: function() {
            return null;
        },

        // if a function is provided, it's used to route the link while dragging an end
        // i.e. function(from, to, opts) { return []; }
        draggingRoute: null
    };

    // Map of obstacles
    // Helper structure to identify whether a point lies in an obstacle.
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

        // builds a map of all elements for quicker obstacle queries (i.e. is a point contained
        // in any obstacle?) (a simplified grid search)
        // The paper is divided to smaller cells, where each of them holds an information which
        // elements belong to it. When we query whether a point is in an obstacle we don't need
        // to go through all obstacles, we check only those in a particular cell.
        var mapGridSize = this.mapGridSize;

        graph.getElements().reduce(function(map, element) {

            var isExcludedType = util.toArray(opt.excludeTypes).includes(element.get('type'));
            var isExcludedEnd = excludedEnds.find(function(excluded) { return excluded.id === element.id });
            var isExcludedAncestor = excludedAncestors.includes(element.id);

            var isExcluded = isExcludedType || isExcludedEnd || isExcludedAncestor;
            if (!isExcluded) {
                var bBox = element.getBBox().moveAndExpand(opt.paddingBox);

                var origin = bBox.origin().snapToGrid(mapGridSize);
                var corner = bBox.corner().snapToGrid(mapGridSize);

                for (var x = origin.x; x <= corner.x; x += mapGridSize) {
                    for (var y = origin.y; y <= corner.y; y += mapGridSize) {
                        var gridKey = x + '@' + y;
                        map[gridKey] = map[gridKey] || [];
                        map[gridKey].push(bBox);
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
        return g.point(
            point.x === 0 ? 0 : Math.abs(point.x) / point.x,
            point.y === 0 ? 0 : Math.abs(point.y) / point.y
        );
    }

    // reconstructs a route by concating points with their parents
    function reconstructRoute(parents, point, startCenter, endCenter) {

        var route = [];
        var prevDiff = normalizePoint(endCenter.difference(point));
        var current = point;
        var parent;

        while ((parent = parents[current])) {

            var diff = normalizePoint(current.difference(parent));

            if (!diff.equals(prevDiff)) {

                route.unshift(current);
                prevDiff = diff;
            }

            current = parent;
        }

        var startDiff = normalizePoint(g.point(current).difference(startCenter));
        if (!startDiff.equals(prevDiff)) {
            route.unshift(current);
        }

        return route;
    }

    // find points around the rectangle taking given directions in the account
    function getRectPoints(bbox, directionList, opt) {

        var step = opt.step;
        var center = bbox.center();
        var keys = util.isObject(opt.directionMap) ? Object.keys(opt.directionMap) : [];
        var dirLis = util.toArray(directionList);
        return keys.reduce(function(res, key) {

            if (dirLis.includes(key)) {

                var direction = opt.directionMap[key];

                var x = direction.x * bbox.width / 2;
                var y = direction.y * bbox.height / 2;

                var point = center.clone().offset(x, y);

                if (bbox.containsPoint(point)) {

                    point.offset(direction.x * step, direction.y * step);
                }

                res.push(point.snapToGrid(step));
            }
            return res;

        }, []);
    }

    // returns a direction index from start point to end point
    function getDirectionAngle(start, end, dirLen) {

        var q = 360 / dirLen;
        return Math.floor(g.normalizeAngle(start.theta(end) + q / 2) / q) * q;
    }

    function getDirectionChange(angle1, angle2) {

        var dirChange = Math.abs(angle1 - angle2);
        return dirChange > 180 ? 360 - dirChange : dirChange;
    }

    // heurestic method to determine the distance between two points
    function estimateCost(from, endPoints) {

        var min = Infinity;

        for (var i = 0, len = endPoints.length; i < len; i++) {
            var cost = from.manhattanDistance(endPoints[i]);
            if (cost < min) min = cost;
        }

        return min;
    }

    // finds the route between to points/rectangles implementing A* alghoritm
    function findRoute(start, end, map, opt) {

        var step = opt.step;
        var startPoints, endPoints;
        var startCenter, endCenter;

        // set of points we start pathfinding from
        if (start instanceof g.rect) {
            startPoints = getRectPoints(start, opt.startDirections, opt);
            startCenter = start.center().snapToGrid(step);
        } else {
            startCenter = start.clone().snapToGrid(step);
            startPoints = [startCenter];
        }

        // set of points we want the pathfinding to finish at
        if (end instanceof g.rect) {
            endPoints = getRectPoints(end, opt.endDirections, opt);
            endCenter = end.center().snapToGrid(step);
        } else {
            endCenter = end.clone().snapToGrid(step);
            endPoints = [endCenter];
        }

        // take into account only accessible end points
        startPoints = startPoints.filter(map.isPointAccessible, map);
        endPoints = endPoints.filter(map.isPointAccessible, map);

        // Check if there is a accessible end point.
        // We would have to use a fallback route otherwise.
        if (startPoints.length > 0 && endPoints.length >  0) {

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

            // directions
            var dir, dirChange;
            var dirs = opt.directions;
            var dirLen = dirs.length;
            var loopsRemain = opt.maximumLoops;
            var endPointsKeys = util.invoke(endPoints, 'toString');

            // main route finding loop
            while (!openSet.isEmpty() && loopsRemain > 0) {

                // remove current from the open list
                var currentKey = openSet.pop();
                var currentPoint = g.point(currentKey);
                var currentDist = costs[currentKey];
                var previousDirAngle = currentDirAngle;
                var currentDirAngle = parents[currentKey]
                    ? getDirectionAngle(parents[currentKey], currentPoint, dirLen)
                    : opt.previousDirAngle != null ? opt.previousDirAngle : getDirectionAngle(startCenter, currentPoint, dirLen);

                // Check if we reached any endpoint
                if (endPointsKeys.indexOf(currentKey) >= 0) {
                    // We don't want to allow route to enter the end point in opposite direction.
                    dirChange = getDirectionChange(currentDirAngle, getDirectionAngle(currentPoint, endCenter, dirLen));
                    if (currentPoint.equals(endCenter) || dirChange < 180) {
                        opt.previousDirAngle = currentDirAngle;
                        return reconstructRoute(parents, currentPoint, startCenter, endCenter);
                    }
                }

                // Go over all possible directions and find neighbors.
                for (i = 0; i < dirLen; i++) {

                    dir = dirs[i];
                    dirChange = getDirectionChange(currentDirAngle, dir.angle);
                    // if the direction changed rapidly don't use this point
                    // Note that check is relevant only for points with previousDirAngle i.e.
                    // any direction is allowed for starting points
                    if (previousDirAngle && dirChange > opt.maxAllowedDirectionChange) {
                        continue;
                    }

                    var neighborPoint = currentPoint.clone().offset(dir.offsetX, dir.offsetY);
                    var neighborKey = neighborPoint.toString();
                    // Closed points from the openSet were already evaluated.
                    if (openSet.isClose(neighborKey) || !map.isPointAccessible(neighborPoint)) {
                        continue;
                    }

                    // The current direction is ok to proccess.
                    var costFromStart = currentDist + dir.cost + opt.penalties[dirChange];

                    if (!openSet.isOpen(neighborKey) || costFromStart < costs[neighborKey]) {
                        // neighbor point has not been processed yet or the cost of the path
                        // from start is lesser than previously calcluated.
                        parents[neighborKey] = currentPoint;
                        costs[neighborKey] = costFromStart;
                        openSet.add(neighborKey, costFromStart + estimateCost(neighborPoint, endPoints));
                    }
                }

                loopsRemain--;
            }
        }

        // no route found ('to' point wasn't either accessible or finding route took
        // way to much calculations)
        return opt.fallbackRoute(startCenter, endCenter, opt);
    }

    // resolve some of the options
    function resolveOptions(opt) {

        opt.directions = util.result(opt, 'directions');
        opt.penalties = util.result(opt, 'penalties');
        opt.paddingBox = util.result(opt, 'paddingBox');

        util.toArray(opt.directions).forEach(function(direction) {

            var point1 = g.point(0, 0);
            var point2 = g.point(direction.offsetX, direction.offsetY);

            direction.angle = g.normalizeAngle(point1.theta(point2));
        });
    }

    // initiation of the route finding
    function router(vertices, opt) {

        resolveOptions(opt);

        // enable/disable linkView perpendicular option
        this.options.perpendicular = !!opt.perpendicular;

        // expand boxes by specific padding
        var sourceBBox = g.rect(this.sourceBBox).moveAndExpand(opt.paddingBox);
        var targetBBox = g.rect(this.targetBBox).moveAndExpand(opt.paddingBox);

        // pathfinding
        var map = (new ObstacleMap(opt)).build(this.paper.model, this.model);
        var oldVertices = util.toArray(vertices).map(g.point);
        var newVertices = [];
        var tailPoint = sourceBBox.center().snapToGrid(opt.step);

        // find a route by concating all partial routes (routes need to go through the vertices)
        // startElement -> vertex[1] -> ... -> vertex[n] -> endElement
        for (var i = 0, len = oldVertices.length; i <= len; i++) {

            var partialRoute = null;

            var from = to || sourceBBox;
            var to = oldVertices[i];

            if (!to) {

                to = targetBBox;

                // 'to' is not a vertex. If the target is a point (i.e. it's not an element), we
                // might use dragging route instead of main routing method if that is enabled.
                var endingAtPoint = !this.model.get('source').id || !this.model.get('target').id;

                if (endingAtPoint && util.isFunction(opt.draggingRoute)) {
                    // Make sure we passing points only (not rects).
                    var dragFrom = from instanceof g.rect ? from.center() : from;
                    partialRoute = opt.draggingRoute(dragFrom, to.origin(), opt);
                }
            }

            // if partial route has not been calculated yet use the main routing method to find one
            partialRoute = partialRoute || findRoute(from, to, map, opt);

            if (partialRoute === null) {
                // The partial route could not be found.
                // use orthogonal (do not avoid elements) route instead.
                if (!util.isFunction(joint.routers.orthogonal)) {
                    throw new Error('Manhattan requires the orthogonal router.');
                }
                return joint.routers.orthogonal(vertices, opt, this);
            }

            var leadPoint = partialRoute[0];

            if (leadPoint && leadPoint.equals(tailPoint)) {
                // remove the first point if the previous partial route had the same point as last
                partialRoute.shift();
            }

            tailPoint = partialRoute[partialRoute.length - 1] || tailPoint;

            Array.prototype.push.apply(newVertices, partialRoute);
        }

        return newVertices;
    }

    // public function
    return function(vertices, opt, linkView) {

        return router.call(linkView, vertices, util.assign({}, config, opt));
    };

})(g, _, joint, joint.util);
