QUnit.module('layers-basic', function(hooks) {

    hooks.beforeEach(function() {

        const fixtureEl = fixtures.getElement();
        const paperEl = document.createElement('div');
        fixtureEl.appendChild(paperEl);
        this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        this.paper = new joint.dia.Paper({
            el: paperEl,
            model: this.graph,
            cellViewNamespace: joint.shapes,
        });
    });

    hooks.afterEach(function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });

    QUnit.test('Default layers setup', function(assert) {
        assert.ok(this.graph.cellLayersController, 'Cell layers controller is created');

        const cellLayers = this.graph.get('cellLayers');

        assert.ok(Array.isArray(cellLayers), 'Graph has cellLayers attribute');

        assert.strictEqual(cellLayers.length, 1, 'Graph has one default cell layer');

        assert.strictEqual(cellLayers[0].id, 'cells', 'Graph has default cell layer with id "cells"');

        assert.ok(this.paper.getLayerView('cells'), 'Paper has default layer view for "cells" layer');

        const cellsLayerView = this.paper.getLayerView('cells');
        const graphDefaultCellLayer = this.graph.getDefaultCellLayer();

        assert.equal(cellsLayerView.model, graphDefaultCellLayer, 'Default layer view is linked to the default layer model');
    });
});
