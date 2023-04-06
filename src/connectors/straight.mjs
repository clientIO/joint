import * as g from '../g/index.mjs';

const CornerTypes = {
    POINT: 'point',
    CUBIC: 'cubic',
    LINE: 'line',
    GAP: 'gap'
};

const DEFINED_CORNER_TYPES = Object.values(CornerTypes);

const CORNER_RADIUS = 10;
const PRECISION = 1;

export const straight = function(sourcePoint, targetPoint, routePoints = [], opt = {}) {

    const {
        cornerType = CornerTypes.POINT,
        cornerRadius = CORNER_RADIUS,
        cornerPreserveAspectRatio = false,
        precision = PRECISION,
        raw = false
    } = opt;

    if (DEFINED_CORNER_TYPES.indexOf(cornerType) === -1) {
        // unknown `cornerType` provided => error
        throw new Error('Invalid `cornerType` provided to `straight` connector.');
    }

    let path;

    if ((cornerType === CornerTypes.POINT) || !cornerRadius) {
        // default option => normal connector
        // simply connect all points with straight lines
        const points = [sourcePoint].concat(routePoints).concat([targetPoint]);
        const polyline = new g.Polyline(points);
        path = new g.Path(polyline);

    } else {
        // `cornerType` is not unknown and not 'point' (default) => must be one of other valid types
        path = new g.Path();

        // add initial gap segment = to source point
        path.appendSegment(g.Path.createSegment('M', sourcePoint));

        let nextDistance;
        const routePointsLength = routePoints.length;
        for (let i = 0; i < routePointsLength; i++) {

            const curr = new g.Point(routePoints[i]);
            const prev = (routePoints[i - 1] || sourcePoint);
            const next = (routePoints[i + 1] || targetPoint);
            const prevDistance = (nextDistance || (curr.distance(prev) / 2)); // try to re-use previously-computed `nextDistance`
            nextDistance = (curr.distance(next) / 2);

            let startMove, endMove;
            if (!cornerPreserveAspectRatio) {
                // `startMove` and `endMove` may be different
                // (this happens when next or previous path point is closer than `2 * cornerRadius`)
                startMove = -Math.min(cornerRadius, prevDistance);
                endMove = -Math.min(cornerRadius, nextDistance);
            } else {
                // force `startMove` and `endMove` to be the same
                startMove = endMove = -Math.min(cornerRadius, prevDistance, nextDistance);
            }

            // to find `cornerStart` and `cornerEnd`, the logic is as follows (using `cornerStart` as example):
            // - find a point lying on the line `prev - startMove` such that...
            // - ...the point lies `abs(startMove)` distance away from `curr`...
            // - ...and its coordinates are rounded to whole numbers
            const cornerStart = curr.clone().move(prev, startMove).round(precision);
            const cornerEnd = curr.clone().move(next, endMove).round(precision);

            // add in-between straight segment = from previous route point to corner start point
            // (may have zero length)
            path.appendSegment(g.Path.createSegment('L', cornerStart));

            // add corner segment = from corner start point to corner end point
            switch (cornerType) {
                case CornerTypes.CUBIC: {
                    // corner is rounded
                    const _13 = (1 / 3);
                    const _23 = (2 / 3);
                    const control1 = new g.Point((_13 * cornerStart.x) + (_23 * curr.x), (_23 * curr.y) + (_13 * cornerStart.y));
                    const control2 = new g.Point((_13 * cornerEnd.x) + (_23 * curr.x), (_23 * curr.y) + (_13 * cornerEnd.y));
                    path.appendSegment(g.Path.createSegment('C', control1, control2, cornerEnd));
                    break;
                }
                case CornerTypes.LINE: {
                    // corner has bevel
                    path.appendSegment(g.Path.createSegment('L', cornerEnd));
                    break;
                }
                case CornerTypes.GAP: {
                    // corner has empty space
                    path.appendSegment(g.Path.createSegment('M', cornerEnd));
                    break;
                }
                // default: no segment is created
            }
        }

        // add final straight segment = from last corner end point to target point
        // (= or from start point to end point, if there are no route points)
        // (may have zero length)
        path.appendSegment(g.Path.createSegment('L', targetPoint));
    }

    return ((raw) ? path : path.serialize());
};
