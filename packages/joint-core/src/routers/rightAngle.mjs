import * as g from '../g/index.mjs';
import { rightAnglePath } from '../alg/index.mjs';

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
    // TODO: own more efficient implementation (filter points that do not change direction).
    // To simplify segments that are almost aligned (start and end points differ by e.g. 0.5px), use a threshold of 1.
    return new g.Polyline(points).simplify({ threshold: 1 }).points;
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
        sourceSide = sourceBBox.center().equals(sourcePoint)
            ? sourceBBox.sideNearestToPoint(targetPoint)
            : sourceBBox.sideNearestToPoint(sourcePoint);
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
        targetSide = targetBBox.center().equals(targetPoint)
            ? targetBBox.sideNearestToPoint(sourcePoint)
            : targetBBox.sideNearestToPoint(targetPoint);
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

function pointDataFromAnchor(view, anchor, bbox, direction, isPort, margin, useModelGeometry) {
    if (direction === Directions.AUTO) {
        direction = isPort ? Directions.MAGNET_SIDE : Directions.ANCHOR_SIDE;
    }

    const isElement = view && view.model.isElement();

    let rect;
    if (useModelGeometry) {
        rect = isElement ? g.Rect.fromRectUnion(view.model.getBBox(), anchor) : anchor;
    } else {
        rect = isElement ? g.Rect.fromRectUnion(anchor, bbox, view.model.getBBox()) : anchor;
    }

    const {
        x: x0,
        y: y0,
        width = 0,
        height = 0
    } = rect;

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

function routeBetweenPoints(sourcePoint, targetPoint, opt = {}) {
    const [sourceSide, targetSide] = resolveSides(sourcePoint, targetPoint);

    const source = { ...sourcePoint, side: sourceSide };
    const target = { ...targetPoint, side: targetSide };

    return rightAnglePath(source, target, opt);
}

function rightAngleRouter(vertices, opt, linkView) {
    const { sourceDirection = Directions.AUTO, targetDirection = Directions.AUTO, minPathMargin = null } = opt;
    const margin = opt.margin || 20;

    const sourceMargin = opt.sourceMargin || margin;
    const targetMargin = opt.targetMargin || margin;

    const useVertices = opt.useVertices || false;

    const useModelGeometry = opt.useModelGeometry || false;

    const isSourcePort = !!linkView.model.source().port;
    const sourcePoint = pointDataFromAnchor(linkView.sourceView, linkView.sourceAnchor, linkView.sourceBBox, sourceDirection, isSourcePort, sourceMargin, useModelGeometry);

    const isTargetPort = !!linkView.model.target().port;
    const targetPoint = pointDataFromAnchor(linkView.targetView, linkView.targetAnchor, linkView.targetBBox, targetDirection, isTargetPort, targetMargin, useModelGeometry);
    const resultVertices = [];

    if (!useVertices || vertices.length === 0) {
        return simplifyPoints(routeBetweenPoints(sourcePoint, targetPoint, { minPathMargin }));
    }

    const verticesData = vertices.map((v) => pointDataFromVertex(v));
    const [firstVertex] = verticesData;

    const [resolvedSourceDirection] = resolveSides(sourcePoint, firstVertex);
    const isElement = sourcePoint.view && sourcePoint.view.model.isElement();
    const sourceBBox = isElement ? moveAndExpandBBox(useModelGeometry ? linkView.sourceView.model.getBBox() : linkView.sourceBBox, resolvedSourceDirection, sourceMargin) : null;
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
            resultVertices.push(...routeBetweenPoints(sourcePoint, firstVertex, { targetInSourceBBox: true, minPathMargin }), firstVertex.point);
        }
    } else {
        // The first point responsible for the initial direction of the route
        const next = verticesData[1] || targetPoint;
        const direction = resolveInitialDirection(sourcePoint, firstVertex, next);
        firstVertex.direction = direction;

        resultVertices.push(...routeBetweenPoints(sourcePoint, firstVertex, { minPathMargin }), firstVertex.point);
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

        resultVertices.push(...routeBetweenPoints(from, to, { minPathMargin }), to.point);
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

            let lastSegmentRoute = routeBetweenPoints(lastVertex, targetPoint, { minPathMargin });
            const [p1, p2] = simplifyPoints([...lastSegmentRoute, targetPoint.point]);

            const lastSegment = new g.Line(p1, p2);
            const roundedLastSegmentAngle = Math.round(getSegmentAngle(lastSegment));
            const lastSegmentDirection = ANGLE_DIRECTION_MAP[roundedLastSegmentAngle];

            const targetBBox = moveAndExpandBBox(useModelGeometry ? linkView.targetView.model.getBBox() : linkView.targetBBox, resolvedTargetDirection, margin);

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
                lastSegmentRoute = routeBetweenPoints(lastVertex, targetPoint, { minPathMargin });
            } else if (lastSegmentDirection !== definedDirection && definedDirection === OPPOSITE_DIRECTIONS[lastSegmentDirection]) {
                lastVertex.margin = margin;
                lastSegmentRoute = routeBetweenPoints(lastVertex, targetPoint, { minPathMargin });
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

            resultVertices.push(...routeBetweenPoints(from, to, { minPathMargin }));
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
