var r = Raphael("world", 640, 480);

var 
evtWidth = 7,
evtHeight = 50,
placeRadius = 20;


var e0 = new PNEvent(r, rect({x: 45, y: 250, width: evtHeight, height: evtWidth}));
e0.wrapper.node.style.cursor = "pointer";
var e1 = new PNEvent(r, rect({x: 240, y: 50, width: evtWidth, height: evtHeight}));
e1.wrapper.node.style.cursor = "pointer";
var e2 = new PNEvent(r, rect({x: 390, y: 250, width: evtHeight, height: evtWidth}));
e2.wrapper.node.style.cursor = "pointer";

var p0 = new PNPlace(r, point(80, 110), placeRadius, placeRadius/7, 1);
p0.wrapper.node.style.cursor = "pointer";
var p1 = new PNPlace(r, point(410, 110), placeRadius, placeRadius/7, 2);
p1.wrapper.node.style.cursor = "pointer";
var p2 = new PNPlace(r, point(240, 280), placeRadius, placeRadius/7, 0);
p2.wrapper.node.style.cursor = "pointer";

// joint options
var opt = {
    startArrow: {type: "basic"},
    endArrow: {type: "basicArrow5"}, 
    attrs: {"stroke-dasharray": "none"}
};


e0.joint(p0, opt).register([e0, e1, e2, p0, p1, p2]).setVertices([point(200, 160)]).toggleSmoothing();
p0.joint(e1, opt).register([e0, e1, e2, p0, p1, p2]);
e1.joint(p1, opt).register([e0, e1, e2, p0, p1, p2]);
p1.joint(e2, opt).register([e0, e1, e2, p0, p1, p2]);
e2.joint(p2, opt).register([e0, e1, e2, p0, p1, p2]);
p2.joint(e0, opt).register([e0, e1, e2, p0, p1, p2]);



