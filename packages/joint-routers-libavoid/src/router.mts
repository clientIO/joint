import { type dia, routers } from '@joint/core';
import { AvoidRouter } from './AvoidRouter.mjs';

// A router for JointJS links that follows the "custom router" contract
// documented at:
// https://docs.jointjs.com/learn/features/diagram-basics/links/#custom-router
//
// Register it under a name and reference it from a link, e.g.:
//
//   import { routers } from '@joint/core';
//   import { libavoid } from '@joint/routers-libavoid';
//
//   routers.libavoid = libavoid;
//   link.router('libavoid');
//
// or pass it directly: `link.router(libavoid)`.
//
// The actual obstacle-avoiding route is computed incrementally by an
// `AvoidRouter` instance associated with the link's graph (see `AvoidRouter`
// - it must be created and kept in sync via `addGraphListeners()`/`routeAll()`
// for this router to have anything to read). When no such instance exists
// yet for the link's graph, or the last computed route is not valid, this
// falls back to the built-in `rightAngle` router.
export function libavoid(vertices: dia.Point[], _args: unknown, linkView: dia.LinkView): dia.Point[] {
    const link = linkView.model;
    const graph = linkView.paper?.model;
    const avoidRouter = graph && AvoidRouter.for(graph);
    const route = avoidRouter?.getRoute(link);

    if (!avoidRouter || !route?.valid) {
        return routers.rightAngle(vertices, { margin: avoidRouter?.fallbackMargin }, linkView);
    }

    return route.vertices;
}
