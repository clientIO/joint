/**
 * @fileoverview Joint - JavaScript library for connecting vector objects
 * @author David Durman
 * @version 0.1.3
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
 */
(function(global){	// BEGIN CLOSURE

var 
math = global.Math,
cos = math.cos,
sin = math.sin,
sqrt = math.sqrt,
mmin = math.min,
mmax = math.max,
atan2 = math.atan2,
acos = math.acos,
PI = math.PI;

if (!global.console){
    global.console = {
	log: function(){},
	warn: function(){},
	error: function(){},
	debug: function(){}
    };
}

if (!Array.indexOf){
    /**
     * Array.indexOf is missing in IE 8.
     * @private
     */
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
 * Computes all the neccessary variables for drawing a connection.
 * Singleton.
 * @private
 * @constructor
 * @todo implement Memento object.
 */
function ConstraintSolver(){}

ConstraintSolver.prototype = {
    _startShapeBBox: null,
    _endShapeBBox: null,
    _startShapeType: null,
    _endShapeType: null,    
    _conVertices: [],
    _arrowStartShift: {dx: 0, dy: 0},
    _arrowEndShift: {dx: 0, dy: 0},
    _bboxCorrection: {
	start: { type: null, x: 0, y: 0, width: 0, height: 0 },
	end: { type: null, x: 0, y: 0, width: 0, height: 0 }
    },
    _flags: {
	smooth: false,
	label: false
    },
    _state: {
	/*
	 sBoundPoint: undefined,
	 eBoundPoint: undefined,
	 conPathCommands: undefined,
	 labelPoint: undefined,
	 sTheta: undefined,
	 eTheta: undefined
	 */
    },
    _aux: {
	/*
	 sbb: undefined,
	 ebb: undefined,
	 sbbCenter: undefined,
	 ebbCenter: undefined,
	 sPoint: undefined,
	 ePoint: undefined
	 */
    },
    /**
     * Get state of csolver. Useful for possible undo operations. (Command design pattern)
     * @todo get a deep copy of the state.
     */    
    getMemento: function(){
	var s = this._state;
	if (!s.sBoundPoint || !s.eBoundPoint){
	    return {
		empty: true,
		sBoundPoint: point(0, 0),
		eBoundPoint: point(0, 0),
		conPathCommands: [],
		labelPoint: point(0, 0),
		sTheta: {degrees: 0, radians: 0},
		eTheta: {degrees: 0, radians: 0}
	    };
	} else {
	    return {
		sBoundPoint: s.sBoundPoint.deepCopy(),
		eBoundPoint: s.eBoundPoint.deepCopy(),
		conPathCommands: s.conPathCommands.slice(0),
		labelPoint: (s.labelPoint) ? s.labelPoint.deepCopy() : point(0, 0),
		sTheta: {degrees: s.sTheta.degrees, radians: s.sTheta.radians},
		eTheta: {degrees: s.eTheta.degrees, radians: s.eTheta.radians}
	    };
	}
    },
    /**
     * Invalidate csolver, i.e. each variable will be computed again.
     */
    invalidate: function(){
	this._state = {};
	this._aux = {};
    },
    /**
     * Find point on an object of type 'type' with bounding box 'r' where line starting
     * from r's center ending in point 'p' intersects the object.
     */
    boundPoint: function(r, type, p){
	var rCenter = r.center();
	if (type === "circle" || 
	    type === "ellipse"){
	    return ellipse(rCenter, r.width/2, r.height/2).intersectionWithLineFromCenterToPoint(p);
	}
	// BUG: in lines intersection, can be all null
	// it happens when point is located on the bb boundary
	return r.boundPoint(p) || rCenter;
    },
    /**
     * intersection of a line leading from __sbbCenter to __ebbCenter 
     * (or first connection vertex) and the start object boundary
     */
    sBoundPoint: function(){
	if (this._state.sBoundPoint){
	    return this._state.sBoundPoint;
	}
	var from;
	if (this._conVertices.length > 0){
	    from = this._conVertices[0];
	} else {
	    from = this.ebbCenter();
	}
	this._state.sBoundPoint = this.boundPoint(this.sbb(), this._bboxCorrection.start.type || this._startShapeType, from);
	return this._state.sBoundPoint;
    },
    /** 
     * intersection of a line leading from __ebbCenter to __sbbCenter 
     * (or last connection vertex) and the end object boundary
     */
    eBoundPoint: function(){
	if (this._state.eBoundPoint){
	    return this._state.eBoundPoint;
	}
	var from;
	if (this._conVertices.length > 0){
	    from = this._conVertices[this._conVertices.length - 1];
	} else {
	    from = this.sbbCenter();
	}
	this._state.eBoundPoint = this.boundPoint(this.ebb(), this._bboxCorrection.end.type || this._endShapeType, from);
	return this._state.eBoundPoint;
    },
    /**
     * angle between __sbbCenter and __ebbCenter (or first connection vertex)	
     */
    sTheta: function(){
	if (this._state.sTheta){
	    return this._state.sTheta;
	}
	var to;
	if (this._conVertices.length > 0){
	    to = this._conVertices[0];
	} else {
	    to = this.ebbCenter();
	}
	this._state.sTheta = this.sbbCenter().theta(to);
	return this._state.sTheta;
    },
    /**
     * angle between __ebbCenter and __sbbCenter (or last connection vertex)
     */
    eTheta: function(){
	if (this._state.eTheta){
	    return this._state.eTheta;
	}
	var from;
	if (this._conVertices.length > 0){
	    from = this._conVertices[this._conVertices.length - 1];
	} else {
	    from = this.sbbCenter();
	}
	this._state.eTheta = from.theta(this.ebbCenter());
	return this._state.eTheta;
    },
    /**
     * connection path commands
     */
    conPathCommands: function(){
	if (this._state.conPathCommands){
	    return this._state.conPathCommands;
	}
	var
	sPoint = this.sPoint(),
	ePoint = this.ePoint(),
	state = this._state;

	if (this._flags.smooth){
	    state.conPathCommands = Bezier.curveThroughPoints([point(sPoint.x, sPoint.y)].concat(this._conVertices, [point(ePoint.x, ePoint.y)]));
	} else {
	    state.conPathCommands = ["M", sPoint.x, sPoint.y];
	    for (var i = 0, len = this._conVertices.length; i < len; i++){
		state.conPathCommands.push("L", this._conVertices[i].x, this._conVertices[i].y);
	    }
	    state.conPathCommands.push("L", ePoint.x, ePoint.y);
	}
	return state.conPathCommands;
    },
    /**
     * label position
     */
    labelPoint: function(){
	var state = this._state;

	if (state.labelPoint){
	    return state.labelPoint;
	}
	var 
	sPoint = this.sPoint(),
	ePoint = this.ePoint();

	state.labelPoint = sPoint;
	for (var i = 0, len = this._conVertices.length; i < len; i++){
	    state.labelPoint = line(state.labelPoint, this._conVertices[i]).midpoint();
	}
	state.labelPoint = line(state.labelPoint, ePoint).midpoint();
	return state.labelPoint;
    },
    /**
     * start object bounding box
     */
    sbb: function(){
	var aux = this._aux;

	if (aux.sbb){
	    return aux.sbb;
	}
	aux.sbb = rect(this._startShapeBBox).moveAndExpand(this._bboxCorrection.start);
	return aux.sbb;
    },
    /**
     * start object bounding box center point
     */
    sbbCenter: function(){
	var aux = this._aux;

	if (aux.sbbCenter){
	    return aux.sbbCenter;
	}
	aux.sbbCenter = this.sbb().center();
	return aux.sbbCenter;
    },
    /**
     * end object bounding box
     */
    ebb: function(){
	var aux = this._aux;

	if (aux.ebb){
	    return aux.ebb;
	}
	aux.ebb = rect(this._endShapeBBox).moveAndExpand(this._bboxCorrection.end);
	return aux.ebb;
    },
    /**
     * end object bounding box center point
     */
    ebbCenter: function(){
	var aux = this._aux;

	if (aux.ebbCenter){
	    return aux.ebbCenter;
	}
	aux.ebbCenter = this.ebb().center();
	return aux.ebbCenter;
    },
    /**
     * __sBoundPoint moved in the direction of __eBoundPoint (or first connection vertex) 
     * by start cap width
     */
    sPoint: function(){
	var aux = this._aux;

	if (aux.sPoint){
	    return aux.sPoint;
	}
	var 
	sBoundPoint = this.sBoundPoint(),
	sTheta = this.sTheta(),
	arrowStartShift = this._arrowStartShift;
	
	aux.sPoint = point(
	    sBoundPoint.x + (2 * arrowStartShift.dx * cos(sTheta.radians)),
	    sBoundPoint.y + (-2 * arrowStartShift.dy * sin(sTheta.radians))
	);
	return aux.sPoint;
    },
    /**
     * __eBoundPoint moved in the direction of __sBoundPoint (or last connection vertex) 
     * by end cap width
     */
    ePoint: function(){
	var aux = this._aux;

	if (aux.ePoint){
	    return aux.ePoint;
	}
	var 
	eBoundPoint = this.eBoundPoint(),
	eTheta = this.eTheta(),
	arrowEndShift = this._arrowEndShift;
	
	aux.ePoint = point(
	    eBoundPoint.x + (-2 * arrowEndShift.dx * cos(eTheta.radians)),
	    eBoundPoint.y + (2 * arrowEndShift.dy * sin(eTheta.radians))
	);
	return aux.ePoint;
    }
};

/**
 * @name Joint
 * @constructor
 * @param {RaphaelObject|Shape|object} from Object/position where the connection starts.
 * @param {RaphaelObject|Shape|object} to Object/position where the connection ends.
 * @param {object} [opts] opt Options
 * @param {object} [opts.interactive] Is the joint interactive?  [default = true]
 * @param {array} [opts.vertices] Connection path vertices.
 * @param {string} [opts.label] Label.
 * @param {object} [opts.labelBoxAttrs] SVG Attributes of the label bounding rectangle.
 * @param {object} [opts.attrs] Connection options (see Raphael path options)
 * @param {object} [opts.startArrow] Start arrow options
 * @param {string} [opts.startArrow.type] "basic"|"basicArrow"|...
 * @param {object} [opts.startArrow.attrs] Start Arrow options (see Raphael path options)
 * @param {object} [opts.endArrow] End arrow options
 * @param {string} [opts.endArrow.type] "basic"|"basicArrow"|...
 * @param {object} [opts.endArrow.attrs] End Arrow options (see Raphael path options)
 * @param {object} [opts.bboxCorrection] Correction of bounding box (useful when the connection should start in the center of an object, etc...
 * @param {object} [opts.bboxCorrection.start] BBox correction of start object.
 * @param {string} [opts.bboxCorrection.start.type] "ellipse"|"rect"
 * @param {number} [opts.bboxCorrection.start.x] Translation in x-axis
 * @param {number} [opts.bboxCorrection.start.y] Translation in y-axis
 * @param {number} [opts.bboxCorrection.start.width] BBox width
 * @param {number} [opts.bboxCorrection.start.height] BBox height
 * @param {object} [opts.bboxCorrection.end] BBox correction of end object.
 * @param {string} [opts.bboxCorrection.end.type] "ellipse"|"rect"
 * @param {number} [opts.bboxCorrection.end.x] Translation in x-axis
 * @param {number} [opts.bboxCorrection.end.y] Translation in y-axis
 * @param {number} [opts.bboxCorrection.end.width] BBox width
 * @param {number} [opts.bboxCorrection.end.height] BBox height
 */
function Joint(from, to, opt){ 
    if (!(this instanceof Joint)){
	return new Joint(from, to, opt);
    }
    /**
     * @private
     * @type RaphaelPaper
     */
    var paper = this.paper = Joint.paper();

    // these objects are the ones I can connect to
    this._registeredObjects = [];

    // label related properties
    this._labelBox = null;	// rectangle where labelText is located
    this._labelText = null;	// Raphael text element that keeps its position with connection path middle point
    
    this._con = null;		// holds the joint path
    this._conVerticesCurrentIndex = 0;
    this._nearbyVertexSqrDist = 500;	// sqrt(this._nearbyVertexSqrDist) is tolerable distance of vertex moving
    this._startCap = null;	// start glyph (arrow)
    this._endCap = null;	// end glyph (arrow)
    this._lastStartCapSticker = null;	// temporaries for last start/end cap stickers (objects to which the caps sticked to e.g. while moving)
    this._lastEndCapSticker = null;

    // connection from start to end
    this._start = { // start object
	shape: null,		// Raphael object
	dummy: false		// is it a dummy object?
    };		
    this._end = { // end object
	shape: null,		// Raphael object
	dummy: false		// is it a dummy object?
    };		

    // _con path options
    this._opt = {
	vertices: [],	// joint path vertices
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
	interactive: true, // is the connection interactive? 
	label: undefined,
	labelBoxAttrs: {stroke: "white", fill: "white"},
	// bounding box correction 
	// (useful when the connection should start in the center of an object, etc...)
	bboxCorrection: {
	    start: { type: null, x: 0, y: 0, width: 0, height: 0 },
	    end: { type: null, x: 0, y: 0, width: 0, height: 0 }
	},
	// dummy nodes radius and SVG attributes
	dummy: {
	    start: {
		radius: 1,
		attrs: {"opacity": 0.0, "fill": "red"}
	    },
	    end: {
		radius: 1,
		attrs: {"opacity": 0.0, "fill": "yellow"}
	    }
	},
	// handles (usefull when picking "none" type of arrow)
	handle: {
	    timeout: 2000,
	    start: {
		enabled: false,
		radius: 4,
		attrs: { opacity: 1.0, fill: "red", stroke: "black" }
	    },
	    end: {
		enabled: false,
		radius: 4,
		attrs: { opacity: 1.0, fill: "red", stroke: "black" }
	    }
	}
    };
    // used arrows (default values)
    this._opt.arrow = {
	start: Joint.getArrow("none", 2, this._opt.attrs),
	end: Joint.getArrow("basic", 5)
    };
    // options
    if (opt) this.processOptions(opt);

    var 
    startObject = this._start,
    endObject = this._end;

//    if (from._isPoint){
    if (from.x && from.y){
	// draw dummy start
	var dummyStart = this._opt.dummy.start;
	startObject.shape = paper.circle(from.x, from.y, dummyStart.radius).attr(dummyStart.attrs);
	startObject.dummy = true;
	startObject.shape.show();
    } else {
	startObject.shape = from;
    }
//    if (to._isPoint){
    if (to.x && to.y){
	// draw dummy end
	var dummyEnd = this._opt.dummy.end;
	endObject.shape = paper.circle(to.x, to.y, dummyEnd.radius).attr(dummyEnd.attrs);
	endObject.dummy = true;
	endObject.shape.show();
    } else {
	endObject.shape = to;
    }
    /**
     * Constraint solver.
     * @private
     * @type ConstraintSolver
     */
    this.csolver = new ConstraintSolver();
    // has to be set after shapes assignment and option processing
    this.setConstraintSolver(this.csolver);

    // to be able to dispatch events in Raphael element attr method
    // TODO: possible source of memory leaks!!!
    this.addJoint(startObject.shape);
    this.addJoint(endObject.shape);
    // draw
    this.update();
}
global.Joint = Joint;	// the only global variable

Joint.euid = 1;	// elements/joints unique id 
Joint.generateEuid = function(){
    if (this._euid === undefined) this._euid = Joint.euid++;
    return this._euid;
};

/**
 * @private
 */
Joint.prototype = {
    // temporaries for moving objects
    _dx: undefined,
    _dy: undefined,
    /**
     * States.
     */
    IDLE: 0,
    STARTCAPDRAGGING: 1,
    ENDCAPDRAGGING: 2,
    CONNECTIONWIRING: 3,
    state: 0,	// IDLE
    /**
     * Callbacks.
     * @name Callbacks
     */
    _callbacks: {
	// called when a joint has just connected to an object
	// the object is accessed using this, 
	// the only argument is what side has been connected ("start" | "end")
	justConnected: function(side){},
	disconnected: function(side){},
	justBroken: function(mousePos){},
	wiring: function(mousePos){},
	objectMoving: function(obj){}
    },
    /**
     * Return joint unique identifier.
     */
    euid: function(){
	return Joint.generateEuid.call(this);
    },
    /**
     * Getters.
     */
    connection: function(){ return this._con; },
    endObject: function(){ return this._end; },
    startObject: function(){ return this._start; },
    endCap: function(){ return this._endCap; },
    endCapConnected: function(){ return !this._end.dummy; },
    startCap: function(){ return this._startCap; },
    startCapConnected: function(){ return !this._start.dummy; },
    isStartCap: function(cap){ return (cap === this.startCap()) ? true : false; },
    isEndCap: function(cap){ return (cap === this.endCap()) ? true : false; },
    isStartDummy: function(){ return this._start.dummy; },
    isEndDummy: function(){ return this._end.dummy; },
    /**
     * Replaces dummy object with a new object.
     * @param {object} startOrEnd start or end object (old dummy)
     * @param {RaphaelObject} o
     */
    replaceDummy: function(startOrEnd, o){
	// assert(startOrEnd.dummy == true)    
	startOrEnd.shape.remove();
	startOrEnd.dummy = false;
	startOrEnd.shape = o;
    },
    /**
     * Calls a callback.
     * @param {function} fnc Callback function
     * @param {object} scope Scope of the callback
     * @param {array} args Array of arguments
     */
    callback: function(fnc, scope, args){
	this._callbacks[fnc].apply(scope, args);
    },
    /**
     * Search the registered objects and get the one (if any)
     * who's bounding box contains the point p.
     * @todo check document.elementFromPoint(x, y)
     * @param {Point}
     */
    objectContainingPoint: function(p){
	for (var i = this._registeredObjects.length - 1; i >= 0; --i){
	    var o = this._registeredObjects[i];
	    if (rect(o.getBBox()).containsPoint(p)){
		return o;
	    }
	}
	return null;
    },
    /**
     * Remove reference to Joint from obj.
     * @param {StartObject|EndObject} obj
     */
    freeJoint: function(obj){
	var 
	jar = obj.shape.joints(),	// joints array
	i = jar.indexOf(this);
	jar.splice(i, 1);
	if (jar.length === 0){
	    delete obj.shape._joints;
	}
    },
    /**
     * Add reference to Joint to obj.
     * @param {RaphaelObject} obj
     */
    addJoint: function(obj){
	if (!obj.joints){
	    obj._joints = [];
	    obj.joints = function(){ return this._joints; };
	}
	// push the Joint object into obj.joints array
	// but only if obj.joints already doesn't have that Joint object
	if (obj.joints().indexOf(this) === -1){
	    obj.joints().push(this);
	}
    },
    /**
     * MouseDown event callback when on cap.
     * @param {Event} e
     * @param {RaphaelObject} cap
     */
    capMouseDown: function(e, cap){
	Joint.currentJoint = this;	// keep global reference to me
	this._dx = e.clientX;
	this._dy = e.clientY;

	if (this.isStartCap(cap)){
	    if (!this.isStartDummy()){
		this._lastStartCapSticker = this.startObject();
		this.draw().dummyStart();
	    }
	    this.state = this.STARTCAPDRAGGING;
	} else if (this.isEndCap(cap)){
	    if (!this.isEndDummy()){
		this._lastEndCapSticker = this.endObject();
		this.draw().dummyEnd();
	    }
	    this.state = this.ENDCAPDRAGGING;
	}
    },
    /**
     * MouseDown event callback when on connection.
     * @param {Event} e
     */
    connectionMouseDown: function(e){
	Joint.currentJoint = this;	// keep global reference to me
	var mousePos = Joint.getMousePosition(e, this.paper.canvas);

	// if the mouse position is nearby a connection vertex
	// do not create a new one but move the selected one instead
	for (var i = 0, len = this._opt.vertices.length; i < len; i++){
	    var v = this._opt.vertices[i];
	    if (line(v, mousePos).squaredLength() < this._nearbyVertexSqrDist){
		this._conVerticesCurrentIndex = i;
		this.state = this.CONNECTIONWIRING;
		return;
	    }
	}

	// new vertices can be added CORRECTLY only at the end
	// or at the start of the connection
	// -> @todo 
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
	    this._opt.vertices.unshift(mousePos);
	} else {
	    // new vertex is added to the end of the vertex array
	    this._conVerticesCurrentIndex = this._opt.vertices.push(mousePos) - 1;
	}
	this.state = this.CONNECTIONWIRING;
	this.callback("justBroken", this, [mousePos]);
    },
    capDragging: function(e){
	// move dummy object
	if (this.state === this.STARTCAPDRAGGING){
	    this.startObject().shape.translate(e.clientX - this._dx, e.clientY - this._dy);
	} else if (this.state === this.ENDCAPDRAGGING) {
	    this.endObject().shape.translate(e.clientX - this._dx, e.clientY - this._dy);	
	} else {
	    return;	// should not happen
	}
	this._dx = e.clientX;
	this._dy = e.clientY;
	
	this.update();
    },
    capEndDragging: function(){
	var dummyBB, capType;

	if (this.state === this.STARTCAPDRAGGING){
	    dummyBB = this.startObject().shape.getBBox();
	} else if (this.state === this.ENDCAPDRAGGING){
	    dummyBB = this.endObject().shape.getBBox();
	}
	var o = this.objectContainingPoint(point(dummyBB.x, dummyBB.y));
	if (o === null){
	    var disconnectedFrom = null;
	    if (this.state === this.STARTCAPDRAGGING){
		capType = "start";
		disconnectedFrom = this._lastStartCapSticker;
	    } else if (this.state === this.ENDCAPDRAGGING){
		capType = "end";
		disconnectedFrom = this._lastEndCapSticker;
	    }
	    if (disconnectedFrom !== null){
		this.callback("disconnected", disconnectedFrom, [capType]);
	    }
	    return;
	}

	if (this.state === this.STARTCAPDRAGGING && o._capToStick !== "end"){
	    capType = "start";
	} else if (this.state === this.ENDCAPDRAGGING && o._capToStick !== "start"){
	    capType = "end";
	}
	this.callback("justConnected", o, [capType]);
	this.replaceDummy(this[capType + "Object"](), o);
	this.addJoint(o);
	this._lastStartCapSticker = null;
	this._lastEndCapSticker = null;
	this.update();
    },
    connectionWiring: function(e){
	var mousePos = Joint.getMousePosition(e, this.paper.canvas);
	this._opt.vertices[this._conVerticesCurrentIndex] = mousePos;
	this.update();
	this.callback("wiring", this, [mousePos]);
    },
    update: function(){
//	this.redraw().listenAll();	
	// setTimeout makes drawing much faster!
	var self = this; 
	setTimeout(function(){self.redraw().listenAll();}, 0);
    },
    redraw: function(){
	this.clean().connection().startCap().endCap().handleStart().handleEnd().label();
	this.draw().connection().startCap().endCap().handleStart().handleEnd().label();
/*
	this.clean().connection().label();
	this.draw().connection().transStartCap().transEndCap().label();
*/
	return this;
    },
    listenAll: function(){
	if (!this._opt.interactive){
	    return this;
	}
	var self = this;
	Joint.addEvent(this.startCap().node, "mousedown", function(e){ 
			   self.capMouseDown(e, self.startCap());
			   e.stopPropagation();
			   e.preventDefault();
		       });
	if (this._opt.handle.start.enabled){
	    Joint.addEvent(this._startHandle.node, "mousedown", function(e){ 
			       self.capMouseDown(e, self.startCap());
			       e.stopPropagation();
			       e.preventDefault();
			   });
	}
	if (this._opt.handle.end.enabled){
	    Joint.addEvent(this._endHandle.node, "mousedown", function(e){ 
			       self.capMouseDown(e, self.endCap());
			       e.stopPropagation();
			       e.preventDefault();
			   });
	}
	if (this._opt.handle.timeout !== Infinity){
	    Joint.addEvent(this.connection().node, "mouseover", function(e){ 
			       self.showHandle();
			       setTimeout(function(){
					      self.hideHandle();
					  }, self._opt.handle.timeout);
			       e.stopPropagation();
			       e.preventDefault();
			   });
	}
	Joint.addEvent(this.endCap().node, "mousedown", function(e){ 
			   self.capMouseDown(e, self.endCap());
			   e.stopPropagation();
			   e.preventDefault();
		       });
	Joint.addEvent(this.connection().node, "mousedown", function(e){
			   self.connectionMouseDown(e); 
			   e.stopPropagation();
			   e.preventDefault();
		       });
	return this;
    },
    /**
     * This is the beginning of every drawing.
     * Prepares parameters for drawing objects.
     * Defines primitives for drawing.
     * Draw functions (not primitives) store the resulting DOM element 
     * into self._con, self._startCap, self._endCap, self._labelText and self._labelBox respectively.
     * Draw functions support chaining.
     *
     * @todo for better performance, get primitives out of draw() method, otherwise
     * they will be created each time draw() method is called.
     */
    draw: function(){
	var 
	self = this,
	csolver = this.csolver,
	paper = this.paper,
	csolverMemento = csolver.getMemento();

	// set contraint solver
	this.setConstraintSolver(csolver);
	// invalidate contraint solver
	// @todo invalidation must be done elsewhere
	// and must invalidate only specific variables
	csolver.invalidate();

	return {
	    dummy: function(startOrEnd, pos, opt){
		startOrEnd.dummy = true;
		startOrEnd.shape = paper.circle(pos.x, pos.y, opt.radius).attr(opt.attrs);
		startOrEnd.shape.show();
		return this;
	    },
	    dummyStart: function(){
		return this.dummy(self._start, csolver.sBoundPoint(), self._opt.dummy.start);
	    },
	    dummyEnd: function(){
		return this.dummy(self._end, csolver.eBoundPoint(), self._opt.dummy.end);
	    },
	    handleStart: function(){
		var opt = self._opt.handle.start;
		if (!opt.enabled){
		    return this;
		}
		var pos = csolver.sBoundPoint();
		self._startHandle = paper.circle(pos.x, pos.y, opt.radius).attr(opt.attrs);
		return this;
	    },
	    handleEnd: function(){
		var opt = self._opt.handle.end;
		if (!opt.enabled){
		    return this;
		}
		var pos = csolver.eBoundPoint();
		self._endHandle = paper.circle(pos.x, pos.y, opt.radius).attr(opt.attrs);
		return this;
	    },
	    connection: function(){
		var opt = self._opt;
		self._con = paper.path(csolver.conPathCommands().join(" ")).attr(opt.attrs);
		var con = self._con;
		con.node.style.cursor = opt.cursor;	
		//	   self._con.toBack();
		con.show();
		return this;
	    },
	    label: function(){
		if (self._opt.label === undefined){ 
		    return this; 
		}
		var pos = csolver.labelPoint();
		self._labelText = paper.text(pos.x, pos.y, self._opt.label);
		var bb = self._labelText.getBBox();
		self._labelBox = paper.rect(bb.x, bb.y, bb.width, bb.height).attr(self._opt.labelBoxAttrs);
		self._labelText.insertAfter(self._labelBox);
		return this;
	    },
	    transStartCap: function(){
		var 
		opt = self._opt.arrow.start,
		sBoundPoint = csolver.sBoundPoint(),
		sTheta = csolver.sTheta();

		if (!self._startCap){
		    this.startCap();
		} else {
		    var 
		    startCap = self._startCap,
		    csm = csolverMemento,
		    rotNew = 360 - sTheta.degrees + 180,
		    rotOld = 360 - csm.sTheta.degrees + 180,
		    trNewX = sBoundPoint.x + (opt.dx * cos(sTheta.radians)),
		    trNewY = sBoundPoint.y - (opt.dy * sin(sTheta.radians)),
		    trOldX = csm.sBoundPoint.x + (opt.dx * cos(csm.sTheta.radians)),
		    trOldY = csm.sBoundPoint.y - (opt.dy * sin(csm.sTheta.radians));

		    if (!csm.empty){
			startCap.translate(trNewX - trOldX, trNewY - trOldY);
			startCap.rotate(rotNew - rotOld);
		    } // else no change
		}
		return this;
	    },
	    transEndCap: function(){
		var 
		opt = self._opt.arrow.end,
		eBoundPoint = csolver.eBoundPoint(),
		eTheta = csolver.eTheta();

		if (!self._endCap){
		    this.endCap();
		} else {
		    var 
		    endCap = self._endCap,
		    csm = csolverMemento,
		    rotNew = 360 - eTheta.degrees + 180,
		    rotOld = 360 - csm.eTheta.degrees + 180,
		    trNewX = eBoundPoint.x - (opt.dx * cos(eTheta.radians)),
		    trNewY = eBoundPoint.y + (opt.dy * sin(eTheta.radians)),
		    trOldX = csm.eBoundPoint.x - (opt.dx * cos(csm.eTheta.radians)),
		    trOldY = csm.eBoundPoint.y + (opt.dy * sin(csm.eTheta.radians));

		    if (!csm.empty){
			endCap.translate(trNewX - trOldX, trNewY - trOldY);
			endCap.rotate(rotNew - rotOld);
		    } // else no change
		}
		return this;
	    },
	    startCap: function(){
		var 
		opt = self._opt.arrow.start,
		sBoundPoint = csolver.sBoundPoint(),
		sTheta = csolver.sTheta();

		self._startCap = paper.path(opt.path.join(" ")).attr(opt.attrs);
		var startCap = self._startCap;
		startCap.translate(sBoundPoint.x + (opt.dx * cos(sTheta.radians)), 
				   sBoundPoint.y - (opt.dy * sin(sTheta.radians)));
		startCap.rotate(360 - (sTheta.degrees) + 180);
		startCap.show();
		return this;
	    },
	    endCap: function(){
		var 
		opt = self._opt.arrow.end,
		eBoundPoint = csolver.eBoundPoint(),
		eTheta = csolver.eTheta();

		self._endCap = paper.path(opt.path.join(" ")).attr(opt.attrs);
		var endCap = self._endCap;
		endCap.translate(eBoundPoint.x - (opt.dx * cos(eTheta.radians)), 
				 eBoundPoint.y + (opt.dy * sin(eTheta.radians)));
		endCap.rotate(360 - (eTheta.degrees));
		endCap.show();
		return this;
	    }
	};
    },
    /**
     * Clean operations. 
     * Remove the DOM elements of connection/startCap/endCap/label if they exist.
     * Clean operations support chaining.
     */
    clean: function(){
	var self = this;
	return {
	    connection: function(){ 
		var con = self._con;
		if (con){ con.remove(); }
		return this;
	    },
	    startCap: function(){
		var startCap = self._startCap;
		if (startCap){ startCap.remove(); }
		return this;
	    },
	    endCap: function(){ 
		var endCap = self._endCap;
		if (endCap){ endCap.remove(); }
		return this;
	    },
	    label: function(){
		var 
		labelBox = self._labelBox,
		labelText = self._labelText;
		if (labelBox){ labelBox.remove(); }
		if (labelText){ labelText.remove(); }
		return this;
	    },
	    dummyEnd: function(){
		var end = self._end;
		if (end.dummy && end.shape){
		    end.shape.remove();
		}
		return this;
	    },
	    dummyStart: function(){
		var start = self._start;
		if (start.dummy && start.shape){
		    start.shape.remove();
		}
		return this;
	    },
	    handleStart: function(){
		var startHandle = self._startHandle;
		if (startHandle){
		    startHandle.remove();
		}
		return this;
	    },
	    handleEnd: function(){
		var endHandle = self._endHandle;
		if (endHandle){
		    endHandle.remove();
		}
		return this;
	    }
	};
    },

    setConstraintSolver: function(csolver){
	if (this._start.shape){
	    csolver._startShapeBBox = this._start.shape.getBBox();
	    csolver._startShapeType = this._start.shape.type;
	} else {
	    csolver._startShapeBBox = {x: 0, y: 0, width: 0, height: 0};
	    csolver._startShapeType = "rect";
	}
	if (this._end.shape){
	    csolver._endShapeBBox = this._end.shape.getBBox();
	    csolver._endShapeType = this._end.shape.type;
	} else {
	    csolver._endShapeBBox = {x: 0, y: 0, width: 0, height: 0};
	    csolver._endShapeType = "rect";
	}

	csolver._conVertices = this._opt.vertices;
	csolver._arrowStartShift = {dx: this._opt.arrow.start.dx, dy: this._opt.arrow.start.dy};
	csolver._arrowEndShift = {dx: this._opt.arrow.end.dx, dy: this._opt.arrow.end.dy};
	csolver._bboxCorrection = this._opt.bboxCorrection;
	csolver._flags.smooth = this._opt.beSmooth;
	csolver._flags.label = (this._opt.label !== undefined);    
    },
    /**
     * Process options.
     * @private
     * @param {object} opt
     */
    processOptions: function(opt){
	var key;
	if (opt.interactive !== undefined) this._opt.interactive = opt.interactive;
	if (opt.attrs){
	    for (key in opt.attrs){
		this._opt.attrs[key] = opt.attrs[key];
	    }
	}
	if (opt.cursor)   this._opt.cursor = opt.cursor;
	if (opt.beSmooth) this._opt.beSmooth = opt.beSmooth;
	if (opt.label)    this._opt.label = opt.label;
	if (opt.vertices){
	    // cast vertices to points
	    for (var i = 0, l = opt.vertices.length; i < l; i++){
		this._opt.vertices.push(point(opt.vertices[i].x, opt.vertices[i].y));
	    }
	}

	if (opt.bboxCorrection){
	    if (opt.bboxCorrection.start){
		for (key in opt.bboxCorrection.start){
		    this._opt.bboxCorrection.start[key] = opt.bboxCorrection.start[key];
		}
	    }
	    if (opt.bboxCorrection.end){
		for (key in opt.bboxCorrection.end){
		    this._opt.bboxCorrection.end[key] = opt.bboxCorrection.end[key];
		}
	    }
	}
	var sa = opt.startArrow, ea = opt.endArrow;
	if (sa && sa.type) this._opt.arrow.start = Joint.getArrow(sa.type, sa.size, sa.attrs);
	if (ea && ea.type) this._opt.arrow.end = Joint.getArrow(ea.type, ea.size, ea.attrs);
	// direct arrow specification rewrites types
	if (opt.arrow){
	    if (opt.arrow.start) this._opt.arrow.start = opt.arrow.start;
	    if (opt.arrow.end) this._opt.arrow.end = opt.arrow.end;
	}

	if (opt.dummy){
	    if (opt.dummy.start){
		if (opt.dummy.start.radius) this._opt.dummy.start.radius = opt.dummy.start.radius;
		if (opt.dummy.start.attrs){
		    for (key in opt.dummy.start.attrs){
			this._opt.dummy.start.attrs[key] = opt.dummy.start.attrs[key];
		    }
		}
	    }
	    if (opt.dummy.end){
		if (opt.dummy.end.radius) this._opt.dummy.end.radius = opt.dummy.end.radius;
		if (opt.dummy.end.attrs){
		    for (key in opt.dummy.end.attrs){
			this._opt.dummy.end.attrs[key] = opt.dummy.end.attrs[key];
		    }
		}
	    }
	}
	if (opt.handle){
	    if (opt.handle.timeout) this._opt.handle.timeout = opt.handle.timeout;
	    if (opt.handle.start){
		if (opt.handle.start.enabled) this._opt.handle.start.enabled = opt.handle.start.enabled;
		if (opt.handle.start.radius) this._opt.handle.start.radius = opt.handle.start.radius;
		if (opt.handle.start.attrs){
		    for (key in opt.handle.start.attrs){
			this._opt.handle.start.attrs[key] = opt.handle.start.attrs[key];
		    }
		}
	    }
	    if (opt.handle.end){
		if (opt.handle.end.enabled) this._opt.handle.end.enabled = opt.handle.end.enabled;
		if (opt.handle.end.radius) this._opt.handle.end.radius = opt.handle.end.radius;
		if (opt.handle.end.attrs){
		    for (key in opt.handle.end.attrs){
			this._opt.handle.end.attrs[key] = opt.handle.end.attrs[key];
		    }
		}
	    }
	}
    },
    /**
     * Register object(s) so that it can be pointed by my cap.
     * @param {RaphaelObject|Shape|array} obj
     * @param {string} cap "start|end|both" cap to register default: "both"
     * @return {Joint}
     */
    register: function(obj, cap){
	if (!cap){
	    cap = "both";
	}
	// prepare array of objects that are to be registered
	var toRegister = [];
	if (obj.constructor == Array){
	    toRegister = obj;
	} else {
	    toRegister = [obj];
	}
	// register all objects in toRegister array
	for (var i = 0, len = toRegister.length; i < len; i++){
	    toRegister[i]._capToStick = cap;
	    this._registeredObjects.push(toRegister[i]);
	}
	return this;
    },
    registerForever: function(arr){
	this._registeredObjects = arr;	
	return this;
    },
    /**
     * Cancel registration of an object.
     * @param {RaphaelObject|Shape} obj
     * @param {string} cap "start|end|both" cap to unregister default: "both"
     * @return {Joint}
     */
    unregister: function(obj, cap){
	if (typeof cap === "undefined"){
	    cap = "both";
	}
	var index = -1;
	for (var i = 0, len = this._registeredObjects.length; i < len; i++){
	    if (this._registeredObjects[i] === obj && 
		this._registeredObjects[i]._capToStick === cap){
		index = i;
		break;
	    }
	}
	if (index !== -1){
	    this._registeredObjects.splice(index, 1);
	}
	return this;
    },
    /**
     * Set the vertices of the connection
     * @param {array} vertices Array of points (vertices)
     * @return {Joint}
     */
    setVertices: function(vertices){
	var conVertices = this._opt.vertices = [];
	// cast vertices to points
	for (var i = 0, l = vertices.length; i < l; i++){
	    conVertices.push(point(vertices[i].x, vertices[i].y));
	}
	this.update();
	return this;
    },
    /**
     * Get connection vertices.
     * @return {array} array of connection vertices
     */
    getVertices: function(){
	return this._opt.vertices;
    },
    /**
     * Toggle the connection smoothing (bezier/straight).
     * @return {Joint}
     */
    toggleSmoothing: function(){
	this._opt.beSmooth = !this._opt.beSmooth;
	this.update();
	return this;
    },
    /**
     * Find out whether the connection is smooth or not.
     * @return {boolean} true if connection is smooth
     */
    isSmooth: function(){
	return this._opt.beSmooth;
    },
    /**
     * Set label.
     * @param {string} str label
     * @return {Joint}
     */
    label: function(str){
	this._opt.label = str;
	this.update();
	return this;
    },
    /**
     * Register callback function on various events.
     * @link Callbacks 
     * @param {string} evt Possible values can be found in {@link Callbacks}
     * @param {function} fnc 
     * @return {Joint}
     */
    registerCallback: function(evt, fnc){
	this._callbacks[evt] = fnc;
	return this;
    },
    /**
     * Straighten the bent connection path.
     * @return {Joint}
     */
    straighten: function(){
	this._con.remove();
	this._opt.vertices = [];
	this.update();
	return this;
    },
    /**
     * Show handle(s).
     * @param {string} cap &optional [start|end] Specifies on what side handle should be shown.
     * @return {Joint}
     */
    toggleHandle: function(cap){
	if (typeof cap === "undefined"){
	    this._opt.handle.start.enabled = !this._opt.handle.start.enabled;
	    this._opt.handle.end.enabled = !this._opt.handle.start.enabled;
	} else {
	    this._opt.handle[cap].enabled = !this._opt.handle[cap].enabled;
	}
	this.update();
	return this;
    },
    showHandle: function(cap){
	if (typeof cap === "undefined"){
	    this._opt.handle.start.enabled = true;
	    this._opt.handle.end.enabled = true;
	} else {
	    this._opt.handle[cap].enabled = true;
	}
	this.update();
	return this;
    },
    hideHandle: function(cap){
	if (typeof cap === "undefined"){
	    this._opt.handle.start.enabled = false;
	    this._opt.handle.end.enabled = false;
	} else {
	    this._opt.handle[cap].enabled = false;
	}
	this.update();
	return this;
    },
    setBBoxCorrection: function(opt, cap){
	if (cap === undefined){
	    this._opt.bboxCorrection["start"] = this._opt.bboxCorrection["end"] = opt;
	} else {
	    this._opt.bboxCorrection[cap] = opt;	    
	}
	this.update();
	return this;
    }
};

/**
 * Reference to current joint when an object is dragging
 * can be global across all raphael 'worlds' because only one object can be dragged at a time.
 * @private
 * @type Joint
 */
Joint.currentJoint = null;

Joint.paper = function paper(){
    var p = arguments[0];
    if (p === undefined){
	return this._paper;
    }
    this._paperArguments = arguments;	// save for later reset
    if (!(p instanceof global.Raphael)){
	return (this._paper = global.Raphael.apply(global, arguments));
    }
    return (this._paper = p);
};

/**
 * Clear paper, reset again.
 */
Joint.resetPaper = function resetPaper(){
    if (!this._paper){
	return;
    }
    var canvas = this._paper.canvas;
    canvas.parentNode.removeChild(canvas);    
    Joint.paper.apply(Joint, this._paperArguments);
};

    // get an arrow object
Joint.getArrow = function(type, size, attrs){
    if (!size){	
	size = 2; // default
    }
    var arrow = Joint.arrows[type](size);
    if (attrs){
	if (!arrow.attrs){
	    arrow.attrs = {};
	}
	for (var key in attrs){
	    arrow.attrs[key] = attrs[key];
	}
    }
    return arrow;
};

/**
 * Basic arrows.
 */
Joint.arrows = {
    none: function(size){
	if (!size){ size = 2; }
	return {
	    path: ["M",size.toString(),"0","L",(-size).toString(),"0"],
	    dx: size, 
	    dy: size
	};
    },
    basic: function(size){
	if (!size){ size = 5; }
   	return {
	    path: ["M",size.toString(),"0",
		   "L",(-size).toString(),(-size).toString(),
		   "L",(-size).toString(),size.toString(),"z"], 
	    dx: size, 
	    dy: size, 
	    attrs: { 
		stroke: "black", 
		fill: "black" 
	    }
	};
    }
};

/**
 * Get an absolute position of an element.
 * @private
 * @return {Point}
 */
Joint.findPos = function(el){
    var p = point(0, 0);
    if (el.offsetParent){
	while (el){
	    p.offset(el.offsetLeft, el.offsetTop);
	    el = el.offsetParent;
	}
    } else {
	// firefox (supposing el is Raphael canvas element)
	p.offset(el.parentNode.offsetLeft, el.parentNode.offsetTop);
    }
    return p;
};
/**
 * Get the mouse position relative to the raphael paper.
 * @private
 * @param {Event} e Javascript event object
 * @param {Element} el DOM element
 * @return {Point}
 */
Joint.getMousePosition = function(e, el){
    var pos;
    if (e.pageX || e.pageY) {
        pos = point(e.pageX, e.pageY);
    } else {
	var 
	docEl = document.documentElement,
	docBody = document.body;
	pos = point(e.clientX + (docEl.scrollLeft || docBody.scrollLeft) - docEl.clientLeft,
		    e.clientY + (docEl.scrollTop || docBody.scrollTop) - docEl.clientTop);
    }
    var rp = Joint.findPos(el);
    return point(pos.x - rp.x, pos.y - rp.y);
};
/**
 * MouseMove event callback.
 * @private
 * @param {Event} e
 */
Joint.mouseMove = function(e){
    if (Joint.currentJoint !== null){
	var joint = Joint.currentJoint;
	if (joint.state === joint.STARTCAPDRAGGING ||
	    joint.state === joint.ENDCAPDRAGGING){
	    joint.capDragging(e);
	} else if (joint.state === joint.CONNECTIONWIRING){
	    joint.connectionWiring(e);
	}
    }
};
/**
 * MouseUp event callback.
 * @private
 * @param {Event} e
 */
Joint.mouseUp = function(e){
    if (Joint.currentJoint !== null){
	var joint = Joint.currentJoint;
	if (joint.state === joint.STARTCAPDRAGGING ||
	    joint.state === joint.ENDCAPDRAGGING){
	    joint.capEndDragging();
	}
    }
    Joint.currentJoint = null;
};


/**************************************************
 * Cross-browser event handling.
 * From Dean Edwards' addEvent library.
 **************************************************/

Joint.fixEvent = function(event) {
    // add W3C standard event methods
    event.preventDefault = Joint.fixEvent.preventDefault;
    event.stopPropagation = Joint.fixEvent.stopPropagation;
    return event;
};
Joint.fixEvent.preventDefault = function() {
    this.returnValue = false;
};
Joint.fixEvent.stopPropagation = function() {
    this.cancelBubble = true;
};
Joint.handleEvent = function(event){
    var returnValue = true;
    // grab the event object (IE uses a global event object)
    event = event || Joint.fixEvent(((global.ownerDocument || global.document || global).parentWindow || global).event);
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
Joint.addEvent = function(element, type, handler){
    if (element.addEventListener) {
	element.addEventListener(type, handler, false);
    } else {
	// assign each event handler a unique ID
	if (!handler.$$guid){ handler.$$guid = Joint.addEvent.guid++; }
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
	element["on" + type] = Joint.handleEvent;
    }
};
// a counter used to create unique IDs
Joint.addEvent.guid = 1;

Joint.removeEvent = function(element, type, handler){
    if (element.removeEventListener) {
	element.removeEventListener(type, handler, false);
    } else {
	// delete the event handler from the hash table
	if (element.events && element.events[type]){
	    delete element.events[type][handler.$$guid];
	}
    }
};

/*
 * @todo register handlers only if draggable caps
 * are allowed in options. Applications may not need it.
 */
Joint.addEvent(document, "mousemove", Joint.mouseMove);
Joint.addEvent(document, "mouseup", Joint.mouseUp);

/**
 * Geometry-Primitives.
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
	this.x = mmin(mmax(this.x, r.x), r.x + r.width);
	this.y = mmin(mmax(this.y, r.y), r.y + r.height);
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
	rad = atan2(y, x);
	if (rad < 0){ // correction for III. and IV. quadrant
	    rad = 2*PI + rad;
	}
	return {
	    degrees: 180*rad / PI,
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
	var s = len / sqrt((this.x*this.x) + (this.y*this.y));
	this.x = s * this.x;
	this.y = s * this.y;
	return this;
    }
};

/**
 * Alternative constructor, from polar coordinates.
 */
Point.fromPolar = function(r, angle){
    return point(r * cos(angle), r * sin(angle));
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
    length: function(){ return sqrt(this.squaredLength()); },

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
	x = sqrt(1 / ((1 / aSquared) + (mSquared / bSquared)));
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
	    // Make sure above value is between -1 and 1 so that acos will work
	    if (cos < -1){ cos = -1; }
	    else if (cos > 1){ cos = 1; }
	    // Angle formed by the two sides of the triangle 
	    // (described by the three points above) adjacent to the current point
	    var C = acos(cos);
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
	    // var r = sqrt(rx*rx+ry*ry);
	    // angle of the new vector
	    var theta = atan2(ry,rx);
	    // Distance of curve control points from current point: a fraction 
	    // the length of the shorter adjacent triangle side
	    var controlDist = mmin(a,b)*z;
	    // Scale the distance based on the acuteness of the angle. Prevents 
	    // big loops around long, sharp-angled triangles.
	    var controlScaleFactor = C/PI;
	    // Mess with this for some fine-tuning
	    controlDist *= ((1-angleFactor) + angleFactor*controlScaleFactor);
	    // The angle from the current point to control points: 
	    // the new vector angle plus 90 degrees (tangent to the curve).
	    var controlAngle = theta+PI/2;
	    // Control point 2, curving to the next point.
	    var controlPoint2 = Point.fromPolar(controlDist,controlAngle);
	    // Control point 1, curving from the previous point 
	    // (180 degrees away from control point 2).
	    var controlPoint1 = Point.fromPolar(controlDist,controlAngle+PI);

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
	    if ( ( i > 0 && atan2(p[i].y-p[i-1].y,p[i].x-p[i-1].x) == atan2(p[i+1].y-p[i].y,p[i+1].x-p[i].x) )|| ( i < p.length - 2 && atan2(p[i+2].y-p[i+1].y,p[i+2].x-p[i+1].x) == atan2(p[i+1].y-p[i].y,p[i+1].x-p[i].x) ) ){
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

Joint.Point = Point;
Joint.point = point;
Joint.Rect = Rect;
Joint.rect = rect;
Joint.Line = Line;
Joint.line = line;
Joint.Ellipse = Ellipse;
Joint.ellipse = ellipse;
Joint.BezierSegment = BezierSegment;
Joint.bezierSegment = bezierSegment;
Joint.Bezier = Bezier;

/**
 * TODO: rotation support. there is a problem because
 * rotation does not set any attribute in this.attrs but
 * instead it sets transformation directly to let the browser
 * SVG engine compute the position.
 */
var _attr = global.Raphael.el.attr;
global.Raphael.el.attr = function(){
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
    
    var 
    n = this.attrs,	// new attributes
    positionChanged = false,
    strokeChanged = false;

    if (o.x != n.x || o.y != n.y ||	// rect/image/text
	o.cx != n.cx || o.cy != n.cy ||	// circle/ellipse
	o.path != n.path ||	// path
	o.r != n.r){	// radius
	positionChanged = true;
    }
    if (o.stroke != n.stroke){
	strokeChanged = true;
    }    

    for (var i = this.joints().length - 1; i >= 0; --i){
	var joint = this.joints()[i];
	
	if (positionChanged){
	    joint.update();
	    joint.callback("objectMoving", joint, [this]);
	}
	//if (strokeChanged){}
    }
    return this;
};


/**
 * Create a joint between a Raphael object and to object.
 * @param {RaphaelObject} to 
 * @param {object} [opts] opt {@link Joint}
 * @return {Joint}
 */
global.Raphael.el.joint = function(to, opt){
    Joint.paper(this.paper);
    return new Joint(this, to, opt);
};

/**
 * Return element unique id.
 */
global.Raphael.el.euid = function(){
    return Joint.generateEuid.call(this);
};

})(this);	// END CLOSURE
