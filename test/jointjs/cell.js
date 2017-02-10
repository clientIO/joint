'use strict';

QUnit.module('cell', function(hooks) {

    QUnit.module('isElement()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Cell.prototype.isElement, 'function');
        });

        QUnit.test('should return FALSE', function(assert) {

            var cell = new joint.dia.Cell;

            assert.notOk(cell.isElement());
        });
    });

    QUnit.module('isLink()', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.dia.Cell.prototype.isLink, 'function');
        });

        QUnit.test('should return FALSE', function(assert) {

            var cell = new joint.dia.Cell;

            assert.notOk(cell.isLink());
        });
    });

    QUnit.module('prop()', function(hooks) {

        var /** @type joint.dia.Cell */
        el;
        var attrs;

        hooks.beforeEach(function() {
            el = new joint.shapes.basic.Rect({
                position: { x: 20, y: 30 },
                size: { width: 120, height: 80 }
            });
            attrs = el.attributes;
        });

        QUnit.test('empty key', function(assert) {

            el.prop('', 'john');
            assert.equal(attrs[''], 'john');
            assert.equal(el.prop(''), 'john');
        });

        QUnit.module('arrays', function(hooks) {

            QUnit.test('path as string', function(assert) {

                el.prop('array/123', 'index');

                assert.ok(_.isArray(attrs.array));

                assert.equal(attrs.array.length, 124);
                assert.equal(attrs.array[123], 'index');
            });

            QUnit.test('path as array', function(assert) {

                el.prop(['array', 123], 'index');
                var arr = el.get('array');

                assert.ok(_.isArray(arr), 'it is an array');
                assert.equal(arr.length, 124, 'length is set correctly');
                assert.equal(arr[123], 'index');

                assert.equal(el.prop('array/123'), 'index');
                assert.equal(el.prop(['array', 123]), 'index');
                assert.equal(el.prop(['array', '123']), 'index');
            });

            QUnit.test('nested arrays', function(assert) {

                el.prop('mylist/0/data/0/value', 50);

                assert.ok(attrs.hasOwnProperty('mylist'));
                assert.equal(attrs.mylist[0].data[0].value, 50);

                assert.equal(el.prop('mylist/0/data/0/value'), 50);
            });

            QUnit.test('nested arrays - path as array', function(assert) {

                el.prop(['mylist', 0, 'data', 0, 'value'], 50);

                assert.ok(attrs.hasOwnProperty('mylist'));
                assert.equal(attrs.mylist[0].data[0].value, 50);

                assert.equal(el.prop('mylist/0/data/0/value'), 50);
            });
        });

        QUnit.module('objects', function(hooks) {

            QUnit.test('path as string', function(assert) {

                el.prop('name/first', 'john');
                assert.ok(attrs.hasOwnProperty('name'));
                assert.equal(attrs.name.first, 'john');

                assert.equal(el.prop('name/first'), 'john');
            });

            QUnit.test('path and value as object', function(assert) {

                el.prop({ name: { first: 'john' } });
                assert.ok(attrs.hasOwnProperty('name'));
                assert.equal(attrs.name.first, 'john');

                assert.equal(el.prop('name/first'), 'john');
            });

            QUnit.test('path as array - root level', function(assert) {

                el.prop(['object'], 'property');

                assert.equal(attrs.object, 'property');
                assert.equal(el.prop('object'), 'property');
            });

            QUnit.test('path as array', function(assert) {

                el.prop(['object', '123'], 'property');

                assert.ok(_.isPlainObject(attrs.object));
                assert.ok(attrs.object.hasOwnProperty('123'));
                assert.equal(attrs.object['123'], 'property');

                assert.equal(el.prop('object/123'), 'property');
            });

            QUnit.test('path as array - sepatator included in name', function(assert) {

                el.prop(['ob/ject', '123'], 'property');

                assert.ok(_.isPlainObject(attrs['ob/ject']));
                assert.ok(attrs['ob/ject'].hasOwnProperty('123'));
                assert.equal(attrs['ob/ject']['123'], 'property');

                assert.equal(el.prop(['ob/ject', '123']), 'property');
            });
        });
    });
});

