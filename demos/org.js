title('Organizational charts');
description('Scatch your organization hierarchy.');
dimension(800, 650);

var org = Joint.dia.org;
Joint.paper("world", 800, 650);

var bart = org.Member.create({
  rect: { x: 305, y: 70, width: 140, height: 60 },
  name: "Bart Simpson",
  position: "CEO",
  avatar: 'img/bart.jpg',
  attrs: { fill: '#e4d8a4', stroke: 'gray' }
});

var homer = org.Member.create({
  rect: { x: 90, y: 200, width: 150, height: 60 },
  name: "Homer Simpson",
  position: "VP Marketing",
  avatar: 'img/homer.jpg'
});

var marge = org.Member.create({
  rect: { x: 300, y: 200, width: 150, height: 60 },
  name: "Marge Simpson",
  position: "VP Sales",
  avatar: 'img/marge.jpg'
});

var lisa = org.Member.create({
  rect: { x: 500, y: 200, width: 150, height: 60 },
  name: "Lisa Simpson",
  position: "VP Production",
  avatar: 'img/lisa.jpg'
});

var maggie = org.Member.create({
  rect: { x: 400, y: 350, width: 150, height: 60 },
  name: "Maggie Simpson",
  position: "Manager",
  avatar: 'img/maggie.jpg',
  attrs: { fill: '#4192d3', stroke: 'black' }
});

var lenny = org.Member.create({
  rect: { x: 190, y: 350, width: 150, height: 60 },
  name: "Lenny Leonard",
  position: "Manager",
  avatar: 'img/lenny.jpg',
  attrs: { fill: '#4192d3', stroke: 'black' }
});

var carl = org.Member.create({
  rect: { x: 190, y: 500, width: 150, height: 60 },
  name: "Carl Carlson",
  position: "Manager",
  avatar: 'img/carl.jpg',
  attrs: { fill: '#4192d3', stroke: 'black' }
});


bart.joint(marge, org.arrow);
homer.joint(marge, org.arrow);
marge.joint(lisa, org.arrow);

marge.joint(maggie, org.arrow).setVertices(['375 380']);
homer.joint(lenny, org.arrow).setVertices(['165 380']);
homer.joint(carl, org.arrow).setVertices(['165 530']);


