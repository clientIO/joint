var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 800,
    height: 600,
    gridSize: 1,
    model: graph
});

function state(x, y, label) {
    
    var cell = new joint.shapes.fsa.State({
        position: { x: x, y: y },
        size: { width: 60, height: 60 },
        attrs: { text : { text: label }}
    });
    graph.addCell(cell);
    return cell;
};

function link(source, target, label, vertices) {
    
    var cell = new joint.shapes.fsa.Arrow({
        source: { id: source.id },
        target: { id: target.id },
        labels: [{ position: .5, attrs: { text: { text: label || '', 'font-weight': 'bold' } } }],
        vertices: vertices || []
    });
    graph.addCell(cell);
    return cell;
}

var start = new joint.shapes.fsa.StartState({ position: { x: 50, y: 530 } });
graph.addCell(start);

var code  = state(180, 390, 'code');
var slash = state(340, 220, 'slash');
var star  = state(600, 400, 'star');
var line  = state(190, 100, 'line');
var block = state(560, 140, 'block');

link(start, code,  'start');
link(code,  slash, '/');
link(slash, code,  'other', [{x: 270, y: 300}]);
link(slash, line,  '/');
link(line,  code,  'new\n line');
link(slash, block, '*');
link(block, star,  '*');
link(star,  block, 'other', [{x: 650, y: 290}]);
link(star,  code,  '/',     [{x: 490, y: 310}]);
link(line,  line,  'other', [{x: 115,y: 100}, {x: 250, y: 50}]);
link(block, block, 'other', [{x: 485,y: 140}, {x: 620, y: 90}]);
link(code,  code,  'other', [{x: 180,y: 500}, {x: 305, y: 450}]);
