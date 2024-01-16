import { Point } from '../../g/index.mjs';
import { isPercentage } from '../../util/util.mjs';

function positionWrapper(axis, dimension, origin) {
    return function(value, refBBox) {
        var valuePercentage = isPercentage(value);
        value = parseFloat(value);
        if (valuePercentage) {
            value /= 100;
        }

        var delta;
        if (isFinite(value)) {
            var refOrigin = refBBox[origin]();
            if (valuePercentage || value > 0 && value < 1) {
                delta = refOrigin[axis] + refBBox[dimension] * value;
            } else {
                delta = refOrigin[axis] + value;
            }
        }

        var point = Point();
        point[axis] = delta || 0;
        return point;
    };
}

function setWrapper(attrName, dimension) {
    return function(value, refBBox) {
        var isValuePercentage = isPercentage(value);
        value = parseFloat(value);
        if (isValuePercentage) {
            value /= 100;
        }

        var attrs = {};
        if (isFinite(value)) {
            var attrValue = (isValuePercentage || value >= 0 && value <= 1)
                ? value * refBBox[dimension]
                : Math.max(value + refBBox[dimension], 0);
            attrs[attrName] = attrValue;
        }

        return attrs;
    };
}

const legacyAttributesNS = {

    // if `refX` is in [0, 1] then `refX` is a fraction of bounding box width
    // if `refX` is < 0 then `refX`'s absolute values is the right coordinate of the bounding box
    // otherwise, `refX` is the left coordinate of the bounding box
    'ref-x': {
        position: positionWrapper('x', 'width', 'origin')
    },

    'ref-y': {
        position: positionWrapper('y', 'height', 'origin')
    },

    // `ref-dx` and `ref-dy` define the offset of the sub-element relative to the right and/or bottom
    // coordinate of the reference element.

    'ref-dx': {
        position: positionWrapper('x', 'width', 'corner')
    },

    'ref-dy': {
        position: positionWrapper('y', 'height', 'corner')
    },

    // 'ref-width'/'ref-height' defines the width/height of the sub-element relatively to
    // the reference element size
    // val in 0..1         ref-width = 0.75 sets the width to 75% of the ref. el. width
    // val < 0 || val > 1  ref-height = -20 sets the height to the ref. el. height shorter by 20

    'ref-width': {
        set: setWrapper('width', 'width')
    },

    'ref-height': {
        set: setWrapper('height', 'height')
    },

    'ref-rx': {
        set: setWrapper('rx', 'width')
    },

    'ref-ry': {
        set: setWrapper('ry', 'height')
    },

    'ref-cx': {
        set: setWrapper('cx', 'width')
    },

    'ref-cy': {
        set: setWrapper('cy', 'height')
    },

    'ref-r-inscribed': {
        set: (function(attrName) {
            var widthFn = setWrapper(attrName, 'width');
            var heightFn = setWrapper(attrName, 'height');
            return function(value, refBBox) {
                var fn = (refBBox.height > refBBox.width) ? widthFn : heightFn;
                return fn(value, refBBox);
            };
        })('r')
    },

    'ref-r-circumscribed': {
        set: function(value, refBBox) {
            var isValuePercentage = isPercentage(value);
            value = parseFloat(value);
            if (isValuePercentage) {
                value /= 100;
            }

            var diagonalLength = Math.sqrt((refBBox.height * refBBox.height) + (refBBox.width * refBBox.width));

            var rValue;
            if (isFinite(value)) {
                if (isValuePercentage || value >= 0 && value <= 1) rValue = value * diagonalLength;
                else rValue = Math.max(value + diagonalLength, 0);
            }

            return { r: rValue };
        }
    },
};

// NOTE: refX & refY are SVG attributes that define the reference point of the marker.
// That's why we need to define both variants: `refX` and `ref-x` (and `refY` and `ref-y`).
legacyAttributesNS['refX'] = legacyAttributesNS['ref-x'];
legacyAttributesNS['refY'] = legacyAttributesNS['ref-y'];

// This allows to combine both absolute and relative positioning
// refX: 50%, refX2: 20
legacyAttributesNS['ref-x2'] = legacyAttributesNS['ref-x'];
legacyAttributesNS['ref-y2'] = legacyAttributesNS['ref-y'];
legacyAttributesNS['ref-width2'] = legacyAttributesNS['ref-width'];
legacyAttributesNS['ref-height2'] = legacyAttributesNS['ref-height'];

// Aliases
legacyAttributesNS['ref-r'] = legacyAttributesNS['ref-r-inscribed'];

export default legacyAttributesNS;
