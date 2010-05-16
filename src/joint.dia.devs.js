(function(global){	// BEGIN CLOSURE

var Joint = global.Joint,
     Element = Joint.dia.Element;

/**
 * @name Joint.dia.devs
 * @namespace Holds functionality related to Discrete EVent System (DEVS) diagrams.
 */
var devs = Joint.dia.devs = {};

/**
 * Predefined arrow.
 * @name Joint.dia.devs.arrow
 * @memberOf Joint.dia.devs
 * @example a1.port("o", "out1").joint(c1.port("i", "in"), Joint.dia.devs.arrow);
 */
devs.arrow = {
  endArrow: { type: "none" },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none" }
};

/**
 * DEVS atomic/coupled model.
 * @name Model.create
 * @methodOf Joint.dia.devs
 * @param {Object} properties
 * @param {Object} properties.rect Bounding box of the model (e.g. {x: 50, y: 100, width: 150, height: 100}).
 * @param {String} [properties.label] The name of the model.
 * @param {Number} [properties.labelOffsetX] Offset in x-axis of the label from the model rectangle origin.
 * @param {Number} [properties.labelOffsetY] Offset in y-axis of the label from the model rectangle origin.
 * @param {Number} [properties.portsOffsetX] Offset in x-axis of the ports from the model rectangle origin.
 * @param {Number} [properties.portsOffsetY] Offset in y-axis of the ports from the model rectangle origin.
 * @param {Number} [properties.iPortRadius] Radius of the input ports circle.
 * @param {Number} [properties.oPortRadius] Radius of the output ports circle.
 * @param {Object} [properties.iPortAttrs] SVG attributes of the appearance of the input ports.
 * @param {Object} [properties.oPortAttrs] SVG attributes of the appearance of the output ports.
 * @param {Number} [properties.iPortLabelOffsetX] Offset in x-axis of the input ports label.
 * @param {Number} [properties.oPortLabelOffsetX] Offset in x-axis of the output ports label.
 * @param {String[]} [properties.iPorts] The input port names.
 * @param {String[]} [properties.oPorts] The output port names.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the model.
 * @example
var a1 = Joint.dia.devs.Model.create({
  rect: {x: 30, y: 90, width: 100, height: 60},
  label: "Atomic 1",
  attrs: {
    fill: "90-#000-#f00:1-#fff"
  },
  iPorts: ["in1"],
  oPorts: ["out1", "out2"]
});
 */
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
     /**
      * Get a port object. It can be used further for connecting other port objects.
      * @param {String} type "i"|"o"
      * @param {String} label Name of the port.
      * @return {Port}
      */
     port: function(type, label){
	 var el;
	 for (var i = 0, l = this.inner.length; i < l; i++){
	     el = this.inner[i];
	     if (el.properties && label == el.properties.label && type == el.properties.type){
		 return el;
	     }
	 }
	 return undefined;
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
