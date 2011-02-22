title('Conceptual data models');
description('Create map of your concepts and their relationships.');
dimension(800, 450);

var cdm = Joint.dia.cdm;
Joint.paper("world", 800, 450);

var person = cdm.Entity.create({
  rect: {x: 50, y: 50, width: 100, height: 50},
  label: "Person 50,50",
  labelOffsetX: 5,
  attrs: {
    fill: "315-#fff-#EAB515"
  },
  shadow: true
}).toggleGhosting();

var s2 = cdm.Entity.create({
  rect: {x: 200, y: 200, width: 200, height: 160},
  label: "Organization 200,200",
  attrs: {
    fill: "315-#fff-#EAB515"
  },
  shadow: true
}).toggleGhosting();

var s3 = cdm.Entity.create({
  rect: {x: 440, y: 140, width: 100, height: 60},
  label: "Language",
  attrs: {
    fill: "315-#fff-#800080"
  },
  shadow: true
}).toggleGhosting();

var s4 = cdm.Entity.create({
  rect: {x: 280, y: 270, width: 80, height: 50},
  label: "Nonprofits",
  attrs: {
    fill: "315-#fff-#EAB515"
  },
  shadow: true
}).toggleGhosting();

var s5 = cdm.Entity.create({
  rect: {x: 440, y: 270, width: 100, height: 50},
  label: "NGO's",
  attrs: {
    fill: "315-#fff-#EAB515"
  },
  shadow: true
}).toggleGhosting();

var all = [person, s2, s3, s4, s5];

s2.addInner(s4);

person.joint(s2, cdm.arrow).register(all);
s3.joint(s4, cdm.arrow).register(all);
person.joint(s3, cdm.oneToManyDashes).setVertices([{x: 490, y: 75}]).register(all);
s4.joint(s5,cdm.manyToOne).register(all);
s5.joint(s3, cdm.manyToMany).register(all);


