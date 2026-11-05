// Sanitizes graph JSON coming from an untrusted source (e.g. a file import or
// a collaborative editing session) before it is loaded into a graph.
// - The unsafe parts are removed (no error is thrown, see `opt.onRemove`).
//   Only an input which can not be loaded anyway can throw (e.g. markup nested
//   so deeply that the call stack is exceeded).
// - Strict mode (the default): string markup and the `html` attribute are
//   removed. Nothing is parsed, so the sanitized JSON can not be interpreted
//   differently (no mXSS) and it does not require a DOM (e.g. in Node.js).
// - Lenient mode (`strict: false`): string markup is parsed and sanitized
//   (see `sanitizeStringMarkup.mjs`) and the `html` attribute of known HTML
//   elements whose content is parsed as `<div>` content is sanitized
//   (see `sanitizeHTML.mjs`; otherwise removed). It requires a DOM, otherwise
//   string markup and the `html` attribute are removed as in strict mode.
// - The cells, the markup, the attributes, the ports and the port groups are
//   removed if they are not of the expected type (they are not skipped). The
//   views accept more than the expected types (e.g. array-like objects as markup).
// - The markup defined by the shapes themselves (by the application) is
//   trusted. It is used only to find out which elements `attrs` apply to.
// - The `attrs` get the rules of the elements they apply to only through the
//   `selector`s of the JSON markup which renders them. Everything else (group
//   selectors, root selectors, CSS selectors, templates such as port group `attrs`
//   or the default label `attrs`, and the content of definitions) gets the rules
//   of all elements (see `Targets`). They differ only in a few attributes (e.g.
//   `data:image/svg+xml` URLs are kept only on image elements).
// - Only the JSON is sanitized. The views render it as it is.
// - The work is linear in the size of the JSON (it must not be possible to
//   block the sanitizing with a small input).

import { V, dia, util } from '@joint/core';
import { getLocalTagName, isAllowedElement, isHTMLContentElement, isSafeAttribute, SVG_NAMESPACE } from './security.mjs';
import { sanitizeHTMLResult } from './sanitizeHTML.mjs';
import { canSanitizeStringMarkup, sanitizeStringMarkup } from './sanitizeStringMarkup.mjs';

const { getByPath, filter: filterNamespace, isEqual, isPlainObject: isPlainObjectValue, result } = util;

// The selectors of the root element of a view. The views resolve them before
// the selectors of the markup (a markup node can not be selected by them).
const ROOT_SELECTORS = new Set(['root', '.', '']);

// The tag names of an element which is not known (the rules of all elements apply).
const ANY_ELEMENT = [null];

// Attributes which are rendered as text (they can not inject markup).
const TEXT_ATTRIBUTES = new Set(['text', 'title', 'text-wrap']);

// Attributes which are passed to the element as DOM properties.
// - Only the allowed properties are set (see `attributes/props.mjs`).
// - `style` is checked as any other attribute. CSS is out of scope (it can not
//   execute scripts in supported browsers), but the object can be used for more
//   than CSS (e.g. the text options of `standard.TextBlock`).
const KEPT_ATTRIBUTES = new Set(['props']);

const MARKER_ATTRIBUTES = new Set(['source-marker', 'target-marker', 'vertex-marker']);

// The properties of a marker definition which are not attributes of its content.
const MARKER_PROPERTIES = new Set(['type', 'id', 'markup', 'attrs', 'markerUnits']);

const GRADIENT_TYPES = new Set(['linearGradient', 'radialGradient']);

const hasOwn = function(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
};

// `isPlainObject()` with a fast path for the objects created by `JSON.parse()`.
const isPlainObject = function(value) {
    if (value === null || typeof value !== 'object') return false;

    if (Object.getPrototypeOf(value) === Object.prototype && !(Symbol.toStringTag in value)) return true;

    return isPlainObjectValue(value);
};

// The prefixed attribute names (the same as in `V.attributeNames`).
const PREFIXED_ATTRIBUTE_NAMES = {
    xlinkShow: 'xlink:show',
    xlinkRole: 'xlink:role',
    xlinkActuate: 'xlink:actuate',
    xlinkHref: 'xlink:href',
    xlinkType: 'xlink:type',
    xlinkTitle: 'xlink:title',
    xmlBase: 'xml:base',
    xmlLang: 'xml:lang',
    xmlSpace: 'xml:space',
};

// The name of a special attribute (e.g. `sourceMarker` -> `source-marker`).
const getSpecialAttributeName = function(name) {
    return name.replace(/[A-Z]/g, '-$&').toLowerCase();
};

// The names an attribute can be set with:
// - `V` maps camel-case names (e.g. `xlinkHref` -> `xlink:href`, `strokeWidth` -> `stroke-width`),
// - `$` does not map them (e.g. on HTML elements).
// - `V` is not available without SVG support (e.g. in Node.js).
const getAttributeNames = function(name) {
    const names = [name];
    const specialName = getSpecialAttributeName(name);
    if (specialName !== name) names.push(specialName);
    if (hasOwn(PREFIXED_ATTRIBUTE_NAMES, name)) names.push(PREFIXED_ATTRIBUTE_NAMES[name]);
    // (reading an unknown name would add it to the global cache of `V.attributeNames`,
    // the name it would return is `name` or `specialName`)
    if (V.attributeNames && (name in V.attributeNames)) {
        const mappedName = V.attributeNames[name];
        if (!names.includes(mappedName)) names.push(mappedName);
    }
    return names;
};

// Paths
// -----

// The path of a removed part is only informational (`opt.onRemove`). It must not
// affect the performance:
// - Nothing is created when there is no `onRemove` (`ctx.path()` returns `EMPTY_PATH`).
// - The path is not extended inside markup (its elements and attributes are
//   reported at the path of the markup property, see `sanitizeMarkupNodes()`) nor
//   inside the values of attributes. So its length is bounded (no deeply nested
//   path is ever built) and the work of a removal does not grow with the depth.
// - A path is converted to an array only when it is reported (`toPathArray()`).
const EMPTY_PATH = [];

const toPathArray = function(path) {
    const chunks = [];
    while (path && !Array.isArray(path)) {
        chunks.push(path.keys);
        path = path.parent;
    }
    return (path || []).concat(...chunks.reverse());
};

const createContext = function(opt) {
    const { onRemove } = opt;
    const tracking = (typeof onRemove === 'function');

    return {
        // `ctx.path(parent, ...keys)`: the path of a child part (nothing without `onRemove`).
        path: tracking ? (parent, ...keys) => ({ parent, keys }) : () => EMPTY_PATH,
        // `strict: true` is the default
        strict: (opt.strict !== false),
        // the sanitized string markup (the same markup is often used by many cells)
        markupCache: new Map(),
        // the sanitized `html` attributes
        htmlCache: new Map(),
        // the targets of a JSON markup (see `collectTargets()`)
        targetsCache: new WeakMap(),
        // the targets of a port (see `getPortTargets()`)
        portTargetsCache: new Map(),
        remove(path, reason) {
            if (tracking) onRemove(toPathArray(path), reason);
        }
    };
};

// A copy of the JSON data (arrays and plain objects are copied).
// - `__proto__` keys (created by `JSON.parse()` as own properties) are removed.
//   They could replace the prototype of an object the data is assigned to.
// - The path is extended by the keys of the top-level object only (the properties
//   of a cell); a `__proto__` nested deeper in a value is reported at the path of
//   the nearest of those properties (the path is not extended inside the values).
const cloneJSON = function(value, path, ctx) {
    if (Array.isArray(value)) {
        return value.map((item) => cloneJSON(item, path, ctx));
    }

    if (!isPlainObject(value)) return value;

    return copyObject(value, path, ctx, (item, itemPath) => cloneValue(item, itemPath, ctx));
};

// Copies a value (not extending the path, see `cloneJSON()`).
const cloneValue = function(value, path, ctx) {
    if (Array.isArray(value)) {
        return value.map((item) => cloneValue(item, path, ctx));
    }

    if (!isPlainObject(value)) return value;

    return copyObject(value, path, ctx, (item) => cloneValue(item, path, ctx));
};

// A copy of the own properties of the object (without `__proto__` keys).
// - `copyValue(value, path)` returns the copy of a property value.
const copyObject = function(obj, path, ctx, copyValue) {
    const copy = {};
    Object.keys(obj).forEach((key) => {
        if (key === '__proto__') {
            ctx.remove(ctx.path(path, key), 'the `__proto__` key is not allowed');
            return;
        }
        copy[key] = copyValue(obj[key], ctx.path(path, key));
    });
    return copy;
};

// Removes `obj[key]` if it is defined, but it is not of the expected type.
// Returns `true` if the value is of the expected type (`isValid(value)`).
const removeInvalidProperty = function(obj, key, isValid, path, ctx, reason) {
    if (!hasOwn(obj, key) || obj[key] == null) return false;
    if (isValid(obj[key])) return true;

    delete obj[key];
    ctx.remove(ctx.path(path, key), reason);
    return false;
};

// Targets
// -------

// The elements the `attrs` of a cell, a port or a label apply to.
// - Only the `selector`s of the JSON markup which renders the `attrs` are resolved
//   (the same way as `parseDOMJSON()` registers them). Any other selector is not
//   known and gets the rules of all elements: the root selectors, the group selectors
//   (`groupSelector`), the CSS selectors (see `useCSSSelectors`) and the selectors
//   added by the views (e.g. `portRoot`, `labelRoot` and `labelText`).
//   - The views merge the `attrs` of all the selectors of an element (and of the
//     templates, e.g. a port group or the default label). Only the rules of all
//     elements are safe for a value which can end up on any of them.
// - A target map maps a selector to the target of the elements it selects
//   (see `createTarget()`). The `attrs` of a port apply to its markup and to the
//   markup of its label, so the targets are an array of target maps.
// - `null` targets are not known (all the rules apply).

// The target of an unknown selector.
const UNKNOWN_TARGET = { tagNames: ANY_ELEMENT, isHTMLContent: false };

// The data of the elements a selector selects (`{ tagName, namespaceURI }`):
// - `tagNames`: the distinct tag names of the elements (the rules of an element
//   depend only on its local name, see `security.mjs`),
// - `isHTMLContent`: whether all the elements are HTML elements whose content
//   is parsed the same way as the content of `<div>` (see the `html` attribute).
const createTarget = function(elements) {
    const tagNames = new Map();
    elements.forEach(({ tagName }) => {
        const localTagName = getLocalTagName(tagName);
        if (!tagNames.has(localTagName)) tagNames.set(localTagName, tagName);
    });
    return {
        tagNames: Array.from(tagNames.values()),
        isHTMLContent: elements.every(({ tagName, namespaceURI }) => isHTMLContentElement(tagName, namespaceURI))
    };
};

// The target map of a JSON markup (of a trusted or an already sanitized markup).
// Returns `null` if the markup is not a JSON markup (e.g. a string markup,
// whose elements can be selected only by CSS selectors).
// - The markup must not change after it is collected (the result is cached).
const collectTargets = function(markup, ctx) {
    if (!Array.isArray(markup)) return null;

    let targetMap = ctx.targetsCache.get(markup);
    if (targetMap) return targetMap;

    const elementsMap = new Map();
    const walk = (nodes, parentNamespaceURI) => {
        nodes.forEach((nodeDef) => {
            if (!isPlainObject(nodeDef) || typeof nodeDef.tagName !== 'string') return;
            const namespaceURI = hasOwn(nodeDef, 'namespaceURI') ? nodeDef.namespaceURI : parentNamespaceURI;
            // (the same check as `parseDOMJSON()`: any value is a property key,
            // e.g. `selector: 5` is the `'5'` selector and `selector: null` the `'null'` selector)
            if (hasOwn(nodeDef, 'selector')) {
                const selector = String(nodeDef.selector);
                if (!ROOT_SELECTORS.has(selector)) {
                    const element = { tagName: nodeDef.tagName, namespaceURI };
                    const elements = elementsMap.get(selector);
                    if (elements) {
                        // (a selector must be unique, the views throw otherwise)
                        elements.push(element);
                    } else {
                        elementsMap.set(selector, [element]);
                    }
                }
            }
            if (Array.isArray(nodeDef.children)) walk(nodeDef.children, namespaceURI);
        });
    };
    walk(markup, SVG_NAMESPACE);

    targetMap = new Map();
    elementsMap.forEach((elements, selector) => targetMap.set(selector, createTarget(elements)));
    ctx.targetsCache.set(markup, targetMap);
    return targetMap;
};

// The targets of a single JSON markup.
const getMarkupTargets = function(markup, ctx) {
    const targetMap = collectTargets(markup, ctx);
    return targetMap ? [targetMap] : null;
};

// The target of a selector (`UNKNOWN_TARGET` if it is not known).
const getSelectorTarget = function(targets, selector) {
    if (!targets) return UNKNOWN_TARGET;

    const found = [];
    targets.forEach((targetMap) => {
        const target = targetMap.get(selector);
        if (target) found.push(target);
    });

    if (found.length === 0) return UNKNOWN_TARGET;
    if (found.length === 1) return found[0];

    // (a selector of both a port and its label; the views throw)
    return {
        tagNames: Array.from(new Set([].concat(...found.map((target) => target.tagNames)))),
        isHTMLContent: found.every((target) => target.isHTMLContent)
    };
};

// Attributes
// ----------

// Whether the value is safe for all the target elements and all the names
// it can be set with.
// - The values of unknown attributes (e.g. custom attributes of a shape) can be
//   objects or arrays. All their values are checked.
// - A value in an object is checked with the names of its key. Special attributes
//   can set the keys of an object as attributes (e.g. `port` returns `port.id`,
//   which can be an object). An object itself is set as `[object Object]`.
// - Every value is checked once (the work is linear in the size of the value).
const isSafeValue = function(tagNames, attrNames, value) {
    if (isPlainObject(value)) {
        return Object.keys(value).every((key) => isSafeValue(tagNames, getAttributeNames(key), value[key]));
    }

    // (an array of primitives is set as the list of its items, e.g. `a,b`)
    if (Array.isArray(value) && value.some((item) => (item !== null) && (typeof item === 'object'))) {
        return value.every((item) => isSafeValue(tagNames, attrNames, item));
    }

    return attrNames.every((attrName) => tagNames.every((tagName) => isSafeAttribute(tagName, attrName, value)));
};

// Whether the value is safe for all the names the attribute can be set with.
const isSafeAttributeValue = function(tagNames, name, value) {
    return isSafeValue(tagNames, getAttributeNames(name), value);
};

// Plain attributes of an element (e.g. `attributes` of a JSON markup node).
const sanitizePlainAttributes = function(attributes, tagNames, path, ctx) {
    Object.keys(attributes).forEach((name) => {
        const value = attributes[name];
        if (isSafeAttributeValue(tagNames, name, value)) return;

        delete attributes[name];
        ctx.remove(ctx.path(path, name), 'unsafe attribute');
    });
};

// Plain attributes stored in `obj[key]` (e.g. `attrs` of a marker).
// - Any other value than an object is removed (e.g. an array, whose items
//   would be set as attributes named by their indexes).
const sanitizePlainAttributesProperty = function(obj, key, tagNames, path, ctx) {
    if (!removeInvalidProperty(obj, key, isPlainObject, path, ctx, 'invalid attributes')) return;

    sanitizePlainAttributes(obj[key], tagNames, ctx.path(path, key), ctx);
};

// Sanitizes the `html` attribute (in place). Returns `false` if it should be removed.
// - `target` is the target of the elements the attribute applies to.
const sanitizeHTMLAttribute = function(nodeAttrs, name, target, path, ctx) {
    if (ctx.strict) {
        ctx.remove(path, 'the `html` attribute is not allowed');
        return false;
    }

    // (the `html` attribute is parsed in the context of the elements)
    if (!target.isHTMLContent) {
        ctx.remove(path, 'the `html` attribute is allowed only on known HTML elements');
        return false;
    }

    if (!canSanitizeStringMarkup()) {
        ctx.remove(path, 'the `html` attribute requires a DOM');
        return false;
    }

    const value = nodeAttrs[name];
    if (value == null) return true;

    const html = String(value);
    let sanitized = ctx.htmlCache.get(html);
    if (!sanitized) {
        // (`removed` is only reported when something unsafe was removed, not when
        // the HTML was only normalized, e.g. `&` -> `&amp;`)
        sanitized = sanitizeHTMLResult(html);
        ctx.htmlCache.set(html, sanitized);
    }

    nodeAttrs[name] = sanitized.html;
    if (sanitized.removed) ctx.remove(path, 'unsafe HTML');

    return true;
};

// The attributes of a single node of the `attrs` object.
// - `target` is the target of the elements the node attributes apply to.
// - `defaultValue` is the default value of the attribute (see `sanitizeCell()`).
// Returns `false` if the attribute should be removed.
const sanitizeNodeAttribute = function(nodeAttrs, name, target, defaultValue, path, ctx) {
    const attrName = getSpecialAttributeName(name);

    if (attrName === 'html') return sanitizeHTMLAttribute(nodeAttrs, name, target, path, ctx);

    if (TEXT_ATTRIBUTES.has(attrName) || KEPT_ATTRIBUTES.has(attrName)) return true;

    const value = nodeAttrs[name];
    if (isPlainObject(value)) {
        const defaultObject = isPlainObject(defaultValue) ? defaultValue : null;

        if (MARKER_ATTRIBUTES.has(attrName)) return sanitizeMarker(value, defaultObject, path, ctx);

        if (attrName === 'fill' || attrName === 'stroke') return sanitizePaint(value, defaultObject, path, ctx);

        if (attrName === 'filter') return sanitizeFilter(value, defaultObject, path, ctx);

        if (attrName === 'text-path') {
            sanitizePlainAttributes(value, ['textPath'], path, ctx);
            return true;
        }
    }

    if (attrName === 'annotations') {
        // A single annotation does not have to be wrapped in an array (see `V.text()`).
        if (isPlainObject(value)) {
            sanitizePlainAttributesProperty(value, 'attrs', ['tspan'], path, ctx);
            return true;
        }
        if (Array.isArray(value)) {
            value.forEach((annotation, index) => {
                if (!isPlainObject(annotation)) return;

                sanitizePlainAttributesProperty(annotation, 'attrs', ['tspan'], ctx.path(path, index), ctx);
            });
            return true;
        }
    }

    if (isSafeAttributeValue(target.tagNames, name, value)) return true;

    ctx.remove(path, 'unsafe attribute');
    return false;
};

// The `attrs` object of a cell, a port or a label stored in `obj[key]`.
// - Any other value than an object is removed (e.g. an array, whose items
//   would be applied to the elements selected by their indexes).
// - `targets` are the targets of the markup which renders the `attrs` (`null`
//   if it is not known, e.g. for a template merged into other `attrs`).
// - `defaultAttrs` are the default `attrs` the object is merged with (if any).
const sanitizeAttrs = function(obj, key, targets, path, ctx, defaultAttrs = null) {
    if (!removeInvalidProperty(obj, key, isPlainObject, path, ctx, 'invalid attributes')) return;

    const attrs = obj[key];
    const attrsPath = ctx.path(path, key);
    Object.keys(attrs).forEach((selector) => {
        const nodeAttrs = attrs[selector];

        // Not a valid selector-attributes pair (ignored by the views).
        if (!isPlainObject(nodeAttrs)) return;

        const target = getSelectorTarget(targets, selector);
        const defaultNodeAttrs = (defaultAttrs && hasOwn(defaultAttrs, selector) && isPlainObject(defaultAttrs[selector])) ? defaultAttrs[selector] : null;
        const nodePath = ctx.path(attrsPath, selector);
        Object.keys(nodeAttrs).forEach((name) => {
            const defaultValue = (defaultNodeAttrs && hasOwn(defaultNodeAttrs, name)) ? defaultNodeAttrs[name] : undefined;
            if (!sanitizeNodeAttribute(nodeAttrs, name, target, defaultValue, ctx.path(nodePath, name), ctx)) {
                delete nodeAttrs[name];
            }
        });
    });
};

// Markup
// ------

// Sanitizes JSON markup nodes (in place).
// - The kept nodes are compacted in one pass (removing them one by one would be
//   quadratic for a markup with many removed nodes).
// - The removed parts are reported at `path` (the path of the markup property);
//   the path is not extended with the index of the node (its depth is unbounded).
// - `isDefinition`: the markup of a definition (a marker or a pattern), see `sanitizeMarker()`.
const sanitizeMarkupNodes = function(nodes, parentNamespaceURI, parentTagName, path, ctx, isDefinition) {
    let kept = 0;
    for (let index = 0; index < nodes.length; index++) {
        const nodeDef = nodes[index];

        // Text node
        if (typeof nodeDef === 'string') {
            nodes[kept++] = nodeDef;
            continue;
        }

        if (!isPlainObject(nodeDef) || typeof nodeDef.tagName !== 'string') {
            ctx.remove(path, 'invalid markup node');
            continue;
        }

        const { tagName } = nodeDef;
        const namespaceURI = hasOwn(nodeDef, 'namespaceURI') ? nodeDef.namespaceURI : parentNamespaceURI;
        if (!isAllowedElement(tagName, namespaceURI, parentNamespaceURI, parentTagName)) {
            ctx.remove(path, `element \`${tagName}\` is not allowed`);
            continue;
        }

        // (the nodes of a definition markup can be merged with the nodes of another
        // definition, e.g. a safe `<image>` href onto a `<use>`)
        sanitizePlainAttributesProperty(nodeDef, 'attributes', isDefinition ? ANY_ELEMENT : [tagName], path, ctx);

        if (Array.isArray(nodeDef.children)) {
            sanitizeMarkupNodes(nodeDef.children, namespaceURI, tagName, path, ctx, isDefinition);
        }

        nodes[kept++] = nodeDef;
    }
    nodes.length = kept;
};

// Sanitizes string markup (lenient mode). Returns `null` if it should be removed.
const getSanitizedStringMarkup = function(markup, path, ctx) {
    if (!canSanitizeStringMarkup()) {
        ctx.remove(path, 'string markup requires a DOM');
        return null;
    }

    let sanitized = ctx.markupCache.get(markup);
    if (!sanitized) {
        sanitized = sanitizeStringMarkup(markup);
        ctx.markupCache.set(markup, sanitized);
    }

    sanitized.reasons.forEach((reason) => ctx.remove(path, reason));

    return sanitized.markup;
};

// Sanitizes the markup stored in `obj[key]` (in place).
// - JSON markup is sanitized.
// - String markup is removed (strict mode) or sanitized (lenient mode).
// - Any other value is removed (e.g. an array-like object, which would be
//   rendered as JSON markup).
// - `isDefinition`: the markup of a definition (see `sanitizeMarkupNodes()`).
const sanitizeMarkupProperty = function(obj, key, path, ctx, isDefinition = false) {
    if (!hasOwn(obj, key) || obj[key] == null) return;

    const markup = obj[key];
    const markupPath = ctx.path(path, key);

    if (typeof markup === 'string') {
        if (ctx.strict) {
            delete obj[key];
            ctx.remove(markupPath, 'string markup is not allowed');
            return;
        }

        const sanitized = getSanitizedStringMarkup(markup, markupPath, ctx);
        if (sanitized === null) {
            delete obj[key];
        } else {
            obj[key] = sanitized;
        }
        return;
    }

    if (!Array.isArray(markup)) {
        delete obj[key];
        ctx.remove(markupPath, 'invalid markup');
        return;
    }

    const { length } = markup;
    sanitizeMarkupNodes(markup, SVG_NAMESPACE, 'g', markupPath, ctx, isDefinition);

    // A markup without elements can not be rendered (e.g. by a port or a label).
    // The default markup is used instead (only if something was removed).
    if (markup.length < length && !markup.some((nodeDef) => isPlainObject(nodeDef))) {
        delete obj[key];
        ctx.remove(markupPath, 'no allowed elements');
    }
};

// Definitions (markers, gradients, patterns and filters)
// ------------------------------------------------------

// The value of a definition property (the default value is used if it is not defined).
// - The definitions of a cell are merged with the default definitions of its
//   shape (e.g. `cell.toJSON()` does not contain the `type` of a default gradient).
const getDefinitionProperty = function(definition, defaultDefinition, name) {
    if (hasOwn(definition, name)) return definition[name];
    return (defaultDefinition && hasOwn(defaultDefinition, name)) ? defaultDefinition[name] : undefined;
};

// The content of a definition gets the rules of all elements: the renderer merges
// a definition with the definitions of the other sources of the same element
// (e.g. another selector, a port group or the default label), including its
// `type` and its markup (node by node).

// Returns `false` if the marker should be removed.
const sanitizeMarker = function(marker, defaultMarker, path, ctx) {
    const type = getDefinitionProperty(marker, defaultMarker, 'type');

    if (type !== undefined && !isAllowedElement(type, SVG_NAMESPACE, SVG_NAMESPACE, 'marker')) {
        ctx.remove(path, `marker \`${type}\` is not allowed`);
        return false;
    }

    sanitizeMarkupProperty(marker, 'markup', path, ctx, true);
    sanitizePlainAttributesProperty(marker, 'attrs', ['marker'], path, ctx);

    // The other properties are the attributes of the marker content.
    Object.keys(marker).forEach((name) => {
        if (MARKER_PROPERTIES.has(name)) return;

        const value = marker[name];
        if (isSafeAttributeValue(ANY_ELEMENT, name, value)) return;

        delete marker[name];
        ctx.remove(ctx.path(path, name), 'unsafe attribute');
    });

    return true;
};

// A gradient or a pattern (the `fill` and `stroke` attributes).
// Returns `false` if the definition should be removed.
const sanitizePaint = function(paint, defaultPaint, path, ctx) {
    const type = getDefinitionProperty(paint, defaultPaint, 'type');

    if (type === 'pattern') {
        sanitizeMarkupProperty(paint, 'markup', path, ctx, true);

        // A pattern requires markup.
        if (!getDefinitionProperty(paint, defaultPaint, 'markup')) {
            ctx.remove(path, 'pattern without markup');
            return false;
        }

        sanitizePlainAttributesProperty(paint, 'attrs', ANY_ELEMENT, path, ctx);
        return true;
    }

    if (!GRADIENT_TYPES.has(type)) {
        ctx.remove(path, `paint \`${type}\` is not allowed`);
        return false;
    }

    sanitizePlainAttributesProperty(paint, 'attrs', ANY_ELEMENT, path, ctx);

    if (Array.isArray(paint.stops)) {
        paint.stops.forEach((stop, index) => {
            if (!isPlainObject(stop)) return;

            ['offset', 'color', 'opacity'].forEach((name) => {
                if (!hasOwn(stop, name) || isSafeAttribute('stop', `stop-${name}`, stop[name])) return;

                delete stop[name];
                ctx.remove(ctx.path(path, 'stops', index, name), 'unsafe attribute');
            });
        });
    }
    return true;
};

const MARKUP_CHARS = /[&<>"']/;

const isSafeFilterArgs = function(args) {
    if (!isPlainObject(args)) return false;
    return Object.keys(args).every((key) => {
        const value = args[key];
        if (typeof value === 'string') return !MARKUP_CHARS.test(value);
        return value == null || typeof value === 'number' || typeof value === 'boolean';
    });
};

// Returns `false` if the filter should be removed.
const sanitizeFilter = function(filter, defaultFilter, path, ctx) {
    const name = getDefinitionProperty(filter, defaultFilter, 'name');

    if (typeof name !== 'string' || !hasOwn(filterNamespace, name)) {
        ctx.remove(path, `filter \`${name}\` does not exist`);
        return false;
    }

    // The built-in filters of `@joint/core` < 4.3.4 interpolate the `args` into markup unescaped.
    const args = getDefinitionProperty(filter, defaultFilter, 'args');
    if (args !== undefined && !isSafeFilterArgs(args)) {
        ctx.remove(path, `filter \`${name}\` has unsafe arguments`);
        return false;
    }

    sanitizePlainAttributesProperty(filter, 'attrs', ['filter'], path, ctx);
    return true;
};

// Cells
// -----

const getCellConstructor = function(type, cellNamespace) {
    if (typeof type !== 'string' || !cellNamespace) return null;

    const Ctor = getByPath(cellNamespace, type, '.');
    if (!isCellConstructor(Ctor)) return null;

    return Ctor;
};

const isCellConstructor = function(Ctor) {
    return Ctor === dia.Cell || (typeof Ctor === 'function' && Ctor.prototype instanceof dia.Cell);
};

// `@joint/core` < 4.3.4 instantiates any function the `type` resolves to (e.g. `constructor`).
const hasInvalidType = function(json, cellNamespace) {
    if (!cellNamespace || typeof json.type !== 'string') return false;
    const Ctor = getByPath(cellNamespace, json.type, '.');
    return Boolean(Ctor) && !isCellConstructor(Ctor);
};

const getDefaults = function(Ctor) {
    if (!Ctor) return {};

    try {
        return result(Ctor.prototype, 'defaults') || {};
    } catch {
        return {};
    }
};

// The (possibly partial) cell attributes and where to look up the properties
// which are not part of them (the existing cell, the defaults and the prototype).
// - The defaults are merged only when a cell is created. The attributes of an
//   existing cell already contain them, and `cell.set()` replaces them (e.g. the
//   port groups of the shape are not merged into new `ports`).
const createCellSource = function(attributes, Ctor, cell) {
    const defaults = cell ? {} : getDefaults(Ctor);
    const prototype = Ctor ? Ctor.prototype : {};

    return {
        // `true` for links, `false` for elements, `null` if unknown
        isLink: Ctor ? Boolean(prototype.isLink()) : null,
        get(name) {
            if (hasOwn(attributes, name)) {
                // An explicit `null`/`undefined` resets the attribute to the shape's
                // own value (the prototype), the same as the view does after
                // `cell.set()`; the existing cell's value is not used (e.g. a markup
                // reset falls back to the prototype markup, not the current markup).
                return (attributes[name] != null) ? attributes[name] : prototype[name];
            }

            if (cell) {
                const value = cell.get(name);
                if (value != null) return value;
            }

            if (defaults[name] != null) return defaults[name];

            return prototype[name];
        },
        getDefault(name) {
            return defaults[name];
        },
        getPrototypeValue(name) {
            return prototype[name];
        }
    };
};

// `items` (ports) and `labels` (links) are arrays, but a partial update
// can also define them as objects (e.g. built with `util.setByPath()`).
const forEachItem = function(items, callback) {
    if (Array.isArray(items)) {
        items.forEach((item, index) => callback(item, index));
    } else if (isPlainObject(items)) {
        Object.keys(items).forEach((key) => callback(items[key], key));
    }
};

// The target maps of a port (the same lookup as `ElementView` uses, see
// `_getPortMarkup()` and `_getPortLabelMarkup()`).
// - `attrs`: the `attrs` of the port apply to the port and to its label.
// - `labelAttrs`: the attributes of the label layout apply only to the label.
const getPortTargets = function(portMarkup, labelMarkup, ctx) {
    let byLabelMarkup = ctx.portTargetsCache.get(portMarkup);
    if (!byLabelMarkup) {
        byLabelMarkup = new Map();
        ctx.portTargetsCache.set(portMarkup, byLabelMarkup);
    }

    let portTargets = byLabelMarkup.get(labelMarkup);
    if (!portTargets) {
        const portTargetMap = collectTargets(portMarkup, ctx);
        const labelTargetMap = collectTargets(labelMarkup, ctx);
        portTargets = {
            attrs: [portTargetMap, labelTargetMap].filter(Boolean),
            labelAttrs: labelTargetMap ? [labelTargetMap] : null
        };
        byLabelMarkup.set(labelMarkup, portTargets);
    }
    return portTargets;
};

const sanitizePorts = function(ports, source, path, ctx) {
    if (!isPlainObject(ports)) return;

    const elementPortMarkup = source.get('portMarkup');
    const elementPortLabelMarkup = source.get('portLabelMarkup');

    // The groups defined by the shape itself (merged with the JSON groups by
    // `PortData`). Their markup is used to resolve the elements of the ports
    // (a port with `group: 'g'` uses the markup of the group `g`, even if `g` is
    // defined only by the shape).
    const defaultPorts = source.getDefault('ports');
    const defaultGroups = (isPlainObject(defaultPorts) && isPlainObject(defaultPorts.groups)) ? defaultPorts.groups : {};

    // The groups are looked up by name in any object (e.g. in an array by index).
    removeInvalidProperty(ports, 'groups', isPlainObject, path, ctx, 'invalid port groups');
    const groups = isPlainObject(ports.groups) ? ports.groups : {};
    const groupsPath = ctx.path(path, 'groups');
    const itemsPath = ctx.path(path, 'items');

    // The markup is sanitized first (the targets are collected from the sanitized markup).
    const sanitizePortMarkup = (port, portPath) => {
        sanitizeMarkupProperty(port, 'markup', portPath, ctx);
        if (isPlainObject(port.label)) sanitizeMarkupProperty(port.label, 'markup', ctx.path(portPath, 'label'), ctx);
    };

    // A property of a group: the JSON group is deeply merged with the shape default
    // group (a property defined by the JSON group, even `null`, replaces the default one).
    const getGroupProperty = (groupName, getObject, key) => {
        const jsonObject = isPlainObject(groups[groupName]) ? getObject(groups[groupName]) : null;
        if (isPlainObject(jsonObject) && hasOwn(jsonObject, key)) return jsonObject[key];
        const defaultObject = isPlainObject(defaultGroups[groupName]) ? getObject(defaultGroups[groupName]) : null;
        return (isPlainObject(defaultObject) && hasOwn(defaultObject, key)) ? defaultObject[key] : undefined;
    };
    const getGroupMarkup = (groupName) => getGroupProperty(groupName, (group) => group, 'markup');
    const getGroupLabelMarkup = (groupName) => getGroupProperty(groupName, (group) => group.label, 'markup');

    const getTargets = (port, groupName) => {
        const label = isPlainObject(port.label) ? port.label : {};
        // The same markup lookup as `ElementView` uses (the group's markup, then
        // the element port markup).
        const portMarkup = port.markup || getGroupMarkup(groupName) || elementPortMarkup;
        const labelMarkup = label.markup || getGroupLabelMarkup(groupName) || elementPortLabelMarkup;
        return getPortTargets(portMarkup, labelMarkup, ctx);
    };

    // `PortData` merges the label of a port into the label of its group deeply,
    // including the JSON markup (node by node, e.g. the attributes of a group node
    // are added to the port node of the same index). Such a merged markup is not
    // supported: the label markup of the port is removed (the group's is used).
    // - Define the label markup either on the group or on the ports of the group.
    const removeMergedLabelMarkup = (port, groupName, portPath) => {
        if (!isPlainObject(port.label) || !Array.isArray(port.label.markup)) return;
        if (!Array.isArray(getGroupLabelMarkup(groupName))) return;

        delete port.label.markup;
        ctx.remove(ctx.path(portPath, 'label', 'markup'), 'the label markup would be merged with the label markup of the group');
    };

    const sanitizePortAttrs = (port, attrsTargets, labelAttrsTargets, portPath) => {
        sanitizeAttrs(port, 'attrs', attrsTargets, portPath, ctx);

        // The port label layouts apply `args.attrs` to the label (e.g. `left` or `manual`).
        const position = isPlainObject(port.label) && port.label.position;
        if (isPlainObject(position) && isPlainObject(position.args)) {
            sanitizeAttrs(position.args, 'attrs', labelAttrsTargets, ctx.path(portPath, 'label', 'position', 'args'), ctx);
        }
    };

    const groupNames = Object.keys(groups).filter((name) => isPlainObject(groups[name]));
    groupNames.forEach((name) => sanitizePortMarkup(groups[name], ctx.path(groupsPath, name)));

    forEachItem(ports.items, (item, index) => {
        if (!isPlainObject(item)) return;

        const itemPath = ctx.path(itemsPath, index);
        const groupName = String(item.group);

        sanitizePortMarkup(item, itemPath);
        removeMergedLabelMarkup(item, groupName, itemPath);
        const targets = getTargets(item, groupName);
        sanitizePortAttrs(item, targets.attrs, targets.labelAttrs, itemPath);
    });

    // The `attrs` of a group are a template merged into the `attrs` of every port
    // of the group (including the ports added later, possibly with their own markup).
    // They get the rules of all elements.
    groupNames.forEach((name) => sanitizePortAttrs(groups[name], null, null, ctx.path(groupsPath, name)));
};

const sanitizeLabel = function(label, defaultLabelMarkup, path, ctx, isDefaultLabel) {
    if (!isPlainObject(label)) return;

    sanitizeMarkupProperty(label, 'markup', path, ctx);

    // The same lookup as `LinkView` uses (`label.markup` or the default label markup).
    // - The `attrs` of the default label are a template merged into the `attrs` of
    //   every label (including the labels added later, possibly with their own
    //   markup). They get the rules of all elements.
    const targets = isDefaultLabel ? null : getMarkupTargets(label.markup || defaultLabelMarkup, ctx);
    sanitizeAttrs(label, 'attrs', targets, path, ctx);
};

// Sanitizes (possibly partial) cell attributes in place.
// - `defaultAttrs` are the default `attrs` of the shape the `attrs` are merged
//   with (when a cell is created from the attributes).
const sanitizeCellAttributesInPlace = function(attributes, source, path, ctx, defaultAttrs = null) {
    const { isLink } = source;

    // Markup
    sanitizeMarkupProperty(attributes, 'markup', path, ctx);
    ['portMarkup', 'portLabelMarkup', 'labelMarkup'].forEach((key) => {
        sanitizeMarkupProperty(attributes, key, path, ctx);
    });

    // Attributes
    sanitizeAttrs(attributes, 'attrs', getMarkupTargets(source.get('markup'), ctx), path, ctx, defaultAttrs);

    // Ports (elements)
    if (isLink !== true) {
        sanitizePorts(attributes.ports, source, ctx.path(path, 'ports'), ctx);
    }

    // Labels (links)
    if (isLink !== false) {
        // The same lookup as `Link` uses (`_getDefaultLabel()` and `_builtins`).
        const builtins = source.getPrototypeValue('_builtins');
        const builtinLabelMarkup = builtins && builtins.defaultLabel && builtins.defaultLabel.markup;
        const labelMarkup = source.get('labelMarkup') || builtinLabelMarkup;
        sanitizeLabel(attributes.defaultLabel, labelMarkup, ctx.path(path, 'defaultLabel'), ctx, true);

        const defaultLabel = source.get('defaultLabel');
        const defaultLabelMarkup = (isPlainObject(defaultLabel) && defaultLabel.markup) || labelMarkup;
        forEachItem(attributes.labels, (label, index) => {
            sanitizeLabel(label, defaultLabelMarkup, ctx.path(path, 'labels', index), ctx, false);
        });
    }
};

// `json` is a plain object.
const sanitizeCell = function(json, opt, path, ctx) {
    const attributes = cloneJSON(json, path, ctx);
    const Ctor = getCellConstructor(attributes.type, opt.cellNamespace);
    const source = createCellSource(attributes, Ctor, null);

    // (the cell is created with the attributes merged with the defaults of its shape)
    const defaultAttrs = source.getDefault('attrs');
    sanitizeCellAttributesInPlace(attributes, source, path, ctx, isPlainObject(defaultAttrs) ? defaultAttrs : null);

    return attributes;
};

// Public API
// ----------

// Returns a sanitized copy of the cell JSON (e.g. an item of `graph.toJSON().cells`).
// - `opt.cellNamespace` is used to find the shape of the cell (its markup and its
//   defaults). Without it, the rules of all elements apply to all the `attrs`.
// - `opt.onRemove(path, reason)` is called for every removed part.
// - `opt.strict: false` sanitizes string markup and the `html` attribute
//   instead of removing them (it requires a DOM).
// - Returns `null` if the JSON is not an object (e.g. an array of cells,
//   which `graph.addCell()` would add without sanitizing).
export const sanitizeCellJSON = function(json, opt = {}) {
    const ctx = createContext(opt);
    if (!isPlainObject(json)) {
        ctx.remove([], 'invalid cell');
        return null;
    }
    if (hasInvalidType(json, opt.cellNamespace)) {
        ctx.remove([], 'invalid type');
        return null;
    }

    return sanitizeCell(json, opt, [], ctx);
};

// Returns a sanitized copy of the graph JSON (e.g. the result of `graph.toJSON()`).
// - The same options as `sanitizeCellJSON()`.
// - Only the `cells` are sanitized, the other properties are copied as they are.
// - `cells` which are not an array are removed (`graph.fromJSON()` then throws).
// - Returns `null` if the JSON is not an object.
export const sanitizeGraphJSON = function(json, opt = {}) {
    const ctx = createContext(opt);
    if (!isPlainObject(json)) {
        ctx.remove([], 'invalid graph');
        return null;
    }

    // (the `__proto__` key would otherwise provide inherited `cells`)
    const graphJSON = copyObject(json, [], ctx, (value) => value);
    // (`graph.fromJSON()` can load array-like `cells`)
    if (removeInvalidProperty(graphJSON, 'cells', Array.isArray, [], ctx, 'invalid cells')) {
        // (one context for all the cells, e.g. to share the sanitized string markup)
        graphJSON.cells = graphJSON.cells.reduce((cells, cellJSON, index) => {
            if (!isPlainObject(cellJSON)) {
                ctx.remove(['cells', index], 'invalid cell');
            } else if (hasInvalidType(cellJSON, opt.cellNamespace)) {
                ctx.remove(['cells', index], 'invalid type');
            } else {
                cells.push(sanitizeCell(cellJSON, opt, ['cells', index], ctx));
            }
            return cells;
        }, []);
    }

    return graphJSON;
};

// The attributes which define the markup other attributes apply to.
const MARKUP_ATTRIBUTES = ['markup', 'portMarkup', 'portLabelMarkup', 'labelMarkup', 'defaultLabel'];

// The attributes which apply to the markup.
const MARKUP_DEPENDENT_ATTRIBUTES = ['attrs', 'ports', 'labels', 'defaultLabel'];

// Whether the new markup makes the existing attributes of the cell unsafe
// (e.g. a selector of a safe `<image>` would select a `<use>` element instead).
// - The attributes are sanitized with both markups. Only the differences count
//   (the existing attributes can contain trusted content set by the application).
const changesExistingAttributes = function(cell, Ctor, update, strict) {
    const existing = {};

    MARKUP_DEPENDENT_ATTRIBUTES.forEach((name) => {
        if (hasOwn(update, name)) return;

        const value = cell.get(name);
        if (value !== undefined) existing[name] = value;
    });

    const sanitize = (markupAttributes) => {
        // (a new context: the markup of the cell differs between the calls)
        const silentContext = createContext({ strict });
        const attributes = cloneJSON(existing, [], silentContext);
        const source = createCellSource(Object.assign({}, markupAttributes, attributes), Ctor, cell);
        sanitizeCellAttributesInPlace(attributes, source, [], silentContext);
        return attributes;
    };

    return !isEqual(sanitize({}), sanitize(update));
};

// Returns a sanitized copy of the attributes, which are about to be set on
// an existing cell by `cell.set(attributes)` (e.g. in a collaborative session).
// - The cell is used to find out which elements the attributes apply to.
// - A markup which would make the existing attributes of the cell unsafe is removed.
// - A path-based change (e.g. `cell.prop('ports/items/0/markup', markup)`) can not
//   be sanitized on its own. Apply it to a copy of the top-level attribute, then
//   sanitize and set that:
//   const ports = util.cloneDeep(cell.get('ports'));
//   ports.items[0].markup = markup;
//   cell.set(sanitizeCellAttributes(cell, { ports }));
export const sanitizeCellAttributes = function(cell, attributes, opt = {}) {
    const ctx = createContext(opt);
    if (!isPlainObject(attributes)) {
        ctx.remove([], 'invalid attributes');
        return {};
    }

    const sanitized = cloneJSON(attributes, [], ctx);
    const Ctor = (cell instanceof dia.Cell) ? cell.constructor : null;
    // (an object which is not a cell is ignored)
    const existingCell = Ctor ? cell : null;
    const source = createCellSource(sanitized, Ctor, existingCell);
    sanitizeCellAttributesInPlace(sanitized, source, [], ctx);

    const markupAttributes = MARKUP_ATTRIBUTES.filter((name) => hasOwn(sanitized, name));
    if (existingCell && markupAttributes.length > 0 && changesExistingAttributes(existingCell, Ctor, sanitized, ctx.strict)) {
        markupAttributes.forEach((name) => {
            delete sanitized[name];
            ctx.remove([name], 'the markup would make the existing attributes unsafe');
        });
    }

    return sanitized;
};
