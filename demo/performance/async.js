'use strict';

var Paper = joint.dia.Paper;
var Graph = joint.dia.Graph;
var Rectangle = joint.shapes.standard.Rectangle;
var Link = joint.shapes.standard.Link;

var viewportBBox = g.Rect(0, 0, window.innerWidth, window.innerHeight);
window.onscroll = function() {
    viewportBBox.x = window.scrollX;
    viewportBBox.y = window.scrollY;
};

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
    viewport: function(view, isInViewport) {
        //if (isInViewport) return true;
        //if (view.model.isLink()) return false;
        return viewport.getBBox().intersect(view.model.getBBox().inflate(1));
        //return viewportBBox.intersect(view.model.getBBox().inflate(1));
    }
});

function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function rndColor() {
    return 'hsl(' + rnd(171, 181) + ',' + rnd(58, 72) + '%,' + rnd(45, 55) + '%)';
}

var COUNT = 20000;
var COLUMN_COUNT = 40;
var elements = Array.from({ length: COUNT }, function(_, index) {
    var row = Math.floor(index / COLUMN_COUNT);
    var column = index % COLUMN_COUNT;
    return new Rectangle({
        size: { width: 30, height: 20 },
        position: { x: column * 50, y: row * 50 },
        attrs: {
            body: { fill: rndColor() },
            label: { text: index }
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
    size: { width: 200, height: 200 },
    position: { x: 100, y: 100 },
    attrs: {
        body: {
            fill: 'transparent',
            stroke: 'red'
        }
    },
    z: 3
});

paper.once('queue:empty', function() {
    console.timeEnd('perf');
});

console.time('perf');

graph.resetCells(elements.concat(links).concat(viewport));
paper.fitToContent({ useModelGeometry: true, padding: 10 });
