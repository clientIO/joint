/*import { AvoidLib, type Router, type Avoid as AvoidInstance } from 'libavoid-js';
import type { InitOptions } from './init.mjs';

const loaded = AvoidLib.load();

let avoidInstance: AvoidInstance;
let avoidRouter: Router;

function init(options: InitOptions): void {
    avoidInstance = AvoidLib.getInstance();
    avoidRouter = createAvoidRouter(
        avoidInstance,
        options.shapeBufferDistance ?? 0,
        options.idealNudgingDistance ?? 10
    );
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

onmessage = async(evt: MessageEvent) => {
    await loaded;

    const [{ command, ...data }] = evt.data;

    switch (command) {
        case 'init': {
            init(data.options);
        }
    }
};*/

