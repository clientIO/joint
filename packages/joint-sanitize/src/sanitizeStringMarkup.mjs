// Sanitizing string markup of graph JSON (e.g. `markup: '<rect/><text/>'`).
// - The markup is parsed the same way as by `V(markup)` (as XML, in an inert
//   document), sanitized by the rules of `security.mjs` and serialized back.
// - The result is parsed by `V(markup)` again. An XML document serializes to
//   the same nodes it was parsed from (there are no mXSS issues of HTML).
// - It requires a DOM.

import {
    getDOMMethods,
    isAllowedElement,
    isSafeAttribute,
    SVG_NAMESPACE,
    XLINK_NAMESPACE,
    ELEMENT_NODE,
    TEXT_NODE,
    CDATA_SECTION_NODE,
    COMMENT_NODE
} from './security.mjs';

// Whether string markup can be sanitized (there is a DOM).
export const canSanitizeStringMarkup = function() {
    return (typeof DOMParser !== 'undefined') && (typeof XMLSerializer !== 'undefined') && (typeof Node !== 'undefined');
};

// Sanitizes the children of `parentNode` (in place).
// - `reasons` collects the reasons of the removed parts.
const sanitizeChildNodes = function(parentNode, parentNamespaceURI, parentTagName, reasons, dom) {
    const childNodes = Array.from(dom.getChildNodes.call(parentNode));
    for (const node of childNodes) {
        const nodeType = dom.getNodeType.call(node);
        if (nodeType === TEXT_NODE || nodeType === COMMENT_NODE) continue;

        if (nodeType === CDATA_SECTION_NODE) {
            // The content of CDATA sections is kept as text (e.g. the content of `<style>`).
            dom.replaceChild.call(parentNode, node.ownerDocument.createTextNode(node.data), node);
            continue;
        }

        if (nodeType !== ELEMENT_NODE) {
            // e.g. processing instructions
            dom.removeChild.call(parentNode, node);
            reasons.push('unsupported node');
            continue;
        }

        const tagName = dom.getTagName.call(node);
        const namespaceURI = dom.getNamespaceURI.call(node);
        if (!isAllowedElement(tagName, namespaceURI, parentNamespaceURI, parentTagName)) {
            dom.removeChild.call(parentNode, node);
            reasons.push(`element \`${tagName}\` is not allowed`);
            continue;
        }

        for (const attrName of dom.getAttributeNames.call(node)) {
            if (isSafeAttribute(tagName, attrName, dom.getAttribute.call(node, attrName))) continue;
            dom.removeAttribute.call(node, attrName);
            reasons.push(`attribute \`${attrName}\` is not allowed`);
        }

        sanitizeChildNodes(node, namespaceURI, tagName, reasons, dom);
    }
};

// Returns the sanitized string markup and the reasons of the removed parts.
// - `markup` is `null` if the markup is invalid or nothing is left of it.
export const sanitizeStringMarkup = function(markup) {
    const reasons = [];
    const trimmedMarkup = markup.trim();
    if (!trimmedMarkup) return { markup, reasons };

    // A single tag name (e.g. `V('rect')`).
    if (trimmedMarkup[0] !== '<') {
        if (trimmedMarkup.toLowerCase() === 'svg' || isAllowedElement(trimmedMarkup, SVG_NAMESPACE, SVG_NAMESPACE, 'g')) {
            return { markup, reasons };
        }

        reasons.push(`element \`${trimmedMarkup}\` is not allowed`);
        return { markup: null, reasons };
    }

    // The same document as `V.createSvgDocument()` creates.
    const xml = `<svg xmlns="${SVG_NAMESPACE}" xmlns:xlink="${XLINK_NAMESPACE}">${trimmedMarkup}</svg>`;
    let svgDocument;
    try {
        svgDocument = new DOMParser().parseFromString(xml, 'text/xml');
    } catch {
        svgDocument = null;
    }

    if (!svgDocument || svgDocument.getElementsByTagName('parsererror').length > 0) {
        reasons.push('invalid markup');
        return { markup: null, reasons };
    }

    const root = svgDocument.documentElement;
    const dom = getDOMMethods();

    sanitizeChildNodes(root, SVG_NAMESPACE, 'g', reasons, dom);

    if (!Array.from(dom.getChildNodes.call(root)).some((node) => dom.getNodeType.call(node) === ELEMENT_NODE)) {
        reasons.push('no elements left');
        return { markup: null, reasons };
    }

    // The content of the root element (its namespace declarations stay in scope,
    // so the elements are serialized without them).
    const serialized = new XMLSerializer().serializeToString(root);
    const start = serialized.indexOf('>') + 1;
    const end = serialized.lastIndexOf('</');
    return { markup: serialized.slice(start, end), reasons };
};
