module('core', {

    setup: function() {

    },

    teardown: function() {

    }

});

test('core.util.interpolate', function() {

    var values = [0, .25, .5, .75, 1];

    var numberInterpolation = joint.util.interpolate.number(0,100);
    var objectInterpolation = joint.util.interpolate.object({ x: 100, y: 200 },{ x: 200, y: 0 });
    var hexColorInterpolation = joint.util.interpolate.hexColor('#FFFFFF','#00FF77');
    var unitInterpolation = joint.util.interpolate.unit('1em','0.50em');

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
	"#ffffff", "#bfffdd", "#7fffbb", "#3fff99", "#00ff77"
    ], 'String hex colors interpolated.');

    deepEqual(unitArray, [
	"1.00em", "0.88em", "0.75em", "0.63em", "0.50em"
    ], 'Numbers with units interpolated.');

})

test('core.util.format.number', function() {

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
})

test('core.util.breakText', function() {

    // tests can't compare exact results as they may vary in different browsers

    var text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

    equal(joint.util.breakText("", { width: 100 }),
          "",
          "An empty text was correctly broken.");

    equal(joint.util.breakText(text, { width: 0, height: 0 }),
          "",
          "A text was correctly broken when zero width and height provided.");

    ok(_.contains(joint.util.breakText(text, { width: 100 }), '\n'),
       "A text was broken when width A specified.");

    ok(_.contains(joint.util.breakText(text, { width: 15 }), '\n'),
          "A text was broken when width B specified.");

    var brokenText = joint.util.breakText(text, { width: 100, height: 50 });

    ok(_.contains(brokenText, 'Lorem') && !_.contains(brokenText, 'elit.'),
       "A text was trimmed when width & height specified.");

    brokenText = joint.util.breakText(text, { width: 100, height: 50 }, { 'font-size': '18px' })

    ok(_.contains(brokenText, '\n') || !_.contains(brokenText, 'elit.'),
       "A text was broken when style specified.");

    throws(function() {
        joint.util.breakText(text, { width: 100, height: 50 }, { 'font-size': 18 }, { svgDocument: 'not-svg' });
    }, /appendChild|undefined/, "A custom svgDocument provided was recognized.");

});

test('core.util.getByPath()', function() {

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
    equal(joint.util.getByPath(obj, 'b.c'), 2, 'nested property is a number');
    deepEqual(joint.util.getByPath(obj, 'b.none'), undefined, 'non-existing nested property is undefined');
    deepEqual(joint.util.getByPath(obj, 'f'), {}, 'property is an empty object');
    deepEqual(joint.util.getByPath(obj, 'g'), [], 'property is an empty array');
    deepEqual(joint.util.getByPath(obj, 'g.0'), undefined, 'first item of an empty array is undefined');
    deepEqual(joint.util.getByPath(obj, 'h.0'), null, 'first item of an array is null');
    deepEqual(joint.util.getByPath(obj, 'h.0.none'), undefined, 'nested property in null is undefined');
    equal(joint.util.getByPath(obj, 'h.1'), 4, 'nth item of an array is number');
    deepEqual(joint.util.getByPath(obj, 'h.1.none'), undefined, 'non-existing property of nth item of an array is undefined');
    equal(joint.util.getByPath(obj, 'h.2.i.j'), 6, 'nested property of nth item of an array is number');
    equal(joint.util.getByPath(obj, 'h/2/i/j', '/'), 6, 'same but this time with a custom delimiter');

});

test('core.util.setByPath()', function() {

    deepEqual(joint.util.setByPath({}, 'property', 1), { property: 1 }, 'non-existing property in an obj set as a number');
    deepEqual(joint.util.setByPath({ property: 2 }, 'property', 3), { property: 3 }, 'existing property in an obj set as a number');
    deepEqual(joint.util.setByPath([], '0', 4), [4], 'add an item to an empty array');
    deepEqual(joint.util.setByPath([5,6], '1', 7), [5,7], 'change an item in an array');
    deepEqual(joint.util.setByPath({}, 'first.second.third', 8), { first: { second: { third: 8 }}}, 'populate an empty object with nested objects');
    deepEqual(joint.util.setByPath({}, 'first/second/third', 9, '/'), { first: { second: { third: 9 }}}, 'same but this time with a custom delimiter');
    deepEqual(joint.util.setByPath([null], '0.property', 10), [{ property: 10 }], 'replace null item with an object');
});

test('core.util.unsetByPath()', function() {

    var obj = {
        a: 1,
        b: {
            c: 2,
            d: 3
        }
    };

    joint.util.unsetByPath(obj, 'b/c', '/');

    deepEqual(obj, { a: 1, b: { d: 3 }}, "A nested attribute was removed.");

    joint.util.unsetByPath(obj, 'b');

    deepEqual(obj, { a: 1 }, "A primitive attribute was removed.");

    joint.util.unsetByPath(obj, 'c/d');

    deepEqual(obj, { a: 1 }, "Attempt to delete non-existing attribute doesn't affect object.");

});
