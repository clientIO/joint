import { assign, isPlainObject, isObject, isPercentage, breakText } from '../../util/util.mjs';
import { isCalcAttribute, evalCalcAttribute } from './calc.mjs';
import $ from '../../mvc/Dom/index.mjs';
import V from '../../V/index.mjs';

function isTextInUse(_value, _node, attrs) {
    return (attrs.text !== undefined);
}

const FONT_ATTRIBUTES = ['font-weight', 'font-family', 'font-size', 'letter-spacing', 'text-transform'];

const textAttributesNS = {

    'line-height': {
        qualify: isTextInUse
    },

    'text-vertical-anchor': {
        qualify: isTextInUse
    },

    'text-path': {
        qualify: isTextInUse
    },

    'annotations': {
        qualify: isTextInUse
    },

    'eol': {
        qualify: isTextInUse
    },

    'display-empty': {
        qualify: isTextInUse
    },

    'text': {
        qualify: function(_text, _node, attrs) {
            const textWrap = attrs['text-wrap'];
            return !textWrap || !isPlainObject(textWrap);
        },
        set: function(text, refBBox, node, attrs) {
            const cacheName = 'joint-text';
            const cache = $.data.get(node, cacheName);
            const lineHeight = attrs['line-height'];
            const textVerticalAnchor = attrs['text-vertical-anchor'];
            const displayEmpty = attrs['display-empty'];
            const fontSize = attrs['font-size'];
            const annotations = attrs.annotations;
            const eol = attrs.eol;
            const x = attrs.x;
            let textPath = attrs['text-path'];
            // Update the text only if there was a change in the string
            // or any of its attributes.
            const textHash = JSON.stringify([text, lineHeight, annotations, textVerticalAnchor, eol, displayEmpty, textPath, x, fontSize]);
            if (cache === undefined || cache !== textHash) {
                // Chrome bug:
                // <tspan> positions defined as `em` are not updated
                // when container `font-size` change.
                if (fontSize) node.setAttribute('font-size', fontSize);
                // Text Along Path Selector
                if (isObject(textPath)) {
                    const pathSelector = textPath.selector;
                    if (typeof pathSelector === 'string') {
                        const pathNode = this.findNode(pathSelector);
                        if (pathNode instanceof SVGPathElement) {
                            textPath = assign({ 'xlink:href': '#' + pathNode.id }, textPath);
                        }
                    }
                }
                V(node).text('' + text, {
                    lineHeight,
                    annotations,
                    textPath,
                    x,
                    textVerticalAnchor,
                    eol,
                    displayEmpty
                });
                $.data.set(node, cacheName, textHash);
            }
        }
    },

    'text-wrap': {
        qualify: isPlainObject,
        set: function(value, refBBox, node, attrs) {
            var size = {};
            // option `width`
            var width = value.width || 0;
            if (isPercentage(width)) {
                size.width = refBBox.width * parseFloat(width) / 100;
            } else if (isCalcAttribute(width)) {
                size.width = Number(evalCalcAttribute(width, refBBox));
            } else {
                if (value.width === null) {
                    // breakText() requires width to be specified.
                    size.width = Infinity;
                } else if (width <= 0) {
                    size.width = refBBox.width + width;
                } else {
                    size.width = width;
                }
            }
            // option `height`
            var height = value.height || 0;
            if (isPercentage(height)) {
                size.height = refBBox.height * parseFloat(height) / 100;
            } else if (isCalcAttribute(height)) {
                size.height = Number(evalCalcAttribute(height, refBBox));
            } else {
                if (value.height === null) {
                    // if height is not specified breakText() does not
                    // restrict the height of the text.
                } else if (height <= 0) {
                    size.height = refBBox.height + height;
                } else {
                    size.height = height;
                }
            }
            // option `text`
            var wrappedText;
            var text = value.text;
            if (text === undefined) text = attrs.text;
            if (text !== undefined) {

                const breakTextFn = value.breakText || breakText;
                const computedStyles = getComputedStyle(node);
                const wrapFontAttributes = {};
                // The font size attributes must be set on the node
                // to get the correct text wrapping.
                // TODO: set the native SVG attributes before special attributes
                for (let i = 0; i < FONT_ATTRIBUTES.length; i++) {
                    const name = FONT_ATTRIBUTES[i];
                    if (name in attrs) {
                        node.setAttribute(name, attrs[name]);
                    }
                    // Note: computedStyles is a live object
                    // i.e. the properties are evaluated when accessed.
                    wrapFontAttributes[name] = computedStyles[name];
                }

                // The `line-height` attribute in SVG is JoinJS specific.
                // TODO: change the `lineHeight` to breakText option.
                wrapFontAttributes.lineHeight = attrs['line-height'];

                wrappedText = breakTextFn('' + text, size, wrapFontAttributes, {
                    // Provide an existing SVG Document here
                    // instead of creating a temporary one over again.
                    svgDocument: this.paper.svg,
                    ellipsis: value.ellipsis,
                    hyphen: value.hyphen,
                    separator: value.separator,
                    maxLineCount: value.maxLineCount,
                    preserveSpaces: value.preserveSpaces
                });
            } else {
                wrappedText = '';
            }
            textAttributesNS.text.set.call(this, wrappedText, refBBox, node, attrs);
        },
        // We expose the font attributes list to allow
        // the user to take other custom font attributes into account
        // when wrapping the text.
        FONT_ATTRIBUTES
    },

    'title': {
        qualify: function(title, node) {
            // HTMLElement title is specified via an attribute (i.e. not an element)
            return node instanceof SVGElement;
        },
        set: function(title, refBBox, node) {
            var cacheName = 'joint-title';
            var cache = $.data.get(node, cacheName);
            if (cache === undefined || cache !== title) {
                $.data.set(node, cacheName, title);
                if (node.tagName === 'title') {
                    // The target node is a <title> element.
                    node.textContent = title;
                    return;
                }
                // Generally <title> element should be the first child element of its parent.
                var firstChild = node.firstElementChild;
                if (firstChild && firstChild.tagName === 'title') {
                    // Update an existing title
                    firstChild.textContent = title;
                } else {
                    // Create a new title
                    var titleNode = document.createElementNS(node.namespaceURI, 'title');
                    titleNode.textContent = title;
                    node.insertBefore(titleNode, firstChild);
                }
            }
        }
    },
};

export default textAttributesNS;
