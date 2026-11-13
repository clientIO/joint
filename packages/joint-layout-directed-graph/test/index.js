'use strict';

const DirectedGraph = joint.layout.DirectedGraph;

QUnit.module('DirectedGraph', function(hooks) {

    QUnit.test('should be an object', function(assert) {

        assert.equal(typeof DirectedGraph, 'object');
    });

    QUnit.module('fromGraphLib(graphLib[, opt])', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof DirectedGraph.fromGraphLib, 'function');
        });
    });

    QUnit.test('should correctly convert a graphlib graph into JointJS graph', function(assert) {

        const glGraph = new graphlib.Graph();
        glGraph.setNode(1, { x: 50, y: 50, width: 100, height: 50, label: 'A' });
        glGraph.setNode(2, { x: 50, y: 150, width: 100, height: 50, label: 'B' });
        glGraph.setNode(3, { x: 50, y: 250, width: 100, height: 50, label: 'C' });
        glGraph.setEdge(1, 2, { label: 'Hello' });
        glGraph.setEdge(2, 3, { label: 'World!' });

        const targetGraph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const graph = DirectedGraph.fromGraphLib(glGraph, {
            graph: targetGraph,
            importNode: (nodeId, glGraph, graph, _opt) => {
                const nodeData = glGraph.node(nodeId);
                const element = new joint.shapes.standard.Rectangle({
                    id: nodeId,
                    position: { x: nodeData.x, y: nodeData.y },
                    size: { width: nodeData.width, height: nodeData.height },
                    attrs: { label: { text: nodeData.label }}
                });
                graph.addCell(element);
            },
            importEdge: (edgeObj, glGraph, graph, _opt) => {
                const edgeData = glGraph.edge(edgeObj);
                const link =  new joint.shapes.standard.Link({
                    source: { id: edgeObj.v },
                    target: { id: edgeObj.w },
                    labels: [{ attrs: { text: { text: edgeData.label }}}]
                });
                graph.addCell(link);
            }
        });

        assert.equal(graph, targetGraph);

        // elements
        const elements = graph.getElements();
        assert.equal(elements.length, 3);
        let id, x, y, width, height, elementLabel;

        (id = elements[0].id);
        assert.equal(id, '1');
        ({ x, y } = elements[0].position());
        assert.deepEqual({ x, y }, { x: 50, y: 50 });
        ({ width, height } = elements[0].size());
        assert.deepEqual({ width, height }, { width: 100, height: 50 });
        (elementLabel = elements[0].attr('label/text'));
        assert.equal(elementLabel, 'A');

        (id = elements[1].id);
        assert.equal(id, '2');
        ({ x, y } = elements[1].position());
        assert.deepEqual({ x, y }, { x: 50, y: 150 });
        ({ width, height } = elements[1].size());
        assert.deepEqual({ width, height }, { width: 100, height: 50 });
        (elementLabel = elements[1].attr('label/text'));
        assert.equal(elementLabel, 'B');

        (id = elements[2].id);
        assert.equal(id, '3');
        ({ x, y } = elements[2].position());
        assert.deepEqual({ x, y }, { x: 50, y: 250 });
        ({ width, height } = elements[2].size());
        assert.deepEqual({ width, height }, { width: 100, height: 50 });
        (elementLabel = elements[2].attr('label/text'));
        assert.equal(elementLabel, 'C');

        // links
        const links = graph.getLinks();
        assert.equal(links.length, 2);
        let source, target, linkLabel;

        (source = links[0].source().id);
        assert.equal(source, '1');
        (target = links[0].target().id);
        assert.equal(target, '2');
        (linkLabel = links[0].label(0).attrs.text.text);
        assert.equal(linkLabel, 'Hello');

        (source = links[1].source().id);
        assert.equal(source, '2');
        (target = links[1].target().id);
        assert.equal(target, '3');
        (linkLabel = links[1].label(0).attrs.text.text);
        assert.equal(linkLabel, 'World!');
    });

    QUnit.module('toGraphLib(jointGraph[, opt])', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof DirectedGraph.toGraphLib, 'function');
        });
    });

    QUnit.module('layout(graphOrCells[, opt])', function(hooks) {

        var graph;

        hooks.beforeEach(function() {

            graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        });

        hooks.afterEach(function() {

            graph = null;
        });

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof DirectedGraph.layout, 'function');
        });

        QUnit.test('should correctly layout the graph', function(assert) {

            var elements = [
                new joint.shapes.standard.Rectangle({
                    position: { x: 0, y: 0 },
                    size: { width: 60, height: 100 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 200, y: 0 },
                    size: { width: 40, height: 80 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 300, y: 20 },
                    size: { width: 20, height: 30 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 400, y: 50 },
                    size: { width: 30, height: 20 }
                })
            ];

            var links = [
                new joint.shapes.standard.Link({ source: { id: elements[0].id }, target: { id: elements[1].id }}),
                new joint.shapes.standard.Link({ source: { id: elements[1].id }, target: { id: elements[3].id }})
            ];

            var cells = elements.concat(links);

            graph.resetCells(cells);

            DirectedGraph.layout(graph);

            let x, y;
            ({ x, y } = elements[0].position());
            assert.deepEqual({ x, y }, { x: 0, y: 0 });
            ({ x, y } = elements[1].position());
            assert.deepEqual({ x, y }, { x: 10, y: 150 });
            ({ x, y } = elements[2].position());
            assert.deepEqual({ x, y }, { x: 110, y: 35 });
            ({ x, y } = elements[3].position());
            assert.deepEqual({ x, y }, { x: 15, y: 280 });
        });

        QUnit.test('an array of some of the cells instead of the full graph', function(assert) {

            var elements = [
                new joint.shapes.standard.Rectangle({
                    position: { x: 0, y: 0 },
                    size: { width: 60, height: 100 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 200, y: 0 },
                    size: { width: 40, height: 80 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 300, y: 20 },
                    size: { width: 20, height: 30 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 400, y: 50 },
                    size: { width: 30, height: 20 }
                })
            ];

            var links = [
                new joint.shapes.standard.Link({ source: { id: elements[0].id }, target: { id: elements[1].id }}),
                new joint.shapes.standard.Link({ source: { id: elements[1].id }, target: { id: elements[3].id }})
            ];

            var cells = elements.concat(links);

            graph.resetCells(cells);

            DirectedGraph.layout([
                elements[0],
                elements[1],
                links[0]
            ]);

            let x, y;
            ({ x, y } = elements[0].position());
            assert.deepEqual({ x, y }, { x: 0, y: 0 });
            ({ x, y } = elements[1].position());
            assert.deepEqual({ x, y }, { x: 10, y: 150 });
            ({ x, y } = elements[2].position());
            assert.deepEqual({ x, y }, { x: 300, y: 20 });
            ({ x, y } = elements[3].position());
            assert.deepEqual({ x, y }, { x: 400, y: 50 });
        });

        QUnit.test('an array of embedded cells without the parent', function(assert) {

            var elements = [
                new joint.shapes.standard.Rectangle({
                    position: { x: 0, y: 0 },
                    size: { width: 60, height: 100 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 200, y: 0 },
                    size: { width: 40, height: 80 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 300, y: 20 },
                    size: { width: 20, height: 30 }
                }),
                new joint.shapes.standard.Rectangle({
                    position: { x: 400, y: 50 },
                    size: { width: 30, height: 20 }
                })
            ];

            elements[0].embed(elements[1]);
            elements[0].embed(elements[2]);
            elements[0].embed(elements[3]);

            var links = [
                new joint.shapes.standard.Link({ source: { id: elements[1].id }, target: { id: elements[2].id }}),
                new joint.shapes.standard.Link({ source: { id: elements[2].id }, target: { id: elements[3].id }})
            ];

            var cells = elements.concat(links);

            graph.resetCells(cells);

            DirectedGraph.layout([
                elements[1],
                elements[2],
                elements[3],
                links[0],
                links[1]
            ]);

            let x, y;
            ({ x, y } = elements[0].position());
            assert.deepEqual({ x, y }, { x: 0, y: 0 });
            ({ x, y } = elements[1].position());
            assert.deepEqual({ x, y }, { x: 0, y: 0 });
            ({ x, y } = elements[2].position());
            assert.deepEqual({ x, y }, { x: 10, y: 130 });
            ({ x, y } = elements[3].position());
            assert.deepEqual({ x, y }, { x: 5, y: 210 });
        });

        QUnit.test('should return a rectangle representing the graph bounding box', function(assert) {

            var bbox;

            var elements = [
                new joint.shapes.standard.Rectangle({ size: { width: 60, height: 100 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 40, height: 80 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 20, height: 30 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 30, height: 20 }})
            ];

            var links = [
                new joint.shapes.standard.Link({ source: { id: elements[0].id }, target: { id: elements[1].id }}),
                new joint.shapes.standard.Link({ source: { id: elements[1].id }, target: { id: elements[3].id }})
            ];

            graph.resetCells(elements.concat(links));

            bbox = DirectedGraph.layout(graph);

            assert.ok(bbox instanceof joint.g.Rect);
            assert.deepEqual(bbox.toJSON(), graph.getBBox().toJSON());

            bbox = DirectedGraph.layout(graph, {
                marginX: 50,
                marginY: 100
            });
            assert.deepEqual(bbox.toJSON(), graph.getBBox().toJSON());

            bbox = DirectedGraph.layout(graph, {
                marginX: -50,
                marginY: -100
            });
            assert.deepEqual(bbox.toJSON(), graph.getBBox().toJSON());

            bbox = DirectedGraph.layout(graph, {
                marginX: -500,
                marginY: -1000
            });
            assert.deepEqual(bbox.toJSON(), graph.getBBox().toJSON());
        });

        QUnit.test('resizeClusters: false, clusterPadding: number - should not resize clusters', function(assert) {

            const deepestSize = {
                width: 500,
                height: 500
            };

            const elements = [
                new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 100, height: 300 }}),
                new joint.shapes.standard.Rectangle({ size: deepestSize })
            ];

            elements[0].embed(elements[1]);
            elements[1].embed(elements[2]);
            elements[2].embed(elements[3]);

            graph.resetCells(elements);

            const padding = 20;

            DirectedGraph.layout(graph, {
                resizeClusters: false,
                clusterPadding: padding
            });

            // Sizes remain unchanged
            const expectedSizes = [
                { width: 60, height: 60 },
                { width: 120, height: 120 },
                { width: 100, height: 300 },
                deepestSize
            ];
            for (let i = 0; i < elements.length; i++) {
                assert.deepEqual(elements[i].size(), expectedSizes[i]);
            }
        });

        QUnit.test('resizeClusters: true, clusterPadding: number - should resize clusters according to our algorithm', function(assert) {

            const deepestSize = {
                width: 500,
                height: 500
            };

            const elements = [
                new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 100, height: 300 }}),
                new joint.shapes.standard.Rectangle({ size: deepestSize })
            ];

            elements[0].embed(elements[1]);
            elements[1].embed(elements[2]);
            elements[2].embed(elements[3]);

            graph.resetCells(elements);

            const padding = 20;

            // opt.resizeClusters = `true` by default
            DirectedGraph.layout(graph, {
                clusterPadding: padding
            });

            // Parents are resized to fit all children
            // - note that we are checking from deepest child up
            const nextExpectedSize = deepestSize;
            for (let i = elements.length - 1; i >= 0; i--) {
                assert.deepEqual(elements[i].size(), nextExpectedSize);
                nextExpectedSize.width += padding * 2;
                nextExpectedSize.height += padding * 2;
            }
        });

        QUnit.test('resizeClusters: true, clusterPadding: number - should not resize clusters if `glGraph` does not hold reference to their children', function(assert) {

            const containerSize = {
                width: 500,
                height: 500
            };

            const container1 = new joint.shapes.standard.Rectangle({ size: containerSize });
            const container2 = new joint.shapes.standard.Rectangle({ size: containerSize });

            const rect1 = new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }});
            const rect2 = new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }});

            container1.embed(rect1);
            container2.embed(rect2);

            graph.resetCells([container1, container2, rect1, rect2]);

            // Do not pass the children to the layout function
            // opt.clusterPadding = `10` by default
            DirectedGraph.layout([container1, container2], {
                resizeClusters: true
            });

            // Sizes remain unchanged
            assert.deepEqual(container1.size(), containerSize);
            assert.deepEqual(container2.size(), containerSize);
        });

        QUnit.test('resizeClusters: false, clusterPadding: object - should not resize clusters', function(assert) {

            const deepestSize = {
                width: 500,
                height: 500
            };

            const elements = [
                new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 100, height: 300 }}),
                new joint.shapes.standard.Rectangle({ size: deepestSize })
            ];

            elements[0].embed(elements[1]);
            elements[1].embed(elements[2]);
            elements[2].embed(elements[3]);

            graph.resetCells(elements);

            const padding = { top: 10, right: 20, bottom: 30, left: 40 };

            DirectedGraph.layout(graph, {
                resizeClusters: false,
                clusterPadding: padding
            });

            // Sizes remain unchanged
            const expectedSizes = [
                { width: 60, height: 60 },
                { width: 120, height: 120 },
                { width: 100, height: 300 },
                deepestSize
            ];
            for (let i = 0; i < elements.length; i++) {
                assert.deepEqual(elements[i].size(), expectedSizes[i]);
            }
        });

        QUnit.test('resizeClusters: true, clusterPadding: object - should resize clusters according to our algorithm', function(assert) {

            const deepestSize = {
                width: 500,
                height: 500
            };

            const elements = [
                new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 100, height: 300 }}),
                new joint.shapes.standard.Rectangle({ size: deepestSize })
            ];

            elements[0].embed(elements[1]);
            elements[1].embed(elements[2]);
            elements[2].embed(elements[3]);

            graph.resetCells(elements);

            const padding = { top: 10, right: 20, bottom: 30, left: 40 };

            // opt.resizeClusters = `true` by default
            DirectedGraph.layout(graph, {
                clusterPadding: padding
            });

            // Parents are resized to fit all children
            // - note that we are checking from deepest child up
            const nextExpectedSize = deepestSize;
            for (let i = elements.length - 1; i >= 0; i--) {
                assert.deepEqual(elements[i].size(), nextExpectedSize);
                nextExpectedSize.width += padding.right + padding.left;
                nextExpectedSize.height += padding.top + padding.bottom;
            }
        });

        QUnit.test('resizeClusters: true, clusterPadding: object - should not resize clusters if `glGraph` does not hold reference to their children', function(assert) {

            const containerSize = {
                width: 500,
                height: 500
            };

            const container1 = new joint.shapes.standard.Rectangle({ size: containerSize });
            const container2 = new joint.shapes.standard.Rectangle({ size: containerSize });

            const rect1 = new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }});
            const rect2 = new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }});

            container1.embed(rect1);
            container2.embed(rect2);

            graph.resetCells([container1, container2, rect1, rect2]);

            const padding = { top: 10, right: 20, bottom: 30, left: 40 };

            // Do not pass the children to the layout function
            DirectedGraph.layout([container1, container2], {
                resizeClusters: true,
                clusterPadding: padding
            });

            // Sizes remain unchanged
            assert.deepEqual(container1.size(), containerSize);
            assert.deepEqual(container2.size(), containerSize);
        });

        QUnit.test('resizeClusters: false, clusterPadding: \'default\' - should not resize clusters', function(assert) {

            const deepestSize = {
                width: 500,
                height: 500
            };

            const elements = [
                new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 100, height: 300 }}),
                new joint.shapes.standard.Rectangle({ size: deepestSize })
            ];

            elements[0].embed(elements[1]);
            elements[1].embed(elements[2]);
            elements[2].embed(elements[3]);

            graph.resetCells(elements);

            DirectedGraph.layout(graph, {
                resizeClusters: false,
                clusterPadding: 'default'
            });

            // Sizes remain unchanged
            const expectedSizes = [
                { width: 60, height: 60 },
                { width: 120, height: 120 },
                { width: 100, height: 300 },
                deepestSize
            ];
            for (let i = 0; i < elements.length; i++) {
                assert.deepEqual(elements[i].size(), expectedSizes[i]);
            }
        });

        QUnit.test('resizeClusters: true, clusterPadding: \'default\' - should resize nested clusters according to default dagre algorithm', function(assert) {

            const deepestSize = {
                width: 500,
                height: 500
            };

            const elements = [
                new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }}),
                new joint.shapes.standard.Rectangle({ size: { width: 100, height: 300 }}),
                new joint.shapes.standard.Rectangle({ size: deepestSize })
            ];

            elements[0].embed(elements[1]);
            elements[1].embed(elements[2]);
            elements[2].embed(elements[3]);

            graph.resetCells(elements);

            // opt.resizeClusters = `true` by default
            DirectedGraph.layout(graph, {
                clusterPadding: 'default'
            });

            const expectedSizes = [
                { width: 650, height: 650 },
                { width: 610, height: 600 },
                { width: 570, height: 550 },
                deepestSize
            ];
            for (let i = 0; i < elements.length; i++) {
                assert.deepEqual(elements[i].size(), expectedSizes[i]);
            }
        });

        QUnit.test('resizeClusters: true, clusterPadding: \'default\' - should resize clusters with connected non-embedded children according to default dagre algorithm', function(assert) {

            const elements = [
                new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 30, height: 30 }}),
                new joint.shapes.standard.Rectangle({ position: { x: 100, y: 100 }, size: { width: 30, height: 30 }}),
                new joint.shapes.standard.Rectangle({ position: { x: 100, y: 200 }, size: { width: 30, height: 30 }}),
                new joint.shapes.standard.Rectangle({ position: { x: 200, y: 200 }, size: { width: 30, height: 30 }}),
            ];

            const links = [
                new joint.shapes.standard.Link({ source: elements[1], target: elements[2] }),
                new joint.shapes.standard.Link({ source: elements[1], target: elements[3] })
            ];

            elements[0].embed(elements[1]);

            graph.resetCells([...elements, ...links]);

            // opt.resizeClusters = `true` by default
            DirectedGraph.layout(graph, {
                clusterPadding: 'default'
            });

            const expectedBBoxes = [
                { x: 0, y: 0, width: 160, height: 80 },
                { x: 70, y: 25, width: 30, height: 30 },
                { x: 30, y: 205, width: 30, height: 30 },
                { x: 110, y: 205, width: 30, height: 30 }
            ];
            for (let i = 0; i < elements.length; i++) {
                assert.deepEqual(elements[i].getBBox(), new joint.g.Rect(expectedBBoxes[i]));
            }
        });

        QUnit.test('resizeClusters: true, clusterPadding: \'default\' - should not resize clusters if `glGraph` does not hold reference to their children', function(assert) {

            const containerSize = {
                width: 500,
                height: 500
            };

            const container1 = new joint.shapes.standard.Rectangle({ size: containerSize });
            const container2 = new joint.shapes.standard.Rectangle({ size: containerSize });

            const rect1 = new joint.shapes.standard.Rectangle({ size: { width: 60, height: 60 }});
            const rect2 = new joint.shapes.standard.Rectangle({ size: { width: 120, height: 120 }});

            container1.embed(rect1);
            container2.embed(rect2);

            graph.resetCells([container1, container2, rect1, rect2]);

            // Do not pass the children to the layout function
            // opt.resizeClusters = `true` by default
            DirectedGraph.layout([container1, container2], {
                clusterPadding: 'default'
            });

            // Sizes remain unchanged
            assert.deepEqual(container1.size(), containerSize);
            assert.deepEqual(container2.size(), containerSize);
        });

        QUnit.test('customOrder: function - should allow to specify a custom order of the elements', function(assert) {

            assert.expect(4);

            const cells = [
                new joint.shapes.standard.Rectangle({ id: '1' }),
                new joint.shapes.standard.Rectangle({ id: '2' }),
                new joint.shapes.standard.Link({
                    id: 'link',
                    source: { id: '1' },
                    target: { id: '2' },
                }),
            ];

            graph.resetCells(cells);

            DirectedGraph.layout(graph, {
                customOrder: function(glGraph, graph, order) {
                    assert.ok(graph instanceof joint.dia.Graph);
                    assert.ok(graph.getCell('1'));
                    assert.ok(graph.getCell('2'));
                    assert.ok(graph.getCell('link'));
                    order(glGraph);
                }
            });
        });
    });

    QUnit.module('layers support', function(hooks) {

        QUnit.test('should work when layout cells have layers', function(assert) {

            const el1 = new joint.shapes.standard.Rectangle({
                id: '1',
                layer: 'layer1',
                position: { x: 0, y: 0 },
                size: { width: 60, height: 100 },
            });
            const el2 = new joint.shapes.standard.Rectangle({
                id: '2',
                // default layer
                position: { x: 0, y: 0 },
                size: { width: 40, height: 80 },
            });
            const link = new joint.shapes.standard.Link({
                id: 'link',
                layer: 'layer2',
                source: { id: el1.id },
                target: { id: el2.id },
            });

            DirectedGraph.layout([el1, el2, link], {
                marginX: 1,
                marginY: 1
            });

            assert.ok(el1.position().x > 0 && el1.position().y > 0);
            assert.ok(el2.position().x > 0 && el2.position().y > 0);
        });

        QUnit.test('should work when the layout graph has layers', function(assert) {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            graph.addLayer({ id: 'layer1' });
            graph.addLayer({ id: 'layer2' });

            const el1 = new joint.shapes.standard.Rectangle({
                id: '1',
                layer: 'layer1',
                position: { x: 0, y: 0 },
                size: { width: 40, height: 100 },
            });
            const el2 = new joint.shapes.standard.Rectangle({
                id: '2',
                // default layer
                position: { x: 0, y: 0 },
                size: { width: 40, height: 100 },
            });
            const link = new joint.shapes.standard.Link({
                id: 'link',
                layer: 'layer2',
                source: { id: el1.id },
                target: { id: el2.id },
            });

            graph.addCells([el1, el2, link]);

            DirectedGraph.layout(graph, {
                rankDir: 'LR',
                marginX: 1,
                marginY: 1
            });

            assert.ok(el1.position().x > 0 && el1.position().y > 0);
            assert.ok(el2.position().x > 0 && el2.position().y > 0);
            assert.ok(el1.position().x < el2.position().x);
        });
    });

    QUnit.module('ranker: fixed', function(hooks) {

        let graph;

        hooks.beforeEach(function() {

            graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        });

        hooks.afterEach(function() {

            graph = null;
        });

        function createElement(id, rank, attributes) {
            return new joint.shapes.standard.Rectangle({
                id,
                rank,
                size: { width: 40, height: 20 },
                ...attributes
            });
        }

        function createLink(id, sourceId, targetId) {
            return new joint.shapes.standard.Link({
                id,
                source: { id: sourceId },
                target: { id: targetId },
                vertices: [{ x: 1, y: 1 }]
            });
        }

        function layout(options) {
            return DirectedGraph.layout(graph, {
                ranker: 'fixed',
                rankDir: 'LR',
                exportElement: (element) => ({ ...element.size(), rank: element.get('rank') }),
                ...options
            });
        }

        QUnit.test('should place the elements by their ranks', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 2),
                createElement('c', 2),
                createElement('d', 1),
                // `a` and `b` are not adjacent but the rank of `b` is given
                createLink('ab', 'a', 'b'),
                createLink('ac', 'a', 'c')
            ]);

            layout();

            const x = (id) => graph.getCell(id).position().x;
            assert.ok(x('a') < x('d'));
            assert.ok(x('d') < x('b'));
            assert.equal(x('b'), x('c'));
        });

        QUnit.test('should use rank 0 for the elements without a rank', function(assert) {

            graph.resetCells([
                createElement('a'),
                createElement('b', 0),
                createElement('c', 1),
                createLink('ac', 'a', 'c')
            ]);

            layout();

            const x = (id) => graph.getCell(id).position().x;
            assert.equal(x('a'), x('b'));
            assert.ok(x('a') < x('c'));
        });

        QUnit.test('should route the backward links from the source to the target', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 1),
                createElement('c', 2),
                createLink('ab', 'a', 'b'),
                createLink('bc', 'b', 'c'),
                createLink('ca', 'c', 'a')
            ]);

            layout({ setVertices: true });

            const x = (id) => graph.getCell(id).position().x;
            assert.ok(x('a') < x('b'));
            assert.ok(x('b') < x('c'));
            const vertices = graph.getCell('ca').vertices();
            assert.ok(vertices.length > 0);
            assert.ok(vertices[0].x > vertices[vertices.length - 1].x);
        });

        QUnit.test('should route the backward links outside of a cycle', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 2),
                createLink('ba', 'b', 'a')
            ]);

            const routes = {};
            layout({ setVertices: (link, points) => (routes[link.id] = points) });

            const x = (id) => graph.getCell(id).position().x;
            assert.ok(x('a') < x('b'));
            const points = routes['ba'];
            assert.ok(points.length > 1);
            assert.ok(points[0].x > points[points.length - 1].x);
        });

        QUnit.test('should not change the ranks returned by exportElement()', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 1),
                createLink('ab', 'a', 'b')
            ]);

            const nodes = new Map();
            const exportElement = (element) => {
                if (!nodes.has(element.id)) {
                    nodes.set(element.id, { ...element.size(), rank: element.get('rank') });
                }
                return nodes.get(element.id);
            };
            layout({ exportElement });
            const distance = graph.getCell('b').position().x - graph.getCell('a').position().x;
            layout({ exportElement });
            assert.equal(graph.getCell('b').position().x - graph.getCell('a').position().x, distance);
            assert.equal(nodes.get('b').rank, 1);
        });

        QUnit.test('should not lay out the links within one rank', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 0),
                createElement('c', 1),
                createLink('ab', 'a', 'b'),
                createLink('ac', 'a', 'c')
            ]);

            layout();

            const x = (id) => graph.getCell(id).position().x;
            assert.equal(x('a'), x('b'));
            assert.ok(x('a') < x('c'));
            assert.deepEqual(graph.getCell('ab').vertices(), [{ x: 1, y: 1 }]);
        });

        QUnit.test('should reset the vertices of the links within one rank', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 0),
                createLink('ab', 'a', 'b'),
            ]);

            layout({ setVertices: true });
            assert.deepEqual(graph.getCell('ab').vertices(), []);

            const calls = [];
            layout({ setVertices: (link, points) => calls.push([link, points]) });
            assert.equal(calls.length, 1);
            assert.equal(calls[0][0], graph.getCell('ab'));
            assert.deepEqual(calls[0][1], []);
        });

        QUnit.test('should lay out the nested clusters', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('parent', 5, { embeds: ['child', 'c'] }),
                createElement('child', 5, { parent: 'parent', embeds: ['b'] }),
                createElement('b', 1, { parent: 'child' }),
                createElement('c', 2, { parent: 'parent' }),
                createElement('d', 3),
                createLink('ab', 'a', 'b'),
                createLink('bc', 'b', 'c'),
                createLink('cd', 'c', 'd')
            ]);

            layout();

            const bbox = (id) => graph.getCell(id).getBBox();
            assert.ok(bbox('a').x < bbox('b').x);
            assert.ok(bbox('b').x < bbox('c').x);
            assert.ok(bbox('c').x < bbox('d').x);
            assert.ok(bbox('child').containsRect(bbox('b')));
            assert.ok(bbox('parent').containsRect(bbox('child')));
            assert.ok(bbox('parent').containsRect(bbox('c')));
            assert.notOk(bbox('parent').intersect(bbox('a')));
            assert.notOk(bbox('parent').intersect(bbox('d')));
        });

        QUnit.test('emptyRankSize: number - should add the size to every empty rank', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 0),
                createElement('c', 1),
                createElement('d', 4),
                createElement('e', 4),
                createLink('ac', 'a', 'c'),
                createLink('cd', 'c', 'd'),
                createLink('be', 'b', 'e')
            ]);

            const positions = () => graph.getElements().map((element) => element.position());
            const vertices = () => graph.getCell('be').vertices();

            ['LR', 'TB', 'RL', 'BT'].forEach((rankDir) => {
                const [axis, crossAxis, dimension] = (rankDir === 'LR' || rankDir === 'RL')
                    ? ['x', 'y', 'width']
                    : ['y', 'x', 'height'];
                const direction = (rankDir === 'RL' || rankDir === 'BT') ? -1 : 1;

                const defaultBBox = layout({ rankDir, setVertices: true });
                const defaultPositions = positions();
                const defaultVertices = vertices();

                const zeroBBox = layout({ rankDir, setVertices: true, emptyRankSize: 0 });
                assert.deepEqual(zeroBBox.toJSON(), defaultBBox.toJSON(), `${rankDir}: 0 is the default`);
                assert.deepEqual(positions(), defaultPositions, `${rankDir}: 0 is the default`);

                const bbox = layout({ rankDir, setVertices: true, emptyRankSize: 100 });
                assert.equal(bbox[dimension], defaultBBox[dimension] + 2 * 100, `${rankDir}: 2 empty ranks`);
                const [c, d] = [graph.getCell('c'), graph.getCell('d')];
                const [defaultC, defaultD] = [defaultPositions[2], defaultPositions[3]];
                assert.equal(
                    direction * (d.position()[axis] - c.position()[axis]),
                    direction * (defaultD[axis] - defaultC[axis]) + 2 * 100,
                    `${rankDir}: the ranks after the empty ranks are moved`
                );
                assert.deepEqual(
                    positions().map((position) => position[crossAxis]),
                    defaultPositions.map((position) => position[crossAxis]),
                    `${rankDir}: the cross axis is not changed`
                );
                assert.deepEqual(
                    vertices().map((vertex) => vertex[crossAxis]),
                    defaultVertices.map((vertex) => vertex[crossAxis]),
                    `${rankDir}: the cross axis of the vertices is not changed`
                );
            });
            assert.equal(graph.getElements().length, 5);
        });

        QUnit.test('should lay out large gaps between the ranks', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 1),
                createElement('c', 1e6),
                createLink('ab', 'a', 'b'),
                createLink('bc', 'b', 'c'),
                createLink('ac', 'a', 'c')
            ]);

            layout({ rankSep: 30, setVertices: true });

            const x = (id) => graph.getCell(id).position().x;
            assert.equal(x('b') - x('a'), 40 + 30);
            assert.equal(x('c') - x('b'), 40 + 30 + (1e6 - 2) * 30);
        });

        QUnit.test('emptyRankSize: number - should move the edge labels and resize the clusters', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('cluster', 0, { embeds: ['b', 'c'] }),
                createElement('b', 0, { parent: 'cluster' }),
                createElement('c', 2, { parent: 'cluster' }),
                createLink('ab', 'a', 'b'),
                createLink('ac', 'a', 'c')
            ]);
            graph.getCell('ac').set('labelSize', { width: 20, height: 10 });

            const run = (emptyRankSize) => {
                let labelPosition = null;
                layout({
                    emptyRankSize,
                    clusterPadding: 'default',
                    setLabels: (link, position) => {
                        if (link.id === 'ac') labelPosition = position;
                    }
                });
                return { labelPosition, clusterSize: graph.getCell('cluster').size() };
            };

            const defaultLayout = run();
            const resizedLayout = run(100);
            const labelDelta = resizedLayout.labelPosition.x - defaultLayout.labelPosition.x;
            assert.ok(labelDelta > 0 && labelDelta < 100, 'the label inside the gap is moved proportionally');
            assert.equal(resizedLayout.labelPosition.y, defaultLayout.labelPosition.y);
            assert.equal(resizedLayout.clusterSize.width, defaultLayout.clusterSize.width + 100);
            assert.equal(resizedLayout.clusterSize.height, defaultLayout.clusterSize.height);
        });

        QUnit.test('emptyRankSize: number - should keep the padding of the clusters next to the empty ranks', function(assert) {

            const padding = (rankDir) => {
                const clusterBBox = graph.getCell('cluster').getBBox();
                const childrenBBox = graph.getCellsBBox([graph.getCell('b'), graph.getCell('c')]);
                return (rankDir === 'LR' || rankDir === 'RL')
                    ? [childrenBBox.x - clusterBBox.x, clusterBBox.corner().x - childrenBBox.corner().x]
                    : [childrenBBox.y - clusterBBox.y, clusterBBox.corner().y - childrenBBox.corner().y];
            };

            ['LR', 'TB', 'RL', 'BT'].forEach((rankDir) => {
                graph.resetCells([
                    createElement('a', 0),
                    createElement('cluster', 0, { embeds: ['b', 'c'] }),
                    createElement('b', 3, { parent: 'cluster' }),
                    createElement('c', 6, { parent: 'cluster' }),
                    createElement('d', 9),
                    createLink('ab', 'a', 'b'),
                    createLink('bc', 'b', 'c'),
                    createLink('cd', 'c', 'd')
                ]);
                layout({ rankDir, clusterPadding: 'default' });
                const defaultPadding = padding(rankDir);
                layout({ rankDir, clusterPadding: 'default', emptyRankSize: 500 });
                assert.deepEqual(padding(rankDir), defaultPadding, rankDir);
            });
        });

        QUnit.test('emptyRankSize: non-finite - should be ignored', function(assert) {

            graph.resetCells([
                createElement('a', 0),
                createElement('b', 2),
                createLink('ab', 'a', 'b')
            ]);

            const defaultBBox = layout();
            assert.deepEqual(layout({ emptyRankSize: Infinity }).toJSON(), defaultBBox.toJSON());
            assert.deepEqual(layout({ emptyRankSize: NaN }).toJSON(), defaultBBox.toJSON());
        });

        QUnit.test('other rankers should ignore the ranks of the clusters', function(assert) {

            const cells = () => [
                createElement('a', 0),
                createElement('cluster', 1, { embeds: ['b', 'c'] }),
                createElement('b', 0, { parent: 'cluster' }),
                createElement('c', 0, { parent: 'cluster' }),
                createLink('ab', 'a', 'b'),
                createLink('bc', 'b', 'c')
            ];

            ['network-simplex', 'tight-tree', 'longest-path'].forEach((ranker) => {
                graph.resetCells(cells());
                layout({ ranker, clusterPadding: 'default' });
                const clusterBBox = graph.getCell('cluster').getBBox();
                assert.ok(clusterBBox.containsRect(graph.getCell('b').getBBox()), ranker);
                assert.ok(clusterBBox.containsRect(graph.getCell('c').getBBox()), ranker);
            });
        });

        QUnit.test('other rankers should ignore the ranks', function(assert) {

            graph.resetCells([
                createElement('a', 5),
                createElement('b', 0),
                createLink('ab', 'a', 'b')
            ]);

            layout({ ranker: 'network-simplex' });

            const x = (id) => graph.getCell(id).position().x;
            assert.ok(x('a') < x('b'));
        });
    });

});
