import type * as dia from './dia.d.ts';
import type * as g from './geometry.d.ts';

export interface RightAnglePathOptions {
    minPathMargin?: number;
    targetInSourceBBox?: boolean;
}

export interface RightAnglePathEnd {
    endPoint: g.Point,
    bbox: g.Rect,
    margin: number,
    side: g.RectangleSide
}

export function rightAnglePath(source: RightAnglePathEnd, target: RightAnglePathEnd, options?: RightAnglePathOptions): dia.Point[];
