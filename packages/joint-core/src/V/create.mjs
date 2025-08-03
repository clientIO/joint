import * as ns from './namespace.mjs';

/**
 * @constant {boolean}
 * @description Indicates the environment supports SVG.
 */
export const isSVGSupported = typeof window === 'object' && !!window.SVGAngle;

/**
 * @constant {string}
 * @description The version of the SVG document.
 */
export const SVG_VERSION = '1.1';

/**
 * @constant {SVGSVGElement}
 * @description The detached SVG document for various internal purposes.
 * e.g. SVGMatrix has no constructor, so the only way to create it is
 * to create an SVG document and then call `createSVGMatrix()`.
 */
export const internalSVGDocument = isSVGSupported
    ? createSVGDocument()
    : null;

/**
 * @constant {SVGGElement}
 * @description The detached SVG group element for various internal purposes.
 */
export const internalSVGGroup = isSVGSupported
    ? createSVGElement('g')
    : null;

/**
 * @returns {SVGSVGElement}
 * @description Creates an SVG document.
 */
export function createSVGDocument() {
    const svg = createSVGElement('svg');
    svg.setAttributeNS(ns.xmlns, 'xmlns:xlink', ns.xlink);
    svg.setAttribute('version', SVG_VERSION);
    return svg;
}

/**
 * @param {string} name
 * @returns {SVGElement}
 * @description Creates an SVG element with the given name.
 */
export function createSVGElement(name) {
    return document.createElementNS(ns.svg, name);
}
