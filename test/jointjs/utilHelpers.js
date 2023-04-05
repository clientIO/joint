// code originates from https://github.com/lodash/lodash/blob/4.17.15-post/test/test.js

QUnit.module('Lodash util helpers', function() {
    function toArgs(array) {
        return (function() { return arguments; }.apply(undefined, array));
    }
    const symbol = Symbol('a');

    /** Used to check whether methods support typed arrays. */
    const typedArrays = [
        'Float32Array',
        'Float64Array',
        'Int8Array',
        'Int16Array',
        'Int32Array',
        'Uint8Array',
        'Uint8ClampedArray',
        'Uint16Array',
        'Uint32Array'
    ];

    /** Used to check whether methods support array views. */
    const arrayViews = typedArrays.concat('DataView');

    const falsey = [null, undefined, false, 0, NaN, ''];

    const MAX_ARRAY_LENGTH = 4294967295;
    const MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1;

    QUnit.module('assign', function() {

        QUnit.test('should assign source properties to `object`', function(assert) {
            const actual = joint.util.assign({ 'a': 1 }, { 'b': 2 });
            assert.deepEqual(actual, { 'a': 1, 'b': 2 });
        });

        QUnit.test('should accept multiple sources', function(assert) {
            const actual = joint.util.assign({ 'a': 1, 'b': 2 }, { 'a': 3, 'b': 2, 'c': 1 });
            assert.deepEqual(actual, { 'a': 3, 'b': 2, 'c': 1 });
        });

        QUnit.test('should assign source properties with nullish values', function(assert) {
            const expected = { 'a': null, 'b': undefined, 'c': null };
            const actual = joint.util.assign({ 'a': 1, 'b': 2 }, expected);
            assert.deepEqual(actual, expected);
        });

        QUnit.test('should treat sparse array sources as dense', function(assert) {
            let array = [1];
            array[2] = 3;

            assert.deepEqual(joint.util.assign({}, array), { '0': 1, '1': undefined, '2': 3 });
        });
    });

    QUnit.module('defaults', function() {

        QUnit.test('should assign source properties if missing on `object`', function(assert) {
            const actual = joint.util.defaults({ 'a': 1 }, { 'a': 2, 'b': 2 });
            assert.deepEqual(actual, { 'a': 1, 'b': 2 });
        });

        QUnit.test('should accept multiple sources', function(assert) {
            const expected = { 'a': 1, 'b': 2, 'c': 3 };
            let actual = joint.util.defaults({ 'a': 1, 'b': 2 }, { 'b': 3 }, { 'c': 3 });

            assert.deepEqual(actual, expected);

            actual = joint.util.defaults({ 'a': 1, 'b': 2 }, { 'b': 3, 'c': 3 }, { 'c': 2 });
            assert.deepEqual(actual, expected);
        });

        QUnit.test('should not overwrite `null` values', function(assert) {
            const actual = joint.util.defaults({ 'a': null }, { 'a': 1 });
            assert.strictEqual(actual.a, null);
        });

        QUnit.test('should overwrite `undefined` values', function(assert) {
            const actual = joint.util.defaults({ 'a': undefined }, { 'a': 1 });
            assert.strictEqual(actual.a, 1);
        });

        QUnit.test('should assign `undefined` values', function(assert) {
            const source = { 'a': undefined, 'b': 1 };
            const actual = joint.util.defaults({}, source);

            assert.deepEqual(actual, { 'a': undefined, 'b': 1 });
        });

        QUnit.test('should assign properties that shadow those on `Object.prototype`', function(assert) {

            const object = {
                'constructor': Object.prototype.constructor,
                'hasOwnProperty': Object.prototype.hasOwnProperty,
                'isPrototypeOf': Object.prototype.isPrototypeOf,
                'propertyIsEnumerable': Object.prototype.propertyIsEnumerable,
                'toLocaleString': Object.prototype.toLocaleString,
                'toString': Object.prototype.toString,
                'valueOf': Object.prototype.valueOf
            };

            const source = {
                'constructor': 1,
                'hasOwnProperty': 2,
                'isPrototypeOf': 3,
                'propertyIsEnumerable': 4,
                'toLocaleString': 5,
                'toString': 6,
                'valueOf': 7
            };

            let expected = joint.util.clone(source);
            assert.deepEqual(joint.util.defaults({}, source), expected);

            expected = joint.util.clone(object);
            assert.deepEqual(joint.util.defaults({}, object, source), expected);
        });
    });

    QUnit.module('defaultsDeep', function() {

        QUnit.test('should deep assign source properties if missing on `object`', function(assert) {
            const object = { 'a': { 'b': 2 }, 'd': 4 };
            const source = { 'a': { 'b': 3, 'c': 3 }, 'e': 5 };
            const expected = { 'a': { 'b': 2, 'c': 3 }, 'd': 4, 'e': 5 };

            assert.deepEqual(joint.util.defaultsDeep(object, source), expected);
        });

        QUnit.test('should accept multiple sources', function(assert) {
            const source1 = { 'a': { 'b': 3 }};
            const source2 = { 'a': { 'c': 3 }};
            const source3 = { 'a': { 'b': 3, 'c': 3 }};
            const source4 = { 'a': { 'c': 4 }};
            const expected = { 'a': { 'b': 2, 'c': 3 }};

            assert.deepEqual(joint.util.defaultsDeep({ 'a': { 'b': 2 }}, source1, source2), expected);
            assert.deepEqual(joint.util.defaultsDeep({ 'a': { 'b': 2 }}, source3, source4), expected);
        });

        QUnit.test('should not overwrite `null` values', function(assert) {
            const object = { 'a': { 'b': null }};
            const source = { 'a': { 'b': 2 }};
            const actual = joint.util.defaultsDeep(object, source);

            assert.strictEqual(actual.a.b, null);
        });

        QUnit.test('should not overwrite regexp values', function(assert) {
            const object = { 'a': { 'b': /x/ }};
            const source = { 'a': { 'b': /y/ }};
            const actual = joint.util.defaultsDeep(object, source);

            assert.deepEqual(actual.a.b, /x/);
        });

        QUnit.test('should not convert function properties to objects', function(assert) {
            let actual = joint.util.defaultsDeep({}, { 'a': joint.util.noop });
            assert.strictEqual(actual.a, joint.util.noop);

            actual = joint.util.defaultsDeep({}, { 'a': { 'b': joint.util.noop }});
            assert.strictEqual(actual.a.b, joint.util.noop);
        });

        QUnit.test('should overwrite `undefined` values', function(assert) {
            const object = { 'a': { 'b': undefined }},
                source = { 'a': { 'b': 2 }},
                actual = joint.util.defaultsDeep(object, source);

            assert.strictEqual(actual.a.b, 2);
        });

        QUnit.test('should merge sources containing circular references', function(assert) {
            const object = {
                'foo': { 'b': { 'c': { 'd': {}}}},
                'bar': { 'a': 2 }
            };

            const source = {
                'foo': { 'b': { 'c': { 'd': {}}}},
                'bar': {}
            };

            object.foo.b.c.d = object;
            source.foo.b.c.d = source;
            source.bar.b = source.foo.b;

            const actual = joint.util.defaultsDeep(object, source);

            assert.strictEqual(actual.bar.b, actual.foo.b);
            assert.strictEqual(actual.foo.b.c.d, actual.foo.b.c.d.foo.b.c.d);
        });

        QUnit.test('should not modify sources', function(assert) {
            const source1 = { 'a': 1, 'b': { 'c': 2 }};
            const source2 = { 'b': { 'c': 3, 'd': 3 }};
            const actual = joint.util.defaultsDeep({}, source1, source2);

            assert.deepEqual(actual, { 'a': 1, 'b': { 'c': 2, 'd': 3 }});
            assert.deepEqual(source1, { 'a': 1, 'b': { 'c': 2 }});
            assert.deepEqual(source2, { 'b': { 'c': 3, 'd': 3 }});
        });

        QUnit.test('should not attempt a merge of a string into an array', function(assert) {
            const actual = joint.util.defaultsDeep({ 'a': ['abc'] }, { 'a': 'abc' });
            assert.deepEqual(actual.a, ['abc']);
        });

        QUnit.test('should not indirectly merge `Object` properties', function(assert) {
            joint.util.defaultsDeep({}, { 'constructor': { 'a': 1 }});

            const actual = 'a' in Object;
            delete Object.a;

            assert.notOk(actual);
        });
    });

    QUnit.module('invoke', function() {

        QUnit.test('should invoke a methods on each element of `collection`', function(assert) {
            const array = ['a', 'b', 'c'];
            const actual = joint.util.invoke(array, 'toUpperCase');

            assert.deepEqual(actual, ['A', 'B', 'C']);
        });

        QUnit.test('should support invoking with arguments', function(assert) {
            const array = [function() { return Array.prototype.slice.call(arguments); }];
            const actual = joint.util.invoke(array, 'call', null, 'a', 'b', 'c');

            assert.deepEqual(actual, [['a', 'b', 'c']]);
        });

        QUnit.test('should work with a function for `methodName`', function(assert) {
            const array = ['a', 'b', 'c'];

            const actual = joint.util.invoke(array, function(left, right) {
                return left + this.toUpperCase() + right;
            }, '(', ')');

            assert.deepEqual(actual, ['(A)', '(B)', '(C)']);
        });

        QUnit.test('should work with an object for `collection`', function(assert) {
            const object = { 'a': 1, 'b': 2, 'c': 3 };
            const actual = joint.util.invoke(object, 'toFixed', 1);

            assert.deepEqual(actual, ['1.0', '2.0', '3.0']);
        });

        QUnit.test('should treat number values for `collection` as empty', function(assert) {
            assert.deepEqual(joint.util.invoke(1), []);
        });

        QUnit.test('should not error on nullish elements', function(assert) {
            const array = ['a', null, undefined, 'd'];
            let actual;

            try {
                actual = joint.util.invoke(array, 'toUpperCase');
            } catch (e) {
                throw new Error('should not error on nullish elements');
            }

            assert.deepEqual(actual, ['A', undefined, undefined, 'D']);
        });

        QUnit.test('should not error on elements with missing properties', function(assert) {
            const objects = [null, undefined, function() { return 1; }].map((value) => {
                return { 'a': value };
            });

            const expected = objects.map((object) => {
                return object.a ? object.a() : undefined;
            });

            let actual;

            try {
                actual = joint.util.invoke(objects, 'a');
            } catch (e) {
                throw new Error('should not error on elements with missing properties');
            }

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should invoke deep property methods with the correct `this` binding', function(assert) {
            const object = { 'a': { 'b': function() { return this.c; }, 'c': 1 }};

            ['a.b', ['a', 'b']].forEach((path) => {
                assert.deepEqual(joint.util.invoke([object], path), [1]);
            });
        });
    });

    QUnit.module('invokeProperty', function() {

        QUnit.test('should invoke a method on `object`', function(assert) {
            const object = { 'a': () => 'A' };
            const actual = joint.util.invokeProperty(object, 'a');

            assert.strictEqual(actual, 'A');
        });

        QUnit.test('should support invoking with arguments', function(assert) {
            const object = { 'a': function(a, b) { return [a, b]; } };
            const actual = joint.util.invokeProperty(object, 'a', 1, 2);

            assert.deepEqual(actual, [1, 2]);
        });

        QUnit.test('should not error on nullish elements', function(assert) {
            const values = [null, undefined];
            const expected = values.map(() => undefined);

            var actual = values.map((value) => {
                try {
                    return joint.util.invokeProperty(value, 'a.b', 1, 2);
                } catch (e) {
                    throw new Error('should not error on nullish elements');
                }
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should preserve the sign of `0`', function(assert) {
            const object = { '-0': () => 'a', '0': () => 'b' };
            const props = [-0, Object(-0), 0, Object(0)];

            var actual = props.map(function(key) {
                return joint.util.invokeProperty(object, key);
            });

            assert.deepEqual(actual, ['a', 'a', 'b', 'b']);
        });

        QUnit.test('should support deep paths', function(assert) {
            const object = { 'a': { 'b': function(a, b) { return [a, b]; } }};

            ['a.b', ['a', 'b']].forEach((path) => {
                var actual = joint.util.invokeProperty(object, path, 1, 2);
                assert.deepEqual(actual, [1, 2]);
            });
        });

        QUnit.test('should invoke deep property methods with the correct `this` binding', function(assert) {
            const object = { 'a': { 'b': function() { return this.c; }, 'c': 1 }};

            ['a.b', ['a', 'b']].forEach((path) => {
                assert.deepEqual(_.invoke(object, path), 1);
            });
        });
    });

    QUnit.module('sortedIndex', function() {

        QUnit.test('should return the insert index', function(assert) {
            const array = [30, 50];
            const values = [30, 40, 50];
            const expected = [0, 1, 1];

            const actual = values.map((value) => {
                return joint.util.sortedIndex(array, value);
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should work with an array of strings', function(assert) {
            const array = ['a', 'c'];
            const values = ['a', 'b', 'c'];
            const expected = [0, 1, 1];

            const actual = values.map((value) => {
                return joint.util.sortedIndex(array, value);
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should accept a nullish `array` and a `value`', function(assert) {
            const values = [null, undefined];
            const expected = values.map(() => [0, 0, 0]);

            const actual = values.map((array) => {
                return [joint.util.sortedIndex(array, 1), joint.util.sortedIndex(array, undefined), joint.util.sortedIndex(array, NaN)];
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should align with `sortBy`', function(assert) {
            const symbol1 = Symbol ? Symbol('a') : null;
            const symbol2 = Symbol ? Symbol('b') : null;
            const symbol3 = Symbol ? Symbol('c') : null;
            const expected = [1, '2', {}, symbol1, symbol2, null, undefined, NaN, NaN];

            [
                [NaN, symbol1, null, 1, '2', {}, symbol2, NaN, undefined],
                ['2', null, 1, symbol1, NaN, {}, NaN, symbol2, undefined]
            ].forEach((array) => {
                assert.deepEqual(joint.util.sortBy(array), expected);
                assert.strictEqual(joint.util.sortedIndex(expected, 3), 2);
                assert.strictEqual(joint.util.sortedIndex(expected, symbol3), 3);
                assert.strictEqual(joint.util.sortedIndex(expected, null), Symbol ? 5 : 3);
                assert.strictEqual(joint.util.sortedIndex(expected, undefined), 6);
                assert.strictEqual(joint.util.sortedIndex(expected, NaN), 7);
            });
        });

        QUnit.test('should align with `sortBy` for nulls', function(assert) {
            const array = [null, null];

            assert.strictEqual(joint.util.sortedIndex(array, null), 0);
            assert.strictEqual(joint.util.sortedIndex(array, 1), 0);
            assert.strictEqual(joint.util.sortedIndex(array, 'a'), 0);
        });

        QUnit.test('should align with `sortBy` for symbols', function(assert) {
            const symbol1 = Symbol ? Symbol('a') : null;
            const symbol2 = Symbol ? Symbol('b') : null;
            const symbol3 = Symbol ? Symbol('c') : null;
            const array = [symbol1, symbol2];

            assert.strictEqual(joint.util.sortedIndex(array, symbol3), 0);
            assert.strictEqual(joint.util.sortedIndex(array, 1), 0);
            assert.strictEqual(joint.util.sortedIndex(array, 'a'), 0);
        });
    });

    QUnit.module('sortedIndex with iteratee (sortedIndexBy)', function() {

        QUnit.test('should provide correct `iteratee` arguments', function(assert) {
            let args;

            joint.util.sortedIndex([30, 50], 40, function(assert) {
                args || (args = Array.prototype.slice.call(arguments));
            });

            assert.deepEqual(args, [40]);
        });

        QUnit.test('should work with `property` shorthands', function(assert) {
            const objects = [{ 'x': 30 }, { 'x': 50 }];
            const actual = joint.util.sortedIndex(objects, { 'x': 40 }, 'x');

            assert.strictEqual(actual, 1);
        });

        QUnit.test('should avoid calling iteratee when length is 0', function(assert) {
            const objects = [];
            const iteratee = function() {
                throw new Error;
            };
            const actual = joint.util.sortedIndex(objects, { 'x': 50 }, iteratee);

            assert.strictEqual(actual, 0);
        });

        QUnit.test('should support arrays larger than `MAX_ARRAY_LENGTH / 2`', function(assert) {
            const customIsNaN = (value) => value !== value;

            [Math.ceil(MAX_ARRAY_LENGTH / 2), MAX_ARRAY_LENGTH].forEach((length) => {
                let array = [];
                const values = [MAX_ARRAY_LENGTH, NaN, undefined];

                array.length = length;

                values.forEach((value) => {
                    let steps = 0;

                    const actual = joint.util.sortedIndex(array, value, function(value) {
                        steps++;
                        return value;
                    });

                    const expected = !customIsNaN(value)
                        ? 0
                        : Math.min(length, MAX_ARRAY_INDEX);

                    assert.ok(steps == 32 || steps == 33);
                    assert.strictEqual(actual, expected);
                });
            });
        });
    });

    QUnit.module('uniq', function() {

        QUnit.test('should perform an unsorted uniq when used as an iteratee for methods like `map`', function(assert) {
            const array = [[2, 1, 2], [1, 2, 1]];
            const actual = array.map((arr) => joint.util.uniq(arr));

            assert.deepEqual(actual, [[2, 1], [1, 2]]);
        });

        const objects = [{ 'a': 2 }, { 'a': 3 }, { 'a': 1 }, { 'a': 2 }, { 'a': 3 }, { 'a': 1 }];

        QUnit.test('should work with an `iteratee`', function(assert) {
            const expected = objects.slice(0, 3);

            const actual = joint.util.uniq(objects, (object) => {
                return object.a;
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should provide correct `iteratee` arguments', function(assert) {
            let args;

            joint.util.uniq(objects, function() {
                args || (args = Array.prototype.slice.call(arguments));
            });

            assert.deepEqual(args, [objects[0]]);
        });

        QUnit.test('should work with `property` shorthands', function(assert) {
            let expected = objects.slice(0, 3);
            let actual = joint.util.uniq(objects, 'a');

            assert.deepEqual(actual, expected);

            const arrays = [[2], [3], [1], [2], [3], [1]];

            actual = joint.util.uniq(arrays, 0);
            expected = arrays.slice(0, 3);

            assert.deepEqual(actual, expected);
        });

        const expected = [['a'], ['b']];

        QUnit.test('should work with an array for `iteratee`', function(assert) {
            const actual = joint.util.uniq([['a'], ['a'], ['b']], [0, 'a']);

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should work with an object for `iteratee`', function(assert) {
            const actual = joint.util.uniq([['a'], ['a'], ['b']], { '0': 'a' });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should work with a number for `iteratee`', function(assert) {
            const actual = joint.util.uniq([['a'], ['a'], ['b']], 0);

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should work with a string for `iteratee`', function(assert) {
            const actual = joint.util.uniq([['a'], ['a'], ['b']], '0');

            assert.deepEqual(actual, expected);
        });
    });

    QUnit.module('clone and cloneDeep', function() {

        QUnit.test('should perform a shallow clone', function(assert) {
            const array = [{ 'a': 0 }, { 'b': 1 }];
            const actual = joint.util.clone(array);

            assert.deepEqual(actual, array);
            assert.ok(actual !== array && actual[0] === array[0]);
        });

        function Foo() {
            this.a = 1;
        }
        Foo.prototype.b = 1;
        Foo.c = function() {};

        const map = new Map();
        map.set('a', 1);
        map.set('b', 2);

        const set = new Set();
        set.add(1);
        set.add(2);

        const objects = {
            '`arguments` objects': arguments,
            'arrays': ['a', ''],
            'array-like objects': { '0': 'a', 'length': 1 },
            'booleans': false,
            'boolean objects': Object(false),
            'date objects': new Date,
            'Foo instances': new Foo,
            'objects': { 'a': 0, 'b': 1, 'c': 2 },
            'objects with object values': { 'a': /a/, 'b': ['B'], 'c': { 'C': 1 }},
            'objects from another document': {},
            'maps': map,
            'null values': null,
            'numbers': 0,
            'number objects': Object(0),
            'regexes': /a/gim,
            'sets': set,
            'strings': 'a',
            'string objects': Object('a'),
            'undefined values': undefined
        };

        objects.arrays.length = 3;

        ['clone', 'cloneDeep'].forEach((methodName) => {
            const func = joint.util[methodName];
            const isDeep = methodName === 'cloneDeep';

            for (const key in objects) {
                QUnit.test(`'${methodName}' should clone ${key}`, function(assert) {
                    const object = objects[key];
                    const expected = func(object);
                    const actual = func(object);
                    assert.deepEqual(actual, expected);
                });
            }

            QUnit.test(`${methodName} should clone array buffers`, function(assert) {
                if (ArrayBuffer) {
                    const arrayBuffer = new ArrayBuffer(2);
                    const actual = func(arrayBuffer);
                    assert.strictEqual(actual.byteLength, arrayBuffer.byteLength);
                    assert.notStrictEqual(actual, arrayBuffer);
                }
            });

            QUnit.test(`${methodName} should clone \`index\` and \`input\` array properties`, function(assert) {
                const array = /c/.exec('abcde');
                const actual = func(array);

                assert.strictEqual(actual.index, 2);
                assert.strictEqual(actual.input, 'abcde');
            });

            QUnit.test(`${methodName} should clone \`lastIndex\` regexp property`, function(assert) {
                const regexp = /c/g;
                regexp.exec('abcde');

                assert.strictEqual(func(regexp).lastIndex, 3);
            });

            QUnit.test(`${methodName} should clone expand properties`, function(assert) {
                const values = [false, true, 1, 'a'].map((value) => {
                    const object = Object(value);
                    object.a = 1;
                    return object;
                });

                const expected = [true, true, true, true];

                const actual = values.map((value) => {
                    return func(value).a === 1;
                });

                assert.deepEqual(actual, expected);
            });

            QUnit.test(`${methodName} should clone prototype objects`, function(assert) {
                const actual = func(Foo.prototype);

                assert.notOk(actual instanceof Foo);
                assert.deepEqual(actual, { 'b': 1 });
            });

            QUnit.test(`${methodName} should set the \`[[Prototype]]\` of a clone`, function(assert) {
                assert.ok(func(new Foo) instanceof Foo);
            });

            QUnit.test(`${methodName} should set the \`[[Prototype]]\` of a clone even when the \`constructor\` is incorrect`, function(assert) {
                Foo.prototype.constructor = Object;
                assert.ok(func(new Foo) instanceof Foo);
                Foo.prototype.constructor = Foo;
            });

            QUnit.test(`${methodName} should ensure \`value\` constructor is a function before using its \`[[Prototype]]\``, function(assert) {
                Foo.prototype.constructor = null;
                assert.notOk(func(new Foo) instanceof Foo);
                Foo.prototype.constructor = Foo;
            });

            QUnit.test(`${methodName} should clone properties that shadow those on \`Object.prototype\``, function(assert) {
                const object = {
                    'constructor': Object.prototype.constructor,
                    'hasOwnProperty': Object.prototype.hasOwnProperty,
                    'isPrototypeOf': Object.prototype.isPrototypeOf,
                    'propertyIsEnumerable': Object.prototype.propertyIsEnumerable,
                    'toLocaleString': Object.prototype.toLocaleString,
                    'toString': Object.prototype.toString,
                    'valueOf': Object.prototype.valueOf
                };

                const actual = func(object);

                assert.deepEqual(actual, object);
                assert.notStrictEqual(actual, object);
            });

            QUnit.test(`${methodName} should clone symbol properties`, function(assert) {

                function Foo() {
                    this[symbol] = { 'c': 1 };
                }

                if (Symbol) {
                    const symbol2 = Symbol('b');
                    Foo.prototype[symbol2] = 2;

                    const symbol3 = Symbol('c');
                    Object.defineProperty(Foo.prototype, symbol3, {
                        'configurable': true,
                        'enumerable': false,
                        'writable': true,
                        'value': 3
                    });

                    const object = { 'a': { 'b': new Foo }};
                    object[symbol] = { 'b': 1 };

                    const actual = func(object);
                    if (isDeep) {
                        assert.notStrictEqual(actual[symbol], object[symbol]);
                        assert.notStrictEqual(actual.a, object.a);
                    } else {
                        assert.strictEqual(actual[symbol], object[symbol]);
                        assert.strictEqual(actual.a, object.a);
                    }
                    assert.deepEqual(actual[symbol], object[symbol]);
                    assert.deepEqual(actual.a.b[symbol], object.a.b[symbol]);
                    assert.deepEqual(actual.a.b[symbol2], object.a.b[symbol2]);
                    assert.deepEqual(actual.a.b[symbol3], object.a.b[symbol3]);
                }
            });

            QUnit.test(`${methodName} should clone symbol objects`, function(assert) {
                assert.strictEqual(func(symbol), symbol);

                const object = Object(symbol);
                const actual = func(object);

                assert.strictEqual(typeof actual, 'object');
                assert.strictEqual(typeof actual.valueOf(), 'symbol');
                assert.notStrictEqual(actual, object);
            });

            QUnit.test(`${methodName} should not clone symbol primitives`, function(assert) {
                assert.strictEqual(func(symbol), symbol);
            });

            QUnit.test(`${methodName} should not error on DOM elements`, function(assert) {
                assert.expect(1);

                const element = document.createElement('div');
                try {
                    assert.deepEqual(func(element), {});
                } catch (e) {
                    assert.ok(false, e.message);
                }
            });

            arrayViews.forEach((type) => {
                QUnit.test(`${methodName} should clone \`${type}\` values`, function(assert) {
                    const Ctor = window[type];

                    [0, 1].forEach((index) => {
                        if (Ctor) {
                            const buffer = new ArrayBuffer(24);
                            const view = index ? new Ctor(buffer, 8, 1) : new Ctor(buffer);
                            const actual = func(view);

                            assert.deepEqual(actual, view);
                            assert.notStrictEqual(actual, view);
                            assert.strictEqual(actual.buffer === view.buffer, !isDeep);
                            assert.strictEqual(actual.byteOffset, view.byteOffset);
                            assert.strictEqual(actual.length, view.length);
                        }
                    });
                });
            });
        });
    });

    QUnit.module('isEmpty', function() {

        const empties = [[], {}].concat(falsey.slice(1));

        QUnit.test('should return `true` for empty values', function(assert) {
            const expected = empties.map(() => true);
            const actual = empties.map((val) => joint.util.isEmpty(val));

            assert.deepEqual(actual, expected);

            assert.strictEqual(joint.util.isEmpty(true), true);
            assert.strictEqual(joint.util.isEmpty(Array.prototype.slice), true);
            assert.strictEqual(joint.util.isEmpty(1), true);
            assert.strictEqual(joint.util.isEmpty(NaN), true);
            assert.strictEqual(joint.util.isEmpty(/x/), true);
            assert.strictEqual(joint.util.isEmpty(symbol), true);
            assert.strictEqual(joint.util.isEmpty(), true);
        });

        QUnit.test('should return `false` for non-empty values', function(assert) {
            assert.strictEqual(joint.util.isEmpty([0]), false);
            assert.strictEqual(joint.util.isEmpty({ 'a': 0 }), false);
            assert.strictEqual(joint.util.isEmpty('a'), false);
        });

        QUnit.test('should work with an object that has a `length` property', function(assert) {
            assert.strictEqual(joint.util.isEmpty({ 'length': 0 }), false);
        });

        QUnit.test('should work with `arguments` objects', function(assert) {
            assert.strictEqual(joint.util.isEmpty(arguments), false);
        });

        QUnit.test('should work with prototype objects', function(assert) {
            function Foo() {}
            Foo.prototype = { 'constructor': Foo };

            assert.strictEqual(joint.util.isEmpty(Foo.prototype), true);

            Foo.prototype.a = 1;
            assert.strictEqual(joint.util.isEmpty(Foo.prototype), false);
        });

        QUnit.test('should work with jQuery/MooTools DOM query collections', function(assert) {
            function Foo(elements) {
                Array.prototype.push.apply(this, elements);
            }
            Foo.prototype = { 'length': 0, 'splice': Array.prototype.splice };

            assert.strictEqual(joint.util.isEmpty(new Foo([])), true);
        });

        QUnit.test('should work with maps', function(assert) {
            const map = new Map;

            assert.strictEqual(joint.util.isEmpty(map), true);
            map.set('a', 1);
            assert.strictEqual(joint.util.isEmpty(map), false);
            map.clear();
        });

        QUnit.test('should work with sets', function(assert) {
            const set = new Set;

            assert.strictEqual(joint.util.isEmpty(set), true);
            set.add(1);
            assert.strictEqual(joint.util.isEmpty(set), false);
            set.clear();
        });

        QUnit.test('should not treat objects with negative lengths as array-like', function(assert) {
            function Foo() {}
            Foo.prototype.length = -1;

            assert.strictEqual(joint.util.isEmpty(new Foo), true);
        });

        QUnit.test('should not treat objects with lengths larger than `MAX_SAFE_INTEGER` as array-like', function(assert) {
            function Foo() {}
            Foo.prototype.length = Number.MAX_SAFE_INTEGER + 1;

            assert.strictEqual(joint.util.isEmpty(new Foo), true);
        });

        QUnit.test('should not treat objects with non-number lengths as array-like', function(assert) {
            assert.strictEqual(joint.util.isEmpty({ 'length': '0' }), false);
        });
    });

    QUnit.module('isEqual', function() {

        const symbol1 = Symbol('a');
        const symbol2 = Symbol('b');

        QUnit.test('should compare primitives', function(assert) {
            const pairs = [
                [1, 1, true], [1, Object(1), true], [1, '1', false], [1, 2, false],
                [-0, -0, true], [0, 0, true], [0, Object(0), true], [Object(0), Object(0), true], [-0, 0, true], [0, '0', false], [0, null, false],
                [NaN, NaN, true], [NaN, Object(NaN), true], [Object(NaN), Object(NaN), true], [NaN, 'a', false], [NaN, Infinity, false],
                ['a', 'a', true], ['a', Object('a'), true], [Object('a'), Object('a'), true], ['a', 'b', false], ['a', ['a'], false],
                [true, true, true], [true, Object(true), true], [Object(true), Object(true), true], [true, 1, false], [true, 'a', false],
                [false, false, true], [false, Object(false), true], [Object(false), Object(false), true], [false, 0, false], [false, '', false],
                [symbol1, symbol1, true], [symbol1, Object(symbol1), true], [Object(symbol1), Object(symbol1), true], [symbol1, symbol2, false],
                [null, null, true], [null, undefined, false], [null, {}, false], [null, '', false],
                [undefined, undefined, true], [undefined, null, false], [undefined, '', false]
            ];

            const expected = pairs.map((pair) => {
                return pair[2];
            });

            const actual = pairs.map((pair) => {
                return joint.util.isEqual(pair[0], pair[1]);
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should compare arrays', function(assert) {
            let array1 = [true, null, 1, 'a', undefined];
            let array2 = [true, null, 1, 'a', undefined];

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1 = [[1, 2, 3], new Date(2012, 4, 23), /x/, { 'e': 1 }];
            array2 = [[1, 2, 3], new Date(2012, 4, 23), /x/, { 'e': 1 }];

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1 = [1];
            array1[2] = 3;

            array2 = [1];
            array2[1] = undefined;
            array2[2] = 3;

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1 = [Object(1), false, Object('a'), /x/, new Date(2012, 4, 23), ['a', 'b', [Object('c')]], { 'a': 1 }];
            array2 = [1, Object(false), 'a', /x/, new Date(2012, 4, 23), ['a', Object('b'), ['c']], { 'a': 1 }];

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1 = [1, 2, 3];
            array2 = [3, 2, 1];

            assert.strictEqual(joint.util.isEqual(array1, array2), false);

            array1 = [1, 2];
            array2 = [1, 2, 3];

            assert.strictEqual(joint.util.isEqual(array1, array2), false);
        });

        QUnit.test('should treat arrays with identical values but different non-index properties as equal', function(assert) {
            assert.expect(3);

            let array1 = [1, 2, 3];
            let array2 = [1, 2, 3];

            array1.every = array1.filter = array1.forEach =
            array1.indexOf = array1.lastIndexOf = array1.map =
            array1.some = array1.reduce = array1.reduceRight = null;

            array2.concat = array2.join = array2.pop =
            array2.reverse = array2.shift = array2.slice =
            array2.sort = array2.splice = array2.unshift = null;

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1 = [1, 2, 3];
            array1.a = 1;

            array2 = [1, 2, 3];
            array2.b = 1;

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1 = /c/.exec('abcde');
            array2 = ['c'];

            assert.strictEqual(joint.util.isEqual(array1, array2), true);
        });

        QUnit.test('should compare sparse arrays', function(assert) {
            const array = Array(1);

            assert.strictEqual(joint.util.isEqual(array, Array(1)), true);
            assert.strictEqual(joint.util.isEqual(array, [undefined]), true);
            assert.strictEqual(joint.util.isEqual(array, Array(2)), false);
        });

        QUnit.test('should compare plain objects', function(assert) {
            let object1 = { 'a': true, 'b': null, 'c': 1, 'd': 'a', 'e': undefined };
            let object2 = { 'a': true, 'b': null, 'c': 1, 'd': 'a', 'e': undefined };

            assert.strictEqual(joint.util.isEqual(object1, object2), true);

            object1 = { 'a': [1, 2, 3], 'b': new Date(2012, 4, 23), 'c': /x/, 'd': { 'e': 1 }};
            object2 = { 'a': [1, 2, 3], 'b': new Date(2012, 4, 23), 'c': /x/, 'd': { 'e': 1 }};

            assert.strictEqual(joint.util.isEqual(object1, object2), true);

            object1 = { 'a': 1, 'b': 2, 'c': 3 };
            object2 = { 'a': 3, 'b': 2, 'c': 1 };

            assert.strictEqual(joint.util.isEqual(object1, object2), false);

            object1 = { 'a': 1, 'b': 2, 'c': 3 };
            object2 = { 'd': 1, 'e': 2, 'f': 3 };

            assert.strictEqual(joint.util.isEqual(object1, object2), false);

            object1 = { 'a': 1, 'b': 2 };
            object2 = { 'a': 1, 'b': 2, 'c': 3 };

            assert.strictEqual(joint.util.isEqual(object1, object2), false);
        });

        QUnit.test('should compare objects regardless of key order', function(assert) {
            const object1 = { 'a': 1, 'b': 2, 'c': 3 };
            const object2 = { 'c': 3, 'a': 1, 'b': 2 };

            assert.strictEqual(joint.util.isEqual(object1, object2), true);
        });

        QUnit.test('should compare nested objects', function(assert) {
            function noop() {}

            const object1 = {
                'a': [1, 2, 3],
                'b': true,
                'c': Object(1),
                'd': 'a',
                'e': {
                    'f': ['a', Object('b'), 'c'],
                    'g': Object(false),
                    'h': new Date(2012, 4, 23),
                    'i': noop,
                    'j': 'a'
                }
            };

            const object2 = {
                'a': [1, Object(2), 3],
                'b': Object(true),
                'c': 1,
                'd': Object('a'),
                'e': {
                    'f': ['a', 'b', 'c'],
                    'g': false,
                    'h': new Date(2012, 4, 23),
                    'i': noop,
                    'j': 'a'
                }
            };

            assert.strictEqual(joint.util.isEqual(object1, object2), true);
        });

        QUnit.test('should compare object instances', function(assert) {
            function Foo() {
                this.a = 1;
            }
            Foo.prototype.a = 1;

            function Bar() {
                this.a = 1;
            }
            Bar.prototype.a = 2;

            assert.strictEqual(joint.util.isEqual(new Foo, new Foo), true);
            assert.strictEqual(joint.util.isEqual(new Foo, new Bar), false);
            assert.strictEqual(joint.util.isEqual({ 'a': 1 }, new Foo), false);
            assert.strictEqual(joint.util.isEqual({ 'a': 2 }, new Bar), false);
        });

        QUnit.test('should compare objects with constructor properties', function(assert) {
            assert.strictEqual(joint.util.isEqual({ 'constructor': 1 },   { 'constructor': 1 }), true);
            assert.strictEqual(joint.util.isEqual({ 'constructor': 1 },   { 'constructor': '1' }), false);
            assert.strictEqual(joint.util.isEqual({ 'constructor': [1] }, { 'constructor': [1] }), true);
            assert.strictEqual(joint.util.isEqual({ 'constructor': [1] }, { 'constructor': ['1'] }), false);
            assert.strictEqual(joint.util.isEqual({ 'constructor': Object }, {}), false);
        });

        QUnit.test('should compare arrays with circular references', function(assert) {
            let array1 = [];
            let array2 = [];

            array1.push(array1);
            array2.push(array2);

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1.push('b');
            array2.push('b');

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1.push('c');
            array2.push('d');

            assert.strictEqual(joint.util.isEqual(array1, array2), false);

            array1 = ['a', 'b', 'c'];
            array1[1] = array1;
            array2 = ['a', ['a', 'b', 'c'], 'c'];

            assert.strictEqual(joint.util.isEqual(array1, array2), false);

            array1 = [[[]]];
            array1[0][0][0] = array1;
            array2 = [];
            array2[0] = array2;

            assert.strictEqual(joint.util.isEqual(array1, array2), false);
            assert.strictEqual(joint.util.isEqual(array2, array1), false);
        });

        QUnit.test('should compare objects with circular references', function(assert) {
            let object1 = {};
            let object2 = {};

            object1.a = object1;
            object2.a = object2;

            assert.strictEqual(joint.util.isEqual(object1, object2), true);

            object1.b = 0;
            object2.b = Object(0);

            assert.strictEqual(joint.util.isEqual(object1, object2), true);

            object1.c = Object(1);
            object2.c = Object(2);

            assert.strictEqual(joint.util.isEqual(object1, object2), false);

            object1 = { 'a': 1, 'b': 2, 'c': 3 };
            object1.b = object1;
            object2 = { 'a': 1, 'b': { 'a': 1, 'b': 2, 'c': 3 }, 'c': 3 };

            assert.strictEqual(joint.util.isEqual(object1, object2), false);

            object1 = { self: { self: { self: {}}}};
            object1.self.self.self = object1;
            object2 = { self: {}};
            object2.self = object2;

            assert.strictEqual(joint.util.isEqual(object1, object2), false);
            assert.strictEqual(joint.util.isEqual(object2, object1), false);
        });

        QUnit.test('should have transitive equivalence for circular references of objects', function(assert) {
            const object1 = {};
            const object2 = { 'a': object1 };
            const object3 = { 'a': object2 };

            object1.a = object1;

            assert.strictEqual(joint.util.isEqual(object1, object2), true);
            assert.strictEqual(joint.util.isEqual(object2, object3), true);
            assert.strictEqual(joint.util.isEqual(object1, object3), true);
        });

        QUnit.test('should compare objects with multiple circular references', function(assert) {
            const array1 = [{}];
            const array2 = [{}];

            (array1[0].a = array1).push(array1);
            (array2[0].a = array2).push(array2);

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1[0].b = 0;
            array2[0].b = Object(0);

            assert.strictEqual(joint.util.isEqual(array1, array2), true);

            array1[0].c = Object(1);
            array2[0].c = Object(2);

            assert.strictEqual(joint.util.isEqual(array1, array2), false);
        });

        QUnit.test('should compare objects with complex circular references', function(assert) {
            const object1 = {
                'foo': { 'b': { 'c': { 'd': {}}}},
                'bar': { 'a': 2 }
            };

            const object2 = {
                'foo': { 'b': { 'c': { 'd': {}}}},
                'bar': { 'a': 2 }
            };

            object1.foo.b.c.d = object1;
            object1.bar.b = object1.foo.b;

            object2.foo.b.c.d = object2;
            object2.bar.b = object2.foo.b;

            assert.strictEqual(joint.util.isEqual(object1, object2), true);
        });

        QUnit.test('should compare objects with shared property values', function(assert) {
            const object1 = {
                'a': [1, 2]
            };

            const object2 = {
                'a': [1, 2],
                'b': [1, 2]
            };

            object1.b = object1.a;

            assert.strictEqual(joint.util.isEqual(object1, object2), true);
        });

        QUnit.test('should treat objects created by `Object.create(null)` like plain objects', function(assert) {
            function Foo() {
                this.a = 1;
            }
            Foo.prototype.constructor = null;

            const object1 = Object.create(null);
            object1.a = 1;

            const object2 = { 'a': 1 };

            assert.strictEqual(joint.util.isEqual(object1, object2), true);
            assert.strictEqual(joint.util.isEqual(new Foo, object2), false);
        });

        QUnit.test('should avoid common type coercions', function(assert) {
            assert.strictEqual(joint.util.isEqual(true, Object(false)), false);
            assert.strictEqual(joint.util.isEqual(Object(false), Object(0)), false);
            assert.strictEqual(joint.util.isEqual(false, Object('')), false);
            assert.strictEqual(joint.util.isEqual(Object(36), Object('36')), false);
            assert.strictEqual(joint.util.isEqual(0, ''), false);
            assert.strictEqual(joint.util.isEqual(1, true), false);
            assert.strictEqual(joint.util.isEqual(1337756400000, new Date(2012, 4, 23)), false);
            assert.strictEqual(joint.util.isEqual('36', 36), false);
            assert.strictEqual(joint.util.isEqual(36, '36'), false);
        });

        QUnit.test('should compare `arguments` objects', function(assert) {
            const args1 = (function() { return arguments; }());
            const args2 = (function() { return arguments; }());
            const args3 = (function() { return arguments; }(1, 2));

            assert.strictEqual(joint.util.isEqual(args1, args2), true);
            assert.strictEqual(joint.util.isEqual(args1, args3), false);
        });

        QUnit.test('should treat `arguments` objects like `Object` objects', function(assert) {
            const object = { '0': 1, '1': 2, '2': 3 };
            const args = toArgs([1, 2, 3]);

            function Foo() {}
            Foo.prototype = object;

            assert.strictEqual(joint.util.isEqual(args, object), true);
            assert.strictEqual(joint.util.isEqual(object, args), true);
            assert.strictEqual(joint.util.isEqual(args, new Foo), false);
            assert.strictEqual(joint.util.isEqual(new Foo, args), false);
        });

        QUnit.test('should compare array buffers', function(assert) {
            const buffer = new Int8Array([-1]).buffer;

            assert.strictEqual(joint.util.isEqual(buffer, new Uint8Array([255]).buffer), true);
            assert.strictEqual(joint.util.isEqual(buffer, new ArrayBuffer(1)), false);
        });

        QUnit.test('should compare array views', function(assert) {
            [0, 1].forEach((index) => {
                const ns = index ? {} : window;

                const pairs = arrayViews.map((type, viewIndex) => {
                    const otherType = arrayViews[(viewIndex + 1) % arrayViews.length],
                        CtorA = ns[type] || function(n) { this.n = n; },
                        CtorB = ns[otherType] || function(n) { this.n = n; },
                        bufferA = ns[type] ? new ns.ArrayBuffer(8) : 8,
                        bufferB = ns[otherType] ? new ns.ArrayBuffer(8) : 8,
                        bufferC = ns[otherType] ? new ns.ArrayBuffer(16) : 16;

                    return [new CtorA(bufferA), new CtorA(bufferA), new CtorB(bufferB), new CtorB(bufferC)];
                });

                const expected = pairs.map(() => [true, false, false]);

                const actual = pairs.map((pair) => {
                    return [joint.util.isEqual(pair[0], pair[1]), joint.util.isEqual(pair[0], pair[2]), joint.util.isEqual(pair[2], pair[3])];
                });

                assert.deepEqual(actual, expected);
            });
        });

        QUnit.test('should compare date objects', function(assert) {
            const date = new Date(2012, 4, 23);

            assert.strictEqual(joint.util.isEqual(date, new Date(2012, 4, 23)), true);
            assert.strictEqual(joint.util.isEqual(new Date('a'), new Date('b')), true);
            assert.strictEqual(joint.util.isEqual(date, new Date(2013, 3, 25)), false);
            assert.strictEqual(joint.util.isEqual(date, { 'getTime': +date }), false);
        });

        QUnit.test('should compare error objects', function(assert) {
            const pairs = [
                'Error',
                'EvalError',
                'RangeError',
                'ReferenceError',
                'SyntaxError',
                'TypeError',
                'URIError'
            ].map((type, index, errorTypes) => {
                const otherType = errorTypes[++index % errorTypes.length],
                    CtorA = window[type],
                    CtorB = window[otherType];

                return [new CtorA('a'), new CtorA('a'), new CtorB('a'), new CtorB('b')];
            });

            const expected = pairs.map(() => [true, false, false]);

            const actual = pairs.map((pair) =>{
                return [joint.util.isEqual(pair[0], pair[1]), joint.util.isEqual(pair[0], pair[2]), joint.util.isEqual(pair[2], pair[3])];
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should compare functions', function(assert) {
            function a() { return 1 + 2; }
            function b() { return 1 + 2; }

            assert.strictEqual(joint.util.isEqual(a, a), true);
            assert.strictEqual(joint.util.isEqual(a, b), false);
        });

        QUnit.test('should compare maps', function(assert) {
            const map1 = new Map();
            const map2 = new Map();

            map1.set('a', 1);
            map2.set('b', 2);
            assert.strictEqual(joint.util.isEqual(map1, map2), false);

            map1.set('b', 2);
            map2.set('a', 1);
            assert.strictEqual(joint.util.isEqual(map1, map2), true);

            map1.delete('a');
            map1.set('a', 1);
            assert.strictEqual(joint.util.isEqual(map1, map2), true);

            map2.delete('a');
            assert.strictEqual(joint.util.isEqual(map1, map2), false);

            map1.clear();
            map2.clear();
        });

        QUnit.test('should compare maps with circular references', function(assert) {
            const map1 = new Map;
            const map2 = new Map;

            map1.set('a', map1);
            map2.set('a', map2);
            assert.strictEqual(joint.util.isEqual(map1, map2), true);

            map1.set('b', 1);
            map2.set('b', 2);
            assert.strictEqual(joint.util.isEqual(map1, map2), false);
        });

        QUnit.test('should compare promises by reference', function(assert) {
            const promise = Promise.resolve(1);

            assert.strictEqual(joint.util.isEqual(promise, Promise.resolve(1)), false);
        });

        QUnit.test('should compare regexes', function(assert) {
            assert.strictEqual(joint.util.isEqual(/x/gim, /x/gim), true);
            assert.strictEqual(joint.util.isEqual(/x/gim, /x/mgi), true);
            assert.strictEqual(joint.util.isEqual(/x/gi, /x/g), false);
            assert.strictEqual(joint.util.isEqual(/x/, /y/), false);
            assert.strictEqual(joint.util.isEqual(/x/g, { 'global': true, 'ignoreCase': false, 'multiline': false, 'source': 'x' }), false);
        });

        QUnit.test('should compare sets', function(assert) {
            const set1 = new Set();
            const set2 = new Set();

            set1.add(1);
            set2.add(2);
            assert.strictEqual(joint.util.isEqual(set1, set2), false);

            set1.add(2);
            set2.add(1);
            assert.strictEqual(joint.util.isEqual(set1, set2), true);

            set1.delete(1);
            set1.add(1);
            assert.strictEqual(joint.util.isEqual(set1, set2), true);

            set2.delete(1);
            assert.strictEqual(joint.util.isEqual(set1, set2), false);

            set1.clear();
            set2.clear();
        });

        QUnit.test('should compare sets with circular references', function(assert) {
            const set1 = new Set;
            const set2 = new Set;

            set1.add(set1);
            set2.add(set2);
            assert.strictEqual(joint.util.isEqual(set1, set2), true);

            set1.add(1);
            set2.add(2);
            assert.strictEqual(joint.util.isEqual(set1, set2), false);
        });

        QUnit.test('should compare symbol properties', function(assert) {
            const object1 = { 'a': 1 };
            const object2 = { 'a': 1 };

            object1[symbol1] = { 'a': { 'b': 2 }};
            object2[symbol1] = { 'a': { 'b': 2 }};

            Object.defineProperty(object2, symbol2, {
                'configurable': true,
                'enumerable': false,
                'writable': true,
                'value': 2
            });

            assert.strictEqual(joint.util.isEqual(object1, object2), true);

            object2[symbol1] = { 'a': 1 };
            assert.strictEqual(joint.util.isEqual(object1, object2), false);

            delete object2[symbol1];
            object2[Symbol('a')] = { 'a': { 'b': 2 }};
            assert.strictEqual(joint.util.isEqual(object1, object2), false);
        });

        QUnit.test('should not error on DOM elements', function(assert) {
            const element1 = document.createElement('div');
            const element2 = element1.cloneNode(true);

            try {
                assert.strictEqual(joint.util.isEqual(element1, element2), false);
            } catch (e) {
                assert.ok(false, e.message);
            }
        });

        QUnit.test('should return `false` for objects with custom `toString` methods', function(assert) {
            let primitive;
            const object = { 'toString': function() { return primitive; } };
            const values = [true, null, 1, 'a', undefined];
            const expected = values.map(() => false);

            const actual = values.map((value) => {
                primitive = value;
                return joint.util.isEqual(object, value);
            });

            assert.deepEqual(actual, expected);
        });
    });

    QUnit.module('isPlainObject', function() {

        const element = document.createElement('div');

        QUnit.test('should detect plain objects', function(assert) {
            function Foo(a) {
                this.a = 1;
            }

            assert.strictEqual(joint.util.isPlainObject({}), true);
            assert.strictEqual(joint.util.isPlainObject({ 'a': 1 }), true);
            assert.strictEqual(joint.util.isPlainObject({ 'constructor': Foo }), true);
            assert.strictEqual(joint.util.isPlainObject([1, 2, 3]), false);
            assert.strictEqual(joint.util.isPlainObject(new Foo(1)), false);
        });

        QUnit.test('should return `true` for objects with a `[[Prototype]]` of `null`', function(assert) {
            const object = Object.create(null);
            assert.strictEqual(joint.util.isPlainObject(object), true);

            object.constructor = Object.prototype.constructor;
            assert.strictEqual(joint.util.isPlainObject(object), true);
        });

        QUnit.test('should return `true` for objects with a `valueOf` property', function(assert) {
            assert.strictEqual(joint.util.isPlainObject({ 'valueOf': 0 }), true);
        });

        QUnit.test('should return `false` for objects with a custom `[[Prototype]]`', function(assert) {
            const object = Object.create({ 'a': 1 });
            assert.strictEqual(joint.util.isPlainObject(object), false);
        });

        QUnit.test('should return `false` for DOM elements', function(assert) {
            assert.strictEqual(joint.util.isPlainObject(element), false);
        });

        QUnit.test('should return `false` for non-Object objects', function(assert) {
            assert.strictEqual(joint.util.isPlainObject(arguments), false);
            assert.strictEqual(joint.util.isPlainObject(Error), false);
            assert.strictEqual(joint.util.isPlainObject(Math), false);
        });

        QUnit.test('should return `false` for non-objects', function(assert) {
            const expected = falsey.map(() => false);

            const actual = falsey.map((value, index) => {
                return index ? joint.util.isPlainObject(value) : joint.util.isPlainObject();
            });

            assert.deepEqual(actual, expected);

            assert.strictEqual(joint.util.isPlainObject(true), false);
            assert.strictEqual(joint.util.isPlainObject('a'), false);
            assert.strictEqual(joint.util.isPlainObject(symbol), false);
        });

        QUnit.test('should return `false` for objects with a read-only `Symbol.toStringTag` property', function(assert) {
            const object = {};
            Object.defineProperty(object, Symbol.toStringTag, {
                'configurable': true,
                'enumerable': false,
                'writable': false,
                'value': 'X'
            });

            assert.deepEqual(joint.util.isPlainObject(object), false);
        });

        QUnit.test('should not mutate `value`', function(assert) {
            const proto = {};
            proto[Symbol.toStringTag] = undefined;
            const object = Object.create(proto);

            assert.strictEqual(joint.util.isPlainObject(object), false);
            assert.notOk(object[Symbol.toStringTag]);
        });
    });

    QUnit.module('toArray', function() {

        QUnit.test('should convert objects to arrays', function(assert) {
            assert.deepEqual(joint.util.toArray({ 'a': 1, 'b': 2 }), [1, 2]);
        });

        QUnit.test('should convert iterables to arrays', function(assert) {
            const object = { '0': 'a', 'length': 1 };
            object[Symbol.iterator] = Array.prototype[Symbol.iterator];

            assert.deepEqual(joint.util.toArray(object), ['a']);
        });

        QUnit.test('should convert maps to arrays', function(assert) {
            const map = new Map();
            map.set('a', 1);
            map.set('b', 2);
            assert.deepEqual(joint.util.toArray(map), [['a', 1], ['b', 2]]);
        });

        QUnit.test('should convert strings to arrays', function(assert) {
            assert.deepEqual(joint.util.toArray(''), []);
            assert.deepEqual(joint.util.toArray('ab'), ['a', 'b']);
            assert.deepEqual(joint.util.toArray(Object('ab')), ['a', 'b']);
        });
    });

    QUnit.module('debounce', function() {

        QUnit.test('should debounce a function', function(assert) {
            const done = assert.async();

            let callCount = 0;

            const debounced = joint.util.debounce(function(value) {
                ++callCount;
                return value;
            }, 32);

            const results = [debounced('a'), debounced('b'), debounced('c')];
            assert.deepEqual(results, [undefined, undefined, undefined]);
            assert.strictEqual(callCount, 0);

            setTimeout(function() {
                assert.strictEqual(callCount, 1);

                const results = [debounced('d'), debounced('e'), debounced('f')];
                assert.deepEqual(results, ['c', 'c', 'c']);
                assert.strictEqual(callCount, 1);
            }, 128);

            setTimeout(function() {
                assert.strictEqual(callCount, 2);
                done();
            }, 256);
        });

        QUnit.test('subsequent debounced calls return the last `func` result', function(assert) {
            const done = assert.async();

            const debounced = joint.util.debounce((val) => val, 32);
            debounced('a');

            setTimeout(function() {
                assert.notEqual(debounced('b'), 'b');
            }, 64);

            setTimeout(function() {
                assert.notEqual(debounced('c'), 'c');
                done();
            }, 128);
        });

        QUnit.test('should not immediately call `func` when `wait` is `0`', function(assert) {
            const done = assert.async();

            let callCount = 0;
            const debounced = joint.util.debounce(function() { ++callCount; }, 0);

            debounced();
            debounced();
            assert.strictEqual(callCount, 0);

            setTimeout(function() {
                assert.strictEqual(callCount, 1);
                done();
            }, 5);
        });

        QUnit.test('should apply default options', function(assert) {
            const done = assert.async();

            let callCount = 0;
            const debounced = joint.util.debounce(function() { callCount++; }, 32, {});

            debounced();
            assert.strictEqual(callCount, 0);

            setTimeout(function() {
                assert.strictEqual(callCount, 1);
                done();
            }, 64);
        });

        QUnit.test('should support a `leading` option', function(assert) {
            const done = assert.async();

            const callCounts = [0, 0];

            const withLeading = joint.util.debounce(function() {
                callCounts[0]++;
            }, 32, { 'leading': true });

            const withLeadingAndTrailing = joint.util.debounce(function() {
                callCounts[1]++;
            }, 32, { 'leading': true });

            withLeading();
            assert.strictEqual(callCounts[0], 1);

            withLeadingAndTrailing();
            withLeadingAndTrailing();
            assert.strictEqual(callCounts[1], 1);

            setTimeout(function() {
                assert.deepEqual(callCounts, [1, 2]);

                withLeading();
                assert.strictEqual(callCounts[0], 2);

                done();
            }, 64);
        });

        QUnit.test('subsequent leading debounced calls return the last `func` result', function(assert) {
            const done = assert.async();

            const debounced = joint.util.debounce(((val) => val), 32, { 'leading': true, 'trailing': false });
            const results = [debounced('a'), debounced('b')];

            assert.deepEqual(results, ['a', 'a']);

            setTimeout(function() {
                const results = [debounced('c'), debounced('d')];
                assert.deepEqual(results, ['c', 'c']);
                done();
            }, 64);
        });

        QUnit.test('should support a `trailing` option', function(assert) {
            const done = assert.async();

            let withCount = 0;
            let withoutCount = 0;

            const withTrailing = joint.util.debounce(function() {
                withCount++;
            }, 32, { 'trailing': true });

            const withoutTrailing = joint.util.debounce(function() {
                withoutCount++;
            }, 32, { 'trailing': false });

            withTrailing();
            assert.strictEqual(withCount, 0);

            withoutTrailing();
            assert.strictEqual(withoutCount, 0);

            setTimeout(function() {
                assert.strictEqual(withCount, 1);
                assert.strictEqual(withoutCount, 0);
                done();
            }, 64);
        });

        QUnit.test('should support a `maxWait` option', function(assert) {
            const done = assert.async();

            let callCount = 0;

            const debounced = joint.util.debounce(function(value) {
                ++callCount;
                return value;
            }, 32, { 'maxWait': 64 });

            debounced();
            debounced();
            assert.strictEqual(callCount, 0);

            setTimeout(function() {
                assert.strictEqual(callCount, 1);
                debounced();
                debounced();
                assert.strictEqual(callCount, 1);
            }, 128);

            setTimeout(function() {
                assert.strictEqual(callCount, 2);
                done();
            }, 256);
        });

        QUnit.test('should support `maxWait` in a tight loop', function(assert) {
            const done = assert.async();

            const limit = 320;
            let withCount = 0;
            let withoutCount = 0;

            const withMaxWait = joint.util.debounce(function() {
                withCount++;
            }, 64, { 'maxWait': 128 });

            const withoutMaxWait = joint.util.debounce(function() {
                withoutCount++;
            }, 96);

            const start = +new Date;
            while ((new Date - start) < limit) {
                withMaxWait();
                withoutMaxWait();
            }
            const actual = [Boolean(withoutCount), Boolean(withCount)];
            setTimeout(function() {
                assert.deepEqual(actual, [false, true]);
                done();
            }, 1);
        });

        QUnit.test('should queue a trailing call for subsequent debounced calls after `maxWait`', function(assert) {
            const done = assert.async();

            let callCount = 0;

            const debounced = joint.util.debounce(function() {
                ++callCount;
            }, 200, { 'maxWait': 200 });

            debounced();

            setTimeout(debounced, 190);
            setTimeout(debounced, 200);
            setTimeout(debounced, 210);

            setTimeout(function() {
                assert.strictEqual(callCount, 2);
                done();
            }, 500);
        });

        QUnit.test('should cancel `maxDelayed` when `delayed` is invoked', function(assert) {
            const done = assert.async();

            let callCount = 0;

            const debounced = joint.util.debounce(function() {
                callCount++;
            }, 32, { 'maxWait': 64 });

            debounced();

            setTimeout(function() {
                debounced();
                assert.strictEqual(callCount, 1);
            }, 128);

            setTimeout(function() {
                assert.strictEqual(callCount, 2);
                done();
            }, 192);
        });

        QUnit.test('should invoke the trailing call with the correct arguments and `this` binding', function(assert) {
            const done = assert.async();

            let actual;
            let callCount = 0;
            let object = {};

            const debounced = joint.util.debounce(function(value) {
                actual = [this];
                Array.prototype.push.apply(actual, arguments);
                return ++callCount != 2;
            }, 32, { 'leading': true, 'maxWait': 64 });

            while (true) {
                if (!debounced.call(object, 'a')) {
                    break;
                }
            }
            setTimeout(function() {
                assert.strictEqual(callCount, 2);
                assert.deepEqual(actual, [object, 'a']);
                done();
            }, 64);
        });
    });

    QUnit.module('groupBy', function() {

        const array = [6.1, 4.2, 6.3];

        QUnit.test('should transform keys by `iteratee`', function(assert) {
            const actual = joint.util.groupBy(array, Math.floor);
            assert.deepEqual(actual, { '4': [4.2], '6': [6.1, 6.3] });
        });

        QUnit.test('should use `identity function` when `iteratee` is nullish', function(assert) {
            const array = [6, 4, 6];
            const values = [null, undefined];
            const expected = values.map(() => ({ '4': [4], '6':  [6, 6] }));

            const actual = values.map((value, index) => {
                return index ? joint.util.groupBy(array, value) : joint.util.groupBy(array);
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should work with `property` shorthands', function(assert) {
            const actual = joint.util.groupBy(['one', 'two', 'three'], 'length');
            assert.deepEqual(actual, { '3': ['one', 'two'], '5': ['three'] });
        });

        QUnit.test('should only add values to own, not inherited, properties', function(assert) {
            const actual = joint.util.groupBy(array, function(n) {
                return Math.floor(n) > 4 ? 'hasOwnProperty' : 'constructor';
            });

            assert.deepEqual(actual.constructor, [4.2]);
            assert.deepEqual(actual.hasOwnProperty, [6.1, 6.3]);
        });

        QUnit.test('should work with a number for `iteratee`', function(assert) {
            const array = [
                [1, 'a'],
                [2, 'a'],
                [2, 'b']
            ];

            assert.deepEqual(joint.util.groupBy(array, 0), { '1': [[1, 'a']], '2': [[2, 'a'], [2, 'b']] });
            assert.deepEqual(joint.util.groupBy(array, 1), { 'a': [[1, 'a'], [2, 'a']], 'b': [[2, 'b']] });
        });

        QUnit.test('should work with an object for `collection`', function(assert) {
            const actual = joint.util.groupBy({ 'a': 6.1, 'b': 4.2, 'c': 6.3 }, Math.floor);
            assert.deepEqual(actual, { '4': [4.2], '6': [6.1, 6.3] });
        });
    });

    QUnit.module('sortBy', function() {

        const objects = [
            { 'a': 'x', 'b': 3 },
            { 'a': 'y', 'b': 4 },
            { 'a': 'x', 'b': 1 },
            { 'a': 'y', 'b': 2 }
        ];

        QUnit.test('should sort in ascending order by `iteratee`', function(assert) {
            assert.expect(1);

            const actual = joint.util.sortBy(objects, function(object) {
                return object.b;
            }).map((o) => (o.b));

            assert.deepEqual(actual, [1, 2, 3, 4]);
        });

        QUnit.test('should use `identity function` when `iteratee` is nullish', function(assert) {
            const array = [3, 2, 1],
                values = [null, undefined],
                expected = values.map(() => [1, 2, 3]);

            const actual = values.map((value, index) => {
                return index ? joint.util.sortBy(array, value) : joint.util.sortBy(array);
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should work with `property` shorthands', function(assert) {
            const actual = joint.util.sortBy(objects.concat(undefined), 'b').map((o) => (o ? o.b : undefined));
            assert.deepEqual(actual, [1, 2, 3, 4, undefined]);
        });

        QUnit.test('should work with an object for `collection`', function(assert) {
            const actual = joint.util.sortBy({ 'a': 1, 'b': 2, 'c': 3 }, Math.sin);
            assert.deepEqual(actual, [3, 1, 2]);
        });

        QUnit.test('should move `NaN`, nullish, and symbol values to the end', function(assert) {
            const symbol1 = Symbol ? Symbol('a') : null;
            const symbol2 = Symbol ? Symbol('b') : null;
            let array = [NaN, undefined, null, 4, symbol1, null, 1, symbol2, undefined, 3, NaN, 2];
            let expected = [1, 2, 3, 4, symbol1, symbol2, null, null, undefined, undefined, NaN, NaN];

            assert.deepEqual(joint.util.sortBy(array), expected);

            array = [NaN, undefined, symbol1, null, 'd', null, 'a', symbol2, undefined, 'c', NaN, 'b'];
            expected = ['a', 'b', 'c', 'd', symbol1, symbol2, null, null, undefined, undefined, NaN, NaN];

            assert.deepEqual(joint.util.sortBy(array), expected);
        });

        QUnit.test('should treat number values for `collection` as empty', function(assert) {
            assert.deepEqual(joint.util.sortBy(1), []);
        });

        QUnit.test('should coerce arrays returned from `iteratee`', function(assert) {
            const actual = joint.util.sortBy(objects, function(object) {
                const result = [object.a, object.b];
                result.toString = function() { return String(this[0]); };
                return result;
            });

            assert.deepEqual(actual, [objects[0], objects[2], objects[1], objects[3]]);
        });
    });

    QUnit.module('flattenDeep', function() {

        const array = [1, [2, [3, [4]], 5]];

        QUnit.test('should treat sparse arrays as dense', function(assert) {
            const array = [[1, 2, 3], Array(3)];
            const expected = [1, 2, 3];

            expected.push(undefined, undefined, undefined);

            const actual = joint.util.flattenDeep(array);
            assert.deepEqual(actual, expected);
            assert.ok('4' in actual);
        });

        QUnit.test('should flatten objects with a truthy `Symbol.isConcatSpreadable` value', function(assert) {
            const object = { '0': 'a', 'length': 1 };
            const array = [object];
            const expected = ['a'];

            object[Symbol.isConcatSpreadable] = true;

            const actual = joint.util.flattenDeep(array);

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should work with extremely large arrays', function(assert) {
            const expected = Array(5e5);

            try {
                assert.deepEqual(joint.util.flattenDeep([expected]), expected);
            } catch (e) {
                assert.ok(false, e.message);
            }
        });

        QUnit.test('should work with empty arrays', function(assert) {
            const array = [[], [[]], [[], [[[]]]]];

            assert.deepEqual(joint.util.flattenDeep(array), []);
        });

        QUnit.test('should support flattening of nested arrays', function(assert) {
            assert.deepEqual(joint.util.flattenDeep(array), [1, 2, 3, 4, 5]);
        });

        QUnit.test('should return an empty array for non array-like objects', function(assert) {
            const expected = [];
            const nonArray = { '0': 'a' };

            assert.deepEqual(joint.util.flattenDeep(nonArray), expected);
        });
    });

    QUnit.module('without', function() {

        QUnit.test('should return the difference of values', function(assert) {
            const actual = joint.util.without([2, 1, 2, 3], 1, 2);
            assert.deepEqual(actual, [3]);
        });

        QUnit.test('should use strict equality to determine the values to reject', function(assert) {
            const object1 = { 'a': 1 };
            const object2 = { 'b': 2 };
            const array = [object1, object2];

            assert.deepEqual(joint.util.without(array, { 'a': 1 }), array);
            assert.deepEqual(joint.util.without(array, object1), [object2]);
        });

        QUnit.test('should remove all occurrences of each value from an array', function(assert) {
            const array = [1, 2, 3, 1, 2, 3];
            assert.deepEqual(joint.util.without(array, 1, 2), [3, 3]);
        });
    });

    QUnit.module('difference', function() {

        QUnit.test('should return the difference of values', function(assert) {
            const expected = [1];
            const actual = joint.util.difference([2, 1], [2, 3]);

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should return the difference of multiple values', function(assert) {
            const expected = [5];
            const actual = joint.util.difference([2, 1, 5], [2, 3], [2, 1], [8]);

            assert.deepEqual(actual, expected);
        });
    });

    QUnit.module('intersection', function() {

        QUnit.test('should return the intersection of values', function(assert) {
            const expected = [2];
            const actual = joint.util.intersection([2, 1], [2, 3]);

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should return the intersection of multiple values', function(assert) {
            const expected = [2, 1];
            const actual = joint.util.intersection([2, 1, 5], [2, 1, 3], [2, 1], [8, 1, 2]);

            assert.deepEqual(actual, expected);
        });
    });

    QUnit.module('union', function() {

        QUnit.test('should return the union of values', function(assert) {
            const expected = [2, 1, 3];
            const actual = joint.util.union([2, 1], [2, 3]);

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should return the union of multiple values', function(assert) {
            const expected = [2, 1, 5, 3, 8];
            const actual = joint.util.union([2, 1, 5], [2, 1, 3], [2, 1], [8, 1, 2]);

            assert.deepEqual(actual, expected);
        });
    });

    QUnit.module('has', function() {

        QUnit.test('should return `true` for own string keyed properties', function(assert) {
            assert.ok(joint.util.has({ 'a': 1 }, 'a'));
        });

        QUnit.test('should accept path as string separated by dots', function(assert) {
            assert.ok(joint.util.has({ 'a': { 'b': 1 }}, 'a.b'));
        });
    });

    QUnit.module('result', function() {

        const object = { 'a': 1, 'b': () => 'b' };

        QUnit.test('should invoke function values', function(assert) {
            assert.strictEqual(joint.util.result(object, 'b'), 'b');
        });

        QUnit.test('should invoke default function values', function(assert) {
            const actual = joint.util.result(object, 'c', object.b);
            assert.strictEqual(actual, 'b');
        });

        QUnit.test('should invoke nested function values', function(assert) {
            const value = { 'a': { 'b': () => 'b' }};

            ['a.b', ['a', 'b']].forEach((path) => {
                assert.strictEqual(joint.util.result(value, path), 'b');
            });
        });

        QUnit.test('should invoke deep property methods with the correct `this` binding', function(assert) {
            const value = { 'a': { 'b': function() { return this.c; }, 'c': 1 }};

            ['a.b', ['a', 'b']].forEach((path) => {
                assert.strictEqual(joint.util.result(value, path), 1);
            });
        });
    });

    QUnit.module('omit', function(assert) {

        const object = { 'a': 1, 'b': 2, 'c': 3, 'd': 4 };
        const nested = { 'a': 1, 'b': { 'c': 2, 'd': 3 }};

        QUnit.test('should flatten `paths`', function(assert) {
            assert.deepEqual(joint.util.omit(object, 'a', 'c'), { 'b': 2, 'd': 4 });
            assert.deepEqual(joint.util.omit(object, ['a', 'd'], 'c'), { 'b': 2 });
        });

        QUnit.test('should support deep paths', function(assert) {
            assert.deepEqual(joint.util.omit(nested, 'b.c'), { 'a': 1, 'b': { 'd': 3 }});
        });

        QUnit.test('should support path arrays', function(assert) {
            assert.expect(1);

            const object = { 'a.b': 1, 'a': { 'b': 2 }};
            const actual = joint.util.omit(object, [['a.b']]);

            assert.deepEqual(actual, { 'a': { 'b': 2 }});
        });

        QUnit.test('should omit a key over a path', function(assert) {
            const object = { 'a.b': 1, 'a': { 'b': 2 }};

            ['a.b', ['a.b']].forEach((path) => {
                assert.deepEqual(joint.util.omit(object, path), { 'a': { 'b': 2 }});
            });
        });

        QUnit.test('should coerce `paths` to strings', function(assert) {
            assert.deepEqual(joint.util.omit({ '0': 'a' }, 0), {});
        });

        QUnit.test('should return an empty object when `object` is nullish', function(assert) {
            [null, undefined].forEach((value) => {
                Object.prototype.a = 1;
                const actual = joint.util.omit(value, 'valueOf');
                delete Object.prototype.a;
                assert.deepEqual(actual, {});
            });
        });

        QUnit.test('should work with a primitive `object`', function(assert) {
            String.prototype.a = 1;
            String.prototype.b = 2;

            assert.deepEqual(joint.util.omit('', 'b'), { 'a': 1 });

            delete String.prototype.a;
            delete String.prototype.b;
        });
    });

    QUnit.module('pick', function() {

        const object = { 'a': 1, 'b': 2, 'c': 3, 'd': 4 };
        const nested = { 'a': 1, 'b': { 'c': 2, 'd': 3 }};

        QUnit.test('should flatten `paths`', function(assert) {
            assert.deepEqual(joint.util.pick(object, 'a', 'c'), { 'a': 1, 'c': 3 });
            assert.deepEqual(joint.util.pick(object, ['a', 'd'], 'c'), { 'a': 1, 'c': 3, 'd': 4 });
        });

        QUnit.test('should support deep paths', function(assert) {
            assert.deepEqual(joint.util.pick(nested, 'b.c'), { 'b': { 'c': 2 }});
        });

        QUnit.test('should support path arrays', function(assert) {
            const object = { 'a.b': 1, 'a': { 'b': 2 }};
            const actual = joint.util.pick(object, [['a.b']]);

            assert.deepEqual(actual, { 'a.b': 1 });
        });

        QUnit.test('should pick a key over a path', function(assert) {
            const object = { 'a.b': 1, 'a': { 'b': 2 }};

            ['a.b', ['a.b']].forEach((path) => {
                assert.deepEqual(joint.util.pick(object, path), { 'a.b': 1 });
            });
        });

        QUnit.test('should coerce `paths` to strings', function(assert) {
            assert.deepEqual(joint.util.pick({ '0': 'a', '1': 'b' }, 0), { '0': 'a' });
        });

        QUnit.test('should return an empty object when `object` is nullish', function(assert) {
            [null, undefined].forEach((value) => {
                assert.deepEqual(joint.util.pick(value, 'valueOf'), {});
            });
        });

        QUnit.test('should work with a primitive `object`', function(assert) {
            assert.deepEqual(joint.util.pick('', 'slice'), { 'slice': ''.slice });
        });
    });

    QUnit.module('bindAll', function() {

        const source = {
            '_n0': -2,
            '_p0': -1,
            '_a': 1,
            '_b': 2,
            '_c': 3,
            '_d': 4,
            '-0': function() { return this._n0; },
            '0': function() { return this._p0; },
            'a': function() { return this._a; },
            'b': function() { return this._b; },
            'c': function() { return this._c; },
            'd': function() { return this._d; }
        };

        QUnit.test('should accept individual method names', function(assert) {
            const object = joint.util.cloneDeep(source);
            joint.util.bindAll(object, 'a', 'b');

            const actual = ['a', 'b', 'c'].map((key) => {
                return object[key].call({});
            });

            assert.deepEqual(actual, [1, 2, undefined]);
        });

        QUnit.test('should accept arrays of method names', function(assert) {
            const object = joint.util.cloneDeep(source);
            joint.util.bindAll(object, ['a', 'b'], ['c']);

            const actual = ['a', 'b', 'c', 'd'].map((key) => {
                return object[key].call({});
            });

            assert.deepEqual(actual, [1, 2, 3, undefined]);
        });

        QUnit.test('should work with an array `object`', function(assert) {
            const array = ['push', 'pop'];
            joint.util.bindAll(array);
            assert.strictEqual(array.pop, Array.prototype.pop);
        });
    });

    QUnit.module('forIn', function() {

        QUnit.test('iterates over inherited string keyed properties', function(assert) {
            function Foo() {
                this.a = 1;
            }
            Foo.prototype.b = 2;

            const keys = [];
            joint.util.forIn(new Foo, function(value, key) { keys.push(key); });
            assert.deepEqual(keys.sort(), ['a', 'b']);
        });

        QUnit.test('should provide correct `key` arguments', function(assert) {
            const args = [];
            joint.util.forIn({ 'a': 1, 'b': 2 }, function(value, key) { args.push(key); });
            assert.deepEqual(args, ['a', 'b']);
        });

        QUnit.test('should provide correct `key` arguments for arrays', function(assert) {
            const args = [];
            joint.util.forIn([1, 2], function(value, key) { args.push(key); });
            assert.deepEqual(args, ['0', '1']);
        });
    });

    QUnit.module('camelCase', function() {

        QUnit.test('should work with numbers', function(assert) {
            assert.strictEqual(joint.util.camelCase('12 feet'), '12Feet');
            assert.strictEqual(joint.util.camelCase('enable 6h format'), 'enable6HFormat');
            assert.strictEqual(joint.util.camelCase('enable 24H format'), 'enable24HFormat');
            assert.strictEqual(joint.util.camelCase('too legit 2 quit'), 'tooLegit2Quit');
            assert.strictEqual(joint.util.camelCase('walk 500 miles'), 'walk500Miles');
            assert.strictEqual(joint.util.camelCase('xhr2 request'), 'xhr2Request');
        });

        QUnit.test('should handle acronyms', function(assert) {

            ['safe HTML', 'safeHTML'].forEach((string) => {
                assert.strictEqual(joint.util.camelCase(string), 'safeHtml');
            });

            ['escape HTML entities', 'escapeHTMLEntities'].forEach((string) => {
                assert.strictEqual(joint.util.camelCase(string), 'escapeHtmlEntities');
            });

            ['XMLHttpRequest', 'XmlHTTPRequest'].forEach((string) => {
                assert.strictEqual(joint.util.camelCase(string), 'xmlHttpRequest');
            });
        });
    });

    QUnit.module('uniqueId', function() {

        QUnit.test('should generate unique ids', function(assert) {
            const actual = [];

            for (let i = 0; i < 1000; i++) {
                actual.push(joint.util.uniqueId());
            }

            assert.strictEqual(new Set(actual).size, actual.length);
        });

        QUnit.test('should return a string value when not providing a `prefix`', function(assert) {
            assert.strictEqual(typeof joint.util.uniqueId(), 'string');
        });

        QUnit.test('should coerce the prefix argument to a string', function(assert) {
            const actual = [joint.util.uniqueId(3), joint.util.uniqueId(2), joint.util.uniqueId(1)];
            assert.ok(/3\d+,2\d+,1\d+/.test(actual));
        });
    });

    QUnit.module('merge', function() {

        QUnit.test('should merge `source` into `object`', function(assert) {
            const names = {
                'characters': [
                    { 'name': 'barney' },
                    { 'name': 'fred' }
                ]
            };

            const ages = {
                'characters': [
                    { 'age': 36 },
                    { 'age': 40 }
                ]
            };

            const heights = {
                'characters': [
                    { 'height': '5\'4"' },
                    { 'height': '5\'5"' }
                ]
            };

            const expected = {
                'characters': [
                    { 'name': 'barney', 'age': 36, 'height': '5\'4"' },
                    { 'name': 'fred', 'age': 40, 'height': '5\'5"' }
                ]
            };

            assert.deepEqual(joint.util.merge(names, ages, heights), expected);
        });

        QUnit.test('should merge sources containing circular references', function(assert) {
            const object = {
                'foo': { 'a': 1 },
                'bar': { 'a': 2 }
            };

            const source = {
                'foo': { 'b': { 'c': { 'd': {}}}},
                'bar': {}
            };

            source.foo.b.c.d = source;
            source.bar.b = source.foo.b;

            const actual = joint.util.merge(object, source);

            assert.notStrictEqual(actual.bar.b, actual.foo.b);
            assert.strictEqual(actual.foo.b.c.d, actual.foo.b.c.d.foo.b.c.d);
        });

        QUnit.test('should work with four arguments', function(assert) {
            assert.expect(1);

            const expected = { 'a': 4 };
            const actual = joint.util.merge({ 'a': 1 }, { 'a': 2 }, { 'a': 3 }, expected);

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should merge onto function `object` values', function(assert) {
            function Foo() {}

            const source = { 'a': 1 };
            const actual = joint.util.merge(Foo, source);

            assert.strictEqual(actual, Foo);
            assert.strictEqual(Foo.a, 1);
        });

        QUnit.test('should merge first source object properties to function', function(assert) {
            const fn = function() {};
            const object = { 'prop': {}};
            const actual = joint.util.merge({ 'prop': fn }, object);

            assert.deepEqual(actual, object);
        });

        QUnit.test('should merge first and second source object properties to function', function(assert) {
            const fn = function() {};
            const object = { 'prop': {}};
            const actual = joint.util.merge({ 'prop': fn }, { 'prop': fn }, object);

            assert.deepEqual(actual, object);
        });

        QUnit.test('should not merge onto function values of sources', function(assert) {
            const source1 = { 'a': function() {} };
            const source2 = { 'a': { 'b': 2 }};
            const expected = { 'a': { 'b': 2 }};
            let actual = joint.util.merge({}, source1, source2);

            assert.deepEqual(actual, expected);
            assert.notOk('b' in source1.a);

            actual = joint.util.merge(source1, source2);
            assert.deepEqual(actual, expected);
        });

        QUnit.test('should merge onto non-plain `object` values', function(assert) {
            function Foo() {}

            const object = new Foo;
            const actual = joint.util.merge(object, { 'a': 1 });

            assert.strictEqual(actual, object);
            assert.strictEqual(object.a, 1);
        });

        QUnit.test('should treat sparse array sources as dense', function(assert) {
            let array = [1];
            array[2] = 3;

            const actual = joint.util.merge([], array);
            const expected = array.slice();

            expected[1] = undefined;

            assert.ok('1' in actual);
            assert.deepEqual(actual, expected);
        });

        QUnit.test('should merge `arguments` objects', function(assert) {
            const args = toArgs([1, 2, 3]);
            const object1 = { 'value': args };
            const object2 = { 'value': { '3': 4 }};
            let expected = { '0': 1, '1': 2, '2': 3, '3': 4 };
            let actual = joint.util.merge(object1, object2);

            assert.notOk('3' in args);
            assert.deepEqual(actual.value, expected);
            object1.value = args;

            actual = joint.util.merge(object2, object1);
            assert.deepEqual(actual.value, expected);

            expected = { '0': 1, '1': 2, '2': 3 };

            actual = joint.util.merge({}, object1);
            assert.deepEqual(actual.value, expected);
        });

        QUnit.test('should assign `null` values', function(assert) {
            const actual = joint.util.merge({ 'a': 1 }, { 'a': null });
            assert.strictEqual(actual.a, null);
        });

        QUnit.test('should assign non array/buffer/typed-array/plain-object source values directly', function(assert) {
            function Foo() {}

            const values = [new Foo, new Boolean, new Date, Foo, new Number, new String, new RegExp];
            const expected = values.map(() => true);

            const actual = values.map((value) => {
                const object = joint.util.merge({}, { 'a': value, 'b': { 'c': value }});
                return object.a === value && object.b.c === value;
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should deep clone array/typed-array/plain-object source values', function(assert) {
            const typedArray = Uint8Array
                ? new Uint8Array([1])
                : { 'buffer': [1] };

            const props = ['0', 'buffer', 'a'],
                values = [[{ 'a': 1 }], typedArray, { 'a': [1] }],
                expected = values.map(() => true);

            const actual = values.map((value, index) => {
                const key = props[index],
                    object = joint.util.merge({}, { 'value': value }),
                    subValue = value[key],
                    newValue = object.value,
                    newSubValue = newValue[key];

                return (
                    newValue !== value &&
                    newSubValue !== subValue &&
                    joint.util.isEqual(newValue, value)
                );
            });

            assert.deepEqual(actual, expected);
        });

        QUnit.test('should not augment source objects', function(assert) {
            let source1 = { 'a': [{ 'a': 1 }] };
            let source2 = { 'a': [{ 'b': 2 }] };
            let actual = joint.util.merge({}, source1, source2);

            assert.deepEqual(source1.a, [{ 'a': 1 }]);
            assert.deepEqual(source2.a, [{ 'b': 2 }]);
            assert.deepEqual(actual.a, [{ 'a': 1, 'b': 2 }]);

            source1 = { 'a': [[1, 2, 3]] };
            source2 = { 'a': [[3, 4]] };
            actual = joint.util.merge({}, source1, source2);

            assert.deepEqual(source1.a, [[1, 2, 3]]);
            assert.deepEqual(source2.a, [[3, 4]]);
            assert.deepEqual(actual.a, [[3, 4, 3]]);
        });

        QUnit.test('should merge plain objects onto non-plain objects', function(assert) {
            assert.expect(4);

            function Foo(object) {
                joint.util.assign(this, object);
            }

            const object = { 'a': 1 };
            let actual = joint.util.merge(new Foo, object);

            assert.ok(actual instanceof Foo);
            assert.deepEqual(actual, new Foo(object));

            actual = joint.util.merge([new Foo], [object]);
            assert.ok(actual[0] instanceof Foo);
            assert.deepEqual(actual, [new Foo(object)]);
        });

        QUnit.test('should not overwrite existing values with `undefined` values of object sources', function(assert) {
            const actual = joint.util.merge({ 'a': 1 }, { 'a': undefined, 'b': undefined });
            assert.deepEqual(actual, { 'a': 1, 'b': undefined });
        });

        QUnit.test('should not overwrite existing values with `undefined` values of array sources', function(assert) {
            let array = [1];
            array[2] = 3;

            let actual = joint.util.merge([4, 5, 6], array);
            const expected = [1, 5, 3];

            assert.deepEqual(actual, expected);

            // eslint-disable-next-line no-sparse-arrays
            array = [1, , 3];
            array[1] = undefined;

            actual = joint.util.merge([4, 5, 6], array);
            assert.deepEqual(actual, expected);
        });

        QUnit.test('should skip merging when `object` and `source` are the same value', function(assert) {
            const object = {};
            let pass = true;

            Object.defineProperty(object, 'a', {
                'configurable': true,
                'enumerable': true,
                'get': function() { return pass; },
                'set': function() { pass = false; }
            });

            joint.util.merge(object, object);
            assert.ok(pass);
        });

        QUnit.test('should convert values to arrays when merging arrays of `source`', function(assert) {
            const object = { 'a': { '1': 'y', 'b': 'z', 'length': 2 }};
            let actual = joint.util.merge(object, { 'a': ['x'] });

            assert.deepEqual(actual, { 'a': ['x', 'y'] });

            actual = joint.util.merge({ 'a': {}}, { 'a': [] });
            assert.deepEqual(actual, { 'a': [] });
        });

        QUnit.test('should not convert strings to arrays when merging arrays of `source`', function(assert) {
            const object = { 'a': 'abcde' };
            const actual = joint.util.merge(object, { 'a': ['x', 'y', 'z'] });

            assert.deepEqual(actual, { 'a': ['x', 'y', 'z'] });
        });

        QUnit.test('should not error on DOM elements', function(assert) {
            const object1 = { 'el': document && document.createElement('div') };
            const object2 = { 'el': document && document.createElement('div') };
            const pairs = [[{}, object1], [object1, object2]];
            const expected = pairs.map(() => true);

            const actual = pairs.map((pair) => {
                try {
                    return joint.util.merge(pair[0], pair[1]).el === pair[1].el;
                } catch (e) {
                    throw new Error('Should not error on DOM elements.');
                }
            });

            assert.deepEqual(actual, expected);
        });
    });

    QUnit.module('merge with customizer (mergeWith)', function() {

        QUnit.test('should handle merging when `customizer` returns `undefined`', function(assert) {
            let actual = joint.util.merge({ 'a': { 'b': [1, 1] }}, { 'a': { 'b': [0] }}, () => {});
            assert.deepEqual(actual, { 'a': { 'b': [0, 1] }});

            actual = joint.util.merge([], [undefined], (val) => val);
            assert.deepEqual(actual, [undefined]);
        });

        QUnit.test('should clone sources when `customizer` returns `undefined`', function(assert) {
            const source1 = { 'a': { 'b': { 'c': 1 }}};
            const source2 = { 'a': { 'b': { 'd': 2 }}};

            joint.util.merge({}, source1, source2, () => {});
            assert.deepEqual(source1.a.b, { 'c': 1 });
        });

        QUnit.test('should defer to `customizer` for non `undefined` results', function(assert) {
            const actual = joint.util.merge({ 'a': { 'b': [0, 1] }}, { 'a': { 'b': [2] }}, function(a, b) {
                return Array.isArray(a) ? a.concat(b) : undefined;
            });

            assert.deepEqual(actual, { 'a': { 'b': [0, 1, 2] }});
        });

        QUnit.test('should overwrite primitives with source object clones', function(assert) {
            const actual = joint.util.merge({ 'a': 0 }, { 'a': { 'b': ['c'] }}, function(a, b) {
                return Array.isArray(a) ? a.concat(b) : undefined;
            });

            assert.deepEqual(actual, { 'a': { 'b': ['c'] }});
        });

        QUnit.test('should pop the stack of sources for each sibling property', function(assert) {
            const array = ['b', 'c'];
            const object = { 'a': ['a'] };
            const source = { 'a': array, 'b': array };

            const actual = joint.util.merge(object, source, function(a, b) {
                return Array.isArray(a) ? a.concat(b) : undefined;
            });

            assert.deepEqual(actual, { 'a': ['a', 'b', 'c'], 'b': ['b', 'c'] });
        });
    });
});
