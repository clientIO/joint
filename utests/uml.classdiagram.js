title('UML Class Diagrams');
description('Describe your object-oriented software architecture.');
dimension(800, 450);

var uml = Joint.dia.uml;
Joint.paper("world", 800, 450);

var client = uml.Class.create({
  rect: {x: 260, y: 20, width: 100, height: 50},
  label: "Client",
  shadow: true,
  attrs: {
//    fill: "90-#000-#f00:1-#fff"
    fill: "#f00"
  },
  labelAttrs: {
    'font-weight': 'bold'
  }
});

var aggregate = uml.Class.create({
  rect: {x: 100, y: 100, width: 120, height: 80},
  label: "<<interface>>\nAggregate",
  swimlane1OffsetY: 30,
  shadow: true,
  attrs: {
//    fill: "90-#000-yellow:1-#fff"
    fill: "yellow"
  },
  labelAttrs: {
    'font-weight': 'bold'
  },
  methods: ["+createIterator()"]
});

var iterator = uml.Class.create({
  rect: {x: 400, y: 100, width: 120, height: 80},
  label: "<<interface>>\nIterator",
  swimlane1OffsetY: 30,
  shadow: true,
  attrs: {
//    fill: "90-#000-yellow:1-#fff"
    fill: "yellow"
  },
  labelAttrs: {
    'font-weight': 'bold'
  },
  methods: ["+next()"]
});

var concreteAggregate = uml.Class.create({
  rect: {x: 95, y: 250, width: 130, height: 70},
  label: "Concrete Aggregate",
  shadow: true,
  attrs: {
//    fill: "90-#000-green:1-#fff"
    fill: "green"
  },
  labelAttrs: {
    'font-weight': 'bold'
  },
  methods: ["+createIterator(): Context"]
});

var concreteIterator = uml.Class.create({
  rect: {x: 395, y: 250, width: 130, height: 70},
  label: "Concrete Iterator",
  shadow: true,
  attrs: {
//    fill: "90-#000-green:1-#fff"
    fill: "green"
  },
  labelAttrs: {
    'font-weight': 'bold'
  },
  methods: ["+next(): Context"]
});

var all = [client, aggregate, iterator, concreteAggregate, concreteIterator];

client.joint(aggregate, uml.dependencyArrow).setVertices([{x: 159, y: 45}]).register(all);
client.joint(iterator, uml.dependencyArrow).setVertices([{x: 460, y: 45}]).register(all);
concreteAggregate.joint(aggregate, uml.generalizationArrow).register(all);
concreteIterator.joint(iterator, uml.generalizationArrow).register(all);
