(function linkLabelsRotation() {

    var graph = new joint.dia.Graph;

    new joint.dia.Paper({
        el: document.getElementById('paper-link-labels-rotation'),
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

    var link = new joint.shapes.standard.Link({
        markup: [
            {
                tagName: 'path',
                selector: 'line',
            }, {
                tagName: 'path',
                selector: 'offsetLabelPositiveConnector'
            }, {
                tagName: 'path',
                selector: 'offsetLabelNegativeConnector'
            }, {
                tagName: 'path',
                selector: 'offsetLabelAbsoluteConnector'
            }, {
                tagName: 'text',
                selector: 'offsetLabelMarker'
            }
        ]
    });
    link.source(new g.Point(100, 110));
    link.target(new g.Point(500, 110));
    link.vertices([{ x: 300, y: 190 }]);
    link.attr({
        line: {
            connection: true,
            fill: 'none',
            stroke: '#333333',
            strokeWidth: 2,
            strokeLinejoin: 'round',
            targetMarker: {
                'type': 'path',
                'd': 'M 10 -5 0 0 10 5 z'
            }
        },
        offsetLabelMarker: {
            atConnectionRatio: 0.66,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            text: '＊',
            fill: 'red',
            stroke: 'black',
            strokeWidth: 1.2,
            fontSize: 30,
            fontWeight: 'bold'
        },
        offsetLabelPositiveConnector: {
            atConnectionRatio: 0.66,
            d: 'M 0 0 0 80',
            stroke: 'black',
            strokeDasharray: '5 5'
        },
        offsetLabelNegativeConnector: {
            atConnectionRatio: 0.66,
            d: 'M 0 0 0 -80',
            stroke: 'black',
            strokeDasharray: '5 5'
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '70°\nkeepGradient'
            }
        },
        position: {
            distance: 0.05,
            angle: 70,
            args: {
                keepGradient: true
            }
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '0°\nkeepGradient'
            }
        },
        position: {
            distance: 0.3,
            args: {
                keepGradient: true
            }
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '45°'
            }
        },
        position: {
            distance: 0.8,
            angle: 45
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '135°'
            }
        },
        position: {
            distance: 0.9,
            angle: 135
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '270°\nkeepGradient'
            }
        },
        position: {
            distance: 0.66,
            offset: 80,
            angle: 270,
            args: {
                keepGradient: true
            }
        }
    });
    link.appendLabel({
        attrs: {
            text: {
                text: '270°\nkeepGradient\nensureLegibility'
            }
        },
        position: {
            distance: 0.66,
            offset: -80,
            angle: 270,
            args: {
                keepGradient: true,
                ensureLegibility: true
            }
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
            else contract(link);
        }
    });
}());
