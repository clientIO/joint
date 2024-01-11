import { g } from './geometry';

export const V: VCallable;
export type V = VElement;

export const Vectorizer: VCallable;
export type Vectorizer = VElement;

export namespace Vectorizer {
    interface RotateOptions {
        absolute?: boolean;
    }

    interface AnnotateStringOptions {
        includeAnnotationIndices?: boolean;
        offset?: number;
    }

    type TextVerticalAnchor = 'top' | 'bottom' | 'middle';

    interface TextOptions {
        eol?: string;
        x?: number | string;
        textVerticalAnchor?: TextVerticalAnchor | number | string;
        lineHeight?: number | string;
        textPath?: string | { [key: string]: any };
        annotations?: TextAnnotation[];
        includeAnnotationIndices?: boolean;
        displayEmpty?: boolean;
    }

    interface GetBBoxOptions {
        target?: SVGElement | VElement;
        recursive?: boolean;
    }

    interface TransformOptions {
        absolute?: boolean;
    }

    interface ParseXMLOptions {
        async?: boolean;
    }

    interface TextAnnotation {
        start: number;
        end: number;
        attrs: { [key: string]: any };
    }

    // modifiable Matrix. SVGMatrix doesn't allow set on properties or a constructor.
    interface Matrix {
        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        f: number;
    }

    interface Sample {
        x: number;
        y: number;
        distance: number;
    }

    interface DecomposedTransformation {
        translateX: number;
        translateY: number;
        scaleX: number;
        scaleY: number;
        skewX: number;
        skewY: number;
        rotation: number;
    }

    interface RoundedRect extends g.PlainRect {
        'rx'?: number;
        'ry'?: number;
        'top-rx'?: number;
        'top-ry'?: number;
        'bottom-rx'?: number;
        'bottom-ry'?: number;
    }

    interface Rotation {
        angle: number;
        cx?: number;
        cy?: number;
    }

    interface Translation {
        tx: number;
        ty: number;
    }

    interface Scale {
        sx: number;
        sy: number;
    }

    interface Transform {
        value: string;
        translate: Translation;
        rotate: Rotation;
        scale: Scale;
    }

    interface QualifiedAttribute {
        ns: string | null;
        local: string;
    }
}

interface VCallable extends VStatic {

    (
        svg: SVGElement | VElement | string,
        attrs?: { [key: string]: any },
        children?: VElement | VElement[] | SVGElement | SVGElement[]
    ): VElement;
}

export class VElement {

    id: string;
    node: SVGElement;

    getTransformToElement(toElem: SVGGElement | VElement): SVGMatrix;

    transform(): SVGMatrix;
    transform(matrix: SVGMatrix | Vectorizer.Matrix, opt?: Vectorizer.TransformOptions): this;

    translate(): Vectorizer.Translation;
    translate(tx: number, ty?: number, opt?: Vectorizer.TransformOptions): this;

    rotate(): Vectorizer.Rotation;
    rotate(angle: number, cx?: number, cy?: number, opt?: Vectorizer.RotateOptions): this;

    scale(): Vectorizer.Scale;
    scale(sx: number, sy?: number): this;

    bbox(withoutTransformations?: boolean, target?: SVGElement | VElement): g.Rect;

    getBBox(opt?: Vectorizer.GetBBoxOptions): g.Rect;

    text(content: string, opt?: Vectorizer.TextOptions): this;

    removeAttr(name: string): this;

    attr(): { [key: string]: string };
    attr(name: string): string | null;
    attr(name: string, value: any): this;
    attr(attrs: { [key: string]: any }): this;

    normalizePath(): this;

    remove(): this;

    empty(): this;

    append(els: VElement | VElement[] | SVGElement | SVGElement[]): this;

    prepend(els: VElement | VElement[] | SVGElement | SVGElement[]): this;

    before(els: VElement | VElement[] | SVGElement | SVGElement[]): this;

    appendTo(el: SVGElement | VElement): this;

    parent(): VElement | null;

    // returns either this or VElement, no point in specifying this.
    svg(): VElement;

    tagName(): string;

    defs(): VElement | undefined;

    clone(): VElement;

    findOne(selector: string): VElement | undefined;

    find(selector: string): VElement[];

    children(): VElement[];

    index(): number;

    findParentByClass(className: string, terminator?: SVGElement): VElement | null;

    contains(el: SVGElement | VElement): boolean;

    toLocalPoint(x: number, y: number): SVGPoint;

    translateCenterToPoint(p: g.PlainPoint): this;

    translateAndAutoOrient(position: g.PlainPoint, reference: g.PlainPoint, target?: SVGElement | VElement): this;

    animateAlongPath(attrs: { [key: string]: any }, path: SVGElement | VElement): void;

    hasClass(className: string): boolean;

    addClass(className: string): VElement;

    removeClass(className: string): this;

    toggleClass(className: string, switchArg?: boolean): this;

    sample(interval?: number): Vectorizer.Sample[];

    convertToPath(): VElement;

    convertToPathData(): string;

    findIntersection(ref: g.PlainPoint, target: SVGElement | VElement): g.PlainPoint | undefined;

    toGeometryShape(): g.Shape;

    private setAttributes(attrs: { [key: string]: any }): this;

    private setAttribute(name: string, value: string): this;
}

interface VStatic {

    createSVGDocument(content: string): Document;

    createSVGStyle(stylesheet: string): SVGStyleElement;

    createCDATASection(data: string): CDATASection;

    uniqueId(): string;

    ensureId(node: SVGElement | VElement): string;

    sanitizeText(text: string): string;

    isUndefined(value: any): boolean;

    isString(value: any): boolean;

    isObject(value: any): boolean;

    isArray(value: any): boolean;

    parseXML(data: string, opt?: Vectorizer.ParseXMLOptions): XMLDocument;

    qualifyAttr(name: string): Vectorizer.QualifiedAttribute;

    transformStringToMatrix(transform: string): SVGMatrix;

    matrixToTransformString(matrix: SVGMatrix | Vectorizer.Matrix): string;

    parseTransformString(transform: string): Vectorizer.Transform;

    deltaTransformPoint(matrix: SVGMatrix | Vectorizer.Matrix, point: SVGPoint | g.PlainPoint): g.PlainPoint;

    decomposeMatrix(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.DecomposedTransformation;

    matrixToScale(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Scale;

    matrixToRotate(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Rotation;

    matrixToTranslate(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Translation;

    isV(value: any): boolean;

    isVElement(value: any): boolean;

    isSVGGraphicsElement(value: any): boolean;

    createSVGMatrix(matrix?: SVGMatrix | Partial<Vectorizer.Matrix>): SVGMatrix;

    createSVGTransform(matrix?: SVGMatrix | Partial<Vectorizer.Matrix>): SVGTransform;

    createSVGPoint(x: number, y: number): SVGPoint;

    transformRect(r: g.PlainRect, matrix: SVGMatrix): g.Rect;

    transformPoint(p: g.PlainPoint, matrix: SVGMatrix): g.Point;

    transformLine(p: g.Line, matrix: SVGMatrix): g.Line;

    transformPolyline(p: g.Polyline | g.PlainPoint[], matrix: SVGMatrix): g.Polyline;

    styleToObject(styleString: string): { [key: string]: string };

    createSlicePathData(innerRadius: number, outRadius: number, startAngle: number, endAngle: number): string;

    mergeAttrs(a: any, b: any): any;

    annotateString(t: string, annotations: Vectorizer.TextAnnotation[], opt?: Vectorizer.AnnotateStringOptions): Array< string | { [key: string]: any }> ;

    findAnnotationsAtIndex(annotations: Vectorizer.TextAnnotation[], index: number): Vectorizer.TextAnnotation[];

    findAnnotationsBetweenIndexes(annotations: Vectorizer.TextAnnotation[], start: number, end: number): Vectorizer.TextAnnotation[];

    shiftAnnotations(annotations: Vectorizer.TextAnnotation[], index: number, offset: number): Vectorizer.TextAnnotation[];

    convertLineToPathData(line: string | SVGElement | VElement): string;

    convertPolygonToPathData(line: string | SVGElement | VElement): string;

    convertPolylineToPathData(line: string | SVGElement | VElement): string;

    svgPointsToPath(points: g.PlainPoint[] | SVGPoint[]): string;

    getPointsFromSvgNode(node: SVGElement | VElement): SVGPoint[];

    convertCircleToPathData(circle: string | SVGElement | VElement): string;

    convertEllipseToPathData(ellipse: string | SVGElement | VElement): string;

    convertRectToPathData(rect: string | SVGElement | VElement): string;

    rectToPath(r: Vectorizer.RoundedRect): string;

    normalizePathData(path: string): string;

    toNode(el: SVGElement | VElement | SVGElement[]): SVGElement;

    prototype: VElement;

    attributeNames: { [key: string]: string };

    supportCamelCaseAttributes: boolean;
}
