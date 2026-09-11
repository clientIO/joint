import { dia, shapes, g } from '@joint/core';
import { ElkLayoutOptions, layout } from '@joint/layout-elk';
import './styles.scss';

const ELK_DIRECTION = 'RIGHT';
const NODE_SIZE = { width: 100, height: 40 };
const COLORS = ['#F8FCDA', '#E3E9C2', '#F9FBB2', '#C89F9C'];

// A small seed graph - a couple of branches, so there's a choice of where a
// newly added element can be attached.
const SEED_LINKS: Array<[string, string]> = [
    ['n1', 'n2'],
    ['n1', 'n3'],
    ['n2', 'n4'],
    ['n2', 'n5'],
    ['n3', 'n6'],
];

const SEED_NODE_IDS = new Set(SEED_LINKS.flat());
let nextId = SEED_NODE_IDS.size + 1;
let zoomLevel = 1;

const init = () => {

    // Create JointJS graph and paper
    const graph = new dia.Graph({}, { cellNamespace: shapes });
    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: shapes,
        width: 1200,
        height: 700,
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

    const elkLayoutOptions: ElkLayoutOptions = {
        'elk.direction': ELK_DIRECTION,
        'elk.spacing.nodeNode': '30',
        'elk.layered.spacing.nodeNodeBetweenLayers': '60',
        'elk.edgeRouting': 'ORTHOGONAL',
    };

    // Seed the graph with a small, already laid out tree.
    SEED_LINKS.forEach(([sourceId, targetId]) => {
        if (!graph.getCell(sourceId)) graph.addCell(createElement(sourceId));
        if (!graph.getCell(targetId)) graph.addCell(createElement(targetId));
        graph.addCell(createLink(sourceId, targetId));
    });

    const interactiveToggle = document.getElementById('interactive-toggle') as HTMLInputElement;

    // The very first layout always computes the whole graph from scratch - there is
    // nothing to be "interactive" about yet, since no element has a position at all.
    layout(graph, { elkLayoutOptions }).then(() => {
        paper.unfreeze();
        zoom(paper, zoomLevel);
    }).catch((error) => {
        console.error('ELK layout error:', error.message);
    });

    let isLayingOut = false;
    const addElementButton = document.getElementById('add-element') as HTMLElement;
    addElementButton.addEventListener('click', () => {
        // A `layout()` call reads/writes the graph as it stands at that moment - guard
        // against a second click firing (and exporting a half-updated graph) while one
        // is still in flight.
        if (isLayingOut) return;
        isLayingOut = true;
        addElementButton.classList.add('toolbar-button-disabled');

        // Attach the new element to a random one already on the graph.
        const elements = graph.getElements();
        const parent = elements[g.random(0, elements.length - 1)];
        const element = createElement(`n${nextId++}`);
        // ELK's interactive strategies use an element's *current* position as a hint of
        // where to keep it - a brand new element defaults to (0, 0), which reads as "put
        // this in the very first layer" and forces everything else to make room for it.
        // Starting it off one layer to the right of its parent (`ELK_DIRECTION`) instead
        // gives interactive layout a sensible hint, so only `element` itself (not its
        // parent's whole layer) needs to move.
        // element.position(parent.position().x + NODE_SIZE.width + 60, parent.position().y);
        element.set('new', true);

        paper.freeze();
        graph.addCells([element, createLink(`${parent.id}`, `${element.id}`)]);

        // With `interactive: true`, every already laid out element (`parent` included)
        // keeps roughly its current position - ELK only has to find a spot for `element`
        // itself. Uncheck "Interactive layout" to see the whole graph get reshuffled by
        // a from-scratch layout instead. Either way, re-fit the viewport afterwards so
        // the (possibly larger) diagram stays fully visible.
        layout(graph, { elkLayoutOptions, interactive: interactiveToggle.checked }).then(() => {
            paper.unfreeze();
            zoom(paper, zoomLevel);
        }).catch((error) => {
            console.error('ELK layout error:', error.message);
        }).finally(() => {
            isLayingOut = false;
            addElementButton.classList.remove('toolbar-button-disabled');
        });
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
 * Create a rectangle element with the given id.
 */
function createElement(id: dia.Cell.ID): dia.Element {
    return new shapes.standard.Rectangle({
        id,
        size: NODE_SIZE,
        attrs: {
            body: {
                fill: COLORS[g.random(0, COLORS.length - 1)],
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
 * Create a link between sourceId and targetId.
 */
function createLink(sourceId: dia.Cell.ID, targetId: dia.Cell.ID): dia.Link {
    return new shapes.standard.Link({
        source: { id: sourceId },
        target: { id: targetId },
        attrs: {
            line: {
                stroke: '#333',
                strokeWidth: 1.5
            }
        }
    });
}

init();
