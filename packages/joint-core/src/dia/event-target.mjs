// Resolve the point against the root of `node` - a `ShadowRoot` or the `document`.
export function elementFromPoint(node, x, y) {
    const root = node.getRootNode();
    return (root.elementFromPoint ? root : document).elementFromPoint(x, y);
}

// A listener outside a shadow root gets the shadow host as the event target.
// Find the target in the shadow root `node` belongs to instead.
export function getEventTargetInRootOf(node, evt) {
    const root = node.getRootNode();
    if (!(root instanceof ShadowRoot)) return evt.target;
    const { originalEvent = evt } = evt;
    const path = originalEvent.composedPath?.() || [];
    return path.find((pathNode) => pathNode.getRootNode?.() === root) || evt.target;
}
