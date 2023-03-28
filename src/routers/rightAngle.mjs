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

rightAngle.Directions = Directions;

const DEFINED_DIRECTIONS = [Directions.LEFT, Directions.RIGHT, Directions.TOP, Directions.BOTTOM];

function getDirectionForLinkConnection(linkOrigin, connectionPoint, linkView) {
    const segment = linkView.path.segments.find(segment => segment.previousSegment && new g.Line(segment.start, segment.end).containsPoint(connectionPoint));
    const roundedAngle = Math.round(segment.angle() / 90) * 90;

    switch (roundedAngle) {
        case 0:
            return linkOrigin.y < connectionPoint.y ? Directions.TOP : Directions.BOTTOM;
        case 90:
            return linkOrigin.x < connectionPoint.x ? Directions.LEFT : Directions.RIGHT;
        case 180:
            return linkOrigin.y < connectionPoint.y ? Directions.TOP : Directions.BOTTOM;
        case 270:
            return linkOrigin.x < connectionPoint.x ? Directions.RIGHT : Directions.LEFT;
    }
}

export function rightAngle(_vertices, opt, linkView) {
    const spacing = opt.spacing || 20;
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
            sourceOutsidePoint.x = sx0 - spacing;
            break;
        case 'right':
            sourceOutsidePoint.x = sx1 + spacing;
            break;
        case 'top':
            sourceOutsidePoint.y = sy0 - spacing;
            break;
        case 'bottom':
            sourceOutsidePoint.y = sy1 + spacing;
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
            targetOutsidePoint.x = tx0 - spacing;
            break;
        case 'right':
            targetOutsidePoint.x = tx1 + spacing;
            break;
        case 'top':
            targetOutsidePoint.y = ty0 - spacing;
            break;
        case 'bottom':
            targetOutsidePoint.y = ty1 + spacing;
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
    const ssx0 = sx0 - spacing;
    const ssx1 = sx1 + spacing;
    const tsx0 = tx0 - spacing;
    const tsx1 = tx1 + spacing;
    const ssy0 = sy0 - spacing;
    const ssy1 = sy1 + spacing;

    if (sourceSide === 'left' && targetSide === 'right') {
        if (sx0 <= tx1) {
            let y = middleOfHorizontalSides;
            if (sox < tx0) {
                if (ty1 >= ssy0 && tcy < scy) {
                    y = Math.min(ty0 - spacing, ssy0);
                } else if (ty0 <= ssy1 && tcy >= scy) {
                    y = Math.max(ty1 + spacing, ssy1);
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
        if (sx1 > tx0) {
            let y = middleOfHorizontalSides;
            if (sox > tx1) {
                if (ty1 >= ssy0 && tcy < scy) {
                    y = Math.min(ty0 - spacing, ssy0);
                } else if (ty0 <= ssy1 && tcy >= scy) {
                    y = Math.max(ty1 + spacing, ssy1);
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
                if (tx1 >= ssx0 && tcx < scx) {
                    x = Math.min(tx0 - spacing, ssx0);
                } else if (tx0 <= ssx1 && tcx >= scx) {
                    x = Math.max(tx1 + spacing, ssx1);
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
        if (soy - spacing > toy) {
            let x = middleOfVerticalSides;
            let y = soy;

            if (soy > ty1) {
                if (tx1 >= ssx0 && tcx < scx) {
                    x = Math.min(tx0 - spacing, ssx0);
                } else if (tx0 <= ssx1 && tcx >= scx) {
                    x = Math.max(tx1 + spacing, ssx1);
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
            if (sox >= tsx1 || sox <= tsx0) {
                return [
                    { x: sox, y: Math.min(soy,toy) },
                    { x: tox, y: Math.min(soy,toy) }
                ];
            } else if (tox > sox) {
                x = Math.min(sox, tsx0);
            } else {
                x = Math.max(sox, tsx1);
            }
        } else {
            if (tox >= ssx1 || tox <= ssx0) {
                return [
                    { x: sox, y: Math.min(soy,toy) },
                    { x: tox, y: Math.min(soy,toy) }
                ];
            } else if (tcx >= scx) {
                x = Math.max(tox, ssx1);
            } else {
                x = Math.min(tox, ssx0);
            }
        }

        return [
            { x: sox, y: y2 },
            { x, y: y2 },
            { x, y: y1 },
            { x: tox, y: y1 }
        ];
    } else if (sourceSide === 'bottom' && targetSide === 'bottom') {
        if (tx0 >= ssx1 || tx1 <= ssx0) {
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
                x = Math.min(sox, tsx0);
            } else {
                x = Math.max(sox, tsx1);
            }
        } else {
            y1 = Math.max((sy0 + ty1) / 2, toy);
            y2 = Math.max((sy0 + ty1) / 2, soy);

            if (tcx >= scx) {
                x = Math.max(tox, ssx1);
            } else {
                x = Math.min(tox, ssx0);
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

        const ssy0 = sy0 - spacing;
        const ssy1 = sy1 + spacing;
        const tsy0 = ty0 - spacing;
        const tsy1 = ty1 + spacing;

        if (tox > sox) {
            if (toy <= soy) {
                y = Math.min(ssy0, toy);
            } else {
                y = Math.max(ssy1, toy);
            }
        } else {
            if (toy >= soy) {
                y = Math.min(tsy0, soy);
            } else {
                y = Math.max(tsy1, soy);
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

        const ssy0 = sy0 - spacing;
        const ssy1 = sy1 + spacing;
        const tsy0 = ty0 - spacing;
        const tsy1 = ty1 + spacing;

        if (tox < sox) {
            if (toy <= soy) {
                y = Math.min(ssy0, toy);
            } else {
                y = Math.max(ssy1, toy);
            }
        } else {
            if (toy >= soy) {
                y = Math.min(tsy0, soy);
            } else {
                y = Math.max(tsy1, soy);
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
                if (y > tcy && y < ty1 + spacing && sox < tx0 - spacing) {
                    y = ty0 - spacing;
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

        if (x > ssx0 && soy < ty1) {
            const y = Math.min(sy0, ty0) - spacing;
            const x = Math.max(sx1, tx1) + spacing;
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
                if (y > tcy && y < ty1 + spacing && sox > tx1 + spacing) {
                    y = ty0 - spacing;
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

        if (x < ssx1 && soy < ty1) {
            const y = Math.min(sy0, ty0) - spacing;
            const x = Math.min(sx0, tx0) - spacing;
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
                if (y < tcy && y > ty0 - spacing && sox < tx0 - spacing) {
                    y = ty1 + spacing;
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
                const y = Math.max(sy1, ty1) + spacing;
                const x = Math.max(sx1, tx1) + spacing;
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
                if (y < tcy && y > ty0 - spacing && sox > tx1 + spacing) {
                    y = ty1 + spacing;
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
                const y = Math.max(sy1, ty1) + spacing;
                const x = Math.min(sx0, tx0) - spacing;
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
        if (sox > tox && soy >= toy) {
            return [{ x: tox, y: soy }];
        }

        if (sox > tx1) {
            if (soy < toy) {
                const x = middleOfVerticalSides;
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
        }

        if (tox <= sx1 && toy < soy) {
            const y = (ty1 + sy0) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
            ];
        }

        const x = toy > soy ? Math.min(sx0, tx0) - spacing : sox;
        const y = Math.max(sy1, ty1) + spacing;

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    } else if (sourceSide === 'left' && targetSide === 'top') {
        if (sox > tox && soy < ty0) {
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

        const x = toy < soy ? Math.min(sx0, tx0) - spacing : ssx0;
        const y = Math.min(sy0, ty0) - spacing;

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
        
    } else if (sourceSide === 'right' && targetSide === 'top') {
        if (sox <= tox && soy < ty0) {
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

        const x = Math.max(sx1, tx1) + spacing;
        const y = Math.min(sy0, ty0) - spacing;
        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    } else if (sourceSide === 'right' && targetSide === 'bottom') {
        if (sox <= tox && soy > ty1) {
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
        
        const x = Math.max(tx1 + spacing, sox);
        const y = Math.max(sy1, ty1) + spacing;

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    }
}
