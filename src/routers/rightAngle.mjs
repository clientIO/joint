import * as g from '../g/index.mjs';
import * as util from '../util/index.mjs';

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

const AREA_CROSSING_DIRECTIONS = {
    90: Directions.TOP,
    180: Directions.RIGHT,
    270: Directions.BOTTOM,
    0: Directions.LEFT
};

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

function getDirectionForLinkConnection(linkOrigin, connectionPoint, linkView) {
    const tangent = linkView.getTangentAtLength(linkView.getClosestPointLength(connectionPoint));
    const roundedAngle = Math.round(tangent.angle() / 90) * 90;

    switch (roundedAngle) {
        case 0:
        case 360:
            return linkOrigin.y < connectionPoint.y ? Directions.TOP : Directions.BOTTOM;
        case 90:
            return linkOrigin.x < connectionPoint.x ? Directions.LEFT : Directions.RIGHT;
        case 180:
            return linkOrigin.y < connectionPoint.y ? Directions.TOP : Directions.BOTTOM;
        case 270:
            return linkOrigin.x < connectionPoint.x ? Directions.LEFT : Directions.RIGHT;
    }
}

function pointDataFromAnchor(view, point, bbox, direction, isPort, fallBackAnchor) {
    if (direction === Directions.AUTO) {
        direction = isPort ? Directions.MAGNET_SIDE : Directions.ANCHOR_SIDE;
    }

    const {
        x: x0,
        y: y0,
        width = 0,
        height = 0
    } = view && view.model.isElement() ? g.Rect.fromRectUnion(bbox, view.model.getBBox()) : fallBackAnchor;

    return {
        point,
        x0,
        y0,
        view,
        bbox,
        width,
        height,
        direction
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
        direction: null
    };
}

function routeBetweenPoints(source, target, margin) {
    const { point: sourcePoint, x0: sx0, y0: sy0, view: sourceView, width: sourceWidth, height: sourceHeight } = source;
    const { point: targetPoint, x0: tx0, y0: ty0, view: targetView, width: targetWidth, height: targetHeight } = target;

    const tx1 = tx0 + targetWidth;
    const ty1 = ty0 + targetHeight;
    const sx1 = sx0 + sourceWidth;
    const sy1 = sy0 + sourceHeight;

    // Key coordinates including the margin
    const isSourceEl = sourceView && sourceView.model.isElement();
    const sourceMargin = (isSourceEl ? margin : 0);
    const smx0 = sx0 - sourceMargin;
    const smx1 = sx1 + sourceMargin;
    const smy0 = sy0 - sourceMargin;
    const smy1 = sy1 + sourceMargin;

    const isTargetEl = targetView && targetView.model.isElement();
    const targetMargin = (isTargetEl ? margin : 0);
    const tmx0 = tx0 - targetMargin;
    const tmx1 = tx1 + targetMargin;
    const tmy0 = ty0 - targetMargin;
    const tmy1 = ty1 + targetMargin;

    const sourceOutsidePoint = sourcePoint.clone();

    const [sourceSide, targetSide] = resolveSides(source, target);

    switch (sourceSide) {
        case 'left':
            sourceOutsidePoint.x = smx0;
            break;
        case 'right':
            sourceOutsidePoint.x = smx1;
            break;
        case 'top':
            sourceOutsidePoint.y = smy0;
            break;
        case 'bottom':
            sourceOutsidePoint.y = smy1;
            break;
    }

    const targetOutsidePoint = targetPoint.clone();

    switch (targetSide) {
        case 'left':
            targetOutsidePoint.x = tmx0;
            break;
        case 'right':
            targetOutsidePoint.x = tmx1;
            break;
        case 'top':
            targetOutsidePoint.y = tmy0;
            break;
        case 'bottom':
            targetOutsidePoint.y = tmy1;
            break;
    }

    const { x: sox, y: soy } = sourceOutsidePoint;
    const { x: tox, y: toy } = targetOutsidePoint;
    const tcx = (tx0 + tx1) / 2;
    const tcy = (ty0 + ty1) / 2;
    const scx = (sx0 + sx1) / 2;
    const scy = (sy0 + sy1) / 2;
    const middleOfVerticalSides = (scx < tcx ? (sx1 + tx0) : (tx1 + sx0)) / 2;
    const middleOfHorizontalSides = (scy < tcy ? (sy1 + ty0) : (ty1 + sy0)) / 2;

    if (!(isSourceEl && isTargetEl) && (sox === tox || soy === toy)) {
        const line = new g.Line(sourcePoint, targetPoint);
        const angle = line.angle();

        if (isSourceEl && AREA_CROSSING_DIRECTIONS[angle] !== sourceSide) {
            const result = [{ x: sox, y: soy }];

            // there can be a rare case where the source and target are the same point
            // and that can cause trouble
            if (sox !== tox || soy !== toy) {
                result.push({ x: tox, y: toy });
            }

            return result;
        } else if (isTargetEl && OPPOSITE_DIRECTIONS[AREA_CROSSING_DIRECTIONS[angle]] !== targetSide) {
            const result = [{ x: tox, y: toy }];

            // there can be a rare case where the source and target are the same point
            // and that can cause trouble
            if (sox !== tox || soy !== toy) {
                result.unshift({ x: sox, y: soy });
            }

            return result;
        }
    }

    if (sourceSide === 'left' && targetSide === 'right') {
        if (smx0 <= tmx1) {
            let y = middleOfHorizontalSides;
            if (sx1 <= tx0) {
                if (ty1 >= smy0 && toy < soy) {
                    y = Math.min(tmy0, smy0);
                } else if (ty0 <= smy1 && toy >= soy) {
                    y = Math.max(tmy1, smy1);
                }
            }
            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
                { x: tox, y: toy }
            ];
        }

        const x = (sox + tox) / 2;
        return [
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === 'right' && targetSide === 'left') {
        if (smx1 >= tmx0) {
            let y = middleOfHorizontalSides;
            if (sox > tx1) {
                if (ty1 >= smy0 && toy < soy) {
                    y = Math.min(tmy0, smy0);
                } else if (ty0 <= smy1 && toy >= soy) {
                    y = Math.max(tmy1, smy1);
                }
            }

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
                { x: tox, y: toy }
            ];
        }

        const x = (sox + tox) / 2;
        return [
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === 'top' && targetSide === 'bottom') {
        if (soy < toy) {
            let x = middleOfVerticalSides;
            let y = soy;

            if (soy < ty0) {
                if (tx1 >= smx0 && tox < sox) {
                    x = Math.min(tmx0, smx0);
                } else if (tx0 <= smx1 && tox >= sox) {
                    x = Math.max(tmx1, smx1);
                }
            }

            return [
                { x: sox, y },
                { x, y },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }
        const y = (soy + toy) / 2;
        return [
            { x: sox, y },
            { x: tox, y }
        ];
    } else if (sourceSide === 'bottom' && targetSide === 'top') {
        if (soy - sourceMargin > toy) {
            let x = middleOfVerticalSides;
            let y = soy;

            if (soy > ty1) {
                if (tx1 >= smx0 && tox < sox) {
                    x = Math.min(tmx0, smx0);
                } else if (tx0 <= smx1 && tox >= sox) {
                    x = Math.max(tmx1, smx1);
                }
            }

            return [
                { x: sox, y },
                { x, y },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }
        const y = (soy + toy) / 2;
        return [
            { x: sox, y },
            { x: tox, y }
        ];
    } else if (sourceSide === 'top' && targetSide === 'top') {
        let x;
        let y1 = Math.min((sy1 + ty0) / 2, toy);
        let y2 = Math.min((sy0 + ty1) / 2, soy);

        if (toy < soy) {
            if (sox >= tmx1 || sox <= tmx0) {
                return [
                    { x: sox, y: Math.min(soy, toy) },
                    { x: tox, y: Math.min(soy, toy) }
                ];
            } else if (tox > sox) {
                x = Math.min(sox, tmx0);
            } else {
                x = Math.max(sox, tmx1);
            }
        } else {
            if (tox >= smx1 || tox <= smx0) {
                return [
                    { x: sox, y: Math.min(soy, toy) },
                    { x: tox, y: Math.min(soy, toy) }
                ];
            } else if (tox >= sox) {
                x = Math.max(tox, smx1);
            } else {
                x = Math.min(tox, smx0);
            }
        }

        return [
            { x: sox, y: y2 },
            { x, y: y2 },
            { x, y: y1 },
            { x: tox, y: y1 }
        ];
    } else if (sourceSide === 'bottom' && targetSide === 'bottom') {
        if ((tx0 >= sox + sourceMargin || tx1 <= sox - sourceMargin) && (isTargetEl || isSourceEl)) {
            return [
                { x: sox, y: Math.max(soy, toy) },
                { x: tox, y: Math.max(soy, toy) }
            ];
        }

        let x;
        let y1;
        let y2;

        if (toy > soy) {
            y1 = Math.max((sy1 + ty0) / 2, toy);
            y2 = Math.max((sy1 + ty0) / 2, soy);

            if (tox > sox) {
                x = Math.min(sox, tmx0);
            } else {
                x = Math.max(sox, tmx1);
            }
        } else {
            y1 = Math.max((sy0 + ty1) / 2, toy);
            y2 = Math.max((sy0 + ty1) / 2, soy);

            if (tox > sox) {
                x = Math.min(tox, smx0);
            } else {
                x = Math.max(tox, smx1);
            }
        }

        return [
            { x: sox, y: y2 },
            { x, y: y2 },
            { x, y: y1 },
            { x: tox, y: y1 }
        ];
    } else if (sourceSide === 'left' && targetSide === 'left') {
        let y;
        let x1 = Math.min((sx1 + tx0) / 2, tox);
        let x2 = Math.min((sx0 + tx1) / 2, sox);

        if (tox > sox) {
            if (toy <= soy) {
                y = Math.min(smy0, toy);
            } else {
                y = Math.max(smy1, toy);
            }
        } else {
            if (toy >= soy) {
                y = Math.min(tmy0, soy);
            } else {
                y = Math.max(tmy1, soy);
            }
        }

        const result = [
            { x: x2, y },
            { x: x1, y },
        ];

        // x1 and x2 are equal - redundant point
        if (x1 === x2) {
            result.pop();
        }

        // There are cases where 2 points are enough to draw the route and
        // additional points would cause problems
        if (soy !== y) {
            result.unshift({ x: x2, y: soy });
        }

        if (toy !== y) {
            result.push({ x: x1, y: toy });
        }

        return result;
    } else if (sourceSide === 'right' && targetSide === 'right') {
        let y;
        let x1 = Math.max((sx0 + tx1) / 2, tox);
        let x2 = Math.max((sx1 + tx0) / 2, sox);

        if (tox < sox) {
            if (toy <= soy) {
                y = Math.min(smy0, toy);
            } else {
                y = Math.max(smy1, toy);
            }
        } else {
            if (toy >= soy) {
                y = Math.min(tmy0, soy);
            } else {
                y = Math.max(tmy1, soy);
            }
        }

        const result = [];

        // Add points to the result array based on the conditions
        if (x1 !== x2) {
            result.push({ x: x2, y });
            result.push({ x: x1, y });
        } else {
            result.push({ x: x1, y });
        }

        // There are cases where 2 points are enough to draw the route and
        // additional points would cause problems
        if (soy !== y) {
            result.unshift({ x: x2, y: soy });
        }

        if (toy !== y) {
            result.push({ x: x1, y: toy });
        }

        return result;
    } else if (sourceSide === 'top' && targetSide === 'right') {
        if (soy > toy) {
            if (sox < tox) {
                let y = middleOfHorizontalSides;

                if (y > tcy && y < tmy1 && sox < tmx0) {
                    y = tmy0;
                }
                return [
                    { x: sox, y },
                    { x: tox, y },
                    { x: tox, y: toy }
                ];
            }

            return [{ x: sox, y: toy }];
        }

        const x = middleOfVerticalSides;

        if (tox < sox && toy > sy0 && toy < sy1) {
            return [
                { x: sox, y: soy },
                { x: x, y: soy },
                { x: x, y: toy }
            ];
        }

        if ((x > smx0 && toy > sy0) || tx0 > sx1) {
            const y = Math.min(sy0 - sourceMargin, ty0 - targetMargin);
            const x = Math.max(sx1 + sourceMargin, tx1 + targetMargin);
            return [
                { x: sox, y },
                { x, y },
                { x, y: toy }
            ];
        }

        return [
            { x: sox, y: soy },
            { x: Math.max(x, tox), y: soy },
            { x: Math.max(x, tox), y: toy }
        ];
    } else if (sourceSide === 'top' && targetSide === 'left') {
        if (soy > toy) {
            if (sox > tox) {
                let y = middleOfHorizontalSides;

                if (y > tcy && y < tmy1 && sox > tmx1) {
                    y = tmy0;
                }
                return [
                    { x: sox, y },
                    { x: tox, y },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: sox, y: toy }];
        }

        const x = middleOfVerticalSides;

        if (sox < tox && sy1 >= toy) {
            return [
                { x: sox, y: soy },
                { x, y: soy },
                { x, y: toy }];
        }

        if (x < smx1 && soy < ty1) {
            const y = Math.min(smy0, tmy0);
            const x = Math.min(smx0, tmx0);
            return [
                { x: sox, y },
                { x, y },
                { x, y: toy }
            ];
        }
        return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === 'bottom' && targetSide === 'right') {
        if (soy < toy) {
            if (sox < tox) {
                let y = middleOfHorizontalSides;

                if (y < tcy && y > tmy0 && sox < tmx0) {
                    y = tmy1;
                }
                return [
                    { x: sox, y },
                    { x: tox, y },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: sox, y: toy }];
        } else {
            if (sx0 < tox) {
                const y = Math.max(smy1, tmy1);
                const x = Math.max(smx1, tmx1);
                return [
                    { x: sox, y },
                    { x, y },
                    { x, y: toy }
                ];
            }
        }

        const x = middleOfVerticalSides;

        return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === 'bottom' && targetSide === 'left') {
        if (soy < toy) {
            if (sox > tox) {
                let y = middleOfHorizontalSides;

                if (y < tcy && y > tmy0 && sox > tmx1) {
                    y = tmy1;
                }
                return [
                    { x: sox, y },
                    { x: tox, y },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: sox, y: toy }];
        } else {
            if (sx1 > tox) {
                const y = Math.max(smy1, tmy1);
                const x = Math.min(smx0, tmx0);
                return [
                    { x: sox, y },
                    { x, y },
                    { x, y: toy }
                ];
            }
        }

        const x = middleOfVerticalSides;

        return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === 'left' && targetSide === 'bottom') {
        if (sox > tox && soy >= tmy1) {
            return [{ x: tox, y: soy }];
        }

        if (sox >= tx1 && soy < toy) {
            const x = middleOfVerticalSides;

            return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }

        if (tox < sx1 && ty1 <= sy0) {
            const y = middleOfHorizontalSides;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y }
            ];
        }

        const x = Math.min(tmx0, sox);
        const y = Math.max(smy1, tmy1);

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    } else if (sourceSide === 'left' && targetSide === 'top') {
        if (sox > tox && soy < tmy0) {
            return [{ x: tox, y: soy }];
        }

        if (sox >= tx1) {
            if (soy > toy) {
                const x = middleOfVerticalSides;

                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
        }

        if (tox <= sx1 && toy > soy) {
            const y = middleOfHorizontalSides;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
            ];
        }

        const x = toy < soy ? Math.min(smx0, tmx0) : smx0;
        const y = Math.min(smy0, tmy0);

        const result = [
            { x, y },
            { x: tox, y }
        ];

        if (y !== soy) {
            result.unshift({ x, y: soy });
        }

        return result;

    } else if (sourceSide === 'right' && targetSide === 'top') {
        if (sox <= tox && soy < tmy0) {
            return [{ x: tox, y: soy }];
        }

        if (sx1 < tx0 && soy > toy) {
            let x = middleOfVerticalSides;

            return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }

        if (tox < sox && ty0 > sy1) {
            const y = middleOfHorizontalSides;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y }
            ];
        }

        const x = Math.max(smx1, tmx1);
        const y = Math.min(smy0, tmy0);

        const result = [
            { x, y },
            { x: tox, y }
        ];

        if (y !== soy) {
            result.unshift({ x, y: soy });
        }

        return result;
    } else if (sourceSide === 'right' && targetSide === 'bottom') {
        if (sox < tox && soy >= tmy1) {
            return [{ x: tox, y: soy }];
        }

        if (sox <= tmx0 && soy < toy) {
            const x = middleOfVerticalSides;

            return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }

        if (tox > sx0 && ty1 < sy0) {
            const y = middleOfHorizontalSides;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y }
            ];
        }

        const x = Math.max(tmx1, sox);
        const y = Math.max(smy1, tmy1);

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    }
}

function routeOverlap(p1, p2, p3, p4) {

    const angle1 = new g.Line(p1, p2).angle();
    const angle2 = new g.Line(p3, p4).angle();

    return Math.abs(angle1 - angle2) === 180;
}

function rightAngleRouter(vertices, opt, linkView) {
    const { sourceDirection = Directions.AUTO, targetDirection = Directions.AUTO } = opt;
    const margin = opt.margin || 20;
    const useVertices = opt.useVertices || false;

    const isSourcePort = !!linkView.model.source().port;
    const sourcePoint = pointDataFromAnchor(linkView.sourceView, linkView.sourceAnchor, linkView.sourceBBox, sourceDirection, isSourcePort, linkView.sourceAnchor);

    const isTargetPort = !!linkView.model.target().port;
    const targetPoint = pointDataFromAnchor(linkView.targetView, linkView.targetAnchor, linkView.targetBBox, targetDirection, isTargetPort, linkView.targetAnchor);

    let resultVertices = [];

    if (!useVertices || !vertices.length) {
        return routeBetweenPoints(sourcePoint, targetPoint, margin);
    }

    const verticesPoints = [sourcePoint, ...vertices.map((v) => pointDataFromVertex(v)), targetPoint];
    verticesPoints[1].direction = verticesPoints[1].bbox.sideNearestToPoint(sourcePoint.point);

    for (let i = 0; i < verticesPoints.length - 1; i++) {
        const from = verticesPoints[i];
        const to = verticesPoints[i + 1];

        const route = util.uniq(routeBetweenPoints(from, to, margin), (p) => new g.Point(p.x, p.y).serialize());

        if (new g.Point(resultVertices[resultVertices.length - 1]).equals(route[0])) {
            route.shift();
        }

        if (i > 0) {
            
            let skip = false;

            // prevent infinite correction
            if (from.originalDirection) {
                from.direction = from.originalDirection;
                skip = true;
            }
            
            const middlePoint = verticesPoints[i].point;
            const lastPointOfPrevSegment = middlePoint.equals(resultVertices[resultVertices.length - 1]) ? resultVertices[resultVertices.length - 2] : resultVertices[resultVertices.length - 1];
            const nextPoint = route[0];
            const existingOverlap = routeOverlap(lastPointOfPrevSegment, middlePoint, middlePoint.clone(), nextPoint);

            // possible correction for lines that might share the same segment
            if (existingOverlap && !skip) {

                const isHorizontal = lastPointOfPrevSegment.y === middlePoint.y;

                from.originalDirection = from.direction;

                if (isHorizontal) {
                    const isTargetBelow = to.point.y > middlePoint.y;
                    const direction = isTargetBelow ? Directions.BOTTOM : Directions.TOP;
                    from.direction = direction;
                } else {
                    const isTargetRight = to.point.x > middlePoint.x;
                    const direction = isTargetRight ? Directions.RIGHT : Directions.LEFT;
                    from.direction = direction;
                }

                i--;
                continue;
            }
        }

        if (!to.point.equals(route[route.length - 1]) && i < verticesPoints.length - 2) {
            route.push(to.point);
        }

        resultVertices.push(...route);

        // since the `verticesPoints` includes the source and target points, we don't want to change the direction of the last point
        if (i < verticesPoints.length - 3) {
            // modify the direction of the target for the upcoming segment
            verticesPoints[i + 2].direction = to.direction;
        }

        to.direction = OPPOSITE_DIRECTIONS[to.direction];
    }

    return resultVertices;
}

rightAngleRouter.Directions = Directions;

export const rightAngle = rightAngleRouter;
