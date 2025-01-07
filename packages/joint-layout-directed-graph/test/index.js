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
        ({ width, height} = elements[0].size());
        assert.deepEqual({ width, height }, {width: 100, height: 50 });
        (elementLabel = elements[0].attr('label/text'));
        assert.equal(elementLabel, 'A');

        (id = elements[1].id);
        assert.equal(id, '2');
        ({ x, y } = elements[1].position());
        assert.deepEqual({ x, y }, { x: 50, y: 150 });
        ({ width, height} = elements[1].size());
        assert.deepEqual({ width, height }, {width: 100, height: 50 });
        (elementLabel = elements[1].attr('label/text'));
        assert.equal(elementLabel, 'B');

        (id = elements[2].id);
        assert.equal(id, '3');
        ({ x, y } = elements[2].position());
        assert.deepEqual({ x, y }, { x: 50, y: 250 });
        ({ width, height} = elements[2].size());
        assert.deepEqual({ width, height }, {width: 100, height: 50 });
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

            assert.ok(bbox instanceof g.Rect);
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

        QUnit.test('should throw an understandable error when trying to connect a child to a container', function(assert) {
            const  elements = [
                new joint.shapes.standard.Rectangle({ position: { x: 50, y: 50 }, size: { width: 300, height: 300 } }),
                new joint.shapes.standard.Rectangle({ position: { x: 175, y: 175 }, size: {width: 50, height: 50 } }),
                new joint.shapes.standard.Rectangle({ position: { x: 400, y: 50 }, size: { width: 300, height: 300 } }),
                new joint.shapes.standard.Rectangle({ position: { x: 525, y: 175 }, size: { width: 50, height: 50 } }),
            ];

            elements[0].embed(elements[1]);
            elements[2].embed(elements[3]);

            const links = [
                // this throws error:
                new joint.shapes.standard.Link({ source: { id: elements[1].id }, target: { id: elements[0].id }}), // child -> its container
                new joint.shapes.standard.Link({ source: { id: elements[1].id }, target: { id: elements[2].id }}), // child -> unrelated container
                new joint.shapes.standard.Link({ source: { id: elements[0].id }, target: { id: elements[1].id }}), // container -> its child
                new joint.shapes.standard.Link({ source: { id: elements[0].id }, target: { id: elements[3].id }}), // container -> unrelated child
                new joint.shapes.standard.Link({ source: { id: elements[0].id }, target: { id: elements[2].id }}), // container -> unrelated container
                // this is ok:
                new joint.shapes.standard.Link({ source: { id: elements[1].id }, target: { id: elements[3].id }}), // child -> unrelated child
                new joint.shapes.standard.Link({ source: { id: elements[1].id }, target: { x: 0, y: 0 }}), // child -> point
                new joint.shapes.standard.Link({ source: { x: 0, y: 0 }, target: { id: elements[1].id }}), // point -> child
                new joint.shapes.standard.Link({ source: { id: elements[0].id }, target: { x: 0, y: 0 }}), // container -> point
                new joint.shapes.standard.Link({ source: { x: 0, y: 0 }, target: { id: elements[0].id }}), // point -> container
            ];

            let cells, error;

            // Using `checkContainerConnections` option (default):

            error = new Error('DirectedGraph: It is not possible to connect a child to a container.');

            cells = elements.concat([links[0]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph);
            }, error);

            cells = elements.concat([links[1]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph);
            }, error);

            cells = elements.concat([links[2]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph);
            }, error);

            cells = elements.concat([links[3]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph);
            }, error);

            cells = elements.concat([links[4]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph);
            }, error);

            cells = elements.concat([links[5]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph) instanceof g.Rect);

            cells = elements.concat([links[6]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph) instanceof g.Rect);

            cells = elements.concat([links[7]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph) instanceof g.Rect);

            cells = elements.concat([links[8]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph) instanceof g.Rect);

            cells = elements.concat([links[9]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph) instanceof g.Rect);

            // Disabling `checkContainerConnections` option:

            error = new TypeError(`Cannot set properties of undefined (setting 'rank')`);

            cells = elements.concat([links[0]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph, { checkContainerConnections: false });
            }, error);

            cells = elements.concat([links[1]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph, { checkContainerConnections: false });
            }, error);

            cells = elements.concat([links[2]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph, { checkContainerConnections: false });
            }, error);

            cells = elements.concat([links[3]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph, { checkContainerConnections: false });
            }, error);

            cells = elements.concat([links[4]]);
            graph.resetCells(cells);
            assert.throws(() => {
                DirectedGraph.layout(graph, { checkContainerConnections: false });
            }, error);

            cells = elements.concat([links[5]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph, { checkContainerConnections: false }) instanceof g.Rect);

            cells = elements.concat([links[6]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph, { checkContainerConnections: false }) instanceof g.Rect);

            cells = elements.concat([links[7]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph, { checkContainerConnections: false }) instanceof g.Rect);

            cells = elements.concat([links[8]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph, { checkContainerConnections: false }) instanceof g.Rect);

            cells = elements.concat([links[9]]);
            graph.resetCells(cells);
            assert.ok(DirectedGraph.layout(graph, { checkContainerConnections: false }) instanceof g.Rect);
        })
    });
});
