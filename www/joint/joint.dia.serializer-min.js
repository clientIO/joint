/**
 * Joint 0.2.0 - JavaScript diagramming library.
 * Copyright (c) David Durman 2009 - 2010 
 * Licensed under the MIT license: (http://www.opensource.org/licenses/mit-license.php)
 */

(function(global){var Joint=global.Joint;Joint.Mixin(Joint.prototype,{compact:function(){var start=this.startObject(),end=this.endObject(),regs=this._registeredObjects,iRegs=regs.length,reg,j={object:"joint",euid:this.euid(),opt:this._opt,from:undefined,to:undefined,registered:{start:[],end:[],both:[]}};if(start.shape.wholeShape)
j.from=start.shape.wholeShape.euid();if(end.shape.wholeShape)
j.to=end.shape.wholeShape.euid();if(start.dummy)
j.from=start.shape.attrs.cx+"@"+start.shape.attrs.cy;if(end.dummy)
j.to=end.shape.attrs.cx+"@"+end.shape.attrs.cy;while(iRegs--){reg=regs[iRegs];j.registered[reg._capToStick].push(reg.euid());}
return j;},stringify:function(){return JSON.stringify(this.compact());}});Joint.Mixin(Joint.dia,{clone:function(){return this.parse(this.stringify(Joint.paper()));},parse:function(json){var arr=JSON.parse(json),o,m,e,element,joints=[],i,len,elements={};if(!(arr instanceof Array))arr=[arr];for(i=0,len=arr.length;i<len;i++){o=arr[i];m=o.module;e=o.object;if(e==="joint"){joints.push(o);continue;}
console.log(this);if(this[m]){if(this[m][e]){element=this[m][e].create(o);}else{console.error("Object "+e+" of module "+m+" is missing.");return;}}else{console.error("Module "+m+" is missing.");return;}
if(o.euid)elements[o.euid]=element;element.translate(o.dx,o.dy);element.scale(o.sx,o.sy);}
this.hierarchize(elements);this.createJoints(joints,elements);return arr;},hierarchize:function(elements){var euid,element;for(euid in elements){if(!elements.hasOwnProperty(euid))continue;element=elements[euid];if(element.properties.parent&&elements[element.properties.parent])
elements[element.properties.parent].addInner(element);}},createJoints:function(joints,elements){var iJoints=joints.length,joint,from,to,realFrom,realTo,newJoint,toRegister,toRegisterElement,iRegister,cap,sides=["start","end","both"],iSides=3;while(iJoints--){joint=joints[iJoints];from=elements[joint.from];to=elements[joint.to];realFrom=(from)?from.wrapper:{x:joint.from.split("@")[0],y:joint.from.split("@")[1]};realTo=(to)?to.wrapper:{x:joint.to.split("@")[0],y:joint.to.split("@")[1]};newJoint=this.Joint(realFrom,realTo,joint.opt);toRegister=[];iSides=3;while(iSides--){cap=sides[iSides];iRegister=joint.registered[cap].length;while(iRegister--){if(elements[joint.registered[cap][iRegister]]){toRegisterElement=elements[joint.registered[cap][iRegister]];toRegisterElement._capToStick=cap;toRegister.push(toRegisterElement);}}}
newJoint.registerForever(toRegister);}},stringify:function(paper){var objs,iObjs,o,str=[],registeredObjects=this._registeredObjects,registeredJoints=this._registeredJoints;if(registeredObjects[paper]){objs=registeredObjects[paper];iObjs=objs.length;while(iObjs--){o=objs[iObjs];if(o.object)
str.push(o.stringify());}}
if(registeredJoints[paper]){objs=registeredJoints[paper];iObjs=objs.length;while(iObjs--){o=objs[iObjs];str.push(o.stringify());}}
return"["+str.join(",")+"]";}});Joint.Mixin(Joint.dia.Element.prototype,{stringify:function(){return JSON.stringify(Joint.Mixin(this.properties,{euid:this.euid()}));}});})(this);