'use strict';

joint.dia.FastPaper = joint.dia.Paper.extend({

    sortViews: _.noop,

    beforeRenderViews: function() {

        this.documentFragment = document.createDocumentFragment();
    },

    renderView: function(cell) {

        var view = this._views[cell.id] = this.createViewForModel(cell);

        // Keep the document fragment sorted. First goes links and then elements. L-L-L-L-L-E-E-E-E-E-E
        if (cell.isLink()) {
            this.documentFragment.insertBefore(view.el, this.documentFragment.firstChild);
        } else {
            this.documentFragment.appendChild(view.el);
        }

        view.paper = this;
        view.render();

        return view;
    },

    asyncBatchAdded: function() {

        if (this.documentFragment.children.length) {
            // Insert the document fragment after last link. i.e. If the viewport is sorted having
            // L1-L2-L3-E1-E2-E3 and the fragment contains L4-E4 we want the viewport stay sorted.
            // -> L1-L2-L3-L4-E4-E1-E2-E3
            // Also note that there in the viewport could be a single element, but never a single link.
            this.viewport.insertBefore(this.documentFragment, this.viewport.querySelector('.element'));
            this.documentFragment = document.createDocumentFragment();
        }
    }
});

joint.shapes.basic.ConveyorElement = joint.dia.Element.extend({

    PADDING: 2,

    defaults: _.defaultsDeep({

        type: 'basic.ConveyorElement',
        hasPallet: false

    }, joint.dia.Element.prototype.defaults),

    addPallet: function() {

        this.set('hasPallet', true);
    },

    removePallet: function() {

        this.set('hasPallet', false);
    },

    hasPallet: function() {

        return !!this.get('hasPallet');
    },

    switchPallet:function() {

        if (this.hasPallet()) {
            this.removePallet();
        } else {
            this.addPallet();
        }
    },

    getOuterRectBBox: function() {

        var size = this.get('size');
        var bbox = {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height
        };

        return bbox;
    },

    getInnerRectBBox: function() {

        var padding = this.PADDING;
        var size = this.get('size');
        var bbox = {
            x: padding,
            y: padding,
            width: size.width - 2 * padding,
            height: size.height - 2 * padding
        };

        return bbox;
    }
});


joint.shapes.basic.ConveyorElementView = joint.dia.ElementView.extend({

    initialize: function() {

        this.listenTo(this.model, 'change:position', this.translate);
        this.listenTo(this.model, 'change:size', this.resize);
        this.listenTo(this.model, 'change:angle', this.rotate);
        this.listenTo(this.model, 'change:hasPallet', this.updatePallet);
    },

    updatePallet: function() {

        var palletColor = this.model.hasPallet() ? 'blue' : 'red';

        this.svgInnerRect.attr('fill', palletColor);
    },

    updateRectsDimensions: function() {

        var model = this.model;

        this.svgOuterRect.attr(model.getOuterRectBBox());
        this.svgInnerRect.attr(model.getInnerRectBBox());
    },

    update: function() {

        this.updatePallet();
    },

    renderMarkup: function() {

        this.svgOuterRect = this.constructor.outerRect.clone();
        this.svgInnerRect = this.constructor.innerRect.clone();

        this.vel.append([this.svgOuterRect, this.svgInnerRect]);
    },

    resize: function() {

        this.updateRectsDimensions();
        // fix rotate transformation origin.
        this.rotate();
    },

    translate: function() {

        var model = this.model;
        var position = model.get('position');

        this.vel.translate(position.x, position.y, { absolute: true });
    },

    rotate: function() {

        var model = this.model;
        var angle = model.get('angle');
        var size = model.get('size');

        this.vel.rotate(angle, size.width / 2, size.height / 2, { absolute: true });
    }

}, {
    innerRect: V('rect').addClass('rect-inner'),
    outerRect: V('rect').addClass('rect-outer')
});




function createCircle(center, radius, rectSize) {

    var elements = [];

    for (var angle = 0; angle < 360; angle += 3) {

        var p = g.point.fromPolar(radius, g.toRad(angle), center);

        var conveyorElement = new joint.shapes.basic.ConveyorElement({
            position: { x: p.x, y: p.y },
            size: { width: rectSize, height: rectSize },
            angle: -angle
        });

        console.log(`Add: ${p.x} x ${p.y}`);

        if (elements.length % 2 === 0) {
            conveyorElement.addPallet();
        } else {
            conveyorElement.removePallet();
        }

        elements.push(conveyorElement);
    }

    return elements;
}


var canvasWidth = 1000;
var canvasHeight = 1000;
var graph = new joint.dia.Graph;
var paper = new joint.dia.FastPaper({
    el: document.getElementById('canvas'),
    width: canvasWidth,
    height: canvasHeight,
    model: graph,
    async: true,
    background: {
        color: '#000000'
    }
});

// efficient drawing
var rectSize = 18;
var center = paper.getArea().center();
var radius = canvasHeight / 2;
var conveyorElements = [];

for (var i = 0; i < 10; i++) {
    Array.prototype.push.apply(conveyorElements, createCircle(center, radius - 50 - (i * 30), rectSize));
}

graph.resetCells(conveyorElements);

// status update event simulation

var frames = 0;
var startTime = Date.now();
var prevTime = startTime;
var fpsElement = document.getElementById('fps');

var updateConveyor = function() {

    for (i = 0; i < conveyorElements.length; i+=1) {
        conveyorElements[i].switchPallet();
    }

    var time = Date.now();
    frames++;

    if (time > prevTime + 1000) {
        var fps = Math.round((frames * 1000) / (time - prevTime));
        prevTime = time;
        frames = 0;
        fpsElement.textContent = 'FPS: ' + fps;
    }
};

setInterval(updateConveyor, 1);

