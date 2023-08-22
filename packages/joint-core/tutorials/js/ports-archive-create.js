(function() {

    var namespace = joint.shapes;
    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
    new joint.dia.Paper({ el: $('#paper-create'), width: 650, height: 200, gridSize: 1, model: graph, cellViewNamespace: namespace });

    var m1 = new joint.shapes.devs.Model({
        position: { x: 50, y: 50 },
        size: { width: 90, height: 90 },
        inPorts: ['in1','in2'],
        outPorts: ['out'],
        ports: {
            groups: {
                'in': {
                    attrs: {
                        '.port-body': {
                            fill: '#16A085'
                        }
                    }
                },
                'out': {
                    attrs: {
                        '.port-body': {
                            fill: '#E74C3C'
                        }
                    }
                }
            }
        },
        attrs: {
            '.label': { text: 'Model', x: 0, y: 'calc(0.2*h)' },
            rect: { fill: '#2ECC71' }
        }
    });
    graph.addCell(m1);

}());
