/**
 * Joint.dia 0.1.0 - Joint plugin for creating diagram elements.
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

var Joint = global.Joint;

var point = Joint.point;
var rect = Joint.rect;

var dia = Joint.dia = {
    /**
     * Current dragged object.
     */ 
    _currentDrag: false,
    /**
     * Current zoomed object.
     */ 
    _currentZoom: false,
    /**
     * Table with all registered objects.
     *  - registered objects can embed and can be embedded
     *  - the table is of the form: {RaphaelPaper1: [shape1, shape2, ...]}
     */
    _registeredObjects: {},
    /**
     * Table whith all registered joints.
     *  - the table is of the form: {RaphaelPaper1: [joint1, joint2, ...]}
     */
    _registeredJoints: {},
    /**
     * Create new joint and register it. 
     * @param {JointArguments} args Joint parameters. @see Joint
     * @return Joint
     */
    Joint: function(args){
	var j = Joint.apply(null, arguments);
	this.registerJoint(j);
	return j;
    },
    /**
     * Register object to the current paper.
     * @param {Element|Joint} obj Object to be registered.
     * @return {Element|Joint} Registered object.
     */
    register: function(obj){
	var paper = Joint.paper();
	(this._registeredObjects[paper] || (this._registeredObjects[paper] = [])).push(obj);
    },
    registerJoint: function(j){
	var paper = Joint.paper();
	(this._registeredJoints[paper] || (this._registeredJoints[paper] = [])).push(j);	
    }
};

/**
 * Composite object.
 */
var Element = dia.Element = function(){};

/**
 * Copies all the properties to the first argument from the following arguments.
 * All the properties will be overwritten by the properties from the following
 * arguments. Inherited properties are ignored.
 */
var Mixin = Joint.Mixin = function() {
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
 */
var Supplement = Joint.Supplement = function() {
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

Element.create = function(properties){
    var instance = new this(properties);
    if (instance.init){
	instance.init(properties);
    }
    return instance;
};

Element.extend = function(prototype){
    var C = prototype.constructor = function(properties){ 
	this.construct(properties); 
    };
    C.base = this;
    var proto = C.prototype = new this();
    Mixin(proto, prototype);
    Supplement(C, this);
    return C;
};

Element.prototype = {
    parentShape: null,
    toolbox: null,
    _isElement: true,
    // auxiliaries for scaling and translating
    lastScaleX: 1.0,
    lastScaleY: 1.0,
    dx: undefined,
    dy: undefined,
    // original bounding box (before scaling a translating)
    // set in setWrapper()
    origBBox: undefined,

    construct: function(properties){
	this.properties = { 
	    dx: 0, dy: 0,		// translation
	    rot: 0,			// rotation
	    sx: 1.0, sy: 1.0,		// scale
	    module: this.module, 
	    object: this.object 
	};
	this.wrapper = null;
	this.inner = [];
	// ghost attributes
	this.ghostAttrs = {
	    opacity: 0.5, 
	    "stroke-dasharray": "-",
	    stroke: "black"
	};
	this._opt = {
	    draggable: true,	// enable dragging?
	    ghosting: false,		// enable ghosting?
	    toolbox: false		// enable toolbox?
	};

	this.paper = Joint.paper();
	dia.register(this); // register me in the global table
    },
    /**
     * Returns element unique id.
     */
    euid: function(){
	return Joint.generateEuid.call(this);
    },
    // this is needed in joint library when
    // manipulating with a raphael object joints array
    // - just delegate joints array methods to the wrapper
    joints: function(){
	return this.wrapper.joints();
    },

    updateJoints: function(){
	var joints = this.wrapper.joints();
	if (joints){
	    for (var i = 0, l = joints.length; i < l; i++){
		joints[i].update();
	    }
	}
    },

    toggleGhosting: function(){
	this._opt.ghosting = !this._opt.ghosting;
	return this;
    },

    /**
     * Create a ghost shape which is used when dragging.
     * (in the case _opt.ghosting is enabled)
     */
    createGhost: function(){
	var 
	wa = this.wrapper.attrs,
	paper = this.wrapper.paper;
	
	switch (this.wrapper.type){
	case "rect":
	    this.ghost = paper.rect(wa.x, wa.y, wa.width, wa.height, wa.r);
	    break;
	case "circle":
	    this.ghost = paper.circle(wa.cx, wa.cy, wa.r);
	    break;
	case "ellipse":
	    this.ghost = paper.ellipse(wa.cx, wa.cy, wa.rx, wa.ry);
	    break;
	default:
	    break;
	}
	//    this.ghost.scale(this.lastScaleX, this.lastScaleY);
	this.ghost.attr(this.ghostAttrs);
    },

    /**
     * Get object position.
     * @return point
     */
    objPos: function(objname){
	switch (this[objname].type){
	case "rect":
	    return point(this[objname].attr("x"), this[objname].attr("y"));
	case "circle":
	case "ellipse":
	    return point(this[objname].attr("cx"), this[objname].attr("cy"));
	default:
	    break;
	}
    },

    wrapperPos: function(){ 
	return this.objPos("wrapper");
    },
    ghostPos: function(){ 
	return this.objPos("ghost");
    },

    /**
     * Recursively call toFront() on inner.
     */
    toFront: function(){
	this.wrapper && this.wrapper.toFront();
	for (var i = 0, len = this.inner.length; i < len; i++)
	    this.inner[i].toFront();
	return this;
    },

    /**
     * Recursively call toBack() on inner (in reverse order than toFront()).
     */
    toBack: function(){
	for (var i = this.inner.length - 1; i <= 0; --i)
	    this.inner[i].toBack();
	this.wrapper && this.wrapper.toBack();
	return this;
    },

    /**
     * dia.Element mousedown event.
     */
    dragger: function(e){
	dia._currentDrag = this.wholeShape;
	if (dia._currentDrag._opt.ghosting){
	    dia._currentDrag.createGhost();
	    dia._currentDrag.ghost.toFront();
	} else
	    dia._currentDrag.toFront();

	dia._currentDrag.removeToolbox();
	// small hack to get the connections to front
	dia._currentDrag.translate(1,1);

	dia._currentDrag.dx = e.clientX;
	dia._currentDrag.dy = e.clientY;    
	e.preventDefault && e.preventDefault();
    },

    /**
     * dia.Element zoom tool mousedown event.
     */
    zoomer: function(e){
	dia._currentZoom = this;
	dia._currentZoom.toFront();
	dia._currentZoom.removeToolbox();

	var bb = rect(dia._currentZoom.origBBox);
	dia._currentZoom.dx = e.clientX;
	dia._currentZoom.dy = e.clientY;
	dia._currentZoom.dWidth = bb.width * dia._currentZoom.lastScaleX;
	dia._currentZoom.dHeight = bb.height * dia._currentZoom.lastScaleY;

	e.preventDefault && e.preventDefault();
    },

    translate: function(dx, dy){
	// save translation
	this.properties.dx += dx;
	this.properties.dy += dy;
	// translate wrapper, all inner and toolbox
	this.wrapper.translate(dx, dy);
	for (var i = this.inner.length - 1; i >= 0; --i){
	    this.inner[i].translate(dx, dy);
	}
	this.translateToolbox(dx, dy);
    },

    /**
     * Add wrapper.
     */
    setWrapper: function(s){
	this.wrapper = s;			// set wrapper
	this.wrapper.wholeShape = this;		// set wrapper's reference to me
	this.type = this.wrapper.type;		// set my type
	this.origBBox = this.wrapper.getBBox();	// save original bounding box
	// if dragging enabled, register mouse down event handler
	if (this._opt && this._opt.draggable){
	    this.wrapper.mousedown(this.dragger);
	    this.wrapper.node.style.cursor = "move";
	}
	// make sure wrapper has the joints method
	if (!this.wrapper.joints){
	    this.wrapper._joints = [];
	    this.wrapper.joints = function(){ return this._joints; };
	}
	// add toolbox if enabled
	this.addToolbox();
	return this;
    },

    /**
     * Add subshape.
     */
    addInner: function(s){
	this.inner.push(s);
	// @remove one of them?
	s.wholeShape = this;	
	s.parentShape = this;
	// if dragging enabled, register mouse down event handler
	if (!s._isElement && this._opt && this._opt.draggable){
	    s.mousedown(this.dragger);
	    s.node.style.cursor = "move";
	}
	s.toFront();	// always push new inner to the front
	return this;
    },

    /**
     * Remove subshape.
     */
    delInner: function(s){
	var 
	i = 0,
	len = this.inner.length;
	for (; i < len; i++)
	    if (this.inner[i] == s)
		break;
	if (i < len){
	    this.inner.splice(i, 1);
	    s.parentShape = null;
	}
	return this;
    },

    /**
     * Show toolbox.
     */
    addToolbox: function(){
	// do not show toolbox if it is not enabled
	if (!this._opt.toolbox){
	    return this;
	}

	var 
	self = this,
	bb = this.wrapper.getBBox(),	// wrapper bounding box
	tx = bb.x - 10,	// toolbox x position
	ty = bb.y - 10;	// toolbox y position

	this.toolbox = [];
	this.toolbox.push(this.paper.rect(tx, ty, 33, 11, 5).attr({fill: "white"}));
	// zoom in/out
	this.toolbox.push(this.paper.image("../mint_icons/icons/search.png", tx, ty, 11, 11));
	this.toolbox[this.toolbox.length-1].toFront();
	Joint.addEvent(this.toolbox[this.toolbox.length-1].node, "mousedown", function(e){
			   dia.Element.prototype.zoomer.apply(self, [e]);
		       });
	// embed
	this.toolbox.push(this.paper.image("../mint_icons/icons/page_spearmint_up.png", tx + 22, ty, 11, 11));
	this.toolbox[this.toolbox.length-1].toFront();
	this.toolbox[this.toolbox.length-1].node.onclick = function(){ self.embed() };
	// unembed
	this.toolbox.push(this.paper.image("../mint_icons/icons/page_spearmint_down.png", tx + 11, ty, 11, 11));
	this.toolbox[this.toolbox.length-1].toFront();
	this.toolbox[this.toolbox.length-1].node.onclick = function(){ self.unembed() };
	// toolbox wrapper
	return this;
    },

    /**
     * Hide (remove) toolbox.
     */
    removeToolbox: function(){
	if (this.toolbox)
	    for (var i = this.toolbox.length - 1; i >= 0; --i)
		this.toolbox[i].remove();
	this.toolbox = null;
	return this;
    },

    /**
     * Show/hide toolbox.
     */
    toggleToolbox: function(){
	this._opt.toolbox = !this._opt.toolbox;
	if (this._opt.toolbox){
	    this.addToolbox();
	} else {
	    this.removeToolbox();
	}
	return this;
    },

    /**
     * Move toolbox by offset (dx, dy).
     */
    translateToolbox: function(dx, dy){
	if (this.toolbox)
	    for (var i = this.toolbox.length - 1; i >= 0; --i)
		this.toolbox[i].translate(dx, dy);
    },

    /**
     * Embed me into the first registered dia.Element whos bounding box 
     * contains my bounding box origin.
     */
    embed: function(){
	var 
	ros = dia._registeredObjects[this.paper],
	myBB = rect(this.wrapper.getBBox()),
	embedTo = null;

	// for all registered objects (sharing the same raphael paper)
	for (var i = 0, len = ros.length; i < len; i++){
	    var 
	    shape = ros[i],
	    shapeBB = rect(shape.getBBox());

	    // does shape contain my origin point?
	    if (shapeBB.containsPoint(myBB.origin()))
		embedTo = shape;	// if yes, save the shape

	    if (shape == this.parentShape){
		shape.del(this);

		// just for optimization, a shape can be a subshape of 
		// only one shape, so if I have been deleted from my parent, 
		// I am free, and further, if I know where to embed -> do not search deeper
		if (embedTo) break;
	    }
	}

	// embed if possible
	embedTo && embedTo.addInner(this);
	return this;
    },

    /**
     * Free me. After this method call, I am no longer a subshape
     * of any other dia.Element.
     */
    unembed: function(){
	if (this.parentShape){
	    this.parentShape.del(this);
	    this.parentShape = null;
	}
	return this;
    },

    /**
     * Scale.
     * Derived objects have to implement their own scale method!
     * Must be called at the end of each derived object's scale method!
     */
    scale: function(){
	this.wrapper.scale.apply(this.wrapper, arguments);
	this.zoom.apply(this, arguments);
	// apply scale to all subshapes that are Elements (were embeded) 
	for (var i = 0, len = this.inner.length; i < len; i++){
	    var subShape = this.inner[i];
	    if (subShape._isElement){
		subShape.scale.apply(inner, arguments);
	    }
	}
	if (this._doNotRedrawToolbox) return;
	this.removeToolbox();
	this.addToolbox();
    },
    zoom: function(){
	// does nothing, overriden by specific elements
    },

    /**
     * Delegate getBBox message to my wrapper.
     */
    getBBox: function(){
	return this.wrapper.getBBox();
    },

    /**
     * Delegate joint message to my wrapper.
     */
    joint: function(to, opt){
	var toobj = (to._isElement) ? to.wrapper : to,
	    j = this.wrapper.joint.apply(this.wrapper, [toobj, opt]);
	Joint.dia.registerJoint(j);
	return j;
    },

    /**
     * Delegate attr message to my wrapper.
     */
    attr: function(){
	return Raphael.el.attr.apply(this.wrapper, arguments);
    }
};


/**
 * Document mousemove event.
 */
Element.mouseMove = function(e){
    e = e || window.event;
    // object dragging
    if (dia._currentDrag){
	if (dia._currentDrag._opt.ghosting)	// if ghosting, move ghost
	    dia._currentDrag.ghost.translate(e.clientX - dia._currentDrag.dx, e.clientY - dia._currentDrag.dy);
	else	// otherwise, move the whole shape
	    dia._currentDrag.translate(e.clientX - dia._currentDrag.dx, e.clientY - dia._currentDrag.dy);

	dia._currentDrag.dx = e.clientX;
	dia._currentDrag.dy = e.clientY;
    }

    // object zooming
    if (dia._currentZoom){
	var 
	dx = e.clientX - dia._currentZoom.dx,
	dy = e.clientY - dia._currentZoom.dy;
	
	dia._currentZoom.dWidth -= dx;
	dia._currentZoom.dHeight -= dy;
	// correction
	if (dia._currentZoom.dWidth < 1) dia._currentZoom.dWidth = 1;
	if (dia._currentZoom.dHeight < 1) dia._currentZoom.dHeight = 1;

	// scaling parameters
	var 
	sx = dia._currentZoom.dWidth / dia._currentZoom.origBBox.width,
	sy = dia._currentZoom.dHeight / dia._currentZoom.origBBox.height;

	// do not redraw toolbox because it is not there
	dia._currentZoom._doNotRedrawToolbox = true;
	dia._currentZoom.scale(sx, sy);	// scale
	r.safari();

	// save for later usage
	dia._currentZoom.dx = e.clientX;
	dia._currentZoom.dy = e.clientY;
	dia._currentZoom.lastScaleX = sx;
	dia._currentZoom.lastScaleY = sy;
    }
};

/**
 * Document mouseup event.
 */
Element.mouseUp = function(e){
    // if ghosting is enabled, translate whole shape to the position of
    // the ghost, then remove ghost and update joints
    if (dia._currentDrag && dia._currentDrag._opt.ghosting){
	var 
	gPos = dia._currentDrag.ghostPos(),
	wPos = dia._currentDrag.wrapperPos();

	dia._currentDrag.translate(gPos.x - wPos.x, gPos.y - wPos.y);
	dia._currentDrag.ghost.remove();
	dia._currentDrag.updateJoints();
    }
    // add toolbar again when dragging is stopped
    if (dia._currentDrag){
	dia._currentDrag.addToolbox();
	dia._currentDrag.toFront();
	// small hack: change slightely the position to get the connections to front
	dia._currentDrag.translate(1,1);
    }

    // if ghosting is enabled, scale whole shape as
    // the ghost is, then remove ghost and update joints
    if (dia._currentZoom && dia._currentZoom._opt.ghosting){
	// current ghost scale
	//	dia._currentZoom.scale(dia._currentZoom.lastScaleX, dia._currentZoom.lastScaleY);
	//	dia._currentZoom.ghost.remove();
	//	dia._currentZoom.joints.update();
    }
    // add toolbar again when zooming is stopped
    if (dia._currentZoom){
	// remove toolbox, because scale above may create one, 
	// so there would be two toolboxes after addToolbox() below
	dia._currentZoom.removeToolbox();
	dia._currentZoom.addToolbox();
	dia._currentZoom.toFront();
    }

    dia._currentDrag = false;
    dia._currentZoom = false;
};

Joint.addEvent(document, "mousemove", Element.mouseMove);
Joint.addEvent(document, "mouseup", Element.mouseUp);


})(this);	// END CLOSURE