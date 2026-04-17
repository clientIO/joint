import type * as dia from './dia';
import type * as util from './util';

export interface SVGCoreAttributes {
    'id'?: string;
    'xml:base'?: string;
    'xml:lang'?: string;
    'xml:space'?: string;
    'tabindex'?: number;
}

export interface SVGConditionalProcessingAttributes {
    'requiredExtensions'?: boolean;
    'requiredFeatures'?: string;
    'systemLanguage'?: string;
}

export interface SVGXLinkAttributes {
    'xlink:href'?: string;
    'xlink:type'?: string;
    'xlink:role'?: string;
    'xlink:arcrole'?: string;
    'xlink:title'?: string;
    'xlink:show'?: string;
    'xlink:actuate'?: string;
}

export interface SVGPresentationAttributes {
    'alignment-baseline'?: any;
    'baseline-shift'?: any;
    'clip'?: any;
    'clip-path'?: any;
    'clip-rule'?: any;
    'color'?: any;
    'color-interpolation'?: any;
    'color-interpolation-filters'?: any;
    'color-profile'?: any;
    'color-rendering'?: any;
    'cursor'?: any;
    'direction'?: any;
    'display'?: any;
    'dominant-baseline'?: any;
    'enable-background'?: any;
    'fill'?: any;
    'fill-opacity'?: any;
    'fill-rule'?: any;
    'filter'?: any;
    'flood-color'?: any;
    'flood-opacity'?: any;
    'font-family'?: any;
    'font-size'?: any;
    'font-size-adjust'?: any;
    'font-stretch'?: any;
    'font-style'?: any;
    'font-variant'?: any;
    'font-weight'?: any;
    'glyph-orientation-horizontal'?: any;
    'glyph-orientation-vertical'?: any;
    'image-rendering'?: any;
    'kerning'?: any;
    'letter-spacing'?: any;
    'lighting-color'?: any;
    'marker-end'?: any;
    'marker-mid'?: any;
    'marker-start'?: any;
    'mask'?: any;
    'opacity'?: any;
    'overflow'?: any;
    'pointer-events'?: any;
    'shape-rendering'?: any;
    'stop-color'?: any;
    'stop-opacity'?: any;
    'stroke'?: any;
    'stroke-dasharray'?: any;
    'stroke-dashoffset'?: any;
    'stroke-linecap'?: any;
    'stroke-linejoin'?: any;
    'stroke-miterlimit'?: any;
    'stroke-opacity'?: any;
    'stroke-width'?: any;
    'text-anchor'?: any;
    'text-decoration'?: any;
    'text-rendering'?: any;
    'unicode-bidi'?: any;
    'visibility'?: any;
    'word-spacing'?: any;
    'writing-mode'?: any;
}

export interface NativeSVGAttributes extends SVGCoreAttributes, SVGPresentationAttributes, SVGConditionalProcessingAttributes, SVGXLinkAttributes {
    'class'?: string;
    'style'?: any;
    'transform'?: string;
    'externalResourcesRequired'?: boolean;

    [key: string]: any;
}

export interface SVGAttributeTextWrap {
    width?: string | number | null;
    height?: string | number | null;
    ellipsis?: boolean | string;
    separator?: string;
    hyphen?: string;
    maxLineCount?: number;
    preserveSpaces?: boolean;
    breakText?: util.BreakTextFunction;
    [key: string]: any;
    /**
     * @deprecated use SVGAttributes.text instead
     **/
    text?: string;
}

export interface SVGAttributeProps {
    checked?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    readOnly?: boolean;
    selected?: boolean;
    indeterminate?: boolean;
    contentEditable?: boolean;
    value?: any;
}

export interface SVGAttributes extends NativeSVGAttributes {
    // Special attributes
    eol?: string;
    filter?: string | dia.SVGFilterJSON;
    fill?: string | dia.SVGPatternJSON | dia.SVGGradientJSON;
    stroke?: string | dia.SVGPatternJSON | dia.SVGGradientJSON;
    sourceMarker?: dia.SVGMarkerJSON;
    targetMarker?: dia.SVGMarkerJSON;
    vertexMarker?: dia.SVGMarkerJSON;
    props?: SVGAttributeProps;
    text?: string;
    textWrap?: SVGAttributeTextWrap;
    lineHeight?: number | string;
    textPath?: any;
    annotations?: any;
    port?: string | { [key: string]: any };
    style?: { [key: string]: any };
    html?: string;
    ref?: string;
    refX?: string | number;
    refY?: string | number;
    refX2?: string | number;
    refY2?: string | number;
    refDx?: string | number;
    refDy?: string | number;
    refWidth?: string | number;
    refHeight?: string | number;
    refRx?: string | number;
    refRy?: string | number;
    refR?: string | number;
    refRInscribed?: string | number; // alias for refR
    refRCircumscribed?: string | number;
    refCx?: string | number;
    refCy?: string | number;
    refD?: string;
    refDResetOffset?: string; // alias for refD
    refDKeepOffset?: string;
    refPoints?: string;
    refPointsResetOffset?: string; // alias for refPoints
    refPointsKeepOffset?: string;
    resetOffset?: boolean;
    displayEmpty?: boolean;
    xAlignment?: 'middle' | 'right' | number | string;
    yAlignment?: 'middle' | 'bottom' | number | string;
    event?: string;
    magnet?: boolean | string;
    title?: string;
    textVerticalAnchor?: 'bottom' | 'top' | 'middle' | number | string;
    connection?: boolean | { stubs?: number };
    atConnectionLength?: number;
    atConnectionLengthKeepGradient?: number; // alias for atConnectionLength
    atConnectionLengthIgnoreGradient?: number;
    atConnectionRatio?: number;
    atConnectionRatioKeepGradient?: number; // alias for atConnectionRatio
    atConnectionRatioIgnoreGradient?: number;
    magnetSelector?: string;
    highlighterSelector?: string;
    containerSelector?: string;
    // CamelCase variants of native attributes
    alignmentBaseline?: any;
    baselineShift?: any;
    clipPath?: any;
    clipRule?: any;
    colorInterpolation?: any;
    colorInterpolationFilters?: any;
    colorProfile?: any;
    colorRendering?: any;
    dominantBaseline?: any;
    enableBackground?: any;
    fillOpacity?: any;
    fillRule?: any;
    floodColor?: any;
    floodOpacity?: any;
    fontFamily?: any;
    fontSize?: any;
    fontSizeAdjust?: any;
    fontStretch?: any;
    fontStyle?: any;
    fontVariant?: any;
    fontWeight?: any;
    glyphOrientationHorizontal?: any;
    glyphOrientationVertical?: any;
    imageRendering?: any;
    letterSpacing?: any;
    lightingColor?: any;
    markerEnd?: any;
    markerMid?: any;
    markerStart?: any;
    pointerEvents?: any;
    shapeRendering?: any;
    stopColor?: any;
    stopOpacity?: any;
    strokeDasharray?: any;
    strokeDashoffset?: any;
    strokeLinecap?: any;
    strokeLinejoin?: any;
    strokeMiterlimit?: any;
    strokeOpacity?: any;
    strokeWidth?: any;
    textAnchor?: any;
    textDecoration?: any;
    textRendering?: any;
    unicodeBidi?: any;
    wordSpacing?: any;
    writingMode?: any;
    xlinkHref?: string;
    xlinkShow?: string;
    xlinkType?: string;
    xlinkRole?: string;
    xlinkArcrole?: string;
    xlinkTitle?: string;
    xlinkActuate?: string;
    xmlSpace?: string;
    xmlBase?: string;
    xmlLang?: string;
    // Backwards compatibility
    'ref-x'?: string | number;
    'ref-y'?: string | number;
    'ref-dx'?: string | number;
    'ref-dy'?: string | number;
    'ref-width'?: string | number;
    'ref-height'?: string | number;
    'x-alignment'?: 'middle' | 'right' | number | string;
    'y-alignment'?: 'middle' | 'bottom' | number | string;
}

export interface SVGTextAttributes extends SVGAttributes {
    x?: string | number;
    y?: string | number;
    dx?: string | number;
    dy?: string | number;
    rotate?: string;
    textAnchor?: string;
    textLength?: number;
    lengthAdjust?: string;
    'text-anchor'?: string;
    'text-length'?: number;
    'length-adjust'?: string;
}

export interface SVGRectAttributes extends SVGAttributes {
    x?: string | number;
    y?: string | number;
    width?: string | number;
    height?: string | number;
    ry?: string | number;
    rx?: string | number;
}

export interface SVGCircleAttributes extends SVGAttributes {
    cx?: string | number;
    cy?: string | number;
    r?: string | number;
}

export interface SVGEllipseAttributes extends SVGAttributes {
    cx?: string | number;
    cy?: string | number;
    rx?: string | number;
    ry?: string | number;
}

export interface SVGPolygonAttributes extends SVGAttributes {
    points?: string;
}

export interface SVGPolylineAttributes extends SVGAttributes {
    points?: string;
}

export interface SVGImageAttributes extends SVGAttributes {
    x?: string | number;
    y?: string | number;
    width?: string | number;
    height?: string | number;
    preserveAspectRatio?: string;
}

export interface SVGPathAttributes extends SVGAttributes {
    d?: string;
    pathLength?: number;
    'path-length'?: number;
}

export interface SVGLineAttributes extends SVGAttributes {
    x1?: number | string;
    x2?: number | string;
    y1?: number | string;
    y2?: number | string;
    pathLength?: number;
    'path-length'?: number;
}
