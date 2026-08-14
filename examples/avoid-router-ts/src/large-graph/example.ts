import { dia, shapes } from '@joint/core';
import { initAvoid } from '@joint/router-avoid';
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
    });

    const routerService = await initAvoid(graph, {
        shapeBufferDistance: 20,
        idealNudgingDistance: 5,
        useWorker: true,
        handleUnroutableLink: (link, reason) => {
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

    routerService.on('link:pending', (link: dia.Link) => {
        link.attr('line/strokeDasharray', '5,5');

        if (link.get('isDragging')) {
            link.set({
                isDragging: false,
            });
            link.attr('line/stroke', '#464454');
        }
    });

    routerService.on('link:pending:cancelled', (link: dia.Link) => {
        link.attr('line/strokeDasharray', null);
    });

    graph.resetCells(largeGraph.cells);

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
