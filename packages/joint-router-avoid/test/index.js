QUnit.module('sanity check', () => {
    QUnit.test('should load', assert => {
        assert.ok(typeof joint.routers.avoid !== 'undefined');
        assert.ok(typeof joint.routers.avoid.AvoidRouter === 'function');
    });

    QUnit.test('should expose the expected API', assert => {
        const { AvoidRouter, avoid } = joint.routers.avoid;
        assert.ok(typeof AvoidRouter.load === 'function');
        assert.ok(typeof AvoidRouter.for === 'function');
        assert.ok(typeof AvoidRouter.prototype.routeAll === 'function');
        assert.ok(typeof AvoidRouter.prototype.updateShape === 'function');
        assert.ok(typeof AvoidRouter.prototype.updateConnector === 'function');
        assert.ok(typeof AvoidRouter.prototype.addGraphListeners === 'function');
        assert.ok(typeof AvoidRouter.prototype.removeGraphListeners === 'function');
        assert.ok(typeof avoid === 'function');
    });

    QUnit.test('the router falls back to rightAngle when no AvoidRouter is registered for the graph', assert => {
        const { avoid } = joint.routers.avoid;

        const graph = new joint.dia.Graph();
        const el1 = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
        const el2 = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 } });
        const link = new joint.shapes.standard.Link({ source: { id: el1.id }, target: { id: el2.id } });
        graph.resetCells([el1, el2, link]);

        const paper = new joint.dia.Paper({ model: graph, el: document.getElementById('qunit-fixture') });
        const linkView = link.findView(paper);

        const vertices = avoid([], {}, linkView);
        assert.ok(Array.isArray(vertices));

        paper.remove();
    });
});
