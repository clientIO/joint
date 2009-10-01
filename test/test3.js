/**
 * Joint JavaScript library.
 * Clock example.
 * @author David Durman
 */

var r = Raphael("world", 640, 480);

var 
pCenter = {x: 320, y: 240},
radius = 140,
sec = r.circle(pCenter.x, pCenter.y - radius, 1).attr({"opacity": .0}).show(),
min = r.circle(pCenter.x, pCenter.y - radius, 1).attr({"opacity": .0}).show(),
hour = r.circle(pCenter.x, pCenter.y - radius, 1).attr({"opacity": .0}).show(),
center = r.circle(pCenter.x, pCenter.y, 5).attr({"fill": "blue", "fill-opacity": .2}).show(),
clock = r.circle(pCenter.x, pCenter.y, radius).attr({stroke: "gray", "stroke-width": 5}).show();

center.joint(hour, {
    attrs: {stroke: "blue", "stroke-width": 3, "stroke-dasharray": "none"},
    endArrow: {attrs: {stroke: "blue", fill: "blue"}},
    startArrow: {attrs: {stroke: "blue", fill: "blue"}}
}).register(center);

center.joint(min, {
    attrs: {stroke: "red", "stroke-width": 3, "stroke-dasharray": "none"},
    endArrow: {attrs: {stroke: "red", fill: "red"}},
    startArrow: {attrs: {stroke: "red", fill: "red"}}
}).register(center);

center.joint(sec, {
    attrs: {"stroke-width": 2},
    endArrow: {type: "hand", attrs: {fill: "orange"}}
}).register(center);


var 
secDeg = 276,
minDeg = 276,
hourDeg = 270;

setInterval(function(){
    var rad, x, y;

    rad = secDeg * Math.PI/180;
    x = pCenter.x + radius * Math.cos(rad);
    y = pCenter.y + radius * Math.sin(rad);
    sec.translate(x - sec.attr("cx"), y - sec.attr("cy"));
    secDeg = (secDeg + 6) % 360;
    if (secDeg == 276){
	minDeg = (minDeg + 6) % 360;
	rad = minDeg * Math.PI/180;
	x = pCenter.x + radius * Math.cos(rad);
	y = pCenter.y + radius * Math.sin(rad);
	min.translate(x - min.attr("cx"), y - min.attr("cy"));
	if (minDeg == 276){
	    hourDeg = (hourDeg + 6) % 360;
	    rad = hourDeg * Math.PI/180;
	    x = pCenter.x + radius * Math.cos(rad);
	    y = pCenter.y + radius * Math.sin(rad);
	    hour.translate(x - hour.attr("cx"), y - hour.attr("cy"));
	}
    }
}, 1000);


