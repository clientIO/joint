'use strict';

QUnit.module('util', function(hooks) {

    QUnit.test('util.interpolate', function(assert) {

        var values = [0, .25, .5, .75, 1];

        var numberInterpolation = joint.util.interpolate.number(0, 100);
        var objectInterpolation = joint.util.interpolate.object({ x: 100, y: 200 }, { x: 200, y: 0 });
        var hexColorInterpolation = joint.util.interpolate.hexColor('#FFFFFF', '#00FF77');
        var unitInterpolation = joint.util.interpolate.unit('1em', '0.50em');

        var numberArray = _.map(values, numberInterpolation);
        var objectArray = _.map(values, objectInterpolation);
        var hexColorArray = _.map(values, hexColorInterpolation);
        var unitArray = _.map(values, unitInterpolation);

        assert.deepEqual(numberArray, [
            0, 25, 50, 75, 100
        ], 'Numbers interpolated.');

        assert.deepEqual(objectArray, [
            { x: 100, y: 200 }, { x: 125, y: 150 }, { x: 150, y: 100 }, { x: 175, y: 50 }, { x: 200,    y: 0 }
        ], 'Objects interpolated.');

        assert.deepEqual(hexColorArray, [
            '#ffffff', '#bfffdd', '#7fffbb', '#3fff99', '#00ff77'
        ], 'String hex colors interpolated.');

        assert.deepEqual(unitArray, [
            '1.00em', '0.88em', '0.75em', '0.63em', '0.50em'
        ], 'Numbers with units interpolated.');
    });

    QUnit.test('util.isPercentage', function(assert) {

        assert.equal(joint.util.isPercentage(undefined), false, 'undefined => false');
        assert.equal(joint.util.isPercentage(null), false, 'null => false');
        assert.equal(joint.util.isPercentage(true), false, 'true => false');
        assert.equal(joint.util.isPercentage(false), false, 'false => false');
        assert.equal(joint.util.isPercentage(0), false, '0 => false');
        assert.equal(joint.util.isPercentage(10), false, '10 => false');
        assert.equal(joint.util.isPercentage(''), false, '\'\' => false');
        assert.equal(joint.util.isPercentage('10'), false, '\'10\' => false');

        assert.equal(joint.util.isPercentage('%'), true, '\'%\' => true');
        assert.equal(joint.util.isPercentage('10%'), true, '\'10%\' => true');
        assert.equal(joint.util.isPercentage('-10%'), true, '\'-10%\' => true');
    });

    QUnit.test('util.format.number', function(assert) {

        var res = {
            '5.00': ['.2f', 5],
            '005': ['03d', 5],
            '05.02': ['05.2f', 5.02],
            '20.5%': ['.1%', .205],
            '****5****': ['*^9', '5'],
            '5********': ['*<9', '5'],
            '********5': ['*>9', '5'],
            '+3.14': ['+.f', 3.14],
            '3.14': ['.f', 3.14],
            '-3.14': ['+.f', -3.14],
            'a': ['x', 10],
            'A': ['X', 10],
            'C0': ['02X', 192],
            '1,234,567,890': [',', 1234567890]
        };

        _.each(res, function(input, output) {

            assert.equal(joint.util.format.number(input[0], input[1]), output, 'number(' + input[0] + ', ' + input[1] + ') = ' + output);
        });
    });

    QUnit.test('util.breakText', function(assert) {

        // tests can't compare exact results as they may vary in different browsers

        // This ensures that the tests will be more deterministic.
        // For example, some browsers might have a different default font size/family.
        var styles = {
            'font-size': '12px',
            'font-family': 'Courier New'
        };

        var text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

        assert.equal(joint.util.breakText('', { width: 100 }, styles), '', 'An empty text was correctly broken.');

        assert.equal(joint.util.breakText(text, { width: 0, height: 0 }, styles), '', 'A text was correctly broken when zero width and height provided.');

        assert.ok(_.includes(joint.util.breakText(text, { width: 100 }, styles), '\n'),
            'A text was broken when width A specified.');

        assert.ok(_.includes(joint.util.breakText(text, { width: 15 }, styles), '\n'), 'A text was broken when width B specified.');

        var brokenText = joint.util.breakText(text, { width: 100, height: 40 }, styles);

        assert.ok(_.includes(brokenText, 'Lorem') && !_.includes(brokenText, 'elit.'), 'A text was trimmed when width & height specified.');

        brokenText = joint.util.breakText(text, { width: 100, height: 50 }, _.extend({}, styles, { 'font-size': '18px' }));

        assert.ok(_.includes(brokenText, '\n') || !_.includes(brokenText, 'elit.'), 'A text was broken when style specified.');

        assert.throws(function() {
            joint.util.breakText(text, { width: 100, height: 50 }, _.extend({}, styles, { 'font-size': '18px' }), { svgDocument: 'not-svg' });
        }, /appendChild|undefined/, 'A custom svgDocument provided was recognized.');
    });

    QUnit.test('util.parseCssNumeric', function(assert) {

        assert.equal(joint.util.parseCssNumeric('auto'), null);

        assert.deepEqual(joint.util.parseCssNumeric('1.1'), { value: 1.1 });
        assert.deepEqual(joint.util.parseCssNumeric('1.1em', ['em']), { value: 1.1, unit: 'em' });
        assert.equal(joint.util.parseCssNumeric('10px', ['em']), null, 'invalid unit');

        assert.deepEqual(joint.util.parseCssNumeric('10px', ['em', 'px']), { value: 10, unit: 'px' });
        assert.deepEqual(joint.util.parseCssNumeric('1.1em', ['em', 'px']), { value: 1.1, unit: 'em' });
        assert.deepEqual(joint.util.parseCssNumeric(10, ['em', 'px']), { value: 10 });
    });

    QUnit.test('util.getByPath()', function(assert) {

        var obj = {
            a: 1,
            b: {
                c: 2,
                d: 3
            },
            f: {},
            g: [],
            h: [null, 4, {
                i: { j: 6 }
            }],
            'a/b/c': { d: 'abcd' }
        };

        assert.deepEqual(joint.util.getByPath(obj, 'none'), undefined, 'non-existing property is undefined');
        assert.equal(joint.util.getByPath(obj, 'a'), 1, 'existing property is a number');
        assert.deepEqual(joint.util.getByPath(obj, 'b'), { c: 2, d: 3 }, 'existing property is an object');
        assert.equal(joint.util.getByPath(obj, 'b/c'), 2, 'nested property is a number');
        assert.deepEqual(joint.util.getByPath(obj, 'b/none'), undefined, 'non-existing nested property is undefined');
        assert.deepEqual(joint.util.getByPath(obj, 'f'), {}, 'property is an empty object');
        assert.deepEqual(joint.util.getByPath(obj, 'g'), [], 'property is an empty array');
        assert.deepEqual(joint.util.getByPath(obj, 'g/0'), undefined, 'first item of an empty array is undefined');
        assert.deepEqual(joint.util.getByPath(obj, 'h/0'), null, 'first item of an array is null');
        assert.deepEqual(joint.util.getByPath(obj, 'h/0/none'), undefined, 'nested property in null is undefined');
        assert.equal(joint.util.getByPath(obj, 'h/1'), 4, 'nth item of an array is number');
        assert.deepEqual(joint.util.getByPath(obj, 'h/1/none'), undefined, 'non-existing property of nth item of an array is undefined');
        assert.equal(joint.util.getByPath(obj, 'h/2/i/j'), 6, 'nested property of nth item of an array is number');
        assert.equal(joint.util.getByPath(obj, 'h.2.i.j', '.'), 6, 'same but this time with a custom delimiter');
        assert.equal(joint.util.getByPath(obj, ['h', '2', 'i', 'j']), 6, 'path as array');
        assert.equal(joint.util.getByPath(obj, ['a/b/c', 'd']), 'abcd', 'path as array, separator in name');
    });

    QUnit.test('util.setByPath()', function(assert) {

        assert.deepEqual(joint.util.setByPath({}, 'property', 1), { property: 1 }, 'non-existing property in an obj set as a number');
        assert.deepEqual(joint.util.setByPath({ property: 2 }, 'property', 3), { property: 3 }, 'existing property in an obj set as a number');
        assert.deepEqual(joint.util.setByPath([], '0', 4), [4], 'add an item to an empty array');
        assert.deepEqual(joint.util.setByPath([5, 6], '1', 7), [5, 7], 'change an item in an array');
        assert.deepEqual(joint.util.setByPath({}, 'first/second/third', 8), { first: { second: { third: 8 }}}, 'populate an empty object with nested objects');
        assert.deepEqual(joint.util.setByPath({}, 'first.second.third', 9, '.'), { first: { second: { third: 9 }}}, 'same but this time with a custom delimiter');
        assert.deepEqual(joint.util.setByPath([null], '0/property', 10), [{ property: 10 }], 'replace null item with an object');
        assert.deepEqual(joint.util.setByPath({ array: [] }, 'array/1', 'index'), { array: [undefined, 'index'] }, 'define array');
        assert.deepEqual(joint.util.setByPath({ object: {}}, 'object/1', 'property'), { object: { '1': 'property' }}, 'define property');
    });

    QUnit.module('util.unsetByPath', function(hooks) {

        QUnit.test('path defined as string', function(assert) {

            var obj = {
                a: 1,
                b: {
                    c: 2,
                    d: 3
                }
            };

            joint.util.unsetByPath(obj, 'b/c', '/');
            assert.deepEqual(obj, { a: 1, b: { d: 3 }}, 'A nested attribute was removed.');

            joint.util.unsetByPath(obj, 'b');
            assert.deepEqual(obj, { a: 1 }, 'A primitive attribute was removed.');

            joint.util.unsetByPath(obj, 'c/d');
            assert.deepEqual(obj, { a: 1 }, 'Attempt to delete non-existing attribute doesn\'t affect object.');

        });

        QUnit.test('path defined as array - remove from objects and arrays', function(assert) {

            var obj = {
                object: { 1: 'property', 2: 'property2', 3: 'property3' },
                array: ['a', 'b', 'c'],
                objectArray: [{ a: 'a_value', b: 'b_value' }, { c: 'c_value', d: 'd_value' }]
            };

            joint.util.unsetByPath(obj, ['object', 1]);
            assert.deepEqual(obj.object, { 2: 'property2', 3: 'property3' });

            joint.util.unsetByPath(obj, ['object', 2]);
            assert.deepEqual(obj.object, { 3: 'property3' });

            joint.util.unsetByPath(obj, ['array', 1]);
            assert.deepEqual(obj.array, ['a', undefined, 'c']);

            joint.util.unsetByPath(obj, ['array', 2]);
            assert.deepEqual(obj.array, ['a', undefined, undefined]);

            joint.util.unsetByPath(obj, ['objectArray', 1, 'c']);
            assert.deepEqual(obj.objectArray, [{ a: 'a_value', b: 'b_value' }, { d: 'd_value' }]);

            joint.util.unsetByPath(obj, ['objectArray', '1', 'd']);
            assert.deepEqual(obj.objectArray, [{ a: 'a_value', b: 'b_value' }, {}]);
        });

        QUnit.test('path defined as array', function(assert) {

            var obj = {
                a: 1,
                b: {
                    c: 2,
                    d: 3
                }
            };

            joint.util.unsetByPath(obj, ['b', 'c'], '/');
            assert.deepEqual(obj, { a: 1, b: { d: 3 }}, 'A nested attribute was removed.');

            joint.util.unsetByPath(obj, ['b']);
            assert.deepEqual(obj, { a: 1 }, 'A primitive attribute was removed.');

            joint.util.unsetByPath(obj, ['c', 'd']);
            assert.deepEqual(obj, { a: 1 }, 'Attempt to delete non-existing attribute doesn\'t affect object.');
        });
    });

    QUnit.test('util.normalizeSides()', function(assert) {

        assert.deepEqual(joint.util.normalizeSides(undefined), { top: 0, right: 0, bottom: 0, left: 0 },
            'Undefined becomes 0');

        assert.deepEqual(joint.util.normalizeSides(null), { top: 0, right: 0, bottom: 0, left: 0 },
            'Null becomes 0');

        assert.deepEqual(joint.util.normalizeSides(''), { top: 0, right: 0, bottom: 0, left: 0 },
            'Empty string becomes 0');

        assert.deepEqual(joint.util.normalizeSides('a'), { top: 0, right: 0, bottom: 0, left: 0 },
            'String becomes 0');

        assert.deepEqual(joint.util.normalizeSides('5'), { top: 5, right: 5, bottom: 5, left: 5 },
            'String number becomes number');

        assert.deepEqual(joint.util.normalizeSides('Infinity'), { top: 0, right: 0, bottom: 0, left: 0 },
            'Infinity becomes 0');

        assert.deepEqual(joint.util.normalizeSides('NaN'), { top: 0, right: 0, bottom: 0, left: 0 },
            'NaN becomes 0');

        assert.deepEqual(joint.util.normalizeSides(Infinity), { top: 0, right: 0, bottom: 0, left: 0 },
            'Infinity becomes 0');

        assert.deepEqual(joint.util.normalizeSides(NaN), { top: 0, right: 0, bottom: 0, left: 0 },
            'NaN becomes 0');

        assert.deepEqual(joint.util.normalizeSides({ left: undefined }), { top: 0, right: 0, bottom: 0, left: 0 },
            'Specific undefined becomes 0');

        assert.deepEqual(joint.util.normalizeSides({ left: null }), { top: 0, right: 0, bottom: 0, left: 0 },
            'Specific null becomes 0');

        assert.deepEqual(joint.util.normalizeSides({ left: '' }), { top: 0, right: 0, bottom: 0, left: 0 },
            'Specific empty string becomes 0');

        assert.deepEqual(joint.util.normalizeSides({ left: 'a' }), { top: 0, right: 0, bottom: 0, left: 0 },
            'Specific string becomes 0');

        assert.deepEqual(joint.util.normalizeSides({ left: '5' }), { top: 0, right: 0, bottom: 0, left: 5 },
            'Specific string number becomes number');

        assert.deepEqual(joint.util.normalizeSides({ left: 'Infinity' }), { top: 0, right: 0, bottom: 0, left: 0 },
            'Specific string Infinity becomes 0');

        assert.deepEqual(joint.util.normalizeSides({ left: 'NaN' }), { top: 0, right: 0, bottom: 0, left: 0 },
            'Specific string NaN becomes 0');

        assert.deepEqual(joint.util.normalizeSides({ left: Infinity }), { top: 0, right: 0, bottom: 0, left: 0 },
            'Specific Infinity becomes 0');

        assert.deepEqual(joint.util.normalizeSides({ left: NaN }), { top: 0, right: 0, bottom: 0, left: 0 },
            'Specific NaN becomes 0');



        assert.deepEqual(joint.util.normalizeSides(), { top: 0, right: 0, bottom: 0, left: 0 },
            'Returns sides defaulted to 0 if called without an argument.');

        assert.deepEqual(joint.util.normalizeSides(5), { top: 5, right: 5, bottom: 5, left: 5 },
            'Returns sides equaled to a number if called with this number as an argument.');

        assert.deepEqual(joint.util.normalizeSides({ horizontal: 5 }), { top: 0, right: 5, bottom: 0, left: 5 },
            'If called with an object, horizontal sides are applied to right and left and the rest is defaulted to 0.');

        assert.deepEqual(joint.util.normalizeSides({ left: 5 }), { top: 0, right: 0, bottom: 0, left: 5 },
            'If called with an object, the existing sides are copied from the object and the rest is defaulted to 0.');

        assert.deepEqual(joint.util.normalizeSides({ horizontal: 10, left: 5 }), { top: 0, right: 10, bottom: 0, left: 5 },
            'If called with an object, horizontal sides are overriden by more specific sides from the object and the rest is defaulted to 0.');

        assert.deepEqual(joint.util.normalizeSides({ horizontal: 5, left: 0 }), { top: 0, right: 5, bottom: 0, left: 0 },
            'If called with an object, horizontal sides are overriden by more specific sides from the object and the rest is defaulted to 0.');
    });

    QUnit.test('util.merge', function(assert) {

        var types = joint.util.merge({ a: [99] }, { a: { b: 1 }});
        assert.deepEqual(types, { a: { b: 1 }}, 'array is not merged with object');


        var custom = joint.util.merge({ a: [99] }, { a: { b: 1 }}, function(a) {
            return 'x';
        });
        assert.deepEqual(custom, { a: 'x' });
    });


    QUnit.test('joint.setTheme()', function(assert) {

        assert.ok(typeof joint.setTheme === 'function', 'should be a function');

        var theme = 'set-global-theme-test';
        var view1 = new joint.mvc.View();
        var view2 = new joint.mvc.View();

        joint.setTheme(theme);

        assert.ok(view1.theme === theme && view2.theme === theme, 'should set the theme for all views');
        assert.equal(joint.mvc.View.prototype.defaultTheme, theme, 'should update the default theme on the view prototype');

        var view3 = new joint.mvc.View();

        assert.equal(view3.theme, theme, 'newly created views should use the updated theme');

        var localTheme = 'local-theme';

        joint.mvc.View.extend({
            options: {
                theme: localTheme
            }
        });

        var view4 = new joint.mvc.View({
            theme: localTheme
        });

        joint.setTheme(theme);

        assert.ok(view4.theme === localTheme, 'by default, should not override local theme settings');

        joint.setTheme(theme, { override: true });

        assert.ok(view4.theme === theme, 'when "override" set to true, should override local theme settings');
    });

    QUnit.module('template(html)', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.util.template, 'function');
        });

        QUnit.test('should correctly render the sample HTML templates', function(assert) {

            var samples = [
                {
                    html: '<p>No embedded data in this template.</p>',
                    data: {},
                    expectedOutput: '<p>No embedded data in this template.</p>'
                },
                {
                    html: '<p>no data!</p>',
                    data: null,
                    expectedOutput: '<p>no data!</p>'
                },
                {
                    html: [
                        '<p>Some simple text with a value: <%= someValue %></p>',
                        '<p>Another line with another value: <%= anotherValue %></p>'
                    ].join(''),
                    data: {
                        someValue: 12345,
                        anotherValue: 678
                    },
                    expectedOutput: [
                        '<p>Some simple text with a value: 12345</p>',
                        '<p>Another line with another value: 678</p>'
                    ].join('')
                },
                {
                    html: '<p>With a complex data attribute <%= some.value %></p>',
                    data: {
                        some: {
                            value: 123
                        }
                    },
                    expectedOutput: '<p>With a complex data attribute 123</p>'
                },
                {
                    html: '<p>With a more <%= some.value.text %> data attribute</p>',
                    data: {
                        some: {
                            value: {
                                text: 'complex'
                            }
                        }
                    },
                    expectedOutput: '<p>With a more complex data attribute</p>'
                },
                {
                    html: '<p>Alternative syntax #${num}</p>',
                    data: {
                        num: 1
                    },
                    expectedOutput: '<p>Alternative syntax #1</p>'
                },
                {
                    html: '<p>Alternative syntax #${ num }</p>',
                    data: {
                        num: 2
                    },
                    expectedOutput: '<p>Alternative syntax #2</p>'
                },
                {
                    html: '<p>Alternative syntax #{{num}}</p>',
                    data: {
                        num: 3
                    },
                    expectedOutput: '<p>Alternative syntax #3</p>'
                }
            ];

            _.each(samples, function(sample) {

                var template = joint.util.template(sample.html);
                var actualOutput = template(sample.data);

                assert.equal(actualOutput, sample.expectedOutput, 'should return expected output');
            });
        });
    });

    QUnit.module('addClassNamePrefix', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.util.addClassNamePrefix, 'function');
        });

        QUnit.test('falsey value provided', function(assert) {

            assert.equal(joint.util.addClassNamePrefix(null), null);
            assert.equal(joint.util.addClassNamePrefix(undefined), undefined);
            assert.equal(joint.util.addClassNamePrefix(0), 0);
            assert.equal(joint.util.addClassNamePrefix(''), '');
            assert.ok(_.isNaN(joint.util.addClassNamePrefix(NaN)));
        });

        QUnit.test('non-string value provided', function(assert) {

            assert.equal(joint.util.addClassNamePrefix(1), joint.config.classNamePrefix + '1');
        });

        QUnit.test('one class name', function(assert) {

            assert.equal(joint.util.addClassNamePrefix('some-class'), joint.config.classNamePrefix + 'some-class');
        });

        QUnit.test('multiple class names', function(assert) {

            assert.equal(joint.util.addClassNamePrefix('some-class some-other-class'), joint.config.classNamePrefix + 'some-class ' + joint.config.classNamePrefix + 'some-other-class');
        });
    });

    QUnit.module('removeClassNamePrefix', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.util.removeClassNamePrefix, 'function');
        });

        QUnit.test('falsey value provided', function(assert) {

            assert.equal(joint.util.removeClassNamePrefix(null), null);
            assert.equal(joint.util.removeClassNamePrefix(undefined), undefined);
            assert.equal(joint.util.removeClassNamePrefix(0), 0);
            assert.equal(joint.util.removeClassNamePrefix(''), '');
            assert.ok(_.isNaN(joint.util.removeClassNamePrefix(NaN)));
        });

        QUnit.test('non-string value provided', function(assert) {

            assert.equal(joint.util.removeClassNamePrefix(1), '1');
        });

        QUnit.test('one prefixed class name', function(assert) {

            assert.equal(joint.util.removeClassNamePrefix(joint.config.classNamePrefix + 'some-class'), 'some-class');
        });

        QUnit.test('multiple prefixed class names', function(assert) {

            assert.equal(joint.util.removeClassNamePrefix(joint.config.classNamePrefix + 'some-class ' + joint.config.classNamePrefix + 'some-other-class'), 'some-class some-other-class');
        });

        QUnit.test('mix of prefixed and non-prefixed class names', function(assert) {

            assert.equal(joint.util.removeClassNamePrefix(joint.config.classNamePrefix + 'some-class without-prefix'), 'some-class without-prefix');
        });
    });

    QUnit.module('wrapWith', function(hooks) {

        QUnit.test('wraps object\'s methods with wrapper function', function(assert) {

            var someObject = {

                someFunction: function() {

                },

                someOtherFunction: function() {

                },

                yetAnotherFunction: function() {

                }
            };

            var methods = ['someFunction', 'someOtherFunction'];

            var innerWrapper = function() { };

            var wrapper = function() {

                return innerWrapper;
            };

            joint.util.wrapWith(someObject, methods, wrapper);

            _.each(someObject, function(fn, method) {

                if (_.includes(methods, method)) {
                    // Should be wrapped.
                    assert.equal(someObject[method], innerWrapper);
                } else {
                    // Should not be wrapped.
                    assert.equal(someObject[method], fn);
                }
            });
        });

        QUnit.test('can specify wrapper method by name', function(assert) {

            var someObject = {

                someFunction: function() {

                }
            };

            var methods = ['someFunction'];
            var wrapper = 'someWrapper';
            var innerWrapper = function() { };

            joint.util.wrappers[wrapper] = function() {

                return innerWrapper;
            };

            joint.util.wrapWith(someObject, methods, wrapper);

            _.each(someObject, function(fn, method) {

                if (_.includes(methods, method)) {
                    // Should be wrapped.
                    assert.equal(someObject[method], innerWrapper);
                } else {
                    // Should not be wrapped.
                    assert.equal(someObject[method], fn);
                }
            });

            // Clean up.
            delete joint.util.wrappers[wrapper];
        });
    });

    QUnit.module('wrappers', function(hooks) {

        QUnit.module('cells', function(hooks) {

            var expected;

            hooks.beforeEach(function() {

                expected = {
                    cells: [
                        new joint.dia.Cell,
                        new joint.dia.Cell,
                        new joint.dia.Cell
                    ],
                    opt: {
                        someOption: 'testing',
                        anotherOption: 50
                    }
                };
            });

            QUnit.test('fn([cell, cell, cell], opt)', function(assert) {

                var fn = joint.util.wrappers.cells(function(cells, opt) {
                    assert.ok(_.isArray(cells), 'cells is an array');
                    assert.ok(_.isEqual(cells, expected.cells), 'cells is as expected');
                    assert.ok(_.isObject(opt), 'opt is an object');
                    assert.ok(_.isEqual(opt, expected.opt), 'opt is as expected');
                });

                fn(expected.cells, expected.opt);
            });

            QUnit.test('fn([cell, cell, cell])', function(assert) {

                var fn = joint.util.wrappers.cells(function(cells, opt) {
                    assert.ok(_.isArray(cells), 'cells is an array');
                    assert.ok(_.isEqual(cells, expected.cells), 'cells is as expected');
                    assert.ok(_.isObject(opt), 'opt is an object');
                    assert.ok(_.isEqual(opt, {}), 'opt is an empty object');
                });

                fn(expected.cells);
            });

            QUnit.test('fn(cell, cell, cell)', function(assert) {

                var fn = joint.util.wrappers.cells(function(cells, opt) {
                    assert.ok(_.isArray(cells), 'cells is an array');
                    assert.ok(_.isEqual(cells, expected.cells), 'cells is as expected');
                    assert.ok(_.isObject(opt), 'opt is an object');
                    assert.ok(_.isEqual(opt, {}), 'opt is an empty object');
                });

                fn.apply(undefined, expected.cells);
            });

            QUnit.test('fn(cell, cell, cell, opt)', function(assert) {

                var fn = joint.util.wrappers.cells(function(cells, opt) {
                    assert.ok(_.isArray(cells), 'cells is an array');
                    assert.ok(_.isEqual(cells, expected.cells), 'cells is as expected');
                    assert.ok(_.isObject(opt), 'opt is an object');
                    assert.ok(_.isEqual(opt, expected.opt), 'opt is as expected');
                });

                fn.apply(undefined, [].concat(expected.cells, [expected.opt]));
            });

            QUnit.test('fn(cell)', function(assert) {

                var cell = _.first(expected.cells);

                var fn = joint.util.wrappers.cells(function(cells, opt) {
                    assert.ok(_.isArray(cells), 'cells is an array');
                    assert.ok(_.isEqual(cells, [cell]), 'cells is as expected');
                    assert.ok(_.isObject(opt), 'opt is an object');
                    assert.ok(_.isEqual(opt, {}), 'opt is an empty object');
                });

                fn(cell);
            });
        });
    });

    QUnit.module('getElementBBox', function(hooks) {

        QUnit.module('html', function(hooks) {

            var $htmlElement;
            hooks.beforeEach(function() {
                $htmlElement = $('<div/>').css({
                    position: 'absolute',
                    top: 10,
                    left: 20,
                    width: 50,
                    height: 60
                });

                $htmlElement.appendTo(document.body);
            });

            hooks.afterEach(function() {
                $htmlElement.remove();
            });

            QUnit.test('html element', function(assert) {

                var bBox = joint.util.getElementBBox($htmlElement[0]);

                assert.equal(bBox.x, 20);
                assert.equal(bBox.y, 10);
                assert.equal(bBox.width, 50);
                assert.equal(bBox.height, 60);
            });

            QUnit.test('possible input argument types', function(assert) {

                assert.ok(joint.util.getElementBBox('html'));
                assert.ok(joint.util.getElementBBox($htmlElement));
                assert.ok(joint.util.getElementBBox($htmlElement[0]));

                assert.throws(function() {
                    joint.util.getElementBBox('xxx');
                });

                assert.throws(function() {
                    joint.util.getElementBBox();
                });
            })
        });

        QUnit.module('svg', function(hooks) {

            hooks.beforeEach(function() {
                this.svgDoc = V(V.createSvgDocument()).attr('style', 'position:absolute;top:50px;left:60px');
                V($('body')[0]).append(this.svgDoc);
            });

            hooks.afterEach(function() {
                this.svgDoc.remove();
            });

            QUnit.test('simple element', function(assert) {

                var svgElement = V('<rect width="70" height="80"/>');
                this.svgDoc.append(svgElement);

                var bBox = joint.util.getElementBBox(svgElement.node);

                assert.equal(bBox.x, 60);
                assert.equal(bBox.y, 50);
                assert.equal(bBox.width, 70);
                assert.equal(bBox.height, 80);
            });

            QUnit.test('with position, with stroke', function(assert) {

                // firefox measures differently - includes the stroke as well.
                // joint.util.getElementBBox should return consistent values across all browsers.
                var svgElement = V('<rect width="70" height="80" x="50" y="50" stroke-width="10" stroke="red"/>');
                this.svgDoc.append(svgElement);

                var bBox = joint.util.getElementBBox(svgElement.node);

                assert.equal(bBox.x, 60 + 50);
                assert.equal(bBox.y, 50 + 50);
                assert.equal(bBox.width, 70);
                assert.equal(bBox.height, 80);
            });
        });
    });

    QUnit.module('parseDOMJSON', function(hooks) {

        var util = joint.util;

        QUnit.test('sanity', function(assert) {
            var res = util.parseDOMJSON([{ tagName: 'rect' }], V.namespace.xmls);
            assert.ok(res.fragment instanceof DocumentFragment);
            assert.equal(Object(res.selectors), res.selectors);
        });

        QUnit.module('tagName', function() {

            QUnit.test('required', function(assert) {
                assert.throws(function() {
                    util.parseDOMJSON([{ /* tagName missing */ }]);
                });
            });

            QUnit.test('svg', function(assert) {
                var res = util.parseDOMJSON([{ tagName: 'rect' }], V.namespace.xmls);
                var node = res.fragment.firstChild;
                assert.ok(node instanceof SVGRectElement);
            });

            QUnit.test('html', function(assert) {
                var res = util.parseDOMJSON([{ tagName: 'div' }], V.namespace.xhtml);
                var node = res.fragment.firstChild;
                assert.ok(node instanceof HTMLDivElement);
            });
        });

        QUnit.module('attributes', function() {

            QUnit.test('svg', function(assert) {
                var res = util.parseDOMJSON([{
                    tagName: 'rect',
                    attributes: { 'fill': 'red', 'xlink:href': '#test' }
                }]);
                var node = res.fragment.firstChild;
                assert.equal(node.attributes.getNamedItem('fill').value, 'red');
                assert.equal(node.attributes.getNamedItemNS(V.namespace.xlink, 'href').value, '#test');
            });

            QUnit.test('html', function(assert) {
                var res = util.parseDOMJSON([{
                    tagName: 'div',
                    attributes: { 'title': 'test' }
                }], V.namespace.xhtml);
                var node = res.fragment.firstChild;
                assert.equal(node.attributes.getNamedItem('title').value, 'test');
            });
        });

        QUnit.module('style', function() {

            QUnit.test('svg', function(assert) {
                var res = util.parseDOMJSON([{
                    tagName: 'rect',
                    style: { 'fill': 'red' }
                }]);
                var node = res.fragment.firstChild;
                assert.ok(/fill:/.test(node.attributes.getNamedItem('style').value));
            });

            QUnit.test('html', function(assert) {
                var res = util.parseDOMJSON([{
                    tagName: 'div',
                    style: { 'color': 'red' }
                }], V.namespace.xhtml);
                var node = res.fragment.firstChild;
                assert.ok(/color:/.test(node.attributes.getNamedItem('style').value));
            });
        });

        QUnit.module('className', function() {

            QUnit.test('svg', function(assert) {
                var res = util.parseDOMJSON([{ tagName: 'rect', className: 'test' }]);
                var node = res.fragment.firstChild;
                assert.equal(node.className.baseVal, 'test');
            });

            QUnit.test('html', function(assert) {
                var res = util.parseDOMJSON([{ tagName: 'div', className: 'test' }], V.namespace.xhtml);
                var node = res.fragment.firstChild;
                assert.equal(node.className, 'test');
            });
        });

        QUnit.module('selector', function() {

            QUnit.test('svg', function(assert) {
                var res = util.parseDOMJSON([
                    { tagName: 'rect', selector: 'test1' },
                    { tagName: 'circle', selector: 'test2' }
                ]);
                assert.ok(res.selectors.test1 instanceof SVGRectElement);
                assert.ok(res.selectors.test2 instanceof SVGCircleElement);
                assert.equal(res.selectors.test1.getAttribute('joint-selector'), 'test1');
                assert.equal(res.selectors.test2.getAttribute('joint-selector'), 'test2');
            });

            QUnit.test('html', function(assert) {
                var res = util.parseDOMJSON([
                    { tagName: 'div', selector: 'test1' },
                    { tagName: 'img', selector: 'test2' },
                ], V.namespace.xhtml);
                assert.ok(res.selectors.test1 instanceof HTMLDivElement);
                assert.ok(res.selectors.test2 instanceof HTMLImageElement);
                assert.equal(res.selectors.test1.getAttribute('joint-selector'), 'test1');
                assert.equal(res.selectors.test2.getAttribute('joint-selector'), 'test2');
            });

            QUnit.test('uniqueness', function(assert) {
                assert.throws(function() {
                    util.parseDOMJSON([
                        { tagName: 'rect', selector: 'test' },
                        { tagName: 'circle', selector: 'test' },
                    ]);
                });
            });
        });

        QUnit.module('namespaceURI', function() {

            QUnit.test('svg', function(assert) {
                var res = util.parseDOMJSON([{ tagName: 'rect', namespaceURI: V.namespace.xmlns }]);
                var node = res.fragment.firstChild;
                assert.ok(node instanceof SVGRectElement);
            });

            QUnit.test('html', function(assert) {
                var res = util.parseDOMJSON([{ tagName: 'div', namespaceURI: V.namespace.xhtml }]);
                var node = res.fragment.firstChild;
                assert.ok(node instanceof HTMLDivElement);
            });
        });

        QUnit.module('children', function() {

            QUnit.test('svg', function(assert) {
                var res = util.parseDOMJSON([{
                    tagName: 'g',
                    children: [{ tagName: 'rect' }, { tagName: 'circle' }]
                }]);
                var group = res.fragment.firstChild;
                assert.ok(group instanceof SVGGElement);
                assert.ok(group.firstChild instanceof SVGRectElement);
                assert.ok(group.lastChild instanceof SVGCircleElement);
            });

            QUnit.test('html', function(assert) {
                var res = util.parseDOMJSON([{
                    tagName: 'div',
                    children: [{ tagName: 'p' }, { tagName: 'img' }]
                }], V.namespace.xhtml);
                var div = res.fragment.firstChild;
                assert.ok(div instanceof HTMLDivElement);
                assert.ok(div.firstChild instanceof HTMLParagraphElement);
                assert.ok(div.lastChild instanceof HTMLImageElement);
            });
        });
    });
});
