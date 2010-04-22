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
     object: "Model",
     module: "devs",
     init: function(properties){
	 // options
	 var p = this.properties;
	 var rect = p.rect = properties.rect;
	 var attrs = p.attrs = properties.attrs || {};
	 var label = p.label = properties.label;
	 p.labelOffsetX = properties.labelOffsetX || 20;
	 p.labelOffsetY = properties.labelOffsetY || 5;
	 p.portsOffsetX = properties.portsOffsetX || 5;
	 p.portsOffsetY = properties.portsOffsetY || 20;
	 p.iPortRadius = properties.iPortRadius || 5;
	 p.oPortRadius = properties.oPortRadius || 5;
	 p.iPortAttrs = properties.iPortAttrs || {};
	 if (!p.iPortAttrs.fill){ p.iPortAttrs.fill = "green"; }
	 if (!p.iPortAttrs.stroke){ p.iPortAttrs.stroke = "black"; }
	 p.oPortAttrs = properties.oPortAttrs || {};
	 if (!p.oPortAttrs.fill){ p.oPortAttrs.fill = "red"; }
	 if (!p.oPortAttrs.stroke){ p.oPortAttrs.stroke = "black"; }
	 p.iPortLabelOffsetX = properties.iPortLabelOffsetX || -10;
	 p.iPortLabelOffsetY = properties.iPortLabelOffsetY || -10;
	 p.oPortLabelOffsetX = properties.oPortLabelOffsetX || 10;
	 p.oPortLabelOffsetY = properties.oPortLabelOffsetY || -10;
	 var iPorts = p.iPorts = properties.iPorts || [];
	 var oPorts = p.oPorts = properties.oPorts || [];
	 // wrapper
	 var paper = this.paper;
	 this.setWrapper(paper.rect(rect.x, rect.y, rect.width, rect.height).attr(attrs));
	 // inner
	 this.addInner(this.getLabelElement());	// label
	 // draw ports
	 for (var i = 0, l = iPorts.length; i < l; i++){
	     this.addInner(this.getPortElement("i", i + 1, iPorts[i]));
	 }
	 for (var i = 0, l = oPorts.length; i < l; i++){
	     this.addInner(this.getPortElement("o", i + 1, oPorts[i]));
	 }
	 // delete all ports related properties, they are saved in port objects
	 p.iPorts = p.oPorts = p.portsOffsetX = p.portsOffsetY = p.iPortRadius = p.oPortRadius = p.iPortAttrs = p.oPortAttrs = p.iPortLabelOffsetX = p.iPortLabelOffsetY = p.oPortLabelOffsetX = p.oPortLabelOffsetY = undefined;
     },
     getLabelElement: function(){
	 var 
	 p = this.properties,
	 bb = this.wrapper.getBBox(),
	 t = this.paper.text(bb.x, bb.y, p.label),
	 tbb = t.getBBox();
	 t.translate(bb.x - tbb.x + p.labelOffsetX, bb.y - tbb.y + p.labelOffsetY);
	 return t;
     },
     getPortElement: function(type, index, label){
	 var bb = this.wrapper.getBBox(), p = this.properties;
	 var port = devs.Port.create({
					 label: label,
					 type: type,
					 position: {x: bb.x + ((type === "o") ? bb.width : 0), y: bb.y + p.portsOffsetY * index},
					 radius: p[type + "PortRadius"],
					 attrs: p[type + "PortAttrs"],
					 offsetX: p[type + "PortLabelOffsetX"],
					 offsetY: p[type + "PortLabelOffsetY"]
				     });
	 return port;
     },
     port: function(type, label){
	 var el;
	 for (var i = 0, l = this.inner.length; i < l; i++){
	     el = this.inner[i];
	     if (el.properties && label == el.properties.label && type == el.properties.type){
		 return el;
	     }
	 }
     },
     joint: function(oPort, to, iPort, opt){
	 // shorthand
	 if (!to.port) return undefined;	// non-DEVS object
	 return this.port("o", oPort).joint(to.port("i", iPort), opt);
     },
     zoom: function(){
	 // @todo
     }				
});

devs.Port = Element.extend({
     object: "Port",
     module: "devs",
     // doesn't have object and module properties => it's invisible for serializer
     init: function(properties){
	 var p = this.properties;
	 p.position = properties.position;
	 p.radius = properties.radius;
	 p.attrs = properties.attrs;
	 p.label = properties.label || "";
	 p.offsetX = properties.offsetX || 0;
	 p.offsetY = properties.offsetY || 0;
	 p.type = properties.type || "i";
	 
	 this.setWrapper(this.paper.circle(p.position.x, p.position.y, p.radius).attr(p.attrs));
	 this.addInner(this.getLabelElement());
     },
     getLabelElement: function(){
	 var bb = this.wrapper.getBBox(), p = this.properties,
	 t = this.paper.text(bb.x, bb.y, p.label),
	 tbb = t.getBBox();
	 t.translate(bb.x - tbb.x + p.offsetX, bb.y - tbb.y + p.offsetY);
	 return t;
     },
     zoom: function(){
	 // @todo
     }
});

})(this);	// END CLOSURE
