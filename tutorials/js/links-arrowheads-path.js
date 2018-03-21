(function linksArrowheadsPath() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-links-arrowheads-path'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        }
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(100, 50));
    link.target(new g.Point(500, 50));
    link.vertices([
        new g.Point(300, 50)
    ]);
    link.attr({
        line: {
            sourceMarker: {
                'type': 'path',
                'd': 'M 20 -10 0 0 20 10 Z'
            },
            targetMarker: {
                'type': 'path',
                'stroke': 'green',
                'stroke-width': 2,
                'fill': 'yellow',
                'd': 'M 20 -10 0 0 20 10 Z'
            }
        }
    });
    link.addTo(graph);

    function down(link) {
        link.transition('vertices/0', { x: 300, y: 90 }, {
            delay: 1000,
            duration: 4000,
            timingFunction: function(time) {
                return (time <= 0.5) ? (2 * time) : (2 * (1 - time));
            },
            valueFunction: joint.util.interpolate.object
        });

        link.upToggle = true;
    }

    function up(link) {
        link.transition('vertices/0', { x: 300, y: 10 }, {
            delay: 1000,
            duration: 4000,
            timingFunction: function(time) {
                return (time <= 0.5) ? (2 * time) : (2 * (1 - time));
            },
            valueFunction: joint.util.interpolate.object
        });

        link.upToggle = false;
    }

    link.currentTransitions = 0;
    link.upToggle = false;

    down(link);

    link.on('transition:start', function(link) {
        link.currentTransitions += 1;
    });

    link.on('transition:end', function(link) {
        link.currentTransitions -= 1;

        if (link.currentTransitions === 0) {
            if (link.upToggle) up(link);
            else down(link)
        }
    });
}());
