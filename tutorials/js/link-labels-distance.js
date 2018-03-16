(function linkLabelsDistance() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-link-labels-distance'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: true
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(100, 40));
    link.target(new g.Point(500, 40));
    link.vertices([new g.Point(300, 60)]);
    link.appendLabel({
        attrs: {
            text: {
                text: '0.25'
            }
        },
        position: {
            distance: 0.25
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '150'
            }
        },
        position: {
            distance: 150
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '-100'
            }
        },
        position: {
            distance: -100
        }
    });
    link.addTo(graph);

    function contract(link) {
        link.transition('source', { x: 200, y: 40 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        link.transition('target', { x: 400, y: 40 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        link.stretchToggle = true;
    }

    function stretch(link) {
        link.transition('source', { x: 100, y: 40 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        link.transition('target', { x: 500, y: 40 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        link.stretchToggle = false;
    }

    link.currentTransitions = 0;
    link.stretchToggle = false;

    contract(link);

    link.on('transition:start', function(link) {
        link.currentTransitions += 1;
    });

    link.on('transition:end', function(link) {
        link.currentTransitions -= 1;

        if (link.currentTransitions === 0) {
            if (link.stretchToggle) stretch(link);
            else contract(link)
        }
    });
}());
