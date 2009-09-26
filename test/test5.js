var r = Raphael("world", 640, 480);

var uml1 = new UMLState(r, rect({x: 100, y: 100, width: 100, height: 60}), {fill: "orange"}, "UML state 1");
uml1.wrapper.node.style.cursor = "pointer";
var uml2 = new UMLState(r, rect({x: 400, y: 100, width: 100, height: 60}), {fill: "green"}, "UML state 2");
uml2.wrapper.node.style.cursor = "pointer";
uml2.scale(2);
var uml3 = new UMLState(r, rect({x: 250, y: 200, width: 100, height: 60}), {fill: "yellow"}, "UML state 3");
uml3.wrapper.node.style.cursor = "pointer";

var subuml2 = new UMLState(r, rect({x: 420, y: 120, width: 80, height: 50}), {fill: "white"}, "substate 1");
subuml2.wrapper.node.style.cursor = "pointer";
uml2.add(subuml2);

uml1.joint(uml2, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}});
uml3.joint(subuml2, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}});

Joint.registeredObjects.push(uml1);
Joint.registeredObjects.push(uml2);
Joint.registeredObjects.push(uml3);
Joint.registeredObjects.push(subuml2);


