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

// Example 1
// Rotate labels on a link.

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
            scale: 1.5,
        }),
        new linkTools.RotateLabel({
            labelIndex: 2,
            offset: -115,
        })
    ]
}));

// Example 2
// Add or remove labels on a link with buttons.

const l2 = new shapes.standard.Link({
    source: {
        x: 10,
        y: 500
    },
    target: {
        x: 400,
        y: 570
    },
    attrs: {
        line: {
            strokeWidth: 3
        }
    }
});

graph.addCells([l2]);

l2.findView(paper).addTools(new dia.ToolsView({
    tools: [
        new linkTools.Button({
            attributes: {
                cursor: 'pointer'
            },
            markup: util.svg/* xml */`
                <circle r="10" fill="#266DD3" />
                <path d="M -5 0 5 0 M 0 -5 0 5" stroke="#fff" stroke-width="2" />
            `,
            distance: '50%',
            visibility: (view) => !view.model.hasLabels(),
            action: (_evt, view) => {
                view.model.appendLabel({
                    markup: util.svg/* xml */`
                        <rect @selector="labelBody" />
                        <text @selector="labelText" />
                    `,
                    attrs: {
                        labelBody: {
                            ref: 'labelText',
                            fill: '#fff',
                            stroke: '#131E29',
                            strokeWidth: 2,
                            width: 'calc(w + 10)',
                            height: 'calc(h + 10)',
                            x: 'calc(x - 5)',
                            y: 'calc(y - 5)',
                        },
                        labelText: {
                            text: 'Label',
                            textAnchor: 'middle',
                            textVerticalAnchor: 'middle',
                            fill: '#131E29',
                            fontSize: 16,
                            fontFamily: 'sans-serif',
                        }
                    },
                    position: {
                        distance: 0.5,
                        args: {
                            keepGradient: true
                        }
                    }
                });
            },
        }),
        new linkTools.Button({
            attributes: {
                cursor: 'pointer'
            },
            markup: util.svg/* xml */`
                <circle r="10" fill="#ED2637" />
                <path d="M -5 0 5 0" stroke="#fff" stroke-width="2" />
            `,
            distance: '50%',
            offset: -30,
            visibility: (view) => view.model.hasLabels(),
            action: (_evt, view) => {
                view.model.removeLabel(0);
            }
        })
    ]
}));

