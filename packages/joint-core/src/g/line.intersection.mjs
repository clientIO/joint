import { Point } from './point.mjs';

// @return {Point|null} the intersection of two line segments,
// the first one from `ax, ay` to `bx, by`, the second one from `cx, cy` to `dx, dy`
// @note takes numbers so that no object is created unless the segments intersect
export const intersection = function(ax, ay, bx, by, cx, cy, dx, dy) {

    const dir1X = bx - ax;
    const dir1Y = by - ay;
    const dir2X = dx - cx;
    const dir2Y = dy - cy;
    const det = (dir1X * dir2Y) - (dir1Y * dir2X);
    const deltaX = cx - ax;
    const deltaY = cy - ay;
    const alpha = (deltaX * dir2Y) - (deltaY * dir2X);
    const beta = (deltaX * dir1Y) - (deltaY * dir1X);

    if (det === 0 || alpha * det < 0 || beta * det < 0) {
        // No intersection found.
        return null;
    }

    if (det > 0) {
        if (alpha > det || beta > det) {
            return null;
        }

    } else {
        if (alpha < det || beta < det) {
            return null;
        }
    }

    return new Point(
        ax + (alpha * dir1X / det),
        ay + (alpha * dir1Y / det)
    );
};
