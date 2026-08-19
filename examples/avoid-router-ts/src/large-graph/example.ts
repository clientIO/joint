import { dia, shapes } from '@joint/core';
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

    graph.resetCells(largeGraph.cells);

    const routerService = await initAvoidRouter(graph, {
        shapeBufferDistance: 20,
        idealNudgingDistance: 5,
        worker: true,
        interceptUnroutableLink: ({ link, reason }) => {
            switch (reason) {
                case 'unconnected': {
                    if (link.get('isDragging')) {
                        return false;
                    }
                    link.set({
                        isDragging: true,
                    });
                    link.attr('line/stroke', 'red');
                    return false;
                }
                default:
                    return false;
            }
        },
    });

    routerService.on('link:routed', (link: dia.Link) => {
        link.attr('line/strokeDasharray', null);
    });

    routerService.on('link:routing', (link: dia.Link) => {
        link.attr('line/strokeDasharray', '5,5');

        if (link.get('isDragging')) {
            link.set({
                isDragging: false,
            });
            link.attr('line/stroke', '#464454');
        }
    });

    routerService.on('link:routing:cancelled', (link: dia.Link) => {
        link.attr('line/strokeDasharray', null);
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
