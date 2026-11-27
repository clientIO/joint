import '../styles.scss';
import { dia, linkTools, V } from '@joint/core';
import { initAvoidRouter } from '@joint/router-avoid';
import type { CheckpointAttribute, CheckpointSide } from '@joint/router-avoid';
import { Node, Edge } from './shapes';

const cellNamespace = { Node, Edge };

const graph = new dia.Graph({}, { cellNamespace });

const paper = new dia.Paper({
    el: document.getElementById('canvas')!,
    model: graph,
    cellViewNamespace: cellNamespace,
    width: '100%',
    height: '100%',
    gridSize: 10,
    async: true,
    frozen: true,
    linkPinning: false,
    background: { color: '#F3F7F6' },
    snapLinks: { radius: 20 },
    interactive: { linkMove: false, labelMove: false },
    defaultLink: () => new Edge(),
    defaultConnector: { name: 'straight', args: { cornerType: 'cubic', cornerRadius: 4 } },
    validateConnection: (sourceView, _sourceMagnet, targetView, targetMagnet) => {
        return sourceView !== targetView && Boolean(targetMagnet);
    },
});

const port = (group: string, id: string) => ({ group, id });

const a = new Node({
    position: { x: 80, y: 100 },
    attrs: { label: { text: 'A' } },
    ports: { items: [port('right', 'out'), port('bottom', 'out2')] },
});
const b = new Node({
    position: { x: 640, y: 100 },
    attrs: { label: { text: 'B' } },
    ports: { items: [port('left', 'in')] },
});
const c = new Node({
    position: { x: 640, y: 460 },
    attrs: { label: { text: 'C' } },
    ports: { items: [port('left', 'in')] },
});
const obstacle = new Node({
    position: { x: 360, y: 220 },
    size: { width: 100, height: 140 },
    attrs: { label: { text: 'Obstacle' } },
});

graph.resetCells([
    a, b, c, obstacle,
    // The route to B makes a detour through the checkpoint below the obstacle.
    new Edge({
        source: { id: a.id, port: 'out' },
        target: { id: b.id, port: 'in' },
        // It passes the checkpoint from left to right.
        checkpoints: [{ x: 410, y: 420, arrival: 'left', departure: 'right' }],
    }),
    // The route to C passes through two checkpoints, in order.
    new Edge({
        source: { id: a.id, port: 'out2' },
        target: { id: c.id, port: 'in' },
        checkpoints: [{ x: 260, y: 300 }, { x: 540, y: 560 }],
    }),
]);

async function startRouter() {
    const routerService = await initAvoidRouter(graph, {
        // Open the demo with `?worker` to route inside a Web Worker.
        worker: new URLSearchParams(location.search).has('worker'),
        shapeBufferDistance: 20,
        idealNudgingDistance: 10,
        experimental_checkpointsAttribute: 'checkpoints',
    });
    routerService.start();
    paper.unfreeze();

    // Show and edit the checkpoints of every link.
    const addCheckpointsTool = (link: dia.Link) => {
        const tool = new linkTools.Vertices({ attribute: 'checkpoints' });
        checkpointsTools.set(link.id, tool as CheckpointsTool);
        link.findView(paper).addTools(new dia.ToolsView({ tools: [tool] }));
    };
    graph.getLinks().forEach(addCheckpointsTool);
    graph.on('add', (cell) => {
        if (cell.isLink()) addCheckpointsTool(cell);
    });
}

startRouter();

// Checkpoint directions
// ---------------------

type CheckpointsTool = linkTools.Vertices & { handles: Array<{ el: SVGElement, options: { index: number } }> };
const checkpointsTools = new Map<dia.Cell.ID, CheckpointsTool>();

// The directions a checkpoint cycles through (right-click it): the side the
// route comes from and the side it leaves toward.
const DIRECTIONS: Array<{ arrival: CheckpointSide, departure: CheckpointSide, angle: number } | null> = [
    null,
    { arrival: 'left', departure: 'right', angle: 0 },
    { arrival: 'top', departure: 'bottom', angle: 90 },
    { arrival: 'right', departure: 'left', angle: 180 },
    { arrival: 'bottom', departure: 'top', angle: 270 },
];

function getDirectionIndex(checkpoint: CheckpointAttribute): number {
    const index = DIRECTIONS.findIndex((direction) => {
        return direction && direction.arrival === checkpoint.arrival && direction.departure === checkpoint.departure;
    });
    return Math.max(index, 0);
}

document.addEventListener('contextmenu', (evt) => {
    const handleEl = (evt.target as Element).closest('.joint-marker-vertex');
    if (!handleEl) return;
    for (const [linkId, tool] of checkpointsTools) {
        const handle = tool.handles.find((h) => h.el === handleEl);
        if (!handle) continue;
        evt.preventDefault();
        const link = graph.getCell(linkId) as dia.Link;
        const checkpoints: CheckpointAttribute[] = link.get('checkpoints').slice();
        const { x, y } = checkpoints[handle.options.index]!;
        const direction = DIRECTIONS[(getDirectionIndex(checkpoints[handle.options.index]!) + 1) % DIRECTIONS.length];
        checkpoints[handle.options.index] = direction
            ? { x, y, arrival: direction.arrival, departure: direction.departure }
            : { x, y };
        link.set('checkpoints', checkpoints);
        return;
    }
});

// Draw an arrow on every checkpoint with a direction.
const arrows = V('g', { 'pointer-events': 'none' });
function drawArrows() {
    const layer = paper.getLayerView(dia.Paper.Layers.FRONT).el;
    if (arrows.node.parentNode !== layer) arrows.appendTo(layer);
    arrows.empty();
    graph.getLinks().forEach((link) => {
        (link.get('checkpoints') as CheckpointAttribute[] | undefined)?.forEach((checkpoint) => {
            const direction = DIRECTIONS[getDirectionIndex(checkpoint)];
            if (!direction) return;
            arrows.append(V('path', {
                d: 'M -12 -7 L 4 -7 L 4 -12 L 14 0 L 4 12 L 4 7 L -12 7 Z',
                fill: '#ED2637',
                transform: `translate(${checkpoint.x},${checkpoint.y}) rotate(${direction.angle})`,
            }));
        });
    });
}
graph.on('change:checkpoints add remove reset', drawArrows);
paper.on('render:done', drawArrows);

// For trying things out in the browser console.
Object.assign(window, { graph, paper });
