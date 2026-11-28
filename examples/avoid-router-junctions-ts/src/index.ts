import '../styles.scss';
import { dia, g, linkTools } from '@joint/core';
import { initAvoidRouter } from '@joint/router-avoid';
import { Node, Junction, Edge } from './shapes';

const cellNamespace = { Node, Junction, Edge };

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
    validateConnection: (sourceView, sourceMagnet, targetView, targetMagnet) => {
        if (sourceView === targetView) return false;
        // Connect a port to a port or to a junction.
        return Boolean(targetMagnet) && targetView.model.isElement();
    },
});

const port = (group: string, id: string) => ({ group, id });

const sourceA = new Node({
    position: { x: 80, y: 80 },
    attrs: { label: { text: 'Source A' } },
    ports: { items: [port('right', 'out')] },
});
const sourceB = new Node({
    position: { x: 80, y: 320 },
    attrs: { label: { text: 'Source B' } },
    ports: { items: [port('right', 'out'), port('bottom', 'out2')] },
});
const sink = new Node({
    position: { x: 620, y: 200 },
    attrs: { label: { text: 'Sink' } },
    ports: { items: [port('left', 'in')] },
});
const targetC = new Node({
    position: { x: 620, y: 480 },
    attrs: { label: { text: 'Target C' } },
    ports: { items: [port('left', 'in')] },
});
const targetD = new Node({
    position: { x: 360, y: 600 },
    attrs: { label: { text: 'Target D' } },
    ports: { items: [port('top', 'in')] },
});
const obstacle = new Node({
    position: { x: 360, y: 180 },
    size: { width: 100, height: 120 },
    attrs: { label: { text: 'Obstacle' } },
});

// Two hyperedges: A and B merge into the sink; B splits to C and D.
// The junctions start at rough positions - the router moves them.
const merge = new Junction({ position: { x: 300, y: 300 } });
const split = new Junction({ position: { x: 300, y: 520 } });

const edge = (source: dia.Link.EndJSON, target: dia.Link.EndJSON) => new Edge({ source, target });
const toJunction = (source: dia.Link.EndJSON, junction: Junction) => {
    // No arrowhead where a link only enters a junction.
    return new Edge({ source, target: { id: junction.id }, attrs: { line: { targetMarker: null } } });
};

graph.resetCells([
    sourceA, sourceB, sink, targetC, targetD, obstacle,
    merge, split,
    toJunction({ id: sourceA.id, port: 'out' }, merge),
    toJunction({ id: sourceB.id, port: 'out' }, merge),
    edge({ id: merge.id }, { id: sink.id, port: 'in' }),
    toJunction({ id: sourceB.id, port: 'out2' }, split),
    edge({ id: split.id }, { id: targetC.id, port: 'in' }),
    edge({ id: split.id }, { id: targetD.id, port: 'in' }),
]);

// Show whether a junction is pinned.
function showPinned(junction: Junction) {
    junction.attr('body/strokeWidth', junction.get('junctionFixed') ? 3 : 0);
}
graph.getElements().forEach((element) => {
    if (element instanceof Junction) showPinned(element);
});
graph.on('change:junctionFixed', (junction: Junction) => showPinned(junction));

// Where a free junction starts from before avoid improves its position:
// - 'improve': from where it is now. The result depends on the past - after
//   a drag and back, a junction can stay in a different (local) minimum.
// - 'fresh': from the median of its link ends, every time, so the same
//   layout always gives the same junctions.
type JunctionPlacement = 'improve' | 'fresh';
let junctionPlacement: JunctionPlacement = 'improve';

// The point a link end is attached to: the port or the element center.
function getEndPoint(end: dia.Link.EndJSON): g.Point | null {
    const element = end.id ? graph.getCell(end.id) : null;
    if (!element || !element.isElement()) return null;
    if (end.port && element.hasPort(end.port)) {
        const { group } = element.getPort(end.port);
        const portPosition = element.getPortsPositions(group!)[end.port];
        if (portPosition) return element.position().offset(portPosition.x, portPosition.y);
    }
    return element.getBBox().center();
}

// The coordinate-wise median of the link ends: the point with the shortest
// total orthogonal distance to them (obstacles aside).
function getFreshJunctionCenter(junction: Junction): g.Point | null {
    const points: g.Point[] = [];
    graph.getConnectedLinks(junction).forEach((link) => {
        const otherEnd = (link.source().id === junction.id) ? link.target() : link.source();
        const point = getEndPoint(otherEnd);
        if (point) points.push(point);
    });
    if (points.length === 0) return null;
    const median = (values: number[]) => {
        const sorted = values.sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return (sorted.length % 2) ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
    };
    return new g.Point(median(points.map((p) => p.x)), median(points.map((p) => p.y)));
}

function placeJunctionsFresh() {
    graph.getElements().forEach((element) => {
        if (!(element instanceof Junction) || element.get('junctionFixed')) return;
        const center = getFreshJunctionCenter(element);
        if (!center) return;
        const { width, height } = element.size();
        element.position(center.x - width / 2, center.y - height / 2);
    });
}

// The router's own changes (routes, junction moves) carry this flag.
const routerChangeFlag = 'avoidRouter';

// Registered before the router starts, so the junctions are placed before
// the router reads the change.
graph.on('change:position change:source change:target', (cell: dia.Cell, _value: unknown, opt: dia.Cell.Options) => {
    if (junctionPlacement !== 'fresh' || cell instanceof Junction || opt[routerChangeFlag]) return;
    placeJunctionsFresh();
});
graph.on('change:junctionFixed', (junction: Junction) => {
    if (junctionPlacement === 'fresh' && !junction.get('junctionFixed')) placeJunctionsFresh();
});

const placementSelect = document.getElementById('junction-placement') as HTMLSelectElement;
placementSelect.value = junctionPlacement;
placementSelect.addEventListener('change', () => {
    junctionPlacement = placementSelect.value as JunctionPlacement;
    if (junctionPlacement === 'fresh') placeJunctionsFresh();
});

async function startRouter() {
    const routerService = await initAvoidRouter(graph, {
        // Open the demo with `?worker` to route inside a Web Worker.
        worker: new URLSearchParams(location.search).has('worker'),
        shapeBufferDistance: 20,
        idealNudgingDistance: 10,
        experimental_isJunction: ({ element }) => element instanceof Junction,
        changeFlag: routerChangeFlag,
    });
    routerService.start();
    Object.assign(window, { routerService });
    paper.unfreeze();
}

startRouter();

// Dragging a junction pins it, so the router does not move it back.
// Pin on pointerdown: the router reads `junctionFixed` with each move.
paper.on('element:pointerdown', ({ model }) => {
    if (model instanceof Junction) model.set('junctionFixed', true);
});
// Double-click a pinned junction to free it again.
paper.on('element:pointerdblclick', ({ model }) => {
    if (model instanceof Junction) model.set('junctionFixed', false);
});

paper.on('link:mouseenter', (linkView) => {
    linkView.addTools(new dia.ToolsView({ tools: [new linkTools.Remove()] }));
});
paper.on('link:mouseleave', (linkView) => linkView.removeTools());

// For trying things out in the browser console.
Object.assign(window, { graph, paper });
