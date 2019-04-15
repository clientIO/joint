'use strict';

var Paper = joint.dia.Paper;
var Graph = joint.dia.Graph;
var Rectangle = joint.shapes.standard.Rectangle;
var Link = joint.shapes.standard.Link;

var graph = new Graph;
var paper = new Paper({
    el: document.getElementById('canvas'),
    width: 1000,
    height: 1000,
    model: graph,
    rendering: Paper.rendering.ASYNC,
    sorting: Paper.sorting.APPROX,
    defaultAnchor: { name: 'modelCenter' },
    defaultConnectionPoint: { name: 'boundary' },
    viewport: function(view) {
        //if (view.model.isElement()) return true;
        return viewport.getBBox().intersect(view.model.getBBox());
    }
});

function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function rndColor() {
    return 'hsl(' + rnd(171, 181) + ',' + rnd(58, 72) + '%,' + rnd(45, 55) + '%)';
}

var COUNT = 100;
var COLUMN_COUNT = 10;
var elements = Array.from({ length: COUNT }, function(_, index) {
    var row = Math.floor(index / COLUMN_COUNT);
    var column = index % COLUMN_COUNT;
    return new Rectangle({
        size: { width: 50, height: 50 },
        position: { x: column * 100, y: row * 100 },
        attrs: {
            body: { fill: rndColor() },
            label: { text: index, refY: 10 }
        },
        z: 2
    });
});

var links = elements.map(function(target, index) {
    if (index === 0) return null;
    var source = elements[index - 1];
    return new Link({
        source: { id: source.id },
        target: { id: target.id },
        z: 1
    });
});
links.shift();

var viewport = new Rectangle({
    size: { width: 100, height: 100 },
    position: { x: 100, y: 100 },
    attrs: {
        body: {
            fill: 'transparent',
            stroke: 'red'
        }
    },
    z: 3
});

graph.resetCells(elements.concat(links).concat(viewport));
