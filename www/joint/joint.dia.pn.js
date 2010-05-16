/**
 * Joint 0.2.0 - JavaScript diagramming library.
 * Copyright (c) David Durman 2009 - 2010 
 * Licensed under the MIT license: (http://www.opensource.org/licenses/mit-license.php)
 */
(function(global){	// BEGIN CLOSURE

var Joint = global.Joint,
     Element = Joint.dia.Element;

/**
 * @name Joint.dia.pn
 * @namespace Holds functionality related to Petri net diagrams.
 */
var pn = Joint.dia.pn = {};

/**
 * Predefined arrow.
 * @name Joint.dia.pn.arrow
 * @memberOf Joint.dia.pn
 * @example p1.joint(e2, Joint.dia.pn.arrow);
 */
pn.arrow = {
    startArrow: {type: "none"},
    endArrow: {type: "basic", size: 5}, 
    attrs: {"stroke-dasharray": "none"}
};

/**
 * Petri net place.
 * @name Place.create
 * @methodOf Joint.dia.pn
 * @param {Object} properties
 * @param {Object} properties.position Position of the place (e.g. {x: 50, y: 100}).
 * @param {Number} [properties.radius] Radius of the circle of the place.
 * @param {Number} [properties.tokenRadius] Radius of the tokens of the place.
 * @param {Number} [properties.tokens] Number of tokens.
 * @param {String} [properties.label] The name of the place.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the place.
 * @param {Object} [properties.tokenAttrs] SVG attributes of the appearance of the token circles.
 * @example
var p1 = Joint.dia.pn.Place.create({
  position: {x: 120, y: 70},
  radius: 25,
  tokenRadius: 4,
  tokens: 3,
  label: "p1",
  attrs: {
    stroke: "blue"
  },
  tokenAttrs: {
    fill: "red"
  }
});
 */
pn.Place = Element.extend({
     object: "Place",
     module: "pn",
     init: function(properties){
	 // options
	 var p = this.properties;
	 var position = p.position = properties.position;
	 var radius = p.radius = properties.radius || 20;
	 var tokenRadius = p.tokenRadius = properties.tokenRadius || 3;
	 var tokens = p.tokens = parseInt(properties.tokens) || 0;
	 var label = p.label = properties.label;
	 var attrs = p.attrs = properties.attrs || {};
	 if (!attrs.fill){
	     attrs.fill = "white";
	 }
	 var tokenAttrs = p.tokenAttrs = properties.tokenAttrs || {};
	 if (!tokenAttrs.fill){
	     tokenAttrs.fill = "black";
	 }
	 // wrapper
	 var paper = this.paper;
	 this.setWrapper(paper.circle(position.x, position.y, radius).attr(attrs));
	 // inner
	 var strut = 2; // px
	 switch (tokens){
	 case 0:
	     break;
	 case 1:
	     this.addInner(paper.circle(position.x, position.y, tokenRadius).attr(tokenAttrs));
	     break;
	 case 2:
	     this.addInner(paper.circle(position.x - (tokenRadius * 2), position.y, tokenRadius).attr(tokenAttrs));
	     this.addInner(paper.circle(position.x + (tokenRadius * 2), position.y, tokenRadius).attr(tokenAttrs));
	     break;
	 case 3:
	     this.addInner(paper.circle(position.x - (tokenRadius * 2) - strut, position.y, tokenRadius).attr(tokenAttrs));
	     this.addInner(paper.circle(position.x + (tokenRadius * 2) + strut, position.y, tokenRadius).attr(tokenAttrs));
	     this.addInner(paper.circle(position.x, position.y, tokenRadius).attr(tokenAttrs));
	     break;
	 default:
	     this.addInner(paper.text(position.x, position.y, tokens.toString()));
	     break;
	 }
	 // label
	 if (label){
	     this.addInner(paper.text(position.x, position.y - radius, label));
	     this.inner[this.inner.length - 1].translate(0, -this.inner[this.inner.length - 1].getBBox().height);
	 }
     },
     zoom: function(){
	 // @todo tokens must move accordingly
	 for (var i = 0, len = this.inner.length; i < len; i++){
	     this.inner[i].scale.apply(this.inner[i], arguments);
	 }
	 if (this.label){
	     this.inner[this.inner.length - 1].remove();
	     var bb = this.wrapper.getBBox();
	     this.inner[this.inner.length - 1] = this.paper.text(bb.x, bb.y, this.properties.label);
	     this.inner[this.inner.length - 1].translate(0, -this.inner[this.inner.length - 1].getBBox().height);
	 }
     }
});

/**
 * Petri net event.
 * @name Event.create
 * @methodOf Joint.dia.pn
 * @param {Object} properties
 * @param {Object} properties.rect Bounding box of the event (e.g. {x: 50, y: 100, width: 30, height: 100}).
 * @param {String} [properties.label] The name of the event.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the event.
 * @example
var p1 = Joint.dia.pn.Event.create({
  rect: {x: 120, y: 70, width: 50, height: 7},
  label: "e1",
  attrs: {
    stroke: "blue",
    fill: "yellow"
  }
});
 */
pn.Event = Element.extend({
     object: "Event",
     module: "pn",
     init: function(properties){
	 // options
	 var p = this.properties;
	 var rect = p.rect = properties.rect;
	 var attrs = p.attrs = properties.attrs || {};
	 if (!attrs.fill){ attrs.fill = "black"; }
	 if (!attrs.stroke){ attrs.stroke = "black"; }
	 var label = p.label = properties.label;
	 // wrapper
	 var paper = this.paper;
	 this.setWrapper(paper.rect(rect.x, rect.y, rect.width, rect.height).attr(attrs));
	 if (label){
	     this.addInner(paper.text(rect.x, rect.y, label));
	     this.inner[0].translate(0, -this.inner[0].getBBox().height);
	 }
     },
     zoom: function(){
	 if (this.label){
	     this.inner[0].remove();
	     var bb = this.wrapper.getBBox();
	     this.inner[0] = this.paper.text(bb.x, bb.y, this.properties.label);
	     this.inner[0].translate(0, -this.inner[0].getBBox().height);
	 }
     }
});

})(this);	// END CLOSURE
