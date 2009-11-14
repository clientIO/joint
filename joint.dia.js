/****************************************************
 * Joint.dia 0.0.2 - Joint plugin for creating composite shapes.
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

/**
 * Current dragged object.
 */ 
Shape.currentDrag = false;

/**
 * Current zoomed object.
 */ 
Shape.currentZoom = false;

/**
 * Table with all registered objects.
 *  - registered objects can embed and can be embedded
 *  - the table is of the form: {RaphaelPaper1: [shape1, shape2, ...]}
 */
Shape.registeredObjects = {};

/**
 * Top prototype for composite objects.
 */
function Shape(raphael, opt){
    this.wrapper = null;
    this.parentShape = null;
    this.subShapes = [];
    this.toolbox = null;

    this._raphael = raphael;
    
    // register me in the global table
    if (Shape.registeredObjects[raphael])
	Shape.registeredObjects[raphael].push(this);
    else
	Shape.registeredObjects[raphael] = [this];

    this._opt = {
	draggable: true,	// enable dragging?
	ghosting: true,		// enable ghosting?
	toolbox: false		// enable toolbox?
    };
    for (var key in opt)
	this._opt[key] = opt[key];

    this._isShape = true;	// type of instance

    // auxiliaries for scaling and translating
    this.lastScaleX = 1.0;
    this.lastScaleY = 1.0;
    this.dx = undefined;
    this.dy = undefined;

    // original bounding box (before scaling a translating)
    // set in addMain()
    this.origBBox = undefined;

    // ghost attributes
    this.ghostAttrs = {
	opacity: 0.5, 
	"stroke-dasharray": "-",
	stroke: "black"
    };

    // this is needed in joint library when
    // manipulation with a raphael object joints array
    // - just delegate joints array methods to the wrapper
    var self = this;
    this.joints = {
	indexOf: function(){
	    return self.wrapper.joints.indexOf.apply(self.wrapper.joints, arguments);
	},
	push: function(){
	    return self.wrapper.joints.push.apply(self.wrapper.joints, arguments);
	},
	update: function(){
	    if (self.wrapper.joints)
		for (var i = 0, l = self.wrapper.joints.length; i < l; i++){
		    self.wrapper.joints[i].engine.redraw();
		    self.wrapper.joints[i].engine.listenAll();
		}
	}
    };
};

Shape.prototype.toggleGhosting = function(){
    this._opt.ghosting = !this._opt.ghosting;
};

/**
 * Create a ghost shape which is used when dragging.
 * (in the case _opt.ghosting is enabled)
 */
Shape.prototype.createGhost = function(){
    var wa = this.wrapper.attrs;
    switch (this.wrapper.type){
    case "rect":
	this.ghost = this.wrapper.paper.rect(wa.x, wa.y, wa.width, wa.height, wa.r);
	break;
    case "circle":
	this.ghost = this.wrapper.paper.circle(wa.cx, wa.cy, wa.r);
	break;
    case "ellipse":
	this.ghost = this.wrapper.paper.ellipse(wa.cx, wa.cy, wa.rx, wa.ry);
	break;
    default:
	break;
    }
//    this.ghost.scale(this.lastScaleX, this.lastScaleY);
    this.ghost.attr(this.ghostAttrs);
};

/**
 * Get object position.
 * @return point
 */
Shape.prototype.objPos = function(objname){
    switch (this[objname].type){
    case "rect":
	return point(this[objname].attr("x"), this[objname].attr("y"));
    case "circle":
    case "ellipse":
	return point(this[objname].attr("cx"), this[objname].attr("cy"));
    default:
	break;
    }
};

/**
 * Shorthands.
 */
Shape.prototype.wrapperPos = function(){ return this.objPos("wrapper") };
Shape.prototype.ghostPos = function(){ return this.objPos("ghost") };

/**
 * Recursively call toFront() on subshapes.
 */
Shape.prototype.toFront = function(){
    this.wrapper && this.wrapper.toFront();
    for (var i = 0, len = this.subShapes.length; i < len; i++)
	this.subShapes[i].toFront();
};

/**
 * Recursively call toBack() on subshapes (in reverse order than toFront()).
 */
Shape.prototype.toBack = function(){
    for (var i = this.subShapes.length - 1; i <= 0; --i)
	this.subShapes[i].toBack();
    this.wrapper && this.wrapper.toBack();
};

/**
 * Shape mousedown event.
 */
Shape.prototype.dragger = function(e){
    Shape.currentDrag = this.wholeShape;
    if (Shape.currentDrag._opt.ghosting){
	Shape.currentDrag.createGhost();
	Shape.currentDrag.ghost.toFront();
    } else
	Shape.currentDrag.toFront();

    Shape.currentDrag.removeToolbox();
    // small hack to get the connections to front
    Shape.currentDrag.translate(1,1);

    Shape.currentDrag.dx = e.clientX;
    Shape.currentDrag.dy = e.clientY;    
    e.preventDefault && e.preventDefault();
};

/**
 * Shape zoom tool mousedown event.
 */
Shape.prototype.zoomer = function(e){
    Shape.currentZoom = this;
    Shape.currentZoom.toFront();
    Shape.currentZoom.removeToolbox();

    var bb = rect(Shape.currentZoom.origBBox);
    Shape.currentZoom.dx = e.clientX;
    Shape.currentZoom.dy = e.clientY;
    Shape.currentZoom.dWidth = bb.width * Shape.currentZoom.lastScaleX;
    Shape.currentZoom.dHeight = bb.height * Shape.currentZoom.lastScaleY;

    e.preventDefault && e.preventDefault();
};

/**
 * Document mousemove event.
 */
Shape.mouseMove = function(e){
    e = e || window.event;
    // object dragging
    if (Shape.currentDrag){
	if (Shape.currentDrag._opt.ghosting)	// if ghosting, move ghost
	    Shape.currentDrag.ghost.translate(e.clientX - Shape.currentDrag.dx, e.clientY - Shape.currentDrag.dy);
	else	// otherwise, move the whole shape
	    Shape.currentDrag.translate(e.clientX - Shape.currentDrag.dx, e.clientY - Shape.currentDrag.dy);

	r.safari();
	Shape.currentDrag.dx = e.clientX;
	Shape.currentDrag.dy = e.clientY;
    }

    // object zooming
    if (Shape.currentZoom){
	var 
	dx = e.clientX - Shape.currentZoom.dx,
	dy = e.clientY - Shape.currentZoom.dy;
	
	Shape.currentZoom.dWidth -= dx;
	Shape.currentZoom.dHeight -= dy;
	// correction
	if (Shape.currentZoom.dWidth < 1) Shape.currentZoom.dWidth = 1;
	if (Shape.currentZoom.dHeight < 1) Shape.currentZoom.dHeight = 1;

	// scaling parameters
	var 
	sx = Shape.currentZoom.dWidth / Shape.currentZoom.origBBox.width,
	sy = Shape.currentZoom.dHeight / Shape.currentZoom.origBBox.height;

	// do not redraw toolbox because it is not there
	Shape.currentZoom._doNotRedrawToolbox = true;
	Shape.currentZoom.scale(sx, sy);	// scale
	r.safari();

	// save for later usage
	Shape.currentZoom.dx = e.clientX;
	Shape.currentZoom.dy = e.clientY;
	Shape.currentZoom.lastScaleX = sx;
	Shape.currentZoom.lastScaleY = sy;
    }
};

/**
 * Document mouseup event.
 */
Shape.mouseUp = function(e){
    // if ghosting is enabled, translate whole shape to the position of
    // the ghost, then remove ghost and update joints
    if (Shape.currentDrag && Shape.currentDrag._opt.ghosting){
	var 
	gPos = Shape.currentDrag.ghostPos();
	wPos = Shape.currentDrag.wrapperPos();

	Shape.currentDrag.translate(gPos.x - wPos.x, gPos.y - wPos.y);
	Shape.currentDrag.ghost.remove();
	Shape.currentDrag.joints.update();
    }
    // add toolbar again when dragging is stopped
    if (Shape.currentDrag){
	Shape.currentDrag.addToolbox();
	Shape.currentDrag.toFront();
	// small hack: change slightely the position to get the connections to front
	Shape.currentDrag.translate(1,1);
    }

    // if ghosting is enabled, scale whole shape as
    // the ghost is, then remove ghost and update joints
    if (Shape.currentZoom && Shape.currentZoom._opt.ghosting){
	// current ghost scale
//	Shape.currentZoom.scale(Shape.currentZoom.lastScaleX, Shape.currentZoom.lastScaleY);
//	Shape.currentZoom.ghost.remove();
//	Shape.currentZoom.joints.update();
    }
    // add toolbar again when zooming is stopped
    if (Shape.currentZoom){
	// remove toolbox, because scale above may create one, 
	// so there would be two toolboxes after addToolbox() below
	Shape.currentZoom.removeToolbox();
	Shape.currentZoom.addToolbox();
	Shape.currentZoom.toFront();
    }

    Shape.currentDrag = false;
    Shape.currentZoom = false;
};

addEvent(document, "mousemove", Shape.mouseMove);
addEvent(document, "mouseup", Shape.mouseUp);

Shape.prototype.translate = function(dx, dy){
    // translate wrapper, all subshapes and toolbox
    this.wrapper.translate(dx, dy);
    for (var i = this.subShapes.length - 1; i >= 0; --i){
	this.subShapes[i].translate(dx, dy);
    }
    this.translateToolbox(dx, dy);
};

/**
 * Add subshape.
 */
Shape.prototype.add = function(s){
    this.subShapes.push(s);
    s.parentShape = this;
    s.toFront();	// always push new subshapes to the front
};

/**
 * Remove subshape.
 */
Shape.prototype.del = function(s){
    var 
    i = 0,
    len = this.subShapes.length;
    for (; i < len; i++)
	if (this.subShapes[i] == s)
	    break;
    if (i < len){
	this.subShapes.splice(i, 1);
	s.parentShape = null;
    }
};

/**
 * Add wrapper.
 */
Shape.prototype.addMain = function(s){
    this.wrapper = s;				// set wrapper
    this.wrapper.wholeShape = this;		// set wrapper's reference to me
    this.type = this.wrapper.type;		// set my type
    this.origBBox = this.wrapper.getBBox();	// save original bounding box
    // if dragging enabled, register mouse down event handler
    if (this._opt && this._opt.draggable){
	this.wrapper.mousedown(this.dragger);
	this.wrapper.node.style.cursor = "move";
    }
    // add toolbox if enabled
    this.addToolbox();
};

/**
 * Show toolbox.
 */
Shape.prototype.addToolbox = function(){
    // do not show toolbox if it is not enabled
    if (!this._opt.toolbox) return;

    var 
    self = this,
    bb = this.wrapper.getBBox(),	// wrapper bounding box
    tx = bb.x - 10,	// toolbox x position
    ty = bb.y - 10;	// toolbox y position

    this.toolbox = [];
    this.toolbox.push(this._raphael.rect(tx, ty, 33, 11, 5).attr({fill: "white"}));
    // zoom in/out
    this.toolbox.push(this._raphael.image("../mint_icons/icons/search.png", tx, ty, 11, 11));
    this.toolbox[this.toolbox.length-1].toFront();
    addEvent(this.toolbox[this.toolbox.length-1].node, "mousedown", function(e){
	Shape.prototype.zoomer.apply(self, [e]);
    });
    // embed
    this.toolbox.push(this._raphael.image("../mint_icons/icons/page_spearmint_up.png", tx + 22, ty, 11, 11));
    this.toolbox[this.toolbox.length-1].toFront();
    this.toolbox[this.toolbox.length-1].node.onclick = function(){ self.embed() };
    // unembed
    this.toolbox.push(this._raphael.image("../mint_icons/icons/page_spearmint_down.png", tx + 11, ty, 11, 11));
    this.toolbox[this.toolbox.length-1].toFront();
    this.toolbox[this.toolbox.length-1].node.onclick = function(){ self.unembed() };
    // toolbox wrapper

};

/**
 * Hide (remove) toolbox.
 */
Shape.prototype.removeToolbox = function(){
    if (this.toolbox)
	for (var i = this.toolbox.length - 1; i >= 0; --i)
	    this.toolbox[i].remove();
    this.toolbox = null;
};

/**
 * Show/hide toolbox.
 */
Shape.prototype.toggleToolbox = function(){
    this._opt.toolbox = !this._opt.toolbox;
    if (this._opt.toolbox)
	this.addToolbox();
    else
	this.removeToolbox();
};

/**
 * Move toolbox by offset (dx, dy).
 */
Shape.prototype.translateToolbox = function(dx, dy){
    if (this.toolbox)
	for (var i = this.toolbox.length - 1; i >= 0; --i)
	    this.toolbox[i].translate(dx, dy);
};

/**
 * Embed me into the first registered Shape whos bounding box 
 * contains my bounding box origin.
 */
Shape.prototype.embed = function(){
    var 
    ros = Shape.registeredObjects[this._raphael],
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
    embedTo && embedTo.add(this);
};

/**
 * Free me. After this method call, I am no longer a subshape
 * of any other Shape.
 */
Shape.prototype.unembed = function(){
    if (this.parentShape){
	this.parentShape.del(this);
	this.parentShape = null;
    }
};

/**
 * Scale.
 * Derived objects have to implement their own scale method!
 * Must be called at the end of each derived object's scale method!
 */
Shape.prototype.scale = function(){
    if (this._doNotRedrawToolbox) return;
    this.removeToolbox();
    this.addToolbox();
};

/**
 * Delegate getBBox message to my wrapper.
 */
Shape.prototype.getBBox = function(){
    return this.wrapper.getBBox();
};

/**
 * Delegate joint message to my wrapper.
 */
Shape.prototype.joint = function(to, opt){
    var toobj = (to._isShape) ? to.wrapper : to;
    return this.wrapper.joint.apply(this.wrapper, [toobj, opt]);
};

/**
 * Delegate attr message to my wrapper.
 */
Shape.prototype.attr = function(){
    return Raphael.el.attr.apply(this.wrapper, arguments);
};

/**************************************************
 * UML StateChart
 **************************************************/

/**
 * UML StateChart state.
 * @param raphael raphael paper
 * @param r rectangle
 * @param name string state name
 * @param attrs shape SVG attributes
 * @param actions object entry/exit/inner actions
 */
function UMLState(raphael, r, name, attrs, actions){
    //    Shape.apply(this, arguments[5]);
    Shape.apply(this, [raphael]);
    this.opt = {
	rect: r,
	radius: 15,
	attrs: attrs,
	name: {
	    string: name,
	    dx: 20,	// x distance from oval bbox x
	    dy: 5	// y distance from oval bbox y
	},
	swimlane: {
	    dy: 18	// swimlane distance from the top
	},
	actions: {
	    dx: 5,
	    dy: 5,
	    entry: null,
	    exit: null,
	    inner: []	// array, e.g. ["mouseMove", "step()", "mouseDown", "start()", ...]
	}
    };
    if (actions){
	if (actions.entry)
	    this.opt.actions.entry = actions.entry;
	if (actions.exit)
	    this.opt.actions.exit = actions.exit;
	if (actions.inner)
	    this.opt.actions.inner = actions.inner;
    }
    
    this.addMain(this._raphael.rect(this.opt.rect.x, this.opt.rect.y, 
				    this.opt.rect.width, this.opt.rect.height, 
				    this.opt.radius).attr(this.opt.attrs));
    this.add(this.drawName());
    this.add(this.drawSwimlane());
    this.add(this.drawActions());
};
UMLState.prototype = new Shape;

UMLState.prototype.drawSwimlane = function(){
    var bb = this.wrapper.getBBox();
    return this._raphael.path(["M", bb.x, bb.y + this.opt.name.dy + this.opt.swimlane.dy, "L", bb.x + bb.width, bb.y + this.opt.name.dy + this.opt.swimlane.dy].join(" "));
};

/**
 * Draw entry/exit actions, inner transitions as text
 */ 
UMLState.prototype.drawActions = function(){
    // collect all actions
    var str = " ";
    if (this.opt.actions.entry)
	str += "entry/ " + this.opt.actions.entry + "\n";
    if (this.opt.actions.exit)
	str += "exit/ " + this.opt.actions.exit + "\n";
    if (this.opt.actions.inner.length > 0){
	for (var i = 0, len = this.opt.actions.inner.length; i < len; i += 2)
	    str += this.opt.actions.inner[i] + "/ " + this.opt.actions.inner[i+1] + "\n";
    }
    // trim
    str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

    // draw text with actions
    var 
    bb = this.wrapper.getBBox(),
    t = this._raphael.text(bb.x + this.opt.actions.dx, bb.y + this.opt.name.dy + this.opt.swimlane.dy + this.opt.actions.dy, str),
    tbb = t.getBBox();
    
    t.attr("text-anchor", "start");
    t.translate(0, tbb.height/2);	// tune the y position
    return t;
};

// draw state name
UMLState.prototype.drawName = function(){
    var 
    bb = this.wrapper.getBBox(),
    t = this._raphael.text(bb.x, bb.y, this.opt.name.string),
    tbb = t.getBBox();
    t.translate(bb.x - tbb.x + this.opt.name.dx, 
		bb.y - tbb.y + this.opt.name.dy);
    return t;
};

UMLState.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    // set wrapper's radius back to its initial value (it deformates after scaling)
    this.wrapper.attr("r", this.opt.radius);
    this.subShapes[0].remove();	// name
    this.subShapes[1].remove();	// swimlane
    this.subShapes[2].remove();	// actions
    this.subShapes[0] = this.drawName();
    this.subShapes[1] = this.drawSwimlane();
    this.subShapes[2] = this.drawActions();
    for (var i = 3, len = this.subShapes.length; i < len; i++)
	this.subShapes[i].scale.apply(this.subShapes[i], arguments);
    Shape.prototype.scale.apply(this);
};

/**
 * UML StateChart start state.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 */
function UMLStartState(raphael, p, r, attrs){
    //    Shape.apply(this, arguments[4]);
    Shape.apply(this, [raphael]);

    this.opt = {
	point: p,
	radius: r,
	attrs: attrs
    }; 
    this._raphael = raphael;
    this.addMain(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				      this.opt.radius).attr(this.opt.attrs).attr("fill", "black"));
};
UMLStartState.prototype = new Shape;

UMLStartState.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    Shape.prototype.scale.apply(this);
};

/**
 * UML StateChart end state.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 */
function UMLEndState(raphael, p, r, attrs){
    //    Shape.apply(this, arguments[4]);
    Shape.apply(this, [raphael]);

    this.opt = {
	point: p,
	radius: r,
	subRadius: r/2,
	attrs: attrs
    }; 
    this.addMain(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				      this.opt.radius).attr(this.opt.attrs).attr("fill", "white"));
    this.add(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				  this.opt.subRadius).attr(this.opt.attrs).attr("fill", "black"));
};
UMLEndState.prototype = new Shape;

UMLEndState.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    this.subShapes[0].scale.apply(this.subShapes[0], arguments);
    Shape.prototype.scale.apply(this);
};


/**************************************************
 * FSA
 **************************************************/

/**
 * Finite state machine state.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 * @param text string state name
 */
function FSAState(raphael, p, r, attrs, text){
    //    Shape.apply(this, arguments[5]);
    Shape.apply(this, [raphael]);
    this.opt = {
	point: p,
	radius: r,
	attrs: attrs,
	text: {
	    string: text,
	    dx: r/2,	// x distance from oval bbox x
	    dy: r/2 + 8	// y distance from oval bbox y
	}
    }; 
    this.addMain(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				      this.opt.radius).attr(this.opt.attrs));
    this.add(this.drawText());
};
FSAState.prototype = new Shape;

FSAState.prototype.drawText = function(){
    var 
    bb = this.wrapper.getBBox(),
    t = this._raphael.text(bb.x, bb.y, this.opt.text.string),
    tbb = t.getBBox();
    t.translate(bb.x - tbb.x + this.opt.text.dx, 
		bb.y - tbb.y + this.opt.text.dy);
    return t;
};

FSAState.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    this.subShapes[0].remove();	// text
    this.subShapes[0] = this.drawText();
    Shape.prototype.scale.apply(this);
};

/**
 * Finite State Machine start state.
 * @see UMLStartState
 */
var FSAStartState = UMLStartState;
/**
 * Finite State Machine end state.
 * @see UMLEndState
 */
var FSAEndState = UMLEndState;

/**************************************************
 * PN
 **************************************************/


/**
 * Petri net place.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param rToken radius of my tokens
 * @param nTokens number of tokens
 * @param attrs shape SVG attributes
 */
function PNPlace(raphael, p, r, rToken, nTokens, label, attrs){
    //    Shape.apply(this, arguments[5]);
    Shape.apply(this, [raphael]);
    this.opt = {
	point: p,
	radius: r,
	radiusToken: rToken,
	nTokens: nTokens,
	label: label,
	attrs: attrs
    };

    this.addMain(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				      this.opt.radius).attr(this.opt.attrs).attr("fill", "white"));
    switch (this.opt.nTokens){
    case 0:
	break;
    case 1:
	this.add(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				      this.opt.radiusToken).attr(this.opt.attrs).attr("fill", "black"));
	break;
    case 2:
	this.add(this._raphael.circle(this.opt.point.x - this.opt.radiusToken*2, this.opt.point.y, 
				      this.opt.radiusToken).attr(this.opt.attrs).attr("fill", "black"));
	this.add(this._raphael.circle(this.opt.point.x + this.opt.radiusToken*2, this.opt.point.y, 
				      this.opt.radiusToken).attr(this.opt.attrs).attr("fill", "black"));
	break;
    case 3:
	this.add(this._raphael.circle(this.opt.point.x - this.opt.radiusToken*2, this.opt.point.y + this.opt.radiusToken, 
				      this.opt.radiusToken).attr(this.opt.attrs).attr("fill", "black"));
	this.add(this._raphael.circle(this.opt.point.x + this.opt.radiusToken*2, this.opt.point.y + this.opt.radiusToken, 
				      this.opt.radiusToken).attr(this.opt.attrs).attr("fill", "black"));
	this.add(this._raphael.circle(this.opt.point.x, this.opt.point.y - this.opt.radiusToken*2, 
				      this.opt.radiusToken).attr(this.opt.attrs).attr("fill", "black"));
	break;
    default:
	this.add(this._raphael.text(this.opt.point.x, this.opt.point.y, this.opt.nTokens.toString()));
	break;
    }
    // label
    if (this.opt.label){
	this.add(this._raphael.text(this.opt.point.x, this.opt.point.y - this.opt.radius, this.opt.label));
	this.subShapes[this.subShapes.length-1].translate(0, -this.subShapes[this.subShapes.length-1].getBBox().height);
    }
};
PNPlace.prototype = new Shape;

PNPlace.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    for (var i = 0, len = this.subShapes.length; i < len; i++)
	this.subShapes[i].scale.apply(this.subShapes[i], arguments);
    if (this.opt.label){
	this.subShapes[this.subShapes.length-1].remove();	// text
	var bb = this.wrapper.getBBox();
	this.subShapes[this.subShapes.length-1] = this._raphael.text(bb.x, bb.y, this.opt.label);
	this.subShapes[this.subShapes.length-1].translate(0, -this.subShapes[this.subShapes.length-1].getBBox().height);
    }
    Shape.prototype.scale.apply(this);
};

/**
 * Petri net event.
 * @param raphael raphael paper
 * @param r rectangle
 * @param attrs shape SVG attributes
 */
function PNEvent(raphael, r, label, attrs){
    Shape.apply(this, [raphael]);
    this.opt = {
	rect: r,
	attrs: attrs,
	label: label
    };

    this.addMain(this._raphael.rect(this.opt.rect.x, this.opt.rect.y, 
				    this.opt.rect.width, this.opt.rect.height));
    // label
    if (this.opt.label){
	this.add(this._raphael.text(this.opt.rect.x, this.opt.rect.y, this.opt.label));
	this.subShapes[0].translate(0, -this.subShapes[0].getBBox().height);
    }
    // default
    this.wrapper.attr({fill: "black", stroke: "black"});
    // custom
    this.wrapper.attr(this.opt.attrs);
};
PNEvent.prototype = new Shape;

PNEvent.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    if (this.opt.label){
	this.subShapes[0].remove();	// text
	var bb = this.wrapper.getBBox();
	this.subShapes[0] = this._raphael.text(bb.x, bb.y, this.opt.label);
	this.subShapes[0].translate(0, -this.subShapes[0].getBBox().height);
    }
    Shape.prototype.scale.apply(this);
};

/**************************************************
 * UML Class Diagram
 **************************************************/

function UMLClass(raphael, r, name, attrs, attributes, methods){
    Shape.apply(this, [raphael]);
    this.opt = {
	rect: r,
	attrs: attrs,
	name: {
	    string: name,
	    dx: 20,
	    dy: 5
	},
	swimlane1: {
	    dy: 18
	},
	swimlane2: {
	    dy: 18
	},
	attributes: {
	    names: attributes,
	    dx: 5,
	    dy: 5
	},
	methods: { 
	    names: methods,
	    dx: 5,
	    dy: 5
	}
    };

    this.addMain(this._raphael.rect(this.opt.rect.x, this.opt.rect.y, 
				    this.opt.rect.width, this.opt.rect.height).attr(this.opt.attrs));
    this.add(this.drawName());
    this.add(this.drawSwimlane1());
    this.add(this.drawAttributes());
    this.add(this.drawSwimlane2());
    this.add(this.drawMethods());
};
UMLClass.prototype = new Shape;


UMLClass.prototype.drawName = function(){
    var 
    bb = this.wrapper.getBBox(),
    t = this._raphael.text(bb.x, bb.y, this.opt.name.string),
    tbb = t.getBBox();
    t.translate(bb.x - tbb.x + this.opt.name.dx, 
		bb.y - tbb.y + this.opt.name.dy);
    return t;
};

UMLClass.prototype.drawSwimlane1 = function(){
    var bb = this.wrapper.getBBox();
    return this._raphael.path(["M", bb.x, bb.y + this.opt.name.dy + this.opt.swimlane1.dy, "L", bb.x + bb.width, bb.y + this.opt.name.dy + this.opt.swimlane1.dy].join(" "));
};

UMLClass.prototype.drawSwimlane2 = function(){
    var 
    bb = this.wrapper.getBBox(),
    bbAtrrs = this.subShapes[2].getBBox();
    return this._raphael.path(["M", bb.x, bb.y + this.opt.name.dy + this.opt.swimlane1.dy + bbAtrrs.height + this.opt.swimlane2.dy, "L", bb.x + bb.width, bb.y + this.opt.name.dy + this.opt.swimlane1.dy + bbAtrrs.height + this.opt.swimlane2.dy].join(" "));
};

UMLClass.prototype.drawAttributes = function(){
    var str = " ";
    if (this.opt.attributes.names)
	for (var i = 0, len = this.opt.attributes.names.length; i < len; i++)
	    str += this.opt.attributes.names[i] + "\n";
    // trim
    str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');    
    
    var
    bb = this.wrapper.getBBox(),
    t = this._raphael.text(bb.x + this.opt.attributes.dx, bb.y + this.opt.name.dy + this.opt.swimlane1.dy + this.opt.attributes.dy, str),
    tbb = t.getBBox();

    t.attr("text-anchor", "start");
    t.translate(0, tbb.height/2);	// tune the y-position
    return t;
};

UMLClass.prototype.drawMethods = function(){
    var str = " ";
    if (this.opt.methods.names)
	for (var i = 0, len = this.opt.methods.names.length; i < len; i++)
	    str += this.opt.methods.names[i] + "\n";
    // trim
    str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');    
    
    var
    bb = this.wrapper.getBBox(),
    bbAtrrs = this.subShapes[2].getBBox(),
    t = this._raphael.text(bb.x + this.opt.methods.dx, bb.y + this.opt.name.dy + this.opt.swimlane1.dy + this.opt.attributes.dy + bbAtrrs.height + this.opt.swimlane2.dy + this.opt.methods.dy, str),
    tbb = t.getBBox();

    t.attr("text-anchor", "start");
    t.translate(0, tbb.height/2);	// tune the y-position
    return t;
};

UMLClass.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    this.subShapes[0].remove();	// name
    this.subShapes[1].remove();	// swimlane1
    this.subShapes[2].remove();	// attributes
    this.subShapes[3].remove();	// swimlane2
    this.subShapes[4].remove();	// methods
    this.subShapes[0] = this.drawName();
    this.subShapes[1] = this.drawSwimlane1();
    this.subShapes[2] = this.drawAttributes();
    this.subShapes[3] = this.drawSwimlane2();
    this.subShapes[4] = this.drawMethods();
    for (var i = 5, len = this.subShapes.length; i < len; i++)
	this.subShapes[i].scale.apply(this.subShapes[i], arguments);
    Shape.prototype.scale.apply(this);
};

/**************************************************
 * DEVS 
 **************************************************/

function DEVS(raphael, r, name, attrs, ports){
    Shape.apply(this, [raphael]);
    this.opt = {
	rect: r,
	attrs: attrs,
	name: {
	    string: name,
	    dx: 20,	// x distance from oval bbox x
	    dy: 5	// y distance from oval bbox y
	},
	ports: {
	    dx: 5,
	    dy: 20,
	    radius: 5,
	    inputAttrs: {fill: "green", stroke: "black"},
	    outputAttrs: {fill: "red", stroke: "black"},
	    inputNameDx: -10,
	    inputNameDy: -10,
	    outputNameDx: 10,
	    outputNameDy: -10,
	    input: [],
	    output: []
	}
    };
    if (ports){
	if (ports.input)
	    this.opt.ports.input = ports.input;
	if (ports.output)
	    this.opt.ports.output = ports.output;
	if (ports.radius)
	    this.opt.ports.radius = ports.radius;
	if (ports.inputAttrs)
	    this.opt.ports.inputAttrs = ports.inputAttrs;
	if (ports.outputAttrs)
	    this.opt.ports.outputAttrs = ports.outputAttrs;
    }

    this.addMain(this._raphael.rect(this.opt.rect.x, this.opt.rect.y, 
				    this.opt.rect.width, this.opt.rect.height).attr(this.opt.attrs));
    // draw model name
    this.add(this.drawName());
    // draw ports
    for (var i = 0, l = this.opt.ports.input.length; i < l; i++)
	this.add(this.drawInputPort({index: (i+1), name: this.opt.ports.input[i]}));
    for (var i = 0, l = this.opt.ports.output.length; i < l; i++)
	this.add(this.drawOutputPort({index: (i+1), name: this.opt.ports.output[i]}));
    // draw port names
    for (var i = 0, l = this.opt.ports.input.length; i < l; i++)
	this.add(this.drawInputPortName({index: (i+1), name: this.opt.ports.input[i]}));
    for (var i = 0, l = this.opt.ports.output.length; i < l; i++)
	this.add(this.drawOutputPortName({index: (i+1), name: this.opt.ports.output[i]}));
};
DEVS.prototype = new Shape;

DEVS.prototype.drawName = function(){
    var 
    bb = this.wrapper.getBBox(),
    t = this._raphael.text(bb.x, bb.y, this.opt.name.string),
    tbb = t.getBBox();
    t.translate(bb.x - tbb.x + this.opt.name.dx, 
		bb.y - tbb.y + this.opt.name.dy);
    return t;
};

DEVS.prototype.drawInputPortName = function(p){
    var 
    pObj = this.inputPortAt(p.name),
    bb = pObj.getBBox(),
    t = this._raphael.text(bb.x, bb.y, p.name),
    tbb = t.getBBox();
    t.translate(bb.x - tbb.x + this.opt.ports.inputNameDx, bb.y - tbb.y + this.opt.ports.inputNameDy);
    return t;
};

DEVS.prototype.drawOutputPortName = function(p){
    var 
    pObj = this.outputPortAt(p.name),
    bb = pObj.getBBox(),
    t = this._raphael.text(bb.x, bb.y, p.name),
    tbb = t.getBBox();
    t.translate(bb.x - tbb.x + this.opt.ports.outputNameDx, bb.y - tbb.y + this.opt.ports.outputNameDy);
    return t;
};

DEVS.prototype.drawInputPort = function(p){
    var
    bb = this.wrapper.getBBox(),
    c = this._raphael.circle(bb.x, bb.y + this.opt.ports.dy * p.index, this.opt.ports.radius).attr(this.opt.ports.inputAttrs);
    return c;
};

DEVS.prototype.drawOutputPort = function(p){
    var
    bb = this.wrapper.getBBox(),
    c = this._raphael.circle(bb.x + bb.width, bb.y + this.opt.ports.dy * p.index, this.opt.ports.radius).attr(this.opt.ports.outputAttrs);
    return c;
};

DEVS.prototype.joint = function(oPort, to, iPort, opt){
    var 
    oPortIndex = -1,
    iPortIndex = -1;

    // non-DEVS object
    if (typeof to.opt.ports === "undefined")
	return;

    var 
    fromObj = this.outputPortAt(oPort),
    toObj = to.inputPortAt(iPort);
    
    if (typeof fromObj === "undefined")
	fromObj = this.inputPortAt(oPort);
    if (typeof toObj === "undefined")    
	toObj = to.outputPortAt(iPort);
    
    // a port were not found
    if (typeof fromObj === "undefined" ||
	typeof toObj === "undefined")
	return;
    
    return fromObj.joint.apply(fromObj, [toObj, opt]);
};

DEVS.prototype.inputPortAt = function(portName){
    for (var i = 0, l = this.opt.ports.input.length; i < l; i++)
	if (portName == this.opt.ports.input[i])
	    return this.subShapes[1 + i];
};

DEVS.prototype.outputPortAt = function(portName){
    for (var i = 0, l = this.opt.ports.output.length; i < l; i++)
	if (portName == this.opt.ports.output[i])
	    return this.subShapes[1 + this.opt.ports.input.length + i];
};

// TODO!!!
/*
DEVS.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    for (var i = 0, l = this.subShapes.length; i < l; i++)
	this.subShapes[i].remove();
    this.subShapes[0] = this.drawName();
    // draw ports
    var i = 0;
    for (; i < this.opt.ports.input.length; i++)
	this.subShapes[i] = this.drawInputPort({index: (i+1), name: this.opt.ports.input[i]});
    var iLen = i;
    for (i = 0; i < this.opt.ports.output.length; i++)
	this.subShapes[i+iLen] = this.drawOutputPort({index: (i+1), name: this.opt.ports.output[i]});
    var ioLen = iLen + i;
    // draw port names
    var i = 0;
    for (; i < this.opt.ports.input.length; i++)
	this.subShapes[i+ioLen] = this.drawInputPort({index: (i+1), name: this.opt.ports.input[i]});
    var ionLen = ioLen + i;
    for (i = 0; i < this.opt.ports.output.length; i++)
	this.subShapes[i+ionLen] = this.drawOutputPort({index: (i+1), name: this.opt.ports.output[i]});
    
    
    Shape.prototype.scale.apply(this);
};
*/