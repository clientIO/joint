'use strict';

const $ = joint.mvc.$;

QUnit.module('@joint/sanitize', function() {

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

        QUnit.test('removes `<template>` and other elements with unsanitizable content', function(assert) {
            const { sanitizeHTML } = joint.util;
            // (the content of `<template>` is not part of the DOM tree)
            assert.equal(sanitizeHTML('<p>a</p><template><img src="x" onerror="alert(1)"><script>alert(1)</script></template>'), '<p>a</p>');
            // (the content of `<noscript>` is kept, the attribute value is only text)
            assert.equal(
                sanitizeHTML('<p>a</p><noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript>'),
                '<p>a</p><p title="&lt;/noscript&gt;&lt;img src=x onerror=alert(1)&gt;"></p>'
            );
        });

        QUnit.test('replaces the elements which are not allowed by their content', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<p>a<my-element>b<b>c</b></my-element></p>'), '<p>ab<b>c</b></p>');
            assert.equal(sanitizeHTML('<math><mi>x</mi><mo>+</mo></math><xmp><b>y</b></xmp>'), 'x+&lt;b&gt;y&lt;/b&gt;');
            assert.equal(sanitizeHTML('<object><img src="x" onerror="alert(1)"></object>'), '<img src="x">');
            // SVG elements are allowed only inside `<svg>`, HTML elements only inside `<foreignObject>`
            assert.equal(sanitizeHTML('<svg><rect></rect><foreignObject><p>a</p></foreignObject></svg>'), '<svg><rect></rect><foreignObject><p>a</p></foreignObject></svg>');
        });

        QUnit.test('sanitizes a `<form>` whose properties are clobbered by its controls', function(assert) {
            const { sanitizeHTML } = joint.util;
            ['firstChild', 'parentNode', 'tagName', 'namespaceURI', 'getAttributeNames', 'getAttribute', 'removeAttribute'].forEach((name) => {
                assert.equal(
                    sanitizeHTML(`<form onsubmit="alert(1)"><input name="${name}"><my-element>x</my-element><img src="x" onerror="alert(1)"></form>`),
                    `<form><input name="${name}">x<img src="x"></form>`,
                    name
                );
            });
        });

        QUnit.test('the result is safe when parsed again (mXSS)', function(assert) {
            const { sanitizeHTML } = joint.util;
            const probe = 'x';
            [
                `<math><mtext><table><mglyph><style><img src=x onerror="${probe}">`,
                `<form><math><mtext></form><form><mglyph><style></math><img src onerror="${probe}">`,
                `<svg></p><style><a id="</style><img src=1 onerror=${probe}>">`,
                `<style><img src=x onerror="${probe}"></style>`,
                `<noscript><p title="</noscript><img src=x onerror=${probe}>">`,
                `<plaintext><img src=x onerror="${probe}">`
            ].forEach((html) => {
                const result = sanitizeHTML(html);
                // parsed in an HTML element (the intended use)
                const div = document.createElement('div');
                div.innerHTML = result;
                assert.equal(div.querySelectorAll('[onerror], script, iframe').length, 0, html);
                // parsed in an SVG element
                const svg = document.createElementNS(joint.V.namespace.svg, 'svg');
                svg.innerHTML = result;
                assert.equal(svg.querySelectorAll('[onerror], script, iframe').length, 0, html);
                // sanitizing the result again removes nothing unsafe either
                const resultDiv = document.createElement('div');
                resultDiv.innerHTML = sanitizeHTML(result);
                assert.equal(resultDiv.querySelectorAll('[onerror], script, iframe').length, 0, html);
            });
        });

        QUnit.test('keeps markup which parses back to itself', function(assert) {
            const { sanitizeHTML } = joint.util;
            [
                '<p>a &lt;b&gt; c</p>',
                '<textarea>&lt;b&gt;</textarea>',
                '<style>p > b { color: red; }</style><p><b>x</b></p>',
                '<svg><rect width="1"></rect></svg>'
            ].forEach((html) => {
                assert.equal(sanitizeHTML(html), html);
            });
        });

        QUnit.test('removes processing instructions', function(assert) {
            const { sanitizeHTML } = joint.util;
            // Some browsers parse them as comments (which are kept).
            const result = sanitizeHTML('<p>a</p><?x <img src=x onerror=alert(1)>?><svg><?y?></svg>');
            assert.notOk(result.includes('<?'), result);
            const div = document.createElement('div');
            div.innerHTML = result;
            assert.equal(div.querySelectorAll('[onerror]').length, 0);
        });

        QUnit.test('removes comments which contain markup (mXSS)', function(assert) {
            const { sanitizeHTML } = joint.util;
            // (`textContent` does not include comments, so the content of `<style>` is not
            // enough to detect markup which would be parsed again)
            assert.equal(sanitizeHTML('<svg><style><!--</style>--></style></svg>'), '<svg><style></style></svg>');
            assert.equal(sanitizeHTML('<p>a<!--<b>-->b</p>'), '<p>ab</p>');
            // comments without markup are kept
            assert.equal(sanitizeHTML('<p>a<!-- b > c -->d</p>'), '<p>a<!-- b > c -->d</p>');
        });

        QUnit.test('detects markup only where `<` starts a tag, a comment or a bogus comment', function(assert) {
            const { sanitizeHTML } = joint.util;
            // `<` followed by anything else is text (e.g. a CSS range)
            assert.equal(
                sanitizeHTML('<style>@media (width<600px){p{color:red}}</style><p>x</p>'),
                '<style>@media (width<600px){p{color:red}}</style><p>x</p>'
            );
            assert.equal(sanitizeHTML('<svg><style>p{content:"a<1"}</style></svg>'), '<svg><style>p{content:"a&lt;1"}</style></svg>');
            assert.equal(sanitizeHTML('<p>a<!-- width<600px -->b</p>'), '<p>a<!-- width<600px -->b</p>');
            // comment and bogus comment openers are markup
            assert.equal(sanitizeHTML('<style>a<!--b</style><p>x</p>'), '<p>x</p>');
            assert.equal(sanitizeHTML('<style>a<?b</style><p>x</p>'), '<p>x</p>');
            assert.equal(sanitizeHTML('<p>a<!--<!x-->b</p>'), '<p>ab</p>');
        });

        QUnit.test('removes `attributeName` of animations which target unsafe attributes', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(
                sanitizeHTML('<svg><a><animateTransform attributeName="href" to="https://example.com"></animateTransform><animateTransform attributeName=" XLINK:HREF "></animateTransform><animateTransform attributeName="onclick"></animateTransform><animateTransform attributeName="attributeName" to="onclick"></animateTransform><animateTransform attributeName="transform" type="rotate"></animateTransform></a></svg>'),
                '<svg><a><animateTransform to="https://example.com"></animateTransform><animateTransform></animateTransform><animateTransform></animateTransform><animateTransform to="onclick"></animateTransform><animateTransform attributeName="transform" type="rotate"></animateTransform></a></svg>'
            );
        });

        QUnit.test('removes the animations of any attribute', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(
                sanitizeHTML('<svg><rect><animate attributeName="opacity" to="0"></animate><set attributeName="fill" to="red"></set><animateMotion dur="1s" path="M 0 0 L 10 10"></animateMotion></rect></svg>'),
                '<svg><rect><animateMotion dur="1s" path="M 0 0 L 10 10"></animateMotion></rect></svg>'
            );
        });

        QUnit.test('removes the attributes which would replace a property of `document`', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<img name="getElementById" src="x.png">'), '<img src="x.png">');
            assert.equal(sanitizeHTML('<img name="photo" id="cookie">'), '<img name="photo">');
            assert.equal(sanitizeHTML('<form name="cookie"><input name="cookie"></form>'), '<form><input name="cookie"></form>');
            assert.equal(sanitizeHTML('<img name="photo" src="x.png">'), '<img name="photo" src="x.png">');
            assert.equal(sanitizeHTML('<h1 id="title">x</h1>'), '<h1 id="title">x</h1>');
        });

        QUnit.test('keeps the obsolete formatting elements', function(assert) {
            const { sanitizeHTML } = joint.util;
            const html = '<font color="#ff0000">a</font><strike>b</strike><center>c</center><big>d</big><tt>e</tt><nobr>f</nobr><acronym>g</acronym>';
            assert.equal(sanitizeHTML(html), html);
        });

        QUnit.test('does not check the URL of attributes which are never URLs', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<p title="javascript: a language" class="javascript:x">x</p>'), '<p title="javascript: a language" class="javascript:x">x</p>');
            assert.equal(sanitizeHTML('<img alt="vbscript: old" src="x.png">'), '<img alt="vbscript: old" src="x.png">');
            assert.equal(sanitizeHTML('<a href="javascript:alert(1)" title="x">x</a>'), '<a title="x">x</a>');
            // other rules still apply
            assert.equal(sanitizeHTML('<img name="createElement" src="x.png">'), '<img src="x.png">');
        });

        QUnit.test('keeps `data:` images only on elements which display them', function(assert) {
            const { sanitizeHTML } = joint.util;
            const src = 'data:image/png;base64,iVBORw0KGgo=';
            assert.equal(sanitizeHTML(`<input type="image" src="${src}">`), `<input type="image" src="${src}">`);
            assert.equal(sanitizeHTML(`<video poster="${src}"></video>`), `<video poster="${src}"></video>`);
            assert.equal(sanitizeHTML(`<a href="${src}">x</a>`), '<a>x</a>');
            assert.equal(sanitizeHTML(`<svg><feImage href="${src}"></feImage><use href="${src}"></use></svg>`), `<svg><feImage href="${src}"></feImage><use></use></svg>`);
        });

        QUnit.test('keeps `data:` images', function(assert) {
            const { sanitizeHTML } = joint.util;
            const src = 'data:image/png;base64,iVBORw0KGgo=';
            assert.equal(sanitizeHTML(`<img src="${src}">`), `<img src="${src}">`);
            assert.equal(sanitizeHTML('<a href="data:text/html,<script>alert(1)</script>">x</a>'), '<a>x</a>');
            assert.equal(sanitizeHTML('<a href=" DATA:text/html,x">x</a>'), '<a>x</a>');
        });

        QUnit.test('removes `srcdoc` from any element', function(assert) {
            const { sanitizeHTML } = joint.util;
            // (not only from `<iframe>`, which is removed as a whole)
            assert.equal(sanitizeHTML('<div srcdoc="x" title="y">a</div>'), '<div title="y">a</div>');
            assert.equal(
                sanitizeHTML('<svg><animateTransform attributeName="srcdoc" to="x"></animateTransform></svg>'),
                '<svg><animateTransform to="x"></animateTransform></svg>'
            );
        });

        QUnit.test('removes the attributes which associate a control with a form of the host document', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(
                sanitizeHTML('<button form="f" formaction="https://example.com" formenctype="text/plain" formmethod="get" formnovalidate formtarget="_blank">b</button>'),
                '<button>b</button>'
            );
            assert.equal(sanitizeHTML('<input form="f" name="x">'), '<input name="x">');
            // the forms and the controls themselves are kept
            assert.equal(
                sanitizeHTML('<form action="https://example.com" method="post"><input name="x"><button type="submit">b</button></form>'),
                '<form action="https://example.com" method="post"><input name="x"><button type="submit">b</button></form>'
            );
        });

        QUnit.test('removes `is` (customized built-in elements)', function(assert) {
            const { sanitizeHTML } = joint.util;
            // (the value is emptied: the element would be serialized with its original `is` value otherwise)
            const result = sanitizeHTML('<button is="x-button" type="button">b</button>');
            assert.equal(result, '<button type="button" is="">b</button>');
            const div = document.createElement('div');
            div.innerHTML = result;
            assert.notOk(div.innerHTML.includes('x-button'));
        });

        QUnit.test('unwraps the elements which are not allowed in their parent in the result', function(assert) {
            const { sanitizeHTML } = joint.util;
            // the nodes before the first unwrapped element are sanitized as well
            assert.equal(
                sanitizeHTML('<b onclick="x">a</b><x-el><i onclick="y">b</i></x-el><img is="x" src="data:text/html,x">'),
                '<b>a</b><i>b</i><img is="">'
            );
            // the content gets the rules of its parent in the result
            assert.equal(
                sanitizeHTML('<svg><x-el><rect></rect><foreignObject><p>t</p></foreignObject></x-el></svg>'),
                '<svg><rect></rect><foreignObject><p>t</p></foreignObject></svg>'
            );
            assert.equal(sanitizeHTML('<svg><desc><x-el><b>t</b></x-el></desc></svg>'), '<svg><desc>t</desc></svg>');
            // (`<?pi?>` is a processing instruction or a comment, depending on the browser)
            assert.equal(sanitizeHTML('<x-el><!--<b>--><?pi?>t</x-el><p>u</p>').replace('<!--?pi?-->', ''), 't<p>u</p>');
            // deeply nested
            assert.equal(sanitizeHTML('<x-el>'.repeat(500) + '<b>x</b>'.repeat(1000)), '<b>x</b>'.repeat(1000));
        });

        QUnit.test('unwraps many elements in linear time', function(assert) {
            const { sanitizeHTML } = joint.util;
            // (unwrapping the elements in place took about 15 s)
            const start = performance.now();
            const result = sanitizeHTML('<x-el>a</x-el>'.repeat(100000));
            const duration = performance.now() - start;
            assert.equal(result, 'a'.repeat(100000));
            assert.ok(duration < 2000, `took ${Math.round(duration)} ms`);
        });

        QUnit.test('removes the attributes which invoke a command on an element of the host document', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<button commandfor="d" command="show-modal">b</button>'), '<button>b</button>');
        });

        QUnit.test('keeps only `data:` images on elements which display them', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(sanitizeHTML('<img src="data:text/html,x">'), '<img>');
            assert.equal(sanitizeHTML('<svg><image href="data:application/xml,x"></image></svg>'), '<svg><image></image></svg>');
        });

        QUnit.test('checks the URL of all the URL attributes', function(assert) {
            const { sanitizeHTML } = joint.util;
            const dataURL = 'data:text/html,x';
            assert.equal(sanitizeHTML(`<form action="${dataURL}"><button formaction="${dataURL}">x</button></form>`), '<form><button>x</button></form>');
            assert.equal(sanitizeHTML(`<video poster="${dataURL}"></video>`), '<video></video>');
            assert.equal(sanitizeHTML(`<table background="${dataURL}"><tbody><tr><td>x</td></tr></tbody></table>`), '<table><tbody><tr><td>x</td></tr></tbody></table>');
            // `data:` images only on elements which display them
            assert.equal(sanitizeHTML('<form action="data:image/png;base64,AAAA"></form>'), '<form></form>');
        });

        QUnit.test('removes `attributeName` with a prefixed unsafe target', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(
                sanitizeHTML('<svg><animateTransform attributeName="x:onclick"></animateTransform><animateTransform attributeName="x:href"></animateTransform></svg>'),
                '<svg><animateTransform></animateTransform><animateTransform></animateTransform></svg>'
            );
        });

        QUnit.test('removes `data:` URLs from `<use>` elements', function(assert) {
            const { sanitizeHTML } = joint.util;
            assert.equal(
                sanitizeHTML('<svg><use href=" DATA:image/svg+xml,<svg/>#x"></use><use href="#x"></use></svg>'),
                '<svg><use></use><use href="#x"></use></svg>'
            );
        });
    });

    QUnit.module('graph JSON sanitization', function(hooks) {

        const XHTML = 'http://www.w3.org/1999/xhtml';
        const MATHML = 'http://www.w3.org/1998/Math/MathML';
        let paper;
        let graph;

        hooks.beforeEach(function() {
            graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            paper = new joint.dia.Paper({
                el: $('<div/>').appendTo('#qunit-fixture'),
                model: graph,
                cellViewNamespace: joint.shapes,
                async: false
            });
            delete window.__SANITIZE_PROBE__;
        });

        hooks.afterEach(function() {
            paper.remove();
            graph = null;
            paper = null;
            delete window.__SANITIZE_PROBE__;
        });

        const sanitizeCell = function(json, removed) {
            return joint.util.sanitizeCellJSON(json, {
                cellNamespace: joint.shapes,
                onRemove: (path, reason) => removed && removed.push(path.join('/'))
            });
        };

        const getAdvisoryJSON = function() {
            return {
                cells: [{
                    id: 'c1', type: 'standard.Rectangle',
                    markup: [{ tagName: 'script', namespaceURI: XHTML, children: ['window.__SANITIZE_PROBE__ = true;'] }]
                }, {
                    id: 'c2', type: 'standard.Rectangle',
                    attrs: { body: { onclick: 'window.__SANITIZE_PROBE__ = true' }}
                }, {
                    id: 'c3', type: 'standard.Rectangle',
                    markup: [{ tagName: 'foreignObject', children: [{
                        tagName: 'iframe', namespaceURI: XHTML,
                        attributes: { srcdoc: '<script>parent.__SANITIZE_PROBE__ = true;</script>' }
                    }] }]
                }]
            };
        };

        QUnit.test('the advisory probes are executed without sanitizing (positive control)', function(assert) {
            const json = getAdvisoryJSON();
            // (the `<iframe>` probe is asynchronous, it is not used here)
            json.cells.pop();
            graph.fromJSON(json);
            assert.ok(window.__SANITIZE_PROBE__, 'the `<script>` element is executed');
            delete window.__SANITIZE_PROBE__;
            paper.findViewByModel('c2').findNode('body').dispatchEvent(new MouseEvent('click', { bubbles: true }));
            assert.ok(window.__SANITIZE_PROBE__, 'the `onclick` attribute is executed');
        });

        QUnit.test('the advisory probes are not executed after sanitizing', function(assert) {
            const json = getAdvisoryJSON();
            graph.fromJSON(joint.util.sanitizeGraphJSON(json, { cellNamespace: joint.shapes }));
            const body = paper.findViewByModel('c2').findNode('body');
            body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            assert.equal(paper.svg.querySelectorAll('script, iframe, [onclick]').length, 0);
            assert.notOk(window.__SANITIZE_PROBE__);
            // the input is not modified
            assert.equal(json.cells[1].attrs.body.onclick, 'window.__SANITIZE_PROBE__ = true');
        });

        QUnit.test('the built-in shapes are not changed', function(assert) {
            Object.keys(joint.shapes.standard).forEach((name) => {
                const cell = new joint.shapes.standard[name]({ ports: { items: [{ id: 'port' }] }});
                if (cell.isLink()) cell.appendLabel({ attrs: { text: { text: 'label' }}});
                const json = cell.toJSON();
                const removed = [];
                assert.deepEqual(sanitizeCell(json, removed), json, name);
                assert.deepEqual(removed, [], name);
            });
        });

        QUnit.test('markup: only the allowed elements are kept', function(assert) {
            const removed = [];
            const { markup } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [
                    { tagName: 'rect', selector: 'body' },
                    { tagName: 'script', children: ['x'] },
                    { tagName: 'svg:script', children: ['x'] },
                    { tagName: 'div', namespaceURI: XHTML },
                    { tagName: 'math', namespaceURI: MATHML },
                    { tagName: 'unknown' },
                    { selector: 'invalid' },
                    { tagName: 'foreignObject', children: [
                        { tagName: 'div', namespaceURI: XHTML, children: [
                            'text',
                            { tagName: 'object' },
                            { tagName: 'span' },
                            { tagName: 'svg', namespaceURI: joint.V.namespace.svg, children: [{ tagName: 'circle' }] },
                            { tagName: 'rect', namespaceURI: joint.V.namespace.svg }
                        ] }
                    ] }
                ]
            }, removed);
            assert.deepEqual(markup, [
                { tagName: 'rect', selector: 'body' },
                { tagName: 'foreignObject', children: [
                    { tagName: 'div', namespaceURI: XHTML, children: [
                        'text',
                        { tagName: 'span' },
                        { tagName: 'svg', namespaceURI: joint.V.namespace.svg, children: [{ tagName: 'circle' }] }
                    ] }
                ] }
            ]);
            // (the removals inside the markup are reported at the markup property)
            assert.deepEqual(removed, ['markup', 'markup', 'markup', 'markup', 'markup', 'markup', 'markup', 'markup']);
        });

        QUnit.test('markup: the animations of any attribute are removed', function(assert) {
            const removed = [];
            const { markup } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [{ tagName: 'rect', selector: 'body', children: [
                    { tagName: 'animate', attributes: { attributeName: 'opacity', to: 0 }},
                    { tagName: 'set', attributes: { attributeName: 'fill', to: 'red' }},
                    { tagName: 'animateTransform', attributes: { attributeName: 'transform', type: 'rotate' }},
                    { tagName: 'animateMotion', attributes: { dur: '1s', path: 'M 0 0 L 10 10' }}
                ] }]
            }, removed);
            assert.deepEqual(markup[0].children.map((node) => node.tagName), ['animateTransform', 'animateMotion']);
            assert.deepEqual(removed, ['markup', 'markup']);
        });

        QUnit.test('markup: string markup is removed (the shape markup is used)', function(assert) {
            const removed = [];
            const json = sanitizeCell({ id: 'c', type: 'standard.Rectangle', markup: '<script>window.__SANITIZE_PROBE__ = true;</script>' }, removed);
            assert.notOk('markup' in json);
            assert.deepEqual(removed, ['markup']);
            graph.addCell(json);
            assert.ok(paper.findViewByModel('c').findNode('body'));
            assert.notOk(window.__SANITIZE_PROBE__);
        });

        QUnit.test('markup: unsafe attributes are removed', function(assert) {
            const { markup } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [
                    { tagName: 'a', attributes: { href: ' JavaScript:alert(1)', xlinkHref: 'javascript:alert(1)', onclick: 'x', fill: 'red' }},
                    { tagName: 'image', attributes: { href: 'data:image/png;base64,AAAA' }},
                    { tagName: 'use', attributes: { href: 'data:image/svg+xml,<svg/>#x' }},
                    { tagName: 'animateTransform', attributes: { attributeName: 'href', to: '#x' }},
                    { tagName: 'foreignObject', children: [{ tagName: 'img', namespaceURI: XHTML, attributes: { name: 'getElementById', ONERROR: 'x' }}] }
                ]
            });
            assert.deepEqual(markup[0].attributes, { fill: 'red' });
            assert.deepEqual(markup[1].attributes, { href: 'data:image/png;base64,AAAA' });
            assert.deepEqual(markup[2].attributes, {});
            assert.deepEqual(markup[3].attributes, { to: '#x' });
            assert.deepEqual(markup[4].children[0].attributes, {});
        });

        QUnit.test('markup: the DOMPurify-compatible element and attribute rules', function(assert) {
            const png = 'data:image/png;base64,AAAA';
            const { markup, attrs } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [
                    { tagName: 'a', selector: 'link', attributes: { href: png, title: 'javascript: a language' }},
                    { tagName: 'filter', children: [{ tagName: 'feImage', attributes: { href: png }}] },
                    { tagName: 'foreignObject', children: [{ tagName: 'div', namespaceURI: XHTML, children: [
                        { tagName: 'font', namespaceURI: XHTML, attributes: { color: 'red' }, children: ['x'] },
                        { tagName: 'strike', namespaceURI: XHTML, children: ['y'] }
                    ] }] }
                ],
                // an unknown element: raster images are kept, SVG images are not
                attrs: { '.unknown': { href: png, 'xlink:href': 'data:image/svg+xml,<svg/>' }}
            });
            assert.deepEqual(markup[0].attributes, { title: 'javascript: a language' });
            assert.deepEqual(markup[1].children[0].attributes, { href: png });
            assert.deepEqual(markup[2].children[0].children.map((node) => node.tagName), ['font', 'strike']);
            assert.deepEqual(attrs['.unknown'], { href: png });
        });

        QUnit.test('attrs: unsafe attributes are removed', function(assert) {
            const removed = [];
            const { attrs } = sanitizeCell({
                type: 'standard.Rectangle',
                attrs: {
                    body: { onclick: 'x', fill: 'red', xlinkHref: 'javascript:alert(1)', 'data-x': ['javascript:alert(1)'] },
                    label: { text: 'javascript: is a language', html: '<img src="x" onerror="alert(1)">', fontSize: 12 },
                    root: { title: 'javascript: in a tooltip' }
                }
            }, removed);
            assert.deepEqual(attrs.body, { fill: 'red' });
            assert.deepEqual(attrs.label, { text: 'javascript: is a language', fontSize: 12 });
            assert.deepEqual(attrs.root, { title: 'javascript: in a tooltip' });
            assert.deepEqual(removed, ['attrs/body/onclick', 'attrs/body/xlinkHref', 'attrs/body/data-x', 'attrs/label/html']);
        });

        QUnit.test('attrs: the rules of the selected element apply', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const { attrs } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [
                    { tagName: 'image', selector: 'image' },
                    { tagName: 'use', selector: 'use' },
                    { tagName: 'foreignObject', children: [{ tagName: 'img', namespaceURI: XHTML, selector: 'img', groupSelector: 'group' }] },
                    { tagName: 'rect', groupSelector: 'group' }
                ],
                attrs: {
                    image: { href: svgDataURL },
                    use: { href: svgDataURL },
                    img: { name: 'createElement', id: 'photo' },
                    group: { name: 'createElement' },
                    // a CSS selector (see `useCSSSelectors`) could select any element
                    '.unknown': { href: svgDataURL, name: 'createElement' },
                    // `attributeName` has an effect only on animations
                    root: { attributeName: 'href' }
                }
            });
            assert.deepEqual(attrs.image, { href: svgDataURL });
            assert.deepEqual(attrs.use, {});
            assert.deepEqual(attrs.img, { id: 'photo' });
            assert.deepEqual(attrs.group, {});
            assert.deepEqual(attrs['.unknown'], {});
            assert.deepEqual(attrs.root, {});
        });

        QUnit.test('attrs: selectors which are not strings select the same elements as strings', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const json = {
                id: 'c', type: 'standard.Rectangle',
                // (`parseDOMJSON()` uses the selectors as property keys, e.g. `5` -> `'5'`)
                markup: [
                    { tagName: 'image', selector: 5 },
                    { tagName: 'use', selector: [['u']] },
                    { tagName: 'foreignObject', children: [{ tagName: 'img', namespaceURI: XHTML, selector: null }] },
                ],
                attrs: {
                    5: { href: svgDataURL },
                    u: { href: svgDataURL },
                    null: { name: 'createElement', title: 'x' }
                }
            };
            const { attrs } = sanitizeCell(json);
            assert.deepEqual(attrs, { 5: { href: svgDataURL }, u: {}, null: { title: 'x' }});

            // (the unsanitized JSON: the views select the elements by the stringified selectors)
            json.attrs = {};
            graph.addCell(json);
            const view = paper.findViewByModel('c');
            assert.equal(view.findNodes('5')[0].tagName, 'image');
            assert.equal(view.findNodes('u')[0].tagName, 'use');
            assert.equal(view.findNodes('null')[0].tagName.toLowerCase(), 'img');
        });

        QUnit.test('attrs: group selectors get the rules of all elements', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const pngDataURL = 'data:image/png;base64,AAAA';
            const json = {
                id: 'c', type: 'standard.Rectangle',
                markup: [
                    { tagName: 'image', groupSelector: 'a' },
                    { tagName: 'use', groupSelector: [['a']] },
                    { tagName: 'image', groupSelector: 'b' }
                ],
                attrs: {
                    a: { href: svgDataURL },
                    // (even a group of image elements only)
                    b: { href: svgDataURL, title: 'x' },
                    // raster images are safe on any element
                    images: { href: pngDataURL }
                }
            };
            const removed = [];
            const { attrs } = sanitizeCell(json, removed);
            assert.deepEqual(attrs, { a: {}, b: { title: 'x' }, images: { href: pngDataURL }});
            assert.deepEqual(removed, ['attrs/a/href', 'attrs/b/href']);

            // (the unsanitized JSON: the views apply the group attributes to every element of the group)
            json.attrs = {};
            graph.addCell(json);
            const view = paper.findViewByModel('c');
            assert.deepEqual(view.findNodes('a').map((node) => node.tagName), ['image', 'use']);
        });

        QUnit.test('attrs: text path and annotations', function(assert) {
            const { attrs } = sanitizeCell({
                type: 'standard.Rectangle',
                attrs: {
                    label: {
                        text: 'abc',
                        textPath: { selector: 'body', startOffset: '50%', onclick: 'x' },
                        annotations: [{ start: 0, end: 1, attrs: { fill: 'red', onclick: 'x', 'xlink:href': 'javascript:x' }}]
                    }
                }
            });
            assert.deepEqual(attrs.label.textPath, { selector: 'body', startOffset: '50%' });
            assert.deepEqual(attrs.label.annotations, [{ start: 0, end: 1, attrs: { fill: 'red' }}]);
        });

        QUnit.test('attrs: markers, gradients, patterns and filters', function(assert) {
            const removed = [];
            const { attrs } = sanitizeCell({
                type: 'standard.Link',
                attrs: {
                    line: {
                        sourceMarker: { type: 'script' },
                        targetMarker: { type: 'path', d: 'M 0 0 L 10 10', onclick: 'x', attrs: { onload: 'x', markerUnits: 'strokeWidth' }},
                        vertexMarker: { markup: '<script/>' },
                        fill: { type: 'linearGradient', stops: [{ offset: 0, color: 'red' }, { offset: 1, color: 'javascript:x' }], attrs: { onclick: 'x', x1: 0 }},
                        stroke: { type: 'pattern', markup: '<script/>' },
                        filter: { name: 'constructor' }
                    },
                    wrapper: {
                        fill: { type: 'pattern', markup: [{ tagName: 'script' }, { tagName: 'rect', attributes: { onclick: 'x' }}], attrs: { width: 10 }},
                        stroke: { type: 'script' },
                        filter: { name: 'dropShadow', args: { dx: 2 }, attrs: { onclick: 'x' }}
                    }
                }
            }, removed);
            assert.deepEqual(attrs.line, {
                targetMarker: { type: 'path', d: 'M 0 0 L 10 10', attrs: { markerUnits: 'strokeWidth' }},
                vertexMarker: {},
                fill: { type: 'linearGradient', stops: [{ offset: 0, color: 'red' }, { offset: 1 }], attrs: { x1: 0 }}
            });
            assert.deepEqual(attrs.wrapper, {
                fill: { type: 'pattern', markup: [{ tagName: 'rect', attributes: {}}], attrs: { width: 10 }},
                filter: { name: 'dropShadow', args: { dx: 2 }, attrs: {}}
            });
            assert.ok(removed.includes('attrs/line/sourceMarker'));
            assert.ok(removed.includes('attrs/line/stroke'));
            assert.ok(removed.includes('attrs/line/filter'));
            assert.ok(removed.includes('attrs/wrapper/stroke'));
        });

        QUnit.test('ports: markup and attrs', function(assert) {
            const { ports, portMarkup } = sanitizeCell({
                type: 'standard.Rectangle',
                portMarkup: '<script/>',
                ports: {
                    groups: {
                        in: {
                            markup: [{ tagName: 'use', selector: 'portBody' }, { tagName: 'script' }],
                            label: { markup: '<script/>' },
                            attrs: { portBody: { href: 'data:image/svg+xml,<svg/>', onclick: 'x' }}
                        }
                    },
                    items: [
                        { id: 'a', group: 'in', attrs: { portBody: { href: 'data:image/svg+xml,<svg/>' }, labelText: { text: 'a', onclick: 'x' }}},
                        { id: 'b', markup: [{ tagName: 'image', selector: 'portBody' }], attrs: { portBody: { href: 'data:image/svg+xml,<svg/>' }}}
                    ]
                }
            });
            assert.equal(portMarkup, undefined);
            assert.deepEqual(ports.groups.in, {
                markup: [{ tagName: 'use', selector: 'portBody' }],
                label: {},
                attrs: { portBody: {}}
            });
            assert.deepEqual(ports.items[0].attrs, { portBody: {}, labelText: { text: 'a' }});
            assert.deepEqual(ports.items[1].attrs, { portBody: { href: 'data:image/svg+xml,<svg/>' }});
        });

        QUnit.test('ports: a label markup which would be merged with the group label markup is removed', function(assert) {
            const groupLabelMarkup = [{ tagName: 'text', selector: 'groupText' }];
            const removed = [];
            const json = sanitizeCell({
                id: 'c', type: 'standard.Rectangle',
                ports: {
                    groups: {
                        g: { label: { markup: groupLabelMarkup }},
                        // (`null` replaces the markup of the default group, if any)
                        n: { label: { markup: null }}
                    },
                    items: [
                        { id: 'a', group: 'g', label: { markup: [{ tagName: 'image', selector: 'icon' }] }},
                        { id: 'b', group: 'n', label: { markup: [{ tagName: 'image', selector: 'icon' }] }},
                        { id: 'c', label: { markup: [{ tagName: 'image', selector: 'icon' }] }}
                    ]
                }
            }, removed);
            assert.deepEqual(removed, ['ports/items/0/label/markup']);
            assert.deepEqual(json.ports.items.map((item) => item.label), [
                {},
                { markup: [{ tagName: 'image', selector: 'icon' }] },
                { markup: [{ tagName: 'image', selector: 'icon' }] }
            ]);
            assert.deepEqual(json.ports.groups.g.label.markup, groupLabelMarkup);

            // the group label markup is rendered
            graph.addCell(json);
            const view = paper.findViewByModel('c');
            assert.equal(view.findPortNode('a', 'groupText').tagName, 'text');
            assert.equal(view.findPortNode('a', 'icon'), null);
        });

        QUnit.test('links: labels and default label', function(assert) {
            const { labels, defaultLabel, labelMarkup } = sanitizeCell({
                type: 'standard.Link',
                labelMarkup: '<script/>',
                defaultLabel: { markup: [{ tagName: 'use', selector: 'body' }], attrs: { body: { href: 'data:image/svg+xml,<svg/>' }}},
                labels: [
                    { attrs: { body: { href: 'data:image/svg+xml,<svg/>' }}},
                    { markup: '<script/>', attrs: { text: { text: 'x', onclick: 'x' }}},
                    { markup: [{ tagName: 'image', selector: 'body' }], attrs: { body: { href: 'data:image/svg+xml,<svg/>' }}}
                ]
            });
            assert.equal(labelMarkup, undefined);
            assert.deepEqual(defaultLabel.attrs, { body: {}});
            assert.deepEqual(labels[0].attrs, { body: {}});
            assert.deepEqual(labels[1], { attrs: { text: { text: 'x' }}});
            assert.deepEqual(labels[2].attrs, { body: { href: 'data:image/svg+xml,<svg/>' }});
        });

        QUnit.test('an unknown cell type is sanitized with the rules of all elements', function(assert) {
            const json = joint.util.sanitizeGraphJSON({
                cells: [{ id: 'x', type: 'unknown.Shape', markup: '<script/>', attrs: { body: { onclick: 'x', href: 'data:image/svg+xml,<svg/>' }}, labels: [{ attrs: { text: { onclick: 'x' }}}] }]
            });
            assert.deepEqual(json.cells[0], { id: 'x', type: 'unknown.Shape', attrs: { body: {}}, labels: [{ attrs: { text: {}}}] });
            // still rejected by the graph
            assert.throws(() => graph.fromJSON(json), /Could not find cell constructor/);
        });

        QUnit.test('`__proto__` keys are removed', function(assert) {
            const removed = [];
            const json = sanitizeCell(JSON.parse(`{
                "type": "standard.Rectangle",
                "__proto__": { "markup": [{ "tagName": "script" }] },
                "markup": [{ "tagName": "rect", "selector": "body", "attributes": { "__proto__": { "onclick": "x" }}}],
                "attrs": { "__proto__": { "onclick": "x" }, "body": { "__proto__": { "onclick": "x" }, "fill": "red" }}
            }`), removed);
            // (the `__proto__` keys are reported at the nearest cell property)
            assert.deepEqual(removed.sort(), ['__proto__', 'attrs/__proto__', 'attrs/__proto__', 'markup/__proto__']);
            assert.deepEqual(json, {
                type: 'standard.Rectangle',
                markup: [{ tagName: 'rect', selector: 'body', attributes: {}}],
                attrs: { body: { fill: 'red' }}
            });
            [json, json.markup[0].attributes, json.attrs, json.attrs.body].forEach((obj) => {
                assert.equal(Object.getPrototypeOf(obj), Object.prototype);
            });
        });

        QUnit.test('attrs: the values of custom attributes are checked', function(assert) {
            const { attrs } = sanitizeCell({
                type: 'standard.Rectangle',
                attrs: { body: { myLink: { url: 'javascript:x' }, myList: [{ url: 'vbscript:x' }], myOptions: { size: 1, list: [1, 'a'] }}}
            });
            assert.deepEqual(attrs.body, { myOptions: { size: 1, list: [1, 'a'] }});
        });

        QUnit.test('attrs: the elements are resolved from the markup of the shape defaults and of the ports', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const DefaultsMarkup = joint.dia.Element.extend({
                defaults: { type: 'test.DefaultsMarkup', markup: [{ tagName: 'use', selector: 'icon' }, { tagName: 'image', selector: 'image' }] }
            });
            const cellNamespace = { test: { DefaultsMarkup }};
            const element = joint.util.sanitizeCellJSON({
                type: 'test.DefaultsMarkup',
                attrs: { icon: { href: svgDataURL }, image: { href: svgDataURL }},
                ports: { items: [{ id: 'p', markup: [{ tagName: 'use', selector: 'body', groupSelector: ['a', 'b'] }], attrs: { portRoot: { href: svgDataURL }, b: { href: svgDataURL }}}] }
            }, { cellNamespace });
            assert.deepEqual(element.attrs, { icon: {}, image: { href: svgDataURL }});
            assert.deepEqual(element.ports.items[0].attrs, { portRoot: {}, b: {}});
            const { attrs } = sanitizeCell({
                type: 'standard.Link',
                attrs: { line: {
                    sourceMarker: { markup: [{ tagName: 'use' }], href: svgDataURL },
                    targetMarker: { markup: [{ tagName: 'image' }], href: svgDataURL }
                }}
            });
            // (the content of markers gets the rules of all elements)
            assert.deepEqual(attrs.line.sourceMarker, { markup: [{ tagName: 'use' }] });
            assert.deepEqual(attrs.line.targetMarker, { markup: [{ tagName: 'image' }] });
        });

        QUnit.test('attrs: inherited attributes get the rules of all elements', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><a id="x" href="javascript:alert(1)"><rect width="9" height="9"/></a></svg>#x';
            const pngDataURL = 'data:image/png;base64,AAAA';
            const json = joint.util.sanitizeGraphJSON({ cells: [{
                id: 'e', type: 'standard.Rectangle', position: { x: 10, y: 10 },
                ports: {
                    groups: { g: { markup: [{ tagName: 'image', selector: 'icon' }], attrs: { icon: { href: svgDataURL }, body: { href: pngDataURL }}}},
                    // the group `attrs` are merged into the port with its own markup
                    items: [{ id: 'p', group: 'g', markup: [{ tagName: 'use', selector: 'icon' }] }]
                }
            }, {
                id: 'l', type: 'standard.Link', source: { x: 0, y: 0 }, target: { x: 99, y: 99 },
                defaultLabel: { markup: [{ tagName: 'image', selector: 'icon' }], attrs: { icon: { href: svgDataURL }}},
                // the default label `attrs` are merged into the label with its own markup
                labels: [{ markup: [{ tagName: 'use', selector: 'icon' }] }]
            }] }, { cellNamespace: joint.shapes });
            assert.deepEqual(json.cells[0].ports.groups.g.attrs, { icon: {}, body: { href: pngDataURL }});
            assert.deepEqual(json.cells[1].defaultLabel.attrs, { icon: {}});
            graph.fromJSON(json);
            const dataUses = Array.from(paper.svg.querySelectorAll('use')).filter((node) => node.hasAttribute('href'));
            assert.equal(dataUses.length, 0);
        });

        QUnit.test('sanitizeCellAttributes(): a markup which would make the existing attributes unsafe is removed', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            // set by the application (trusted)
            const cell = new joint.shapes.standard.Rectangle({
                markup: [{ tagName: 'image', selector: 'icon' }, { tagName: 'foreignObject', children: [{ tagName: 'div', namespaceURI: XHTML, selector: 'div' }] }],
                attrs: { icon: { href: svgDataURL }, div: { html: '<b>trusted</b>' }}
            });
            const removed = [];
            const onRemove = (path) => removed.push(path.join('/'));
            // `icon` would select a `<use>` element
            assert.deepEqual(
                joint.util.sanitizeCellAttributes(cell, { markup: [{ tagName: 'use', selector: 'icon' }], size: { width: 10, height: 10 }}, { onRemove }),
                { size: { width: 10, height: 10 }}
            );
            assert.deepEqual(removed, ['markup']);
            // `icon` still selects an `<image>` element (the trusted `html` attribute does not matter)
            const markup = [{ tagName: 'image', selector: 'icon' }, { tagName: 'rect', selector: 'body' }];
            assert.deepEqual(joint.util.sanitizeCellAttributes(cell, { markup }), { markup });
            // the default label markup of a link
            const link = new joint.shapes.standard.Link({
                defaultLabel: { markup: [{ tagName: 'image', selector: 'icon' }] },
                labels: [{ attrs: { icon: { href: svgDataURL }}}]
            });
            assert.deepEqual(joint.util.sanitizeCellAttributes(link, { defaultLabel: { markup: [{ tagName: 'use', selector: 'icon' }] }}), {});
        });

        QUnit.module('lenient mode (`strict: false`)', function() {

            const sanitizeLenient = function(json, removed) {
                return joint.util.sanitizeCellJSON(json, {
                    cellNamespace: joint.shapes,
                    strict: false,
                    onRemove: (path, reason) => removed && removed.push(path.join('/') + ': ' + reason)
                });
            };

            QUnit.test('string markup is sanitized', function(assert) {
                const removed = [];
                const json = sanitizeLenient({
                    id: 'c',
                    type: 'standard.Rectangle',
                    markup: '<rect class="body" onclick="window.__SANITIZE_PROBE__ = true" fill="red"/><script>window.__SANITIZE_PROBE__ = true;</script><a xlink:href=" JavaScript:x"><text>t</text></a>'
                }, removed);
                assert.equal(json.markup, '<rect class="body" fill="red"/><a><text>t</text></a>');
                assert.deepEqual(removed, [
                    'markup: attribute `onclick` is not allowed',
                    'markup: element `script` is not allowed',
                    'markup: attribute `xlink:href` is not allowed'
                ]);
                graph.addCell(json);
                const view = paper.findViewByModel('c');
                assert.ok(view.el.querySelector('rect.body'));
                assert.equal(view.el.querySelectorAll('script, [onclick]').length, 0);
            });

            QUnit.test('string markup: special cases', function(assert) {
                const sanitizeMarkup = (markup) => {
                    const removed = [];
                    const json = sanitizeLenient({ type: 'standard.Rectangle', markup }, removed);
                    return [json.markup, removed];
                };
                // a tag name
                assert.deepEqual(sanitizeMarkup('rect'), ['rect', []]);
                // no markup
                assert.deepEqual(sanitizeMarkup('  '), ['  ', []]);
                assert.deepEqual(sanitizeMarkup('script'), [undefined, ['markup: element `script` is not allowed']]);
                // invalid XML
                assert.deepEqual(sanitizeMarkup('<rect>'), [undefined, ['markup: invalid markup']]);
                // nothing left
                assert.deepEqual(sanitizeMarkup('<script/>'), [undefined, ['markup: element `script` is not allowed', 'markup: no elements left']]);
                // CDATA sections and processing instructions
                assert.deepEqual(sanitizeMarkup('<style><![CDATA[ a > b {} ]]></style><?x y?><rect/>'), ['<style> a &gt; b {} </style><rect/>', ['markup: unsupported node']]);
                // HTML content
                assert.deepEqual(
                    sanitizeMarkup('<foreignObject><div xmlns="http://www.w3.org/1999/xhtml" onclick="x"><img src="x" onerror="x"/><iframe/></div></foreignObject>'),
                    ['<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" /></div></foreignObject>', [
                        'markup: attribute `onclick` is not allowed',
                        'markup: attribute `onerror` is not allowed',
                        'markup: element `iframe` is not allowed'
                    ]]
                );
                // a `<form>` whose properties are clobbered by its controls
                assert.deepEqual(
                    sanitizeMarkup('<foreignObject><form xmlns="http://www.w3.org/1999/xhtml" onsubmit="x"><input name="getAttributeNames"/><input name="childNodes"/></form></foreignObject>'),
                    ['<foreignObject><form xmlns="http://www.w3.org/1999/xhtml"><input name="getAttributeNames" /><input name="childNodes" /></form></foreignObject>', ['markup: attribute `onsubmit` is not allowed']]
                );
            });

            QUnit.test('string markup of ports, labels, markers and patterns', function(assert) {
                const element = sanitizeLenient({
                    type: 'standard.Rectangle',
                    portMarkup: '<circle r="5" onclick="x"/>',
                    ports: { items: [{ id: 'p', markup: '<rect/><script/>', label: { markup: '<text onclick="x"/>' }}] }
                });
                assert.equal(element.portMarkup, '<circle r="5"/>');
                assert.equal(element.ports.items[0].markup, '<rect/>');
                assert.equal(element.ports.items[0].label.markup, '<text/>');
                const link = sanitizeLenient({
                    type: 'standard.Link',
                    labels: [{ markup: '<text onclick="x">a</text>' }],
                    attrs: { line: {
                        targetMarker: { markup: '<path d="M 0 0" onclick="x"/>' },
                        stroke: { type: 'pattern', markup: '<rect onclick="x"/>' }
                    }}
                });
                assert.equal(link.labels[0].markup, '<text>a</text>');
                assert.equal(link.attrs.line.targetMarker.markup, '<path d="M 0 0"/>');
                assert.equal(link.attrs.line.stroke.markup, '<rect/>');
            });

            QUnit.test('the `html` attribute is sanitized on known HTML elements', function(assert) {
                const removed = [];
                const json = sanitizeLenient({
                    id: 'c',
                    type: 'standard.Rectangle',
                    markup: [{ tagName: 'foreignObject', children: [
                        { tagName: 'div', namespaceURI: XHTML, selector: 'div' },
                        { tagName: 'table', namespaceURI: XHTML, selector: 'table' },
                        { tagName: 'span', namespaceURI: XHTML, selector: 'span' }
                    ] }, { tagName: 'g', selector: 'group' }],
                    attrs: {
                        div: { html: '<b>x</b><img src="x" onerror="x">' },
                        table: { html: '<tr><td>x</td></tr>' },
                        group: { html: '<b>x</b>' },
                        '.unknown': { html: '<b>x</b>' },
                        span: { html: '<form><input name="getAttributeNames"></form>' }
                    }
                }, removed);
                assert.deepEqual(json.attrs, { div: { html: '<b>x</b><img src="x">' }, table: {}, group: {}, '.unknown': {}, span: { html: '<form><input name="getAttributeNames"></form>' }});
                assert.deepEqual(removed, [
                    'attrs/div/html: unsafe HTML',
                    'attrs/table/html: the `html` attribute is allowed only on known HTML elements',
                    'attrs/group/html: the `html` attribute is allowed only on known HTML elements',
                    'attrs/.unknown/html: the `html` attribute is allowed only on known HTML elements'
                ]);
                graph.addCell(json);
                assert.equal(paper.findViewByModel('c').findNode('div').innerHTML, '<b>x</b><img src="x">');
            });

            QUnit.test('string markup: HTML elements only inside `<foreignObject>`', function(assert) {
                const removed = [];
                const { markup } = sanitizeLenient({
                    type: 'standard.Rectangle',
                    markup: '<div xmlns="http://www.w3.org/1999/xhtml"/><g><div xmlns="http://www.w3.org/1999/xhtml"/><rect/></g>'
                }, removed);
                assert.equal(markup, '<g><rect/></g>');
                assert.deepEqual(removed, ['markup: element `div` is not allowed', 'markup: element `div` is not allowed']);
            });

            QUnit.test('string markup: the content of a `<form>` which clobbers `childNodes` is sanitized', function(assert) {
                const { markup } = sanitizeLenient({
                    type: 'standard.Rectangle',
                    markup: '<foreignObject><form xmlns="http://www.w3.org/1999/xhtml"><input name="childNodes"/><img src="x" onerror="x"/></form></foreignObject>'
                });
                assert.notOk(markup.includes('onerror'), markup);
                assert.ok(markup.includes('<img src="x"'), markup);
            });

            QUnit.test('string markup of a marker: the content elements are not known', function(assert) {
                const { attrs } = sanitizeLenient({
                    type: 'standard.Link',
                    attrs: { line: { sourceMarker: { markup: '<use/>', href: 'data:image/svg+xml,<svg/>' }}}
                });
                assert.deepEqual(attrs.line.sourceMarker, { markup: '<use/>' });
            });

            QUnit.test('the `html` attribute is not allowed on SVG elements', function(assert) {
                const removed = [];
                const { attrs } = sanitizeLenient({
                    type: 'standard.Rectangle',
                    markup: [{ tagName: 'a', selector: 'link' }, { tagName: 'text', selector: 'label' }],
                    attrs: { link: { html: '<b>x</b>' }, label: { html: '<b>x</b>' }}
                }, removed);
                assert.deepEqual(attrs, { link: {}, label: {}});
                assert.equal(removed.length, 2);
            });

            QUnit.test('the `html` attribute: only the removed parts are reported', function(assert) {
                const removed = [];
                const json = sanitizeLenient({
                    type: 'standard.Rectangle',
                    markup: [{ tagName: 'foreignObject', children: [{ tagName: 'div', namespaceURI: XHTML, selector: 'div' }] }],
                    attrs: { div: { html: '<p>a & b<table><tr><td>x</td></tr></table></p>' }}
                }, removed);
                // (the HTML is normalized, but nothing is removed)
                assert.equal(json.attrs.div.html, '<p>a &amp; b</p><table><tbody><tr><td>x</td></tr></tbody></table><p></p>');
                assert.deepEqual(removed, []);
            });

            QUnit.test('the `html` attribute: an unsafe node is reported (not only an unsafe attribute)', function(assert) {
                const removed = [];
                const json = sanitizeLenient({
                    type: 'standard.Rectangle',
                    markup: [{ tagName: 'foreignObject', children: [{ tagName: 'div', namespaceURI: XHTML, selector: 'div' }] }],
                    // (the comment contains markup, it is removed; the `html` attribute is kept)
                    attrs: { div: { html: '<b>x</b><!--<img src=y>-->' }}
                }, removed);
                assert.equal(json.attrs.div.html, '<b>x</b>');
                assert.deepEqual(removed, ['attrs/div/html: unsafe HTML']);
            });

            QUnit.test('sanitizeCellAttributes(): a markup which would make the existing `html` attribute unsafe is removed', function(assert) {
                const cell = new joint.shapes.standard.Rectangle({
                    markup: [{ tagName: 'foreignObject', children: [{ tagName: 'div', namespaceURI: XHTML, selector: 'div' }] }],
                    attrs: { div: { html: '<b>x</b>' }}
                });
                const markup = [{ tagName: 'g', selector: 'div' }];
                assert.deepEqual(joint.util.sanitizeCellAttributes(cell, { markup }, { strict: false }), {});
                // (the `html` attribute is removed in both cases in strict mode)
                assert.deepEqual(joint.util.sanitizeCellAttributes(cell, { markup }), { markup });
            });

            QUnit.test('values of an unexpected type are removed as in strict mode', function(assert) {
                const removed = [];
                const json = sanitizeLenient({
                    type: 'standard.Rectangle',
                    markup: { length: 1, 0: { tagName: 'script' }},
                    attrs: [{ onclick: 'x' }],
                    ports: { groups: [{}], items: [{ id: 'p', markup: [{ tagName: 'script' }] }] }
                }, removed);
                assert.deepEqual(json, { type: 'standard.Rectangle', ports: { items: [{ id: 'p' }] }});
                assert.deepEqual(removed.sort(), [
                    'attrs: invalid attributes',
                    'markup: invalid markup',
                    'ports/groups: invalid port groups',
                    'ports/items/0/markup: element `script` is not allowed',
                    'ports/items/0/markup: no allowed elements'
                ]);
            });

            QUnit.test('the same markup is reported for every cell', function(assert) {
                const removed = [];
                joint.util.sanitizeGraphJSON({ cells: [
                    { type: 'standard.Rectangle', markup: '<rect onclick="x"/>' },
                    { type: 'standard.Rectangle', markup: '<rect onclick="x"/>' }
                ] }, { cellNamespace: joint.shapes, strict: false, onRemove: (path) => removed.push(path.join('/')) });
                assert.deepEqual(removed, ['cells/0/markup', 'cells/1/markup']);
            });

            QUnit.test('the built-in shapes are not changed', function(assert) {
                Object.keys(joint.shapes.standard).forEach((name) => {
                    const json = new joint.shapes.standard[name]({ ports: { items: [{ id: 'port' }] }}).toJSON();
                    const removed = [];
                    assert.deepEqual(sanitizeLenient(json, removed), json, name);
                    assert.deepEqual(removed, [], name);
                });
            });
        });

        QUnit.test('the removed parts are reported', function(assert) {
            const reports = [];
            joint.util.sanitizeGraphJSON({
                cells: [{ type: 'standard.Rectangle', attrs: { body: { onclick: 'x' }}}]
            }, { cellNamespace: joint.shapes, onRemove: (path, reason) => reports.push([path, reason]) });
            assert.deepEqual(reports, [[['cells', 0, 'attrs', 'body', 'onclick'], 'unsafe attribute']]);
        });

        QUnit.test('sanitizeCellAttributes(): the shape defaults do not apply to an existing cell', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            // (the defaults are merged only when a cell is created; `cell.set()` replaces the attributes)
            const Shape = joint.dia.Element.extend({
                defaults: {
                    type: 'test.ExistingDefaults',
                    size: { width: 10, height: 10 },
                    markup: [{ tagName: 'image', selector: 'icon' }],
                    portMarkup: [{ tagName: 'use', selector: 'icon' }],
                    ports: { groups: { g: { markup: [{ tagName: 'image', selector: 'icon' }] }}}
                },
                markup: [{ tagName: 'use', selector: 'icon' }]
            });
            const ports = { items: [{ id: 'p', group: 'g', attrs: { icon: { href: svgDataURL }}}] };
            const cell = new Shape({ id: 'e', markup: null });
            graph.addCell(cell);
            // the port group `g` of the shape is replaced by `cell.set()`
            const update = joint.util.sanitizeCellAttributes(cell, { ports, attrs: { icon: { href: svgDataURL }}});
            assert.deepEqual(update.ports.items[0].attrs, { icon: {}});
            // the `null` markup of the cell is the prototype markup (not the default markup)
            assert.deepEqual(update.attrs, { icon: {}});
            cell.set(update);
            const dataUses = Array.from(paper.findViewByModel('e').el.querySelectorAll('use')).filter((node) => node.hasAttribute('href'));
            assert.equal(dataUses.length, 0);
            // (a new cell gets the defaults)
            const json = joint.util.sanitizeCellJSON({ type: 'test.ExistingDefaults', ports, attrs: { icon: { href: svgDataURL }}}, { cellNamespace: { test: { ExistingDefaults: Shape }}});
            assert.deepEqual(json.ports.items[0].attrs, { icon: { href: svgDataURL }});
            assert.deepEqual(json.attrs, { icon: { href: svgDataURL }});
        });

        QUnit.test('sanitizeCellAttributes(): partial updates of an existing cell', function(assert) {
            const cell = new joint.shapes.standard.Rectangle({
                markup: [{ tagName: 'use', selector: 'body' }]
            });
            // the existing markup of the cell is used
            assert.deepEqual(
                joint.util.sanitizeCellAttributes(cell, { attrs: { body: { href: 'data:image/svg+xml,<svg/>', fill: 'red' }}}),
                { attrs: { body: { fill: 'red' }}}
            );
            // the new markup is used
            assert.deepEqual(
                joint.util.sanitizeCellAttributes(cell, {
                    markup: [{ tagName: 'image', selector: 'body' }, { tagName: 'script' }],
                    attrs: { body: { href: 'data:image/svg+xml,<svg/>' }}
                }),
                { markup: [{ tagName: 'image', selector: 'body' }], attrs: { body: { href: 'data:image/svg+xml,<svg/>' }}}
            );
            // a path-based change (`items` as an object)
            const element = new joint.shapes.standard.Rectangle({ ports: { items: [{ id: 'a' }] }});
            const change = joint.util.setByPath({}, 'ports/items/0/attrs/circle/onclick', 'x');
            assert.deepEqual(joint.util.sanitizeCellAttributes(element, change), { ports: { items: { 0: { attrs: { circle: {}}}}}});
            const link = new joint.shapes.standard.Link();
            assert.deepEqual(
                joint.util.sanitizeCellAttributes(link, joint.util.setByPath({}, 'labels/0/attrs/text/onclick', 'x')),
                { labels: { 0: { attrs: { text: {}}}}}
            );
        });

        QUnit.test('`cells` which are not an array are removed', function(assert) {
            const reports = [];
            const onRemove = (path, reason) => reports.push(`${path.join('/')}: ${reason}`);
            const cell = { id: 'a', type: 'standard.Rectangle', markup: [{ tagName: 'script' }] };
            // (`graph.fromJSON()` loads array-like cells)
            const json = joint.util.sanitizeGraphJSON({ cells: { length: 1, 0: cell }}, { cellNamespace: joint.shapes, onRemove });
            assert.notOk('cells' in json);
            assert.deepEqual(reports, ['cells: invalid cells']);
            assert.throws(() => graph.fromJSON(json), /must contain cells/);
            // the cells which are not objects are removed (e.g. nested arrays, which are flattened by the graph)
            reports.length = 0;
            const { cells } = joint.util.sanitizeGraphJSON({
                cells: [null, [cell], 'x', { id: 'b', type: 'standard.Rectangle' }]
            }, { cellNamespace: joint.shapes, onRemove });
            assert.deepEqual(cells, [{ id: 'b', type: 'standard.Rectangle' }]);
            assert.deepEqual(reports, ['cells/0: invalid cell', 'cells/1: invalid cell', 'cells/2: invalid cell']);
        });

        QUnit.test('a top-level `__proto__` key does not provide inherited `cells`', function(assert) {
            const reports = [];
            const json = joint.util.sanitizeGraphJSON(JSON.parse(`{
                "__proto__": { "cells": [{ "id": "a", "type": "standard.Rectangle", "markup": [{ "tagName": "script" }] }] },
                "name": "x"
            }`), { cellNamespace: joint.shapes, onRemove: (path) => reports.push(path.join('/')) });
            assert.equal(Object.getPrototypeOf(json), Object.prototype);
            assert.equal(json.cells, undefined);
            assert.deepEqual(json, { name: 'x' });
            assert.deepEqual(reports, ['__proto__']);
        });

        QUnit.test('markup which is not an array or a string is removed', function(assert) {
            const removed = [];
            // (rendered as JSON markup)
            const arrayLike = { length: 1, 0: { tagName: 'script' }};
            const json = sanitizeCell({
                type: 'standard.Link',
                markup: arrayLike,
                labelMarkup: arrayLike,
                attrs: { line: {
                    sourceMarker: { markup: arrayLike },
                    targetMarker: { markup: 1 },
                    fill: { type: 'pattern', markup: arrayLike }
                }}
            }, removed);
            assert.deepEqual(json, { type: 'standard.Link', attrs: { line: { sourceMarker: {}, targetMarker: {}}}});
            assert.deepEqual(removed.sort(), [
                'attrs/line/fill',
                'attrs/line/fill/markup',
                'attrs/line/sourceMarker/markup',
                'attrs/line/targetMarker/markup',
                'labelMarkup',
                'markup'
            ]);
            const { portMarkup, portLabelMarkup } = sanitizeCell({ type: 'standard.Rectangle', portMarkup: arrayLike, portLabelMarkup: {}});
            assert.equal(portMarkup, undefined);
            assert.equal(portLabelMarkup, undefined);
        });

        QUnit.test('markup without allowed elements is removed (the default markup is used)', function(assert) {
            const removed = [];
            const json = joint.util.sanitizeGraphJSON({ cells: [{
                id: 'e', type: 'standard.Rectangle', position: { x: 10, y: 10 }, size: { width: 10, height: 10 },
                markup: [{ tagName: 'script' }],
                ports: { items: [{ id: 'p', markup: [{ tagName: 'script' }, 'text'], label: { markup: [{ tagName: 'script' }] }}] }
            }, {
                id: 'l', type: 'standard.Link', source: { x: 0, y: 0 }, target: { x: 99, y: 99 },
                labels: [{ markup: [{ tagName: 'script' }], attrs: { text: { text: 'x' }}}]
            }] }, { cellNamespace: joint.shapes, onRemove: (path) => removed.push(path.join('/')) });
            assert.notOk('markup' in json.cells[0]);
            assert.deepEqual(json.cells[0].ports.items[0], { id: 'p', label: {}});
            assert.deepEqual(json.cells[1].labels[0], { attrs: { text: { text: 'x' }}});
            assert.ok(removed.includes('cells/0/ports/items/0/markup'));
            // (`markup: []` would throw when the port or the label is rendered)
            graph.fromJSON(json);
            assert.ok(paper.findViewByModel('e').findNode('body'));
            assert.equal(paper.svg.querySelectorAll('.joint-port').length, 1);
            assert.equal(paper.findViewByModel('l').el.querySelectorAll('.label').length, 1);
            // a markup which was empty is kept
            assert.deepEqual(sanitizeCell({ type: 'standard.Rectangle', markup: [] }).markup, []);
        });

        QUnit.test('attributes which are not an object are removed', function(assert) {
            const removed = [];
            // (an array would be applied to the elements selected by its indexes)
            const element = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [{ tagName: 'rect', selector: '0', attributes: ['x'] }],
                attrs: [{ onclick: 'x' }],
                ports: { items: [{ id: 'p', attrs: [{ onclick: 'x' }] }] }
            }, removed);
            assert.deepEqual(element, { type: 'standard.Rectangle', markup: [{ tagName: 'rect', selector: '0' }], ports: { items: [{ id: 'p' }] }});
            assert.deepEqual(removed.sort(), ['attrs', 'markup/attributes', 'ports/items/0/attrs']);
            removed.length = 0;
            const link = sanitizeCell({
                type: 'standard.Link',
                defaultLabel: { attrs: 'x' },
                labels: [{ attrs: [{ onclick: 'x' }] }],
                attrs: { line: {
                    targetMarker: { type: 'path', attrs: ['x'] },
                    fill: { type: 'linearGradient', attrs: [{ onclick: 'x' }] },
                    filter: { name: 'dropShadow', attrs: 'x' },
                    // `null` attributes are kept (e.g. to unset an attribute)
                    stroke: null
                }}
            }, removed);
            assert.deepEqual(link.defaultLabel, {});
            assert.deepEqual(link.labels, [{}]);
            assert.deepEqual(link.attrs.line, { targetMarker: { type: 'path' }, fill: { type: 'linearGradient' }, filter: { name: 'dropShadow' }, stroke: null });
            assert.deepEqual(removed.sort(), [
                'attrs/line/fill/attrs', 'attrs/line/filter/attrs', 'attrs/line/targetMarker/attrs', 'defaultLabel/attrs', 'labels/0/attrs'
            ]);
        });

        QUnit.test('attrs: a single annotation (not in an array) is checked', function(assert) {
            const { attrs } = sanitizeCell({
                type: 'standard.Rectangle',
                attrs: {
                    label: { text: 'abc', annotations: { start: 0, end: 1, attrs: { fill: 'red', onclick: 'x' }}},
                    body: { annotations: { start: 0, end: 1, attrs: [{ onclick: 'x' }] }}
                }
            });
            assert.deepEqual(attrs.label.annotations, { start: 0, end: 1, attrs: { fill: 'red' }});
            assert.deepEqual(attrs.body.annotations, { start: 0, end: 1 });
        });

        QUnit.test('ports: the attrs of the port label position are checked', function(assert) {
            const removed = [];
            const { ports } = sanitizeCell({
                type: 'standard.Rectangle',
                ports: {
                    groups: { g: { label: { position: { name: 'left', args: { attrs: { labelText: { onclick: 'x', fill: 'red' }}}}}}},
                    items: [
                        { id: 'a', group: 'g', label: { position: { name: 'right', args: { x: 1, attrs: { labelText: { onclick: 'x', fill: 'blue' }}}}}},
                        // (without a name, the group label layout is used)
                        { id: 'b', group: 'g', label: { position: { args: { attrs: [{ onclick: 'x' }] }}}}
                    ]
                }
            }, removed);
            assert.deepEqual(ports.groups.g.label.position.args, { attrs: { labelText: { fill: 'red' }}});
            assert.deepEqual(ports.items[0].label.position.args, { x: 1, attrs: { labelText: { fill: 'blue' }}});
            assert.deepEqual(ports.items[1].label.position.args, {});
            assert.deepEqual(removed.sort(), [
                'ports/groups/g/label/position/args/attrs/labelText/onclick',
                'ports/items/0/label/position/args/attrs/labelText/onclick',
                'ports/items/1/label/position/args/attrs'
            ]);
        });

        QUnit.test('ports: groups which are not an object are removed', function(assert) {
            const removed = [];
            // (the groups are looked up by name, e.g. `0` in an array)
            const { ports } = sanitizeCell({
                type: 'standard.Rectangle',
                ports: { groups: [{ markup: [{ tagName: 'script' }], attrs: { portBody: { onclick: 'x' }}}], items: [{ id: 'p', group: '0' }] }
            }, removed);
            assert.deepEqual(ports, { items: [{ id: 'p', group: '0' }] });
            assert.deepEqual(removed, ['ports/groups']);
        });

        QUnit.test('the bypasses are not rendered after sanitizing', function(assert) {
            const probe = 'window.__SANITIZE_PROBE__ = true';
            const script = { tagName: 'script', namespaceURI: XHTML, children: [probe] };
            const arrayLike = { length: 1, 0: script };
            const json = joint.util.sanitizeGraphJSON({ cells: [{
                id: 'markers', type: 'standard.Link', source: { x: 0, y: 0 }, target: { x: 99, y: 99 },
                attrs: { line: { sourceMarker: { markup: arrayLike }, stroke: { type: 'pattern', markup: arrayLike }}},
                labels: [{ attrs: [{ onclick: probe }] }]
            }, {
                id: 'attrs', type: 'standard.Rectangle', size: { width: 10, height: 10 },
                markup: [{ tagName: 'rect', selector: '0' }],
                attrs: [{ onclick: probe }]
            }, {
                id: 'annotations', type: 'standard.Rectangle', size: { width: 10, height: 10 },
                attrs: { label: { text: 'abc', annotations: { start: 0, end: 1, attrs: { onclick: probe }}}}
            }, {
                id: 'ports', type: 'standard.Rectangle', size: { width: 10, height: 10 },
                ports: {
                    groups: { g: { label: { position: { name: 'left', args: { attrs: { labelText: { onclick: probe }}}}}}},
                    items: [{ id: 'p', group: 'g', label: { position: { name: 'right', args: { attrs: { labelText: { onclick: probe }}}}}}]
                }
            }, {
                id: 'groups', type: 'standard.Rectangle', size: { width: 10, height: 10 },
                ports: { groups: [{ markup: [script] }], items: [{ id: 'p', group: '0' }] }
            }, {
                // (`port` returns `port.id`, which is set as attributes if it is an object)
                id: 'port', type: 'standard.Rectangle', size: { width: 10, height: 10 },
                attrs: { body: { port: { id: { onclick: probe }}}, label: { port: { onclick: probe }}}
            }, {
                // (the `style` of `standard.TextBlock` is passed to the text as options)
                id: 'style', type: 'standard.TextBlock', size: { width: 10, height: 10 },
                markup: [{ tagName: 'rect', selector: 'body' }, { tagName: 'text', selector: 'label' }],
                attrs: { label: { text: 'abc', style: { color: 'red', annotations: { start: 0, end: 1, attrs: { onclick: probe }}}}}
            }] }, { cellNamespace: joint.shapes });
            graph.fromJSON(json);
            assert.equal(graph.getCells().length, 7);
            paper.svg.querySelectorAll('*').forEach((node) => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
            assert.equal(paper.svg.querySelectorAll('script, [onclick]').length, 0);
            assert.notOk(window.__SANITIZE_PROBE__);
        });

        QUnit.test('attrs: the filter arguments can not inject markup', function(assert) {
            const json = joint.util.sanitizeGraphJSON({ cells: [{
                id: 'e', type: 'standard.Rectangle', size: { width: 10, height: 10 },
                attrs: { body: { filter: { name: 'dropShadow', args: { color: '"/><image href="x" onerror="x"/><feFlood flood-color="' }}}}
            }] }, { cellNamespace: joint.shapes });
            assert.deepEqual(json.cells[0].attrs.body, {});
            graph.fromJSON(json);
            assert.equal(paper.svg.querySelectorAll('filter image, [onerror]').length, 0);
        });

        QUnit.test('attrs: filters with safe arguments are kept', function(assert) {
            const filter = { name: 'dropShadow', args: { color: 'rgba(0,0,0,0.5)', dx: 2, dy: '3', blur: null, opacity: true }};
            const json = sanitizeCell({ type: 'standard.Rectangle', attrs: { body: { filter }}});
            assert.deepEqual(json.attrs.body.filter, filter);
            ['bad"', 'a<b', 'a>b', 'a\'b', 'a&b'].forEach((color) => {
                const removed = [];
                assert.deepEqual(sanitizeCell({ type: 'standard.Rectangle', attrs: { body: { filter: { name: 'dropShadow', args: { color }}}}}, removed).attrs.body, {}, color);
                assert.deepEqual(removed, ['attrs/body/filter'], color);
            });
            [{ args: 'x' }, { args: { color: {}}}, { args: { color: ['red'] }}].forEach((def) => {
                assert.deepEqual(sanitizeCell({ type: 'standard.Rectangle', attrs: { body: { filter: Object.assign({ name: 'blur' }, def) }}}).attrs.body, {}, JSON.stringify(def));
            });
        });

        QUnit.test('`srcdoc` and non-image `data:` URLs are removed from any element', function(assert) {
            const removed = [];
            const { markup, attrs } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [
                    { tagName: 'rect', selector: 'body' },
                    { tagName: 'foreignObject', children: [{ tagName: 'div', namespaceURI: XHTML, attributes: { srcdoc: 'x', title: 'y' }}] },
                    { tagName: 'animateTransform', attributes: { attributeName: 'srcdoc', to: 'x' }},
                    { tagName: 'image', selector: 'image', attributes: { href: 'data:application/xml,x' }}
                ],
                attrs: { body: { srcdoc: 'x', fill: 'red' }, image: { xlinkHref: 'data:text/html,x' }}
            }, removed);
            assert.deepEqual(markup[1].children[0].attributes, { title: 'y' });
            assert.deepEqual(markup[2].attributes, { to: 'x' });
            assert.deepEqual(markup[3].attributes, {});
            assert.deepEqual(attrs, { body: { fill: 'red' }, image: {}});
            assert.deepEqual(removed.sort(), [
                'attrs/body/srcdoc', 'attrs/image/xlinkHref', 'markup/attributes/attributeName',
                'markup/attributes/href', 'markup/attributes/srcdoc'
            ]);
        });

        QUnit.test('obfuscated URL schemes and prefixed event handlers are removed', function(assert) {
            const { markup, attrs } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [
                    { tagName: 'a', selector: 'link', attributes: { href: 'java\tscript:x', xlinkHref: '\u0001javascript:x', title: 'x' }},
                    { tagName: 'rect', selector: 'body', attributes: { 'xlink:onclick': 'x', 'x:onload': 'x', fill: 'red' }}
                ],
                attrs: {
                    link: { href: 'java\nscript:x', 'xlink:href': ' \u0000JaVaScRiPt:x' },
                    body: { 'ev:onclick': 'x', stroke: 'blue' }
                }
            });
            assert.deepEqual(markup[0].attributes, { title: 'x' });
            assert.deepEqual(markup[1].attributes, { fill: 'red' });
            assert.deepEqual(attrs, { link: {}, body: { stroke: 'blue' }});
        });

        QUnit.test('attrs: the keys of an object value are checked as attribute names', function(assert) {
            const removed = [];
            const { attrs } = sanitizeCell({
                type: 'standard.TextBlock',
                attrs: {
                    body: { port: { id: { onclick: 'x' }}},
                    label: { port: { onclick: 'x' }, style: { color: 'red', annotations: { attrs: { onclick: 'x' }}}},
                    root: { myOptions: { xlinkHref: 'javascript:x' }}
                }
            }, removed);
            assert.deepEqual(attrs, { body: {}, label: {}, root: {}});
            assert.deepEqual(removed, ['attrs/body/port', 'attrs/label/port', 'attrs/label/style', 'attrs/root/myOptions']);
            // safe values are kept
            const json = {
                type: 'standard.TextBlock',
                attrs: {
                    body: { port: { id: 'p' }},
                    label: { port: 'p', style: { color: 'red', fontSize: 12, 'font-family': 'Arial' }}
                }
            };
            assert.deepEqual(sanitizeCell(json), json);
        });

        QUnit.test('attrs: CSS, DOM properties and text are kept', function(assert) {
            const json = {
                type: 'standard.Rectangle',
                attrs: {
                    body: { style: { fill: 'red' }, title: 'javascript: in a tooltip' },
                    label: { textWrap: { text: 'javascript: in a text', width: 10 }, props: { value: 'x' }}
                }
            };
            const removed = [];
            assert.deepEqual(sanitizeCell(json, removed), json);
            assert.deepEqual(removed, []);
        });

        QUnit.test('attrs: the content of markers gets the rules of all elements', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const pngDataURL = 'data:image/png;base64,AAAA';
            const { attrs } = sanitizeCell({
                type: 'standard.Link',
                attrs: { line: {
                    sourceMarker: { type: 'use', href: svgDataURL },
                    // (the type can be merged with the type of another definition)
                    targetMarker: { type: 'image', href: svgDataURL },
                    vertexMarker: { type: 'image', href: pngDataURL, markup: [{ tagName: 'image', attributes: { href: svgDataURL }}] }
                }}
            });
            assert.deepEqual(attrs.line.sourceMarker, { type: 'use' });
            assert.deepEqual(attrs.line.targetMarker, { type: 'image' });
            assert.deepEqual(attrs.line.vertexMarker, { type: 'image', href: pngDataURL, markup: [{ tagName: 'image', attributes: {}}] });
            // an SVG image is kept on an image element of the cell markup
            const { markup } = sanitizeCell({
                type: 'standard.Link',
                markup: [{ tagName: 'path', selector: 'line' }, { tagName: 'image', attributes: { href: svgDataURL }}]
            });
            assert.deepEqual(markup[1], { tagName: 'image', attributes: { href: svgDataURL }});
        });

        QUnit.test('ports: the root selectors get the rules of all elements (unless defined by the markup)', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const json = {
                id: 'e', type: 'standard.Rectangle',
                ports: { items: [
                    { id: 'a', label: { markup: [{ tagName: 'use' }] }, attrs: { labelRoot: { href: svgDataURL }}},
                    { id: 'b', label: { markup: [{ tagName: 'image' }] }, attrs: { labelRoot: { href: svgDataURL }}},
                    { id: 'c', markup: [{ tagName: 'image' }], attrs: { portRoot: { href: svgDataURL }, root: { href: svgDataURL }}},
                    // (a selector of the markup replaces the root selector of the view)
                    { id: 'd', markup: [{ tagName: 'use' }, { tagName: 'image', selector: 'portRoot' }], attrs: { portRoot: { href: svgDataURL }}}
                ] }
            };
            const { ports } = sanitizeCell(json);
            assert.deepEqual(ports.items.map((item) => item.attrs), [
                { labelRoot: {}},
                { labelRoot: {}},
                { portRoot: {}, root: {}},
                { portRoot: { href: svgDataURL }}
            ]);
            // (the unsanitized JSON)
            graph.addCell(json);
            assert.equal(paper.findViewByModel('e').findPortNode('d', 'portRoot').tagName, 'image');
        });

        QUnit.test('a type which does not resolve to a cell constructor gets the rules of all elements', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const json = { type: 'Custom', attrs: { body: { href: svgDataURL, fill: 'red' }}};
            assert.deepEqual(
                joint.util.sanitizeCellJSON(json, { cellNamespace: {}}).attrs,
                { body: { fill: 'red' }}
            );
            // the defaults of a cell constructor which throw are ignored
            const Throwing = joint.dia.Element.extend({ defaults() { throw new Error('defaults'); } });
            assert.deepEqual(
                joint.util.sanitizeCellJSON(Object.assign({}, json, { type: 'Throwing' }), { cellNamespace: { Throwing }}).attrs,
                { body: { fill: 'red' }}
            );
        });

        QUnit.test('a cell whose type resolves to a function which is not a cell constructor is removed', function(assert) {
            // (a plain object inherits from `Object.prototype`, unlike the module namespace `joint.shapes`)
            const cellNamespace = Object.assign({}, joint.shapes);
            [
                'constructor', 'toString', 'hasOwnProperty',
                'standard.Rectangle.constructor', 'standard.Rectangle.define', 'standard.Rectangle.__super__.isLink'
            ].forEach((type) => {
                const removed = [];
                const onRemove = (path) => removed.push(path.join('/'));
                assert.equal(joint.util.sanitizeCellJSON({ id: 'a', type }, { cellNamespace, onRemove }), null, type);
                const graphJSON = joint.util.sanitizeGraphJSON({ cells: [{ id: 'a', type }, { id: 'b', type: 'standard.Rectangle' }] }, { cellNamespace, onRemove });
                assert.deepEqual(graphJSON.cells.map((cell) => cell.id), ['b'], type);
                assert.deepEqual(removed, ['', 'cells/0'], type);
            });
            assert.equal(joint.util.sanitizeCellJSON({ type: 'Custom' }, { cellNamespace: { Custom: function() {} }}), null);
            assert.ok(joint.util.sanitizeCellJSON({ type: 'standard.Rectangle' }, { cellNamespace }));
            // without `cellNamespace`, the type is not resolved
            assert.ok(joint.util.sanitizeCellJSON({ type: 'constructor' }));
        });

        QUnit.test('malformed input does not throw', function(assert) {
            assert.equal(joint.util.sanitizeGraphJSON(null), null);
            assert.equal(joint.util.sanitizeGraphJSON([{ type: 'standard.Rectangle' }]), null);
            assert.equal(joint.util.sanitizeGraphJSON({ cells: null }).cells, null);
            const json = {
                type: 'standard.Link',
                attrs: {
                    line: 'x',
                    wrapper: null,
                    label: { annotations: [null, 'x'], fill: { type: 'linearGradient', stops: [null, 'x'] }}
                },
                labels: [null, 'x'],
                defaultLabel: 'x'
            };
            assert.deepEqual(sanitizeCell(json), json);
            const element = { type: 'standard.Rectangle', ports: { items: [null, 'x'], groups: { g: null }}};
            assert.deepEqual(sanitizeCell(element), element);
        });

        QUnit.test('sanitizeCellJSON() and sanitizeCellAttributes(): input which is not an object', function(assert) {
            const removed = [];
            const onRemove = (path, reason) => removed.push(reason);
            // (`graph.addCell()` would add an array of cells as they are)
            assert.equal(joint.util.sanitizeCellJSON([{ type: 'standard.Rectangle', markup: [{ tagName: 'script' }] }], { onRemove }), null);
            assert.equal(joint.util.sanitizeCellJSON('x', { onRemove }), null);
            const cell = new joint.shapes.standard.Rectangle();
            assert.deepEqual(joint.util.sanitizeCellAttributes(cell, [{ markup: [{ tagName: 'script' }] }], { onRemove }), {});
            assert.deepEqual(removed, ['invalid cell', 'invalid cell', 'invalid attributes']);
        });

        QUnit.test('sanitizeCellAttributes(): without a cell, the rules of all elements apply', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const attributes = { attrs: { body: { href: svgDataURL, fill: 'red' }}};
            assert.deepEqual(joint.util.sanitizeCellAttributes(null, attributes), { attrs: { body: { fill: 'red' }}});
            assert.deepEqual(joint.util.sanitizeCellAttributes({}, attributes), { attrs: { body: { fill: 'red' }}});
            // (the markup is not compared with the attributes of an object which is not a cell)
            const markup = [{ tagName: 'use', selector: 'body' }];
            assert.deepEqual(
                joint.util.sanitizeCellAttributes({}, { markup, attrs: { body: { href: svgDataURL }}}),
                { markup, attrs: { body: {}}}
            );
        });

        QUnit.test('sanitizeCellAttributes(): port and label markup which would make the existing attributes unsafe is removed', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const element = new joint.shapes.standard.Rectangle({
                portMarkup: [{ tagName: 'image', selector: 'icon' }],
                ports: { items: [{ id: 'p', attrs: { icon: { href: svgDataURL }}}] }
            });
            assert.deepEqual(joint.util.sanitizeCellAttributes(element, { portMarkup: [{ tagName: 'use', selector: 'icon' }] }), {});
            assert.deepEqual(
                joint.util.sanitizeCellAttributes(element, { portMarkup: [{ tagName: 'image', selector: 'icon' }, { tagName: 'rect' }] }),
                { portMarkup: [{ tagName: 'image', selector: 'icon' }, { tagName: 'rect' }] }
            );
            // the attributes of an update are checked against the markup of the update
            assert.deepEqual(
                joint.util.sanitizeCellAttributes(element, { ports: {
                    groups: { g: { markup: [{ tagName: 'use', selector: 'icon' }] }},
                    items: [{ id: 'p', group: 'g', attrs: { icon: { href: svgDataURL }}}]
                }}),
                { ports: {
                    groups: { g: { markup: [{ tagName: 'use', selector: 'icon' }] }},
                    items: [{ id: 'p', group: 'g', attrs: { icon: {}}}]
                }}
            );
            const link = new joint.shapes.standard.Link({
                labelMarkup: [{ tagName: 'image', selector: 'icon' }],
                labels: [{ attrs: { icon: { href: svgDataURL }}}]
            });
            assert.deepEqual(joint.util.sanitizeCellAttributes(link, { labelMarkup: [{ tagName: 'use', selector: 'icon' }] }), {});
        });

        QUnit.test('the bypasses are executed without sanitizing (positive control)', function(assert) {
            const probe = 'window.__SANITIZE_PROBE__ = true';
            graph.fromJSON({ cells: [{
                id: 'port', type: 'standard.Rectangle', size: { width: 10, height: 10 },
                attrs: { body: { port: { id: { onclick: probe }}}}
            }, {
                id: 'annotations', type: 'standard.Rectangle', size: { width: 10, height: 10 },
                attrs: { label: { text: 'abc', annotations: { start: 0, end: 1, attrs: { onmouseover: probe }}}}
            }] });
            paper.findViewByModel('port').findNode('body').dispatchEvent(new MouseEvent('click', { bubbles: true }));
            assert.ok(window.__SANITIZE_PROBE__, 'the `port` attribute');
            delete window.__SANITIZE_PROBE__;
            paper.findViewByModel('annotations').el.querySelector('tspan[onmouseover]').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            assert.ok(window.__SANITIZE_PROBE__, 'a single annotation');
            // the merge bypass (F1): the data URL reaches a `<use>` element without sanitizing
            graph.fromJSON({ cells: [{
                id: 'f1', type: 'standard.Link', source: { x: 0, y: 0 }, target: { x: 9, y: 9 },
                markup: [{ tagName: 'path', selector: 'line', groupSelector: 'alt' }],
                attrs: { line: { sourceMarker: { type: 'use' }}, alt: { sourceMarker: { type: 'image', xlinkHref: 'data:image/svg+xml,<svg/>' }}}
            }] });
            assert.equal(paper.svg.querySelectorAll('use[*|href], use[href]').length, 1, 'the merge bypass');
        });

        QUnit.test('attrs: a definition merged across selectors is validated with the rules of all elements', function(assert) {
            const svg = 'data:image/svg+xml,<svg/>';
            // F1: `body` (selector) and `alt` (groupSelector) select the same node; the
            // renderer merges their `sourceMarker`, so `type: 'use'` and the data URL combine.
            const removed = [];
            const { attrs } = sanitizeCell({
                type: 'standard.Link',
                markup: [{ tagName: 'path', selector: 'body', groupSelector: 'alt' }],
                attrs: { body: { sourceMarker: { type: 'use' }}, alt: { sourceMarker: { type: 'image', xlinkHref: svg }}}
            }, removed);
            assert.deepEqual(attrs.alt.sourceMarker, { type: 'image' });
            assert.deepEqual(removed, ['attrs/alt/sourceMarker/xlinkHref']);
            // a pattern merged the same way
            const { attrs: attrs2 } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [{ tagName: 'rect', selector: 'body', groupSelector: 'alt' }],
                attrs: { body: { fill: { type: 'pattern', markup: [{ tagName: 'use' }] }}, alt: { fill: { type: 'pattern', markup: [{ tagName: 'rect' }], attrs: { 'xlink:href': svg }}}}
            });
            assert.deepEqual(attrs2.alt.fill.attrs, {});
            // a merged definition with markup: the renderer merges the markup node by
            // node, so a `<use>` from one definition can take the data URL from an
            // `<image>` markup node of the other.
            const { attrs: attrs3 } = sanitizeCell({
                type: 'standard.Link',
                markup: [{ tagName: 'path', selector: 'body', groupSelector: 'alt' }],
                attrs: { body: { sourceMarker: { markup: [{ tagName: 'use' }] }}, alt: { sourceMarker: { markup: [{ tagName: 'image', attributes: { 'xlink:href': svg }}] }}}
            });
            assert.deepEqual(attrs3.alt.sourceMarker.markup, [{ tagName: 'image', attributes: {}}]);
            // a definition under a single selector gets the rules of all elements as well
            // (raster images are kept)
            const png = 'data:image/png;base64,AAAA';
            const { attrs: single } = sanitizeCell({
                type: 'standard.Link',
                markup: [{ tagName: 'path', selector: 'body' }, { tagName: 'path', selector: 'line' }],
                attrs: { line: { sourceMarker: { type: 'image', xlinkHref: svg, markup: [{ tagName: 'image', attributes: { 'xlink:href': png }}] }}}
            });
            assert.deepEqual(single.line.sourceMarker, { type: 'image', markup: [{ tagName: 'image', attributes: { 'xlink:href': png }}] });
        });

        QUnit.test('attrs: a definition under a root selector that aliases a node is validated with the rules of all elements', function(assert) {
            const svg = 'data:image/svg+xml,<svg/>';
            // A single-node port markup: `portRoot` and the node's own selector select
            // the same element, so the renderer merges a `<use>` under the selector with
            // the data URL under `portRoot`.
            const { ports } = sanitizeCell({
                type: 'standard.Rectangle',
                ports: { groups: { g: {}}, items: [{
                    id: 'p', group: 'g',
                    markup: [{ tagName: 'circle', selector: 'foo' }],
                    attrs: {
                        portRoot: { sourceMarker: { markup: [{ tagName: 'image', attributes: { 'xlink:href': svg }}] }},
                        foo: { sourceMarker: { markup: [{ tagName: 'use' }] }}
                    }
                }] }
            });
            assert.deepEqual(ports.items[0].attrs.portRoot.sourceMarker.markup, [{ tagName: 'image', attributes: {}}]);
            // the same via `labelRoot` of a single-node port label
            const { ports: ports2 } = sanitizeCell({
                type: 'standard.Rectangle',
                ports: { groups: { g: {}}, items: [{
                    id: 'p', group: 'g',
                    label: { markup: [{ tagName: 'text', selector: 'lt' }] },
                    attrs: { labelRoot: { fill: { type: 'pattern', markup: [{ tagName: 'image', attributes: { 'xlink:href': svg }}] }}, lt: { fill: { type: 'pattern', markup: [{ tagName: 'use' }] }}}
                }] }
            });
            assert.deepEqual(ports2.items[0].attrs.labelRoot.fill.markup, [{ tagName: 'image', attributes: {}}]);
            // legit: a single-node port with a safe image data URL under its own selector is kept
            const png = 'data:image/png;base64,AAAA';
            const { ports: ok } = sanitizeCell({
                type: 'standard.Rectangle',
                ports: { groups: { g: {}}, items: [{ id: 'p', group: 'g', markup: [{ tagName: 'image', selector: 'foo' }], attrs: { foo: { xlinkHref: png }}}] }
            });
            assert.deepEqual(ok.items[0].attrs.foo, { xlinkHref: png });
        });

        QUnit.test('attrs: a port-group definition merged into a port is validated with the rules of all elements', function(assert) {
            const svg = 'data:image/svg+xml,<svg/>';
            // F2: the group `attrs` and the port `attrs` merge on the `circle` node.
            const run = (groupMarker, itemMarker) => {
                const { ports } = sanitizeCell({
                    type: 'standard.Rectangle',
                    markup: [{ tagName: 'circle', selector: 'circle' }],
                    ports: { groups: { g: { attrs: { circle: { sourceMarker: groupMarker }}}}, items: [{ id: 'p', group: 'g', attrs: { circle: { sourceMarker: itemMarker }}}] }
                });
                return ports;
            };
            // the data URL is in the group, the `type: 'use'` in the port
            assert.deepEqual(run({ type: 'image', xlinkHref: svg }, { type: 'use' }).groups.g.attrs.circle.sourceMarker, { type: 'image' });
            // the data URL is in the port, the `type: 'use'` in the group
            assert.deepEqual(run({ type: 'use' }, { type: 'image', xlinkHref: svg }).items[0].attrs.circle.sourceMarker, { type: 'image' });
        });

        QUnit.test('ports: the markup of a group defined by the shape is used to resolve the elements', function(assert) {
            const svg = 'data:image/svg+xml,<svg/>';
            // F3: the group `g` (with `<use>` markup) is defined only by the shape; the
            // JSON `portMarkup` is `<image>`, so the sanitizer must use the group markup.
            const Shape = joint.dia.Element.extend({
                defaults: { type: 'test.DefaultGroup', markup: [{ tagName: 'rect', selector: 'body' }] },
                markup: [{ tagName: 'rect', selector: 'body' }]
            });
            Shape.prototype.defaults.ports = { groups: { g: { markup: [{ tagName: 'use', selector: 'icon' }] }}};
            const cellNamespace = { test: { DefaultGroup: Shape }};
            const json = joint.util.sanitizeCellJSON({
                type: 'test.DefaultGroup',
                portMarkup: [{ tagName: 'image', selector: 'icon' }],
                ports: { items: [{ id: 'p', group: 'g', attrs: { icon: { xlinkHref: svg }}}] }
            }, { cellNamespace });
            assert.deepEqual(json.ports.items[0].attrs.icon, {});
            // a known-safe `<image>` group keeps the data URL
            Shape.prototype.defaults.ports = { groups: { g: { markup: [{ tagName: 'image', selector: 'icon' }] }}};
            const json2 = joint.util.sanitizeCellJSON({ type: 'test.DefaultGroup', ports: { items: [{ id: 'p', group: 'g', attrs: { icon: { xlinkHref: svg }}}] }}, { cellNamespace });
            assert.deepEqual(json2.ports.items[0].attrs.icon, { xlinkHref: svg });
        });

        QUnit.test('sanitizeCellAttributes(): a markup reset to `null` is validated against the prototype markup', function(assert) {
            const svg = 'data:image/svg+xml,<svg/>';
            // F4: `markup: null` resets to the prototype markup (`<use>`), not the cell's current markup (`<image>`).
            const Shape = joint.dia.Element.extend({ markup: [{ tagName: 'use', selector: 'icon' }] });
            const cell = new Shape({ markup: [{ tagName: 'image', selector: 'icon' }] });
            const removed = [];
            const out = joint.util.sanitizeCellAttributes(cell, { markup: null, attrs: { icon: { xlinkHref: svg }}}, { onRemove: (path) => removed.push(path.join('/')) });
            assert.deepEqual(out.attrs.icon, {});
            assert.deepEqual(removed, ['attrs/icon/xlinkHref']);
        });

        QUnit.test('the merge bypasses are not rendered after sanitizing', function(assert) {
            const svg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:window.__SANITIZE_PROBE__ = true"><rect width="9" height="9"/></a></svg>';
            const json = joint.util.sanitizeGraphJSON({ cells: [{
                id: 'f1', type: 'standard.Link', source: { x: 0, y: 0 }, target: { x: 9, y: 9 },
                markup: [{ tagName: 'path', selector: 'line', groupSelector: 'alt' }],
                attrs: { line: { sourceMarker: { type: 'use' }}, alt: { sourceMarker: { type: 'image', xlinkHref: svg }}}
            }, {
                id: 'f2', type: 'standard.Rectangle', size: { width: 10, height: 10 }, markup: [{ tagName: 'circle', selector: 'circle' }],
                ports: { groups: { g: { attrs: { circle: { sourceMarker: { type: 'image', xlinkHref: svg }}}}}, items: [{ id: 'p', group: 'g', attrs: { circle: { sourceMarker: { type: 'use' }}}}] }
            }] }, { cellNamespace: joint.shapes });
            graph.fromJSON(json);
            assert.equal(paper.svg.querySelectorAll('use[*|href], use[href]').length, 0);
            assert.notOk(window.__SANITIZE_PROBE__);
        });

        QUnit.test('markup: invalid nodes are removed (only objects with a `tagName` are kept)', function(assert) {
            const { markup } = sanitizeCell({ type: 'standard.Rectangle', markup: [{ tagName: 'rect', selector: 'body' }, 1, null, true, 'text', { foo: 'bar' }] });
            assert.deepEqual(markup, [{ tagName: 'rect', selector: 'body' }, 'text']);
        });

        QUnit.test('attrs: a marker with a `null` type is removed', function(assert) {
            const { attrs } = sanitizeCell({ type: 'standard.Link', attrs: { line: { sourceMarker: { type: null }}}});
            assert.deepEqual(attrs.line, {});
        });

        QUnit.test('without `cellNamespace`, the ports and the labels are sanitized with the rules of all elements', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const json = joint.util.sanitizeCellJSON({
                type: 'standard.Rectangle',
                ports: { items: [{ id: 'p', markup: [{ tagName: 'script' }, { tagName: 'image', selector: 'icon' }], attrs: { icon: { href: svgDataURL, onclick: 'x' }}}] },
                labels: [{ markup: [{ tagName: 'script' }], attrs: { text: { onclick: 'x' }}}]
            });
            assert.deepEqual(json.ports.items[0], { id: 'p', markup: [{ tagName: 'image', selector: 'icon' }], attrs: { icon: { href: svgDataURL }}});
            assert.deepEqual(json.labels, [{ attrs: { text: {}}}]);
        });

        QUnit.test('JSON markup: HTML elements only inside `<foreignObject>`', function(assert) {
            const { markup } = sanitizeCell({
                type: 'standard.Rectangle',
                markup: [{ tagName: 'g', children: [{ tagName: 'div', namespaceURI: XHTML }, { tagName: 'rect' }] }]
            });
            assert.deepEqual(markup, [{ tagName: 'g', children: [{ tagName: 'rect' }] }]);
        });

        QUnit.test('the definitions are merged with the defaults of the shape (e.g. `cell.toJSON()`)', function(assert) {
            const Shape = joint.dia.Element.extend({
                defaults: {
                    type: 'test.Definitions',
                    attrs: {
                        body: {
                            fill: { type: 'linearGradient', stops: [{ offset: 0, color: 'blue' }, { offset: 1, color: 'white' }] },
                            stroke: { type: 'pattern', markup: [{ tagName: 'rect', attributes: { width: 5, height: 5 }}], attrs: { width: 5, height: 5 }},
                            filter: { name: 'dropShadow', args: { dx: 1 }}
                        },
                        line: { sourceMarker: { type: 'image', href: 'data:image/png;base64,AAAA' }}
                    }
                },
                markup: [{ tagName: 'rect', selector: 'body' }, { tagName: 'path', selector: 'line' }]
            });
            const cellNamespace = { test: { Definitions: Shape }};
            const cell = new Shape();
            cell.attr({
                body: { fill: { stops: [{ offset: 0, color: 'green' }] }, stroke: { attrs: { width: 10 }}, filter: { args: { dx: 2 }}},
                line: { sourceMarker: { href: 'data:image/png;base64,BBBB' }}
            });
            const json = cell.toJSON();
            // (the `type` and the `name` are omitted, they are the same as the defaults)
            assert.notOk('type' in json.attrs.body.fill);
            const removed = [];
            const sanitized = joint.util.sanitizeCellJSON(json, { cellNamespace, onRemove: (path) => removed.push(path.join('/')) });
            assert.deepEqual(sanitized, json);
            assert.deepEqual(removed, []);
            // the defaults which are not safe for the new values are still checked
            const { attrs } = joint.util.sanitizeCellJSON({
                type: 'test.Definitions',
                attrs: { line: { sourceMarker: { markup: [{ tagName: 'use' }], href: 'data:image/svg+xml,<svg/>' }}, body: { fill: { stops: [{ color: 'javascript:x' }] }}}
            }, { cellNamespace });
            assert.deepEqual(attrs, { line: { sourceMarker: { markup: [{ tagName: 'use' }] }}, body: { fill: { stops: [{}] }}});
            // the defaults are not used without `cellNamespace`
            assert.deepEqual(joint.util.sanitizeCellJSON(json).attrs.body, {});
        });

        QUnit.test('ports: the group `attrs` get the rules of all elements', function(assert) {
            const svgDataURL = 'data:image/svg+xml,<svg/>';
            const pngDataURL = 'data:image/png;base64,AAAA';
            const groupMarkup = [{ tagName: 'image', selector: 'icon' }];
            // (the group `attrs` are a template merged into every port, including the
            // ports added later, possibly with their own markup)
            const groups = { g: { markup: groupMarkup, attrs: { icon: { href: svgDataURL, fill: 'red' }, body: { href: pngDataURL }}}};
            let { ports } = sanitizeCell({ type: 'standard.Rectangle', ports: { groups, items: [{ id: 'a', group: 'g', attrs: { icon: { href: svgDataURL }}}] }});
            assert.deepEqual(ports.groups.g.attrs, { icon: { fill: 'red' }, body: { href: pngDataURL }});
            // the `attrs` of a port get the rules of the elements of its markup (here the group markup)
            assert.deepEqual(ports.items[0].attrs, { icon: { href: svgDataURL }});
            // the same for the label layout attributes
            const label = { markup: groupMarkup, position: { name: 'left', args: { attrs: { icon: { href: svgDataURL }}}}};
            ({ ports } = sanitizeCell({ type: 'standard.Rectangle', ports: {
                groups: { g: { label }},
                items: [{ id: 'a', group: 'g', label: { position: { name: 'left', args: { attrs: { icon: { href: svgDataURL }}}}}}]
            }}));
            assert.deepEqual(ports.groups.g.label.position.args.attrs, { icon: {}});
            assert.deepEqual(ports.items[0].label.position.args.attrs, { icon: { href: svgDataURL }});
            // (a port label markup merged with the group label markup is removed)
            ({ ports } = sanitizeCell({ type: 'standard.Rectangle', ports: { groups: { g: { label }}, items: [
                { id: 'a', group: 'g', label: { markup: [{ tagName: 'use', selector: 'icon' }] }, attrs: { icon: { href: svgDataURL }}}
            ] }}));
            assert.deepEqual(ports.items[0].label, {});
            assert.deepEqual(ports.items[0].attrs, { icon: { href: svgDataURL }});
            // a port with its own label markup (the group has none)
            const { position } = label;
            ({ ports } = sanitizeCell({ type: 'standard.Rectangle', portLabelMarkup: groupMarkup, ports: { groups: { g: { label: { position }}}, items: [
                { id: 'a', group: 'g', attrs: { icon: { href: svgDataURL }}},
                { id: 'b', group: 'g', label: { markup: [{ tagName: 'use', selector: 'icon' }] }, attrs: { icon: { href: svgDataURL }}}
            ] }}));
            assert.deepEqual(ports.items.map((item) => item.attrs), [{ icon: { href: svgDataURL }}, { icon: {}}]);
        });

        QUnit.test('attrs: deeply nested values are checked', function(assert) {
            const nest = (leaf) => {
                let value = leaf;
                for (let i = 0; i < 100; i++) value = { [`key${i}`]: value };
                return value;
            };
            // (`title` is never used as a URL)
            const safe = nest({ title: 'javascript: a language', fill: 'red' });
            const { attrs } = sanitizeCell({ type: 'standard.Rectangle', attrs: { body: {
                safe,
                handler: nest({ onclick: 'x' }),
                url: nest({ href: 'javascript:x' }),
                // (the value of the attribute)
                href: nest('javascript:x')
            }}});
            assert.deepEqual(attrs.body, { safe });
        });

        QUnit.test('the attribute names are not added to the global cache of `V.attributeNames`', function(assert) {
            const name = `testUniqueName${Date.now()}`;
            sanitizeCell({ type: 'standard.Rectangle', attrs: { body: { [name]: 'x', nested: { [`${name}Nested`]: 'x' }}}});
            assert.notOk(name in joint.V.attributeNames);
            assert.notOk(`${name}Nested` in joint.V.attributeNames);
        });
    });
});
