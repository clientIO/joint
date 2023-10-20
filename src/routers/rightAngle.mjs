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
    const smx0 = sx0 - margin;
    const smx1 = sx1 + margin;
    const smy0 = sy0 - margin;

    const { x: ax } = anchor;
    const { x0: tx, y0: ty } = target;

    if (tx === ax && ty < sy0) return Directions.BOTTOM;
    if (tx < ax && ty < smy0) return Directions.RIGHT;
    if (tx > ax && ty < smy0) return Directions.LEFT;
    if (tx < smx0 && ty >= sy0) return Directions.TOP;
    if (tx > smx1 && ty >= sy0) return Directions.TOP;
    if (tx >= smx0 && tx <= ax && ty > sy1) {
        if (nextInLine.point.x < tx) {
            return Directions.RIGHT;
        }

        return Directions.LEFT;
    }
    if (tx <= smx1 && tx >= ax && ty > sy1) {
        if (nextInLine.point.x < tx) {
            return Directions.RIGHT;
        }

        return Directions.LEFT;
    }

    return Directions.TOP;
}

function resolveForBottomSourceSide(source, target, nextInLine) {
    const { x0: sx0, y0: sy0, width, height, point: anchor, margin } = source;
    const sx1 = sx0 + width;
    const sy1 = sy0 + height;
    const smx0 = sx0 - margin;
    const smx1 = sx1 + margin;
    const smy1 = sy1 + margin;

    const { x: ax } = anchor;
    const { x0: tx, y0: ty } = target;

    if (tx === ax && ty > sy1) return Directions.TOP;
    if (tx < ax && ty > smy1) return Directions.RIGHT;
    if (tx > ax && ty > smy1) return Directions.LEFT;
    if (tx < smx0 && ty <= sy1) return Directions.BOTTOM;
    if (tx > smx1 && ty <= sy1) return Directions.BOTTOM;
    if (tx >= smx0 && tx <= ax && ty < sy0) {
        if (nextInLine.point.x < tx) {
            return Directions.RIGHT;
        }

        return Directions.LEFT;
    }
    if (tx <= smx1 && tx >= ax && ty < sy0) {
        if (nextInLine.point.x < tx) {
            return Directions.RIGHT;
        }

        return Directions.LEFT;
    }

    return Directions.BOTTOM;
}

function resolveForLeftSourceSide(source, target, nextInLine) {
    const { y0: sy0, x0: sx0, width, height, point: anchor, margin } = source;
    const sx1 = sx0 + width;
    const sy1 = sy0 + height;
    const smx0 = sx0 - margin;
    const smy0 = sy0 - margin;
    const smy1 = sy1 + margin;

    const { x: ax, y: ay } = anchor;
    const { x0: tx, y0: ty } = target;

    if (tx < ax && ty === ay) return Directions.RIGHT;
    if (tx <= smx0 && ty < ay) return Directions.BOTTOM;
    if (tx <= smx0 && ty > ay) return Directions.TOP;
    if (tx >= sx0 && ty <= smy0) return Directions.LEFT;
    if (tx >= sx0 && ty >= smy1) return Directions.LEFT;
    if (tx > sx1 && ty >= smy0 && ty <= ay) {
        if (nextInLine.point.y < ty) {
            return Directions.BOTTOM;
        }

        return Directions.TOP;
    }
    if (tx > sx1 && ty <= smy1 && ty >= ay) {
        if (nextInLine.point.y < ty) {
            return Directions.BOTTOM;
        }

        return Directions.TOP;
    }

    return Directions.LEFT;
}

function resolveForRightSourceSide(source, target, nextInLine) {
    const { y0: sy0, x0: sx0, width, height, point: anchor, margin } = source;
    const sx1 = sx0 + width;
    const sy1 = sy0 + height;
    const smx1 = sx1 + margin;
    const smy0 = sy0 - margin;
    const smy1 = sy1 + margin;

    const { x: ax, y: ay } = anchor;
    const { x0: tx, y0: ty } = target;

    if (tx > ax && ty === ay) return Directions.LEFT;
    if (tx >= smx1 && ty < ay) return Directions.BOTTOM;
    if (tx >= smx1 && ty > ay) return Directions.TOP;
    if (tx <= sx1 && ty <= smy0) return Directions.RIGHT;
    if (tx <= sx1 && ty >= smy1) return Directions.RIGHT;
    if (tx < sx0 && ty >= smy0 && ty <= ay) {
        if (nextInLine.point.y < ty) {
            return Directions.BOTTOM;
        }

        return Directions.TOP;
    }
    if (tx < sx0 && ty <= smy1 && ty >= ay) {
        if (nextInLine.point.y < ty) {
            return Directions.BOTTOM;
        }

        return Directions.TOP;
    }

    return Directions.RIGHT;
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

function pointDataFromAnchor(view, point, bbox, direction, isPort, fallBackAnchor, margin) {
    if (direction === Directions.AUTO) {
        direction = isPort ? Directions.MAGNET_SIDE : Directions.ANCHOR_SIDE;
    }

    const isElement = view && view.model.isElement();

    const {
        x: x0,
        y: y0,
        width = 0,
        height = 0
    } = isElement ? g.Rect.fromRectUnion(bbox, view.model.getBBox()) : fallBackAnchor;

    return {
        point,
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

function routeBetweenPoints(source, target) {
    const { point: sourcePoint, x0: sx0, y0: sy0, view: sourceView, width: sourceWidth, height: sourceHeight, margin: sourceMargin } = source;
    const { point: targetPoint, x0: tx0, y0: ty0, width: targetWidth, height: targetHeight, margin: targetMargin } = target;

    const tx1 = tx0 + targetWidth;
    const ty1 = ty0 + targetHeight;
    const sx1 = sx0 + sourceWidth;
    const sy1 = sy0 + sourceHeight;

    const isSourceEl = sourceView && sourceView.model.isElement();

    // Key coordinates including the margin
    const smx0 = sx0 - sourceMargin;
    const smx1 = sx1 + sourceMargin;
    const smy0 = sy0 - sourceMargin;
    const smy1 = sy1 + sourceMargin;

    const tmx0 = tx0 - targetMargin;
    const tmx1 = tx1 + targetMargin;
    const tmy0 = ty0 - targetMargin;
    const tmy1 = ty1 + targetMargin;

    const [sourceSide, targetSide] = resolveSides(source, target);

    const sourceOutsidePoint = getOutsidePoint(sourceSide, { point: sourcePoint, x0: sx0, y0: sy0, width: sourceWidth, height: sourceHeight }, sourceMargin);
    const targetOutsidePoint = getOutsidePoint(targetSide, { point: targetPoint, x0: tx0, y0: ty0, width: targetWidth, height: targetHeight }, targetMargin);

    const { x: sox, y: soy } = sourceOutsidePoint;
    const { x: tox, y: toy } = targetOutsidePoint;
    const tcx = (tx0 + tx1) / 2;
    const tcy = (ty0 + ty1) / 2;
    const scx = (sx0 + sx1) / 2;
    const scy = (sy0 + sy1) / 2;
    const middleOfVerticalSides = (scx < tcx ? (sx1 + tx0) : (tx1 + sx0)) / 2;
    const middleOfHorizontalSides = (scy < tcy ? (sy1 + ty0) : (ty1 + sy0)) / 2;

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
        let x;
        let y1 = Math.max((sy0 + ty1) / 2, toy);
        let y2 = Math.max((sy1 + ty0) / 2, soy);

        if (toy > soy) {
            if (sox >= tmx1 || sox <= tmx0) {
                return [
                    { x: sox, y: Math.max(soy, toy) },
                    { x: tox, y: Math.max(soy, toy) }
                ];
            } else if (tox > sox) {
                x = Math.min(sox, tmx0);
            } else {
                x = Math.max(sox, tmx1);
            }
        } else {
            if (tox >= smx1 || tox <= smx0) {
                return [
                    { x: sox, y: Math.max(soy, toy) },
                    { x: tox, y: Math.max(soy, toy) }
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

        return [
            { x: x2, y: soy },
            { x: x2, y },
            { x: x1, y },
            { x: x1, y: toy }
        ];
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

        return [
            { x: x2, y: soy },
            { x: x2, y },
            { x: x1, y },
            { x: x1, y: toy }
        ];
    } else if (sourceSide === 'top' && targetSide === 'right') {
        if (soy > toy) {
            if (sox < tox) {
                let y = middleOfHorizontalSides;

                if ((y > tcy || !isSourceEl) && y < tmy1 && sox < tx0) {
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

        const x = Math.max(middleOfVerticalSides, tmx1);

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

                if ((y > tcy || !isSourceEl) && y < tmy1 && sox > tx1) {
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

        const x = Math.min(tmx0, middleOfVerticalSides);

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

                if ((y < tcy || !isSourceEl) && y > tmy0 && sox < tx0) {
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

                if ((y < tcy || !isSourceEl) && y > tmy0 && sox > tx1) {
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
    }
    else if (sourceSide === 'left' && targetSide === 'bottom') {
        if (sox >= tox && soy >= tmy1) {
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

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];

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

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    } else if (sourceSide === 'right' && targetSide === 'bottom') {
        if (sox <= tox && soy >= tmy1) {
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

function rightAngleRouter(vertices, opt, linkView) {
    const { sourceDirection = Directions.AUTO, targetDirection = Directions.AUTO } = opt;
    const margin = opt.margin || 20;
    const useVertices = opt.useVertices || false;

    const isSourcePort = !!linkView.model.source().port;
    const sourcePoint = pointDataFromAnchor(linkView.sourceView, linkView.sourceAnchor, linkView.sourceBBox, sourceDirection, isSourcePort, linkView.sourceAnchor, margin);

    const isTargetPort = !!linkView.model.target().port;
    const targetPoint = pointDataFromAnchor(linkView.targetView, linkView.targetAnchor, linkView.targetBBox, targetDirection, isTargetPort, linkView.targetAnchor, margin);

    let resultVertices = [];

    if (!useVertices || vertices.length === 0) {
        return simplifyPoints(routeBetweenPoints(sourcePoint, targetPoint));
    }

    const verticesData = vertices.map((v) => pointDataFromVertex(v));
    const [firstVertex] = verticesData;

    if (sourcePoint.view && sourcePoint.view.model.isElement() && sourcePoint.view.model.getBBox().inflate(margin).containsPoint(firstVertex.point)) {
        const [fromDirection] = resolveSides(sourcePoint, firstVertex);
        const toDirection = fromDirection;
        const dummySource = pointDataFromVertex(sourcePoint.point);
        // Points do not usually have margin. Here we create a point with a margin.
        dummySource.margin = margin;
        dummySource.direction = fromDirection;
        firstVertex.direction = toDirection;

        resultVertices.push(...routeBetweenPoints(dummySource, firstVertex), firstVertex.point);
    } else {
        // The first point responsible for the initial direction of the route
        const next = verticesData[1] || targetPoint;
        const direction = resolveInitialDirection(sourcePoint, firstVertex, next);
        firstVertex.direction = direction;

        resultVertices.push(...routeBetweenPoints(sourcePoint, firstVertex), firstVertex.point);
    }

    for (let i = 0; i < verticesData.length - 1; i++) {
        const from = verticesData[i];
        const to = verticesData[i + 1];

        const segment = new g.Line(from.point, to.point);
        const segmentAngle = getSegmentAngle(segment);
        if (segmentAngle % 90 === 0) {
            // Since the segment is horizontal or vertical, we can skip the routing and just connect them with a straight line
            const toDirection = ANGLE_DIRECTION_MAP[segmentAngle];
            const accessDirection = OPPOSITE_DIRECTIONS[toDirection];

            if (toDirection !== from.direction) {
                resultVertices.push(from.point, to.point);
                to.direction = accessDirection;
            } else {
                const angle = g.normalizeAngle(segmentAngle - 90);

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

                const p1 = { x: from.point.x + dx, y: from.point.y + dy };
                const p2 = { x: to.point.x + dx, y: to.point.y + dy };

                const segment2 = new g.Line(to.point, p2);
                to.direction = ANGLE_DIRECTION_MAP[getSegmentAngle(segment2)];

                // Constructing a loop
                resultVertices.push(from.point, p1, p2, to.point);
            }

            continue;
        }

        const [fromDirection, toDirection] = resolveDirection(from, to);

        from.direction = fromDirection;
        to.direction = toDirection;

        resultVertices.push(...routeBetweenPoints(from, to), to.point);
    }

    const lastVertex = verticesData[verticesData.length - 1];

    if (targetPoint.view && targetPoint.view.model.isElement()) {
        if (targetPoint.view.model.getBBox().inflate(margin).containsPoint(lastVertex.point)) {
            const [fromDirection] = resolveDirection(lastVertex, targetPoint);
            const dummyTarget = pointDataFromVertex(targetPoint.point);
            const [, toDirection] = resolveSides(lastVertex, targetPoint);
            // we are creating a point that has a margin
            dummyTarget.margin = margin;
            dummyTarget.direction = toDirection;
            lastVertex.direction = fromDirection;

            resultVertices.push(...routeBetweenPoints(lastVertex, dummyTarget));
        } else {
            // the last point of `simplified` array is the last defined vertex
            // grab the penultimate point and construct a line segment from it to the last vertex
            // this will ensure that the last segment continues in a straight line

            const simplified = simplifyPoints(resultVertices);
            const segment = new g.Line(simplified[simplified.length - 2], lastVertex.point);
            const definedDirection = ANGLE_DIRECTION_MAP[Math.round(getSegmentAngle(segment))];
            lastVertex.direction = definedDirection;

            let lastSegmentRoute = routeBetweenPoints(lastVertex, targetPoint);
            const [p1, p2] = simplifyPoints([...lastSegmentRoute, targetPoint.point]);

            const lastSegment = new g.Line(p1, p2);
            const roundedLastSegmentAngle = Math.round(getSegmentAngle(lastSegment));
            const lastSegmentDirection = ANGLE_DIRECTION_MAP[roundedLastSegmentAngle];

            if (lastSegmentDirection !== definedDirection && definedDirection === OPPOSITE_DIRECTIONS[lastSegmentDirection]) {
                lastVertex.margin = margin;
                lastSegmentRoute = routeBetweenPoints(lastVertex, targetPoint);
            }

            resultVertices.push(...lastSegmentRoute);
        }
    } else {
        // since the target is only a point we can apply the same logic as if we connected two verticesData
        const [vertexDirection] = resolveDirection(lastVertex, targetPoint);
        lastVertex.direction = vertexDirection;

        resultVertices.push(...routeBetweenPoints(lastVertex, targetPoint));
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
