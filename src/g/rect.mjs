import { toRad } from './geometry.helpers.mjs';
import { Line } from './line.mjs';
import { Point } from './point.mjs';
import { Ellipse } from './ellipse.mjs';
import { types } from './types.mjs';

const {
    abs,
    cos,
    sin,
    min,
    max,
    round,
    pow
} = Math;

export const Rect = function(x, y, w, h) {

    if (!(this instanceof Rect)) {
        return new Rect(x, y, w, h);
    }

    if ((Object(x) === x)) {
        y = x.y;
        w = x.width;
        h = x.height;
        x = x.x;
    }

    this.x = x === undefined ? 0 : x;
    this.y = y === undefined ? 0 : y;
    this.width = w === undefined ? 0 : w;
    this.height = h === undefined ? 0 : h;
};

Rect.fromEllipse = function(e) {

    e = new Ellipse(e);
    return new Rect(e.x - e.a, e.y - e.b, 2 * e.a, 2 * e.b);
};

Rect.fromPointUnion = function(...points) {

    if (points.length === 0) return null;

    const p = new Point();
    let minX, minY, maxX, maxY;
    minX = minY = Infinity;
    maxX = maxY = -Infinity;

    for (let i = 0; i < points.length; i++) {
        p.update(points[i]);
        const x = p.x;
        const y = p.y;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    return new Rect(minX, minY, maxX - minX, maxY - minY);
};

Rect.fromRectUnion = function(...rects) {

    if (rects.length === 0) return null;

    const r = new Rect();
    let minX, minY, maxX, maxY;
    minX = minY = Infinity;
    maxX = maxY = -Infinity;

    for (let i = 0; i < rects.length; i++) {
        r.update(rects[i]);
        const x = r.x;
        const y = r.y;
        const mX = x + r.width;
        const mY = y + r.height;

        if (x < minX) minX = x;
        if (mX > maxX) maxX = mX;
        if (y < minY) minY = y;
        if (mY > maxY) maxY = mY;
    }

    return new Rect(minX, minY, maxX - minX, maxY - minY);
};

Rect.prototype = {

    type: types.Rect,

    // Find my bounding box when I'm rotated with the center of rotation in the center of me.
    // @return r {rectangle} representing a bounding box
    bbox: function(angle) {
        return this.clone().rotateAroundCenter(angle);
    },

    rotateAroundCenter: function(angle) {
        if (!angle) return this;
        const { width, height } = this;
        const theta = toRad(angle);
        const st = abs(sin(theta));
        const ct = abs(cos(theta));
        const w = width * ct + height * st;
        const h = width * st + height * ct;
        this.x += (width - w) / 2;
        this.y += (height - h) / 2;
        this.width = w;
        this.height = h;
        return this;
    },

    bottomLeft: function() {

        return new Point(this.x, this.y + this.height);
    },

    bottomLine: function() {

        return new Line(this.bottomLeft(), this.bottomRight());
    },

    bottomMiddle: function() {

        return new Point(this.x + this.width / 2, this.y + this.height);
    },

    center: function() {

        return new Point(this.x + this.width / 2, this.y + this.height / 2);
    },

    clone: function() {

        return new Rect(this);
    },

    // @return {bool} true if point p is inside me.
    containsPoint: function(p) {
        
        if (!(p instanceof Point)) {
            p = new Point(p);
        }
        return p.x >= this.x && p.x <= this.x + this.width && p.y >= this.y && p.y <= this.y + this.height;
    },

    // @return {bool} true if rectangle `r` is inside me.
    containsRect: function(r) {

        var r0 = new Rect(this).normalize();
        var r1 = new Rect(r).normalize();
        var w0 = r0.width;
        var h0 = r0.height;
        var w1 = r1.width;
        var h1 = r1.height;

        if (!w0 || !h0 || !w1 || !h1) {
            // At least one of the dimensions is 0
            return false;
        }

        var x0 = r0.x;
        var y0 = r0.y;
        var x1 = r1.x;
        var y1 = r1.y;

        w1 += x1;
        w0 += x0;
        h1 += y1;
        h0 += y0;

        return x0 <= x1 && w1 <= w0 && y0 <= y1 && h1 <= h0;
    },

    corner: function() {

        return new Point(this.x + this.width, this.y + this.height);
    },

    // @return {boolean} true if rectangles are equal.
    equals: function(r) {

        var mr = (new Rect(this)).normalize();
        var nr = (new Rect(r)).normalize();
        return mr.x === nr.x && mr.y === nr.y && mr.width === nr.width && mr.height === nr.height;
    },

    // inflate by dx and dy, recompute origin [x, y]
    // @param dx {delta_x} representing additional size to x
    // @param dy {delta_y} representing additional size to y -
    // dy param is not required -> in that case y is sized by dx
    inflate: function(dx, dy) {

        if (dx === undefined) {
            dx = 0;
        }

        if (dy === undefined) {
            dy = dx;
        }

        this.x -= dx;
        this.y -= dy;
        this.width += 2 * dx;
        this.height += 2 * dy;

        return this;
    },

    // @return {rect} if rectangles intersect, {null} if not.
    intersect: function(r) {

        var myOrigin = this.origin();
        var myCorner = this.corner();
        var rOrigin = r.origin();
        var rCorner = r.corner();

        // No intersection found
        if (rCorner.x <= myOrigin.x ||
            rCorner.y <= myOrigin.y ||
            rOrigin.x >= myCorner.x ||
            rOrigin.y >= myCorner.y) return null;

        var x = max(myOrigin.x, rOrigin.x);
        var y = max(myOrigin.y, rOrigin.y);

        return new Rect(x, y, min(myCorner.x, rCorner.x) - x, min(myCorner.y, rCorner.y) - y);
    },

    intersectionWithLine: function(line) {

        var r = this;
        var rectLines = [r.topLine(), r.rightLine(), r.bottomLine(), r.leftLine()];
        var points = [];
        var dedupeArr = [];
        var pt, i;

        var n = rectLines.length;
        for (i = 0; i < n; i++) {

            pt = line.intersect(rectLines[i]);
            if (pt !== null && dedupeArr.indexOf(pt.toString()) < 0) {
                points.push(pt);
                dedupeArr.push(pt.toString());
            }
        }

        return points.length > 0 ? points : null;
    },

    // Find point on my boundary where line starting
    // from my center ending in point p intersects me.
    // @param {number} angle If angle is specified, intersection with rotated rectangle is computed.
    intersectionWithLineFromCenterToPoint: function(p, angle) {

        p = new Point(p);
        var center = new Point(this.x + this.width / 2, this.y + this.height / 2);
        var result;

        if (angle) p.rotate(center, angle);

        // (clockwise, starting from the top side)
        var sides = [
            this.topLine(),
            this.rightLine(),
            this.bottomLine(),
            this.leftLine()
        ];
        var connector = new Line(center, p);

        for (var i = sides.length - 1; i >= 0; --i) {
            var intersection = sides[i].intersection(connector);
            if (intersection !== null) {
                result = intersection;
                break;
            }
        }
        if (result && angle) result.rotate(center, -angle);
        return result;
    },

    leftLine: function() {

        return new Line(this.topLeft(), this.bottomLeft());
    },

    leftMiddle: function() {

        return new Point(this.x, this.y + this.height / 2);
    },

    maxRectScaleToFit: function(rect, origin) {

        rect = new Rect(rect);
        origin || (origin = rect.center());

        var sx1, sx2, sx3, sx4, sy1, sy2, sy3, sy4;
        var ox = origin.x;
        var oy = origin.y;

        // Here we find the maximal possible scale for all corner points (for x and y axis) of the rectangle,
        // so when the scale is applied the point is still inside the rectangle.

        sx1 = sx2 = sx3 = sx4 = sy1 = sy2 = sy3 = sy4 = Infinity;

        // Top Left
        var p1 = rect.topLeft();
        if (p1.x < ox) {
            sx1 = (this.x - ox) / (p1.x - ox);
        }
        if (p1.y < oy) {
            sy1 = (this.y - oy) / (p1.y - oy);
        }
        // Bottom Right
        var p2 = rect.bottomRight();
        if (p2.x > ox) {
            sx2 = (this.x + this.width - ox) / (p2.x - ox);
        }
        if (p2.y > oy) {
            sy2 = (this.y + this.height - oy) / (p2.y - oy);
        }
        // Top Right
        var p3 = rect.topRight();
        if (p3.x > ox) {
            sx3 = (this.x + this.width - ox) / (p3.x - ox);
        }
        if (p3.y < oy) {
            sy3 = (this.y - oy) / (p3.y - oy);
        }
        // Bottom Left
        var p4 = rect.bottomLeft();
        if (p4.x < ox) {
            sx4 = (this.x - ox) / (p4.x - ox);
        }
        if (p4.y > oy) {
            sy4 = (this.y + this.height - oy) / (p4.y - oy);
        }

        return {
            sx: min(sx1, sx2, sx3, sx4),
            sy: min(sy1, sy2, sy3, sy4)
        };
    },

    maxRectUniformScaleToFit: function(rect, origin) {

        var scale = this.maxRectScaleToFit(rect, origin);
        return min(scale.sx, scale.sy);
    },

    // Move and expand me.
    // @param r {rectangle} representing deltas
    moveAndExpand: function(r) {

        this.x += r.x || 0;
        this.y += r.y || 0;
        this.width += r.width || 0;
        this.height += r.height || 0;
        return this;
    },

    // Normalize the rectangle; i.e., make it so that it has a non-negative width and height.
    // If width < 0 the function swaps the left and right corners,
    // and it swaps the top and bottom corners if height < 0
    // like in http://qt-project.org/doc/qt-4.8/qrectf.html#normalized
    normalize: function() {

        var newx = this.x;
        var newy = this.y;
        var newwidth = this.width;
        var newheight = this.height;
        if (this.width < 0) {
            newx = this.x + this.width;
            newwidth = -this.width;
        }
        if (this.height < 0) {
            newy = this.y + this.height;
            newheight = -this.height;
        }
        this.x = newx;
        this.y = newy;
        this.width = newwidth;
        this.height = newheight;
        return this;
    },

    // Offset me by the specified amount.
    offset: function(dx, dy) {

        // pretend that this is a point and call offset()
        // rewrites x and y according to dx and dy
        return Point.prototype.offset.call(this, dx, dy);
    },

    origin: function() {

        return new Point(this.x, this.y);
    },

    // @return {point} a point on my boundary nearest to the given point.
    // @see Squeak Smalltalk, Rectangle>>pointNearestTo:
    pointNearestToPoint: function(point) {

        point = new Point(point);
        if (this.containsPoint(point)) {
            var side = this.sideNearestToPoint(point);
            switch (side) {
                case 'right':
                    return new Point(this.x + this.width, point.y);
                case 'left':
                    return new Point(this.x, point.y);
                case 'bottom':
                    return new Point(point.x, this.y + this.height);
                case 'top':
                    return new Point(point.x, this.y);
            }
        }
        return point.adhereToRect(this);
    },

    rightLine: function() {

        return new Line(this.topRight(), this.bottomRight());
    },

    rightMiddle: function() {

        return new Point(this.x + this.width, this.y + this.height / 2);
    },

    round: function(precision) {

        let f = 1; // case 0
        if (precision) {
            switch (precision) {
                case 1: f = 10; break;
                case 2: f = 100; break;
                case 3: f = 1000; break;
                default: f = pow(10, precision); break;
            }
        }

        this.x = round(this.x * f) / f;
        this.y = round(this.y * f) / f;
        this.width = round(this.width * f) / f;
        this.height = round(this.height * f) / f;
        return this;
    },

    // Scale rectangle with origin.
    scale: function(sx, sy, origin) {

        origin = this.origin().scale(sx, sy, origin);
        this.x = origin.x;
        this.y = origin.y;
        this.width *= sx;
        this.height *= sy;
        return this;
    },

    // @return {string} (left|right|top|bottom) side which is nearest to point
    // @see Squeak Smalltalk, Rectangle>>sideNearestTo:
    sideNearestToPoint: function(point) {

        point = new Point(point);
        var distToLeft = point.x - this.x;
        var distToRight = (this.x + this.width) - point.x;
        var distToTop = point.y - this.y;
        var distToBottom = (this.y + this.height) - point.y;
        var closest = distToLeft;
        var side = 'left';

        if (distToRight < closest) {
            closest = distToRight;
            side = 'right';
        }
        if (distToTop < closest) {
            closest = distToTop;
            side = 'top';
        }
        if (distToBottom < closest) {
            // closest = distToBottom;
            side = 'bottom';
        }
        return side;
    },

    snapToGrid: function(gx, gy) {

        var origin = this.origin().snapToGrid(gx, gy);
        var corner = this.corner().snapToGrid(gx, gy);
        this.x = origin.x;
        this.y = origin.y;
        this.width = corner.x - origin.x;
        this.height = corner.y - origin.y;
        return this;
    },

    toJSON: function() {

        return { x: this.x, y: this.y, width: this.width, height: this.height };
    },

    topLine: function() {

        return new Line(this.topLeft(), this.topRight());
    },

    topMiddle: function() {

        return new Point(this.x + this.width / 2, this.y);
    },

    topRight: function() {

        return new Point(this.x + this.width, this.y);
    },

    toString: function() {

        return this.origin().toString() + ' ' + this.corner().toString();
    },

    // @return {rect} representing the union of both rectangles.
    union: function(rect) {

        return Rect.fromRectUnion(this, rect);
    },

    update: function(x, y, w, h) {

        if ((Object(x) === x)) {
            y = x.y;
            w = x.width;
            h = x.height;
            x = x.x;
        }

        this.x = x || 0;
        this.y = y || 0;
        this.width = w || 0;
        this.height = h || 0;
        return this;
    }
};

Rect.prototype.bottomRight = Rect.prototype.corner;

Rect.prototype.topLeft = Rect.prototype.origin;

Rect.prototype.translate = Rect.prototype.offset;

// For backwards compatibility:
export const rect = Rect;
