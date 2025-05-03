import { svgDocument } from './document.mjs';
import { getCommonAncestor } from './traversal.mjs';

export function createIdentityMatrix() {
    return svgDocument.createSVGMatrix();
}

export function getMatrixNullable(node) {
    const consolidatedTransformation = node.transform.baseVal.consolidate();
    return consolidatedTransformation ? consolidatedTransformation.matrix : null;
}

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

export function getRelativeTransformationTraversal(a, b) {
    if (a === b) {
        // No transformation needed
        return createIdentityMatrix();
    }
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
        // `b` is a descendant of `a`
        return getTransformToAncestor(b, a).inverse();
    } else if (position & Node.DOCUMENT_POSITION_CONTAINS) {
        // `a` is a descendant of `b`
        return getTransformToAncestor(a, b);
    }

    const c = getCommonAncestor(a, b);
    if (!c) {
        // No common ancestor
        return null;
    }

    const mac = getRelativeTransformation(a, c);
    const mcb = getRelativeTransformation(c, b);
    return mac.multiply(mcb);
}

export function getMatrixDifference(a, b) {
    return a.inverse().multiply(b);
}


export function getTransformToAncestor(descendant, ancestor) {
    // Get the transformation matrix from `node` to `target`.
    let m = createIdentityMatrix();
    let n = descendant;
    while (n && n.nodeType === Node.ELEMENT_NODE && n !== ancestor) {
        const nm = getMatrixNullable(n);
        if (nm) {
            m = m.multiply(nm);
        }
        n = n.parentNode;
    }
    return m;
}
