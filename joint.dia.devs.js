/**
 * Joint.dia.devs 0.1.0 - Joint.dia plugin for creating Discrete Event System Specification (DEVS) diagrams.
 * Copyright (c) 2009 David Durman
 * Licensed under the MIT license: (http://www.opensource.org/licenses/mit-license.php)
 */
(function(global){	// BEGIN CLOSURE

var devs = global.Joint.dia.devs = {};
var Element = global.Joint.dia.Element;

/**
 * Predefined arrow.
 */
devs.arrow = {
  endArrow: { type: "none" },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none" }
};

devs.Model = Element.extend({
     init: function(properties){
	 // options
	 this._isDEVS = true;
	 var rect = this.rect = properties.rect;
	 var attrs = this.attrs = properties.attrs || {};
	 var label = this.label = properties.label;
	 this.labelOffsetX = properties.labelOffsetX || 20;
	 this.labelOffsetY = properties.labelOffsetY || 5;
	 this.portsOffsetX = properties.portsOffsetX || 5;
	 this.portsOffsetY = properties.portsOffsetY || 20;
	 this.iPortRadius = properties.iPortRadius || 5;
	 this.oPortRadius = properties.oPortRadius || 5;
	 this.iPortAttrs = properties.iPortAttrs || {};
	 if (!this.iPortAttrs.fill){ this.iPortAttrs.fill = "green"; }
	 if (!this.iPortAttrs.stroke){ this.iPortAttrs.stroke = "black"; }
	 this.oPortAttrs = properties.oPortAttrs || {};
	 if (!this.oPortAttrs.fill){ this.oPortAttrs.fill = "red"; }
	 if (!this.oPortAttrs.stroke){ this.oPortAttrs.stroke = "black"; }
	 this.iPortLabelOffsetX = properties.iPortLabelOffsetX || -10;
	 this.iPortLabelOffsetY = properties.iPortLabelOffsetY || -10;
	 this.oPortLabelOffsetX = properties.oPortLabelOffsetX || 10;
	 this.oPortLabelOffsetY = properties.oPortLabelOffsetY || -10;
	 var iPorts = this.iPorts = properties.iPorts || [];
	 var oPorts = this.oPorts = properties.oPorts || [];
	 // wrapper
	 var paper = this.paper;
	 this.setWrapper(paper.rect(rect.x, rect.y, rect.width, rect.height).attr(attrs));
	 // inner
	 this.addInner(this.getLabelElement());	// label
	 // draw ports
	 for (var i = 0, l = iPorts.length; i < l; i++){
	     this.addInner(this.getPortElement("i", i + 1));
	 }
	 for (var i = 0, l = oPorts.length; i < l; i++){
	     this.addInner(this.getPortElement("o", i + 1));
	 }
	 // draw port names
	 for (var i = 0, l = iPorts.length; i < l; i++){
	     this.addInner(this.getPortLabelElement("i", iPorts[i]));
	 }
	 for (var i = 0, l = oPorts.length; i < l; i++){
	     this.addInner(this.getPortLabelElement("o", oPorts[i]));
	 }
     },
     getLabelElement: function(){
	 var 
	 bb = this.wrapper.getBBox(),
	 t = this.paper.text(bb.x, bb.y, this.label),
	 tbb = t.getBBox();
	 t.translate(bb.x - tbb.x + this.labelOffsetX, bb.y - tbb.y + this.labelOffsetY);
	 return t;
     },
     getPortLabelElement: function(type, label){
	 var 
	 pObj = this.portAt(type, label),
	 bb = pObj.getBBox(),
	 t = this.paper.text(bb.x, bb.y, label),
	 tbb = t.getBBox();
	 t.translate(bb.x - tbb.x + this[type + "PortLabelOffsetX"], bb.y - tbb.y + this[type + "PortLabelOffsetY"]);
	 return t;
     },
     getPortElement: function(type, index){
	 var
	 bb = this.wrapper.getBBox(),
	 c = this.paper.circle(bb.x + ((type === "o") ? bb.width : 0), bb.y + this.portsOffsetY * index, this[type + "PortRadius"]).attr(this[type + "PortAttrs"]);
	 return c;
     },
     portAt: function(type, label){
	 for (var i = 0, l = this[type + "Ports"].length; i < l; i++){
	     if (label == this[type + "Ports"][i]){
		 return this.inner[1 + i + ((type === "o") ? this.iPorts.length : 0)];
	     }
	 }
     },
     joint: function(oPort, to, iPort, opt){
	 var 
	 oPortIndex = -1,
	 iPortIndex = -1;
	 // non-DEVS object
	 if (!to._isDEVS){ return undefined; }
	 var 
	 fromObj = this.portAt("o", oPort),
	 toObj = to.portAt("i", iPort);
	 
	 if (typeof fromObj === "undefined"){ fromObj = this.portAt("i", oPort); }
	 if (typeof toObj === "undefined"){ toObj = to.portAt("o", iPort); }
    
	 // a port were not found
	 if (typeof fromObj === "undefined" ||
	     typeof toObj === "undefined"){
	     return undefined;
	 }
	 return fromObj.joint.apply(fromObj, [toObj, opt]);
     },
     zoom: function(){
	 // @todo
     }				
});

})(this);	// END CLOSURE
