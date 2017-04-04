export namespace g {

    type CardinalDirection = 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N';

    function normalizeAngle(angle: number): number;

    function snapToGrid(val: number, gridSize: number): number;

    function toDeg(rad: number): number;

    function toRad(deg: number, over360?: boolean): number;

    namespace bezier {
        function curveThroughPoints(points: dia.Point[] | Point[]): string[];

        export function getCurveControlPoints(points: dia.Point[] | Point[]): [Point[], Point[]];

        interface ICurveDivider {
            p0: Point;
            p1: Point;
            p2: Point;
            p3: Point;
        }
        export function getCurveDivider(p0: string | dia.Point | Point, p1: string | dia.Point | Point, p2:
                                            string
                                            | dia.Point
                                            | Point, p3:
                                            string
                                            | dia.Point
                                            | Point): (t: number) => [ICurveDivider, ICurveDivider];

        export function getFirectControlPoints(rhs: number[]): number[];

        export function getInversionSolver(p0: dia.Point | Point, p1: dia.Point | Point, p2: dia.Point | Point, p3:
                                               dia.Point
                                               | Point): (p: dia.Point | Point) => number;
    }

    class Ellipse {
        static fromRect(rect: Rect): Ellipse;

        x: number;
        y: number;
        a: number;
        b: number;

        constructor(c, a, b);

        bbox(): Rect;

        clone(): Ellipse;

        normalizedDistance(point: dia.Point | Point): number;

        inflate(dx: number, dy: number): this;

        containsPoint(p: dia.Point | Point): boolean;

        center(): Point;

        tangentTheta(p: dia.Point | Point): number;

        equals(ellipse: Ellipse): boolean;

        intersectionWithLineFromCenterToPoint(p: dia.Point | Point, angle: number): Point;

        toString(): string;
    }

    class Line {
        start: Point;
        end: Point;

        constructor(p1: string | dia.Point | Point, p2: string | dia.Point | Point);

        bearing(): CardinalDirection;

        clone(): Line;

        equals(line: Line): boolean;

        intersect(line: Line): Point | undefined;
        intersect(rect: Rect): Point[] | undefined;

        length(): number;

        midpoint(): Point;

        pointAt(t: number): Point;

        pointOffset(p: dia.Point | Point): number;

        squaredLength(): number;

        toString(): string;
    }

    class Point {
        static fromPolar(distance: number, angle: number, origin?: string | dia.Point | Point): Point;

        static random(x1: number, x2: number, y1: number, y2: number): Point;

        x: number;
        y: number;

        constructor(x: number | string | Point, y?: number);

        adhereToRect(r: Rect): this;

        bearing(p: Point): CardinalDirection;

        changeInAngle(dx: number, dy: number, ref: string | dia.Point | Point): number;

        clone(): Point;

        difference(dx: dia.Point | Point | number, dy?: number): Point;

        distance(p: string | dia.Point | Point): number;

        equals(p: Point): boolean;

        magnitude(): number;

        manhattanDistance(p: dia.Point | Point): number;

        move(ref: string | dia.Point | Point, distance: number): this;

        normalize(length: number): this;

        offset(dx: number | dia.Point | Point, dy?: number): this;

        reflection(ref: string | dia.Point | Point): Point;

        rotate(origin: string | dia.Point | Point, angle: number): this;

        round(precision: number): this;

        scale(sx: number, sy: number, origin: string | dia.Point | Point): this;

        snapToGrid(gx: number, gy?: number): this;

        theta(p: string | dia.Point | Point): number;

        toJSON(): dia.Point;

        toPolar(origin: string | dia.Point | Point): this;

        toString(): string;

        update(x: number, y: number): this;
    }

    class Rect {
        static fromEllipse(e: Ellipse): Rect;

        x: number;
        y: number;
        width: number;
        height: number;

        constructor(x?: number | dia.BBox, y?: number, w?: number, h?: number);

        bbox(angle: number): Rect;

        bottomLeft(): Point;

        bottomLine(): Line;

        bottomMiddle(): Point;

        center(): Point;

        clone(): Rect;

        containsPoint(p: string | dia.Point | Point): boolean;

        containsRect(r: dia.BBox | Rect): boolean;

        corner(): Point;

        equals(r: dia.BBox | Rect): boolean;

        intersect(r: Rect): Rect | undefined;

        intersectionWithLineFromCenterToPoint(p: string | dia.Point | Point, angle: number): Point;

        leftLine(): Line;

        leftMiddle(): Point;

        moveAndExpand(r: dia.BBox | Rect): this;

        inflate(dx?: number, dy?: number): this;

        normalize(): this;

        origin(): Point;

        pointNearestToPoint(point: string | dia.Point | Point): Point;

        rightLine(): Line;

        rightMiddle(): Point;

        round(precision: number): this;

        scale(sx: number, sy: number, origin?: string | dia.Point | Point): this;

        sideNearestToPoint(point: string | dia.Point | Point): 'left' | 'right' | 'top' | 'bottom';

        snapToGrid(gx: number, gy?: number): this;

        topLine(): Line;

        topMiddle(): Point;

        topRight(): Point;

        toJSON(): dia.BBox;

        toString(): string;

        union(rect: Rect): Rect;
    }

    namespace scale {
        function linear(domain: number[], range: number[], value: number): number;
    }

    function ellipse(c: number, a: number, b: number): Ellipse;

    function line(start: dia.Point | Point, end: dia.Point | Point): Line

    function point(x: number, y: number): Point;
    function point(xy: string): Point;
    function point(point: dia.Point): Point;

    function rect(x: number, y: number, w: number, h: number): Rect;
    function rect(rect: dia.BBox): Rect;
}
