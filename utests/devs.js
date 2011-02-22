title('Discrete Event System Specification');
description('Describe your hierarchicaly organized communicating components.');
dimension(800, 400);

var devs = Joint.dia.devs;
Joint.paper("world", 800, 400);

var a1 = devs.Model.create({
  rect: {x: 30, y: 90, width: 100, height: 60},
  label: "Atomic 1",
  labelAttrs: { 'font-weight': 'bold', fill: 'white', 'font-size': '12px' },
  attrs: { fill: "red" },
  shadow: true,
  oPorts: ["out1"]
});

var a2 = devs.Model.create({
  rect: {x: 480, y: 105, width: 100, height: 60},
  label: "Atomic 2",
  attrs: { fill: "red" },
  labelAttrs: { 'font-weight': 'bold', fill: 'white', 'font-size': '12px' },
  shadow: true,
  iPorts: ["in1", "in2"]
});

var c1 = devs.Model.create({
  rect: {x: 200, y: 100, width: 200, height: 160},
  label: "Coupled 1",
  attrs: { fill: "green" },
  labelAttrs: { 'font-weight': 'bold', fill: 'white', 'font-size': '12px' },
  shadow: true,
  iPorts: ["in"],
  oPorts: ["out1", "out2"]
});

var a3 = devs.Model.create({
  rect: {x: 250, y: 170, width: 100, height: 60},
  label: "Atomic 3",
  attrs: { fill: "red" },
  labelAttrs: { 'font-weight': 'bold', fill: 'white', 'font-size': '12px' },
  shadow: true,
  iPorts: ["in"],
  oPorts: ["out1", "out2"]
});

c1.addInner(a3);

var arrow = devs.arrow;

a1.port("o", "out1").joint(c1.port("i", "in"), arrow);
c1.port("i", "in").joint(a3.port("i", "in"), arrow);
a3.port("o", "out1").joint(c1.port("o", "out1"), arrow);
a3.port("o", "out2").joint(c1.port("o", "out2"), arrow);
c1.port("o", "out1").joint(a2.port("i", "in1"), arrow);
c1.port("o", "out2").joint(a2.port("i", "in2"), arrow);

