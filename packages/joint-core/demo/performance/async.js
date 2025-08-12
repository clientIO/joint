/* eslint no-console: "off" */
'use strict';

var Paper = joint.dia.Paper;
var Graph = joint.dia.Graph;
var Rectangle = joint.shapes.standard.Rectangle;
var Link = joint.shapes.standard.Link;
var geometry = joint.g;

var graph = new Graph({}, { cellNamespace: joint.shapes });

var windowBBox;
function setWindowBBox() {
    windowBBox = paper.pageToLocalRect(
        window.scrollX,
        window.scrollY,
        window.innerWidth,
        window.innerHeight
    );
}

window.onscroll = function() {
    setWindowBBox();
    paper.wakeUp();
};
window.onresize = function() {
    setWindowBBox();
    paper.wakeUp();
};

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
var viewportBBox;
function setViewportBBox() {
    viewportBBox = viewport.getBBox().inflate(padding);
}

var paper = new Paper({
    el: document.getElementById('canvas'),
    cellViewNamespace: joint.shapes,
    width: '100%',
    height: '100%',
    model: graph,
    async: true,
    frozen: true,
    autoFreeze: true,
    viewManagement: {
        lazyInitialize: true,
        disposeHidden: true,
    },
    defaultAnchor: {
        name: 'modelCenter'
    },
    defaultConnectionPoint: {
        name: 'rectangle',
        args: { useModelGeometry: true }
    },
    cellVisibility: function(model, isAlreadyMounted) {
        if (leaveDraggedInViewport && model === draggedModel) return true;
        if (leaveRenderedInViewport && isAlreadyMounted) return true;
        if (viewportRect) {
            return geometry.intersection.exists(viewportBBox, model.getBBox());
        } else {
            if (model === viewport) return false;
            return geometry.intersection.exists(windowBBox, model.getBBox());
        }
    }
});

paper.on({
    'render:done': () => console.log('Render done'),
    'render:idle': () => console.log('Render idle')
});


// Dragged view is always visible
var draggedModel = null;
paper.on({
    'cell:pointerdown': (view) => {
        draggedModel = view.model;
    },
    'cell:pointerup': () => {
        draggedModel = null;
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
    paper.wakeUp();
}, false);

var autoFreezeInput = document.getElementById('autofreeze');
var autoFreeze = autoFreezeInput.checked;
autoFreezeInput.addEventListener('click', function(evt) {
    autoFreeze = evt.target.checked;
    paper.options.autoFreeze = autoFreeze;
    paper.wakeUp();
}, false);

var leaveRenderedInput = document.getElementById('leave-rendered-in-viewport');
var leaveRenderedInViewport = leaveRenderedInput.checked;
leaveRenderedInput.addEventListener('click', function(evt) {
    leaveRenderedInViewport = evt.target.checked;
    paper.wakeUp();
}, false);

var leaveDraggedInput = document.getElementById('leave-dragged-in-viewport');
var leaveDraggedInViewport = leaveDraggedInput.checked;
leaveDraggedInput.addEventListener('click', function(evt) {
    leaveDraggedInViewport = evt.target.checked;
    paper.wakeUp();
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
    setViewportBBox();
    paper.wakeUp();
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
    viewport.on('change:position', function(el) {
        if (el === viewport) {
            setViewportBBox();
        }
    });

    console.time('perf-reset');

    paper.freeze();
    graph.resetCells(elements.concat(links).concat(viewport));
    paper.fitToContent({
        useModelGeometry: true,
        padding: 10,
        allowNewOrigin: 'any'
    });

    setViewportBBox();

    paper.unfreeze();

    console.timeEnd('perf-reset');

    console.time('perf-dump');

    paper.unfreeze({
        batchSize: batchSizeInput.value,
        progress: function(done, current, total, stats) {
            var progress = current / total;
            console.log(Math.round(progress * 100) + '%');
            if (done) {
                console.timeEnd('perf-dump');
                console.timeEnd('perf-all');
                console.table(stats);
                paper.unfreeze();
                loader.el.remove();
            } else {
                loader.progress(progress);
            }
        }
    });
}

function rndColor() {
    // only shades of blue and green
    return `rgb(0, ${geometry.random(100, 255)}, ${geometry.random(100, 255)})`;

}
