var paper = Joint.paper('world', 800, 1000);

/**
 * Default.
 */

paper.circle(50, 50, 20).joint(paper.circle(220, 60, 30));

/**
 * UML.
 */

paper.circle(50, 130, 20).joint(paper.circle(220, 140, 30), Joint.dia.uml.arrow);
paper.circle(50, 210, 20).joint(paper.circle(220, 220, 30), Joint.dia.uml.generalizationArrow);
paper.circle(50, 290, 20).joint(paper.circle(220, 300, 30), Joint.dia.uml.dependencyArrow);
paper.circle(50, 370, 20).joint(paper.circle(220, 380, 30), Joint.dia.uml.aggregationArrow);

/**
 * joint.arrows.js
 */

paper.circle(300, 50, 20).joint(paper.circle(470, 60, 30), { endArrow: { type: 'rect', size: 10 }});
paper.circle(300, 130, 20).joint(paper.circle(470, 140, 30), { endArrow: { type: 'flower', size: 5 }});
paper.circle(300, 210, 20).joint(paper.circle(470, 220, 30), { endArrow: { type: 'flower' }});
paper.circle(300, 290, 20).joint(paper.circle(470, 300, 30), { endArrow: { type: 'hand', size: 15 }});
paper.circle(300, 370, 20).joint(paper.circle(470, 380, 30), { endArrow: { type: 'hand' }});
