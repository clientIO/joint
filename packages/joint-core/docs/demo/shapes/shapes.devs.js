var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: document.getElementById('paper'),
    width: 800,
    height: 400,
    gridSize: 1,
    model: graph,
    snapLinks: true,
    linkPinning: false,
    embeddingMode: true,
    highlighting: {
        'default': {
            name: 'stroke',
            options: {
                padding: 6
            }
        },
        'embedding': {
            name: 'addClass',
            options: {
                className: 'highlighted-parent'
            }
        }
    },

    validateEmbedding: function(childView, parentView) {

        return parentView.model instanceof joint.shapes.devs.Coupled;
    },

    validateConnection: function(sourceView, sourceMagnet, targetView, targetMagnet) {

        return sourceMagnet != targetMagnet;
    }
});

var connect = function(source, sourcePort, target, targetPort) {

    var link = new joint.shapes.devs.Link({
        source: {
            id: source.id,
            port: sourcePort
        },
        target: {
            id: target.id,
            port: targetPort
        }
    });

    link.addTo(graph).reparent();
};

var c1 = new joint.shapes.devs.Coupled({

    position: {
        x: 230,
        y: 50
    },
    size: {
        width: 300,
        height: 300
    }
});

c1.set('inPorts', ['in']);
c1.set('outPorts', ['out 1', 'out 2']);

var a1 = new joint.shapes.devs.Atomic({

    position: {
        x: 360,
        y: 260
    },
    inPorts: ['xy'],
    outPorts: ['x', 'y']
});

var a2 = new joint.shapes.devs.Atomic({

    position: {
        x: 50,
        y: 160
    },
    outPorts: ['out']
});

var a3 = new joint.shapes.devs.Atomic({

    position: {
        x: 650,
        y: 50
    },
    size: {
        width: 100,
        height: 300
    },
    inPorts: ['a', 'b']
});

graph.addCells([c1, a1, a2, a3]);

c1.embed(a1);

connect(a2, 'out', c1, 'in');
connect(c1, 'in', a1, 'xy');
connect(a1, 'x', c1, 'out 1');
connect(a1, 'y', c1, 'out 2');
connect(c1, 'out 1', a3, 'a');
connect(c1, 'out 2', a3, 'b');

/* rounded corners */

_.each([c1, a1, a2, a3], function(element) {

    element.attr({
        '.body': {
            'rx': 6,
            'ry': 6
        }
    });
});
