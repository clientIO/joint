/****************************************************
 * Joint library.
 * @file joint.js
 * @author David Durman
 ****************************************************/

/**************************************************
 * Engine.
 **************************************************/

function JointEngine(){
    this.base = QHsm;
    this.base("Initial");
}
JointEngine.prototype = new QHsm;
JointEngine.prototype.stateInitial = function(e){
    // slots
    this._con = null;		// holds the joint path
    this._startCap = null;	// start glyph (arrow)
    this._endCap = null;	// end glyph (arrow)
    // connection from start to end
    this._start = null;		// start Raphael object
    this._end = null;		// end Raphael object
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

/**
 * Idle state. - any joint is wiring.
 */
JointEngine.prototype.stateIdle = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "connect": 
	this.newState("Connected");
	return null;
    }
    return this.top();
};

/**
 * Connected state. - substate of Idle, both joint sides are connected.
 */
JointEngine.prototype.stateConnected = function(e){
    switch (e.type){
    case "entry": 
	this.clearConnection();
	this.clearCaps();
	this.drawConnection();
	return null;
    case "exit": return null;	
    case "step": 
	if (!this.overlappedBBoxes(this._start.getBBox(), this._end.getBBox())){	// guard
	    this.clearConnection();
	    this.clearCaps();
	    this.drawConnection();
	}
	return null;
    }
    return this.state("Idle");
};

/**************************************************
 * Helper methods. (mainly geometric operations)
 **************************************************/

/**
 * @return bool true if two rects rect and another intersect each other
 */
JointEngine.prototype.rectsIntersect = function(rect, another){
    var rOrigin = {x: rect.x, y: rect.y},
    rCorner = {x: rect.x + rect.width, y: rect.y + rect.height},
    aOrigin = {x: another.x, y: another.y},
    aCorner = {x: another.x + another.width, y: another.y + another.height};
    if (aCorner.x <= rOrigin.x) return false;
    if (aCorner.y <= rOrigin.y) return false;
    if (aOrigin.x >= rCorner.x) return false;
    if (aOrigin.y >= rCorner.y) return false;
    return true;
};

/**
 * @return string (left|right|top|bottom) side on rect which is nearest to point
 * @see Squeak Smalltalk, Rectangle>>sideNearestTo:
 */
JointEngine.prototype.sideNearestToPoint = function(rect, point){
    var distToLeft = point.x - rect.x,
    distToRight = (rect.x + rect.width) - point.x,
    distToTop = point.y - rect.y,
    distToBottom = (rect.y + rect.height) - point.y,
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
 * @return bool true if rect contains point
 */
JointEngine.prototype.rectContainsPoint = function(rect, point){
    if (point.x > rect.x && point.x < rect.x + rect.width &&
	point.y > rect.y && point.y < rect.y + rect.height)
	return true;
    return false;
};

/**
 * If point lies outside rect, return the nearest point on the boundary of rect, 
 * otherwise return point.
 * @see Squeak Smalltalk, Point>>adhereTo:
 */
JointEngine.prototype.pointAdhereToRect = function(point, rect){
    if (this.rectContainsPoint(rect, point))
	return point;
    return {
	x: Math.min(Math.max(point.x, rect.x), rect.x + rect.width),
	y: Math.min(Math.max(point.y, rect.y), rect.y + rect.height)
    }
};

/**
 * @return point a point on rect border nearest to parameter point
 * @see Squeak Smalltalk, Rectangle>>pointNearestTo:
 */
JointEngine.prototype.rectPointNearestToPoint = function(rect, point){
    if (this.rectContainsPoint(rect, point)){
	var side = this.sideNearestTo(rect, point);
	switch (side){
	case "right": return {x: rect.x + rect.width, y: point.y};
	case "left": return {x: rect.x, y: point.y};	    
	case "bottom": return {x: point.x, y: rect.y + rect.height};
	case "top": return {x: point.x, y: rect.y};
	}
    } else
	return this.pointAdhereToRect(point, rect);
};

/**
 * Find point on ellipse where line from the center of the ellipse to
 * point intersects the ellipse.
 * @see Squeak Smalltalk, EllipseMorph>>intersectionWithLineSegmentFromCenterTo:    
 */
JointEngine.prototype.ellipseLineIntersectionFromCenterToPoint = function(ellipse, point){
    var dx = point.x - ellipse.center.x,
    dy = point.y - ellipse.center.y;
    if (dx == 0)
	return this.rectPointNearestToPoint(ellipse.bb, point);

    var m = dy / dx,
    mSquared = m * m,
    aSquared = (aSquared = ellipse.bb.width / 2) * aSquared,
    bSquared = (bSquared = ellipse.bb.height / 2) * bSquared,
    x = Math.sqrt(1 / ((1 / aSquared) + (mSquared / bSquared)));
    if (dx < 0) 
	x = -x;
    var y = m * x;
    return {
	x: ellipse.center.x + x,
	y: ellipse.center.y + y
    }
};

/**
 * Find point where two lines line and another intersect.
 * @see Squeak Smalltalk, LineSegment>>intersectionWith:
 */
JointEngine.prototype.linesIntersection = function(line, another){
    var pt1Dir = {x: line.end.x - line.start.x, y: line.end.y - line.start.y},
    pt2Dir = {x: another.end.x - another.start.x, y: another.end.y - another.start.y},
    det = (pt1Dir.x * pt2Dir.y) - (pt1Dir.y * pt2Dir.x),
    deltaPt = {x: another.start.x - line.start.x, y: another.start.y - line.start.y},
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
    return {
	x: line.start.x + (alpha * pt1Dir.x / det),
	y: line.start.y + (alpha * pt1Dir.y / det)
    }
};

//JointEngine.prototype.lineLength = function(x0, y0, x1, y1){
//    return Math.sqrt((x0 -= x1) * x0 + (y0 -= y1) * y0);
//};

/**
 * Compute the angle between this.from middle point and this.to middle point.
 */
JointEngine.prototype.theta = function(point1, point2){
    var y = -(point2.y - point1.y),	// invert the y-axis
    x = point2.x - point1.x,
    rad = Math.atan2(y, x);
    if (rad < 0) // correction for III. and IV. quadrant
	rad = 2*Math.PI + rad;
    return {
	degrees: 180*rad / Math.PI,
	radians: rad
    }
};

/**
 * @return bool true if bbox1 and bbox2 are overlapped
 */
JointEngine.prototype.overlappedBBoxes = function(bbox1, bbox2){
    return this.rectsIntersect(bbox1, bbox2);
};

/**
 * Find point on an object of type type with bounding box bb where line starting
 * from bb center ending in point intersects the object.
 */
JointEngine.prototype.boundPoint = function(bb, type, point){
    var bbCenter = {x: bb.x + bb.width/2, y: bb.y + bb.height/2};

    if (type === "circle" || type === "ellipse"){
	var ellipse = {center: bbCenter, bb: bb}; 
	return this.ellipseLineIntersectionFromCenterToPoint(ellipse, point);

	// other types 
    } else {
	// sides of the this.from rectangle (clockwise, starting from the top side)
	var sides = [
	    {start: {x: bb.x, y: bb.y}, end: {x: bb.x + bb.width, y: bb.y}},
	    {start: {x: bb.x + bb.width, y: bb.y}, end: {x: bb.x + bb.width, y: bb.y + bb.height}}, 
	    {start: {x: bb.x + bb.width, y: bb.y + bb.height}, end: {x: bb.x, y: bb.y + bb.height}},
	    {start: {x: bb.x, y: bb.y + bb.height}, end: {x: bb.x, y: bb.y}}
	],
	connector = {start: bbCenter, end: point};
	for (var i = sides.length - 1; i >= 0; --i){
	    var intersection = this.linesIntersection(sides[i], connector);
	    if (intersection !== null)
		return intersection;
	}
    }
};

/**************************************************
 * Engine specific methods.
 **************************************************/

/**
 * Draw a line from start to end with attributes attrs.
 */
JointEngine.prototype.drawLine = function(start, end, attrs){
    var p = ["M", start.x, start.y, "L", end.x, end.y].join(",");
    return this._raphael.path(attrs, p);
};

/**
 * Correct bounding box of start/end object.
 * @see this._opt.bboxCorrection
 */
JointEngine.prototype.correctBBox = function(bb, side){
    var cor = this._opt.bboxCorrection[side];
    return {
	x: bb.x + cor.x,
	y: bb.y + cor.y,
	width: bb.width + cor.width,
	height: bb.height + cor.height
    }
};

/**
 * Draw connection line without start/end caps.
 * (connection path will be saved in this._con)
 */
JointEngine.prototype.drawConnection = function(){
    var sbb = this.correctBBox(this._start.getBBox(), "start"),
    sbbCenter = {x: sbb.x + sbb.width/2, y: sbb.y + sbb.height/2},
    ebb = this.correctBBox(this._end.getBBox(), "end"),
    ebbCenter = {x: ebb.x + ebb.width/2, y: ebb.y + ebb.height/2},
    theta = this.theta(sbbCenter, ebbCenter),

    sBoundPoint = this.boundPoint(sbb, this._opt.bboxCorrection.start.type || this._start.type, ebbCenter),
    eBoundPoint = this.boundPoint(ebb, this._opt.bboxCorrection.end.type || this._end.type, sbbCenter),

    sPoint = { // connection start point
	x: sBoundPoint.x + (2 * this._arrow.start.dx * Math.cos(theta.radians)),
	y: sBoundPoint.y + (-2 * this._arrow.start.dy * Math.sin(theta.radians))
    },
    ePoint = { // connection end point
	x: eBoundPoint.x + (-2 * this._arrow.end.dx * Math.cos(theta.radians)),
	y: eBoundPoint.y + (2 * this._arrow.end.dy * Math.sin(theta.radians))
    };
    
    this._con = this.drawLine(sPoint, ePoint, this._opt.attrs);
    this._con.show();

    this.drawStartCap(sBoundPoint, theta);
    this.drawEndCap(eBoundPoint, theta);
};

/**
 * Clear operations. Remove the DOM elements if they exist.
 */
JointEngine.prototype.clearConnection = function(){ this._con && this._con.remove() };
JointEngine.prototype.clearCaps = function(){ this.clearStartCap(); this.clearEndCap() };
JointEngine.prototype.clearEndCap = function(){ this._endCap && this._endCap.remove() };
JointEngine.prototype.clearStartCap = function(){ this._startCap && this._startCap.remove() };

JointEngine.prototype.drawEndCap = function(eBoundPoint, theta){
    var a = this._arrow.end;
    this._endCap = this._raphael.path(a.attrs, a.path);
    this._endCap.translate(eBoundPoint.x - a.dx * Math.cos(theta.radians), eBoundPoint.y + a.dy * Math.sin(theta.radians));
    this._endCap.rotate(360 - theta.degrees);
    this._endCap.show();
};

JointEngine.prototype.drawStartCap = function(sBoundPoint, theta){
    var a = this._arrow.start;
    this._startCap = this._raphael.path(a.attrs, a.path);
    this._startCap.translate(sBoundPoint.x + a.dx * Math.cos(theta.radians), sBoundPoint.y - a.dy * Math.sin(theta.radians));
    this._startCap.rotate(360 - theta.degrees + 180);
    this._startCap.show();
};



/**************************************************
 * Joint.
 **************************************************/

function Joint(){
    this.engine = new JointEngine();
    this.engine.init(null);	// initial StateChart transition
}

/**************************************************
 * Caps DOM events handles.
 **************************************************/

Joint.isEndDrag = false;

/**
 * TODO: rename, optimize
 */
JointEngine.prototype.endDragStart = function(e){
    this.dx = e.clientX;
    this.dy = e.clientY;
    Joint.isEndDrag = this;
    this.animate({"fill-opacity": .1}, 500);
    e.preventDefault && e.preventDefault();
};

Joint.mouseMove = function(e){
    if (Joint.isEndDrag){
        Joint.isEndDrag.translate(e.clientX - Joint.isEndDrag.dx, e.clientY - Joint.isEndDrag.dy);
        r.safari();
        Joint.isEndDrag.dx = e.clientX;
        Joint.isEndDrag.dy = e.clientY;
	console.log(e.clientX);
    }
};

Joint.mouseUp = function(e){
    Joint.isEndDrag && Joint.isEndDrag.animate({"fill-opacity": .2}, 500);
    Joint.isEndDrag = false;
};

//document.addEventListener("mousemove", Joint.mouseMove, false);
//document.addEventListener("mouseup", Joint.mouseUp, false);


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
 * This is the only Joint library API.
 *
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
 *   bboxCorrection: {  correction of bounding box (usefule when the connection should start in the center of an object, etc...
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
    j.engine._start = this;
    j.engine._end = to;
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


    (this.joints) ? this.joints.push(j) : this.joints = [j];
    (to.joints) ? to.joints.push(j) : to.joints = [j];

    j.engine.dispatch(qevt("connect"));
};
