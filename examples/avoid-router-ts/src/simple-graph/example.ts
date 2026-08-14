import { dia, elementTools, shapes } from '@joint/core';
import { initAvoid } from '@joint/router-avoid';
import { createPaper, addLinkInteractionHandlers, addPaperZoomHandlers } from '../common';
import { Node, Edge, Note } from './shapes';
import ResizeTool from './resize-tool';

const cellNamespace = {
    ...shapes,
    Node,
    Edge,
    Note,
};

export const initSimpleExample = async (canvasEl: HTMLElement): Promise<void> => {

    const { graph, paper } = createPaper(canvasEl, cellNamespace, {
        defaultLink: () => new Edge(),
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

    await initAvoid(graph, {
        shapeBufferDistance: 20,
        idealNudgingDistance: 10,
        skipLink: (link) => link.get('doNotRoute'),
        skipElement: (element) => element.get('doNotRoute'),
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
        position: { x: 300, y: 300 },
        size: { width: 100, height: 100 },
    });

    const c3 = c1.clone().set({
        position: { x: 500, y: 100 },
        size: { width: 100, height: 100 },
    });

    const c4 = new Node({
        position: { x: 100, y: 400 },
        size: { width: 100, height: 100 },
    });

    const c5 = c4.clone().set({
        position: { x: 500, y: 300 },
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
        doNotRoute: true,
        attrs: {
            line: {
                stroke: '#EA3C24',
                strokeWidth: 2,
            }
        }
    });

    const note = new Note({
        position: { x: 220, y: 280 },
        size: { width: 220, height: 260 },
    });

    graph.resetCells([c1, c2, c3, c4, c5, l1, l2, l3, l4, l5, note]);

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
