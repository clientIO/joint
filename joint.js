/**
 * Main joint.js file.
 * @author David Durman
 */

/**************************************************
 * Machine
 **************************************************/

var JointMachine = qhsm("Idle");
JointMachine.addSlots({path: null, from: null, to: null});
JointMachine.addMethod("rectsIntersection", function(rect, another){
    var rOrigin = {x: rect.x, y: rect.y},
    rCorner = {x: rect.x + rect.width, y: rect.y + rect.height},
    aOrigin = {x: another.x, y: another.y},
    aCorner = {x: another.x + another.width, y: another.y + another.height};
    if (aCorner.x <= rOrigin.x) return false;
    if (aCorner.y <= rOrigin.y) return false;
    if (aOrigin.x >= rCorner.x) return false;
    if (aOrigin.y >= rCorner.y) return false;
    return true;
});
JointMachine.addMethod("linesIntersection", function(line, another){
    // from Squeak Smalltalk, LineSegment>>intersectionWith:
    /*
    var side1 = {x: bb.x + bb.width, y: bb.y};
    var side2 = {x: bb.x + bb.width, y: bb.y + bb.height};
    var seg1 = {x: bb.x + bb.width/2, y: bb.y + bb.height/2};
    var seg2 = {x: bbto.x + bbto.width/2, y: bbto.y + bbto.height/2};
*/
    var pt1Dir = {x: line.end.x - line.start.x, y: line.end.y - line.start.y};
    var pt2Dir = {x: another.end.x - another.start.x, y: another.end.y - another.start.y};
    var det = (pt1Dir.x * pt2Dir.y) - (pt1Dir.y * pt2Dir.x);
    var deltaPt = {x: another.start.x - line.start.x, y: another.start.y - line.start.y};
    var alpha = (deltaPt.x * pt2Dir.y) - (deltaPt.y * pt2Dir.x);
    var beta = (deltaPt.x * pt1Dir.y) - (deltaPt.y * pt1Dir.x);

    if (det == 0 ||
	alpha * det < 0 ||
	beta * det < 0)
	return null;	// no intersection

    if (det > 0){
	if (alpha > det || beta > det)
	    return null;
    } else {
	if (alpha < det || beta < det)
	    return null;
    }

    return {
	x: line.start.x + (alpha * pt1Dir.x / det),
	y: line.start.y + (alpha * pt1Dir.y / det)
    }
});
JointMachine.addMethod("lineLength", function(x0, y0, x1, y1){
    return Math.sqrt((x0 -= x1) * x0 + (y0 -= y1) * y0);
});
JointMachine.addMethod("bboxDistance", function(bb1, bb2){
    return this.lineLength(bb1.x, bb1.y, bb2.x, bb2.y);
});
JointMachine.addMethod("bboxMiddle", function(bb){
    return {
	x: bb.x + bb.width/2,
	y: bb.y + bb.height/2
    }
});
JointMachine.addMethod("theta", function(){
    var bb1m = this.bboxMiddle(this.from.getBBox());
    var bb2m = this.bboxMiddle(this.to.getBBox());
    var d = this.lineLength(bb1m.x, bb1m.y, bb2m.x, bb2m.y);
    var h = this.lineLength(bb2m.x, bb2m.y, bb2m.x, bb1m.y);
    return {
	degrees: (180*Math.asin(h/d))/Math.PI,
	radians: Math.asin(h/d)
    }
});
JointMachine.addMethod("overlapped", function(){
    if (this.from.type === "rect" && this.to.type === "rect"){
//	console.log(this.rectsIntersection(this.from.getBBox(), this.to.getBBox()));
	return this.rectsIntersection(this.from.getBBox(), this.to.getBBox());
    }
    // TODO: other objects
    return false;
});
JointMachine.addMethod("endPoint", function(from, to){
    var bbFrom = from.getBBox();
    var bbTo = to.getBBox();

    if (this.from.type === "rect"){
	// sides of the this.from rectangle (clockwise, starting from the top side)
	var sides = [
	    {start: {x: bbFrom.x, y: bbFrom.y}, 
	     end: {x: bbFrom.x + bbFrom.width, y: bbFrom.y}},
	    {start: {x: bbFrom.x + bbFrom.width, y: bbFrom.y}, 
	     end: {x: bbFrom.x + bbFrom.width, y: bbFrom.y + bbFrom.height}}, 
	    {start: {x: bbFrom.x + bbFrom.width, y: bbFrom.y + bbFrom.height}, 
	     end: {x: bbFrom.x, y: bbFrom.y + bbFrom.height}},
	    {start: {x: bbFrom.x, y: bbFrom.y + bbFrom.height}, 
	     end: {x: bbFrom.x, y: bbFrom.y}}
	];

	var connector = {start: {x: bbFrom.x + bbFrom.width/2, y: bbFrom.y + bbFrom.height/2},
			 end: {x: bbTo.x + bbTo.width/2, y: bbTo.y + bbTo.height/2}};

	for (var i = sides.length - 1; i >= 0; --i){
	    var intersection = this.linesIntersection(sides[i], connector);
	    if (intersection !== null)
		return intersection;
	}
    }
});

JointMachine.addState("Idle", "top", {
    entry: function(){},
    exit: function(){},
    //    init: "Connected",
    connect: {
	//	guard: function(e){return true},
	action: function(e){},
	target: "Connected"
    }
});// Idle state

JointMachine.addState("Connected", "Idle", {
    entry: function(){
	var epf = this.endPoint(this.from, this.to);
	var ept = this.endPoint(this.to, this.from);
	var r = this.from.paper;
	var p = ["M", epf.x, epf.y, "L", ept.x, ept.y].join(",");
	this.path = r.path({stroke: "#036"}, p);
	this.path.toBack();
	this.path.show();
    },
    exit: function(){},
    step: {
	guard: function(e){ return !this.overlapped() },
	action: function(e){
	    var epf = this.endPoint(this.from, this.to);
	    var ept = this.endPoint(this.to, this.from);
	    var r = this.from.paper;
	    this.path.remove();
	    var p = ["M", epf.x, epf.y, "L", ept.x, ept.y].join(",");
	    this.path = r.path({stroke: "#036"}, p);
	    this.path.toBack();
	    this.path.show();
	}
    }
});// Connected state

/**************************************************
 * Joint
 **************************************************/

function Joint(){
    this.machine = JointMachine.clone();
}

Raphael.el.joint = function(to){
    var j = new Joint();
    j.machine.from = this;
    j.machine.to = to;
    this.j = j;
    to.j = j;
    j.machine.dispatch(qevt("connect"));
};

var _translate = Raphael.el.translate;
Raphael.el.translate = function(x, y){
    _translate.call(this, x, y);
    this.j && this.j.machine.dispatch(qevt("step"));
}



