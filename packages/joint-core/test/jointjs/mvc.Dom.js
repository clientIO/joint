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

    QUnit.test('$ works with window', function(assert) {
        const $win = $(window);
        assert.equal($win.length, 1);
        assert.equal($win.find('div').length, 0);
        assert.equal($win.children().length, 0);
        assert.equal($win.closest('*').length, 0);

        assert.ok($win.empty());
        assert.ok($win.remove());
        assert.ok($win.append($('<div>')));
        assert.ok($win.prepend($('<div>')));

        assert.equal($win.css('name'), null);
        assert.equal($win.data('name'), null);
        assert.equal($win.attr('name'), null);
        assert.equal($win.data('name', 'value'), $win);
        assert.equal($win.attr('name', 'value'), $win);
        assert.equal($win.css('name', 'value'), $win);

        assert.ok(Number.isFinite($win.width()));
        assert.ok(Number.isFinite($win.height()));

        assert.ok($win.addClass('test'));
        assert.ok($win.removeClass('test'));
        assert.equal($win.hasClass('test'), false);
    });
});
