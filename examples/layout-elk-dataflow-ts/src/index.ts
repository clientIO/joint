import { dia, shapes } from '@joint/core';
import {
    ElkNode,
    ExportElementCallback,
    ExportPortCallback,
    SetElementAttributesCallback,
    createWorkerElk,
    layout
} from '@joint/layout-elk';
import { graphJSON } from './example';
import { Actor, Composite, Edge, Junction, estimateLabelSize } from './shapes';
import './styles.scss';

// Above this scale, everything is shown. Below it, the composites hide their
// sub-models and show their name inside instead.
const FULL_VIEW_THRESHOLD = 0.7;
// Below this scale, the actor labels are hidden too.
const MINIMAL_VIEW_THRESHOLD = 0.4;

const cellNamespace = {
    ...shapes,
    example: {
        Actor,
        Composite,
        Edge,
        Junction
    }
};

const PORT_SIDES: Record<string, 'NORTH' | 'EAST' | 'SOUTH' | 'WEST'> = {
    north: 'NORTH',
    east: 'EAST',
    south: 'SOUTH',
    west: 'WEST'
};

// ELK runs in a Web Worker, so the layout doesn't block the page.
const elk = createWorkerElk(() => new Worker(new URL('@joint/layout-elk/worker', import.meta.url), { type: 'module' }));

const init = () => {

    const graph = new dia.Graph({}, { cellNamespace });
    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: cellNamespace,
        width: 1000,
        height: 600,
        gridSize: 1,
        interactive: false,
        async: true,
        frozen: true,
        viewManagement: true,
        background: { color: '#F3F7F6' },
        cellVisibility: (cell) => {
            if (paper.scale().sx > FULL_VIEW_THRESHOLD) return true;
            // Zoomed out - only the top level of the model is shown.
            if (cell.isLink()) {
                return !cell.getSourceCell()?.isEmbedded() && !cell.getTargetCell()?.isEmbedded();
            }
            return !cell.isEmbedded() && cell.get('type') !== 'example.Junction';
        }
    });
    document.getElementById('canvas')!.appendChild(paper.el);

    graph.fromJSON(graphJSON);

    // ELK places each port along the side its group names, in the order of
    // `ports.items`, rather than where the port group puts it.
    const exportElement: ExportElementCallback = ({ element, elkNode }) => {
        elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_ORDER';
        // JointJS labels are attrs, not layout participants - pass ELK a label of
        // the right size, so it leaves room for it.
        elkNode.labels = [{
            ...estimateLabelSize(element.attr('label/text')),
            layoutOptions: {}
        }];
        elkNode.layoutOptions['elk.nodeLabels.placement'] = ['H_LEFT', 'V_TOP', 'OUTSIDE'];
    };

    const exportPort: ExportPortCallback = ({ portId, element, elkPort }) => {
        const { group } = element.getPort(String(portId));
        elkPort.layoutOptions['elk.port.side'] = PORT_SIDES[group!];
    };

    // Apply the position and size, and move the label to where ELK placed it.
    const setElementAttributes: SetElementAttributesCallback = ({ element, attributes, elkNode }) => {
        element.set(attributes);
        const [label] = elkNode.labels ?? [];
        if (label) {
            element.attr('label', { x: label.x, y: label.y });
        }
        if (element instanceof Composite) {
            element.attr('innerLabel', {
                text: element.attr('label/text'),
                fontSize: element.size().width / 5
            });
        }
    };

    layout(graph, {
        elk,
        exportElement,
        exportPort,
        setElementAttributes
    }).then(({ elkGraph }) => {
        addJunctions(graph, elkGraph);
        paper.unfreeze();
        zoom(paper, 1);
    }).catch((error) => {
        paper.unfreeze();
        console.error('ELK layout error:', error.message);
    });

    addZoomListeners(paper);
};

// Junction points are not mapped back onto the graph - read them from the raw ELK
// result. Every edge coordinate is relative to the root (see the README of
// `@joint/layout-elk`), so they need no conversion.
function addJunctions(graph: dia.Graph, elkNode: ElkNode): void {
    elkNode.edges?.forEach((edge) => {
        edge.junctionPoints?.forEach(({ x, y }) => {
            const junction = new Junction();
            const { width, height } = junction.size();
            junction.position(x - width / 2, y - height / 2);
            junction.addTo(graph);
        });
    });
    elkNode.children?.forEach((child) => addJunctions(graph, child));
}

function zoom(paper: dia.Paper, zoomLevel: number): void {
    paper.scale(zoomLevel);
    paper.el.classList.toggle('full-view', zoomLevel > FULL_VIEW_THRESHOLD);
    paper.el.classList.toggle('minimal-view', zoomLevel < MINIMAL_VIEW_THRESHOLD);
    // The visibility depends on the scale - evaluate it again.
    paper.updateCellsVisibility();
    paper.fitToContent({
        useModelGeometry: true,
        padding: 100 * zoomLevel,
        allowNewOrigin: 'any'
    });
}

function addZoomListeners(paper: dia.Paper): void {
    let zoomLevel = 1;

    document.getElementById('zoom-in')!.addEventListener('click', () => {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        zoom(paper, zoomLevel);
    });

    document.getElementById('zoom-out')!.addEventListener('click', () => {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        zoom(paper, zoomLevel);
    });
}

init();
