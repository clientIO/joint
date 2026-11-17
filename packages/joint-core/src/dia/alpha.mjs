import V from '../V/index.mjs';

const ALPHA_VISIBLE = 'white';

// SVG local names (case-sensitive)
const ALPHA_REPLACE_TAGS = new Set(['foreignObject', 'image', 'use', 'text', 'tspan', 'textPath']);

// removed both as attributes and as inline style properties
const ALPHA_PAINT_PROPERTIES = [
    'fill', 'stroke', 'stroke-width', 'stroke-opacity', 'fill-opacity', 'opacity', 'stroke-dasharray',
    'marker-start', 'marker-mid', 'marker-end',
    'filter',
    'cursor', 'pointer-events'
];

const ALPHA_ATTRIBUTE_BLACKLIST = new Set([
    ...ALPHA_PAINT_PROPERTIES,
    'class', 'id', 'model-id', 'joint-selector', 'magnet', 'port', 'port-id-type', 'port-group', 'event',
    'label-idx'
]);

function stripAlphaStyle(node) {
    // Keep the rest of the inline style (e.g. `transform-origin`), it can affect the geometry.
    // Note: CSSOM changes are allowed by a strict Content Security Policy.
    const { style } = node;
    ALPHA_PAINT_PROPERTIES.forEach(property => {
        if (property === 'fill' && style.getPropertyValue('fill') === 'none') return;
        style.removeProperty(property);
    });
    if (style.length === 0) node.removeAttribute('style');
}

function stripAlphaAttributes(node) {
    // `getAttributeNames()` returns a static array of strings (no `Attr` objects)
    const names = node.getAttributeNames();
    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (name === 'style') {
            stripAlphaStyle(node);
            continue;
        }
        if (name === 'fill' && node.getAttribute('fill') === 'none') continue;
        if (ALPHA_ATTRIBUTE_BLACKLIST.has(name) || name.startsWith('data-')) {
            node.removeAttribute(name);
        }
    }
}

function isAlphaIgnored(node, ignore, cellView) {
    if (typeof ignore === 'function') return !!ignore(node, cellView);
    if (typeof ignore === 'string') return node.matches(ignore);
    return false;
}

function isAlphaReplaced(node) {
    return ALPHA_REPLACE_TAGS.has(node.localName);
}

function removeEmptyGroups(node) {
    // reverse document order visits descendants before their ancestors
    const groups = node.querySelectorAll('g');
    for (let i = groups.length - 1; i >= 0; i--) {
        const group = groups[i];
        if (!group.firstElementChild) group.remove();
    }
}

// Queue the children of the original node and of its clone as flat pairs.
function queueChildren(queue, originalNode, cloneNode) {
    let original = originalNode.firstElementChild;
    let clone = cloneNode.firstElementChild;
    while (original) {
        queue.push(original, clone);
        original = original.nextElementSibling;
        clone = clone.nextElementSibling;
    }
}

// Create an all-white, detached copy of a node of the cell view, suitable
// as the content of an SVG `<mask>`. See `CellView.prototype.toAlpha()`.
export function createAlphaNode(cellView, node, opt = {}) {
    const { ignore } = opt;
    if (!V.isSVGGraphicsElement(node) || isAlphaIgnored(node, ignore, cellView)) return null;
    let alpha;
    if (isAlphaReplaced(node)) {
        alpha = cellView.getAlphaRect(node);
    } else {
        alpha = node.cloneNode(true);
        // The children are queued before their clone is modified, so the pairs stay aligned.
        const queue = [];
        queueChildren(queue, node, alpha);
        for (let i = 0; i < queue.length; i += 2) {
            const originalNode = queue[i];
            const clone = queue[i + 1];
            if (
                !V.isSVGGraphicsElement(originalNode) ||
                // the ignore check is cheaper than the visibility check
                isAlphaIgnored(originalNode, ignore, cellView) ||
                !originalNode.checkVisibility({ opacityProperty: true, visibilityProperty: true })
            ) {
                clone.remove();
                continue;
            }
            if (isAlphaReplaced(originalNode)) {
                clone.replaceWith(cellView.getAlphaRect(originalNode));
                continue;
            }
            stripAlphaAttributes(clone);
            queueChildren(queue, originalNode, clone);
        }
        removeEmptyGroups(alpha);
        if (alpha.localName === 'g' && !alpha.firstElementChild) return null;
        stripAlphaAttributes(alpha);
    }
    alpha.setAttribute('fill', (node.getAttribute('fill') === 'none') ? 'none' : ALPHA_VISIBLE);
    alpha.setAttribute('stroke', ALPHA_VISIBLE);
    return alpha;
}
