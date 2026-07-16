import { type dia } from '@joint/core';

// The result of routing a single link, cached by `AvoidRouter` and consumed
// by the `libavoid` router function.
export interface AvoidRoute {
    // Route points between the source and target connection points
    // (not including them), or an empty array when `valid` is `false`.
    vertices: dia.Point[];
    // Whether the libavoid route should be used as-is. Libavoid does not
    // expose a way to check this, so a heuristic is used (see `AvoidRouter`).
    // When `false`, consumers should fall back to another router (e.g. `rightAngle`).
    valid: boolean;
}

export interface AvoidRouterOptions {
    // Spacing distance used for nudging apart overlapping corners
    // and line segments of connectors. Default: 4 (set by libavoid).
    idealNudgingDistance?: number;
    // Spacing distance added to the sides of each shape when determining
    // obstacle sizes for routing. Default: 0.
    shapeBufferDistance?: number;
    // The overflow of a port outside of the element it belongs to.
    // Used as a fallback margin when the libavoid route is not valid. Default: 0.
    portOverflow?: number;
    // Whether to call `Router.processTransaction()` automatically
    // after every graph change. Default: true.
    commitTransactions?: boolean;
}
