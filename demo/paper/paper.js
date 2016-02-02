var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph,
    drawGrid: true
});

var rect = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 100, height: 40 }
}).addTo(graph);

var circle = new joint.shapes.basic.Circle({
    position: { x: 300, y: 70 },
    size: { width: 100, height: 40 }
}).addTo(graph);

var rhombus = new joint.shapes.basic.Rhombus({
    position: { x: 50, y: 250 },
    size: { width: 70, height: 70 }
}).addTo(graph);

var $ox = $('#ox');
var $oy = $('#oy');
var $sx = $('#sx');
var $sy = $('#sy');
var $w = $('#width');
var $h = $('#height');
var $ftcPadding = $('#ftc-padding');
var $ftcGridW = $('#ftc-grid-width');
var $ftcGridH = $('#ftc-grid-height');
var $stfPadding = $('#stf-padding');
var $stfMinScale = $('#stf-min-scale');
var $stfMaxScale = $('#stf-max-scale');
var $stfScaleGrid = $('#stf-scale-grid');
var $bboxX = $('#bbox-x');
var $bboxY = $('#bbox-y');
var $bboxW = $('#bbox-width');
var $bboxH = $('#bbox-height');
var $grid = $('#grid');

var svg = V(paper.svg);
var svgVertical = V('path').attr('d', 'M -10000 -1 L 10000 -1');
var svgHorizontal = V('path').attr('d', 'M -1 -10000 L -1 10000');
var svgRect = V('rect');

var svgAxisX = svgVertical.clone().addClass('axis');
var svgAxisY = svgHorizontal.clone().addClass('axis');

var svgBBox = svgRect.clone().addClass('bbox');
svgBBox.hide = _.debounce(_.bind(function() { this.removeClass('active'); }, svgBBox), 500);

// svg Container
var svgContainer = [];
svgContainer.showAll = function() { _.each(this, function(v) { v.addClass('active'); }); };
svgContainer.hideAll = function() { _.each(this, function(v) { v.removeClass('active'); }); };
svgContainer.removeAll = function() { _.invoke(this, 'remove'); };

// Axis has to be appended to the svg, so it won't affect the viewport.
svg.append([svgAxisX, svgAxisY, svgBBox]);

/* events */

$('#reset').on('click', function() {
    location.reload();
});

$('#fit-to-content').on('click', function() {

    svgContainer.removeAll();;

    var padding = parseInt($ftcPadding.val(), 10);
    var gridW = parseInt($ftcGridW.val(), 10);
    var gridH = parseInt($ftcGridH.val(), 10);
    var allowNewOrigin = $('#ftc-new-origin').val();

    paper.fitToContent({
        padding: padding,
        gridWidth: gridW,
        gridHeight: gridH,
        allowNewOrigin: allowNewOrigin
    });

    var translated = $ox.val() > 0 || $oy.val() > 0;

    if (padding) {

        var svgPaddingBottom = svgHorizontal.clone().addClass('padding')
            .translate($w.val() - padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);
        
        var svgPaddingRight = svgVertical.clone().addClass('padding')
            .translate(0, $h.val() - padding / 2, { absolute: true })
            .attr('stroke-width', padding);

        svg.append([svgPaddingBottom, svgPaddingRight]);
        svgContainer.push(svgPaddingBottom, svgPaddingRight);
    }

    if (padding && allowNewOrigin) {
        
        var svgPaddingLeft = svgVertical.clone().addClass('padding')
            .translate(0, padding / 2, { absolute: true })
            .attr('stroke-width', padding);
        var svgPaddingTop = svgHorizontal.clone().addClass('padding')
            .translate(padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);

        svg.append([svgPaddingTop, svgPaddingLeft]);
        svgContainer.push(svgPaddingTop, svgPaddingLeft);
    }

    if (gridW > 2) {

        var x = gridW;

        if (translated) x += padding;

        do {

            var svgGridX = svgHorizontal.clone().translate(x, 0, { absolute: true }).addClass('grid');
            svg.append(svgGridX);
            svgContainer.push(svgGridX);
            
            x += gridW;
            
        } while (x < $w.val() - padding);
    }

    if (gridH > 2) {

        var y = gridH;

        if (translated) y += padding;

        do {

            var svgGridY = svgVertical.clone().translate(0, y, { absolute: true }).addClass('grid');
            svg.append(svgGridY);
            svgContainer.push(svgGridY);
            y += gridH;
            
        } while (y < $h.val() - padding);
    }

    _.defer(function() { svgContainer.showAll(); });
});

$('#scale-to-fit').on('click', function() {

    svgContainer.removeAll();;

    var padding = parseInt($stfPadding.val(), 10);
    
    paper.scaleContentToFit({
        padding: padding,
        minScale: parseFloat($stfMinScale.val()),
        maxScale: parseFloat($stfMaxScale.val()),
        scaleGrid: parseFloat($stfScaleGrid.val()),
        preserveAspectRatio: $('#stf-ratio').is(':checked')
    });

    if (padding) {

        var svgPaddingBottom = svgHorizontal.clone().addClass('padding')
            .translate($w.val() - padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);
        
        var svgPaddingRight = svgVertical.clone().addClass('padding')
            .translate(0, $h.val() - padding / 2, { absolute: true })
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

    _.defer(function() { svgContainer.showAll(); });

});

$ox.on('input', function() { paper.setOrigin(parseInt(this.value, 10), parseInt($oy.val(), 10)); });
$oy.on('input', function() { paper.setOrigin(parseInt($ox.val(), 10), parseInt(this.value, 10)); });
$sx.on('input', function() { paper.scale(parseFloat(this.value), parseFloat($sy.val())); });
$sy.on('input', function() { paper.scale(parseFloat($sx.val()), parseFloat(this.value)); });
$w.on('input', function() { paper.setDimensions(parseInt(this.value, 10), parseInt($h.val(),10)); });
$h.on('input', function() { paper.setDimensions(parseInt($w.val(), 10), parseInt(this.value, 10)); });
$grid.on('input', function() {
    paper.setGridSize(this.value);
});

$('.range').on('input', function() {
    $(this).next().val(this.value);
});

paper.on('scale', function(sx, sy) {
    $sx.val(sx).next().val(sx.toFixed(2));
    $sy.val(sy).next().val(sy.toFixed(2));
});

paper.on('translate', function(ox, oy) {
    $ox.val(ox).next().val(Math.round(ox));
    $oy.val(oy).next().val(Math.round(oy));
    // translate axis
    svgAxisX.translate(0, oy, { absolute: true });
    svgAxisY.translate(ox, 0, { absolute: true });
});

paper.on('resize', function(width, height) {
    $w.val(width).next().val(Math.round(width));
    $h.val(height).next().val(Math.round(height));
});

paper.on('scale translate resize', function() { svgContainer.hideAll(); });
paper.model.on('change', function() {

    svgContainer.hideAll();

    var bbox = paper.getContentBBox();
    $bboxX.text(Math.round(bbox.x));
    $bboxY.text(Math.round(bbox.y));
    $bboxW.text(Math.round(bbox.width));
    $bboxH.text(Math.round(bbox.height));

    svgBBox.attr(bbox).addClass('active').hide();
});
