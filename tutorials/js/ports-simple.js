(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    new joint.dia.Paper({ 
        el: $('#paper-simple'),
        width: 650,
        height: 200,
        gridSize: 1,
        model: graph, 
        cellViewNamespace: namespace,
        linkPinning: false, // Don't allow link to be dropped in blank paper area
        defaultLink: new joint.dia.Link({
            attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }}
        }),
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            // Prevent linking from source element to itself
            if (cellViewS === cellViewT) return false;
        }
    });

    var port = {
        label: {
            position: {
                name: 'left'
            },
            markup: '<text fill="#03071E"/>'
        },
        attrs: { 
            rect: { 
                magnet: true 
            }, 
            text: { 
                text: 'port' 
            }
        },
        markup: '<rect width="16" height="16" x="-8" y="-8" fill="#03071E"/>'
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
            items: [ port ] // add a port in constructor
        }
    });

    model.addPort(port); // add a port using Port API

    graph.addCell(model);
}());
