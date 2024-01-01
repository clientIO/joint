
// Offset attributes require the cell view to be rendered before they can be applied
// (they must be appended to the DOM).

import { Point } from '../../g/index.mjs';
import { isPercentage } from '../../util/util.mjs';

function offsetWrapper(axis, dimension, corner) {
    return function(value, nodeBBox) {
        var delta;
        if (value === 'middle') {
            delta = nodeBBox[dimension] / 2;
        } else if (value === corner) {
            delta = nodeBBox[dimension];
        } else if (isFinite(value)) {
            // TODO: or not to do a breaking change?
            delta = (value > -1 && value < 1) ? (-nodeBBox[dimension] * value) : -value;
        } else if (isPercentage(value)) {
            delta = nodeBBox[dimension] * parseFloat(value) / 100;
        } else {
            delta = 0;
        }

        var point = new Point();
        point[axis] = -(nodeBBox[axis] + delta);
        return point;
    };
}

const offsetAttributesNS = {

    // `x-alignment` when set to `middle` causes centering of the sub-element around its new x coordinate.
    // `x-alignment` when set to `right` uses the x coordinate as referenced to the right of the bbox.
    'x-alignment': {
        offset: offsetWrapper('x', 'width', 'right')
    },

    // `y-alignment` when set to `middle` causes centering of the sub-element around its new y coordinate.
    // `y-alignment` when set to `bottom` uses the y coordinate as referenced to the bottom of the bbox.
    'y-alignment': {
        offset: offsetWrapper('y', 'height', 'bottom')
    },

    'reset-offset': {
        offset: function(val, nodeBBox) {
            return (val)
                ? { x: -nodeBBox.x, y: -nodeBBox.y }
                : { x: 0, y: 0 };
        }
    },
};

export default offsetAttributesNS;
