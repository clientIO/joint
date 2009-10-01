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

Shape.currentDrag = false;

/**
 * Top prototype for composite objects.
 */
function Shape(opt){
    this.wrapper = null;
    this.subShapes = [];
    this._opt = {
	draggable: true
    };
    for (var key in opt)
	this._opt[key] = opt[key];
    this.isShape = true;

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
	}
    };
};

/**
 * Shape mousedown event.
 */
Shape.prototype.dragger = function(e){
    Shape.currentDrag = this.wholeShape;
    Shape.currentDrag.dx = e.clientX;
    Shape.currentDrag.dy = e.clientY;    
    e.preventDefault && e.preventDefault();
};

/**
 * Document mousemove event.
 */
Shape.mouseMove = function(e){
    e = e || window.event;
    if (Shape.currentDrag){
	Shape.currentDrag.translate(e.clientX - Shape.currentDrag.dx, e.clientY - Shape.currentDrag.dy);
	r.safari();
	Shape.currentDrag.dx = e.clientX;
	Shape.currentDrag.dy = e.clientY;
    }
};

/**
 * Document mouseup event.
 */
Shape.mouseUp = function(e){
    Shape.currentDrag = false;
};

addEvent(document, "mousemove", Shape.mouseMove);
addEvent(document, "mouseup", Shape.mouseUp);

Shape.prototype.translate = function(dx, dy){
    this.wrapper.translate(dx, dy);
    for (var i = this.subShapes.length - 1; i >= 0; --i){
	this.subShapes[i].translate(dx, dy);
    }
};

/**
 * Add subshape.
 */
Shape.prototype.add = function(s){
    this.subShapes.push(s);
};

/**
 * Add wrapper.
 */
Shape.prototype.addMain = function(s){
    this.wrapper = s;
    this.wrapper.wholeShape = this;
    this.type = this.wrapper.type;
    if (this._opt && this._opt.draggable){
	this.wrapper.mousedown(this.dragger);
    }
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
    var toobj = (to.isShape) ? to.wrapper : to;
    return this.wrapper.joint.apply(this.wrapper, [toobj, opt]);
};

/**
 * Delegate attr message to my wrapper.
 */
Shape.prototype.attr = function(){
    return Raphael.el.attr.apply(this.wrapper, arguments);
};

/**
 * UML StateChart state.
 * @param raphael raphael paper
 * @param r rectangle
 * @param attrs shape SVG attributes
 * @param text string state name
 */
function UMLState(raphael, r, attrs, text){
//    Shape.apply(this, arguments[5]);
    Shape.apply(this);
    this.opt = {
	rect: r,
	radius: 15,
	attrs: attrs,
	text: {
	    string: text,
	    dx: 20,	// x distance from oval bbox x
	    dy: 5	// y distance from oval bbox y
	},
	swimlane: {
	    dy: 15	// swimlane distance from the top
	}
    }; 
    this._raphael = raphael;
    this.addMain(this._raphael.rect(this.opt.rect.x, this.opt.rect.y, 
				    this.opt.rect.width, this.opt.rect.height, 
				    this.opt.radius).attr(this.opt.attrs));
    this.add(this.drawText());
    this.add(this.drawSwimlane());
};
UMLState.prototype = new Shape;

UMLState.prototype.drawSwimlane = function(){
    var bb = this.wrapper.getBBox();
    return this._raphael.path(["M", bb.x, bb.y + this.opt.text.dy + this.opt.swimlane.dy, "L", bb.x + bb.width, bb.y + this.opt.text.dy + this.opt.swimlane.dy].join(" "));
};

UMLState.prototype.drawText = function(){
    var 
    bb = this.wrapper.getBBox(),
    t = this._raphael.text(bb.x, bb.y, this.opt.text.string),
    tbb = t.getBBox();
    t.translate(bb.x - tbb.x + this.opt.text.dx, 
		bb.y - tbb.y + this.opt.text.dy);
    return t;
};

UMLState.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    this.subShapes[0].remove();	// text
    this.subShapes[1].remove();	// swimlane
    this.subShapes[0] = this.drawText();
    this.subShapes[1] = this.drawSwimlane();
};

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
    Shape.apply(this);
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
    this._raphael = raphael;
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
};

/**
 * Finite state machine start state.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 */
function FSAStartState(raphael, p, r, attrs){
//    Shape.apply(this, arguments[4]);
    Shape.apply(this);
    this.opt = {
	point: p,
	radius: r,
	attrs: attrs
    }; 
    this._raphael = raphael;
    this.addMain(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				      this.opt.radius).attr(this.opt.attrs).attr("fill", "black"));
};
FSAStartState.prototype = new Shape;

FSAStartState.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
};

/**
 * Finite state machine end state.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 */
function FSAEndState(raphael, p, r, attrs){
//    Shape.apply(this, arguments[4]);
    Shape.apply(this);
    this.opt = {
	point: p,
	radius: r,
	subRadius: r/2,
	attrs: attrs
    }; 
    this._raphael = raphael;
    this.addMain(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				      this.opt.radius).attr(this.opt.attrs).attr("fill", "white"));
    this.add(this._raphael.circle(this.opt.point.x, this.opt.point.y, 
				  this.opt.subRadius).attr(this.opt.attrs).attr("fill", "black"));
};
FSAEndState.prototype = new Shape;

FSAEndState.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    this.subShapes[0].scale.apply(this.subShapes[0], arguments);
};


/**
 * Petri net place.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param rToken radius of my tokens
 * @param nTokens number of tokens
 * @param attrs shape SVG attributes
 */
function PNPlace(raphael, p, r, rToken, nTokens, attrs){
//    Shape.apply(this, arguments[5]);
    Shape.apply(this);
    this.opt = {
	point: p,
	radius: r,
	radiusToken: rToken,
	nTokens: nTokens,
	attrs: attrs
    };

    this._raphael = raphael;
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
};
PNPlace.prototype = new Shape;

PNPlace.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
    for (var i = 0, len = this.subShapes.length; i < len; i++)
	this.subShapes[i].scale.apply(this.subShapes[i], arguments);
};

/**
 * Petri net event.
 * @param raphael raphael paper
 * @param r rectangle
 * @param attrs shape SVG attributes
 */
function PNEvent(raphael, r, attrs){
    Shape.apply(this);
    this.opt = {
	rect: r,
	attrs: attrs
    };

    this._raphael = raphael;
    this.addMain(this._raphael.rect(this.opt.rect.x, this.opt.rect.y, 
				    this.opt.rect.width, this.opt.rect.height));
    // default
    this.wrapper.attr({fill: "black", stroke: "black"});
    // custom
    this.wrapper.attr(this.opt.attrs);
};
PNEvent.prototype = new Shape;

PNEvent.prototype.scale = function(){
    this.wrapper.scale.apply(this.wrapper, arguments);
};
