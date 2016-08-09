var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});

// Create a custom element.
// ------------------------

joint.shapes.custom = {};
// The following custom shape creates a link out of the whole element.
joint.shapes.custom.ElementLink = joint.shapes.basic.Rect.extend({
    // Note the `<a>` SVG element surrounding the rest of the markup.
    markup: '<a><g class="rotatable"><g class="scalable"><rect/></g><text/></g></a>',
    defaults: _.defaultsDeep({
        type: 'custom.ElementLink'
    }, joint.shapes.basic.Rect.prototype.defaults)
});
// The following custom shape creates a link only out of the label inside the element.
joint.shapes.custom.ElementLabelLink = joint.shapes.basic.Rect.extend({
    // Note the `<a>` SVG element surrounding the rest of the markup.
    markup: '<g class="rotatable"><g class="scalable"><rect/></g><a><text/></a></g>',
    defaults: _.defaultsDeep({
        type: 'custom.ElementLabelLink'
    }, joint.shapes.basic.Rect.prototype.defaults)
});

// Create JointJS elements and add them to the graph as usual.
// -----------------------------------------------------------

var el1 = new joint.shapes.custom.ElementLink({
    position: { x: 80, y: 80 }, size: { width: 170, height: 100 },
    attrs: {
        rect: { fill: '#E67E22', stroke: '#D35400', 'stroke-width': 5 },
        a: { 'xlink:href': 'http://jointjs.com', 'xlink:show': 'new', cursor: 'pointer' },
        text: { text: 'Element as a link:\nhttp://jointjs.com', fill: 'white' }
    }
});
var el2 = new joint.shapes.custom.ElementLabelLink({
    position: { x: 370, y: 160 }, size: { width: 170, height: 100 },
    attrs: {
        rect: { fill: '#9B59B6', stroke: '#8E44AD', 'stroke-width': 5 },
        a: { 'xlink:href': 'http://jointjs.com', cursor: 'pointer' },
        text: { text: 'Only label as a link:\nhttp://jointjs.com', fill: 'white' }
    }
});

var l = new joint.dia.Link({
    source: { id: el1.id }, target: { id: el2.id },
    attrs: { '.connection': { 'stroke-width': 5, stroke: '#34495E' } }
});

graph.addCells([el1, el2, l]);

