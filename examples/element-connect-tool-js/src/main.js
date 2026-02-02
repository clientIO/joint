import { dia, shapes, elementTools } from '@joint/core';
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
    background: { color: '#F3F7F6' },
    defaultLink: () => new shapes.standard.Link(),
    connectionStrategy: function(end, view, _magnet, coords) {
        end.anchor = {
            name: view.model.getBBox().sideNearestToPoint(coords)
        };
    }
});

paperContainer.appendChild(paper.el);

const rectangle = new shapes.standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(100, 100);
rectangle.addTo(graph);

function getMarkup(angle = 0) {
    return [
        {
            tagName: 'circle',
            selector: 'button',
            attributes: {
                r: 7,
                fill: '#4666E5',
                stroke: '#FFFFFF',
                cursor: 'pointer'
            }
        },
        {
            tagName: 'path',
            selector: 'icon',
            attributes: {
                transform: `rotate(${angle})`,
                d: 'M -4 -1 L 0 -1 L 0 -4 L 4 0 L 0 4 0 1 -4 1 z',
                fill: '#FFFFFF',
                stroke: 'none',
                'stroke-width': 2,
                'pointer-events': 'none'
            }
        }
    ];
}

const connectRight = new elementTools.Connect({
    x: '100%',
    y: '50%',
    markup: getMarkup(0)
});

const connectBottom = new elementTools.Connect({
    x: '50%',
    y: '100%',
    markup: getMarkup(90)
});
const connectTop = new elementTools.Connect({
    x: '50%',
    y: '0%',
    markup: getMarkup(270)
});
const connectLeft = new elementTools.Connect({
    x: '0%',
    y: '50%',
    markup: getMarkup(180)
});

const tools = new dia.ToolsView({
    tools: [connectRight, connectLeft, connectTop, connectBottom]
});

rectangle.findView(paper).addTools(tools);

rectangle.clone().position(300, 100).addTo(graph);
