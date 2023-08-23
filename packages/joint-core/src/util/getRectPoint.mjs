import * as g from '../g/index.mjs';

export const Positions = {
    TOP: 'top',
    RIGHT: 'right',
    BOTTOM: 'bottom',
    LEFT: 'left',
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right',
    CENTER: 'center',
};

export function getRectPoint(rect, position) {
    const r = new g.Rect(rect);
    switch (position) {
        case undefined:
            throw new Error('Position required');

        // Middle Points
        case Positions.LEFT:
        case 'leftMiddle':
            return r.leftMiddle();

        case Positions.RIGHT:
        case 'rightMiddle':
            return r.rightMiddle();

        case Positions.TOP:
        case 'topMiddle':
            return r.topMiddle();

        case Positions.BOTTOM:
        case 'bottomMiddle':
            return r.bottomMiddle();

        // Corners
        case Positions.TOP_LEFT:
        case 'topLeft':
        case 'origin':
            return r.topLeft();

        case Positions.TOP_RIGHT:
        case 'topRight':
            return r.topRight();

        case Positions.BOTTOM_LEFT:
        case 'bottomLeft':
            return r.bottomLeft();

        case Positions.BOTTOM_RIGHT:
        case 'bottomRight':
        case 'corner':
            return r.bottomRight();

        // Center
        case Positions.CENTER:
            return r.center();

        // TODO: calc(), percentage etc.
        default:
            throw new Error(`Unknown position: ${position}`);
    }
}
