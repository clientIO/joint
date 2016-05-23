function handleFileSelect(evt) {

    var files = evt.target.files;// FileList object

    var file = files[0];
    var reader = new FileReader();

    reader.onload = (function(theFile) {

        return function(e) {

            var xmlString = e.target.result;

            var cells = joint.format.gexf.toCellsArray(
                xmlString,
                function makeElement(attrs) {

                    return new joint.shapes.basic.Rect({
                        id: attrs.id,
                        size: { width: attrs.width, height: attrs.height },
                        attrs: { text: { text: attrs.label } }
                    });
                },
                function makeLink(attrs) {

                    return new joint.dia.Link({

                        source: { id: attrs.source },
                        target: { id: attrs.target }
                    });
                }
            );

            var renderTimeStart = new Date;
            graph.resetCells(cells);
            console.log('JointJS render time:', ((new Date).getTime() - renderTimeStart) + 'ms');
            console.log('JointJS number of cells:', graph.get('cells').length, '(links:', graph.getLinks().length, 'elements:', graph.getElements().length + ')');

            joint.layout.DirectedGraph.layout(graph, { setLinkVertices: true });
        };
    })(file);

    // Read in the image file as a data URL.
    reader.readAsText(file);
}

document.getElementById('gexfFile').addEventListener('change', handleFileSelect, false);

var graph = new joint.dia.Graph;
var $paper = $('#paper');
var paper = new joint.dia.Paper({
    el: $paper,
    width: 20000,
    height: 2000,
    gridSize: 1,
    model: graph,
    elementView: joint.dia.LightElementView,
    linkView: joint.dia.LightLinkView
});

V(paper.viewport).translate(50, 50);
