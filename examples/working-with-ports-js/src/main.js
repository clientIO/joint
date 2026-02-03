import { dia, shapes, connectors, anchors, linkTools } from '@joint/core';
import './styles.scss';

const paperContainer = document.getElementById('paper-container');
const logsContainer = document.getElementById('logs-container');

class Shape extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'Shape',
            size: { width: 140, height: 140 },
            attrs: {
                root: {
                    magnet: false,
                    cursor: 'move'
                },
                background: {
                    fill: '#0057ff',
                    width: 'calc(w)',
                    height: 'calc(h)',
                    opacity: 0.1
                },
                body: {
                    stroke: '#333333',
                    fill: '#fff',
                    strokeWidth: 2,
                    d:
                        'M 0 0 H calc(w) V calc(h) H 0 Z M 20 20 V calc(h-20) H calc(w-20) V 20 Z'
                },
                label: {
                    x: 'calc(0.5 * w)',
                    y: 'calc(h - 10)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 13,
                    fontFamily: 'sans-serif'
                }
            },
            portMarkup: [
                {
                    tagName: 'path',
                    selector: 'portBody',
                    attributes: {
                        fill: '#FFFFFF',
                        stroke: '#333333',
                        'stroke-width': 2
                    }
                }
            ],
            portLabelMarkup: [
                {
                    tagName: 'rect',
                    selector: 'portLabelBackground'
                },
                {
                    tagName: 'text',
                    selector: 'portLabel',
                    attributes: {
                        fill: '#333333'
                    }
                }
            ],
            ports: {
                groups: {
                    in: {
                        position: 'left',
                        label: {
                            position: {
                                name: 'outside',
                                args: {
                                    offset: 30
                                }
                            }
                        },
                        size: { width: 20, height: 20 },
                        attrs: {
                            portLabelBackground: {
                                ref: 'portLabel',
                                fill: '#FFFFFF',
                                fillOpacity: 0.7,
                                x: 'calc(x - 2)',
                                y: 'calc(y - 2)',
                                width: 'calc(w + 4)',
                                height: 'calc(h + 4)',
                                pointerEvents: 'none'
                            },
                            portLabel: {
                                fontFamily: 'sans-serif',
                                pointerEvents: 'none'
                            },
                            portBody: {
                                d:
                                    'M 0 -calc(0.5 * h) h -calc(w) l 3 calc(0.5 * h) l -3 calc(0.5 * h) H 0 A calc(0.5 * h) calc(0.5 * h) 1  1 0 0 -calc(0.5 * h) Z',
                                magnet: 'active'
                            }
                        }
                    },
                    out: {
                        position: 'right',
                        label: {
                            position: {
                                name: 'outside',
                                args: {
                                    offset: 30
                                }
                            }
                        },
                        size: { width: 20, height: 20 },
                        attrs: {
                            portLabelBackground: {
                                ref: 'portLabel',
                                fill: '#FFFFFF',
                                fillOpacity: 0.8,
                                x: 'calc(x - 2)',
                                y: 'calc(y - 2)',
                                width: 'calc(w + 4)',
                                height: 'calc(h + 4)',
                                pointerEvents: 'none'
                            },
                            portLabel: {
                                fontFamily: 'sans-serif',
                                pointerEvents: 'none'
                            },
                            portBody: {
                                d:
                                    'M 0 -calc(0.5 * h) h calc(w) l 3 calc(0.5 * h) l -3 calc(0.5 * h) H 0 A calc(0.5 * h) calc(0.5 * h) 1  1 1 0 -calc(0.5 * h) Z',
                                magnet: 'active'
                            }
                        }
                    }
                }
            }
        };
    }

    preinitialize() {
        this.markup = [
            {
                tagName: 'rect',
                selector: 'background'
            },
            {
                tagName: 'path',
                selector: 'body'
            },
            {
                tagName: 'text',
                selector: 'label'
            }
        ];
    }
}

let linkIdCounter = 0;

const shapeNamespace = { ...shapes, Shape };
const graph = new dia.Graph({}, { cellNamespace: shapeNamespace });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapeNamespace,
    width: '100%',
    height: '100%',
    gridSize: 1,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    interactive: {
        // label move is disabled by default
        labelMove: true
    },
    defaultLink: () => {
        const linkIdNumber = ++linkIdCounter;
        return new shapes.standard.DoubleLink({
            id: `link${linkIdNumber}`,
            z: -1,
            attrs: {
                line: {
                    stroke: '#fff',
                    strokeWidth: 14,
                    targetMarker: null
                },
                outline: {
                    strokeWidth: 18
                }
            },
            labels: [
                {
                    attrs: {
                        text: {
                            text: ` Link ${linkIdNumber} `,
                            fontFamily: 'sans-serif',
                            fontSize: 10
                        },
                        rect: {
                            fillOpacity: 0.9
                        }
                    },
                    position: {
                        args: {
                            keepGradient: true,
                            ensureLegibility: true
                        }
                    }
                }
            ]
        });
    },
    defaultConnectionPoint: { name: 'anchor' },
    defaultAnchor: (view, magnet, ...rest) => {
        const group = view.findAttribute('port-group', magnet);
        const anchorFn = group === 'in' ? anchors.left : anchors.right;
        return anchorFn(view, magnet, ...rest);
    },
    defaultConnector: {
        name: 'curve',
        args: {
            sourceDirection: connectors.curve.TangentDirections.RIGHT,
            targetDirection: connectors.curve.TangentDirections.LEFT
        }
    },
    validateMagnet: (sourceView, sourceMagnet) => {
        const sourceGroup = sourceView.findAttribute('port-group', sourceMagnet);
        const sourcePort = sourceView.findAttribute('port', sourceMagnet);
        const source = sourceView.model;

        if (sourceGroup !== 'out') {
            log(
                'paper<validateMagnet>',
                'It\'s not possible to create a link from an inbound port.'
            );
            return false;
        }

        if (
            graph
                .getConnectedLinks(source, { outbound: true })
                .find((link) => link.source().port === sourcePort)
        ) {
            log(
                'paper<validateMagnet>',
                'The port has already an inbound link (we allow only one link per port)'
            );
            return false;
        }

        return true;
    },
    validateConnection: (sourceView, sourceMagnet, targetView, targetMagnet) => {
        if (sourceView === targetView) {
            // Do not allow a loop link (starting and ending at the same element)/
            return false;
        }

        const targetGroup = targetView.findAttribute('port-group', targetMagnet);
        const targetPort = targetView.findAttribute('port', targetMagnet);
        const target = targetView.model;

        if (target.isLink()) {
            // We allow connecting only links with elements (not links with links).
            return false;
        }

        if (targetGroup !== 'in') {
            // It's not possible to add inbound links to output ports (only outbound links are allowed).
            return false;
        }

        if (
            graph
                .getConnectedLinks(target, { inbound: true })
                .find((link) => link.target().port === targetPort)
        ) {
            // The port has already an inbound link (we allow 1 link per port inbound port)
            return false;
        }

        // This is a valid connection.
        return true;
    },
    clickThreshold: 10,
    magnetThreshold: 'onleave',
    linkPinning: false,
    snapLinks: { radius: 20 },
    snapLabels: true,
    markAvailable: true,
    highlighting: {
        connecting: {
            name: 'mask',
            options: {
                layer: dia.Paper.Layers.BACK,
                attrs: {
                    stroke: '#0057FF',
                    'stroke-width': 3
                }
            }
        }
    }
});

paperContainer.appendChild(paper.el);

const s1 = new Shape({
    id: 'element1',
    position: { x: 50, y: 50 },
    attrs: {
        label: {
            text: 'Element 1'
        }
    },
    ports: {
        items: [
            {
                id: 'out1',
                group: 'out',
                attrs: {
                    portLabel: {
                        text: 'Out 1'
                    }
                }
            },
            {
                id: 'out2',
                group: 'out',
                attrs: {
                    portLabel: {
                        text: 'Out 2'
                    }
                }
            },
            {
                id: 'out3',
                group: 'out',
                attrs: {
                    portLabel: {
                        text: 'Out 3'
                    }
                }
            }
        ]
    }
});

const s2 = new Shape({
    id: 'element2',
    position: { x: 380, y: 50 },
    attrs: {
        label: {
            text: 'Element 2'
        }
    },
    ports: {
        items: [
            {
                id: 'in1',
                group: 'in',
                attrs: {
                    portLabel: {
                        text: 'In 1'
                    }
                }
            },
            {
                id: 'in2',
                group: 'in',
                attrs: {
                    portLabel: {
                        text: 'In 2'
                    }
                }
            },
            {
                id: 'in3',
                group: 'in',
                attrs: {
                    portLabel: {
                        text: 'In 3'
                    }
                }
            },
            {
                id: 'in4',
                group: 'in',
                attrs: {
                    portLabel: {
                        text: 'In 4'
                    }
                }
            },
            {
                id: 'out1',
                group: 'out',
                attrs: {
                    portLabel: {
                        text: 'Out 1'
                    }
                }
            }
        ]
    }
});

const s3 = new Shape({
    id: 'element3',
    position: { x: 380, y: 270 },
    attrs: {
        label: {
            text: 'Element 3'
        }
    },
    ports: {
        items: [
            {
                id: 'in1',
                group: 'in',
                attrs: {
                    portLabel: {
                        text: 'In 1'
                    }
                }
            },
            {
                id: 'in2',
                group: 'in',
                attrs: {
                    portLabel: {
                        text: 'In 2'
                    }
                }
            }
        ]
    }
});

graph.addCells([s1, s2, s3]);

// Link Tools

class PortTargetArrowhead extends linkTools.TargetArrowhead {
    preinitialize() {
        this.tagName = 'rect';
        this.attributes = {
            width: 20,
            height: 14,
            x: 6,
            y: -7,
            rx: 7,
            ry: 7,
            fill: '#FD0B88',
            'fill-opacity': 0.2,
            stroke: '#FD0B88',
            'stroke-width': 2,
            cursor: 'move',
            class: 'target-arrowhead'
        };
    }
}

let timer;
let lastView;

paper.on('link:mouseenter', (linkView) => {
    clearTimeout(timer);
    clearTools();
    lastView = linkView;
    linkView.addTools(
        new dia.ToolsView({
            name: 'onhover',
            tools: [
                new PortTargetArrowhead(),
                new linkTools.Remove({
                    distance: -60,
                    markup: [
                        {
                            tagName: 'circle',
                            selector: 'button',
                            attributes: {
                                r: 10,
                                fill: '#FFD5E8',
                                stroke: '#FD0B88',
                                'stroke-width': 2,
                                cursor: 'pointer'
                            }
                        },
                        {
                            tagName: 'path',
                            selector: 'icon',
                            attributes: {
                                d: 'M -4 -4 4 4 M -4 4 4 -4',
                                fill: 'none',
                                stroke: '#333',
                                'stroke-width': 3,
                                'pointer-events': 'none'
                            }
                        }
                    ]
                })
            ]
        })
    );
});

paper.on('link:mouseleave', (linkView) => {
    timer = setTimeout(() => clearTools(), 500);
});

function clearTools() {
    if (!lastView) return;
    lastView.removeTools();
    lastView = null;
}

// Events

paper.on('link:connect', (linkView) => {
    const link = linkView.model;
    const source = link.source();
    const target = link.target();
    log(
        'paper<link:connect>',
        `
     ${link.id} now goes from
    ${source.port}
    of
    ${source.id}
    to port
    ${target.port}
    of
    ${target.id}.
    `
    );
});

paper.on('link:disconnect', (linkView, evt, prevElementView, prevMagnet) => {
    const link = linkView.model;
    const prevPort = prevElementView.findAttribute('port', prevMagnet);
    log(
        'paper<link:disconnect>',
        `
    ${link.id} disconnected from port
    ${prevPort}
    of
    ${prevElementView.model.id}.
    `
    );
});

graph.on('remove', (cell) => {
    if (!cell.isLink()) return;
    const source = cell.source();
    const target = cell.target();
    if (!target.id) {
        linkIdCounter--;
        return;
    }
    log(
        'graph<remove>',
        `${cell.id} between
    ${source.port}
    of
    ${source.id}
    and
    ${target.port}
    of
    ${target.id} was removed.
    `
    );
});

function log(event, text) {
    const eventEl = document.createElement('div');
    eventEl.classList.add('log-event');
    eventEl.textContent = event;
    logsContainer.appendChild(eventEl);
    const textEl = document.createElement('div');
    textEl.classList.add('log-text');
    textEl.textContent = text;
    logsContainer.appendChild(textEl);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}
