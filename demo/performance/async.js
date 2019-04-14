'use strict';

var Paper = joint.dia.Paper;
var Rectangle = joint.shapes.standard.Rectangle;
var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('canvas'),
    width: 1000,
    height: 1000,
    model: graph,
    rendering: Paper.rendering.ASYNC,
    sorting: Paper.sorting.APPROX,
    viewport: function(view) {
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
        position: { x: column * 60, y: row * 60 },
        attrs: { body: { text: index, fill: rndColor() }},
        z: 1
    });
});

var viewport = new Rectangle({
    size: { width: 100, height: 100 },
    position: { x: 100, y: 100 },
    attrs: {
        body: {
            fill: 'transparent',
            stroke: 'red'
        }
    },
    z: 2
});

graph.resetCells(elements.concat(viewport));
