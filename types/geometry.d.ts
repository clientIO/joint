export namespace g {

    export enum types {
        Point = 1,
        Line = 2,
        Ellipse = 3,
        Rect = 4,
        Polyline = 5,
        Polygon = 6,
        Curve = 7,
        Path = 8,
    }

    export type Shape = Path | Point | Line | Polyline | Polygon | Rect | Ellipse;
    export interface PlainPoint {

        x: number;
        y: number;
    }

    export interface PlainRect {

        x: number;
        y: number;
        width: number;
        height: number;
    }

    export interface Scale {

        sx: number;
        sy: number;
    }

    export interface PrecisionOpt {

        precision?: number;
    }

    export interface SubdivisionsOpt extends PrecisionOpt {

        subdivisions?: Curve[];
    }

    export interface SegmentSubdivisionsOpt extends PrecisionOpt {

        segmentSubdivisions?: Curve[][];
    }

    export interface PathT {

        segmentIndex: number;
        value: number;
    }

    export interface Segment {

        type: SegmentType;

        isSegment: boolean;
        isSubpathStart: boolean;
        isVisible: boolean;

        nextSegment: Segment | null;
        previousSegment: Segment | null;
        subpathStartSegment: Segment | null;

        start: Point | null | never; // getter, `never` for Moveto
        end: Point | null; // getter or directly assigned

        bbox(): Rect | null;

        clone(): Segment;

        closestPoint(p: Point, opt?: SubdivisionsOpt): Point;

        closestPointLength(p: Point, opt?: SubdivisionsOpt): number;

        closestPointNormalizedLength(p: Point, opt?: SubdivisionsOpt): number;

        closestPointT(p: Point): number;

        closestPointTangent(p: Point): Line | null;

        divideAt(ratio: number, opt?: SubdivisionsOpt): [Segment, Segment];

        divideAtLength(length: number, opt?: SubdivisionsOpt): [Segment, Segment];

        divideAtT(t: number): [Segment, Segment];

        equals(segment: Segment): boolean;

        getSubdivisions(): Curve[];

        isDifferentiable(): boolean;

        length(): number;

        lengthAtT(t: number, opt?: PrecisionOpt): number;

        pointAt(ratio: number): Point;

        pointAtLength(length: number): Point;

        pointAtT(t: number): Point;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint): this;

        tangentAt(ratio: number): Line | null;

        tangentAtLength(length: number): Line | null;

        tangentAtT(t: number): Line | null;

        translate(tx?: number, ty?: number): this;
        translate(tx: PlainPoint): this;

        serialize(): string;

        toString(): string;
    }

    export interface SegmentTypes {

        [key: string]: Segment;
    }

    type CardinalDirection = 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N';

    type RectangleSide = 'left' | 'right' | 'top' | 'bottom';

    type PathSegmentUnit = Segment | Segment[];

    type PathObjectUnit = Line | Line[] | Curve | Curve[];

    type SegmentType = 'L' | 'C' | 'M' | 'Z' | 'z';

    export function normalizeAngle(angle: number): number;

    export function snapToGrid(val: number, gridSize: number): number;

    export function toDeg(rad: number): number;

    export function toRad(deg: number, over360?: boolean): number;

    export function random(min?: number, max?: number): number;

    export interface SkeletonPoints {
        startControlPoint1: Point;
        startControlPoint2: Point;
        divider: Point;
        dividerControlPoint1: Point;
        dividerControlPoint2: Point;
    }

    class Curve {

        start: Point;
        controlPoint1: Point;
        controlPoint2: Point;
        end: Point;
        type: types.Curve;

        constructor(p1: PlainPoint | string, p2: PlainPoint | string, p3: PlainPoint | string, p4: PlainPoint | string);
        constructor(curve: Curve);

        bbox(): Rect;

        clone(): Curve;

        closestPoint(p: PlainPoint, opt?: SubdivisionsOpt): Point;

        closestPointLength(p: PlainPoint, opt?: SubdivisionsOpt): number;

        closestPointNormalizedLength(p: PlainPoint, opt?: SubdivisionsOpt): number;

        closestPointT(p: PlainPoint, opt?: SubdivisionsOpt): number;

        closestPointTangent(p: PlainPoint, opt?: SubdivisionsOpt): Line | null;

        containsPoint(p: PlainPoint, opt?: SubdivisionsOpt): boolean;

        divideAt(ratio: number, opt?: SubdivisionsOpt): [Curve, Curve];

        divideAtLength(length: number, opt?: SubdivisionsOpt): [Curve, Curve];

        divideAtT(t: number): [Curve, Curve];
        divide(t: number): [Curve, Curve]; // alias to `divideAtT`

        endpointDistance(): number;

        equals(c: Curve): boolean;

        getSkeletonPoints(t: number): SkeletonPoints;

        getSubdivisions(opt?: PrecisionOpt): Curve[];

        isDifferentiable(): boolean;

        length(opt?: SubdivisionsOpt): number;

        lengthAtT(t: number, opt?: PrecisionOpt): number;

        pointAt(ratio: number, opt?: SubdivisionsOpt): Point;

        pointAtLength(length: number, opt?: SubdivisionsOpt): Point;

        pointAtT(t: number): Point;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | string): this;

        tangentAt(ratio: number, opt?: SubdivisionsOpt): Line | null;

        tangentAtLength(length: number, opt?: SubdivisionsOpt): Line | null;

        tangentAtT(t: number): Line | null;

        tAt(ratio: number, opt?: SubdivisionsOpt): number;

        tAtLength(length: number, opt?: SubdivisionsOpt): number;

        translate(tx?: number, ty?: number): this;
        translate(tx: PlainPoint): this;

        toPoints(opt?: SubdivisionsOpt): Point[];

        toPolyline(opt?: SubdivisionsOpt): Polyline;

        toString(): string;

        static throughPoints(points: PlainPoint[]): Curve[];
    }

    class Ellipse {

        x: number;
        y: number;
        a: number;
        b: number;
        type: types.Ellipse;

        constructor(center: PlainPoint | string, a: number, b: number);
        constructor(ellipse: Ellipse);

        bbox(): Rect;

        center(): Point;

        clone(): Ellipse;

        containsPoint(p: PlainPoint): boolean;

        equals(ellipse: Ellipse): boolean;

        inflate(dx?: number, dy?: number): this;

        intersectionWithLine(l: Line): Point[] | null;

        intersectionWithLineFromCenterToPoint(p: PlainPoint, angle?: number): Point;

        normalizedDistance(point: PlainPoint): number;

        round(precision?: number): this;

        tangentTheta(p: PlainPoint): number;

        toString(): string;

        static fromRect(rect: PlainRect): Ellipse;
    }

    class Line {

        start: Point;
        end: Point;
        type: types.Line;

        constructor(p1: PlainPoint | string, p2: PlainPoint | string);
        constructor(line: Line);
        constructor();

        angle(): number;

        bbox(): Rect;

        bearing(): CardinalDirection;

        clone(): Line;

        parallel(distance: number): Line;

        closestPoint(p: PlainPoint | string): Point;

        closestPointLength(p: PlainPoint | string): number;

        closestPointNormalizedLength(p: PlainPoint | string): number;

        closestPointTangent(p: PlainPoint | string): Line | null;

        containsPoint(p: PlainPoint): boolean;

        divideAt(t: number): [Line, Line];

        divideAtLength(length: number): [Line, Line];

        equals(line: Line): boolean;

        intersect(line: Line): Point | null; // Backwards compatibility, should return an array
        intersect(rect: Rect): Point[] | null;
        intersect(ellipse: Ellipse): Point[] | null;
        intersect(polyline: Polyline): Point[] | null;
        intersect(path: Path, opt?: SegmentSubdivisionsOpt): Point[] | null;

        intersectionWithLine(l: Line): Point[] | null;

        isDifferentiable(): boolean;

        length(): number;

        midpoint(): Point;

        pointAt(t: number): Point;

        pointAtLength(length: number): Point;

        pointOffset(p: PlainPoint | string): number;

        rotate(origin: PlainPoint, angle: number): this;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint): this;

        setLength(length: number): this;

        squaredLength(): number;

        tangentAt(t: number): Line | null;

        tangentAtLength(length: number): Line | null;

        translate(tx?: number, ty?: number): this;
        translate(tx: PlainPoint): this;

        vector(): Point;

        toString(): string;

        serialize(): string;
    }

    class Path {

        segments: Segment[];
        start: Point | null; // getter
        end: Point | null; // getter
        type: types.Path;

        constructor();
        constructor(pathData: string);
        constructor(segments: PathSegmentUnit | PathSegmentUnit[]);
        constructor(objects: PathObjectUnit | PathObjectUnit[]);
        constructor(polyline: Polyline);

        appendSegment(segments: PathSegmentUnit | PathSegmentUnit[]): void;

        bbox(): Rect | null;

        clone(): Path;

        closestPoint(p: Point, opt?: SegmentSubdivisionsOpt): Point | null;

        closestPointLength(p: Point, opt?: SegmentSubdivisionsOpt): number;

        closestPointNormalizedLength(p: Point, opt?: SegmentSubdivisionsOpt): number;

        closestPointTangent(p: Point, opt?: SegmentSubdivisionsOpt): Line | null;

        containsPoint(p: PlainPoint, opt?: SegmentSubdivisionsOpt): boolean;

        divideAt(ratio: number, opt?: SegmentSubdivisionsOpt): [Path, Path] | null;

        divideAtLength(length: number, opt?: SegmentSubdivisionsOpt): [Path, Path] | null;

        equals(p: Path): boolean;

        getSegment(index: number): Segment | null;

        getSegmentSubdivisions(opt?: PrecisionOpt): Curve[][];

        getSubpaths(): Path[];

        insertSegment(index: number, segments: PathSegmentUnit | PathSegmentUnit[]): void;

        intersectionWithLine(l: Line, opt?: SegmentSubdivisionsOpt): Point[] | null;

        isDifferentiable(): boolean;

        isValid(): boolean;

        length(opt?: SegmentSubdivisionsOpt): number;

        pointAt(ratio: number, opt?: SegmentSubdivisionsOpt): Point | null;

        pointAtLength(length: number, opt?: SegmentSubdivisionsOpt): Point | null;

        removeSegment(index: number): void;

        replaceSegment(index: number, segments: PathSegmentUnit | PathSegmentUnit[]): void;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | string): this;

        segmentAt(ratio: number, opt?: SegmentSubdivisionsOpt): Segment | null;

        segmentAtLength(length: number, opt?: SegmentSubdivisionsOpt): Segment | null;

        segmentIndexAt(ratio: number, opt?: SegmentSubdivisionsOpt): number | null;

        segmentIndexAtLength(length: number, opt?: SegmentSubdivisionsOpt): number | null;

        tangentAt(ratio: number, opt?: SegmentSubdivisionsOpt): Line | null;

        tangentAtLength(length: number, opt?: SegmentSubdivisionsOpt): Line | null;

        toPoints(opt?: SegmentSubdivisionsOpt): Point[][] | null;

        toPolylines(opt?: SegmentSubdivisionsOpt): Polyline[] | null;

        translate(tx?: number, ty?: number): this;
        translate(tx: PlainPoint): this;

        serialize(): string;

        toString(): string;

        validate(): this;

        private closestPointT(p: Point, opt?: SegmentSubdivisionsOpt): PathT | null;

        private lengthAtT(t: PathT, opt?: SegmentSubdivisionsOpt): number;

        private pointAtT(t: PathT): Point | null;

        private tangentAtT(t: PathT): Line | null;

        private prepareSegment(segment: Segment, previousSegment?: Segment | null, nextSegment?: Segment | null): Segment;

        private updateSubpathStartSegment(segment: Segment): void;

        static createSegment(type: SegmentType, ...args: any[]): PathSegmentUnit;

        static parse(pathData: string): Path;

        static segmentTypes: SegmentTypes;

        static isDataSupported(pathData: string): boolean;
    }

    class Point implements PlainPoint {

        x: number;
        y: number;
        type: types.Point;

        constructor(x?: number, y?: number);
        constructor(p: PlainPoint | string);

        chooseClosest(points: PlainPoint[]): Point | null;

        adhereToRect(r: Rect): this;

        angleBetween(p1: PlainPoint, p2: PlainPoint): number;

        bearing(p: Point): CardinalDirection;

        changeInAngle(dx: number, dy: number, ref: PlainPoint | string): number;

        clone(): Point;

        cross(p1: PlainPoint, p2: PlainPoint): number;

        difference(dx?: number, dy?: number): Point;
        difference(p: PlainPoint): Point;

        distance(p: PlainPoint | string): number;

        dot(p: PlainPoint): number;

        equals(p: Point): boolean;

        lerp(p: Point, t: number): Point;

        magnitude(): number;

        manhattanDistance(p: PlainPoint): number;

        move(ref: PlainPoint | string, distance: number): this;

        normalize(length: number): this;

        offset(dx?: number, dy?: number): this;
        offset(p: PlainPoint): this;

        reflection(ref: PlainPoint | string): Point;

        rotate(origin: PlainPoint | string, angle: number): this;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | string): this;

        snapToGrid(gx: number, gy?: number): this;

        squaredDistance(p: PlainPoint | string): number;

        theta(p: PlainPoint | string): number;

        toJSON(): PlainPoint;

        toPolar(origin?: PlainPoint | string): this;

        toString(): string;

        serialize(): string;

        translate(tx?: number, ty?: number): this;
        translate(tx: PlainPoint): this;

        update(x?: number, y?: number): this;
        update(p: PlainPoint): this;

        vectorAngle(p: PlainPoint): number;

        static fromPolar(distance: number, angle: number, origin?: PlainPoint | string): Point;

        static random(x1: number, x2: number, y1: number, y2: number): Point;
    }
    abstract class PolygonalChain {

        points: Point[];
        start: Point | null; // getter
        end: Point | null; // getter

        constructor();
        constructor(svgString: string);
        constructor(points: PlainPoint[]);

        bbox(): Rect | null;

        closestPoint(p: PlainPoint | string): Point | null;

        closestPointLength(p: PlainPoint | string): number;

        closestPointNormalizedLength(p: PlainPoint | string): number;

        closestPointTangent(p: PlainPoint | string): Line | null;

        containsPoint(p: PlainPoint): boolean;

        equals(p: Polyline): boolean;

        isDifferentiable(): boolean;

        intersectionWithLine(l: Line): Point[] | null;

        close(): this;

        length(): number;

        pointAt(ratio: number): Point | null;

        pointAtLength(length: number): Point | null;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | string): this;

        simplify(opt?: { threshold?: number }): this;

        tangentAt(ratio: number): Line | null;

        tangentAtLength(length: number): Line | null;

        translate(tx?: number, ty?: number): this;
        translate(tx: PlainPoint): this;

        serialize(): string;

        toString(): string;

        clone(): this;

        convexHull(): this;
    }

    class Polyline extends PolygonalChain {

        type: types.Polyline;

        static parse(svgString: string): Polyline;

        static fromRect(rect: Rect): Polyline;
    }

    class Polygon extends PolygonalChain {

        type: types.Polygon;

        static parse(svgString: string): Polygon;

        static fromRect(rect: Rect): Polygon;
    }

    class Rect implements PlainRect {

        x: number;
        y: number;
        width: number;
        height: number;
        type: types.Rect;

        constructor(x?: number, y?: number, width?: number, height?: number);
        constructor(r: PlainRect);

        bbox(angle?: number): Rect;

        rotateAroundCenter(angle: number): this;

        bottomLeft(): Point;

        bottomLine(): Line;

        bottomMiddle(): Point;

        bottomRight(): Point;

        center(): Point;

        clone(): Rect;

        containsPoint(p: PlainPoint | string): boolean;

        containsRect(r: PlainRect): boolean;

        corner(): Point;

        equals(r: PlainRect): boolean;

        inflate(dx?: number, dy?: number): this;

        intersect(r: Rect): Rect | null;

        intersectionWithLine(l: Line): Point[] | null;

        intersectionWithLineFromCenterToPoint(p: PlainPoint | string, angle?: number): Point;

        leftLine(): Line;

        leftMiddle(): Point;

        maxRectScaleToFit(rect: PlainRect, origin?: PlainPoint): Scale;

        maxRectUniformScaleToFit(rect: PlainRect, origin?: PlainPoint): number;

        moveAndExpand(r: PlainRect): this;

        normalize(): this;

        offset(dx?: number, dy?: number): this;
        offset(p: PlainPoint): this;

        origin(): Point;

        pointNearestToPoint(point: PlainPoint | string): Point;

        rightLine(): Line;

        rightMiddle(): Point;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | string): this;

        sideNearestToPoint(point: PlainPoint | string): RectangleSide;

        snapToGrid(gx: number, gy?: number): this;

        topLeft(): Point;

        topLine(): Line;

        topMiddle(): Point;

        topRight(): Point;

        translate(tx?: number, ty?: number): this;
        translate(tx: PlainPoint): this;

        toJSON(): PlainRect;

        toString(): string;

        union(rect: PlainRect): Rect;

        update(x?: number, y?: number, width?: number, height?: number): this;
        update(rect: PlainRect): this;

        static fromEllipse(e: Ellipse): Rect;

        static fromPointUnion(...points: PlainPoint[]): Rect | null;

        static fromRectUnion(...rects: PlainRect[]): Rect | null;
    }

    namespace bezier {

        interface IBezierCurve {
            p0: Point;
            p1: Point;
            p2: Point;
            p3: Point;
        }

        export function curveThroughPoints(points: PlainPoint[] | Point[]): string[];

        export function getCurveControlPoints(points: PlainPoint[] | Point[]): [Point[], Point[]];

        export function getCurveDivider(
            p0: string | PlainPoint,
            p1: string | PlainPoint,
            p2: string | PlainPoint,
            p3: string | PlainPoint
        ): (t: number) => [IBezierCurve, IBezierCurve];

        export function getFirstControlPoints(rhs: number[]): number[];

        export function getInversionSolver(
            p0: PlainPoint,
            p1: PlainPoint,
            p2: PlainPoint,
            p3: PlainPoint
        ): (p: PlainPoint) => number;
    }

    namespace scale {

        export function linear(domain: [number, number], range: [number, number], value: number): number;
    }

    namespace intersection {

        function exists(shape1: Shape, shape2: Shape, shape1opt?: SegmentSubdivisionsOpt | null, shape2opt?: SegmentSubdivisionsOpt | null): boolean;

        /* Line */

        export function lineWithLine(line1: Line, line2: Line): boolean;

        /* Ellipse */

        export function ellipseWithLine(ellipse: Ellipse, line: Line): boolean;

        export function ellipseWithEllipse(ellipse1: Ellipse, ellipse2: Ellipse): boolean;

        /* Rect */

        export function rectWithLine(rect: Rect, line: Line): boolean;

        export function rectWithEllipse(rect: Rect, ellipse: Ellipse): boolean;

        export function rectWithRect(rect1: Rect, rect2: Rect): boolean;


        /* Polyline */

        export function polylineWithLine(polyline: Polyline, line: Line): boolean;

        export function polylineWithEllipse(polyline: Polyline, ellipse: Ellipse): boolean;

        export function polylineWithRect(polyline: Polyline, rect: Rect): boolean;

        export function polylineWithPolyline(polyline1: Polyline, polyline2: Polyline): boolean;

        /* Polygon */

        export function polygonWithLine(polygon: Polygon, line: Line): boolean;

        export function polygonWithEllipse(polygon: Polygon, ellipse: Ellipse): boolean;

        export function polygonWithRect(polygon: Polygon, rect: Rect): boolean;

        export function polygonWithPolyline(polygon: Polygon, polyline: Polyline): boolean;

        export function polygonWithPolygon(polygon1: Polygon, polygon2: Polygon): boolean;

        /* Path */

        export function pathWithLine(path: Path, line: Line, pathOpt?: SegmentSubdivisionsOpt): boolean;

        export function pathWithEllipse(path: Path, ellipse: Ellipse, pathOpt?: SegmentSubdivisionsOpt): boolean;

        export function pathWithRect(path: Path, rect: Rect, pathOpt?: SegmentSubdivisionsOpt): boolean;

        export function pathWithPolyline(path: Path, polyline: Polyline, pathOpt?: SegmentSubdivisionsOpt): boolean;

        export function pathWithPolygon(path: Path, polygon: Polygon, pathOpt?: SegmentSubdivisionsOpt): boolean;

        export function pathWithPath(path1: Path, path2: Path, pathOpt1?: SegmentSubdivisionsOpt | null, pathOpt2?: SegmentSubdivisionsOpt | null): boolean;
    }
}
