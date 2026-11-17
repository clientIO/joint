import V from '../V/index.mjs';

const ALPHA_VISIBLE = 'white';

const ALPHA_REPLACE_TAGS = ['FOREIGNOBJECT', 'IMAGE', 'USE', 'TEXT', 'TSPAN', 'TEXTPATH'];

// removed both as attributes and as inline style properties
const ALPHA_PAINT_PROPERTIES = [
    'fill', 'stroke', 'stroke-width', 'stroke-opacity', 'fill-opacity', 'opacity', 'stroke-dasharray',
    'marker-start', 'marker-mid', 'marker-end',
    'filter',
    'cursor', 'pointer-events'
];

const ALPHA_ATTRIBUTE_BLACKLIST = [
    ...ALPHA_PAINT_PROPERTIES,
    'class', 'id', 'model-id', 'joint-selector', 'magnet', 'port', 'port-id-type', 'port-group', 'event',
    'label-idx'
];

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
    Array.from(node.attributes).forEach(({ name }) => {
        if (name === 'style') return stripAlphaStyle(node);
        if (name === 'fill' && node.getAttribute('fill') === 'none') return;
        if (name.startsWith('data-') || ALPHA_ATTRIBUTE_BLACKLIST.includes(name)) {
            node.removeAttribute(name);
        }
    });
}

function isAlphaIgnored(node, ignore, cellView) {
    if (typeof ignore === 'function') return !!ignore(node, cellView);
    if (typeof ignore === 'string') return node.matches(ignore);
    return false;
}

function isAlphaReplaced(node) {
    return ALPHA_REPLACE_TAGS.includes(node.tagName.toUpperCase());
}

function removeEmptyGroups(node) {
    // reverse document order visits descendants before their ancestors
    Array.from(node.querySelectorAll('g')).reverse().forEach(group => {
        if (group.children.length === 0) group.remove();
    });
}

function zipChildren(originalNode, cloneNode) {
    const originals = Array.from(originalNode.children);
    const clones = Array.from(cloneNode.children);
    return originals.map((original, i) => [original, clones[i]]);
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
        const pairs = zipChildren(node, alpha);
        while (pairs.length > 0) {
            const [originalNode, clone] = pairs.shift();
            if (
                !V.isSVGGraphicsElement(originalNode) ||
                !originalNode.checkVisibility({ opacityProperty: true, visibilityProperty: true }) ||
                isAlphaIgnored(originalNode, ignore, cellView)
            ) {
                clone.remove();
                continue;
            }
            if (isAlphaReplaced(originalNode)) {
                clone.replaceWith(cellView.getAlphaRect(originalNode));
                continue;
            }
            stripAlphaAttributes(clone);
            pairs.push(...zipChildren(originalNode, clone));
        }
        removeEmptyGroups(alpha);
        if (alpha.tagName.toUpperCase() === 'G' && alpha.children.length === 0) return null;
        stripAlphaAttributes(alpha);
    }
    alpha.setAttribute('fill', (node.getAttribute('fill') === 'none') ? 'none' : ALPHA_VISIBLE);
    alpha.setAttribute('stroke', ALPHA_VISIBLE);
    return alpha;
}
