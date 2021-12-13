(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    new joint.dia.Paper({ 
        el: $('#paper-linking'),
        width: 650,
        height: 200,
        gridSize: 1,
        model: graph, 
        cellViewNamespace: namespace,
        linkPinning: false, // Don't allow link to be dropped in blank paper area
        defaultLink: new joint.dia.Link({
            attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }}
        })
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

    graph.on('change:source change:target', function(link) {
        var sourcePort = link.get('source').port;
        var sourceId = link.get('source').id;
        var targetPort = link.get('target').port;
        var targetId = link.get('target').id;

        var m = [
            'The port <b>' + sourcePort,
            '</b> of element with ID <b>' + sourceId,
            '</b> is connected to port <b>' + targetPort,
            '</b> of element with ID <b>' + targetId + '</b>'
        ].join('');

        out(m);
    });

    function out(m) {
        $('#paper-linking-out').html(m);
    }

}());
