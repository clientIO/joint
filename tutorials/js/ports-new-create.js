(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    new joint.dia.Paper({ 
        el: $('#paper-new-create'),
        width: 650,
        height: 200,
        gridSize: 1,
        model: graph, 
        cellViewNamespace: namespace,
        linkPinning: false,
        defaultLink: new joint.dia.Link({
            attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }}
        }),
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            // Prevent linking from source element to itself
            if (cellViewS === cellViewT) return false;
        }
    });


    var portsIn = {
        position: {
            name: 'left'
        },
        attrs: {
            circle: { cursor: 'crosshair', magnet: true }
        },
        label: {
            position: {
                name: 'left', // layout name
                args: { y: 6 } // extra arguments for the label layout function, see `layout.PortLabel` section
            },
            markup: '<text class="label-text"/>'
        },
        markup: '<circle r="10" fill="#023047" stroke="#03071E"/>'
    };

    var portsOut = {
        position: {
            name: 'right',
        },
        attrs: {
            circle: { cursor: 'crosshair', magnet: true }
        },
        label: {
            position: {
                name: 'right',
                args: { y: 6 }
            },
            markup: '<text class="label-text"/>'
        },
        markup: '<circle r="10" fill="#E6A502" stroke="#023047"/>'
    };


    var model = new joint.shapes.standard.Rectangle({
        position: { x: 50, y: 50 },
        size: { width: 90, height: 90 },
        attrs: {
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
                in: portsIn,
                out: portsOut
            }
        }
    });


    model.addPorts([
        { 
            group: 'in',
            attrs: { text: { text: 'in1' }}
        },
        { 
            group: 'in',
            attrs: { text: { text: 'in2' }}
        },
        { 
            group: 'out',
            attrs: { text: { text: 'out' }}
        }
    ]);

    graph.addCell(model);
}());
