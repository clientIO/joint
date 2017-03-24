var graph = new joint.dia.Graph();
var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 600,
    height: 400,
    gridSize: 10,
    drawGrid: true,
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
            text: { text: 'joint', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 0 0 L 100 0 80 20 100 40 0 40 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 200, y: 275 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'dia', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 80 20 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 200, y: 75 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'util', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 80 20 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 200, y: 175 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'shapes', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 80 20 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 175 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'basic', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 80 20 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 450, y: 150 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'Path', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 450, y: 200 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'Text', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 250 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'Paper', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 300 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'Graph', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 100 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'getByPath', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
            path: { d: 'M 20 0 L 100 0 100 40 20 40 0 20 Z' }
        }
    }),

    new joint.shapes.basic.Path({
        position: { x: 325, y: 50 },
        size: { width: 100, height: 40 },
        attrs: {
            text: { text: 'setByPath', 'ref-y': 0.5, 'y-alignment': 'middle', 'ref-dy': null },
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
    paper.drawGrid();
});
$('.range').on('input change', function() {
    $(this).next().text(this.value);
});

paper.on({

    scale: function(sx, sy) {

        $sx.val(sx).next().text(sx.toFixed(2));
        $sy.val(sy).next().text(sy.toFixed(2));

        svgContainer.hideAll();
    },

    translate: function(ox, oy) {

        $ox.val(ox).next().text(Math.round(ox));
        $oy.val(oy).next().text(Math.round(oy));

        // translate axis
        svgAxisX.translate(0, oy, { absolute: true });
        svgAxisY.translate(ox, 0, { absolute: true });

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

var bgImageDataURL = 'data:image/png;base64,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';

$('#bg-toggle, #bg-color, #bg-repeat, #bg-opacity, #bg-size, #bg-position').on('change input', function() {
    paper.drawBackground({
        color: $('#bg-color').val(),
        image: $('#bg-toggle').is(':checked') ? bgImageDataURL : '',
        position: JSON.parse($('#bg-position').val().replace(/'/g, '"')),
        size: JSON.parse($('#bg-size').val().replace(/'/g, '"')),
        repeat: $('#bg-repeat').val(),
        opacity: $('#bg-opacity').val()
    });
});

var _inputRenderer = function(gridTypes, onChange) {

    var currentOpt = {};
    var formTypes = {
        'color': function(inputDef, container) {
            var input = $('<input/>', { type: 'color'}).val(inputDef.value).on('change input', function() {
                inputDef.onChange($(this).val(), currentOpt);
                onChange(currentOpt)
            }).trigger('change');
            container.append($('<label/>').text(inputDef.name));
            container.append(input);
        },
        'number': function(inputDef, container) {
            var input = $('<input/>', { type: 'range'})
                .val(inputDef.value)
                .attr({
                    step: inputDef.step,
                    min: inputDef.min,
                    max: inputDef.max
                })
                .on('change input', function() {
                    var value = parseFloat($(this).val()).toFixed(2);
                    $('output', $(this).parent()).text(value);
                    inputDef.onChange(value, currentOpt);
                    onChange(currentOpt);
                }).trigger('change');
            container.append($('<label/>').text(inputDef.name));
            container.append(input);
            container.append($('<output/>').text(input.val()));
        }
    };

    var renderInput =  function(formType, container) {
        return formTypes[formType.type](formType, container);
    };

    return {
        renderSettings: function (gridTypeName) {
            currentOpt.name = gridTypeName;
            currentOpt.args = [{}, {}];
            _.each(gridTypes[gridTypeName].inputs, function (x) {

                var element = $('<div/>').addClass('form-group').appendTo($gridTypesOpt);
                renderInput(x, element);
            });
            onChange(currentOpt);
        }
    }
};

var gridTypes = {
    'dot': {
        inputs: [{
            type: 'color', name: 'Color', value: '#000000',
            onChange: function(value, ref) {
                ref.args[0].color = value;
            }
        }, {
            type: 'number', name: 'Thickness', value: 1, step: 0.5, min: 0.5, max: 10,
            onChange: function(value, ref) {
                ref.args[0].thickness = value;
            }
        }]
    },
    'fixedDot': {
        inputs: [{
            type: 'color', name: 'Color', value: '#000000',
            onChange: function(value, ref) {
                ref.args[0].color = value;
            }
        }, {
            type: 'number', name: 'Thickness', value: 1, step: 0.5, min: 0.5, max: 10,
            onChange: function(value, ref) {
                ref.args[0].thickness = value;
            }
        }]
    },
    'mesh': {
        inputs: [{
            type: 'color', name: 'Color', value: '#000000',
            onChange: function(value, ref) {
                ref.args[0].color = value;
            }
        }, {
            type: 'number', prop: 'thickness', name: 'Thickness', value: 1, step: 0.5, min: 0.5, max: 10,
            onChange: function(value, ref) {
                ref.args[0].thickness = value;
            }
        }]
    },
    'doubleMesh': {
        inputs: [{
            type: 'color', name: 'Primary Color', value: '#AAAAAA',
            onChange: function(value, ref) {
                ref.args[0].color = value;
            }
        }, {
            type: 'number', name: 'Primary Thickness', value: 1, step: 0.5, min: 0.5, max: 5,
            onChange: function(value, ref) {
                ref.args[0].thickness = value;
            }
        }, {
            type: 'color', name: 'Secondary Color', value: '#000000',
            onChange: function(value, ref) {
                ref.args[1].color = value;
            }
        }, {
            type: 'number', name: 'Secondary Thickness', value: 3, step: 0.5, min: 0.5, max: 5,
            onChange: function(value, ref) {
                ref.args[1].thickness = value;
            }
        }, {
            type: 'number', name: 'Scale Factor', value: 5, step: 1, min: 1, max: 10,
            onChange: function(value, ref) {
                ref.args[1].scaleFactor = value;
            }
        }]
    }
};
var renderer = _inputRenderer(gridTypes, function (gridOpt) {

    paper.setGrid(gridOpt);
    paper.drawGrid();
});

var $gridTypesOpt = $('.grid-types-opt');

$('#grid-type').on('change input', function() {

    $gridTypesOpt.empty();
    renderer.renderSettings($(this).val())
});

renderer.renderSettings($('#grid-type').val());

