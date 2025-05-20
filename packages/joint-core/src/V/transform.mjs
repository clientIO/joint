import { internalSVGDocument, internalSVGGroup } from './create.mjs';
import { getCommonAncestor } from './traverse.mjs';

/**
 * @returns {SVGMatrix}
 * @description Creates an identity matrix.
 */
export function createIdentityMatrix() {
    return internalSVGDocument.createSVGMatrix();
}

/**
 * @param {Partial<SVGMatrix>} matrixInit
 * @returns {SVGMatrix}
 * @description Creates a new SVGMatrix object.
 * If no matrix is provided, it returns the identity matrix.
 * If a matrix like object is provided, it sets the matrix values.
 */
export function createMatrix(matrixInit = {}) {
    const matrix = internalSVGDocument.createSVGMatrix();
    if (!matrixInit) return matrix;
    if ('a' in matrixInit) matrix.a = matrixInit.a;
    if ('b' in matrixInit) matrix.b = matrixInit.b;
    if ('c' in matrixInit) matrix.c = matrixInit.c;
    if ('d' in matrixInit) matrix.d = matrixInit.d;
    if ('e' in matrixInit) matrix.e = matrixInit.e;
    if ('f' in matrixInit) matrix.f = matrixInit.f;
    return matrix;
}

/**
 * @returns {SVGTransform}
 * @description Creates a new SVGTransform object.
 */
export function createSVGTransform() {
    return internalSVGDocument.createSVGTransform();
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
 * @param {string} transformString
 * @returns {SVGMatrix}
 * @description Creates a matrix from the given transform string.
 */
export function createMatrixFromTransformString(transformString) {
    internalSVGGroup.setAttribute('transform', transformString);
    return getNodeMatrix(internalSVGGroup);
}

/**
 * @param {SVGElement} node
 * @param {Partial<SVGMatrix>} matrixInit
 * @param {boolean} override
 * @description Sets the transformation matrix of the given node.
 * We don't use `node.transform.baseVal` here (@see `transformNode`)
 * for the following reasons:
 * - Performance: while Chrome performs slightly better, Firefox
 *   and Safari are significantly slower
 *   https://www.measurethat.net/Benchmarks/Show/34447/1/overriding-svg-transform-attribute
 * - Limited support: JSDOM does not support `node.transform.baseVal`
 */
export function replaceTransformNode(node, matrixInit) {
    node.setAttribute('transform', matrixToTransformString(matrixInit));
}

/**
 * @param {SVGElement} node
 * @param {Partial<SVGMatrix>} matrixInit
 * @description Applies a transformation matrix to the given node.
 * If the node already has a transformation, it appends the new transformation.
 * If the node has no transformation, it creates a new one.
 */
export function transformNode(node, matrixInit) {
    const transform = createSVGTransform();
    const matrix = isSVGMatrix(matrixInit) ? matrixInit : createMatrix(matrixInit);
    transform.setMatrix(matrix);
    node.transform.baseVal.appendItem(transform);
}

const MATRIX_TYPE = '[object SVGMatrix]';

/**
 * @param {any} obj
 * @returns {boolean}
 * @description Checks if the given object is an SVGMatrix.
 */
export function isSVGMatrix(obj) {
    return Object.prototype.toString.call(obj) === MATRIX_TYPE;
}

/**
 * @param {Partial<SVGMatrix>} matrixInit
 * @returns {string}
 * @description Converts a matrix to a transform string.
 * If no matrix is provided, it returns the identity matrix string.
 */
export function matrixToTransformString(matrixInit = {}) {
    const { a = 1, b = 0, c = 0, d = 1, e = 0, f = 0 } = matrixInit;
    return `matrix(${a},${b},${c},${d},${e},${f})`;
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
