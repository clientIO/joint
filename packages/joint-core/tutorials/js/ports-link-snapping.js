(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    var paper = new joint.dia.Paper({ 
        el: document.getElementById('paper-link-snapping'),
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
        },
        // Enable link snapping within 20px lookup radius
        snapLinks: { radius: 20 }
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
            attrs: { label: { text: 'in1' }}
        },
        { 
            group: 'in',
            attrs: { label: { text: 'in2' }}
        },
        { 
            group: 'out',
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

    // Actions
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
