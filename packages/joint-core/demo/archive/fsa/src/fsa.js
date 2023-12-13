const State = joint.dia.Element.define('fsa.State', {
    size: { width: 60, height: 60 },
    attrs: {
        'circle': {
            fill: '#ffffff',
            stroke: '#000000',
            'stroke-width': 3,
            r: 30,
            cx: 30,
            cy: 30
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-weight': '800',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle/></g><text/></g>',
});

const StartState = joint.dia.Element.define('fsa.StartState', {
    size: { width: 20, height: 20 },
    attrs: {
        circle: {
            transform: 'translate(10, 10)',
            r: 10,
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle/></g></g>',
});

const EndState = joint.dia.Element.define('fsa.EndState', {
    size: { width: 20, height: 20 },
    attrs: {
        '.outer': {
            transform: 'translate(10, 10)',
            r: 10,
            fill: '#ffffff',
            stroke: '#000000'
        },

        '.inner': {
            transform: 'translate(10, 10)',
            r: 6,
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle class="outer"/><circle class="inner"/></g></g>',
});

const Arrow = joint.dia.Link.define('fsa.Arrow', {
    attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }},
});

const shapes = {
    ...joint.shapes,
    fsa: { State, StartState, EndState, Arrow }
};


var graph = new joint.dia.Graph({}, { cellNamespace: shapes });

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 600,
    model: graph,
    cellViewNamespace: shapes,
    defaultConnectionPoint: { name: 'boundary' },
    defaultConnector: { name: 'smooth' },
    interactive: { linkMove: false },
    labelsLayer: true,
    frozen: true
});

paper.on('element:label:pointerdown', function(_view, evt) {
    // Prevent user from moving the element when interacting with the label element
    evt.stopPropagation();
});

paper.on('cell:pointerdown blank:pointerdown', function() {
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    } else if (document.selection) {
        document.selection.empty();
    }
});

function state(x, y, label) {
    var circle = new joint.shapes.standard.Circle({
        position: { x: x, y: y },
        size: { width: 60, height: 60 },
        attrs: {
            label : {
                text: label,
                event: 'element:label:pointerdown',
                fontWeight: 'bold',
                cursor: 'text',
                style: {
                    userSelect: 'text'
                }
            },
            body: {
                strokeWidth: 3
            }
        }
    });
    return circle.addTo(graph);
}

function initState(x, y) {
    var start = new joint.shapes.standard.Circle({
        position: { x: x, y: y },
        size: { width: 20, height: 20 },
        attrs: {
            body: {
                fill: '#333333'
            }
        }
    });
    return start.addTo(graph);
}

function link(source, target, label, vertices) {
    var link = new joint.shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
        attrs: {
            line: {
                strokeWidth: 2
            }
        },
        labels: [{
            position: {
                distance: 0.5,
                offset: (label.indexOf('\n') > -1 || label.length === 1) ? 0 : 10,
                args: {
                    keepGradient: true,
                    ensureLegibility: true
                }
            },
            attrs: {
                text: {
                    text: label,
                    fontWeight: 'bold'
                }
            }
        }],
        vertices: vertices || []
    });
    return link.addTo(graph);
}

var start = initState(50, 530);
var code  = state(180, 390, 'code');
var slash = state(340, 220, 'slash');
var star  = state(600, 400, 'star');
var line  = state(190, 100, 'line');
var block = state(560, 140, 'block');

link(start, code,  'start');
link(code,  slash, '/');
link(slash, code,  'other', [{ x: 270, y: 300 }]);
link(slash, line,  '/');
link(line,  code,  'new\n line');
link(slash, block, '*');
link(block, star,  '*');
link(star,  block, 'other', [{ x: 650, y: 290 }]);
link(star,  code,  '/',     [{ x: 490, y: 310 }]);
link(line,  line,  'other', [{ x: 115,y: 100 }, { x: 250, y: 50 }]);
link(block, block, 'other', [{ x: 485,y: 140 }, { x: 620, y: 90 }]);
link(code,  code,  'other', [{ x: 180,y: 500 }, { x: 305, y: 450 }]);

paper.unfreeze();
