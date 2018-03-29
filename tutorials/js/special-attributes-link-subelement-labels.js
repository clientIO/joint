(function specialAttributesLinkSubelementLabels() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-special-attributes-link-subelement-labels'),
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
                stroke: '#333333',
                strokeWidth: 2,
                strokeLinejoin: 'round',
                targetMarker: {
                    'type': 'path',
                    'd': 'M 10 -5 0 0 10 5 z'
                }
            },
            relativeLabel: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black',
                fontSize: 12
            },
            relativeLabelBody: {
                x: -15,
                y: -10,
                width: 30,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            absoluteLabel: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black',
                fontSize: 12
            },
            absoluteLabelBody: {
                x: -15,
                y: -10,
                width: 30,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            absoluteReverseLabel: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black',
                fontSize: 12
            },
            absoluteReverseLabelBody: {
                x: -15,
                y: -10,
                width: 30,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            offsetLabelPositive: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black',
                fontSize: 12
            },
            offsetLabelPositiveBody: {
                width: 120,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            offsetLabelNegative: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black',
                fontSize: 12
            },
            offsetLabelNegativeBody: {
                width: 120,
                height: 20,
                fill: 'white',
                stroke: 'black'
            },
            offsetLabelAbsolute: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: 'black',
                fontSize: 12
            },
            offsetLabelAbsoluteBody: {
                width: 140,
                height: 20,
                fill: 'white',
                stroke: 'black'
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
                d: 'M 0 0 0 40',
                stroke: 'black',
                strokeDasharray: '5 5'
            },
            offsetLabelNegativeConnector: {
                atConnectionRatio: 0.66,
                d: 'M 0 0 0 -40',
                stroke: 'black',
                strokeDasharray: '5 5'
            },
            offsetLabelAbsoluteConnector: {
                atConnectionRatioIgnoreGradient: 0.66,
                d: 'M 0 0 -40 80',
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
            tagName: 'path',
            selector: 'offsetLabelAbsoluteConnector'
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
        }, {
            tagName: 'rect',
            selector: 'offsetLabelAbsoluteBody'
        }, {
            tagName: 'text',
            selector: 'offsetLabelAbsolute'
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
            text: 'keepGradient: 0,40'
        },
        offsetLabelPositiveBody: {
            atConnectionRatio: 0.66,
            x: -60, // 0 + -60
            y: 30 // 40 + -10
        },
        offsetLabelNegative: {
            atConnectionRatio: 0.66,
            y: -40,
            text: 'keepGradient: 0,-40'
        },
        offsetLabelNegativeBody: {
            atConnectionRatio: 0.66,
            x: -60, // 0 + -60
            y: -50 // -40 + -10
        },
        offsetLabelAbsolute: {
            atConnectionRatioIgnoreGradient: 0.66,
            x: -40,
            y: 80,
            text: 'ignoreGradient: -40,80'
        },
        offsetLabelAbsoluteBody: {
            atConnectionRatioIgnoreGradient: 0.66,
            x: -110, // -40 + -70
            y: 70 // 80 + -10
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
