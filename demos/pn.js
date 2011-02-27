title('Petri Nets');
description('Describe your parallel processes.');
dimension(800, 400);

var pn = Joint.dia.pn;
Joint.paper("world", 800, 400);

var p1 = pn.Place.create({position: {x: 80, y: 110}, label: "p1", tokens: 1});
var p2 = pn.Place.create({position: {x: 410, y: 110}, label: "p2", tokens: 2});
var p3 = pn.Place.create({position: {x: 240, y: 280}, label: "p3"});
var e1 = pn.Event.create({rect: {x: 45, y: 250, width: 50, height: 7}, label: "e1"});
var e2 = pn.Event.create({rect: {x: 240, y: 50, width: 7, height: 50}, label: "e2"});
var e3 = pn.Event.create({rect: {x: 390, y: 250, width: 50, height: 7}, label: "e2"});

var all = [p1, p2, p3, e1, e2, e3];

e1.joint(p1, pn.arrow).register(all);
p1.joint(e2, pn.arrow).register(all);
e2.joint(p2, pn.arrow).register(all);
p2.joint(e3, pn.arrow).register(all);
e3.joint(p3, pn.arrow).register(all);
p3.joint(e1, pn.arrow).register(all);

