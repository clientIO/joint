import { shapes } from '@joint/core';
import { init as initAvoid } from '@joint/router-avoid';
import { createPaper, addLinkInteractionHandlers, addRouterStyling } from './common';
import { Message, FlowchartStart, Link as AppLink } from './large-shapes';
import { largeGraph } from './large-data';

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

    const routerService = await initAvoid({
        graph,
        shapeBufferDistance: 20,
        idealNudgingDistance: 10,
        useWorker: true
    });

    addRouterStyling(routerService);

    graph.resetCells(largeGraph.cells);

    paper.on('render:done', () => {
        paper.transformToFitContent({
            useModelGeometry: true,
            preserveAspectRatio: false,
            padding: 50,
            minScale: 0.1,
            maxScale: 3,
        });
    });

    paper.unfreeze();

    addLinkInteractionHandlers(paper);
};
