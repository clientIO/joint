export namespace g {

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

    type CardinalDirection = 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N';

    type RectangleSides = 'left' | 'right' | 'top' | 'bottom';

    export function normalizeAngle(angle: number): number;

    export function snapToGrid(val: number, gridSize: number): number;

    export function toDeg(rad: number): number;

    export function toRad(deg: number, over360?: boolean): number;

    class Ellipse {

        x: number;
        y: number;
        a: number;
        b: number;

        constructor(center: PlainPoint, a: number, b: number);
        constructor(ellipse: Ellipse);

        bbox(): Rect;

        clone(): Ellipse;

        normalizedDistance(point: PlainPoint): number;

        inflate(dx?: number, dy?: number): this;

        containsPoint(p: PlainPoint): boolean;

        center(): Point;

        tangentTheta(p: PlainPoint): number;

        equals(ellipse: Ellipse): boolean;

        intersectionWithLineFromCenterToPoint(p: PlainPoint, angle?: number): Point;

        toString(): string;

        static fromRect(rect: PlainRect): Ellipse;
    }

    class Line {

        start: Point;
        end: Point;

        constructor(p1: PlainPoint | string, p2: PlainPoint | string);
        constructor(line: Line);

        bearing(): CardinalDirection;

        clone(): Line;

        equals(line: Line): boolean;

        intersect(line: Line): Point | null;
        intersect(rect: Rect): Point[] | null;

        length(): number;

        midpoint(): Point;

        pointAt(t: number): Point;

        pointOffset(p: PlainPoint): number;

        vector(): Point;

        closestPoint(p: PlainPoint | string): Point;

        closestPointNormalizedLength(p: PlainPoint | string): number;

        squaredLength(): number;

        toString(): string;
    }

    class Point implements PlainPoint {

        x: number;
        y: number;

        constructor(x: number, y: number);
        constructor(p: PlainPoint | string);

        adhereToRect(r: Rect): this;

        bearing(p: Point): CardinalDirection;

        changeInAngle(dx: number, dy: number, ref: PlainPoint | string): number;

        clone(): Point;

        difference(dx: number, dy?: number): Point;
        difference(p: PlainPoint): Point;

        distance(p: PlainPoint | string): number;

        squaredDistance(p: PlainPoint | string): number;

        equals(p: Point): boolean;

        magnitude(): number;

        manhattanDistance(p: PlainPoint): number;

        move(ref: PlainPoint | string, distance: number): this;

        normalize(length: number): this;

        offset(dx: number, dy?: number): this;
        offset(p: PlainPoint): this;

        reflection(ref: PlainPoint | string): Point;

        rotate(origin: PlainPoint | string, angle: number): this;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | string): this;

        snapToGrid(gx: number, gy?: number): this;

        theta(p: PlainPoint | string): number;

        angleBetween(p1: PlainPoint, p2: PlainPoint) : number;

        vectorAngle(p: PlainPoint) : number;

        toJSON(): PlainPoint;

        toPolar(origin: PlainPoint | string): this;

        toString(): string;

        update(x: number, y?: number): this;

        dot(p: PlainPoint): number;

        cross(p1: PlainPoint, p2: PlainPoint) : number;

        static fromPolar(distance: number, angle: number, origin?: PlainPoint | string): Point;

        static random(x1: number, x2: number, y1: number, y2: number): Point;
    }

    class Rect implements PlainRect {

        x: number;
        y: number;
        width: number;
        height: number;

        constructor(x?: number, y?: number, width?: number, height?: number);
        constructor(r: PlainRect);

        bbox(angle?: number): Rect;

        bottomLeft(): Point;

        bottomLine(): Line;

        bottomMiddle(): Point;

        center(): Point;

        clone(): Rect;

        containsPoint(p: PlainPoint | string): boolean;

        containsRect(r: PlainRect): boolean;

        corner(): Point;

        equals(r: PlainRect): boolean;

        intersect(r: Rect): Rect | null;

        intersectionWithLineFromCenterToPoint(p: PlainPoint | string, angle?: number): Point;

        leftLine(): Line;

        leftMiddle(): Point;

        moveAndExpand(r: PlainRect): this;

        offset(dx: number, dy?: number): this;
        offset(p: PlainPoint): this;

        inflate(dx?: number, dy?: number): this;

        normalize(): this;

        origin(): Point;

        pointNearestToPoint(point: PlainPoint | string): Point;

        rightLine(): Line;

        rightMiddle(): Point;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | string): this;

        sideNearestToPoint(point: PlainPoint | string): RectangleSides;

        snapToGrid(gx: number, gy?: number): this;

        topLine(): Line;

        topMiddle(): Point;

        topRight(): Point;

        toJSON(): PlainRect;

        toString(): string;

        union(rect: PlainRect): Rect;

        static fromEllipse(e: Ellipse): Rect;
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

        export function getFirectControlPoints(rhs: number[]): number[];

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
}
