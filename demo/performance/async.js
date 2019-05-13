/* eslint no-console: "off" */
'use strict';

var Paper = joint.dia.Paper;
var Graph = joint.dia.Graph;
var Rectangle = joint.shapes.standard.Rectangle;
var Link = joint.shapes.standard.Link;
var graph = new Graph;

var windowBBox;
function setWindowBBox() {
    windowBBox = paper.pageToLocalRect(window.scrollX, window.scrollY, window.innerWidth, window.innerHeight);
}
window.onscroll = function() { setWindowBBox(); };
window.onresize = function() { setWindowBBox(); };

var viewportTemplate = new Rectangle({
    size: { width: 200, height: 200 },
    position: { x: 100, y: 100 },
    attrs: {
        body: {
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 10,
            pointerEvents: 'stroke'
        }
    },
    z: 3
});
var viewport = null;

var paper = new Paper({
    el: document.getElementById('canvas'),
    width: '100%',
    height: '100%',
    model: graph,
    async: true,
    frozen: true,
    sorting: Paper.sorting.APPROX,
    defaultAnchor: { name: 'modelCenter' },
    defaultConnectionPoint: { name: 'boundary' },
    viewport: function(view, isInViewport) {
        if (leaveDraggedInViewport && view.cid === draggedCid) return true;
        if (leaveRenderedInViewport && isInViewport) return true;
        if (viewportRect) {
            var viewportBBox = viewport.getBBox();
            return viewportBBox.intersect(view.model.getBBox().inflate(padding));
        } else {
            if (view.model === viewport) return false;
            return windowBBox.intersect(view.model.getBBox().inflate(padding));
        }
    }
});

paper.el.style.border = '1px solid black';

paper.on('render:done', function(stats) {
    console.table(stats);
});

// Dragged view is always visible
var draggedCid = null;
paper.on({
    'cell:pointerdown': function(view) {
        draggedCid = view.cid;
    },
    'cell:pointerup': function() {
        draggedCid = null;
    }
});

// Loader
var Loader = joint.mvc.View.extend({
    tagName: 'div',
    style: {
        'position': 'absolute',
        'top': 0,
        'left': 0,
        'right': 0,
        'height': 20,
        'background': 'white',
        'border': '1px solid black',
        'padding': 2
    },
    children: [{
        tagName: 'div',
        selector: 'bar',
        style: {
            'height': '100%',
            'width': '0%',
            'background': 'blue',
            'transition': 'width 0.2s'
        }
    }],

    init: function() {
        this.renderChildren();
    },

    progress: function(value) {
        this.childNodes.bar.style.width = (Math.min(Math.max(value, 0), 1) * 100) + '%';
    }
});

var loader = new Loader();

// Inputs
var viewportInput = document.getElementById('viewport');
var viewportRect = viewportInput.checked;
viewportInput.addEventListener('click', function(evt) {
    viewportRect = evt.target.checked;
}, false);

var leaveRenderedInput = document.getElementById('leave-rendered-in-viewport');
var leaveRenderedInViewport = leaveRenderedInput.checked;
leaveRenderedInput.addEventListener('click', function(evt) {
    leaveRenderedInViewport = evt.target.checked;
}, false);

var leaveDraggedInput = document.getElementById('leave-dragged-in-viewport');
var leaveDraggedInViewport = leaveDraggedInput.checked;
leaveDraggedInput.addEventListener('click', function(evt) {
    leaveDraggedInViewport = evt.target.checked;
}, false);

var countInput = document.getElementById('count');
var columnCountInput = document.getElementById('column-count');

var restartButton = document.getElementById('restart');
restartButton.addEventListener('click', function() {
    restart();
}, false);

var paddingInput = document.getElementById('padding');
var padding = viewportInput.checked ? 100 : 1;
paddingInput.addEventListener('click', function(evt) {
    padding = evt.target.checked ? 100 : 1;
}, false);

var batchSizeInput = document.getElementById('batch-size');

setWindowBBox();
restart();

function restart() {

    loader.progress(0);
    loader.$el.appendTo(document.body);

    console.time('perf-all');

    var count = countInput.value;
    var columnCount = columnCountInput.value;

    var elements = Array.from({ length: count }, function(_, index) {
        var row = Math.floor(index / columnCount);
        var column = index % columnCount;
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

    viewport = viewportTemplate.clone();

    console.time('perf-reset');

    paper.freeze();
    graph.resetCells(elements.concat(links).concat(viewport));
    paper.fitToContent({ useModelGeometry: true, padding: 10 });

    console.timeEnd('perf-reset');

    console.time('perf-dump');

    paper.unfreeze({
        batchSize: batchSizeInput.value,
        progress: function(done, current, total) {
            var progress = current / total;
            console.log(Math.round(progress * 100) + '%');
            if (done) {
                console.timeEnd('perf-dump');
                console.timeEnd('perf-all');
                paper.unfreeze();
                loader.el.remove();
            } else {
                loader.progress(progress);
            }
        }
    });
}

function rndColor() {
    return 'hsl(' + g.random(171, 181) + ',' + g.random(58, 72) + '%,' + g.random(45, 55) + '%)';
}
