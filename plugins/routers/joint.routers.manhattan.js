joint.routers.manhattan = (function() {

    'use strict';

    var config = {

        // size of the step to find a route
        step: 10,

        // use of the perpendicular linkView option to connect center of element with first vertex
        perpendicular: true,

        // tells how to divide the paper when creating the elements map
        mapGridSize: 100,

        // should be source or target not to be consider as an obstacle
        excludeEnds: [], // 'source', 'target'

        // should be any element with a certain type not to be consider as an obstacle
        excludeTypes: ['basic.Text'],

        // if number of route finding loops exceed the maximum, stops searching and returns
        // fallback route
        maximumLoops: 500,

        // possible starting directions from an element
        startDirections: ['left','right','top','bottom'],

        // possible ending directions to an element
        endDirections: ['left','right','top','bottom'],

        // specify directions above
        directionMap: {
            right: { x: 1, y: 0 },
            bottom: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            top: { x: 0, y: -1 }
        },

        // maximum change of the direction
        maxAllowedDirectionChange: 1,

        // padding applied on the element bounding boxes
        paddingBox: function() {

            var step = this.step;

            return {
                x: -step,
                y: -step,
                width: 2*step,
                height: 2*step
            }
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

            return [0, this.step / 2, this.step];
        },

        // heurestic method to determine the distance between two points
        estimateCost: function(from, to) {

            return from.manhattanDistance(to);
        },

        // a simple route used in situations, when main routing method fails
        // (exceed loops, inaccessible).
        fallbackRoute: function(from, to, opts) {

            // Find an orthogonal route ignoring obstacles.

            var prevDirIndexes = opts.prevDirIndexes || {};

            var point = (prevDirIndexes[from] || 0) % 2
                    ? g.point(from.x, to.y)
                    : g.point(to.x, from.y);

            return [point, to];
        },

        // if a function is provided, it's used to route the link while dragging an end
        // i.e. function(from, to, opts) { return []; }
        draggingRoute: null
    };

    // reconstructs a route by concating points with their parents
    function reconstructRoute(parents, point) {

        var route = [];
        var prevDiff = { x: 0, y: 0 };
        var current = point;
        var parent;

        while ((parent = parents[current])) {

            var diff = parent.difference(current);

            if (!diff.equals(prevDiff)) {

                route.unshift(current);
                prevDiff = diff;
            }

            current = parent;
        }

        route.unshift(current);

        return route;
    };

    // find points around the rectangle taking given directions in the account
    function getRectPoints(bbox, directionList, opts) {

        var step = opts.step;

        var center = bbox.center();

        var startPoints = _.chain(opts.directionMap).pick(directionList).map(function(direction) {

            var x = direction.x * bbox.width / 2;
            var y = direction.y * bbox.height / 2;

            var point = g.point(center).offset(x,y).snapToGrid(step);

            if (bbox.containsPoint(point)) {

                point.offset(direction.x * step, direction.y * step);
            }

            return point;

        }).value();

        return startPoints;
    };

    // returns a direction index from start point to end point
    function getDirection(start, end, dirLen) {

        var dirAngle = 360 / dirLen;

        var q = Math.floor(start.theta(end) / dirAngle);

        return dirLen - q;
    }

    // finds the route between to points/rectangles implementing A* alghoritm
    function findRoute(start, end, map, opt) {

        var startDirections = opt.reversed ? opt.endDirections : opt.startDirections;
        var endDirections = opt.reversed ? opt.startDirections : opt.endDirections;

        // set of points we start pathfinding from
        var startSet = start instanceof g.rect
                ? getRectPoints(start, startDirections, opt)
                : [start];

        // set of points we want the pathfinding to finish at
        var endSet = end instanceof g.rect
                ? getRectPoints(end, endDirections, opt)
                : [end];

        var startCenter = startSet.length > 1 ? start.center() : startSet[0];
        var endCenter = endSet.length > 1 ? end.center() : endSet[0];

        // take into account  only accessible end points
        var endPoints = _.filter(endSet, function(point) {

            var mapKey = g.point(point).snapToGrid(opt.mapGridSize).toString();

            var accesible = _.every(map[mapKey], function(obstacle) {
                return !obstacle.containsPoint(point);
            });

            return accesible;
        });


        if (endPoints.length) {

            var step = opt.step;
            var penalties = opt.penalties;

            // choose the end point with the shortest estimated path cost
            var endPoint = _.chain(endPoints).invoke('snapToGrid', step).min(function(point) {

                return opt.estimateCost(startCenter, point);

            }).value();

            var parents = {};
            var costFromStart = {};
            var totalCost = {};

            // directions
            var dirs = opt.directions;
            var dirLen = dirs.length;
            var dirHalfLen = dirLen / 2;
            var dirIndexes = opt.previousDirIndexes || {};

            // The set of point already evaluated.
            var closeHash = {}; // keeps only information whether a point was evaluated'

            // The set of tentative points to be evaluated, initially containing the start points
            var openHash = {}; // keeps only information whether a point is to be evaluated'
            var openSet = _.chain(startSet).invoke('snapToGrid', step).each(function(point) {

                var key = point.toString();

                costFromStart[key] = 0; // Cost from start along best known path.
                totalCost[key] = opt.estimateCost(point, endPoint);
                dirIndexes[key] = dirIndexes[key] || getDirection(startCenter, point, dirLen);
                openHash[key] = true;

            }).map(function(point) {

                return point.toString();

            }).sortBy(function(pointKey) {

                return totalCost[pointKey];

            }).value();

            var loopCounter = opt.maximumLoops;

            var maxAllowedDirectionChange = opt.maxAllowedDirectionChange;

            // main route finding loop
            while (openSet.length && loopCounter--) {

                var currentKey = openSet[0];
                var currentPoint = g.point(currentKey);

                if (endPoint.equals(currentPoint)) {

                    opt.previousDirIndexes = _.pick(dirIndexes, currentKey);
                    return reconstructRoute(parents, currentPoint);
                }

                // remove current from the open list
                openSet.splice(0, 1);
                openHash[neighborKey] = null;

                // add current to the close list
                closeHash[neighborKey] = true;

                var currentDirIndex = dirIndexes[currentKey];
                var currentDist = costFromStart[currentKey];

                for (var dirIndex = 0; dirIndex < dirLen; dirIndex++) {

                    var dirChange = Math.abs(dirIndex - currentDirIndex);

                    if (dirChange > dirHalfLen) {

                        dirChange = dirLen - dirChange;
                    }

                    // if the direction changed rapidly don't use this point
                    if (dirChange > maxAllowedDirectionChange) {

                        continue;
                    }

                    var dir = dirs[dirIndex];

                    var neighborPoint = g.point(currentPoint).offset(dir.offsetX, dir.offsetY);
                    var neighborKey = neighborPoint.toString();

                    if (closeHash[neighborKey]) {

                        continue;
                    }

                    // is point accesible - no obstacle in the way

                    var mapKey = g.point(neighborPoint).snapToGrid(opt.mapGridSize).toString();

                    var isAccesible = _.every(map[mapKey], function(obstacle) {
                        return !obstacle.containsPoint(neighborPoint);
                    });

                    if (!isAccesible) {

                        continue;
                    }

                    var inOpenSet = _.has(openHash, neighborKey);

                    var costToNeighbor = currentDist + dir.cost;

                    if (!inOpenSet || costToNeighbor < costFromStart[neighborKey]) {

                        parents[neighborKey] = currentPoint;
                        dirIndexes[neighborKey] = dirIndex;
                        costFromStart[neighborKey] = costToNeighbor;

                        totalCost[neighborKey] = costToNeighbor +
                            opt.estimateCost(neighborPoint, endPoint) +
                            penalties[dirChange];

                        if (!inOpenSet) {

                            var openIndex = _.sortedIndex(openSet, neighborKey, function(openKey) {

                                return totalCost[openKey];
                            });

                            openSet.splice(openIndex, 0, neighborKey);
                            openHash[neighborKey] = true;
                        }
                    };
                };
            }
        }

        // no route found ('to' point wasn't either accessible or finding route took
        // way to much calculations)
        return opt.fallbackRoute(startCenter, endCenter, opt);
    };

    // initiation of the route finding
    function router(oldVertices, opt) {

        // resolve some of the options
        opt.directions = _.result(opt, 'directions');
        opt.penalties = _.result(opt, 'penalties');
        opt.paddingBox = _.result(opt, 'paddingBox');

        // enable/disable linkView perpendicular option
        this.options.perpendicular = !!opt.perpendicular;

        // As route changes its shape rapidly when we start finding route from different point
        // it's necessary to start from the element that was not interacted with
        // (the position was changed) at very last.
        var reverseRouting = opt.reversed = (this.lastEndChange === 'source');

        var sourceBBox = reverseRouting ? g.rect(this.targetBBox) : g.rect(this.sourceBBox);
        var targetBBox = reverseRouting ? g.rect(this.sourceBBox) : g.rect(this.targetBBox);

        // expand boxes by specific padding
        sourceBBox.moveAndExpand(opt.paddingBox);
        targetBBox.moveAndExpand(opt.paddingBox);

        // building an elements map

        var link = this.model;
        var graph = this.paper.model;

        // source or target element could be excluded from set of obstacles
        var excludedEnds = _.chain(opt.excludeEnds)
                .map(link.get, link)
                .pluck('id')
                .map(graph.getCell, graph).value();

        var mapGridSize = opt.mapGridSize;

        // builds a map of all elements for quicker obstacle queries (i.e. is a point contained
        // in any obstacle?) (a simplified grid search)
        // The paper is divided to smaller cells, where each of them holds an information which
        // elements belong to it. When we query whether a point is in an obstacle we don't need
        // to go through all obstacles, we check only those in a particular cell.
        var map = _.chain(graph.getElements())
            // remove source and target element if required
            .difference(excludedEnds)
            // remove all elements whose type is listed in excludedTypes array
            .reject(function(element) {
                return _.contains(opt.excludeTypes, element.get('type'));
            })
            // change elements (models) to their bounding boxes
            .invoke('getBBox')
            // expand their boxes by specific padding
            .invoke('moveAndExpand', opt.paddingBox)
            // build the map
            .foldl(function(res, bbox) {

                var origin = bbox.origin().snapToGrid(mapGridSize);
                var corner = bbox.corner().snapToGrid(mapGridSize);

                for (var x = origin.x; x <= corner.x; x += mapGridSize) {
                    for (var y = origin.y; y <= corner.y; y += mapGridSize) {

                        var gridKey = x + '@' + y;

                        res[gridKey] = res[gridKey] || [];
                        res[gridKey].push(bbox);
                    }
                }

                return res;

            }, {}).value();

        // pathfinding

        var newVertices = [];

        var points = _.map(oldVertices, g.point);

        var tailPoint = sourceBBox.center();

        // find a route by concating all partial routes (routes need to go through the vertices)
        // startElement -> vertex[1] -> ... -> vertex[n] -> endElement
        for (var i = 0, len = points.length; i <= len; i++) {

            var partialRoute = null;

            var from = to || sourceBBox;
            var to = points[i];

            if (!to) {

                to = targetBBox;

                // 'to' is not a vertex. If the target is a point (i.e. it's not an element), we
                // might use dragging route instead of main routing method if that is enabled.
                var endingAtPoint = !this.model.get('source').id || !this.model.get('target').id;

                if (endingAtPoint && _.isFunction(opt.draggingRoute)) {
                    // Make sure we passing points only (not rects).
                    var dragFrom = from instanceof g.rect ? from.center() : from;
                    partialRoute = opt.draggingRoute(dragFrom, to.origin(), opt);
                }
            }

            // if partial route has not been calculated yet use the main routing method to find one
            partialRoute = partialRoute || findRoute(from, to, map, opt);

            var leadPoint = _.first(partialRoute);

            if (leadPoint && leadPoint.equals(tailPoint)) {

                // remove the first point if the previous partial route had the same point as last
                partialRoute.shift();
            }

            tailPoint = _.last(partialRoute) || tailPoint;

            newVertices = newVertices.concat(partialRoute);
        };

        // we might have to reverse the result if we swapped source and target at the beginning
        return reverseRouting ? newVertices.reverse() : newVertices;
    };

    // public function
    return function(vertices, opt, linkView) {

        return router.call(linkView, vertices, _.extend({}, config, opt));
    };

})();
