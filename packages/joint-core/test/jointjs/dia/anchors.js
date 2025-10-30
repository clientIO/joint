QUnit.module('anchors', function(hooks) {

    var paper, graph, paperEl, link, linkView;

    const portSize = { width: 23, height: 29 };

    hooks.beforeEach(function() {

        var fixtureEl = document.getElementById('qunit-fixture') || document.createElement('div');
        paperEl = document.createElement('div');
        fixtureEl.id = 'qunit-fixture';
        fixtureEl.appendChild(paperEl);
        document.body.appendChild(fixtureEl);

        graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        paper = new joint.dia.Paper({
            el: paperEl,
            model: graph,
            cellViewNamespace: joint.shapes,
        });

        const element1 = new joint.shapes.standard.Rectangle({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    left: {
                        position: 'left',
                        size: portSize
                    }
                },
                items: [{
                    group: 'left',
                    id: 'port1',
                }]
            }

        });
        element1.addTo(graph);

        const element2 = new joint.shapes.standard.Rectangle({
            position: { x: 400, y: 100 },
            size: { width: 100, height: 100 },
        });
        element2.addTo(graph);

        link = new joint.shapes.standard.Link({
            target: { id: element1.id, port: 'port1' },
            source: { id: element2.id }
        });
        link.addTo(graph);

        linkView = link.findView(paper);
    });

    hooks.afterEach(function() {

        if (paper) paper.remove();
        paper = null;
        paperEl = null;
        graph = null;
        link = null;
        linkView = null;
    });

    QUnit.module('fixed', function() {

        [{
            name: 'center',
        }, {
            name: 'top',
            method: 'topMiddle',
        }, {
            name: 'bottom',
            method: 'bottomMiddle',
        }, {
            name: 'left',
            method: 'leftMiddle',
        }, {
            name: 'right',
            method: 'rightMiddle',
        }, {
            name: 'topLeft'
        }, {
            name: 'topRight'
        }, {
            name: 'bottomLeft'
        }, {
            name: 'bottomRight'
        }].forEach(function({ name, method = name }) {

            const angle = 31;

            QUnit.test(`${name}: useModelGeometry=true, rotate=true`, function(assert) {

                const sourceElement = link.getSourceElement();
                const sourceBBox = sourceElement.getBBox();
                const sourceCenter = sourceBBox.center();
                const anchor = {
                    name,
                    args: {
                        rotate: true,
                        useModelGeometry: true
                    }
                };

                link.prop(['source', 'anchor'], anchor, { rewrite: true });
                const expectedPoint = sourceBBox[method]();

                // Un-rotated source element.
                assert.ok(
                    expectedPoint.equals(linkView.sourceAnchor)
                );

                // Rotated source element.
                // The point is calculated before the rotation, and then
                // rotated around the center of the source element.
                sourceElement.rotate(angle);
                assert.ok(
                    expectedPoint.equals(
                        linkView.sourceAnchor.clone().rotate(sourceCenter, angle).round()
                    )
                );
            });

            QUnit.test(`${name}: useModelGeometry=true, rotate=false`, function(assert) {

                const sourceElement = link.getSourceElement();
                const sourceBBox = sourceElement.getBBox();
                const sourceCenter = sourceBBox.center();
                const anchor = {
                    name,
                    args: {
                        rotate: false,
                        useModelGeometry: true
                    }
                };

                link.prop(['source', 'anchor'], anchor, { rewrite: true });
                const expectedPoint = sourceBBox[method]();

                // Un-rotated source element.
                assert.ok(
                    expectedPoint.equals(linkView.sourceAnchor)
                );

                // Rotated source element.
                // The point is fixed on the rotated bounding box.
                sourceElement.rotate(angle);
                const expectedPointRotated = sourceBBox.clone().rotateAroundCenter(angle)[method]().round();
                assert.ok(
                    expectedPointRotated.equals(linkView.sourceAnchor.round())
                );
            });

            QUnit.test(`${name} connected to a port: useModelGeometry=true, rotate=true`, function(assert) {

                const targetElement = link.getTargetElement();
                const targetBBox = targetElement.getBBox();
                const targetCenter = targetBBox.center();
                const anchor = {
                    name,
                    args: {
                        rotate: true,
                        useModelGeometry: true
                    }
                };

                link.prop(['target', 'anchor'], anchor, { rewrite: true });

                const port = targetElement.getPort(link.target().port);
                // TODO: we ignore the port angle for now
                const portBBox = g.Rect({
                    ...targetElement.getPortsPositions(port.group)[port.id],
                    ...portSize
                });

                portBBox.offset(-portSize.width / 2 + targetBBox.x, -portSize.height / 2 + targetBBox.y);

                const expectedPoint = portBBox[method]();

                // Un-rotated target element.
                assert.ok(
                    expectedPoint.equals(linkView.targetAnchor)
                );

                // Rotated target element.
                // The point is calculated before the rotation, and then
                // rotated around the center of the target element.
                targetElement.rotate(angle);
                assert.ok(
                    expectedPoint.clone().round(1).equals(
                        linkView.targetAnchor.clone().rotate(targetCenter, angle).round(1)
                    )
                );
            });

            QUnit.test(`${name} connected to a port: useModelGeometry=true, rotate=false`, function(assert) {

                const targetElement = link.getTargetElement();
                const targetBBox = targetElement.getBBox();
                const targetCenter = targetBBox.center();
                const anchor = {
                    name,
                    args: {
                        rotate: false,
                        useModelGeometry: true
                    }
                };

                link.prop(['target', 'anchor'], anchor, { rewrite: true });

                // TODO: we ignore the port angle for now
                const port = targetElement.getPort(link.target().port);
                const portPosition = targetElement.getPortsPositions(port.group)[port.id];
                const portBBox = new g.Rect({
                    ...portPosition,
                    ...portSize
                });

                portBBox.offset(-portSize.width / 2 + targetBBox.x, -portSize.height / 2 + targetBBox.y);

                const expectedPoint = portBBox[method]();

                // Un-rotated target element.
                assert.ok(
                    expectedPoint.equals(linkView.targetAnchor)
                );

                // Rotated target element.
                // The point is calculated from the rotated bounding box of the port.
                targetElement.rotate(angle);

                const portBBoxRotated = new g.Rect({
                    ...new g.Point(portPosition).offset(targetBBox.topLeft()).rotate(targetCenter, -angle),
                    ...portSize
                });
                portBBoxRotated.offset(-portSize.width / 2, -portSize.height / 2);
                portBBoxRotated.rotateAroundCenter(angle);

                const expectedPointRotated = portBBoxRotated[method]().round(2);

                assert.ok(
                    expectedPointRotated.equals(linkView.targetAnchor.round(2))
                );
            });

            QUnit.module(`${name}: dx,dy`, function() {

                QUnit.test('number', function(assert) {
                    const dx = 23;
                    const dy = -47;
                    const anchor = {
                        name,
                        args: {
                            useModelGeometry: true,
                            dx,
                            dy
                        }
                    };

                    link.prop(['source', 'anchor'], anchor, { rewrite: true });

                    const expectedPoint = link.getSourceElement().getBBox()[method]().offset(dx, dy).round();

                    assert.ok(
                        expectedPoint.equals(linkView.sourceAnchor)
                    );

                });

                QUnit.test('percentage', function(assert) {
                    const dx = '23%';
                    const dy = '-47%';
                    const anchor = {
                        name,
                        args: {
                            useModelGeometry: true,
                            dx,
                            dy
                        }
                    };

                    link.prop(['source', 'anchor'], anchor, { rewrite: true });

                    const sourceBBox = link.getSourceElement().getBBox();
                    const dxValue = parseFloat(dx) / 100 * sourceBBox.width;
                    const dyValue = parseFloat(dy) / 100 * sourceBBox.height;
                    const expectedPoint = sourceBBox[method]().offset(dxValue, dyValue).round();

                    assert.ok(
                        expectedPoint.equals(linkView.sourceAnchor)
                    );
                });

                QUnit.test('calc expression', function(assert) {
                    const dx = 'calc(w + 23)';
                    const dy = 'calc(h - 47)';
                    const anchor = {
                        name,
                        args: {
                            useModelGeometry: true,
                            dx,
                            dy
                        }
                    };

                    link.prop(['source', 'anchor'], anchor, { rewrite: true });

                    const sourceBBox = link.getSourceElement().getBBox();
                    const dxValue = Number(joint.util.evalCalcExpression(dx, sourceBBox));
                    const dyValue = Number(joint.util.evalCalcExpression(dy, sourceBBox));
                    const expectedPoint = sourceBBox[method]().offset(dxValue, dyValue).round();

                    assert.ok(
                        expectedPoint.equals(linkView.sourceAnchor)
                    );
                });
            });

        });

    });

    QUnit.module('perpendicular', function() {

    });

    QUnit.module('midSide', function() {

        QUnit.module('option: mode', function() {

            QUnit.test('auto', function(assert) {

                const anchor = {
                    name: 'midSide',
                    args: {
                        mode: 'auto'
                    }
                };
                link.prop(['source', 'anchor'], anchor, { rewrite: true });

                const sourceBBox = link.getSourceElement().getBBox();

                link.target(sourceBBox.leftMiddle().offset(-100, 0));
                assert.ok(
                    sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.topMiddle().offset(0, -100));
                assert.ok(
                    sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.rightMiddle().offset(100, 0));
                assert.ok(
                    sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.bottomMiddle().offset(0, 100));
                assert.ok(
                    sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                );
            });

            QUnit.test('horizontal', function(assert) {
                const anchor = {
                    name: 'midSide',
                    args: {
                        mode: 'horizontal'
                    }
                };
                link.prop(['source', 'anchor'], anchor, { rewrite: true });

                const sourceBBox = link.getSourceElement().getBBox();

                link.target(sourceBBox.leftMiddle().offset(-100, 0));
                assert.ok(
                    sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.topMiddle().offset(10, -100));
                assert.ok(
                    sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.rightMiddle().offset(100, 0));
                assert.ok(
                    sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.bottomMiddle().offset(-10, 100));
                assert.ok(
                    sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                );
            });

            QUnit.test('vertical', function(assert) {
                const anchor = {
                    name: 'midSide',
                    args: {
                        mode: 'vertical'
                    }
                };
                link.prop(['source', 'anchor'], anchor, { rewrite: true });

                const sourceBBox = link.getSourceElement().getBBox();

                link.target(sourceBBox.leftMiddle().offset(-100, 10));
                assert.ok(
                    sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.topMiddle().offset(0, -100));
                assert.ok(
                    sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.rightMiddle().offset(100, -10));
                assert.ok(
                    sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                );

                link.target(sourceBBox.bottomMiddle().offset(0, 100));
                assert.ok(
                    sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                );
            });

            QUnit.module('prefer-vertical', function() {

                [undefined, 0].forEach(function(anchorPreferenceThreshold) {
                    QUnit.test(`preferenceThreshold=${anchorPreferenceThreshold}`, function(assert) {
                        const anchor = {
                            name: 'midSide',
                            args: {
                                mode: 'prefer-vertical',
                                preferenceThreshold: anchorPreferenceThreshold
                            }
                        };
                        link.prop(['source', 'anchor'], anchor, { rewrite: true });

                        const sourceBBox = link.getSourceElement().getBBox();

                        link.target(sourceBBox.leftMiddle().offset(-100, 0));
                        assert.ok(
                            sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.topMiddle().offset(0, -100));
                        assert.ok(
                            sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.rightMiddle().offset(100, 0));
                        assert.ok(
                            sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.bottomMiddle().offset(0, 100));
                        assert.ok(
                            sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.topLeft().offset(-100, -100));
                        assert.ok(
                            sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.topRight().offset(100, -100));
                        assert.ok(
                            sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.bottomLeft().offset(-100, 100));
                        assert.ok(
                            sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.bottomRight().offset(100, 100));
                        assert.ok(
                            sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.topLeft().offset(-100, 1));
                        assert.ok(
                            sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.topRight().offset(100, 1));
                        assert.ok(
                            sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.bottomLeft().offset(-100, -1));
                        assert.ok(
                            sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                        );

                        link.target(sourceBBox.bottomRight().offset(100, -1));
                        assert.ok(
                            sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                        );
                    });
                });

                QUnit.test('preferenceThreshold=13', function(assert) {
                    const preferenceThreshold = 13;
                    const anchor = {
                        name: 'midSide',
                        args: {
                            mode: 'prefer-vertical',
                            preferenceThreshold
                        }
                    };
                    link.prop(['source', 'anchor'], anchor, { rewrite: true });

                    const sourceBBox = link.getSourceElement().getBBox();

                    link.target(sourceBBox.leftMiddle().offset(-100, 0));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topMiddle().offset(0, -100));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.rightMiddle().offset(100, 0));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomMiddle().offset(0, 100));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topLeft().offset(-100, -preferenceThreshold));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topRight().offset(100, -preferenceThreshold));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomLeft().offset(-100, preferenceThreshold));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomRight().offset(100, preferenceThreshold));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topLeft().offset(-100, -preferenceThreshold + 1));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topRight().offset(100, -preferenceThreshold + 1));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomLeft().offset(-100, preferenceThreshold - 1));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomRight().offset(100, preferenceThreshold - 1));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );
                });

                QUnit.test('preferenceThreshold={ top: 13, bottom: 23 }', function(assert) {
                    const preferenceThreshold = { top: 13, bottom: 23 };
                    const anchor = {
                        name: 'midSide',
                        args: {
                            mode: 'prefer-vertical',
                            preferenceThreshold
                        }
                    };
                    link.prop(['source', 'anchor'], anchor, { rewrite: true });

                    const sourceBBox = link.getSourceElement().getBBox();

                    link.target(sourceBBox.leftMiddle().offset(-100, 0));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topMiddle().offset(0, -100));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.rightMiddle().offset(100, 0));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomMiddle().offset(0, 100));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topLeft().offset(-100, -preferenceThreshold.top));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topRight().offset(100, -preferenceThreshold.top));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomLeft().offset(-100, preferenceThreshold.bottom));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomRight().offset(100, preferenceThreshold.bottom));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topLeft().offset(-100, -preferenceThreshold.top + 1));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topRight().offset(100, -preferenceThreshold.top + 1));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomLeft().offset(-100, preferenceThreshold.bottom - 1));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomRight().offset(100, preferenceThreshold.bottom - 1));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );
                });

            });

            QUnit.module('prefer-horizontal', function() {

                [undefined, 0].forEach(function(anchorPreferenceThreshold) {
                    QUnit.test(
                        `preferenceThreshold=${anchorPreferenceThreshold}`,
                        function(assert) {
                            const anchor = {
                                name: 'midSide',
                                args: {
                                    mode: 'prefer-horizontal',
                                    preferenceThreshold:
                                        anchorPreferenceThreshold,
                                },
                            };
                            link.prop(['source', 'anchor'], anchor, {
                                rewrite: true,
                            });

                            const sourceBBox = link
                                .getSourceElement()
                                .getBBox();

                            link.target(
                                sourceBBox.leftMiddle().offset(-100, 0)
                            );
                            assert.ok(
                                sourceBBox
                                    .leftMiddle()
                                    .equals(linkView.sourceAnchor)
                            );

                            link.target(sourceBBox.topMiddle().offset(0, -100));
                            assert.ok(
                                sourceBBox
                                    .topMiddle()
                                    .equals(linkView.sourceAnchor)
                            );

                            link.target(
                                sourceBBox.rightMiddle().offset(100, 0)
                            );
                            assert.ok(
                                sourceBBox
                                    .rightMiddle()
                                    .equals(linkView.sourceAnchor)
                            );

                            link.target(
                                sourceBBox.bottomMiddle().offset(0, 100)
                            );
                            assert.ok(
                                sourceBBox
                                    .bottomMiddle()
                                    .equals(linkView.sourceAnchor)
                            );

                            link.target(
                                sourceBBox.topLeft().offset(-100, -100)
                            );
                            assert.ok(
                                sourceBBox
                                    .leftMiddle()
                                    .equals(linkView.sourceAnchor)
                            );

                            link.target(
                                sourceBBox.topRight().offset(100, -100)
                            );
                            assert.ok(
                                sourceBBox
                                    .rightMiddle()
                                    .equals(linkView.sourceAnchor)
                            );

                            link.target(
                                sourceBBox.bottomLeft().offset(-100, 100)
                            );
                            assert.ok(
                                sourceBBox
                                    .leftMiddle()
                                    .equals(linkView.sourceAnchor)
                            );

                            link.target(
                                sourceBBox.bottomRight().offset(100, 100)
                            );
                            assert.ok(
                                sourceBBox
                                    .rightMiddle()
                                    .equals(linkView.sourceAnchor)
                            );
                        }
                    );
                });

                QUnit.test('preferenceThreshold=13', function(assert) {
                    const preferenceThreshold = 13;
                    const anchor = {
                        name: 'midSide',
                        args: {
                            mode: 'prefer-horizontal',
                            preferenceThreshold
                        }
                    };
                    link.prop(['source', 'anchor'], anchor, { rewrite: true });

                    const sourceBBox = link.getSourceElement().getBBox();

                    link.target(sourceBBox.leftMiddle().offset(-100, 0));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topMiddle().offset(0, -100));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.rightMiddle().offset(100, 0));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomMiddle().offset(0, 100));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topLeft().offset(-preferenceThreshold, -100));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topRight().offset(preferenceThreshold, -100));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomLeft().offset(-preferenceThreshold, 100));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomRight().offset(preferenceThreshold, 100));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topLeft().offset(-preferenceThreshold + 1, -100));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topRight().offset(preferenceThreshold - 1, -100));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomLeft().offset(-preferenceThreshold + 1, 100));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomRight().offset(preferenceThreshold - 1, 100));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );
                });

                QUnit.test('preferenceThreshold={ left: 13, right: 23 }', function(assert) {
                    const preferenceThreshold = { left: 13, right: 23 };
                    const anchor = {
                        name: 'midSide',
                        args: {
                            mode: 'prefer-horizontal',
                            preferenceThreshold
                        }
                    };
                    link.prop(['source', 'anchor'], anchor, { rewrite: true });

                    const sourceBBox = link.getSourceElement().getBBox();

                    link.target(sourceBBox.leftMiddle().offset(-100, 0));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topMiddle().offset(0, -100));
                    assert.ok(
                        sourceBBox.topMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.rightMiddle().offset(100, 0));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomMiddle().offset(0, 100));
                    assert.ok(
                        sourceBBox.bottomMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topLeft().offset(-preferenceThreshold.left, -100));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.topRight().offset(preferenceThreshold.right, -100));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomLeft().offset(-preferenceThreshold.left, 100));
                    assert.ok(
                        sourceBBox.leftMiddle().equals(linkView.sourceAnchor)
                    );

                    link.target(sourceBBox.bottomRight().offset(preferenceThreshold.right, 100));
                    assert.ok(
                        sourceBBox.rightMiddle().equals(linkView.sourceAnchor)
                    );

                });
            });
        });
    });

});
