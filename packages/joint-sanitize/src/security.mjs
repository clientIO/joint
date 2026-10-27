// The rules for sanitizing untrusted content: which elements and attributes are safe.
// - Shared by `sanitizeHTML.mjs` (HTML strings) and `sanitizeGraph.mjs` (graph JSON).
// - They do not require a DOM (e.g. they run in Node.js), except `getDOMMethods()`.

// Namespaces (`V.namespace` is not available without SVG support, e.g. in Node.js).
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
export const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
export const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

// `Node` constants (`Node` is not defined outside of browser, e.g. in Node.js).
export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;
export const CDATA_SECTION_NODE = 4;
export const COMMENT_NODE = 8;

// SVG elements allowed in sanitized content (lowercase local names).
// - Inspired by `https://github.com/cure53/DOMPurify`.
//   - But allows extra elements on top of that (`foreignObject`, `use`).
// - Ignores tags which execute scripts (`script`).
// - Ignores SVG Tiny 1.2 event handlers (`handler`, `listener`).
// - Ignores tags which animate any attribute (`animate`, `set`).
// - Ignores obsolete tags (SVG fonts, `tref`, `animateColor`, ...).
// - Ignores unknown tags.
const SVG_ELEMENTS = new Set([
    'a', 'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs',
    'desc', 'ellipse', 'feblend', 'fecolormatrix', 'fecomponenttransfer',
    'fecomposite', 'feconvolvematrix', 'fediffuselighting', 'fedisplacementmap',
    'fedistantlight', 'fedropshadow', 'feflood', 'fefunca', 'fefuncb',
    'fefuncg', 'fefuncr', 'fegaussianblur', 'feimage', 'femerge', 'femergenode',
    'femorphology', 'feoffset', 'fepointlight', 'fespecularlighting',
    'fespotlight', 'fetile', 'feturbulence', 'filter', 'foreignobject', 'g',
    'image', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath',
    'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop',
    'style', 'svg', 'switch', 'symbol', 'text', 'textpath', 'title', 'tspan',
    'use', 'view',
]);

// HTML elements allowed in sanitized content (in SVG = in `<foreignObject>`).
// - Inspired by `https://github.com/cure53/DOMPurify`.
//   - But ignores structural tags on top of that (`html`, `head`, `body`, ...).
// - Ignores tags which execute scripts (`script`).
// - Ignores tags which embed a document or a plugin (`iframe`, `object`, `embed`, ...).
// - Ignores tags which change the host document (`base`, `link`, `meta`).
// - Ignores tags whose content isn't in DOM (can't be sanitized) (`template`).
// - Ignores tags whose content parses differently in different contexts (mXSS)
//   (`noscript`, `xmp`, `noembed`, ...).
// - Ignores unknown tags (e.g. custom elements). MathML is not allowed at all.
const HTML_ELEMENTS = new Set([
    'a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b',
    'bdi', 'bdo', 'big', 'blink', 'blockquote', 'br', 'button', 'canvas',
    'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist',
    'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'em',
    'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2',
    'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'img', 'input',
    'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee',
    'menu', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p',
    'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp',
    'search', 'section', 'select', 'small', 'source', 'spacer', 'span',
    'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody',
    'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u',
    'ul', 'var', 'video', 'wbr',
]);

// HTML elements whose content is parsed the same way as the content of `<div>`
// (e.g. the `html` attribute is parsed in the context of the element).
const HTML_CONTENT_ELEMENTS = new Set([
    'a', 'article', 'aside', 'b', 'blockquote', 'button', 'code', 'dd',
    'details', 'div', 'dt', 'em', 'figcaption', 'figure', 'footer', 'h1', 'h2',
    'h3', 'h4', 'h5', 'h6', 'header', 'i', 'label', 'li', 'main', 'nav', 'p',
    's', 'section', 'small', 'span', 'strong', 'summary', 'u',
]);

// Elements whose URL attributes can contain a `data:` image (they display it).
// - `data:` URLs are not allowed on other elements. For example, the content of
//   `<use href="data:image/svg+xml,...">` is copied into the host document and
//   can bring in `javascript:` links (it is not part of the DOM tree, so it can
//   not be sanitized), unlike `<image>`, which renders it in isolation.
const DATA_URL_ELEMENTS = new Set([
    'img',
    'image',
    'feimage',
    'input', // `type="image"`
    'video', // `poster`
]);

// Attributes that are never safe, regardless of their value, in addition to
// inline event handlers (e.g. `onclick`).
// - Inspired by `https://github.com/cure53/DOMPurify`.
const UNSAFE_ATTRIBUTES = new Set([
    // The content of an embedded document.
    'srcdoc',
    // A form control can be associated with any form of the host document (by its `id`),
    // and a submit button can change where and how the form is submitted
    // (e.g. send the host form's data to another URL).
    'form',
    'formaction',
    'formenctype',
    'formmethod',
    'formnovalidate',
    'formtarget',
    // A built-in element can be upgraded to a customized built-in element
    // of the host document (its code runs with the untrusted attributes).
    'is',
    // A button can invoke actions on any element of the host document (by its `id`).
    'command',
    'commandfor',
]);

// Attributes which add a named property to `document` (DOM clobbering), e.g.
// `<img name="createElement">` replaces `document.createElement()`.
// - `<embed>`, `<iframe>` and `<object>` do the same, but they are unsafe anyway.
// - The `id` of `<img>` counts only when it has a `name` (removing either is enough,
//   but the `name` may be safe and the `id` not).
// - Attribute name -> tag names.
const DOCUMENT_NAMED_ATTRIBUTES = new Map([
    ['name', new Set(['img', 'form'])],
    ['id', new Set(['img'])],
]);

// Attributes whose value is a URL.
// - NOTE: Local names only (e.g. `href` also covers `xlink:href`).
const URL_ATTRIBUTES = new Set([
    'href',
    'src',
    'action',
    'poster',
    'background',
]);

// Attributes whose value is never used as a URL (the URL rules do not apply).
// - Inspired by `https://github.com/cure53/DOMPurify`.
const URL_SAFE_ATTRIBUTES = new Set([
    'alt',
    'class',
    'for',
    'id',
    'label',
    'name',
    'pattern',
    'placeholder',
    'role',
    'summary',
    'title',
    'value',
    'style',
    'xmlns',
]);

// Browsers ignore whitespace and control characters when parsing the scheme of
// a URL (e.g. ` java\tscript:`).
// eslint-disable-next-line no-control-regex
const IGNORED_URL_CHARS = /[\u0000- \u007F-\u009F]/g;

// URL schemes that execute scripts.
const UNSAFE_URL_SCHEMES = [
    'javascript:',
    'vbscript:',
];

// `data:` URLs allowed in URL attributes of `DATA_URL_ELEMENTS`.
const ALLOWED_DATA_URL_PREFIXES = [
    'data:image/', // images are the only `data:` URL commonly found in diagrams
];

const normalizeURL = function(value) {
    return String(value).replace(IGNORED_URL_CHARS, '').toLowerCase();
};

// The part of the tag name / attribute name that's after the `:` character.
const getLocalName = function(name) {
    const index = name.indexOf(':');
    return (index === -1) ? name : name.slice(index + 1);
};

// Any namespace prefix (e.g. `xlink:href` or `x:href`) is ignored.
const isURLAttribute = function(attrName) {
    return URL_ATTRIBUTES.has(getLocalName(String(attrName).toLowerCase()));
};

// The lowercase local name of a tag name (`null` for an unknown element).
// - The rules of an element depend only on its local name.
export const getLocalTagName = function(tagName) {
    return (tagName == null) ? null : getLocalName(String(tagName).toLowerCase());
};

// `tagName` is `null` when the element is not known (e.g. an `attrs` selector
// of graph JSON which can not be resolved). The rules of all elements apply.
const isSafeURL = function(tagName, attrName, value) {
    // Normalize `value` to catch obfuscated schemes (e.g. `  JaVa\tScRiPt:`).
    const url = normalizeURL(value);

    // Inherently unsafe URL schemes (e.g. `javascript:`).
    if (UNSAFE_URL_SCHEMES.some(scheme => url.startsWith(scheme))) return false;

    // `data:` URL values are restricted only in URL attributes.
    if (!url.startsWith('data:') || !isURLAttribute(attrName)) return true;

    const localTagName = getLocalTagName(tagName);
    if (localTagName === null) {
        // An unknown element could be any element (an SVG image could bring in links).
        if (url.startsWith('data:image/svg+xml')) return false;
    } else if (!DATA_URL_ELEMENTS.has(localTagName)) {
        return false;
    }

    // Only `data:` URLs with an allowed prefix are safe.
    return ALLOWED_DATA_URL_PREFIXES.some(prefix => url.startsWith(prefix));
};

// Whether the attribute would replace a property of `document`.
// - `attrName` is lowercase (without a prefix).
const isClobberingAttribute = function(tagName, attrName, value) {
    // The attribute name is checked first (the common case is cheap).
    const tagNames = DOCUMENT_NAMED_ATTRIBUTES.get(attrName);
    if (!tagNames) return false;

    const localTagName = getLocalTagName(tagName);
    // An unknown element could be one of them.
    if (localTagName !== null && !tagNames.has(localTagName)) return false;

    // Without a document (e.g. in Node.js), any value could be a property of it.
    if (typeof document === 'undefined') return true;

    return (String(value) in document);
};

const isEventHandler = function(attrName) {
    return String(attrName).toLowerCase().startsWith('on');
};

// Whether the element is allowed (e.g. in graph JSON markup or in sanitized HTML).
// - `parentNamespaceURI` and `parentTagName` describe the parent element.
// - SVG elements are allowed in SVG (and `<svg>` inside HTML), HTML elements
//   inside `<foreignObject>` (and inside other HTML elements).
export const isAllowedElement = function(tagName, namespaceURI, parentNamespaceURI, parentTagName) {
    const localTagName = getLocalTagName(tagName);
    if (localTagName === null) return false;

    switch (namespaceURI) {
        case SVG_NAMESPACE: {
            if (!SVG_ELEMENTS.has(localTagName)) return false;
            return (parentNamespaceURI !== HTML_NAMESPACE) || (localTagName === 'svg');
        }
        case HTML_NAMESPACE: {
            if (!HTML_ELEMENTS.has(localTagName)) return false;
            if (parentNamespaceURI === HTML_NAMESPACE) return true;
            return (parentNamespaceURI === SVG_NAMESPACE) && (getLocalTagName(parentTagName) === 'foreignobject');
        }
        default:
            return false;
    }
};

// Whether the element is an HTML element whose content is parsed the same way
// as the content of `<div>` (sanitized HTML can be set as its content).
export const isHTMLContentElement = function(tagName, namespaceURI) {
    if (namespaceURI !== HTML_NAMESPACE) return false;

    const localTagName = getLocalTagName(tagName);
    return (localTagName !== null) && HTML_CONTENT_ELEMENTS.has(localTagName);
};

// `attrName` and `value` are the name and the value of an attribute.
// - `tagName` is the tag name of the element, or `null` if it is not known.
// - `value` can be any value set as an attribute (e.g. a number).
export const isSafeAttribute = function(tagName, attrName, value) {
    attrName = String(attrName).toLowerCase();
    const localName = getLocalName(attrName);

    // Inline event handlers are unsafe (e.g. `onclick`, `onload`, `onerror`).
    if (isEventHandler(localName)) return false;

    // Inherently unsafe attributes (e.g. `srcdoc`).
    if (UNSAFE_ATTRIBUTES.has(localName)) return false;

    // Attributes which would replace a property of `document`.
    if (isClobberingAttribute(tagName, localName, value)) return false;

    // Some attributes are only unsafe with specific values.

    // Shortcut: Some values cannot be unsafe.
    if ((value == null) || (typeof value === 'number') || (typeof value === 'boolean')) return true;

    // Not only string values can be a problem.
    // - For example, `['javascript:...']` gets converted to string when set.
    value = String(value);
    // Prevent indirect routes like `<set attributeName="href" to="javascript:...">`.
    // - `<set>` and `<animate>` are not allowed, `<animateTransform>` can animate
    //   only transforms. It is checked anyway (defense in depth).
    // - It's enough to remove `attributeName` -  without it, `to` is safe.
    // - It is checked on any element (it has an effect only on animations).
    if (localName === 'attributename') {
        const targetName = getLocalName(value.trim().toLowerCase());

        // Another animation could otherwise be retargeted (e.g. to `onclick`).
        if (targetName === 'attributename') return false;

        if (isEventHandler(targetName)) return false;

        if (UNSAFE_ATTRIBUTES.has(targetName)) return false;

        // URL attributes can also be abused in this context.
        if (isURLAttribute(targetName)) return false;
    }

    // The value of some attributes is never used as a URL.
    if (URL_SAFE_ATTRIBUTES.has(localName)) return true;

    // Shortcut to avoid parsing long values (e.g. `d`):
    // - Values containing a URL scheme always contain a literal `:` character.
    // - (Parsed values are already decoded, values set by `setAttribute()` are never decoded.)
    if (value.indexOf(':') === -1) return true;

    return isSafeURL(tagName, attrName, value);
};

// The properties and methods of the nodes being sanitized can be clobbered,
// e.g. `form.getAttributeNames` is the control in `<form><input name="getAttributeNames"></form>`.
// Therefore the original ones are used (by `sanitizeHTML.mjs` and `sanitizeStringMarkup.mjs`).
// - They are looked up on the first use (there is no DOM e.g. in Node.js).
let domMethods = null;
export const getDOMMethods = function() {
    if (domMethods) return domMethods;

    const getter = (proto, name) => Object.getOwnPropertyDescriptor(proto, name).get;

    domMethods = {
        getNodeType: getter(Node.prototype, 'nodeType'),
        getParentNode: getter(Node.prototype, 'parentNode'),
        getFirstChild: getter(Node.prototype, 'firstChild'),
        getNextSibling: getter(Node.prototype, 'nextSibling'),
        getChildNodes: getter(Node.prototype, 'childNodes'),
        getTagName: getter(Element.prototype, 'tagName'),
        getNamespaceURI: getter(Element.prototype, 'namespaceURI'),
        appendChild: Node.prototype.appendChild,
        cloneNode: Node.prototype.cloneNode,
        removeChild: Node.prototype.removeChild,
        replaceChild: Node.prototype.replaceChild,
        getAttributeNames: Element.prototype.getAttributeNames,
        getAttribute: Element.prototype.getAttribute,
        setAttribute: Element.prototype.setAttribute,
        removeAttribute: Element.prototype.removeAttribute,
    };
    return domMethods;
};
