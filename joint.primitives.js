/**
 * Point object.
 */
function Point(x, y){
    this.x = x;
    this.y = y;
};

/**
 * If I lie outside rectangle r, return the nearest point on the boundary of rect r, 
 * otherwise return me.
 * @see Squeak Smalltalk, Point>>adhereTo:
 */
Point.prototype.adhereToRect = function(r){
    if (r.containsPoint(this))
	return this;
    this.x = Math.min(Math.max(this.x, r.x), r.x + r.width);
    this.y = Math.min(Math.max(this.y, r.y), r.y + r.height);
    return this;
};

/**
 * Compute the angle between me and p and the x axis.
 */
Point.prototype.theta = function(p){
    var y = -(p.y - this.y),	// invert the y-axis
    x = p.x - this.x,
    rad = Math.atan2(y, x);
    if (rad < 0) // correction for III. and IV. quadrant
	rad = 2*Math.PI + rad;
    return {
	degrees: 180*rad / Math.PI,
	radians: rad
    };
};

function point(x, y){ return new Point(x, y) };

/**
 * Line object.
 */
function Line(p1, p2){
    this.start = p1;
    this.end = p2;
};

/**
 * @return <point> where I intersect l.
 * @see Squeak Smalltalk, LineSegment>>intersectionWith:
 */
Line.prototype.intersection = function(l){
    var pt1Dir = point(this.end.x - this.start.x, this.end.y - this.start.y),
    pt2Dir = point(l.end.x - l.start.x, l.end.y - l.start.y),
    det = (pt1Dir.x * pt2Dir.y) - (pt1Dir.y * pt2Dir.x),
    deltaPt = point(l.start.x - this.start.x, l.start.y - this.start.y),
    alpha = (deltaPt.x * pt2Dir.y) - (deltaPt.y * pt2Dir.x),
    beta = (deltaPt.x * pt1Dir.y) - (deltaPt.y * pt1Dir.x);

    if (det == 0 ||
	alpha * det < 0 ||
	beta * det < 0)
	return null;	// no intersection

    if (det > 0){
	if (alpha > det || beta > det)
	    return null;
    } else {
	if (alpha < det || beta < det)
	    return null;
    }
    return point(this.start.x + (alpha * pt1Dir.x / det),
		 this.start.y + (alpha * pt1Dir.y / det));
}

function line(p1, p2) { return new Line(p1, p2) };

/**
 * Rectangle object.
 */
function Rect(o){
    this.x = o.x;
    this.y = o.y;
    this.width = o.width;
    this.height = o.height;
};

Rect.prototype.origin = function(){ return point(this.x, this.y) };
Rect.prototype.corner = function(){ return point(this.x + this.width, this.y + this.height) };
Rect.prototype.topRight = function(){ return point(this.x + this.width, this.y) };
Rect.prototype.bottomLeft = function(){ return point(this.x, this.y + this.height) };
Rect.prototype.center = function(){ return point(this.x + this.width/2, this.y + this.height/2) };

/**
 * @return <bool> true if rectangles intersect
 */
Rect.prototype.intersect = function(r){
    var myOrigin = this.origin();
    myCorner = this.corner(),
    rOrigin = r.origin(),
    rCorner = r.corner();
    if (rCorner.x <= myOrigin.x) return false;
    if (rCorner.y <= myOrigin.y) return false;
    if (rOrigin.x >= myCorner.x) return false;
    if (rOrigin.y >= myCorner.y) return false;
    return true;
};

/**
 * @return <string> (left|right|top|bottom) side which is nearest to point
 * @see Squeak Smalltalk, Rectangle>>sideNearestTo:
 */
Rect.prototype.sideNearestToPoint = function(p){
    var distToLeft = p.x - this.x,
    distToRight = (this.x + this.width) - p.x,
    distToTop = p.y - this.y,
    distToBottom = (this.y + this.height) - p.y,
    closest = distToLeft,
    side = "left";
    if (distToRight < closest){
	closest = distToRight;
	side = "right";
    }
    if (distToTop < closest){
	closest = distToTop;
	side = "top";
    }
    if (distToBottom < closest){
	closest = distToBottom;
	side = "bottom";
    }
    return side;
};

/**
 * @return <bool> true if point p is insight me
 */
Rect.prototype.containsPoint = function(p){
    if (p.x > this.x && p.x < this.x + this.width &&
	p.y > this.y && p.y < this.y + this.height)
	return true;
    return false;
};

/**
 * @return <point> a point on my border nearest to parameter point
 * @see Squeak Smalltalk, Rectangle>>pointNearestTo:
 */
Rect.prototype.pointNearestToPoint = function(p){
    if (this.containsPoint(p)){
	var side = this.sideNearestToPoint(p);
	switch (side){
	case "right": return point(this.x + this.width, p.y);
	case "left": return point(this.x, p.y);	    
	case "bottom": return point(p.x, this.y + this.height);
	case "top": return point(p.x, this.y);
	}
    } else
	return p.adhereToRect(this);
};

/**
 * Find point on me where line starting
 * from my center ending in point p intersects my boundary.
 */
Rect.prototype.boundPoint = function(p){
    var center = point(this.x + this.width/2, this.y + this.height/2);
    // (clockwise, starting from the top side)
    var sides = [
	line(this.origin(), this.topRight()),
	line(this.topRight(), this.corner()), 
	line(this.corner(), this.bottomLeft()),
	line(this.bottomLeft(), this.origin())
    ],
    connector = line(center, p);
    for (var i = sides.length - 1; i >= 0; --i){
	var intersection = sides[i].intersection(connector);
	if (intersection !== null)
	    return intersection;
    }
    // assert(false)
};

/**
 * Move and expand me.
 * @param r <rectangle> representing deltas
 */
Rect.prototype.moveAndExpand = function(r){
    this.x += r.x;
    this.y += r.y;
    this.width += r.width;
    this.height += r.height;
    return this;
};

function rect(o){ return new Rect(o) };

/**
 * Ellipse object.
 */
function Ellipse(x, y, a, b){
    this.x = x;
    this.y = y;
    this.a = a;
    this.b = b;
};

Ellipse.prototype.bbox = function(){
    return rect({x: this.x - this.a, y: this.y - this.b, width: 2*this.a, height: 2*this.b});
};

/**
 * Find point on me where line from my center to
 * point p intersects my boundary.
 * @see Squeak Smalltalk, EllipseMorph>>intersectionWithLineSegmentFromCenterTo:    
 */
Ellipse.prototype.intersectionWithLineFromCenterToPoint = function(p){
    var dx = p.x - this.x,
    dy = p.y - this.y;
    if (dx == 0)
	return this.bbox().pointNearestToPoint(p);

    var m = dy / dx,
    mSquared = m * m,
    aSquared = this.a * this.a,
    bSquared = this.b * this.b,
    x = Math.sqrt(1 / ((1 / aSquared) + (mSquared / bSquared)));
    if (dx < 0) 
	x = -x;
    var y = m * x;
    return point(this.x + x, this.y + y);
};

function ellipse(x, y, a, b){ return new Ellipse(x, y, a, b) };
