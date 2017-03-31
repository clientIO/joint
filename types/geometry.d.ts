export namespace g {

    type CardinalDirection = 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N';

    function normalizeAngle(angle: number): number;

    function snapToGrid(val: number, gridSize: number): number;

    function toDeg(rad: number): number;

    function toRad(deg: number, over360?: boolean): number;

    namespace bezier {
        // TODO
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

        normalizedDistance(point: Point): number;

        inflate(dx: number, dy: number): Ellipse

        containsPoint(p: Point): boolean;

        center(): Point;

        tangentTheta(p: Point): number;

        equals(ellipse: Ellipse): boolean;

        intersectionWithLineFromCenterToPoint(p: Point, angle: number): Point;

        toString(): string;
    }

    class Line {
        start: Point;
        end: Point;

        constructor(p1: Point, p2: Point);

        bearing(): CardinalDirection;

        clone(): Line;

        equals(line: Line): boolean;

        intersect(line: Line): Point;
        intersect(rect: Rect): Point[];

        length(): number;

        midpoint(): Point;

        pointAt(t: number): Point;

        pointOffset(p: Point): number;

        squaredLength(): number;
    }

    class Point {
        static fromPolar(distance: number, angle: number, origin: Point): Point;

        static random(distance, angle, origin): Point;

        x: number;
        y: number;

        constructor(x: number | string | Point, y?: number);

        adhereToRect(r: Rect): Point;

        bearing(p: Point): CardinalDirection;

        changeInAngle(dx, dy, ref) //FIXME
        clone(): Point;

        difference(dx: number, dy: number): Point;

        distance(p: Point): number;

        equals(p: Point): boolean;

        magnitude(): number;

        manhattanDistance(): number;

        move(ref, distance): Point;

        normalize(length: number): Point;

        offset(dx: number, dy?: number): Point;

        reflection(ref: Point): Point;

        rotate(origin: Point, angle: number): Point;

        round(precision: number): Point;

        scale(sx: number, sy: number, origin: Point): Point;

        snapToGrid(gx: number, gy?: number): Point;

        theta(p: Point): number;

        toJSON(): any;

        toPolar(origin: Point): Point;

        toString(): string;

        update(x: number, y: number): Point;
    }

    class Rect {
        static fromEllipse(e: Ellipse): Rect;

        constructor(x, y, w, h);

        bbox(angle: number): Rect;

        bottomLeft(): Point;

        bottomLine(): Line;

        bottomMiddle(): Point;

        center(): Point;

        clone(): Rect;

        containsPoint(p: Point): boolean;

        containsRect(r: Rect): boolean;

        corner(): Point;

        equals(r: Rect): Rect;

        intersect(r: Rect): Rect;

        intersectionWithLineFromCenterToPoint(p: Point, angle: number): Point;

        leftLine(): Line;

        leftMiddle(): Point;

        moveAndExpand(r: Rect): Rect;

        inflate(dx: number, dy: number): Rect;

        normalize(): Rect;

        origin(): Point;

        pointNearestToPoint(point: Point): Point;

        rightLine(): Line;

        rightMiddle(): Point;

        round(precision: number): Rect;

        scale(sx: number, sy: number, origin: Point): Rect;

        sideNearestToPoint(point: Point): 'left' | 'right' | 'top' | 'bottom';

        snapToGrid(gx: number, gy: number): Rect;

        topLine(): Line;

        topMiddle(): Point;

        topRight(): Point;

        toJSON(): any;

        union(rect: Rect): Rect;
    }

    namespace scale {
        function linear(domain: number[], range: number[], value: number): number;
    }

    interface IPoint {
        x:number;
        y:number;
    }

    interface IBBox extends IPoint{
        width:number;
        height:number;
    }

    function ellipse(c: number, a: number, b: number): Ellipse;

    function line(start: IPoint | Point, end: IPoint | Point): Line

    function point(x: number, y: number): Point;
    function point(xy: string): Point;
    function point(point: IPoint): Point;

    function rect(x,y,w,h): Rect;
    function rect(rect:IBBox): Rect;
}
