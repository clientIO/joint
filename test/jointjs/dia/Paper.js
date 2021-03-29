QUnit.module('joint.dia.Paper', function(hooks) {

    var Paper = joint.dia.Paper;
    var paper;
    var paperEl;
    var graph;

    function cellNodesCount(paper) {
        return V(paper.cells).children().length;
    }

    function addCells(graph) {
        var rect1 = new joint.shapes.standard.Rectangle();
        var rect2 = new joint.shapes.standard.Rectangle();
        var link = new joint.shapes.standard.Link();
        rect1.resize(100, 100);
        rect2.resize(100, 100);
        rect1.position(-100, -100);
        rect2.position(100, 100);
        link.source(rect1);
        link.target(rect2);
        link.vertices([{ x: 0, y: 300 }]);
        rect1.addTo(graph);
        rect2.addTo(graph);
        link.addTo(graph);
    }

    hooks.beforeEach(function() {

        var fixtureEl = document.getElementById('qunit-fixture') || document.createElement('div');
        paperEl = document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        fixtureEl.appendChild(paperEl);
        document.body.appendChild(fixtureEl);

        graph = new joint.dia.Graph;
    });

    hooks.afterEach(function() {
        if (paper) paper.remove();
        graph = null;
        paper = null;
        paperEl = null;
    });

    QUnit.test('sanity', function(assert) {
        paper = new Paper({ el: paperEl });
        assert.ok(paper.svg.id);
    });

    QUnit.module('options', function() {

        QUnit.test('cloning', function(assert) {
            var protoOptions = Paper.prototype.options;
            var protoDefaultAnchor = protoOptions.defaultAnchor;
            paper = new Paper({
                el: paperEl,
                defaultConnector: function() { return new g.Path(); },
                defaultAnchor: { name: 'test', args: { testArg: 1 }},
                // defaultRouter
                interactive: false,
                highlighting: false
            });
            // overridden with a function
            var options = paper.options;
            assert.ok(typeof options.defaultConnector === 'function');
            // overridden with an object
            assert.notEqual(options.defaultAnchor, protoOptions.defaultAnchor);
            options.defaultAnchor.args.testArg = 2;
            assert.deepEqual(protoDefaultAnchor, protoOptions.defaultAnchor);
            // default
            assert.notEqual(options.defaultRouter, protoOptions.defaultRouter);
            // boolean
            assert.equal(options.interactive, false);
            assert.equal(options.highlighting, false);
        });
    });

    QUnit.module('async = FALSE', function(hooks) {

        hooks.beforeEach(function() {
            paper = new Paper({
                el: paperEl,
                model: graph,
                async: false
            });
        });

        QUnit.module('getContentArea() > options > useModelGeometry', function() {

            QUnit.test('useModelGeometry = FALSE', function(assert) {
                var area = paper.getContentArea();
                assert.ok(area instanceof g.Rect);
                assert.deepEqual(area.toJSON(), { x: 0, y: 0, width: 0, height: 0 });
                paper.freeze();
                addCells(graph);
                area = paper.getContentArea();
                assert.ok(area instanceof g.Rect);
                assert.deepEqual(area.toJSON(), { x: 0, y: 0, width: 0, height: 0 });
                paper.unfreeze();
                area = paper.getContentArea();
                assert.deepEqual(area.toJSON(), { x: -100, y: -100, width: 300, height: 400 });
            });

            QUnit.test('useModelGeometry = TRUE', function(assert) {
                var area = paper.getContentArea({ useModelGeometry: true });
                assert.ok(area instanceof g.Rect);
                assert.deepEqual(area.toJSON(), { x: 0, y: 0, width: 0, height: 0 });
                paper.freeze();
                addCells(graph);
                area = paper.getContentArea({ useModelGeometry: true });
                assert.ok(area instanceof g.Rect);
                assert.deepEqual(area.toJSON(), { x: -100, y: -100, width: 300, height: 400 });
                paper.unfreeze();
                area = paper.getContentArea({ useModelGeometry: true });
                assert.deepEqual(area.toJSON(), { x: -100, y: -100, width: 300, height: 400 });
            });
        });

        QUnit.module('fitToContent() > options', function() {

            [{
                name: '0@0 200x200',
                grid: 1,
                contentArea: {
                    x: 0,
                    y: 0,
                    width: 200,
                    height: 200
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200
                    },
                    'any': {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200
                    },
                    'negative': {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200,
                    }
                }
            }, {
                name: '-200@-200 200x200',
                grid: 1,
                contentArea: {
                    x: -200,
                    y: -200,
                    width: 200,
                    height: 200
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1
                    },
                    'any': {
                        x: -200,
                        y: -200,
                        width: 201,
                        height: 201
                    },
                    'negative': {
                        x: -200,
                        y: -200,
                        width: 201,
                        height: 201
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1,
                    }
                }
            }, {
                name: '-200@-200 100x100',
                grid: 1,
                contentArea: {
                    x: -200,
                    y: -200,
                    width: 100,
                    height: 100
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1
                    },
                    'any': {
                        x: -200,
                        y: -200,
                        width: 201,
                        height: 201
                    },
                    'negative': {
                        x: -200,
                        y: -200,
                        width: 201,
                        height: 201
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1,
                    }
                }
            }, {
                name: '-200@-200 100x100, grid: 300',
                grid: 300,
                contentArea: {
                    x: -200,
                    y: -200,
                    width: 100,
                    height: 100
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    },
                    'any': {
                        x: -300,
                        y: -300,
                        width: 600,
                        height: 600
                    },
                    'negative': {
                        x: -300,
                        y: -300,
                        width: 600,
                        height: 600
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    }
                }
            }, {
                name: '-100@-100 200x200',
                grid: 1,
                contentArea: {
                    x: -100,
                    y: -100,
                    width: 200,
                    height: 200
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 100
                    },
                    'any': {
                        x: -100,
                        y: -100,
                        width: 200,
                        height: 200
                    },
                    'negative': {
                        x: -100,
                        y: -100,
                        width: 200,
                        height: 200
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 100
                    }
                }
            }, {
                name: '-100@-100 200x200, grid: 300',
                grid: 300,
                contentArea: {
                    x: -100,
                    y: -100,
                    width: 200,
                    height: 200
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    },
                    'any': {
                        x: -300,
                        y: -300,
                        width: 600,
                        height: 600
                    },
                    'negative': {
                        x: -300,
                        y: -300,
                        width: 600,
                        height: 600
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    }
                }
            }, {
                name: '200@200 100x100',
                grid: 1,
                contentArea: {
                    x: 200,
                    y: 200,
                    width: 100,
                    height: 100
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    },
                    'any': {
                        x: 200,
                        y: 200,
                        width: 100,
                        height: 100
                    },
                    'negative': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    },
                    'positive': {
                        x: 200,
                        y: 200,
                        width: 100,
                        height: 100
                    }
                }
            }, {
                name: '200@200 100x100',
                grid: 150,
                contentArea: {
                    x: 200,
                    y: 200,
                    width: 120,
                    height: 120
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 450,
                        height: 450
                    },
                    'any': {
                        x: 150,
                        y: 150,
                        width: 300,
                        height: 300
                    },
                    'negative': {
                        x: 0,
                        y: 0,
                        width: 450,
                        height: 450
                    },
                    'positive': {
                        x: 150,
                        y: 150,
                        width: 300,
                        height: 300
                    }
                }
            }].forEach(function(testCase) {
                var expectedAreas = testCase.expectedAreas;
                Object.keys(expectedAreas).forEach(function(origin) {
                    QUnit.test(testCase.name + ', origin: ' + origin, function(assert) {
                        var grid = testCase.grid;
                        var area = paper.fitToContent({
                            contentArea: testCase.contentArea,
                            allowNewOrigin: origin,
                            gridWidth: grid,
                            gridHeight: grid
                        });
                        var expectedArea = expectedAreas[origin];
                        assert.deepEqual(area.toJSON(), expectedArea, 'Result of paper.fitToContent()');
                        assert.deepEqual(paper.getArea().toJSON(), expectedArea, 'Result of paper.getArea()');
                        assert.equal(area.width % grid, 0, 'Width is multiple of grid');
                        assert.equal(area.height % grid, 0, 'Height is multiple of grid');
                    });
                });
            });
        });

        QUnit.module('fitToContent() > options > allowNegativeBottomRight = true', function() {

            [{
                name: '0@0 200x200',
                grid: 1,
                contentArea: {
                    x: 0,
                    y: 0,
                    width: 200,
                    height: 200
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200
                    },
                    'any': {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200
                    },
                    'negative': {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200,
                    }
                }
            }, {
                name: '-200@-200 200x200',
                grid: 1,
                contentArea: {
                    x: -200,
                    y: -200,
                    width: 200,
                    height: 200
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1
                    },
                    'any': {
                        x: -200,
                        y: -200,
                        width: 200,
                        height: 200
                    },
                    'negative': {
                        x: -200,
                        y: -200,
                        width: 200,
                        height: 200
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1,
                    }
                }
            }, {
                name: '-200@-200 100x100',
                grid: 1,
                contentArea: {
                    x: -200,
                    y: -200,
                    width: 100,
                    height: 100
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1
                    },
                    'any': {
                        x: -200,
                        y: -200,
                        width: 100,
                        height: 100
                    },
                    'negative': {
                        x: -200,
                        y: -200,
                        width: 100,
                        height: 100
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 1,
                        height: 1,
                    }
                }
            }, {
                name: '-200@-200 100x100, grid: 300',
                grid: 300,
                contentArea: {
                    x: -200,
                    y: -200,
                    width: 100,
                    height: 100
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    },
                    'any': {
                        x: -300,
                        y: -300,
                        width: 300,
                        height: 300
                    },
                    'negative': {
                        x: -300,
                        y: -300,
                        width: 300,
                        height: 300
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    }
                }
            }, {
                name: '-100@-100 200x200',
                grid: 1,
                contentArea: {
                    x: -100,
                    y: -100,
                    width: 200,
                    height: 200
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 100
                    },
                    'any': {
                        x: -100,
                        y: -100,
                        width: 200,
                        height: 200
                    },
                    'negative': {
                        x: -100,
                        y: -100,
                        width: 200,
                        height: 200
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 100
                    }
                }
            }, {
                name: '-100@-100 200x200, grid: 300',
                grid: 300,
                contentArea: {
                    x: -100,
                    y: -100,
                    width: 200,
                    height: 200
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    },
                    'any': {
                        x: -300,
                        y: -300,
                        width: 600,
                        height: 600
                    },
                    'negative': {
                        x: -300,
                        y: -300,
                        width: 600,
                        height: 600
                    },
                    'positive': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    }
                }
            }, {
                name: '200@200 100x100',
                grid: 1,
                contentArea: {
                    x: 200,
                    y: 200,
                    width: 100,
                    height: 100
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    },
                    'any': {
                        x: 200,
                        y: 200,
                        width: 100,
                        height: 100
                    },
                    'negative': {
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 300
                    },
                    'positive': {
                        x: 200,
                        y: 200,
                        width: 100,
                        height: 100
                    }
                }
            }, {
                name: '200@200 100x100',
                grid: 150,
                contentArea: {
                    x: 200,
                    y: 200,
                    width: 120,
                    height: 120
                },
                expectedAreas: {
                    'default': {
                        x: 0,
                        y: 0,
                        width: 450,
                        height: 450
                    },
                    'any': {
                        x: 150,
                        y: 150,
                        width: 300,
                        height: 300
                    },
                    'negative': {
                        x: 0,
                        y: 0,
                        width: 450,
                        height: 450
                    },
                    'positive': {
                        x: 150,
                        y: 150,
                        width: 300,
                        height: 300
                    }
                }
            }].forEach(function(testCase) {
                var expectedAreas = testCase.expectedAreas;
                Object.keys(expectedAreas).forEach(function(origin) {
                    QUnit.test(testCase.name + ', origin: ' + origin, function(assert) {
                        var grid = testCase.grid;
                        var area = paper.fitToContent({
                            contentArea: testCase.contentArea,
                            allowNewOrigin: origin,
                            allowNegativeBottomRight: true,
                            gridWidth: grid,
                            gridHeight: grid
                        });
                        var expectedArea = expectedAreas[origin];
                        assert.deepEqual(area.toJSON(), expectedArea, 'Result of paper.fitToContent()');
                        assert.deepEqual(paper.getArea().toJSON(), expectedArea, 'Result of paper.getArea()');
                        assert.equal(area.width % grid, 0, 'Width is multiple of grid');
                        assert.equal(area.height % grid, 0, 'Height is multiple of grid');
                    });
                });
            });
        });

        QUnit.module('fitToContent() > options > useModelGeometry', function() {

            [0.5, 1, 2].forEach(function(scale) {
                QUnit.test('scale = ' + scale + ' > useModelGeometry = TRUE', function(assert) {
                    paper.scale(scale);
                    //scale = 1;
                    var expected;
                    var area = paper.fitToContent({ useModelGeometry: true });
                    assert.ok(area instanceof g.Rect);
                    expected = {
                        x: 0,
                        y: 0,
                        width: 1 / scale,
                        height: 1 / scale
                    };
                    assert.deepEqual(area.toJSON(), expected);
                    assert.deepEqual(paper.getArea().toJSON(), expected);
                    addCells(graph);
                    area = paper.fitToContent({ useModelGeometry: true });
                    expected = {
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 300
                    };
                    assert.deepEqual(area.toJSON(), expected);
                    assert.deepEqual(paper.getArea().toJSON(), expected);
                    area = paper.fitToContent({ useModelGeometry: true, allowNewOrigin: 'any' });
                    expected = {
                        x: -100,
                        y: -100,
                        width: 300,
                        height: 400
                    };
                    assert.deepEqual(area.toJSON(), expected);
                    assert.deepEqual(paper.getArea().toJSON(), expected);
                    var padding = 20;
                    area = paper.fitToContent({ useModelGeometry: true, allowNewOrigin: 'any', padding: padding });
                    expected = {
                        x: -100 - padding / scale,
                        y: - 100  - padding / scale,
                        width: 300 + 2 * padding / scale,
                        height: 400 + 2 * padding / scale
                    };
                    assert.deepEqual(area.toJSON(), expected);
                    assert.deepEqual(paper.getArea().toJSON(), expected);
                });
            });
        });

        Object.keys(Paper.sorting).forEach(function(sortingType) {

            QUnit.module('sorting = ' + sortingType, function(hooks) {

                hooks.beforeEach(function() {
                    paper.options.sorting = Paper.sorting[sortingType];
                });

                QUnit.module('options', function() {

                    QUnit.module('sorting', function() {

                        QUnit.test('sanity', function(assert) {
                            var rect1 = new joint.shapes.standard.Rectangle({ z: 0 });
                            var rect2 = new joint.shapes.standard.Rectangle({ z: 2 });
                            var rect3 = new joint.shapes.standard.Rectangle({ z: 1 });
                            var sortViewsExactSpy = sinon.spy(paper, 'sortViewsExact');
                            // RESET CELLS
                            graph.resetCells([rect1, rect2, rect3]);
                            var rect1View = rect1.findView(paper);
                            var rect2View = rect2.findView(paper);
                            var rect3View = rect3.findView(paper);
                            assert.equal(rect1View.el.previousElementSibling, null);
                            assert.equal(rect2View.el.previousElementSibling, rect3View.el);
                            assert.equal(rect3View.el.previousElementSibling, rect1View.el);
                            assert.equal(sortViewsExactSpy.callCount, paper.options.sorting === Paper.sorting.EXACT ? 1 : 0);
                            // CHANGE Z
                            rect3.toFront();
                            assert.equal(sortViewsExactSpy.callCount, paper.options.sorting === Paper.sorting.EXACT ? 2 : 0);
                            if (paper.options.sorting === Paper.sorting.NONE) {
                                assert.equal(rect1View.el.previousElementSibling, null);
                                assert.equal(rect2View.el.previousElementSibling, rect3View.el);
                                assert.equal(rect3View.el.previousElementSibling, rect1View.el);
                            } else {
                                assert.equal(rect1View.el.previousElementSibling, null);
                                assert.equal(rect2View.el.previousElementSibling, rect1View.el);
                                assert.equal(rect3View.el.previousElementSibling, rect2View.el);
                            }
                            sortViewsExactSpy.resetHistory();
                            rect3.translate(10, 10);
                            assert.ok(sortViewsExactSpy.notCalled);
                            // ADD CELLS
                            graph.clear();
                            graph.addCells([rect1, rect2, rect3]);
                            assert.equal(sortViewsExactSpy.callCount, paper.options.sorting === Paper.sorting.EXACT ? 1 : 0);
                            if (paper.options.sorting !== Paper.sorting.NONE) {
                                rect1View = rect1.findView(paper);
                                rect2View = rect2.findView(paper);
                                rect3View = rect3.findView(paper);
                                assert.equal(rect1View.el.previousElementSibling, null);
                                assert.equal(rect2View.el.previousElementSibling, rect1View.el);
                                assert.equal(rect3View.el.previousElementSibling, rect2View.el);
                            }
                        });

                        QUnit.test('frozen', function(assert) {
                            paper.freeze();
                            var rect1 = new joint.shapes.standard.Rectangle({ z: 0 });
                            var rect2 = new joint.shapes.standard.Rectangle({ z: 2 });
                            var rect3 = new joint.shapes.standard.Rectangle({ z: 1 });
                            var sortViewsExactSpy = sinon.spy(paper, 'sortViewsExact');
                            graph.resetCells([rect1, rect2, rect3]);
                            var rect1View = rect1.findView(paper);
                            var rect2View = rect2.findView(paper);
                            var rect3View = rect3.findView(paper);
                            rect3.toFront();
                            assert.ok(sortViewsExactSpy.notCalled);
                            paper.unfreeze();
                            assert.equal(sortViewsExactSpy.callCount, paper.options.sorting === Paper.sorting.EXACT ? 1 : 0);
                            if (paper.options.sorting !== Paper.sorting.NONE) {
                                assert.equal(rect1View.el.previousElementSibling, null);
                                assert.equal(rect2View.el.previousElementSibling, rect1View.el);
                                assert.equal(rect3View.el.previousElementSibling, rect2View.el);
                            }
                            sortViewsExactSpy.resetHistory();
                            paper.freeze();
                            rect3.translate(10, 10);
                            paper.unfreeze();
                            assert.ok(sortViewsExactSpy.notCalled);
                        });
                    });

                    QUnit.module('viewport', function() {

                        QUnit.test('sanity', function(assert) {
                            var visible = true;
                            var viewportSpy = sinon.spy(function() { return visible; });
                            paper.options.viewport = viewportSpy;
                            var rect = new joint.shapes.standard.Rectangle();
                            rect.addTo(graph);
                            var rectView = rect.findView(paper);
                            assert.ok(viewportSpy.calledOnce);
                            // 1. view is not mounted yet (not rendered)
                            assert.ok(viewportSpy.calledWithExactly(rectView, false, paper));
                            assert.ok(viewportSpy.calledOn(paper));
                            assert.equal(rectView.el.parentNode, paper.cells);
                            viewportSpy.resetHistory();
                            visible = false;
                            rect.translate(10, 0);
                            assert.ok(viewportSpy.calledOnce);
                            // 2. view was already mounted in step 1.
                            assert.ok(viewportSpy.calledWithExactly(rectView, true, paper));
                            viewportSpy.resetHistory();
                            rect.translate(10, 0);
                            assert.ok(viewportSpy.calledOnce);
                            // 3. view was unmounted in step 2.
                            assert.ok(viewportSpy.calledWithExactly(rectView, false, paper));
                            assert.notOk(rectView.el.parentNode);
                        });
                    });

                    QUnit.module('onViewUpdate', function() {

                        QUnit.test('sanity', function(assert) {
                            var onViewUpdateSpy = sinon.spy();
                            paper.options.onViewUpdate = onViewUpdateSpy;
                            var rect = new joint.shapes.standard.Rectangle();
                            rect.addTo(graph, { test1: true });
                            var rectView = rect.findView(paper);
                            assert.ok(onViewUpdateSpy.calledOnce);
                            assert.ok(onViewUpdateSpy.calledWithExactly(rectView, sinon.match.number, sinon.match.number, sinon.match({ test1: true }), paper));
                            assert.ok(onViewUpdateSpy.calledOn(paper));
                            onViewUpdateSpy.resetHistory();
                            rect.translate(10, 0, { test2: true });
                            assert.ok(onViewUpdateSpy.calledOnce);
                            assert.ok(onViewUpdateSpy.calledWithExactly(rectView, sinon.match.number, sinon.match.number, sinon.match({ test2: true }), paper));
                        });

                        QUnit.test('update connected links', function(assert) {
                            var rect1 = new joint.shapes.standard.Rectangle();
                            var rect2 = new joint.shapes.standard.Rectangle();
                            var link1 = new joint.shapes.standard.Link();
                            var link2 = new joint.shapes.standard.Link();
                            link1.source(rect1);
                            link1.target(rect2);
                            link2.target(link1);
                            rect1.addTo(graph);
                            rect2.addTo(graph);
                            link1.addTo(graph);
                            link2.addTo(graph);
                            var onViewUpdateSpy = sinon.spy(paper.options, 'onViewUpdate');
                            rect1.translate(10, 0, { test: true });
                            assert.ok(onViewUpdateSpy.calledThrice);
                            assert.ok(onViewUpdateSpy.calledWithExactly(link1.findView(paper), sinon.match.number, sinon.match.number, sinon.match({ test: true }), paper));
                            assert.ok(onViewUpdateSpy.calledWithExactly(link2.findView(paper), sinon.match.number, sinon.match.number, sinon.match({ test: true }), paper));
                            assert.ok(onViewUpdateSpy.calledWithExactly(rect1.findView(paper), sinon.match.number, sinon.match.number, sinon.match({ test: true }), paper));
                        });

                        QUnit.test('update cycled links', function(assert) {
                            var link1 = new joint.shapes.standard.Link();
                            var link2 = new joint.shapes.standard.Link();
                            link1.source(link2);
                            link2.source(link1);
                            paper.freeze();
                            link1.addTo(graph);
                            link2.addTo(graph);
                            paper.unfreeze();
                            var onViewUpdateSpy = sinon.spy(paper.options, 'onViewUpdate');
                            var confirmUpdateSpy = sinon.spy(joint.dia.LinkView.prototype, 'confirmUpdate');
                            // This will trigger onViewUpdate thrice (link1 attrs, link2 source/target, link1 source/target)
                            link1.attr('line/stroke', 'red', { test: true });
                            assert.ok(onViewUpdateSpy.calledThrice);
                            assert.ok(onViewUpdateSpy.calledWithExactly(link1.findView(paper), sinon.match.number, sinon.match.number, sinon.match({ test: true }), paper));
                            assert.ok(onViewUpdateSpy.calledWithExactly(link2.findView(paper), sinon.match.number, sinon.match.number, sinon.match({ test: true }), paper));
                            assert.ok(confirmUpdateSpy.calledTwice);
                            onViewUpdateSpy.restore();
                            confirmUpdateSpy.restore();
                        });
                    });

                    QUnit.module('onViewPostponed', function() {

                        QUnit.test('sanity', function(assert) {
                            var leftoverFlag = 1;
                            var onViewPostponedSpy = sinon.spy(function() {
                                leftoverFlag = 0;
                                return true;
                            });
                            paper.options.onViewPostponed = onViewPostponedSpy;
                            paper.options.elementView = joint.dia.ElementView.extend({
                                confirmUpdate: function() {
                                    return leftoverFlag;
                                }
                            });
                            var rect = new joint.shapes.standard.Rectangle();
                            rect.addTo(graph);
                            var rectView = rect.findView(paper);
                            assert.ok(onViewPostponedSpy.calledOnce);
                            assert.ok(onViewPostponedSpy.calledWithExactly(rectView, sinon.match.number, paper));
                            assert.ok(onViewPostponedSpy.calledOn(paper));
                            onViewPostponedSpy.resetHistory();
                            rect.translate(10, 0);
                            assert.ok(onViewPostponedSpy.notCalled);
                        });

                        QUnit.test('force postponed view update', function(assert) {
                            paper.options.viewport = function(view) { return view.model.isLink(); };
                            var onViewPostponedSpy = sinon.spy(paper.options, 'onViewPostponed');
                            var rect1 = new joint.shapes.standard.Rectangle();
                            var rect2 = new joint.shapes.standard.Rectangle();
                            var link = new joint.shapes.standard.Link();
                            link.source(rect1);
                            link.target(rect2);
                            paper.freeze();
                            link.addTo(graph);
                            rect1.addTo(graph);
                            rect2.addTo(graph);
                            paper.unfreeze();
                            assert.ok(onViewPostponedSpy.calledOnce);
                            assert.ok(onViewPostponedSpy.calledWithExactly(link.findView(paper), sinon.match.number, paper));
                            assert.equal(cellNodesCount(paper), 3);
                            assert.equal(3, paper.getMountedViews().length);
                            assert.equal(0, paper.getUnmountedViews().length);
                        });
                    });
                });

                QUnit.module('prototype', function() {

                    QUnit.module('updateViews()', function() {

                        QUnit.module('options', function() {

                            QUnit.test('batchSize', function(assert) {
                                paper.freeze();
                                var rect1 = new joint.shapes.standard.Rectangle();
                                var rect2 = new joint.shapes.standard.Rectangle();
                                rect1.addTo(graph);
                                rect2.addTo(graph);
                                var res = paper.updateViews({ batchSize: 1 });
                                assert.deepEqual(res, { batches: 2, updated: 2, priority: 0 });
                                assert.equal(cellNodesCount(paper), 2);
                            });

                            QUnit.module('viewport', function() {

                                QUnit.test('sanity', function(assert) {

                                    paper.freeze();
                                    var rect1 = new joint.shapes.standard.Rectangle();
                                    var rect2 = new joint.shapes.standard.Rectangle();
                                    rect1.addTo(graph);
                                    rect2.addTo(graph);
                                    var viewportSpy = sinon.spy(function() { return true; });
                                    var res = paper.updateViews({ viewport: viewportSpy });
                                    assert.deepEqual(res, { batches: 1, updated: 2, priority: 0 });
                                    assert.equal(cellNodesCount(paper), 2);
                                    assert.ok(viewportSpy.calledTwice);
                                    assert.equal(2, paper.getMountedViews().length);
                                    assert.equal(0, paper.getUnmountedViews().length);
                                    // Unmount a view because it's not in the viewport and update views with a different viewport
                                    paper.checkViewport({ viewport: function() { return false; } });
                                    rect1.translate(10, 0);
                                    assert.equal(0, paper.getMountedViews().length);
                                    assert.equal(2, paper.getUnmountedViews().length);
                                    paper.updateViews({ viewport: function() { return true; } });
                                    assert.equal(cellNodesCount(paper), 1);
                                    assert.equal(1, paper.getMountedViews().length);
                                    assert.equal(1, paper.getUnmountedViews().length);
                                });

                                QUnit.test('view removal', function(assert) {
                                    var rect1 = new joint.shapes.standard.Rectangle();
                                    rect1.addTo(graph);
                                    assert.ok(paper.findViewByModel(rect1));
                                    paper.freeze();
                                    rect1.remove();
                                    paper.updateViews({ viewport: function() { return false; } });
                                    assert.notOk(paper.findViewByModel(rect1));
                                });

                                QUnit.test('detachable', function(assert) {
                                    paper.options.elementView = joint.dia.ElementView.extend({
                                        DETACHABLE: false
                                    });
                                    var rect1 = new joint.shapes.standard.Rectangle();
                                    rect1.addTo(graph);
                                    paper.freeze();
                                    paper.checkViewport({ viewport: function() { return false; } });
                                    assert.equal(cellNodesCount(paper), 1);
                                });
                            });
                        });
                    });

                    QUnit.test('dumpViews()', function(assert) {
                        var rect1 = new joint.shapes.standard.Rectangle();
                        var rect2 = new joint.shapes.standard.Rectangle();
                        var link = new joint.shapes.standard.Link();
                        rect1.resize(100, 100);
                        rect2.resize(100, 100);
                        rect2.position(200, 0);
                        link.source(rect1);
                        link.target(rect2);
                        paper.options.viewport = function(view) { return view.model === rect1; };
                        rect1.addTo(graph);
                        rect2.addTo(graph);
                        link.addTo(graph);
                        assert.equal(cellNodesCount(paper), 1);
                        paper.dumpViews();
                        assert.equal(cellNodesCount(paper), 3);
                        assert.checkBbox(paper, rect1, 0, 0, 100, 100);
                        assert.checkBbox(paper, rect2, 200, 0, 100, 100);
                        assert.checkBbox(paper, link, 100, 50, 100, 0);
                    });

                    QUnit.test('checkViewport()', function(assert) {
                        var rect1 = new joint.shapes.standard.Rectangle();
                        var rect2 = new joint.shapes.standard.Rectangle();
                        var rect3 = new joint.shapes.standard.Rectangle();
                        var rectNever = new joint.shapes.standard.Rectangle();
                        var rectAlways = new joint.shapes.standard.Rectangle();
                        paper.options.viewport = function(view) { return [rect1, rectAlways].indexOf(view.model) > -1; };
                        paper.freeze();
                        rect1.addTo(graph);
                        rect2.addTo(graph);
                        rect3.addTo(graph);
                        rectNever.addTo(graph);
                        rectAlways.addTo(graph);
                        paper.unfreeze();
                        var rect1View = rect1.findView(paper);
                        var rect2View = rect2.findView(paper);
                        var rect3View = rect3.findView(paper);
                        var rectAlwaysView = rectAlways.findView(paper);
                        paper.options.viewport = function(view) { return [rect2, rect3, rectAlways].indexOf(view.model) > -1; };
                        assert.equal(cellNodesCount(paper), 2);
                        assert.equal(rect1View.el.parentNode, paper.cells);
                        assert.equal(rectAlwaysView.el.parentNode, paper.cells);
                        var res1 = paper.checkViewport();
                        assert.deepEqual(res1, { mounted: 2, unmounted: 1 });
                        paper.updateViews();
                        assert.equal(cellNodesCount(paper), 3);
                        assert.equal(rect2View.el.parentNode, paper.cells);
                        assert.equal(rect3View.el.parentNode, paper.cells);
                        assert.equal(rectAlwaysView.el.parentNode, paper.cells);
                        paper.options.viewport = function(view) { return [rect1, rectAlways].indexOf(view.model) > -1; };
                        var res2 = paper.checkViewport();
                        assert.deepEqual(res2, { mounted: 1, unmounted: 2 });
                        paper.updateViews();
                        assert.equal(cellNodesCount(paper), 2);
                        assert.equal(rect1.findView(paper).el.parentNode, paper.cells);
                        assert.equal(rectAlwaysView.el.parentNode, paper.cells);
                    });

                    QUnit.test('requireView()', function(assert) {
                        assert.equal(paper.requireView(), null);
                        paper.options.viewport = function() { return false; };
                        var rect = new joint.shapes.standard.Rectangle();
                        rect.translate(201, 202);
                        rect.resize(101, 102);
                        rect.addTo(graph);
                        var rectView = rect.findView(paper);
                        assert.notOk(rectView.el.parentNode);
                        rectView = paper.requireView(rect);
                        assert.ok(rectView.el.parentNode, paper.cells);
                        assert.checkBbox(paper, rect, 201, 202, 101, 102);
                    });

                    QUnit.module('freeze(), unfreeze(), isFrozen()', function() {

                        QUnit.test('sanity', function(assert) {
                            assert.equal(cellNodesCount(paper), 0);
                            assert.notOk(paper.isFrozen());
                            paper.freeze();
                            assert.ok(paper.isFrozen());
                            var rect = new joint.shapes.standard.Rectangle();
                            rect.addTo(graph);
                            assert.ok(paper.isFrozen());
                            assert.equal(cellNodesCount(paper), 0);
                            assert.equal(0, paper.getMountedViews().length);
                            assert.equal(1, paper.getUnmountedViews().length);
                            paper.unfreeze();
                            assert.notOk(paper.isFrozen());
                            assert.equal(cellNodesCount(paper), 1);
                            assert.equal(1, paper.getMountedViews().length);
                            assert.equal(0, paper.getUnmountedViews().length);
                        });

                        QUnit.test('add+remove+change+add while frozen', function(assert) {
                            paper.freeze();
                            var rect = new joint.shapes.standard.Rectangle();
                            rect.resize(50, 50);
                            rect.position(0, 0);
                            rect.addTo(graph);
                            rect.remove();
                            rect.resize(101, 102);
                            rect.translate(201, 202);
                            rect.addTo(graph);
                            paper.unfreeze();
                            assert.equal(cellNodesCount(paper), 1);
                            assert.checkBbox(paper, rect, 201, 202, 101, 102);
                            rect.remove();
                            assert.equal(cellNodesCount(paper), 0);
                        });

                        QUnit.test('keep frozen on reset views', function(assert) {
                            paper.freeze();
                            var rect = new joint.shapes.standard.Rectangle();
                            rect.resize(101, 102);
                            rect.position(201, 202);
                            graph.resetCells([rect]);
                            assert.equal(cellNodesCount(paper), 0);
                            assert.ok(paper.isFrozen());
                            paper.unfreeze();
                            assert.notOk(paper.isFrozen());
                            assert.equal(cellNodesCount(paper), 1);
                            assert.checkBbox(paper, rect, 201, 202, 101, 102);
                        });

                        QUnit.module('options', function() {

                            QUnit.module('key', function() {

                                QUnit.test('keep unfrozen', function(assert) {
                                    assert.notOk(paper.isFrozen());
                                    paper.freeze({ key: 'test1' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test2' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test1' });
                                    assert.notOk(paper.isFrozen());
                                });

                                QUnit.test('keep frozen', function(assert) {
                                    paper.freeze();
                                    assert.ok(paper.isFrozen());
                                    paper.freeze({ key: 'test1' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test2' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test1' });
                                    assert.ok(paper.isFrozen());
                                });

                                QUnit.test('keep unfrozen - nested', function(assert) {
                                    assert.notOk(paper.isFrozen());
                                    // UNFROZEN
                                    paper.freeze({ key: 'test1' });
                                    assert.ok(paper.isFrozen());
                                    // < nested
                                    paper.freeze({ key: 'test2' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test2' });
                                    assert.ok(paper.isFrozen());
                                    // nested >
                                    paper.unfreeze({ key: 'test1' });
                                    assert.notOk(paper.isFrozen());
                                });

                                QUnit.test('keep frozen - nested', function(assert) {
                                    paper.freeze();
                                    assert.ok(paper.isFrozen());
                                    // FROZEN
                                    paper.freeze({ key: 'test1' });
                                    assert.ok(paper.isFrozen());
                                    // < nested
                                    paper.freeze({ key: 'test2' });
                                    assert.ok(paper.isFrozen());
                                    paper.unfreeze({ key: 'test2' });
                                    assert.ok(paper.isFrozen());
                                    // nested >
                                    paper.unfreeze({ key: 'test1' });
                                    assert.ok(paper.isFrozen());
                                });
                            });
                        });
                    });
                });
            });
        });

    });

    QUnit.module('async = TRUE, frozen = TRUE', function(hooks) {

        hooks.beforeEach(function() {
            addCells(graph);
            paper = new Paper({
                el: paperEl,
                model: graph,
                async: true,
                frozen: true,
                sorting: Paper.sorting.APPROX
            });
        });

        QUnit.test('sanity', function(assert) {
            assert.ok(paper.isFrozen());
            assert.ok(paper.isAsync());
            assert.equal(cellNodesCount(paper), 0);
        });

        QUnit.test('unfreeze existing cells', function(assert) {
            var done = assert.async();
            paper.on('render:done', function() {
                assert.equal(cellNodesCount(paper), 3);
                done();
            });
            paper.unfreeze();
        });

        QUnit.test('dumping existing cells', function(assert) {
            paper.dumpViews();
            assert.equal(cellNodesCount(paper), 3);
        });
    });

    QUnit.module('async = TRUE, frozen = FALSE', function(hooks) {

        hooks.beforeEach(function() {
            paper = new Paper({
                el: paperEl,
                model: graph,
                async: true,
                frozen: false,
                sorting: Paper.sorting.APPROX
            });
        });

        QUnit.test('sanity', function(assert) {
            assert.notOk(paper.isFrozen());
            assert.ok(paper.isAsync());
        });

        QUnit.module('prototype', function() {

            QUnit.module('freeze(), unfreeze(), isFrozen()', function() {

                QUnit.test('sanity', function(assert) {
                    var done = assert.async();
                    assert.expect(5);
                    paper.on('render:done', function() {
                        assert.notOk(paper.isFrozen());
                        assert.equal(cellNodesCount(paper), 1);
                        done();
                    });
                    assert.notOk(paper.isFrozen());
                    paper.freeze();
                    assert.ok(paper.isFrozen());
                    var rect = new joint.shapes.standard.Rectangle();
                    rect.addTo(graph);
                    paper.unfreeze();
                    assert.equal(cellNodesCount(paper), 0);
                });
            });

            QUnit.test('hasScheduledUpdates()', function(assert) {
                var done = assert.async();
                assert.expect(4);
                assert.notOk(paper.hasScheduledUpdates());
                paper.on('render:done', function() {
                    assert.notOk(paper.hasScheduledUpdates());
                    done();
                });
                var rect = new joint.shapes.standard.Rectangle();
                rect.addTo(graph);
                assert.ok(paper.hasScheduledUpdates());
                paper.unfreeze();
                assert.ok(paper.hasScheduledUpdates());
            });

            QUnit.module('options', function() {

                QUnit.test('progress + batchSize', function(assert) {
                    var done = assert.async();
                    assert.expect(13);
                    var progressCounter = 0;
                    var progressSpy = sinon.spy(function(finished, processed, total) {
                        assert.equal(processed, ++progressCounter);
                        assert.equal(total, graph.getCells().length);
                        if (finished) {
                            assert.ok(paper.isFrozen());
                            assert.notOk(paper._updates.id);
                            done();
                        }
                    });
                    paper.on('render:done', function() {
                        assert.equal(progressSpy.callCount, 3);
                        assert.ok(progressSpy.alwaysCalledWith(sinon.match.bool, sinon.match.number, sinon.match.number /* stats */));
                        assert.ok(progressSpy.alwaysCalledOn(paper));
                        progressSpy.resetHistory();
                        paper.freeze();
                    });
                    paper.freeze();
                    graph.resetCells([
                        new joint.shapes.standard.Rectangle(),
                        new joint.shapes.standard.Rectangle(),
                        new joint.shapes.standard.Rectangle(),
                        new joint.shapes.standard.Rectangle()
                    ]);
                    paper.unfreeze({ batchSize: 1, progress: progressSpy });
                });

                QUnit.test('afterRender, beforeRender', function(assert) {
                    var done = assert.async();
                    assert.expect(8);
                    var beforeSpy = sinon.spy();
                    var afterSpy = sinon.spy();
                    paper.on('render:done', function() {
                        assert.equal(beforeSpy.callCount, 1);
                        assert.ok(beforeSpy.alwaysCalledWith(opt3, paper));
                        assert.ok(beforeSpy.alwaysCalledOn(paper));
                        assert.equal(afterSpy.callCount, 1);
                        assert.ok(afterSpy.alwaysCalledWith(sinon.match.object, opt3, paper));
                        assert.ok(afterSpy.alwaysCalledOn(paper));
                        beforeSpy.resetHistory();
                        afterSpy.resetHistory();
                        setTimeout(function() {
                            // Make sure, the beforeRender callback is not called on every tick
                            assert.notOk(beforeSpy.called);
                            assert.notOk(afterSpy.called);
                            done();
                        }, 200);
                    });
                    paper.freeze();
                    graph.resetCells([
                        new joint.shapes.standard.Rectangle()
                    ]);
                    paper.unfreeze({ i: 1, beforeRender: beforeSpy, afterRender: afterSpy });
                    paper.unfreeze({ i: 2, beforeRender: beforeSpy, afterRender: afterSpy });
                    var opt3 = { i: 3, beforeRender: beforeSpy, afterRender: afterSpy };
                    paper.unfreeze(opt3);
                });

                QUnit.test('beforeRender, afterRender + viewport', function(assert) {
                    var done = assert.async();
                    assert.expect(4);
                    var beforeSpy = sinon.spy();
                    var afterSpy = sinon.spy();
                    paper.freeze();
                    var el = new joint.shapes.standard.Rectangle();
                    graph.resetCells([el]);
                    paper.dumpViews({ viewport: function() { return false; } });
                    el.translate(10, 10);
                    // el view needs to be mounted first and then an update can be done
                    paper.on('render:done', function() {
                        assert.equal(beforeSpy.callCount, 1);
                        assert.equal(afterSpy.callCount, 1);
                        beforeSpy.resetHistory();
                        afterSpy.resetHistory();
                        setTimeout(function() {
                            // Make sure, the beforeRender callback is not called on every tick
                            assert.notOk(beforeSpy.called);
                            assert.notOk(afterSpy.called);
                            done();
                        }, 200);
                    });
                    paper.unfreeze({
                        beforeRender: beforeSpy,
                        afterRender: afterSpy,
                        viewport: function() { return true; }
                    });
                });

            });
        });

        QUnit.module('events', function() {

            QUnit.module('render:done', function() {

                QUnit.test('unfrozen', function(assert) {
                    paper.freeze();
                    paper.unfreeze();
                    var rect1 = new joint.shapes.standard.Rectangle();
                    var rect2 = new joint.shapes.standard.Rectangle();
                    var done = assert.async();
                    var renderDoneSpy = sinon.spy(function() { rect2.addTo(graph); });
                    paper.on('render:done', renderDoneSpy);
                    graph.resetCells([rect1]);
                    assert.expect(1);
                    setTimeout(function() {
                        assert.equal(renderDoneSpy.callCount, 2);
                        done();
                    }, 100);
                });

                QUnit.test('frozen', function(assert) {
                    paper.unfreeze();
                    paper.freeze();
                    var rect1 = new joint.shapes.standard.Rectangle();
                    var rect2 = new joint.shapes.standard.Rectangle();
                    var done = assert.async();
                    var renderDoneSpy = sinon.spy(function() { rect2.addTo(graph); });
                    assert.expect(1);
                    paper.on('render:done', renderDoneSpy);
                    graph.resetCells([rect1]);
                    setTimeout(function() {
                        assert.equal(renderDoneSpy.callCount, 0);
                        done();
                    }, 100);
                });

            });

        });
    });
});

