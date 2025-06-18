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

    QUnit.test('Default layers setup', function(assert) {
        assert.ok(this.graph.layersController, 'Graph layers controller is created');

        const layers = this.graph.get('layers');

        assert.ok(Array.isArray(layers), 'Graph has layers attribute');

        assert.strictEqual(layers.length, 1, 'Graph has one default layer');

        assert.strictEqual(layers[0].name, 'cells', 'Graph has default layer with name "cells"');

        assert.ok(this.paper.getLayer('cells'), 'Paper has default layer view for "cells" layer');

        const cellsLayerView = this.paper.getLayer('cells');

        assert.equal(cellsLayerView.model, layers[0], 'Default layer view is linked to the default layer model');
    });

    hooks.afterEach(function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });
});
