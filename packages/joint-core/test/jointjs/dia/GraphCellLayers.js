QUnit.module('GraphCellLayers', function(hooks) {

    QUnit.test('default setup', (assert) => {
        const collection = new joint.dia.GraphCellLayers();

        assert.equal(collection.modelInstanceMarker, joint.dia.CELL_LAYER_MARKER, 'modelInstanceMarker is set correctly');
        assert.deepEqual(collection.cellLayerNamespace, collection.defaultCellLayerNamespace, 'cellLayerNamespace is set to default');
    });

    QUnit.test('add cellLayers', (assert) => {
        const collection = new joint.dia.GraphCellLayers();
        const events = [];
        collection.on('all', (eventName) => {
            events.push(eventName);
        });

        const layer1 = collection.add({ id: 'layer1' });
        assert.ok(layer1 instanceof joint.dia.CellLayer, 'layer1 is instance of CellLayer');
        assert.equal(layer1.id, 'layer1', 'layer1 id is set correctly');

        const layer2 = collection.add({ type: 'CellLayer', id: 'layer2' });
        assert.ok(layer2 instanceof joint.dia.CellLayer, 'layer2 is instance of CellLayer');
        assert.equal(layer2.id, 'layer2', 'layer2 id is set correctly');

        assert.equal(collection.length, 2, 'collection has 2 layers');

        assert.deepEqual(events, [
            'add',
            'update',
            'add',
            'update'
        ], 'events are triggered correctly');
    });

    QUnit.test('add invalid cellLayer type', (assert) => {
        const collection = new joint.dia.GraphCellLayers();

        assert.throws(() => {
            collection.add({ type: 'InvalidType', id: 'layer1' });
        }, /dia.Graph: Could not find cell layer constructor for type: 'InvalidType'. Make sure to add the constructor to 'cellLayerNamespace'./, 'throws error when adding invalid cellLayer type');
    });

    QUnit.test('remove cellLayer', (assert) => {
        const collection = new joint.dia.GraphCellLayers();
        const layer1 = collection.add({ id: 'layer1' });
        const layer2 = collection.add({ id: 'layer2' });

        const events = [];
        collection.on('all', (eventName) => {
            events.push(eventName);
        });

        collection.remove(layer1);
        assert.equal(collection.length, 1, 'collection has 1 layer after removal');
        assert.equal(collection.at(0), layer2, 'remaining layer is layer2');

        assert.deepEqual(events, [
            'remove',
            'update'
        ], 'events are triggered correctly on removal');
    });

    QUnit.test('custom cellLayerNamespace', (assert) => {
        class CustomCellLayer extends joint.dia.CellLayer {
            defaults() {
                return {
                    type: 'CustomCellLayer'
                };
            }
        }
        const namespace = { CustomCellLayer };
        const collection = new joint.dia.GraphCellLayers([], { cellLayerNamespace: namespace });

        assert.deepEqual(collection.cellLayerNamespace, { ...collection.defaultCellLayerNamespace, ...namespace }, 'cellLayerNamespace is set correctly');

        const customLayer = collection.add({ type: 'CustomCellLayer', id: 'custom1' });
        assert.ok(customLayer instanceof CustomCellLayer, 'custom layer is created correctly');
    });
});
