export namespace g {

    interface PlainPoint {
        x: number;
        y: number;
    }

    interface PlainRect {
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

        constructor(center: PlainPoint | Point, a: number, b: number);
        constructor(ellipse: Ellipse);

        bbox(): Rect;

        clone(): Ellipse;

        normalizedDistance(point: PlainPoint | Point): number;

        inflate(dx?: number, dy?: number): this;

        containsPoint(p: PlainPoint | Point): boolean;

        center(): Point;

        tangentTheta(p: PlainPoint | Point): number;

        equals(ellipse: Ellipse): boolean;

        intersectionWithLineFromCenterToPoint(p: PlainPoint | Point, angle?: number): Point;

        toString(): string;

        static fromRect(rect: PlainRect | Rect): Ellipse;
    }

    class Line {

        start: Point;
        end: Point;

        constructor(p1: PlainPoint | Point | string, p2: PlainPoint | Point | string);
        constructor(line: Line);

        bearing(): CardinalDirection;

        clone(): Line;

        equals(line: Line): boolean;

        intersect(line: Line): Point | null;
        intersect(rect: Rect): Point[] | null;

        length(): number;

        midpoint(): Point;

        pointAt(t: number): Point;

        pointOffset(p: PlainPoint | Point): number;

        vector(): Point;

        closestPoint(p: PlainPoint | Point | string): Point;

        closestPointNormalizedLength(p: PlainPoint | Point | string): number;

        squaredLength(): number;

        toString(): string;
    }

    class Point {

        x: number;
        y: number;

        constructor(x: number, y: number);
        constructor(p: PlainPoint | Point | string);

        adhereToRect(r: Rect): this;

        bearing(p: Point): CardinalDirection;

        changeInAngle(dx: number, dy: number, ref: PlainPoint | Point | string): number;

        clone(): Point;

        difference(dx: number, dy?: number): Point;
        difference(p: PlainPoint | Point): Point;

        distance(p: PlainPoint | Point | string): number;

        squaredDistance(p: PlainPoint | Point | string): number;

        equals(p: Point): boolean;

        magnitude(): number;

        manhattanDistance(p: PlainPoint | Point): number;

        move(ref: PlainPoint | Point | string, distance: number): this;

        normalize(length: number): this;

        offset(dx: number, dy?: number): this;
        offset(p: PlainPoint | Point): this;

        reflection(ref: PlainPoint | Point | string): Point;

        rotate(origin: PlainPoint | Point | string, angle: number): this;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | Point | string): this;

        snapToGrid(gx: number, gy?: number): this;

        theta(p: PlainPoint | Point | string): number;

        angleBetween(p1: PlainPoint | Point, p2: PlainPoint | Point) : number;

        vectorAngle(p: PlainPoint | Point) : number;

        toJSON(): PlainPoint;

        toPolar(origin: PlainPoint | Point | string): this;

        toString(): string;

        update(x: number, y?: number): this;

        dot(p: PlainPoint | Point): number;

        cross(p1: PlainPoint | Point, p2: PlainPoint | Point) : number;

        static fromPolar(distance: number, angle: number, origin?: PlainPoint | Point | string): Point;

        static random(x1: number, x2: number, y1: number, y2: number): Point;
    }

    class Rect {

        x: number;
        y: number;
        width: number;
        height: number;

        constructor(x?: number, y?: number, width?: number, height?: number);
        constructor(r: PlainRect | Rect);

        bbox(angle?: number): Rect;

        bottomLeft(): Point;

        bottomLine(): Line;

        bottomMiddle(): Point;

        center(): Point;

        clone(): Rect;

        containsPoint(p: PlainPoint | Point | string): boolean;

        containsRect(r: PlainRect | Rect): boolean;

        corner(): Point;

        equals(r: PlainRect | Rect): boolean;

        intersect(r: Rect): Rect | null;

        intersectionWithLineFromCenterToPoint(p: PlainPoint | Point | string, angle?: number): Point;

        leftLine(): Line;

        leftMiddle(): Point;

        moveAndExpand(r: PlainRect | Rect): this;

        inflate(dx?: number, dy?: number): this;

        normalize(): this;

        origin(): Point;

        pointNearestToPoint(point: PlainPoint | Point | string): Point;

        rightLine(): Line;

        rightMiddle(): Point;

        round(precision?: number): this;

        scale(sx: number, sy: number, origin?: PlainPoint | Point | string): this;

        sideNearestToPoint(point: PlainPoint | Point | string): RectangleSides;

        snapToGrid(gx: number, gy?: number): this;

        topLine(): Line;

        topMiddle(): Point;

        topRight(): Point;

        toJSON(): PlainRect;

        toString(): string;

        union(rect: PlainRect | Rect): Rect;

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
            p0: string | PlainPoint | Point,
            p1: string | PlainPoint | Point,
            p2: string | PlainPoint | Point,
            p3: string | PlainPoint | Point
        ): (t: number) => [IBezierCurve, IBezierCurve];

        export function getFirectControlPoints(rhs: number[]): number[];

        export function getInversionSolver(
            p0: PlainPoint | Point,
            p1: PlainPoint | Point,
            p2: PlainPoint | Point,
            p3: PlainPoint | Point
        ): (p: PlainPoint | Point) => number;
    }

    namespace scale {

        export function linear(domain: [number, number], range: [number, number], value: number): number;
    }
}
