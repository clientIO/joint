import { assign, isPlainObject } from '../../util/util.mjs';

function contextMarker(context) {
    var marker = {};
    // Stroke
    // The context 'fill' is disregarded here. The usual case is to use the marker with a connection
    // (for which 'fill' attribute is set to 'none').
    var stroke = context.stroke;
    if (typeof stroke === 'string') {
        marker['stroke'] = stroke;
        marker['fill'] = stroke;
    }
    // Opacity
    // Again the context 'fill-opacity' is ignored.
    var strokeOpacity = context['stroke-opacity'];
    if (strokeOpacity === undefined) strokeOpacity = context.opacity;
    if (strokeOpacity !== undefined) {
        marker['stroke-opacity'] = strokeOpacity;
        marker['fill-opacity'] = strokeOpacity;
    }
    return marker;
}

function setPaintURL(def) {
    const { paper } = this;
    const url = (def.type === 'pattern')
        ? paper.definePattern(def)
        : paper.defineGradient(def);
    return `url(#${url})`;
}

const defsAttributesNS = {

    'source-marker': {
        qualify: isPlainObject,
        set: function(marker, refBBox, node, attrs) {
            marker = assign(contextMarker(attrs), marker);
            return { 'marker-start': 'url(#' + this.paper.defineMarker(marker) + ')' };
        }
    },

    'target-marker': {
        qualify: isPlainObject,
        set: function(marker, refBBox, node, attrs) {
            marker = assign(contextMarker(attrs), { 'transform': 'rotate(180)' }, marker);
            return { 'marker-end': 'url(#' + this.paper.defineMarker(marker) + ')' };
        }
    },

    'vertex-marker': {
        qualify: isPlainObject,
        set: function(marker, refBBox, node, attrs) {
            marker = assign(contextMarker(attrs), marker);
            return { 'marker-mid': 'url(#' + this.paper.defineMarker(marker) + ')' };
        }
    },

    'fill': {
        qualify: isPlainObject,
        set: setPaintURL
    },

    'stroke': {
        qualify: isPlainObject,
        set: setPaintURL
    },

    'filter': {
        qualify: isPlainObject,
        set: function(filter) {
            return 'url(#' + this.paper.defineFilter(filter) + ')';
        }
    },
};

export default defsAttributesNS;
