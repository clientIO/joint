import type * as dia from './dia.d.ts';
import type * as g from './geometry.d.ts';

export interface RightAnglePathOptions {
    /**
     * Overrides both ends' `margin` in the checks deciding when the path
     * must detour around an end's bbox (i.e. how close to an end the path
     * may pass). Each end's own `margin` still controls how far outside
     * its bbox the path starts/ends. Defaults to the respective end's
     * `margin`.
     */
    minPathMargin?: number;
    /**
     * Forces the U-shaped detour around the source in the branches where
     * both ends leave from the same side. Set by the `rightAngle` router
     * when it knows `target` is a point lying inside `source`'s bbox - a
     * point target has a zero-size bbox, so this function's own overlap
     * checks cannot detect the containment.
     *
     * @internal Temporary leak of a `rightAngle` router internal. Will be
     * removed once the containment is deduced inside the algorithm
     * (zero-size target bbox + point-in-bbox check); do not rely on it.
     */
    targetInSourceBBox?: boolean;
}

/** One end of a path computed by {@link rightAnglePath}. */
export interface RightAnglePathEnd {
    /**
     * The point the path connects to (e.g. the link's anchor, or a
     * vertex). The path does not start at this point directly: it starts
     * at this point offset to `margin` outside `bbox` on the given
     * `side`.
     */
    endPoint: g.Point,
    /**
     * Bounding box the path must leave (and route around, when the ends'
     * relative position requires it). Pass a zero-size rect at `endPoint`
     * for an end that is a mere point (a vertex, or an unconnected link
     * end).
     */
    bbox: g.Rect,
    /** How far outside `bbox` the path starts/ends and how much clearance it keeps around it. */
    margin: number,
    /** Side of `bbox` the path leaves from/arrives at. */
    side: g.RectangleSide
}

/**
 * Computes an orthogonal (right-angled) path between two ends, leaving
 * the source on its given side, arriving at the target on its given
 * side, and keeping the given margins around both ends' bounding boxes.
 * This is the path-finding algorithm of the `rightAngle` router.
 *
 * @internal Not part of the public API yet - exposed for
 * `@joint/router-avoid`'s fallback route and subject to change.
 *
 * @param source - The end the path starts at.
 * @param target - The end the path ends at.
 * @param options - Additional options.
 * @returns The path's points, including the offset source and target points.
 */
export function rightAnglePath(source: RightAnglePathEnd, target: RightAnglePathEnd, options?: RightAnglePathOptions): dia.Point[];
