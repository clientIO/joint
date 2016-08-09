var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});

var markerElement = V('<marker><path d="M 2 0 L 0 1 L 2 2 z" fill="#333333"/></marker>').attr({
    id: 'marker-def',
    markerWidth: 5,
    markerHeight: 5,
    refX: 1.9,
    refY: 1,
    orient: 'auto',
    viewBox: '0 0 6 6',
    markerUnits: 'strokeWidth'
});

V(paper.svg).defs().append(markerElement);

joint.shapes.basic.Arrow = joint.dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"></g><path/><text/></g>',
    
    defaults: _.defaultsDeep({
    
        type: 'basic.Arrow',
        size: { width: 100, height: 50 },
        attrs: {
            path: { d:  'M 0 50 Q 50 0 100 20', stroke: '#333333', 'stroke-width': 40, fill: 'none', 'marker-start': 'url(#marker-def)', 'stroke-linejoin': "round"},
            text: { fill: '#ffffff', 'font-size': 14, 'text-anchor': 'center', 'font-family': "Comfortaa", text: '' }
        }
        
    }, joint.dia.Element.prototype.defaults)
    
});

var arrow1 = new joint.shapes.basic.Arrow({
    position: { x: 340, y: 80 },
    size: { width: 100, height: 50 },
    attrs: {
        text: { text: 'JointJS', 'font-size': 35, 'textPath': { d: 'M 0 50 Q 50 0 100 20', 'dominant-baseline': 'central' }}
    }
});

var arrow2 = new joint.shapes.basic.Arrow({
    position: { x: 340, y: 200 },
    size: { width: 100, height: 50 },
    attrs: {
        text: { text: 'This is an example\nof an arrow', textPath: 'M 0 20 Q 50 70 100 50' },
        path: { d: 'M 0 20 Q 50 70 100 50' }
    }
});

var arrow4 = new joint.shapes.basic.Arrow({
    position: { x: 150, y: 200 },
    size: { width: 100, height: 50 },
    attrs: {
        text: { text: 'This is an example\nof an arrow', textPath: { d: 'M 0 50 Q 50 70 100 20', startOffset: 5 }},
        path: { d: 'M 100 20 Q 50 70 0 50' }
    }
});

var arrow3 = new joint.shapes.basic.Arrow({
    position: { x: 150, y: 80 },
    size: { width: 100, height: 50 },
    attrs: {
        text: { text: 'This is an example\nof an arrow', textPath: { d: 'M 0 20 Q 50 0 100 50', startOffset: 5 }},
        path: { d: 'M 100 50 Q 50 0 0 20' }
    }
});

graph.addCells([arrow1, arrow2, arrow3, arrow4]);
