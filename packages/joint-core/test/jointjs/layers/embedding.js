QUnit.module('embedding-layers', function(hooks) {

    hooks.beforeEach(() => {

        const fixtureEl = fixtures.getElement();
        const paperEl = document.createElement('div');
        fixtureEl.appendChild(paperEl);
        this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        this.paper = new joint.dia.Paper({
            el: paperEl,
            width: 800,
            height: 600,
            model: this.graph,
            cellViewNamespace: joint.shapes,
            useLayersForEmbedding: true
        });
    });

    hooks.afterEach(() => {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });

    QUnit.test('Embedding layers setup', (assert) => {
        assert.ok(this.paper.embeddingLayersController, 1, 'Controller is created');
    });

    QUnit.test('from JSON', (assert) => {
        this.graph.fromJSON({
            cells: [
                {
                    type: 'standard.Rectangle',
                    id: 'rect1',
                    position: { x: 100, y: 100 },
                    size: { width: 200, height: 100 },
                    embeds: ['ellipse1']
                },
                {
                    type: 'standard.Ellipse',
                    id: 'ellipse1',
                    position: { x: 150, y: 150 },
                    size: { width: 20, height: 20 },
                    parent: 'rect1'
                }
            ]
        });

        assert.ok(this.paper.hasLayerView('rect1'), 'Paper has layer for parent cell');
        assert.ok(this.graph.hasCellLayer('rect1'), 'Graph has layer for parent cell');

        const layer = this.graph.getCellLayer('rect1');

        assert.ok(layer.cells.has('ellipse1'), 'Cell Layer has cell');

        const layerView = this.paper.getLayerView('rect1');

        assert.ok(layerView.el.querySelector(`[model-id="ellipse1"]`), 'Layer view has cell view node for embedded cell');
    });
});
