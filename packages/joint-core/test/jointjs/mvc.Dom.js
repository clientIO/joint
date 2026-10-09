'use strict';

QUnit.module('joint.mvc.$', function(hooks) {

    QUnit.test('$.fn.prop', function(assert) {
        const el = document.createElement('div');
        const $el = joint.mvc.$(el);
        assert.equal($el.prop('role'), null);
        el.role = 'test';
        assert.equal($el.prop('role'), 'test');
        assert.equal($el.prop('role', 'test2'), $el);
        assert.equal($el.prop('role'), 'test2');
        assert.equal($el.prop('role', undefined), $el);
        assert.equal($el.prop('role'), 'test2');
        assert.equal($el.prop('role', null), $el);
        assert.equal($el.prop('role'), null);
    });

    QUnit.test('$.fn.attr', function(assert) {
        const button = document.createElement('button');
        const $button = joint.mvc.$(button);
        $button.attr({
            disabled: true,
            testAttribute: 'testValue'
        });
        assert.equal(button.disabled, true);
        assert.equal($button.attr('testAttribute'), 'testValue');
        assert.equal(button.getAttribute('testAttribute'), 'testValue');
        assert.notOk('testAttribute' in button);
    });

    QUnit.module('$.fn.animate', function() {

        QUnit.test('options.complete is called when duration is 0.1s', function(assert) {
            const done = assert.async();
            const el = document.createElement('div');
            const $el = joint.mvc.$(el);
            el.style.width = '0px';
            $el.animate({ width: 100 }, {
                duration: 100,
                complete: () => {
                    assert.equal(el.style.width, '100px');
                    done();
                }
            });
        });

        QUnit.test('options.complete is called if duration is 0', function(assert) {
            const done = assert.async();
            const el = document.createElement('div');
            const $el = joint.mvc.$(el);
            el.style.width = '0px';
            $el.animate({ width: 100 }, {
                duration: 0,
                complete: () => {
                    assert.equal(el.style.width, '100px');
                    done();
                }
            });
        });

        QUnit.test('options.complete is called if the animated properties already match', function(assert) {
            const done = assert.async();
            const el = document.createElement('div');
            const $el = joint.mvc.$(el);
            el.style.width = '100px';
            $el.animate({ width: 100 }, {
                duration: 100,
                complete: () => {
                    assert.equal(el.style.width, '100px');
                    done();
                }
            });
        });

    });

    QUnit.module('$.fn.stop', function() {

        QUnit.test('stops animation', function(assert) {
            assert.expect(1);
            const done = assert.async();
            const el = document.createElement('div');
            const $el = joint.mvc.$(el);
            el.style.width = '0px';
            $el.animate({ width: 100 }, {
                duration: 100,
                complete: () => {
                    assert.notOk(true);
                }
            });
            $el.stop();
            setTimeout(() => {
                assert.equal(el.style.width, '0px');
                done();
            }, 200);
        });
    });

    QUnit.module('$(window)', function(hooks) {

        function withIframe(callback) {
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'width: 300px; height: 150px; border: 0;';
            document.body.appendChild(iframe);
            try {
                callback(iframe);
            } finally {
                iframe.remove();
            }
        }

        // Content larger than the viewport, so the window scrolls and its
        // scrollbar takes space: `window.innerWidth` then differs from
        // `document.documentElement.clientWidth`.
        function withScrollableWindow(callback) {
            const filler = document.createElement('div');
            filler.style.cssText = 'width: 5000px; height: 5000px;';
            document.body.appendChild(filler);
            try {
                callback();
            } finally {
                window.scrollTo(0, 0);
                filler.remove();
            }
        }

        hooks.afterEach(function() {
            // A setter that writes onto the window instead of handling it
            // leaves a plain property behind; so does a listener left bound.
            ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight', 'scrollTop', 'scrollLeft'].forEach((name) => {
                delete window[name];
            });
            joint.mvc.$(window).off('mvc-dom-test');
        });

        QUnit.test('holds the window as its only item', function(assert) {
            const $window = joint.mvc.$(window);
            assert.equal($window.length, 1);
            assert.equal($window[0], window);
        });

        QUnit.test('holds the window, not its frames, on a page with an iframe', function(assert) {
            withIframe(() => {
                assert.ok(window.length > 0, 'the page has a frame');
                const $window = joint.mvc.$(window);
                assert.equal($window.length, 1);
                assert.equal($window[0], window);
            });
        });

        QUnit.test('holds the window of an iframe', function(assert) {
            withIframe((iframe) => {
                const frameWindow = iframe.contentWindow;
                const $frameWindow = joint.mvc.$(frameWindow);
                assert.equal($frameWindow.length, 1);
                assert.equal($frameWindow[0], frameWindow);
            });
        });

        QUnit.test('width() and height() return the viewport size without the scrollbar', function(assert) {
            withScrollableWindow(() => {
                const $window = joint.mvc.$(window);
                assert.equal($window.width(), document.documentElement.clientWidth);
                assert.equal($window.height(), document.documentElement.clientHeight);
            });
        });

        QUnit.test('on() receives an event dispatched on the window', function(assert) {
            const handler = sinon.spy();
            joint.mvc.$(window).on('mvc-dom-test', handler);
            window.dispatchEvent(new Event('mvc-dom-test'));
            assert.ok(handler.calledOnce);
        });

        QUnit.test('one() runs its handler once', function(assert) {
            const handler = sinon.spy();
            joint.mvc.$(window).one('mvc-dom-test', handler);
            window.dispatchEvent(new Event('mvc-dom-test'));
            window.dispatchEvent(new Event('mvc-dom-test'));
            assert.ok(handler.calledOnce);
        });

        QUnit.test('off() stops the delivery of events', function(assert) {
            const handler = sinon.spy();
            const $window = joint.mvc.$(window);
            $window.on('mvc-dom-test', handler);
            window.dispatchEvent(new Event('mvc-dom-test'));
            $window.off('mvc-dom-test', handler);
            window.dispatchEvent(new Event('mvc-dom-test'));
            assert.equal(handler.callCount, 1);
        });
    });

});
