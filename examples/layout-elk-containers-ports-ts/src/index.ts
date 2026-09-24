import { dia, shapes } from '@joint/core';
import {
    ElkLayoutOptions,
    ExportElementCallback,
    ExportPortCallback,
    ExportEdgeCallback,
    NodeElkLayoutOptions,
    PortElkLayoutOptions,
    layout
} from '@joint/layout-elk';
import ELK from 'elkjs/lib/elk-api.js';
import { graphJSON } from './example';
import { Container, HubService, InteractionLink, Service } from './shapes';
import './styles.scss';

const ELK_DIRECTION = 'RIGHT';

// `@joint/layout-elk` no longer reads a cell's `elkLayoutOptions` (or a port's, or a
// link label's) automatically - these three callbacks apply the ones this example's
// shapes still declare declaratively (see `shapes.ts`), merging them onto whatever
// this package itself computed for that node/port/edge label.

// Every node with ports gets ELK's `FIXED_SIDE` port constraint, so ELK may reorder
// (but not move to a different side) ports already placed on their JointJS-assigned
// side - e.g. to reduce crossings on `HubService`'s several same-side ports.
const exportElement: ExportElementCallback = ({ element, elkNode }) => {
    if (element.hasPorts()) {
        elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_SIDE';
    }
    const elkLayoutOptions = element.prop('elkLayoutOptions') as NodeElkLayoutOptions | undefined;
    if (elkLayoutOptions) Object.assign(elkNode.layoutOptions, elkLayoutOptions);
};

const exportPort: ExportPortCallback = ({ port, element, elkPort }) => {
    const portId = `${port.id}`;
    const elkLayoutOptions = element.portProp(portId, 'elkLayoutOptions') as PortElkLayoutOptions | undefined;
    if (elkLayoutOptions) Object.assign(elkPort.layoutOptions, elkLayoutOptions);
};

// A label's `elkLayoutOptions` (own, or `defaultLabel`'s - `link.labels()` already
// resolves that, see `Link#labels`) applies to *that label's* own `layoutOptions`
// (e.g. `elk.edgeLabels.inline`), not the edge's.
const exportEdge: ExportEdgeCallback = ({ link, elkEdge }) => {
    link.labels().forEach((label, index) => {
        const elkLayoutOptions = label.elkLayoutOptions as Record<string, string> | undefined;
        const elkLabel = elkEdge.labels?.[index];
        if (elkLayoutOptions && elkLabel) {
            elkLabel.layoutOptions = { ...elkLabel.layoutOptions, ...elkLayoutOptions };
        }
    });
};

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

    // Wraps every `layout()` call the example makes - freezing the paper for its
    // (async) duration, so nothing renders mid-layout, and reporting any error the
    // same way regardless of which caller triggered the layout.
    const runLayout = (): Promise<void> => {
        paper.freeze();
        return layout(graph, {
            elk,
            exportElement,
            exportPort,
            exportEdge,
            elkLayoutOptions
        }).then(() => {
            paper.unfreeze();
        }).catch((error) => {
            paper.unfreeze();
            console.error('ELK layout error:', error.message);
        });
    };

    // Initial layout of the fixed example data, fit to the paper's viewport.
    runLayout().then(() => zoom(paper, 1));

    // "Layout" toolbar button - re-runs the same from-scratch layout on the
    // unchanged graph. Every run is independent (no `interactive: true`), so
    // clicking it repeatedly is a quick way to check that `layout()` is
    // idempotent - each run should settle on the same result as the last.
    document.getElementById('layout')!.addEventListener('click', () => {
        runLayout().then(() => zoom(paper, 1));
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
