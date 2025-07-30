QUnit.module('layers-basic', function(hooks) {

    hooks.beforeEach(() => {

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

    hooks.afterEach(() => {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });

    QUnit.test('Default layers setup', (assert) => {
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

    QUnit.test('default fromJSON() cells', (assert) => {
        this.graph.fromJSON({
            cells: [
                {
                    type: 'standard.Rectangle',
                    id: 'rect1',
                    position: { x: 100, y: 100 },
                    size: { width: 200, height: 100 },
                },
                {
                    type: 'standard.Ellipse',
                    id: 'ellipse1',
                    position: { x: 150, y: 150 },
                    size: { width: 20, height: 20 },
                }
            ]
        });

        const defaultCellLayer = this.graph.getDefaultCellLayer();

        assert.ok(defaultCellLayer.cells.has('rect1'), 'Default cell layer has rectangle cell');
        assert.ok(defaultCellLayer.cells.has('ellipse1'), 'Default cell layer has ellipse cell');

        const layerViewNode = this.paper.getLayerViewNode(defaultCellLayer.id);

        assert.ok(layerViewNode.querySelector(`[model-id="rect1"]`), 'Layer view has rectangle cell view node');
        assert.ok(layerViewNode.querySelector(`[model-id="ellipse1"]`), 'Layer view has ellipse cell view node');
    });

    QUnit.test('default fromJSON() cellLayers', (assert) => {
        this.graph.fromJSON({
            cellLayers: [
                { id: 'layer1' },
                { id: 'layer2' }
            ],
            cells: [
                {
                    type: 'standard.Rectangle',
                    id: 'rect1',
                    position: { x: 100, y: 100 },
                    size: { width: 200, height: 100 },
                    layer: 'layer1'
                },
                {
                    type: 'standard.Ellipse',
                    id: 'ellipse1',
                    position: { x: 150, y: 150 },
                    size: { width: 20, height: 20 },
                    layer: 'layer2'
                }
            ]
        });

        assert.ok(this.graph.hasCellLayer('layer1'), 'Graph has layer "layer1"');
        assert.ok(this.graph.hasCellLayer('layer2'), 'Graph has layer "layer2"');

        const layer1 = this.graph.getCellLayer('layer1');
        const layer2 = this.graph.getCellLayer('layer2');

        assert.ok(layer1.cells.has('rect1'), 'Layer "layer1" has rectangle cell');
        assert.ok(layer2.cells.has('ellipse1'), 'Layer "layer2" has ellipse cell');

        const layerViewNode = this.paper.getLayerViewNode('layer1');

        assert.ok(layerViewNode.querySelector(`[model-id="rect1"]`), 'Layer view for "layer1" has rectangle cell view node');

        const layerViewNode2 = this.paper.getLayerViewNode('layer2');

        assert.ok(layerViewNode2.querySelector(`[model-id="ellipse1"]`), 'Layer view for "layer2" has ellipse cell view node');
    });
});
