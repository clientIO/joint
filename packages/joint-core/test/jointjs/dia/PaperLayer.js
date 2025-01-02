QUnit.module('joint.dia.PaperLayer', function(hooks) {

    QUnit.test('options: name', function(assert) {
        const layer = new joint.dia.PaperLayer({ name: 'test' });
        assert.ok(layer.el.classList.contains('joint-test-layer'));
    });

    QUnit.test('isEmpty() returns true when there are no nodes in the layer', function(assert) {
        const layer = new joint.dia.PaperLayer();
        assert.ok(layer.isEmpty());
        const node = document.createElement('div');
        layer.insertNode(node);
        assert.notOk(layer.isEmpty());
        layer.insertPivot(0);
        assert.notOk(layer.isEmpty());
        node.remove();
        assert.ok(layer.isEmpty());
        layer.remove();
    });

});
