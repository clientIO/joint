var erd = Joint.dia.erd;
Joint.paper("world", 800, 1000);

var e1 = erd.Entity.create({
  rect: { x: 220, y: 70, width: 100, height: 60 },
  label: "Account"
});
var e2 = erd.Entity.create({
  rect: { x: 520, y: 70, width: 100, height: 60 },
  label: "Site"
});

var r1 = erd.Relationship.create({
  rect: { x: 400, y: 75, width: 50, height: 50 },
  label: "Has"
});

var a1 = erd.Attribute.create({
  ellipse: { x: 90, y: 50, rx: 50, ry: 20 },
  label: "email",
  primaryKey: true
});
var a2 = erd.Attribute.create({
  ellipse: { x: 90, y: 100, rx: 50, ry: 20 },
  label: "name"
});
var a3 = erd.Attribute.create({
  ellipse: { x: 90, y: 150, rx: 50, ry: 20 },
  label: "password"
});

a1.joint(e1, erd.arrow);
a2.joint(e1, erd.arrow);
a3.joint(e1, erd.arrow);

e1.joint(r1, erd.toMany);
r1.joint(e2, erd.oneTo);



