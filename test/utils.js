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

function approximately(result, expected, tolerance, message) {

    ok(result > (expected - tolerance) && result < expected + tolerance, message);
}

var asserts = {

    roundedEqualAttrs: function(el, attrs) {

        _.each(attrs, function(value, attr) {

            equal(Math.round(V(el).attr(attr)), value, attr + ' is correct (' + value + ')');
        });
    }
};

function isHandlerRegistered(el, event, handler) {

    var handlers = jQuery._data(document, 'events');
    if (!handlers) return false;
    
    var eventHandlers = handlers[event];
    if (!eventHandlers) return false;

    for (var i = 0; i < eventHandlers.length; i++) {
        if (eventHandlers[i].handler === handler) {
            return true;
        }
    }
    return false;
}

// Simulate user events.
// ---------------------

var simulate = {

    mouseevent: function(opt) {
        
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent(
            opt.type, /*canBubble*/ true, /*cancelable*/ true, /*view*/ window, /*click count*/1,
            opt.screenX || 0, opt.screenY || 0, opt.clientX || 0, opt.clientY || 0,
            /*ctrlKey*/ !!opt.ctrlKey, /*altKey*/ !!opt.altKey, /*shiftKey*/ !!opt.shiftKey, /*metaKey*/ !!opt.metaKey, opt.button || 0, /*relatedTarget*/ null
        );

        if (opt.el) {
            opt.el.dispatchEvent(evt);
        }
        return evt;
    },

    mousedown: function(opt) {

        opt.type = 'mousedown';
        return this.mouseevent(opt);
    },

    mousemove: function(opt) {

        opt.type = 'mousemove';
        return this.mouseevent(opt);
    },

    mouseup: function(opt) {

        opt.type = 'mouseup';
        return this.mouseevent(opt);
    },

    mouseover: function(opt) {

        opt.type = 'mouseover';
        return this.mouseevent(opt);
    },
    
    mouseout: function(opt) {

        opt.type = 'mouseout';
        return this.mouseevent(opt);
    },

    click: function(opt) {

        this.mousedown(opt);
        return this.mouseup(opt);
    }
};
