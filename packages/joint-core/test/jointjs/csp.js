'use strict';

// The suite is served under `style-src 'self'` (see `grunt/config/karma.js`),
// so anything the library styles inline is reported here as a violation
// instead of silently working. Applications that ship a strict Content
// Security Policy cannot relax that directive, and an inline style is the one
// thing a diagramming library is tempted to write.
//
// Note that a style *attribute* is governed by `style-src-attr` and a `<style>`
// element by `style-src-elem`, both falling back to `style-src`. Chrome
// throttles repeated reports, so a violation of one kind can hide the other:
// the assertions below name the directive rather than counting.
QUnit.module('Content Security Policy', function(hooks) {

    var violations;
    var onViolation;
    var paper;

    hooks.beforeEach(function() {

        violations = [];
        onViolation = function(event) {
            violations.push({
                directive: event.effectiveDirective,
                sample: event.sample
            });
        };
        document.addEventListener('securitypolicyviolation', onViolation);
    });

    hooks.afterEach(function() {

        document.removeEventListener('securitypolicyviolation', onViolation);
        if (paper) {
            paper.remove();
            paper = null;
        }
    });

    function createPaper(graph, options) {
        const created = new joint.dia.Paper(joint.util.assign({
            model: graph,
            width: 300,
            height: 300,
            async: false
        }, options));
        fixtures.getElement().appendChild(created.el);
        return created;
    }

    // Discards anything reported so far, so a test measures only its subject
    // and not the paper its fixture had to build.
    async function ignoreSoFar() {
        await new Promise(function(resolve) { setTimeout(resolve, 0); });
        violations.length = 0;
    }

    // Violations are reported asynchronously, so give the browser a turn
    // before reading them.
    function collect() {
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve(violations.slice());
            }, 0);
        });
    }

    // Names what was blocked, not just which directive blocked it: the policy
    // carries `report-sample`, so the browser hands back the offending CSS.
    function describe(reported) {
        return reported.map(function(violation) {
            const sample = violation.sample ? ' ' + violation.sample.trim().replace(/\s+/g, ' ') : '';
            return violation.directive + sample;
        }).sort();
    }

    QUnit.test('the policy is in force', async function(assert) {

        // Guards the rest of the module: without the header every assertion
        // below would pass for the wrong reason.
        const style = document.createElement('style');
        style.textContent = '.jj-csp-probe { color: red; }';
        document.head.appendChild(style);
        style.remove();

        // `includes` rather than an exact match: a violation from a
        // neighbouring module can land inside this window too.
        const reported = describe(await collect());
        assert.ok(reported.some(function(entry) { return entry.startsWith('style-src-elem'); }),
            'an inline <style> is blocked, so the suite really is running under the policy');
    });

    QUnit.test('rendering a paper needs no inline style', async function(assert) {

        paper = createPaper(new joint.dia.Graph, {
            background: { color: '#eee' },
            drawGrid: true
        });

        const reported = describe(await collect());
        assert.deepEqual(reported, [],
            'no violation while constructing and rendering a paper');
    });

    QUnit.test('rendering cells needs no inline style', async function(assert) {

        const graph = new joint.dia.Graph;
        paper = createPaper(graph);

        const source = new joint.shapes.standard.Rectangle({
            position: { x: 10, y: 10 },
            size: { width: 80, height: 40 },
            attrs: { label: { text: 'source' }}
        });
        const target = new joint.shapes.standard.Rectangle({
            position: { x: 150, y: 120 },
            size: { width: 80, height: 40 },
            attrs: { label: { text: 'target' }}
        });
        const link = new joint.shapes.standard.Link({
            source: { id: source.id },
            target: { id: target.id },
            labels: [{ attrs: { text: { text: 'link' }}}]
        });
        await ignoreSoFar();
        graph.resetCells([source, target, link]);

        const reported = describe(await collect());
        assert.deepEqual(reported, [],
            'no violation while rendering elements, a link and a link label');
    });

    // One sheet per document however many papers share the stylesheet: a
    // canvas and its minimap must not adopt one each.
    QUnit.test('adopts a single stylesheet per document', async function(assert) {

        const graph = new joint.dia.Graph;
        paper = createPaper(graph);
        const second = createPaper(graph);

        const adopted = [...document.adoptedStyleSheets].filter(function(sheet) {
            return [...sheet.cssRules].some(function(rule) {
                return rule.cssText.includes('non-scaling-stroke');
            });
        });
        second.remove();

        assert.strictEqual(adopted.length, 1, 'the paper stylesheet is adopted once');

        const reported = describe(await collect());
        assert.deepEqual(reported, [], 'no violation from adopting it');
    });

    // The sheet used to live inside the paper's SVG and go with it. Now that it
    // belongs to the document, the last paper to leave has to take it.
    // A stylesheet of its own, so papers elsewhere in the suite do not count.
    QUnit.test('drops the stylesheet once the last paper is removed', function(assert) {

        const MARKER = 'csp-lifecycle-probe';
        const ProbePaper = joint.dia.Paper.extend({
            stylesheet: `.${MARKER} { color: red; }`
        });

        const countAdopted = function() {
            return [...document.adoptedStyleSheets].filter(function(sheet) {
                return [...sheet.cssRules].some(function(rule) {
                    return rule.cssText.includes(MARKER);
                });
            }).length;
        };

        const createProbe = function() {
            const probe = new ProbePaper({ model: new joint.dia.Graph, width: 1, height: 1 });
            fixtures.getElement().appendChild(probe.el);
            return probe;
        };

        assert.strictEqual(countAdopted(), 0, 'nothing adopted before any paper exists');

        const first = createProbe();
        assert.strictEqual(countAdopted(), 1, 'the first paper adopts it');

        const second = createProbe();
        assert.strictEqual(countAdopted(), 1, 'the second paper shares it');

        second.remove();
        assert.strictEqual(countAdopted(), 1, 'it stays while a paper still holds it');

        first.remove();
        assert.strictEqual(countAdopted(), 0, 'the last paper to leave drops it');

        const later = createProbe();
        assert.strictEqual(countAdopted(), 1, 'a later paper adopts it again');
        later.remove();
    });

    // Emptying the stylesheet and re-rendering has to let go of the old sheet,
    // or its rules keep applying with nothing left pointing at them.
    QUnit.test('releases the stylesheet when it is emptied', function(assert) {

        const MARKER = 'csp-emptied-probe';
        const ProbePaper = joint.dia.Paper.extend({
            stylesheet: `.${MARKER} { color: red; }`
        });

        const countAdopted = function() {
            return [...document.adoptedStyleSheets].filter(function(sheet) {
                return [...sheet.cssRules].some(function(rule) {
                    return rule.cssText.includes(MARKER);
                });
            }).length;
        };

        const probe = new ProbePaper({ model: new joint.dia.Graph, width: 1, height: 1 });
        fixtures.getElement().appendChild(probe.el);
        assert.strictEqual(countAdopted(), 1, 'adopted while the paper has a stylesheet');

        probe.stylesheet = '';
        probe.render();
        assert.strictEqual(countAdopted(), 0, 'released once the stylesheet is emptied');

        probe.remove();
    });

    QUnit.test('the `style` presentation attribute needs no inline style', async function(assert) {

        const graph = new joint.dia.Graph;
        paper = createPaper(graph);

        // `style` is applied through the CSSOM rather than written as an
        // attribute, which is what keeps it out of the policy's reach.
        const element = new joint.shapes.standard.Rectangle({
            position: { x: 10, y: 10 },
            size: { width: 80, height: 40 },
            attrs: { body: { style: { fill: 'red', opacity: 0.5 }}}
        });
        await ignoreSoFar();
        graph.resetCells([element]);

        const reported = describe(await collect());
        assert.deepEqual(reported, [],
            'no violation from the `style` attribute definition');
    });
});
