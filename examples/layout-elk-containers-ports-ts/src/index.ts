import { dia, shapes } from '@joint/core';
import { ElkLayoutOptions, layout } from '@joint/layout-elk';
import ELK from 'elkjs/lib/elk-api.js';
import { graphJSON } from './example';
import { Container, HubService, InteractionLink, Service } from './shapes';
import './styles.scss';

const ELK_DIRECTION = 'RIGHT';
const CONTAINER_PADDING = '[top=40,left=20,bottom=20,right=20]';

const cellNamespace = {
    ...shapes,
    example: {
        Container,
        Service,
        HubService,
        InteractionLink
    }
};

const init = () => {

    // Create JointJS graph and paper
    const graph = new dia.Graph({}, { cellNamespace });
    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: cellNamespace,
        width: 1200,
        height: 700,
        gridSize: 1,
        interactive: false,
        async: true,
        frozen: true,
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

    // Load the fixed example data - `mergeArrays` merges each cell's array
    // attributes (e.g. a link's `labels`) into its class defaults index by
    // index, instead of the default behavior of replacing them outright.
    graph.fromJSON(graphJSON, { mergeArrays: true });

    const elkLayoutOptions: ElkLayoutOptions = {
        /**
         * Overall direction of the layout.
         * 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
         */
        'elk.direction': ELK_DIRECTION,

        /**
         * Spacing between nodes (siblings).
         * A number value as a string.
         */
        'elk.spacing.nodeNode': '30',

        /**
         * Spacing between layers (for layered algorithm).
         * A number value as a string.
         */
        'elk.layered.spacing.nodeNodeBetweenLayers': '40',

        /**
         * Edge routing style.
         * 'ORTHOGONAL' | 'SPLINES' | 'POLYLINE'
         */
        'elk.edgeRouting': 'ORTHOGONAL',

        /**
         * Desired width-to-height ratio of the drawing - ELK's wrapping
         * strategy (below) targets this to decide how many rows to wrap
         * onto. Tuned, together with the spacing above, to keep this
         * particular graph within `ELK_MAX_WIDTH` (see the check below).
         */
        'elk.aspectRatio': '1.2',
        /**
         * Wraps layers onto additional rows, connected by dedicated
         * "wrap" edges, instead of growing a single row indefinitely.
         * 'NONE' | 'SINGLE_EDGE' | 'MULTI_EDGE'
         */
        'elk.layered.wrapping.strategy': 'MULTI_EDGE',
        'elk.layered.priority.direction': '40'
    }

    // Run ELK in a Web Worker, via the `@joint/layout-elk` package.
    const elk = new ELK({
        workerUrl: '../node_modules/elkjs/lib/elk-worker.js'
    });

    layout(graph, {
        elk,
        // Let ELK reposition (and reorder) every port in the diagram, instead
        // of keeping them where JointJS's own port groups first placed them.
        positionPorts: 'fixed-side',
        positionPortLabels: true,
        nodeOptions: (element) => {
            // Reserve extra top padding inside containers, so children don't
            // overlap the container's title label.
            if (element.getEmbeddedCells().length > 0) {
                return { 'elk.padding': CONTAINER_PADDING };
            }
            return undefined;
        },
        elkLayoutOptions
    }).then(() => {
        paper.unfreeze();
        zoom(paper, 1);

    }).catch((error) => {
        console.error('ELK layout error:', error.message);
    });
};

function zoom(paper: dia.Paper, zoomLevel: number): void {
    paper.scale(zoomLevel);
    paper.fitToContent({
        useModelGeometry: true,
        padding: 40 * zoomLevel,
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

init();
