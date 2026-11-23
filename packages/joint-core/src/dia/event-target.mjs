// Resolve the point against the tree `node` belongs to - a `ShadowRoot` or the `document`.
export function elementFromPoint(node, x, y) {
    const root = node.getRootNode();
    return (root.elementFromPoint ? root : document).elementFromPoint(x, y);
}

// A listener outside a shadow root gets the shadow host as the event target.
// Find the target in the tree `node` belongs to instead.
export function getTargetInTree(evt, node) {
    const { target } = evt;
    const root = node.getRootNode();
    if (!target || target.getRootNode?.() === root) return target;
    const event = evt.originalEvent || evt;
    if (!event.composedPath) return target;
    return event.composedPath().find((pathNode) => pathNode.getRootNode?.() === root) || target;
}
