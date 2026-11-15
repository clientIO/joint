// Returns `true` if the area surrounded by the points contains the point `x`, `y`.
// Implements the even-odd SVG algorithm (self-intersections are "outside").
// (Uses a horizontal ray to the right of the point to look for intersections.)
// Closes an open shape (always imagines a final closing segment).
export const containsPoint = function(points, x, y) {

    const numPoints = points.length;
    if (numPoints === 0) return false; // shortcut (there are no points)

    let isInside = false;
    // the first segment is the closing one (from the last point to the first point)
    let start = points[numPoints - 1];
    for (let i = 0; i < numPoints; i++) {
        const end = points[i];
        const startX = start.x;
        const startY = start.y;
        const endX = end.x;
        const endY = end.y;

        // the side of the segment the point is on (`0` = the point is collinear with the segment)
        const side = ((endX - startX) * (y - startY)) - ((endY - startY) * (x - startX));
        if (side === 0) {
            const isBetweenX = (startX <= endX) ? (x >= startX && x <= endX) : (x >= endX && x <= startX);
            const isBetweenY = (startY <= endY) ? (y >= startY && y <= endY) : (y >= endY && y <= startY);
            if (isBetweenX && isBetweenY) return true; // shortcut (the point lies on a segment)
        }

        // Does the horizontal ray to the right of the point cross the segment?
        // A segment collinear with the ray (`y === startY === endY`) is never counted.
        // A segment is counted with only one of its ends, so a ray through a vertex
        // counts one crossing when the shape crosses the ray there, and none or two
        // when it only touches it.
        if (startY >= y) {
            // the segment goes up, the crossing is to the right of the point if the point is on its left
            if (endY < y && side < 0) isInside = !isInside;
        } else {
            // the segment goes down
            if (endY >= y && side > 0) isInside = !isInside;
        }

        // move to check the next segment
        start = end;
    }

    // `true` for an odd number of crossings (even-odd algorithm)
    return isInside;
};
