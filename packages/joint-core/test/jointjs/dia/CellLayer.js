QUnit.module('CellLayer', function(hooks) {

    QUnit.test('default setup', (assert) => {
        const layer = new joint.dia.CellLayer();

        assert.ok(layer.cells instanceof joint.dia.CellLayerCollection, 'CellLayer has a cells collection');
        assert.equal(layer.cells.length, 0, 'cells collection is empty');
        assert.ok(layer.eventPrefix === 'self:', 'eventPrefix is set to "self:"');
    });

    QUnit.test('sort by z-index', (assert) => {
        const layer = new joint.dia.CellLayer();
        events = [];
        layer.on('all', (eventName) => {
            events.push(eventName);
        });

        const rect1 = new joint.shapes.standard.Rectangle({ z: 5 });
        const rect2 = new joint.shapes.standard.Rectangle({ z: 1 });
        const rect3 = new joint.shapes.standard.Rectangle({ z: 3 });

        layer.cells.add([rect1, rect2, rect3], { cellLayersController: true });

        assert.equal(layer.cells.at(0), rect2, 'the first cell is the one with the lowest z-index');
        assert.equal(layer.cells.at(1), rect3, 'the second cell is the one with the middle z-index');
        assert.equal(layer.cells.at(2), rect1, 'the last cell is the one with the highest z-index');

        rect1.set('z', 0); // change z-index of rect1 to be the lowest

        assert.equal(layer.cells.at(0), rect1, 'the first cell is now the one with the lowest z-index');
        assert.equal(layer.cells.at(1), rect2, 'the second cell is now the one with the middle z-index');
        assert.equal(layer.cells.at(2), rect3, 'the last cell is now the one with the highest z-index');

        assert.deepEqual(events, [
            "add",
            "add",
            "add",
            "sort",
            "update",
            "change:z",
            "sort",
            "change"
        ], 'the correct events were fired');
    });

    QUnit.test('minZIndex() and maxZIndex()', (assert) => {
        const layer = new joint.dia.CellLayer();

        assert.equal(layer.minZIndex(), 0, 'minZIndex is 0 when there are no cells');
        assert.equal(layer.maxZIndex(), 0, 'maxZIndex is 0 when there are no cells');

        const rect1 = new joint.shapes.standard.Rectangle({ z: 5 });
        const rect2 = new joint.shapes.standard.Rectangle({ z: 1 });
        const rect3 = new joint.shapes.standard.Rectangle({ z: 3 });

        layer.cells.add([rect1, rect2, rect3], { cellLayersController: true });

        assert.equal(layer.minZIndex(), 1, 'minZIndex is correct');
        assert.equal(layer.maxZIndex(), 5, 'maxZIndex is correct');

        rect2.set('z', -10);

        assert.equal(layer.minZIndex(), -10, 'minZIndex is updated correctly');
        assert.equal(layer.maxZIndex(), 5, 'maxZIndex remains the same');
    });
});
