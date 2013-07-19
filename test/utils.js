// QUnit move the fixture out of the viewport area by setting its position: absolute; top: -10000px; left: -10000px;
// This helper make it possible to show the fixture quickly for debugging purposes.
function showFixture() {
    
    $('#qunit-fixture').css({

        position: 'static'
    });
}


function checkBbox(paper, el, x, y, w, h, msg) {

    var view = paper.findViewByModel(el);
    
    var bbox = view.getBBox();

    // Extract coordinates and dimension only in case bbox is e.g. an SVGRect or some other object with
    // other properties. We need that to be able to use deepEqual() assertion and therefore generate just one assertion
    // instead of four for every position and dimension.
    var bboxObject = {
        
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height
    };

    deepEqual(bboxObject, { x: x, y: y, width: w, height: h }, msg);
}
