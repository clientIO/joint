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
    object: "State",
    module: "fsa",
    init: function(properties){
	// options
	var p = this.properties;
	p.position = properties.position || point(0, 0);
	p.radius = properties.radius || 30;
	p.label = properties.label || "State";
	p.labelOffsetX = properties.labelOffsetX || (p.radius / 2);
	p.labelOffsetY = properties.labelOffsetY || (p.radius / 2 + 8);
	p.attrs = properties.attrs || {};
	if (!p.attrs.fill){
	    p.attrs.fill = "white";
	}
	// wrapper
	this.setWrapper(this.paper.circle(p.position.x, p.position.y, p.radius).attr(p.attrs));
	// inner
	this.addInner(this.getLabelElement());
    },
    getLabelElement: function(){
	var 
	p = this.properties,
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x, bb.y, p.label),
	tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX, 
		    bb.y - tbb.y + p.labelOffsetY);
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
     object: "StartState",
     module: "fsa",
     init: function(properties){
	 // options
	 var p = this.properties;
	 p.position = properties.position || point(0, 0);
	 p.radius = properties.radius || 10;
	 p.attrs = properties.attrs || {};
	 if (!p.attrs.fill){
	     p.attrs.fill = "black";
	 }
	 // wrapper
	 this.setWrapper(this.paper.circle(p.position.x, p.position.y, p.radius).attr(p.attrs));
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
     object: "EndState",
     module: "fsa",
     init: function(properties){
	 // options
	 var p = this.properties;
	 p.position = properties.position || point(0, 0);
	 p.radius = properties.radius || 10;
	 p.innerRadius = properties.innerRadius || (p.radius / 2);
	 p.attrs = properties.attrs || {};
	 if (!p.attrs.fill){
	     p.attrs.fill = "white";
	 }
	 p.innerAttrs = properties.innerAttrs || {};
	 if (!p.innerAttrs.fill){
	     p.innerAttrs.fill = "black";
	 }
	 // wrapper
	 this.setWrapper(this.paper.circle(p.position.x, p.position.y, p.radius).attr(p.attrs));
	 // inner
	 this.addInner(this.paper.circle(p.position.x, p.position.y, p.innerRadius).attr(p.innerAttrs));
     },
     zoom: function(){
	 this.inner[0].scale.apply(this.inner[0], arguments);
     }
});

})(this);	// END CLOSURE