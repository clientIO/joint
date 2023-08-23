'use strict';

QUnit.module('layout.DirectedGraph', function(hooks) {

    QUnit.test('should be an object', function(assert) {

        assert.equal(typeof joint.layout.DirectedGraph, 'object');
    });

    QUnit.module('fromGraphLib(graphLib[, opt])', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.layout.DirectedGraph.fromGraphLib, 'function');
        });
    });

    QUnit.module('toGraphLib(jointGraph[, opt])', function(hooks) {

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.layout.DirectedGraph.toGraphLib, 'function');
        });
    });

    QUnit.module('layout(graphOrCells[, opt])', function(hooks) {

        var graph;

        hooks.beforeEach(function() {

            graph = new joint.dia.Graph;
        });

        hooks.afterEach(function() {

            graph = null;
        });

        QUnit.test('should be a function', function(assert) {

            assert.equal(typeof joint.layout.DirectedGraph.layout, 'function');
        });

        QUnit.test('should correctly layout the graph', function(assert) {

            var elements = [
                new joint.shapes.basic.Rect({
                    position: { x: 0, y: 0 },
                    size: { width: 60, height: 100 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 200, y: 0 },
                    size: { width: 40, height: 80 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 300, y: 20 },
                    size: { width: 20, height: 30 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 400, y: 50 },
                    size: { width: 30, height: 20 }
                })
            ];

            var links = [
                new joint.dia.Link({ source: { id: elements[0].id }, target: { id: elements[1].id }}),
                new joint.dia.Link({ source: { id: elements[1].id }, target: { id: elements[3].id }})
            ];

            var cells = elements.concat(links);

            graph.resetCells(cells);

            joint.layout.DirectedGraph.layout(graph);

            assert.deepEqual(_.pick(elements[0].position(), 'x', 'y'), { x: 0, y: 0 });
            assert.deepEqual(_.pick(elements[1].position(), 'x', 'y'), { x: 10, y: 150 });
            assert.deepEqual(_.pick(elements[2].position(), 'x', 'y'), { x: 110, y: 35 });
            assert.deepEqual(_.pick(elements[3].position(), 'x', 'y'), { x: 15, y: 280 });
        });

        QUnit.test('an array of some of the cells instead of the full graph', function(assert) {

            var elements = [
                new joint.shapes.basic.Rect({
                    position: { x: 0, y: 0 },
                    size: { width: 60, height: 100 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 200, y: 0 },
                    size: { width: 40, height: 80 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 300, y: 20 },
                    size: { width: 20, height: 30 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 400, y: 50 },
                    size: { width: 30, height: 20 }
                })
            ];

            var links = [
                new joint.dia.Link({ source: { id: elements[0].id }, target: { id: elements[1].id }}),
                new joint.dia.Link({ source: { id: elements[1].id }, target: { id: elements[3].id }})
            ];

            var cells = elements.concat(links);

            graph.resetCells(cells);

            joint.layout.DirectedGraph.layout([
                elements[0],
                elements[1],
                links[0]
            ]);

            assert.deepEqual(_.pick(elements[0].position(), 'x', 'y'), { x: 0, y: 0 });
            assert.deepEqual(_.pick(elements[1].position(), 'x', 'y'), { x: 10, y: 150 });
            assert.deepEqual(_.pick(elements[2].position(), 'x', 'y'), { x: 300, y: 20 });
            assert.deepEqual(_.pick(elements[3].position(), 'x', 'y'), { x: 400, y: 50 });
        });

        QUnit.test('an array of embedded cells without the parent', function(assert) {

            var elements = [
                new joint.shapes.basic.Rect({
                    position: { x: 0, y: 0 },
                    size: { width: 60, height: 100 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 200, y: 0 },
                    size: { width: 40, height: 80 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 300, y: 20 },
                    size: { width: 20, height: 30 }
                }),
                new joint.shapes.basic.Rect({
                    position: { x: 400, y: 50 },
                    size: { width: 30, height: 20 }
                })
            ];

            elements[0].embed(elements[1]);
            elements[0].embed(elements[2]);
            elements[0].embed(elements[3]);

            var links = [
                new joint.dia.Link({ source: { id: elements[1].id }, target: { id: elements[2].id }}),
                new joint.dia.Link({ source: { id: elements[2].id }, target: { id: elements[3].id }})
            ];

            var cells = elements.concat(links);

            graph.resetCells(cells);

            joint.layout.DirectedGraph.layout([
                elements[1],
                elements[2],
                elements[3],
                links[0],
                links[1]
            ]);

            assert.deepEqual(_.pick(elements[0].position(), 'x', 'y'), { x: 0, y: 0 });
            assert.deepEqual(_.pick(elements[1].position(), 'x', 'y'), { x: 0, y: 0 });
            assert.deepEqual(_.pick(elements[2].position(), 'x', 'y'), { x: 10, y: 130 });
            assert.deepEqual(_.pick(elements[3].position(), 'x', 'y'), { x: 5, y: 210 });
        });


        QUnit.test('should return a rectangle representing the graph bounding box', function(assert) {

            var bbox;

            var elements = [
                new joint.shapes.basic.Rect({ size: { width: 60, height: 100 }}),
                new joint.shapes.basic.Rect({ size: { width: 40, height: 80 }}),
                new joint.shapes.basic.Rect({ size: { width: 20, height: 30 }}),
                new joint.shapes.basic.Rect({ size: { width: 30, height: 20 }})
            ];

            var links = [
                new joint.dia.Link({ source: { id: elements[0].id }, target: { id: elements[1].id }}),
                new joint.dia.Link({ source: { id: elements[1].id }, target: { id: elements[3].id }})
            ];

            graph.resetCells(elements.concat(links));

            bbox = joint.layout.DirectedGraph.layout(graph);

            assert.ok(bbox instanceof g.Rect);
            assert.deepEqual(bbox.toJSON(), graph.getBBox().toJSON());

            bbox = joint.layout.DirectedGraph.layout(graph, {
                marginX: 50,
                marginY: 100
            });
            assert.deepEqual(bbox.toJSON(), graph.getBBox().toJSON());

            bbox = joint.layout.DirectedGraph.layout(graph, {
                marginX: -50,
                marginY: -100
            });
            assert.deepEqual(bbox.toJSON(), graph.getBBox().toJSON());

            bbox = joint.layout.DirectedGraph.layout(graph, {
                marginX: -500,
                marginY: -1000
            });
            assert.deepEqual(bbox.toJSON(), graph.getBBox().toJSON());

        });
    });
});
