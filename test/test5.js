var r = Raphael("world", 640, 480);

var uml1 = new UMLState(r, rect({x: 100, y: 50, width: 100, height: 60}), {/*fill: "orange"*/ gradient: "90-#000-#f00:1-#fff"}, "UML state 1");
uml1.wrapper.node.style.cursor = "pointer";
var uml2 = new UMLState(r, rect({x: 400, y: 100, width: 100, height: 60}), {/*fill: "green"*/ gradient: "90-#000-green:1-#fff"}, "UML state 2");
uml2.wrapper.node.style.cursor = "pointer";
uml2.scale(2);
var uml3 = new UMLState(r, rect({x: 250, y: 250, width: 100, height: 60}), {/*fill: "yellow"*/ gradient: "90-#000-yellow:1-#fff"}, "UML state 3");
uml3.wrapper.node.style.cursor = "pointer";

var subuml2 = new UMLState(r, rect({x: 420, y: 120, width: 80, height: 50}), {fill: "white"}, "substate 1");
subuml2.wrapper.node.style.cursor = "pointer";
uml2.add(subuml2);

var all = [uml1, uml2, uml3, subuml2];

uml1.joint(uml2, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}}).register(all);
uml3.joint(subuml2, {endArrow: {type: "basicArrow5"}, attrs: {"stroke-dasharray": "none"}, startArrow: {type: "basic"}}).register(all);



