module('connectors', {

    setup: function() {

        var $fixture = $('#qunit-fixture');
        var $paper = $('<div/>');
        $fixture.append($paper);

        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({

            el: $paper,
            gridSize: 10,
            model: this.graph
        });
    },

    teardown: function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    }
});

test('construction', function() {

    var r1 = new joint.shapes.basic.Rect({ position: { x: 20, y: 30 }, size: { width: 120, height: 80 } });
    var r2 = r1.clone().translate(300);

    this.graph.addCell([r1, r2]);

    var l0 = new joint.dia.Link({
        source: { id: r1.id },
        target: { id: r2.id },
        vertices: [{ x: 150, y: 200 }],
        connector: { name: 'non-existing' }
    });

    throws(function() {

        this.graph.addCell(l0);

    }, /non-existing/, 'Recognize an unexisting connector.');

    l0.set('connector', { name: 'normal' });

    this.graph.addCell(l0);

    equal(this.graph.getLinks().length, 1,
          'A link with the normal connector was succesfully added to the graph');

    var l1 = l0.clone().set('connector', { name: 'rounded' });

    this.graph.addCell(l1);

    equal(this.graph.getLinks().length, 2,
          'A link with the rounded connector was succesfully added to the graph');

    var l2 = l0.clone().set('connector', { name: 'smooth' });

    this.graph.addCell(l2);

    equal(this.graph.getLinks().length, 3,
          'A link with the smooth connector was succesfully added to the graph');

    var customCalled = 0;
    var l3 = l0.clone().set('connector', function() {
        customCalled += 1;
        return 'M 0 0';
    });

    this.graph.addCell(l3);

    equal(customCalled, 1,
        'A link with the custom connector was succesfully added to the graph');

});
