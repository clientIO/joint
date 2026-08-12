import { shapes } from '@joint/core';
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

export const initLargeGraphExample = async (canvasEl) => {

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
                        return true;
                    }
                    link.set({
                        vertices: [],
                        router: { name: 'normal' },
                        connector: { name: 'curve' },
                        isDragging: true,
                    });
                    return true;
                }
                default:
                    return false;
            }
        },
    });

    routerService.on('link:routed', (link) => {
        link.attr('line/strokeDasharray', null);
    });

    routerService.on('link:pending', (link) => {
        link.attr('line/strokeDasharray', '5,5');

        if (link.get('isDragging')) {
            link.set({
                router: { name: 'normal' },
                connector: null,
                isDragging: false,
            });
        }
    });

    routerService.on('link:pending:cancelled', (link) => {
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
