'use strict';

// JointJS v2.0.0 Performance tips

// Overall goals
// -------------
// 1. reduce number of DOM elements
// 2. avoid asking the browser for element bounding boxes as much as possible

// Number of elements 0 - ?
var COUNT = 500;
// Async rendering true/false
// true: does not block the UI
var ASYNC = false;

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('canvas'),
    width: COUNT / 2 * 110,
    height: 500,
    model: graph,
    async: ASYNC
});

var el = new joint.shapes.basic.Generic({
    // The majority of applications does not need elements to be rotatable.
    // Thus no `.rotatable` group is used in this example.
    // e.g. `element.rotate(45)` has no effect.
    // There is also no need for the `.scalable` group. Using special attributes `ref-width`
    // and `ref-height` does the same trick here (it expands the SVG Rectangle based on the
    // current model dimensions).
    markup: '<rect class="body"/><text class="label"/>',
    size: {
        width: 100,
        height: 50
    },
    attrs: {
        '.body': {
            // Using of special 'ref-like` attributes it's not generally the most
            // performer. In this particular case it's different though.
            // If the `ref` attribute is not defined all the metrics (width, height, x, y)
            // are taken from the model. There is no need to ask the browser for
            // an element bounding box.
            // All calculation are done just in Javascript === very fast.
            refWidth: '100%',
            refHeight: '100%',
            stroke: 'red',
            strokeWidth: 2,
            fill: 'lightgray',
            rx: 5,
            ry: 5
        },
        '.label': {
            fill: 'black',
            // Please see the `ref-width` & `ref-height` comment.
            refX: '50%',
            refY: '50%',
            // Do not use special attribute `x-alignment` when not necessary.
            // It calls getBBox() on the SVGText element internally. Measuring text
            // in the browser is usually the slowest.
            // `text-anchor` attribute does the same job here (works for the text elements only).
            textAnchor: 'middle',
            // Do not use special attribute `y-alignment`. See above.
            // `y="0.3em"` gives the best result.
            y: '.3em'
        }
    },
    z: 2
});

var l = new joint.dia.Link({
    // use only SVG Elements that you need in the application
    // e.g in this example vertices, tools or wrapper is not needed
    markup: '<path class="connection"/>',
    z: 1,
    attrs: {
        '.connection': {
            stroke: 'green',
            strokeWidth: 2,
            // SVG Markers are pretty fast. Let's take advantage of this.
            targetMarker: {
                type: 'path',
                fill: 'green',
                stroke: 'none',
                d: 'M 10 -10 0 0 10 10 z'
            }
        }
    }
});

var cells = [];
_.times(COUNT / 2, function(n) {
    var a = el.clone().position(n * 110, 100).attr('.label/text', n + 1);
    var b = el.clone().position(n * 100, 300).attr('.label/text', n + 1 + (COUNT / 2));
    var ab = l.clone().prop('source/id', a.id).prop('target/id', b.id);
    cells.push(a, b, ab);
});

var startTime = new Date();

function showResult() {
    var duration = (new Date() - startTime) / 1000;
    document.getElementById('perf').textContent = (COUNT + ' elements and ' + COUNT / 2 + ' links rendered in ' + duration + 's');
}

// Prefer resetCells() over `addCells()` to add elements in bulk.
// SVG as oppose to HTML does not know `z-index` attribute.
// The "z" coordinate is determined by the order of the sibling elements. The JointJS
// paper makes sure the DOM elements are sorted based on the "z" stored on each element model.
graph.resetCells(cells);


if (ASYNC) {
    paper.on('render:done', showResult);
} else {
    showResult();
}

// There is still room for improvements in JointJS from the performance perspective.
// We're definitely going to address this in the upcoming releases.
