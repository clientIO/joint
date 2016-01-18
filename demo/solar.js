var orbits = {

    earth: g.ellipse(g.point(200, 150), 100, 80),
    mars: g.ellipse(g.point(200, 150), 120, 90)
};

var ConstraintElementView = joint.dia.ElementView.extend({

    pointerdown: function(evt, x, y) {

        var constraint = orbits[this.model.get('name')];
        var position = this.model.get('position');
        var size = this.model.get('size');
        var center = g.rect(position.x, position.y, size.width, size.height).center();
        var intersection = constraint.intersectionWithLineFromCenterToPoint(center);
        joint.dia.ElementView.prototype.pointerdown.apply(this, [evt, intersection.x, intersection.y]);
    },
    pointermove: function(evt, x, y) {

        var constraint = orbits[this.model.get('name')];
        var intersection = constraint.intersectionWithLineFromCenterToPoint(g.point(x, y));
        joint.dia.ElementView.prototype.pointermove.apply(this, [evt, intersection.x, intersection.y]);
    }
});


var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 1,
    model: graph,
    elementView: ConstraintElementView
});


var earth = new joint.shapes.basic.Circle({
    position: orbits.earth.intersectionWithLineFromCenterToPoint(g.point(100, 100)).offset(-10, -10),
    size: { width: 20, height: 20 },
    attrs: { text: { text: 'earth' }, circle: { fill: 'blue' } },
    name: 'earth'
});
graph.addCell(earth);

var mars = new joint.shapes.basic.Circle({
    position: orbits.mars.intersectionWithLineFromCenterToPoint(g.point(1000, 1000)).offset(-10, -10),
    size: { width: 20, height: 20 },
    attrs: { text: { text: 'mars' }, circle: { fill: 'orange' } },
    name: 'mars'
});

graph.addCell(mars);

drawOrbits();

function drawOrbits() {

    _.each(orbits, function(orbit, name) {

        var orbitShape = V('<ellipse/>');
        orbitShape.attr({
            cx: orbit.x,
            cy: orbit.y,
            rx: orbit.a,
            ry: orbit.b,
            'class': 'orbit'
        });
        
        V(paper.viewport).append(orbitShape);
    });
}
