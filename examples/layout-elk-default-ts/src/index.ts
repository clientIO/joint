import { dia, shapes, setTheme } from '@joint/core';
import { layout } from '@joint/layout-elk';
import { graphJSON } from './example';
import { Container, Service, InteractionLink } from './shapes';
import './styles.scss';

const cellNamespace = {
    ...shapes,
    example: {
        Container,
        Service,
        InteractionLink
    }
};

const init = () => {

    // Every view (paper and cells alike) picks up a `joint-theme-material` class -
    // this example's own CSS gives that class its actual meaning (see `styles.scss`).
    setTheme('material');

    // Create JointJS graph and paper
    const graph = new dia.Graph({}, { cellNamespace });
    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: cellNamespace,
        width: 900,
        height: 600,
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

    // Load the fixed example data.
    graph.fromJSON(graphJSON);

    // No `exportElement`/`exportPort`/`setPortAttributes`/... callbacks - this is
    // `layout()` at its simplest, with only plain ELK layout options passed through.
    // Containers, ports and link labels are all laid out from this package's own
    // defaults alone - and with no `elk` option, ELK runs on the main thread (the
    // other ELK examples run it in a Web Worker, see `createWorkerElk()`).
    layout(graph, {
        elkLayoutOptions: {
            // `'elk.algorithm': 'layered'` is the package's default - not repeated here.
            'elk.direction': 'RIGHT',
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.spacing.nodeNode': '30',
            'elk.layered.spacing.nodeNodeBetweenLayers': '50'
        },
    }).then(() => {
        paper.unfreeze();
        zoom(paper, 1);
    }).catch((error) => {
        paper.unfreeze();
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
            evt.data.scrollX + (evt.data.clientX - evt.clientX!),
            evt.data.scrollY + (evt.data.clientY - evt.clientY!)
        );
    });
}

init();
