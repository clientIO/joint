/**
 * Joint.dia.uml 0.1.0 - Joint.dia plugin for creating UML diagrams.
 * Copyright (c) 2009 David Durman
 * Licensed under the MIT license: (http://www.opensource.org/licenses/mit-license.php)
 */
(function(global){	// BEGIN CLOSURE

var Joint = global.Joint;

var uml = Joint.dia.uml = {};
var Element = Joint.dia.Element;

var point = Joint.point;

/**
 * Predefined arrows for Class diagram.
 */
global.Joint.arrows.aggregation = function(size){
    return {
	path: ["M","7","0","L","0","5","L","-7","0", "L", "0", "-5", "z"],
	dx: 9, 
	dy: 9,
	attrs: { 
	    stroke: "black", 
	    "stroke-width": 2.0, 
	    fill: "black" 
	}
    };
};

uml.aggregationArrow = {
  endArrow: { type: "aggregation" },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none" }
};
uml.dependencyArrow = {
  endArrow: { type: "basic", size: 5 },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none" }
};
uml.generalizationArrow = {
  endArrow: { type: "basic", size: 10, attrs: {fill: "white"} },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none" }
};

/**
 * Predefined arrow for StateChart.
 */
uml.arrow = {
    startArrow: {type: "none"},
    endArrow: {type: "basic", size: 5}, 
    attrs: {"stroke-dasharray": "none"}
};

/**
 * UML StateChart state.
 * @param raphael raphael paper
 * @param r rectangle
 * @param name string state name
 * @param attrs shape SVG attributes
 * @param actions object entry/exit/inner actions
 */
uml.State = Element.extend({
    init: function(properties){
	// options
	var rect = this.rect = properties.rect;
	var radius = this.radius = properties.radius || 15;
	var attrs = this.attrs = properties.attrs || {};
	if (!this.attrs.fill){
	    this.attrs.fill = "white";
	}
	this.label = properties.label || "";
	this.labelOffsetX = properties.labelOffsetX || 20;
	this.labelOffsetY = properties.labelOffsetY || 5;
	this.swimlaneOffsetY = properties.swimlaneOffsetY || 18;
	if (!properties.actions){
	    properties.actions = {};
	}
	this.entryAction = properties.actions.entry || null;
	this.exitAction = properties.actions.exit || null;
	this.innerActions = properties.actions.inner || [];
	this.actionsOffsetX = properties.actionsOffsetX || 5;
	this.actionsOffsetY = properties.actionsOffsetY || 5;
	// wrapper
	this.setWrapper(this.paper.rect(rect.x, rect.y, rect.width, rect.height, radius).attr(attrs));
	// inner
	this.addInner(this.getLabelElement());
	this.addInner(this.getSwimlaneElement());
	this.addInner(this.getActionsElement());
    },
    getLabelElement: function(){
	var 
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x, bb.y, this.label),
	tbb = t.getBBox();
	t.translate(bb.x - tbb.x + this.labelOffsetX, 
		    bb.y - tbb.y + this.labelOffsetY);
	return t;
    },
    getSwimlaneElement: function(){
	var bb = this.wrapper.getBBox();
	return this.paper.path(["M", bb.x, bb.y + this.labelOffsetY + this.swimlaneOffsetY, "L", bb.x + bb.width, bb.y + this.labelOffsetY + this.swimlaneOffsetY].join(" "));
    },
    getActionsElement: function(){
	// collect all actions
	var str = (this.entryAction) ? "entry/ " + this.entryAction + "\n" : "";
	str += (this.exitAction) ? "exit/ " + this.exitAction + "\n" : "";
	var l = this.innerActions.length;
	for (var i = 0; i < l; i += 2){
	    str += this.innerActions[i] + "/ " + this.innerActions[i+1] + "\n";
	}
	// trim
	str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

	// draw text with actions
	var 
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x + this.actionsOffsetX, bb.y + this.labelOffsetY + this.swimlaneOffsetY + this.actionsOffsetY, str),
	tbb = t.getBBox();
	t.attr("text-anchor", "start");
	t.translate(0, tbb.height/2);	// tune the y position
	return t;
    },
    zoom: function(){
	this.wrapper.attr("r", this.radius); 	// set wrapper's radius back to its initial value (it deformates after scaling)
	this.inner[0].remove();	// label
	this.inner[1].remove();	// swimlane
	this.inner[2].remove();	// actions
	this.inner[0] = this.getLabelElement();
	this.inner[1] = this.getSwimlaneElement();
	this.inner[2] = this.getActionsElement();
    }
});


/**
 * UML StateChart start state.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 */
uml.StartState = Element.extend({
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
 * UML StateChart end state.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param attrs shape SVG attributes
 */
uml.EndState = Element.extend({
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


/**************************************************
 * UML Class Diagram
 **************************************************/

uml.Class = Element.extend({
    init: function(properties){
	var rect = this.rect = properties.rect;
	var attrs = this.attrs = properties.attrs || {};
	if (!attrs.fill){
	    attrs.fill = "white";
	}
	this.label = properties.label || "";
	this.labelOffsetX = properties.labelOffsetX || 20;
	this.labelOffsetY = properties.labelOffsetY || 5;
	this.swimlane1OffsetY = properties.swimlane1OffsetY || 18;
	this.swimlane2OffsetY = properties.swimlane2OffsetY || 18;
	this.attributes = properties.attributes || [];
	this.attributesOffsetX = properties.attributesOffsetX || 5;
	this.attributesOffsetY = properties.attributesOffsetY || 5;
	this.methods = properties.methods || [];
	this.methodsOffsetX = properties.methodsOffsetX || 5;
	this.methodsOffsetY = properties.methodsOffsetY || 5;
	// wrapper
	this.setWrapper(this.paper.rect(rect.x, rect.y, rect.width, rect.height).attr(attrs));
	// inner
	this.addInner(this.getLabelElement());
	this.addInner(this.getSwimlane1Element());
	this.addInner(this.getAttributesElement());
	this.addInner(this.getSwimlane2Element());
	this.addInner(this.getMethodsElement());
    },
    getLabelElement: function(){
	var 
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x, bb.y, this.label),
	tbb = t.getBBox();
	t.translate(bb.x - tbb.x + this.labelOffsetX, bb.y - tbb.y + this.labelOffsetY);
	return t;
    },
    getSwimlane1Element: function(){
	var bb = this.wrapper.getBBox();
	return this.paper.path(["M", bb.x, bb.y + this.labelOffsetY + this.swimlane1OffsetY, "L", bb.x + bb.width, bb.y + this.labelOffsetY + this.swimlane1OffsetY].join(" "));
    },
    getSwimlane2Element: function(){
	var 
	bb = this.wrapper.getBBox(),
	bbAtrrs = this.inner[2].getBBox();  // attributes
	return this.paper.path(["M", bb.x, bb.y + this.labelOffsetY + this.swimlane1OffsetY + bbAtrrs.height + this.swimlane2OffsetY, "L", bb.x + bb.width, bb.y + this.labelOffsetY + this.swimlane1OffsetY + bbAtrrs.height + this.swimlane2OffsetY].join(" "));
    },
    getAttributesElement: function(){
	var str = " ";
	for (var i = 0, len = this.attributes.length; i < len; i++){
	    str += this.attributes[i] + "\n";
	}
	// trim
	str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    
	var
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x + this.attributesOffsetX, bb.y + this.labelOffsetY + this.swimlane1OffsetY + this.attributesOffsetY, str),
	tbb = t.getBBox();
	t.attr("text-anchor", "start");
	t.translate(0, tbb.height/2);	// tune the y-position
	return t;
    },
    getMethodsElement: function(){
	var str = " ";
	for (var i = 0, len = this.methods.length; i < len; i++){
	    str += this.methods[i] + "\n";
	}
	// trim
	str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    	var
	bb = this.wrapper.getBBox(),
	bbAtrrs = this.inner[2].getBBox(),  // attributes
	t = this.paper.text(bb.x + this.methodsOffsetX, bb.y + this.labelOffsetY + this.swimlane1OffsetY + this.attributesOffsetY + bbAtrrs.height + this.swimlane2OffsetY + this.methodsOffsetY, str),
	tbb = t.getBBox();
	t.attr("text-anchor", "start");
	t.translate(0, tbb.height/2);	// tune the y-position
	return t;
    },
    zoom: function(){
	this.inner[0].remove();	// label
	this.inner[1].remove();	// swimlane1
	this.inner[2].remove();	// attributes
	this.inner[3].remove();	// swimlane2
	this.inner[4].remove();	// methods
	this.inner[0] = this.getLabelElement();
	this.inner[1] = this.getSwimlane1Element();
	this.inner[2] = this.getAttributesElement();
	this.inner[3] = this.getSwimlane2Element();
	this.inner[4] = this.getMethodsElement();
    }			       
});

})(this);	// END CLOSURE