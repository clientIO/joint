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

        });

    });

    QUnit.module('perpendicular', function() {

    });

    QUnit.module('midSide', function() {

    });

});
