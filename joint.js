/**
 * Main joint.js file.
 * @author David Durman
 */

/**************************************************
 * Engine
 **************************************************/

var JointEngine = qhsm("Idle");
JointEngine.addSlots({
    path: null, 
    pathOptions: {
	"stroke": "#000",
	"fill": "#fff",
	"fill-opacity": 1.0,
	"stroke-width": 5

/*	"stroke-dasharray": "--",
	"stroke-linecap": "miter", // butt/square/round/mitter
	"stroke-linejoin": "miter", // butt/square/round/mitter
	"stroke-miterlimit": 10,
	"stroke-opacity": 0.2*/
    },
    from: null, 
    to: null
});

/***************************************************/

JointEngine.addMethod("rectsIntersect", function(rect, another){
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
JointEngine.addMethod("sideNearestToPoint", function(rect, point){
    // from Squeak Smalltalk, Rectangle>>sideNearestTo:
    var distToLeft = point.x - rect.x;
    var distToRight = (rect.x + rect.width) - point.x;
    var distToTop = point.y - rect.y;
    var distToBottom = (rect.y + rect.height) - point.y;
    var closest = distToLeft;
    var side = "left";
    if (distToRight < closest){
	closest = distToRight;
	side = "right";
    }
    if (distToTop < closest){
	closest = distToTop;
	side = "top";
    }
    if (distToBottom < closest){
	closest = distToBottom;
	side = "bottom";
    }
    return side;
});
/**
 * if point lies outside rect, return the nearest point on the boundary of rect, otherwise return point
 */
JointEngine.addMethod("pointAdhereToRect", function(point, rect){
    // from Squeak Smalltalk, Point>>adhereTo:
    if (this.rectContainsPoint(rect, point))
	return point;
    return {
	x: Math.min(Math.max(point.x, rect.x), rect.x + rect.width),
	y: Math.min(Math.max(point.y, rect.y), rect.y + rect.height),
    }
});
JointEngine.addMethod("rectContainsPoint", function(rect, point){
    if (point.x > rect.x && point.x < rect.x + rect.width &&
	point.y > rect.y && point.y < rect.y + rect.height)
	return true;
    return false;
});
/**
 * return a point on rect border nearest to point
 */
JointEngine.addMethod("rectPointNearestToPoint", function(rect, point){
    // from Squeak Smalltalk, Rectangle>>pointNearestTo:    
    if (this.rectContainsPoint(rect, point)){
	var side = this.sideNearestTo(rect, point);
	switch (side){
	case "right": return {x: rect.x + rect.width, y: point.y};
	case "left": return {x: rect.x, y: point.y};	    
	case "bottom": return {x: point.x, y: rect.y + rect.height};
	case "top": return {x: point.x, y: rect.y};
	}
    } else
	return this.pointAdhereToRect(rect);
    
});
JointEngine.addMethod("ellipseLineIntersectionFromCenterToPoint", function(ellipse, point){
    // from Squeak Smalltalk, EllipseMorph>>intersectionWithLineSegmentFromCenterTo:    
    var dx = point.x - ellipse.center.x;
    var dy = point.y - ellipse.center.y;
    
    if (dx == 0)
	return this.rectPointNearestToPoint(ellipse.bb, point);

    var m = dy / dx;
    var mSquared = m * m;
    var aSquared = ellipse.bb.width / 2;
    aSquared = aSquared * aSquared;
    var bSquared = ellipse.bb.height / 2;
    bSquared = bSquared * bSquared;
    var xSquared = 1 / ((1 / aSquared) + (mSquared / bSquared));
    var x = Math.sqrt(xSquared);
    if (dx < 0) 
	x = -x;
    var y = m * x;
    return {
	x: ellipse.center.x + Math.round(x),
	y: ellipse.center.y + Math.round(y),
    }
});
JointEngine.addMethod("linesIntersection", function(line, another){
    // from Squeak Smalltalk, LineSegment>>intersectionWith:
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
JointEngine.addMethod("lineLength", function(x0, y0, x1, y1){
    return Math.sqrt((x0 -= x1) * x0 + (y0 -= y1) * y0);
});
JointEngine.addMethod("bboxDistance", function(bb1, bb2){
    return this.lineLength(bb1.x, bb1.y, bb2.x, bb2.y);
});
JointEngine.addMethod("bboxMiddle", function(bb){
    return {
	x: bb.x + bb.width/2,
	y: bb.y + bb.height/2
    }
});
JointEngine.addMethod("theta", function(){
    var bb1m = this.bboxMiddle(this.from.getBBox());
    var bb2m = this.bboxMiddle(this.to.getBBox());
    var d = this.lineLength(bb1m.x, bb1m.y, bb2m.x, bb2m.y);
    var h = this.lineLength(bb2m.x, bb2m.y, bb2m.x, bb1m.y);
    return {
	degrees: (180*Math.asin(h/d))/Math.PI,
	radians: Math.asin(h/d)
    }
});
JointEngine.addMethod("overlapped", function(){
    if (this.from.type === "rect" && this.to.type === "rect"){
	//	console.log(this.rectsIntersect(this.from.getBBox(), this.to.getBBox()));
	return this.rectsIntersect(this.from.getBBox(), this.to.getBBox());
    }
    // TODO: other objects
    return this.rectsIntersect(this.from.getBBox(), this.to.getBBox());
});
JointEngine.addMethod("endPoint", function(from, to){
    var bbFrom = from.getBBox();
    var bbTo = to.getBBox();

    if (from.type === "rect"){
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

    } else if (from.type === "circle" || from.type === "ellipse"){
	var point = {x: bbTo.x + bbTo.width/2, y: bbTo.y + bbTo.height/2};
	var ellipse = {center: {x: bbFrom.x + bbFrom.width/2, y: bbFrom.y + bbFrom.height/2},
		       bb: from.getBBox()};
	return this.ellipseLineIntersectionFromCenterToPoint(ellipse, point);
    }
});
JointEngine.addMethod("drawPath", function(){
    var epf = this.endPoint(this.from, this.to);
    var ept = this.endPoint(this.to, this.from);
    var r = this.from.paper;
    var p = ["M", epf.x, epf.y, "L", ept.x, ept.y].join(",");
    this.path && this.path.remove();    
    this.path = r.path(this.pathOptions, p);
    this.path.toBack();
    this.path.show();
});

/**************************************************/

JointEngine.addState("Idle", "top", {
    entry: function(){},
    exit: function(){},
    //    init: "Connected",
    connect: {
	target: "Connected"
    }
});// Idle state

JointEngine.addState("Connected", "Idle", {
    entry: function(){ this.drawPath() },
    exit: function(){},
    step: {
	guard: function(e){ return !this.overlapped() },
	action: function(e){ this.drawPath() }
    }
});// Connected state

/**************************************************
 * Joint
 **************************************************/

function Joint(){
    this.engine = JointEngine.clone();
}

Raphael.el.joint = function(to, opt){
    var j = new Joint();
    j.engine.from = this;
    j.engine.to = to;
    for (var k in opt)
	j.engine.pathOptions[k] = opt[k];

    if (this.joints)
	this.joints.push(j);
    else
	this.joints = [j];

    if (to.joints) 
	to.joints.push(j);
    else 
	to.joints = [j];

    j.engine.dispatch(qevt("connect"));
};

var _translate = Raphael.el.translate;
Raphael.el.translate = function(x, y){
    _translate.call(this, x, y);
    if (this.joints){
	for (var i = this.joints.length - 1; i >= 0; --i)
	    this.joints[i].engine.dispatch(qevt("step"));
    }
}



