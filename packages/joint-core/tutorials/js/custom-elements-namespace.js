/* eslint-disable quotes */
(function customElements() {

    var customNamespace = {};

    var graph = new joint.dia.Graph({}, { cellNamespace: customNamespace });

    new joint.dia.Paper({
        el: document.getElementById('paper-custom-elements-namespace'),
        model: graph,
        width: 600,
        height: 100,
        cellViewNamespace: customNamespace
    });

    var Shape = joint.dia.Element.define('shapeGroup.Shape', {
        attrs: {
            body: {
                width: 'calc(w)',
                height: 'calc(h)',
                strokeWidth: 2,
                stroke: '#000000',
                fill: '#FFFFFF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                x: 'calc(0.5*w)',
                y: 'calc(0.5*h)',
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Object.assign(customNamespace, {
        shapeGroup: {
            Shape
        }
    });

    graph.fromJSON({ 
        cells: [
            { 
                "type": "shapeGroup.Shape",
                "size": { "width": 500, "height": 50 },
                "position": { "x": 50, "y": 25 },
                "attrs": {
                    "text": {
                        "text": "customNamespace.shapeGroup.Shape"
                    }
                }
            }
        ]
    }); 
}());
