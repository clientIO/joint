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

function rightAngleRouter(_vertices, opt, linkView) {
    const margin = opt.margin || 20;
    let { sourceDirection = Directions.AUTO, targetDirection = Directions.AUTO } = opt;

    const sourceView = linkView.sourceView;
    const targetView = linkView.targetView;

    const isSourcePort = !!linkView.model.source().port;
    const isTargetPort = !!linkView.model.target().port;

    if (sourceDirection === Directions.AUTO) {
        sourceDirection = isSourcePort ? Directions.MAGNET_SIDE : Directions.ANCHOR_SIDE;
    }

    if (targetDirection === Directions.AUTO) {
        targetDirection = isTargetPort ? Directions.MAGNET_SIDE : Directions.ANCHOR_SIDE;
    }

    const sourceBBox = linkView.sourceBBox;
    const targetBBox = linkView.targetBBox;
    const sourcePoint = linkView.sourceAnchor;
    const targetPoint = linkView.targetAnchor;
    let {
        x: sx0,
        y: sy0,
        width: sourceWidth = 0,
        height: sourceHeight = 0
    } = sourceView && sourceView.model.isElement() ? g.Rect.fromRectUnion(sourceBBox, sourceView.model.getBBox()) : linkView.sourceAnchor;

    let {
        x: tx0,
        y: ty0,
        width: targetWidth = 0,
        height: targetHeight = 0
    } = targetView && targetView.model.isElement() ? g.Rect.fromRectUnion(targetBBox, targetView.model.getBBox()) : linkView.targetAnchor;

    const tx1 = tx0 + targetWidth;
    const ty1 = ty0 + targetHeight;
    const sx1 = sx0 + sourceWidth;
    const sy1 = sy0 + sourceHeight;

    // Key coordinates including the margin
    const smx0 = sx0 - margin;
    const smx1 = sx1 + margin;
    const smy0 = sy0 - margin;
    const smy1 = sy1 + margin;
    const tmx0 = tx0 - margin;
    const tmx1 = tx1 + margin;
    const tmy0 = ty0 - margin;
    const tmy1 = ty1 + margin;

    const sourceOutsidePoint = sourcePoint.clone();

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

    if (sourceSide === 'left' && targetSide === 'right') {
        if (smx0 <= tx1) {
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
        if (smx1 >= tx0) {
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
        if (soy - margin > toy) {
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
                    { x: sox, y: Math.min(soy,toy) },
                    { x: tox, y: Math.min(soy,toy) }
                ];
            } else if (tox > sox) {
                x = Math.min(sox, tmx0);
            } else {
                x = Math.max(sox, tmx1);
            }
        } else {
            if (tox >= smx1 || tox <= smx0) {
                return [
                    { x: sox, y: Math.min(soy,toy) },
                    { x: tox, y: Math.min(soy,toy) }
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
        if (tx0 >= sox + margin || tx1 <= sox - margin) {
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
                let y = (sy0 + ty1) / 2;
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

        const x = (sx0 + tx1) / 2;

        if (sox > tox && sy1 >= toy) {
            return [
                { x: sox, y: soy },
                { x, y: soy },
                { x, y: toy }];
        }

        if (x > smx0 && soy < ty1) {
            const y = Math.min(sy0, ty0) - margin;
            const x = Math.max(sx1, tx1) + margin;
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
    } else if (sourceSide === 'top' && targetSide === 'left') {
        if (soy > toy) {
            if (sox > tox) {
                let y = (sy0 + ty1) / 2;
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

        const x = (sx1 + tx0) / 2;

        if (sox < tox && sy1 >= toy) {
            return [
                { x: sox, y: soy },
                { x, y: soy },
                { x, y: toy }];
        }

        if (x < smx1 && soy < ty1) {
            const y = Math.min(sy0, ty0) - margin;
            const x = Math.min(sx0, tx0) - margin;
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
                let y = (sy1 + ty0) / 2;
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
                const y = Math.max(sy1, ty1) + margin;
                const x = Math.max(sx1, tx1) + margin;
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
                let y = (sy1 + ty0) / 2;
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
                const y = Math.max(sy1, ty1) + margin;
                const x = Math.min(sx0, tx0) - margin;
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
            const x = (sx1 + tx0) / 2;
            return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }

        if (tox < sx1 && ty1 <= sy0) {
            const y = (sy0 + ty1) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y }
            ];
        }

        const x = Math.min(tmx0, sox);
        const y = Math.max(sy1, ty1) + margin;

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
                const x = (sx0 + tx1) / 2;
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
        }

        if (tox <= sx1 && toy > soy) {
            const y = (ty0 + sy1) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
            ];
        }

        const x = toy < soy ? Math.min(sx0, tx0) - margin : smx0;
        const y = Math.min(sy0, ty0) - margin;

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];

    } else if (sourceSide === 'right' && targetSide === 'top') {
        if (sox < tox && soy < tmy0) {
            return [{ x: tox, y: soy }];
        }

        if (sx1 < tx0 && soy > toy) {
            let x = (sx1 + tx0) / 2;
            return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }

        if (tox < sox && ty0 > sy1) {
            const y = (sy1 + ty0) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y }
            ];
        }

        const x = Math.max(sx1, tx1) + margin;
        const y = Math.min(sy0, ty0) - margin;
        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    } else if (sourceSide === 'right' && targetSide === 'bottom') {
        if (sox < tox && soy >= tmy1) {
            return [{ x: tox, y: soy }];
        }

        if (sox <= tx0 && soy < toy) {
            const x = (sx1 + tx0) / 2;
            return [
                { x, y: soy },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }

        if (tox > sx0 && ty1 < sy0) {
            const y = (sy0 + ty1) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y }
            ];
        }

        const x = Math.max(tmx1, sox);
        const y = Math.max(sy1, ty1) + margin;

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    }
}

rightAngleRouter.Directions = Directions;

export const rightAngle = rightAngleRouter;
