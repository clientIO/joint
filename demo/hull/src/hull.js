(function(joint, V) {

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

    function random(max, min) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // create circles
    Array.from({ length: 10 }).forEach(function(_, n) {
        var x = random(100, 700);
        var y = random(100, 500);
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

        var innerHullPoints = convexHullAlgorithm(innerPoints);
        var innerBoundaryPoints = getPaddedPoints(innerHullPoints, padding);
        var outerHullPoints = convexHullAlgorithm(outerPoints.concat(innerBoundaryPoints));

        innerBoundary.attr('d', createData(innerHullPoints));
        outerBoundary.attr('d', createData(outerHullPoints));
    }

    function getPointsByGroup(group, padding) {

        var elements = graph.getElements().filter(function(el) {
            return el.get('group') === group;
        });

        return elements.reduce(function(res, el) {
            return res.concat(getElementCornerPoints(el, padding));
        }, []);
    }


    function getPaddedPoints(inPoints, padding) {

        padding = padding || 0;

        return inPoints.reduce(function(outPoints, point) {
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

        var bbox = element.getBBox().inflate(padding);

        return [
            bbox.origin(),
            bbox.bottomLeft(),
            bbox.corner(),
            bbox.topRight()
        ];
    }

    function createCircle(x, y, group) {

        var circle = new joint.shapes.standard.Circle({
            size: { width: 20, height: 20 },
            position: { x: x, y: y },
            group: group,
            attrs: {
                body: {
                    strokeWidth: 3,
                    fill: (group === 'inner') ? '#af9bff' : '#31d0c6',
                    stroke: (group === 'inner') ? '#7c68fc' : '#009d93'
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

        var origin = new g.Line(points[0], points[points.length - 1]).midpoint();
        return joint.connectors.rounded(origin, origin, points, {
            radius: radius || 30
        });
    }

    // Graham scan convex hull algorithm
    function convexHullAlgorithm(points) {

        return new g.Polyline(points).convexHull().points;

    }

})(joint, V);
