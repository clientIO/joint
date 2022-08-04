(function(dia, sd, linkTools, connectionStrategies, paperElement) {

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
        linkPinning: false,
        markAvailable: true,
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
        },
        defaultLink: (sourceView) => {
            const type = sourceView.model.get('type');
            switch (type) {
                case 'sd.Message': {
                    return new sd.LifeSpan();
                }
                case 'sd.Lifeline': {
                    return new sd.Message();
                }
            }
            throw new Error('Unknown link type.');
        },
        connectionStrategy: function(end, cellView, magnet, p, link, endType, paper) {
            const type = link.get('type');
            switch (type) {
                case 'sd.LifeSpan': {
                    if (endType === 'source') {
                        end.anchor = { name: 'connectionRatio', args: { ratio: 1 }};
                    } else {
                        end.anchor = { name: 'connectionRatio', args: { ratio: 0 }};
                    }
                    return end;
                }
                case 'sd.Message': {
                    if (endType === 'source') {
                        return connectionStrategies.pinAbsolute.call(paper, end, cellView, magnet, p, link, endType, paper);
                    } else {
                        end.anchor = { name: 'connectionPerpendicular' };
                        return end;
                    }
                }
            }
        },
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            if (cellViewS === cellViewT) return false;
            const type = linkView.model.get('type');
            const targetType = cellViewT.model.get('type');
            switch (type) {
                case 'sd.Message': {
                    return targetType === 'sd.Lifeline';
                }
                case 'sd.LifeSpan': {
                    if (targetType !== 'sd.Message') return false;
                    if (cellViewT.model.source().id !== cellViewS.model.target().id) return false;
                    return true;
                }
            }
        },
        highlighting: {
            connecting: {
                name: 'addClass',
                options: {
                    className: 'highlighted-connecting'
                }
            }
        }
    });

    paper.el.style.border = '1px solid #E5E5E5';

    paper.on('link:pointermove', function(linkView, _evt, _x, y) {
        const type = linkView.model.get('type');
        switch (type) {
            case 'sd.Message': {
                var sView = linkView.sourceView;
                var tView = linkView.targetView;
                if (!sView || !tView) return;
                var padding = 20;
                var minY = Math.max(tView.sourcePoint.y - sView.sourcePoint.y, 0) + padding;
                var maxY = sView.targetPoint.y - sView.sourcePoint.y - padding;
                linkView.model.setStart(Math.min(Math.max(y - sView.sourcePoint.y, minY), maxY));
                break;
            }
            case 'sd.LifeSpan': {
                break;
            }
        }
    });

    paper.on('link:connect', function(linkView) {
        const type = linkView.model.get('type');
        switch (type) {
            case 'sd.Message': {
                linkView.model.setDescription('Message');
                break;
            }
            case 'sd.LifeSpan': {
                break;
            }
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

    graph.getLinks().forEach(function(link) {
        if (link instanceof sd.Lifeline) {
            const tools = new dia.ToolsView({
                tools: [
                    new linkTools.HoverConnect({ scale: 1.5 }),
                ]
            });
            link.findView(paper).addTools(tools);
        }
    });

    paper.on('link:mouseenter', function(linkView) {
        const link = linkView.model;
        if (link instanceof sd.Message) {
            const tools = new dia.ToolsView({
                tools: [
                    new linkTools.Connect({
                        distance: -20
                    }),
                    new linkTools.Remove({
                        distance: -40
                    })
                ]
            });
            linkView.addTools(tools);
        }
    });

    paper.on('link:mouseleave', function(linkView) {
        const link = linkView.model;
        if (link instanceof sd.Message) {
            linkView.removeTools();
        }
    });

    paper.unfreeze();

})(
    joint.dia,
    joint.shapes.sd,
    joint.linkTools,
    joint.connectionStrategies,
    document.getElementById('paper')
);
