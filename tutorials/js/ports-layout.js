(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    new joint.dia.Paper({ 
        el: $('#paper-layout'),
        width: 650,
        height: 200,
        gridSize: 1,
        model: graph, 
        cellViewNamespace: namespace,
        linkPinning: false, // Prevent link being dropped in blank paper area
        defaultLink: new joint.dia.Link({
            attrs: { 
                '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }
            }
        })
    });


    var rectPortsIn = {
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
                attributes: {
                    'class': 'label-text'
                }
            }]
        },
        markup: [{
            tagName: 'circle',
            selector: 'portBody'
        }]
    };

    var rectPortsOut = {
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
                attributes: {
                    'class': 'label-text'
                }
            }]
        },
        markup: [{
            tagName: 'circle',
            selector: 'portBody'
        }]
    };

    var ellipsePortsIn = {
        position: {
            name: 'ellipseSpread',
            args: {
                dx: 1,
                dy: 1,
                dr: 1,
                startAngle: 220,
                step: 50,
                compensateRotation: false
            }
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
                attributes: {
                    'class': 'label-text'
                }
            }]
        },
        markup: [{
            tagName: 'circle',
            selector: 'portBody'
        }]
    };

    var ellipsePortsOut = {
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
                attributes: {
                    'class': 'label-text'
                }
            }]
        },
        markup: [{
            tagName: 'circle',
            selector: 'portBody'
        }]
    };

    var model1 = new joint.shapes.standard.Ellipse({
        position: { x: 125, y: 60 },
        size: { width: 100, height: 75 },
        attrs: {
            root: {
                magnet: false
            },
            body: {
                fill: '#8ECAE6'
            },
            label: {
                text: 'Model 1',
                fontSize: 16
            }
        },
        ports: {
            groups: {
                'in': ellipsePortsIn,
                'out': ellipsePortsOut
            }
        }
    });


    var model2 = new joint.shapes.standard.Rectangle({
        position: { x: 425, y: 50 },
        size: { width: 90, height: 90 },
        attrs: {
            root: {
                magnet: false
            },
            body: {
                fill: '#8ECAE6'
            },
            label: { 
                text: 'Model 2',
                fontSize: 16,
                y: -10
            }
        },
        ports: {
            groups: {
                'in': rectPortsIn,
                'out': rectPortsOut
            }
        }
    });


    model1.addPorts([
        { 
            group: 'in',
            attrs: { label: { text: 'in1' }}
        },
        { 
            group: 'in',
            attrs: { label: { text: 'in2' }}
        },
        { 
            group: 'in',
            attrs: { label: { text: 'in3' }}
        },
        {
            group: 'out',
            attrs: { label: { text: 'out' }}
        }
    ]);

    model2.addPorts([
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

    graph.addCells(model1, model2);
}());
