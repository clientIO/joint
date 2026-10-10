import { dia, shapes, setTheme } from '@joint/core';
import {
    ElkLayoutOptions,
    ExportElementCallback,
    ExportPortCallback,
    ExportPortLabelCallback,
    createWorkerElk,
    layout
} from '@joint/layout-elk';
import { graphJSON } from './example';
import { Container, HubService, InteractionLink, Service } from './shapes';
import './styles.scss';

const ELK_DIRECTION = 'RIGHT';

const cellNamespace = {
    ...shapes,
    example: {
        Container,
        Service,
        HubService,
        InteractionLink
    }
};

// ELK runs in a Web Worker, so a layout doesn't block the page - the worker is started on
// the first layout, then shared by every later one.
const elk = createWorkerElk(() => new Worker(new URL('@joint/layout-elk/worker', import.meta.url), { type: 'module' }));

const init = () => {

    // Every view (paper and cells alike) picks up a `joint-theme-material` class -
    // this example's own CSS gives that class its actual meaning (see `styles.scss`).
    setTheme('material');

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
         * onto. Tuned, together with the spacing above, for this
         * particular graph.
         */
        'elk.aspectRatio': '1.2',
        /**
         * Wraps layers onto additional rows, connected by dedicated
         * "wrap" edges, instead of growing a single row indefinitely.
         * 'NONE' | 'SINGLE_EDGE' | 'MULTI_EDGE'
         */
        'elk.layered.wrapping.strategy': 'MULTI_EDGE'
    };

    // `FIXED_SIDE` (not the package's default `FIXED_POS`) lets ELK move each port
    // along the side `exportPort` puts it on, to reduce crossings.
    const exportElement: ExportElementCallback = ({ element, elkNode }) => {
        if (element.hasPorts()) {
            elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_SIDE';
        }

        const padding = element.get('padding');
        if (padding) {
            elkNode.layoutOptions['elk.padding'] = padding;
        }
    };

    const exportPort: ExportPortCallback = ({ portId, element, elkPort }) => {
        switch (element.getPort(portId).group) {
            case 'in':
                elkPort.layoutOptions['elk.port.side'] = 'WEST';
                break;
            case 'out':
                elkPort.layoutOptions['elk.port.side'] = 'SOUTH';
                break;
        }
    };

    const exportPortLabel: ExportPortLabelCallback = ({ portId, element, elkPortLabel }) => {
        const { width, height} = element.portProp(portId, 'label/size');
        elkPortLabel.width = width;
        elkPortLabel.height = height;
    };

    // Freezes the paper for the (async) duration of the layout, so nothing renders
    // mid-layout.
    const runLayout = (): Promise<void> => {
        paper.freeze();
        return layout(graph, {
            elk,
            exportElement,
            exportPort,
            exportPortLabel,
            elkLayoutOptions
        }).then(() => {
            paper.unfreeze();
        }).catch((error) => {
            paper.unfreeze();
            console.error('ELK layout error:', error.message);
        });
    };

    // Initial layout of the fixed example data, fit to the paper's viewport.
    runLayout().then(() => {
        zoom(paper, 1);
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
            evt.data.scrollX + (evt.data.clientX - evt.clientX!),
            evt.data.scrollY + (evt.data.clientY - evt.clientY!)
        );
    });
}

init();
