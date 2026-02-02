import { dia, shapes } from '@joint/core';
import './styles.scss';

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 20,
    drawGrid: { name: 'mesh' },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    defaultLink: () => new shapes.standard.Link(),
    validateConnection: (sv, _sm, tv, _tm) => sv !== tv,
    linkPinning: false,
    defaultAnchor: { name: 'perpendicular' }
});

paperContainer.appendChild(paper.el);

const PORT_WIDTH = 30;
const PORT_HEIGHT = 20;
const PORT_GAP = 20;

const el1 = new shapes.standard.Rectangle({
    position: {
        x: 50,
        y: 50
    },
    size: {
        width: 400,
        height: 90
    },
    attrs: {
        root: {
            magnet: false
        },
        body: {
            strokeWidth: 2,
            fill: '#555555'
        },
        label: {
            fontWeight: 'bold',
            fontSize: 20,
            fontFamily: 'sans-serif',
            fill: '#ffffff',
            stroke: '#333333',
            strokeWidth: 5,
            paintOrder: 'stroke',
            text: 'Optional Ports'
        }
    },
    ports: {
        groups: {
            digits: {
                markup: [
                    {
                        tagName: 'rect',
                        selector: 'portBody'
                    },
                    {
                        tagName: 'text',
                        selector: 'portLabel'
                    }
                ],
                attrs: {
                    portBody: {
                        x: 0,
                        y: -PORT_HEIGHT / 2,
                        width: 'calc(w)',
                        height: 'calc(h)',
                        fill: '#ffffff',
                        stroke: '#333333',
                        strokeWidth: 2,
                        magnet: 'active',
                        cursor: 'grab'
                    },
                    portLabel: {
                        x: 'calc(0.5*w)',
                        textAnchor: 'middle',
                        textVerticalAnchor: 'middle',
                        pointerEvents: 'none',
                        fontWeight: 'bold',
                        fontSize: 12,
                        fontFamily: 'sans-serif'
                    }
                },
                size: { width: PORT_WIDTH, height: PORT_HEIGHT },
                position: 'absolute'
            }
        },
        items: []
    }
});

const el2 = new shapes.standard.Rectangle({
    position: {
        x: 50,
        y: 300
    },
    size: {
        width: 400,
        height: 90
    }
});

const l1 = new shapes.standard.Link({
    source: { id: el1.id, port: '1' },
    target: { id: el2.id }
});

const l2 = new shapes.standard.Link({
    source: { id: el1.id, port: '2' },
    target: { id: el2.id }
});

graph.addCells([el1, el2, l1, l2]);

function setPorts(el, digits) {
    let width = 0;
    // Optional ports
    const digitPorts = digits.map((digit, index) => {
        const x = index * (PORT_WIDTH + PORT_GAP);
        width = x + PORT_WIDTH;
        return {
            id: `${digit}`,
            group: 'digits',
            attrs: {
                portLabel: {
                    text: `${digit}`
                }
            },
            args: {
                x,
                y: '100%'
            }
        };
    });
    if (digitPorts.length > 0) {
        width += PORT_GAP;
    }

    // Required port.
    const fallbackPort = {
        id: 'fallback',
        group: 'digits',
        size: { width: PORT_WIDTH * 2, height: PORT_HEIGHT },
        attrs: {
            portLabel: {
                text: 'fallback'
            }
        },
        args: {
            x: width,
            y: '100%'
        }
    };

    width += 2 * PORT_WIDTH;

    el1.prop(['ports', 'items'], [...digitPorts, fallbackPort], {
        rewrite: true
    });
    el1.prop(['size', 'width'], width);
}

// Update element from html inputs

const outputPortsEl = document.getElementById('output-ports');
outputPortsEl.addEventListener('change', () => update());
function update() {
    const digits = [];
    Array.from(outputPortsEl.querySelectorAll('input')).forEach((input) => {
        if (input.checked) digits.push(input.name);
    });
    setPorts(el1, digits);
}
update();
