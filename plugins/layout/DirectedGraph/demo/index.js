var graph = new joint.dia.Graph;
var $paper = $('#paper');
var paper = new joint.dia.Paper({
    el: $paper,
    width: 20000,
    height: 2000,
    gridSize: 20,
    model: graph
});

var json = {
    string: 'foo',
    number: 5,
    array: [1, 2, 3],
    dummy: {},
    object: {
        property: 'value',
        subobj: {
            arr: ['foo', 'ha'],
            numero: 1
        },
        fnc: function(a, b) {
            return a + b;
        }
    }
};

function buildGraphFromObject(cells, rootName, graph, obj, parent) {

    if (!parent) {

        parent = makeElement({ rect: { fill: 'black' }, text: { text: rootName, fill: 'white' }});
        cells.push(parent);
    }

    _.each(obj, function(value, key) {

        var keyElement = makeElement({ text: { text: key }, rect: { fill: fillColor(value) } });
        cells.push(keyElement);

        if (parent) {

            var link = makeLink(parent, keyElement);
            cells.push(link);
        }

        if (!_.isFunction(value) && (_.isObject(value) || _.isArray(value))) {

            _.each(value, function(childValue, childKey) {

                var link;

                var childKeyElement = makeElement({ text: { text: childKey }, rect: { fill: fillColor(childValue) } });
                cells.push(childKeyElement);

                link = makeLink(keyElement, childKeyElement);
                cells.push(link);

                if (!_.isFunction(childValue) && (_.isObject(childValue) || _.isArray(childValue))) {

                    buildGraphFromObject(cells, rootName, graph, childValue, childKeyElement);

                } else {

                    // Leaf.
                    var grandChildElement = makeElement({ text: { text: childValue }, rect: { fill: fillColor(childValue) } });
                    cells.push(grandChildElement);
                    link = makeLink(childKeyElement, grandChildElement);
                    cells.push(link);
                }
            });

        } else {

            // Leaf.
            var childKeyElement = makeElement({ text: { text: value }, rect: { fill: fillColor(value) } });
            cells.push(childKeyElement);

            var link = makeLink(keyElement, childKeyElement);
            cells.push(link);
        }
    });
}

function fillColor(value) {

    var fill = ({
        '[object Object]': 'white',
        '[object Array]': 'lightgray',
        '[object Boolean]': 'green',
        '[object Number]': 'lightblue',
        '[object String]': 'orange',
        '[object Function]': 'yellow'

    })[Object.prototype.toString.call(value)];

    return fill;
}

function makeLink(el1, el2) {

    var l = new joint.dia.Link({
        source: { id: el1.id },
        target: { id: el2.id },
        attrs: {
            '.marker-target': { d: 'M 4 0 L 0 2 L 4 4 z' }
        }
    });
    return l;
}

function makeElement(attrs) {

    var label = (attrs.text.text += '');

    var maxLineLength = _.reduce(label.split('\n'), function(max, line) {
        return Math.max(max, line.length);
    }, Number.MIN_VALUE);

    var letterSize = 8;
    var width = letterSize * (0.6 * maxLineLength + 1);
    var height = (label.split('\n').length + 1) * letterSize;

    var el = new joint.shapes.basic.Rect({
        size: { width: width, height: height },
        attrs: {
            text: { 'font-size': letterSize, 'font-family': 'monospace' }
        }
    });

    el.attr(attrs);
    return el;
}


var renderTimeStart = new Date;
var cells = [];
buildGraphFromObject(cells, 'ROOT', graph, json);
graph.resetCells(cells);
console.log('JointJS render time:', ((new Date).getTime() - renderTimeStart) + 'ms');
console.log('JointJS number of cells:', graph.get('cells').length, '(links:', graph.getLinks().length, 'elements:', graph.getElements().length + ')');


/*
var a = makeElement({ text: { text: 'a' } });
var b = makeElement({ text: { text: 'b' } });
var c = makeElement({ text: { text: 'c' } });
var d = makeElement({ text: { text: 'd' } });
var e = makeElement({ text: { text: 'e' } });

var ab = makeLink(a, b);
var ac = makeLink(a, c);
var cd = makeLink(c, d);
var ce = makeLink(c, e);
var eb = makeLink(e, b);

graph.addCell([a, b, c, d, e, ab, ac, cd, ce, eb]);
*/

joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false, rankDir: 'TB' });
