import { dia, routers } from 'jointjs';
import { Node, cellNamespace } from './shapes';
import { ExpandButton, NodePlaceholder, toggleCellAlert } from './shapes/highlighters';
import { multiLinkAnchor } from './shapes/anchors';
import { isCellHidden, setCellVisibility } from './shapes/utils';
import { BG_COLOR, NODE_HEIGHT, NODE_MARGIN_VERTICAL } from './theme';
import { Monitor } from './Monitor';
import { load } from './data';
import { layout } from './layout';
import data from './examples/example1';

import '../style.css';
import 'jointjs/dist/joint.css';

const graph = new dia.Graph({}, { cellNamespace });

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    interactive: false,
    cellViewNamespace: cellNamespace,
    background: { color: 'transparent' },
    defaultConnectionPoint: { name: 'boundary', args: { offset: 3 }},
    defaultConnector: { name: 'straight', args: { cornerType: 'line', cornerRadius: 6 }},
    defaultRouter: function(_vertices, _opt, linkView) {
        const link = linkView.model;
        const source = link.getSourceCell();
        const target = link.getTargetCell();
        if ((source && isCellHidden(source)) || (target && isCellHidden(target))) {
            // Use straight line if either source or target is hidden
            return [];
        }
        return routers.rightAngle([], { margin: 10 }, linkView);
    },
    defaultAnchor: multiLinkAnchor,
    viewport: (view: dia.CellView) => !isCellHidden(view.model)
});

document.body.style.setProperty('--bg-color', BG_COLOR);

paper.on('node:collapse', (elementView: dia.ElementView, evt) => {
    evt.stopPropagation();
    const node = elementView.model as Node;
    const collapsed = node.toggleCollapse();
    node.getEmbeddedCells().forEach((child) => setCellVisibility(child, !collapsed));
    resizePaper(paper, layout(graph));
});

// Setup scrolling

paper.on('blank:pointerdown', (evt) => {
    evt.data = { scrollX: window.scrollX, clientX: evt.clientX };
});

paper.on('blank:pointermove', (evt) => {
    // Scroll little faster than the mouse (3x)
    window.scroll(evt.data.scrollX + (evt.data.clientX - evt.clientX) * 3, 0);
});

// Load example data
load(graph, data);
resizePaper(paper, layout(graph));

// Add collapse buttons and placeholder images to the node element views
graph.getElements().forEach((element) => {
    if (!Node.isNode(element)) return;
    const nodeView = paper.findViewByModel(element);
    NodePlaceholder.add(nodeView, 'body', `placeholder-image`);
    ExpandButton.add(nodeView, 'header', 'expand-button');
});

// Start monitoring
const monitor = new Monitor(graph);
monitor.subscribe(({ cell, port, resolved }) => {
    toggleCellAlert(cell.findView(paper), { port }, !resolved);
});

// Set the size of the paper to fit the graph
function resizePaper(paper: dia.Paper, width: number) {
    const { offsetHeight, offsetWidth } = document.body;
    const height = NODE_HEIGHT + 2 * NODE_MARGIN_VERTICAL + Node.HEADER_HEIGHT;
    paper.setDimensions(Math.max((offsetHeight / height) * width, offsetWidth), '100%');
    paper.transformToFitContent({
        verticalAlign: 'middle',
        contentArea: { x: 0, y: 0, width, height }
    });
}
