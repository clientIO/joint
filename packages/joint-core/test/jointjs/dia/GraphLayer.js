QUnit.module('GraphLayer', function(hooks) {

    QUnit.test('default setup', (assert) => {
        const layer = new joint.dia.GraphLayer();

        assert.ok(layer.cellCollection instanceof joint.dia.CellCollection, 'GraphLayer has a cells collection');
        assert.equal(layer.cellCollection.length, 0, 'cells collection is empty');
        assert.ok(layer.eventPrefix === 'self:', 'eventPrefix is set to "self:"');
    });

    QUnit.test('sort by z-index', (assert) => {
        const layer = new joint.dia.GraphLayer();
        const events = [];
        layer.on('all', (eventName) => {
            events.push(eventName);
        });

        const rect1 = new joint.shapes.standard.Rectangle({ z: 5 });
        const rect2 = new joint.shapes.standard.Rectangle({ z: 1 });
        const rect3 = new joint.shapes.standard.Rectangle({ z: 3 });

        layer.cellCollection.add([rect1, rect2, rect3], { sController: true });

        assert.equal(layer.cellCollection.at(0), rect2, 'the first cell is the one with the lowest z-index');
        assert.equal(layer.cellCollection.at(1), rect3, 'the second cell is the one with the middle z-index');
        assert.equal(layer.cellCollection.at(2), rect1, 'the last cell is the one with the highest z-index');

        rect1.set('z', 0); // change z-index of rect1 to be the lowest

        assert.equal(layer.cellCollection.at(0), rect1, 'the first cell is now the one with the lowest z-index');
        assert.equal(layer.cellCollection.at(1), rect2, 'the second cell is now the one with the middle z-index');
        assert.equal(layer.cellCollection.at(2), rect3, 'the last cell is now the one with the highest z-index');

        assert.deepEqual(events, [
            'add',
            'add',
            'add',
            'sort',
            'update',
            'change:z',
            'sort',
            'change'
        ], 'the correct events were fired');
    });

    QUnit.test('minZIndex() and maxZIndex()', (assert) => {
        const layer = new joint.dia.GraphLayer();

        assert.equal(layer.cellCollection.minZIndex(), 0, 'minZIndex is 0 when there are no cells');
        assert.equal(layer.cellCollection.maxZIndex(), 0, 'maxZIndex is 0 when there are no cells');

        const rect1 = new joint.shapes.standard.Rectangle({ z: 5 });
        const rect2 = new joint.shapes.standard.Rectangle({ z: 1 });
        const rect3 = new joint.shapes.standard.Rectangle({ z: 3 });

        layer.cellCollection.add([rect1, rect2, rect3]);

        assert.equal(layer.cellCollection.minZIndex(), 1, 'minZIndex is correct');
        assert.equal(layer.cellCollection.maxZIndex(), 5, 'maxZIndex is correct');

        rect2.set('z', -10);

        assert.equal(layer.cellCollection.minZIndex(), -10, 'minZIndex is updated correctly');
        assert.equal(layer.cellCollection.maxZIndex(), 5, 'maxZIndex remains the same');
    });

    QUnit.test('cells.add() adds a cell to the cells collection', (assert) => {
        const layer = new joint.dia.GraphLayer();
        const events = [];
        layer.on('all', (eventName) => {
            events.push(eventName);
        });

        const cell = new joint.shapes.standard.Rectangle();
        layer.cellCollection.add(cell);

        cell.set('a', 1);

        assert.equal(layer.cellCollection.length, 1, 'cells collection has one cell');
        assert.equal(layer.cellCollection.at(0), cell, 'the cell is the one that was added');

        assert.deepEqual(events, [
            'add', 'sort', 'update', 'change:a', 'change'
        ], 'the correct events were fired');
    });

    QUnit.test('cells.remove() removes a cell from the cells collection', (assert) => {
        const layer = new joint.dia.GraphLayer();
        const events = [];
        layer.on('all', (eventName) => {
            events.push(eventName);
        });

        const cell1 = new joint.shapes.standard.Rectangle();
        const cell2 = new joint.shapes.standard.Ellipse();
        layer.cellCollection.add([cell1, cell2]);

        assert.equal(layer.cellCollection.length, 2, 'cells collection has two cells');

        layer.cellCollection.remove(cell1);

        cell2.set('a', 1);

        assert.equal(layer.cellCollection.length, 1, 'cells collection has one cell');
        assert.equal(layer.cellCollection.at(0), cell2, 'the remaining cell is the one that was not removed');

        assert.deepEqual(events, [
            'add', 'add', 'sort', 'update',
            'remove', 'update',
            'change:a', 'change'
        ], 'the correct events were fired');
    });

    QUnit.test('cells.reset() resets the cells collection', (assert) => {
        const layer = new joint.dia.GraphLayer();
        const events = [];
        layer.on('all', (eventName) => {
            events.push(eventName);
        });

        const cell1 = new joint.shapes.standard.Rectangle();
        const cell2 = new joint.shapes.standard.Ellipse();
        layer.cellCollection.add([cell1, cell2]);

        assert.equal(layer.cellCollection.length, 2, 'cells collection has two cells');

        const cell3 = new joint.shapes.standard.Polygon();
        layer.cellCollection.reset([cell3]);

        cell3.set('a', 1);

        assert.equal(layer.cellCollection.length, 1, 'cells collection has one cell');
        assert.equal(layer.cellCollection.at(0), cell3, 'the remaining cell is the one that was not removed');

        assert.deepEqual(events, [
            'add', 'add', 'sort', 'update',
            'reset',
            'change:a', 'change'
        ], 'the correct events were fired');
    });
});
