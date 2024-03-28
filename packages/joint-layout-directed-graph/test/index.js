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

        QUnit.test('should correctly convert a graphlib graph into JointJS graph', function(assert) {

            const glGraph = new graphlib.Graph();
            glGraph.setNode(1, { x: 50, y: 50, width: 100, height: 50, label: 'A' });
            glGraph.setNode(2, { x: 50, y: 150, width: 100, height: 50, label: 'B' });
            glGraph.setNode(3, { x: 50, y: 250, width: 100, height: 50, label: 'C' });
            glGraph.setEdge(1, 2, { label: 'Hello' });
            glGraph.setEdge(2, 3, { label: 'World!' });

            const graph = DirectedGraph.fromGraphLib(glGraph, {
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
    });
});
