(function specialAttributesLinkRelativePosition() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-special-attributes-link-relative-position'),
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

    var CustomLink = joint.dia.Link.define('examples.CustomLink', {
        attrs: {
            line: {
                connection: true,
                fill: 'none',
                stroke: 'orange',
                strokeWidth: 2,
                sourceMarker: {
                    'type': 'circle',
                    'r': 4,
                    'fill': 'white',
                    'stroke': 'orange',
                    'stroke-width': '2'
                },
                targetMarker: {
                    'type': 'circle',
                    'r': 4,
                    'fill': 'white',
                    'stroke': 'orange',
                    'stroke-width': '2'
                }
            },
            arrowhead: {
                d: 'M -20 -10 0 0 -20 10 Z',
                fill: 'orange',
                stroke: 'none'
            },
            symbol: {
                d: 'M -20 -20 20 20',
                stroke: 'black',
                targetMarker: {
                    'type': 'path',
                    'd': 'M 0 0 10 -5 10 5 Z',
                    'fill': 'black',
                    'stroke': 'none'
                }
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'line'
        }, {
            tagName: 'path',
            selector: 'arrowhead'
        }, {
            tagName: 'path',
            selector: 'symbol'
        }]
    });

    var link = new CustomLink();
    link.source(new g.Point(100, 110));
    link.target(new g.Point(500, 110));
    link.vertices([new g.Point(300, 190)]);
    link.attr({
        symbol: {
            atConnectionRatio: 0.25
        },
        arrowhead: {
            atConnectionRatio: 0.75,
        }
    });
    link.addTo(graph);

    function contract(link) {
        link.transition('source', { x: 200, y: 110 }, {
            delay: 1000,
            duration: 4000,
            timingFunction: function(time) {
                return (time <= 0.5) ? (2 * time) : (2 * (1 - time));
            },
            valueFunction: joint.util.interpolate.object
        });

        link.transition('target', { x: 400, y: 110 }, {
            delay: 1000,
            duration: 4000,
            timingFunction: function(time) {
                return (time <= 0.5) ? (2 * time) : (2 * (1 - time));
            },
            valueFunction: joint.util.interpolate.object
        });

        link.oscillateToggle = true;
    }

    function oscillate(link) {
        link.transition('source', { x: 100, y: 190 }, {
            delay: 1000,
            duration: 4000,
            timingFunction: function(time) {
                return (time <= 0.5) ? (2 * time) : (2 * (1 - time));
            },
            valueFunction: joint.util.interpolate.object
        });

        link.transition('vertices/0', { x: 300, y: 110 }, {
            delay: 1000,
            duration: 4000,
            timingFunction: function(time) {
                return (time <= 0.5) ? (2 * time) : (2 * (1 - time));
            },
            valueFunction: joint.util.interpolate.object
        });

        link.transition('target', { x: 500, y: 190 }, {
            delay: 1000,
            duration: 4000,
            timingFunction: function(time) {
                return (time <= 0.5) ? (2 * time) : (2 * (1 - time));
            },
            valueFunction: joint.util.interpolate.object
        });

        link.oscillateToggle = false;
    }

    link.currentTransitions = 0;
    link.oscillateToggle = 0;

    contract(link);

    link.on('transition:start', function(link) {
        link.currentTransitions += 1;
    });

    link.on('transition:end', function(link) {
        link.currentTransitions -= 1;

        if (link.currentTransitions === 0) {
            if (link.oscillateToggle) oscillate(link);
            else contract(link)
        }
    });
}());
