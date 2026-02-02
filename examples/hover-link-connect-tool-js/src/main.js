import { dia, shapes, linkTools, connectionStrategies } from '@joint/core';
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
    connectionStrategy: connectionStrategies.pinAbsolute
});

paperContainer.appendChild(paper.el);

const rectangle = new shapes.standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(300, 100);
rectangle.addTo(graph);

const link = new shapes.standard.Link();
link.source({ x: 100, y: 100 });
link.target({ x: 400, y: 50 });
link.vertices([{ x: 300, y: 50 }]);
link.addTo(graph);

const tools = new dia.ToolsView({
    tools: [
        new linkTools.HoverConnect(),
        new linkTools.TargetArrowhead(),
        new linkTools.SourceArrowhead(),
        new linkTools.Vertices({ vertexAdding: false })
    ]
});

link.findView(paper).addTools(tools);
