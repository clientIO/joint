'use strict';

QUnit.module('security', function() {

    QUnit.module('util.sanitizeHTML()', function() {

        QUnit.test('removes `javascript:` URLs regardless of case and whitespace', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<a href="JaVaScRiPt:alert(1)">x</a>'), '<a>x</a>');
            assert.equal(sanitizeHTML('<a href="  javascript:alert(1)">x</a>'), '<a>x</a>');
            assert.equal(sanitizeHTML('<a href="java&#x09;script:alert(1)">x</a>'), '<a>x</a>');
            assert.equal(sanitizeHTML('<a href="VBScript:alert(1)">x</a>'), '<a>x</a>');
            // a double-encoded scheme stays text (it is not decoded again when parsed)
            const doubleEncoded = sanitizeHTML('<a href="&amp;#106;avascript:alert(1)">x</a>');
            const div = document.createElement('div');
            div.innerHTML = doubleEncoded;
            assert.notEqual(new URL(div.firstChild.getAttribute('href'), location.href).protocol, 'javascript:');
            assert.equal(sanitizeHTML('<a href="https://example.com">x</a>'), '<a href="https://example.com">x</a>');
        });

        QUnit.test('removes unsafe elements', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<p>a</p><iframe srcdoc="<script>alert(1)</script>"></iframe>'), '<p>a</p>');
            assert.equal(sanitizeHTML('<p>a</p><meta http-equiv="refresh" content="0;url=https://example.com">'), '<p>a</p>');
            assert.equal(sanitizeHTML('<p>a</p><base href="https://example.com">'), '<p>a</p>');
            assert.equal(sanitizeHTML('<p>a</p><object data="x"></object><embed src="x">'), '<p>a</p>');
            assert.equal(sanitizeHTML('<p>a</p><script>alert(1)</script><script>alert(2)</script>'), '<p>a</p>');
        });

        QUnit.test('removes inline event handlers', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<img ONERROR="alert(1)">'), '<img>');
            assert.equal(sanitizeHTML('<svg onload="alert(1)"></svg>'), '<svg></svg>');
        });


        QUnit.test('removes `srcdoc` from any element', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<div srcdoc="x" title="y">a</div>'), '<div title="y">a</div>');
        });

        QUnit.test('removes `data:` URLs regardless of case and whitespace', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<a href="data:text/html,<script>alert(1)</script>">x</a>'), '<a>x</a>');
            assert.equal(sanitizeHTML('<a href=" DATA:text/html,x">x</a>'), '<a>x</a>');
        });

        QUnit.test('removes the animations of any attribute', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(
                sanitizeHTML('<svg><rect><animate attributeName="opacity" to="0"></animate><set attributeName="fill" to="red"></set><animateMotion dur="1s" path="M 0 0 L 10 10"></animateMotion></rect></svg>'),
                '<svg><rect><animateMotion dur="1s" path="M 0 0 L 10 10"></animateMotion></rect></svg>'
            );
        });

        QUnit.test('keeps safe markup', function(assert) {
            const { sanitizeHTML } = joint.util;
            const html = '<p class="a" style="color: red;"><a href="https://example.com" title="t">l</a><b>b</b></p>';
            assert.equal(sanitizeHTML(html), html);
        });
    });

    QUnit.module('mvc.$.parseHTML()', function() {

        QUnit.test('removes all `<script>` elements', function(assert) {
            const nodes = joint.mvc.$.parseHTML('<script>a</script><script>b</script><p>x<script>c</script></p><script>d</script>');
            assert.deepEqual(nodes.map((node) => node.nodeName), ['P']);
            assert.equal(nodes[0].querySelectorAll('script').length, 0);
            assert.equal(nodes[0].textContent, 'x');
        });
    });

    QUnit.module('util.filter', function() {

        QUnit.test('escapes the filter arguments', function(assert) {
            const markup = joint.util.filter.dropShadow({ color: '"/><image href="x" onerror="x"/><path d="', dx: '" onload="x' });
            const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
            assert.equal(doc.querySelectorAll('image, [onload], [onerror]').length, 0);
            assert.equal(doc.documentElement.tagName, 'filter');
            assert.equal(doc.documentElement.children.length, joint.util.filter.dropShadow({}).match(/<fe[A-Z]/g).length);
        });


        QUnit.test('escapes the string arguments of all the filters', function(assert) {
            const injection = '"/><image href="x" onerror="x"/><feFlood a="';
            [
                joint.util.filter.outline({ color: injection }),
                joint.util.filter.highlight({ color: injection }),
                joint.util.filter.hueRotate({ angle: injection })
            ].forEach((markup) => {
                const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
                assert.equal(doc.querySelectorAll('image, [onerror], feFlood[a]').length, 0, markup);
            });
        });

        QUnit.test('the markup does not change for regular arguments', function(assert) {
            assert.equal(
                joint.util.filter.dropShadow({ dx: 2, dy: 3, color: 'rgba(0,0,0,0.5)', blur: 1 }),
                '<filter><feDropShadow stdDeviation="1" dx="2" dy="3" flood-color="rgba(0,0,0,0.5)" flood-opacity="1"/></filter>'
            );
            assert.equal(joint.util.filter.blur({ x: 1, y: 2 }), '<filter><feGaussianBlur stdDeviation="1,2"/></filter>');
        });

        QUnit.test('paper.defineFilter() can not inject markup by default', function(assert) {
            const paper = new joint.dia.Paper({ el: $('<div/>').appendTo('#qunit-fixture') });
            paper.defineFilter({ name: 'highlight', args: { color: '"/><image href="x" onerror="x"/><feFlood flood-color="' }});
            assert.equal(paper.svg.querySelectorAll('filter image, [onerror]').length, 0);
            assert.equal(paper.svg.querySelectorAll('filter feFlood').length, 1);
            ['constructor', 'toString', '__proto__', 'hasOwnProperty'].forEach((name) => {
                assert.throws(function() {
                    paper.defineFilter({ name });
                }, /Non-existing filter/, name);
            });
            paper.remove();
        });
    });

    QUnit.module('util.setByPath()', function() {

        QUnit.test('does not replace the prototype with the last path segment', function(assert) {
            const proto = { polluted: true };
            const obj = { a: {}};
            joint.util.setByPath(obj, 'a/__proto__', proto);
            assert.notOk(obj.a.polluted);
            joint.util.setByPath(obj, '__proto__', proto);
            assert.notOk(obj.polluted);
            joint.util.setByPath(obj, ['__proto__'], proto);
            assert.notOk(obj.polluted);
        });

        QUnit.test('sets `constructor` as the last path segment as an own property', function(assert) {
            const obj = {};
            joint.util.setByPath(obj, 'data/constructor', 1);
            assert.deepEqual(obj, { data: { constructor: 1 }});
            // the two-step sequence
            joint.util.setByPath(obj, 'constructor', {});
            joint.util.setByPath(obj, 'constructor/prototype/polluted', true);
            assert.notOk({}.polluted);
            assert.notOk(Object.prototype.polluted);
        });
    });

    QUnit.module('util.unsetByPath()', function() {

        QUnit.test('ignores `__proto__` as the last path segment', function(assert) {
            const obj = { a: 1 };
            joint.util.unsetByPath(obj, '__proto__');
            assert.equal(Object.getPrototypeOf(obj), Object.prototype);
            assert.deepEqual(obj, { a: 1 });
        });
    });

    QUnit.module('cell type resolution', function() {

        [
            'constructor', 'constructor.constructor', 'toString', '__proto__', 'hasOwnProperty',
            'standard.constructor', 'standard.Rectangle.constructor',
            // functions reachable from a shape class
            'standard.Rectangle.define', 'standard.Rectangle.getAttributeDefinition',
            'standard.Rectangle.__super__.addPorts', 'standard.Link.__super__.isLink',
            'standard.Rectangle.prototype.initialize'
        ].forEach(function(type) {
            QUnit.test(`type "${type}" is not resolved from the prototype chain`, function(assert) {
                const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
                assert.throws(function() {
                    graph.fromJSON({ cells: [{ id: 'a', type }] });
                }, /Could not find cell constructor/);
                // The graph remains usable
                graph.fromJSON({ cells: [{ id: 'b', type: 'standard.Rectangle' }] });
                assert.equal(graph.getCells().length, 1);
                assert.ok(graph.getCell('b'));
            });
        });

        QUnit.test('resolves cell constructors', function(assert) {
            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            graph.fromJSON({ cells: [{ id: 'a', type: 'standard.Rectangle' }] });
            assert.ok(graph.getCell('a') instanceof joint.shapes.standard.Rectangle);
            const namespace = Object.create(joint.shapes);
            const inheritingGraph = new joint.dia.Graph({}, { cellNamespace: namespace });
            inheritingGraph.fromJSON({ cells: [{ id: 'a', type: 'standard.Rectangle' }] });
            assert.ok(inheritingGraph.getCell('a') instanceof joint.shapes.standard.Rectangle);
            // A function which is not a cell constructor is not resolved.
            const customGraph = new joint.dia.Graph({}, { cellNamespace: { Custom: function() {} }});
            assert.throws(function() {
                customGraph.fromJSON({ cells: [{ id: 'a', type: 'Custom' }] });
            }, /Could not find cell constructor/);
        });
    });
});
