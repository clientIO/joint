(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    var paper = new joint.dia.Paper({ 
        el: document.getElementById('paper-links'),
        width: 650,
        height: 200,
        gridSize: 1,
        model: graph, 
        cellViewNamespace: namespace,
        linkPinning: false, // Prevent link being dropped in blank paper area
        defaultLink: () => new joint.shapes.standard.Link({
            attrs: {
                wrapper: {
                    cursor: 'default'
                }
            }
        }),
        defaultConnectionPoint: { name: 'boundary' },
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            // Prevent loop linking
            return (magnetS !== magnetT);
        }
    });


    var portsIn = {
        position: {
            name: 'left'
        },
        attrs: {
            portBody: {
                magnet: true,
                r: 10,
                fill: '#023047',
                stroke: '#023047'
            }
        },
        label: {
            position: {
                name: 'left',
                args: { y: 6 } 
            },
            markup: [{
                tagName: 'text',
                selector: 'label',
                className: 'label-text'
            }]
        },
        markup: [{
            tagName: 'circle',
            selector: 'portBody'
        }]
    };

    var portsOut = {
        position: {
            name: 'right'
        },
        attrs: {
            portBody: {
                magnet: true,
                r: 10,
                fill: '#E6A502',
                stroke:'#023047'
            }
        },
        label: {
            position: {
                name: 'right',
                args: { y: 6 }
            },
            markup: [{
                tagName: 'text',
                selector: 'label',
                className: 'label-text'
            }]
        },
        markup: [{
            tagName: 'circle',
            selector: 'portBody'
        }]
    };


    var model = new joint.shapes.standard.Rectangle({
        position: { x: 125, y: 50 },
        size: { width: 90, height: 90 },
        attrs: {
            root: {
                magnet: false
            },
            body: {
                fill: '#8ECAE6',
            },
            label: { 
                text: 'Model',
                fontSize: 16,
                y: -10
            }
        },
        ports: {
            groups: {
                'in': portsIn,
                'out': portsOut
            }
        }
    });


    model.addPorts([
        { 
            group: 'in',
            id: 'in1',
            attrs: { label: { text: 'in1' }}
        },
        { 
            group: 'in',
            id: 'in2',
            attrs: { label: { text: 'in2' }}
        },
        { 
            group: 'out',
            id: 'out',
            attrs: { label: { text: 'out' }}
        }
    ]);

    var model2 = model.clone().translate(300, 0).attr('label/text', 'Model 2');

    graph.addCells(model, model2);

    // Register events
    paper.on('link:mouseenter', (linkView) => {
        showLinkTools(linkView);
    });
    
    paper.on('link:mouseleave', (linkView) => {
        linkView.removeTools();
    });

    graph.on('change:source change:target', function(link) {
        var sourcePort = link.get('source').port;
        var sourceId = link.get('source').id;
        var targetPort = link.get('target').port;
        var targetId = link.get('target').id;

        var paragraph = document.createElement('p');
        paragraph.innerHTML = [
            'The port <b>' + sourcePort,
            '</b> of element with ID <b>' + sourceId,
            '</b> is connected to port <b>' + targetPort,
            '</b> of element with ID <b>' + targetId + '</b>'
        ].join('');

        appendMessage(paragraph);
    });

    // Actions
    function appendMessage(p) {
        var body = document.getElementById('paper-links-message');

        // Remove paragraph from DOM if it already exists
        body.innerHTML = '';

        body.appendChild(p);
    }

    function showLinkTools(linkView) {
        var tools = new joint.dia.ToolsView({
            tools: [
                new joint.linkTools.Remove({
                    distance: '50%',
                    markup: [{
                        tagName: 'circle',
                        selector: 'button',
                        attributes: {
                            'r': 7,
                            'fill': '#f6f6f6',
                            'stroke': '#ff5148',
                            'stroke-width': 2,
                            'cursor': 'pointer'
                        }
                    }, {
                        tagName: 'path',
                        selector: 'icon',
                        attributes: {
                            'd': 'M -3 -3 3 3 M -3 3 3 -3',
                            'fill': 'none',
                            'stroke': '#ff5148',
                            'stroke-width': 2,
                            'pointer-events': 'none'
                        }
                    }]
                })
            ]
        });
        linkView.addTools(tools);
    }

}());
