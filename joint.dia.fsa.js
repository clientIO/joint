/**
 * Joint.dia.fsa 0.1.0 - Joint.dia plugin for creating FSA diagrams.
 * Copyright (c) 2009 David Durman
 * Licensed under the MIT license: (http://www.opensource.org/licenses/mit-license.php)
 */
(function(global){	// BEGIN CLOSURE
/**
 * @example
 * dia.paper(r);
 * var s = dia.fsa.state({
 *		  position: point(10,10), 
 *		  radius: 5, 
 *		  label: "state 1"
 *	      });
 */
var Joint = global.Joint;
var fsa = Joint.dia.fsa = {};
var Element = Joint.dia.Element;

var point = Joint.point;

/**
 * Predefined arrow.
 */
fsa.arrow = {
    startArrow: {type: "none"},
    endArrow: {type: "basic", size: 5}, 
    attrs: {"stroke-dasharray": "none"}
};

/**
 * Finite state machine state.
 * @param paper raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 * @param text string state name
 */
fsa.State = Element.extend({
    init: function(properties){
	// options
	this.position = properties.position || point(0, 0);
	this.radius = properties.radius || 30;
	this.label = properties.label || "State";
	this.labelOffsetX = properties.labelOffsetX || (this.radius / 2);
	this.labelOffsetY = properties.labelOffsetY || (this.radius / 2 + 8);
	this.attrs = properties.attrs || {};
	if (!this.attrs.fill){
	    this.attrs.fill = "white";
	}
	// wrapper
	this.setWrapper(this.paper.circle(this.position.x, this.position.y, this.radius).attr(this.attrs));
	// inner
	this.addInner(this.getLabelElement());
    },
    getLabelElement: function(){
	var 
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x, bb.y, this.label),
	tbb = t.getBBox();
	t.translate(bb.x - tbb.x + this.labelOffsetX, 
		    bb.y - tbb.y + this.labelOffsetY);
	return t;
    }
});

/**
 * FSA start state.
 * @param paper raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 */
fsa.StartState = Element.extend({
     init: function(properties){
	 // options
	 this.position = properties.position || point(0, 0);
	 this.radius = properties.radius || 10;
	 this.attrs = properties.attrs || {};
	 if (!this.attrs.fill){
	     this.attrs.fill = "black";
	 }
	 // wrapper
	 this.setWrapper(this.paper.circle(this.position.x, this.position.y, this.radius).attr(this.attrs));
     }
});

/**
 * FSA end state.
 * @param paper raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 */
fsa.EndState = Element.extend({
     init: function(properties){
	 // options
	 this.position = properties.position || point(0, 0);
	 this.radius = properties.radius || 10;
	 this.innerRadius = properties.innerRadius || (this.radius / 2);
	 this.attrs = properties.attrs || {};
	 if (!this.attrs.fill){
	     this.attrs.fill = "white";
	 }
	 this.innerAttrs = properties.innerAttrs || {};
	 if (!this.innerAttrs.fill){
	     this.innerAttrs.fill = "black";
	 }
	 // wrapper
	 this.setWrapper(this.paper.circle(this.position.x, this.position.y, this.radius).attr(this.attrs));
	 // inner
	 this.addInner(this.paper.circle(this.position.x, this.position.y, this.innerRadius).attr(this.innerAttrs));
     },
     zoom: function(){
	 this.inner[0].scale.apply(this.inner[0], arguments);
     }
});

})(this);	// END CLOSURE