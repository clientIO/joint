var graph = new joint.dia.Graph;
var $paper = $('#paper');
var paper = new joint.dia.Paper({
    el: $paper,
    width: 30000,
    height: 2000,
    gridSize: 1,
    model: graph,
    elementView: joint.dia.LightElementView,
    linkView: joint.dia.LightLinkView
});

V(paper.viewport).translate(50, 50);

function buildGraphFromObject(cells, rootName, graph, obj, parent) {

    if (!parent) {

        parent = makeElement(rootName);
        cells.push(parent);
    }

    _.each(obj, function(value, key) {

        var keyElement = makeElement(key);
        cells.push(keyElement);

        if (parent) {

            var link = makeLink(parent, keyElement);
            cells.push(link);
        }

        if (!_.isFunction(value) && (_.isObject(value) || _.isArray(value))) {

            _.each(value, function(childValue, childKey) {

                var link;

                var childKeyElement = makeElement(childKey);
                cells.push(childKeyElement);

                link = makeLink(keyElement, childKeyElement);
                cells.push(link);

                if (!_.isFunction(childValue) && (_.isObject(childValue) || _.isArray(childValue))) {

                    buildGraphFromObject(cells, rootName, graph, childValue, childKeyElement);

                } else {

                    // Leaf.
                    var grandChildElement = makeElement(childValue);
                    cells.push(grandChildElement);
                    link = makeLink(childKeyElement, grandChildElement);
                    cells.push(link);
                }
            });

        } else {

            // Leaf.
            var childKeyElement = makeElement(value);
            cells.push(childKeyElement);

            var link = makeLink(keyElement, childKeyElement);
            cells.push(link);
        }
    });
}

function makeLink(el1, el2) {
    return new joint.dia.Link({
        source: { id: el1.id },
        target: { id: el2.id }
    });
}

function makeElement(label) {
    return new joint.shapes.basic.Rect({
        size: { width: 20, height: 20 },
        attrs: {
            text: { text: '' + label }
        }
    });
}


var renderTimeStart = new Date;
var cells = [];
buildGraphFromObject(cells, 'ROOT', graph, json);
cells.sort(function(a, b) {
    if (a.get('type') === 'link') return 0;
    return 1;
});
graph.resetCells(cells);
console.log('JointJS render time:', ((new Date).getTime() - renderTimeStart) + 'ms');
console.log('JointJS number of cells:', graph.get('cells').length, '(links:', graph.getLinks().length, 'elements:', graph.getElements().length + ')');

joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });
