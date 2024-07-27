import { dia, shapes, linkTools, util } from '@joint/core';

const graph = new dia.Graph({}, {
    cellNamespace: shapes
});

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 900,
    overflow: true,
    model: graph,
    cellViewNamespace: shapes,
    interactive: {
        labelMove: true
    },
    snapLabels: true,
    gridSize: 10,
    async: true,
});

// Example

const el1 = new shapes.standard.Rectangle({
    position: {
        x: 10,
        y: 270
    },
    size: {
        width: 80,
        height: 80
    },
    attrs: {
        body: {
            strokeWidth: 3
        }
    }
});
const el2 = new shapes.standard.Rectangle({
    position: {
        x: 400,
        y: 170
    },
    size: {
        width: 80,
        height: 80
    },
    attrs: {
        body: {
            strokeWidth: 3
        }
    }
});

const l1 = new shapes.standard.Link({
    source: {
        id: el1.id
    },
    target: {
        id: el2.id
    },
    attrs: {
        line: {
            strokeWidth: 3
        }
    },
    labels: [{
        markup: util.svg/* xml */`
            <path @selector="labelPath" />
            <circle @selector="labelCircle" />
        `,
        attrs: {
            labelPath: {
                fill: 'none',
                stroke: '#333',
                strokeWidth: 4,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                d: 'M 0 0 V -100 M -20 -100 v 20 H 20 v -20'
            },
            labelCircle: {
                fill: '#333',
                stroke: '#FFF',
                r: 3,
            }
        },
        position: {
            distance: 0.5,
            args: {
                keepGradient: true
            }
        }
    }, {
        markup: util.svg/* xml */`
            <path @selector="labelPath" />
            <circle @selector="labelCircle" />
        `,
        attrs: {
            labelPath: {
                fill: 'none',
                stroke: '#999',
                strokeWidth: 2,
                strokeDasharray: '5 5',
                d: 'M 0 0 V -100 M -20 -80 v -20 H 20 v 20'
            },
            labelCircle: {
                fill: '#333',
                stroke: '#FFF',
                r: 5,
            }
        },
        position: {
            distance: 0.8,
            args: {
                keepGradient: true
            }
        }
    }, {
        markup: util.svg/* xml */`
            <path @selector="labelPath" />
            <circle @selector="labelCircle" />
        `,
        attrs: {
            labelPath: {
                fill: 'none',
                stroke: '#333',
                strokeWidth: 3,
                d: 'M 0 0 V -100 M -20 -80 L 0 -100 l 20 20'
            },
            labelCircle: {
                fill: '#333',
                stroke: '#FFF',
                r: 3,
            }
        },
        position: {
            distance: 0.2,
            args: {
                keepGradient: false
            }
        }
    }]
});

graph.addCells([el1, el2, l1]);

l1.findView(paper).addTools(new dia.ToolsView({
    tools: [
        new linkTools.RotateLabel({
            labelIndex: 0,
            offset: -60,
        }),
        new linkTools.RotateLabel({
            labelIndex: 1,
            offset: -125,
            buttonColor: '#fff',
            iconColor: '#333',
            outlineColor: '#333',
            scale: 1.5
        }),
        new linkTools.RotateLabel({
            labelIndex: 2,
            offset: -115,
        })
    ]
}));

