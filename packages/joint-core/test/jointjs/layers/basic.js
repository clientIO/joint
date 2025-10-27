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

        const cellLayerCollection = this.graph.cellLayerCollection;

        assert.ok(cellLayerCollection, 'Graph has cellLayers attribute');

        assert.strictEqual(cellLayerCollection.models.length, 1, 'Graph has one default cell layer');

        assert.strictEqual(cellLayerCollection.models[0].id, 'cells', 'Graph has default cell layer with id "cells"');

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

        assert.ok(this.graph.hasCellLayer('cells'), 'Graph has default layer "cells"');

        const defaultCellLayer = this.graph.getDefaultCellLayer();

        assert.ok(defaultCellLayer.cellCollection.has('rect1'), 'Default cell layer has rectangle cell');
        assert.ok(defaultCellLayer.cellCollection.has('ellipse1'), 'Default cell layer has ellipse cell');

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
        assert.equal(this.graph.getDefaultCellLayer().id, 'layer1', 'Graph has default layer "layer1"');

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 2, 'There are 2 cell layers in the graph');
        assert.equal(cellLayers[0].id, 'layer1', 'First layer is "layer1"');
        assert.equal(cellLayers[1].id, 'layer2', 'Second layer is "layer2"');

        const layer1 = cellLayers[0];
        const layer2 = cellLayers[1];

        assert.ok(layer1.cellCollection.has('rect1'), 'Layer "layer1" has rectangle cell');
        assert.ok(layer2.cellCollection.has('ellipse1'), 'Layer "layer2" has ellipse cell');

        const layer1Node = this.paper.getLayerViewNode('layer1');
        assert.ok(layer1Node.querySelector(`[model-id="rect1"]`), 'Layer view for "layer1" has rectangle cell view node');

        const layer2Node = this.paper.getLayerViewNode('layer2');
        assert.ok(layer2Node.querySelector(`[model-id="ellipse1"]`), 'Layer view for "layer2" has ellipse cell view node');

        assert.ok(layer1Node.nextSibling === layer2Node, '"layer1" layer view is before "layer2" layer view');
    });

    QUnit.test('Changing layer() attribute', (assert) => {
        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const defaultLayer = this.graph.getDefaultCellLayer();

        assert.ok(defaultLayer.cellCollection.has(rect.id), 'Rectangle cell added to default layer');
        assert.ok(this.paper.getLayerViewNode(defaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to default layer view');

        const newLayer = new joint.dia.GraphLayer({ id: 'newLayer' });
        this.graph.addCellLayer(newLayer);

        assert.ok(this.paper.hasLayerView('newLayer'), 'Paper has layer view "newLayer"');

        rect.set('layer', 'newLayer');

        assert.ok(newLayer.cellCollection.has(rect.id), 'Rectangle cell moved to new layer');
        assert.ok(!defaultLayer.cellCollection.has(rect.id), 'Rectangle cell removed from default layer');

        assert.ok(this.paper.getLayerViewNode('newLayer').querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to new layer view');

        rect.set('layer', null);

        assert.ok(defaultLayer.cellCollection.has(rect.id), 'Rectangle cell moved back to default layer');
        assert.ok(!newLayer.cellCollection.has(rect.id), 'Rectangle cell removed from new layer');

        assert.ok(this.paper.getLayerViewNode(defaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view moved back to default layer view');
    });

    QUnit.test('Different layer attribute config', (assert) => {
        joint.config.layerAttribute = '_layerId';

        const newLayer = new joint.dia.GraphLayer({ id: 'newLayer' });
        this.graph.addCellLayer(newLayer);

        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const defaultLayer = this.graph.getDefaultCellLayer();
        assert.ok(defaultLayer.cellCollection.has(rect.id), 'Rectangle cell added to default layer');
        assert.ok(this.paper.getLayerViewNode(defaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to default layer view');

        rect.layer('newLayer');
        assert.ok(newLayer.cellCollection.has(rect.id), 'Rectangle cell added to "newLayer" layer');
        assert.ok(this.paper.getLayerViewNode('newLayer').querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to "newLayer" layer view');

        assert.equal(rect.get('_layerId'), 'newLayer', 'The custom layer attribute is set correctly');

        // Clean up
        joint.config.layerAttribute = 'layer';
    });

    QUnit.test('Changing default layer', (assert) => {
        const newLayer = new joint.dia.GraphLayer({ id: 'newLayer' });
        this.graph.addCellLayer(newLayer);

        assert.ok(this.paper.hasLayerView('newLayer'), 'Paper has layer view "newLayer"');

        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const defaultLayer = this.graph.getDefaultCellLayer();

        assert.equal(rect.get('layer'), undefined, 'The layer is not defined (default)');
        assert.equal(defaultLayer.id, 'cells', 'Default layer is "cells"');
        assert.ok(defaultLayer.cellCollection.has(rect.id), 'Rectangle cell added to default layer');
        assert.ok(this.paper.getLayerViewNode(defaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to default layer view');

        this.graph.setDefaultCellLayer('newLayer');

        const newDefaultLayer = this.graph.getDefaultCellLayer();
        assert.equal(newDefaultLayer.id, 'newLayer', 'New default layer is "newLayer"');

        assert.equal(rect.get('layer'), undefined, 'layer attr is still undefined');
        assert.ok(newDefaultLayer.cellCollection.has(rect.id), 'Rectangle cell moved to new default layer');
        assert.ok(!defaultLayer.cellCollection.has(rect.id), 'Rectangle cell removed from old default layer');

        assert.ok(this.paper.getLayerViewNode(newDefaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view moved to new default layer view');
    });

    QUnit.test('Inserting layers', (assert) => {

        const layer1 = new joint.dia.GraphLayer({ id: 'layer1' });

        this.graph.addCellLayer(layer1);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers[0].id, 'cells', 'First layer is "cells"');
        assert.strictEqual(cellLayers[1].id, 'layer1', 'Second layer is "layer1"');

        const cellsLayerNode = this.paper.getLayerViewNode('cells');
        const layer1Node = this.paper.getLayerViewNode('layer1');
        assert.ok(cellsLayerNode.nextSibling === layer1Node, '"cells" layer view is before "layer1" layer view');

        const layer2 = new joint.dia.GraphLayer({ id: 'layer2' });
        this.graph.addCellLayer(layer2, { insertBefore: 'layer1' });
        const layer2Node = this.paper.getLayerViewNode('layer2');
        assert.ok(cellsLayerNode.nextSibling === layer2Node, '"cells" layer view is before "layer2" layer view');
        assert.ok(layer2Node.nextSibling === layer1Node, '"layer2" layer view is before "layer1" layer view');

        const updatedCellLayers = this.graph.getCellLayers();
        assert.strictEqual(updatedCellLayers[0].id, 'cells', 'First layer is still "cells"');
        assert.strictEqual(updatedCellLayers[1].id, 'layer2', 'Second layer is now "layer2"');
        assert.strictEqual(updatedCellLayers[2].id, 'layer1', 'Third layer is "layer1"');

        this.graph.addCellLayer(this.graph.getDefaultCellLayer(), { insertBefore: 'layer1' });

        assert.ok(cellsLayerNode.nextSibling === layer1Node, '"cells" layer view is before "layer1" layer view');
        assert.ok(layer2Node.nextSibling === cellsLayerNode, '"layer2" layer view is before "cells" layer view');

        const finalCellLayers = this.graph.getCellLayers();
        assert.strictEqual(finalCellLayers[0].id, 'layer2', 'First layer is "layer2"');
        assert.strictEqual(finalCellLayers[1].id, 'cells', 'Second layer is still "layer2"');
        assert.strictEqual(finalCellLayers[2].id, 'layer1', 'Third layer is "layer1"');

        this.graph.addCellLayer(this.graph.getDefaultCellLayer(), { insertBefore: 'cells' });
        assert.deepEqual(this.graph.getCellLayers(), finalCellLayers, 'Inserting layer does not change order');

        this.graph.addCellLayer(this.graph.getDefaultCellLayer(), { insertBefore: 'layer1' });
        assert.deepEqual(this.graph.getCellLayers(), finalCellLayers, 'Inserting layer does not change order');
    });

    QUnit.test('removing layers', (assert) => {
        const layer1 = new joint.dia.GraphLayer({ id: 'layer1' });
        this.graph.addCellLayer(layer1);

        const layer2 = new joint.dia.GraphLayer({ id: 'layer2' });
        this.graph.addCellLayer(layer2);

        assert.strictEqual(this.graph.getCellLayers().length, 3, 'There are 3 layers in the graph');

        this.graph.removeCellLayer(layer1);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 2, 'There are 2 layers in the graph');
        assert.strictEqual(cellLayers[0].id, 'cells', 'First layer is "cells"');
        assert.strictEqual(cellLayers[1].id, 'layer2', 'Second layer is "layer2"');

        this.graph.removeCellLayer(layer2);

        const updatedCellLayers = this.graph.getCellLayers();
        assert.strictEqual(updatedCellLayers.length, 1, 'There is 1 layer in the graph');
        assert.strictEqual(updatedCellLayers[0].id, 'cells', 'The only layer is "cells"');

        assert.throws(() => {
            this.graph.removeCellLayer(this.graph.getCellLayer('cells'));
        }, new Error('dia.Graph: default layer cannot be removed.'), 'default layer cannot be removed');

        assert.strictEqual(this.graph.getCellLayers().length, 1, 'There is still 1 layer in the graph');
    });

    QUnit.test('resetting layers', (assert) => {
        const layer1 = new joint.dia.GraphLayer({ id: 'layer1' });
        this.graph.addCellLayer(layer1);
        const layer2 = new joint.dia.GraphLayer({ id: 'layer2' });
        this.graph.addCellLayer(layer2);

        this.graph.addCell({
            type: 'standard.Rectangle',
            id: 'rect1',
            layer: 'layer1'
        });

        this.graph.addCell({
            type: 'standard.Rectangle',
            id: 'rect2',
            layer: 'layer2'
        });

        assert.strictEqual(this.graph.getCellLayers().length, 3, 'There are 3 layers in the graph');

        this.graph.resetCellLayers([{ id: 'cells' }]);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 1, 'There is 1 layer in the graph');
        assert.strictEqual(cellLayers[0].id, 'cells', 'The only layer is "cells"');

        assert.equal(this.graph.getCells().length, 0, 'There are no cells in the graph');
        assert.equal(this.paper.el.querySelectorAll('.joint-graph-layer').length, 1, 'There is 1 layer view in the paper');
        assert.equal(this.paper.el.querySelectorAll('.joint-cell').length, 0, 'There are no cell views in the paper');

        this.graph.addCellLayer(layer1);

        this.graph.addCell({
            type: 'standard.Rectangle',
            id: 'rect1',
            layer: 'layer1'
        });

        this.graph.addCell({
            type: 'standard.Rectangle',
            id: 'rect2',
            layer: 'cells'
        });

        this.graph.resetCellLayers([
            { id: 'layer1' }
        ]);

        updatedCellLayers = this.graph.getCellLayers();

        assert.strictEqual(updatedCellLayers.length, 1, 'There is 1 layer in the graph');
        assert.strictEqual(updatedCellLayers[0].id, 'layer1', 'The only layer is "layer1"');
        assert.equal(this.graph.getCells().length, 0, 'There is 0 cell in the graph');

        assert.equal(this.paper.el.querySelectorAll('.joint-graph-layer').length, 1, 'There is 1 layer view in the paper');
        assert.equal(this.paper.el.querySelectorAll('.joint-graph-layer .joint-cell').length, 0, 'The is no cell views in the layer view');
    });


    QUnit.test('removing layer with cells', (assert) => {
        const layer1 = new joint.dia.GraphLayer({ id: 'layer1' });
        this.graph.addCellLayer(layer1);

        this.graph.addCell({
            type: 'standard.Rectangle',
            id: 'rect1',
            layer: 'layer1'
        });

        this.graph.addCell({
            type: 'standard.Rectangle',
            id: 'rect2',
            layer: 'layer1'
        });

        assert.strictEqual(this.graph.getCellLayers().length, 2, 'There are 2 layers in the graph');
        assert.strictEqual(layer1.cellCollection.length, 2, 'Layer "layer1" has 2 cells');

        this.graph.removeCellLayer(layer1);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 1, 'There is 1 layer in the graph');
        assert.strictEqual(cellLayers[0].id, 'cells', 'The only layer is "cells"');

        const defaultLayer = this.graph.getDefaultCellLayer();
        assert.strictEqual(defaultLayer.cellCollection.length, 0, 'Default layer has no cells');

        assert.ok(!this.graph.getCell('rect1'), 'Cell "rect1" is removed from the graph');
        assert.ok(!this.graph.getCell('rect2'), 'Cell "rect2" is removed from the graph');
    });

    QUnit.test('custom attributes in "cellLayers"', (assert) => {

        const layer1 = new joint.dia.GraphLayer({ id: 'layer1', name: 'Layer 1' });

        this.graph.addCellLayer(layer1);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 2, 'Graph has two cell layers');

        assert.equal(cellLayers[1].get('name'), 'Layer 1', 'The custom attribute "name" is set correctly in the cell layer');

        layer1.unset('name');

        const updatedCellLayersJSON = this.graph.toJSON().cellLayers;

        assert.strictEqual(updatedCellLayersJSON.length, 2, 'Graph still has two cell layers after unsetting custom attribute');
        assert.ok(!updatedCellLayersJSON[1].hasOwnProperty('name'), 'The custom attribute "name" is removed from the cell layer');

        layer1.set('name', 'Layer 1');

        const layer2 = new joint.dia.GraphLayer({ id: 'layer2', description: 'This is layer 2' });
        this.graph.addCellLayer(layer2);

        const json = JSON.stringify(this.graph.toJSON());

        assert.equal(json, `{"cells":[],"cellLayers":[{"type":"GraphLayer","id":"cells"},{"type":"GraphLayer","id":"layer1","name":"Layer 1"},{"type":"GraphLayer","id":"layer2","description":"This is layer 2"}],"defaultCellLayer":"cells"}`, 'Graph JSON includes custom attributes in "cellLayers"');
    });
});
