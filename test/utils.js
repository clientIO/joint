// QUnit move the fixture out of the viewport area by setting its position: absolute; top: -10000px; left: -10000px;
// This helper make it possible to show the fixture quickly for debugging purposes.
function showFixture() {

    $('#qunit-fixture').css({

        position: 'static'
    });
}

function mathRoundBbox(bbox) {

    return {
        x: Math.round(bbox.x),
        y: Math.round(bbox.y),
        width: Math.round(bbox.width),
        height: Math.round(bbox.height)
    };
}

function checkBbox(paper, el, x, y, w, h, msg) {

    var view = paper.findViewByModel(el);
    var bbox = view.getBBox();
    var bboxObject = mathRoundBbox(bbox);

    deepEqual(bboxObject, { x: x, y: y, width: w, height: h }, msg);
}

function checkBboxApproximately(plusMinus, actualBBox, expectedBBox, message) {

    ok(
        actualBBox.x >= expectedBBox.x - plusMinus &&
        actualBBox.x <= expectedBBox.x + plusMinus &&
        actualBBox.y >= expectedBBox.y - plusMinus &&
        actualBBox.y <= expectedBBox.y + plusMinus &&
        actualBBox.width >= expectedBBox.width - plusMinus &&
        actualBBox.width <= expectedBBox.width + plusMinus &&
        actualBBox.height >= expectedBBox.height - plusMinus &&
        actualBBox.height <= expectedBBox.height + plusMinus,
        message
    );
}

function checkDataPath(actualD, expectedD, message) {

    equal(actualD, normalizeDataPath(expectedD), message);
}

function normalizeDataPath(d) {

    var isPartial = d.substr(0, 1) !== 'M';
    var prepended = '';
    var appended = '';

    if (isPartial) {

        // Need to make some temporary fixes so the browser doesn't throw an invalid path error.

        if (d.substr(0, 1) === 'A') {

            // Ensure that there are 7 values present after an 'A'.

            var matches = d.substr(d.indexOf('A')).match(/[, a-z][0-9]/ig);
            var numValues = matches && matches.length || 0;

            if (numValues < 7) {

                for (var i = 0; i < 7 - numValues; i++) {
                    appended += ' 0';
                    d += ' 0';
                }
            }
        }

        prepended += 'M 0 0 ';
        d = 'M 0 0 ' + d;
    }

    var normalizedD = V('<path/>').attr('d', d).attr('d');

    if (isPartial) {
        // Strip away anything that was prepended or appended.
        normalizedD = normalizedD.substr(prepended.length);
        normalizedD = normalizedD.substr(0, normalizedD.length - appended.length);
    }

    return normalizedD;
}

function checkSvgAttr(name, vel, expectedValue, message) {

    return equal(vel.attr(name), normalizeSvgAttr(name, expectedValue), message);
}

function normalizeSvgAttr(name, value) {

    return V('<g/>').attr(name, value).attr(name);
}

function normalizeCssAttr(name, value) {

    var $tmpEl = $('<div/>').appendTo($('body'));
    var normalizedValue = $tmpEl.css(name, value).css(name);
    $tmpEl.remove();
    return normalizedValue;
}

function normalizeImageDataUri(uri, cb) {

    var image = new Image();

    image.onload = function() {

        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, image.width, image.height);
        var normalized = canvas.toDataURL('image/png');
        canvas = null;
        image = null;
        cb(null, normalized);
    };

    image.src = uri;
}

function approximately(result, expected, tolerance, message) {

    var min = (expected - tolerance);
    var max = (expected + tolerance);

    ok(result >= min && result <= max, message);
}

function isClose(actual, expected, tolerance) {

    return actual <= expected + tolerance && actual >= expected - tolerance;
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
