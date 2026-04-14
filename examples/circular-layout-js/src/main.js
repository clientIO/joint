import { g, dia, shapes, util } from '@joint/core';
import './styles.css';

const width = 100;
const height = 80;

const graph = new dia.Graph(
    {},
    {
        cellNamespace: shapes
    }
);

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    cellViewNamespace: shapes,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    interactive: false,
    defaultConnectionPoint: {
        name: 'rectangle'
    },
    background: { color: '#F3F7F6' }
});

paper.unfreeze();

function circularLayout(elements, options = {}) {
    const count = elements.length;
    if (count < 2) return null;

    const { x = 0, y = 0, gap = 0, rotate = false } = options;
    const { width, height } = elements[0].size();

    const deg180 = Math.PI;
    const deg90 = deg180 / 2;
    const alpha = deg180 / count;
    const size = rotate
        ? // the bottom side of the element is facing the center of the circle
        width
        : // use the diagonal of the rectangle as the largest dimension of the rectangle
        // to make sure that the elements fit along the circle
        Math.sqrt(width ** 2 + height ** 2);
    const b = (size + gap) / 2;
    const c = b / Math.sin(alpha);
    const bbox = new g.Rect(x, y, c * 2, c * 2);
    const center = bbox.center();
    const points = [];

    for (let i = 0; i < count; i++) {
        const beta = 2 * alpha * i - deg90;
        const x = center.x + c * Math.cos(beta);
        const y = center.y + c * Math.sin(beta);
        const point = new g.Point(x, y);
        points.push(point);
    }

    for (let i = 0; i < count; i++) {
        const element = elements[i];
        const beta = 2 * alpha * i;
        const edge = new g.Line(points[i], points[(i + 1) % count]);
        const point = edge.midpoint();
        point.move(center, height / 2);
        element.position(point.x - width / 2, point.y - height / 2);
        if (rotate) {
            const angle = g.toDeg(beta + alpha);
            // Make sure the text is always readable.
            const legibleAngle = g.normalizeAngle(((angle + 90) % 180) - 90);
            element.rotate(legibleAngle, true);
        }
    }

    return bbox;
}

const templateElement = new shapes.standard.Rectangle({
    size: {
        width,
        height
    },
    attrs: {
        body: {
            strokeWidth: 2
        },
        label: {
            fontFamily: 'sans-serif',
            fontSize: 20
        }
    }
});

function generate(count, options) {
    const root = templateElement.clone().prop({
        attrs: {
            body: {
                fill: '#ff9580'
            },
            label: {
                text: 'Circular\nLayout'
            }
        }
    });

    const colorFn = util.interpolate.hexColor('#00879b', '#80eaff');
    const els = Array.from({ length: count }).map((_, index) => {
        return templateElement.clone().prop({
            attrs: {
                body: {
                    fill: colorFn(index / count)
                },
                label: {
                    text: `${index + 1}`
                }
            }
        });
    });

    const links = els.map((el) => {
        return new shapes.standard.Link({
            source: {
                id: root.id
            },
            target: {
                id: el.id
            }
        });
    });

    graph.resetCells([root, ...els, ...links]);

    const bbox = circularLayout(els, options);

    if (bbox) {
        const center = bbox.center();
        root.position(center.x - width / 2, center.y - height / 2);
    }
    paper.fitToContent({
        useModelGeometry: true,
        padding: 20,
        allowNewOrigin: 'any'
    });
}

function readInputs() {
    const count = Number(document.getElementById('count').value);
    const gap = Number(document.getElementById('gap').value);
    const rotate = document.getElementById('rotate').checked;
    generate(count, { gap, rotate });
}

const debouncedReadInputs = util.debounce(readInputs, 10);

document.getElementById('count').addEventListener('input', debouncedReadInputs);
document.getElementById('gap').addEventListener('input', debouncedReadInputs);
document
    .getElementById('rotate')
    .addEventListener('change', debouncedReadInputs);

readInputs();
