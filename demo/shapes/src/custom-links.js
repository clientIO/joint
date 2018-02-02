var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 1,
    model: graph
});

paper.on('myclick:circle', function (linkView, evt) {
    evt.stopPropagation();
    var link = linkView.model;
    var t = (link.attr('c1/atPathRatio') > .1) ? .1 :.9;
    var transitionOpt = { delay: 100, duration: 2000, timingFunction: joint.util.timing.inout };
    link.transition('attrs/c1/atPathRatio', t, transitionOpt);
    link.transition('attrs/c2/atPathRatio', t, transitionOpt);
});

var link1 = new joint.dia.Link({
    markup: [{
        tagName: 'path',
        selector: 'p1'
    }, {
        tagName: 'rect',
        selector: 'sign'
    }, {
        tagName: 'circle',
        className: 'circulin',
        selector: 'c1',
    }, {
        tagName: 'path',
        selector: 'p2'
    }, {
        tagName: 'circle',
        selector: 'c2'
    }, {
        tagName: 'text',
        selector: 'sign_text'
    }, {
        tagName: 'path',
        selector: 'p3'
    }],
    source: { x: 100, y: 100 },
    target: { x: 500, y: 100 },
    vertices: [{ x: 300, y: 50 }],
    attrs: {
        root: {
            title: 'test\ntest2'
        },
        p1: {
            connection: true,
            fill: 'none',
            stroke: 'black',
            strokeWidth: 6,
            strokeLinejoin: 'round'
        },
        p2: {
            connection: true,
            fill: 'none',
            stroke: 'lightgray',
            strokeWidth: 4,
            pointerEvents: 'none',
            strokeLinejoin: 'round',
            targetMarker: {
                'type': 'path',
                'fill': 'lightgray',
                'stroke': 'black',
                'stroke-width': 1,
                'd': 'M 10 -3 10 -10 -2 0 10 10 10 3'
            }
        },
        p3: {
            atPathRatio: .4,
            d: 'M 0 3 30 33',
            fill: 'none',
            stroke: 'black',
            targetMarker: {
                'type': 'path',
                'fill': 'black',
                'stroke': 'black',
                'd': 'M 10 10 -2 0 10 -10'
            }
        },
        sign: {
            x: -10,
            y: -20,
            width: 20,
            height: 40,
            stroke: 'black',
            fill: 'lightgray',
            atPathLength: 30,
            strokeWidth: 1,
            event: 'myclick:rect'
        },
        sign_text: {
            atPathLength: 30,
            //textAnchor: 'middle',
            y: '-1.8em',
            text: 'Link',
            writingMode: 'tb'
        },
        c1: {
            r: 10,
            stroke: 'black',
            fill: 'lightgray',
            atPathRatio: .5,
            strokeWidth: 1,
            event: 'myclick:circle'
        },
        c2: {
            r: 5,
            stroke: 'black',
            fill: 'white',
            atPathRatio: .5,
            strokeWidth: 1,
            pointerEvents: 'none'
        }
    }
});

link1.addTo(graph);

var link2 = new joint.shapes.standard.ShadowLink({
    source:{ x: 100, y: 200 },
    target: { x: 500, y: 200 },
    vertices: [{ x: 400, y: 300 }],
    connector: { name: 'smooth' },
    markup: [].concat(joint.shapes.standard.ShadowLink.prototype.markup, {
        tagName: 'text',
        selector: 'label'
    }),
    attrs: {
        label: {
            textPath: { selector: 'line', startOffset: '50%' },
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            text: 'Label Along Path',
            fill: 'yellow',
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'fantasy'
        }
    }
});

link2.addTo(graph);

