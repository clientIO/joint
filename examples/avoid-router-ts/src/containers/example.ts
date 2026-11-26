import { dia, shapes } from '@joint/core';
import { initAvoidRouter } from '@joint/router-avoid';
import { createPaper, addPaperZoomHandlers } from '../common';
import { Node, Edge } from '../simple-graph/shapes';
import { Container, ContainerLink } from './shapes';

const cellNamespace = {
    ...shapes,
    Node,
    Edge,
    Container,
    ContainerLink,
};

interface ContainerGroup {
    container: Container;
    cells: dia.Cell[];
}

// Builds one container with a small internal mesh of 4 nodes/5 edges (a
// square with one diagonal), all embedded into the container so
// `getEmbeddedCells()` returns exactly the cells that should be routed as
// this container's own subgraph.
function createContainer(label: string, position: dia.Point): ContainerGroup {
    const { x, y } = position;

    const container = new Container({
        position,
        size: { width: 370, height: 290 },
        attrs: {
            headerText: { text: label },
        },
    });

    const n1 = new Node({ position: { x: x + 30, y: y + 55 }, size: { width: 90, height: 60 } });
    const n2 = new Node({ position: { x: x + 250, y: y + 55 }, size: { width: 90, height: 60 } });
    const n3 = new Node({ position: { x: x + 30, y: y + 195 }, size: { width: 90, height: 60 } });
    const n4 = new Node({ position: { x: x + 250, y: y + 195 }, size: { width: 90, height: 60 } });

    const e1 = new Edge({ source: { id: n1.id }, target: { id: n2.id } });
    const e2 = new Edge({ source: { id: n3.id }, target: { id: n4.id } });
    const e3 = new Edge({ source: { id: n1.id }, target: { id: n3.id } });
    const e4 = new Edge({ source: { id: n2.id }, target: { id: n4.id } });
    const e5 = new Edge({ source: { id: n1.id }, target: { id: n4.id } });

    const children = [n1, n2, n3, n4, e1, e2, e3, e4, e5];
    container.embed(children);

    return { container, cells: [container, ...children] };
}

export const initContainersExample = async (canvasEl: HTMLElement): Promise<void> => {
    // `routeSubgraph()` is a one-shot computation - the RouterService is
    // never `start()`ed, so it never listens for graph changes and nothing
    // would re-route a dragged or resized element. The paper is therefore
    // read-only: `interactive: false` disables element/link interaction
    // entirely, so the pre-computed routes never go stale.
    const { graph, paper } = createPaper(canvasEl, cellNamespace, {
        interactive: false,
    });

    const groupA = createContainer('Container A', { x: 40, y: 40 });
    const groupB = createContainer('Container B', { x: 520, y: 40 });
    const groupC = createContainer('Container C', { x: 280, y: 420 });

    // Links *between* containers - connected to the containers themselves,
    // not to any of their embedded nodes, so that when they're routed (see
    // below) each container's full bounding box acts as a single obstacle.
    const l1 = new ContainerLink({ source: { id: groupA.container.id }, target: { id: groupB.container.id } });
    const l2 = new ContainerLink({ source: { id: groupB.container.id }, target: { id: groupC.container.id } });
    const l3 = new ContainerLink({ source: { id: groupC.container.id }, target: { id: groupA.container.id } });
    const containerLinks = [l1, l2, l3];

    graph.resetCells([...groupA.cells, ...groupB.cells, ...groupC.cells, ...containerLinks]);

    const routerService = await initAvoidRouter(graph, {
        shapeBufferDistance: 16,
        idealNudgingDistance: 8,
        worker: true,
    });

    routerService.on('idle', () => {
        console.log('All routing computations complete.');
    });

    // Route each container's content in isolation: `routeSubgraph()` only
    // ever considers the cells it's given, so a container's internal links
    // are routed around that container's own children and are oblivious to
    // every other container on the paper - each call starts from a clean
    // slate for the underlying avoid engine.
    await routerService.routeSubgraph(groupA.container.getEmbeddedCells());
    await routerService.routeSubgraph(groupB.container.getEmbeddedCells());
    await routerService.routeSubgraph(groupC.container.getEmbeddedCells());

    // Then route the container-to-container links in their own pass, with
    // the containers themselves (not their internals) as the only
    // obstacles - each container is treated as a single opaque box, and the
    // internal routing computed above is left untouched.
    await routerService.routeSubgraph([
        groupA.container,
        groupB.container,
        groupC.container,
        ...containerLinks,
    ]);

    paper.unfreeze();
    paper.fitToContent({ useModelGeometry: true, padding: 20 });

    addPaperZoomHandlers(paper);
};
