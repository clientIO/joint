var r = Raphael("world", 640, 480);

var s0 = new FSAStartState(r, point(20, 20), 8);
s0.wrapper.node.style.cursor = "pointer";
var se = new FSAEndState(r, point(350, 50), 8);
se.wrapper.node.style.cursor = "pointer";
var s1 = new FSAState(r, point(120, 70), 30, {fill: "white"}, "state 1");
s1.wrapper.node.style.cursor = "pointer";
var s2 = new FSAState(r, point(250, 100), 30, {fill: "white"}, "state 2");
s2.wrapper.node.style.cursor = "pointer";
var s3 = new FSAState(r, point(150, 200), 30, {fill: "white"}, "state 3");
s3.wrapper.node.style.cursor = "pointer";
var s4 = new FSAState(r, point(350, 180), 30, {fill: "white"}, "state 4");
s4.wrapper.node.style.cursor = "pointer";
var s5 = new FSAState(r, point(180, 300), 30, {fill: "white"}, "state 5");
s5.wrapper.node.style.cursor = "pointer";
var s6 = new FSAState(r, point(300, 300), 30, {fill: "white"}, "state 6");
s6.wrapper.node.style.cursor = "pointer";

// joint options
var opt = {
    startArrow: {type: "basic"},
    endArrow: {type: "basicArrow5"}, 
    attrs: {"stroke-dasharray": "none"}
};

s0.joint(s1, opt);
s1.joint(s2, opt);
s1.joint(s3, opt);
s2.joint(se, opt);
s3.joint(s2, opt);
s3.joint(s5, opt);
s5.joint(s4, opt);
s4.joint(s6, opt);
s6.joint(s2, opt);

Joint.registeredObjects.push(s0);
Joint.registeredObjects.push(se);
Joint.registeredObjects.push(s1);
Joint.registeredObjects.push(s2);
Joint.registeredObjects.push(s3);
Joint.registeredObjects.push(s4);
Joint.registeredObjects.push(s5);
Joint.registeredObjects.push(s6);


