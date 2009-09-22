var NDEBUG = false;
/****************************************************
 * Joint 0.1.2 - JavaScript library for connecting vector objects
 *
 * Copyright (c) 2009 David Durman
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

(function(){	// BEGIN CLOSURE

/**************************************************
 * Quantum hierarchical state machines in JavaScript.
 * Based on the ideas of Miro Samek's C/C++ Quantum hierarchical state machines framework.
 **************************************************/


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
}

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
}

QHsm.prototype.state = function(stateOrName){ 
    if (stateOrName && stateOrName._QState)
	return stateOrName;
    return new QState(this, stateOrName) 
}
QHsm.prototype.top = function(stateOrName){ return new QState(this, "TOP") }
QHsm.prototype.currentState = function(){ return this.myState }
QHsm.prototype.selectorFor = function(stateName){ return "state" + stateName }
QHsm.prototype.dispatchEvent = function(anEvent, aSelector){ 
    return this[aSelector](anEvent) 
}

/**
 * This should not be overridden.
 */
QHsm.prototype.stateTOP = function(anEvent){
    if (anEvent.type === "entry" ||
	anEvent.type === "exit" ||
	anEvent.type === "init" ||
	anEvent.type === "empty")
	return null;
    return this.handleUnhandledEvent(anEvent);
}

/**
 * Override this when needed.
 */
QHsm.prototype.handleUnhandledEvent = function(anEvent){
    return null;
}

/**
 * Traverse the state hierarchy starting from the currently active state myState.
 * Advance up the state hierarchy (i.e., from substates to superstates), invoking all
 * the state handlers in succession. At each level of state nesting, it intercepts the value
 * returned from a state handler to obtain the superstate needed to advance to the next level.
 */
QHsm.prototype.dispatch = function(anEvent){
    if (!(anEvent && anEvent._QEvent))
	anEvent = new QEvent(anEvent);
    this.mySource = this.myState;
    while (this.mySource !== null){
	this.mySource = this.mySource.trigger(anEvent);
    }
}

/**
 * Performs dynamic transition. (macro Q_TRAN_DYN())
 */
QHsm.prototype.newState = function(aStateName){ 
    this.transition(this.state(aStateName)); 
    return null;
}

/**
 * Used by handlers only in response to the #init event. (macro Q_INIT())
 * USAGE: return this.newInitialState("whatever");
 * @return nil for convenience
 */
QHsm.prototype.newInitialState = function(aStateOrName){ 
    this.myState = this.state(aStateOrName); 
    return null;
}

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
    if (thisMySource.equals(p))
	return this.enterVia(target, entry);
    
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
	if (thisMySource.equals(s))
	    return this.enterVia(target, entry);
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
}

// tail of transition()
// we are in the LCA of mySource and target
QHsm.prototype.enterVia = function(target, entry){
    // retrace the entry path in reverse order
    var entryLength = entry.length;
    for (var i = entryLength - 1; i >= 0; i--){
	entry[i].enter();
    }
    this.myState = target;
    while (target.init() == null){
	// initial transition must go one level deep
//	eval(assert(target.equals(this.myState.superstate())));	
	target = this.myState;
	target.enter();
    }
}

/**************************************************
 * QState.
 **************************************************/

function QState(fsm, name){
    this.fsm = fsm;
    this.name = name;
    this._QState = true;
}

QState.prototype.equals = function(state){
    return (this.name === state.name && this.fsm === state.fsm)
}
QState.prototype.dispatchEvent = function(anEvent, aSelector){ 
    return this.fsm.dispatchEvent(anEvent, aSelector);
}
QState.prototype.trigger = function(anEvent){
    var evt = anEvent || new QEvent("NullEvent");
    var selector = this.fsm.selectorFor(this.name);
    //!//TODO: if selector is null than throw an error: "no handler for anEvent.type in state this.name"
    return this.dispatchEvent(evt, selector);
}

QState.prototype.enter = function(){ 
    if (!NDEBUG) console.log("[STATE " + this.name + "] entry");    
    return this.trigger(QEventEntry) 
}
QState.prototype.exit = function(){ 
    if (!NDEBUG) console.log("[STATE " + this.name + "] exit");
    return this.trigger(QEventExit) 
}
QState.prototype.init = function(){ 
    return this.trigger(QEventInit) 
}

/**
 * Answer my superstate. Default is to return fsm top state.
 */
QState.prototype.superstate = function(){ 
    var superstate = this.trigger(new QEvent("empty"));
    if (superstate && superstate._QState)
	return superstate;
    superstate = this.fsm.top();
    if (this.name === superstate.name)
	return null;
    return superstate;
    //return this.fsm.top();
}

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
function qevt(sig, args){ return new QEvent(sig, args) }


/**************************************************
 * Geometry-Primitives.
 **************************************************/

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
 * (cartesian-to-polar coordinates)
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


/**************************************************
 * Engine.
 **************************************************/

function JointEngine(){ 
    QHsm.apply(this, ["Initial"]) 
    this.self = this;
};

JointEngine.prototype = new QHsm;
JointEngine.prototype.stateInitial = function(e){
    /**
     * Slots.
     */

    this._con = null;		// holds the joint path
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
	    "fill": "#fff",
	    "fill-opacity": 1.0,
	    "stroke-width": 1,
	    "stroke-dasharray": "-",
	    "stroke-linecap": "round", // butt/square/round/mitter
	    "stroke-linejoin": "round", // butt/square/round/mitter
	    "stroke-miterlimit": 1,
	    "stroke-opacity": 1.0
	},
	// bounding box correction 
	// (useful when the connection should start in the center of an object, etc...)
	bboxCorrection: {
	    start: { type: null, x: 0, y: 0, width: 0, height: 0 },
	    end: { type: null, x: 0, y: 0, width: 0, height: 0 }
	}
    };
    // various ready-to-use arrows
    this._arrows = {
	basic: {
	    path: ["M","15","0","L","-15","0", "z"],
	    dx: 15, dy: 15, // x, y correction
	    attrs: this._opt.attrs
	},
	basicArrow: {
	    path: ["M","15","0","L","-15","-15","L","-15","15","z"],
	    dx: 15, dy: 15,
	    attrs: { stroke: "black", fill: "black" }
	},
	basicRect: {
	    path: ["M","15","5","L","-15","5","L","-15","-5", "L", "15", "-5", "z"],
	    dx: 15, dy: 15,
	    attrs: { stroke: "black", "stroke-width": 1.0 }
	},
	aggregationArrow: {
	    path: ["M","15","0","L","0","10","L","-15","0", "L", "0", "-10", "z"],
	    dx: 16, dy: 16,
	    attrs: { stroke: "black", "stroke-width": 2.0 }
	}
    };
    // used arrows (default values)
    this._arrow = {
	start: this._arrows.aggregationArrow,
	end: this._arrows.basicArrow
    };
    // initial state of the engine
    this.newInitialState("Idle");
    return null;	// QHsm convention (@see qhsm.js)
};

/*************************************************************
 * Engine states. (engine behaviour is managed by StateChart)
 *************************************************************/

JointEngine.prototype.stateIdle = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "mouseDown":
	if (e.args.onCap){
	    if (e.args.isEndCap)
		this.draw().dummyEnd();
	    else
		this.draw().dummyStart();
	    this.newState("CapDragging");
	}
	return null;
    case "step":
	this.redraw();
	this.listenOnMouseDown(this.endCap());
	this.listenOnMouseDown(this.startCap());
	return null;
    case "connect":
	this.newState("Connected");
	return null;
    }
    return this.top();
};

JointEngine.prototype.stateDisconnected = function(e){
    switch (e.type){
    case "entry": 
	// TODO: remove joint from the old objects joints arrays
	this.listenOnMouseDown(this.endCap());
	this.listenOnMouseDown(this.startCap());
	return null;
    case "exit": return null;	
    case "connect": 
	this.newState("Connected"); return null;
    }
    return this.state("Idle");
};

JointEngine.prototype.stateConnected = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenOnMouseDown(this.endCap());
	this.listenOnMouseDown(this.startCap());
	return null;
    case "exit": return null;	
    }
    return this.state("Idle");
};

JointEngine.prototype.stateOneCapConnected = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenOnMouseDown(this.endCap());
	this.listenOnMouseDown(this.startCap());
	return null;
    case "exit": return null;	
    }
    return this.state("Idle");
};

JointEngine.prototype.stateDragging = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    }	
    return this.top();
};

JointEngine.prototype.stateCapDragging = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "step":
	this.redraw();
	return null;
    case "mouseUp":
	var 
	e = this.endCapConnected(),
	s = this.startCapConnected();
	
	if (e && s)
	    this.newState("Connected");
	else if ( (!e) && (!s) )
	    this.newState("Disconnected");
	else
	    this.newState("OneCapConnected");
	return null;
    }	
    return this.state("Dragging");
};

/**
 * Getters.
 */
JointEngine.prototype.endObject = function(){ return this._end };
JointEngine.prototype.startObject = function(){ return this._start };
JointEngine.prototype.endCap = function(){ return this._endCap };
JointEngine.prototype.endCapConnected = function(){ return !this._end.dummy };
JointEngine.prototype.startCap = function(){ return this._startCap };
JointEngine.prototype.startCapConnected = function(){ return !this._start.dummy };
JointEngine.prototype.joint = function(){ return this._joint };


/**************************************************
 * Cross-browser event handling.
 * From Dean Edwards' addEvent library.
 **************************************************/

function addEvent(element, type, handler) {
    if (element.addEventListener) {
	element.addEventListener(type, handler, false);
    } else {
	// assign each event handler a unique ID
	if (!handler.$$guid) handler.$$guid = addEvent.guid++;
	// create a hash table of event types for the element
	if (!element.events) element.events = {};
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
};
// a counter used to create unique IDs
addEvent.guid = 1;

function removeEvent(element, type, handler) {
    if (element.removeEventListener) {
	element.removeEventListener(type, handler, false);
    } else {
	// delete the event handler from the hash table
	if (element.events && element.events[type]) {
	    delete element.events[type][handler.$$guid];
	}
    }
};

function handleEvent(event) {
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
};

function fixEvent(event) {
    // add W3C standard event methods
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
};
fixEvent.preventDefault = function() {
    this.returnValue = false;
};
fixEvent.stopPropagation = function() {
    this.cancelBubble = true;
};


/**************************************************
 * End caps event processing.
 **************************************************/

JointEngine.prototype.listenOnMouseDown = function(cap){
    cap.engine = this;	// keep self reference
    // register mouseDown event callback
    addEvent(cap.node, "mousedown", function(e){ cap.engine.capDragStart(e, cap) });
    // TODO: remove event when not needed 
};

Joint.draggedCap = null;
Joint.registeredObjects = [];	// TODO: multiple raphael 'windows'

/**
 * MouseDown event callback when on cap.
 */
JointEngine.prototype.capDragStart = function(e, cap){
    console.log("cap drag start");
    Joint.draggedCap = cap;	// keep reference to cap
    if (cap === cap.engine.endCap())	// end cap
	Joint.draggedCap.isEndCap = true;
    else	// start cap
	Joint.draggedCap.isEndCap = false;

    Joint.draggedCap.dx = e.clientX;
    Joint.draggedCap.dy = e.clientY;
    e.preventDefault && e.preventDefault();

    // tell the engine that cap dragging has just started
    var qe = qevt("mouseDown", {onCap: true, isEndCap: Joint.draggedCap.isEndCap});
    Joint.draggedCap.engine.dispatch(qe);
};

/**
 * MouseMove event callback.
 */
Joint.mouseMove = function(e){
    if (Joint.draggedCap !== null){

	var 
	eShape = Joint.draggedCap.engine.endObject().shape,
	sShape = Joint.draggedCap.engine.startObject().shape;

	// move dummy object
	if (Joint.draggedCap.isEndCap)
            eShape.translate(e.clientX - Joint.draggedCap.dx, e.clientY - Joint.draggedCap.dy);
	else
            sShape.translate(e.clientX - Joint.draggedCap.dx, e.clientY - Joint.draggedCap.dy);

        r.safari();

	// save old x and y positions
        Joint.draggedCap.dx = e.clientX;	
        Joint.draggedCap.dy = e.clientY;

	// wake up the engine to redraw the joint
	Joint.draggedCap.engine.dispatch(qevt("step"));
    }
};

/**
 * MouseUp event callback.
 */
Joint.mouseUp = function(e){
    if (Joint.draggedCap !== null){
	var 
	engine = Joint.draggedCap.engine,
	dummy = (Joint.draggedCap.isEndCap) ? engine.endObject() : engine.startObject(),
	dummyBB = dummy.shape.getBBox();

	// dropped on object?
	for (var i = Joint.registeredObjects.length - 1; i >= 0; --i){
	    var o = Joint.registeredObjects[i];

	    if (rect(o.getBBox()).containsPoint(point(dummyBB.x, dummyBB.y))){
		// if yes, do an effect, replace dummy with found object
		// and append connection's Joint object to the object's joints array

		o.animate({scale: 1.2}, 100, function(){o.animate({scale: 1.0}, 100)});
		dummy.shape.remove();	// remove old dummy shape
		dummy.dummy = false;    // it is no longer dummy
		dummy.shape = o;	

		// only if o.joints already doesn't have that Joint object
		if (o.joints.indexOf(engine.joint()) == -1)
		    o.joints.push(engine.joint());
		break;
	    }
	}
	// tell the engine about this event
	engine.dispatch(qevt("mouseUp"));
    }
    Joint.draggedCap = null;	// cap is no longer dragged
};


// register document event handlers
addEvent(document, "mousemove", Joint.mouseMove);
addEvent(document, "mouseup", Joint.mouseUp);


/**************************************************
 * Engine draw/clean methods.
 **************************************************/

JointEngine.prototype.redraw = function(){
    this.clean().connection().startCap().endCap();
    this.draw().connection().startCap().endCap();
};

/**
 * This is the beginning of every drawing.
 * Prepares parameters for drawing objects.
 * Defines primitives for drawing.
 * Draw functions (not primitives) store the resulting DOM element into self._con, self_startCap and self_endCap respectively.
 * Draw functions support chaining.
 */
JointEngine.prototype.draw = function(){
    var self = this,
    __ = {};
    __.raphael = self._raphael;

    // primitives
    __.line = function(start, end, attrs){ return __.raphael.path(attrs, ["M", start.x, start.y, "L", end.x, end.y].join(",")) };
    __.path = function(commands, attrs){	return __.raphael.path(attrs, commands) };
    __.circle = function(pos, radius, attrs){ return __.raphael.circle(pos.x, pos.y, radius).attr(attrs) };
    __.rect = function(pos, width, height, attrs){ return __.raphael.rect(pos.x, pos.y, width, height).attr(attrs) };

    // helpers

    /**
     * Find point on an object of type type with bounding box r where line starting
     * from r's center ending in point intersects the object.
     */
    __.boundPoint = function(r, type, p){
	var rCenter = r.center();
	if (type === "circle" || type === "ellipse")
	    return ellipse(rCenter.x, rCenter.y, r.width/2, r.height/2).intersectionWithLineFromCenterToPoint(p);
	// BUG: in lines intersection, can be all null
	// it happens when point is located on the bb boundary
	return r.boundPoint(p) || rCenter;
    };

    // start object bounding box
    __.sbb = rect(self._start.shape.getBBox()).moveAndExpand(self._opt.bboxCorrection.start);
    // start object bounding box center point
    __.sbbCenter = __.sbb.center();
    // end object bounding box
    __.ebb = rect(self._end.shape.getBBox()).moveAndExpand(self._opt.bboxCorrection.end);
    // end object bounding box center point
    __.ebbCenter = __.ebb.center();
    // angle between __sbbCenter and __ebbCenter
    __.theta = __.sbbCenter.theta(__.ebbCenter);

    // intersection of a line leading from __sbbCenter to __ebbCenter and the start object
    __.sBoundPoint = __.boundPoint(__.sbb, self._opt.bboxCorrection.start.type || self._start.shape.type, __.ebbCenter);
    // intersection of a line leading from __ebbCenter to __sbbCenter and the end object
    __.eBoundPoint = __.boundPoint(__.ebb, self._opt.bboxCorrection.end.type || self._end.shape.type, __.sbbCenter);
    // __sBoundPoint moved in the direction of __eBoundPoint by start cap width
    __.sPoint = { 
	x: __.sBoundPoint.x + (2 * self._arrow.start.dx * Math.cos(__.theta.radians)),
	y: __.sBoundPoint.y + (-2 * self._arrow.start.dy * Math.sin(__.theta.radians))
    };
    // __eBoundPoint moved in the direction of __sBoundPoint by end cap width
    __.ePoint = { 
	x: __.eBoundPoint.x + (-2 * self._arrow.end.dx * Math.cos(__.theta.radians)),
	y: __.eBoundPoint.y + (2 * self._arrow.end.dy * Math.sin(__.theta.radians))
    };

    return {
	dummyEnd: function(){
	    self._end.dummy = true;
	    self._end.shape = __.circle(__.eBoundPoint, 1, {"opacity": .0});
	    self._end.shape.show();
	    return this;
	},
	dummyStart: function(){
	    self._start.dummy = true;
	    self._start.shape = __.circle(__.sBoundPoint, 1, {"opacity": .0});
	    self._start.shape.show();
	    return this;
	},
	connection: function(){
	    self._con = __.line(__.sPoint, __.ePoint, self._opt.attrs);
	    self._con.show();
	    return this;
	},
	startCap: function(){
	    var a = self._arrow.start;
	    self._startCap = __.path(a.path, a.attrs);
	    self._startCap.translate(__.sBoundPoint.x + a.dx * Math.cos(__.theta.radians), 
				     __.sBoundPoint.y - a.dy * Math.sin(__.theta.radians));
	    self._startCap.rotate(360 - __.theta.degrees + 180);
	    self._startCap.show();
	    return this;
	},
	endCap: function(){
	    var a = self._arrow.end;
	    self._endCap = __.path(a.path, a.attrs);
	    self._endCap.translate(__.eBoundPoint.x - a.dx * Math.cos(__.theta.radians), 
				   __.eBoundPoint.y + a.dy * Math.sin(__.theta.radians));
	    self._endCap.rotate(360 - __.theta.degrees);
	    self._endCap.show();
	    return this;
	},
    }
};

/**
 * Clean operations. 
 * Remove the DOM elements of connection/startCap/endCap if they exist.
 * Clean operations support chaining.
 */
JointEngine.prototype.clean = function(){
    var self = this;
    return {
	connection: function(){ 
	    self._con && self._con.remove() ;
	    return this;
	},
	startCap: function(){
	    self._startCap && self._startCap.remove() 
	    return this;
	},
	endCap: function(){ 
	    self._endCap && self._endCap.remove() 
	    return this;
	}
    }
};

/**************************************************
 * Joint.
 **************************************************/

function Joint(){ this.engine = new JointEngine().init() };
window.Joint = Joint;	// the only global variable

/**
 * Hack of the default Raphael translate method.
 */
var _translate = Raphael.el.translate;
Raphael.el.translate = function(x, y){
    _translate.call(this, x, y);
    // simple hack: uncomment to improve performance in slow browsers
    //    if (new Date().getTime() % 2 == 0)  
    if (this.joints){
	for (var i = this.joints.length - 1; i >= 0; --i)
	    this.joints[i].engine.dispatch(qevt("step"));
    }
};

/**************************************************
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
    var j = new Joint();
    j.engine._start.shape = this;
    j.engine._end.shape = to;
    j.engine._raphael = this.paper;

    if (opt && opt.attrs){
	for (var key in opt.attrs)
	    j.engine._opt.attrs[key] = opt.attrs[key];
    }
    if (opt && opt.startArrow){
	if (opt.startArrow.type) 
	    j.engine._arrow.start = j.engine._arrows[opt.startArrow.type];
	else 
	    opt.startArrow.type = "aggregationArrow";
	if (opt.startArrow.attrs)
	    for (var key in opt.startArrow.attrs)
		j.engine._arrows[opt.startArrow.type].attrs[key] = opt.startArrow.attrs[key];
    }
    if (opt && opt.endArrow){
	if (opt.endArrow.type) 
	    j.engine._arrow.end = j.engine._arrows[opt.endArrow.type];
	else 
	    opt.endArrow.type = "basicArrow";
	if (opt.endArrow.attrs)
	    for (var key in opt.endArrow.attrs)
		j.engine._arrows[opt.endArrow.type].attrs[key] = opt.endArrow.attrs[key];
    }
    if (opt && opt.bboxCorrection){
	if (opt.bboxCorrection.start){
	    for (var key in opt.bboxCorrection.start)
		j.engine._opt.bboxCorrection.start[key] = opt.bboxCorrection.start[key];
	}
	if (opt.bboxCorrection.end){
	    for (var key in opt.bboxCorrection.end)
		j.engine._opt.bboxCorrection.end[key] = opt.bboxCorrection.end[key];
	}
    }

    j.engine._start.joints.push(j);
    j.engine._end.joints.push(j);
    j.engine._joint = j;

    // to be able to dispatch events in Raphael element translate method
    (this.joints) ? this.joints.push(j) : this.joints = [j];
    (to.joints) ? to.joints.push(j) : to.joints = [j];

    j.engine.dispatch(qevt("connect"));
};

})();	// END CLOSURE
