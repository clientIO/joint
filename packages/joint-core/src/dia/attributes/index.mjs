import { assign, isPlainObject } from '../../util/util.mjs';
import $ from '../../mvc/Dom/index.mjs';
import V from '../../V/index.mjs';

import props from './props.mjs';
import legacyAttributesNS from './legacy.mjs';
import textAttributesNS from './text.mjs';
import connectionAttributesNS from './connection.mjs';
import shapeAttributesNS from './shape.mjs';
import defsAttributesNS from './defs.mjs';
import offsetAttributesNS from './offset.mjs';

function setIfChangedWrapper(attribute) {
    return function setIfChanged(value, _, node) {
        const vel = V(node);
        if (vel.attr(attribute) === value) return;
        vel.attr(attribute, value);
    };
}

const attributesNS = {

    'ref': {
        // We do not set `ref` attribute directly on an element.
        // The attribute itself does not qualify for relative positioning.
    },

    'href': {
        set: setIfChangedWrapper('href')
    },

    'xlink:href': {
        set: setIfChangedWrapper('xlink:href')
    },

    // `port` attribute contains the `id` of the port that the underlying magnet represents.
    'port': {
        set: function(port) {
            return (port === null || port.id === undefined) ? port : port.id;
        }
    },

    // `style` attribute is special in the sense that it sets the CSS style of the sub-element.
    'style': {
        qualify: isPlainObject,
        set: function(styles, refBBox, node) {
            $(node).css(styles);
        }
    },

    'html': {
        set: function(html, refBBox, node) {
            $(node).html(html + '');
        }
    },

    // Properties setter (set various properties on the node)
    props,
};

assign(attributesNS, legacyAttributesNS);
assign(attributesNS, textAttributesNS);
assign(attributesNS, connectionAttributesNS);
assign(attributesNS, shapeAttributesNS);
assign(attributesNS, defsAttributesNS);
assign(attributesNS, offsetAttributesNS);

export const attributes = attributesNS;

