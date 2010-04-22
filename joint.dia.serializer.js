/**
 * Joint.dia.serializer 0.1.0 - Joint plugin for serializing diagrams and joints.
 *
 * Copyright (c) 2010 David Durman
 *
 * Licensed under MIT license:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function(global){	// BEGIN CLOSURE

var Joint = global.Joint;

var JointSerializer = {
    /**
     * Return compact object representation of joint. Used for serialization.
     * @todo Improve, see below. Put into separate module: Joint.dia.serializer.
     */
    compact: function(){
	var start = this.startObject(), end = this.endObject(),
	    regs = this._registeredObjects, iRegs = regs.length, reg,
	    j = {
		object: "joint",
		euid: this.euid(),
		opt: this._opt,
		from: undefined,
		to: undefined,
		registered: {
		    start: [],
		    end: [],
		    both: []
		}
	    };
	// @todo Ugly!!! Joint shouldn't know anything about Joint.dia! Remove!
	// => SOLUTION: Put this method to the separate module: Joint.dia.serializer.

	// from/to
	if (start.shape.wholeShape)
	    j.from = start.shape.wholeShape.euid();
	if (end.shape.wholeShape)
	    j.to = end.shape.wholeShape.euid();

	if (start.dummy)
	    j.from = start.shape.attrs.cx + "@" + start.shape.attrs.cy;
	if (end.dummy)
	    j.to = end.shape.attrs.cx + "@" + end.shape.attrs.cy;

	// registered objects processing
	while(iRegs--){
	    reg = regs[iRegs];
	    j.registered[reg._capToStick].push(reg.euid());
	}
	return j;
    },
    /**
     * Returns JSON representation of joint.
     */
    stringify: function(){
	return JSON.stringify(this.compact());
    }
};

var diaSerializer = {
     /**
     * Clones diagram in the current paper.
     * @return {Array} Array of the constructed elements.
     */
    clone: function(){
	return this.parse(this.stringify(Joint.paper()));
    },
    /**
     * Construct a diagram from the JSON representation.
     * @param {String} json
     * @return {Array} Array of the constructed elements.
     */
    parse: function(json){
	var arr = JSON.parse(json), o, m, e, 
	    element, joints = [], i, len, elements = {};

	if (!(arr instanceof Array)) arr = [arr];

	// for all elements
	for (i = 0, len = arr.length; i < len; i++){
	    o = arr[i];

	    m = o.module;
	    e = o.object;

	    // create joints separatly, after all elements are created
	    // so that they can connect them
	    if (e === "joint"){
		joints.push(o);		
		continue;
	    }
	    // construct the element
	    console.log(this);
	    if (this[m]){
		if (this[m][e]){
		    element = this[m][e].create(o);
		} else {
		    console.error("Object " + e + " of module " + m + " is missing.");
		    return;
		}
	    } else {
		console.error("Module " + m + " is missing.");
		return;
	    }
	    if (o.euid) elements[o.euid] = element;

	    // translate, @todo rotate, scale
	    element.translate(o.dx, o.dy);
	    // element.rotate(o.rot);
	    element.scale(o.sx, o.sy);
	}
	this.hierarchize(elements);
	this.createJoints(joints, elements);
	return arr;
    },
    hierarchize: function(elements){
	var euid, element;
	for (euid in elements){
	    if (!elements.hasOwnProperty(euid)) continue;
	    element = elements[euid];
	    if (element.properties.parent && elements[element.properties.parent])
		elements[element.properties.parent].addInner(element);
	}
    },
    /**
     * Create joints.
     * @param {Array} joints Matrix of joints for each element.
     * @param {Object} elements Hash table of elements (key: euid, value: element).
     * @todo Joints for non-standard diagrams (DEVS) are created differently, they do not use wrappers for connections. 
     *        => WRONG: DEVS should be reimplemented such that it will use sub elements to represent Ports.
     */
    createJoints: function(joints, elements){
	var iJoints = joints.length, 
            joint, from, to, realFrom, realTo,
            newJoint, toRegister, toRegisterElement, iRegister, cap,
	    sides = ["start", "end", "both"], iSides = 3;
	// for all joints of all elements
	while (iJoints--){
	    joint = joints[iJoints];
	    from = elements[joint.from];
	    to = elements[joint.to];

	    // point or element wrapper
	    realFrom = (from) ? from.wrapper : {x: joint.from.split("@")[0], y: joint.from.split("@")[1]};
	    realTo = (to) ? to.wrapper : {x: joint.to.split("@")[0], y: joint.to.split("@")[1]};

	    // create joint
	    newJoint = this.Joint(realFrom, realTo, joint.opt);
	    // register caps - elements
	    toRegister = [];
	    iSides = 3;
	    while (iSides--){
		cap = sides[iSides];
		iRegister = joint.registered[cap].length;
		while (iRegister--){
		    if (elements[joint.registered[cap][iRegister]]){
			toRegisterElement = elements[joint.registered[cap][iRegister]];
			toRegisterElement._capToStick = cap;
			toRegister.push(toRegisterElement);
		    }
		}
	    }
	    newJoint.registerForever(toRegister);
	}//endwhile (iJoints--)
    },
    /**
     * Stringify the whole diagram (occupying a paper).
     * @param {RaphaelPaper} paper Raphael paper the diagram belongs to.
     * @return {String} JSON representation of the diagram.
     */
    stringify: function(paper){
	var objs, iObjs, o, str = [],
	    registeredObjects = this._registeredObjects, registeredJoints = this._registeredJoints;
	// elements
	if (registeredObjects[paper]){
	    objs = registeredObjects[paper];
	    iObjs = objs.length;
	    while (iObjs--){
		o = objs[iObjs];
		if (o.object)
		    str.push(o.stringify());
	    }
	}
	// joints
	if (registeredJoints[paper]){
	    objs = registeredJoints[paper];
	    iObjs = objs.length;
	    while (iObjs--){
		o = objs[iObjs];
		str.push(o.stringify());
	    }
	}
	return "[" + str.join(",") + "]";
    }
};

var ElementSerializer = {
    /**
     * Return JSON representation of the element.
     */
    stringify: function(){
	return JSON.stringify(Joint.Mixin(this.properties, { euid: this.euid() }));
    }
};

Joint.Mixin(Joint.prototype, JointSerializer);
Joint.Mixin(Joint.dia, diaSerializer);
Joint.Mixin(Joint.dia.Element.prototype, ElementSerializer);

})(this);	// END CLOSURE
