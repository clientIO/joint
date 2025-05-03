import * as ns from './namespace.mjs';

export const SVGVersion = '1.1';

export const svgDocument = createSVGDocument();

export function createSVGDocument() {
    const svg = document.createElementNS(ns.svg, 'svg');
    svg.setAttributeNS(ns.xmlns, 'xmlns:xlink', ns.xlink);
    svg.setAttribute('version', SVGVersion);
    return svg;
}

