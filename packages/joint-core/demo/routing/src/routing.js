var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 600,
    gridSize: 10,
    async: true,
    model: graph
});

var source = new joint.shapes.standard.Rectangle({
    position: { x: 50, y: 50 },
    size: { width: 140, height: 70 },
    attrs: {
        body: {
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: '0%', color: '#f7a07b' },
                    { offset: '100%', color: '#fe8550' }
                ],
                attrs: { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
            },
            stroke: '#ed8661',
            strokeWidth: 2
        },
        label: {
            text: 'Source',
            fill: '#f0f0f0',
            fontSize: 18,
            fontWeight: 'lighter',
            fontVariant: 'small-caps'
        }
    }
});

var target = source.clone().translate(750, 400).attr('label/text', 'Target');

var link = new joint.shapes.standard.Link({
    source: { id: source.id },
    target: { id: target.id },
    router: { name: 'manhattan' },
    connector: { name: 'rounded' },
    attrs: {
        line: {
            stroke: '#333333',
            strokeWidth: 3
        }
    }
});

var obstacle = source.clone().translate(300, 100).attr({
    label: {
        text: 'Obstacle',
        fill: '#eee'
    },
    body: {
        fill: {
            stops: [{ color: '#b5acf9' }, { color: '#9687fe' }]
        },
        stroke: '#8e89e5',
        strokeWidth: 2
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
    if (obstacles.indexOf(cell) > -1) {
        link.findView(paper).requestConnectionUpdate();
    }
});

paper.on('link:mouseenter', function(linkView) {
    var tools = new joint.dia.ToolsView({
        tools: [new joint.linkTools.Vertices()]
    });
    linkView.addTools(tools);
});

paper.on('link:mouseleave', function(linkView) {
    linkView.removeTools();
});

$('.router-switch').on('click', function(evt) {

    var router = $(evt.target).data('router');
    var connector = $(evt.target).data('connector');

    if (router) {
        link.set('router', { name: router });
    } else {
        link.unset('router');
    }

    link.set('connector', { name: connector });
});
