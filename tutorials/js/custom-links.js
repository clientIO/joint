(function customLinks() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-custom-links'),
        model: graph,
        width: 600,
        height: 300
    });

    joint.shapes.standard.Link.define('examples.CustomLink', {
        attrs: {
            line: {
                stroke: 'cornflowerblue',
                strokeWidth: 5,
                targetMarker: {
                    'type': 'rect',
                    'width': 10,
                    'height': 20,
                    'y': -10,
                    'stroke': 'none'
                }
            }
        },
        defaultLabel: {
            markup: [
                {
                    tagName: 'rect',
                    selector: 'body'
                }, {
                    tagName: 'text',
                    selector: 'label'
                }
            ],
            attrs: {
                label: {
                    fill: 'black', // default text color
                    fontSize: 12,
                    textAnchor: 'middle',
                    yAlignment: 'middle',
                    pointerEvents: 'none'
                },
                body: {
                    ref: 'label',
                    fill: 'white',
                    stroke: 'cornflowerblue',
                    strokeWidth: 2,
                    refWidth: '120%',
                    refHeight: '120%',
                    refX: '-10%',
                    refY: '-10%'
                }
            },
            position: {
                distance: 100, // default absolute position
                args: {
                    absoluteDistance: true
                }
            }
        }
    }, {
        // inherit joint.shapes.standard.Link.markup
    }, {
        createRandom: function() {

            var link = new this();

            var stroke = '#' + ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(-6);
            var strokeWidth = Math.floor(Math.random() * 10) + 1;
            var strokeDasharray = (Math.floor(Math.random() * 5) + 1) + ' ' + (Math.floor(Math.random() * 5) + 1);

            link.attr({
                line: {
                    stroke: stroke,
                    strokeWidth: strokeWidth,
                    strokeDasharray: strokeDasharray
                }
            });

            link.prop('defaultLabel/attrs/body/stroke', stroke);

            return link;
        }
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(100, 50));
    link.target(new g.Point(500, 50));
    link.appendLabel({
        attrs: {
            text: {
                text: 'Hello, World!'
            }
        }
    });
    link.addTo(graph);

    var link2 = new joint.shapes.examples.CustomLink();
    link2.source(new g.Point(100, 150));
    link2.target(new g.Point(500, 150));
    link2.appendLabel({
        attrs: {
            label: {
                text: 'Hello, World!'
            }
        }
    });
    link2.addTo(graph);

    var link3 = joint.shapes.examples.CustomLink.createRandom();
    link3.source(new g.Point(100, 250));
    link3.target(new g.Point(500, 250));
    link3.appendLabel({
        attrs: {
            label: {
                text: 'Hello, World!'
            }
        }
    });
    link3.addTo(graph);
}());
