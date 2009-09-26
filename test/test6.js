var r = Raphael("world", 640, 480);

var s0 = new FSAStartState(r, point(50, 50), 8);
s0.wrapper.node.style.cursor = "pointer";
var se = new FSAEndState(r, point(350, 50), 8);
se.wrapper.node.style.cursor = "pointer";
var s1 = new FSAState(r, point(100, 100), 30, {fill: "white"}, "state 1");
s1.wrapper.node.style.cursor = "pointer";
var s2 = new FSAState(r, point(250, 100), 30, {fill: "white"}, "state 2");
s2.wrapper.node.style.cursor = "pointer";
var s3 = new FSAState(r, point(200, 200), 30, {fill: "white"}, "state 3");
s3.wrapper.node.style.cursor = "pointer";

s0.joint(s1, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}});
s1.joint(s2, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}});
s1.joint(s3, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}});
s2.joint(se, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}});
s3.joint(s2, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}});

Joint.registeredObjects.push(s0);
Joint.registeredObjects.push(se);
Joint.registeredObjects.push(s1);
Joint.registeredObjects.push(s2);
Joint.registeredObjects.push(s3);


