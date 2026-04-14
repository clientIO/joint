import { V, dia, shapes as defaultShapes, anchors, util } from '@joint/core';
import './styles.css';

class Shape extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'Shape',
            size: {
                width: 120,
                height: 60
            },
            attrs: {
                root: {
                    cursor: 'move'
                },
                body: {
                    fill: '#f2f1ed',
                    stroke: '#4b557d',
                    strokeWidth: 2,
                    d:
                        'M 0 calc(h) H calc(w) V 4 a 4 4 1 0 0 -4 -4 H 4 a 4 4 1 0 0 -4 4 z M 0 calc(h-4) H calc(w)'
                },
                label: {
                    text: 'Custom shape with dynamic port size',
                    textWrap: { width: -20, height: -10, ellipsis: true },
                    fontSize: 15,
                    fontFamily: 'sans-serif',
                    fill: '#4b557d',
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    x: 'calc(0.5*w)',
                    y: 'calc(0.5*h-2)'
                }
            },
            ports: {
                groups: {
                    out: {
                        z: -1,
                        position: 'absolute',
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
                                width: 'calc(w)',
                                height: 'calc(h + 4)',
                                fill: '#7088eb',
                                stroke: '#4666E5',
                                strokeWidth: 2,
                                rx: 4,
                                ry: 5,
                                y: -4,
                                magnet: true,
                                cursor: 'crosshair'
                            },
                            portLabel: {
                                x: 'calc(0.5 * w)',
                                y: 'calc(0.5 * h)',
                                textAnchor: 'middle',
                                textVerticalAnchor: 'middle',
                                textWrap: {
                                    width: -this.portPadding / 2,
                                    ellipsis: true
                                },
                                pointerEvents: 'none',
                                fill: '#ffffff',
                                ...this.portFontAttributes
                            }
                        }
                    }
                }
            }
        };
    }

    preinitialize() {
        this.minWidth = 100;
        this.portPadding = 10;
        this.portGap = 10;
        this.portHeight = 20;
        this.portFontAttributes = {
            'font-size': 14,
            'font-family': 'sans-serif'
        };
        this.markup = [
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

    initialize() {
        super.initialize();
        if (!this.constructor.svgDocument) {
            throw new Error('SVG Document not provided.');
        }
        this.on('change', this.onAttributeChange);
        this.setOutPorts();
    }

    onAttributeChange(change, opt) {
        if (opt.shape === this.id) return;
        if ('outPorts' in this.changed) {
            this.setOutPorts();
        }
    }

    measureText(svgDocument, text, attrs) {
        const vText = V('text').attr(attrs).text(text);
        vText.appendTo(svgDocument);
        const bbox = vText.getBBox();
        vText.remove();
        return bbox;
    }

    setOutPorts(opt = {}) {
        const {
            attributes,
            portPadding,
            portGap,
            portHeight,
            portFontAttributes,
            minWidth,
            constructor
        } = this;
        const { outPorts = [], size, ports } = attributes;
        let x = 0;
        const items = outPorts.map((port) => {
            const { id, label = 'Port' } = port;
            let { width } = this.measureText(
                constructor.svgDocument,
                label,
                portFontAttributes
            );
            width += 2 * portPadding;
            const item = {
                id,
                group: 'out',
                size: { width, height: portHeight },
                args: { x, y: '100%' },
                attrs: {
                    portLabel: {
                        text: label
                    }
                }
            };
            x += width + portGap;
            return item;
        });
        this.set(
            {
                ports: {
                    ...ports,
                    items
                },
                size: {
                    ...size,
                    width: Math.max(x - portGap, minWidth)
                }
            },
            { ...opt, shape: this.id }
        );
    }

    addOutPort(port, opt = {}) {
        const { outPorts = [] } = this.attributes;
        this.set('outPorts', [...outPorts, port], opt);
    }

    removeLastOutPort(opt = {}) {
        const { outPorts = [] } = this.attributes;
        this.set('outPorts', outPorts.slice(0, outPorts.length - 1), opt);
    }

    static svgDocument = null;
}

const shapes = { ...defaultShapes, Shape };

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 20,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    linkPinning: false,
    defaultLink: () =>
        new shapes.standard.Link({
            attrs: {
                line: {
                    stroke: '#4666E5'
                }
            }
        }),
    validateConnection: (sv, _, tv) => {
        if (sv.model.isLink() || tv.model.isLink()) return false;
        return sv !== tv;
    },
    defaultConnectionPoint: { name: 'anchor' },
    defaultAnchor: (view, magnet, ...rest) => {
        const anchorFn = view.model instanceof Shape ? anchors.bottom : anchors.top;
        return anchorFn(view, magnet, ...rest);
    },
    defaultConnector: {
        name: 'curve'
    }
});
paperContainer.appendChild(paper.el);

paper.setGrid('mesh');

Shape.svgDocument = paper.svg;

const words = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed convallis lacinia nibh. Sed posuere felis sit amet porttitor sollicitudin. Sed lorem felis, semper at volutpat eget, accumsan mollis quam. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nullam volutpat sodales sapien, et iaculis mauris pulvinar vel. Fusce in interdum nisi. Donec vel ultricies lectus. Suspendisse mi nisl, vulputate sed scelerisque quis, porttitor ut enim. Praesent augue ligula, interdum sit amet pulvinar ac, tincidunt ut dolor. Vivamus luctus eget ipsum ac eleifend. Suspendisse lorem enim, hendrerit in semper in, porttitor id nulla. Pellentesque iaculis risus ac purus efficitur, id elementum velit hendrerit. Ut nisl mi, ornare eu consectetur congue, placerat at nulla.'.split(
    ' '
);

function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)];
}

function getRandomPort() {
    return {
        id: util.uuid(),
        label: getRandomWord()
    };
}

const shape = new Shape({
    outPorts: [getRandomPort(), getRandomPort(), getRandomPort()]
});

shape.position(100, 100).addTo(graph);

const target = new shapes.standard.Ellipse({
    size: { width: 50, height: 50 },
    attrs: {
        root: {
            highlighterSelector: 'body'
        },
        body: {
            stroke: '#705d10',
            fill: '#efdc8f'
        }
    }
});
target.position(150, 300).addTo(graph);

document.getElementById('add-port').addEventListener('click', () => {
    shape.addOutPort(getRandomPort());
});

document.getElementById('remove-port').addEventListener('click', () => {
    shape.removeLastOutPort();
});
