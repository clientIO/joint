/**
 * Joint 0.2.0 - JavaScript diagramming library.
 * Copyright (c) David Durman 2009 - 2010 
 * Licensed under the MIT license: (http://www.opensource.org/licenses/mit-license.php)
 */

(function(global){var Joint=global.Joint;var point=Joint.point;var rect=Joint.rect;var dia=Joint.dia={_currentDrag:false,_currentZoom:false,_registeredObjects:{},_registeredJoints:{},Joint:function(args){var j=Joint.apply(null,arguments);this.registerJoint(j);return j;},register:function(obj){var paper=Joint.paper();(this._registeredObjects[paper]||(this._registeredObjects[paper]=[])).push(obj);},registerJoint:function(j){var paper=Joint.paper();(this._registeredJoints[paper]||(this._registeredJoints[paper]=[])).push(j);}};var Element=dia.Element=function(){};var Mixin=Joint.Mixin=function(){var target=arguments[0];for(var i=1,l=arguments.length;i<l;i++){var extension=arguments[i];for(var key in extension){if(!extension.hasOwnProperty(key)){continue;}
var copy=extension[key];if(copy===target[key]){continue;}
if(typeof copy=="function"&&typeof target[key]=="function"&&!copy.base){copy.base=target[key];}
target[key]=copy;}}
return target;};var Supplement=Joint.Supplement=function(){var target=arguments[0];for(var i=1,l=arguments.length;i<l;i++){var extension=arguments[i];for(var key in extension){var copy=extension[key];if(copy===target[key]){continue;}
if(typeof copy=="function"&&typeof target[key]=="function"&&!target[key].base){target[key].base=copy;}
if(!target.hasOwnProperty(key)&&extension.hasOwnProperty(key)){target[key]=copy;}}}
return target;};Element.create=function(properties){var instance=new this(properties);if(instance.init){instance.init(properties);}
return instance;};Element.extend=function(prototype){var C=prototype.constructor=function(properties){this.construct(properties);};C.base=this;var proto=C.prototype=new this();Mixin(proto,prototype);Supplement(C,this);return C;};Element.prototype={parentElement:null,toolbox:null,_isElement:true,lastScaleX:1.0,lastScaleY:1.0,dx:undefined,dy:undefined,origBBox:undefined,construct:function(properties){this.properties={dx:0,dy:0,rot:0,sx:1.0,sy:1.0,module:this.module,object:this.object,parent:properties.parent};this.wrapper=null;this.inner=[];this.ghostAttrs={opacity:0.5,"stroke-dasharray":"-",stroke:"black"};this._opt={draggable:true,ghosting:false,toolbox:false};this.paper=Joint.paper();dia.register(this);},euid:function(){return Joint.generateEuid.call(this);},joints:function(){return this.wrapper.joints();},updateJoints:function(){var joints=this.wrapper.joints();if(joints){for(var i=0,l=joints.length;i<l;i++){joints[i].update();}}},toggleGhosting:function(){this._opt.ghosting=!this._opt.ghosting;return this;},createGhost:function(){var
wa=this.wrapper.attrs,paper=this.wrapper.paper;switch(this.wrapper.type){case"rect":this.ghost=paper.rect(wa.x,wa.y,wa.width,wa.height,wa.r);break;case"circle":this.ghost=paper.circle(wa.cx,wa.cy,wa.r);break;case"ellipse":this.ghost=paper.ellipse(wa.cx,wa.cy,wa.rx,wa.ry);break;default:break;}
this.ghost.attr(this.ghostAttrs);},objPos:function(objname){switch(this[objname].type){case"rect":return point(this[objname].attr("x"),this[objname].attr("y"));case"circle":case"ellipse":return point(this[objname].attr("cx"),this[objname].attr("cy"));default:break;}},wrapperPos:function(){return this.objPos("wrapper");},ghostPos:function(){return this.objPos("ghost");},toFront:function(){this.wrapper&&this.wrapper.toFront();for(var i=0,len=this.inner.length;i<len;i++)
this.inner[i].toFront();return this;},toBack:function(){for(var i=this.inner.length-1;i<=0;--i)
this.inner[i].toBack();this.wrapper&&this.wrapper.toBack();return this;},dragger:function(e){dia._currentDrag=this.wholeShape;if(dia._currentDrag._opt.ghosting){dia._currentDrag.createGhost();dia._currentDrag.ghost.toFront();}else
dia._currentDrag.toFront();dia._currentDrag.removeToolbox();dia._currentDrag.translate(1,1);dia._currentDrag.dx=e.clientX;dia._currentDrag.dy=e.clientY;e.preventDefault&&e.preventDefault();},zoomer:function(e){dia._currentZoom=this;dia._currentZoom.toFront();dia._currentZoom.removeToolbox();var bb=rect(dia._currentZoom.origBBox);dia._currentZoom.dx=e.clientX;dia._currentZoom.dy=e.clientY;dia._currentZoom.dWidth=bb.width*dia._currentZoom.lastScaleX;dia._currentZoom.dHeight=bb.height*dia._currentZoom.lastScaleY;e.preventDefault&&e.preventDefault();},translate:function(dx,dy){this.properties.dx+=dx;this.properties.dy+=dy;this.wrapper.translate(dx,dy);for(var i=this.inner.length-1;i>=0;--i){this.inner[i].translate(dx,dy);}
this.translateToolbox(dx,dy);},setWrapper:function(s){this.wrapper=s;this.wrapper.wholeShape=this;this.type=this.wrapper.type;this.origBBox=this.wrapper.getBBox();if(this._opt&&this._opt.draggable){this.wrapper.mousedown(this.dragger);this.wrapper.node.style.cursor="move";}
if(!this.wrapper.joints){this.wrapper._joints=[];this.wrapper.joints=function(){return this._joints;};}
this.addToolbox();return this;},addInner:function(s){this.inner.push(s);s.wholeShape=this;s.parentElement=this;if(s._isElement)s.properties.parent=this.euid();if(!s._isElement&&this._opt&&this._opt.draggable){s.mousedown(this.dragger);s.node.style.cursor="move";}
s.toFront();return this;},delInner:function(s){var
i=0,len=this.inner.length;for(;i<len;i++)
if(this.inner[i]==s)
break;if(i<len){this.inner.splice(i,1);s.parentElement=null;if(s._isElement)s.properties.parent=undefined;}
return this;},addToolbox:function(){if(!this._opt.toolbox){return this;}
var
self=this,bb=this.wrapper.getBBox(),tx=bb.x-10,ty=bb.y-10;this.toolbox=[];this.toolbox.push(this.paper.rect(tx,ty,33,11,5).attr({fill:"white"}));this.toolbox.push(this.paper.image("../mint_icons/icons/search.png",tx,ty,11,11));this.toolbox[this.toolbox.length-1].toFront();Joint.addEvent(this.toolbox[this.toolbox.length-1].node,"mousedown",function(e){dia.Element.prototype.zoomer.apply(self,[e]);});this.toolbox.push(this.paper.image("../mint_icons/icons/page_spearmint_up.png",tx+22,ty,11,11));this.toolbox[this.toolbox.length-1].toFront();this.toolbox[this.toolbox.length-1].node.onclick=function(){self.embed()};this.toolbox.push(this.paper.image("../mint_icons/icons/page_spearmint_down.png",tx+11,ty,11,11));this.toolbox[this.toolbox.length-1].toFront();this.toolbox[this.toolbox.length-1].node.onclick=function(){self.unembed()};return this;},removeToolbox:function(){if(this.toolbox)
for(var i=this.toolbox.length-1;i>=0;--i)
this.toolbox[i].remove();this.toolbox=null;return this;},toggleToolbox:function(){this._opt.toolbox=!this._opt.toolbox;if(this._opt.toolbox){this.addToolbox();}else{this.removeToolbox();}
return this;},translateToolbox:function(dx,dy){if(this.toolbox)
for(var i=this.toolbox.length-1;i>=0;--i)
this.toolbox[i].translate(dx,dy);},embed:function(){var
ros=dia._registeredObjects[this.paper],myBB=rect(this.wrapper.getBBox()),embedTo=null;for(var i=0,len=ros.length;i<len;i++){var
shape=ros[i],shapeBB=rect(shape.getBBox());if(shapeBB.containsPoint(myBB.origin()))
embedTo=shape;if(shape==this.parentElement){shape.delInner(this);if(embedTo)break;}}
embedTo&&embedTo.addInner(this);return this;},unembed:function(){if(this.parentElement){this.parentElement.del(this);this.parentElement=null;this.properties.parent=undefined;}
return this;},scale:function(sx,sy){this.wrapper.scale.apply(this.wrapper,arguments);this.zoom.apply(this,arguments);for(var i=0,len=this.inner.length;i<len;i++){var inner=this.inner[i];if(inner._isElement){inner.scale.apply(inner,arguments);}}
if(this._doNotRedrawToolbox)return;this.removeToolbox();this.addToolbox();},zoom:function(sx,sy){},getBBox:function(){return this.wrapper.getBBox();},joint:function(to,opt){var toobj=(to._isElement)?to.wrapper:to,j=this.wrapper.joint.apply(this.wrapper,[toobj,opt]);Joint.dia.registerJoint(j);return j;},attr:function(){return Raphael.el.attr.apply(this.wrapper,arguments);}};Element.mouseMove=function(e){e=e||window.event;if(dia._currentDrag){if(dia._currentDrag._opt.ghosting)
dia._currentDrag.ghost.translate(e.clientX-dia._currentDrag.dx,e.clientY-dia._currentDrag.dy);else
dia._currentDrag.translate(e.clientX-dia._currentDrag.dx,e.clientY-dia._currentDrag.dy);dia._currentDrag.dx=e.clientX;dia._currentDrag.dy=e.clientY;}
if(dia._currentZoom){var
dx=e.clientX-dia._currentZoom.dx,dy=e.clientY-dia._currentZoom.dy;dia._currentZoom.dWidth-=dx;dia._currentZoom.dHeight-=dy;if(dia._currentZoom.dWidth<1)dia._currentZoom.dWidth=1;if(dia._currentZoom.dHeight<1)dia._currentZoom.dHeight=1;var
sx=dia._currentZoom.dWidth/dia._currentZoom.origBBox.width,sy=dia._currentZoom.dHeight/dia._currentZoom.origBBox.height;dia._currentZoom._doNotRedrawToolbox=true;dia._currentZoom.scale(sx,sy);r.safari();dia._currentZoom.dx=e.clientX;dia._currentZoom.dy=e.clientY;dia._currentZoom.lastScaleX=sx;dia._currentZoom.lastScaleY=sy;}};Element.mouseUp=function(e){if(dia._currentDrag&&dia._currentDrag._opt.ghosting){var
gPos=dia._currentDrag.ghostPos(),wPos=dia._currentDrag.wrapperPos();dia._currentDrag.translate(gPos.x-wPos.x,gPos.y-wPos.y);dia._currentDrag.ghost.remove();dia._currentDrag.updateJoints();}
if(dia._currentDrag){dia._currentDrag.addToolbox();dia._currentDrag.toFront();dia._currentDrag.translate(1,1);}
if(dia._currentZoom&&dia._currentZoom._opt.ghosting){}
if(dia._currentZoom){dia._currentZoom.removeToolbox();dia._currentZoom.addToolbox();dia._currentZoom.toFront();}
dia._currentDrag=false;dia._currentZoom=false;};Joint.addEvent(document,"mousemove",Element.mouseMove);Joint.addEvent(document,"mouseup",Element.mouseUp);})(this);