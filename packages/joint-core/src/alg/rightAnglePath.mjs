import * as g from '../g/index.mjs';

const Directions = {
    AUTO: 'auto',
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top',
    BOTTOM: 'bottom',
    ANCHOR_SIDE: 'anchor-side',
    MAGNET_SIDE: 'magnet-side'
};

function getOutsidePoint(side, pointData) {
    const outsidePoint = pointData.endPoint.clone();

    const { x: x0, y: y0, width, height } = pointData.bbox;

    switch (side) {
        case 'left':
            outsidePoint.x = x0 - pointData.margin;
            break;
        case 'right':
            outsidePoint.x = x0 + width + pointData.margin;
            break;
        case 'top':
            outsidePoint.y = y0 - pointData.margin;
            break;
        case 'bottom':
            outsidePoint.y = y0 + height + pointData.margin;
            break;
    }

    return outsidePoint;
}

// Calculates the distances along the horizontal axis for the left and right route.
function getHorizontalDistance(source, target) {

    const { outsidePoint: sourcePoint } = source;
    const { outsidePoint: targetPoint } = target;

    const sourceBBox = source.bbox;
    const targetBBox = target.bbox;

    const sx0 = sourceBBox.x;
    const sx1 = sourceBBox.x + sourceBBox.width;
    const sy0 = sourceBBox.y;

    const tx0 = targetBBox.x;
    const tx1 = targetBBox.x + targetBBox.width;
    const ty0 = targetBBox.y;

    // Furthest left boundary
    let leftBoundary = Math.min(sx0, tx0);
    // Furthest right boundary
    let rightBoundary = Math.max(sx1, tx1);

    // If the source and target elements are on the same side, we need to figure out what shape defines the boundary.
    if (source.side === target.side) {

        const isSourceAbove = sy0 < ty0;

        // The source and target anchors are on the top => then the shape above defines the boundary.
        // The source and target anchors are on the bottom => then the shape below defines the boundary.
        const useSourceAsBoundary = source.side === Directions.TOP ? isSourceAbove : !isSourceAbove;

        leftBoundary = useSourceAsBoundary ? sx0 : tx0;
        rightBoundary = useSourceAsBoundary ? sx1 : tx1;
    }

    const { x: sox } = sourcePoint;
    const { x: tox } = targetPoint;

    // Calculate the distances for the left route
    const leftDistance1 = Math.abs(sox - leftBoundary);
    const leftDistance2 = Math.abs(tox - leftBoundary);
    const leftD = leftDistance1 + leftDistance2;

    // Calculate the distances for the right route
    const rightDistance1 = Math.abs(sox - rightBoundary);
    const rightDistance2 = Math.abs(tox - rightBoundary);
    const rightD = rightDistance1 + rightDistance2;

    return [leftD, rightD];
}

// Calculates the distances along the vertical axis for the top and bottom route.
function getVerticalDistance(source, target) {
    const { outsidePoint: sourcePoint } = source;
    const { outsidePoint: targetPoint } = target;

    const sourceBBox = source.bbox;
    const targetBBox = target.bbox;

    const sx0 = sourceBBox.x;
    const sy0 = sourceBBox.y;
    const sy1 = sourceBBox.y + sourceBBox.height;

    const tx0 = targetBBox.x;
    const ty0 = targetBBox.y;
    const ty1 = targetBBox.y + targetBBox.height;

    // Furthest top boundary
    let topBoundary = Math.min(sy0, ty0);
    // Furthest bottom boundary
    let bottomBoundary = Math.max(sy1, ty1);

    // If the source and target elements are on the same side, we need to figure out what shape defines the boundary.
    if (source.side === target.side) {

        const isSourceLeft = sx0 < tx0;

        // The source and target anchors are on the left => then the shape on the left defines the boundary.
        // The source and target anchors are on the right => then the shape on the right defines the boundary.
        const useSourceAsBoundary = source.side === Directions.LEFT ? isSourceLeft : !isSourceLeft;

        topBoundary = useSourceAsBoundary ? sy0 : ty0;
        bottomBoundary = useSourceAsBoundary ? sy1 : ty1;
    }

    const { y: soy } = sourcePoint;
    const { y: toy } = targetPoint;

    // Calculate the distances for the top route
    const topDistance1 = Math.abs(soy - topBoundary);
    const topDistance2 = Math.abs(toy - topBoundary);
    const topD = topDistance1 + topDistance2;

    // Calculate the distances for the bottom route
    const bottomDistance1 = Math.abs(soy - bottomBoundary);
    const bottomDistance2 = Math.abs(toy - bottomBoundary);
    const bottomD = bottomDistance1 + bottomDistance2;

    return [topD, bottomD];
}

// Builds the S-shaped connection for the sides facing each other on the horizontal axis
// (`left => right` and `right => left`).
// `isSourcePastTargetMargin` tells whether the source offset point already lies beyond the
// boundary the target route leaves through - if so, both ends share a single vertical segment.
function getHorizontalSShapePoints(sourcePoint, targetPoint, isSourcePastTargetMargin) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;
    const middleY = (sOffsetY + tOffsetY) / 2;

    if (isSourcePastTargetMargin) {
        const middleX = (sOffsetX + tOffsetX) / 2;
        return [
            { x: middleX, y: sOffsetY },
            { x: middleX, y: middleY },
            { x: middleX, y: middleY },
            { x: middleX, y: tOffsetY }
        ];
    }

    return [
        { x: sOffsetX, y: sOffsetY },
        { x: sOffsetX, y: middleY },
        { x: tOffsetX, y: middleY },
        { x: tOffsetX, y: tOffsetY }
    ];
}

// Builds the S-shaped connection for the sides facing each other on the vertical axis
// (`top => bottom` and `bottom => top`) - the counterpart of `getHorizontalSShapePoints()`.
// `isSourcePastTargetMargin` tells whether the source offset point already lies beyond the
// boundary the target route leaves through - if so, both ends share a single horizontal segment.
function getVerticalSShapePoints(sourcePoint, targetPoint, isSourcePastTargetMargin) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;
    const middleX = (sOffsetX + tOffsetX) / 2;

    if (isSourcePastTargetMargin) {
        const middleY = (sOffsetY + tOffsetY) / 2;
        return [
            { x: sOffsetX, y: middleY },
            { x: middleX, y: middleY },
            { x: middleX, y: middleY },
            { x: tOffsetX, y: middleY }
        ];
    }

    return [
        { x: sOffsetX, y: sOffsetY },
        { x: middleX, y: sOffsetY },
        { x: middleX, y: tOffsetY },
        { x: tOffsetX, y: tOffsetY }
    ];
}

// Assembles the points of the route between the sides lying on the horizontal axis
// (`left => right` and `right => left`).
// `bends` is the pair of vertical segments the route bends at (`x1` and `x2`), joined by a
// horizontal one at `y`, with `isUpwardsShorter` telling whether the shorter way around
// the elements is the one upwards. Without it, the two offset points are joined by a
// single vertical segment halfway between them.
function getHorizontalRoutePoints(sourceBBox, targetBBox, sourcePoint, targetPoint, bends = null) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;

    if (!bends) {
        const x = (sOffsetX + tOffsetX) / 2;
        return [
            { x, y: sOffsetY },
            { x, y: tOffsetY }
        ];
    }

    const { y, isUpwardsShorter } = bends;
    let { x1, x2 } = bends;

    const sBoxY0 = sourceBBox.y;
    const sBoxY1 = sBoxY0 + sourceBBox.height;
    const tBoxY0 = targetBBox.y;
    const tBoxY1 = tBoxY0 + targetBBox.height;

    // This is an edge case when the source and target intersect and
    if ((isUpwardsShorter && sOffsetY < tBoxY0) || (!isUpwardsShorter && sOffsetY > tBoxY1)) {
        // the path should no longer rely on the target boundary in `x1`
        x1 = sOffsetX;
    } else if ((isUpwardsShorter && tOffsetY < sBoxY0) || (!isUpwardsShorter && tOffsetY > sBoxY1)) {
        // the path should no longer rely on the source boundary in `x2`
        x2 = tOffsetX;
    }

    return [
        { x: x1, y: sOffsetY },
        { x: x1, y },
        { x: x2, y },
        { x: x2, y: tOffsetY }
    ];
}

// Assembles the points of the route between the sides lying on the vertical axis
// (`top => bottom` and `bottom => top`) - the counterpart of `getHorizontalRoutePoints()`.
// `bends` is the pair of horizontal segments the route bends at (`y1` and `y2`), joined by
// a vertical one at `x`, with `isLeftShorter` telling whether the shorter way around the
// elements is the one to the left. Without it, the two offset points are joined by a
// single horizontal segment halfway between them.
function getVerticalRoutePoints(sourceBBox, targetBBox, sourcePoint, targetPoint, bends = null) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;

    if (!bends) {
        const y = (sOffsetY + tOffsetY) / 2;
        return [
            { x: sOffsetX, y },
            { x: tOffsetX, y }
        ];
    }

    const { x, isLeftShorter } = bends;
    let { y1, y2 } = bends;

    const sBoxX0 = sourceBBox.x;
    const sBoxX1 = sBoxX0 + sourceBBox.width;
    const tBoxX0 = targetBBox.x;
    const tBoxX1 = tBoxX0 + targetBBox.width;

    // This is an edge case when the source and target intersect and
    if ((isLeftShorter && sOffsetX < tBoxX0) || (!isLeftShorter && sOffsetX > tBoxX1)) {
        // the path should no longer rely on the target boundary in `y1`
        y1 = sOffsetY;
    } else if ((isLeftShorter && tOffsetX < sBoxX0) || (!isLeftShorter && tOffsetX > sBoxX1)) {
        // the path should no longer rely on the source boundary in `y2`
        y2 = tOffsetY;
    }

    return [
        { x: sOffsetX, y: y1 },
        { x, y: y1 },
        { x, y: y2 },
        { x: tOffsetX, y: y2 }
    ];
}

// Assembles the points of the route between the sides facing the same way on the horizontal
// axis (`left => left` and `right => right`). The route leaves both sides and joins them with
// a horizontal segment at `y`, reaching it along `x2` on the source end and `x1` on the target
// one.
// `isSourceFurtherOut` tells whether it is the source side that lies further out - the route
// then has to clear the source element, otherwise the target one - and `isUpwardsShorter`
// whether clearing it above the elements is shorter than below.
function getHorizontalSameSideRoutePoints(source, target, sourcePoint, targetPoint, bends) {
    const { y: sOffsetY } = sourcePoint;
    const { y: tOffsetY } = targetPoint;
    const { x1, x2, isSourceFurtherOut, isUpwardsShorter } = bends;

    // The route has to clear the element lying further out and reach the offset point of the other one.
    const { bbox, margin } = isSourceFurtherOut ? source : target;
    const offsetY = isSourceFurtherOut ? tOffsetY : sOffsetY;

    const y = isUpwardsShorter
        ? Math.min(bbox.y - margin, offsetY)
        : Math.max(bbox.y + bbox.height + margin, offsetY);

    return [
        { x: x2, y: sOffsetY },
        { x: x2, y },
        { x: x1, y },
        { x: x1, y: tOffsetY }
    ];
}

// Assembles the points of the route between the sides facing the same way on the vertical
// axis (`top => top` and `bottom => bottom`) - the transposed counterpart of
// `getHorizontalSameSideRoutePoints()`. The route leaves both sides and joins them with a
// vertical segment at `x`, reaching it along `y2` on the source end and `y1` on the target one.
// `isSourceFurtherOut` tells whether it is the source side that lies further out - the route
// then has to clear the source element, otherwise the target one - and `isLeftShorter`
// whether clearing it to the left of the elements is shorter than to the right.
function getVerticalSameSideRoutePoints(source, target, sourcePoint, targetPoint, bends) {
    const { x: sOffsetX } = sourcePoint;
    const { x: tOffsetX } = targetPoint;
    const { y1, y2, isSourceFurtherOut, isLeftShorter } = bends;

    // The route has to clear the element lying further out and reach the offset point of the other one.
    const { bbox, margin } = isSourceFurtherOut ? source : target;
    const offsetX = isSourceFurtherOut ? tOffsetX : sOffsetX;

    const x = isLeftShorter
        ? Math.min(bbox.x - margin, offsetX)
        : Math.max(bbox.x + bbox.width + margin, offsetX);

    return [
        { x: sOffsetX, y: y2 },
        { x, y: y2 },
        { x, y: y1 },
        { x: tOffsetX, y: y1 }
    ];
}

// Assembles the points of the route from the `left` or `right` source side to the `bottom`
// target side, when the target lies beyond that source side (`left => bottom` and
// `right => bottom`).
// `x` is the vertical segment the route bends at, `canTurnAtSource` tells whether the route
// may turn towards the target right after leaving the source side instead.
function getSideToBottomPoints(targetBBox, sourcePoint, targetPoint, sourceMargin, x, canTurnAtSource) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;

    // The source offset point already lies below the target offset point.
    if (sOffsetY >= tOffsetY) {
        return [{ x: tOffsetX, y: sOffsetY }];
    }

    if (canTurnAtSource) {
        const tBoxY1 = targetBBox.y + targetBBox.height;

        // The turn would end up below the bottom side of the target element,
        // so head straight for the target instead.
        if (sOffsetY + sourceMargin > tBoxY1) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y: tOffsetY },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX, y: sOffsetY + sourceMargin },
            { x, y: sOffsetY + sourceMargin },
            { x, y: tOffsetY },
            { x: tOffsetX, y: tOffsetY }
        ];
    }

    return [
        { x, y: sOffsetY },
        { x, y: tOffsetY },
        { x: tOffsetX, y: tOffsetY }
    ];
}

// Assembles the points of the route from the `left` or `right` source side to the `top`
// target side, when the target lies beyond that source side (`left => top` and
// `right => top`) - the counterpart of `getSideToBottomPoints()`.
function getSideToTopPoints(targetBBox, sourcePoint, targetPoint, sourceMargin, x, canTurnAtSource) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;

    // The source offset point already lies above the target offset point.
    if (sOffsetY <= tOffsetY) {
        return [{ x: tOffsetX, y: sOffsetY }];
    }

    if (canTurnAtSource) {
        const tBoxY0 = targetBBox.y;

        // The turn would end up above the top side of the target element,
        // so head straight for the target instead.
        if (sOffsetY - sourceMargin < tBoxY0) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y: tOffsetY },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX, y: sOffsetY - sourceMargin },
            { x, y: sOffsetY - sourceMargin },
            { x, y: tOffsetY },
            { x: tOffsetX, y: tOffsetY }
        ];
    }

    return [
        { x, y: sOffsetY },
        { x, y: tOffsetY },
        { x: tOffsetX, y: tOffsetY }
    ];
}

// Assembles the points of the route from the `top` or `bottom` source side to the `left`
// target side, when the target lies beyond that source side (`top => left` and
// `bottom => left`) - the transposed counterpart of `getSideToBottomPoints()`.
// `y` is the horizontal segment the route bends at, `canTurnAtSource` tells whether the route
// may turn towards the target right after leaving the source side instead.
function getSideToLeftPoints(targetBBox, sourcePoint, targetPoint, sourceMargin, y, canTurnAtSource) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;

    // The source offset point already lies to the left of the target offset point.
    if (sOffsetX <= tOffsetX) {
        return [{ x: sOffsetX, y: tOffsetY }];
    }

    if (canTurnAtSource) {
        const tBoxX0 = targetBBox.x;

        // The turn would end up beyond the left side of the target element,
        // so head straight for the target instead.
        if (sOffsetX - sourceMargin < tBoxX0) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: tOffsetX, y: sOffsetY },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX - sourceMargin, y: sOffsetY },
            { x: sOffsetX - sourceMargin, y },
            { x: tOffsetX, y },
            { x: tOffsetX, y: tOffsetY }
        ];
    }

    return [
        { x: sOffsetX, y },
        { x: tOffsetX, y },
        { x: tOffsetX, y: tOffsetY }
    ];
}

// Assembles the points of the route from the `top` or `bottom` source side to the `right`
// target side, when the target lies beyond that source side (`top => right` and
// `bottom => right`) - the mirror of `getSideToLeftPoints()`.
function getSideToRightPoints(targetBBox, sourcePoint, targetPoint, sourceMargin, y, canTurnAtSource) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;

    // The source offset point already lies to the right of the target offset point.
    if (sOffsetX >= tOffsetX) {
        return [{ x: sOffsetX, y: tOffsetY }];
    }

    if (canTurnAtSource) {
        const tBoxX1 = targetBBox.x + targetBBox.width;

        // The turn would end up beyond the right side of the target element,
        // so head straight for the target instead.
        if (sOffsetX + sourceMargin > tBoxX1) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: tOffsetX, y: sOffsetY },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX + sourceMargin, y: sOffsetY },
            { x: sOffsetX + sourceMargin, y },
            { x: tOffsetX, y },
            { x: tOffsetX, y: tOffsetY }
        ];
    }

    return [
        { x: sOffsetX, y },
        { x: tOffsetX, y },
        { x: tOffsetX, y: tOffsetY }
    ];
}

// Assembles the points of the route from the `left` or `right` source side to the `top` or
// `bottom` target side, when the target does not lie beyond that source side. The route
// leaves the source side and bends at `y`.
// `needsTargetApproach` tells whether it then has to come at the target sideways - through
// `approachX` - instead of reaching it right at the bend.
function getSideToTopOrBottomPoints(sourcePoint, targetPoint, y, approachX, needsTargetApproach) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;

    if (needsTargetApproach) {
        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX, y },
            { x: approachX, y },
            { x: approachX, y: tOffsetY },
            { x: tOffsetX, y: tOffsetY }
        ];
    }

    return [
        { x: sOffsetX, y: sOffsetY },
        { x: sOffsetX, y },
        { x: tOffsetX, y }
    ];
}

// Assembles the points of the route from the `top` or `bottom` source side to the `left` or
// `right` target side, when the target does not lie beyond that source side - the transposed
// counterpart of `getSideToTopOrBottomPoints()`. The route leaves the source side and bends
// at `x`.
// `needsTargetApproach` tells whether it then has to come at the target sideways - through
// `approachY` - instead of reaching it right at the bend.
function getSideToLeftOrRightPoints(sourcePoint, targetPoint, x, approachY, needsTargetApproach) {
    const { x: sOffsetX, y: sOffsetY } = sourcePoint;
    const { x: tOffsetX, y: tOffsetY } = targetPoint;

    if (needsTargetApproach) {
        return [
            { x: sOffsetX, y: sOffsetY },
            { x, y: sOffsetY },
            { x, y: approachY },
            { x: tOffsetX, y: approachY },
            { x: tOffsetX, y: tOffsetY }
        ];
    }

    return [
        { x: sOffsetX, y: sOffsetY },
        { x, y: sOffsetY },
        { x, y: tOffsetY }
    ];
}

export function rightAnglePath(source, target, opt = {}) {
    const {
        bbox: sourceBBox,
        margin: sourceMargin,
        side: sourceSide
    } = source;
    const {
        endPoint: targetPoint,
        bbox: targetBBox,
        margin: targetMargin,
        side: targetSide
    } = target;

    // Temporary `rightAngle` router internal (see `RightAnglePathOptions`):
    // forces the U-shaped detour in the same-side branches, where a
    // zero-size (point) target inside the source bbox escapes the overlap
    // checks below. To be removed once deduced here instead.
    const { targetInSourceBBox = false } = opt;

    const sBoxX0 = sourceBBox.x;
    const sBoxY0 = sourceBBox.y;
    const tBoxX0 = targetBBox.x;
    const tBoxY0 = targetBBox.y;

    const sourceWidth = sourceBBox.width;
    const targetWidth = targetBBox.width;
    const sourceHeight = sourceBBox.height;
    const targetHeight = targetBBox.height;

    const minSourceMargin = opt.minPathMargin ?? sourceMargin;
    const minTargetMargin = opt.minPathMargin ?? targetMargin;

    const tBoxX1 = tBoxX0 + targetWidth;
    const tBoxY1 = tBoxY0 + targetHeight;
    const sBoxX1 = sBoxX0 + sourceWidth;
    const sBoxY1 = sBoxY0 + sourceHeight;

    const sMarginX0 = sBoxX0 - sourceMargin;
    const sMarginX1 = sBoxX1 + sourceMargin;
    const sMarginY0 = sBoxY0 - sourceMargin;
    const sMarginY1 = sBoxY1 + sourceMargin;

    const tMarginX0 = tBoxX0 - targetMargin;
    const tMarginX1 = tBoxX1 + targetMargin;
    const tMarginY0 = tBoxY0 - targetMargin;
    const tMarginY1 = tBoxY1 + targetMargin;

    const sMinMarginX0 = sBoxX0 - minSourceMargin;
    const sMinMarginX1 = sBoxX1 + minSourceMargin;
    const tMinMarginX0 = tBoxX0 - minTargetMargin;
    const tMinMarginX1 = tBoxX1 + minTargetMargin;

    const sMinMarginY0 = sBoxY0 - minSourceMargin;
    const sMinMarginY1 = sBoxY1 + minSourceMargin;
    const tMinMarginY0 = tBoxY0 - minTargetMargin;
    const tMinMarginY1 = tBoxY1 + minTargetMargin;

    const sourceOffsetPoint = getOutsidePoint(sourceSide, source);
    const targetOffsetPoint = getOutsidePoint(targetSide, target);

    const { x: sOffsetX, y: sOffsetY } = sourceOffsetPoint;
    const { x: tOffsetX, y: tOffsetY } = targetOffsetPoint;
    const tCenterX = (tBoxX0 + tBoxX1) / 2;
    const tCenterY = (tBoxY0 + tBoxY1) / 2;
    const sCenterX = (sBoxX0 + sBoxX1) / 2;
    const sCenterY = (sBoxY0 + sBoxY1) / 2;
    const middleOfVerticalSides = (sCenterX < tCenterX ? (sBoxX1 + tBoxX0) : (tBoxX1 + sBoxX0)) / 2;
    const middleOfHorizontalSides = (sCenterY < tCenterY ? (sBoxY1 + tBoxY0) : (tBoxY1 + sBoxY0)) / 2;

    const inflatedSourceBBox = sourceBBox.clone().inflate(sourceMargin);
    const inflatedTargetBBox = targetBBox.clone().inflate(targetMargin);

    const sourceForDistance = Object.assign({}, source, { outsidePoint: sourceOffsetPoint });
    const targetForDistance = Object.assign({}, target, { outsidePoint: targetOffsetPoint });

    // Distances used to determine the shortest route along the connections on horizontal sides for
    // bottom => bottom
    // top => bottom
    // bottom => top
    // top => top
    const [leftDistance, rightDistance] = getHorizontalDistance(sourceForDistance, targetForDistance);

    // Distances used to determine the shortest route along the connection on vertical sides for
    // left => left
    // left => right
    // right => right
    // right => left
    const [topDistance, bottomDistance] = getVerticalDistance(sourceForDistance, targetForDistance);

    // All possible combinations of source and target sides
    if (sourceSide === 'left' && targetSide === 'right') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetOffsetPoint);
        const isPointInsideTarget = inflatedTargetBBox.containsPoint(sourceOffsetPoint);

        // Use S-shaped connection
        if (isPointInsideSource || isPointInsideTarget) {
            return getHorizontalSShapePoints(sourceOffsetPoint, targetOffsetPoint, sOffsetX >= tMinMarginX1);
        }

        if (sOffsetX < tOffsetX) {
            let y = middleOfHorizontalSides;
            let x1 = sOffsetX;
            let x2 = tOffsetX;

            const isUpwardsShorter = topDistance < bottomDistance;

            // If the source and target elements overlap, we need to make sure the connection
            // goes around the target element.
            if (((y >= sMinMarginY0 && y <= sMinMarginY1) || (y >= tMinMarginY0 && y <= tMinMarginY1))) {

                if (sMinMarginX0 > tMinMarginX1) {
                    const middleY = (sOffsetY + tOffsetY) / 2;
                    return [
                        { x: sOffsetX, y: sOffsetY },
                        { x: sOffsetX, y: middleY },
                        { x: tOffsetX, y: middleY },
                        { x: tOffsetX, y: tOffsetY }
                    ];
                }

                if (sMinMarginY1 >= tMinMarginY0 && isUpwardsShorter) {
                    y = Math.min(tMarginY0, sMarginY0);
                } else if (sMinMarginY0 <= tMinMarginY1 && !isUpwardsShorter) {
                    y = Math.max(tMarginY1, sMarginY1);
                }

                // This handles the case when the source and target elements overlap as well as
                // the case when the source is to the left of the target element.
                x1 = Math.min(sOffsetX, tBoxX0 - targetMargin);
                x2 = Math.max(tOffsetX, sBoxX1 + sourceMargin);
            }

            return getHorizontalRoutePoints(sourceBBox, targetBBox, sourceOffsetPoint, targetOffsetPoint, {
                x1,
                x2,
                y,
                isUpwardsShorter
            });
        }

        return getHorizontalRoutePoints(sourceBBox, targetBBox, sourceOffsetPoint, targetOffsetPoint);
    } else if (sourceSide === 'right' && targetSide === 'left') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetOffsetPoint);
        const isPointInsideTarget = inflatedTargetBBox.containsPoint(sourceOffsetPoint);

        // Use S-shaped connection
        if (isPointInsideSource || isPointInsideTarget) {
            return getHorizontalSShapePoints(sourceOffsetPoint, targetOffsetPoint, sOffsetX <= tMinMarginX0);
        }

        if (sOffsetX > tOffsetX) {
            let y = middleOfHorizontalSides;
            let x1 = sOffsetX;
            let x2 = tOffsetX;

            const isUpwardsShorter = topDistance < bottomDistance;

            // If the source and target elements overlap, we need to make sure the connection
            // goes around the target element.
            if ((y >= sMinMarginY0 && y <= sMinMarginY1) || (y >= tMinMarginY0 && y <= tMinMarginY1)) {
                if (sMinMarginX1 < tMinMarginX0) {
                    const middleY = (sOffsetY + tOffsetY) / 2;
                    return [
                        { x: sOffsetX, y: sOffsetY },
                        { x: sOffsetX, y: middleY },
                        { x: tOffsetX, y: middleY },
                        { x: tOffsetX, y: tOffsetY }
                    ];
                }

                if (sMinMarginY1 >= tMinMarginY0 && isUpwardsShorter) {
                    y = Math.min(tMarginY0, sMarginY0);
                } else if (sMinMarginY0 <= tMinMarginY1 && !isUpwardsShorter) {
                    y = Math.max(tMarginY1, sMarginY1);
                }

                // This handles the case when the source and target elements overlap as well as
                // the case when the source is to the left of the target element.
                x1 = Math.max(sOffsetX, tBoxX1 + targetMargin);
                x2 = Math.min(tOffsetX, sBoxX0 - sourceMargin);
            }

            return getHorizontalRoutePoints(sourceBBox, targetBBox, sourceOffsetPoint, targetOffsetPoint, {
                x1,
                x2,
                y,
                isUpwardsShorter
            });
        }

        return getHorizontalRoutePoints(sourceBBox, targetBBox, sourceOffsetPoint, targetOffsetPoint);
    } else if (sourceSide === 'top' && targetSide === 'bottom') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetOffsetPoint);
        const isPointInsideTarget = inflatedTargetBBox.containsPoint(sourceOffsetPoint);

        // Use S-shaped connection
        if (isPointInsideSource || isPointInsideTarget) {
            return getVerticalSShapePoints(sourceOffsetPoint, targetOffsetPoint, sOffsetY >= tMinMarginY1);
        }

        if (sMarginY0 < tOffsetY) {
            let x = middleOfVerticalSides;
            let y1 = sOffsetY;
            let y2 = tOffsetY;

            const isLeftShorter = leftDistance < rightDistance;

            // If the source and target elements overlap, we need to make sure the connection
            // goes around the target element.
            if ((x >= sMinMarginX0 && x <= sMinMarginX1) || (x >= tMinMarginX0 && x <= tMinMarginX1)) {
                if (sMinMarginY0 > tMinMarginY1) {
                    const middleX = (sOffsetX + tOffsetX) / 2;
                    return [
                        { x: sOffsetX, y: sOffsetY },
                        { x: middleX, y: sOffsetY },
                        { x: middleX, y: tOffsetY },
                        { x: tOffsetX, y: tOffsetY }
                    ];
                }

                if (sMinMarginX1 >= tMinMarginX0 && isLeftShorter) {
                    x = Math.min(tMarginX0, sMarginX0);
                } else if (sMinMarginX0 <= tMinMarginX1 && !isLeftShorter) {
                    x = Math.max(tMarginX1, sMarginX1);
                }

                // This handles the case when the source and target elements overlap as well as
                // the case when the source is to the left of the target element.
                y1 = Math.min(sOffsetY, tBoxY0 - targetMargin);
                y2 = Math.max(tOffsetY, sBoxY1 + sourceMargin);
            }

            return getVerticalRoutePoints(sourceBBox, targetBBox, sourceOffsetPoint, targetOffsetPoint, {
                y1,
                y2,
                x,
                isLeftShorter
            });
        }

        return getVerticalRoutePoints(sourceBBox, targetBBox, sourceOffsetPoint, targetOffsetPoint);
    } else if (sourceSide === 'bottom' && targetSide === 'top') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetOffsetPoint);
        const isPointInsideTarget = inflatedTargetBBox.containsPoint(sourceOffsetPoint);

        // Use S-shaped connection
        if (isPointInsideSource || isPointInsideTarget) {
            return getVerticalSShapePoints(sourceOffsetPoint, targetOffsetPoint, sOffsetY <= tMinMarginY0);
        }

        if (sMarginY1 > tOffsetY) {
            let x = middleOfVerticalSides;
            let y1 = sOffsetY;
            let y2 = tOffsetY;

            const isLeftShorter = leftDistance < rightDistance;

            // If the source and target elements overlap, we need to make sure the connection
            // goes around the target element.
            if ((x >= sMinMarginX0 && x <= sMinMarginX1) || (x >= tMinMarginX0 && x <= tMinMarginX1)) {
                if (sMinMarginY1 < tMinMarginY0) {
                    const middleX = (sOffsetX + tOffsetX) / 2;
                    return [
                        { x: sOffsetX, y: sOffsetY },
                        { x: middleX, y: sOffsetY },
                        { x: middleX, y: tOffsetY },
                        { x: tOffsetX, y: tOffsetY }
                    ];
                }

                if (sMinMarginX1 >= tMinMarginX0 && isLeftShorter) {
                    x = Math.min(tMarginX0, sMarginX0);
                } else if (sMinMarginX0 <= tMinMarginX1 && !isLeftShorter) {
                    x = Math.max(tMarginX1, sMarginX1);
                }

                // This handles the case when the source and target elements overlap as well as
                // the case when the source is to the left of the target element.
                y1 = Math.max(sOffsetY, tBoxY1 + targetMargin);
                y2 = Math.min(tOffsetY, sBoxY0 - sourceMargin);
            }

            return getVerticalRoutePoints(sourceBBox, targetBBox, sourceOffsetPoint, targetOffsetPoint, {
                y1,
                y2,
                x,
                isLeftShorter
            });
        }

        return getVerticalRoutePoints(sourceBBox, targetBBox, sourceOffsetPoint, targetOffsetPoint);
    } else if (sourceSide === 'top' && targetSide === 'top') {
        const useUShapeConnection =
            targetInSourceBBox ||
            g.intersection.rectWithRect(inflatedSourceBBox, targetBBox) ||
            (sOffsetY <= tBoxY0 && (inflatedSourceBBox.bottomRight().x <= tOffsetX || inflatedSourceBBox.bottomLeft().x >= tOffsetX)) ||
            (sOffsetY >= tBoxY0 && (inflatedTargetBBox.bottomRight().x <= sOffsetX || inflatedTargetBBox.bottomLeft().x >= sOffsetX));

        // U-shape connection is a straight line if `sox` and `tox` are the same
        if (useUShapeConnection && sOffsetX !== tOffsetX) {
            return [
                { x: sOffsetX, y: Math.min(sOffsetY, tOffsetY) },
                { x: tOffsetX, y: Math.min(sOffsetY, tOffsetY) }
            ];
        }

        const y1 = Math.min((sBoxY1 + tBoxY0) / 2, tOffsetY);
        const y2 = Math.min((sBoxY0 + tBoxY1) / 2, sOffsetY);

        return getVerticalSameSideRoutePoints(source, target, sourceOffsetPoint, targetOffsetPoint, {
            y1,
            y2,
            isSourceFurtherOut: tOffsetY >= sOffsetY,
            isLeftShorter: leftDistance < rightDistance
        });

    } else if (sourceSide === 'bottom' && targetSide === 'bottom') {
        const useUShapeConnection =
            targetInSourceBBox ||
            g.intersection.rectWithRect(inflatedSourceBBox, targetBBox) ||
            (sOffsetY >= tOffsetY && (inflatedSourceBBox.topRight().x <= tOffsetX || inflatedSourceBBox.topLeft().x >= tOffsetX)) ||
            (sOffsetY <= tOffsetY && (inflatedTargetBBox.topRight().x <= sOffsetX || inflatedTargetBBox.topLeft().x >= sOffsetX));

        // U-shape connection is a straight line if `sox` and `tox` are the same
        if (useUShapeConnection && sOffsetX !== tOffsetX) {
            return [
                { x: sOffsetX, y: Math.max(sOffsetY, tOffsetY) },
                { x: tOffsetX, y: Math.max(sOffsetY, tOffsetY) }
            ];
        }

        const y1 = Math.max((sBoxY0 + tBoxY1) / 2, tOffsetY);
        const y2 = Math.max((sBoxY1 + tBoxY0) / 2, sOffsetY);

        return getVerticalSameSideRoutePoints(source, target, sourceOffsetPoint, targetOffsetPoint, {
            y1,
            y2,
            isSourceFurtherOut: tOffsetY <= sOffsetY,
            isLeftShorter: leftDistance < rightDistance
        });

    } else if (sourceSide === 'left' && targetSide === 'left') {
        const useUShapeConnection =
            targetInSourceBBox ||
            g.intersection.rectWithRect(inflatedSourceBBox, targetBBox) ||
            (sOffsetX <= tOffsetX && (inflatedSourceBBox.bottomRight().y <= tOffsetY || inflatedSourceBBox.topRight().y >= tOffsetY)) ||
            (sOffsetX >= tOffsetX && (inflatedTargetBBox.bottomRight().y <= sOffsetY || inflatedTargetBBox.topRight().y >= sOffsetY));

        // U-shape connection is a straight line if `soy` and `toy` are the same
        if (useUShapeConnection && sOffsetY !== tOffsetY) {
            return [
                { x: Math.min(sOffsetX, tOffsetX), y: sOffsetY },
                { x: Math.min(sOffsetX, tOffsetX), y: tOffsetY }
            ];
        }

        const x1 = Math.min((sBoxX1 + tBoxX0) / 2, tOffsetX);
        const x2 = Math.min((sBoxX0 + tBoxX1) / 2, sOffsetX);

        return getHorizontalSameSideRoutePoints(source, target, sourceOffsetPoint, targetOffsetPoint, {
            x1,
            x2,
            isSourceFurtherOut: tOffsetX > sOffsetX,
            isUpwardsShorter: topDistance <= bottomDistance
        });

    } else if (sourceSide === 'right' && targetSide === 'right') {
        const useUShapeConnection =
            targetInSourceBBox ||
            g.intersection.rectWithRect(inflatedSourceBBox, targetBBox) ||
            (sOffsetX >= tOffsetX && (inflatedSourceBBox.bottomLeft().y <= tOffsetY || inflatedSourceBBox.topLeft().y >= tOffsetY)) ||
            (sOffsetX <= tOffsetX && (inflatedTargetBBox.bottomLeft().y <= sOffsetY || inflatedTargetBBox.topLeft().y >= sOffsetY));

        // U-shape connection is a straight line if `soy` and `toy` are the same
        if (useUShapeConnection && sOffsetY !== tOffsetY) {
            return [
                { x: Math.max(sOffsetX, tOffsetX), y: sOffsetY },
                { x: Math.max(sOffsetX, tOffsetX), y: tOffsetY }
            ];
        }

        const x1 = Math.max((sBoxX0 + tBoxX1) / 2, tOffsetX);
        const x2 = Math.max((sBoxX1 + tBoxX0) / 2, sOffsetX);

        return getHorizontalSameSideRoutePoints(source, target, sourceOffsetPoint, targetOffsetPoint, {
            x1,
            x2,
            isSourceFurtherOut: tOffsetX <= sOffsetX,
            isUpwardsShorter: topDistance <= bottomDistance
        });

    } else if (sourceSide === 'top' && targetSide === 'right') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetPoint);

        // The target point is inside the source element
        if (isPointInsideSource) {
            if (sOffsetX <= tOffsetX - sourceMargin) {
                const x = Math.max(sMarginX1, tOffsetX);
                const y = Math.min(sMarginY0, tMarginY0);

                // Target anchor is on the right side of the source anchor
                return [
                    { x: sOffsetX, y },
                    { x: x, y },
                    { x: x, y: tOffsetY }
                ];
            }

            // Target anchor is on the left side of the source anchor
            // Subtract the `sourceMargin` since the source anchor is on the right side of the target anchor
            const anchorMiddleX = (sOffsetX + tOffsetX) / 2;

            return [
                { x: sOffsetX, y: sOffsetY },
                { x: anchorMiddleX, y: sOffsetY },
                { x: anchorMiddleX, y: tOffsetY }
            ];
        }

        if (sMarginY0 > tOffsetY) {
            let y = tMarginY0;
            let canTurnAtSource = false;

            if (tMinMarginY1 <= sMinMarginY0 && tMarginX1 >= sOffsetX) {
                y = middleOfHorizontalSides;
                canTurnAtSource = sOffsetY < tMinMarginY1;
            }

            return getSideToRightPoints(targetBBox, sourceOffsetPoint, targetOffsetPoint, sourceMargin, y, canTurnAtSource);
        }

        const x = Math.max(middleOfVerticalSides, tMinMarginX1);

        if (sOffsetX > tOffsetX && sBoxY1 >= tOffsetY) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x, y: sOffsetY },
                { x, y: tOffsetY }
            ];
        }

        if (x > sMinMarginX0 && sOffsetY < tBoxY1) {
            const y = Math.min(sMarginY0, tMarginY0);
            const x = Math.max(sMarginX1, tMarginX1);
            return [
                { x: sOffsetX, y },
                { x, y },
                { x, y: tOffsetY }
            ];
        }

        return getSideToLeftOrRightPoints(sourceOffsetPoint, targetOffsetPoint, x, tOffsetY - targetMargin, tOffsetX > sMinMarginX0);

    } else if (sourceSide === 'top' && targetSide === 'left') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetPoint);

        // The target point is inside the source element
        if (isPointInsideSource) {
            if (sOffsetX >= tOffsetX + sourceMargin) {
                const x = Math.min(sMarginX0, tOffsetX);
                const y = Math.min(sMarginY0, tMarginY0);

                // Target anchor is on the left side of the source anchor
                return [
                    { x: sOffsetX, y },
                    { x: x, y },
                    { x: x, y: tOffsetY }
                ];
            }

            // Target anchor is on the right side of the source anchor
            // Add the `sourceMargin` since the source anchor is on the left side of the target anchor
            const anchorMiddleX = (sOffsetX + tOffsetX) / 2;

            return [
                { x: sOffsetX, y: sOffsetY },
                { x: anchorMiddleX, y: sOffsetY },
                { x: anchorMiddleX, y: tOffsetY }
            ];
        }

        if (sMarginY0 > tOffsetY) {
            let y = tMarginY0;
            let canTurnAtSource = false;

            if (tMinMarginY1 <= sMinMarginY0 && tMarginX0 <= sOffsetX) {
                y = middleOfHorizontalSides;
                canTurnAtSource = sOffsetY < tMinMarginY1;
            }

            return getSideToLeftPoints(targetBBox, sourceOffsetPoint, targetOffsetPoint, sourceMargin, y, canTurnAtSource);
        }

        const x = Math.min(tMinMarginX0, middleOfVerticalSides);

        if (sOffsetX < tOffsetX && sBoxY1 >= tOffsetY) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x, y: sOffsetY },
                { x, y: tOffsetY }];
        }

        if (x < sMinMarginX1 && sOffsetY < tBoxY1) {
            const y = Math.min(sMarginY0, tMarginY0);
            const x = Math.min(sMarginX0, tMarginX0);
            return [
                { x: sOffsetX, y },
                { x, y },
                { x, y: tOffsetY }
            ];
        }

        return getSideToLeftOrRightPoints(sourceOffsetPoint, targetOffsetPoint, x, tOffsetY - targetMargin, tOffsetX < sMinMarginX1);

    } else if (sourceSide === 'bottom' && targetSide === 'right') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetPoint);

        // The target point is inside the source element
        if (isPointInsideSource) {
            if (sOffsetX <= tOffsetX - sourceMargin) {
                const x = Math.max(sMarginX1, tOffsetX);
                const y = Math.max(sMarginY1, tMarginY1);

                // Target anchor is on the right side of the source anchor
                return [
                    { x: sOffsetX, y },
                    { x, y },
                    { x, y: tOffsetY }
                ];
            }

            // Target anchor is on the left side of the source anchor
            // Subtract the `sourceMargin` since the source anchor is on the right side of the target anchor
            const anchorMiddleX = (sOffsetX + tOffsetX) / 2;

            return [
                { x: sOffsetX, y: sOffsetY },
                { x: anchorMiddleX, y: sOffsetY },
                { x: anchorMiddleX, y: tOffsetY }
            ];
        }

        if (sMarginY1 < tOffsetY) {
            let y = tMarginY1;
            let canTurnAtSource = false;

            if (tMinMarginY0 >= sMinMarginY1 && tMarginX1 >= sOffsetX) {
                y = middleOfHorizontalSides;
                canTurnAtSource = sOffsetY > tMinMarginY0;
            }

            return getSideToRightPoints(targetBBox, sourceOffsetPoint, targetOffsetPoint, sourceMargin, y, canTurnAtSource);
        }

        const x = Math.max(middleOfVerticalSides, tMinMarginX1);

        if (sOffsetX > tOffsetX && sBoxY0 <= tOffsetY) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x, y: sOffsetY },
                { x, y: tOffsetY }
            ];
        }

        if (x > sMinMarginX0 && sOffsetY > tBoxY0) {
            const y = Math.max(sMarginY1, tMarginY1);
            const x = Math.max(sMarginX1, tMarginX1);
            return [
                { x: sOffsetX, y },
                { x, y },
                { x, y: tOffsetY }
            ];
        }

        return getSideToLeftOrRightPoints(sourceOffsetPoint, targetOffsetPoint, x, tOffsetY + targetMargin, tOffsetX > sMinMarginX0);

    } else if (sourceSide === 'bottom' && targetSide === 'left') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetPoint);

        // The target point is inside the source element
        if (isPointInsideSource) {
            if (sOffsetX >= tOffsetX + sourceMargin) {
                const x = Math.min(sOffsetX - sourceMargin, tOffsetX);
                const y = Math.max(sMarginY1, tMarginY1);

                // Target anchor is on the left side of the source anchor
                return [
                    { x: sOffsetX, y },
                    { x, y },
                    { x, y: tOffsetY }
                ];
            }

            // Target anchor is on the right side of the source anchor
            // Add the `sourceMargin` since the source anchor is on the left side of the target anchor
            const anchorMiddleX = (sOffsetX + tOffsetX) / 2;

            return [
                { x: sOffsetX, y: sOffsetY },
                { x: anchorMiddleX, y: sOffsetY },
                { x: anchorMiddleX, y: tOffsetY }
            ];
        }

        if (sMarginY1 < tOffsetY) {
            let y = tMarginY1;
            let canTurnAtSource = false;

            if (tMinMarginY0 >= sMinMarginY1 && tMarginX0 <= sOffsetX) {
                y = middleOfHorizontalSides;
                canTurnAtSource = sOffsetY > tMinMarginY0;
            }

            return getSideToLeftPoints(targetBBox, sourceOffsetPoint, targetOffsetPoint, sourceMargin, y, canTurnAtSource);
        }

        const x = Math.min(tMinMarginX0, middleOfVerticalSides);

        if (sOffsetX < tOffsetX && sBoxY0 <= tOffsetY) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x, y: sOffsetY },
                { x, y: tOffsetY }
            ];
        }

        if (x < sMinMarginX1 && sOffsetY > tBoxY0) {
            const y = Math.max(sMarginY1, tMarginY1);
            const x = Math.min(sMarginX0, tMarginX0);
            return [
                { x: sOffsetX, y },
                { x, y },
                { x, y: tOffsetY }
            ];
        }

        return getSideToLeftOrRightPoints(sourceOffsetPoint, targetOffsetPoint, x, tOffsetY + targetMargin, tOffsetX < sMinMarginX1);

    } else if (sourceSide === 'left' && targetSide === 'bottom') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetPoint);

        // The target point is inside the source element
        if (isPointInsideSource) {
            if (sOffsetY <= tMinMarginY1) {
                const x = Math.min(sMarginX0, tMarginX0);
                const y = Math.max(sOffsetY, tOffsetY);

                return [
                    { x, y: sOffsetY },
                    { x, y },
                    { x: tOffsetX, y }
                ];
            }

            // Target anchor is above the source anchor
            const anchorMiddleY = (sOffsetY + tOffsetY) / 2;

            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y: anchorMiddleY },
                { x: tOffsetX, y: anchorMiddleY }
            ];
        }

        if (sMarginX0 > tOffsetX) {
            let x = tMarginX0;
            let canTurnAtSource = false;

            if (tMinMarginX1 <= sMinMarginX0 && tMarginY1 >= sOffsetY) {
                x = middleOfVerticalSides;
                canTurnAtSource = sOffsetX < tMinMarginX1;
            }

            return getSideToBottomPoints(targetBBox, sourceOffsetPoint, targetOffsetPoint, sourceMargin, x, canTurnAtSource);
        }

        const y = Math.max(tMinMarginY1, middleOfHorizontalSides);

        if (sOffsetY > tOffsetY && sBoxX1 >= tOffsetX) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y },
                { x: tOffsetX, y }
            ];
        }

        if (y > sMinMarginY0 && sOffsetX < tBoxX1) {
            const x = Math.min(sMarginX0, tMarginX0);
            const y = Math.max(sMarginY1, tMarginY1);

            return [
                { x, y: sOffsetY },
                { x, y },
                { x: tOffsetX, y }
            ];
        }

        return getSideToTopOrBottomPoints(sourceOffsetPoint, targetOffsetPoint, y, tOffsetX - sourceMargin, tOffsetY > sMinMarginY0);

    } else if (sourceSide === 'left' && targetSide === 'top') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetPoint);

        // The target point is inside the source element
        if (isPointInsideSource) {
            if (sOffsetY >= tMarginY0) {
                const y = Math.min(sMarginY0, tOffsetY);
                const x = Math.min(sMarginX0, tMarginX0);

                // Target anchor is on the top side of the source anchor
                return [
                    { x, y: sOffsetY },
                    { x, y },
                    { x: tOffsetX, y }
                ];
            }

            // Target anchor is below the source anchor
            // Add the `sourceMargin` since the source anchor is above the target anchor
            const anchorMiddleY = (sOffsetY + tOffsetY) / 2;

            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y: anchorMiddleY },
                { x: tOffsetX, y: anchorMiddleY }
            ];
        }

        if (sMarginX0 > tOffsetX) {
            let x = tMarginX0;
            let canTurnAtSource = false;

            if (tMinMarginX1 <= sMinMarginX0 && tMarginY0 <= sOffsetY) {
                x = middleOfVerticalSides;
                canTurnAtSource = sOffsetX < tMinMarginX1;
            }

            return getSideToTopPoints(targetBBox, sourceOffsetPoint, targetOffsetPoint, sourceMargin, x, canTurnAtSource);
        }

        const y = Math.min(tMinMarginY0, middleOfHorizontalSides);

        if (sOffsetY < tOffsetY && sBoxX1 >= tOffsetX) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y },
                { x: tOffsetX, y }];
        }

        if (y < sMinMarginY1 && sOffsetX < tBoxX1) {
            const x = Math.min(sMarginX0, tMarginX0);
            const y = Math.min(sMarginY0, tMarginY0);
            return [
                { x, y: sOffsetY },
                { x, y },
                { x: tOffsetX, y }
            ];
        }

        return getSideToTopOrBottomPoints(sourceOffsetPoint, targetOffsetPoint, y, tOffsetX - sourceMargin, tOffsetY < sMinMarginY1);

    } else if (sourceSide === 'right' && targetSide === 'top') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetPoint);

        // The target point is inside the source element
        if (isPointInsideSource) {
            if (sOffsetY >= tMarginY0) {
                const x = Math.max(sMarginX1, tMarginX1);
                const y = Math.min(sOffsetY - sourceMargin, tOffsetY);

                // Target anchor is on the top side of the source anchor
                return [
                    { x, y: sOffsetY },
                    { x, y }, // Path adjustment for right side start
                    { x: tOffsetX, y }
                ];
            }

            // Target anchor is below the source anchor
            // Adjust sourceMargin calculation since the source anchor is now on the right
            const anchorMiddleY = (sOffsetY + tOffsetY) / 2;

            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y: anchorMiddleY },
                { x: tOffsetX, y: anchorMiddleY }
            ];
        }

        if (sMarginX1 < tOffsetX) {
            let x = tMarginX1;
            let canTurnAtSource = false;

            if (tMinMarginX0 >= sMinMarginX1 && tMarginY0 <= sOffsetY) {
                x = middleOfVerticalSides;
                canTurnAtSource = sOffsetX > tMinMarginX0;
            }

            return getSideToTopPoints(targetBBox, sourceOffsetPoint, targetOffsetPoint, sourceMargin, x, canTurnAtSource);
        }

        const y = Math.min(tMinMarginY0, middleOfHorizontalSides);

        if (sOffsetY < tOffsetY && sBoxX0 <= tOffsetX) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y },
                { x: tOffsetX, y }];
        }

        if (y < sMinMarginY1 && sOffsetX > tBoxX0) {
            const x = Math.max(sMarginX1, tMarginX1);
            const y = Math.min(sMarginY0, tMarginY0);

            return [
                { x, y: sOffsetY },
                { x, y },
                { x: tOffsetX, y }
            ];
        }

        return getSideToTopOrBottomPoints(sourceOffsetPoint, targetOffsetPoint, y, tOffsetX + sourceMargin, tOffsetY < sMinMarginY1);

    } else if (sourceSide === 'right' && targetSide === 'bottom') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetPoint);

        // The target point is inside the source element
        if (isPointInsideSource) {
            if (sOffsetY <= tMinMarginY1) {
                const x = Math.max(sMarginX1, tMarginX1);
                const y = Math.max(sOffsetY, tOffsetY);

                return [
                    { x, y: sOffsetY },
                    { x, y },
                    { x: tOffsetX, y }
                ];
            }

            // Target anchor is above the source anchor
            const anchorMiddleY = (sOffsetY + tOffsetY) / 2;

            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y: anchorMiddleY },
                { x: tOffsetX, y: anchorMiddleY }
            ];
        }

        if (sMarginX1 < tOffsetX) {
            let x = tMarginX1;
            let canTurnAtSource = false;

            if (tMinMarginX0 >= sMinMarginX1 && tMarginY1 >= sOffsetY) {
                x = middleOfVerticalSides;
                canTurnAtSource = sOffsetX > tMinMarginX0;
            }

            return getSideToBottomPoints(targetBBox, sourceOffsetPoint, targetOffsetPoint, sourceMargin, x, canTurnAtSource);
        }

        const y = Math.max(tMinMarginY1, middleOfHorizontalSides);

        if (sOffsetY > tOffsetY && sBoxX0 <= tOffsetX) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y },
                { x: tOffsetX, y }
            ];
        }

        if (y > sMinMarginY0 && sOffsetX > tBoxX0) {
            const x = Math.max(sMarginX1, tMarginX1);
            const y = Math.max(sMarginY1, tMarginY1);

            return [
                { x, y: sOffsetY },
                { x, y },
                { x: tOffsetX, y }
            ];
        }

        return getSideToTopOrBottomPoints(sourceOffsetPoint, targetOffsetPoint, y, tOffsetX + sourceMargin, tOffsetY > sMinMarginY0);
    }
}
