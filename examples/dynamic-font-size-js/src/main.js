import { elementTools, dia, shapes } from '@joint/core';
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
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' }
});
paperContainer.appendChild(paper.el);

paper.setGrid('mesh');

const ResizeTool = elementTools.Control.extend({
    getPosition: function(view) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    },
    setPosition: function(view, coordinates) {
        const model = view.model;
        model.resize(Math.max(coordinates.x, 1), Math.max(coordinates.y, 1));
    }
});

const rect = new shapes.standard.Rectangle({
    position: { x: 100, y: 100 },
    size: { width: 200, height: 100 },
    attrs: {
        body: {
            strokeWidth: 'calc(s/20)'
        },
        label: {
            fontSize: 'calc(h/2)',
            textWrap: {
                text: 'Dynamic',
                width: -10,
                ellipsis: true
            }
        }
    }
});

rect.addTo(graph);

const toolsView = new dia.ToolsView({
    tools: [
        new ResizeTool({
            selector: 'body',
            handleAttributes: {
                fill: '#4666E5'
            }
        })
    ]
});

rect.findView(paper).addTools(toolsView);
