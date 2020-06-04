(function(joint, V) {

    // Note:
    // There is no support for z-indexes for HTML Elements
    // It's not possible to export the diagram into PNG/SVG on the client side

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 850,
        height: 600,
        model: graph,
        async: true,
        frozen: true,
        sorting: joint.dia.Paper.sorting.NONE
    });

    // Container for all HTML views inside paper
    // -----------------------------------------

    var htmlElements = document.createElement('div');
    htmlElements.style.transformOrigin = '0 0';
    htmlElements.style.pointerEvents = 'none';
    htmlElements.style.position = 'absolute';
    htmlElements.style.inset = '0';
    paper.el.appendChild(htmlElements);
    paper.htmlElements = htmlElements;

    paper.on('scale translate', function() {
        htmlElements.style.transform = V.matrixToTransformString(this.matrix());
    });

    paper.on('blank:pointerdown cell:pointerdown', function() {
        document.activeElement.blur();
    });


    var el1 = new joint.shapes.html.Element({
        position: { x: 16, y: 150 },
        fields: {
            header: 'Task',
            name: 'Create Story',
            resource: 'bob'
        }
    });

    var el2 = new joint.shapes.html.Element({
        position: { x: 298, y: 150 },
        fields: {
            header: 'Task',
            name: 'Promote',
            resource: 'mary'
        }
    });

    var el3 = new joint.shapes.html.Element({
        position: { x: 580, y: 150 },
        fields: {
            header: 'Task',
            name: 'Measure',
            resource: 'john'
        }
    });

    var l1 = new joint.shapes.standard.Link({
        source: { id: el1.id },
        target: { id: el2.id },
        attrs: {
            line: {
                stroke: '#464554'
            }
        }
    });

    var l2 = new joint.shapes.standard.Link({
        source: { id: el2.id },
        target: { id: el3.id },
        attrs: {
            line: {
                stroke: '#464554'
            }
        }
    });

    graph.resetCells([el1, el2, el3, l1, l2]);

    paper.unfreeze();

    // Zooming
    // ------------

    var zoomLevel = 1;

    document.getElementById('zoom-in').addEventListener('click', function() {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        var size = paper.getComputedSize();
        paper.translate(0,0);
        paper.scale(zoomLevel, zoomLevel, size.width / 2, size.height / 2);
    });

    document.getElementById('zoom-out').addEventListener('click', function() {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        var size = paper.getComputedSize();
        paper.translate(0,0);
        paper.scale(zoomLevel, zoomLevel, size.width / 2, size.height / 2);
    });

    document.getElementById('reset').addEventListener('click', function() {
        graph.getElements().forEach(function(element) {
            element.prop(['fields', 'name'], '');
            element.prop(['fields', 'resource'], '');
        });
    });

})(joint, V);
