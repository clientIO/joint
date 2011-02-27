title('Cloning test');
description('Test of cloning capabilities.');
dimension(800, 400);

Joint.paper('world', 800, 400);

var s = Joint.dia.uml.State.create({
  rect: {x: 50, y: 150, width: 100, height: 80},
  label: "My State 1"
});

var j = Joint.dia.Joint({x: 50, y: 50}, {x: 100, y: 100}, Joint.dia.uml.arrow);

var all = [s];

j.registerForever(all);

all.push(s.clone());

var clones = Joint.dia.clone(), l = clones.length;
while (l--) { all.push(clones[l]); }
