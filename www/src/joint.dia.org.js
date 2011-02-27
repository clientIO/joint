(function(global){	// BEGIN CLOSURE

var Joint = global.Joint,
     Element = Joint.dia.Element,
     point = Joint.point;

/**
 * @name Joint.dia.org
 * @namespace Holds functionality related to Org-charts.
 */
var org = Joint.dia.org = {};

/**
 * Predefined arrow. You are free to use this arrow as the option parameter to joint method.
 * @name arrow
 * @memberOf Joint.dia.org
 * @example
 * var arrow = Joint.dia.org.arrow;
 */
org.arrow = {
    startArrow: {type: 'none'},
    endArrow: {type: 'none'},
    attrs: {"stroke-dasharray": "none", 'stroke-width': 2, stroke: 'gray' }
};


/**
 * Organizational chart member.
 * @methodOf Joint.dia.org
 */
org.Member = Element.extend({
    object: 'Member',
    module: 'org',
    init: function(properties) {
        var p = Joint.DeepSupplement(this.properties, properties, {
            attrs: { fill: 'lightgreen', stroke: '#008e09', 'stroke-width': 2 },
            name: '',
            position: '',
            nameAttrs: { 'font-weight': 'bold' },
            positionAttrs: {},
            swimlaneAttrs: { 'stroke-width': 1, stroke: 'black' },
            labelOffsetY: 10,
            radius: 10,
            shadow: true,
            avatar: '',
            padding: 5
        });
        this.setWrapper(this.paper.rect(p.rect.x, p.rect.y, p.rect.width, p.rect.height, p.radius).attr(p.attrs));
        if (p.avatar) {
            this.addInner(this.paper.image(p.avatar, p.rect.x + p.padding, p.rect.y + p.padding, p.rect.height - 2*p.padding, p.rect.height - 2*p.padding));
            p.labelOffsetX = p.rect.height;
        }
        if (p.position) {
            var positionElement = this.getPositionElement();
            this.addInner(positionElement[0]);
            this.addInner(positionElement[1]);      // swimlane
        }
        this.addInner(this.getNameElement());
    },
    getPositionElement: function() {
	var p = this.properties,
	    bb = this.wrapper.getBBox(),
	    t = this.paper.text(bb.x + bb.width/2, bb.y + bb.height/2, p.position).attr(p.positionAttrs || {}),
	    tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX, bb.y - tbb.y + tbb.height);
        tbb = t.getBBox();
        var l = this.paper.path(['M', tbb.x, tbb.y + tbb.height + p.padding, 
                                 'L', tbb.x + tbb.width, tbb.y + tbb.height + p.padding].join(' '));
	return [t, l];
    },
    getNameElement: function() {
	var p = this.properties,
	    bb = this.wrapper.getBBox(),
	    t = this.paper.text(bb.x + bb.width/2, bb.y + bb.height/2, p.name).attr(p.nameAttrs || {}),
	    tbb = t.getBBox();
	t.translate(bb.x - tbb.x + p.labelOffsetX, bb.y - tbb.y + tbb.height*2 + p.labelOffsetY);
	return t;
    }
});

})(this);	// END CLOSURE
