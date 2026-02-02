import { dia, shapes, elementTools } from '@joint/core';
import './styles.css';
import resizeIcon from '../assets/resize.svg';

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

const ResizeTool = elementTools.Control.extend({
    children: [
        {
            tagName: 'image',
            selector: 'handle',
            attributes: {
                cursor: 'pointer',
                width: 20,
                height: 20,
                'xlink:href': resizeIcon
            }
        },
        {
            tagName: 'rect',
            selector: 'extras',
            attributes: {
                'pointer-events': 'none',
                fill: 'none',
                stroke: '#33334F',
                'stroke-dasharray': '2,4',
                rx: 5,
                ry: 5
            }
        }
    ],
    getPosition: function(view) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    },
    setPosition: function(view, coordinates) {
        const model = view.model;
        model.resize(
            Math.max(coordinates.x - 10, 1),
            Math.max(coordinates.y - 10, 1)
        );
    }
});

const rectangle = new shapes.standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(100, 100);
rectangle.addTo(graph);
rectangle.findView(paper).addTools(
    new dia.ToolsView({
        tools: [
            new ResizeTool({
                selector: 'body'
            })
        ]
    })
);
