'use strict';

// JointJS Performance tips

// Overall goals
// -------------
// 1. reduce number of DOM elements (See async.html demo)
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
    async: ASYNC,
    frozen: true,
    sorting: joint.dia.Paper.sorting.APPROX
});

var Shape = joint.dia.Element.define('Shape', {
    size: {
        width: 100,
        height: 50
    },
    attrs: {
        body: {
            // Using of special 'ref-like` attributes it's not generally the most
            // efficient. In this particular case it's different though.
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
        label: {
            fill: 'black',
            // Please see the `ref-width` & `ref-height` comment.
            refX: '50%',
            refY: '50%',
            // Do not use special attribute `x-alignment` when not necessary.
            // It calls getBBox() on the SVGText element internally. Measuring text
            // in the browser is usually the slowest.
            // `text-anchor` attribute does the same job here (works for the text elements only).
            textAnchor: 'middle',
            // Do not use special attribute `y-alignment` for text vertical positioning. See above.
            textVerticalAnchor: 'middle'
        }
    },
    z: 2
}, {
    // if markup does not change during the application life time, define it on the prototype (i.e. not in the defaults above)
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
});


var Link = joint.dia.Link.define('Link', {
    z: 1,
    attrs: {
        line: {
            connection: true,
            // SVG Markers are pretty fast. Let's take advantage of this.
            targetMarker: {
                type: 'path',
                fill: 'green',
                stroke: 'none',
                d: 'M 10 -10 0 0 10 10 z'
            }
        }
    }
}, {
    markup: [{
        tagName: 'path',
        selector: 'line',
        attributes: {
            // Here comes SVG attributes, for which values won't change during the application life time.
            // These are specs SVG attributes. Do not add special attributes (e.g. targetMarker, fill: { /* gradient */ })).
            // These attributes are set during render, and never touched again during updates.
            'stroke': 'green',
            'stroke-width': 2,
        }
    }]
});

var el = new Shape();
var l = new Link();

var cells = [];

Array.from({ length: COUNT / 2 }).forEach(function(_, n) {
    var a = el.clone().position(n * 110, 100);
    var b = el.clone().position(n * 100, 300);
    // Since at this point the elements are not in the graph / are not rendered
    // we can change the text label silently (instead of calling attr(), that would deep clone all `attrs`)
    a.attributes.attrs.label.text = n + 1;
    b.attributes.attrs.label.text = n + 1 + (COUNT / 2);
    var ab = l.clone().set({
        source: { id: a.id },
        target: { id: b.id }
    });
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
graph.resetCells(cells, {
    sort: false // do not sort cells in the graph
});

paper.unfreeze({
    afterRender: function() {
        showResult();
        paper.unfreeze();
    }
});
