import { Path, Polyline } from '../../g/index.mjs';
import $ from '../../mvc/Dom/index.mjs';
import V from '../../V/index.mjs';

function shapeWrapper(shapeConstructor, opt) {
    var cacheName = 'joint-shape';
    var resetOffset = opt && opt.resetOffset;
    return function(value, refBBox, node) {
        var cache = $.data.get(node, cacheName);
        if (!cache || cache.value !== value) {
            // only recalculate if value has changed
            var cachedShape = shapeConstructor(value);
            cache = {
                value: value,
                shape: cachedShape,
                shapeBBox: cachedShape.bbox()
            };
            $.data.set(node, cacheName, cache);
        }

        var shape = cache.shape.clone();
        var shapeBBox = cache.shapeBBox.clone();
        var shapeOrigin = shapeBBox.origin();
        var refOrigin = refBBox.origin();

        shapeBBox.x = refOrigin.x;
        shapeBBox.y = refOrigin.y;

        var fitScale = refBBox.maxRectScaleToFit(shapeBBox, refOrigin);
        // `maxRectScaleToFit` can give Infinity if width or height is 0
        var sx = (shapeBBox.width === 0 || refBBox.width === 0) ? 1 : fitScale.sx;
        var sy = (shapeBBox.height === 0 || refBBox.height === 0) ? 1 : fitScale.sy;

        shape.scale(sx, sy, shapeOrigin);
        if (resetOffset) {
            shape.translate(-shapeOrigin.x, -shapeOrigin.y);
        }

        return shape;
    };
}

// `d` attribute for SVGPaths
function dWrapper(opt) {
    function pathConstructor(value) {
        return new Path(V.normalizePathData(value));
    }

    var shape = shapeWrapper(pathConstructor, opt);
    return function(value, refBBox, node) {
        var path = shape(value, refBBox, node);
        return {
            d: path.serialize()
        };
    };
}

// `points` attribute for SVGPolylines and SVGPolygons
function pointsWrapper(opt) {
    var shape = shapeWrapper(Polyline, opt);
    return function(value, refBBox, node) {
        var polyline = shape(value, refBBox, node);
        return {
            points: polyline.serialize()
        };
    };
}

const shapeAttributesNS = {

    'ref-d-reset-offset': {
        set: dWrapper({ resetOffset: true })
    },

    'ref-d-keep-offset': {
        set: dWrapper({ resetOffset: false })
    },

    'ref-points-reset-offset': {
        set: pointsWrapper({ resetOffset: true })
    },

    'ref-points-keep-offset': {
        set: pointsWrapper({ resetOffset: false })
    },
};

// Aliases
shapeAttributesNS['ref-d'] = shapeAttributesNS['ref-d-reset-offset'];
shapeAttributesNS['ref-points'] = shapeAttributesNS['ref-points-reset-offset'];

export default shapeAttributesNS;
