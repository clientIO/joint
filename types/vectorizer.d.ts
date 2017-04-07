export function V(svg: SVGElement | string, attrs?: Object, children?:
                      Vectorizer
                      | Vectorizer[]
                      | SVGElement
                      | SVGElement[]): Vectorizer;

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
        attrs: object;
    }
    interface TextOptions {
        lineHeight: number | string;
        textPath: string | object;
        annotations: TextAnnotation[];
        includeAnnotationIndices: boolean;
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
    interface Rect extends dia.BBox {
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
    constructor(svg: string | SVGElement, attrs?: Object, children?:
                    Vectorizer
                    | Vectorizer[]
                    | SVGElement
                    | SVGElement[]);

    node: SVGElement;

    animateAlongPath(attrs: Object, path: Vectorizer | SVGElement): void;

    append(node: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]): this;

    attr(): object;
    attr(name: string): string | number | object;
    attr(name: string, value: string | number): this;
    attr(attrs: object): this;

    addClass(className: string): Vectorizer;

    bbox(withoutTransformations?: boolean, target?: SVGElement | Vectorizer): g.Rect;

    before(els: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]): this;

    clone(): Vectorizer;

    contains(el: SVGElement): boolean;

    convertToPath(): Vectorizer;

    convertToPathData(): string;

    defs(): Vectorizer | undefined;

    empty(): this;

    find(selector: string): Vectorizer[];

    findIntersection(ref: dia.Point, target: SVGElement | Vectorizer): dia.Point | undefined;

    findOne(selector: string): Vectorizer | undefined;

    findParentByClass(className: string, ternimator: SVGElement): Vectorizer | undefined;

    getTransformToElement(elem: SVGGElement | Vectorizer): SVGMatrix;

    hasClass(className: string): boolean;

    index(): number;

    prepend(els: Vectorizer | Vectorizer[] | SVGElement | SVGElement[]): this;

    remove(): this;

    removeAttr(name: string): this;

    removeClass(className: string): this;

    rotate(): Vectorizer.Rotation;

    rotate(angle: number, cx?: number, cy?: number, opt?: Vectorizer.RotateOptions): this;

    sample(interval: number): Vectorizer.Sample[];

    scale(): Vectorizer.Scale;

    scale(sx: number, sy: number): this;

    setAttribute(name: string, value: string): this;

    setAttributes(attrs: object): this;

    // returns either this or Vectorizer, no point in specifying this.
    svg(): Vectorizer;

    text(content: string, opt: Vectorizer.TextOptions): this;

    toggleClass(className: string, switchArg?: boolean): this;

    toLocalPoint(x: number, y: number): dia.Point;

    transform(): SVGMatrix;

    transform(matrix: SVGMatrix, opt?: Vectorizer.TransformOptions): this;

    translate(): Vectorizer.Translation;

    translate(tx: number, ty?: number, opt?: Vectorizer.TransformOptions): this;

    translateAndAutoOrient(position: dia.Point, reference: dia.Point, target?: SVGElement): this;

    translateCenterToPoint(p: dia.Point): void;

    static convertCircleToPathData(circle: string | SVGElement): string;

    static convertEllipseToPathData(ellipse: string | SVGElement): string;

    static convertLineToPathData(line: string | SVGElement): string;

    static convertPolylineToPathData(line: string | SVGElement): string;

    static convertPolygonToPathData(line: string | SVGElement): string;

    static convertRectToPathData(rect: string | SVGElement): string;

    static createSlicePathData(innerRadius: number, outRadius: number, startAngle: number, endAngle: number): string;

    static createSVGDocument(content: string): Document;

    static createSVGMatrix(extension: Vectorizer.Matrix): SVGMatrix;

    static createSVGPoint(x: number, y: number): SVGPoint;

    static createSVGTransform(matrix?: Vectorizer.Matrix | SVGMatrix): SVGTransform;

    static decomposeMatrix(matrix: SVGMatrix): Vectorizer.DecomposedTransformation;

    static deltaTransformPoint(matrix: SVGMatrix | Vectorizer.Matrix, point: SVGPoint | dia.Point): dia.Point;

    static ensureId(node: SVGElement): string;

    static findAnnotationsAtIndex(annotations: Vectorizer.TextAnnotation[], start: number, end: number): Vectorizer.TextAnnotation;

    static findAnnotationsBetweenIndexes(annotations: Vectorizer.TextAnnotation[], start: number, end: number): Vectorizer.TextAnnotation;

    static getPointsFromSvgNode(node: SVGElement): SVGPoint[];

    static isArray(value: any): boolean;

    static isObject(value: any): boolean;

    static isString(value: any): boolean;

    static isUndefined(value: any): boolean;

    static isV(value: any): boolean;

    static isVElement(object: any): boolean;

    static matrixToRotate(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Rotation;

    static matrixToScale(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Scale;

    static matrixToTransformString(matrix: SVGMatrix | Vectorizer.Matrix): string;

    static matrixToTranslate(matrix: SVGMatrix | Vectorizer.Matrix): Vectorizer.Translation;

    static mergeAttrs(a: Object, b: Object): Object;

    static parseTransformString(transform: string): Vectorizer.Transform;

    static parseXML(data: string, opt?: Vectorizer.ParseXMLOptions): XMLDocument;

    static qualifyAttr(name: string): Vectorizer.QualifiedAttribute;

    static rectToPath(r: Vectorizer.Rect): string;

    static sanitizeText(text: string): string;

    static shiftAnnotations(annotations: Vectorizer.TextAnnotation[], index: number, offset: number): Vectorizer.TextAnnotation[];

    static styleToObject(styleString: string): object;

    static svgPointsToPath(points: dia.Point[] | SVGPoint[]): string;

    static toNode(el: Vectorizer | SVGElement | SVGElement[]): SVGElement;

    static transformPoint(p: dia.Point | g.Point, matrix: SVGMatrix): g.Point;

    static transformRect(r: Vectorizer.Rect, matrix: SVGMatrix): g.Rect;

    static transformStringToMatrix(transform: string): SVGMatrix;

    static uniqueId(): string;
}
