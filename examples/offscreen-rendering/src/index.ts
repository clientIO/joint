import { g, dia, shapes, util, connectionPoints, V } from '@joint/core';

const textMargin = 5;
const shapeRadius = 30;

const cellNamespace = {
    ...shapes,
}

const graph = new dia.Graph({}, {
    cellNamespace: cellNamespace
});

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 800,
    overflow: true,
    model: graph,
    cellViewNamespace: cellNamespace,
    gridSize: 1,
    async: true,
    frozen: true,
    defaultAnchor: {
        name: 'center',
        args: {
            useModelGeometry: true,
        }
    },
    defaultConnectionPoint: {
        name: 'rectangle',
        args: {
            useModelGeometry: true,
        }
    },
    measureNode: (node) => {
        if (node.nodeName === 'text') {
            // TODO: support multiline text
            const fontSize = parseFloat(node.getAttribute('font-size')) || 12;
            const fontFamily = node.getAttribute('font-family') || 'Arial';
            const textAnchor = node.getAttribute('text-anchor') || 'start';
            const { width, height } = measureTextSize(node.textContent, fontSize, fontFamily);
            const bbox = new g.Rect(0, -height / 2, width, height);
            if (textAnchor === 'middle') {
                bbox.x = -bbox.width / 2;
            } else if (textAnchor === 'end') {
                bbox.x = -bbox.width;
            }
            return bbox;
        }
        throw new Error('Unsupported node type');
    }
});

// Text measurement

const canvas = document.createElement('canvas');
const canvasCtx = canvas.getContext('2d');

function measureTextSize(text: string, fontSize: number, fontFamily: string) {
    canvasCtx.font = `${fontSize}px ${fontFamily}`;
    const lines = text.split('\n');
    const maxWidth = Math.max(...lines.map(line => canvasCtx.measureText(line).width));
    const lineHeight = lines.length * (fontSize * 1.2); // 1.2 is a common line height multiplier
    return {
        width: maxWidth,
        height: lineHeight
    };
}

// Text rendering

const r1 = new shapes.standard.Rectangle({
    position: { x: 100, y: 100 },
    size: { width: 140, height: 100 },
    attrs: {
        label: {
            fontSize: 14,
            fontFamily: 'sans-serif',
            text: 'Text wrapping',
        }
    },
});

const r2 = new shapes.standard.Rectangle({
    position: { x: 400, y: 100 },
    size: { width: 140, height: 100 },
    attrs: {
        label: {
            fontSize: 12,
            fontFamily: 'sans-serif',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
            textWrap: {
                width: -10,
                height: -10,
                ellipsis: true,
            }
        }
    },
});

const l1 = new shapes.standard.Link({
    source: { id: r1.id },
    target: { id: r2.id },
    defaultLabel: {
        markup: [{
            tagName: 'rect',
            selector: 'labelBody'
        }, {
            tagName: 'text',
            selector: 'labelText'
        }],
        attrs: {
            labelBody: {
                ref: 'labelText',
                fill: '#fff',
                fillOpacity: 0.9,
                stroke: '#333',
                strokeWidth: 0.5,
                width: `calc(w + ${textMargin * 2})`,
                height: `calc(h + ${textMargin * 2})`,
                x: `calc(x - ${textMargin})`,
                y: `calc(y - ${textMargin})`,
            },
            labelText: {
                fontSize: 12,
                fontFamily: 'sans-serif',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: '#333',
                strokeWidth: 2,
            }
        }
    },
    labels: [{
        position: 0.5,
        attrs: {
            labelText: {
                text: 'Label auto size',
            }
        }
    }]
});

// Ports

const r3 = new shapes.standard.Rectangle({
    position: { x: 100, y: 300 },
    size: { width: 140, height: 100 },
    attrs: {
        label: {
            fontSize: 14,
            fontFamily: 'sans-serif',
            text: 'Ports'
        }
    },
});

const r4 = new shapes.standard.Rectangle({
    position: { x: 400, y: 300 },
    size: { width: 140, height: 100 },
    ports: {
        groups: {
            portGroup1: {
                markup: util.svg`<rect @selector="portBody" />`,
                position: 'left',
                attrs: {
                    portBody: {
                        x: '-calc(w / 2)',
                        y: '-calc(h / 2)',
                        width: 'calc(w)',
                        height: 'calc(h)',
                        fill: '#fff',
                        stroke: '#333',
                        strokeWidth: 0.5,
                    }
                },
                // Use `useModelGeometry` on `anchor` and `connectionPoint` and
                // set the `size` of each port, so the link shape can be
                // calculated using the port's geometry.
                // Note: The ports origin is always the center of the port.
                // -- hence the `x` and `y` attributes are set to `-calc(w / 2)` and
                // `-calc(h / 2)`.
                size: { width: 20, height: 20 },
            }
        },
        items: [{
            id: 'port1',
            group: 'portGroup1',
        }]
    }
});

const l2 = new shapes.standard.Link({
    source: { id: r3.id },
    target: { id: r4.id, port: 'port1' },
});

// Precise connection point

const r5 = new shapes.standard.Rectangle({
    position: { x: 100, y: 500 },
    size: { width: 140, height: 100 },
    attrs: {
        label: {
            fonSize: 14,
            fontFamily: 'sans-serif',
            text: 'Precise\nConnection point'
        }
    },
});

const r6 = new shapes.standard.Rectangle({
    position: { x: 400, y: 500 },
    size: { width: 140, height: 100 },
    attrs: {
        body: {
            rx: shapeRadius,
            ry: shapeRadius,
        }
    },
});

// Calculate the connection point as an intersection of the link and
// the geometric representation of the element.
// One needs to avoid using the `getBBox` method of the element,
// because it returns zero-sized bounding boxes for elements
// that are not in the DOM render tree (although the specification
// says otherwise).
paper.options.connectionPointNamespace = {
    ...connectionPoints,
    'rounded-rectangle': function(line, elementView) {
        const d = V.rectToPath({
            ...elementView.model.getBBox().toJSON(),
            rx: shapeRadius,
            ry: shapeRadius,
        });
        const path = new g.Path(V.normalizePathData(d));
        const intersections = path.intersectionWithLine(line);
        if (!intersections) return null;
        return intersections[0];
    }
}

const l3 = new shapes.standard.Link({
    source: { id: r5.id },
    target: {
        id: r6.id,
        connectionPoint: {
            name: 'rounded-rectangle',
        },
    },
});

// Add examples to the graph
graph.addCells([
    r1, r2, l1,
    r3, r4, l2,
    r5, r6, l3,
]);

// Resize the paper to fit the content using the model geometry.
paper.fitToContent({ useModelGeometry: true, padding: 20 });

// Start the offscreen rendering
paper.el.style.display = 'none';

paper.unfreeze({
    afterRender: () => {
        paper.el.style.display = 'block';
        // remove the `afterRender` callback
        paper.unfreeze();
    }
});



