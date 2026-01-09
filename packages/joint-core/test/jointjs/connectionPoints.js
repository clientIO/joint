QUnit.module('connectionPoints', function(hooks) {

    var paper, graph, r1, rv1, l1, lv1, sp, tp, fullNode, quarterNode, textNode;

    hooks.beforeEach(function() {

        graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        paper = new joint.dia.Paper({
            el: $('<div>').appendTo('#qunit-fixture'),
            model: graph,
            cellViewNamespace: joint.shapes,
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
                selector: 'text',
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
        fullNode = rv1.findNode('full');
        quarterNode = rv1.findNode('quarter');
        textNode = rv1.findNode('text');
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
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: { x: 11, y: 0 }});
                assert.ok(cp.round().equals(sp.move(tp, -11).round()));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { offset: { x: 11, y: 13 }});
                assert.equal(cp.distance(sp), Math.sqrt(13 * 13 + 11 * 11));
            });

            QUnit.test('align, alignOffset', function(assert) {
                var connectionPointFn = joint.connectionPoints.anchor;
                var cp, line;
                var length = sp.distance(tp);
                // bottom
                line = new g.Line(tp.clone().translate(0, 100), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { align: 'bottom' });
                assert.ok(cp.round().translate(0, -100).equals(sp));
                line = new g.Line(tp.clone().translate(0, 100), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { align: 'bottom', alignOffset: 20 });
                assert.ok(cp.round().translate(0, -100 - 20).equals(sp));
                // top
                line = new g.Line(tp.clone().translate(0, -100), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { align: 'top' });
                assert.ok(cp.round().translate(0, 100).equals(sp));
                line = new g.Line(tp.clone().translate(0, -100), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { align: 'top', alignOffset: 20 });
                assert.ok(cp.round().translate(0, 100 + 20).equals(sp));
                // left
                line = new g.Line(tp.clone().translate(-length - 100, 0), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { align: 'left' });
                assert.ok(cp.round().equals(sp.clone().translate(-100, 0)));
                line = new g.Line(tp.clone().translate(-length - 100, 0), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { align: 'left', alignOffset: 20 });
                assert.ok(cp.round().equals(sp.clone().translate(-100 - 20, 0)));
                // right
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { align: 'right' });
                assert.ok(cp.round().equals(sp.clone().translate(length, 0)));
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.el, { align: 'right', alignOffset: 20 });
                assert.ok(cp.round().equals(sp.clone().translate(length + 20, 0)));
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

            QUnit.module('useModelGeometry', function() {

                QUnit.test('uses model metrics when connected to an element', function(assert) {
                    const connectionPointFn = joint.connectionPoints.bbox;
                    let cp;
                    const line = new g.Line(new g.Point(100, 37), new g.Point(26, 37));

                    r1.position(0, 0);
                    r1.resize(52, 74);
                    cp = connectionPointFn.call(lv1, line, rv1, fullNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox().rightMiddle().round()));
                    cp = connectionPointFn.call(lv1, line, rv1, quarterNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox().rightMiddle().round()));
                    cp = connectionPointFn.call(lv1, line, rv1, textNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox().rightMiddle().round()));

                    r1.rotate(90);

                    cp = connectionPointFn.call(lv1, line, rv1, fullNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox({ rotate: true }).rightMiddle().round()));
                    cp = connectionPointFn.call(lv1, line, rv1, quarterNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox({ rotate: true }).rightMiddle().round()));
                    cp = connectionPointFn.call(lv1, line, rv1, textNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox({ rotate: true }).rightMiddle().round()));
                });

                QUnit.test('uses port model metrics when connected to a port', function(assert) {
                    const connectionPointFn = joint.connectionPoints.bbox;
                    let cp, line;

                    const width = 52;
                    const height = 74;
                    const portWidth = 11;
                    const portHeight = 17;

                    r1.position(0, 0);
                    r1.resize(width, height);
                    r1.set('ports', {
                        groups: {
                            'g1': {
                                position: {
                                    name: 'right'
                                }
                            },
                        },
                        items: [{
                            id: 'p1',
                            group: 'g1',
                            size: { width: portWidth, height: portHeight },
                        }]
                    });

                    const portNode = rv1.findPortNode('p1');

                    line = new g.Line(new g.Point(2 * width, height / 2), new g.Point(width, height / 2));
                    cp = connectionPointFn.call(lv1, line, rv1, portNode, { useModelGeometry: true });
                    assert.ok(cp.equals(r1.getPortBBox('p1', { rotate: true }).rightMiddle()));

                    line = new g.Line(new g.Point(width, 2 * height), new g.Point(width, height / 2));
                    cp = connectionPointFn.call(lv1, line, rv1, portNode, { useModelGeometry: true });
                    assert.ok(cp.equals(r1.getPortBBox('p1', { rotate: true }).bottomMiddle()));

                    r1.rotate(45);

                    const p1BBoxWR = r1.getPortBBox('p1', { rotate: true });

                    line = new g.Line(p1BBoxWR.center().offset(0, 1000), p1BBoxWR.center());
                    cp = connectionPointFn.call(lv1, line, rv1, portNode, { useModelGeometry: true });
                    assert.ok(cp.equals(r1.getPortBBox('p1', { rotate: true }).bottomMiddle()));

                    line = new g.Line(p1BBoxWR.center().offset(1000, 0), p1BBoxWR.center());
                    cp = connectionPointFn.call(lv1, line, rv1, portNode, { useModelGeometry: true });
                    assert.ok(cp.equals(r1.getPortBBox('p1', { rotate: true }).rightMiddle()));
                });
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

            QUnit.module('useModelGeometry', function() {

                QUnit.test('uses model metrics when connected to an element', function(assert) {
                    const connectionPointFn = joint.connectionPoints.rectangle;
                    let cp;
                    const line = new g.Line(new g.Point(100, 37), new g.Point(26, 37));

                    r1.position(0, 0);
                    r1.resize(52, 74);
                    cp = connectionPointFn.call(lv1, line, rv1, fullNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox().rightMiddle().round()));
                    cp = connectionPointFn.call(lv1, line, rv1, quarterNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox().rightMiddle().round()));
                    cp = connectionPointFn.call(lv1, line, rv1, textNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox().rightMiddle().round()));

                    r1.rotate(90);

                    cp = connectionPointFn.call(lv1, line, rv1, fullNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox({ rotate: true }).rightMiddle().round()));
                    cp = connectionPointFn.call(lv1, line, rv1, quarterNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox({ rotate: true }).rightMiddle().round()));
                    cp = connectionPointFn.call(lv1, line, rv1, textNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox({ rotate: true }).rightMiddle().round()));
                });

                QUnit.test('uses port model metrics when connected to a port', function(assert) {
                    const connectionPointFn = joint.connectionPoints.rectangle;
                    let cp, line;

                    const width = 52;
                    const height = 74;
                    const portWidth = 11;
                    const portHeight = 17;

                    r1.position(0, 0);
                    r1.resize(width, height);
                    r1.set('ports', {
                        groups: {
                            'g1': {
                                position: {
                                    name: 'right'
                                }
                            },
                        },
                        items: [{
                            id: 'p1',
                            group: 'g1',
                            size: { width: portWidth, height: portHeight },
                        }]
                    });

                    const portNode = rv1.findPortNode('p1');

                    line = new g.Line(new g.Point(2 * width, height / 2), new g.Point(width, height / 2));
                    cp = connectionPointFn.call(lv1, line, rv1, portNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox({ rotate: true }).rightMiddle().offset(portWidth / 2, 0).round()));

                    line = new g.Line(new g.Point(width, 2 * height), new g.Point(width, height / 2));
                    cp = connectionPointFn.call(lv1, line, rv1, portNode, { useModelGeometry: true });
                    assert.ok(cp.round().equals(r1.getBBox({ rotate: true }).rightMiddle().offset(0, portHeight / 2).round()));

                    r1.rotate(90);

                    const r1BBoxWR = r1.getBBox({ rotate: true });

                    line = new g.Line(r1BBoxWR.bottomMiddle().offset(0, 1000), r1BBoxWR.bottomMiddle());
                    cp = connectionPointFn.call(lv1, line, rv1, portNode, { useModelGeometry: true });
                    assert.ok(cp.equals(r1.getPortBBox('p1', { rotate: true }).bottomMiddle()));

                    line = new g.Line(r1BBoxWR.bottomMiddle().offset(1000, 0), r1BBoxWR.bottomMiddle());
                    cp = connectionPointFn.call(lv1, line, rv1, portNode, { useModelGeometry: true });
                    assert.ok(cp.equals(r1.getPortBBox('p1', { rotate: true }).rightMiddle()));
                });
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

                // Disabling the magnet lookup should use the magnet
                // passed to the connector even if it is a group node.
                r1.set('markup', [{
                    tagName: 'g',
                    selector: 'wrapper',
                    children: [{
                        tagName: 'rect',
                        selector: 'quarter'
                    }, {
                        tagName: 'rect',
                        selector: 'full',
                    }]
                }]);
                // lookup off
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.findNode('wrapper'), { selector: false });
                assert.ok(cp.round().equals(r1.getBBox().rightMiddle()));
                // lookup on
                line = new g.Line(tp.clone(), sp.clone());
                cp = connectionPointFn.call(lv1, line, rv1, rv1.findNode('wrapper'), { selector: undefined });
                assert.ok(cp.round().equals(r1.getBBox().center().offset(25, 0)));
            });


        });
    });
});
