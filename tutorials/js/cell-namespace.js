(function cellNamespace() {

    // const namespace = joint.shapes;

    const { Link, Rectangle } = joint.shapes.standard;

    const customNamespace = { Link, Rectangle };

    const graph = new joint.dia.Graph({}, { cellNamespace: customNamespace });

    new joint.dia.Paper({
        el: document.getElementById('paper-cell-namespace'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1,
        cellViewNamespace: customNamespace
    });

    graph.fromJSON({
        cells: [
            { 
                type: 'Rectangle', 
                size: { width: 80, height: 50 },
                position: { x: 10, y: 10 }
            }
        ]
    });

}());
