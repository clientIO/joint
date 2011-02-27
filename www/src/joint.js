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

var enqueue = function(fnc){
    setTimeout(fnc, 0);
};

var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

var isObject = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
};

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
 * Copies all the properties to the first argument from the following arguments.
 * All the properties will be overwritten by the properties from the following
 * arguments. Inherited properties are ignored.
 * @private
 */
var Mixin = function() {
    var target = arguments[0];
    for (var i = 1, l = arguments.length; i < l; i++){
        var extension = arguments[i];
        for (var key in extension){
            if (!extension.hasOwnProperty(key)){
		continue;
	    }
            var copy = extension[key];
            if (copy === target[key]){
		continue;
	    }
            // copying super with the name base if it does'nt has one already
            if (typeof copy == "function" && typeof target[key] == "function" && !copy.base){
		copy.base = target[key];
	    }
            target[key] = copy;
        }
    }
    return target;
};

/**
 * Copies all properties to the first argument from the following
 * arguments only in case if they don't exists in the first argument.
 * All the function propererties in the first argument will get
 * additional property base pointing to the extenders same named
 * property function's call method.
 * @example
 * // usage of base
 * Bar.extend({
 * // function should have name
 * foo: function foo(digit) {
 * return foo.base(this, parseInt(digit))
 * }
 * });
 * @private
 */
var Supplement = function() {
    var target = arguments[0];
    for (var i = 1, l = arguments.length; i < l; i++){
        var extension = arguments[i];
        for (var key in extension) {
            var copy = extension[key];
            if (copy === target[key]){
		continue;
	    }
            // copying super with the name base if it does'nt has one already
            if (typeof copy == "function" && typeof target[key] == "function" && !target[key].base){
		target[key].base = copy;
	    }
            // target doesn't has propery that is owned by extension copying it
            if (!target.hasOwnProperty(key) && extension.hasOwnProperty(key)){
		target[key] = copy;
	    }
        }
    }
    return target;
};

/**
 * Copies all the properties to the first argument from the following arguments.
 * All the properties will be overwritten by the properties from the following
 * arguments. Inherited properties are ignored.
 * Deep version.
 * @private
 */
var DeepMixin = function() {
    var target = arguments[0];
    for (var i = 1, l = arguments.length; i < l; i++) {
        var extension = arguments[i];
        for (var key in extension) {
            var copy = extension[key];
            if (copy === target[key]) continue;
            if (isObject(copy)) DeepMixin((target[key] || (target[key] = {})), copy);
            // copying super with the name base if it does'nt has one already
            if (typeof copy == 'function' && typeof target[key] == 'function' && !target[key].base) {
                target[key].base = copy;
            }
	    target[key] = copy;
        }
    }
    return target;
};

/**
 * Copies all properties to the first argument from the following
 * arguments only in case if they don't exists in the first argument.
 * All the function propererties in the first argument will get
 * additional property base pointing to the extenders same named
 * property function's call method.
 * @example
 * // usage of base
 * Bar.extend({
 * // function should have name
 * foo: function foo(digit) {
 * return foo.base(this, parseInt(digit))
 * }
 * });
 * Deep version.
 * @private
 */
var DeepSupplement = function() {
    var target = arguments[0];
    for (var i = 1, l = arguments.length; i < l; i++) {
        var extension = arguments[i];
        for (var key in extension) {
            var copy = extension[key];
            if (copy === target[key]) continue;
            if (isObject(copy)) DeepSupplement((target[key] || (target[key] = {})), copy);
            // copying super with the name base if it does'nt has one already
            if (typeof copy == 'function' && typeof target[key] == 'function' && !target[key].base) {
                target[key].base = copy;
            }
            // target doesn't has propery that is owned by extension copying it
            if (!target.hasOwnProperty(key) && extension.hasOwnProperty(key)){
		target[key] = copy;
	    }
        }
    }
    return target;
};


/**
 * @name Joint
 * @constructor
 * @param {RaphaelObject|Shape|object} from Object/position where the connection starts.
 * @param {RaphaelObject|Shape|object} to Object/position where the connection ends.
 * @param {object} [opts] opt Options
 * @param {object} [opts.interactive] Is the joint interactive? [default = true]
 * @param {object} [opts.attrs] Connection options (see  Raphael possible parameters)
 * @param {string} [opts.cursor] Connection CSS cursor property
 * @param {boolean} [opts.beSmooth] Connection enable/disable smoothing
 * @param {string|array} [opts.label] Connection label(s)
 * @param {object|array} [opts.labelAttrs] Label(s) options (see  Raphael possible parameters)  + position attribute (<0, [0, 1], >1)
 * @param {object|array} [opts.labelBoxAttrs] SVG Attributes of the label(s) bounding rectangle + padding attribute
 * @param {object} [opts.startArrow] Start arrow options
 * @param {string} [opts.startArrow.type] "none"|"basic"
 * @param {number} [opts.startArrow.size] Start arrow size
 * @param {object} [opts.startArrow.attrs] Start Arrow options (see  Raphael possible parameters)
 * @param {object} [opts.endArrow] End arrow options
 * @param {string} [opts.endArrow.type] "none"|"basic"
 * @param {number} [opts.endArrow.size] End arrow size
 * @param {object} [opts.endArrow.attrs] End Arrow options (see  Raphael possible parameters)
 * @param {object} [opts.dummy] Dummy node options (shows when dragging arrows)
 * @param {object} [opts.dummy.start] Start dummy node options
 * @param {number} [opts.dummy.start.radius] Start dummy radius
 * @param {object} [opts.dummy.start.attrs] Start dummy options (see  Raphael possible parameters)
 * @param {object} [opts.dummy.end] End dummy node options
 * @param {number} [opts.dummy.end.radius] End dummy radius
 * @param {object} [opts.dummy.end.attrs] End dummy options (see  Raphael possible parameters)
 * @param {object} [opts.handle] Handle options
 * @param {number} [opts.handle.timeout] Number of milliseconds handle stays shown
 * @param {object} [opts.handle.start] Start handle options
 * @param {boolean} [opts.handle.start.enabled] Start handle enabled/disabled
 * @param {number} [opts.handle.start.radius] Start handle radius
 * @param {object} [opts.handle.start.attrs] Start handle attributes (see  Raphael possible parameters)
 * @param {object} [opts.handle.end] End handle options
 * @param {boolean} [opts.handle.end.enabled] End handle enabled/disabled
 * @param {number} [opts.handle.end.radius] End handle radius
 * @param {object} [opts.handle.end.attrs] End handle attributes (see  Raphael possible parameters)
 * @param {object} [opts.bboxCorrection] Correction of a bounding box (useful when, e.g., the connection should start in the center of an object)
 * @param {object} [opts.bboxCorrection.start] BBox correction of the start object.
 * @param {string} [opts.bboxCorrection.start.type] "ellipse"|"rect"
 * @param {number} [opts.bboxCorrection.start.x] Translation in the x-axis
 * @param {number} [opts.bboxCorrection.start.y] Translation in the y-axis
 * @param {number} [opts.bboxCorrection.start.width] BBox width
 * @param {number} [opts.bboxCorrection.start.height] BBox height
 * @param {object} [opts.bboxCorrection.end] BBox correction of the end object.
 * @param {string} [opts.bboxCorrection.end.type] "ellipse"|"rect"
 * @param {number} [opts.bboxCorrection.end.x] Translation in the x-axis
 * @param {number} [opts.bboxCorrection.end.y] Translation in the y-axis
 * @param {number} [opts.bboxCorrection.end.width] BBox width
 * @param {number} [opts.bboxCorrection.end.height] BBox height
 * @example
 * Joint({x: 10, y: 10}, {x: 300, y: 100}, {
 *  label: "my label",
 *  beSmooth: true,
 *  startArrow: {
 *    type: "basic",
 *    size: 7,
 *    attrs: {
 *      fill: "red",
 *      stroke: "blue"
 *    }
 *  },
 *  handle: {
 *    timeout: 4000,
 *    start: {
 *      radius: 6,
 *      attrs: {
 *        fill: "green",
 *        stroke: "black"
 *      }
 *    },
 *    end: {
 *      radius: 4,
 *      attrs: {
 *        fill: "red",
 *        stroke: "black"
 *      }
 *    }
 *  }
 * });
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

    this._conVerticesCurrentIndex = 0;
    this._nearbyVertexSqrDist = 500;	// sqrt(this._nearbyVertexSqrDist) is tolerable distance of vertex moving

    this.dom = {};	// holds all dom elements

    // connection from start to end
    this._start = { // start object
	shape: null,		// Raphael object
	dummy: false		// is it a dummy object?
    };
    this._end = { // end object
	shape: null,		// Raphael object
	dummy: false		// is it a dummy object?
    };

    // connection options
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
	labelAttrsDefault: {
            position: 1/2,
            offset: 0,  // y-offset
	    "font-size": 12,
	    "fill": "#000"
	},
        labelAttrs: [],
	labelBoxAttrsDefault: { stroke: "white", fill: "white" },
        labelBoxAttrs: [],
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

    JointDOMBuilder.init(this.paper, this._opt, this._start, this._end);

    var startObject = this._start,
        endObject = this._end;

    if (from.x && from.y)	// from is point?
	JointDOMBuilder.dummy(startObject, from, this._opt.dummy.start);
    else
	startObject.shape = from.yourself();

    if (to.x && to.y)		// to is point?
	JointDOMBuilder.dummy(endObject, to, this._opt.dummy.end);
    else
	endObject.shape = to.yourself();

    // to be able to dispatch events in Raphael element attr method
    // TODO: possible source of memory leaks!!!
    this.addJoint(startObject.shape);
    this.addJoint(endObject.shape);
    // draw
    this.update();
}
global.Joint = Joint;	// the only global variable

Joint.euid = 1;	// elements/joints unique id
/**
 * Assign unique id to this.
 * @private
 * @example Joint.generateEuid.call(obj);
 */
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
    /*
     * States.
     */
    IDLE: 0,
    STARTCAPDRAGGING: 1,
    ENDCAPDRAGGING: 2,
    CONNECTIONWIRING: 3,
    state: 0,	// IDLE
    /*
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
     * @return {String} Joint unique identifier.
     */
    euid: function(){
	return Joint.generateEuid.call(this);
    },
    /*
     * Getters.
     */
    connection: function(){ return this.dom.connection[0]; },
    endObject: function(){ return this._end.shape; },
    startObject: function(){ return this._start.shape; },
    endCap: function(){ return this.dom.endCap; },
    endCapConnected: function(){ return !this._end.dummy; },
    startCap: function(){ return this.dom.startCap; },
    startCapConnected: function(){ return !this._start.dummy; },
    isStartDummy: function(){ return this._start.dummy; },
    isEndDummy: function(){ return this._end.dummy; },
    /**
     * Replaces dummy object with a new object.
     * @private
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
     * @private
     * @param fnc Callback 
     * @param {object} scope Scope of the callback
     * @param {array} args Array of arguments
     */
    callback: function(fnc, scope, args){
	this._callbacks[fnc].apply(scope, args);
        return this;
    },
    /**
     * Search the registered objects and get the one (if any)
     * who's bounding box contains the point p.
     * @todo check document.elementFromPoint(x, y)
     * @private
     * @param {Point} p
     */
    objectContainingPoint: function(p){
	var register = this._registeredObjects,
	    idx = (register ? register.length : 0), o;
	while (idx--){
	    o = register[idx].yourself();
	    if (rect(o.getBBox()).containsPoint(p))
		return o;
	}
	return null;
    },
    /**
     * Remove reference to Joint from obj.
     * @private
     * @param {StartObject|EndObject} obj
     */
    freeJoint: function(obj){
	var jar = obj.yourself().joints(),
	    i = jar.indexOf(this);
	jar.splice(i, 1);
	return this;
    },
    /**
     * Add reference to Joint to obj.
     * @private
     * @param {RaphaelObject} obj
     */
    addJoint: function(obj){
	var joints = obj.joints();;
	// push the Joint object into obj.joints array
	// but only if obj.joints already doesn't have that Joint object
	if (joints.indexOf(this) === -1) joints.push(this);
    },
    /**
     * MouseDown event callback when on cap.
     * @private
     * @param {Event} e
     * @param {RaphaelObject} cap
     */
    capMouseDown: function(e, cap){
	Joint.currentJoint = this;	// keep global reference to me
	this._dx = e.clientX;
	this._dy = e.clientY;

	if (cap === this.dom.startCap){
            this.disconnect("start");
	    this.state = this.STARTCAPDRAGGING;
	} else if (cap === this.dom.endCap){
            this.disconnect("end");
	    this.state = this.ENDCAPDRAGGING;
	}
    },
    /**
     * MouseDown event callback when on connection.
     * @private
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
	var sbbCenter = rect(this.startObject().getBBox()).center(),
	    ebbCenter = rect(this.endObject().getBBox()).center(),
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
	    this.startObject().translate(e.clientX - this._dx, e.clientY - this._dy);
	} else if (this.state === this.ENDCAPDRAGGING) {
	    this.endObject().translate(e.clientX - this._dx, e.clientY - this._dy);
	} else {
	    return;	// should not happen
	}
	this._dx = e.clientX;
	this._dy = e.clientY;

	this.update();
    },
    capEndDragging: function(){
	var dummyBB, 
	    STARTCAPDRAGGING = (this.state === this.STARTCAPDRAGGING),
	    ENDCAPDRAGGING = (this.state === this.ENDCAPDRAGGING),
	    capType = (STARTCAPDRAGGING) ? "start" : "end";

        
	if (STARTCAPDRAGGING){
            dummyBB = this.startObject().getBBox();	    
	} else if (ENDCAPDRAGGING){
	    dummyBB = this.endObject().getBBox();
	}
        
	var o = this.objectContainingPoint(point(dummyBB.x, dummyBB.y));
	if (o){
	    this.callback("justConnected", o, [capType]);
	    this.replaceDummy(this["_" + capType], o);
	    this.addJoint(o);
	}

	this.update();
    },
    connectionWiring: function(e){
	var mousePos = Joint.getMousePosition(e, this.paper.canvas);
	this._opt.vertices[this._conVerticesCurrentIndex] = mousePos;
	this.update();
	this.callback("wiring", this, [mousePos]);
    },
    update: function(){
	this.redraw().listenAll();
	// setTimeout makes drawing much faster!
//	var self = this;
//	enqueue(function(){self.redraw().listenAll();});
    },
    redraw: function(){
	this.clean(["connection", "startCap", "endCap", "handleStart", "handleEnd", "label"]);
	this.draw(["connection", "startCap", "endCap", "handleStart", "handleEnd", "label"]);
	return this;
    },
    listenAll: function(){
	if (!this._opt.interactive){
	    return this;
	}
	var self = this;
	this.dom.startCap.mousedown(function(e){
		           Joint.fixEvent(e);
			   self.capMouseDown(e, self.dom.startCap);
			   e.stopPropagation();
			   e.preventDefault();
        });
	this.dom.endCap.mousedown(function(e){
		           Joint.fixEvent(e);
			   self.capMouseDown(e, self.dom.endCap);
			   e.stopPropagation();
			   e.preventDefault();
	});
        var i;
        i = this.dom.connection.length;
        while (i--) {
	    this.dom.connection[i].mousedown(function(e){
                Joint.fixEvent(e);
		self.connectionMouseDown(e);
		e.stopPropagation();
		e.preventDefault();
            });
        }
	if (this._opt.handle.start.enabled){
	    this.dom.handleStart.mousedown(function(e){
			       Joint.fixEvent(e);
			       self.capMouseDown(e, self.dom.startCap);
			       e.stopPropagation();
			       e.preventDefault();
	    });
	}
	if (this._opt.handle.end.enabled){
	    this.dom.handleEnd.mousedown(function(e){
			       Joint.fixEvent(e);
			       self.capMouseDown(e, self.dom.endCap);
			       e.stopPropagation();
			       e.preventDefault();
	    });
	}
	if (this._opt.handle.timeout !== Infinity){
            i = this.dom.connection.length;
            while (i--) {
	       this.dom.connection[i].mouseover(function(e){
	           Joint.fixEvent(e);
		   self.showHandle();
	           setTimeout(function(){
		       self.hideHandle();
		   }, self._opt.handle.timeout);
		   e.stopPropagation();
		   e.preventDefault();
	        });
            }
	}
	return this;
    },
    /**
     * @private
     */
    boundPoint: function(bbox, type, rotation, p){
	if (type === "circle" || type === "ellipse")
	    return ellipse(bbox.center(), bbox.width/2, bbox.height/2).intersectionWithLineFromCenterToPoint(p);
        else if (type === 'rect' && bbox.width == bbox.height && rotation != 0) {
            // compute new bounding box of a rotated square
            // @todo Compute intersection properly
            var w = bbox.width,
                dia = Math.sqrt(w*w + w*w),
                origin = bbox.center().offset(-dia/2, -dia/2);
            bbox = rect(origin.x, origin.y, dia, dia);
            return bbox.boundPoint(p) || bbox.center();
        }
	return bbox.boundPoint(p) || bbox.center();
    },
    /**
     * @private
     * @param {object} start
     * @param {rect} start.bbox Start object bounding box.
     * @param {string} start.type Start object geometrical type.
     * @param {point} start.shift Start arrow offsets.
     * @param {object} end
     * @param {rect} end.bbox End object bounding box.
     * @param {string} end.type End object geometrical type.
     * @param {point} end.shift End arrow offsets.
     * @param {array} vertices Connection vertices.
     * @return {object} Object containing location of start/end of the joint.
     */
    jointLocation: function(start, end, vertices){
	var verticesLength = vertices.length, theta,
        firstVertex = (vertices.length ? vertices[0] : undefined),
        lastVertex = (vertices.length ? vertices[verticesLength - 1] : undefined),
        p1, p1bp, c1t, c1r, p2, p2bp, c2t, c2r;

	// start object boundary point
	p1bp = this.boundPoint(start.bbox, start.type, start.rotation, firstVertex || end.bbox.center());
	// shift
	theta = start.bbox.center().theta(firstVertex || end.bbox.center());
	// first point of the connection
	p1 = point(p1bp.x + (2 * start.shift.dx * cos(theta.radians)),
		   p1bp.y + (-2 * start.shift.dy * sin(theta.radians)));
	// start arrow translation
	c1t = point(p1bp.x + start.shift.dx * cos(theta.radians),
		    p1bp.y - start.shift.dy * sin(theta.radians));
	// start arrow rotation
	c1r = 360 - theta.degrees + 180;

	// end object boundary point
	p2bp = this.boundPoint(end.bbox, end.type, end.rotation, lastVertex || start.bbox.center());
	// shift
	theta = (lastVertex || start.bbox.center()).theta(end.bbox.center());
	// last point of the connection
	p2 = point(p2bp.x + (-2 * end.shift.dx * cos(theta.radians)),
		   p2bp.y + (2 * end.shift.dy * sin(theta.radians)));
	// end arrow translation
	c2t = point(p2bp.x - end.shift.dx * cos(theta.radians),
	            p2bp.y + end.shift.dy * sin(theta.radians));
	// end arrow rotation
	c2r = 360 - theta.degrees;

	return {
	    start: {
		bound: p1bp,
		connection: p1,
		translate: c1t,
		rotate: c1r
	    },
	    end: {
		bound: p2bp,
		connection: p2,
		translate: c2t,
		rotate: c2r
	    }
	};
    },
    /**
     * @private
     * @param {point} start Joint start location.
     * @param {point} end Joint end location.
     * @param {array} vertices Connection vertices.
     * @param {boolean} smooth Connection smooth flag.
     * @return {array} SVG path commands.
     */
    connectionPathCommands: function(start, end, vertices, smooth){
	if (smooth)
	    return Bezier.curveThroughPoints([start].concat(vertices, [end]));
	var commands = ["M", start.x, start.y], i = 0, l = vertices.length;
	for (; i < l; i++)
	    commands.push("L", vertices[i].x, vertices[i].y);
	commands.push("L", end.x, end.y);
	return commands;
    },

    /**
     * @private
     * @param {point} start Joint start location.
     * @param {point} end Joint end location.
     * @param {array} vertices Connection vertices.
     * @return {array} Locations of the label (array of points).
     */
    labelLocation: function(connectionPathCommands){
        var path = this.paper.path(connectionPathCommands.join(' ')),
            length = path.getTotalLength(),
            locations = [], attrs = this._opt.labelAttrs, len = attrs.length, i = 0,
            position;
        for (; i < len; i++) {
            position = attrs[i].position;
            position = (position > length) ? length : position; // sanity check
            position = (position < 0) ? length + position : position;
            position = position > 1 ? position : length * position;
            locations.push(path.getPointAtLength(position));
        }
        path.remove();
        return locations;
    },

    /**
     * @private
     */
    draw: function(components){
	var self = this,
	    paper = this.paper,
	    jointLocation = this.jointLocation(
	        {
	            bbox: rect(this.startObject().getBBox()).moveAndExpand(this._opt.bboxCorrection.start),
		    type: this.startObject().type,
                    rotation: this.startObject().attrs.rotation,
		    shift: this._opt.arrow.start
	        },
	        {
	            bbox: rect(this.endObject().getBBox()).moveAndExpand(this._opt.bboxCorrection.end),
		    type: this.endObject().type,
                    rotation: this.endObject().attrs.rotation,
		    shift: this._opt.arrow.end
	        },
	        this._opt.vertices
	    ),
            connectionPathCommands = this.connectionPathCommands(
		jointLocation.start.connection,
		jointLocation.end.connection,
		this._opt.vertices,
		this._opt.beSmooth
	    ),
	    labelLocation = this.labelLocation(connectionPathCommands),
	    dom = JointDOMBuilder.init(this.paper, this._opt, this._start, this._end, jointLocation, connectionPathCommands, labelLocation),
	    l = components.length,
	    component;

	for (var i = 0; i < l; i++){
	    component = components[i];
	    this.dom[component] = dom[component]();
	}
    },
    /**
     * Clean operations.
     * Remove the DOM elements of connection/startCap/endCap/label if they exist.
     * Clean operations support chaining.
     * @private
     */
    clean: function(components){
	var component, name, subComponents, idx = components.length;
	while (idx--){
	    name = components[idx];
	    component = this.dom[name];
	    if (component){
		if (component.node){
		    component.remove();
		    this.dom[name] = null;
		} else {  // component is a composite object
		    subComponents = component;
		    for (var key in subComponents){
			if (subComponents.hasOwnProperty(key))
			    subComponents[key].remove();
		    }
		}
		this.dom[name] = null;
	    }
	}
    },

    /**
     * Process options.
     * @todo Please fix me! I look like spagethi.
     * @private
     * @param {object} opt
     */
    processOptions: function(opt){
	var key, myopt = this._opt,
            topOptions = ['interactive', 'cursor', 'beSmooth'], i = topOptions.length;
        
        // top options
        while (i--) {
            if (opt[topOptions[i]] !== undefined)
                myopt[topOptions[i]] = opt[topOptions[i]];
        }

        myopt.subConnectionAttrs = opt.subConnectionAttrs || undefined;

	Mixin(myopt.attrs, opt.attrs);
        Mixin(myopt.bboxCorrection.start, opt.bboxCorrection && opt.bboxCorrection.start);
        Mixin(myopt.bboxCorrection.end, opt.bboxCorrection && opt.bboxCorrection.end);
        if (opt.vertices) this._setVertices(opt.vertices);

        // label(s) related options
	if (opt.label) {
            myopt.label = isArray(opt.label) ? opt.label : [opt.label];
            if (!isArray(opt.labelAttrs)) opt.labelAttrs = [opt.labelAttrs];
            for (i = 0; i < myopt.label.length; i++) {
                Supplement(opt.labelAttrs[i] || (opt.labelAttrs[i] = {}), myopt.labelAttrsDefault);
            }
	    myopt.labelAttrs = opt.labelAttrs;      // make a copy? (parse(stringify(opt)))

            var spread = undefined;
            if (!isArray(opt.labelBoxAttrs)) {
                if (typeof opt.labelBoxAttrs === 'object')
                    spread = opt.labelBoxAttrs;
                opt.labelBoxAttrs = [opt.labelBoxAttrs];
            }
            for (i = 0; i < myopt.label.length; i++) {
                if (spread) opt.labelBoxAttrs[i] = spread;
                Supplement(opt.labelBoxAttrs[i] || (opt.labelBoxAttrs[i] = {}), this._opt.labelBoxAttrsDefault);
            }
	    myopt.labelBoxAttrs = opt.labelBoxAttrs;      // make a copy? (parse(stringify(opt)))
	}

        // arrowheads
	var sa = opt.startArrow, ea = opt.endArrow;
	if (sa && sa.type) myopt.arrow.start = Joint.getArrow(sa.type, sa.size, sa.attrs);
	if (ea && ea.type) myopt.arrow.end = Joint.getArrow(ea.type, ea.size, ea.attrs);
	// direct arrow specification rewrites types
	if (opt.arrow) {
            myopt.arrow.start = opt.arrow.start || myopt.arrow.start;
            myopt.arrow.end = opt.arrow.end || myopt.arrow.end;
	}

        // dummies
	if (opt.dummy && opt.dummy.start) {
	    if (opt.dummy.start.radius) myopt.dummy.start.radius = opt.dummy.start.radius;
            Mixin(myopt.dummy.start.attrs, opt.dummy.start.attrs);
        }
	if (opt.dummy && opt.dummy.end) {
	    if (opt.dummy.end.radius) myopt.dummy.end.radius = opt.dummy.end.radius;
            Mixin(myopt.dummy.end.attrs, opt.dummy.end.attrs);
	}
        // handles
	if (opt.handle){
	    if (opt.handle.timeout) myopt.handle.timeout = opt.handle.timeout;
	    if (opt.handle.start){
		if (opt.handle.start.enabled) myopt.handle.start.enabled = opt.handle.start.enabled;
		if (opt.handle.start.radius) myopt.handle.start.radius = opt.handle.start.radius;
                Mixin(myopt.handle.start.attrs, opt.handle.start.attrs);
	    }
	    if (opt.handle.end){
		if (opt.handle.end.enabled) myopt.handle.end.enabled = opt.handle.end.enabled;
		if (opt.handle.end.radius) myopt.handle.end.radius = opt.handle.end.radius;
                Mixin(myopt.handle.end.attrs, opt.handle.end.attrs);
	    }
	}
    },
    // Public API

    /**
     * Disconnects joint from objects.
     * @param {string} cap "start|end|both" which side to disconnect
     * @return {Joint} return this to allow chaining
     */
    disconnect: function(cap){
        var disconnectedFrom, camelCap = (cap === "start")
                                          ? "Start"
                                          : (cap === "end"
                                             ? "End"
                                             : "Both");

        if (cap === "both" || cap === undefined){
            this.freeJoint(this.startObject())
                .freeJoint(this.endObject());
            
            if (!this.isStartDummy()){
                disconnectedFrom = this.startObject();
                this.draw(["dummyStart"]);
	        this.callback("disconnected", disconnectedFrom, [cap]);
            }
            if (!this.isEndDummy()){
                disconnectedFrom = this.endObject();
                this.draw(["dummyEnd"]);
	        this.callback("disconnected", disconnectedFrom, [cap]);
            }
            
        } else if (!this["is" + camelCap + "Dummy" ]()){
            // do not do anything with already disconnected side
            disconnectedFrom = this[cap + "Object"]();
            if (this.startObject() !== this.endObject()){
                this.freeJoint(disconnectedFrom);                
            }
            this.draw(["dummy" + camelCap]);
	    this.callback("disconnected", disconnectedFrom, [cap]);
        }

        return this;
    },

    /**
     * Register object(s) so that it can be pointed by my cap.
     * @param {RaphaelObject|Shape|array} obj
     * @param {string} cap "start|end|both" cap to register default: "both"
     * @return {Joint}
     * @example j.register(circle, "end")
     */
    register: function(obj, cap){
	if (!cap){
	    cap = "both";
	}
	// prepare array of objects that are to be registered
	var toRegister = (obj.constructor == Array) ? obj : [obj];
	// register all objects in toRegister array
	for (var i = 0, len = toRegister.length; i < len; i++){
	    toRegister[i].yourself()._capToStick = cap;
	    this._registeredObjects.push(toRegister[i]);
	}
	return this;
    },
    /**
     * The difference between register and registerForever is that registerForever
     * saves reference to an array passed as argument. It means that all objects pushed
     * into the array before and/or after the call of this method will be registered (for both caps).
     * This method is useful for applications that do not know to which objects the connection
     * can be sticked when the joint is created.
     * @param {array} arr An array holding objects which the joint is going to be registered to.
     * @return {Joint}
     * @example
     * var all = [];
     * j.registerForever(all);
     * // ... create objects and push them into all array
     */
    registerForever: function(arr){
        if (Object.prototype.toString.call(arr) !== "[object Array]")
            arr = Array.prototype.slice.call(arguments);
	this._registeredObjects = arr;
	return this;
    },
    /**
     * Cancel registration of an object.
     * @param {RaphaelObject|Shape} obj
     * @param {string} cap "start|end|both" cap to unregister default: "both"
     * @return {Joint}
     * @example j.unregister(circle, "end");
     */
    unregister: function(obj, cap){
	cap = cap || "both";

	var index = -1;
	for (var i = 0, len = this._registeredObjects.length; i < len; i++){
            var capToStick = this._registeredObjects[i].yourself()._capToStick || "both";
	    if (this._registeredObjects[i] === obj && capToStick === cap){
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
     * @return {array} Registered Objects.
     */
    registeredObjects: function(){
        return this._registeredObjects;
    },
    /**
     * Set the vertices of the connection
     * @param {array} vertices Array of points (vertices) - either of the form: {x: 5, y; 10} or "5 10" or "5@10"
     * @return {Joint}
     */
    setVertices: function(vertices){
        this._setVertices(vertices);
        this.update();
        return this;
    },
    /**
     * Set connection vertices.
     * @private
     */
    _setVertices: function(vertices) {
	var conVertices = this._opt.vertices = [], p;
	// cast vertices to points
	for (var i = 0, l = vertices.length; i < l; i++){
            p = (vertices[i].y === undefined) ?
                    point(vertices[i]) : point(vertices[i].x, vertices[i].y);
	    conVertices.push(p);
	}
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
     * Set a label of the connection.
     * @param {string|array} str label(s)
     * @return {Joint}
     */
    label: function(str){
        this._opt.label = isArray(str) ? str : [str];
        for (var i = 0; i < str.length; i++) {
            this._opt.labelAttrs[i] = this._opt.labelAttrsDefault;
            this._opt.labelBoxAttrs[i] = this._opt.labelBoxAttrsDefault;
        }
	this.update();
	return this;
    },
    /**
     * Register callback function on various events.
     * @link Callbacks
     * @param {string} evt "justConnected"|"disconnected"|"justBroken"|"wiring"|"objectMoving"
     * @param fnc Callback
     * @return {Joint}
     * @example
     * j.registerCallback("justConnected", function(side){ ... this points to the object the joint was just connected to ... });
     * j.registerCallback("disconnected", function(side){ ... this points to the object the joint was just disconnected from ... });
     * j.registerCallback("justBroken", function(mousePos){ ... this points to the joint object ... });
     * j.registerCallback("wiring", function(mousePos){ ... this points to the joint object ... });
     * j.registerCallback("objectMoving", function(obj){ ... this points to the joint object ... });
     *
     * j.registerCallback("justConnected", function(side){
     *   if (side === "start"){
     *     console.log("Start cap connected.");
     *   } else {  // side === "end"
     *     console.log("End cap connected");
     *   }
     * });
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
	this._opt.vertices = [];
	this.update();
	return this;
    },
    /**
     * Show/hide handle(s).
     * If a connection arrow is, e.g., of type none, it is difficult to grab the end of the connection.
     * For these cases, you can use handles, which are just simple circles showing at the end of a connection.
     * @param {string} cap &optional [start|end] Specifies on what side handle should be shown.
     * @return {Joint}
     */
    toggleHandle: function(cap){
	var handle = this._opt.handle;
	if (!cap){
	    handle.start.enabled = !handle.start.enabled;
	    handle.end.enabled = !handle.end.enabled;
	} else {
	    handle[cap].enabled = !handle[cap].enabled;
	}
	this.update();
	return this;
    },
    /**
     * Show handle.
     * @return {Joint}
     */
    showHandle: function(cap){
	var handle = this._opt.handle;
	if (!cap){
	    handle.start.enabled = true;
	    handle.end.enabled = true;
	} else {
	    handle[cap].enabled = true;
	}
	this.update();
	return this;
    },
    /**
     * Hide handle.
     * @return {Joint}
     */
    hideHandle: function(cap){
	var handle = this._opt.handle;
	if (!cap){
	    handle.start.enabled = false;
	    handle.end.enabled = false;
	} else {
	    handle[cap].enabled = false;
	}
	this.update();
	return this;
    },
    /**
     * Set bounding box correction.
     * This advanced feature of Joint library allows you to shift a point to which a connection sticks.
     * You can for example modify a connection to point to the center of an object or you can set a distance
     * between an object and a connection arrow.
     * @param {object} [corr] correction Correction
     * @param {string} [corr.type] fake type of an object to which a cap points
     * @param {number} [corr.x] x-axis shift of an object bounding box
     * @param {number} [corr.y] y-axis shift of an object bounding box
     * @param {number} [corr.width] change in an object bounding box width (can be negative)
     * @param {number} [corr.height] change in an object bounding box height (can be negative)
     * @param {string} cap "start|end"|undefined cap (undefined === both caps)
     * @return {Joint}
     * @example
     * // 1.) both sides of the connection will point to the center of
     * //     a circular object with radius == 30
     * j.setBBoxCorrection({
     *   type: "ellipse",
     *   x: 30,
     *   y: 30,
     *   width: -60,
     *   height: -60
     * });
     *
     * // 2.) keep 20px distance between connection's arrow
     * //     and a circular object
     * j.setBBoxCorrection({
     *   type: "ellipse",
     *   x: -20,
     *   y: -20,
     *   width: 40,
     *   height: 40
     * });
     */
    setBBoxCorrection: function(corr, cap){
	if (!cap){
	    this._opt.bboxCorrection.start = this._opt.bboxCorrection.end = corr;
	} else {
	    this._opt.bboxCorrection[cap] = corr;
	}
	this.update();
	return this;
    },

    /**
     * Highlight connection.
     * Note that highlight diseappears after the first update.
     * @return {Joint} Return this.
     */
    highlight: function(color){
        color = color || "red";
	this.connection().attr("stroke", color);
	return this;
    },

    /**
     * Unhighlight connection.
     * @return {Joint} Return this.
     */
    unhighlight: function(){
	this.connection().attr("stroke", this._opt.attrs.stroke || "#000");
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

/**
 * Set a paper for graphics rendering.
 * @param {Raphael|number,number,number,number|string,number,number|HTMLElement} p
 * @return {Raphael} Paper.
 * @example
 * // create paper from existing HTMLElement with id "world" specifying width and height
 * Joint.paper("world", 640, 480);
 * // create paper specifying x, y position and width and height
 * Joint.paper(50, 50, 640, 480);
 * // paper is created from the HTMLElement with id "world"
 * Joint.paper(document.getElementById("world"));
 * // create paper using Raphael
 * Joint.paper(Raphael("world", 640, 480));
 */
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
 * @example
 * // create paper from existing HTMLElement with id "world" specifying width and height
 * Joint.paper("world", 640, 480);
 * // ... draw objects, diagrams, etc. ...
 * Joint.resetPaper();
 * // paper is clear and ready for next usage
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
    if (!arrow.attrs) arrow.attrs = {};

    if (attrs){
	for (var key in attrs){
	    arrow.attrs[key] = attrs[key];
	}
    }
    return arrow;
};

/**
 * This object contains predefined arrow types. Currently, there are only two types: none and basic.
 * These are considered general types and are suitable for most diagrams. Nevertheless, new arrows
 * can be easily added. See arrows.js plugin, which provides some fancier arrows.
 * The names can be used as startArrow|endArrow types.
 * @example circle.joint(rect, { startArrow: { type: basic, size: 5, attrs: ... } });
 */
Joint.arrows = {
    none: function(size){
	if (!size){ size = 2; }
	return {
	    path: ["M",size.toString(),"0","L",(-size).toString(),"0"],
	    dx: size,
	    dy: size,
            attrs: { opacity: 0 }
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

var JointDOMBuilder = {
    init: function(paper, opt, start, end, jointLocation, connectionPathCommands, labelLocation){
	this.paper = paper;
	this.opt = opt;
	this.start = start;
	this.end = end;
	this.jointLocation = jointLocation;
	this.connectionPathCommands = connectionPathCommands;
	this.labelLocation = labelLocation;
	return this;
    },
    dummy: function(startOrEnd, pos, opt){
	startOrEnd.dummy = true;
	startOrEnd.shape = this.paper.circle(pos.x, pos.y, opt.radius).attr(opt.attrs);
	startOrEnd.shape.show();
	return startOrEnd.shape;
    },
    dummyStart: function(){
	return this.dummy(this.start, this.jointLocation.start.bound, this.opt.dummy.start);
    },
    dummyEnd: function(){
	return this.dummy(this.end, this.jointLocation.end.bound, this.opt.dummy.end);
    },
    handleStart: function(){
	var opt = this.opt.handle.start;
	if (!opt.enabled) return undefined;
	var pos = this.jointLocation.start.bound;
	return this.paper.circle(pos.x, pos.y, opt.radius).attr(opt.attrs);
    },
    handleEnd: function(){
	var opt = this.opt.handle.end;
	if (!opt.enabled) return undefined;
	var pos = this.jointLocation.end.bound;
	return this.paper.circle(pos.x, pos.y, opt.radius).attr(opt.attrs);
    },
    connection: function(){
	var opt = this.opt, paths = [],
	    con = this.paper.path(this.connectionPathCommands.join(" ")).attr(opt.attrs);
        if (opt.subConnectionAttrs) {
            var i = 0, l = opt.subConnectionAttrs.length, 
                length = con.getTotalLength();
            for (; i < l; i++) {
                var attrs = opt.subConnectionAttrs[i];
                var from = attrs.from || 2, to = attrs.to || 1;
                from = from > length ? length : from;
                from = from < 0 ? length + from : from;
                from = from > 1 ? from : length * from;
                to = to > length ? length : to;
                to = to < 0 ? length + to : to;
                to = to > 1 ? to : length * to;                
                var subPath = this.paper.path(con.getSubpath(from, to)).attr(attrs);
                subPath.node.style.cursor = opt.cursor;
                paths.push(subPath);
            }
        }
	con.node.style.cursor = opt.cursor;
	con.show();
	return [con].concat(paths);
    },
    label: function(){
	if (this.opt.label === undefined) return undefined;
	var labels = isArray(this.opt.label) ? this.opt.label : [this.opt.label],
            attrs = this.opt.labelAttrs,
            len = labels.length, i = 0, components = [];

        for (; i < len; i++) {
            var pos = this.labelLocation[i],
	        labelText = this.paper.text(pos.x, pos.y + (attrs[i].offset || 0), labels[i]).attr(attrs[i]),
	        bb = labelText.getBBox(),
                padding = attrs[i].padding || 0,
	        labelBox = this.paper.rect(bb.x - padding, bb.y - padding + (attrs[i].offset || 0), bb.width + 2*padding, bb.height + 2*padding).attr(this.opt.labelBoxAttrs[i]);
	    labelText.insertAfter(labelBox);
            components.push(labelText, labelBox)
        }
	return components;
    },
    startCap: function(){
	var opt = this.opt.arrow.start,
	    startCap = this.paper.path(opt.path.join(" ")).attr(opt.attrs);
	startCap.translate(this.jointLocation.start.translate.x,
			   this.jointLocation.start.translate.y);
	startCap.rotate(this.jointLocation.start.rotate);
	startCap.show();
	return startCap;
    },
    endCap: function(){
	var opt = this.opt.arrow.end,
	    endCap = this.paper.path(opt.path.join(" ")).attr(opt.attrs);
	endCap.translate(this.jointLocation.end.translate.x,
			 this.jointLocation.end.translate.y);
	endCap.rotate(this.jointLocation.end.rotate);
	endCap.show();
	return endCap;
    }
};

/**
 * Geometry-Primitives.
 */

/**
 * Point object.
 * @constructor
 */
function Point(x, y){
    var xy;
    if (y === undefined){
        // from string
        xy = x.split(x.indexOf("@") === -1 ? " " : "@");
        this.x = parseInt(xy[0], 10);
        this.y = parseInt(xy[1], 10);
    } else {
        this.x = x;
        this.y = y;
    }
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
     * @return {double} length of the line
     */
    length: function(){ return sqrt(this.squaredLength()); },

    /**
     * @return {integer} length without sqrt
     * @note for applications where the exact length is not necessary (e.g. compare only)
     */
    squaredLength: function(){
	var
	x0 = this.start.x, y0 = this.start.y,
	x1 = this.end.x, y1 = this.end.y;
	return (x0 -= x1)*x0 + (y0 -= y1)*y0;
    },

    /**
     * @return {point} my midpoint
     */
    midpoint: function(){
	return point((this.start.x + this.end.x) / 2,
		     (this.start.y + this.end.y) / 2);
    },


    /**
     * @return {point} where I intersect l.
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
     * @return {boolean} true if rectangles intersect
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
     * @return {string} (left|right|top|bottom) side which is nearest to point
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
     * @return {bool} true if point p is insight me
     */
    containsPoint: function(p){
	if (p.x > this.x && p.x < this.x + this.width &&
	    p.y > this.y && p.y < this.y + this.height){
	    return true;
	}
	return false;
    },

    /**
     * @return {point} a point on my border nearest to parameter point
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
     * @param r {rectangle} representing deltas
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
Joint.Mixin = Mixin;
Joint.Supplement = Supplement;
Joint.DeepMixin = DeepMixin;
Joint.DeepSupplement = DeepSupplement;

/**
 * TODO: rotation support. there is a problem because
 * rotation does not set any attribute in this.attrs but
 * instead it sets transformation directly to let the browser
 * SVG engine compute the position.
 */
var _attr = global.Raphael.el.attr;
global.Raphael.el.attr = function(){
    // is it a getter or el is not a joint object?
    if ((arguments.length == 1 &&
	 (typeof arguments[0] === "string" || typeof arguments[0] === "array")) ||
	(typeof this.joints === "undefined")){
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

global.Raphael.el.yourself = function(){
    return this;
};

global.Raphael.el.joints = function(){
    return (this._joints || (this._joints = []));
};

global.Raphael.fn.euid = function(){
    return Joint.generateEuid.call(this);
};

})(this);	// END CLOSURE
