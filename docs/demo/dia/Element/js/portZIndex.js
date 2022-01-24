document.addEventListener('DOMContentLoaded', function() {

    var graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 550,
        height: 250,
        gridSize: 1,
        model: graph,
        sorting: joint.dia.Paper.sorting.APPROX,
        interactive: false,
        cellViewNamespace: joint.shapes
    });

    var rect = new joint.shapes.standard.Rectangle({
        position: { x: 125, y: 60 },
        size: { width: 80, height: 150 },
        attrs: {
            bodyMain: {
                width: 80, 
                height: 150,
                stroke: '#000000', 
                strokeWidth: 2, 
                fill: '#FFFFFF'
            },
            bodyInner: {
                width: 60, 
                height: 130, 
                x: 10, 
                y: 10,
                stroke: '#000000', 
                strokeWidth: 2, 
                fill: '#8ECAE6'
            },
            label: {
                text: 'Shape',
                y: -90,
                fontSize: 16
            }
        },
        markup: [{
            tagName: 'rect',
            selector: 'bodyMain',
            className: 'bodyMain'
                
        }, {
            tagName: 'rect',
            selector: 'bodyInner',
            className: 'bodyInner'
        }, {
            tagName: 'text',
            selector: 'label',
            className: 'label'
        }]
    });

    var rect2 = new joint.shapes.standard.Rectangle({
        position: { x: 365, y: 60 },
        size: { width: 80, height: 150 },
        attrs: {
            bodyMain: {
                width: 80, 
                height: 150,
                stroke: '#000000', 
                strokeWidth: 2, 
                fill: '#FFFFFF'
            },
            bodyInner: {
                width: 60, 
                height: 130, 
                x: 10, 
                y: 10,
                stroke: '#000000',
                strokeWidth: 2,
                fill: '#7EB3CC'
            },
            label: {
                text: ' Shape with rotatable group',
                y: -90,
                fontSize: 16
            }
        },
        markup: [{
            tagName: 'g',
            selector: 'rotatable',
            className: 'rotatable',
            children: [{
                tagName: 'g',
                selector: 'scalable',
                className: 'scalable',
                children: [{
                    tagName: 'rect',
                    selector: 'bodyMain',
                    className: 'bodyMain'
                }]
            }, {
                tagName: 'rect',
                selector: 'bodyInner',
                className: 'bodyInner'
            }, {
                tagName: 'text',
                selector: 'label',
                className: 'label'
            }]
        }]
    });

    var portIndex = 0;

    var addPort = function(z) {
        var color = '#' + Number(0x90caf9 + (portIndex++ * 1000)).toString(16);

        var port = {
            z: z,
            id: portIndex + '',
            attrs: {
                circle: {
                    r: 20,
                    magnet: 'passive',
                    fill: color,
                    stroke: '#47637A',
                    strokeWidth: 2
                },
                text: { text: ' z:' + z + '   ', fill: '#6a6c8a' }
            }
        };

        rect.addPort(port);
        rect2.addPort(port);
    };

    addPort('auto');
    addPort(0);
    addPort(1);
    addPort(3);

    rect.addTo(graph);
    rect2.addTo(graph);

    paper.on('cell:pointerclick cell:contextmenu', function(cellView, e) {

        if (cellView.model.isLink() || !cellView.model.hasPorts()) {
            return;
        }

        var portId = e.target.getAttribute('port');

        if (portId) {
            var portIndex = cellView.model.getPortIndex(portId);
            var z = parseInt(cellView.model.prop('ports/items/' + portIndex + '/z'), 10) || 0;

            z = e.type === 'contextmenu' ? Math.max(0, --z) : ++z;
            cellView.model.prop('ports/items/' + portIndex + '/z', z);
            cellView.model.prop('ports/items/' + portIndex + '/attrs/text/text', 'z:' + z + '   ');
        }
    });
});
