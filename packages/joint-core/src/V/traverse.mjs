/**
 * @param {SVGElement} node1
 * @param {SVGElement} node2
 * @returns {SVGElement|null}
 * @description Finds the common ancestor node of two nodes.
 */
export function getCommonAncestor(node1, node2) {
    // Find the common ancestor node of two nodes.
    let parent = node1;
    do {
        if (parent.contains(node2)) return parent;
        parent = parent.parentNode;
    } while (parent);
    return null;
}

