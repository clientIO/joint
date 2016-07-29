'use strict';

QUnit.module('util', function(hooks) {

    QUnit.test('util.interpolate', function() {

        var values = [0, .25, .5, .75, 1];

        var numberInterpolation = joint.util.interpolate.number(0, 100);
        var objectInterpolation = joint.util.interpolate.object({ x: 100, y: 200 }, { x: 200, y: 0 });
        var hexColorInterpolation = joint.util.interpolate.hexColor('#FFFFFF', '#00FF77');
        var unitInterpolation = joint.util.interpolate.unit('1em', '0.50em');

        var numberArray = _.map(values, numberInterpolation);
        var objectArray = _.map(values, objectInterpolation);
        var hexColorArray = _.map(values, hexColorInterpolation);
        var unitArray = _.map(values, unitInterpolation);

        deepEqual(numberArray, [
            0, 25, 50, 75, 100
        ], 'Numbers interpolated.');

        deepEqual(objectArray, [
            { x: 100, y: 200 }, { x: 125, y: 150 }, { x: 150, y: 100 }, { x: 175, y: 50 }, { x: 200,    y: 0 }
        ], 'Objects interpolated.');

        deepEqual(hexColorArray, [
            '#ffffff', '#bfffdd', '#7fffbb', '#3fff99', '#00ff77'
        ], 'String hex colors interpolated.');

        deepEqual(unitArray, [
            '1.00em', '0.88em', '0.75em', '0.63em', '0.50em'
        ], 'Numbers with units interpolated.');
    });

    QUnit.test('util.format.number', function() {

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

            equal(joint.util.format.number(input[0], input[1]), output, 'number(' + input[0] + ', ' + input[1] + ') = ' + output);
        });
    });

    QUnit.test('util.breakText', function() {

        // tests can't compare exact results as they may vary in different browsers

        // This ensures that the tests will be more deterministic.
        // For example, some browsers might have a different default font size/family.
        var styles = {
            'font-size': '12px',
            'font-family': 'Courer New'
        };

        var text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

        equal(joint.util.breakText('', { width: 100 }, styles), '', 'An empty text was correctly broken.');

        equal(joint.util.breakText(text, { width: 0, height: 0 }, styles), '', 'A text was correctly broken when zero width and height provided.');

        ok(_.contains(joint.util.breakText(text, { width: 100 }, styles), '\n'),
           'A text was broken when width A specified.');

        ok(_.contains(joint.util.breakText(text, { width: 15 }, styles), '\n'), 'A text was broken when width B specified.');

        var brokenText = joint.util.breakText(text, { width: 100, height: 50 }, styles);

        ok(_.contains(brokenText, 'Lorem') && !_.contains(brokenText, 'elit.'), 'A text was trimmed when width & height specified.');

        brokenText = joint.util.breakText(text, { width: 100, height: 50 }, _.extend({}, styles, { 'font-size': '18px' }));

        ok(_.contains(brokenText, '\n') || !_.contains(brokenText, 'elit.'), 'A text was broken when style specified.');

        throws(function() {
            joint.util.breakText(text, { width: 100, height: 50 }, _.extend({}, styles, { 'font-size': '18px' }), { svgDocument: 'not-svg' });
        }, /appendChild|undefined/, 'A custom svgDocument provided was recognized.');
    });

    QUnit.test('util.getByPath()', function() {

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
            }]
        };

        deepEqual(joint.util.getByPath(obj, 'none'), undefined, 'non-existing property is undefined');
        equal(joint.util.getByPath(obj, 'a'), 1, 'existing property is a number');
        deepEqual(joint.util.getByPath(obj, 'b'), { c: 2, d: 3 }, 'existing property is an object');
        equal(joint.util.getByPath(obj, 'b/c'), 2, 'nested property is a number');
        deepEqual(joint.util.getByPath(obj, 'b/none'), undefined, 'non-existing nested property is undefined');
        deepEqual(joint.util.getByPath(obj, 'f'), {}, 'property is an empty object');
        deepEqual(joint.util.getByPath(obj, 'g'), [], 'property is an empty array');
        deepEqual(joint.util.getByPath(obj, 'g/0'), undefined, 'first item of an empty array is undefined');
        deepEqual(joint.util.getByPath(obj, 'h/0'), null, 'first item of an array is null');
        deepEqual(joint.util.getByPath(obj, 'h/0/none'), undefined, 'nested property in null is undefined');
        equal(joint.util.getByPath(obj, 'h/1'), 4, 'nth item of an array is number');
        deepEqual(joint.util.getByPath(obj, 'h/1/none'), undefined, 'non-existing property of nth item of an array is undefined');
        equal(joint.util.getByPath(obj, 'h/2/i/j'), 6, 'nested property of nth item of an array is number');
        equal(joint.util.getByPath(obj, 'h.2.i.j', '.'), 6, 'same but this time with a custom delimiter');
    });

    QUnit.test('util.setByPath()', function() {

        deepEqual(joint.util.setByPath({}, 'property', 1), { property: 1 }, 'non-existing property in an obj set as a number');
        deepEqual(joint.util.setByPath({ property: 2 }, 'property', 3), { property: 3 }, 'existing property in an obj set as a number');
        deepEqual(joint.util.setByPath([], '0', 4), [4], 'add an item to an empty array');
        deepEqual(joint.util.setByPath([5, 6], '1', 7), [5, 7], 'change an item in an array');
        deepEqual(joint.util.setByPath({}, 'first/second/third', 8), { first: { second: { third: 8 } } }, 'populate an empty object with nested objects');
        deepEqual(joint.util.setByPath({}, 'first.second.third', 9, '.'), { first: { second: { third: 9 } } }, 'same but this time with a custom delimiter');
        deepEqual(joint.util.setByPath([null], '0/property', 10), [{ property: 10 }], 'replace null item with an object');
    });

    QUnit.test('util.unsetByPath()', function() {

        var obj = {
            a: 1,
            b: {
                c: 2,
                d: 3
            }
        };

        joint.util.unsetByPath(obj, 'b/c', '/');

        deepEqual(obj, { a: 1, b: { d: 3 } }, 'A nested attribute was removed.');

        joint.util.unsetByPath(obj, 'b');

        deepEqual(obj, { a: 1 }, 'A primitive attribute was removed.');

        joint.util.unsetByPath(obj, 'c/d');

        deepEqual(obj, { a: 1 }, 'Attempt to delete non-existing attribute doesn\'t affect object.');
    });

    QUnit.test('util.normalizeSides()', function(assert) {

        assert.deepEqual(joint.util.normalizeSides(), { top: 0, left: 0, right: 0, bottom: 0 },
                         'Returns sides defaulted to 0 if called without an argument.');

        assert.deepEqual(joint.util.normalizeSides(5), { top: 5, left: 5, right: 5, bottom: 5 },
                         'Returns sides equaled to a number if called with this number as an argument.');

        assert.deepEqual(joint.util.normalizeSides({ left: 5 }), { top: 0, left: 5, right: 0, bottom: 0 },
                         'If called with an object, the existing sides are copied from the given object and the rest is defaulted to 0.');
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

                if (_.contains(methods, method)) {
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

                if (_.contains(methods, method)) {
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
});
