title('Entity-relationship diagram.');
description('Make your database structure visible.');
dimension(800, 250);

var erd = Joint.dia.erd;
Joint.paper("world", 800, 250);

var e1 = erd.Entity.create({
  rect: { x: 220, y: 70, width: 100, height: 60 },
  label: "Entity"
});
var e2 = erd.Entity.create({
  rect: { x: 520, y: 70, width: 100, height: 60 },
  label: "Weak Entity",
  weak: true
});

var r1 = erd.Relationship.create({
  rect: { x: 400, y: 72, width: 55, height: 55 },
  label: "Relationship"
});

var a1 = erd.Attribute.create({
  ellipse: { x: 90, y: 30, rx: 50, ry: 20 },
  label: "primary",
  primaryKey: true
});
var a2 = erd.Attribute.create({
  ellipse: { x: 90, y: 80, rx: 50, ry: 20 },
  label: "multivalued",
  multivalued: true
});
var a3 = erd.Attribute.create({
  ellipse: { x: 90, y: 130, rx: 50, ry: 20 },
  label: "derived",
  derived: true
});
var a4 = erd.Attribute.create({
  ellipse: { x: 90, y: 180, rx: 50, ry: 20 },
  label: "normal"
});

a1.joint(e1, erd.arrow);
a2.joint(e1, erd.arrow);
a3.joint(e1, erd.arrow);
a4.joint(e1, erd.arrow);

e1.joint(r1, erd.toMany);
r1.joint(e2, erd.oneTo);



