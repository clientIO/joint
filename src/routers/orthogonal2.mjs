export function orthogonal2(vertices, opt, linkView) {
    const sourceBBox = linkView.sourceBBox;
    const targetBBox = linkView.targetBBox;
    const sourcePoint = linkView.sourceAnchor;
    const targetPoint = linkView.targetAnchor;
    const { x: tx0, y: ty0 } = targetBBox;
    const { x: sx0, y: sy0 } = sourceBBox;
    const sourceOutsidePoint = sourcePoint.clone();
    const spacing = opt.spacing || 28;
    const sourceSide = sourceBBox.sideNearestToPoint(sourcePoint);
    switch (sourceSide) {
        case 'left':
            sourceOutsidePoint.x = sx0 - spacing;
            break;
        case 'right':
            sourceOutsidePoint.x = sx0 + sourceBBox.width + spacing;
            break;
        case 'top':
            sourceOutsidePoint.y = sy0 - spacing;
            break;
        case 'bottom':
            sourceOutsidePoint.y = sy0 + sourceBBox.height + spacing;
            break;
    }
    const targetOutsidePoint = targetPoint.clone();
    const targetSide = targetBBox.sideNearestToPoint(targetPoint);
    switch (targetSide) {
        case 'left':
            targetOutsidePoint.x = targetBBox.x - spacing;
            break;
        case 'right':
            targetOutsidePoint.x = targetBBox.x + targetBBox.width + spacing;
            break;
        case 'top':
            targetOutsidePoint.y = targetBBox.y - spacing;
            break;
        case 'bottom':
            targetOutsidePoint.y = targetBBox.y + targetBBox.height + spacing;
            break;
    }

    const { x: sox, y: soy } = sourceOutsidePoint;
    const { x: tox, y: toy } = targetOutsidePoint;
    const tx1 = tx0 + targetBBox.width;
    const ty1 = ty0 + targetBBox.height;
    const tcx = (tx0 + tx1) / 2;
    const tcy = (ty0 + ty1) / 2;
    const sx1 = sx0 + sourceBBox.width;
    const sy1 = sy0 + sourceBBox.height;
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
        if (sox < tox) {
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
        if (sox > tox) {
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
            { x: x, y: y2 },
            { x: x, y: y1 },
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
            { x: x, y: y2 },
            { x: x, y: y1 },
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
            { x: x2, y: y },
            { x: x1, y: y },
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
            { x: x2, y: y },
            { x: x1, y: y },
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

        const x = middleOfVerticalSides;

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

        const x = middleOfVerticalSides;

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

        const x = Math.min(sx0, tx0) - spacing;
        let y = Math.max(sy1, ty1) + spacing;

        if (tox <= sx1 && toy < soy) {
            y = (ty1 + sy0) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
            ];
        }

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    } else if (sourceSide === 'left' && targetSide === 'top') {
        if (sox > tox && soy <= toy) {
            return [{ x: tox, y: soy }];
        }

        if (sox > tx1) {
            if (soy > toy) {
                const x = (sx0 + tx1) / 2;
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
        }

        const x = Math.min(sx0, tx0) - spacing;
        let y = Math.min(sy0, ty0) - spacing;

        if (tox <= sx1 && toy > soy) {
            y = (ty0 + sy1) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
            ];
        }

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
        
    } else if (sourceSide === 'right' && targetSide === 'top') {
        if (sox < tox && soy <= toy) {
            return [{ x: tox, y: soy }];
        }

        let x = (sx1 + tx0) / 2;

        if (sx1 < tx0) {
            if (soy > toy) {
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
        }

        if (x < sx1 + spacing && sy1 > ty0) {
            x = Math.max(tx1 + spacing, sox);
            const y = Math.min(sy0, ty0) - spacing;

            return [
                { x, y: soy },
                { x, y: y },
                { x: tox, y: y }
            ];
        }

        const y = (sy1 + ty0) / 2;
        if (y <= sy1 && tox < sx0) {
            const x = Math.max(sx1, tx1) + spacing;
            const y = Math.min(sy0, ty0) - spacing;
            return [
                { x, y: soy },
                { x, y },
                { x: tox, y }
            ];
        }

        return [
            { x: sox, y: soy },
            { x: sox, y: y },
            { x: tox, y: y }
        ];  
    } else if (sourceSide === 'right' && targetSide === 'bottom') {
        let x = (sx1 + tx0) / 2;
        if (sx1 < x) {
            if (soy < toy) {
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: tox, y: soy }];
        }

        if (x < sx1 + spacing && sy0 < ty1) {
            x = Math.max(tx1 + spacing, sox);
            const y = Math.max(sy1, ty1) + spacing;

            return [
                { x, y: soy },
                { x, y: y },
                { x: tox, y: y }
            ];
        }

        const y = (sy0 + ty1) / 2;
        if (y >= sy0 && tox < sx0) {
            const x = Math.max(sx1, tx1) + spacing;
            const y = Math.max(sy1, ty1) + spacing;
            return [
                { x, y: soy },
                { x, y },
                { x: tox, y }
            ];
        }

        return [
            { x: sox, y: soy },
            { x: sox, y: y },
            { x: tox, y: y }
        ];
    }
}
