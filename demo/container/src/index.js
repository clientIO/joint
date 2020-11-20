(function(joint) {

    var graph = new joint.dia.Graph();
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 800,
        height: 600,
        model: graph,
        async: true,
        background: {
            color: '#F3F7F6'
        },
        interactive: { linkMove: false },
        defaultConnectionPoint: {
            name: 'boundary'
        },
        sorting: joint.dia.Paper.sorting.APPROX,
        viewport: function(view) {
            var element = view.model;
            var hidden = element.getAncestors().some(function(ancestor) {
                return ancestor.get('collapsed');
            });
            return !hidden;
        }
    });

    paper.el.style.border = '1px solid #E2E2E2';

    var Container = joint.shapes.container.Parent;
    var Child = joint.shapes.container.Child;
    var Link = joint.shapes.container.Link;

    var container_1 = new Container({
        z: 1,
        attrs: { headerText: { text: 'Container A' }}
    });

    var container_2 = new Container({
        z: 3,
        size: { width: 50, height: 50 },
        attrs: { headerText: { text: 'Container B' }}
    });

    var child_1 = new Child({
        z: 2,
        position: { x: 250, y: 150 },
        attrs: { label: { text: 1 }}
    });

    var child_2 = new Child({
        z: 2,
        position: { x: 200, y: 250 },
        attrs: { label: { text: 2 }}
    });

    var child_3 = new Child({
        z: 2,
        position: { x: 300, y: 250 },
        attrs: { label: { text: 3 }}
    });

    var child_4 = new Child({
        z: 4,
        position: { x: 400, y: 300 },
        attrs: { label: { text: 'A' }}
    });

    var child_5 = new Child({
        z: 4,
        position: { x: 480, y: 360 },
        attrs: { label: { text: 'B' }}
    });

    var link_1_2 = new Link({
        z: 2,
        source: { id: child_1.id },
        target: { id: child_2.id }
    });

    var link_1_3 = new Link({
        z: 2,
        source: { id: child_1.id },
        target: { id: child_3.id }
    });

    var link_4_5 = new Link({
        z: 4,
        source: { id: child_4.id },
        target: { id: child_5.id }
    });

    graph.addCells([
        container_1, container_2,
        child_1, child_2, child_3, child_4, child_5,
        link_1_2, link_1_3, link_4_5
    ]);

    container_1.embed(child_1);
    container_1.embed(child_2);
    container_1.embed(child_3);
    container_1.embed(link_1_2);
    container_1.embed(link_1_3);
    container_1.embed(container_2);
    container_2.embed(child_4);
    container_2.embed(child_5);
    container_2.embed(link_4_5);

    container_2.toggle(false);
    container_1.toggle(false);

    paper.on('element:button:pointerdown', function(elementView) {
        var element = elementView.model;
        element.toggle();
        fitAncestors(element);
    });

    paper.on('element:pointermove', function(elementView) {
        var element = elementView.model;
        fitAncestors(element);
    });

    function fitAncestors(element) {
        element.getAncestors().forEach(function(container) {
            container.fitChildren();
        });
    }

})(joint);
