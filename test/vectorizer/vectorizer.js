'use strict';

QUnit.module('vectorizer', function(hooks) {

    var $fixture = $('#qunit-fixture');

    var svgContainer = document.getElementById('svg-container');
    var svgPath = document.getElementById('svg-path');
    var svgGroup = document.getElementById('svg-group');
    var svgCircle = document.getElementById('svg-circle');
    var svgEllipse = document.getElementById('svg-ellipse');
    var svgPolygon = document.getElementById('svg-polygon');
    var svgText = document.getElementById('svg-text');
    var svgRectangle = document.getElementById('svg-rectangle');
    var svgGroup1 = document.getElementById('svg-group-1');
    var svgGroup2 = document.getElementById('svg-group-2');
    var svgGroup3 = document.getElementById('svg-group-3');

    var childrenTagNames = function(vel) {
        var tagNames = [];
        Array.prototype.slice.call(vel.node.childNodes).forEach(function(childNode) {
            tagNames.push(childNode.tagName.toLowerCase());
        });
        return tagNames;
    };

    hooks.afterEach = function() {

        $fixture.empty();
    };

    function serializeNode(node) {

        var str = (new XMLSerializer()).serializeToString(node);
        return str;
    }

    QUnit.test('constuctor', function(assert) {

        var vRect = V('rect');

        assert.ok(V.isVElement(vRect), 'Constructor produces a vectorizer element, when a string was provided.');
        assert.ok(vRect.node instanceof SVGElement, 'The vectorizer element has the attribute "node" that references to an SVGElement.');
        assert.ok(V.isVElement(V(vRect)), 'Constructor produces a vectorizer element, when a vectorizer element was provided.');
        assert.ok(V(vRect).node instanceof SVGElement, 'The vectorizer element has again the attribute "node" that references to an SVGElement.');
    });

    QUnit.test('V(\'<invalid markup>\')', function(assert) {

        var error;

        try {
            V('<invalid markup>');
        } catch (e) {
            error = e;
        }

        assert.ok(typeof error !== 'undefined', 'Should throw an error when given invalid markup.');
    });

    QUnit.test('V(\'<valid markup>\')', function(assert) {

        var error;

        try {
            V('<rect width="100%" height="100%" fill="red" />');
        } catch (e) {
            error = e;
        }

        assert.ok(typeof error === 'undefined', 'Should not throw an error when given valid markup.');
    });

    QUnit.test('index()', function(assert) {

        // svg container
        assert.equal(V(svgContainer).index(), 0, 'SVG container contains 5 various nodes and 1 comment. Container itself has index 0.');
        // nodes in an svg container
        assert.equal(V(svgPath).index(), 0, 'The first node has index 0.');
        assert.equal(V(svgGroup).index(), 1, 'The second node has index 1.');
        assert.equal(V(svgPolygon).index(), 2, 'The third node has index 2.');
        assert.equal(V(svgText).index(), 3, 'The fourth node has index 3.');
        assert.equal(V(svgRectangle).index(), 4, 'The fifth node has index 4.');
        // nodes in a group
        assert.equal(V(svgEllipse).index(), 0, 'The first node in the group has index 0.');
        assert.equal(V(svgCircle).index(), 1, 'The second node in the group has index 1.');
    });

    QUnit.test('text', function(assert) {

        var svg = V('svg');
        svg.attr('width', 600);
        svg.attr('height', 800);
        $fixture.append(svg.node);

        var t = V('text', { x: 250, dy: 100, fill: 'black' });
        t.text('abc');

        assert.equal(t.node.childNodes.length, 1, 'There is only one child node which is a v-line node.');
        assert.equal(t.node.childNodes[0].childNodes.length, 1, 'There is only one child of that v-line node which is a text node.');
        assert.equal(serializeNode(t.node.childNodes[0].childNodes[0]), 'abc', 'Generated text is ok for a single line and no annotations.');
        assert.equal(t.attr('fill'), 'black', 'fill attribute set');
        assert.equal(t.attr('x'), '250', 'x attribute set');
        assert.equal(t.attr('dy'), '100', 'dy attribute set');

        t.text('abc\ndef');

        assert.equal(t.node.childNodes.length, 2, 'There are two child nodes one for each line.');

        t.text('abcdefgh', { annotations: [
            { start: 1, end: 3, attrs: { fill: 'red', stroke: 'orange' } },
            { start: 2, end: 5, attrs: { fill: 'blue' } }
        ] });

        assert.equal(t.find('.v-line').length, 1, 'One .v-line element rendered');

        assert.equal(t.find('tspan').length, 4, '4 tspans rendered in total');

        t.text('abcd\nefgh', { annotations: [
            { start: 1, end: 3, attrs: { fill: 'red', stroke: 'orange' } },
            { start: 2, end: 5, attrs: { fill: 'blue' } }
        ] });

        assert.equal(t.find('.v-line').length, 2, 'Two .v-line elements rendered');
        assert.equal(t.find('tspan').length, 5, '5 tspans rendered in total');

        t.text('abcdefgh', { includeAnnotationIndices: true, annotations: [
            { start: 1, end: 3, attrs: { fill: 'red', stroke: 'orange' } },
            { start: 2, end: 5, attrs: { fill: 'blue' } }
        ] });
        assert.equal(V(t.find('tspan')[1]).attr('annotations'), '0', 'annotation indices added as an attribute');
        assert.equal(V(t.find('tspan')[2]).attr('annotations'), '0,1', 'annotation indices added as an attribute');
        assert.equal(V(t.find('tspan')[3]).attr('annotations'), '1', 'annotation indices added as an attribute');
    });

    QUnit.test('annotateString', function(assert) {

        var annotations = V.annotateString('This is a text that goes on multiple lines.', [
            { start: 2, end: 5, attrs: { fill: 'red' } },
            { start: 4, end: 8, attrs: { fill: 'blue' } }
        ]);

        assert.deepEqual(
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

        assert.deepEqual(
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

        assert.deepEqual(
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
    });

    QUnit.test('styleToObject', function(assert) {

        assert.deepEqual(V.styleToObject('fill=red; stroke=blue'), { fill: 'red', stroke: 'blue' }, 'style string parsed properly');
    });

    QUnit.test('mergeAttrs', function(assert) {

        assert.deepEqual(
            V.mergeAttrs({ x: 5, y: 10, style: 'fill=red; stroke=blue' }, { y: 20, style: { stroke: 'orange' } }),
            { x: 5, y: 20, style: { fill: 'red', stroke: 'orange' } },
            'style string parsed properly'
        );
    });

    QUnit.test('find()', function(assert) {

        var found = V(svgContainer).find('circle');

        assert.ok(Array.isArray(found), 'The result is an array.');
        assert.ok(found.length, 'The array is not empty.');
        assert.ok(found.reduce(function(memo, vel) { return memo && V.isVElement(vel); }, true), 'Items in the array are wrapped in Vectorizer.');
    });

    QUnit.test('V.transformPoint', function(assert) {

        var p = { x: 1, y: 2 };
        var t;
        var group = V('<g/>');

        V(svgContainer).append(group);

        t = V.transformPoint(p, group.node.getCTM());
        assert.deepEqual({ x: t.x, y: t.y }, { x: 1, y: 2 }, 'transform without transformation returns the point unchanged.');

        group.scale(2, 3);
        t = V.transformPoint(p, group.node.getCTM());
        assert.deepEqual({ x: t.x, y: t.y }, { x: 2, y: 6 }, 'transform with scale transformation returns correct point.');

        group.attr('transform', 'rotate(90)');
        t = V.transformPoint(p, group.node.getCTM());
        assert.deepEqual({ x: t.x, y: t.y }, { x: -2, y: 1 }, 'transform with rotate transformation returns correct point.');

        group.remove();
    });

    QUnit.test('native getTransformToElement vs VElement getTransformToElement - translate', function(assert) {

        var container = V(svgContainer);
        var group = V('<g/>');
        var rect = V('<rect/>');
        var transformNativeResult = {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: -10,
            f: -10
        };

        container.append(group);
        container.append(rect);

        rect.translate(10, 10);

        var transformPoly = group.getTransformToElement(rect.node);
        var matrix = {
            a: transformPoly.a,
            b: transformPoly.b,
            c: transformPoly.c,
            d: transformPoly.d,
            e: transformPoly.e,
            f: transformPoly.f
        };
        assert.deepEqual(matrix, transformNativeResult);
    });

    QUnit.test('native getTransformToElement vs VElement getTransformToElement - rotate', function(assert) {

        var container = V(svgContainer);
        var normalizeFloat = function(value) {
            var temp = value * 100;
            return temp > 0 ? Math.floor(temp) : Math.ceil(temp);
        };
        var group = V('<g/>');
        var rect = V('<rect/>');
        var transformNativeResult = {
            a: normalizeFloat(0.7071067811865476),
            b: normalizeFloat(-0.7071067811865475),
            c: normalizeFloat(0.7071067811865475),
            d: normalizeFloat(0.7071067811865476),
            e: normalizeFloat(-0),
            f: normalizeFloat(0)
        };

        container.append(group);
        container.append(rect);

        rect.rotate(45);

        var transformPoly = group.getTransformToElement(rect.node);
        var matrix = {
            a: normalizeFloat(transformPoly.a),
            b: normalizeFloat(transformPoly.b),
            c: normalizeFloat(transformPoly.c),
            d: normalizeFloat(transformPoly.d),
            e: normalizeFloat(transformPoly.e),
            f: normalizeFloat(transformPoly.f)
        };
        assert.deepEqual(matrix, transformNativeResult);
    });

    QUnit.test('findParentByClass', function(assert) {

        assert.equal(
            V(svgGroup3).findParentByClass('group-1').node,
            svgGroup1,
            'parent exists'
        );
        assert.notOk(
            V(svgGroup3).findParentByClass('not-a-parent'),
            'parent does not exist'
        );
        assert.notOk(
            V(svgGroup3).findParentByClass('group-1', svgGroup2),
            'parent exists, terminator on the way down'
        );
        assert.equal(
            V(svgGroup3).findParentByClass('group-1', svgCircle).node,
            svgGroup1,
            'parent exists, terminator not on the way down'
        );
        assert.notOk(
            V(svgGroup3).findParentByClass('not-a-parent', svgCircle),
            'parent does not exist, terminator not on the way down'
        );
    });

    QUnit.module('transform()', function(hooks) {

        var vel;

        hooks.beforeEach(function() {

            vel = V('rect');
            V(svgContainer).append(vel);
        });

        hooks.afterEach(function() {

            vel.remove();
        });

        QUnit.test('as a getter', function(assert) {

            assert.deepEqual(vel.transform(), V.createSVGMatrix({
                a: 1,
                b: 0,
                c: 0,
                d: 1,
                e: 0,
                f: 0
            }));
        });

        QUnit.test('single transformation', function(assert) {

            vel.transform({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });

            assert.deepEqual(vel.transform(), V.createSVGMatrix({
                a: 2,
                b: 0,
                c: 0,
                d: 2,
                e: 0,
                f: 0
            }));
        });

        QUnit.test('multiple transformations', function(assert) {

            vel.transform({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });
            vel.transform({ a: 1, b: 0, c: 0, d: 1, e: 10, f: 10 });

            assert.deepEqual(vel.transform(), V.createSVGMatrix({
                a: 2,
                b: 0,
                c: 0,
                d: 2,
                e: 20,
                f: 20
            }));
        });

        QUnit.test('as a getter (element not in the DOM)', function(assert) {

            vel.transform({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });
            vel.transform({ a: 1, b: 0, c: 0, d: 1, e: 10, f: 10 });
            vel.remove();

            assert.deepEqual(vel.transform(), V.createSVGMatrix({
                a: 2,
                b: 0,
                c: 0,
                d: 2,
                e: 20,
                f: 20
            }));
        });

        QUnit.test('opt to clear transformation list', function(assert) {

            vel.transform({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });
            vel.transform({ a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 }, { absolute: true });

            vel.remove();

            assert.deepEqual(vel.transform(), V.createSVGMatrix({
                a: 1,
                b: 1,
                c: 1,
                d: 1,
                e: 1,
                f: 1
            }), 'should clean transformation list before applying 2nd transformation');
        });
    });

    QUnit.module('empty()', function(hooks) {

        var vel;

        hooks.beforeEach(function() {

            vel = V('g');
            V(svgContainer).append(vel);
        });

        hooks.afterEach(function() {

            vel.remove();
        });

        QUnit.test('should remove all child nodes', function(assert) {

            vel.append([
                V('rect'),
                V('polygon'),
                V('circle')
            ]);

            assert.equal(vel.node.childNodes.length, 3);
            vel.empty();
            assert.equal(vel.node.childNodes.length, 0);
        });
    });

    QUnit.module('attribute', function(hooks) {

        var svgToString = function(svg) {

            return new XMLSerializer().serializeToString(svg.node);
        };

        hooks.beforeEach(function() {

            this.svg = V('svg');
        });

        QUnit.module('set', function(hooks) {

            QUnit.test('no namespace', function(assert) {

                var element = V('a').attr('href', 'www.seznam.cz');
                this.svg.append(element);

                var text = svgToString(element);
                assert.equal(text.indexOf(':href'), -1, 'should find attr without namespace');
                assert.ok(text.indexOf('href') > 0, 'attr has been set');
                assert.ok(text.indexOf('href') > 0, 'attr values has been set');
            });

            QUnit.test('with namespace', function(assert) {

                var element = V('a').attr('xlink:href', 'www.seznam.cz');
                this.svg.append(element);

                var text = svgToString(this.svg);
                assert.ok(text.indexOf('xlink:href') > 0, 'message');
            });

            QUnit.test('value "null" removes attr', function(assert) {

                var element = V('a').attr('xlink:href', 'www.seznam.cz');
                this.svg.append(element);

                element.attr('xlink:href', null);

                var text = svgToString(this.svg);

                assert.ok(text.indexOf('xlink:href') === -1, 'attribute should be removed');
            });

            QUnit.test('special attr', function(assert) {

                var element = V('a').attr('id', 'x');
                this.svg.append(element);

                var text = svgToString(element);
                assert.ok(text.indexOf('id') > 0, 'id has been set');
            });
        });

        QUnit.test('remove simple', function(assert) {

            var a = V('a').attr('href', 'www.seznam.cz');
            this.svg.append(a);
            a.removeAttr('href');

            var text = svgToString(this.svg);
            assert.equal(text.indexOf('href'), -1, 'should be deleted');
        });

        QUnit.test('try to remove non existing', function(assert) {

            var a = V('a').attr('href', 'www.seznam.cz');
            this.svg.append(a);
            a.removeAttr('blah');

            var text = svgToString(this.svg);
            assert.ok(text.indexOf('href') > 0, 'should not throw');
        });

        QUnit.test('remove with namespace', function(assert) {

            var a = V('a').attr('xlink:href', 'www.seznam.cz');
            this.svg.append(a);
            a.removeAttr('xlink:href');

            var text = svgToString(this.svg);
            assert.equal(text.indexOf('href'), -1, 'message');
            assert.equal(text.indexOf('seznam'), -1, 'message');
        });

        QUnit.test('remove with not known namespace', function(assert) {

            var a = V('a').attr('xxx:href', 'www.seznam.cz');
            this.svg.append(a);
            a.removeAttr('xxx:href');

            var text = svgToString(this.svg);
            assert.equal(text.indexOf('href'), -1, 'message');
            assert.equal(text.indexOf('seznam'), -1, 'message');
        });

        QUnit.test('apply remove attr', function(assert) {

            var element = V('a');
            this.svg.append(element);

            element.text();
            element.text('text');

            var text = svgToString(this.svg);
            assert.ok(text.indexOf('display="null"') === -1, 'attr display should be removed');
        });
    });

    QUnit.module('append()', function(hooks) {

        var groupElement;

        hooks.beforeEach(function() {
            groupElement = V(svgGroup).clone().empty();
        });

        QUnit.test('single element', function(assert) {

            groupElement.append(V('<rect/>'));
            assert.equal(groupElement.node.childNodes.length, 1);
            assert.deepEqual(childrenTagNames(groupElement), ['rect']);

            groupElement.append(V('<circle/>'));
            assert.equal(groupElement.node.childNodes.length, 2);
            assert.deepEqual(childrenTagNames(groupElement), ['rect', 'circle']);
        });

        QUnit.test('multiple elements', function(assert) {

            groupElement.append(V('<rect/><circle/>'));
            assert.equal(groupElement.node.childNodes.length, 2);
            assert.deepEqual(childrenTagNames(groupElement), ['rect', 'circle']);

            groupElement.append(V('<line/><polygon/>'));
            assert.equal(groupElement.node.childNodes.length, 4);
            assert.deepEqual(childrenTagNames(groupElement), ['rect', 'circle', 'line', 'polygon']);
        });
    });

    QUnit.module('prepend()', function(hooks) {

        var groupElement;

        hooks.beforeEach(function() {
            groupElement = V(svgGroup).clone().empty();
        });

        QUnit.test('single element', function(assert) {

            groupElement.prepend(V('<rect/>'));
            assert.equal(groupElement.node.childNodes.length, 1);
            assert.deepEqual(childrenTagNames(groupElement), ['rect']);

            groupElement.prepend(V('<circle/>'));
            assert.equal(groupElement.node.childNodes.length, 2);
            assert.deepEqual(childrenTagNames(groupElement), ['circle', 'rect']);
        });

        QUnit.test('multiple elements', function(assert) {

            groupElement.prepend(V('<rect/><circle/>'));
            assert.equal(groupElement.node.childNodes.length, 2);
            assert.deepEqual(childrenTagNames(groupElement), ['rect', 'circle']);

            groupElement.prepend(V('<line/><polygon/>'));
            assert.equal(groupElement.node.childNodes.length, 4);
            assert.deepEqual(childrenTagNames(groupElement), ['line', 'polygon', 'rect', 'circle']);
        });
    });

    QUnit.module('before()', function(hooks) {

        var groupElement, rectElement;

        hooks.beforeEach(function() {
            groupElement = V(svgGroup).clone().empty();
            rectElement = V(svgRectangle).clone().empty();
            groupElement.append(rectElement);
        });

        QUnit.test('single element', function(assert) {

            rectElement.before(V('<circle/>'));
            assert.equal(groupElement.node.childNodes.length, 2);
            assert.deepEqual(childrenTagNames(groupElement), ['circle', 'rect']);

            rectElement.before(V('<line/>'));
            assert.equal(groupElement.node.childNodes.length, 3);
            assert.deepEqual(childrenTagNames(groupElement), ['circle', 'line', 'rect']);
        });

        QUnit.test('multiple elements', function(assert) {

            rectElement.before(V('<ellipse/><circle/>'));
            assert.equal(groupElement.node.childNodes.length, 3);
            assert.deepEqual(childrenTagNames(groupElement), ['ellipse', 'circle', 'rect']);

            rectElement.before(V('<line/><polygon/>'));
            assert.equal(groupElement.node.childNodes.length, 5);
            assert.deepEqual(childrenTagNames(groupElement), ['ellipse', 'circle', 'line', 'polygon', 'rect']);
        });
    });

});
