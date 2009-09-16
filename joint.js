/****************************************************
 * joint.js
 * @author David Durman
 ****************************************************/

/**************************************************
 * Engine.
 **************************************************/

var JointEngine = qhsm("Idle");

JointEngine.addSlots({
    connector: null, 
    pathOptions: {	// default options
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
    basicArrow: {
	path: ["M","15","0","L","-15","-15","L","-15","15","z"],
	dx: 15,	// x correction
	dy: 15, // y correction
	opt: {
	    stroke: "black"
	    //	    fill: "black"
	}
    },
    basicEnd: {
	path: ["M","15","0","L","-15","0", "z"],
	dx: 15,	// x correction
	dy: 15, // y correction
	opt: {
	    stroke: "black",
	    "stroke-width": 5	// TODO: must have the same properties as the path has
	}
    },
    rectEnd: {
	path: ["M","15","5","L","-15","5","L","-15","-5", "L", "15", "-5", "z"],
	dx: 15,	// x correction
	dy: 15, // y correction
	opt: {
	    stroke: "black",
	    //	    fill: "black",
	    "stroke-width": 1.0
	}
    },
    aggregationArrow: {
	path: ["M","15","0","L","0","10","L","-15","0", "L", "0", "-10", "z"],
	dx: 16,	// x correction
	dy: 16, // y correction
	opt: {
	    stroke: "black",
	    //	    fill: "black",
	    "stroke-width": 2.0
	}
    },
    

    fromEndCap: "basicArrow",
    toEndCap: "aggregationArrow",

    from: null, 
    to: null
});

/***************************************************
 * Engine methods.
 ***************************************************/

/**
 * return true if two rects rect and another intersect
 */
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
/**
 * return string representing side on rect which is nearest to point
 */
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
 * if point lies outside rect, return the nearest point on the boundary of rect, 
 * otherwise return point
 */
JointEngine.addMethod("pointAdhereToRect", function(point, rect){
    // from Squeak Smalltalk, Point>>adhereTo:
    if (this.rectContainsPoint(rect, point))
	return point;
    return {
	x: Math.min(Math.max(point.x, rect.x), rect.x + rect.width),
	y: Math.min(Math.max(point.y, rect.y), rect.y + rect.height)
    }
});
/**
 * return true if rect contains point
 */
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
	return this.pointAdhereToRect(point, rect);
});
/**
 * find point on ellipse where line from the center of the ellipse to
 * point intersects the ellipse
 */
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
	y: ellipse.center.y + Math.round(y)
    }
});
/**
 * find point where two lines line and another intersect
 */
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
JointEngine.addMethod("bboxMiddle", function(bb){
    return {
	x: bb.x + bb.width/2,
	y: bb.y + bb.height/2
    }
});
/**
 * CORDIC algorithm to convert between cartesian coordinates and polar coordinates.
 * use this in Python: higher n -> more constants -> higher precision
 * [round(scale * degrees(atan(2**-i))) for i in range(n)]
 * @usage Math.atan(toPolar(point)[1])  ... is an angle in radians between x-axis and [0@0, point] line
 */
JointEngine.addMethod("toPolar", function(point){
    var theta = 0, x = point.x, y = point.y;
    var adjs = [4500000, 2656505, 1403624, 712502, 357633, 178991, 89517, 44761];
    for (var i = 0; i < 8; i++){
	var sign = (y < 0) ? 1 : -1;
	theta = theta - sign * adjs[i];
	var _y = y;
	y = y + sign * (x >> i);
	x = x - sign * (_y >> i);
    }
    return [x * 60726 / 100000, theta];
});
/**
 * compute the angle between this.from middle point and this.to middle point
 * TODO: needs optimization!
 */
JointEngine.addMethod("theta", function(){
    var bbFrom = this.from.getBBox();
    var bbTo = this.to.getBBox();

    var y = -(bbTo.y - bbFrom.y);	// invert the y-axis
    var x = bbTo.x - bbFrom.x;
    var rad = Math.atan2(y, x);
    if (rad < 0) // correction for III. and IV. quadrant
	rad = 2*Math.PI + rad;
    return {
	degrees: 180*rad / Math.PI,
	radians: rad
    }
});
/**
 * return true if this.from's bbox and this.to's bbox are overlapped
 */
JointEngine.addMethod("overlapped", function(){
    if (this.from.type === "rect" && this.to.type === "rect"){
	return this.rectsIntersect(this.from.getBBox(), this.to.getBBox());
    }
    // TODO: other objects
    return this.rectsIntersect(this.from.getBBox(), this.to.getBBox());
});
/**
 * find point on from where connection line should start
 */
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
JointEngine.addMethod("simplexCentroid", function(vertices){
    var len = vertices.length;
    var centroid = {x: 0, y: 0};
    for (var i = len - 1; i >= 0; --i){
	centroid.x += vertices[i].x;
	centroid.y += vertices[i].y;
    }
    return {
	x: centroid.x / len,
	y: centroid.y / len
    }
});
/**
 * draw a connection line between this.from and this.to
 */
JointEngine.addMethod("drawPath", function(){
    var toEndCap = this[this.toEndCap];
    var fromEndCap = this[this.fromEndCap];
    var t = this.theta();

    // draw and position the arrow ending
    var epf = this.endPoint(this.from, this.to);
    var ept = this.endPoint(this.to, this.from);

    // path start point
    var pathEpf = {x: epf.x + 2*fromEndCap.dx * Math.cos(t.radians),
		   y: epf.y + -2*fromEndCap.dy * Math.sin(t.radians)};

    // path end point
    var pathEpt = {x: ept.x + -2*toEndCap.dx * Math.cos(t.radians),
		   y: ept.y + 2*toEndCap.dy * Math.sin(t.radians)};

    var r = this.from.paper;
    var p = ["M", pathEpf.x, pathEpf.y, "L", pathEpt.x, pathEpt.y].join(",");

    if (this.connector){
	this.connector.path && this.connector.path.remove();
	this.connector.toEnd && this.connector.toEnd.remove();
	this.connector.fromEnd && this.connector.fromEnd.remove();
    } else 
	this.connector = {};

    this.connector.path = r.path(this.pathOptions, p);
    this.connector.path.toBack();
    this.connector.path.show();

    // end glyph
    this.connector.toEnd = r.path(toEndCap.opt, toEndCap.path);
    this.connector.toEnd.translate(ept.x, ept.y);
    this.connector.toEnd.translate(-toEndCap.dx * Math.cos(t.radians), toEndCap.dy * (Math.sin(t.radians)));
    this.connector.toEnd.rotate(360 - t.degrees);
    //TODO: if caps are draggable:
/*
    this.connector.toEnd.engine = this;
    this.connector.toEnd.mousedown(this.endDragStart);
    this.connector.toEnd.node.style.cursor = "move";
*/

    // start glyph
    this.connector.fromEnd = r.path(fromEndCap.opt, fromEndCap.path);
    this.connector.fromEnd.translate(epf.x, epf.y);
    this.connector.fromEnd.translate(fromEndCap.dx * Math.cos(t.radians), -fromEndCap.dy * (Math.sin(t.radians)));
    this.connector.fromEnd.rotate(360 - t.degrees);
    this.connector.fromEnd.rotate(180);
    //TODO: if caps are draggable:
/*
    this.connector.fromEnd.engine = this;
    this.connector.fromEnd.mousedown(this.endDragStart);
    this.connector.fromEnd.node.style.cursor = "move";
*/


    /*
    this.connector.toEnd = r.circle(ept.x, ept.y, 5);
    this.connector.toEnd.toBack();
    this.connector.toEnd.show();
*/
});

JointEngine.addMethod("endDragStart", function(e){
    this.dx = e.clientX;
    this.dy = e.clientY;
    Joint.isEndDrag = this;
    this.animate({"fill-opacity": .1}, 500);
    e.preventDefault && e.preventDefault();
});

/**************************************************
 * Engine states.
 **************************************************/

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
 * Joint.
 **************************************************/

function Joint(){
    this.engine = JointEngine.clone();
}

Joint.isEndDrag = false;

Joint.mouseMove = function(e){
    if (Joint.isEndDrag){
        Joint.isEndDrag.translate(e.clientX - Joint.isEndDrag.dx, e.clientY - Joint.isEndDrag.dy);
        r.safari();
        Joint.isEndDrag.dx = e.clientX;
        Joint.isEndDrag.dy = e.clientY;
	console.log(e.clientX);
    }
};

Joint.mouseUp = function(e){
    Joint.isEndDrag && Joint.isEndDrag.animate({"fill-opacity": .2}, 500);
    Joint.isEndDrag = false;
};

document.addEventListener("mousemove", Joint.mouseMove, false);
document.addEventListener("mouseup", Joint.mouseUp, false);



Raphael.el.joint = function(to, opt){
    var j = new Joint();
    j.engine.from = this;
    j.engine.to = to;

    // set attributes (prevent of shallow copy)
    var temp = j.engine.pathOptions;
    j.engine.pathOptions = {};
    for (var k in temp)	// default options
	j.engine.pathOptions[k] = temp[k];
    for (var k in opt)	// custom options
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



