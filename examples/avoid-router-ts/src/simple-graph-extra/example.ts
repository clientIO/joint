import { dia, elementTools, shapes } from '@joint/core';
import { initAvoidRouter } from '@joint/router-avoid';
import { createPaper, addLinkInteractionHandlers, addPaperZoomHandlers } from '../common';
import { Node, Edge, Note } from './shapes';
import ResizeTool from './resize-tool';

const cellNamespace = {
    ...shapes,
    Node,
    Edge,
    Note,
};

// Cells tagged `group: 'b'` belong to the second subgraph, routed and
// styled independently of everything else on the paper; cells with no
// `group` (or any other value) belong to the first, default subgraph.
const isGroupB = (cell: dia.Cell): boolean => cell.get('group') === 'b';

const groupBLineAttrs = {
    line: {
        stroke: '#0B7A70',
        strokeWidth: 2,
    },
};

export const initSimpleExampleExtra = async (canvasEl: HTMLElement): Promise<void> => {

    const { graph, paper } = createPaper(canvasEl, cellNamespace, {
        // A link dragged from a group B element belongs to group B too,
        // so it's picked up by `routerServiceB` (and styled to match)
        // instead of falling into the default group A subgraph.
        defaultLink: (cellView) => isGroupB(cellView.model)
            ? new Edge({ group: 'b', attrs: groupBLineAttrs })
            : new Edge(),
        validateConnection: (
            sourceView,
            sourceMagnet,
            targetView,
            targetMagnet,
            end
        ) => {
            const source = sourceView.model;
            const target = targetView.model;
            if (!source.isElement() || !target.isElement()) return false;
            if (targetMagnet === sourceMagnet) return false;
            if (end === 'target' ? targetMagnet : sourceMagnet) {
                return true;
            }
            if (source === target) return false;
            return end === 'target' ? !target.hasPorts() : !source.hasPorts();
        },
    });

    const c1 = new Node({
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        ports: {
            items: [
                {
                    group: 'top',
                    id: 'port1',
                },
                {
                    group: 'top',
                    id: 'port2',
                },
                {
                    group: 'right',
                    id: 'port3',
                },
                {
                    group: 'left',
                    id: 'port4',
                },
            ],
        },
    });

    const c2 = c1.clone().set({
        position: { x: 400, y: 300 },
        size: { width: 100, height: 100 },
    });

    const c3 = c1.clone().set({
        position: { x: 700, y: 100 },
        size: { width: 100, height: 100 },
    });

    const c4 = new Node({
        position: { x: 200, y: 400 },
        size: { width: 100, height: 100 },
    });

    const c5 = c4.clone().set({
        position: { x: 700, y: 300 },
        size: { width: 100, height: 100 },
    });

    const l1 = new Edge({
        source: { id: c1.id, port: 'port4' },
        target: { id: c2.id, port: 'port4' },
    });

    const l2 = new Edge({
        source: { id: c2.id, port: 'port2' },
        target: { id: c3.id, port: 'port4' },
    });

    const l3 = new Edge({
        source: { id: c4.id },
        target: { id: c5.id },
    });

    const l4 = new Edge({
        source: { id: c5.id },
        target: { id: c4.id },
    });

    const l5 = new Edge({
        source: { id: c5.id },
        target: { id: c1.id },
        router: { name: 'normal' },
        connector: { name: 'curve' },
        skip: true,
        attrs: {
            line: {
                stroke: '#EA3C24',
                strokeWidth: 2,
            }
        }
    });

    const note = new Note({
        position: { x: 120, y: 280 },
        size: { width: 220, height: 260 },
    });

    // Group B's own subgraph: a separate, disconnected set of shapes and
    // links, tagged `group: 'b'` and styled in teal so it reads as
    // distinct from group A (blue) at a glance. Routed by the second
    // `initAvoid()` call above, unaware of group A's shapes and vice versa.
    const groupBAttrs = {
        body: {
            fill: 'rgba(13,148,136,0.15)',
            stroke: '#0D9488',
        },
    };

    const b1 = new Node({
        group: 'b',
        position: { x: 150, y: 620 },
        size: { width: 90, height: 90 },
        attrs: groupBAttrs,
    });

    const b2 = b1.clone().set({
        position: { x: 450, y: 780 },
        size: { width: 90, height: 90 },
    });

    const b3 = b1.clone().set({
        position: { x: 750, y: 620 },
        size: { width: 90, height: 90 },
    });

    const bl1 = new Edge({
        group: 'b',
        source: { id: b1.id },
        target: { id: b2.id },
        attrs: groupBLineAttrs,
    });

    const bl2 = new Edge({
        group: 'b',
        source: { id: b2.id },
        target: { id: b3.id },
        attrs: groupBLineAttrs,
    });

    const bl3 = new Edge({
        group: 'b',
        source: { id: b3.id },
        target: { id: b1.id },
        attrs: groupBLineAttrs,
    });

    graph.resetCells([c1, c2, c3, c4, c5, l1, l2, l3, l4, l5, note, b1, b2, b3, bl1, bl2, bl3]);

    // Two independent `RouterService` instances share the same graph, each
    // with its own libavoid router underneath. `skipLink`/`skipElement`
    // partition the graph's cells between them by their `group` attribute,
    // so each instance only ever sees - and only ever routes around - its
    // own subgraph's shapes and links, with its own routing settings.
    const routerServiceA = await initAvoidRouter(graph, {
        shapeBufferDistance: 20,
        idealNudgingDistance: 10,
        trackLink: ({ link }) => !link.get('skip') && !isGroupB(link),
        trackElement: ({ element }) => !element.get('skip') && !isGroupB(element),
        setRouteAttributes: ({ link, attributes }) => {
            link.unset('connector');
            link.set(attributes);
        },
        interceptUnroutableLink: ({ link, reason }) => {
            switch (reason) {
                case 'unconnected': {
                    link.set({
                        vertices: [],
                        connector: { name: 'curve' },
                    });
                    return true;
                }
                default:
                    return false;
            }
        },
    });

    routerServiceA.start();

    // A much larger buffer/nudging distance than group A's, so the two
    // subgraphs are visibly routed differently. Nothing further to do with
    // the returned `RouterService` in this demo, so it isn't kept around.
    const routerServiceB = await initAvoidRouter(graph, {
        shapeBufferDistance: 30,
        idealNudgingDistance: 20,
        trackLink: ({ link }) => !link.get('skip') && isGroupB(link),
        trackElement: ({ element }) => !element.get('skip') && isGroupB(element),
    });
    routerServiceB.start();

    paper.unfreeze();

    // Add tools to the elements (the Note is a plain annotation, not a
    // connectable node, so it gets none).
    graph.getElements().forEach((el) => {
        if (el instanceof Note) return;
        addElementTools(el, paper);
    });
    graph.on('add', (cell) => {
        if (!cell.isElement() || cell instanceof Note) return;
        addElementTools(cell, paper);
    });

    function addElementTools(el: dia.Element, paper: dia.Paper) {
        const tools: dia.ToolView[] = [
            new ResizeTool({
                selector: 'body',
            }),
            new elementTools.Remove({
                useModelGeometry: true,
                x: -10,
                y: -10,
            }),
        ];
        if (!el.hasPorts()) {
            tools.push(
                new elementTools.Connect({
                    useModelGeometry: true,
                    x: 'calc(w + 10)',
                    y: 'calc(h - 20)',
                })
            );
        }

        el.findView(paper).addTools(new dia.ToolsView({ tools }));
    }

    paper.on('blank:pointerdblclick', (evt, x, y) => {
        const node = new Node({
            position: { x: x - 50, y: y - 50 },
            size: { width: 100, height: 100 },
        });
        graph.addCell(node);
    });

    // Add tools to the links.
    addLinkInteractionHandlers(paper);
    addPaperZoomHandlers(paper);
};
