export function V(
    svg: SVGElement | string,
    attrs?: { [key: string]: any },
    children?: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]
): Vectorizer;

export namespace Vectorizer {

    interface RotateOptions {
        absolute: boolean;
    }

    interface Sample {
        x: number;
        y: number;
        distance: number;
    }

    interface TextAnnotation {
        start: number;
        end: number;
        attrs: { [key: string]: any };
    }

    interface TextOptions {
        eol: string,
        x: number,
        lineHeight: number | string;
        textPath: string | { [key: string]: any };
        annotations: TextAnnotation[];
        includeAnnotationIndices: boolean;
    }

    interface BBoxOptions {
        target: SVGElement | Vectorizer,
        recursive: boolean
    }

    interface TransformOptions {
        absolute: boolean;
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

    interface DecomposedTransformation {
        translateX: number;
        translateY: number;
        scaleX: number;
        scaleY: number;
        skewX: number;
        skewY: number;
        rotation: number;
    }

    interface Rect extends g.PlainRect {
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

    interface ParseXMLOptions {
        async: boolean;
    }

    interface QualifiedAttribute {
        ns?: string;
        local: string;
    }
}

export class Vectorizer {

    node: SVGElement;

    constructor(
        svg: string | SVGElement,
        attrs?: { [key: string]: any },
        children?: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]
    );

    getTransformToElement(elem: SVGGElement | Vectorizer): SVGMatrix;

    transform(): SVGMatrix;
    transform(matrix: SVGMatrix | Vectorizer.Matrix, opt?: Vectorizer.TransformOptions): this;

    translate(): Vectorizer.Translation;
    translate(tx: number, ty?: number, opt?: Vectorizer.TransformOptions): this;

    rotate(): Vectorizer.Rotation;
    rotate(angle: number, cx?: number, cy?: number, opt?: Vectorizer.RotateOptions): this;

    scale(): Vectorizer.Scale;
    scale(sx: number, sy: number): this;

    bbox(withoutTransformations?: boolean, target?: SVGElement | Vectorizer): g.Rect;

    getBBox(opt?: Vectorizer.BBoxOptions) : g.Rect;

    text(content: string, opt?: Vectorizer.TextOptions): this;

    removeAttr(name: string): this;

    attr(): { [key: string]: string };
    attr(name: string): string | null;
    attr(name: string, value: any): this;
    attr(attrs: { [key: string]: any }): this;

    remove(): this;

    empty(): this;

    private setAttributes(attrs: { [key: string]: any }): this;

    append(els: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]): this;

    prepend(els: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]): this;

    before(els: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]): this;

    appendTo(el: Vectorizer | SvgElement) : this;

    // returns either this or Vectorizer, no point in specifying this.
    svg(): Vectorizer;

    defs(): Vectorizer | undefined;

    clone(): Vectorizer;

    findOne(selector: string): Vectorizer | undefined;

    find(selector: string): Vectorizer[];

    children(): Vectorizer[];

    index(): number;

    findParentByClass(className: string, terminator?: SVGElement): Vectorizer | null;

    contains(el: Vectorizer | SVGElement): boolean;

    toLocalPoint(x: number, y: number): SVGPoint;

    translateCenterToPoint(p: g.PlainPoint): this;

    translateAndAutoOrient(
        position: g.PlainPoint,
        reference: g.PlainPoint,
        target?: Vectorizer | SVGElement
    ): this;

    animateAlongPath(attrs: { [key: string]: any }, path: Vectorizer | SVGElement): void;

    hasClass(className: string): boolean;

    addClass(className: string): Vectorizer;

    removeClass(className: string): this;

    toggleClass(className: string, switchArg?: boolean): this;

    sample(interval?: number): Vectorizer.Sample[];

    convertToPath(): Vectorizer;

    convertToPathData(): string;

    findIntersection(ref: g.PlainPoint, target: SVGElement | Vectorizer): g.PlainPoint | undefined;

    private setAttribute(name: string, value: string): this;

    static createSVGDocument(content: string): Document;

    static uniqueId(): string;

    static sanitizeText(text: string): string;

    static isUndefined(value: any): boolean;

    static isString(value: any): boolean;

    static isObject(value: any): boolean;

    static isArray(value: any): boolean;

    static parseXML(data: string, opt?: Vectorizer.ParseXMLOptions): XMLDocument;

    static qualifyAttr(name: string): Vectorizer.QualifiedAttribute;

    static transformStringToMatrix(transform: string): SVGMatrix;

    static matrixToTransformString(matrix: SVGMatrix | Vectorizer.Matrix): string;

    static parseTransformString(transform: string): Vectorizer.Transform;

    static deltaTransformPoint(
        matrix: SVGMatrix | Vectorizer.Matrix,
        point: SVGPoint | g.PlainPoint
    ): g.PlainPoint;

    static decomposeMatrix(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.DecomposedTransformation;

    static matrixToScale(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Scale;

    static matrixToRotate(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Rotation;

    static matrixToTranslate(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Translation;

    static isV(value: any): boolean;

    static createSVGMatrix(matrix: SVGMatrix | Vectorizer.Matrix): SVGMatrix;

    static createSVGTransform(matrix?: SVGMatrix | Vectorizer.Matrix): SVGTransform;

    static createSVGPoint(x: number, y: number): SVGPoint;

    static transformRect(r: g.PlainRect | g.Rect | Vectorizer.Rect, matrix: SVGMatrix): g.Rect;

    static transformPoint(p: g.PlainPoint | g.Point, matrix: SVGMatrix): g.Point;

    static styleToObject(styleString: string): { [key: string]: string };

    static createSlicePathData(innerRadius: number, outRadius: number, startAngle: number, endAngle: number): string;



    static convertCircleToPathData(circle: string | SVGElement): string;

    static convertEllipseToPathData(ellipse: string | SVGElement): string;

    static convertLineToPathData(line: string | SVGElement): string;

    static convertPolylineToPathData(line: string | SVGElement): string;

    static convertPolygonToPathData(line: string | SVGElement): string;

    static convertRectToPathData(rect: string | SVGElement): string;

    static ensureId(node: SVGElement): string;

    static findAnnotationsAtIndex(annotations: Vectorizer.TextAnnotation[], start: number, end: number): Vectorizer.TextAnnotation;

    static findAnnotationsBetweenIndexes(annotations: Vectorizer.TextAnnotation[], start: number, end: number): Vectorizer.TextAnnotation;

    static getPointsFromSvgNode(node: SVGElement): SVGPoint[];

    static isVElement(object: any): boolean;

    static mergeAttrs(a: any, b: any): any;

    static rectToPath(r: Vectorizer.Rect): string;

    static shiftAnnotations(annotations: Vectorizer.TextAnnotation[], index: number, offset: number): Vectorizer.TextAnnotation[];

    static svgPointsToPath(points: dia.Point[] | SVGPoint[]): string;

    static toNode(el: Vectorizer | SVGElement | SVGElement[]): SVGElement;
}
