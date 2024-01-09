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
});
