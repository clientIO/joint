(function(global){	// BEGIN CLOSURE

var Joint = global.Joint;

var point = Joint.point;
var rect = Joint.rect;

/**
 * @name Joint.dia
 * @namespace Holds functionality related to all diagrams and their elements.
 */
var dia = Joint.dia = {
    /**
     * Current dragged object.
     * @private
     */
    _currentDrag: false,
    /**
     * Current zoomed object.
     * @private
     */
    _currentZoom: false,
    /**
     * Table with all registered objects.
     *  - registered objects can embed and can be embedded
     *  - the table is of the form: {RaphaelPaper1: [shape1, shape2, ...]}
     * @private
     */
    _registeredObjects: {},
    /**
     * Table whith all registered joints.
     *  - the table is of the form: {RaphaelPaper1: [joint1, joint2, ...]}
     * @private
     */
    _registeredJoints: {},
    /**
     * Create new joint and register it. All joints appearing in a diagram should
     * be created using this function. Otherwise they won't be registered and
     * therefore not serialized when needed.
     * @param {Object} args Joint parameters.
     * @see Joint
     * @return {Joint}
     */
    Joint: function(args){
	var j = Joint.apply(null, arguments);
	this.registerJoint(j);
	return j;
    },
    /**
     * Returns registered elements of the current paper.
     * @return {array} Array of registered elements.
     */
    registeredElements: function(){
	return (this._registeredObjects[Joint.paper().euid()] || (this._registeredObjects[Joint.paper().euid()] = []));
    },
    /**
     * Returns registered joints of the current paper.
     * @return {array} Array of registered joints.
     */
    registeredJoints: function(){
	return (this._registeredJoints[Joint.paper().euid()] || (this._registeredJoints[Joint.paper().euid()] = []));
    },
    /**
     * Register object to the current paper.
     * You don't have to use this method unless you really know what you're doing.
     * @param {Element|Joint} obj Object to be registered.
     * @return {Element|Joint} Registered object.
     */
    register: function(obj){
	(this._registeredObjects[Joint.paper().euid()] || (this._registeredObjects[Joint.paper().euid()] = [])).push(obj);
    },
    /**
     * Cancel registration of an element in the current paper.
     * @param {Element} obj Object to be unregistered.
     */
    unregister: function(obj){
	var register = (this._registeredObjects[Joint.paper().euid()] || (this._registeredObjects[Joint.paper().euid()] = [])),
	    idx = register.length;
	while (idx--)
	    if (register[idx] === obj)
		register.splice(idx, 1);
    },
    /**
     * Register joint to the current paper. Avoid registering the the same joint twice.
     * You don't have to use this method unless you really know what you're doing.
     * @param {Joint} j Joint object to be registered.
     */
    registerJoint: function(j){
	(this._registeredJoints[Joint.paper().euid()] || (this._registeredJoints[Joint.paper().euid()] = [])).push(j);
    },
    /**
     * Cancel registration of a joint in the current paper.
     * @param {Joint} j Joint to be unregistered.
     */
    unregisterJoint: function(j){
	var register = (this._registeredJoints[Joint.paper().euid()] || (this._registeredJoints[Joint.paper().euid()] = [])),
	    idx = register.length;
	while (idx--)
	    if (register[idx] === j)
		register.splice(idx, 1);
    }
};

/**
 * Abstract object of all diagram elements.
 * This object is never used directly, instead, specific diagram elements inherits from it.
 * Allows easy creation of new specific diagram elements preserving all features that Joint library and Joint.dia plugin offer.
 * <h3>Wrapper</h3>
 *  All custom elements must have a wrapper set. Wrapper is the key object that Joint library counts with.
 *  There cannot be any element without a wrapper. Usually it is an object which wraps all the subelements
 *  that a specific diagram element contains. The wrapper must be set in init method.
 *  To set a wrapper, use setWrapper(aWrapper) method. The single parameter to the method is a Raphaël vector object.
 *  Later on, you can access this object using wrapper property.
 * <h3>Inner</h3>
 *  Inner objects are subelements of an element. Although they are optional, they are commonly used. To add a subelement
 *  to the element, use addInner(anInner) method. It takes a Raphaël vector object as an argument. All inner objects are
 *  placed to an array that you can access using inner property.
 * <h3><i>init</i> method</h3>
 *  The <i>init</i> method has to be part of every element you create. It takes all element options as an argument,
 *  sets wrapper and adds inners.
 * <h3><i>joint</i> method</h3>
 *  If you have specific elements, in which connections are not controlled by wrapper, you can implement your own joint method.
 * <h3><i>zoom</i> method</h3>
 *  As Joint.dia library does not know how your specific element should behave after scaling, you can use zoom method to implement
 *  the desired behaviour.
 * @name Element
 * @memberOf Joint.dia
 * @constructor
 * @example
var mydia = Joint.dia.mydia = {};
var Element = Joint.dia.Element;

mydia.MyElement = Element.extend({
  // init method must be always presented
  init: function(properties){
    var p = this.properties;
    // parameters processing
    p.position = properties.position;
    p.radius = properties.radius || 30;
    // every element must have a wrapper
    this.setWrapper(this.paper.circle(p.position.x, p.position.y, p.radius));
    // optional inner elements
    this.addInner(this.paper.text(p.position.x, p.position.y, "my element"));
  }
});

// ...

var e = mydia.MyElement.create({
  position: {x: 50, y: 50},
  radius: 20
});
 */
var Element = dia.Element = function(){};

/**
 * Use this to instantiate particular elements.
 * @private
 */
Element.create = function(properties){
    var instance = new this(properties);
    if (instance.init) instance.init(properties);
    instance.defaults(instance.properties);
    instance.paper.safari();        // fix webkit bug
    return instance;
};

/**
 * @private
 */
Element.extend = function(prototype){
    var C = prototype.constructor = function(properties){
	this.construct(properties);
    };
    C.base = this;
    var proto = C.prototype = new this();
    Joint.Mixin(proto, prototype);
    Joint.Supplement(C, this);
    return C;
};

Element.prototype = {
    parentElement: null,
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
	    object: this.object,
	    parent: properties.parent
	};
	this.wrapper = null;
        this.shadow = null;
        this.shadowAttrs = {
            stroke: 'none', 
            fill: '#999', 
            translation: '7,7',
            opacity: 0.5
        };
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
    defaults: function(properties) {
        if (properties.shadow) {
            Joint.Mixin(this.shadowAttrs, properties.shadow);
            this.createShadow();
        }
    },
    /**
     * @methodOf Joint.dia.Element#
     * @return Element unique id.
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

    /**
     * Used in joint.js for unified access to the wrapper.
     * For all RaphaelObjects returns just this.
     * @private
     * @return {RaphaelObject} Return wrapper.
     */
    yourself: function(){
	return this.wrapper;
    },

    updateJoints: function(){
	var joints = this.wrapper.joints();
	if (joints){
	    for (var i = 0, l = joints.length; i < l; i++){
		joints[i].update();
	    }
	}
    },

    /**
     * Toggle ghosting of the element.
     * Dragging a diagram object causes moving of the wrapper and all inners, and update
     * of all correspondent connections. It can be sometimes expensive. If your elements
     * are complex and you want to prevent all this rendering and computations,
     * you can enable ghosting. It means that only a ghost of your wrapper will be dragged.
     * @methodOf Joint.dia.Element#
     * @return {Element}
     */
    toggleGhosting: function(){
	this._opt.ghosting = !this._opt.ghosting;
	return this;
    },

    /**
     * Create a ghost shape which is used when dragging.
     * (in the case _opt.ghosting is enabled)
     * @private
     */
    createGhost: function(){
        this.ghost = this.cloneWrapper(this.ghostAttrs);
    },

    /**
     * Create a shadow.
     * @private
     */
    createShadow: function(){
        this.shadowAttrs.rotation = this.wrapper.attrs.rotation;
        this.shadow = this.cloneWrapper(this.shadowAttrs);
        this.shadow.toBack();
    },

    /**
     * Creates the same object as the wrapper is.
     * Used for ghosting and shadows.
     * @private
     * @return {RaphaelObject} created clone
     */
    cloneWrapper: function(attrs) {
	var wa = this.wrapper.attrs,
	    paper = this.wrapper.paper,
            clone;

	switch (this.wrapper.type) {
	case "rect":
	    clone = paper.rect(wa.x, wa.y, wa.width, wa.height, wa.r);
	    break;
	case "circle":
	    clone = paper.circle(wa.cx, wa.cy, wa.r);
	    break;
	case "ellipse":
	    clone = paper.ellipse(wa.cx, wa.cy, wa.rx, wa.ry);
	    break;
	default:
	    break;
	}
	clone.attr(attrs);
        return clone;
    },

    /**
     * Get object position.
     * @private
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
     * Sends the wrapper and all inners to the front.
     * @methodOf Joint.dia.Element#
     * @return {Element}
     */
    toFront: function(){
        this.shadow && this.shadow.toFront();
	this.wrapper && this.wrapper.toFront();
	for (var i = 0, len = this.inner.length; i < len; i++)
	    this.inner[i].toFront();
	return this;
    },

    /**
     * Sends the wrapper and all inners to the back.
     * @methodOf Joint.dia.Element#
     * @return {Element}
     */
    toBack: function(){
	for (var i = this.inner.length - 1; i >= 0; --i)
	    this.inner[i].toBack();
	this.wrapper && this.wrapper.toBack();
        this.shadow && this.shadow.toBack();
	return this;
    },

    /**
     * dia.Element mousedown event.
     * @private
     */
    dragger: function(e){
	if (!this.wholeShape._opt.draggable) return;
	dia._currentDrag = this.wholeShape;
	if (dia._currentDrag._opt.ghosting){
	    dia._currentDrag.createGhost();
	    dia._currentDrag.ghost.toFront();
	} else
	    dia._currentDrag.toFront();

	dia._currentDrag.removeToolbox();
	// small hack to get the connections to front
	dia._currentDrag.translate(1,1);
	dia._currentDrag.translate(-1,-1);

	dia._currentDrag.dx = e.clientX;
	dia._currentDrag.dy = e.clientY;
	e.preventDefault && e.preventDefault();
    },

    /**
     * dia.Element zoom tool mousedown event.
     * @private
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
    /**
     * Move the element by offsets.
     * @methodOf Joint.dia.Element#
     * @param {Number} dx Offset in x-axis.
     * @param {Number} dy Offset in y-axis.
     */
    translate: function(dx, dy){
	// save translation
	this.properties.dx += dx;
	this.properties.dy += dy;
	// translate wrapper, all inner and toolbox
	this.wrapper.translate(dx, dy);
	this.shadow && this.shadow.translate(dx, dy);
	for (var i = this.inner.length - 1; i >= 0; --i){
	    this.inner[i].translate(dx, dy);
	}
	this.translateToolbox(dx, dy);
        this.paper.safari();
    },

    /**
     * Add wrapper.
     * @methodOf Joint.dia.Element#
     * @param {RaphaelObject} s Vector object specifying a wrapper.
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
     * Add a subelement.
     * @methodOf Joint.dia.Element#
     * @param {Element} s The subelement to be added.
     * @return {Element} this
     */
    addInner: function(s){
	this.inner.push(s);
	// @remove one of them?
	s.wholeShape = this;
	s.parentElement = this;
	if (s._isElement) s.properties.parent = this.euid();
	// if dragging enabled, register mouse down event handler
	if (!s._isElement && this._opt && this._opt.draggable){
	    s.mousedown(this.dragger);
	    s.node.style.cursor = "move";
	}
	s.toFront();	// always push new inner to the front
	return this;
    },

    /**
     * Remove a subelement.
     * @methodOf Joint.dia.Element#
     * @param {Element} s The subelement to be removed.
     * @return {Element} this
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
	    s.parentElement = null;
	    if (s._isElement) s.properties.parent = undefined;
	}
	return this;
    },

    /**
     * Show toolbox.
     * @private
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
	ty = bb.y - 22;	// toolbox y position

	this.toolbox = [];
	this.toolbox.push(this.paper.rect(tx, ty, 33, 22, 5).attr({fill: "white"}));
	// zoom in/out (mint icon: search.png)
	this.toolbox.push(this.paper.image("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAE5SURBVHjaYvz//z8DsQAggFhARGRkpBETE1M/kGkOxIz//v078+HDh4odO3acBPJ//4eaCBBADCA6Kirq4JlzJ978/vPrNwifOHX4fUhIyFmgvDQQs4HUgDBAALFAbTDX1zNiZmFmBfONDM14WFlZdYFMCSD+AsS/QOIAAcQEVcyIw5m8IJNhHIAAAisGufHMuZNfgE74A8Knzx7/LiLO91tfXx9kOgsjEIDUAQQQ2FqQZ3q7Jk6AWs2gqCbOkZDn8l9AiLuNi4vrxfHjx7cC1X8HCCCwYqiv/aBu5NXQ0FD9+/dfr4uf/te7N1/Mu337ttmbN2/uAwQQzIO/gfg11DNsN4BA/LD4n8f33swF8v8DFQoAaS6AAGLEFilQN3JCbQLhH0B8HyCAGHHFIFQDB1QTSNEXgAADAEQ2gYZ9CcycAAAAAElFTkSuQmCC", tx, ty, 11, 11));
	this.toolbox[this.toolbox.length-1].toFront();
	Joint.addEvent(this.toolbox[this.toolbox.length-1].node, "mousedown", function(e){
			   dia.Element.prototype.zoomer.apply(self, [e]);
		       });
	// embed (mint icon: page_spearmint_up.png)
	this.toolbox.push(this.paper.image("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEJSURBVHjaYvj//z8DFGOAnz9/rjl27Jg0AwMDExAzAAQQI0ghFPz/8usZjM3ACJTnYBEC0iyfmZmZZYBCXwECiAkm+evXL4bff34w/P33C4z//PvB8O33awYmJiZeoDQ/ELMBBBALSKGJiQkPOzs7AxsbC8OaTXMZWFhZoEb8g5nFDsTMAAHEBFIIZLwCuo/hy5dvDCF+yQx/fv+BuAvhRDAACCCQM0AO5YRJfv78lSE+Ko/h79+/DP8RJoMBQACheHDv4wYGdOAs28DAyMioCmS+AAggJgYSAEAAoZiMUxHUZIAAYkES4AJSQjD3o4HvQPwXIIDgJgMVM4PCEhREWBT/BUUFQIABAMuFbgea+o0EAAAAAElFTkSuQmCC", tx + 22, ty, 11, 11));
	this.toolbox[this.toolbox.length-1].toFront();
	this.toolbox[this.toolbox.length-1].node.onclick = function(){ self.embed(); };
	// unembed (mint icon: page_spearmint_down.png)
	this.toolbox.push(this.paper.image("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEJSURBVHjaYvj//z8DFGOAnz9/rjl27Jg0AwMDExAzAAQQI0ghFPz/8usZjM3ACJTnYBEC0iyfmZmZZYBCXwECiIkBCfz99wuO//z7wfDt92sGJiYmXqAUPxCzAQQQi4mJyX0gQwFZExcXJ8OaTXMYODmZYULsQMwMEEAgk9WB+D0jIyNElJ2NYdXG2QzsHOwMSE4EA4AAYjpz5swvIC3By8sLVrh2yzygiRwQTzD8Q1EMEEBwD/779+//7gcNDCysKN5gcJZtYADaqgpkvgAIILgM0CMYCtEBQAChBB1ORVCTAQKIBUmAC0gJATEnFvXfQSELEEBwk4GKQeHEBgoiLIr/AvEvgAADAH4mYO9cg5S2AAAAAElFTkSuQmCC", tx + 11, ty, 11, 11));
	this.toolbox[this.toolbox.length-1].toFront();
	this.toolbox[this.toolbox.length-1].node.onclick = function(){ self.unembed(); };
	// delete (icon: stop.png)
//	this.toolbox.push(this.paper.image("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9oFEBQbDFwnwRsAAAE8SURBVBjTVZG9agJREEbP1TWL266wja2tWggipEhpIxh9gIUgiIW1vZWvkHJJHVLYig+ghWARbGzEYgMKrojr/t4UNwoZmGY4882BEfyVHA5HmOaEXA6khCSB83nK4fAmHOcAoAFI2+7RaIwxTQhDiGO1cLu1WK3egS6AkIPBiFptjGU9kc3Cfg++D4WCSg8CyWLxRRD0MxjGBMNQYLMJlQoUi9BuQ6kEx6PAMDrAs4aUcL3C5QLLJVSrUC6D68J8Duez0gIySKk8fV8ppCnoOux24HkQRUoH0EhTNTBNpeG6CqzX4XSC2eyRrBEEUzyvha7Deq1Oe54CXVcFxfE3sBXStgsYxjuW9UqaCsJQAfcOwx/i+EU4zkY8ntLrfZLPdwB1NklUYpJ0heNsHk8BIIr6RNEH/2t7BwF+AeKFndSgPkjIAAAAAElFTkSuQmCC", tx + 11, ty + 11, 11, 11));
        this.toolbox.push(this.paper.path("M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248").attr({fill: "#000", stroke: "none"}).translate(tx, ty).scale(0.5));
	this.toolbox[this.toolbox.length-1].toFront();
	this.toolbox[this.toolbox.length-1].node.onclick = function(){ self.remove(); };
	// clone (mint icon: sound_grey.png)
	this.toolbox.push(this.paper.image("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEjSURBVHjaYvz//z8DsQAggJjwSaanpwsBMReMDxBATAQMO/zv379eRkZGdiBmAgggJiymqaWlpS0GSrIAFZ4A0h5AYR4gZgEIICaoAg6ggolACea/f/9aAulAoDD3169fNwPZ0kA2B0gxQADBTBYECuYCaa7bt2/vACkEYs4zZ84cA9KsQAwKBUaAAGIBqfzz5w8jExPTRiCTXUFBwQ9IfwP5x8TExAJI/4IpBgggsOJ58+Y9B1JRQMwGdOdjoFP2ghRwcnL6A4P2KUghiA8QQGDFQIH/QGf8BDJ/L1myZC8fHx/IeiZmZmbr379/H4ApBgggFlgoANX/A1L/gJoYP336BHIG47Nnz1zu3r0LUvgD5FqAAGLEF4Og0EHy4G+AAAMAho1gqqugDLgAAAAASUVORK5CYII=", tx, ty + 11, 11, 11));
	this.toolbox[this.toolbox.length-1].toFront();
	this.toolbox[this.toolbox.length-1].node.onmousedown = function(){ dia._currentDrag = self.clone()[0]; console.log(dia._currentDrag[0])};
	// toolbox wrapper
	return this;
    },

    /**
     * Hide (remove) toolbox.
     * @todo Will be public after it is properly tested.
     * @private
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
     * @todo Will be public after it is properly tested.
     * @private
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
     * @private
     */
    translateToolbox: function(dx, dy){
	if (this.toolbox)
	    for (var i = this.toolbox.length - 1; i >= 0; --i)
		this.toolbox[i].translate(dx, dy);
    },

    /**
     * Disconnects element from all joints. Empties the element joints array.
     * Note that it preserves registration of the element in its joints.
     * @methodOf Joint.dia.Element#
     */
    disconnect: function(){
	var joints = this.joints(), idx = joints.length, j;
	while (idx--){
	    j = joints[idx];

	    if (j.endObject().wholeShape === this){
		j.freeJoint(j.endObject());
		j.draw(["dummyEnd"]);
		j.update();
	    }
	    if (j.startObject().wholeShape === this){
		j.freeJoint(j.startObject());
		j.draw(["dummyStart"]);
		j.update();
	    }
	}
    },

    /**
     * Unregister the element from its joints registeredObjects.
     * After the call, the element is not registered in any of its joints.
     * @private
     */
    unregisterFromJoints: function(){
	var joints = this.joints(), idx = joints.length;
	while (idx--) joints[idx].unregister(this);
	return this;
    },

    /**
     * Remove element.
     * @methodOf Joint.dia.Element#
     * @return {null}
     */
    remove: function(){
	var inners = this.inner, idx = inners.length;
	this.unregisterFromJoints();
	this.disconnect();
	this.removeToolbox();
	this.unembed();
	while (idx--) inners[idx].remove();
	this.wrapper.remove();
        this.shadow && this.shadow.remove();
	dia.unregister(this);
        this.removed = true;
        return null;
    },

    /**
     * Remove element and all joints pointing from and to this element.
     * @methodOf Joint.dia.Element#
     * @return {null}
     */
    liquidate: function(){
	var joints = this.joints(), idx = joints.length, j, inners = this.inner;
	// remove joints
	while (idx--){
	    j = joints[idx];
	    j.freeJoint(j.startObject());
	    j.freeJoint(j.endObject());
	    j.clean(["connection", "startCap", "endCap", "handleStart", "handleEnd", "label"]);
	    dia.unregisterJoint(j);
	    j.unregister(this);
	}
	this.removeToolbox();
	this.unembed();
	// liquidate subelements
	idx = inners.length;
	while (idx--){
	    if (inners[idx].liquidate) inners[idx].liquidate();
	    else inners[idx].remove();
	}
	this.wrapper.remove();
        this.shadow && this.shadow.remove();
	dia.unregister(this);
        this.removed = true;
        return null;
    },

    /**
     * Enable/disable dragging of the element.
     * @methodOf Joint.dia.Element#
     * @param {boolean} enable True/false.
     * @return {Element} Return this.
     */
    draggable: function(enable){
	this._opt.draggable = enable;
        this.wrapper.node.style.cursor = enable ? "move" : null;
        var idx = this.inner.length;
        while (idx--) this.inner[idx].node.style.cursor = enable ? "move" : null;
	return this;
    },

    /**
     * Highlights the element.
     * Override in inherited objects or @todo set in options.
     * @methodOf Joint.dia.Element#
     * @return {Element} Return this.
     */
    highlight: function(){
	this.wrapper.attr("stroke", "red");
	return this;
    },

    /**
     * Unhighlights the element.
     * @methodOf Joint.dia.Element#
     * @return {Element} Return this.
     */
    unhighlight: function(){
	this.wrapper.attr("stroke", this.properties.attrs.stroke || "#000");
	return this;
    },

    /**
     * Embed me into the first registered dia.Element whos bounding box
     * contains my bounding box origin. Both elements will behave as a whole.
     * @todo It is probably out of date. Retest!!!
     * @methodOf Joint.dia.Element#
     * @return {Element}
     */
    embed: function(){
	var
	ros = dia._registeredObjects[this.paper.euid()],
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

	    if (shape == this.parentElement){
		shape.delInner(this);

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
     * Decouple embedded element from its parent.
     * @methodOf Joint.dia.Element#
     * @return {Element}
     */
    unembed: function(){
	if (this.parentElement){
	    this.parentElement.delInner(this);
	    this.parentElement = null;
	    this.properties.parent = undefined;
	}
	return this;
    },

    /**
     * Scale element.
     * @methodOf Joint.dia.Element#
     * @param {Number} sx Scale in x-axis.
     * @param {Number} &optional sy Scale in y-axis.
     * @example e.scale(1.5);
     */
    scale: function(sx, sy){
	// save translation
	this.properties.sx = sx;
	this.properties.sy = sy;

	this.shadow && this.shadow.scale.apply(this.shadow, arguments);
	this.wrapper.scale.apply(this.wrapper, arguments);
	this.zoom.apply(this, arguments);
	// apply scale to all subshapes that are Elements (were embeded)
	for (var i = 0, len = this.inner.length; i < len; i++){
	    var inner = this.inner[i];
	    if (inner._isElement){
		inner.scale.apply(inner, arguments);
	    }
	}
	if (this._doNotRedrawToolbox) return;
	this.removeToolbox();
	this.addToolbox();
    },
    /**
     * This method should be overriden by inherited elements to implement
     * the desired scaling behaviour.
     * @methodOf Joint.dia.Element#
     * @param {Number} sx Scale in x-axis.
     * @param {Number} &optional sy Scale in y-axis.
     */
    zoom: function(sx, sy){
	// does nothing, overriden by specific elements
    },

    /**
     * @methodOf Joint.dia.Element#
     * @return {Object} Bounding box of the element.
     */
    getBBox: function(){
	return this.wrapper.getBBox();
    },

    /**
     * @see Joint
     * @methodOf Joint.dia.Element#
     */
    joint: function(to, opt){
	var toobj = (to._isElement) ? to.wrapper : to,
	    j = this.wrapper.joint.apply(this.wrapper, [toobj, opt]);
	Joint.dia.registerJoint(j);
	return j;
    },

    /**
     * Delegate attr message to my wrapper.
     * @private
     */
    attr: function(){
	return Raphael.el.attr.apply(this.wrapper, arguments);
    }
};


/**
 * Document mousemove event.
 * @private
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
	dia._currentZoom.paper.safari();

	// save for later usage
	dia._currentZoom.dx = e.clientX;
	dia._currentZoom.dy = e.clientY;
	dia._currentZoom.lastScaleX = sx;
	dia._currentZoom.lastScaleY = sy;
    }
};

/**
 * Document mouseup event.
 * @private
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
	dia._currentDrag.translate(-1,-1);
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