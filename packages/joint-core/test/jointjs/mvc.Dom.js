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

});
