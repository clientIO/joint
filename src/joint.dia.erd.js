(function(global){	// BEGIN CLOSURE

var Joint = global.Joint,
     Element = Joint.dia.Element,
     point = Joint.point;

/**
 * @name Joint.dia.erd
 * @namespace Holds functionality related to Entity-relationship diagrams.
 */
var erd = Joint.dia.erd = {};

/**
 * Predefined arrow. You are free to use this arrow as the option parameter to joint method.
 * Implements Chen-style cardinality notation.
 * @name Joint.dia.erd.arrow
 * @memberOf Joint.dia.erd
 * @example
 * var arrow = Joint.dia.erd.arrow;
 */
erd.arrow = {
    startArrow: {type: 'none'},
    endArrow: {type: 'none'},
    attrs: {"stroke-dasharray": "none"}
};

erd.toMany = {
    startArrow: {type: 'none'},
    endArrow: {type: 'none'},
    attrs: {"stroke-dasharray": "none"},
    label: 'n',
    labelAttrs: { position: -10, offset: -10 }
};

erd.manyTo = {
    startArrow: {type: 'none'},
    endArrow: {type: 'none'},
    attrs: {"stroke-dasharray": "none"},
    label: 'n',
    labelAttrs: { position: 10, offset: -10 }
};

erd.toOne = {
    startArrow: {type: 'none'},
    endArrow: {type: 'none'},
    attrs: {"stroke-dasharray": "none"},
    label: '1',
    labelAttrs: { position: -10, offset: -10 }
};

erd.oneTo = {
    startArrow: {type: 'none'},
    endArrow: {type: 'none'},
    attrs: {"stroke-dasharray": "none"},
    label: '1',
    labelAttrs: { position: 10, offset: -10 }
};

erd.oneToMany = {
    startArrow: {type: 'none'},
    endArrow: {type: 'none'},
    attrs: {"stroke-dasharray": "none"},
    label: ['1', 'n'],
    labelAttrs: [ { position: 10, offset: -10 }, { position: -10, offset: -10 } ]
};

erd.manyToOne = {
    startArrow: {type: 'none'},
    endArrow: {type: 'none'},
    attrs: {"stroke-dasharray": "none"},
    label: ['n', '1'],
    labelAttrs: [ { position: 10, offset: -10 }, { position: -10, offset: -10 } ]
};


/**
 * ERD Entity and Weak Entity.
 * @methodOf Joint.dia.erd
 */
erd.Entity = Element.extend({
    object: 'Entity',
    module: 'erd',
    init: function(properties) {
        var p = Joint.DeepSupplement(this.properties, properties, {
            attrs: { fill: 'lightgreen', stroke: '#008e09', 'stroke-width': 2 },
            label: '',
            labelAttrs: { 'font-weight': 'bold' },
            labelOffsetX: 0,
            labelOffsetY: 0,
            shadow: true,
            weak: false,        // Weak Entity?
            padding: 5
        });
        this.setWrapper(this.paper.rect(p.rect.x, p.rect.y, p.rect.width, p.rect.height).attr(p.attrs));

        if (p.weak) {
            this.addInner(this.paper.rect(p.rect.x + p.padding, p.rect.y + p.padding, p.rect.width - 2*p.padding, p.rect.height - 2*p.padding).attr(p.attrs));
        }
        this.addInner(this.getLabelElement());
    },
    getLabelElement: function() {
	var p = this.properties,
	    bb = this.wrapper.getBBox(),
	    t = this.paper.text(bb.x + bb.width/2, bb.y + bb.height/2, p.label).attr(p.labelAttrs || {}),
	    tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX,
		    bb.y - tbb.y + p.labelOffsetY);
	return t;
    }
});

/**
 * ERD Relationship.
 * @methodOf Joint.dia.erd
 */
erd.Relationship = Element.extend({
    object: 'Relationship',
    module: 'erd',
    init: function(properties) {
        var p = Joint.DeepSupplement(this.properties, properties, {
            attrs: { rotation: 45, fill: 'lightblue', stroke: '#000d5b', 'stroke-width': 2 },
            label: '',
            labelOffsetX: 0,
            labelOffsetY: 0,
            labelAttrs: { 'font-weight': 'bold' }
        });
        this.setWrapper(this.paper.rect(p.rect.x, p.rect.y, p.rect.width, p.rect.height).attr(p.attrs));
        this.addInner(this.getLabelElement());
    },
    getLabelElement: function() {
	var p = this.properties,
	    bb = this.wrapper.getBBox(),
	    t = this.paper.text(bb.x + bb.width/2, bb.y + bb.height/2, p.label).attr(p.labelAttrs || {}),
	    tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX,
		    bb.y - tbb.y + p.labelOffsetY);
	return t;
    }
});

/**
 * ERD Attribute, Key Attribute, Multivalued Attribute and Derived Attribute.
 * @methodOf Joint.dia.erd
 */
erd.Attribute = Element.extend({
    object: 'Attribute',
    module: 'erd',
    init: function(properties) {
        var p = Joint.DeepSupplement(this.properties, properties, {
            attrs: { fill: 'red', opacity: (properties.primaryKey ? 0.8 : 0.5), 
                     stroke: '#5b0001', 'stroke-width': 2, 
                     'stroke-dasharray': (properties.derived ? '.' : 'none') },
            label: '',
            labelAttrs: { 'font-weight': 'bold' },
            labelOffsetX: 0,
            labelOffsetY: 0,
            multivalued: false,
            derived: false,
            padding: 5
        });
        this.setWrapper(this.paper.ellipse(p.ellipse.x, p.ellipse.y, p.ellipse.rx, p.ellipse.ry).attr(p.attrs));
        if (p.multivalued) {
            this.addInner(this.paper.ellipse(p.ellipse.x, p.ellipse.y, p.ellipse.rx - p.padding, p.ellipse.ry - p.padding).attr(p.attrs));
        }
        this.addInner(this.getLabelElement());
    },
    getLabelElement: function() {
	var p = this.properties,
	    bb = this.wrapper.getBBox(),
	    t = this.paper.text(bb.x + bb.width/2, bb.y + bb.height/2, p.label).attr(p.labelAttrs || {}),
	    tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX,
		    bb.y - tbb.y + p.labelOffsetY);
	return t;
    }
});

})(this);	// END CLOSURE
