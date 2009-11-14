var NDEBUG = false;
var DBG = [];	// collector for debugging messages
/****************************************************
 * Joint 0.2.0 - JavaScript library for connecting vector objects
 *
 * Copyright (c) 2009 David Durman
 *
 * Licensed under MIT license:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 ****************************************************/

//(function(){	// BEGIN CLOSURE

/**
 * Global helpers. (not global global only global in the closure)
 */

// Array.indexOf is missing in IE 8
if (!Array.indexOf){
    Array.prototype.indexOf = function (obj, start){
	for (var i = (start || 0), len = this.length; i < len; i++){
	    if (this[i] == obj){
		return i;
	    }
	}
	return -1;
    };
}

/**
 * Get an absolute position of an element.
 * @return point
 */
Joint.findPos = function(el){
    var p = point(0, 0);
    if (el.offsetParent){
	while (el){
	    p.offset(el.offsetLeft, el.offsetTop);
	    el = el.offsetParent;
	}
    }
    return p;
};

/**
 * Get the mouse position relative to the raphael paper.
 * @param <e> Javascript event object
 * @param <r> raphael paper
 * @return <point>
 */
Joint.getMousePosition = function(e, r){
    var pos;
    if (e.pageX || e.pageY) {
        pos = point(e.pageX, e.pageY);
    } 
    else {
	pos = point(e.clientX + 
		    (document.documentElement.scrollLeft || 
		     document.body.scrollLeft) - 
		    document.documentElement.clientLeft,
		    e.clientY + 
		    (document.documentElement.scrollTop || 
		     document.body.scrollTop) - 
		    document.documentElement.clientTop);
    }
    var rp = Joint.findPos(r.canvas);
    return point(pos.x - rp.x, pos.y - rp.y);
};

/*********************************************************************
 * Quantum hierarchical state machines in JavaScript.
 * Based on the ideas of Miro Samek's Practical Statecharts in C/C++: 
 * Quantum Programming for Embedded Systems, 
 * and on the QHsm implementation in Squeak Smalltalk by Ned Konz.
 *********************************************************************/

/**************************************************
 * QHsm.
 **************************************************/

/**
 * myState - the current state
 * mySource - the source of the current transition
 */
function QHsm(initialStateName){
    this.initialState(initialStateName);
}

// called when constructed
QHsm.prototype.initialState = function(aStateOrName){
    this.myState = this.top();
    this.mySource = this.state(aStateOrName);
};

QHsm.prototype.getState = function(){
    return this.myState;
};

/**
 * Trigger the initial transition and recursively enter the submachine of the top state.
 * Must be called only once for a given QHsm before dispatching any events to it.
 */
QHsm.prototype.init = function(anEventOrNil){
    //    anEventOrNil = anEventOrNil || null; 
    var s = this.myState;	// save top in temp
    this.mySource.trigger(anEventOrNil);	// topmost initial transition
    //    eval(assert(s.equals(this.myState.superstate())));	// verify that we only went one level deep
    s = this.myState;
    s.enter();
    while (s.init() === null){	// while init is handled
	//	eval(assert(s.equals(this.myState.superstate())));	// verify that we only went one level deep
	s = this.myState;
	s.enter();
    }
    return this;
};

QHsm.prototype.state = function(stateOrName){ 
    if (stateOrName && stateOrName._QState){
	return stateOrName;
    }
    return new QState(this, stateOrName);
};
QHsm.prototype.top = function(stateOrName){ return new QState(this, "TOP"); };
QHsm.prototype.currentState = function(){ return this.myState; };
QHsm.prototype.selectorFor = function(stateName){ return "state" + stateName; };
QHsm.prototype.dispatchEvent = function(anEvent, aSelector){ 
    return this[aSelector](anEvent);
};

/**
 * This should not be overridden.
 */
QHsm.prototype.stateTOP = function(anEvent){
    if (anEvent.type === "entry" ||
	anEvent.type === "exit" ||
	anEvent.type === "init" ||
	anEvent.type === "empty"){
	return null;
    }
    return this.handleUnhandledEvent(anEvent);
};

/**
 * Override this when needed.
 */
QHsm.prototype.handleUnhandledEvent = function(anEvent){
    return null;
};

/**
 * Traverse the state hierarchy starting from the currently active state myState.
 * Advance up the state hierarchy (i.e., from substates to superstates), invoking all
 * the state handlers in succession. At each level of state nesting, it intercepts the value
 * returned from a state handler to obtain the superstate needed to advance to the next level.
 */
QHsm.prototype.dispatch = function(anEvent){
    if (!(anEvent && anEvent._QEvent)){
	anEvent = new QEvent(anEvent);
    }
    this.mySource = this.myState;
    while (this.mySource !== null){
	this.mySource = this.mySource.trigger(anEvent);
    }
};

/**
 * Performs dynamic transition. (macro Q_TRAN_DYN())
 */
QHsm.prototype.newState = function(aStateName){ 
    this.transition(this.state(aStateName)); 
    return null;
};

/**
 * Used by handlers only in response to the #init event. (macro Q_INIT())
 * USAGE: return this.newInitialState("whatever");
 * @return nil for convenience
 */
QHsm.prototype.newInitialState = function(aStateOrName){ 
    this.myState = this.state(aStateOrName); 
    return null;
};

/**
 * Dynamic transition. (Q_TRAN_DYN())
 */
QHsm.prototype.transition = function(target){
    //    eval(assert(!target.equals(this.top())));
    var entry = [];
    var thisMySource = this.mySource;	// for better performance

    // exit all the nested states between myState and mySource
    var s = this.myState;
    while (!s.equals(thisMySource)){
	//	eval(assert(s != null));
	s = s.exit() || s.superstate();
    }

    // check all seven possible source/target state combinations
    entry[entry.length] = target;

    // (a) mySource == target (self transition)
    if (thisMySource.equals(target)){
	thisMySource.exit();
	return this.enterVia(target, entry);
    }

    // (b) mySource == target.superstate (one level deep)
    var p = target.superstate();
    if (thisMySource.equals(p)){
	return this.enterVia(target, entry);
    }
    
    //    eval(assert(thisMySource != null));

    // (c) mySource.superstate == target.superstate (most common - fsa)
    var q = thisMySource.superstate();
    if (q.equals(p)){
	thisMySource.exit();
	return this.enterVia(target, entry);
    }

    // (d) mySource.superstate == target (one level up)
    if (q.equals(target)){
	thisMySource.exit();
	entry.pop();	// do not enter the LCA
	return this.enterVia(target, entry);
    }
    
    // (e) mySource == target.superstate.superstate... hierarchy (many levels deep)
    entry[entry.length] = p;
    s = p.superstate();
    while (s !== null){
	if (thisMySource.equals(s)){
	    return this.enterVia(target, entry);
	}
	entry[entry.length] = s;
	s = s.superstate();
    }

    // otherwise we're definitely exiting mySource
    thisMySource.exit();

    // entry array is complete, save its length to avoid computing it repeatedly
    var entryLength = entry.length;

    // (f) mySource.superstate == target.superstate.superstate... hierarchy
    var lca;
    for (lca = entryLength - 1; lca > 0; lca--){
	if (q.equals(entry[lca])){
	    return this.enterVia(target, entry.slice(0, lca - 1)); // do not enter lca
	}
    }

    // (g) each mySource.superstate.superstate... for each target.superstate.superstate...
    s = q;
    while (s !== null){
	for (lca = entryLength - 1; lca > 0; lca--){
	    if (s.equals(entry[lca])){
		return this.enterVia(target, entry.slice(0, lca - 1)); // do not enter lca
	    }
	}
	s.exit();
	s = s.superstate();
    }
};

// tail of transition()
// we are in the LCA of mySource and target
QHsm.prototype.enterVia = function(target, entry){
    // retrace the entry path in reverse order
    var entryLength = entry.length;
    for (var i = entryLength - 1; i >= 0; i--){
	entry[i].enter();
    }
    this.myState = target;
    while (target.init() === null){
	// initial transition must go one level deep
	//	eval(assert(target.equals(this.myState.superstate())));	
	target = this.myState;
	target.enter();
    }
};

/**************************************************
 * QState.
 **************************************************/

function QState(fsm, name){
    this.fsm = fsm;
    this.name = name;
    this._QState = true;
}

QState.prototype.equals = function(state){
    return (this.name === state.name && this.fsm === state.fsm);
};
QState.prototype.dispatchEvent = function(anEvent, aSelector){ 
    return this.fsm.dispatchEvent(anEvent, aSelector);
};
QState.prototype.trigger = function(anEvent){
    var evt = anEvent || new QEvent("NullEvent");
    var selector = this.fsm.selectorFor(this.name);
    //!//TODO: if selector is null than throw an error: "no handler for anEvent.type in state this.name"
    return this.dispatchEvent(evt, selector);
};

QState.prototype.enter = function(){ 
    //    if (!NDEBUG && console) console.log("[STATE " + this.name + "] entry");    
    return this.trigger(QEventEntry);
};
QState.prototype.exit = function(){ 
    //    if (!NDEBUG && console) console.log("[STATE " + this.name + "] exit");
    return this.trigger(QEventExit);
};
QState.prototype.init = function(){ 
    return this.trigger(QEventInit);
};

/**
 * Answer my superstate. Default is to return fsm top state.
 */
QState.prototype.superstate = function(){ 
    var superstate = this.trigger(new QEvent("empty"));
    if (superstate && superstate._QState){
	return superstate;
    }
    superstate = this.fsm.top();
    if (this.name === superstate.name){
	return null;
    }
    return superstate;
    //return this.fsm.top();
};

/**************************************************
 * QEvent.
 **************************************************/

function QEvent(type, args){
    this.type = type;
    this.args = args;
    this._QEvent = true;
}

// this events are static, they do not carry any arguments
// -> create them only once
var QEventEntry = new QEvent("entry");
var QEventExit = new QEvent("exit");
var QEventInit = new QEvent("init");

// shorthand
function qevt(sig, args){ return new QEvent(sig, args); }


/**************************************************
 * Geometry-Primitives.
 **************************************************/

/**
 * Point object.
 */
function Point(x, y){
    this.x = x;
    this.y = y;
}

Point.prototype.toString = function(){
    return this.x + "@" + this.y;
};

/**
 * If I lie outside rectangle r, return the nearest point on the boundary of rect r, 
 * otherwise return me.
 * @see Squeak Smalltalk, Point>>adhereTo:
 */
Point.prototype.adhereToRect = function(r){
    if (r.containsPoint(this)){
	return this;
    }
    this.x = Math.min(Math.max(this.x, r.x), r.x + r.width);
    this.y = Math.min(Math.max(this.y, r.y), r.y + r.height);
    return this;
};

/**
 * Compute the angle between me and p and the x axis.
 * (cartesian-to-polar coordinates conversion)
 */
Point.prototype.theta = function(p){
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
};

/**
 * @return <double> distance between me and point p
 */
Point.prototype.distance = function(p){
    return line(this, p).length();
};

/**
 * Offset me by the specified amount.
 */
Point.prototype.offset = function(dx, dy){
    this.x += dx;
    this.y += dy;
};

/**
 * Scale the line segment between (0,0) and me to have a length of len
 */
Point.prototype.normalize = function(len){
    var s = len / Math.sqrt((this.x*this.x) + (this.y*this.y));
    this.x = s * this.x;
    this.y = s * this.y;
};

Point.fromPolar = function(r, angle){
    return point(r * Math.cos(angle), r * Math.sin(angle));
};

function point(x, y){ return new Point(x, y); }

/**
 * Line object.
 */
function Line(p1, p2){
    this.start = p1;
    this.end = p2;
}

Line.prototype.toString = function(){
    return "start: " + this.start.toString() + " end:" + this.end.toString();
};

/**
 * @return <double> length of the line
 */
Line.prototype.length = function(){
    return Math.sqrt(this.squaredLength());
};

/**
 * @return <integer> length without sqrt
 * @note for applications where the exact length is not necessary (e.g. compare only)
 */
Line.prototype.squaredLength = function(){
    var 
    x0 = this.start.x, y0 = this.start.y,
    x1 = this.end.x, y1 = this.end.y;
    return (x0 -= x1)*x0 + (y0 -= y1)*y0;
};

/**
 * @return <point> my midpoint 
 */
Line.prototype.midpoint = function(){
    return point((this.start.x + this.end.x) / 2,
		 (this.start.y + this.end.y) / 2);
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
};

function line(p1, p2) { return new Line(p1, p2); }

/**
 * Rectangle object.
 */
function Rect(o){
    this.x = o.x;
    this.y = o.y;
    this.width = o.width;
    this.height = o.height;
}

Rect.prototype.toString = function(){
    return "origin: " + this.origin().toString() + " corner: " + this.corner().toString();
};

Rect.prototype.origin = function(){ return point(this.x, this.y); };
Rect.prototype.corner = function(){ return point(this.x + this.width, this.y + this.height); };
Rect.prototype.topRight = function(){ return point(this.x + this.width, this.y); };
Rect.prototype.bottomLeft = function(){ return point(this.x, this.y + this.height); };
Rect.prototype.center = function(){ return point(this.x + this.width/2, this.y + this.height/2); };

/**
 * @return <bool> true if rectangles intersect
 */
Rect.prototype.intersect = function(r){
    var myOrigin = this.origin(),
    myCorner = this.corner(),
    rOrigin = r.origin(),
    rCorner = r.corner();
    if (rCorner.x <= myOrigin.x){ return false; }
    if (rCorner.y <= myOrigin.y){ return false; }
    if (rOrigin.x >= myCorner.x){ return false; }
    if (rOrigin.y >= myCorner.y){ return false; }
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
	p.y > this.y && p.y < this.y + this.height){
	return true;
    }
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
    } else {
	return p.adhereToRect(this);
    }
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
	if (intersection !== null){
	    return intersection;
	}
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

function rect(o){ return new Rect(o); }

/**
 * Ellipse object.
 */
function Ellipse(x, y, a, b){
    this.x = x;
    this.y = y;
    this.a = a;
    this.b = b;
}

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
};

function ellipse(x, y, a, b){ return new Ellipse(x, y, a, b); }

/**
 * Bezier segment object.
 */
function BezierSegment(p0, p1, p2, p3){
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
}

/**
 * Get a point on me at the specified time t.
 */
BezierSegment.prototype.getPoint = function(t){
    var 
    a = 1 - t,	// (1 - t)
    b = a*a,	// (1 - t)^2
    c = b*a,	// (1 - t)^3
    tt = t*t,	// t^2
    ttt = tt*t;	// t^3

    return point(c*this.p0.x + 3*b*t*this.p1.x + 3*a*tt*this.p2.x + ttt*this.p3.x,
		 c*this.p0.y + 3*b*t*this.p1.y + 3*a*tt*this.p2.y + ttt*this.p3.y);
};

function bezierSegment(p0, p1, p2, p3){
    return new BezierSegment(p0, p1, p2, p3);
}

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

/**************************************************
 * Engine.
 **************************************************/

function JointEngine(){ 
    QHsm.apply(this, ["Initial"]);
    this.self = this;
}

JointEngine.prototype = new QHsm();
JointEngine.prototype.stateInitial = function(e){
    var self = this;
    this.myIdleHistory = null;	// allows transition to history of Idle state

    /**
     * Slots.
     */

    // temporaries for moving objects
    this._dx = undefined;	
    this._dy = undefined;
    
    // callbacks
    this._callbacks = {
	// called when a joint has just connected to an object
	// the object is accessed using this
	justConnected: function(){
	    // var self = this;
	    // self.animate({scale: 1.2}, 100, function(){self.animate({scale: 1.0}, 100)});
	}
    };

    // hack for slow browsers
    //    this._nRedraws = 0;
    //    this._nRedrawsMod = 2;

    // these objects are the ones I can connect to
    this.registeredObjects = [];

    // label related properties
    this._labelString = "";	// label string
    this._labelBox = null;	// rectangle where labelText is located
    this._labelText = null;	// label that keeps its position with connection path middle point
    this._labelAttrs = {stroke: "white", fill: "white"};
    
    this._con = null;		// holds the joint path
    this._conVertices = [];	// joint path vertices
    this._conVerticesCurrentIndex = 0;
    this._nearbyVertexSqrDist = 500;	// Math.sqrt(this._nearbyVertexSqrDist) is tolerable distance of vertex moving
    this._startCap = null;	// start glyph (arrow)
    this._endCap = null;	// end glyph (arrow)
    this._joint = null;		// back reference to Joint object
    // connection from start to end
    this._start = { // start object
	joints: [],		// Joints
	curEngine: null,	// currently used engine (when wired)
	shape: null,		// Raphael object
	dummy: false		// is it a dummy object?
    };		
    this._end = { // end object
	joints: [],		// Joints
	curEngine: null,	// currently used engine (when wired)
	shape: null,		// Raphael object
	dummy: false		// is it a dummy object?
    };		


    // _con path options
    this._opt = {
	attrs: {
	    "stroke": "#000",
	    //	    "fill": "#fff",	// can not be used if connection wiring is enabled
	    "fill-opacity": 0.0,
	    "stroke-width": 1,
	    "stroke-dasharray": "-",
	    "stroke-linecap": "round", // butt/square/round/mitter
	    "stroke-linejoin": "round", // butt/square/round/mitter
	    "stroke-miterlimit": 1,
	    "stroke-opacity": 1.0
	},
	cursor: "move",	// CSS cursor property
	beSmooth: false,// be a smooth line? (bezier curve aproximation)
	// bounding box correction 
	// (useful when the connection should start in the center of an object, etc...)
	bboxCorrection: {
	    start: { type: null, x: 0, y: 0, width: 0, height: 0 },
	    end: { type: null, x: 0, y: 0, width: 0, height: 0 }
	}
    };


    // various ready-to-use arrows
    this._arrows = {
	basic15: {
	    path: ["M","15","0","L","-15","0"],
	    dx: 15, dy: 15, // x, y correction
	    attrs: this._opt.attrs
	},
	basic: {
	    path: ["M","2","0","L","-2","0"],
	    dx: 2, dy: 2, // x, y correction
	    attrs: this._opt.attrs
	},
	basicArrow: {
	    path: ["M","15","0","L","-15","-15","L","-15","15","z"],
	    dx: 15, dy: 15,
	    attrs: { stroke: "black", fill: "black" }
	},
	// sizes, TODO: find a better solution then list of all sizes!!!
	basicArrow1: {path: ["M","1","0","L","-1","-1","L","-1","1","z"], dx: 1, dy: 1, attrs: { stroke: "black", fill: "black" }},
	basicArrow2: {path: ["M","2","0","L","-2","-2","L","-2","2","z"], dx: 2, dy: 2, attrs: { stroke: "black", fill: "black" }},
	basicArrow3: {path: ["M","3","0","L","-3","-3","L","-3","3","z"], dx: 3, dy: 3, attrs: { stroke: "black", fill: "black" }},
	basicArrow4: {path: ["M","4","0","L","-4","-4","L","-4","4","z"], dx: 4, dy: 4, attrs: { stroke: "black", fill: "black" }},
	basicArrow5: {path: ["M","5","0","L","-5","-5","L","-5","5","z"], dx: 5, dy: 5, attrs: { stroke: "black", fill: "black" }},
	basicArrow6: {path: ["M","6","0","L","-6","-6","L","-6","6","z"], dx: 6, dy: 6, attrs: { stroke: "black", fill: "black" }},
	basicArrow7: {path: ["M","7","0","L","-7","-7","L","-7","7","z"], dx: 7, dy: 7, attrs: { stroke: "black", fill: "black" }},
	basicArrow8: {path: ["M","8","0","L","-8","-8","L","-8","8","z"], dx: 8, dy: 8, attrs: { stroke: "black", fill: "black" }},
	basicArrow9: {path: ["M","","0","L","-9","-9","L","-9","9","z"], dx: 9, dy: 9, attrs: { stroke: "black", fill: "black" }},
	basicArrow10: {path: ["M","10","0","L","-10","-10","L","-10","10","z"], dx: 10, dy: 10, attrs: { stroke: "black", fill: "black" }},
	basicArrow11: {path: ["M","11","0","L","-11","-11","L","-11","11","z"], dx: 11, dy: 11, attrs: { stroke: "black", fill: "black" }},
	basicArrow12: {path: ["M","12","0","L","-12","-12","L","-12","12","z"], dx: 12, dy: 12, attrs: { stroke: "black", fill: "black" }},
	hand: {
	    path: ["M","-15.681352","-5.1927657","C","-15.208304","-5.2925912","-14.311293","-5.5561164","-13.687993","-5.7783788","C","-13.06469","-6.0006406","-12.343434","-6.2537623","-12.085196","-6.3408738","C","-10.972026","-6.7163768","-7.6682017","-8.1305627","-5.9385615","-8.9719142","C","-4.9071402","-9.4736293","-3.9010109","-9.8815423","-3.7027167","-9.8783923","C","-3.5044204","-9.8752373","-2.6780248","-9.5023173","-1.8662751","-9.0496708","C","-0.49317056","-8.2840047","-0.31169266","-8.2208528","0.73932854","-8.142924","L","1.8690327","-8.0591623","L","2.039166","-7.4474021","C","2.1327395","-7.1109323","2.1514594","-6.8205328","2.0807586","-6.8020721","C","2.010064","-6.783614","1.3825264","-6.7940997","0.68622374","-6.8253794","C","-0.66190616","-6.8859445","-1.1814444","-6.8071497","-1.0407498","-6.5634547","C","-0.99301966","-6.4807831","-0.58251196","-6.4431792","-0.12850911","-6.4798929","C","1.2241412","-6.5892761","4.7877672","-6.1187783","8.420785","-5.3511477","C","14.547755","-4.056566","16.233479","-2.9820024","15.666933","-0.73209438","C","15.450654","0.12678873","14.920327","0.61899573","14.057658","0.76150753","C","13.507869","0.85232533","12.818867","0.71394493","9.8149232","-0.090643373","C","7.4172698","-0.73284018","6.1067424","-1.0191399","5.8609814","-0.95442248","C","5.6587992","-0.90118658","4.8309652","-0.89582008","4.0213424","-0.94250688","C","3.0856752","-0.99645868","2.5291546","-0.95219288","2.4940055","-0.82101488","C","2.4635907","-0.70750508","2.4568664","-0.61069078","2.4790596","-0.60585818","C","2.5012534","-0.60103228","2.9422761","-0.59725718","3.4591019","-0.59747878","C","3.9759261","-0.59770008","4.4500472","-0.58505968","4.512693","-0.56939128","C","4.7453841","-0.51117988","4.6195024","0.92436343","4.318067","1.650062","C","3.8772746","2.7112738","2.9836566","3.9064107","2.2797382","4.3761637","C","1.5987482","4.8306065","1.52359","4.9484512","1.8576616","5.0379653","C","1.9860795","5.0723748","2.2155555","4.9678227","2.3676284","4.8056312","C","2.6253563","4.5307504","2.6497332","4.5328675","2.7268401","4.8368824","C","2.8605098","5.3638848","2.3264901","6.4808604","1.6782299","7.0301956","C","1.3498639","7.30845","0.75844624","8.0404548","0.36396655","8.6568609","C","-0.58027706","10.132325","-0.69217806","10.238528","-1.4487256","10.377186","C","-2.2048498","10.515767","-4.6836995","9.9021604","-6.41268","9.1484214","C","-9.9464649","7.6078865","-10.697587","7.3186028","-12.142194","6.9417312","C","-13.020384","6.712621","-14.184145","6.4654454","-14.72833","6.3924328","C","-15.272516","6.3194263","-15.731691","6.241583","-15.748724","6.2194535","C","-15.813855","6.1348086","-16.609132","-4.7586323","-16.562804","-4.9315285","C","-16.551052","-4.9753876","-16.154402","-5.0929474","-15.681351","-5.192769","L","-15.681352","-5.1927657","z","M","11.288619","-1.446424","L","10.957631","-0.2111606","L","11.627189","-0.031753373","C","13.374637","0.43647423","14.580622","0.18262123","15.042031","-0.75056578","C","15.503958","-1.6847955","14.648263","-2.6070187","12.514834","-3.4742549","L","11.634779","-3.8320046","L","11.627191","-3.2568392","C","11.623019","-2.9405087","11.470661","-2.1258178","11.288619","-1.446424","z"],
	    dx: 17, dy: 17,
	    attrs: {}
	},
	flower: {
	    path: ["M","14.407634","0.14101164","C","13.49394","-0.67828198","12.640683","-1.3981484","11.695412","-1.9684748","C","9.0580339","-3.5615387","6.1975385","-4.0965167","3.8809003","-3.2050972","C","-1.0202735","-1.4355585","-2.2650956","-0.75266958","-6.1678175","-0.75266958","L","-6.1678175","-2.0100414","C","-1.8745566","-2.0888183","1.0024122","-3.7090503","1.8649218","-6.1147565","C","2.2734082","-7.1733737","2.0690534","-8.5444386","0.7737959","-9.8037723","C","-0.82956951","-11.36162","-5.2455289","-11.821547","-6.0950803","-7.2474282","C","-5.3751604","-7.7316963","-3.8041596","-7.6860056","-3.2477662","-6.7174716","C","-2.8775009","-5.9772878","-3.0228781","-5.1443269","-3.3412911","-4.7534348","C","-3.7218578","-4.1236184","-4.935379","-3.5168459","-6.1678175","-3.5168459","L","-6.1678175","-5.6886834","L","-8.5890734","-5.6886834","L","-8.5890734","-1.1787104","C","-9.8368017","-1.2379009","-10.838424","-1.918296","-11.394817","-3.1843135","C","-11.92063","-3.0214395","-12.984452","-2.2582108","-12.911997","-1.2099015","C","-14.045721","-1.0028338","-14.687381","-0.80225028","-15.717737","0.14101164","C","-14.687714","1.0836088","-14.046053","1.2744822","-12.911997","1.4815506","C","-12.984786","2.5298263","-11.92063","3.2930879","-11.394817","3.4559626","C","-10.838424","2.1902771","-9.8368017","1.5095164","-8.5890734","1.4503588","L","-8.5890734","5.9603315","L","-6.1678175","5.9603315","L","-6.1678175","3.788495","C","-4.935379","3.788495","-3.7218578","4.3958989","-3.3412911","5.0250837","C","-3.0228781","5.4159757","-2.8775009","6.2482381","-3.2477662","6.9891209","C","-3.8041596","7.9569902","-5.3751604","8.003345","-6.0950803","7.5190778","C","-5.2455353","12.093197","-0.82956631","11.643978","0.7737959","10.08583","C","2.0693864","8.827128","2.2734082","7.4453226","1.8649218","6.3864056","C","1.00208","3.980998","-1.8745566","2.3705098","-6.1678175","2.2920986","L","-6.1678175","1.0243179","C","-2.2650956","1.0243179","-1.0206064","1.7065088","3.8809003","3.4767455","C","6.1975385","4.367168","9.0580339","3.8331873","11.695412","2.2401238","C","12.640683","1.669431","13.493608","0.95964074","14.407634","0.14101164","z"],
	    dx: 15, dy: 15,
	    attrs: {}
	},
	basicRect: {
	    path: ["M","15","5","L","-15","5","L","-15","-5", "L", "15", "-5", "z"],
	    dx: 15, dy: 15,
	    attrs: { stroke: "black", "stroke-width": 1.0 }
	},
	aggregationArrow: {
//	    path: ["M","15","0","L","0","10","L","-15","0", "L", "0", "-10", "z"],
//	    dx: 16, dy: 16,
	    path: ["M","7","0","L","0","5","L","-7","0", "L", "0", "-5", "z"],
	    dx: 9, dy: 9,
	    attrs: { stroke: "black", "stroke-width": 2.0, fill: "black" }
	}
    };

    // used arrows (default values)
    this._opt.arrow = {
	start: self._arrows.basic,
	end: self._arrows.basicArrow5
    };

    // initial state of the engine
    this.newInitialState("Idle");
    return null;	// QHsm convention 
};

/*************************************************************
 * Engine states. (engine behaviour is managed by StateChart)
 *************************************************************/

JointEngine.prototype.stateGeneric = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;
    case "init": 
	this.newInitialState("Idle");
	return null;
    }
    return this.top();
};

JointEngine.prototype.stateIdle = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": 
	this.myIdleHistory = this.getState();	// save the most recently active state
	return null;	
    case "init":
	this.newInitialState("Disconnected");
	return null;
    case "startPositionChanged":
	this.newState("StartObjectMoving");
	return null;
    case "endPositionChanged":
	this.newState("EndObjectMoving");
	return null;
    case "capMouseDown":
	var cap = e.args.cap;
	this._dx = e.args.jsEvt.clientX;
	this._dy = e.args.jsEvt.clientY;

	if (cap === this.startCap()){
	    this.draw().dummyStart();
	    this.newState("StartCapDragging");
	} else {
	    this.draw().dummyEnd();
	    this.newState("EndCapDragging");
	}
	return null;
    case "connectionMouseDown":
	var mousePos = Joint.getMousePosition(e.args.jsEvt, this._raphael);

	// if the mouse position is nearby a connection vertex
	// do not create a new one but move the selected one instead
	for (var i = 0, len = this._conVertices.length; i < len; i++){
	    var v = this._conVertices[i];
	    if (line(v, mousePos).squaredLength() < this._nearbyVertexSqrDist){
		this._conVerticesCurrentIndex = i;
		this.newState("ConnectionWiring");
		return null;
	    }
	}

	// new vertices can be added CORRECTLY only at the end
	// or at the start of the connection
	// -> TODO 
	var 
	sbbCenter = rect(this.startObject().shape.getBBox()).center(),
	ebbCenter = rect(this.endObject().shape.getBBox()).center(),
	// squared lengths of the lines from the center of 
	// start/end object bbox to the mouse position
	smLineSqrLen = line(sbbCenter, mousePos).squaredLength(),
	emLineSqrLen = line(ebbCenter, mousePos).squaredLength();
	if (smLineSqrLen < emLineSqrLen){
	    // new vertex is added to the beginning of the vertex array
	    this._conVerticesCurrentIndex = 0;
	    this._conVertices.unshift(mousePos);
	} else {
	    // new vertex is added to the end of the vertex array
	    this._conVerticesCurrentIndex = this._conVertices.push(mousePos) - 1;
	}
	this.newState("ConnectionWiring");
	return null;
    case "connectionDblClick":
	this._conVertices = [];	// straighten the connection path
	this.redraw();
	this.listenAll();
	return null;
    }
    return this.state("Generic");
};

JointEngine.prototype.stateDisconnected = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "connect":
	this.newState("Connected");
	return null;
    }
    return this.state("Idle");
};

JointEngine.prototype.stateConnected = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenAll();
	return null;
    case "exit": return null;	
    }
    return this.state("Idle");
};

JointEngine.prototype.stateStartCapConnected = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;
    }
    return this.state("Idle");
};

JointEngine.prototype.stateEndCapConnected = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;
    }
    return this.state("Idle");
};
//end of Idle (composite state)

JointEngine.prototype.stateCapDragging = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    }	
    return this.state("Generic");
};

JointEngine.prototype.stateStartCapDragging = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "mouseMove":
	// move dummy object
	this.startObject().shape.translate(e.args.jsEvt.clientX - this._dx,
					   e.args.jsEvt.clientY - this._dy);
	this._dx = e.args.jsEvt.clientX;
	this._dy = e.args.jsEvt.clientY;
	
	this.redraw();
	this.listenAll();
	return null;
    case "mouseUp":
	var 
	ec = this.endCapConnected(),
	dummy = this.startObject(),
	dummyBB = dummy.shape.getBBox(),
	o = this.objectContainingPoint(point(dummyBB.x, dummyBB.y));
	
	if (o === null || o.cap === "end"){
	    if (ec){
		this.newState("EndCapConnected");
	    } else {
		this.newState("Disconnected");
	    }
	} else {
	    this.callback("justConnected", o.target, ["start"]);
	    dummy.shape.remove();	// remove old dummy shape
	    dummy.dummy = false;	// it is no longer dummy
	    dummy.shape = o.target;	// instead it is the new object

	    // push the Joint object into o.joints array
	    // but only if o.joints already doesn't have that Joint object
	    if (o.target.joints.indexOf(this.joint()) == -1){
		o.target.joints.push(this.joint());
	    }

	    // make a transition
	    if (ec){
		this.newState("Connected");
	    } else {
		this.newState("StartCapConnected");
	    }
	}
	return null;
    }	
    return this.state("CapDragging");
};

JointEngine.prototype.stateEndCapDragging = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "mouseMove":
	// move dummy object
	this.endObject().shape.translate(e.args.jsEvt.clientX - this._dx,
					 e.args.jsEvt.clientY - this._dy);
	this._dx = e.args.jsEvt.clientX;
	this._dy = e.args.jsEvt.clientY;

	this.redraw();
	this.listenAll();
	return null;
    case "mouseUp":
	var 
	sc = this.startCapConnected(),
	dummy = this.endObject(),
	dummyBB = dummy.shape.getBBox(),
	o = this.objectContainingPoint(point(dummyBB.x, dummyBB.y));
	
	if (o === null || o.cap === "start"){
	    if (sc){
		this.newState("StartCapConnected");
	    } else {
		this.newState("Disconnected");
	    }
	} else {
	    this.callback("justConnected", o.target, ["end"]);
	    dummy.shape.remove();	// remove old dummy shape
	    dummy.dummy = false;	// it is no longer dummy
	    dummy.shape = o.target;	// instead it is the new object

	    // push the Joint object into o.joints array
	    // but only if o.joints already doesn't have that Joint object
	    if (o.target.joints.indexOf(this.joint()) == -1){
		o.target.joints.push(this.joint());
	    }

	    // make a transition
	    if (sc){
		this.newState("Connected");
	    } else {
		this.newState("EndCapConnected");
	    }
	}
	return null;
    }	
    return this.state("CapDragging");
};
// end of CapDragging

JointEngine.prototype.stateObjectMoving = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;
    case "mouseUp":
    case "done":
	this.newState(this.myIdleHistory);	// transition to history of Idle
	return null;
    }
    return this.state("Generic");
};

JointEngine.prototype.stateStartObjectMoving = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenAll();
	return null;
    case "exit": return null;
    }
    return this.state("ObjectMoving");
};

JointEngine.prototype.stateEndObjectMoving = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenAll();
	return null;
    case "exit": return null;
    }
    return this.state("ObjectMoving");
};
// end of ObjectMoving

JointEngine.prototype.stateConnectionWiring = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenAll();
	return null;
    case "exit": return null;
    case "mouseMove":
	this._conVertices[this._conVerticesCurrentIndex] = Joint.getMousePosition(e.args.jsEvt, this._raphael);
	this.redraw();
	this.listenAll();
	return null;
    case "mouseUp":
	this.newState(this.myIdleHistory);
	return null;
    }
    return this.state("Generic");
};// end of ConnectionWiring

/**
 * Getters.
 */
JointEngine.prototype.connection = function(){ return this._con; };
JointEngine.prototype.endObject = function(){ return this._end; };
JointEngine.prototype.startObject = function(){ return this._start; };
JointEngine.prototype.endCap = function(){ return this._endCap; };
JointEngine.prototype.endCapConnected = function(){ return !this._end.dummy; };
JointEngine.prototype.startCap = function(){ return this._startCap; };
JointEngine.prototype.startCapConnected = function(){ return !this._start.dummy; };
JointEngine.prototype.joint = function(){ return this._joint; };

/**
 * Helpers.
 */
JointEngine.prototype.callback = function(fnc, scope, args){
    this._callbacks[fnc].apply(scope, args);
};

/**
 * Search the registered objects and get the one (if any)
 * who's bounding box contains the point p.
 */
JointEngine.prototype.objectContainingPoint = function(p){
    for (var i = this.registeredObjects.length - 1; i >= 0; --i){
	var o = this.registeredObjects[i];
	if (rect(o.target.getBBox()).containsPoint(p)){
	    return o;
	}
    }
    return null;
};

/**
 * Remove reference to Joint from obj.
 * obj is either startObect or EndObject
 */
JointEngine.prototype.freeJoint = function(obj){
    var 
    jar = obj.shape.joints,	// joints array
    i = jar.indexOf(this._joint);
    jar.splice(i, 1);
    if (jar.length === 0){
	delete obj.shape.joints;
    }
};


/**************************************************
 * Cross-browser event handling.
 * From Dean Edwards' addEvent library.
 **************************************************/

function addEvent(element, type, handler) {
    if (element.addEventListener) {
	element.addEventListener(type, handler, false);
    } else {
	// assign each event handler a unique ID
	if (!handler.$$guid){ handler.$$guid = addEvent.guid++; }
	// create a hash table of event types for the element
	if (!element.events){ element.events = {}; }
	// create a hash table of event handlers for each element/event pair
	var handlers = element.events[type];
	if (!handlers) {
	    handlers = element.events[type] = {};
	    // store the existing event handler (if there is one)
	    if (element["on" + type]) {
		handlers[0] = element["on" + type];
	    }
	}
	// store the event handler in the hash table
	handlers[handler.$$guid] = handler;
	// assign a global event handler to do all the work
	element["on" + type] = handleEvent;
    }
}
// a counter used to create unique IDs
addEvent.guid = 1;

function removeEvent(element, type, handler) {
    if (element.removeEventListener) {
	element.removeEventListener(type, handler, false);
    } else {
	// delete the event handler from the hash table
	if (element.events && element.events[type]){
	    delete element.events[type][handler.$$guid];
	}
    }
}

function handleEvent(event){
    var returnValue = true;
    // grab the event object (IE uses a global event object)
    event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
    // get a reference to the hash table of event handlers
    var handlers = this.events[event.type];
    // execute each event handler
    for (var i in handlers) {
	this.$$handleEvent = handlers[i];
	if (this.$$handleEvent(event) === false) {
	    returnValue = false;
	}
    }
    return returnValue;
}

function fixEvent(event) {
    // add W3C standard event methods
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
}

fixEvent.preventDefault = function() {
    this.returnValue = false;
};

fixEvent.stopPropagation = function() {
    this.cancelBubble = true;
};


/**************************************************
 * Event dispatching.
 **************************************************/

JointEngine.prototype.listenOnMouseDown = function(obj){
    var self = this;
    // register mousedown event callback
    if (obj === this.connection()){	// on connection
	addEvent(obj.node, "mousedown", function(e){ 
	    self.connectionMouseDown(e); 
	    e.stopPropagation();	// prevent bubbling
	    e.preventDefault();		// prevent browser's default action
	});
    } else {	// on cap
	addEvent(obj.node, "mousedown", function(e){ 
	    self.capMouseDown(e, obj);
	    e.stopPropagation();	// prevent bubbling
	    e.preventDefault();		// prevent browser's default action
	});
    }
    // TODO: remove event when not needed 
};

JointEngine.prototype.listenOnDblClick = function(obj){
    var self = this;
    // register dblclick event callback
    if (obj === this.connection()){
	addEvent(obj.node, "dblclick", function(e){ 
	    self.connectionDblClick(e); 
	    e.stopPropagation();	// prevent bubbling
	    e.preventDefault();		// prevent browser's default action
	});
    }
    // TODO: remove event when not needed 
};

// reference to current engine when an object is dragging
// can be global across all raphael 'worlds' because only one object can be dragged at a time
Joint.currentEngine = null;

/**
 * MouseDown event callback when on cap.
 */
JointEngine.prototype.capMouseDown = function(e, cap){
    Joint.currentEngine = this;	// keep global reference to me
    this.dispatch(qevt("capMouseDown", {"cap": cap, jsEvt: e}));
};

/**
 * MouseDown event callback when on connection.
 */
JointEngine.prototype.connectionMouseDown = function(e){
    Joint.currentEngine = this;	// keep global reference to me
    this.dispatch(qevt("connectionMouseDown", {jsEvt: e}));
};

/**
 * DblClick event callback when on connection.
 */
JointEngine.prototype.connectionDblClick = function(e){
    this.dispatch(qevt("connectionDblClick", {jsEvt: e}));
};

/**
 * MouseMove event callback.
 */
Joint.mouseMove = function(e){
    if (Joint.currentEngine !== null){
	Joint.currentEngine.dispatch(qevt("mouseMove", {jsEvt: e}));
	//        r.safari(); //TODO: remove?
    }
};

/**
 * MouseUp event callback.
 */
Joint.mouseUp = function(e){
    if (Joint.currentEngine !== null){
	Joint.currentEngine.dispatch(qevt("mouseUp"));
    }
    Joint.currentEngine = null;
};

/**
 * TODO: register handlers only if draggable caps
 * are allowed in options. Applications may not need it.
 */
// register document event handlers
addEvent(document, "mousemove", Joint.mouseMove);
addEvent(document, "mouseup", Joint.mouseUp);


/**************************************************
 * Engine draw/clean methods.
 **************************************************/

JointEngine.prototype.redraw = function(){
    this.clean().connection().startCap().endCap().label();
    this.draw().connection().startCap().endCap().label();
};

JointEngine.prototype.listenAll = function(){
    this.listenOnMouseDown(this.startCap());
    this.listenOnMouseDown(this.endCap());
    this.listenOnMouseDown(this.connection());
    this.listenOnDblClick(this.connection());
};

/**
 * This is the beginning of every drawing.
 * Prepares parameters for drawing objects.
 * Defines primitives for drawing.
 * Draw functions (not primitives) store the resulting DOM element 
 * into self._con, self._startCap, self._endCap, self._labelText and self._labelBox respectively.
 * Draw functions support chaining.
 */
JointEngine.prototype.draw = function(){
    var self = this,
    __ = {};
    __.raphael = self._raphael;

    // primitives
    __.line = function(start, end, attrs){ return __.raphael.path(["M", start.x, start.y, "L", end.x, end.y].join(" ")).attr(attrs); };
    __.path = function(commands, attrs){ return __.raphael.path(commands.join(" ")).attr(attrs); };
    __.circle = function(pos, radius, attrs){ return __.raphael.circle(pos.x, pos.y, radius).attr(attrs); };
    __.rect = function(pos, width, height, attrs){ return __.raphael.rect(pos.x, pos.y, width, height).attr(attrs); };
    __.text = function(pos, str){ return __.raphael.text(pos.x, pos.y, str); };

    /**
     * Helpers.
     */

    /**
     * Find point on an object of type 'type' with bounding box 'r' where line starting
     * from r's center ending in point 'p' intersects the object.
     */
    __.boundPoint = function(r, type, p){
	var rCenter = r.center();
	if (type === "circle" || type === "ellipse"){
	    return ellipse(rCenter.x, rCenter.y, r.width/2, r.height/2).intersectionWithLineFromCenterToPoint(p);
	}
	// BUG: in lines intersection, can be all null
	// it happens when point is located on the bb boundary
	return r.boundPoint(p) || rCenter;
    };

    /**
     * Drawing parameters.
     */

    // start object bounding box
    __.sbb = rect(self._start.shape.getBBox()).moveAndExpand(self._opt.bboxCorrection.start);
    if (!NDEBUG){ DBG.push("sbb: " + __.sbb.toString()); }

    // start object bounding box center point
    __.sbbCenter = __.sbb.center();
    if (!NDEBUG){ DBG.push("sbbCenter: " + __.sbbCenter.toString()); }

    // end object bounding box
    __.ebb = rect(self._end.shape.getBBox()).moveAndExpand(self._opt.bboxCorrection.end);
    if (!NDEBUG){ DBG.push("ebb: " + __.ebb.toString()); }

    // end object bounding box center point
    __.ebbCenter = __.ebb.center();
    if (!NDEBUG){ DBG.push("ebbCenter: " + __.ebbCenter.toString()); }

    // intersection of a line leading from __sbbCenter to __ebbCenter 
    // (or first connection vertex) and the start object
    if (self._conVertices.length > 0){
	__.sBoundPoint = __.boundPoint(__.sbb, self._opt.bboxCorrection.start.type || self._start.shape.type, self._conVertices[0]);	
    } else {
	__.sBoundPoint = __.boundPoint(__.sbb, self._opt.bboxCorrection.start.type || self._start.shape.type, __.ebbCenter);	
    }
    if (!NDEBUG){ DBG.push("sBoundPoint: " + __.sBoundPoint.toString()); }

    // intersection of a line leading from __ebbCenter to __sbbCenter 
    // (or last connection vertex) and the end object
    if (self._conVertices.length > 0){
	__.eBoundPoint = __.boundPoint(__.ebb, self._opt.bboxCorrection.end.type || self._end.shape.type, self._conVertices[self._conVertices.length - 1]);	
    } else {
	__.eBoundPoint = __.boundPoint(__.ebb, self._opt.bboxCorrection.end.type || self._end.shape.type, __.sbbCenter);
    }
    if (!NDEBUG){ DBG.push("eBoundPoint: " + __.eBoundPoint.toString()); }

    // angle between __sbbCenter and __ebbCenter (or first connection vertex)
    if (self._conVertices.length > 0){
	__.sTheta = __.sbbCenter.theta(self._conVertices[0]);
    } else {
	__.sTheta = __.sbbCenter.theta(__.ebbCenter);	
    }
    if (!NDEBUG){ DBG.push("theta: " + __.sTheta.degrees + ", " + __.sTheta.radians); }

    // angle between __ebbCenter and __sbbCenter (or last connection vertex)
    if (self._conVertices.length > 0){
	__.eTheta = self._conVertices[self._conVertices.length - 1].theta(__.ebbCenter);
    } else { 
	__.eTheta = __.sbbCenter.theta(__.ebbCenter);
    }
    if (!NDEBUG){ DBG.push("theta: " + __.eTheta.degrees + ", " + __.eTheta.radians); }

    // __sBoundPoint moved in the direction of __eBoundPoint (or first connection vertex) 
    // by start cap width
    __.sPoint = point(
	__.sBoundPoint.x + (2 * self._opt.arrow.start.dx * Math.cos(__.sTheta.radians)),
	__.sBoundPoint.y + (-2 * self._opt.arrow.start.dy * Math.sin(__.sTheta.radians))
    );
    if (!NDEBUG){ DBG.push("sPoint: " + __.sPoint.toString()); }

    // __eBoundPoint moved in the direction of __sBoundPoint (or last connection vertex) 
    // by end cap width
    __.ePoint = point(
	__.eBoundPoint.x + (-2 * self._opt.arrow.end.dx * Math.cos(__.eTheta.radians)),
	__.eBoundPoint.y + (2 * self._opt.arrow.end.dy * Math.sin(__.eTheta.radians))
    );
    if (!NDEBUG){ DBG.push("ePoint: " + __.ePoint.toString()); }

    // connection path commands
    if (self._opt.beSmooth){
	__.conPathCommands = Bezier.curveThroughPoints([point(__.sPoint.x, __.sPoint.y)].concat(self._conVertices, [point(__.ePoint.x, __.ePoint.y)]));
    } else {
	__.conPathCommands = ["M", __.sPoint.x, __.sPoint.y];	
	for (var i = 0, len = self._conVertices.length; i < len; i++){
	    __.conPathCommands.push("L");
	    __.conPathCommands.push(self._conVertices[i].x);
	    __.conPathCommands.push(self._conVertices[i].y);
	}
	__.conPathCommands.push("L");	
	__.conPathCommands.push(__.ePoint.x);
	__.conPathCommands.push(__.ePoint.y);
    }

    // label position
    if (self._labelString != ""){
	__.labelPoint = __.sPoint;
	for (var i = 0, len = self._conVertices.length; i < len; i++){
	    var v = self._conVertices[i];
	    __.labelPoint = line(__.labelPoint, v).midpoint();
	}
	__.labelPoint = line(__.labelPoint, __.ePoint).midpoint();
    }


    return {
	dummyEnd: function(){
	    self._end.dummy = true;
	    self._end.shape = __.circle(__.eBoundPoint, 1, {"opacity": 0.0});
	    self._end.shape.show();
	    return this;
	},
	dummyStart: function(){
	    self._start.dummy = true;
	    self._start.shape = __.circle(__.sBoundPoint, 1, {"opacity": 0.0});
	    self._start.shape.show();
	    return this;
	},
	connection: function(){
	    //	    self._con = __.line(__.sPoint, __.ePoint, self._opt.attrs);
	    self._con = __.path(__.conPathCommands, self._opt.attrs);
	    self._con.node.style.cursor = self._opt.cursor;	
	    //	   self._con.toBack();
	    self._con.show();
	    return this;
	},
	label: function(){
	    if (self._labelString == ""){ return this; }
	    self._labelText = __.text(__.labelPoint, self._labelString);
	    var bb = self._labelText.getBBox();
	    self._labelBox = __.rect(bb, bb.width, bb.height, self._labelAttrs);
	    self._labelText.insertAfter(self._labelBox);
	    return this;
	},
	startCap: function(){
	    var a = self._opt.arrow.start;
	    self._startCap = __.path(a.path, a.attrs);
	    self._startCap.translate(__.sBoundPoint.x + (a.dx * Math.cos(__.sTheta.radians)), 
				     __.sBoundPoint.y - (a.dy * Math.sin(__.sTheta.radians)));
	    if (!NDEBUG){ DBG.push("startCap translation: " + (__.sBoundPoint.x + a.dx * Math.cos(__.sTheta.radians)) + ", " + (__.sBoundPoint.y - a.dy * Math.sin(__.sTheta.radians))); }
	    self._startCap.rotate(360 - (__.sTheta.degrees) + 180);
	    if (!NDEBUG){ DBG.push("startCap rotation: " + (360 - __.sTheta.degrees + 180)); }
	    self._startCap.show();
	    return this;
	},
	endCap: function(){
	    var a = self._opt.arrow.end;
	    self._endCap = __.path(a.path, a.attrs);
	    self._endCap.translate(__.eBoundPoint.x - (a.dx * Math.cos(__.eTheta.radians)), 
				   __.eBoundPoint.y + (a.dy * Math.sin(__.eTheta.radians)));
	    if (!NDEBUG){ DBG.push("endCap translation: " + (__.eBoundPoint.x - a.dx * Math.cos(__.eTheta.radians)) + ", " + (__.eBoundPoint.y + a.dy * Math.sin(__.eTheta.radians))); }
	    self._endCap.rotate(360 - (__.eTheta.degrees));
	    if (!NDEBUG){ DBG.push("endCap rotation: " + (360 - __.eTheta.degrees)); }
	    self._endCap.show();
	    return this;
	}
    };
};

/**
 * Clean operations. 
 * Remove the DOM elements of connection/startCap/endCap/label if they exist.
 * Clean operations support chaining.
 */
JointEngine.prototype.clean = function(){
    var self = this;
    return {
	connection: function(){ 
	    self._con && self._con.remove();
	    return this;
	},
	startCap: function(){
	    self._startCap && self._startCap.remove();
	    return this;
	},
	endCap: function(){ 
	    self._endCap && self._endCap.remove();
	    return this;
	},
	label: function(){
	    self._labelBox && self._labelBox.remove();
	    self._labelText && self._labelText.remove();
	}
    };
};

/**************************************************
 * Joint.
 **************************************************/

function Joint(raphael){ 
    this.engine = new JointEngine().init();
    this.engine._raphael = raphael;
}
window.Joint = Joint;	// the only global variable

/**
 * Register object so that it can be pointed by my cap.
 * @param <obj> raphael object or Shape (or array of raphael objects or Shapes)
 * @param <cap> string "start|end|both" default: "both"
 */
Joint.prototype.register = function(obj, cap){
    if (typeof cap === "undefined"){
	cap = "both";
    }
    if (obj.constructor == Array){
	for (var i = 0, len = obj.length; i < len; i++){
	    this.engine.registeredObjects.push({target: obj[i], cap: cap});
	}
    } else {
	this.engine.registeredObjects.push({target: obj, cap: cap});
    }
    return this;
};

/**
 * Cancel registration of an object.
 * @param <obj> raphael object or Shape
 * @param <cap> string "start|end|both" default: "both"
 */
Joint.prototype.unregister = function(obj, cap){
    if (typeof cap === "undefined"){
	cap = "both";
    }
    var index = -1;
    for (var i = 0, len = this.engine.registeredObjects.length; i < len; i++){
	if (this.engine.registeredObjects[i].target === obj && 
	    this.engine.registeredObjects[i].cap === cap){
	    index = i;
	    break;
	}
    }
    if (index !== -1){
	this.engine.registeredObjects.splice(index, 1);
    }
};

/**
 * Set the vertices of the connection
 * @param <vertices> array of points
 */
Joint.prototype.setVertices = function(vertices){
    this.engine._conVertices = vertices;
    this.engine.redraw();
    this.engine.listenAll();
    return this;
};

/**
 * Toggle the connection smoothing (bezier/straight).
 */
Joint.prototype.toggleSmoothing = function(){
    this.engine._opt.beSmooth = !this.engine._opt.beSmooth;
    this.engine.redraw();
    this.engine.listenAll();
    return this;
};

/**
 * TODO: rotation support. there is a problem because
 * rotation does not set any attribute in this.attrs but
 * instead it sets transformation directly to let the browser
 * SVG engine compute the position.
 */
var _attr = Raphael.el.attr;
Raphael.el.attr = function(){
    // is it a getter or el is not a joint object?
    if ((arguments.length == 1 && (typeof arguments[0] === "string" || typeof arguments[0] === "array")) || (typeof this.joints === "undefined")){
	return _attr.apply(this, arguments);	// yes
    }

    // old attributes
    var o = {};
    for (var key in this.attrs){
	o[key] = this.attrs[key];
    }

    _attr.apply(this, arguments);
    
    var n = this.attrs;	// new attributes

    for (var i = this.joints.length - 1; i >= 0; --i){
	var engine = this.joints[i].engine;
	
	if (o.x != n.x || o.y != n.y ||	// rect/image/text
	    o.cx != n.cx || o.cy != n.cy ||	// circle/ellipse
	    o.path != n.path ||	// path
	    o.r != n.r){	// radius

	    if (this === engine.startObject().shape){
		engine.dispatch(qevt("startPositionChanged"));
	    } else {
		engine.dispatch(qevt("endPositionChanged"));
	    }
	    engine.dispatch(qevt("done"));
	}
	
	if (o.stroke != n.stroke){
	    engine.dispatch(qevt("strokeChanged"));
	}
    }

    return this;
};

/**************************************************
 * TODO: desrcibe all options.
 * Create a joint between the this and to objects.
 * @param to object Raphael object (rect/ellipse/circle)
 * @param opt object options
 *	possible options:
 * {
 *   attrs: connection options, @see Raphael path options
 *   startArrow: {
 *            type: basic|basicArrow|basicRect|aggregationArrow
 *            attrs: @see Raphael path options
 *   },
 *   endArrow: {
 *            type: basic|basicArrow|basicRect|aggregationArrow
 *            attrs: @see Raphael path options
 *   },
 *   bboxCorrection: {  // correction of bounding box (useful when the connection should start in the center of an object, etc...
 *            start: {
 *                type: ellipse|rect,
 *                x: number,
 *                y: number,
 *                width: number,
 *                height: number
 *            },
 *            end: {
 *                type: ellipse|rect,
 *                x: number,
 *                y: number,
 *                width: number,
 *                height: number
 *            }
 *   }
 * }
 ***************************************************/
Raphael.el.joint = function(to, opt){
    var j = new Joint(this.paper);
    j.engine._start.shape = this;
    j.engine._end.shape = to;
//    j.engine._raphael = this.paper;

    if (opt && opt.label){
	j.engine._labelString = opt.label;
    }

    if (opt && opt.attrs){
	for (var key in opt.attrs){
	    j.engine._opt.attrs[key] = opt.attrs[key];
	}
    }
    if (opt && opt.startArrow){
	if (opt.startArrow.type){
	    j.engine._opt.arrow.start = j.engine._arrows[opt.startArrow.type];
	} else { 
	    opt.startArrow.type = "aggregationArrow";
	}
	if (opt.startArrow.attrs){
	    for (var key in opt.startArrow.attrs){
		j.engine._arrows[opt.startArrow.type].attrs[key] = opt.startArrow.attrs[key];
	    }
	}
    }
    if (opt && opt.endArrow){
	if (opt.endArrow.type){
	    j.engine._opt.arrow.end = j.engine._arrows[opt.endArrow.type];
	} else { 
	    opt.endArrow.type = "basicArrow";
	}
	if (opt.endArrow.attrs){
	    for (var key in opt.endArrow.attrs){
		j.engine._arrows[opt.endArrow.type].attrs[key] = opt.endArrow.attrs[key];
	    }
	}
    }
    if (opt && opt.bboxCorrection){
	if (opt.bboxCorrection.start){
	    for (var key in opt.bboxCorrection.start){
		j.engine._opt.bboxCorrection.start[key] = opt.bboxCorrection.start[key];
	    }
	}
	if (opt.bboxCorrection.end){
	    for (var key in opt.bboxCorrection.end){
		j.engine._opt.bboxCorrection.end[key] = opt.bboxCorrection.end[key];
	    }
	}
    }

    j.engine._start.joints.push(j);
    j.engine._end.joints.push(j);
    j.engine._joint = j;

    // to be able to dispatch events in Raphael element attr method
    // TODO: possible source for memory leaks!
    (this.joints) ? this.joints.push(j) : this.joints = [j];
    (to.joints) ? to.joints.push(j) : to.joints = [j];

    j.engine.dispatch(qevt("connect"));
    return j;
};

//})();	// END CLOSURE
