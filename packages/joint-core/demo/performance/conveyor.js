'use strict';

joint.dia.Element.define('perf.ConveyorElement', {

    hasPallet: false

}, {
    PADDING: 2,

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

joint.shapes.perf.ConveyorElementView = joint.dia.ElementView.extend({

    initFlag: ['TRANSLATE', 'RESIZE', 'ROTATE', 'PALLET', 'MARKUP'],

    presentationAttributes: {
        'position': ['TRANSLATE'],
        'size': ['RESIZE', 'ROTATE'],
        'angle': ['ROTATE'],
        'hasPallet': ['PALLET']
    },

    confirmUpdate: function(flag) {

        if (this.hasFlag(flag, 'MARKUP')) this.renderMarkup();
        if (this.hasFlag(flag, 'PALLET')) this.updatePallet();
        if (this.hasFlag(flag, 'RESIZE')) this.resize();
        if (this.hasFlag(flag, 'ROTATE')) this.rotate();
        if (this.hasFlag(flag, 'TRANSLATE')) this.translate();
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

    renderMarkup: function() {

        this.svgOuterRect = this.constructor.outerRect.clone();
        this.svgInnerRect = this.constructor.innerRect.clone();
        this.vel.append([this.svgOuterRect, this.svgInnerRect]);
    },

    resize: function() {

        this.updateRectsDimensions();
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

        var conveyorElement = new joint.shapes.perf.ConveyorElement({
            position: { x: p.x, y: p.y },
            size: { width: rectSize, height: rectSize },
            angle: -angle
        });

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
var paper = new joint.dia.Paper({
    el: document.getElementById('canvas'),
    width: canvasWidth,
    height: canvasHeight,
    model: graph,
    async: true,
    sorting: joint.dia.Paper.sorting.APPROX,
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
