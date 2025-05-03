import { svgDocument } from './create.mjs';
import { getCommonAncestor } from './traverse.mjs';

/**
 * @returns {SVGMatrix}
 * @description Creates an identity matrix.
 */
export function createIdentityMatrix() {
    return svgDocument.createSVGMatrix();
}

/**
 * @param {SVGElement} node
 * @returns {SVGMatrix|null}
 * @description Returns the transformation matrix of the given node.
 * If the node has no transformation, it returns null.
 */
export function getNodeMatrix(node) {
    const consolidatedTransformation = node.transform.baseVal.consolidate();
    return consolidatedTransformation ? consolidatedTransformation.matrix : null;
}

/**
 *
 * @param {SVGElement} a
 * @param {SVGElement} b
 * @returns {SVGMatrix|null}
 * @description Finds the transformation matrix from `a` to `b`.
 * It requires that both elements to be visible (in the render tree)
 * in order to calculate the correct transformation matrix.
 */
export function getRelativeTransformation(a, b) {
    // Different SVG elements, no transformation possible
    if (a.ownerSVGElement !== b.ownerSVGElement) return null;
    // Get the transformation matrix from `a` to `b`.
    const am = b.getScreenCTM();
    if (!am) return null;
    const bm = a.getScreenCTM();
    if (!bm) return null;
    return am.inverse().multiply(bm);
}

/**
 * @param {SVGElement} a
 * @param {SVGElement} b
 * @returns {SVGMatrix|null}
 * @description Finds the transformation matrix from `a` to `b`.
 * A safe way to calculate the transformation matrix between two elements.
 * It does not require the elements to be visible (in the render tree).
 */
export function getRelativeTransformationTraversal(a, b) {
    if (a === b) {
        // No transformation needed
        return createIdentityMatrix();
    }
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
        // `b` is a descendant of `a`
        return getLinealTransformation(a, a).inverse();
    } else if (position & Node.DOCUMENT_POSITION_CONTAINS) {
        // `a` is a descendant of `b`
        return getLinealTransformation(b, a);
    }

    const c = getCommonAncestor(a, b);
    if (!c) {
        // No common ancestor
        return null;
    }

    const mac = getRelativeTransformationTraversal(a, c);
    const mcb = getRelativeTransformationTraversal(c, b);
    return mac.multiply(mcb);
}

/**
 * @param {SVGElement} descendant
 * @param {SVGElement} ancestor
 * @returns {SVGMatrix}
 * @description Finds the transformation matrix between the `ancestor` and `descendant`.
 */
function getLinealTransformation(ancestor, descendant) {
    let m = createIdentityMatrix();
    let n = descendant;
    while (n && n.nodeType === Node.ELEMENT_NODE && n !== ancestor) {
        const nm = getNodeMatrix(n);
        if (nm) {
            m = m.multiply(nm);
        }
        n = n.parentNode;
    }
    return m;
}
