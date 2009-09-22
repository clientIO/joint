var NDEBUG = false;
/****************************************************
 * Joint 0.1.2 - JavaScript Connection Library
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

//(function(){	// BEGIN CLOSURE

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
 * End caps listeners.
 **************************************************/

JointEngine.prototype.listenOnMouseDown = function(cap){
    cap.engine = this;	// keep self reference
    cap.mousedown(this.capDragStart);  // register mouseDown event callback
};

Joint.draggedCap = null;
Joint.registeredObjects = [];	// TODO: multiple raphael 'windows'

/**
 * MouseDown event callback when on cap.
 */
JointEngine.prototype.capDragStart = function(e){
    Joint.draggedCap = this;	// keep reference to cap
    if (this === this.engine.endCap())	// end cap
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

// TODO: platform neutral event listeners
document.addEventListener("mousemove", Joint.mouseMove, false);
document.addEventListener("mouseup", Joint.mouseUp, false);


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

/**************************************************
 * Caps DOM events handles.
 **************************************************/

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

//})();	// END CLOSURE
