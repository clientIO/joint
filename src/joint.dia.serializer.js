(function(global){	// BEGIN CLOSURE

var Joint = global.Joint;

Joint.Mixin(Joint.prototype, {
    /**
     * Returns compact object representation of joint. Used for serialization.
     * @methodOf Joint.prototype
     * @return {Object} Compact representation of the joint.
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
     * @methodOf Joint.prototype
     * @return {String} JSON representation of joint.
     */
    stringify: function(){
	return JSON.stringify(this.compact());
    }
});

Joint.Mixin(Joint.dia, {
     /**
      * Clones diagram in the current paper.
      * @methodOf Joint.dia
      * @return {Array} Array of the constructed elements.
      */
    clone: function(){
	return this.parse(this.stringify(Joint.paper()));
    },
    /**
     * Construct a diagram from the JSON representation.
     * @methodOf Joint.dia
     * @param {String} JSON
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
     * @private
     * @param {Array} joints Matrix of joints for each element.
     * @param {Object} elements Hash table of elements (key: euid, value: element).
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
     * @methodOf Joint.dia
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
});

Joint.Mixin(Joint.dia.Element.prototype, {
    /**
     * @methodOf Joint.dia.Element#
     * @return JSON representation of the element.
     */
    stringify: function(){
	return JSON.stringify(Joint.Mixin(this.properties, { euid: this.euid() }));
    }
});

})(this);	// END CLOSURE
