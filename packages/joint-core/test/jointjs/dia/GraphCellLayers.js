QUnit.module('GraphCellLayers', function(hooks) {

    QUnit.test('default setup', (assert) => {
        const collection = new joint.dia.GraphCellLayers();

        assert.deepEqual(collection.cellLayerNamespace, collection.defaultCellLayerNamespace, 'cellLayerNamespace is set to default');
    });

    QUnit.test('add cellLayers', (assert) => {
        const collection = new joint.dia.GraphCellLayers();
        const events = [];
        collection.on('all', (eventName) => {
            events.push(eventName);
        });

        const layer1 = collection.add({ id: 'layer1' }, { cellLayersController: true});
        assert.ok(layer1 instanceof joint.dia.GraphLayer, 'layer1 is instance of GraphLayer');
        assert.equal(layer1.id, 'layer1', 'layer1 id is set correctly');

        const layer2 = collection.add({ type: 'GraphLayer', id: 'layer2' }, { cellLayersController: true});
        assert.ok(layer2 instanceof joint.dia.GraphLayer, 'layer2 is instance of GraphLayer');
        assert.equal(layer2.id, 'layer2', 'layer2 id is set correctly');

        assert.equal(collection.length, 2, 'collection has 2 layers');

        assert.deepEqual(events, [
            'add',
            'update',
            'add',
            'update'
        ], 'events are triggered correctly');
    });

    QUnit.test('add invalid GraphLayer type', (assert) => {
        const collection = new joint.dia.GraphCellLayers();

        assert.throws(() => {
            collection.add({ type: 'InvalidType', id: 'layer1' }, { cellLayersController: true});
        }, /dia.Graph: Could not find cell layer constructor for type: 'InvalidType'. Make sure to add the constructor to 'cellLayerNamespace'./, 'throws error when adding invalid cellLayer type');
    });

    QUnit.test('remove GraphLayer', (assert) => {
        const collection = new joint.dia.GraphCellLayers();
        const layer1 = collection.add({ id: 'layer1' }, { cellLayersController: true});
        const layer2 = collection.add({ id: 'layer2' }, { cellLayersController: true});

        const events = [];
        collection.on('all', (eventName) => {
            events.push(eventName);
        });

        collection.remove(layer1, { cellLayersController: true });
        assert.equal(collection.length, 1, 'collection has 1 layer after removal');
        assert.equal(collection.at(0), layer2, 'remaining layer is layer2');

        assert.deepEqual(events, [
            'remove',
            'update'
        ], 'events are triggered correctly on removal');
    });

    QUnit.test('custom cellLayerNamespace', (assert) => {
        class CustomGraphLayer extends joint.dia.GraphLayer {
            defaults() {
                return {
                    type: 'CustomGraphLayer'
                };
            }
        }
        const namespace = { CustomGraphLayer };
        const collection = new joint.dia.GraphCellLayers([], { cellLayerNamespace: namespace });

        assert.deepEqual(collection.cellLayerNamespace, { ...collection.defaultCellLayerNamespace, ...namespace }, 'cellLayerNamespace is set correctly');

        const customLayer = collection.add({ type: 'CustomGraphLayer', id: 'custom1' }, { cellLayersController: true});
        assert.ok(customLayer instanceof CustomGraphLayer, 'custom layer is created correctly');
    });
});
