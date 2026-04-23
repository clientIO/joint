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

const DEFINED_DIRECTIONS = [Directions.LEFT, Directions.RIGHT, Directions.TOP, Directions.BOTTOM];

const OPPOSITE_DIRECTIONS = {
    [Directions.LEFT]: Directions.RIGHT,
    [Directions.RIGHT]: Directions.LEFT,
    [Directions.TOP]: Directions.BOTTOM,
    [Directions.BOTTOM]: Directions.TOP
};

const VERTICAL_DIRECTIONS = [Directions.TOP, Directions.BOTTOM];

const ANGLE_DIRECTION_MAP = {
    0: Directions.RIGHT,
    180: Directions.LEFT,
    270: Directions.TOP,
    90: Directions.BOTTOM
};

function getSegmentAngle(line) {
    // TODO: the angle() method is general and therefore unnecessarily heavy for orthogonal links
    return line.angle();
}

function simplifyPoints(points) {
    // TODO: use own more efficient implementation (filter points that do not change direction).
    // To simplify segments that are almost aligned (start and end points differ by e.g. 0.5px), use a threshold of 1.
    return new g.Polyline(points).simplify({ threshold: 1 }).points;
}

function resolveSides(source, target) {
    const { point: sourcePoint, x0: sx0, y0: sy0, view: sourceView, bbox: sourceBBox, direction: sourceDirection } = source;
    const { point: targetPoint, x0: tx0, y0: ty0, view: targetView, bbox: targetBBox, direction: targetDirection } = target;

    let sourceSide;

    if (!sourceView) {
        const sourceLinkAnchorBBox = new g.Rect(sx0, sy0, 0, 0);
        sourceSide = DEFINED_DIRECTIONS.includes(sourceDirection) ? sourceDirection : sourceLinkAnchorBBox.sideNearestToPoint(targetPoint);
    } else if (sourceView.model.isLink()) {
        sourceSide = getDirectionForLinkConnection(targetPoint, sourcePoint, sourceView);
    } else if (sourceDirection === Directions.ANCHOR_SIDE) {
        sourceSide = sourceBBox.sideNearestToPoint(sourcePoint);
    } else if (sourceDirection === Directions.MAGNET_SIDE) {
        sourceSide = sourceView.model.getBBox().sideNearestToPoint(sourcePoint);
    } else {
        sourceSide = sourceDirection;
    }

    let targetSide;

    if (!targetView) {
        const targetLinkAnchorBBox = new g.Rect(tx0, ty0, 0, 0);
        targetSide = DEFINED_DIRECTIONS.includes(targetDirection) ? targetDirection : targetLinkAnchorBBox.sideNearestToPoint(sourcePoint);
    } else if (targetView.model.isLink()) {
        targetSide = getDirectionForLinkConnection(sourcePoint, targetPoint, targetView);
    } else if (targetDirection === Directions.ANCHOR_SIDE) {
        targetSide = targetBBox.sideNearestToPoint(targetPoint);
    } else if (targetDirection === Directions.MAGNET_SIDE) {
        targetSide = targetView.model.getBBox().sideNearestToPoint(targetPoint);
    } else {
        targetSide = targetDirection;
    }

    return [sourceSide, targetSide];
}

function resolveForTopSourceSide(source, target, nextInLine) {
    const { x0: sx0, y0: sy0, width, height, point: anchor, margin } = source;
    const sx1 = sx0 + width;
    const sy1 = sy0 + height;
    const sMarginX0 = sx0 - margin;
    const sMarginX1 = sx1 + margin;
    const sMarginY0 = sy0 - margin;

    const { x: ax } = anchor;
    const { x0: tx, y0: ty } = target;

    if (tx === ax && ty < sy0) return Directions.BOTTOM;
    if (tx < ax && ty < sMarginY0) {
        if (nextInLine.point.x === ax) return Directions.BOTTOM;
        return Directions.RIGHT;
    }
    if (tx > ax && ty < sMarginY0) {
        if (nextInLine.point.x === ax) return Directions.BOTTOM;
        return Directions.LEFT;
    }
    if (tx < sMarginX0 && ty > sMarginY0) return Directions.TOP;
    if (tx > sMarginX1 && ty > sMarginY0) return Directions.TOP;
    if (tx >= sMarginX0 && tx <= ax && ty > sy1) {
        if (nextInLine.point.x < tx) {
            return Directions.RIGHT;
        }
        return Directions.LEFT;
    }
    if (tx <= sMarginX1 && tx >= ax && ty > sy1) {
        if (nextInLine.point.x < tx) {
            return Directions.RIGHT;
        }
        return Directions.LEFT;
    }

    return Directions.BOTTOM;
}

function resolveForBottomSourceSide(source, target, nextInLine) {
    const { x0: sx0, y0: sy0, width, height, point: anchor, margin } = source;
    const sx1 = sx0 + width;
    const sy1 = sy0 + height;
    const sMarginX0 = sx0 - margin;
    const sMarginX1 = sx1 + margin;
    const sMarginY1 = sy1 + margin;

    const { x: ax } = anchor;
    const { x0: tx, y0: ty } = target;

    if (tx === ax && ty > sy1) return Directions.TOP;
    if (tx < ax && ty > sMarginY1) {
        if (nextInLine.point.x === ax) return Directions.TOP;
        return Directions.RIGHT;
    }
    if (tx > ax && ty > sMarginY1) {
        if (nextInLine.point.x === ax) return Directions.TOP;
        return Directions.LEFT;
    }
    if (tx < sMarginX0 && ty < sMarginY1) return Directions.BOTTOM;
    if (tx > sMarginX1 && ty < sMarginY1) return Directions.BOTTOM;
    if (tx >= sMarginX0 && tx <= ax && ty < sy0) {
        if (nextInLine.point.x < tx) {
            return Directions.RIGHT;
        }
        return Directions.LEFT;
    }
    if (tx <= sMarginX1 && tx >= ax && ty < sy0) {
        if (nextInLine.point.x < tx) {
            return Directions.RIGHT;
        }
        return Directions.LEFT;
    }

    return Directions.TOP;
}

function resolveForLeftSourceSide(source, target, nextInLine) {
    const { y0: sy0, x0: sx0, width, height, point: anchor, margin } = source;
    const sx1 = sx0 + width;
    const sy1 = sy0 + height;
    const sMarginX0 = sx0 - margin;
    const sMarginY0 = sy0 - margin;
    const sMarginY1 = sy1 + margin;

    const { x: ax, y: ay } = anchor;
    const { x0: tx, y0: ty } = target;

    if (tx < ax && ty === ay) return Directions.RIGHT;
    if (tx <= sMarginX0 && ty < ay) return Directions.BOTTOM;
    if (tx <= sMarginX0 && ty > ay) return Directions.TOP;
    if (tx >= sMarginX0 && ty < sMarginY0) return Directions.LEFT;
    if (tx >= sMarginX0 && ty > sMarginY1) return Directions.LEFT;
    if (tx > sx1 && ty >= sMarginY0 && ty <= ay) {
        if (nextInLine.point.y < ty) {
            return Directions.BOTTOM;
        }

        return Directions.TOP;
    }
    if (tx > sx1 && ty <= sMarginY1 && ty >= ay) {
        if (nextInLine.point.y < ty) {
            return Directions.BOTTOM;
        }

        return Directions.TOP;
    }

    return Directions.RIGHT;
}

function resolveForRightSourceSide(source, target, nextInLine) {
    const { y0: sy0, x0: sx0, width, height, point: anchor, margin } = source;
    const sx1 = sx0 + width;
    const sy1 = sy0 + height;
    const sMarginX1 = sx1 + margin;
    const sMarginY0 = sy0 - margin;
    const sMarginY1 = sy1 + margin;

    const { x: ax, y: ay } = anchor;
    const { x0: tx, y0: ty } = target;

    if (tx > ax && ty === ay) return Directions.LEFT;
    if (tx >= sMarginX1 && ty < ay) return Directions.BOTTOM;
    if (tx >= sMarginX1 && ty > ay) return Directions.TOP;
    if (tx <= sMarginX1 && ty < sMarginY0) return Directions.RIGHT;
    if (tx <= sMarginX1 && ty > sMarginY1) return Directions.RIGHT;
    if (tx < sx0 && ty >= sMarginY0 && ty <= ay) {
        if (nextInLine.point.y < ty) {
            return Directions.BOTTOM;
        }

        return Directions.TOP;
    }
    if (tx < sx0 && ty <= sMarginY1 && ty >= ay) {
        if (nextInLine.point.y < ty) {
            return Directions.BOTTOM;
        }

        return Directions.TOP;
    }

    return Directions.LEFT;
}

function resolveInitialDirection(source, target, nextInLine) {
    const [sourceSide] = resolveSides(source, target);

    switch (sourceSide) {
        case Directions.TOP:
            return resolveForTopSourceSide(source, target, nextInLine);
        case Directions.RIGHT:
            return resolveForRightSourceSide(source, target, nextInLine);
        case Directions.BOTTOM:
            return resolveForBottomSourceSide(source, target, nextInLine);
        case Directions.LEFT:
            return resolveForLeftSourceSide(source, target, nextInLine);
    }
}

function getDirectionForLinkConnection(linkOrigin, connectionPoint, linkView) {
    const tangent = linkView.getTangentAtLength(linkView.getClosestPointLength(connectionPoint));
    const roundedAngle = Math.round(getSegmentAngle(tangent) / 90) * 90;

    if (roundedAngle % 180 === 0 && linkOrigin.y === connectionPoint.y) {
        return linkOrigin.x < connectionPoint.x ? Directions.LEFT : Directions.RIGHT;
    } else if (linkOrigin.x === connectionPoint.x) {
        return linkOrigin.y < connectionPoint.y ? Directions.TOP : Directions.BOTTOM;
    }

    switch (roundedAngle) {
        case 0:
        case 180:
        case 360:
            return linkOrigin.y < connectionPoint.y ? Directions.TOP : Directions.BOTTOM;
        case 90:
        case 270:
            return linkOrigin.x < connectionPoint.x ? Directions.LEFT : Directions.RIGHT;
    }
}

function pointDataFromAnchor(view, anchor, bbox, direction, isPort, margin) {
    if (direction === Directions.AUTO) {
        direction = isPort ? Directions.MAGNET_SIDE : Directions.ANCHOR_SIDE;
    }

    const isElement = view && view.model.isElement();

    const {
        x: x0,
        y: y0,
        width = 0,
        height = 0
    } = isElement
        // Find the union of:
        // - the element bbox
        // - the ports may overlap the element body
        // - the anchor point may be outside the element body and port
        ? g.Rect.fromRectUnion(anchor, bbox, view.model.getBBox())
        : anchor;

    return {
        point: anchor,
        x0,
        y0,
        view,
        bbox,
        width,
        height,
        direction,
        margin: isElement ? margin : 0
    };
}

function pointDataFromVertex({ x, y }) {
    const point = new g.Point(x, y);

    return {
        point,
        x0: point.x,
        y0: point.y,
        view: null,
        bbox: new g.Rect(x, y, 0, 0),
        width: 0,
        height: 0,
        direction: null,
        margin: 0
    };
}

function getOutsidePoint(side, pointData, margin) {
    const outsidePoint = pointData.point.clone();

    const { x0, y0, width, height } = pointData;

    switch (side) {
        case 'left':
            outsidePoint.x = x0 - margin;
            break;
        case 'right':
            outsidePoint.x = x0 + width + margin;
            break;
        case 'top':
            outsidePoint.y = y0 - margin;
            break;
        case 'bottom':
            outsidePoint.y = y0 + height + margin;
            break;
    }

    return outsidePoint;
}

function createLoop(from, to, { dx = 0, dy = 0 }) {
    const p1 = { x: from.point.x + dx, y: from.point.y + dy };
    const p2 = { x: to.point.x + dx, y: to.point.y + dy };

    return [from.point, p1, p2, to.point];
}

function loopSegment(from, to, connectionSegmentAngle, margin) {
    // Find out the loop coordinates.
    const angle = g.normalizeAngle(connectionSegmentAngle - 90);

    let dx = 0;
    let dy = 0;

    if (angle === 90) {
        dy = -margin;
    } else if (angle === 180) {
        dx = -margin;
    } else if (angle === 270) {
        dy = margin;
    } else if (angle === 0) {
        dx = margin;
    }

    const loopRoute = createLoop(from, to, { dx, dy });

    const secondCreatedPoint = loopRoute[2];
    const loopEndSegment = new g.Line(to.point, secondCreatedPoint);
    // The direction in which the loop should continue.
    const continueDirection = ANGLE_DIRECTION_MAP[getSegmentAngle(loopEndSegment)];

    return {
        loopRoute,
        continueDirection
    };
}

// Calculates the distances along the horizontal axis for the left and right route.
function getHorizontalDistance(source, target) {

    const { x0: sx0, x1: sx1, outsidePoint: sourcePoint } = source;
    const { x0: tx0, x1: tx1, outsidePoint: targetPoint } = target;

    // Furthest left boundary
    let leftBoundary = Math.min(sx0, tx0);
    // Furthest right boundary
    let rightBoundary = Math.max(sx1, tx1);

    // If the source and target elements are on the same side, we need to figure out what shape defines the boundary.
    if (source.direction === target.direction) {

        const aboveShape = source.y0 < target.y0 ? source : target;
        const belowShape = aboveShape === source ? target : source;

        // The source and target anchors are on the top => then the `aboveShape` defines the boundary.
        // The source and target anchors are on the bottom => then the `belowShape` defines the boundary.
        const boundaryDefiningShape = source.direction === Directions.TOP ? aboveShape : belowShape;

        leftBoundary = boundaryDefiningShape.x0;
        rightBoundary = boundaryDefiningShape.x1;
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

    const { y0: sy0, y1: sy1, outsidePoint: sourcePoint } = source;
    const { y0: ty0, y1: ty1, outsidePoint: targetPoint } = target;

    // Furthest top boundary
    let topBoundary = Math.min(sy0, ty0);
    // Furthest bottom boundary
    let bottomBoundary = Math.max(sy1, ty1);

    // If the source and target elements are on the same side, we need to figure out what shape defines the boundary.
    if (source.direction === target.direction) {

        const leftShape = source.x0 < target.x0 ? source : target;
        const rightShape = leftShape === source ? target : source;

        // The source and target anchors are on the left => then the `leftShape` defines the boundary.
        // The source and target anchors are on the right => then the `rightShape` defines the boundary.
        const boundaryDefiningShape = source.direction === Directions.LEFT ? leftShape : rightShape;

        topBoundary = boundaryDefiningShape.y0;
        bottomBoundary = boundaryDefiningShape.y1;
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

// Inflate bbox in 3 directions depending on the direction of the anchor
// don't inflate in the opposite direction of the anchor
function moveAndExpandBBox(bbox, direction, margin) {
    switch (direction) {
        case Directions.LEFT:
            bbox.inflate(0, margin).moveAndExpand({ x: -margin, width: margin });
            break;
        case Directions.RIGHT:
            bbox.inflate(0, margin).moveAndExpand({ width: margin });
            break;
        case Directions.TOP:
            bbox.inflate(margin, 0).moveAndExpand({ y: -margin, height: margin });
            break;
        case Directions.BOTTOM:
            bbox.inflate(margin, 0).moveAndExpand({ height: margin });
            break;
    }

    return bbox;
}

function routeBetweenPoints(source, target, opt = {}) {
    const {
        point: sourcePoint,
        x0: sBoxX0,
        y0: sBoxY0,
        width: sourceWidth,
        height: sourceHeight,
        margin: sourceMargin
    } = source;
    const {
        point: targetPoint,
        x0: tBoxX0,
        y0: tBoxY0,
        width: targetWidth,
        height: targetHeight,
        margin: targetMargin
    } = target;

    const { targetInSourceBBox = false } = opt;

    const minSourceMargin = opt.minMargin != null ? Math.min(opt.minMargin, sourceMargin) : sourceMargin;
    const minTargetMargin = opt.minMargin != null ? Math.min(opt.minMargin, targetMargin) : targetMargin;

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

    const [sourceSide, targetSide] = resolveSides(source, target);

    const sourceOffsetPoint = getOutsidePoint(sourceSide, { point: sourcePoint, x0: sBoxX0, y0: sBoxY0, width: sourceWidth, height: sourceHeight }, sourceMargin);
    const targetOffsetPoint = getOutsidePoint(targetSide, { point: targetPoint, x0: tBoxX0, y0: tBoxY0, width: targetWidth, height: targetHeight }, targetMargin);

    const { x: sOffsetX, y: sOffsetY } = sourceOffsetPoint;
    const { x: tOffsetX, y: tOffsetY } = targetOffsetPoint;
    const tCenterX = (tBoxX0 + tBoxX1) / 2;
    const tCenterY = (tBoxY0 + tBoxY1) / 2;
    const sCenterX = (sBoxX0 + sBoxX1) / 2;
    const sCenterY = (sBoxY0 + sBoxY1) / 2;
    const middleOfVerticalSides = (sCenterX < tCenterX ? (sBoxX1 + tBoxX0) : (tBoxX1 + sBoxX0)) / 2;
    const middleOfHorizontalSides = (sCenterY < tCenterY ? (sBoxY1 + tBoxY0) : (tBoxY1 + sBoxY0)) / 2;

    const sourceBBox = new g.Rect(sBoxX0, sBoxY0, sourceWidth, sourceHeight);
    const targetBBox = new g.Rect(tBoxX0, tBoxY0, targetWidth, targetHeight);
    const inflatedSourceBBox = sourceBBox.clone().inflate(sourceMargin);
    const inflatedTargetBBox = targetBBox.clone().inflate(targetMargin);

    const sourceForDistance = Object.assign({}, source, { x1: sBoxX1, y1: sBoxY1, outsidePoint: sourceOffsetPoint, direction: sourceSide });
    const targetForDistance = Object.assign({}, target, { x1: tBoxX1, y1: tBoxY1, outsidePoint: targetOffsetPoint, direction: targetSide });

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

function getLoopCoordinates(direction, angle, margin) {
    const isHorizontal = direction === Directions.LEFT || direction === Directions.RIGHT;

    let dx = 0;
    let dy = 0;

    switch (g.normalizeAngle(Math.round(angle))) {
        case 0:
        case 90:
            dx = isHorizontal ? 0 : margin;
            dy = isHorizontal ? margin : 0;
            break;
        case 180:
        case 270:
            dx = isHorizontal ? 0 : -margin;
            dy = isHorizontal ? -margin : 0;
            break;
    }

    return { dx, dy };
}

function rightAngleRouter(vertices, opt, linkView) {
    const { sourceDirection = Directions.AUTO, targetDirection = Directions.AUTO, minMargin = null } = opt;
    const margin = opt.margin || 20;

    const sourceMargin = opt.sourceMargin || margin;
    const targetMargin = opt.targetMargin || margin;

    const useVertices = opt.useVertices || false;

    const isSourcePort = !!linkView.model.source().port;
    const sourcePoint = pointDataFromAnchor(linkView.sourceView, linkView.sourceAnchor, linkView.sourceBBox, sourceDirection, isSourcePort, sourceMargin);

    const isTargetPort = !!linkView.model.target().port;
    const targetPoint = pointDataFromAnchor(linkView.targetView, linkView.targetAnchor, linkView.targetBBox, targetDirection, isTargetPort, targetMargin);

    const resultVertices = [];

    if (!useVertices || vertices.length === 0) {
        return simplifyPoints(routeBetweenPoints(sourcePoint, targetPoint, { minMargin }));
    }

    const verticesData = vertices.map((v) => pointDataFromVertex(v));
    const [firstVertex] = verticesData;

    const [resolvedSourceDirection] = resolveSides(sourcePoint, firstVertex);
    const isElement = sourcePoint.view && sourcePoint.view.model.isElement();
    const sourceBBox = isElement ? moveAndExpandBBox(sourcePoint.view.model.getBBox(), resolvedSourceDirection, sourceMargin) : null;
    const isVertexInside = isElement ? sourceBBox.containsPoint(firstVertex.point) : false;

    if (isVertexInside) {
        const outsidePoint = getOutsidePoint(resolvedSourceDirection, sourcePoint, sourceMargin);
        const firstPointOverlap = outsidePoint.equals(firstVertex.point);

        const alignsVertically = sourcePoint.point.x === firstVertex.point.x;
        const alignsHorizontally = sourcePoint.point.y === firstVertex.point.y;

        const isVerticalAndAligns = alignsVertically && (resolvedSourceDirection === Directions.TOP || resolvedSourceDirection === Directions.BOTTOM);
        const isHorizontalAndAligns = alignsHorizontally && (resolvedSourceDirection === Directions.LEFT || resolvedSourceDirection === Directions.RIGHT);

        const firstSegment = new g.Line(sourcePoint.point, outsidePoint);
        const isVertexOnSegment = firstSegment.containsPoint(firstVertex.point);

        const isVertexAlignedAndInside = isVertexInside && (isHorizontalAndAligns || isVerticalAndAligns);

        if (firstPointOverlap) {
            resultVertices.push(sourcePoint.point, firstVertex.point);
            // Set the access direction as the opposite of the source direction that will be used to connect the route with the next vertex
            firstVertex.direction = OPPOSITE_DIRECTIONS[resolvedSourceDirection];
        } else if (isVertexOnSegment || isVertexAlignedAndInside) {
            // Case where there is a need to create a loop
            const angle = getSegmentAngle(isVertexOnSegment ? firstSegment : new g.Line(sourcePoint.point, firstVertex.point));
            const { dx, dy } = getLoopCoordinates(resolvedSourceDirection, angle, margin);

            const loop = createLoop({ point: outsidePoint }, firstVertex, { dx, dy });
            const secondCreatedPoint = loop[2];
            const loopEndSegment = new g.Line(firstVertex.point, secondCreatedPoint);

            const accessDirection = ANGLE_DIRECTION_MAP[getSegmentAngle(loopEndSegment)];
            firstVertex.direction = accessDirection;
            resultVertices.push(...loop);
        } else {
            // No need to create a route, use the `routeBetweenPoints` to construct a route
            firstVertex.direction = resolvedSourceDirection;
            firstVertex.margin = margin;
            resultVertices.push(...routeBetweenPoints(sourcePoint, firstVertex, { targetInSourceBBox: true, minMargin }), firstVertex.point);
        }
    } else {
        // The first point responsible for the initial direction of the route
        const next = verticesData[1] || targetPoint;
        const direction = resolveInitialDirection(sourcePoint, firstVertex, next);
        firstVertex.direction = direction;

        resultVertices.push(...routeBetweenPoints(sourcePoint, firstVertex, { minMargin }), firstVertex.point);
    }

    for (let i = 0; i < verticesData.length - 1; i++) {
        const from = verticesData[i];
        const to = verticesData[i + 1];

        const connectionSegment = new g.Line(from.point, to.point);
        const connectionSegmentAngle = getSegmentAngle(connectionSegment);
        if (connectionSegmentAngle % 90 === 0) {
            // Segment is horizontal or vertical
            const connectionDirection = ANGLE_DIRECTION_MAP[connectionSegmentAngle];

            const simplifiedRoute = simplifyPoints([...resultVertices, from.point]);
            // const simplifiedRoute2 = simplifyPoints([from.point, ...resultVertices]);
            // Find out the direction that is used to connect the current route with the next vertex
            const accessSegment = new g.Line(simplifiedRoute[simplifiedRoute.length - 2], simplifiedRoute[simplifiedRoute.length - 1]);
            // const accessSegment2 = new g.Line(simplifiedRoute2[simplifiedRoute2.length - 2], simplifiedRoute2[simplifiedRoute2.length - 1]);
            const accessDirection = ANGLE_DIRECTION_MAP[Math.round(getSegmentAngle(accessSegment))];
            // const accessDirection2 = ANGLE_DIRECTION_MAP[Math.round(getSegmentAngle(accessSegment2))];
            // console.log(accessDirection);
            // console.log(accessDirection2);
            // if (accessDirection !== accessDirection2) {
            //     console.log('error');
            // }
            // console.log('------------------');

            if (connectionDirection !== OPPOSITE_DIRECTIONS[accessDirection]) {
                // The directions are not opposite, so we can connect the vertices directly
                resultVertices.push(from.point, to.point);
                const [, toDirection] = resolveSides(from, to);
                to.direction = toDirection;
            } else {
                // The directions are overlapping, so we need to create a loop
                const { loopRoute, continueDirection } = loopSegment(from, to, connectionSegmentAngle, margin);
                to.direction = continueDirection;
                // Constructing a loop
                resultVertices.push(...loopRoute);
            }

            continue;
        }

        // Vertices are not aligned vertically nor horizontally
        // so we need to route between them

        const [fromDirection, toDirection] = resolveDirection(from, to);

        from.direction = fromDirection;
        to.direction = toDirection;

        resultVertices.push(...routeBetweenPoints(from, to, { minMargin }), to.point);
    }

    const lastVertex = verticesData[verticesData.length - 1];

    if (targetPoint.view && targetPoint.view.model.isElement()) {
        const [, resolvedTargetDirection] = resolveSides(lastVertex, targetPoint);
        const outsidePoint = getOutsidePoint(resolvedTargetDirection, targetPoint, margin);

        // the last point of `simplified` array is the last defined vertex
        // this will ensure that the last segment continues in a straight line
        const simplified = simplifyPoints([...resultVertices, lastVertex.point]);
        const simplifiedSegment = new g.Line(simplified[simplified.length - 2], simplified[simplified.length - 1]);
        const simplifiedSegmentAngle = Math.round(getSegmentAngle(simplifiedSegment));
        const definedDirection = ANGLE_DIRECTION_MAP[simplifiedSegmentAngle];

        const lastPointOverlap = outsidePoint.equals(lastVertex.point);

        if (!lastPointOverlap || (lastPointOverlap && definedDirection === resolvedTargetDirection)) {

            lastVertex.direction = definedDirection;

            let lastSegmentRoute = routeBetweenPoints(lastVertex, targetPoint, { minMargin });
            const [p1, p2] = simplifyPoints([...lastSegmentRoute, targetPoint.point]);

            const lastSegment = new g.Line(p1, p2);
            const roundedLastSegmentAngle = Math.round(getSegmentAngle(lastSegment));
            const lastSegmentDirection = ANGLE_DIRECTION_MAP[roundedLastSegmentAngle];

            const targetBBox = moveAndExpandBBox(targetPoint.view.model.getBBox(), resolvedTargetDirection, margin);

            const alignsVertically = lastVertex.point.x === targetPoint.point.x;
            const alignsHorizontally = lastVertex.point.y === targetPoint.point.y;
            const isVertexInside = targetBBox.containsPoint(lastVertex.point);

            const isVerticalAndAligns = alignsVertically && (resolvedTargetDirection === Directions.TOP || resolvedTargetDirection === Directions.BOTTOM);
            const isHorizontalAndAligns = alignsHorizontally && (resolvedTargetDirection === Directions.LEFT || resolvedTargetDirection === Directions.RIGHT);


            if (!lastPointOverlap && isVertexInside && (isHorizontalAndAligns || isVerticalAndAligns)) {
                // Handle special cases when the last vertex is inside the target element
                // and in is aligned with the connection point => construct a loop
                const { dx, dy } = getLoopCoordinates(resolvedTargetDirection, simplifiedSegmentAngle, margin);
                lastSegmentRoute = createLoop(lastVertex, { point: outsidePoint }, { dx, dy });
            } else if (isVertexInside && resolvedTargetDirection !== OPPOSITE_DIRECTIONS[definedDirection]) {
                lastVertex.margin = margin;
                lastVertex.direction = resolvedTargetDirection;
                lastSegmentRoute = routeBetweenPoints(lastVertex, targetPoint, { minMargin });
            } else if (lastSegmentDirection !== definedDirection && definedDirection === OPPOSITE_DIRECTIONS[lastSegmentDirection]) {
                lastVertex.margin = margin;
                lastSegmentRoute = routeBetweenPoints(lastVertex, targetPoint, { minMargin });
            }

            resultVertices.push(...lastSegmentRoute);
        }
    } else {
        // since the target is only a point we can apply the same logic as if we connected two verticesData
        const from = lastVertex;
        const to = targetPoint;

        const connectionSegment = new g.Line(from.point, to.point);
        const connectionSegmentAngle = getSegmentAngle(connectionSegment);
        if (connectionSegmentAngle % 90 === 0) {
            // Segment is horizontal or vertical
            const connectionDirection = ANGLE_DIRECTION_MAP[connectionSegmentAngle];

            const simplifiedRoute = simplifyPoints(resultVertices);
            // Find out the direction that is used to connect the current route with the next vertex
            const accessSegment = new g.Line(simplifiedRoute[simplifiedRoute.length - 2], from.point);
            const accessDirection = ANGLE_DIRECTION_MAP[Math.round(getSegmentAngle(accessSegment))];

            if (connectionDirection !== OPPOSITE_DIRECTIONS[accessDirection]) {
                // The directions are not opposite, so we can connect the vertices directly by adding the first point
                // the target point is handled separately
                resultVertices.push(from.point);
            } else {
                // The directions are overlapping, so we need to create a loop
                const { loopRoute } = loopSegment(from, to, connectionSegmentAngle, margin);
                // Remove the last point since it is the target that is handled separately
                loopRoute.pop();
                // Constructing a loop
                resultVertices.push(...loopRoute);
            }
        } else {
            // The last vertex and the target are not aligned vertically nor horizontally
            // so we need to route between them
            const [fromDirection, toDirection] = resolveDirection(from, to);

            from.direction = fromDirection;
            to.direction = toDirection;

            resultVertices.push(...routeBetweenPoints(from, to, { minMargin }));
        }
    }

    return simplifyPoints(resultVertices);
}

function resolveDirection(from, to) {
    const accessDirection = from.direction;
    const isDirectionVertical = VERTICAL_DIRECTIONS.includes(accessDirection);

    let sourceDirection = from.direction;
    let targetDirection = to.direction;

    if (isDirectionVertical) {
        const isToAbove = from.point.y > to.point.y;
        const dx = to.point.x - from.point.x;

        if (accessDirection === Directions.BOTTOM) {
            // If isToAbove === false and we need figure out if to go left or right
            sourceDirection = isToAbove ? OPPOSITE_DIRECTIONS[accessDirection] : dx >= 0 ? Directions.RIGHT : Directions.LEFT;

            if (dx > 0) {
                targetDirection = isToAbove ? Directions.LEFT : Directions.TOP;
            } else if (dx < 0) {
                targetDirection = isToAbove ? Directions.RIGHT : Directions.TOP;
            }
        } else {
            // If isToAbove === true and we need figure out if to go left or right
            sourceDirection = isToAbove ? dx >= 0 ? Directions.RIGHT : Directions.LEFT : OPPOSITE_DIRECTIONS[accessDirection];

            if (dx > 0) {
                targetDirection = isToAbove ? Directions.BOTTOM : Directions.LEFT;
            } else if (dx < 0) {
                targetDirection = isToAbove ? Directions.BOTTOM : Directions.RIGHT;
            }
        }
    } else {
        const isToLeft = from.point.x > to.point.x;
        const dy = to.point.y - from.point.y;

        if (accessDirection === Directions.RIGHT) {
            sourceDirection = isToLeft ? OPPOSITE_DIRECTIONS[accessDirection] : dy >= 0 ? Directions.BOTTOM : Directions.TOP;

            if (dy > 0) {
                targetDirection = isToLeft ? Directions.TOP : Directions.LEFT;
            } else if (dy < 0) {
                targetDirection = isToLeft ? Directions.BOTTOM : Directions.LEFT;
            }
        } else {
            sourceDirection = isToLeft ? dy >= 0 ? Directions.BOTTOM : Directions.TOP : OPPOSITE_DIRECTIONS[accessDirection];

            if (dy > 0) {
                targetDirection = isToLeft ? Directions.RIGHT : Directions.TOP;
            } else if (dy < 0) {
                targetDirection = isToLeft ? Directions.RIGHT : Directions.BOTTOM;
            }
        }
    }

    return [sourceDirection, targetDirection];
}

rightAngleRouter.Directions = Directions;

export const rightAngle = rightAngleRouter;
