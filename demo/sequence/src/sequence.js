(function(dia, sd, paperElement) {

    var paperWidth = 800;
    var paperHeight = 600;

    var graph = new dia.Graph();
    var paper = new dia.Paper({
        el: paperElement,
        width: paperWidth,
        height: paperHeight,
        model: graph,
        frozen: true,
        async: true,
        sorting: dia.Paper.sorting.APPROX,
        defaultConnectionPoint: { name: 'rectangle' },
        background: { color:  '#F3F7F6' },
        moveThreshold: 5,
        restrictTranslate: function(elementView) {
            var element = elementView.model;
            var padding = (element.isEmbedded()) ? 20 : 10;
            return {
                x: padding,
                y: element.getBBox().y,
                width: paperWidth - 2 * padding,
                height: 0
            };
        },
        interactive: function(cellView) {
            var cell = cellView.model;
            return (cell.isLink())
                ? { linkMove: false, labelMove: false }
                : true;
        }
    });

    paper.el.style.border = '1px solid #E5E5E5';

    paper.on('link:pointermove', function(linkView, _evt, _x, y) {
        var link = linkView.model;
        if (link instanceof sd.Message) {
            var sView = linkView.sourceView;
            var tView = linkView.targetView;
            var padding = 20;
            var minY = Math.max(tView.sourcePoint.y - sView.sourcePoint.y, 0) + padding;
            var maxY = sView.targetPoint.y - sView.sourcePoint.y - padding;
            link.setStart(Math.min(Math.max(y - sView.sourcePoint.y, minY), maxY));
        }
    });

    var role1 = new sd.Role({ position: { x: 100, y: 20 }});
    role1.setName('Browser');
    role1.addTo(graph);

    var role2 = new sd.Role({ position: { x: 400, y: 20 }});
    role2.setName('Web Server');
    role2.addTo(graph);

    var role3 = new sd.Role({ position: { x: 600, y: 20 }});
    role3.setName('Database Server');
    role3.addTo(graph);

    var backend = new sd.RoleGroup();
    backend.embed(role2);
    backend.embed(role3);
    backend.addTo(graph);
    backend.fitRoles();
    backend.listenTo(graph, 'change:position', function(cell) {
        if (cell.isEmbeddedIn(this)) this.fitRoles();
    });

    var lifeline1 = new sd.Lifeline();
    lifeline1.attachToRole(role1, paperHeight);
    lifeline1.addTo(graph);

    var lifeline2 = new sd.Lifeline();
    lifeline2.attachToRole(role2, paperHeight);
    lifeline2.addTo(graph);

    var lifeline3 = new sd.Lifeline();
    lifeline3.attachToRole(role3, paperHeight);
    lifeline3.addTo(graph);

    var message1 = new sd.Message();
    message1.setFromTo(lifeline1, lifeline2);
    message1.setStart(50);
    message1.setDescription('HTTP GET Request');
    message1.addTo(graph);

    var message2 = new sd.Message();
    message2.setFromTo(lifeline2, lifeline3);
    message2.setStart(150);
    message2.setDescription('SQL Command');
    message2.addTo(graph);

    var message3 = new sd.Message();
    message3.setFromTo(lifeline3, lifeline2);
    message3.setStart(250);
    message3.setDescription('Result Set');
    message3.addTo(graph);

    var message4 = new sd.Message();
    message4.setFromTo(lifeline2, lifeline1);
    message4.setStart(350);
    message4.setDescription('HTTP Response');
    message4.addTo(graph);

    var lifespan1 = new sd.LifeSpan();
    lifespan1.attachToMessages(message2, message3);
    lifespan1.addTo(graph);

    paper.unfreeze();

})(
    joint.dia,
    joint.shapes.sd,
    document.getElementById('paper')
);
