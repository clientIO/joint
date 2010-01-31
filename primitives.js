/**
 * @fileoverview Geometry-Primitives.
 * @author David Durman
 * @version 0.0.1
 */

/**
 * Point object.
 * @constructor
 */
function Point(x, y){
    this.x = x;
    this.y = y;
}
function point(x, y){ return new Point(x, y); }

Point.prototype = {
    constructor: Point,
    _isPoint: true,

    toString: function(){ return this.x + "@" + this.y; },

    deepCopy: function(){ return point(this.x, this.y); },
    /**
     * If I lie outside rectangle r, return the nearest point on the boundary of rect r, 
     * otherwise return me.
     * (see Squeak Smalltalk, Point>>adhereTo:)
     * @param {Rect} r 
     * @return {Point}
     */
    adhereToRect: function(r){
	if (r.containsPoint(this)){
	    return this;
	}
	this.x = Math.min(Math.max(this.x, r.x), r.x + r.width);
	this.y = Math.min(Math.max(this.y, r.y), r.y + r.height);
	return this;
    },

    /**
     * Compute the angle between me and p and the x axis.
     * (cartesian-to-polar coordinates conversion)
     * @param {Point} p
     * @return {object} theta in degrees and radians
     */
    theta: function(p){
	var y = -(p.y - this.y),	// invert the y-axis
	x = p.x - this.x,
	rad = Math.atan2(y, x);
	if (rad < 0){ // correction for III. and IV. quadrant
	    rad = 2*Math.PI + rad;
	}
	return {
	    degrees: 180*rad / Math.PI,
	    radians: rad
	};
    },

    /**
     * @return {number} distance between me and point p
     */
    distance: function(p){
	return line(this, p).length();
    },

    /**
     * Offset me by the specified amount.
     */
    offset: function(dx, dy){
	this.x += dx;
	this.y += dy;
	return this;
    },

    /**
     * Scale the line segment between (0,0) and me to have a length of len
     */
    normalize: function(len){
	var s = len / Math.sqrt((this.x*this.x) + (this.y*this.y));
	this.x = s * this.x;
	this.y = s * this.y;
	return this;
    }
};

/**
 * Alternative constructor, from polar coordinates.
 */
Point.fromPolar = function(r, angle){
    return point(r * Math.cos(angle), r * Math.sin(angle));
};


/**
 * Line object.
 */
function Line(p1, p2){
    this.start = p1;
    this.end = p2;
}

function line(p1, p2) { return new Line(p1, p2); }

Line.prototype = {
    constructor: Line,

    toString: function(){
	return "start: " + this.start.toString() + " end:" + this.end.toString();
    },

    /**
     * @return <double> length of the line
     */
    length: function(){ return Math.sqrt(this.squaredLength()); },

    /**
     * @return <integer> length without sqrt
     * @note for applications where the exact length is not necessary (e.g. compare only)
     */
    squaredLength: function(){
	var 
	x0 = this.start.x, y0 = this.start.y,
	x1 = this.end.x, y1 = this.end.y;
	return (x0 -= x1)*x0 + (y0 -= y1)*y0;
    },

    /**
     * @return <point> my midpoint 
     */
    midpoint: function(){
	return point((this.start.x + this.end.x) / 2,
		     (this.start.y + this.end.y) / 2);
    },


    /**
     * @return <point> where I intersect l.
     * @see Squeak Smalltalk, LineSegment>>intersectionWith:
     */
    intersection: function(l){
	var pt1Dir = point(this.end.x - this.start.x, this.end.y - this.start.y),
	pt2Dir = point(l.end.x - l.start.x, l.end.y - l.start.y),
	det = (pt1Dir.x * pt2Dir.y) - (pt1Dir.y * pt2Dir.x),
	deltaPt = point(l.start.x - this.start.x, l.start.y - this.start.y),
	alpha = (deltaPt.x * pt2Dir.y) - (deltaPt.y * pt2Dir.x),
	beta = (deltaPt.x * pt1Dir.y) - (deltaPt.y * pt1Dir.x);

	if (det === 0 ||
	    alpha * det < 0 ||
	    beta * det < 0){
	    return null;	// no intersection
	}

	if (det > 0){
	    if (alpha > det || beta > det){
		return null;
	    }
	} else {
	    if (alpha < det || beta < det){
		return null;
	    }
	}
	return point(this.start.x + (alpha * pt1Dir.x / det),
		     this.start.y + (alpha * pt1Dir.y / det));
    }
};

/**
 * Rectangle object.
 */
function Rect(o){
    this.x = o.x;
    this.y = o.y;
    this.width = o.width;
    this.height = o.height;
}

function rect(o){ 
    if (typeof o.width === "undefined"){
	return new Rect({x: arguments[0],
			 y: arguments[1],
			 width: arguments[2],
			 height: arguments[3]});
    }
    return new Rect(o); 
}

Rect.prototype = {
    constructor: Rect,

    toString: function(){
	return "origin: " + this.origin().toString() + " corner: " + this.corner().toString();
    },

    origin: function(){ return point(this.x, this.y); },
    corner: function(){ return point(this.x + this.width, this.y + this.height); },
    topRight: function(){ return point(this.x + this.width, this.y); },
    bottomLeft: function(){ return point(this.x, this.y + this.height); },
    center: function(){ return point(this.x + this.width/2, this.y + this.height/2); },

    /**
     * @return <bool> true if rectangles intersect
     */
    intersect: function(r){
	var myOrigin = this.origin(),
	myCorner = this.corner(),
	rOrigin = r.origin(),
	rCorner = r.corner();
	if (rCorner.x <= myOrigin.x){ return false; }
	if (rCorner.y <= myOrigin.y){ return false; }
	if (rOrigin.x >= myCorner.x){ return false; }
	if (rOrigin.y >= myCorner.y){ return false; }
	return true;
    },

    /**
     * @return <string> (left|right|top|bottom) side which is nearest to point
     * @see Squeak Smalltalk, Rectangle>>sideNearestTo:
     */
    sideNearestToPoint: function(p){
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
    },

    /**
     * @return <bool> true if point p is insight me
     */
    containsPoint: function(p){
	if (p.x > this.x && p.x < this.x + this.width &&
	    p.y > this.y && p.y < this.y + this.height){
	    return true;
	}
	return false;
    },

    /**
     * @return <point> a point on my border nearest to parameter point
     * @see Squeak Smalltalk, Rectangle>>pointNearestTo:
     */
    pointNearestToPoint: function(p){
	if (this.containsPoint(p)){
	    var side = this.sideNearestToPoint(p);
	    switch (side){
	    case "right": return point(this.x + this.width, p.y);
	    case "left": return point(this.x, p.y);	    
	    case "bottom": return point(p.x, this.y + this.height);
	    case "top": return point(p.x, this.y);
	    }
	} else {
	    return p.adhereToRect(this);
	}
    },

    /**
     * Find point on me where line starting
     * from my center ending in point p intersects my boundary.
     */
    boundPoint: function(p){
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
	    if (intersection !== null){
		return intersection;
	    }
	}
	// assert(false)
    },

    /**
     * Move and expand me.
     * @param r <rectangle> representing deltas
     */
    moveAndExpand: function(r){
	this.x += r.x;
	this.y += r.y;
	this.width += r.width;
	this.height += r.height;
	return this;
    }
};

/**
 * Ellipse object.
 */
function Ellipse(c, a, b){
    this.x = c.x;
    this.y = c.y;
    this.a = a;
    this.b = b;
}

function ellipse(c, a, b){ return new Ellipse(c, a, b); }

Ellipse.prototype = {
    constructor: Ellipse,

    bbox: function(){
	return rect({x: this.x - this.a, y: this.y - this.b, width: 2*this.a, height: 2*this.b});
    },

    /**
     * Find point on me where line from my center to
     * point p intersects my boundary.
     * @see Squeak Smalltalk, EllipseMorph>>intersectionWithLineSegmentFromCenterTo:    
     */
    intersectionWithLineFromCenterToPoint: function(p){
	var dx = p.x - this.x,
	dy = p.y - this.y;
	if (dx === 0){
	    return this.bbox().pointNearestToPoint(p);
	}

	var m = dy / dx,
	mSquared = m * m,
	aSquared = this.a * this.a,
	bSquared = this.b * this.b,
	x = Math.sqrt(1 / ((1 / aSquared) + (mSquared / bSquared)));
	if (dx < 0){
	    x = -x;
	}
	var y = m * x;
	return point(this.x + x, this.y + y);
    }
    
};

/**
 * Bezier segment object.
 */
function BezierSegment(p0, p1, p2, p3){
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
}

function bezierSegment(p0, p1, p2, p3){
    return new BezierSegment(p0, p1, p2, p3);
}

BezierSegment.prototype = {
    constructor: BezierSegment,

    /**
     * Get a point on me at the specified time t.
     */
    getPoint: function(t){
	var 
	a = 1 - t,	// (1 - t)
	b = a*a,	// (1 - t)^2
	c = b*a,	// (1 - t)^3
	tt = t*t,	// t^2
	ttt = tt*t;	// t^3

	return point(c*this.p0.x + 3*b*t*this.p1.x + 3*a*tt*this.p2.x + ttt*this.p3.x,
		     c*this.p0.y + 3*b*t*this.p1.y + 3*a*tt*this.p2.y + ttt*this.p3.y);
    }
    
};

/**
 * Various methods for Bezier curves manipulation.
 */
function Bezier(){}

/** 
 * Cubic Bezier curve path through points.
 * Ported from ActionScript implementation by Andy Woodruff (http://cartogrammar.com/blog)
 */
Bezier.curveThroughPoints = function(points, z, angleFactor){
    // default values
    if (typeof z === "undefined"){
	z = 0.5;
    }
    if (typeof angleFactor === "undefined"){
	angleFactor = 0.75;
    }
    
    var path = [];	// the result SVG path as an array of path commands
    if (points.length < 2){
	throw new Error("Points array must have minimum of two points.");
    }

    var p = [points[0]];
    // remove duplicate neighbours
    for (var i = 1, len = points.length; i < len; i++){
	if (points[i].x != points[i-1].x || points[i].y != points[i-1].y){
	    p.push(points[i]);
	}
    }

    // z is_in (0,1]
    if (z <= 0){
	z = 0.5;
    } else if (z > 1){
	z = 1;
    }

    // angleFactor is_in [0,1]
    if (angleFactor < 0){
	angleFactor = 0;
    } else if (angleFactor > 1){
	angleFactor = 1;
    }
    
    /**
     * Calculate all the curve control points.
     */

    // None of this junk will do any good if there are only two points
    if (p.length > 2){
	// Ordinarily, curve calculations will start with the second point 
	// and go through the second-to-last point
	var firstPt = 1;
	var lastPt = p.length-1;
	// Check if this is a closed line
	if (p[0].x == p[lastPt].x && p[0].y == p[lastPt].y){
	    // Include first and last points in curve calculations
	    firstPt = 0;
	    lastPt = p.length;
	}

	// An array to store the two control points for each point
	var controlPts = [];	
	// Loop through all the points (except the first and last 
	// if not a closed line) to get curve control points for each.
	for (var i = firstPt; i < lastPt; i++) {
	    // The previous, current, and next points

	    // If the first point (of a closed line), use the 
	    // second-to-last point as the previous point
	    var p0 = (i-1 < 0) ? p[p.length-2] : p[i-1];
	    var p1 = p[i];
	    // If the last point (of a closed line), use the 
	    // second point as the next point
	    var p2 = (i+1 == p.length) ? p[1] : p[i+1];

	    // Distance from previous point to current point
	    var a = p0.distance(p1);
	    // Correct for near-zero distances, a cheap way to prevent 
	    // division by zero
	    if (a < 0.001){ a = 0.001; }
	    // Distance from current point to next point
	    var b = p1.distance(p2);
	    if (b < 0.001){ b = 0.001; }
	    // Distance from previous point to next point
	    var c = p0.distance(p2);
	    if (c < 0.001){ c = 0.001; }
	    var cos = (b*b+a*a-c*c)/(2*b*a);
	    // Make sure above value is between -1 and 1 so that Math.acos will work
	    if (cos < -1){ cos = -1; }
	    else if (cos > 1){ cos = 1; }
	    // Angle formed by the two sides of the triangle 
	    // (described by the three points above) adjacent to the current point
	    var C = Math.acos(cos);
	    // Duplicate set of points. Start by giving previous and next points 
	    // values RELATIVE to the current point.
	    var aPt = point(p0.x-p1.x,p0.y-p1.y);
	    var bPt = point(p1.x,p1.y);
	    var cPt = point(p2.x-p1.x,p2.y-p1.y);

	    /* We'll be adding adding the vectors from the previous and next points 
	       to the current point, but we don't want differing magnitudes (i.e. 
	       line segment lengths) to affect the direction of the new vector. 
               Therefore we make sure the segments we use, based on the duplicate points
	       created above, are of equal length. The angle of the new vector will 
               thus bisect angle C (defined above) and the perpendicular to this is 
               nice for the line tangent to the curve. The curve control points will 
               be along that tangent line.
	    */
	    if (a > b){
		// Scale the segment to aPt (bPt to aPt) to the size of b 
		// (bPt to cPt) if b is shorter.
		aPt.normalize(b);
	    } else if (b > a){
		// Scale the segment to cPt (bPt to cPt) to the size of a (aPt to bPt) 
		// if a is shorter.
		cPt.normalize(a);
	    }
	    // Offset aPt and cPt by the current point to get them back to 
	    // their absolute position.
	    aPt.offset(p1.x,p1.y);
	    cPt.offset(p1.x,p1.y);

	    // Get the sum of the two vectors, which is perpendicular to the line 
	    // along which our curve control points will lie.

	    // x component of the segment from previous to current point
	    var ax = bPt.x-aPt.x;
	    var ay = bPt.y-aPt.y; 
	    // x component of the segment from next to current point
	    var bx = bPt.x-cPt.x;
	    var by = bPt.y-cPt.y;
	    // sum of x components
	    var rx = ax + bx;
	    var ry = ay + by;
	    // Correct for three points in a line by finding the angle between just two of them
	    if (rx === 0 && ry === 0){
		// Really not sure why this seems to have to be negative
		rx = -bx;
		ry = by;
	    }
	    // Switch rx and ry when y or x difference is 0. This seems to prevent 
	    // the angle from being perpendicular to what it should be.
	    if (ay === 0 && by === 0){
		rx = 0;
		ry = 1;
	    } else if (ax === 0 && bx === 0){
		rx = 1;
		ry = 0;
	    }
	    // length of the summed vector - not being used, but there it is anyway
	    // var r = Math.sqrt(rx*rx+ry*ry);
	    // angle of the new vector
	    var theta = Math.atan2(ry,rx);
	    // Distance of curve control points from current point: a fraction 
	    // the length of the shorter adjacent triangle side
	    var controlDist = Math.min(a,b)*z;
	    // Scale the distance based on the acuteness of the angle. Prevents 
	    // big loops around long, sharp-angled triangles.
	    var controlScaleFactor = C/Math.PI;
	    // Mess with this for some fine-tuning
	    controlDist *= ((1-angleFactor) + angleFactor*controlScaleFactor);
	    // The angle from the current point to control points: 
	    // the new vector angle plus 90 degrees (tangent to the curve).
	    var controlAngle = theta+Math.PI/2;
	    // Control point 2, curving to the next point.
	    var controlPoint2 = Point.fromPolar(controlDist,controlAngle);
	    // Control point 1, curving from the previous point 
	    // (180 degrees away from control point 2).
	    var controlPoint1 = Point.fromPolar(controlDist,controlAngle+Math.PI);

	    // Offset control points to put them in the correct absolute position
	    controlPoint1.offset(p1.x,p1.y);
	    controlPoint2.offset(p1.x,p1.y);

	    /* Haven't quite worked out how this happens, but some control 
	       points will be reversed. In this case controlPoint2 will be 
               farther from the next point than controlPoint1 is.
	       Check for that and switch them if it's true.
	    */
	    if (controlPoint2.distance(p2) > controlPoint1.distance(p2)){
		// Add the two control points to the array in reverse order
		controlPts[i] = [controlPoint2,controlPoint1];
	    } else {
		// Otherwise add the two control points to the array in normal order
		controlPts[i] = [controlPoint1,controlPoint2];
	    }
	}//endfor (var i = firstPt; i < lastPt; i++) {

	// DRAW THE CURVE

	path.push("M", p[0].x, p[0].y);
	// console.log(controlPts);

	// If this isn't a closed line
	if (firstPt == 1){
	    // Draw a regular quadratic Bézier curve from the first to second points, 
	    // using the first control point of the second point
	    path.push("S", controlPts[1][0].x,controlPts[1][0].y,p[1].x,p[1].y);
	}

	// Change to true if you want to use lineTo for straight lines of 3 or 
	// more points rather than curves. You'll get straight lines but possible sharp corners!
	var straightLines = true;
	// Loop through points to draw cubic Bézier curves through the penultimate 
	// point, or through the last point if the line is closed.
	for (var i = firstPt; i < lastPt - 1; i++){
	    // Determine if multiple points in a row are in a straight line
	    var isStraight = false;
	    if ( ( i > 0 && Math.atan2(p[i].y-p[i-1].y,p[i].x-p[i-1].x) == Math.atan2(p[i+1].y-p[i].y,p[i+1].x-p[i].x) )|| ( i < p.length - 2 && Math.atan2(p[i+2].y-p[i+1].y,p[i+2].x-p[i+1].x) == Math.atan2(p[i+1].y-p[i].y,p[i+1].x-p[i].x) ) ){
		isStraight = true;
	    }

	    if (straightLines && isStraight){
		path.push("L", p[i+1].x,p[i+1].y);
	    } else {
		// BezierSegment instance using the current point, its second control 
		// point, the next point's first control point, and the next point
		var bezier = bezierSegment(p[i],controlPts[i][1],controlPts[i+1][0],p[i+1]);
		// Construct the curve out of 100 segments (adjust number for less/more detail)
		for (var t = 0.01; t < 1.01; t += 0.01){
		    // x,y on the curve for a given t
		    var val = bezier.getPoint(t);
		    path.push("L", val.x, val.y);
		}
	    }
	}
	// If this isn't a closed line	
	if (lastPt == p.length-1){
	    // Curve to the last point using the second control point of the penultimate point.
	    path.push("S", controlPts[i][1].x,controlPts[i][1].y,p[i+1].x,p[i+1].y);
	}

	// just draw a line if only two points
    } else if (p.length == 2){	
	path.push("M", p[0].x,p[0].y);
	path.push("L", p[1].x,p[1].y);
    }
    return path;
};
