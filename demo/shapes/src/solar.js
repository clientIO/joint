var orbits = {
    earth: new g.Ellipse(new g.Point(200, 150), 100, 80),
    mars: new g.Ellipse(new g.Point(200, 150), 120, 90)
};

var ConstraintElementView = joint.dia.ElementView.extend({

    pointerdown: function(evt, x, y) {

        var model = this.model;
        var constraint = orbits[model.get('name')];
        var position = model.position();
        var size = model.size();
        var center = new g.Rect(position.x, position.y, size.width, size.height).center();
        var intersection = constraint.intersectionWithLineFromCenterToPoint(center);
        joint.dia.ElementView.prototype.pointerdown.apply(this, [evt, intersection.x, intersection.y]);
    },
    pointermove: function(evt, x, y) {

        var constraint = orbits[this.model.get('name')];
        var intersection = constraint.intersectionWithLineFromCenterToPoint(new g.Point(x, y));
        joint.dia.ElementView.prototype.pointermove.apply(this, [evt, intersection.x, intersection.y]);
    }
});


var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 1,
    model: graph,
    elementView: ConstraintElementView
});


var earth = new joint.shapes.standard.Circle({
    position: orbits.earth.intersectionWithLineFromCenterToPoint(new g.Point(100, 100)).offset(-10, -10),
    size: { width: 20, height: 20 },
    attrs: { label: { refY: 30, text: 'earth' }, body: { fill: 'blue' }},
    name: 'earth'
});
graph.addCell(earth);

var mars = new joint.shapes.standard.Circle({
    position: orbits.mars.intersectionWithLineFromCenterToPoint(new g.Point(1000, 1000)).offset(-10, -10),
    size: { width: 20, height: 20 },
    attrs: { label: { refY: 30, text: 'mars' }, body: { fill: 'orange' }},
    name: 'mars'
});

graph.addCell(mars);

drawOrbits();

function drawOrbits() {

    Object.keys(orbits).forEach(function(name) {
        var orbit = orbits[name];
        var orbitShape = V('ellipse').addClass('orbit').attr({
            'cx': orbit.x,
            'cy': orbit.y,
            'rx': orbit.a,
            'ry': orbit.b
        });
        orbitShape.appendTo(paper.viewport);
    });
}
