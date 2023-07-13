QUnit.module('elementTools', function(hooks) {

    var paper, graph, paperEl, element, elementView;

    hooks.beforeEach(function() {

        var fixtureEl = document.getElementById('qunit-fixture') || document.createElement('div');
        paperEl = document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        fixtureEl.appendChild(paperEl);
        document.body.appendChild(fixtureEl);

        graph = new joint.dia.Graph;
        paper = new joint.dia.Paper({
            el: paperEl,
            model: graph
        });
        element = new joint.shapes.standard.Rectangle({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 },
            attrs: {
                body: {
                    refWidth2: 11,
                    refHeight2: 13
                }
            }
        });
        element.addTo(graph);
        elementView = element.findView(paper);
    });

    hooks.afterEach(function() {

        if (paper) paper.remove();
        paper = null;
        paperEl = null;
        graph = null;
        element = null;
        elementView = null;
    });

    QUnit.module('Mount & Unmount', function() {

        QUnit.test('are mounted and unmounted with the element view', function(assert) {
            const remove = new joint.elementTools.Remove();
            const toolsView = new joint.dia.ToolsView({ tools: [remove] });
            elementView.addTools(toolsView);
            assert.ok(toolsView.el.parentNode);
            assert.ok(toolsView.isMounted());
            paper.dumpViews({ viewport: () => false });
            assert.notOk(toolsView.el.parentNode);
            assert.notOk(toolsView.isMounted());
            paper.dumpViews({ viewport: () => true });
            assert.ok(toolsView.el.parentNode);
            assert.ok(toolsView.isMounted());
        });
    });

    QUnit.module('Remove', function() {
        [{
            options: { /* no options */ },
            position: { x: 100, y: 100 }
        }, {
            options: { x: '100%', y: '100%' },
            position: { x: 211, y: 213 }
        }, {
            options: { x: '100%', y: '100%', useModelGeometry: true },
            position: { x: 200, y: 200 }
        }, {
            options: { x: 'calc(w+11)', y: 'calc(h+13)', useModelGeometry: true },
            position: { x: 211, y: 213 }
        }, {
            options: { x: '100%', y: '100%', offset: { x: 2, y: 3 }},
            position: { x: 211 + 2, y: 213 + 3 }
        }, {
            options: { x: '100%', y: '100%', rotate: false  },
            position: { x: 212, y: 212 },
            before: function() {
                element.rotate(90);
            }
        }, {
            options: { x: '100%', y: '100%', rotate: true  },
            position: { x: 99, y: 212 },
            before: function() {
                element.rotate(90);
            }
        }, {
            options: { x: '100%', y: '100%', rotate: false, useModelGeometry: true  },
            position: { x: 200, y: 200 },
            before: function() {
                element.rotate(90);
            }
        }, {
            options: { x: '100%', y: '100%', rotate: true, useModelGeometry: true },
            position: { x: 100, y: 200 },
            before: function() {
                element.rotate(90);
            }

        }].forEach(function(testCase) {
            QUnit.test('position (' + JSON.stringify(testCase.options) + ')', function(assert) {
                if (testCase.before) testCase.before.call();
                var remove = new joint.elementTools.Remove(testCase.options);
                elementView.addTools(new joint.dia.ToolsView({ tools: [remove] }));
                var bbox = remove.vel.getBBox({ target: paper.svg });
                assert.equal(bbox.x + bbox.width / 2, testCase.position.x);
                assert.equal(bbox.y + bbox.height / 2, testCase.position.y);
            });
        });
    });

    QUnit.module('Boundary', function() {
        [{
            options: { padding: 0 },
            bbox: { x: 100, y: 100, width: 111, height: 113  }
        }, {
            options: { padding: 10 },
            bbox: { x: 100 - 10, y: 100 - 10, width: 111 + 20, height: 113 + 20 }
        }, {
            options: { padding: 0, useModelGeometry: true },
            bbox: { x: 100, y: 100, width: 100, height: 100  }
        }, {
            options: { padding: 0 },
            bbox: { x: 99, y: 101, width: 113, height: 111 },
            before: function() {
                element.rotate(90);
            }
        }, {
            options: { padding: 0, rotate: true },
            bbox: { x: 87, y: 100, width: 113, height: 111 },
            before: function() {
                element.rotate(90);
            }
        }].forEach(function(testCase) {
            QUnit.test('position and size (' + JSON.stringify(testCase.options) + ')', function(assert) {
                if (testCase.before) testCase.before.call();
                var boundary = new joint.elementTools.Boundary(testCase.options);
                elementView.addTools(new joint.dia.ToolsView({ tools: [boundary] }));
                var bbox = boundary.vel.getBBox({ target: paper.svg });
                assert.checkBboxApproximately(0, bbox, testCase.bbox);
            });
        });
    });

    QUnit.module('Control', function() {
        [{
            angle: 0
        }, {
            angle: 45
        }, {
            angle: 90
        }].forEach(function(testCase) {
            QUnit.test('position (angle ' + testCase.angle + ')', function(assert) {
                var angle = testCase.angle;
                var position = { x: 10, y: 10 };
                var CustomControl = joint.elementTools.Control.extend({
                    getPosition: function() { return position; }
                });
                var control = new CustomControl;
                element.rotate(angle);
                elementView.addTools(new joint.dia.ToolsView({ tools: [control] }));
                var bbox = element.getBBox();
                // 1. `getPosition()`
                var resultingPosition = control.vel.getBBox({ target: paper.svg }).center();
                var expectedPosition = element.position().offset(position).rotate(bbox.center(), -angle);
                assert.ok(resultingPosition.round().equals(expectedPosition.round()));
                // 2. `update`
                position.x = bbox.width;
                position.y = bbox.height;
                control.update();
                resultingPosition = control.vel.getBBox({ target: paper.svg }).center();
                expectedPosition = element.position().offset(position).rotate(bbox.center(), -angle);
                assert.ok(resultingPosition.round().equals(expectedPosition.round()));
            });
        });
    });

    QUnit.module('Connect', function() {
        QUnit.test('options: magnet', function(assert) {
            var newLink;
            var defaultLinkSpy = sinon.spy(function() {
                newLink = new joint.shapes.standard.Link();
                return newLink;
            });
            // magnet defined as a function
            var magnetSpy = sinon.spy(function(view) {
                return view.findBySelector('body')[0];
            });
            paper.options.defaultLink = defaultLinkSpy;
            var connect = new joint.elementTools.Connect({ magnet: magnetSpy });
            elementView.addTools(new joint.dia.ToolsView({ tools: [connect] }));
            var evt = {};
            connect.dragstart(evt);
            connect.drag(evt);
            connect.dragend(evt);
            assert.ok(newLink);
            assert.equal(defaultLinkSpy.callCount, 1);
            assert.equal(magnetSpy.callCount, 1);
            assert.ok(magnetSpy.calledWithExactly(elementView, connect));
            assert.deepEqual(newLink.source(), { id: element.id, magnet: 'body' });
            assert.ok(magnetSpy.calledOn(connect));
            // magnet defined as an SVGElement
            connect.options.magnet = elementView.findBySelector('label')[0];
            evt = {};
            connect.dragstart(evt);
            connect.drag(evt);
            connect.dragend(evt);
            assert.equal(defaultLinkSpy.callCount, 2);
            assert.deepEqual(newLink.source(), { id: element.id, magnet: 'label' });
            // magnet defined as a selector
            connect.options.magnet = 'body';
            evt = {};
            connect.dragstart(evt);
            connect.drag(evt);
            connect.dragend(evt);
            assert.equal(defaultLinkSpy.callCount, 3);
            assert.deepEqual(newLink.source(), { id: element.id, magnet: 'body' });
            // invalid magnet
            connect.options.magnet = 1;
            evt = {};
            assert.throws(function() {
                connect.dragstart(evt);
            }, /Connect: magnet must be an SVGElement/);
        });
    });

    QUnit.test('Rendering', function(assert) {
        element.remove();
        paper.freeze();
        element.addTo(graph);
        var boundary = new joint.elementTools.Boundary({ padding: 0 });
        var toolsView = new joint.dia.ToolsView({
            tools: [
                boundary
            ]
        });
        var spy = sinon.spy(toolsView, 'update');
        element.findView(paper).addTools(toolsView);
        assert.equal(spy.callCount, 0);
        assert.notOk(toolsView.isRendered);
        paper.unfreeze();
        assert.equal(spy.callCount, 1);
        assert.ok(toolsView.isRendered);
        assert.equal(boundary.vel.getBBox().toString(), '100@100 211@213');
        element.translate(10, 10);
        assert.equal(spy.callCount, 2);
        element.remove();
        assert.equal(spy.callCount, 2);
    });
});
