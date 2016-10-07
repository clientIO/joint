var graph = new joint.dia.Graph();
var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 600,
    height: 400,
    gridSize: 1,
    model: graph,
    linkConnectionPoint: function(linkView, view) {
        // connection point is always in the center of an element
        return view.model.getBBox().center();
    }
});

var elements = [
   
    new joint.shapes.basic.Path({
        position: { x: 75, y: 175 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'joint', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 0 0 L 100 0 80 20 100 40 0 40 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 200, y: 275 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'dia', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 80 20 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 200, y: 75 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'util', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 80 20 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 200, y: 175 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'shapes', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 80 20 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 175 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'basic', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 80 20 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 450, y: 150 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'Path', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 450, y: 200 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'Text', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 250 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'Paper', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 300 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'Graph', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 100 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'getByPath', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 50 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'setByPath', 'ref-y': 0.5, 'y-alignment': 'middle' },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    })
];

// add all elements to the graph
graph.resetCells(elements);

var linkEnds = [
    { source: 0, target:  1 }, { source: 0, target: 2 }, { source: 0, target: 3 },
    { source: 1, target:  7 }, { source: 1, target: 8 },
    { source: 2, target:  9 }, { source: 2, target: 10 },
    { source: 3, target:  4 },
    { source: 4, target:  5 }, { source: 4, target:  6 }
];

// add all links to the graph
_.each(linkEnds, function(ends) {
    new joint.dia.Link({
        source: { id: elements[ends.source].id },
        target: { id: elements[ends.target].id },
        z: -1 // make sure all links are displayed under the elements
    }).addTo(graph);
});

// cache important html elements
var $ox = $('#ox');
var $oy = $('#oy');
var $sx = $('#sx');
var $sy = $('#sy');
var $w = $('#width');
var $h = $('#height');
var $ftcPadding = $('#ftc-padding');
var $ftcGridW = $('#ftc-grid-width');
var $ftcGridH = $('#ftc-grid-height');
var $ftcNewOrigin = $('#ftc-new-origin');
var $stfPadding = $('#stf-padding');
var $stfMinScale = $('#stf-min-scale');
var $stfMaxScale = $('#stf-max-scale');
var $stfScaleGrid = $('#stf-scale-grid');
var $stfRatio = $('#stf-ratio');
var $bboxX = $('#bbox-x');
var $bboxY = $('#bbox-y');
var $bboxW = $('#bbox-width');
var $bboxH = $('#bbox-height');
var $grid = $('#grid');

// cache important svg elements
var svg = V(paper.svg);
var svgVertical = V('path').attr('d', 'M -10000 -1 L 10000 -1');
var svgHorizontal = V('path').attr('d', 'M -1 -10000 L -1 10000');
var svgRect = V('rect');
var svgAxisX = svgVertical.clone().addClass('axis');
var svgAxisY = svgHorizontal.clone().addClass('axis');
var svgBBox = svgRect.clone().addClass('bbox');

svgBBox.hide = _.debounce(function() {
    svgBBox.removeClass('active');
}, 500);

// svg Container - contains all non-jointjs svg elements
var svgContainer = [];

svgContainer.showAll = function() {
    _.each(this, function(v) { v.addClass('active'); });
};

svgContainer.hideAll = function() {
    _.each(this, function(v) { v.removeClass('active'); });
};

svgContainer.removeAll = function() {
    while (this.length > 0) {
        this.pop().remove();
    }
};

// Axis has to be appended to the svg, so it won't affect the viewport.
svg.append([svgAxisX, svgAxisY, svgBBox]);

function fitToContent() {

    svgContainer.removeAll();

    var padding = parseInt($ftcPadding.val(), 10);
    var gridW = parseInt($ftcGridW.val(), 10);
    var gridH = parseInt($ftcGridH.val(), 10);
    var allowNewOrigin = $ftcNewOrigin.val();

    paper.fitToContent({
        padding: padding,
        gridWidth: gridW,
        gridHeight: gridH,
        allowNewOrigin: allowNewOrigin
    });

    var bbox = paper.getContentBBox();

    var translatedX = allowNewOrigin == 'any' || (allowNewOrigin == 'positive' && bbox.x - paper.options.origin.x >= 0) || (allowNewOrigin == 'negative' && bbox.x - paper.options.origin.x < 0);
    var translatedY = allowNewOrigin == 'any' || (allowNewOrigin == 'positive' && bbox.y - paper.options.origin.y >= 0) || (allowNewOrigin == 'negative' && bbox.y - paper.options.origin.y < 0);

    if (padding) {

        var svgPaddingRight = svgHorizontal.clone().addClass('padding')
            .translate(paper.options.width - padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);
        
        var svgPaddingBottom = svgVertical.clone().addClass('padding')
            .translate(0, paper.options.height - padding / 2, { absolute: true })
            .attr('stroke-width', padding);

        svg.append([svgPaddingBottom, svgPaddingRight]);
        svgContainer.push(svgPaddingBottom, svgPaddingRight);
    }

    if (padding && (translatedX || translatedY)) {

        var paddings = [];

        if (translatedY) {

            var svgPaddingTop = svgVertical.clone().addClass('padding')
                .translate(0, padding / 2, { absolute: true })
                .attr('stroke-width', padding);

            paddings.push(svgPaddingTop);
        }

        if (translatedX) {

            var svgPaddingLeft = svgHorizontal.clone().addClass('padding')
                .translate(padding / 2, 0, { absolute: true })
                .attr('stroke-width', padding);

            paddings.push(svgPaddingLeft);
        }

        if (paddings.length) {
            svg.append(paddings);
            svgContainer.push.apply(svgContainer, paddings);
        }
    }

    if (gridW > 2) {

        var x = gridW;

        if (translatedX) x += padding;

        do {

            var svgGridX = svgHorizontal.clone().translate(x, 0, { absolute: true }).addClass('grid');
            svg.append(svgGridX);
            svgContainer.push(svgGridX);
            
            x += gridW;
            
        } while (x < paper.options.width - padding);
    }

    if (gridH > 2) {

        var y = gridH;

        if (translatedY) y += padding;

        do {

            var svgGridY = svgVertical.clone().translate(0, y, { absolute: true }).addClass('grid');
            svg.append(svgGridY);
            svgContainer.push(svgGridY);
            y += gridH;
            
        } while (y < paper.options.height - padding);
    }

    svgContainer.showAll();
}

function scaleToFit() {

    svgContainer.removeAll();

    var padding = parseInt($stfPadding.val(), 10);
    
    paper.scaleContentToFit({
        padding: padding,
        minScale: parseFloat($stfMinScale.val()),
        maxScale: parseFloat($stfMaxScale.val()),
        scaleGrid: parseFloat($stfScaleGrid.val()),
        preserveAspectRatio: $stfRatio.is(':checked')
    });

    paper.viewport.getBoundingClientRect(); // MS Edge hack to fix the invisible text.

    if (padding) {

        var svgPaddingRight = svgHorizontal.clone().addClass('padding')
            .translate(paper.options.width - padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);
        
        var svgPaddingBottom = svgVertical.clone().addClass('padding')
            .translate(0, paper.options.height - padding / 2, { absolute: true })
            .attr('stroke-width', padding);

        var svgPaddingLeft = svgVertical.clone().addClass('padding')
            .translate(0, padding / 2, { absolute: true })
            .attr('stroke-width', padding);

        var svgPaddingTop = svgHorizontal.clone().addClass('padding')
            .translate(padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);

        svg.append([svgPaddingBottom, svgPaddingRight, svgPaddingTop, svgPaddingLeft]);
        svgContainer.push(svgPaddingBottom, svgPaddingRight, svgPaddingTop, svgPaddingLeft);
    }

    svgContainer.showAll();
}

function getGridBackgroundImage(gridX, gridY) {

    var canvas = document.createElement('canvas');
    canvas.width = gridX;
    canvas.height = gridY;

    if (gridX > 5 && gridY > 5) {

        var ox = $ox.val();
        var oy = $oy.val();

        gridX = ox >= 0 ? ox % gridX : gridX + ox % gridX - 1;
        gridY = oy >= 0 ? oy % gridY : gridY + oy % gridY - 1;

        var context = canvas.getContext('2d');
        context.beginPath();
        context.rect(gridX, gridY, 1, 1);
        context.fillStyle = 'black';
        context.fill();
    }

    return canvas.toDataURL('image/png');
}

function updateBBox() {

    var bbox = paper.getContentBBox();

    $bboxX.text(Math.round(bbox.x - paper.options.origin.x));
    $bboxY.text(Math.round(bbox.y - paper.options.origin.y));
    $bboxW.text(Math.round(bbox.width));
    $bboxH.text(Math.round(bbox.height));

    svgBBox.attr(bbox).addClass('active').hide();
}

/* events */

$('#fit-to-content input, #fit-to-content select').on('input change', fitToContent);
$('#scale-to-fit input').on('input change', scaleToFit);

$ox.on('input change', function() {
    paper.setOrigin(parseInt(this.value, 10), parseInt($oy.val(), 10));
});
$oy.on('input change', function() {
    paper.setOrigin(parseInt($ox.val(), 10), parseInt(this.value, 10));
});
$sx.on('input change', function() {
    paper.scale(parseFloat(this.value), parseFloat($sy.val()));
});
$sy.on('input change', function() {
    paper.scale(parseFloat($sx.val()), parseFloat(this.value));
});
$w.on('input change', function() {
    paper.setDimensions(parseInt(this.value, 10), parseInt($h.val(),10));
});
$h.on('input change', function() {
    paper.setDimensions(parseInt($w.val(), 10), parseInt(this.value, 10));
});
$grid.on('input change', function() {
    paper.options.gridSize = this.value;
    paper.$el.css('background-image', 'url("' + getGridBackgroundImage(this.value * $sx.val(), this.value * $sy.val()) + '")');
});
$('.range').on('input change', function() {
    $(this).next().text(this.value);
});

paper.on({

    scale: function(sx, sy) {

        $sx.val(sx).next().text(sx.toFixed(2));
        $sy.val(sy).next().text(sy.toFixed(2));

        var grid = $grid.val();
        paper.$el.css('background-image', 'url("' + getGridBackgroundImage(grid * sx, grid * sy) + '")');

        svgContainer.hideAll();
    },

    translate: function(ox, oy) {

        $ox.val(ox).next().text(Math.round(ox));
        $oy.val(oy).next().text(Math.round(oy));

        // translate axis
        svgAxisX.translate(0, oy, { absolute: true });
        svgAxisY.translate(ox, 0, { absolute: true });

        var grid = $grid.val();
        paper.$el.css('background-image', 'url("' + getGridBackgroundImage(grid * $sx.val(), grid * $sy.val()) + '")');

        svgContainer.hideAll();
    },

    resize: function(width, height) {

        $w.val(width).next().text(Math.round(width));
        $h.val(height).next().text(Math.round(height));

        svgContainer.hideAll();
    }
});

graph.on('change', function() {
    svgContainer.hideAll();
    updateBBox();
});

updateBBox();
