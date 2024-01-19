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
