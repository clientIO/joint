(function(joint, V, g) {

    var center = new g.Point(200, 150);
    var orbit = new g.Ellipse(center, 100, 80);

    function findPointAtOrbit(x, y, width, height) {
        return orbit
            .intersectionWithLineFromCenterToPoint(new g.Point(x, y))
            .offset(- width / 2, - height / 2);
    }

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 450,
        height: 300,
        model: graph,
        async: true,
        sorting: joint.dia.Paper.sorting.NONE,
        restrictTranslate: function(elementView, x0, y0) {
            var bbox = elementView.model.getBBox();
            // The initial difference between the pointer coordinates and the element position
            var dx = bbox.x - x0;
            var dy = bbox.y - y0;
            return function(x, y) {
                return findPointAtOrbit(x - dx, y - dy, bbox.width, bbox.height);
            };
        }
    });

    V('ellipse', {
        'cx': center.x,
        'cy': center.y,
        'rx': orbit.a,
        'ry': orbit.b,
        'fill': '#ECF0F1',
        'stroke': '#34495E',
        'stroke-width': 1,
        'stroke-dasharray': '2, 2'
    }).appendTo(paper.getLayerNode('back'));

    var earthSize = 40;
    var earthPosition = findPointAtOrbit(100, 100, earthSize, earthSize);
    var earth = new joint.shapes.standard.Ellipse({
        position: { x: earthPosition.x, y: earthPosition.y },
        size: { width: earthSize, height: earthSize },
        attrs: {
            label: {
                'text': 'Earth',
                'font-size': 12,
                'fill': 'white',
                'style': { 'text-shadow': '1px 1px 1px black' }
            },
            body: {
                'stroke': 'none',
                'fill': {
                    type: 'linearGradient',
                    stops: [
                        { offset: '0%', color: '#333333' },
                        { offset: '40%', color: '#0F5298' },
                        { offset: '60%', color: '#2565AE' },
                        { offset: '100%', color: '#3C99DC' }
                    ]
                }
            }
        }
    });

    graph.addCell(earth);

})(joint, V, g);



