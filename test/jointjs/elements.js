QUnit.module('elements', function(hooks) {

    QUnit.module('isElement()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Element.prototype.isElement, 'function');
        });

        QUnit.test('should return TRUE', function(assert) {

            var element = new joint.dia.Element;

            assert.ok(element.isElement());
        });
    });

    QUnit.module('isLink()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Element.prototype.isLink, 'function');
        });

        QUnit.test('should return FALSE', function(assert) {

            var element = new joint.dia.Element;

            assert.notOk(element.isLink());
        });
    });
});
