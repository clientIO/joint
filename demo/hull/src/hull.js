(function(joint, _, V, G) {

    var graph = new joint.dia.Graph();

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 800,
        height: 600,
        gridSize: 1,
        model: graph,
        restrictTranslate: {
            x: 50,
            y: 50,
            width: 700,
            height: 500
        }
    });

    // create circles
    _.times(10, function(n) {
        var x = _.random(100, 700);
        var y = _.random(100, 500);
        createCircle(x, y, (n % 3 === 0) ? 'inner' : 'outer').addTo(graph);
    });

    // create boundaries around elements
    var innerBoundary = createBoundary('#fe854f');
    var outerBoundary = createBoundary('#feb663');

    // find elements boundaries and setup auto updating
    updateBoundaries();
    graph.on('change:position', updateBoundaries);

    // Helpers

    function updateBoundaries() {

        var padding = 10;

        var innerPoints = getPointsByGroup('inner', padding);
        var outerPoints = getPointsByGroup('outer', padding);

        var innerHullPoints = chainHullAlgorithm(innerPoints);
        var innerBoundaryPoints = getPaddedPoints(innerHullPoints, padding);
        var outerHullPoints = chainHullAlgorithm(outerPoints.concat(innerBoundaryPoints));

        innerBoundary.attr('d', createData(innerHullPoints));
        outerBoundary.attr('d', createData(outerHullPoints));
    }

    function getPointsByGroup(group, padding) {

        var elements = _.filter(graph.getElements(), function(el) {
            return el.get('group') === group;
        });

        return _.reduce(elements, function(res, el) {
            return res.concat(getElementCornerPoints(el, padding));
        }, []);
    }


    function getPaddedPoints(inPoints, padding) {

        padding = padding || 0;

        return _.reduce(inPoints, function(outPoints, point) {
            outPoints.push(
                point.clone().offset(padding, padding),
                point.clone().offset(-padding, padding),
                point.clone().offset(padding, -padding),
                point.clone().offset(-padding, -padding)
            );
            return outPoints;
        }, []);
    }

    function getElementCornerPoints(element, padding) {

        padding = padding || 0;

        var bbox = element.getBBox().moveAndExpand({
            x: -padding,
            y: -padding,
            width: 2 * padding,
            height: 2 * padding
        });

        return [
            bbox.origin(),
            bbox.bottomLeft(),
            bbox.corner(),
            bbox.topRight()
        ];
    }

    function createCircle(x, y, group) {

        var circle = new joint.shapes.basic.Circle({
            size: { width: 20, height: 20 },
            position: { x: x, y: y },
            group: group,
            attrs: {
                circle: {
                    'stroke-width': 3,
                    'fill': (group === 'inner') ? '#af9bff' : '#31d0c6',
                    'stroke': (group === 'inner') ? '#7c68fc' : '#009d93'
                }
            }
        });

        return circle;
    }

    function createBoundary(color) {

        var boundary = V('path').attr({
            'fill': color,
            'fill-opacity': 0.2,
            'stroke': color,
            'stroke-width': 3
        });

        V(paper.viewport).prepend(boundary);

        return boundary;
    }

    function createData(points, radius) {

        var origin = g.Line(points[0], points[points.length - 1]).midpoint();
        return joint.connectors.rounded(origin, origin, points, {
            radius: radius || 30
        });
    }

    // Andrew's monotone chain convex hull algorithm
    function chainHullAlgorithm(points) {

        function isLeft(p0, p1, p2) {
            return (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y);
        }

        points.sort(function(p1,p2) {
            return (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) ? 1 : -1;
        });

        var outPoints = [];
        // the output array H[] will be used as the stack
        var bottom = 0;
        var top = -1;  // indices for bottom and top of the stack
        var i;         // array scan index
        var n = points.length;

        // Get the indices of points with min x-coord and min|max y-coord
        var minmin = 0, minmax;
        var xmin = points[0].x;

        for (i=1; i<n; i++) {
            if (points[i].x != xmin) {
                break;
            }
        }

        minmax = i-1;
        if (minmax === n-1) {
            // degenerate case: all x-coords == xmin
            outPoints[++top] = points[minmin];

            if (points[minmax].y !== points[minmin].y)
            {
                // a nontrivial segment
                outPoints[++top] = points[minmax];
            }

            // add polygon endpoint
            outPoints[++top] = points[minmin];
            return;
        }

        // Get the indices of points with max x-coord and min|max y-coord
        var maxmin, maxmax = n-1;
        var xmax = points[n-1].x;
        for (i=n-2; i>=0; i--) {
            if (points[i].x != xmax) {
                break;
            }
        }
        maxmin = i+1;

        // Compute the lower hull on the stack H
        // push minmin point onto stack
        outPoints[++top] = points[minmin];
        i = minmax;
        while (++i <= maxmin) {
            // the lower line joins P[minmin] with P[maxmin]
            if (isLeft(points[minmin], points[maxmin], points[i]) >= 0 && i < maxmin) {
                // ignore P[i] above or on the lower line
                continue;
            }

            // there are at least 2 points on the stack
            while (top > 0) {
                // test if P[i] is left of the line at the stack top
                if (isLeft(outPoints[top-1], outPoints[top], points[i]) > 0) {
                    // P[i] is a new hull vertex
                    break;
                } else {
                    // pop top point off stack
                    top--;
                }
            }

            // push P[i] onto stack
            outPoints[++top] = points[i];
        }

        // Next, compute the upper hull on the stack H above the bottom hull
        // if distinct xmax points
        if (maxmax !== maxmin) {
            // push maxmax point onto stack
            outPoints[++top] = points[maxmax];
        }

        // the bottom point of the upper hull stack
        bottom = top;
        i = maxmin;
        while (--i >= minmax) {
            // the upper line joins P[maxmax] with P[minmax]
            if (isLeft(points[maxmax], points[minmax], points[i]) >= 0 && i > minmax)
            {
                // ignore P[i] below or on the upper line
                continue;
            }

            // at least 2 points on the upper stack
            while (top > bottom) {
                // test if P[i] is left of the line at the stack top
                if (isLeft(outPoints[top-1], outPoints[top], points[i]) > 0) {
                    // P[i] is a new hull vertex
                    break;
                } else {
                    // pop top point off stack
                    top--;
                }
            }

            // push P[i] onto stack
            outPoints[++top] = points[i];
        }

        if (minmax != minmin) {
            // push joining endpoint onto stack
            outPoints[++top] = points[minmin];
        }

        // remove unused points
        while (outPoints.length > top + 1) {
            outPoints.pop();
        }

        // sometimes first point is duplicated at the end of the list
        var lastPoint = outPoints[outPoints.length - 1];
        while (lastPoint.x == outPoints[0].x && lastPoint.y == outPoints[0].y) {
            outPoints.pop();
            lastPoint = outPoints[outPoints.length - 1];
        }

        return outPoints;
    }

})(joint, _, V, g);
