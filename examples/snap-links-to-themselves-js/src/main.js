import { linkTools, dia, shapes } from '@joint/core';
import './styles.css';

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 1,
    drawGrid: { name: 'mesh' },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    validateConnection: () => false,
    snapLinksSelf: { radius: 50 }
});

paperContainer.appendChild(paper.el);

function getLinkToolsView() {
    const verticesTool = new linkTools.Vertices();
    const targetArrowheadTool = new linkTools.TargetArrowhead();
    const sourceArrowheadTool = new linkTools.SourceArrowhead();

    return new dia.ToolsView({
        tools: [verticesTool, targetArrowheadTool, sourceArrowheadTool]
    });
}

const link1 = new shapes.standard.Link();

link1.source({ x: 200, y: 100 });
link1.target({ x: 200, y: 300 });
link1.vertices([
    { x: 100, y: 100 },
    { x: 100, y: 200 },
    { x: 200, y: 200 }
]);

const rect = new shapes.standard.Rectangle({
    size: { width: 120, height: 120 },
    position: { x: 400, y: 40 }
});

const link2 = new shapes.standard.Link();
link2.source(rect);
link2.target({ x: 300, y: 100 });

graph.addCells([link1, rect, link2]);

link1.findView(paper).addTools(getLinkToolsView());
link2.findView(paper).addTools(getLinkToolsView());
