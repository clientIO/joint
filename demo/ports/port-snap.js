(function(joint, paper) {

    paper.options.snapLinks = true;

    var graph = paper.model;

    paper.$el.prepend([
        '<style>',
        '#' + paper.svg.id + ' .joint-port { visibility: hidden }',
        '#' + paper.svg.id + ' .visible .joint-port { visibility: visible; }',
        '</style>'
    ].join(' '));

    var l = new joint.shapes.standard.Link();
    l.source({ x: 100, y: 100 });
    l.target({ x: 200, y: 100 });
    l.addTo(graph);
    l.findView(paper).addTools(new joint.dia.ToolsView({
        tools: [new joint.linkTools.TargetArrowhead()]
    }));

    var portAttrs = { circle: { r: 4, magnet: true, fill: '#31d0c6', stroke: 'none' }};
    var r = new joint.shapes.standard.Rectangle({
        attrs: {
            root: {
                magnet: false
            }
        },
        ports: {
            groups: {
                left: { position: 'left', attrs: portAttrs },
                top: { position: 'top', attrs: portAttrs },
                bottom: { position: 'bottom', attrs: portAttrs },
                right: { position: 'right', attrs: portAttrs }
            }
        }
    });
    r.size(100, 100);
    r.position(400, 200);
    r.addPort({ group: 'left' });
    r.addPort({ group: 'top' });
    r.addPort({ group: 'bottom' });
    r.addPort({ group: 'right' });
    r.addTo(graph);

    paper.on('link:snap:connect', function(linkView, evt, targetView) {
        targetView.vel.addClass('visible');
    });

    paper.on('link:snap:disconnect link:connect', function(linkView, evt, targetView) {
        targetView.vel.removeClass('visible');
    });

})(joint, window.createPaper());
