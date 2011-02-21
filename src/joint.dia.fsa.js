(function(global){	// BEGIN CLOSURE

var Joint = global.Joint,
     Element = Joint.dia.Element,
     point = Joint.point;

/**
 * @name Joint.dia.fsa
 * @namespace Holds functionality related to FSA diagrams.
 */
var fsa = Joint.dia.fsa = {};

/**
 * Predefined arrow. You are free to use this arrow as the option parameter to joint method.
 * @name arrow
 * @memberOf Joint.dia.fsa
 * @example
 * var arrow = Joint.dia.fsa.arrow;
 * s1.joint(s2, (arrow.label = "anEvent", arrow));
 */
fsa.arrow = {
    startArrow: {type: "none"},
    endArrow: {type: "basic", size: 5},
    attrs: {"stroke-dasharray": "none"}
};

/**
 * Finite state machine state.
 * @name State.create
 * @methodOf Joint.dia.fsa
 * @param {Object} properties
 * @param {Object} properties.position Position of the State (e.g. {x: 50, y: 100}).
 * @param {Number} [properties.radius] Radius of the circle of the state.
 * @param {String} [properties.label] The name of the state.
 * @param {Number} [properties.labelOffsetX] Offset in x-axis of the label from the state circle origin.
 * @param {Number} [properties.labelOffsetY] Offset in y-axis of the label from the state circle origin.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the state.
 * @example
var s1 = Joint.dia.fsa.State.create({
  position: {x: 120, y: 70},
  label: "state 1",
  radius: 40,
  attrs: {
    stroke: "blue",
    fill: "yellow"
  }
});
 */
fsa.State = Element.extend({
    object: "State",
    module: "fsa",
    init: function(properties){
	// options
	var p = Joint.DeepSupplement(this.properties, properties, {
            position: point(0,0),
            radius: 30,
            label: 'State',
            labelOffsetX: 30/2,
            labelOffsetY: 30/2 + 8,
            attrs: { fill: 'white' }
        });
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
 * Finite state machine start state.
 * @name StartState.create
 * @methodOf Joint.dia.fsa
 * @param {Object} properties
 * @param {Object} properties.position Position of the start state (e.g. {x: 50, y: 100}).
 * @param {Number} [properties.radius] Radius of the circle of the start state.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the start state.
 * @example
var s0 = Joint.dia.fsa.StartState.create({
  position: {x: 120, y: 70},
  radius: 15,
  attrs: {
    stroke: "blue",
    fill: "yellow"
  }
});
 */
fsa.StartState = Element.extend({
     object: "StartState",
     module: "fsa",
     init: function(properties){
	 // options
         var p = Joint.DeepSupplement(this.properties, properties, {
             position: point(0,0),
             radius: 10,
             attrs: { fill: 'black' }
         });
	 // wrapper
	 this.setWrapper(this.paper.circle(p.position.x, p.position.y, p.radius).attr(p.attrs));
     }
});

/**
 * Finite state machine end state.
 * @name EndState.create
 * @methodOf Joint.dia.fsa
 * @param {Object} properties
 * @param {Object} properties.position Position of the end state (e.g. {x: 50, y: 100}).
 * @param {Number} [properties.radius] Radius of the circle of the end state.
 * @param {Number} [properties.innerRadius] Radius of the inner circle of the end state.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the end state.
 * @param {Object} [properties.innerAttrs] SVG attributes of the appearance of the inner circle of the end state.
 * @example
var s0 = Joint.dia.fsa.EndState.create({
  position: {x: 120, y: 70},
  radius: 15,
  innerRadius: 8,
  attrs: {
    stroke: "blue",
    fill: "yellow"
  },
  innerAttrs: {
    fill: "red"
  }
});
 */
fsa.EndState = Element.extend({
     object: "EndState",
     module: "fsa",
     init: function(properties){
	 // options
	 var p = Joint.DeepSupplement(this.properties, properties, {
             position: point(0,0),
             radius: 10,
             innerRadius: (properties.radius && (properties.radius / 2)) || 5,
             attrs: { fill: 'white' },
             innerAttrs: { fill: 'black' }
         });
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
