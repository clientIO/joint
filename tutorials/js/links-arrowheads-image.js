(function linksArrowheadsImage() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-links-arrowheads-image'),
        model: graph,
        width: 600,
        height: 300,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: false
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(228.84550125020417, 100.76702664502545));
    link.target(new g.Point(416.2834258874138, 72.03741369165368));
    link.vertices([
        new g.Point(300, 150)
    ]);
    link.attr({
        line: {
            sourceMarker: {
                'type': 'image',
                'xlink:href': 'http://cdn3.iconfinder.com/data/icons/49handdrawing/24x24/left.png',
                'width': 24,
                'height': 24,
                'y': -12
            },
            targetMarker: {
                'type': 'image',
                'xlink:href': 'http://cdn3.iconfinder.com/data/icons/49handdrawing/24x24/left.png',
                'width': 24,
                'height': 24,
                'y': -12
            }
        }
    });
    link.addTo(graph);

    function hourHand(link) {
        link.transition('source', ((10 + (9.36 / 60)) / 12), {
            delay: 1000,
            duration: 19000,
            valueFunction: function(start, startTime) {
                var timeCorrection = ((startTime * (2 * Math.PI)) - (Math.PI / 2));
                var origin = new g.Point(300, 150);
                var radius = 140 / 1.618;
                return function(t) {
                    return {
                        x: origin.x + (radius * Math.cos((t * 2 * Math.PI) + timeCorrection)),
                        y: origin.y + (radius * Math.sin((t * 2 * Math.PI) + timeCorrection))
                    }
                }
            }
        });
    }

    function minuteHand(link) {
        link.transition('target', (9.36 / 60), {
            delay: 1000,
            duration: 19000,
            timingFunction: function(time) {
                return ((time * 12) - (Math.floor(time * 12)))
            },
            valueFunction: function(start, startTime) {
                var timeCorrection = ((startTime * (2 * Math.PI)) - (Math.PI / 2));
                var origin = new g.Point(300, 150);
                var radius = 140;
                return function(t) {
                    return {
                        x: origin.x + (radius * Math.cos((t * 2 * Math.PI) + timeCorrection)),
                        y: origin.y + (radius * Math.sin((t * 2 * Math.PI) + timeCorrection))
                    }
                }
            }
        });
    }

    link.currentTransitions = 0;

    hourHand(link);
    minuteHand(link);

    link.on('transition:start', function(link) {
        link.currentTransitions += 1;
    });

    link.on('transition:end', function(link) {
        link.currentTransitions -= 1;

        if (link.currentTransitions === 0) {
            hourHand(link);
            minuteHand(link);
        }
    });
}());
