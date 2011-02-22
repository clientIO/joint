title('UML StateChart diagrams');
description('Describe behaviour of your components visually.');
dimension(800, 400);

var uml = Joint.dia.uml;
Joint.paper("world", 800, 400);

var s1 = uml.State.create({
  rect: {x: 100, y: 50, width: 100, height: 60},
  label: "state 1",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  shadow: true,
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
}).toggleGhosting();
var s2 = uml.State.create({
  rect: {x: 400, y: 100, width: 100, height: 60},
  label: "state 2",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  shadow: true,
  actions: {
    entry: "create()",
    exit: "kill()",
    inner: ["A", "foo()", "B", "bar()"]
  }
}).toggleGhosting();

var s3 = uml.State.create({
  rect: {x: 250, y: 250, width: 100, height: 60},
  label: "state 3",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  shadow: true,
  actions: {
    entry: "create()",
    exit: "kill()"
  }
}).toggleGhosting();

var s4 = uml.State.create({
  rect: {x: 450, y: 120, width: 80, height: 50},
  label: "sub state 3",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  shadow: true,
  actions: {
    entry: "create()"
  }
}).toggleGhosting();

var s0 = uml.StartState.create({
  position: {x: 50, y: 40},
  shadow: true
}).toggleGhosting();

var se = uml.EndState.create({
  position: {x: 550, y: 300},
  shadow: true
}).toggleGhosting();

var all = [s0, se, s1, s2, s3, s4];

s2.scale(2);
s2.addInner(s4);

s0.joint(s1, uml.arrow).register(all);
s1.joint(s2, uml.arrow).register(all);
s3.joint(s4, uml.arrow).register(all);
s2.joint(se, uml.arrow).register(all);
s1.joint(s3, uml.arrow).register(all);

