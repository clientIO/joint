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
    var t = (link.attr('c1/atConnectionRatio') > .2) ? .2 :.9;
    var transitionOpt = { delay: 100, duration: 2000, timingFunction: joint.util.timing.inout };
    link.transition('attrs/c1/atConnectionRatio', t, transitionOpt);
    link.transition('attrs/c2/atConnectionRatio', t, transitionOpt);
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
        selector: 'c1',
    }, {
        tagName: 'path',
        selector: 'p2'
    }, {
        tagName: 'circle',
        selector: 'c2'
    }, {
        tagName: 'text',
        selector: 'signText'
    }, {
        tagName: 'path',
        selector: 'p3'
    }],
    source: { x: 100, y: 100 },
    target: { x: 500, y: 100 },
    vertices: [{ x: 300, y: 50 }],
    attrs: {
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
            stroke: '#fe854f',
            strokeWidth: 4,
            pointerEvents: 'none',
            strokeLinejoin: 'round',
            targetMarker: {
                'type': 'path',
                'fill': '#fe854f',
                'stroke': 'black',
                'stroke-width': 1,
                'd': 'M 10 -3 10 -10 -2 0 10 10 10 3'
            }
        },
        p3: {
            atConnectionRatio: .4,
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
            x: -20,
            y: -10,
            width: 40,
            height: 20,
            stroke: 'black',
            fill: '#fe854f',
            atConnectionLength: 30,
            strokeWidth: 1,
            event: 'myclick:rect'
        },
        signText: {
            atConnectionLength: 30,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            text: 'Link',
        },
        c1: {
            r: 10,
            stroke: 'black',
            fill: '#fe854f',
            atConnectionRatio: .5,
            strokeWidth: 1,
            event: 'myclick:circle',
            cursor: 'pointer'
        },
        c2: {
            r: 5,
            stroke: 'black',
            fill: 'white',
            atConnectionRatio: .5,
            strokeWidth: 1,
            pointerEvents: 'none'
        }
    }
});

link1.addTo(graph);

var link2 = new joint.dia.Link({
    markup: [{
        tagName: 'path',
        selector: 'stroke',
        attributes: {
            'stroke': 'black',
            'fill': 'none'
        }
    }, {
        tagName: 'path',
        selector: 'fill'
    }, {
        tagName: 'g',
        selector: 'group'
    }],
    source: { x: 200, y: 200 },
    target: { x: 500, y: 150 },
    connector: { name: 'rounded' },
    attrs: {
        fill: {
            connection: true,
            strokeWidth: 8,
            strokeLinecap: 'round',
            fill: 'none',
            stroke: {
                type: 'linearGradient',
                stops: [
                    { offset: '0%', color: '#ccc' },
                    { offset: '50%', color: '#30d0c6' },
                    { offset: '100%', color: '#ccc' }
                ]
            },
        },
        stroke: {
            connection: true,
            strokeWidth: 10,
            strokeLinecap: 'round'
        }
    }
});

link2.addTo(graph);

var link3 = new joint.shapes.standard.ShadowLink({
    source:{ x: 100, y: 200 },
    target: { x: 500, y: 200 },
    vertices: [{ x: 300, y: 300 }],
    connector: { name: 'smooth' },
    markup: joint.shapes.standard.ShadowLink.prototype.markup.slice().reverse().concat({
        tagName: 'text',
        selector: 'label'
    }),
    attrs: {
        line: {
            stroke: '#5654a0'
        },
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

link3.addTo(graph);
