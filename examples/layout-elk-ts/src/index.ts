import { dia, shapes, g } from '@joint/core';
import { layout } from '@joint/layout-elk';
import ELK from 'elkjs/lib/elk-api.js';
import dependenciesJSON from './dependencies.json';
import './styles.scss';

const colors = ['#F8FCDA', '#E3E9C2', '#F9FBB2', '#C89F9C'];
const ELK_DIRECTION = 'RIGHT';
const DEFAULT_LABEL_WIDTH = 50;
const DEFAULT_LABEL_HEIGHT = 20;

const init = () => {

    // Create JointJS graph and paper
    const graph = new dia.Graph({}, { cellNamespace: shapes });
    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: shapes,
        width: 1200,
        height: 800,
        gridSize: 1,
        interactive: false,
        async: true,
        frozen: true,
        defaultConnectionPoint: {
            name: 'anchor'
        },
        defaultConnector: {
            name: 'straight',
            args: {
                cornerType: 'cubic',
                cornerRadius: 5
            }
        }
    });
    document.getElementById('canvas')!.appendChild(paper.el);
    addZoomAndPanListeners(paper);

    // Generate JointJS cells from example data
    generateCells(dependenciesJSON, graph);

    // Run ELK in a Web Worker, via the `@joint/layout-elk` package
    const elk = new ELK({
        workerUrl: '../node_modules/elkjs/lib/elk-worker.js',
    });

    layout(graph, {
        elk,
        layoutOptions: {
            /**
             * Overall direction of the layout.
             * 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
             */
            'elk.direction': ELK_DIRECTION,

            /**
             * Spacing between nodes (siblings).
             * A number value as a string.
             */
            'elk.spacing.nodeNode': '20',

            /**
             * Spacing between layers (for layered algorithm).
             * A number value as a string.
             */
            'elk.layered.spacing.nodeNodeBetweenLayers': '50',

            /**
             * Edge routing style.
             * 'ORTHOGONAL' | 'SPLINES' | 'POLYLINE'
             */
            'elk.edgeRouting': 'ORTHOGONAL',

            /**
             * Node placement strategy for layered layout.
             * 'SIMPLE' | 'BRANDES_KOEPF' | 'INTERACTIVE' | 'LINEAR_SEGMENTS' | 'NETWORK_SIMPLEX'
             */
            'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',

            /**
             * Merging edges that share the same source and target nodes into a single edge.
             * 'true' | 'false'
             */
            'elk.layered.mergeEdges': 'false',

            /**
             * Distance between edge labels and the edge itself.
             * A number value as a string.
             */
            'elk.spacing.edgeLabel': '3',

            /**
             * Enable partitioning i.e., assigning nodes to layers. You need to add
             * `partitioning.partition` attribute to nodes for this to take effect.
             * 'true' | 'false'
             */
            'elk.partitioning.activate': 'false',
        }
    }).then(() => {
        paper.unfreeze();
        zoom(paper, 1);
        // Scroll into a busy area of the example
        window.scroll(650, 560);
    }).catch((error) => {
        console.error('ELK layout error:', error.message);
    });
};

function zoom(paper: dia.Paper, zoomLevel: number): void {
    paper.scale(zoomLevel);
    paper.fitToContent({
        useModelGeometry: true,
        padding: 100 * zoomLevel,
        allowNewOrigin: 'any'
    });
}

/**
 * Add toolbar zoom in/out listeners to the paper and setup panning.
 */
function addZoomAndPanListeners(paper: dia.Paper): void {

    let zoomLevel = paper.scale().sx;

    document.getElementById('zoom-in')!.addEventListener('click', () => {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        zoom(paper, zoomLevel);
    });

    document.getElementById('zoom-out')!.addEventListener('click', () => {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        zoom(paper, zoomLevel);
    });

    paper.on('blank:pointerdown', (evt) => {
        evt.data = {
            scrollX: window.scrollX,
            clientX: evt.clientX,
            scrollY: window.scrollY,
            clientY: evt.clientY
        };
    });

    paper.on('blank:pointermove', (evt) => {
        window.scroll(
            evt.data.scrollX + (evt.data.clientX - evt.clientX),
            evt.data.scrollY + (evt.data.clientY - evt.clientY)
        );
    });
}

/**
 * Create a rectangle element with given id.
 */
function createElement(id: dia.Cell.ID): dia.Element {
    return new shapes.standard.Rectangle({
        id: id,
        size: { width: 100, height: 40 },
        attrs: {
            body: {
                fill: colors[g.random(0, colors.length - 1)],
                stroke: '#333',
                strokeWidth: 2,
                rx: 5,
                ry: 5
            },
            label: {
                text: `${id}`,
                fill: '#333',
                fontSize: 14,
                fontFamily: 'Arial, helvetica, sans-serif'
            }
        }
    });
}

/**
 * Create a link between sourceId and targetId with a label.
 */
function createLink(sourceId: dia.Cell.ID, targetId: dia.Cell.ID): dia.Link {
    return new shapes.standard.Link({
        source: { id: sourceId },
        target: { id: targetId },
        labels: [{
            size: {
                width: DEFAULT_LABEL_WIDTH,
                height: DEFAULT_LABEL_HEIGHT
            },
            attrs: {
                text: {
                    text: `${sourceId} → ${targetId}`,
                    fontSize: 12,
                    fontFamily: 'Arial, helvetica, sans-serif',
                    fill: '#333'
                },
                rect: {
                    ref: null,
                    x: 'calc(x - calc(w / 2))',
                    y: 'calc(y - calc(h / 2))',
                    width: 'calc(w)',
                    height: 'calc(h)',
                    fill: '#FFB7C3',
                    strokeWidth: 1,
                    stroke: '#333'
                },
            },
            position: 0.5
        }]
    });
}

/**
 * Generate cells from simplified link data
 * [{ source: 'sourceId', target: 'targetId' }, ...]
 */
function generateCells(
    dependencies: Array<{ source: dia.Cell.ID, target: dia.Cell.ID }>,
    graph: dia.Graph
): void {
    const elementMap = new Map();
    const cells = [];
    dependencies.forEach((dep) => {
        // The ELK graph uses string IDs
        const sourceId = `${dep.source}`;
        const targetId = `${dep.target}`;
        // Create source and target elements if they do not exist yet
        let sourceRecord = elementMap.get(sourceId);
        if (!sourceRecord) {
            const sourceElement = createElement(sourceId);
            sourceRecord = [sourceElement, 1];
            cells.push(sourceElement);
            elementMap.set(sourceId, sourceRecord);
        } else {
            sourceRecord[1] += 1;
        }
        let targetRecord = elementMap.get(targetId);
        if (!targetRecord) {
            const targetElement = createElement(targetId);
            targetRecord = [targetElement, 1];
            cells.push(targetElement);
            elementMap.set(targetId, targetRecord);
        } else {
            targetRecord[1] += 1;
        }
        // Create the link between source and target
        cells.push(createLink(sourceId, targetId));
    });
    // Adjust element sizes based on the number of connected links
    // (If we are using vertical ELK direction, we expand horizontally)
    const dimension = ['DOWN', 'UP'].includes(ELK_DIRECTION) ? 'width' : 'height';
    elementMap.forEach(([element, count]) => {
        if (count <= 10) return;
        element.size({ [dimension]: count * 10 });
    });
    graph.resetCells(cells);
}

init();
