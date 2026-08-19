import { dia, highlighters, shapes, V } from '@joint/core';
import { initAvoidRouter } from '@joint/router-avoid';
import { createPaper, addLinkInteractionHandlers, addPaperZoomHandlers } from '../common';
import { Message, FlowchartStart, Link as AppLink } from './shapes';
import { largeGraph } from './data';

const cellNamespace = {
    ...shapes,
    app: {
        Message,
        FlowchartStart,
        Link: AppLink,
    },
};

export const initLargeGraphExample = async (canvasEl: HTMLElement): Promise<void> => {

    const { graph, paper } = createPaper(canvasEl, cellNamespace, {
        defaultLink: () => new AppLink(),
        // Only allow connections to ports, not to the element body.
        validateConnection: (
            sourceView: dia.CellView,
            sourceMagnet: SVGElement,
            targetView: dia.CellView,
            targetMagnet: SVGElement,
            end: dia.LinkEnd
        ) => {
            if (!sourceView.model.isElement() || !targetView.model.isElement()) return false;
            if (sourceView === targetView) return false;
            return !!(end === 'target' ? targetMagnet : sourceMagnet);
        },
    });

    paper.defs.prepend(V.createSVGStyle(`
        .pending [joint-selector="line"] {
            stroke: #b6b6b6;
            stroke-dasharray: 5,5;
        }
        .dragging [joint-selector="line"] {
            stroke: #4665E5;
            stroke-width: 2;
        }
    `));

    graph.resetCells(largeGraph.cells);

    const routerService = await initAvoidRouter(graph, {
        shapeBufferDistance: 20,
        idealNudgingDistance: 5,
        worker: true,
        setRouteAttributes: ({ link, attributes, routing, unroutableReason }) => {
            if (!routing) {
                highlighters.addClass.remove(link.findView(paper), 'pending');
            }
            if (unroutableReason !== 'unconnected') {
                highlighters.addClass.remove(link.findView(paper), 'dragging');
            }
            link.set(attributes);
        },
        interceptUnroutableLink: ({ link, reason }) => {
            switch (reason) {
                case 'unconnected': {
                    highlighters.addClass.add(link.findView(paper), 'root', 'dragging', {
                        className: 'dragging',
                    });
                    return false;
                }
                default:
                    return false;
            }
        },
    });

    routerService.on('link:routing', (link: dia.Link) => {
        highlighters.addClass.add(link.findView(paper), 'root', 'pending', {
            className: 'pending',
        });
    });

    routerService.on('link:routing:cancelled', (link: dia.Link) => {
        highlighters.addClass.remove(link.findView(paper), 'pending');
    });

    routerService.start();

    paper.transformToFitContent({
        useModelGeometry: true,
        preserveAspectRatio: false,
        padding: 50,
        minScale: 0.1,
        maxScale: 3,
    });

    paper.unfreeze();

    addLinkInteractionHandlers(paper);
    addPaperZoomHandlers(paper);
};
