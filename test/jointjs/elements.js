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

    QUnit.module('angle()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Element.prototype.angle, 'function');
        });

        QUnit.test('should be 0 by default', function(assert) {

            var element = new joint.dia.Element;

            assert.equal(element.angle(), 0);
        });

        QUnit.test('should return normalized "angle" attribute', function(assert) {

            var ANGLE = 45;
            var element = new joint.dia.Element;

            element.set('angle', ANGLE);
            assert.equal(element.angle(), ANGLE);

            element.set('angle', ANGLE + 360);
            assert.equal(element.angle(), ANGLE);
        });
    });


});
