import { V, g, dia, shapes, highlighters } from '@joint/core';
import './styles.css';

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
    background: { color: '#F3F7F6' }
});
paperContainer.appendChild(paper.el);

paper.setGrid('mesh');

const rectangle = new shapes.standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(10, 10);
rectangle.attr('label/text', 'Rectangle');
rectangle.addTo(graph);

const circle = new shapes.standard.Circle();
circle.resize(100, 100);
circle.position(160, 10);
circle.attr('label/text', 'Circle');
circle.addTo(graph);

const ellipse = new shapes.standard.Ellipse();
ellipse.resize(150, 100);
ellipse.position(310, 10);
ellipse.attr('label/text', 'Ellipse');
ellipse.addTo(graph);

const path = new shapes.standard.Path();
path.resize(100, 100);
path.position(510, 10);
path.attr('label/text', 'Path');
path.attr(
    'body/d',
    'M 0 calc(0.25 * h) 0 calc(0.75 * h) calc(0.6 * w) calc(h) C calc(1.2 * w) calc(h) calc(1.2 * w) 0 calc(0.6 * w) 0 Z'
);
path.addTo(graph);

class StatusList extends highlighters.list {
    createListItem(color, { width, height }) {
        const { node } = V('ellipse', {
            event: 'element:status:pointerdown',
            cursor: 'default',
            rx: width / 2,
            ry: height / 2,
            cx: width / 2,
            cy: height / 2,
            fill: color,
            stroke: '#333',
            'stroke-width': 2
        });
        return node;
    }
}

graph.getElements().forEach((el) => {
    StatusList.add(el.findView(paper), 'root', 'status', {
        attribute: 'status',
        position: 'top-right',
        margin: { right: 5, top: 5 },
        size: 20,
        gap: 3,
        direction: 'row'
    });
});

const randomColor = () =>
    `#${Math.floor(Math.random() * 16777215).toString(16)}`;

const setRandomStatuses = () => {
    graph.getElements().forEach((el) => {
        const status = Array.from({ length: g.random(1, 4) }).map(() =>
            randomColor()
        );
        el.set('status', status);
    });
};

setInterval(() => setRandomStatuses(), 1000);

setRandomStatuses();
