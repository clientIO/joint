QUnit.module('CellLayerView', function(hooks) {

    hooks.beforeEach(() => {
        const fixtureEl = fixtures.getElement();
        const paperEl = document.createElement('div');
        fixtureEl.appendChild(paperEl);
        this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        this.paper = new joint.dia.Paper({
            el: paperEl,
            gridSize: 10,
            model: this.graph
        });
    });

    hooks.afterEach(() => {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });

    QUnit.test('default setup', (assert) => {
        const layer = new joint.dia.GraphLayer();
        const layerView = new joint.dia.GraphLayerView({ id: 'test', model: layer, paper: this.paper });

        assert.ok(layerView.el.classList.contains('joint-test-layer'));
        assert.ok(layerView.el.classList.contains('joint-cell-layer'));

        assert.ok(layerView.el.style.webkitUserSelect === 'none');
        assert.ok(layerView.el.style.userSelect === 'none');
    });

});
