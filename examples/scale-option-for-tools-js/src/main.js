import { linkTools, elementTools, dia, shapes } from '@joint/core';
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
    linkPinning: false,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    defaultLink: () => new shapes.standard.Link()
});

paperContainer.appendChild(paper.el);

const defaultScale = 1;
const scaleValueSpan = document.querySelector('#scale-value');
const scaleRange = document.querySelector('#scale-range');

scaleRange.addEventListener('input', ({ target: { value }}) =>
    setScaleValue(value)
);

const rect1 = new shapes.standard.Rectangle({
    size: { width: 100, height: 100 },
    position: { x: 100, y: 100 }
});
const rect2 = rect1.clone().position(500, 100);
const link = new shapes.standard.Link();
link.source(rect1);
link.target(rect2);

graph.addCells([rect1, rect2, link]);

function addElementTools(element, scale) {
    const connectTool = new elementTools.Connect({
        scale,
        x: 'calc(w)',
        y: 'calc(h)',
        magnet: 'body'
    });

    element.findView(paper).addTools(
        new dia.ToolsView({
            tools: [connectTool]
        })
    );
}

function addLinkTools(link, scale) {
    const verticesTool = new linkTools.Vertices({ scale });
    const targetArrowheadTool = new linkTools.TargetArrowhead({ scale });
    const targetAnchorTool = new linkTools.TargetAnchor({ scale });
    const removeTool = new linkTools.Remove({ scale });

    link.findView(paper).addTools(
        new dia.ToolsView({
            tools: [verticesTool, targetArrowheadTool, targetAnchorTool, removeTool]
        })
    );
}

function setScaleValue(value) {
    scaleValueSpan.innerText = value;
    scaleRange.value = value;

    graph.getLinks().forEach((link) => addLinkTools(link, value));
    graph.getElements().forEach((element) => addElementTools(element, value));
}

paper.on('link:connect', (linkView) => {
    if (linkView.hasTools()) return;
    addLinkTools(linkView.model, scaleRange.value);
});

setScaleValue(defaultScale);
