QUnit.module('GraphCellLayers', function(hooks) {

    QUnit.test('default setup', (assert) => {
        const collection = new joint.dia.GraphCellLayers();

        assert.equal(collection.modelInstanceMarker, joint.dia.CELL_LAYER_MARKER, 'modelInstanceMarker is set correctly');
    });
});
