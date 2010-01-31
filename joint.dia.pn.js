/**************************************************
 * PN
 **************************************************/

var pn = Joint.dia.pn = {};
var Element = Joint.dia.Element;

/**
 * Predefined arrow.
 */
pn.arrow = {
    startArrow: {type: "basic"},
    endArrow: {type: "basicArrow", size: 5}, 
    attrs: {"stroke-dasharray": "none"}
};

/**
 * Petri net place.
 * @param raphael raphael paper
 * @param p point position
 * @param r radius
 * @param rToken radius of my tokens
 * @param nTokens number of tokens
 * @param attrs shape SVG attributes
 */
pn.place = Element.extend({
     init: function(properties){
	 // options
	 var position = this.position = properties.position;
	 var radius = this.radius = properties.radius || 20;
	 var tokenRadius = this.tokenRadius = properties.tokenRadius || 3;
	 var tokens = this.tokens = properties.tokens || 0;
	 var label = this.label = properties.label;
	 var attrs = this.attrs = properties.attrs || {};
	 if (!attrs.fill){
	     attrs.fill = "white";
	 }
	 var tokenAttrs = this.tokenAttrs = properties.tokenAttrs || {};
	 if (!tokenAttrs.fill){
	     tokenAttrs.fill = "black";
	 }
	 // wrapper
	 var paper = this.paper;
	 this.setWrapper(paper.circle(position.x, position.y, radius).attr(attrs));
	 // inner
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
	     this.addInner(paper.circle(position.x - (tokenRadius * 2), position.y, tokenRadius).attr(tokenAttrs));
	     this.addInner(paper.circle(position.x + (tokenRadius * 2), position.y, tokenRadius).attr(tokenAttrs));
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
	     this.inner[this.inner.length - 1] = this.paper.text(bb.x, bb.y, this.label);
	     this.inner[this.inner.length - 1].translate(0, -this.inner[this.inner.length - 1].getBBox().height);
	 }
     }
});

/**
 * Petri net event.
 * @param raphael raphael paper
 * @param r rectangle
 * @param attrs shape SVG attributes
 */
pn.event = Element.extend({
     init: function(properties){
	 // options
	 var rect = this.rect = properties.rect;
	 var attrs = this.attrs = properties.attrs || {};
	 if (!attrs.fill){ attrs.fill = "black"; }
	 if (!attrs.stroke){ attrs.stroke = "black"; }
	 var label = this.label = properties.label;
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
	     this.inner[0] = this.paper.text(bb.x, bb.y, this.label);
	     this.inner[0].translate(0, -this.inner[0].getBBox().height);
	 }
     }
});

