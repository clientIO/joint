(function() {

    var constraint = g.ellipse(g.point(200, 150), 100, 80);

    var ConstraintElementView = joint.dia.ElementView.extend({

        pointerdown: function(evt, x, y) {

            var position = this.model.get('position');
            var size = this.model.get('size');
            var center = g.rect(position.x, position.y, size.width, size.height).center();
            var intersection = constraint.intersectionWithLineFromCenterToPoint(center);
            joint.dia.ElementView.prototype.pointerdown.apply(this, [evt, intersection.x, intersection.y]);
        },
        pointermove: function(evt, x, y) {

            var intersection = constraint.intersectionWithLineFromCenterToPoint(g.point(x, y));
            joint.dia.ElementView.prototype.pointermove.apply(this, [evt, intersection.x, intersection.y]);
        }
    });

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({

        el: $('#paper-constraint-move-to-circle'),
        width: 450,
        height: 300,
        gridSize: 1,
        model: graph,
        elementView: ConstraintElementView
    });

    var orbit = V('<ellipse/>');
    orbit.attr({
        cx: constraint.x, cy: constraint.y, rx: constraint.a, ry: constraint.b,
        fill: '#ECF0F1', stroke: '#34495E', 'stroke-dasharray': [2, 2]
    });
    V(paper.viewport).append(orbit);

    var earth = new joint.shapes.basic.Circle({
        position: constraint.intersectionWithLineFromCenterToPoint(g.point(100, 100)).offset(-20, -20),
        size: { width: 40, height: 40 },
        attrs: {
            text: { text: 'earth', 'font-size': 12, fill: 'white', style: { 'text-shadow': '1px 1px 1px black' } },
            circle: { fill: '#2ECC71', stroke: '#27AE60', 'stroke-width': 1 }
        },
        name: 'earth'
    });
    graph.addCell(earth);
}())
