import * as g from '../g/index.mjs';

const Locations = {
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

export function getRectPoint(rect, keyword) {
    const r = new g.Rect(rect);
    switch (keyword) {
        case undefined:
            throw new Error('Location required');

        // Middle Points
        case Locations.LEFT:
        case 'leftMiddle':
            return r.leftMiddle();

        case Locations.RIGHT:
        case 'rightMiddle':
            return r.rightMiddle();

        case Locations.TOP:
        case 'topMiddle':
            return r.topMiddle();

        case Locations.BOTTOM:
        case 'bottomMiddle':
            return r.bottomMiddle();

        // Corners
        case Locations.TOP_LEFT:
        case 'topLeft':
        case 'origin':
            return r.topLeft();

        case Locations.TOP_RIGHT:
        case 'topRight':
            return r.topRight();

        case Locations.BOTTOM_LEFT:
        case 'bottomLeft':
            return r.bottomLeft();

        case Locations.BOTTOM_RIGHT:
        case 'bottomRight':
        case 'corner':
            return r.bottomRight();

        // Center
        case Locations.CENTER:
            return r.center();

        // TODO: calc(), percentage etc.
        default:
            throw new Error(`Unknown location: ${keyword}`);
    }
}
