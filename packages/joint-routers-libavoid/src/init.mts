import type { dia } from '@joint/core';
import { AvoidLib, type Router, type Avoid as AvoidInstance } from 'libavoid-js';
import { RouterService } from './RouterService.mjs';

async function load(): Promise<void> {
    await AvoidLib.load();
}

function createAvoidRouter(Avoid: AvoidInstance, shapeBufferDistance: number, idealNudgingDistance: number): Router {
    const router = new Avoid.Router(Avoid.OrthogonalRouting);

    // This parameter defines the spacing distance used for nudging apart
    // overlapping corners and line segments of connectors.
    router.setRoutingParameter(Avoid.idealNudgingDistance, idealNudgingDistance);

    // This parameter defines the spacing distance added to the sides of
    // each shape when determining obstacle sizes for routing.
    router.setRoutingParameter(Avoid.shapeBufferDistance, shapeBufferDistance);

    // Controls whether collinear line segments touching just at their
    // ends will be nudged apart. Not suitable for links connected to ports.
    router.setRoutingOption(Avoid.nudgeOrthogonalTouchingColinearSegments, false);

    // Controls whether the router performs a preprocessing step before
    // orthogonal nudging that generally results in better nudging quality.
    router.setRoutingOption(Avoid.performUnifyingNudgingPreprocessingStep, true);

    router.setRoutingOption(Avoid.nudgeSharedPathsWithCommonEndPoint, true);
    router.setRoutingOption(Avoid.nudgeOrthogonalSegmentsConnectedToShapes, true);

    return router;
}


export interface InitOptions {
    graph: dia.Graph;
    shapeBufferDistance?: number;
    idealNudgingDistance?: number;
}

export async function init(options: InitOptions): Promise<void> {
    await load();

    const avoidInstance = AvoidLib.getInstance();
    const avoidRouter = createAvoidRouter(
        avoidInstance,
        options.shapeBufferDistance ?? 0,
        options.idealNudgingDistance ?? 10
    );

    RouterService.create({
        avoidInstance,
        avoidRouter,
        graph: options.graph
    });
}
