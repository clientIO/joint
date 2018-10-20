var graph = new joint.dia.Graph;

new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});

joint.dia.Element.define('standard.Arrow', {
    attrs: {
        arrow: {
            d: 'M 0 50 Q 50 0 100 20',
            stroke: '#333333',
            strokeWidth: 40,
            fill: 'none',
            strokeLinejoin: 'round',
            sourceMarker: {
                'type': 'path',
                'd': 'M 0 -40 L -60 0 L 0 40 z'
            }
        },
        label: {
            fill: '#ffffff',
            fontSize: 14,
            textAnchor: 'start',
            fontFamily: 'Comfortaa',
            text: ''
        }
    }
}, {
    markup: [{
        tagName: 'path',
        selector: 'arrow'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
});

var arrow1 = new joint.shapes.standard.Arrow({
    position: { x: 340, y: 80 },
    size: { width: 100, height: 50 },
    attrs: {
        label: {
            text: 'JointJS',
            fontSize: 35,
            textPath: { d: 'M 0 50 Q 50 0 100 20' },
            textVerticalAnchor: 'middle'
        }
    }
});

var arrow2 = new joint.shapes.standard.Arrow({
    position: { x: 340, y: 200 },
    size: { width: 100, height: 50 },
    attrs: {
        label: {
            text: 'This is an example\nof an arrow',
            textPath: { d: 'M 0 20 Q 50 70 100 50' },
            textVerticalAnchor: 'middle'
        },
        arrow: { d: 'M 0 20 Q 50 70 100 50' }
    }
});

var arrow4 = new joint.shapes.standard.Arrow({
    position: { x: 150, y: 200 },
    size: { width: 100, height: 50 },
    attrs: {
        label: {
            text: 'This is an example\nof an arrow',
            textPath: { d: 'M 0 50 Q 50 70 100 20', startOffset: 5 },
            textVerticalAnchor: 'middle'
        },
        arrow: { d: 'M 100 20 Q 50 70 0 50' }
    }
});

var arrow3 = new joint.shapes.standard.Arrow({
    position: { x: 150, y: 80 },
    size: { width: 100, height: 50 },
    attrs: {
        label: {
            text: 'This is an example\nof an arrow',
            textPath: { d: 'M 0 20 Q 50 0 100 50', startOffset: 5 },
            textVerticalAnchor: 'middle'
        },
        arrow: { d: 'M 100 50 Q 50 0 0 20' }
    }
});

graph.addCells([arrow1, arrow2, arrow3, arrow4]);
