QUnit.module('GraphLayerCollection', function(hooks) {

    QUnit.test('default setup', (assert) => {
        const collection = new joint.dia.GraphLayerCollection();

        assert.deepEqual(collection.layerNamespace, collection.defaultLayerNamespace, 'layerNamespace is set to default');
    });

    QUnit.test('add layers', (assert) => {
        const collection = new joint.dia.GraphLayerCollection();
        const events = [];
        collection.on('all', (eventName) => {
            events.push(eventName);
        });

        const layer1 = collection.add({ id: 'layer1' }, { graph: 'a graph' });
        assert.ok(layer1 instanceof joint.dia.GraphLayer, 'layer1 is instance of GraphLayer');
        assert.equal(layer1.id, 'layer1', 'layer1 id is set correctly');

        const layer2 = collection.add({ type: 'GraphLayer', id: 'layer2' }, { graph: 'a graph' });
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
        const collection = new joint.dia.GraphLayerCollection();

        assert.throws(() => {
            collection.add({ type: 'InvalidType', id: 'layer1' }, { graph: 'a graph' });
        }, /dia.Graph: Could not find cell layer constructor for type: 'InvalidType'. Make sure to add the constructor to 'layerNamespace'./, 'throws error when adding invalid cellLayer type');
    });

    QUnit.test('remove GraphLayer', (assert) => {
        const collection = new joint.dia.GraphLayerCollection();
        const layer1 = collection.add({ id: 'layer1' }, { graph: 'a graph' });
        const layer2 = collection.add({ id: 'layer2' }, { graph: 'a graph' });

        const events = [];
        collection.on('all', (eventName) => {
            events.push(eventName);
        });

        collection.remove(layer1, { graph: 'a graph' });
        assert.equal(collection.length, 1, 'collection has 1 layer after removal');
        assert.equal(collection.at(0), layer2, 'remaining layer is layer2');

        assert.deepEqual(events, [
            'remove',
            'update'
        ], 'events are triggered correctly on removal');
    });

    QUnit.test('custom layerNamespace', (assert) => {
        class CustomGraphLayer extends joint.dia.GraphLayer {
            defaults() {
                return {
                    type: 'CustomGraphLayer'
                };
            }
        }
        const namespace = { CustomGraphLayer };
        const collection = new joint.dia.GraphLayerCollection([], { layerNamespace: namespace });

        assert.deepEqual(collection.layerNamespace, { ...collection.defaultLayerNamespace, ...namespace }, 'layerNamespace is set correctly');

        const customLayer = collection.add({ type: 'CustomGraphLayer', id: 'custom1' }, { graph: 'a graph' });
        assert.ok(customLayer instanceof CustomGraphLayer, 'custom layer is created correctly');
    });
});
