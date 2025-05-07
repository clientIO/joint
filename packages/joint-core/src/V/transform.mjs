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
 * @returns {SVGTransform}
 * @description Creates a new SVGTransform object.
 */
export function createSVGTransform() {
    return svgDocument.createSVGTransform();
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
 * @param {SVGElement} node
 * @param {SVGMatrix} matrix
 * @param {boolean} override
 * @description Sets the transformation matrix of the given node.
 * If `override` is true, it clears the existing transformation matrix.
 * If `override` is false, it appends the new transformation matrix to the existing one.
 */
export function setNodeMatrix(node, matrix, override) {
    const transform = createSVGTransform();
    transform.setMatrix(matrix);
    const transformList = node.transform.baseVal;
    if (override && transformList.numberOfItems > 0) {
        transformList.clear();
    }
    transformList.appendItem(transform);
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
    // Note: SVGSVGElement has no `ownerSVGElement`
    if ((a.ownerSVGElement || a) !== (b.ownerSVGElement || b)) return null;
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
export function getRelativeTransformationSafe(a, b) {
    if (a === b) {
        // No transformation needed
        return createIdentityMatrix();
    }
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
        // `b` is a descendant of `a`
        return getLinealTransformation(a, b).inverse();
    } else if (position & Node.DOCUMENT_POSITION_CONTAINS) {
        // `a` is a descendant of `b`
        return getLinealTransformation(b, a);
    }

    const c = getCommonAncestor(a, b);
    if (!c) {
        // No common ancestor
        return null;
    }

    const mca = getLinealTransformation(c, a);
    const mcb = getLinealTransformation(c, b);
    return mcb.inverse().multiply(mca);
}

/**
 * @param {SVGElement} descendant
 * @param {SVGElement} ancestor
 * @returns {SVGMatrix}
 * @description Finds the transformation matrix between the `ancestor` and `descendant`.
 */
function getLinealTransformation(ancestor, descendant) {
    const transformations = [];
    let n = descendant;
    while (n && n.nodeType === Node.ELEMENT_NODE && n !== ancestor) {
        const nm = getNodeMatrix(n);
        if (nm) {
            transformations.unshift(nm);
        }
        n = n.parentNode;
    }
    return transformations.reduce((m, t) => m.multiply(t), createIdentityMatrix());
}
