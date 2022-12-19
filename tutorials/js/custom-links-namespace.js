/* eslint-disable quotes */
(function customLinks() {

    var customNamespace = {};

    var graph = new joint.dia.Graph({}, { cellNamespace: customNamespace  });

    new joint.dia.Paper({
        el: document.getElementById('paper-custom-links-namespace'),
        model: graph,
        width: 600,
        height: 100,
        cellViewNamespace: customNamespace
    });

    var Link = joint.dia.Link.define('shapeGroup.Link', {
        attrs: {
            line: {
                connection: true,
                stroke: 'cornflowerblue',
                strokeWidth: 5,
                targetMarker: {
                    'type': 'rect',
                    'width': 10,
                    'height': 20,
                    'y': -10,
                    'stroke': 'none'
                }
            },
            wrapper: {
                connection: true,
                strokeWidth: 10
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
                    width: 'calc(1.2*w)',
                    height: 'calc(1.2*h)',
                    x: 'calc(x-calc(0.1*w))',
                    y: 'calc(y-calc(0.1*h))'
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
        markup: [{
            tagName: 'path',
            selector: 'wrapper',
            attributes: {
                'fill': 'none',
                'stroke': 'transparent',
                'cursor': 'pointer'
            }
        }, {
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }]
    });

    Object.assign(customNamespace, {
        shapeGroup: {
            Link
        }
    });

    graph.fromJSON({ 
        cells: [
            { 
                "type": "shapeGroup.Link",
                "source": { "x": 100, "y": 50 },
                "target": { "x": 500, "y": 50 }
            }
        ]
    });
    
    graph.getLinks()[0].appendLabel({
        attrs: {
            text: {
                text: 'customNamespace.shapeGroup.Link'
            }
        }
    });

}());
