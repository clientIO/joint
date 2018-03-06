var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 1000,
    height: 600,
    gridSize: 10,
    model: graph
});

var source = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 140, height: 70 },
    attrs: {
        rect: {
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: '0%', color: '#45484d' },
                    { offset: '100%', color: '#000000' }
                ],
                attrs: { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
            }
        },
        text: {
            text: 'Source',
            fill: '#fefefe',
            'font-size': 18,
            'font-weight': 'bold',
            'font-variant': 'small-caps'
        }
    }
});

var target = source.clone().translate(700, 400).attr('text/text', 'Target');

var link = new joint.dia.Link({
    source: { id: source.id },
    target: { id: target.id },
    router: { name: 'manhattan' },
    connector: { name: 'rounded' },
    attrs: {
        '.connection': {
            stroke: '#333333',
            'stroke-width': 3
        },
        '.marker-target': {
            fill: '#333333',
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    }
});

var obstacle = source.clone().translate(300, 100).attr({
    text: {
        text: 'Obstacle',
        fill: '#2e2e2e'
    },
    rect: {
        fill: {
            stops: [{ color: '#93cede' }, { color: '#49a5bf' }]
        }
    }
});

var obstacles = [
    obstacle,
    obstacle.clone().translate(200, 100),
    obstacle.clone().translate(-200, 150)
];

graph.addCells(obstacles).addCells([source, target, link]);

link.toBack();

graph.on('change:position', function(cell) {

    // has an obstacle been moved? Then reroute the link.
    if (_.contains(obstacles, cell)) paper.findViewByModel(link).update();
});
