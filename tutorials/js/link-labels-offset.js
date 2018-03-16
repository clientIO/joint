(function linkLabelsOffset() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-link-labels-offset'),
        model: graph,
        width: 600,
        height: 200,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: true
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(220, 180));
    link.target(new g.Point(380, 20));
    link.appendLabel({
        attrs: {
            text: {
                text: '15'
            }
        },
        position: {
            offset: 15
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '-15'
            }
        },
        position: {
            offset: -15
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '{ x: 30, y: 30 }'
            }
        },
        position: {
            offset: {
                x: 30,
                y: 30
            }
        }
    });
    link.addTo(graph);

    function counterclockwise(link) {
        link.transition('source/x', 380, {
            delay: 1000,
            duration: 4000
        });

        link.transition('source/y', 180, {
            delay: 1000,
            duration: 4000
        });

        link.transition('target/x', 220, {
            delay: 1000,
            duration: 4000
        });

        link.transition('target/y', 20, {
            delay: 1000,
            duration: 4000
        });

        link.clockwiseToggle = true;
    }

    function clockwise(link) {
        link.transition('source/x', 220, {
            delay: 1000,
            duration: 4000
        });

        link.transition('source/y', 180, {
            delay: 1000,
            duration: 4000
        });

        link.transition('target/x', 380, {
            delay: 1000,
            duration: 4000
        });

        link.transition('target/y', 20, {
            delay: 1000,
            duration: 4000
        });

        link.clockwiseToggle = false;
    }

    link.currentTransitions = 0;
    link.clockwiseToggle = false;

    counterclockwise(link);

    link.on('transition:start', function(link) {
        link.currentTransitions += 1;
    });

    link.on('transition:end', function(link) {
        link.currentTransitions -= 1;

        if (link.currentTransitions === 0) {
            if (link.clockwiseToggle) clockwise(link);
            else counterclockwise(link)
        }
    });
}());
