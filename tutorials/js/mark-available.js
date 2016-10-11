(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: $('#paper-mark-available'),
        width: 650, height: 200, gridSize: 1,
        model: graph,
        defaultLink: new joint.dia.Link({
            attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
        }),
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            // Prevent linking from input ports.
            if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
            // Prevent linking from output ports to input ports within one element.
            if (cellViewS === cellViewT) return false;
            // Prevent linking to input ports.
            return magnetT && magnetT.getAttribute('port-group') === 'in';
        },
        // Enable marking available cells & magnets
        markAvailable: true
    });

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
                            fill: '#16A085',
                            magnet: 'passive'
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
            '.label': { text: 'Model', 'ref-x': .5, 'ref-y': .2 },
            rect: { fill: '#2ECC71' }
        }
    }).addTo(graph);

    var m2 = m1.clone().translate(300, 0).attr('.label/text', 'Model 2').addTo(graph);

})();