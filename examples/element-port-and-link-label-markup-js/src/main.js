import { dia, shapes, util } from '@joint/core';
import './styles.css';

// Paper

const cellNamespace = { ...shapes };

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: cellNamespace });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: cellNamespace,
    width: '100%',
    height: '100%',
    gridSize: 20,
    drawGrid: { name: 'mesh' },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    interactive: true,
    defaultConnectionPoint: {
        name: 'boundary',
    },
    validateConnection: function(
        sourceView,
        sourceMagnet,
        targetView,
        targetMagnet
    ) {
        const sourcePort = sourceView.findAttribute('port', sourceMagnet);
        const targetPort = targetView.findAttribute('port', targetMagnet);
        if (sourcePort === targetPort) {
            return false;
        }
        return true;
    },
    highlighting: {
        default: {
            name: 'mask',
        },
    },
    linkPinning: false,
    snapLabels: true,
    defaultLink: () => new shapes.standard.Link(),
});

paperContainer.appendChild(paper.el);

function getMarkupAttributes() {
    return {
        markup: util.svg`
            <path @selector="arrow"/>
            <rect @selector="body"/>
            <text @selector="label"/>
        `,
        attrs: {
            root: {
                highlighterSelector: 'arrow',
                magnetSelector: 'arrow'
            },
            body: {
                width: 'calc(w-10)',
                height: 'calc(h-10)',
                x: 5,
                y: 5,
                fill: '#80ffd5',
                stroke: '#333333',
                strokeWidth: 2
            },
            arrow: {
                d: 'M 0 0 H calc(w) L calc(w+calc(h/2)) calc(h/2) calc(w) calc(h) H 0 Z',
                fill: '#48cba4',
                stroke: '#333333',
                strokeWidth: 2,
                strokeLinejoin: 'round'
            },
            label: {
                textWrap: {
                    width: 'calc(w-14)',
                    height: 'calc(h-10)',
                },
                x: 'calc(w/2)',
                y: 'calc(h/2)',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fontSize: 16,
                fontFamily: 'sans-serif'
            }
        }
    };
}

const Example = dia.Element.define('example', {
    ...getMarkupAttributes()
});
cellNamespace.example = Example;

const example1 = new Example({
    size: { width: 200, height: 50 },
    position: { x: 50, y: 50 },
    attrs: {
        label: {
            text: 'An element markup'
        }
    }
});
example1.addTo(graph);

const example2 = new Example({
    size: { width: 200, height: 100 },
    position: { x: 300, y: 25 },
    attrs: {
        label: {
            text: 'The same markup but different size'
        }
    }
});
example2.addTo(graph);

const portExample = new shapes.standard.Rectangle({
    size: { width: 200, height: 200 },
    position: { x: 50, y: 150 },
    attrs: {
        root: {
            magnet: false
        },
        body: {
            fill: '#f6f4f4',
            strokeDasharray: '10,5'
        },
        label: {
            text: 'An element with ports with the same markup',
            textWrap: {
                width: 'calc(w-10)',
                height: 'calc(h-10)',
            },
            fontSize: 14,
            fontFamily: 'sans-serif'
        }
    },
    ports: {
        groups: {
            right: {
                position: { name: 'right', args: { dy: -25 }},
                size: { width: 200, height: 50 },
                ...getMarkupAttributes()
            }
        },
        items: [{
            group: 'right',
            attrs: {
                body: {
                    fill: '#80aaff',
                },
                arrow: {
                    fill: '#4a7bcb'
                },
                label: {
                    text: 'An output port',
                    magnet: true,
                    magnetSelector: 'arrow'
                }
            }

        }, {
            group: 'right',
            attrs: {
                portRoot: {
                    magnet: 'passive',
                    highlighterSelector: 'arrow'
                },
                body: {
                    fill: '#ff9580',
                },
                arrow: {
                    fill: '#c86653'
                },
                label: {
                    text: 'An input port'
                }
            }
        }, {
            group: 'right',
            args: {
                dy: -10
            },
            size: { width: 150, height: 30 },
            attrs: {
                label: {
                    text: 'An inactive smaller port',
                    fontSize: 12
                }
            }
        }]

    }

});

portExample.addTo(graph);


const labelExample = new shapes.standard.Link({
    source: { x: 50, y: 400 },
    target: { x: 500, y: 400 },
    attrs: {
        root: {
            magnet: false
        },
        line: {
            strokeDasharray: '10,5'
        }
    },
    defaultLabel: getMarkupAttributes(),
    labels: [{
        size: { width: 150, height: 30 },
        attrs: {
            body: {
                fill: '#80eaff',
            },
            arrow: {
                fill: '#48b8cc'
            },
            label: {
                text: 'A label markup',
            }
        },
        position: { distance: 0.5, offset: { x: -75, y: -15 }}
    }]
});

labelExample.addTo(graph);
