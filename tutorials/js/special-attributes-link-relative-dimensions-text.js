(function specialAttributesLinkRelativeDimensionsText() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-special-attributes-link-relative-dimensions-text'),
        model: graph,
        width: 600,
        height: 300,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: true
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
            relativeLabel: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black'
            },
            relativeLabelBody: {
                x: -20,
                y: -10,
                width: 40,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            absoluteLabel: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black'
            },
            absoluteLabelBody: {
                x: -20,
                y: -10,
                width: 40,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            absoluteReverseLabel: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black'
            },
            absoluteReverseLabelBody: {
                x: -20,
                y: -10,
                width: 40,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            offsetLabelPositive: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black'
            },
            offsetLabelPositiveBody: {
                width: 70,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            offsetLabelNegative: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black'
            },
            offsetLabelNegativeBody: {
                width: 70,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            offsetLabelMarker: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                text: '＊',
                fill: '#ff0000',
                fontSize: 20
            },
            offsetLabelPositiveConnector: {
                stroke: 'black',
                strokeDasharray: '5 5'
            },
            offsetLabelNegativeConnector: {
                stroke: 'black',
                strokeDasharray: '5 5'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'line'
        }, {
            tagName: 'path',
            selector: 'offsetLabelPositiveConnector'
        }, {
            tagName: 'path',
            selector: 'offsetLabelNegativeConnector'
        }, {
            tagName: 'text',
            selector: 'offsetLabelMarker'
        }, {
            tagName: 'rect',
            selector: 'relativeLabelBody'
        }, {
            tagName: 'text',
            selector: 'relativeLabel'
        }, {
            tagName: 'rect',
            selector: 'absoluteLabelBody'
        }, {
            tagName: 'text',
            selector: 'absoluteLabel'
        }, {
            tagName: 'rect',
            selector: 'absoluteReverseLabelBody'
        }, {
            tagName: 'text',
            selector: 'absoluteReverseLabel'
        }, {
            tagName: 'rect',
            selector: 'offsetLabelPositiveBody'
        }, {
            tagName: 'text',
            selector: 'offsetLabelPositive'
        }, {
            tagName: 'rect',
            selector: 'offsetLabelNegativeBody'
        }, {
            tagName: 'text',
            selector: 'offsetLabelNegative'
        }]
    });

    var link = new CustomLink();
    link.source(new g.Point(100, 110));
    link.target(new g.Point(500, 110));
    link.vertices([new g.Point(300, 190)]);
    link.attr({
        relativeLabel: {
            atConnectionRatio: 0.25,
            text: '0.25'
        },
        relativeLabelBody: {
            atConnectionRatio: 0.25
        },
        absoluteLabel: {
            atConnectionLength: 150,
            text: '150'
        },
        absoluteLabelBody: {
            atConnectionLength: 150
        },
        absoluteReverseLabel: {
            atConnectionLength: -100,
            text: '-100'
        },
        absoluteReverseLabelBody: {
            atConnectionLength: -100
        },
        offsetLabelPositive: {
            atConnectionRatio: 0.66,
            y: 40,
            text: '{ y: 40 }'
        },
        offsetLabelPositiveBody: {
            atConnectionRatio: 0.66,
            x: -35, // 0 + -35
            y: 30 // 40 + -10
        },
        offsetLabelNegative: {
            atConnectionRatio: 0.66,
            y: -40,
            text: '{ y: -40 }'
        },
        offsetLabelNegativeBody: {
            atConnectionRatio: 0.66,
            x: -35, // 0 + -35
            y: -50 // -40 + -10
        },
        offsetLabelMarker: {
            atConnectionRatio: 0.66
        },
        offsetLabelPositiveConnector: {
            atConnectionRatio: 0.66,
            d: 'M 0 0 0 40'
        },
        offsetLabelNegativeConnector: {
            atConnectionRatio: 0.66,
            d: 'M 0 0 0 -40'
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
