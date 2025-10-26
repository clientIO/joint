QUnit.module('CellGroup', function(hooks) {

    QUnit.test('default setup', (assert) => {
        const group = new joint.dia.CellGroup();

        assert.ok(group.cellCollection instanceof joint.dia.CellGroupCollection, 'CellGroup has a cells collection');
        assert.equal(group.cellCollection.length, 0, 'cells collection is empty');
        assert.ok(group.eventPrefix === 'self:', 'eventPrefix is set to "self:"');
    });

    QUnit.test('cells.add() adds a cell to the cells collection', (assert) => {
        const group = new joint.dia.CellGroup();
        const events = [];
        group.on('all', (eventName) => {
            events.push(eventName);
        });

        const cell = new joint.shapes.standard.Rectangle();
        group.cellCollection.add(cell);

        cell.set('a', 1);

        assert.equal(group.cellCollection.length, 1, 'cells collection has one cell');
        assert.equal(group.cellCollection.at(0), cell, 'the cell is the one that was added');

        assert.deepEqual(events, [
            'add', 'update', 'change:a', 'change'
        ], 'the correct events were fired');
    });

    QUnit.test('cells.remove() removes a cell from the cells collection', (assert) => {
        const group = new joint.dia.CellGroup();
        const events = [];
        group.on('all', (eventName) => {
            events.push(eventName);
        });

        const cell1 = new joint.shapes.standard.Rectangle();
        const cell2 = new joint.shapes.standard.Ellipse();
        group.cellCollection.add([cell1, cell2]);

        assert.equal(group.cellCollection.length, 2, 'cells collection has two cells');

        group.cellCollection.remove(cell1);

        cell2.set('a', 1);

        assert.equal(group.cellCollection.length, 1, 'cells collection has one cell');
        assert.equal(group.cellCollection.at(0), cell2, 'the remaining cell is the one that was not removed');

        assert.deepEqual(events, [
            'add', 'add', 'update',
            'remove', 'update',
            'change:a', 'change'
        ], 'the correct events were fired');
    });

    QUnit.test('cells.reset() resets the cells collection', (assert) => {
        const group = new joint.dia.CellGroup();
        const events = [];
        group.on('all', (eventName) => {
            events.push(eventName);
        });

        const cell1 = new joint.shapes.standard.Rectangle();
        const cell2 = new joint.shapes.standard.Ellipse();
        group.cellCollection.add([cell1, cell2]);

        assert.equal(group.cellCollection.length, 2, 'cells collection has two cells');

        const cell3 = new joint.shapes.standard.Polygon();
        group.cellCollection.reset([cell3]);

        cell3.set('a', 1);

        assert.equal(group.cellCollection.length, 1, 'cells collection has one cell');
        assert.equal(group.cellCollection.at(0), cell3, 'the remaining cell is the one that was not removed');

        assert.deepEqual(events, [
            'add', 'add', 'update',
            'reset',
            'change:a', 'change'
        ], 'the correct events were fired');
    });
});
