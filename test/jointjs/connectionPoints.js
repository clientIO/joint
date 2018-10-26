QUnit.module('connectionPoints', function(hooks) {

    var paper, graph, r1, rv1, l1, lv1, sp, tp, fullNode;

    hooks.beforeEach(function() {

        graph = new joint.dia.Graph;
        paper = new joint.dia.Paper({
            el: $('<div>').appendTo('#qunit-fixture'),
            model: graph,
            width: 300,
            height: 300
        });


        var R = joint.dia.Element.define('rectangle', {
            attrs: {
                full: {
                    refWidth: '100%',
                    refHeight: '100%'
                },
                quarter: {
                    refWidth: '75%',
                    refHeight: '100%'
                },
            }
        }, {
            markup: [{
                tagName: 'g',
                textContent: 'test-test-content'
            }, {
                tagName: 'rect',
                selector: 'quarter'
            }, {
                tagName: 'rect',
                selector: 'full',
            }]
        });

        r1 = new R();
        r1.size(100, 100);
        r1.position(0, 0);

        sp = new g.Point(50, 50);
        tp = new g.Point(200, 50);
        l1 = new joint.shapes.standard.Link({
            source: sp.toJSON(),
            target: tp.toJSON()
        });

        graph.addCells([r1, l1]);
        rv1 = r1.findView(paper);
        lv1 = l1.findView(paper);
        fullNode = rv1.el.querySelector('[joint-selector="full"]');
    });

    hooks.afterEach(function() {
        paper.remove();
        paper = null;
        graph = null;
    });

    QUnit.module('anchor', function() {

        QUnit.test('sanity', function(assert) {
            var connectionPointFn = joint.connectionPoints.anchor;
            assert.ok(typeof connectionPointFn === 'function');
            var line = new g.Line(tp.clone(), sp.clone());
            var cp = connectionPointFn.call(lv1, line, rv1, rv1.el, {});
            assert.ok(cp instanceof g.Point);
        });

        QUnit.module('options', function() {

            QUnit.test('offset', function(assert) {
                var connectionPointFn = joint.connectionPoints.anchor;
                var cp, line;
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 0 });
                assert.ok(cp.round().equals(line.end));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 10 });
                assert.ok(cp.round().equals(sp.move(tp, -10).round()));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 1e6 });
                assert.ok(cp.distance(sp) < sp.distance(tp));
            });
        });
    });

    QUnit.module('bbox', function() {

        QUnit.test('sanity', function(assert) {
            var connectionPointFn = joint.connectionPoints.bbox;
            assert.ok(typeof connectionPointFn === 'function');
            var line = new g.Line(tp.clone(), sp.clone());
            var cp = connectionPointFn.call(lv1, line, rv1, rv1.el, {});
            assert.ok(cp instanceof g.Point);
        });

        QUnit.module('options', function() {

            QUnit.test('offset', function(assert) {
                var connectionPointFn = joint.connectionPoints.bbox;
                var cp, line;
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 0 });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle()));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 10 });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle().move(tp, -10).round()));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 1e6 });
                assert.ok(cp.distance(r1.getBBox().rightMiddle()) < r1.getBBox().rightMiddle().distance(tp));
            });

            QUnit.test('stroke', function(assert) {
                var connectionPointFn = joint.connectionPoints.bbox;
                var cp, line;
                var strokeWidth = 10;
                r1.attr('full/strokeWidth', strokeWidth);
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, fullNode, { stroke: true });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle().move(tp, -strokeWidth / 2).round()));
            });
        });
    });

    QUnit.module('rectangle', function() {

        QUnit.test('sanity', function(assert) {
            var connectionPointFn = joint.connectionPoints.rectangle;
            assert.ok(typeof connectionPointFn === 'function');
            var line = new g.Line(tp.clone(), sp.clone());
            var cp = connectionPointFn.call(lv1, line, rv1, rv1.el, {});
            assert.ok(cp instanceof g.Point);
        });

        QUnit.test('rotated element', function(assert) {
            var connectionPointFn = joint.connectionPoints.rectangle;
            var cp, line;
            var angle = 45;
            r1.rotate(angle);
            line = new g.Line(tp.clone(), sp.clone());
            cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 0 });
            assert.ok(cp.round().equals(r1.getBBox().bbox(angle).rightMiddle().round()));
        });

        QUnit.module('options', function() {

            QUnit.test('offset', function(assert) {
                var connectionPointFn = joint.connectionPoints.rectangle;
                var cp, line;
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 0 });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle()));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 10 });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle().move(tp, -10).round()));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: 1e6 });
                assert.ok(cp.distance(r1.getBBox().rightMiddle()) < r1.getBBox().rightMiddle().distance(tp));
            });

            QUnit.test('stroke', function(assert) {
                var connectionPointFn = joint.connectionPoints.rectangle;
                var cp, line;
                var strokeWidth = 10;
                r1.attr('full/strokeWidth', strokeWidth);
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, fullNode, { stroke: true });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle().move(tp, -strokeWidth / 2).round()));
            });
        });
    });

    QUnit.module('boundary', function() {

        QUnit.test('sanity', function(assert) {
            var connectionPointFn = joint.connectionPoints.boundary;
            assert.ok(typeof connectionPointFn === 'function');
            var line = new g.Line(tp.clone(), sp.clone());
            var cp = connectionPointFn.call(lv1, line, rv1, rv1.el, {});
            assert.ok(cp instanceof g.Point);
        });

        QUnit.module('options', function() {

            QUnit.test('offset', function(assert) {
                var connectionPointFn = joint.connectionPoints.boundary;
                var cp, line;
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, fullNode, { offset: 0 });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle()));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, fullNode, { offset: 10 });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle().move(tp, -10).round()));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, fullNode, { offset: 1e6 });
                assert.ok(cp.distance(r1.getBBox().rightMiddle()) < r1.getBBox().rightMiddle().distance(tp));
            });

            QUnit.test('stroke', function(assert) {
                var connectionPointFn = joint.connectionPoints.boundary;
                var cp, line;
                var strokeWidth = 10;
                r1.attr('full/strokeWidth', strokeWidth);
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, fullNode, { stroke: true });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle().move(tp, -strokeWidth / 2).round()));
            });

            QUnit.test('selector', function(assert) {
                var connectionPointFn = joint.connectionPoints.boundary;
                var cp, line;

                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { selector: 'quarter' });
                assert.ok(cp.round().equals(r1.getBBox().center().offset(25, 0)));

                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { selector: ['firstElementChild', 'nextElementSibling'] });
                assert.ok(cp.round().equals(r1.getBBox().center().offset(25, 0)));

                r1.attr('root/title', 'Title');
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { selector: null });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle()));
            });


        });
    });
});
