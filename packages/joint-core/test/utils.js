(function(asserts) {

    // Make sure we have Node.children and Element.children available
    (function(constructor) {
        if (constructor &&
        constructor.prototype &&
        constructor.prototype.children == null) {
            Object.defineProperty(constructor.prototype, 'children', {
                get: function() {
                    var i = 0, node, nodes = this.childNodes, children = [];
                    // Iterate all childNodes
                    while (node = nodes[i++]) {
                        // Remember those, that are Node.ELEMENT_NODE (1)
                        if (node.nodeType === 1) { children.push(node); }
                    }
                    return children;
                }
            });
        }
        // Apply the fix to all HTMLElements (window.Element) and to SVG/XML (window.Node)
    })(window.Node || window.Element);

    asserts.checkBbox = function(paper, el, x, y, w, h, msg) {
        var view = paper.findViewByModel(el);
        var bbox = view.getBBox();
        var bboxObject = new g.Rect(bbox).round().toJSON();
        return this.deepEqual(bboxObject, { x: x, y: y, width: w, height: h }, msg);
    };

    asserts.checkBboxApproximately = function(plusMinus, actualBBox, expectedBBox, message) {
        return this.ok(
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
    };

    asserts.checkDataPath = function(actualD, expectedD, message) {
        return this.equal(actualD, normalizeDataPath(expectedD), message);
    };

    asserts.checkSvgAttr = function(name, vel, expectedValue, message) {
        return this.equal(vel.attr(name), normalizeSvgAttr(name, expectedValue), message);
    };

    asserts.checkCssAttr = function(name, $el, expectedValue, message) {
        return this.equal($el.css(name), normalizeCssAttr(name, expectedValue), message);
    };

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
        var normalizedD = V('path').attr('d', d).attr('d');
        if (isPartial) {
            // Strip away anything that was prepended or appended.
            normalizedD = normalizedD.substr(prepended.length);
            normalizedD = normalizedD.substr(0, normalizedD.length - appended.length);
        }
        return normalizedD;
    }

    function normalizeSvgAttr(name, value) {
        return V('g').attr(name, value).attr(name);
    }

    function normalizeCssAttr(name, value) {

        var $tmpEl = joint.mvc.$('<div/>').appendTo($('body'));
        var normalizedValue = $tmpEl.css(name, value).css(name);
        $tmpEl.remove();
        return normalizedValue;
    }

})(QUnit.assert);

// Dom manipulation helpers.

window.$ = joint.mvc.$;

// Simulate user events.
// ---------------------

window.simulate = {

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
    },

    touchevent: function(touchInit) {

        const touchEvt = new TouchEvent(touchInit.type, {
            cancelable: true,
            bubbles: true,
            changedTouches: [new Touch({
                ...touchInit,
                identifier: Date.now(),
            })],
        });

        if (touchInit.target) {
            touchInit.target.dispatchEvent(touchEvt);
        }
        return touchEvt;
    },

    touchstart: function(touchInit) {
        return this.touchevent({ ...touchInit, type: 'touchstart' });
    },

    touchmove: function(touchInit) {
        return this.touchevent({ ...touchInit, type: 'touchmove' });
    },

    touchend: function(touchInit) {
        return this.touchevent({ ...touchInit, type: 'touchend' });
    }
};

window.fixtures = {
    getElement: function() {
        let fixtureEl = document.getElementById('qunit-fixture');
        if (fixtureEl) return fixtureEl;
        fixtureEl = document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        document.body.appendChild(fixtureEl);
        return fixtureEl;
    },

    moveToViewport: function() {
        const fixtureEl = this.getElement();
        fixtureEl.style.top = '0px';
        fixtureEl.style.left = '0px';
    },

    moveOffscreen: function() {
        const fixtureEl = this.getElement();
        // The actual move offscreen is done in the CSS file.
        fixtureEl.style.top = '';
        fixtureEl.style.left = '';
    }
};

