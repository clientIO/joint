import { Point } from './point.mjs';
import { types } from './types.mjs';

// @return {Point} `p` itself when it is a point already, a new point created from `p` otherwise
// @note the result can be the object that was passed in: read it only, do not change it, keep it or return it
export const ensurePoint = function(p) {

    return (p && p.type === types.Point) ? p : new Point(p);
};
