(function(global){	// BEGIN CLOSURE

var Joint = global.Joint,
     Element = Joint.dia.Element,
     point = Joint.point;

/**
 * @name Joint.dia.cdm
 * @namespace Holds functionality related to Conceptual Data Model (CDM) and Logical Data Model (LDM) diagrams.
 * CDMs and LDMs serve different purposes, but entity attributes are likely only to be displayed in a Logical Data Model.
 * Relationship lines in a CDM often display labels for the member roles; this feature is not implemented.
 */
var cdm = Joint.dia.cdm = {};

Joint.arrows.crowfoot = function(size) {
    size = size || 2;
    return {
	path: ["M",(4*size).toString(),4*size.toString(),
               "L",(-4*size).toString(),'0',
               "L",(4*size).toString(),'0',
               "M",(-4*size).toString(),'0',
               "L",(4*size).toString(),(-size*4).toString()],
        dx: 4*size,
        dy: 4*size,
        attrs: {
            stroke: '#800040',
            fill: 'none',
            'stroke-width': 1.0
        }
    };
};

Joint.arrows.crowfootdashed = function(size) {
    size = size || 2;
    return {
	path: ["M",(4*size).toString(),4*size.toString(),
               "L",(-4*size).toString(),'0',
               "L",(size/4).toString(),'0',"M",(2*size).toString(),'0',"L",(4*size).toString(),'0',
               "M",(-4*size).toString(),'0',
               "L",(4*size).toString(),(-size*4).toString()],
        dx: 4*size,
        dy: 4*size,
        attrs: {
            stroke: '#800040',
            fill: 'white',
            'stroke-width': 1.0
        }
    };
};



/**
 * The following relationship lines are solid for their entire length, indicating each member is mandatory.
  * Below this set are similar lines when both members are optional.
  * Below that relationships with both optional and mandatory members will eventually be added.
  */



/**
 * Predefined crow's foot line ending for a one-to-many relationship connecting two entities. 
 * Both are mandatory.
 * @name oneToMany
 * @memberOf Joint.dia.cdm
 * @example c1.joint(c2, Joint.dia.cdm.oneToMany);
 */

cdm.oneToMany = {
  endArrow: { type: "crowfoot" },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "none", stroke:"#800040" }
};


/**
 * Predefined crow's foot line ending for a many-to-one relationship connecting two entities.
 * Both are mandatory.
 * @name manyToOne
 * @memberOf Joint.dia.cdm
 * @example c1.joint(c2, Joint.dia.cdm.manyToOne);
 */

cdm.manyToOne = {
    startArrow: {type: "crowfoot"},
    endArrow: {type: "none"},
    attrs: {"stroke-dasharray": "none", stroke:"#800040"}
};

/**
 * Predefined crow's foot line endings on both ends, indicating a many-to-many relationship connecting two entities.
 * Both are mandatory.
 * @name manyToMany
 * @memberOf Joint.dia.cdm
 * @example c1.joint(c2, Joint.dia.cdm.manyToMany);
 */

cdm.manyToMany = {
    startArrow: {type: "crowfoot"},
    endArrow: {type: "crowfoot"},
    attrs: {"stroke-dasharray": "none", stroke:"#800040"}
};

/**
 * Predefined one-to-one relationship line.
 * Both are mandatory.
 * @name plain
 * @memberOf Joint.dia.cdm
 * @example s1.joint(s2, Joint.dia.cdm.plain);
 */

cdm.plain = {
    startArrow: {type: "none"},
    endArrow: {type: "none"},
    attrs: {"stroke-dasharray": "none", stroke:"#800040"}
};


/**
 * Predefined arrow similar to that in UML, in case that script isn't loaded. This produces a solid line for the length of the arrow.
 * @name Joint.dia.cdm.arrow
 * @memberOf Joint.dia.cdm
 * @example s1.joint(s2, Joint.dia.cdm.arrow);
 */
cdm.arrow = {
    startArrow: {type: "none"},
    endArrow: {type: "basic", size: 5, attrs:{fill:"#800040", stroke:"#800040"}},
    attrs: {"stroke-dasharray": "none", stroke:"#800040"}
};



/**
 * The following relationship lines use dashes, indicating each member is optional.
  * Above this set are similar definitions for mandatory members.
  * Below this set similar definitions for relationships with both mandatory and optional members will eventually be added.
  */


/**
 * Predefined crow's foot line ending for a one-to-many relationship connecting two entities.
 * Both are optional.
 * @name oneToManyDashes
 * @memberOf Joint.dia.cdm
 * @example c1.joint(c2, Joint.dia.cdm.oneToManySashes);
 */

cdm.oneToManyDashes = {
  endArrow: { type: "crowfootdashed" },
  startArrow: {type: "none"},
  attrs: { "stroke-dasharray": "--", stroke:"#800040" }
};


/**
 * Predefined crow's foot line ending for a many-to-one relationship connecting two entities.
 * Both are optional.
 * @name manyToOneDashes
 * @memberOf Joint.dia.cdm
 * @example c1.joint(c2, Joint.dia.cdm.manyToOneDashes);
 */

cdm.manyToOneDashes = {
    startArrow: {type: "crowfootdashed"},
    endArrow: {type: "none"},
    attrs: {"stroke-dasharray": "--", stroke:"#800040"}
};

/**
 * Predefined crow's foot line endings on both ends, indicating a many-to-many relationship connecting two entities.
 * Both are optional.
 * @name manyToManyDashes
 * @memberOf Joint.dia.cdm
 * @example c1.joint(c2, Joint.dia.cdm.manyToManyDashes);
 */
cdm.manyToManyDashes = {
    startArrow: {type: "crowfoot"},
    endArrow: {type: "crowfoot"},
    attrs: {"stroke-dasharray": "-- ", stroke:"#800040"}
};

/**
 * This is an example showing styling subpaths of connections.
 */
cdm.exampleArrow = {
    startArrow: {type: "crowfoot"},
    endArrow: {type: "crowfootdashed"},
    attrs: {"stroke-dasharray": "--", stroke:"#800040"},
    subConnectionAttrs: [ 
        {from: 1.1, to: 1/2, 'stroke-dasharray': 'none', stroke: '#800040'}
    ],
    label: ['many', 'many'],
    labelAttrs: [
        {position: 20, offset: -10},
        {position: -20, offset: -10}
    ]
};

/**
 * Predefined one-to-one relationship line.
 * Both are optional.
 * @name dashes
 * @memberOf Joint.dia.cdm
 * @example s1.joint(s2, Joint.dia.cdm.plain);
 */

cdm.dashes = {
    startArrow: {type: "none"},
    endArrow: {type: "none"},
    attrs: {"stroke-dasharray": "--", stroke:"#800040"}
};

/**
 * CDM EntityChart.
 * @name Entity.create
 * @methodOf Joint.dia.cdm
 * @param {Object} properties
 * @param {Object} properties.rect Bounding box of the Entity (e.g. {x: 50, y: 100, width: 100, height: 80}).
 * @param {Number} [properties.radius] Radius of the corners of the entity rectangle.
 * @param {String} [properties.label] The name of the entity.
 * @param {Number} [properties.labelOffsetX] Offset in x-axis of the label from the entity rectangle origin.
 * @param {Number} [properties.labelOffsetY] Offset in y-axis of the label from the entity rectangle origin.
 * @param {Object} [properties.attrs] SVG attributes of the appearance of the entity. 
 * @param {String} [properties.entityAttributes] Attributes of the entity.
 * @param {Number} [properties.attributesOffsetX] Offset in x-axis of the attributes.
 * @param {Number} [properties.attributesOffsetY] Offset in y-axis of the attributes.
 * @example
var s1 = Joint.dia.cdm.Entity.create({
  rect: {x: 120, y: 70, width: 100, height: 60},
  label: "state 1",
  attrs: {
    fill: "315-#fff-#808000"
  },
  entityAttributes: {
    entry: "init()",
    exit: "destroy()",
    inner: ["Evt1", "foo()", "Evt2", "bar()"]
  }
});
 */
cdm.Entity = Element.extend({
    object: "Entity",
    module: "cdm",
    init: function(properties){
	// options
	var p = Joint.DeepSupplement(this.properties, properties, {
            radius: 10,
            attrs: { fill: 'white' },
            label: '',
            labelOffsetX: 20,
            labelOffsetY: 5,
            actions: {
                entry: null,
                exit: null,
                inner: []
            },
            attributesOffsetX: 5,
            attributesOffsetY: 5
        });
	// wrapper
	this.setWrapper(this.paper.rect(p.rect.x, p.rect.y, p.rect.width, p.rect.height, p.radius).attr(p.attrs));
	// inner
	this.addInner(this.getLabelElement());
	this.addInner(this.getAttributesElement());

    },
    getLabelElement: function(){
	var p = this.properties,
	    bb = this.wrapper.getBBox(),
	    t = this.paper.text(bb.x, bb.y, p.label).attr(p.labelAttrs || {}),
	    tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX, bb.y - tbb.y + p.labelOffsetY);
	return t;
    },
    getAttributesElement: function(){
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
	var bb = this.wrapper.getBBox(),
	    t = this.paper.text(bb.x + p.attributesOffsetX, bb.y + p.labelOffsetY + p.attributesOffsetY, str),
	    tbb = t.getBBox();
	t.attr("text-anchor", "start");
	t.translate(0, tbb.height/2);	// tune the y position
	return t;
    },
    zoom: function(){
	this.wrapper.attr("r", this.properties.radius); 	// set wrapper's radius back to its initial value (it deformates after scaling)
	this.shadow && this.shadow.attr("r", this.properties.radius); 	// update shadow as well if there is one 
	this.inner[0].remove();	// label
	this.inner[1].remove();	// entityAttributes
	this.inner[0] = this.getLabelElement();
	this.inner[1] = this.getAttributesElement();
    }
});



})(this);	// END CLOSURE