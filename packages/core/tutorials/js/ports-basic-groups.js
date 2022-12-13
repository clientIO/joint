(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    new joint.dia.Paper({ 
        el: document.getElementById('paper-basic-groups'),
        width: 650,
        height: 200,
        gridSize: 1,
        model: graph, 
        cellViewNamespace: namespace,
        linkPinning: false, // Prevent link being dropped in blank paper area
        defaultLink: () => new joint.shapes.standard.Link(),
        defaultConnectionPoint: { name: 'boundary' },
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            // Prevent linking between ports within one element
            if (cellViewS === cellViewT) return false;
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
        position: { x: 275, y: 50 },
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

    graph.addCell(model);
}());
