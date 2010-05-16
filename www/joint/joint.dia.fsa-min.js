/**
 * Joint 0.2.0 - JavaScript diagramming library.
 * Copyright (c) David Durman 2009 - 2010 
 * Licensed under the MIT license: (http://www.opensource.org/licenses/mit-license.php)
 */

(function(global){var Joint=global.Joint,Element=Joint.dia.Element,point=Joint.point;var fsa=Joint.dia.fsa={};fsa.arrow={startArrow:{type:"none"},endArrow:{type:"basic",size:5},attrs:{"stroke-dasharray":"none"}};fsa.State=Element.extend({object:"State",module:"fsa",init:function(properties){var p=this.properties;p.position=properties.position||point(0,0);p.radius=properties.radius||30;p.label=properties.label||"State";p.labelOffsetX=properties.labelOffsetX||(p.radius/2);p.labelOffsetY=properties.labelOffsetY||(p.radius/2+8);p.attrs=properties.attrs||{};if(!p.attrs.fill){p.attrs.fill="white";}
this.setWrapper(this.paper.circle(p.position.x,p.position.y,p.radius).attr(p.attrs));this.addInner(this.getLabelElement());},getLabelElement:function(){var
p=this.properties,bb=this.wrapper.getBBox(),t=this.paper.text(bb.x,bb.y,p.label),tbb=t.getBBox();t.translate(bb.x-tbb.x+p.labelOffsetX,bb.y-tbb.y+p.labelOffsetY);return t;}});fsa.StartState=Element.extend({object:"StartState",module:"fsa",init:function(properties){var p=this.properties;p.position=properties.position||point(0,0);p.radius=properties.radius||10;p.attrs=properties.attrs||{};if(!p.attrs.fill){p.attrs.fill="black";}
this.setWrapper(this.paper.circle(p.position.x,p.position.y,p.radius).attr(p.attrs));}});fsa.EndState=Element.extend({object:"EndState",module:"fsa",init:function(properties){var p=this.properties;p.position=properties.position||point(0,0);p.radius=properties.radius||10;p.innerRadius=properties.innerRadius||(p.radius/2);p.attrs=properties.attrs||{};if(!p.attrs.fill){p.attrs.fill="white";}
p.innerAttrs=properties.innerAttrs||{};if(!p.innerAttrs.fill){p.innerAttrs.fill="black";}
this.setWrapper(this.paper.circle(p.position.x,p.position.y,p.radius).attr(p.attrs));this.addInner(this.paper.circle(p.position.x,p.position.y,p.innerRadius).attr(p.innerAttrs));},zoom:function(){this.inner[0].scale.apply(this.inner[0],arguments);}});})(this);