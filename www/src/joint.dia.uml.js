(function(global){	// BEGIN CLOSURE

var Joint = global.Joint,
     Element = Joint.dia.Element,
     point = Joint.point;

/**
 * @name Joint.dia.uml
 * @namespace Holds functionality related to UML diagrams.
 */
var uml = Joint.dia.uml = {};

Joint.arrows.aggregation = function(size){
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

/**
 * Predefined aggregation arrow for Class diagram.
 * @name aggregationArrow
 * @memberOf Joint.dia.uml
 * @example c1.joint(c2, Joint.dia.uml.aggregationArrow);
 */
uml.aggregationArrow = {
  endArrow: { type: "aggregation" },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none" }
};
/**
 * Predefined dependency arrow for Class diagram.
 * @name dependencyArrow
 * @memberOf Joint.dia.uml
 * @example c1.joint(c2, Joint.dia.uml.dependencyArrow);
 */
uml.dependencyArrow = {
  endArrow: { type: "basic", size: 5 },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none" }
};
/**
 * Predefined generalization arrow for Class diagram.
 * @name generalizationArrow
 * @memberOf Joint.dia.uml
 * @example c1.joint(c2, Joint.dia.uml.generalizationArrow);
 */
uml.generalizationArrow = {
  endArrow: { type: "basic", size: 10, attrs: {fill: "white"} },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none" }
};
/**
 * Predefined arrow for StateChart.
 * @name Joint.dia.uml.arrow
 * @memberOf Joint.dia.uml
 * @example s1.joint(s2, Joint.dia.uml.arrow);
 */
uml.arrow = {
    startArrow: {type: "none"},
    endArrow: {type: "basic", size: 5},
    attrs: {"stroke-dasharray": "none"}
};

/**
 * UML StateChart state.
 * @name State.create
 * @methodOf Joint.dia.uml
 * @param {Object} properties
 * @param {Object} properties.rect Bounding box of the State (e.g. {x: 50, y: 100, width: 100, height: 80}).
 * @param {Number} [properties.radius] Radius of the corners of the state rectangle.
 * @param {String} [properties.label] The name of the state.
 * @param {Number} [properties.labelOffsetX] Offset in x-axis of the label from the state rectangle origin.
 * @param {Number} [properties.labelOffsetY] Offset in y-axis of the label from the state rectangle origin.
 * @param {Number} [properties.swimlaneOffsetY] Offset in y-axis of the swimlane shown after the state label.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the state.
 * @param {Object} [properties.actions] Actions of the state.
 * @param {String} [properties.actions.entry] Entry action of the state.
 * @param {String} [properties.actions.exit] Exit action of the state.
 * @param {array} [properties.actions.inner] Actions of the state (e.g. ["Evt1", "Action1()", "Evt2", "Action2()"])
 * @param {Number} [properties.actionsOffsetX] Offset in x-axis of the actions.
 * @param {Number} [properties.actionsOffsetY] Offset in y-axis of the actions.
 * @example
var s1 = Joint.dia.uml.State.create({
  rect: {x: 120, y: 70, width: 100, height: 60},
  label: "state 1",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()",
    inner: ["Evt1", "foo()", "Evt2", "bar()"]
  }
});
 */
uml.State = Element.extend({
    object: "State",
    module: "uml",
    init: function(properties){
	// options
        var p = Joint.DeepSupplement(this.properties, properties, {
            radius: 15,
            attrs: { fill: 'white' },
            label: '',
            labelOffsetX: 20,
            labelOffsetY: 5,
            swimlaneOffsetY: 18,
            actions: {
                entry: null,
                exit: null,
                inner: []
            },
            actionsOffsetX: 5,
            actionsOffsetY: 5
        });
	// wrapper
	this.setWrapper(this.paper.rect(p.rect.x, p.rect.y, p.rect.width, p.rect.height, p.radius).attr(p.attrs));
	// inner
	this.addInner(this.getLabelElement());
	this.addInner(this.getSwimlaneElement());
	this.addInner(this.getActionsElement());
    },
    getLabelElement: function(){
	var
	p = this.properties,
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x, bb.y, p.label).attr(p.labelAttrs || {}),
	tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX,
		    bb.y - tbb.y + p.labelOffsetY);
	return t;
    },
    getSwimlaneElement: function(){
	var bb = this.wrapper.getBBox(), p = this.properties;
	return this.paper.path(["M", bb.x, bb.y + p.labelOffsetY + p.swimlaneOffsetY, "L", bb.x + bb.width, bb.y + p.labelOffsetY + p.swimlaneOffsetY].join(" "));
    },
    getActionsElement: function(){
	// collect all actions
	var p = this.properties;
	var str = (p.actions.entry) ? "entry/ " + p.actions.entry + "\n" : "";
	str += (p.actions.exit) ? "exit/ " + p.actions.exit + "\n" : "";
	var l = p.actions.inner.length;
	for (var i = 0; i < l; i += 2){
	    str += p.actions.inner[i] + "/ " + p.actions.inner[i+1] + "\n";
	}
	// trim
	str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

	// draw text with actions
	var
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x + p.actionsOffsetX, bb.y + p.labelOffsetY + p.swimlaneOffsetY + p.actionsOffsetY, str),
	tbb = t.getBBox();
	t.attr("text-anchor", "start");
	t.translate(0, tbb.height/2);	// tune the y position
	return t;
    },
    zoom: function(){
	this.wrapper.attr("r", this.properties.radius); 	// set wrapper's radius back to its initial value (it deformates after scaling)
	this.shadow && this.shadow.attr("r", this.properties.radius); 	// update shadow as well if there is one 
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
 * @name StartState.create
 * @methodOf Joint.dia.uml
 * @param {Object} properties
 * @param {Object} properties.position Position of the start state (e.g. {x: 50, y: 100}).
 * @param {Number} [properties.radius] Radius of the circle of the start state.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the start state.
 * @example
var s0 = Joint.dia.uml.StartState.create({
  position: {x: 120, y: 70},
  radius: 15,
  attrs: {
    stroke: "blue",
    fill: "yellow"
  }
});
 */
uml.StartState = Element.extend({
     object: "StartState",
     module: "uml",
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
 * UML StateChart end state.
 * @name EndState.create
 * @methodOf Joint.dia.uml
 * @param {Object} properties
 * @param {Object} properties.position Position of the end state (e.g. {x: 50, y: 100}).
 * @param {Number} [properties.radius] Radius of the circle of the end state.
 * @param {Number} [properties.innerRadius] Radius of the inner circle of the end state.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the end state.
 * @param {Object} [properties.innerAttrs] SVG attributes of the appearance of the inner circle of the end state.
 * @example
var s0 = Joint.dia.uml.EndState.create({
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
uml.EndState = Element.extend({
     object: "EndState",
     module: "uml",
     init: function(properties){
	 // options
	 var p = Joint.DeepSupplement(this.properties, properties, {
             position: point(0,0),
             radius: 10,
             innerRadius: (properties.radius && properties.radius / 2) || 5,
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


/**
 * UML StateChart class.
 * @name Class.create
 * @methodOf Joint.dia.uml
 * @param {Object} properties
 * @param {Object} properties.rect Bounding box of the Class (e.g. {x: 50, y: 100, width: 100, height: 80}).
 * @param {String} [properties.label] The name of the class.
 * @param {Number} [properties.labelOffsetX] Offset in x-axis of the label from the class rectangle origin.
 * @param {Number} [properties.labelOffsetY] Offset in y-axis of the label from the class rectangle origin.
 * @param {Number} [properties.swimlane1OffsetY] Offset in y-axis of the swimlane shown after the class label.
 * @param {Number} [properties.swimlane2OffsetY] Offset in y-axis of the swimlane shown after the class attributes.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the state.
 * @param {array} [properties.attributes] Attributes of the class.
 * @param {array} [properties.methods] Methods of the class.
 * @param {Number} [properties.attributesOffsetX] Offset in x-axis of the attributes.
 * @param {Number} [properties.attributesOffsetY] Offset in y-axis of the attributes.
 * @param {Number} [properties.methodsOffsetX] Offset in x-axis of the methods.
 * @param {Number} [properties.methodsOffsetY] Offset in y-axis of the methods.
 * @example
var c1 = Joint.dia.uml.Class.create({
  rect: {x: 120, y: 70, width: 120, height: 80},
  label: "MyClass",
  attrs: {
    fill: "90-#000-yellow:1-#fff"
  },
  attributes: ["-position"],
  methods: ["+createIterator()"]
});
 */
uml.Class = Element.extend({
    object: "Class",
    module: "uml",
    init: function(properties){
	var p = Joint.DeepSupplement(this.properties, properties, {
            attrs: { fill: 'white' },
            label: '',
            labelOffsetX: 20,
            labelOffsetY: 5,
            swimlane1OffsetY: 18,
            swimlane2OffsetY: 18,
            attributes: [],
            attributesOffsetX: 5,
            attributesOffsetY: 5,
            methods: [],
            methodsOffsetX: 5,
            methodsOffsetY: 5
        });
	// wrapper
	this.setWrapper(this.paper.rect(p.rect.x, p.rect.y, p.rect.width, p.rect.height).attr(p.attrs));
	// inner
	this.addInner(this.getLabelElement());
	this.addInner(this.getSwimlane1Element());
	this.addInner(this.getAttributesElement());
	this.addInner(this.getSwimlane2Element());
	this.addInner(this.getMethodsElement());
    },
    getLabelElement: function(){
	var
	p = this.properties,
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x, bb.y, p.label).attr(p.labelAttrs || {}),
	tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX, bb.y - tbb.y + p.labelOffsetY);
	return t;
    },
    getSwimlane1Element: function(){
	var bb = this.wrapper.getBBox(), p = this.properties;
	return this.paper.path(["M", bb.x, bb.y + p.labelOffsetY + p.swimlane1OffsetY, "L", bb.x + bb.width, bb.y + p.labelOffsetY + p.swimlane1OffsetY].join(" "));
    },
    getSwimlane2Element: function(){
	var
	p = this.properties,
	bb = this.wrapper.getBBox(),
	bbAtrrs = this.inner[2].getBBox();  // attributes
	return this.paper.path(["M", bb.x, bb.y + p.labelOffsetY + p.swimlane1OffsetY + bbAtrrs.height + p.swimlane2OffsetY, "L", bb.x + bb.width, bb.y + p.labelOffsetY + p.swimlane1OffsetY + bbAtrrs.height + p.swimlane2OffsetY].join(" "));
    },
    getAttributesElement: function(){
	var str = " ", p = this.properties;
	for (var i = 0, len = p.attributes.length; i < len; i++){
	    str += p.attributes[i] + "\n";
	}
	// trim
	str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

	var
	bb = this.wrapper.getBBox(),
	t = this.paper.text(bb.x + p.attributesOffsetX, bb.y + p.labelOffsetY + p.swimlane1OffsetY + p.attributesOffsetY, str),
	tbb = t.getBBox();
	t.attr("text-anchor", "start");
	t.translate(0, tbb.height/2);	// tune the y-position
	return t;
    },
    getMethodsElement: function(){
	var str = " ", p = this.properties;
	for (var i = 0, len = p.methods.length; i < len; i++){
	    str += p.methods[i] + "\n";
	}
	// trim
	str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    	var
	bb = this.wrapper.getBBox(),
	bbAtrrs = this.inner[2].getBBox(),  // attributes
	t = this.paper.text(bb.x + p.methodsOffsetX, bb.y + p.labelOffsetY + p.swimlane1OffsetY + p.attributesOffsetY + bbAtrrs.height + p.swimlane2OffsetY + p.methodsOffsetY, str),
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