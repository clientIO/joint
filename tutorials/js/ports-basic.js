(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    new joint.dia.Paper({ 
        el: document.getElementById('paper-basic'),
        width: 650,
        height: 200,
        gridSize: 1,
        model: graph, 
        cellViewNamespace: namespace,
        linkPinning: false, // Prevent link being dropped in blank paper area
        defaultLink: new joint.shapes.standard.Link(),
        defaultConnectionPoint: { name: 'boundary' },
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            // Prevent linking between ports within one element
            if (cellViewS === cellViewT) return false;
        }
    });

    var port = {
        position: {
            name: 'left'
        },
        label: {
            position: {
                name: 'left'
            },
            markup: [{
                tagName: 'text',
                selector: 'label'
            }]
        },
        group: 'a',
        attrs: { 
            body: { 
                magnet: true,
                width: 16,
                height: 16,
                x: -8,
                y: -8,
                fill:  '#03071E'
            }, 
            label: { 
                text: 'port' 
            }
        },
        markup: [{
            tagName: 'rect',
            selector: 'body'
        }]
    };

    var model = new joint.shapes.standard.Rectangle({
        position: { x: 275, y: 50 },
        size: { width: 90, height: 90 },
        attrs: {
            body: {
                fill: '#8ECAE6'
            }
        },
        ports: {
            groups: {
                'a': {
                    position: {
                        name: 'right'
                    }, 
                    attrs: { 
                        body: { 
                            fill: 'green',
                            width: 16,
                            height: 16,
                            x: -8,
                            y: -8, 
                        }},
                    markup: [{
                        tagName: 'rect',
                        selector: 'body'
                    }]
                }
            },
            items: [port]
        }
    });

    model.addPort(port); // add a port using Port API
    model.addPort({ group: 'a' }); // add a port using Port API


    // model.addPorts([
    //     { 
    //         group: 'a',
    //         attrs: { label: { text: 'in1' }}
    //     }
    // ]);

    // console.log(model);
    console.log(model.getGroupPorts('a'));
    graph.addCell(model);
}());
