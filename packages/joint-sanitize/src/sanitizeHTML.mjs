// Sanitizing untrusted HTML strings.
// - The string is parsed into an inert document, where the nodes are sanitized
//   (by the rules of `security.mjs`).
// - It requires a DOM.

import {
    getDOMMethods,
    isAllowedElement,
    isSafeAttribute,
    ELEMENT_NODE,
    TEXT_NODE,
    COMMENT_NODE
} from './security.mjs';

// Text which would be parsed as markup if the element content is not raw text.
// - `<` starts markup only when followed by an ASCII letter (a start tag), `/` (an end tag),
//   `!` (a comment, doctype or CDATA) or `?` (a bogus comment). Otherwise it is text
//   (e.g. `width<600px` in CSS).
const MARKUP_TEXT = /<[/!?a-zA-Z]/;

// The same as `mvc.$.parseHTML()`, which in `@joint/core` < 4.3.4 removes only every other `<script>`.
const parseHTML = function(string) {
    // Inline events will not execute when the HTML is parsed.
    const context = document.implementation.createHTMLDocument();
    context.body.innerHTML = string;
    Array.from(context.getElementsByTagName('script')).forEach((script) => script.remove());
    return Array.from(context.body.childNodes);
};

// `NodeFilter.SHOW_ALL`
const SHOW_ALL = 0xFFFFFFFF;

// Nodes other than elements, text and comments (e.g. processing instructions,
// which some browsers create when parsing HTML) are serialized differently in
// XML and HTML (possible mXSS).
const SAFE_NODE_TYPES = new Set([
    ELEMENT_NODE,
    TEXT_NODE,
    COMMENT_NODE,
]);

// What happens to a node in the result.
const KEEP = 0;
const REMOVE = 1;
// The element is replaced by its content (which is sanitized as well).
const UNWRAP = 2;

// The rules for a node (shared by both passes below).
// - `tagName` is the tag name of an element node (`null` for other nodes).
// - `parentNode` is the parent the node has in the result (the nearest kept ancestor),
//   or `null` if it is the current parent of the node (it is looked up only if needed).
const getNodeAction = function(node, nodeType, tagName, parentNode, dom) {
    if (!SAFE_NODE_TYPES.has(nodeType)) return REMOVE;

    // Comments which contain markup are removed. The content of an element which
    // is parsed differently in another context (see `removeMarkupTextElements()`)
    // can be a comment, which is not part of `textContent` (e.g. `<svg><style><!--</style>-->`).
    // (comments can not be clobbered, they have no children)
    if (nodeType === COMMENT_NODE && MARKUP_TEXT.test(node.data)) return REMOVE;

    if (nodeType !== ELEMENT_NODE) return KEEP;

    if (parentNode === null) parentNode = dom.getParentNode.call(node);
    const namespaceURI = dom.getNamespaceURI.call(node);
    if (!isAllowedElement(tagName, namespaceURI, dom.getNamespaceURI.call(parentNode), dom.getTagName.call(parentNode))) {
        return UNWRAP;
    }
    return KEEP;
};

// Removes the unsafe attributes of an element. Returns `true` if any was removed.
const sanitizeAttributes = function(element, tagName, dom) {
    let removed = false;
    for (const attrName of dom.getAttributeNames.call(element)) {
        if (!isSafeAttribute(tagName, attrName, dom.getAttribute.call(element, attrName))) {
            dom.removeAttribute.call(element, attrName);
            // The element keeps the `is` value it was created with, which is
            // serialized when there is no `is` attribute. An empty `is` attribute
            // is serialized instead (it does not upgrade the element).
            if (attrName === 'is') dom.setAttribute.call(element, attrName, '');
            removed = true;
        }
    }
    return removed;
};

// Sanitizes the descendants of `root` and the attributes of `root` in place.
// - Returns `false` (and stops) when an element has to be unwrapped. Unwrapping
//   in place moves the content (once per unwrapped ancestor), which takes quadratic
//   time for crafted input (e.g. many or deeply nested unknown elements).
// - `state.removed` is set to `true` if any unsafe node or attribute is removed.
// - The nodes should not be connected to a live document yet.
const sanitizeInPlace = function(root, dom, state) {
    const nodes = [];

    const walker = root.ownerDocument.createTreeWalker(root, SHOW_ALL);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        nodes.push(node);
    }

    if (sanitizeAttributes(root, dom.getTagName.call(root), dom)) state.removed = true;

    // (the nodes are in document order: the parent of a node has been sanitized already;
    // a removed node has no children, so no node in the list is removed with an ancestor)
    for (const node of nodes) {
        const nodeType = dom.getNodeType.call(node);
        const tagName = (nodeType === ELEMENT_NODE) ? dom.getTagName.call(node) : null;
        switch (getNodeAction(node, nodeType, tagName, null, dom)) {
            case REMOVE:
                dom.removeChild.call(dom.getParentNode.call(node), node);
                state.removed = true;
                break;
            case UNWRAP:
                // (an unwrap is a removal; the copy pass that follows does not track removals,
                // so `removed` is set here, before this pass bails out of the in-place sanitizing)
                state.removed = true;
                return false;
            default:
                if (tagName !== null && sanitizeAttributes(node, tagName, dom)) state.removed = true;
        }
    }
    return true;
};

// Returns a sanitized copy of `root` (a disallowed element is not copied, its content
// is copied into its parent in the result instead).
// - Every node is visited once and appended once (before its own content), so it takes
//   linear time regardless of how many elements are unwrapped and how deep they are.
// - `root` can be sanitized partially already (the rules give the same result again).
// - This pass runs only after `sanitizeInPlace()` found an unwrap (and set `removed`), so
//   it does not track removals (everything it removes was already reported as removed).
const sanitizeCopy = function(root, dom) {
    const outputRoot = dom.cloneNode.call(root, false);

    sanitizeAttributes(outputRoot, dom.getTagName.call(outputRoot), dom);

    // The input parents and the output parents of the ancestors of `node`.
    const stack = [];
    let outputParent = outputRoot;
    let node = dom.getFirstChild.call(root);
    while (node) {
        const nodeType = dom.getNodeType.call(node);
        const tagName = (nodeType === ELEMENT_NODE) ? dom.getTagName.call(node) : null;

        // The output parent of the content of `node` (none if it is removed).
        let contentParent = null;
        switch (getNodeAction(node, nodeType, tagName, outputParent, dom)) {
            case UNWRAP:
                contentParent = outputParent;
                break;
            case KEEP: {
                const copy = dom.cloneNode.call(node, false);
                if (tagName !== null) {
                    sanitizeAttributes(copy, tagName, dom);
                    contentParent = copy;
                }
                dom.appendChild.call(outputParent, copy);
                break;
            }
            // (REMOVE: the node is not copied)
        }

        // Depth-first (in document order).
        const firstChild = contentParent && dom.getFirstChild.call(node);
        if (firstChild) {
            stack.push(node, outputParent);
            outputParent = contentParent;
            node = firstChild;
            continue;
        }

        let nextNode = dom.getNextSibling.call(node);
        while (!nextNode && stack.length > 0) {
            outputParent = stack.pop();
            nextNode = dom.getNextSibling.call(stack.pop());
        }
        node = nextNode;
    }

    return outputRoot;
};

// Removes the elements whose text content would be parsed as markup in another
// context (e.g. the content of `<style>` inside `<svg>` or `<math>`).
// Returns `true` if any element was removed.
const removeMarkupTextElements = function(root) {
    let removed = false;
    for (const node of Array.from(root.querySelectorAll('*'))) {
        // (only leaf elements are removed, so a removed node is never an ancestor
        // of another node in the list; no `root.contains()` check is needed)
        if (node.firstElementChild) continue;

        if (MARKUP_TEXT.test(node.textContent) && MARKUP_TEXT.test(node.innerHTML)) {
            node.remove();
            removed = true;
        }
    }
    return removed;
};

// Removes the unsafe elements and attributes from an HTML string.
// The string is parsed into an inert document (without `<script>` elements).
// - Only the allowed elements are kept (see `security.mjs`), the other elements
//   are replaced by their content (e.g. the text of an unknown element is kept).
// - The result is meant to be inserted into an HTML element.
// - The result is parsed again (e.g. `el.innerHTML = result`), which can create
//   different nodes than the ones sanitized (mXSS, e.g. the content of `<style>`
//   inside `<math>`). Such elements are removed.
export const sanitizeHTML = function(html) {
    return sanitizeHTMLResult(html).html;
};

// Sanitizes an HTML string and reports whether any unsafe node or attribute was
// removed (used by the graph sanitizer in lenient mode; see `sanitizeGraph.mjs`).
// - `removed` is `false` when the string was only normalized (e.g. `&` -> `&amp;`,
//   a `<tbody>` added) but nothing unsafe was removed. It avoids parsing the
//   result again just to compare it with the input.
// - `<script>` elements (removed by `parseHTML()`) are not reflected in `removed`
//   (the flag reports what the node sanitizing removes, not a substring of the input).
export const sanitizeHTMLResult = function(html) {
    // Ignores tags that are invalid inside a <div> tag (e.g. <body>, <head>)
    const [inputEl] = parseHTML('<div>' + html + '</div>');

    const dom = getDOMMethods();
    const state = { removed: false };

    // Most content has nothing to unwrap: it is sanitized in place (faster than a copy).
    const outputEl = sanitizeInPlace(inputEl, dom, state) ? inputEl : sanitizeCopy(inputEl, dom);

    if (removeMarkupTextElements(outputEl)) state.removed = true;

    return { html: outputEl.innerHTML, removed: state.removed };
};
