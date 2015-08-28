module('vectorizer', {

    setup: function() {

        this.svgContainer = document.getElementById('svg-container');
        this.svgPath = document.getElementById('svg-path');
        this.svgGroup = document.getElementById('svg-group');
        this.svgCircle = document.getElementById('svg-circle');
        this.svgEllipse = document.getElementById('svg-ellipse');
        this.svgPolygon = document.getElementById('svg-polygon');
        this.svgText = document.getElementById('svg-text');
        this.svgRectangle = document.getElementById('svg-rectangle');

        this.$fixture = $('#qunit-fixture');
    },

    teardown: function() {
    },

    serialize: function(node) {

        var str = (new XMLSerializer()).serializeToString(node);
        //str = str.replace('xmlns=\"http://www.w3.org/2000/svg\"', '');
        return str;
    }
});

test('constuctor', function(assert) {

    var vRect = V('rect');

    assert.ok(V.isVElement(vRect), 'Constructor produces a vectorizer element, when a string was provided.');
    assert.ok(vRect.node instanceof SVGElement, 'The vectorizer element has the attribute "node" that references to an SVGElement.');
    assert.ok(V.isVElement(V(vRect)), 'Constructor produces a vectorizer element, when a vectorizer element was provided.');
    assert.ok(V(vRect).node instanceof SVGElement, 'The vectorizer element has again the attribute "node" that references to an SVGElement.');
});

test('V(\'<invalid markup>\')', function(assert) {

    var error;

    try {
        V('<invalid markup>');
    } catch (e) {
        error = e;
    }

    assert.ok(typeof error !== 'undefined', 'Should throw an error when given invalid markup.');
});

test('V(\'<valid markup>\')', function(assert) {

    var error;

    try {
        V('<rect width="100%" height="100%" fill="red" />');
    } catch (e) {
        error = e;
    }

    assert.ok(typeof error === 'undefined', 'Should not throw an error when given valid markup.');
});

test('index()', function(assert) {

    // svg container
    assert.equal(V(this.svgContainer).index(), 0, 'SVG container contains 5 various nodes and 1 comment. Container itself has index 0.');
    // nodes in an svg container
    assert.equal(V(this.svgPath).index(), 0, 'The first node has index 0.');
    assert.equal(V(this.svgGroup).index(), 1, 'The second node has index 1.');
    assert.equal(V(this.svgPolygon).index(), 2, 'The third node has index 2.');
    assert.equal(V(this.svgText).index(), 3, 'The fourth node has index 3.');
    assert.equal(V(this.svgRectangle).index(), 4, 'The fifth node has index 4.');
    // nodes in a group
    assert.equal(V(this.svgEllipse).index(), 0, 'The first node in the group has index 0.');
    assert.equal(V(this.svgCircle).index(), 1, 'The second node in the group has index 1.');

});

test('text', function() {

    var svg = V('svg');
    svg.attr('width', 600);
    svg.attr('height', 800);
    this.$fixture.append(svg.node);

    var t = V('text', { x: 250, dy: 100, fill: 'black' });
    t.text('abc');

    equal(t.node.childNodes.length, 1, 'There is only one child node which is a v-line node.');
    equal(t.node.childNodes[0].childNodes.length, 1, 'There is only one child of that v-line node which is a text node.');
    equal(this.serialize(t.node.childNodes[0].childNodes[0]), 'abc', 'Generated text is ok for a single line and no annotations.');
    equal(t.attr('fill'), 'black', 'fill attribute set');
    equal(t.attr('x'), '250', 'x attribute set');
    equal(t.attr('dy'), '100', 'dy attribute set');

    t.text('abc\ndef');

    equal(t.node.childNodes.length, 2, 'There are two child nodes one for each line.');

    t.text('abcdefgh', { annotations: [
        { start: 1, end: 3, attrs: { fill: 'red', stroke: 'orange' } },
        { start: 2, end: 5, attrs: { fill: 'blue' } }
    ] });

    equal(t.find('.v-line').length, 1, 'One .v-line element rendered');

    equal(t.find('tspan').length, 4, '4 tspans rendered in total');

    t.text('abcd\nefgh', { annotations: [
        { start: 1, end: 3, attrs: { fill: 'red', stroke: 'orange' } },
        { start: 2, end: 5, attrs: { fill: 'blue' } }
    ] });

    equal(t.find('.v-line').length, 2, 'Two .v-line elements rendered');
    equal(t.find('tspan').length, 5, '5 tspans rendered in total');

    t.text('abcdefgh', { includeAnnotationIndices: true, annotations: [
        { start: 1, end: 3, attrs: { fill: 'red', stroke: 'orange' } },
        { start: 2, end: 5, attrs: { fill: 'blue' } }
    ] });
    equal(V(t.find('tspan')[1]).attr('annotations'), '0', 'annotation indices added as an attribute');
    equal(V(t.find('tspan')[2]).attr('annotations'), '0,1', 'annotation indices added as an attribute');
    equal(V(t.find('tspan')[3]).attr('annotations'), '1', 'annotation indices added as an attribute');
})

test('annotateString', function() {

    var annotations = V.annotateString('This is a text that goes on multiple lines.', [
        { start: 2, end: 5, attrs: { fill: 'red' } },
        { start: 4, end: 8, attrs: { fill: 'blue' } }
    ]);

    deepEqual(
        annotations,
        [
            'Th',
            { t: 'is', attrs: { fill: 'red' } },
            { t: ' is ', attrs: { fill: 'blue' } },
            'a text that goes on multiple lines.'
        ],
        'String cut into pieces and attributed according to the spans.'
    );

    annotations = V.annotateString('abcdefgh', [
        { start: 1, end: 3, attrs: { 'class': 'one' } },
        { start: 2, end: 5, attrs: { 'class': 'two', fill: 'blue' } }
    ]);

    deepEqual(
        annotations,
        [
            'a',
            { t: 'b', attrs: { 'class': 'one' } },
            { t: 'c', attrs: { 'class': 'one two', fill: 'blue' } },
            { t: 'de', attrs: { 'class': 'two', fill: 'blue' } },
            'fgh'
        ],
        'String cut into pieces and attributed according to the annotations including concatenated classes.'
    );

    annotations = V.annotateString('abcdefgh', [
        { start: 1, end: 3, attrs: { 'class': 'one' } },
        { start: 2, end: 5, attrs: { 'class': 'two', fill: 'blue' } }
    ], { includeAnnotationIndices: true });

    deepEqual(
        annotations,
        [
            'a',
            { t: 'b', attrs: { 'class': 'one' }, annotations: [0] },
            { t: 'c', attrs: { 'class': 'one two', fill: 'blue' }, annotations: [0, 1] },
            { t: 'de', attrs: { 'class': 'two', fill: 'blue' }, annotations: [1] },
            'fgh'
        ],
        'annotation indices included'
    );
})

test('styleToObject', function() {

    deepEqual(V.styleToObject('fill=red; stroke=blue'), { fill: 'red', stroke: 'blue' }, 'style string parsed properly');
})

test('mergeAttrs', function() {

    deepEqual(
        V.mergeAttrs({ x: 5, y: 10, style: 'fill=red; stroke=blue' }, { y: 20, style: { stroke: 'orange' } }),
        { x: 5, y: 20, style: { fill: 'red', stroke: 'orange'  } },
        'style string parsed properly'
    );
});

test('find()', function(assert) {

    var found = V(this.svgContainer).find('circle');

    assert.ok(Array.isArray(found), 'The result of is an array');
    assert.ok(found.length, 'The array is not empty.');
    assert.ok(found.reduce(function(memo, vel) { return memo && V.isVElement(vel); }, true), 'Items in the array are wrapped in Vectorizer.');
});
