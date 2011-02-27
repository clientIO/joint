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
 * @param {array} [properties.iPorts] The input port names.
 * @param {array} [properties.oPorts] The output port names.
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
	 var p = Joint.DeepSupplement(this.properties, properties, {
             labelOffsetX: 20,
             labelOffsetY: 5,
             portsOffsetX: 5,
             portsOffsetY: 20,
             iPortRadius: 5,
             oPortRadius: 5,
             iPortAttrs: { fill: 'green', stroke: 'black' },
             oPortAttrs: { fill: 'red', stroke: 'black' },
             iPortLabelOffsetX: -10,
             iPortLabelOffsetY: -10,
             oPortLabelOffsetX: 10,
             oPortLabelOffsetY: -10,
             iPorts: [],
             oPorts: []
         });
	 // wrapper
	 var paper = this.paper, i;
	 this.setWrapper(paper.rect(p.rect.x, p.rect.y, p.rect.width, p.rect.height).attr(p.attrs));
	 // inner
	 this.addInner(this.getLabelElement());	// label
	 // draw ports
	 for (i = 0, l = p.iPorts.length; i < l; i++){
	     this.addInner(this.getPortElement("i", i + 1, p.iPorts[i]));
	 }
	 for (i = 0, l = p.oPorts.length; i < l; i++){
	     this.addInner(this.getPortElement("o", i + 1, p.oPorts[i]));
	 }
	 // delete all ports related properties, they are saved in port objects
	 p.iPorts = p.oPorts = p.portsOffsetX = p.portsOffsetY = p.iPortRadius = p.oPortRadius = p.iPortAttrs = p.oPortAttrs = p.iPortLabelOffsetX = p.iPortLabelOffsetY = p.oPortLabelOffsetX = p.oPortLabelOffsetY = undefined;
     },
     getLabelElement: function(){
	 var p = this.properties,
	     bb = this.wrapper.getBBox(),
	     t = this.paper.text(bb.x, bb.y, p.label).attr(p.labelAttrs || {}),
	     tbb = t.getBBox();
	 t.translate(bb.x - tbb.x + p.labelOffsetX, bb.y - tbb.y + p.labelOffsetY);
	 return t;
     },
     getPortElement: function(type, index, label){
	 var bb = this.wrapper.getBBox(), p = this.properties,
	     port = devs.Port.create({
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
	 var p = Joint.DeepSupplement(this.properties, properties, {
             label: '',
             offsetX: 0,
             offsetY: 0,
             type: 'i'
         });
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
