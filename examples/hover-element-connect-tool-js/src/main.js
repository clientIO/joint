import { dia, shapes, elementTools, connectionStrategies } from '@joint/core';
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
    background: { color: '#F3F7F6' },
    defaultLink: () => new shapes.standard.Link(),
    validateConnection: (srcView, _, tgtView) => {
        const src = srcView.model;
        const tgt = tgtView.model;
        if (src.isLink() || tgt.isLink()) return false;
        if (src === tgt) return false;
        return true;
    },
    defaultConnectionPoint: { name: 'anchor' },
    connectionStrategy: (end, view, magnet, coords) => {
        const bbox = view.getNodeUnrotatedBBox(magnet);
        const p = bbox.pointNearestToPoint(coords);
        return connectionStrategies.pinRelative(end, view, magnet, p);
    },
    snapLinks: { radius: 10 },
    linkPinning: false
});
paperContainer.appendChild(paper.el);

paper.setGrid('mesh');

const rectangle = new shapes.standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(200, 100);
rectangle.addTo(graph);

const tools = new dia.ToolsView({
    tools: [new elementTools.HoverConnect()]
});

rectangle.findView(paper).addTools(tools);

const rectangle2 = new shapes.standard.Rectangle();
rectangle2.resize(100, 100);
rectangle2.position(400, 100);
rectangle2.addTo(graph);

const tools2 = new dia.ToolsView({
    tools: [new elementTools.HoverConnect()]
});

rectangle2.findView(paper).addTools(tools2);
