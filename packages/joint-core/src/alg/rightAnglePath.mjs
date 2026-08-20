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
            const middleY = (sOffsetY + tOffsetY) / 2;

            if (sOffsetX < tMinMarginX1) {
                return [
                    { x: sOffsetX, y: sOffsetY },
                    { x: sOffsetX, y: middleY },
                    { x: tOffsetX, y: middleY },
                    { x: tOffsetX, y: tOffsetY }
                ];
            } else {
                const middleX = (sOffsetX + tOffsetX) / 2;
                return [
                    { x: middleX, y: sOffsetY },
                    { x: middleX, y: middleY },
                    { x: middleX, y: middleY },
                    { x: middleX, y: tOffsetY }
                ];
            }
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

                // This is an edge case when the source and target intersect and
                if ((isUpwardsShorter && sOffsetY < tBoxY0) || (!isUpwardsShorter && sOffsetY > tBoxY1)) {
                    // the path should no longer rely on minimal x boundary in `x1`
                    x1 = sOffsetX;
                } else if ((isUpwardsShorter && tOffsetY < sBoxY0) || (!isUpwardsShorter && tOffsetY > sBoxY1)) {
                    // the path should no longer rely on maximal x boundary in `x2`
                    x2 = tOffsetX;
                }
            }

            return [
                { x: x1, y: sOffsetY },
                { x: x1, y },
                { x: x2, y },
                { x: x2, y: tOffsetY }
            ];
        }

        const x = (sOffsetX + tOffsetX) / 2;
        return [
            { x, y: sOffsetY },
            { x, y: tOffsetY },
        ];
    } else if (sourceSide === 'right' && targetSide === 'left') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetOffsetPoint);
        const isPointInsideTarget = inflatedTargetBBox.containsPoint(sourceOffsetPoint);

        // Use S-shaped connection
        if (isPointInsideSource || isPointInsideTarget) {
            const middleY = (sOffsetY + tOffsetY) / 2;

            if (sOffsetX > tMinMarginX0) {
                return [
                    { x: sOffsetX, y: sOffsetY },
                    { x: sOffsetX, y: middleY },
                    { x: tOffsetX, y: middleY },
                    { x: tOffsetX, y: tOffsetY }
                ];
            } else {
                const middleX = (sOffsetX + tOffsetX) / 2;
                return [
                    { x: middleX, y: sOffsetY },
                    { x: middleX, y: middleY },
                    { x: middleX, y: middleY },
                    { x: middleX, y: tOffsetY }
                ];
            }
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

                // This is an edge case when the source and target intersect and
                if ((isUpwardsShorter && sOffsetY < tBoxY0) || (!isUpwardsShorter && sOffsetY > tBoxY1)) {
                    // the path should no longer rely on maximal x boundary in `x1`
                    x1 = sOffsetX;
                } else if ((isUpwardsShorter && tOffsetY < sBoxY0) || (!isUpwardsShorter && tOffsetY > sBoxY1)) {
                    // the path should no longer rely on minimal x boundary in `x2`
                    x2 = tOffsetX;
                }
            }

            return [
                { x: x1, y: sOffsetY },
                { x: x1, y },
                { x: x2, y },
                { x: x2, y: tOffsetY }
            ];
        }

        const x = (sOffsetX + tOffsetX) / 2;
        return [
            { x, y: sOffsetY },
            { x, y: tOffsetY }
        ];
    } else if (sourceSide === 'top' && targetSide === 'bottom') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetOffsetPoint);
        const isPointInsideTarget = inflatedTargetBBox.containsPoint(sourceOffsetPoint);

        // Use S-shaped connection
        if (isPointInsideSource || isPointInsideTarget) {
            const middleX = (sOffsetX + tOffsetX) / 2;

            if (sOffsetY < tMinMarginY1) {
                return [
                    { x: sOffsetX, y: sOffsetY },
                    { x: middleX, y: sOffsetY },
                    { x: middleX, y: tOffsetY },
                    { x: tOffsetX, y: tOffsetY }
                ];
            } else {
                const middleY = (sOffsetY + tOffsetY) / 2;
                return [
                    { x: sOffsetX, y: middleY },
                    { x: middleX, y: middleY },
                    { x: middleX, y: middleY },
                    { x: tOffsetX, y: middleY }
                ];
            }
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

                // This is an edge case when the source and target intersect and
                if ((isLeftShorter && sOffsetX < tBoxX0) || (!isLeftShorter && sOffsetX > tBoxX1)) {
                    // the path should no longer rely on minimal y boundary in `y1`
                    y1 = sOffsetY;
                } else if ((isLeftShorter && tOffsetX < sBoxX0) || (!isLeftShorter && tOffsetX > sBoxX1)) {
                    // the path should no longer rely on maximal y boundary in `y2`
                    y2 = tOffsetY;
                }
            }

            return [
                { x: sOffsetX, y: y1 },
                { x, y: y1 },
                { x, y: y2 },
                { x: tOffsetX, y: y2 }
            ];
        }

        const y = (sOffsetY + tOffsetY) / 2;
        return [
            { x: sOffsetX, y },
            { x: tOffsetX, y }
        ];
    } else if (sourceSide === 'bottom' && targetSide === 'top') {
        const isPointInsideSource = inflatedSourceBBox.containsPoint(targetOffsetPoint);
        const isPointInsideTarget = inflatedTargetBBox.containsPoint(sourceOffsetPoint);

        // Use S-shaped connection
        if (isPointInsideSource || isPointInsideTarget) {
            const middleX = (sOffsetX + tOffsetX) / 2;

            if (sOffsetY > tMinMarginY0) {
                return [
                    { x: sOffsetX, y: sOffsetY },
                    { x: middleX, y: sOffsetY },
                    { x: middleX, y: tOffsetY },
                    { x: tOffsetX, y: tOffsetY }
                ];
            } else {
                const middleY = (sOffsetY + tOffsetY) / 2;
                return [
                    { x: sOffsetX, y: middleY },
                    { x: middleX, y: middleY },
                    { x: middleX, y: middleY },
                    { x: tOffsetX, y: middleY }
                ];
            }
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

                // This is an edge case when the source and target intersect and
                if ((isLeftShorter && sOffsetX < tBoxX0) || (!isLeftShorter && sOffsetX > tBoxX1)) {
                    // the path should no longer rely on maximal y boundary in `y1`
                    y1 = sOffsetY;
                } else if ((isLeftShorter && tOffsetX < sBoxX0) || (!isLeftShorter && tOffsetX > sBoxX1)) {
                    // the path should no longer rely on minimal y boundary in `y2`
                    y2 = tOffsetY;
                }
            }

            return [
                { x: sOffsetX, y: y1 },
                { x, y: y1 },
                { x, y: y2 },
                { x: tOffsetX, y: y2 }
            ];
        }

        const y = (sOffsetY + tOffsetY) / 2;
        return [
            { x: sOffsetX, y },
            { x: tOffsetX, y }
        ];
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

        let x;
        const y1 = Math.min((sBoxY1 + tBoxY0) / 2, tOffsetY);
        const y2 = Math.min((sBoxY0 + tBoxY1) / 2, sOffsetY);

        if (tOffsetY < sOffsetY) {
            // Use the shortest path along the connections on horizontal sides
            if (rightDistance > leftDistance) {
                x = Math.min(sOffsetX, tMarginX0);
            } else {
                x = Math.max(sOffsetX, tMarginX1);
            }
        } else {
            if (rightDistance > leftDistance) {
                x = Math.min(tOffsetX, sMarginX0);
            } else {
                x = Math.max(tOffsetX, sMarginX1);
            }
        }

        return [
            { x: sOffsetX, y: y2 },
            { x, y: y2 },
            { x, y: y1 },
            { x: tOffsetX, y: y1 }
        ];
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

        let x;
        const y1 = Math.max((sBoxY0 + tBoxY1) / 2, tOffsetY);
        const y2 = Math.max((sBoxY1 + tBoxY0) / 2, sOffsetY);

        if (tOffsetY > sOffsetY) {
            // Use the shortest path along the connections on horizontal sides
            if (rightDistance > leftDistance) {
                x = Math.min(sOffsetX, tMarginX0);
            } else {
                x = Math.max(sOffsetX, tMarginX1);
            }
        } else {
            if (rightDistance > leftDistance) {
                x = Math.min(tOffsetX, sMarginX0);
            } else {
                x = Math.max(tOffsetX, sMarginX1);
            }
        }

        return [
            { x: sOffsetX, y: y2 },
            { x, y: y2 },
            { x, y: y1 },
            { x: tOffsetX, y: y1 }
        ];
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

        let y;
        const x1 = Math.min((sBoxX1 + tBoxX0) / 2, tOffsetX);
        const x2 = Math.min((sBoxX0 + tBoxX1) / 2, sOffsetX);

        if (tOffsetX > sOffsetX) {
            if (topDistance <= bottomDistance) {
                y = Math.min(sMarginY0, tOffsetY);
            } else {
                y = Math.max(sMarginY1, tOffsetY);
            }
        } else {
            if (topDistance <= bottomDistance) {
                y = Math.min(tMarginY0, sOffsetY);
            } else {
                y = Math.max(tMarginY1, sOffsetY);
            }
        }

        return [
            { x: x2, y: sOffsetY },
            { x: x2, y },
            { x: x1, y },
            { x: x1, y: tOffsetY }
        ];
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

        let y;
        const x1 = Math.max((sBoxX0 + tBoxX1) / 2, tOffsetX);
        const x2 = Math.max((sBoxX1 + tBoxX0) / 2, sOffsetX);

        if (tOffsetX <= sOffsetX) {
            if (topDistance <= bottomDistance) {
                y = Math.min(sMarginY0, tOffsetY);
            } else {
                y = Math.max(sMarginY1, tOffsetY);
            }
        } else {
            if (topDistance <= bottomDistance) {
                y = Math.min(tMarginY0, sOffsetY);
            } else {
                y = Math.max(tMarginY1, sOffsetY);
            }
        }

        return [
            { x: x2, y: sOffsetY },
            { x: x2, y },
            { x: x1, y },
            { x: x1, y: tOffsetY }
        ];
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
            if (sOffsetX < tOffsetX) {
                let y = tMarginY0;

                if (tMinMarginY1 <= sMinMarginY0 && tMarginX1 >= sOffsetX) {
                    y = middleOfHorizontalSides;

                    if (sOffsetY < tMinMarginY1) {

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
                }

                return [
                    { x: sOffsetX, y },
                    { x: tOffsetX, y },
                    { x: tOffsetX, y: tOffsetY }
                ];
            }

            return [{ x: sOffsetX, y: tOffsetY }];
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

        if (tOffsetX > sMinMarginX0) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x, y: sOffsetY },
                { x, y: tOffsetY - targetMargin },
                { x: tOffsetX, y: tOffsetY - targetMargin },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x, y: sOffsetY },
            { x, y: tOffsetY }
        ];
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
            if (sOffsetX > tOffsetX) {
                let y = tMarginY0;

                if (tMinMarginY1 <= sMinMarginY0 && tMarginX0 <= sOffsetX) {
                    y = middleOfHorizontalSides;

                    if (sOffsetY < tMinMarginY1) {

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
                }

                return [
                    { x: sOffsetX, y },
                    { x: tOffsetX, y },
                    { x: tOffsetX, y: tOffsetY }
                ];
            }

            return [{ x: sOffsetX, y: tOffsetY }];
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

        if (tOffsetX < sMinMarginX1) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x, y: sOffsetY },
                { x, y: tOffsetY - targetMargin },
                { x: tOffsetX, y: tOffsetY - targetMargin },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x, y: sOffsetY },
            { x, y: tOffsetY }
        ];
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
            if (sOffsetX < tOffsetX) {
                let y = tMarginY1;

                if (tMinMarginY0 >= sMinMarginY1 && tMarginX1 >= sOffsetX) {
                    y = middleOfHorizontalSides;

                    if (sOffsetY > tMinMarginY0) {

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

                }

                return [
                    { x: sOffsetX, y },
                    { x: tOffsetX, y },
                    { x: tOffsetX, y: tOffsetY }
                ];
            }

            return [{ x: sOffsetX, y: tOffsetY }];
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

        if (tOffsetX > sMinMarginX0) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x, y: sOffsetY },
                { x, y: tOffsetY + targetMargin },
                { x: tOffsetX, y: tOffsetY + targetMargin },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x, y: sOffsetY },
            { x, y: tOffsetY }
        ];
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
            if (sOffsetX > tOffsetX) {
                let y = tMarginY1;

                if (tMinMarginY0 >= sMinMarginY1 && tMarginX0 <= sOffsetX) {
                    y = middleOfHorizontalSides;

                    if (sOffsetY > tMinMarginY0) {

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
                }

                return [
                    { x: sOffsetX, y },
                    { x: tOffsetX, y },
                    { x: tOffsetX, y: tOffsetY }
                ];
            }

            return [{ x: sOffsetX, y: tOffsetY }];
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

        if (tOffsetX < sMinMarginX1) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x, y: sOffsetY },
                { x, y: tOffsetY + targetMargin },
                { x: tOffsetX, y: tOffsetY + targetMargin },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x, y: sOffsetY },
            { x, y: tOffsetY }
        ];
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
            if (sOffsetY < tOffsetY) {
                let x = tMarginX0;

                if (tMinMarginX1 <= sMinMarginX0 && tMarginY1 >= sOffsetY) {
                    x = middleOfVerticalSides;

                    if (sOffsetX < tMinMarginX1) {

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

                }

                return [
                    { x, y: sOffsetY },
                    { x, y: tOffsetY },
                    { x: tOffsetX, y: tOffsetY }
                ];
            }

            return [{ x: tOffsetX, y: sOffsetY }];
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

        if (tOffsetY > sMinMarginY0) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y },
                { x: tOffsetX - sourceMargin, y },
                { x: tOffsetX - sourceMargin, y: tOffsetY },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX, y },
            { x: tOffsetX, y }
        ];
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
            if (sOffsetY > tOffsetY) {
                let x = tMarginX0;

                if (tMinMarginX1 <= sMinMarginX0 && tMarginY0 <= sOffsetY) {
                    x = middleOfVerticalSides;

                    if (sOffsetX < tMinMarginX1) {

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
                }

                return [
                    { x, y: sOffsetY },
                    { x, y: tOffsetY },
                    { x: tOffsetX, y: tOffsetY }
                ];
            }

            return [{ x: tOffsetX, y: sOffsetY }];
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

        if (tOffsetY < sMinMarginY1) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y },
                { x: tOffsetX - sourceMargin, y },
                { x: tOffsetX - sourceMargin, y: tOffsetY },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX, y },
            { x: tOffsetX, y }
        ];
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
            if (sOffsetY > tOffsetY) {
                let x = tMarginX1;

                if (tMinMarginX0 >= sMinMarginX1 && tMarginY0 <= sOffsetY) {
                    x = middleOfVerticalSides;

                    if (sOffsetX > tMinMarginX0) {

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
                }

                return [
                    { x, y: sOffsetY },
                    { x, y: tOffsetY },
                    { x: tOffsetX, y: tOffsetY }
                ];
            }

            return [{ x: tOffsetX, y: sOffsetY }];
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

        if (tOffsetY < sMinMarginY1) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y },
                { x: tOffsetX + sourceMargin, y },
                { x: tOffsetX + sourceMargin, y: tOffsetY },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX, y },
            { x: tOffsetX, y }
        ];
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
            if (sOffsetY < tOffsetY) {
                let x = tMarginX1;

                if (tMinMarginX0 >= sMinMarginX1 && tMarginY1 >= sOffsetY) {
                    x = middleOfVerticalSides;

                    if (sOffsetX > tMinMarginX0) {

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

                }

                return [
                    { x, y: sOffsetY },
                    { x, y: tOffsetY },
                    { x: tOffsetX, y: tOffsetY }
                ];
            }

            return [{ x: tOffsetX, y: sOffsetY }];
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

        if (tOffsetY > sMinMarginY0) {
            return [
                { x: sOffsetX, y: sOffsetY },
                { x: sOffsetX, y },
                { x: tOffsetX + sourceMargin, y },
                { x: tOffsetX + sourceMargin, y: tOffsetY },
                { x: tOffsetX, y: tOffsetY }
            ];
        }

        return [
            { x: sOffsetX, y: sOffsetY },
            { x: sOffsetX, y },
            { x: tOffsetX, y }
        ];
    }
}
