var devs = Joint.dia.devs;
Joint.paper("world", 800, 1000);

var a1 = devs.Model.create({
  rect: {x: 30, y: 90, width: 100, height: 60},
  label: "Atomic 1",
  labelAttrs: { 'font-weight': 'bold' },
  attrs: {
//    fill: "90-#000-#f00:1-#fff"
    fill: "red"
  },
  shadow: true,
  oPorts: ["out1"]
});

var a2 = devs.Model.create({
  rect: {x: 480, y: 105, width: 100, height: 60},
  label: "Atomic 2",
  attrs: {
//    fill: "90-#000-#f00:1-#fff"
    fill: "red"
  },
  labelAttrs: { 'font-weight': 'bold' },
  shadow: true,
  iPorts: ["in1", "in2"]
});

var c1 = devs.Model.create({
  rect: {x: 200, y: 100, width: 200, height: 160},
  label: "Coupled 1",
  attrs: {
//    fill: "90-#000-green:1-#fff"
    fill: "green"
  },
  labelAttrs: { 'font-weight': 'bold' },
  shadow: true,
  iPorts: ["in"],
  oPorts: ["out1", "out2"]
});

var a3 = devs.Model.create({
  rect: {x: 250, y: 170, width: 100, height: 60},
  label: "Atomic 3",
  attrs: {
//    fill: "90-#000-#f00:1-#fff"
    fill: "red"
  },
  labelAttrs: { 'font-weight': 'bold' },
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

