import { dia, shapes } from '@joint/core';
import { layout } from '@joint/layout-elk';
import ELK from 'elkjs/lib/elk-api.js';
import './styles.scss';

const ELK_DIRECTION = 'RIGHT';
const CONTAINER_PADDING = '[top=40,left=20,bottom=20,right=20]';
const PORT_SIZE = { width: 12, height: 12 };
// Soft cap on the overall drawing width - ELK wraps layers onto additional
// rows (rather than growing ever wider) once it would otherwise be exceeded.
// It is a target for ELK's wrapping heuristic, not a hard guarantee.
const ELK_MAX_WIDTH = 1000;

interface ContainerDef {
    id: string;
    label: string;
}

interface NodeDef {
    id: string;
    label: string;
    parent: string;
    color: string;
    inPorts: string[];
    outPorts: string[];
    // Whether this node is one of the few "hub" nodes that let ELK decide
    // where its ports go (`positionPorts`), instead of keeping them exactly
    // where JointJS's own port groups already place them.
    autoPorts?: boolean;
}

interface LinkDef {
    source: string;
    sourcePort: string;
    target: string;
    targetPort: string;
    label: string;
}

// A fixed (non-random) system diagram: three containers grouping eight
// services that communicate over ports, including links that cross container
// boundaries. Three "hub" nodes (Load Balancer, API Gateway, Auth Service)
// have several ports on the same side and opt into `positionPorts`, so ELK
// orders them to minimize crossings; every other node keeps its ports
// exactly where JointJS's own port groups already place them.
const CONTAINERS: ContainerDef[] = [
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'observability', label: 'Observability' }
];

const NODES: NodeDef[] = [
    { id: 'webui', label: 'Web UI', parent: 'frontend', color: '#F8FCDA', inPorts: [], outPorts: ['out'] },
    { id: 'mobileui', label: 'Mobile UI', parent: 'frontend', color: '#F8FCDA', inPorts: [], outPorts: ['out'] },
    { id: 'lb', label: 'Load Balancer', parent: 'frontend', color: '#E3E9C2', inPorts: ['in1', 'in2'], outPorts: ['out'], autoPorts: true },
    { id: 'gateway', label: 'API Gateway', parent: 'frontend', color: '#E3E9C2', inPorts: ['in'], outPorts: ['out1', 'out2'], autoPorts: true },
    { id: 'auth', label: 'Auth Service', parent: 'backend', color: '#F9FBB2', inPorts: ['in'], outPorts: ['out1', 'out2'], autoPorts: true },
    { id: 'cache', label: 'Cache', parent: 'backend', color: '#F9FBB2', inPorts: ['in'], outPorts: ['out'] },
    { id: 'db', label: 'Database', parent: 'backend', color: '#C89F9C', inPorts: ['in'], outPorts: [] },
    { id: 'logger', label: 'Logger', parent: 'observability', color: '#D9D2E9', inPorts: ['in1', 'in2'], outPorts: [] }
];

const LINKS: LinkDef[] = [
    { source: 'webui', sourcePort: 'out', target: 'lb', targetPort: 'in1', label: 'request' },
    { source: 'mobileui', sourcePort: 'out', target: 'lb', targetPort: 'in2', label: 'request' },
    { source: 'lb', sourcePort: 'out', target: 'gateway', targetPort: 'in', label: 'route' },
    { source: 'gateway', sourcePort: 'out1', target: 'auth', targetPort: 'in', label: 'authenticate' },
    { source: 'gateway', sourcePort: 'out2', target: 'logger', targetPort: 'in1', label: 'log' },
    { source: 'auth', sourcePort: 'out1', target: 'cache', targetPort: 'in', label: 'lookup' },
    { source: 'auth', sourcePort: 'out2', target: 'logger', targetPort: 'in2', label: 'log' },
    { source: 'cache', sourcePort: 'out', target: 'db', targetPort: 'in', label: 'query' }
];

const NODES_BY_ID = new Map(NODES.map((def) => [def.id, def]));

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

    // Generate JointJS cells from the fixed example data
    graph.resetCells(generateCells());

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
             * Distance between edge labels and the edge itself.
             * A number value as a string.
             */
            'elk.spacing.edgeLabel': '4',

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
        },
        // Let ELK reposition ports for the "hub" nodes only (see `nodeOptions`
        // below, which opts every other node back out on a per-node basis).
        positionPorts: true,
        nodeOptions: (element) => {
            // Reserve extra top padding inside containers, so children don't
            // overlap the container's title label.
            if (element.getEmbeddedCells().length > 0) {
                return { 'elk.padding': CONTAINER_PADDING };
            }
            const def = NODES_BY_ID.get(`${element.id}`);
            if (def && !def.autoPorts) {
                // Keep this node's ports exactly where JointJS placed them.
                return { 'elk.portConstraints': 'FIXED_POS' };
            }
            // Leave unset - the `positionPorts` default (`FREE`) applies.
            return undefined;
        }
    }).then(() => {
        paper.unfreeze();
        zoom(paper, 1);

        // `elk.aspectRatio` only targets the placement of nodes - the drawing's
        // actual width (checked here on the rendered content, wrap-around
        // routing included) is a target for ELK's wrapping heuristic, not a
        // hard guarantee, so flag it during development if it is ever missed.
        const contentWidth = paper.getContentBBox({ useModelGeometry: true }).width;
        if (contentWidth > ELK_MAX_WIDTH) {
            console.warn(`ELK layout is ${contentWidth} units wide, over the ${ELK_MAX_WIDTH} unit target.`);
        }
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

/**
 * Create a dashed, semi-transparent container element - its final size and
 * position are computed by ELK to fit whatever gets embedded into it.
 */
function createContainer(def: ContainerDef): dia.Element {
    return new shapes.standard.Rectangle({
        id: def.id,
        size: { width: 100, height: 100 },
        attrs: {
            body: {
                fill: '#EEF3F1',
                stroke: '#7C9C92',
                strokeWidth: 2,
                strokeDasharray: '6,3',
                rx: 8,
                ry: 8
            },
            label: {
                text: def.label,
                x: 12,
                y: 10,
                textAnchor: 'start',
                textVerticalAnchor: 'top',
                fontWeight: 'bold',
                fontSize: 13,
                fill: '#3E5C53',
                fontFamily: 'Arial, helvetica, sans-serif'
            }
        }
    });
}

/**
 * Create a rectangle element with the given 'in' (left) and 'out' (right)
 * ports. A node tall enough to fit whichever side has more ports.
 */
function createNode(def: NodeDef): dia.Element {
    const items: dia.Element.Port[] = [
        ...def.inPorts.map((portId): dia.Element.Port => ({
            id: portId,
            group: 'in',
            size: PORT_SIZE,
            attrs: { text: { text: portId } }
        })),
        ...def.outPorts.map((portId): dia.Element.Port => ({
            id: portId,
            group: 'out',
            size: PORT_SIZE,
            attrs: { text: { text: portId } }
        }))
    ];

    const maxPortsPerSide = Math.max(def.inPorts.length, def.outPorts.length, 1);
    const height = 50 + (maxPortsPerSide - 1) * 30;

    return new shapes.standard.Rectangle({
        id: def.id,
        size: { width: 130, height },
        attrs: {
            body: {
                fill: def.color,
                stroke: (def.autoPorts) ? '#B85C38' : '#333',
                strokeWidth: (def.autoPorts) ? 3 : 2,
                rx: 5,
                ry: 5
            },
            label: {
                text: def.label,
                fill: '#333',
                fontSize: 13,
                fontFamily: 'Arial, helvetica, sans-serif'
            }
        },
        ports: {
            groups: {
                in: {
                    position: 'left',
                    attrs: {
                        circle: { r: 6, fill: '#FFFFFF', stroke: '#333', strokeWidth: 2 },
                        text: { fontSize: 10, fill: '#555' }
                    },
                    // 'top' (rather than 'left') keeps the label clear of the link
                    // labels routed horizontally between closely-spaced ports.
                    label: { position: { name: 'top' } }
                },
                out: {
                    position: 'right',
                    attrs: {
                        circle: { r: 6, fill: '#FFFFFF', stroke: '#333', strokeWidth: 2 },
                        text: { fontSize: 10, fill: '#555' }
                    },
                    label: { position: { name: 'top' } }
                }
            },
            items
        }
    });
}

/**
 * Create a link between two nodes, connected via the given ports, with a
 * label describing the interaction.
 */
function createLink(def: LinkDef): dia.Link {
    return new shapes.standard.Link({
        source: { id: def.source, port: def.sourcePort },
        target: { id: def.target, port: def.targetPort },
        labels: [{
            size: { width: 80, height: 20 },
            attrs: {
                text: {
                    text: def.label,
                    fontSize: 11,
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
 * Build the fixed set of cells: the containers, the nodes embedded into
 * them, and the links between the nodes.
 */
function generateCells(): dia.Cell[] {
    const containers = CONTAINERS.map(createContainer);
    const containersById = new Map(containers.map((container) => [`${container.id}`, container]));

    const nodes = NODES.map((def) => {
        const node = createNode(def);
        containersById.get(def.parent)!.embed(node);
        return node;
    });

    const links = LINKS.map(createLink);

    return [...containers, ...nodes, ...links];
}

init();
