QUnit.module('Layers', function(hooks) {

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
        assert.ok(this.graph.layersController, 'Layers controller is created');

        const layerCollection = this.graph.layerCollection;

        assert.ok(layerCollection, 'Graph has layerCollection attribute');

        assert.strictEqual(layerCollection.models.length, 1, 'Graph has one default layer');

        assert.strictEqual(layerCollection.models[0].id, 'cells', 'Graph has default layer with id "cells"');

        assert.ok(this.paper.getLayerView('cells'), 'Paper has default layer view for "cells" layer');

        const cellsLayerView = this.paper.getLayerView('cells');
        const graphDefaultLayer = this.graph.getDefaultLayer();

        assert.equal(cellsLayerView.model, graphDefaultLayer, 'Default layer view is linked to the default layer model');
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

        assert.ok(this.graph.hasLayer('cells'), 'Graph has default layer "cells"');

        const defaultLayer = this.graph.getDefaultLayer();

        assert.ok(defaultLayer.cellCollection.has('rect1'), 'Default layer has rectangle cell');
        assert.ok(defaultLayer.cellCollection.has('ellipse1'), 'Default layer has ellipse cell');

        const layerViewNode = this.paper.getLayerView(defaultLayer.id).el;

        assert.ok(layerViewNode.querySelector('[model-id="rect1"]'), 'Layer view has rectangle cell view node');
        assert.ok(layerViewNode.querySelector('[model-id="ellipse1"]'), 'Layer view has ellipse cell view node');
    });

    QUnit.test('default fromJSON() layers', (assert) => {
        this.graph.fromJSON({
            layers: [
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

        assert.ok(this.graph.hasLayer('layer1'), 'Graph has layer "layer1"');
        assert.ok(this.graph.hasLayer('layer2'), 'Graph has layer "layer2"');
        assert.equal(this.graph.getDefaultLayer().id, 'layer1', 'Graph has default layer "layer1"');

        const layers = this.graph.getLayers();
        assert.strictEqual(layers.length, 2, 'There are 2 layers in the graph');
        assert.equal(layers[0].id, 'layer1', 'First layer is "layer1"');
        assert.equal(layers[1].id, 'layer2', 'Second layer is "layer2"');

        const layer1 = layers[0];
        const layer2 = layers[1];

        assert.ok(layer1.cellCollection.has('rect1'), 'Layer "layer1" has rectangle cell');
        assert.ok(layer2.cellCollection.has('ellipse1'), 'Layer "layer2" has ellipse cell');

        const layer1Node = this.paper.getLayerView('layer1').el;
        assert.ok(layer1Node.querySelector('[model-id="rect1"]'), 'Layer view for "layer1" has rectangle cell view node');

        const layer2Node = this.paper.getLayerView('layer2').el;
        assert.ok(layer2Node.querySelector('[model-id="ellipse1"]'), 'Layer view for "layer2" has ellipse cell view node');

        assert.ok(layer1Node.nextSibling === layer2Node, '"layer1" layer view is before "layer2" layer view');
    });

    QUnit.test('Changing layer() attribute', (assert) => {
        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const defaultLayer = this.graph.getDefaultLayer();

        assert.ok(defaultLayer.cellCollection.has(rect.id), 'Rectangle cell added to default layer');
        assert.ok(this.paper.getLayerView(defaultLayer.id).el.querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to default layer view');

        const newLayer = new joint.dia.GraphLayer({ id: 'newLayer' });
        this.graph.addLayer(newLayer);

        assert.ok(this.paper.hasLayerView('newLayer'), 'Paper has layer view "newLayer"');

        rect.set('layer', 'newLayer');

        assert.ok(newLayer.cellCollection.has(rect.id), 'Rectangle cell moved to new layer');
        assert.ok(!defaultLayer.cellCollection.has(rect.id), 'Rectangle cell removed from default layer');

        assert.ok(this.paper.getLayerView('newLayer').el.querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to new layer view');

        rect.set('layer', null);

        assert.ok(defaultLayer.cellCollection.has(rect.id), 'Rectangle cell moved back to default layer');
        assert.ok(!newLayer.cellCollection.has(rect.id), 'Rectangle cell removed from new layer');

        assert.ok(this.paper.getLayerView(defaultLayer.id).el.querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view moved back to default layer view');
    });

    QUnit.test('Different layer attribute config', (assert) => {
        joint.config.layerAttribute = '_layerId';

        const newLayer = new joint.dia.GraphLayer({ id: 'newLayer' });
        this.graph.addLayer(newLayer);

        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const defaultLayer = this.graph.getDefaultLayer();
        assert.ok(defaultLayer.cellCollection.has(rect.id), 'Rectangle cell added to default layer');
        assert.ok(this.paper.getLayerView(defaultLayer.id).el.querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to default layer view');

        rect.layer('newLayer');
        assert.ok(newLayer.cellCollection.has(rect.id), 'Rectangle cell added to "newLayer" layer');
        assert.ok(this.paper.getLayerView('newLayer').el.querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to "newLayer" layer view');

        assert.equal(rect.get('_layerId'), 'newLayer', 'The custom layer attribute is set correctly');

        // Clean up
        joint.config.layerAttribute = 'layer';
    });

    QUnit.test('Changing default layer', (assert) => {
        const newLayer = new joint.dia.GraphLayer({ id: 'newLayer' });
        this.graph.addLayer(newLayer);

        assert.ok(this.paper.hasLayerView('newLayer'), 'Paper has layer view "newLayer"');

        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const defaultLayer = this.graph.getDefaultLayer();

        assert.equal(rect.get('layer'), undefined, 'The layer is not defined (default)');
        assert.equal(defaultLayer.id, 'cells', 'Default layer is "cells"');
        assert.ok(defaultLayer.cellCollection.has(rect.id), 'Rectangle cell added to default layer');
        assert.ok(this.paper.getLayerView(defaultLayer.id).el.querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to default layer view');

        this.graph.setDefaultLayer('newLayer');

        const newDefaultLayer = this.graph.getDefaultLayer();
        assert.equal(newDefaultLayer.id, 'newLayer', 'New default layer is "newLayer"');

        assert.equal(rect.get('layer'), undefined, 'layer attr is still undefined');
        assert.ok(newDefaultLayer.cellCollection.has(rect.id), 'Rectangle cell moved to new default layer');
        assert.ok(!defaultLayer.cellCollection.has(rect.id), 'Rectangle cell removed from old default layer');

        assert.ok(this.paper.getLayerView(newDefaultLayer.id).el.querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view moved to new default layer view');
    });

    QUnit.test('Inserting layers', (assert) => {

        const layer1 = new joint.dia.GraphLayer({ id: 'layer1' });

        this.graph.addLayer(layer1);

        assert.equal(layer1.graph, this.graph, 'Layer1 graph reference is set');

        const layers = this.graph.getLayers();
        assert.strictEqual(layers[0].id, 'cells', 'First layer is "cells"');
        assert.strictEqual(layers[1].id, 'layer1', 'Second layer is "layer1"');

        const cellsLayerNode = this.paper.getLayerView('cells').el;
        const layer1Node = this.paper.getLayerView('layer1').el;
        assert.ok(cellsLayerNode.nextSibling === layer1Node, '"cells" layer view is before "layer1" layer view');

        const layer2 = new joint.dia.GraphLayer({ id: 'layer2' });
        this.graph.addLayer(layer2, { before: 'layer1' });
        const layer2Node = this.paper.getLayerView('layer2').el;
        assert.ok(cellsLayerNode.nextSibling === layer2Node, '"cells" layer view is before "layer2" layer view');
        assert.ok(layer2Node.nextSibling === layer1Node, '"layer2" layer view is before "layer1" layer view');

        const updatedLayers = this.graph.getLayers();
        assert.strictEqual(updatedLayers[0].id, 'cells', 'First layer is still "cells"');
        assert.strictEqual(updatedLayers[1].id, 'layer2', 'Second layer is now "layer2"');
        assert.strictEqual(updatedLayers[2].id, 'layer1', 'Third layer is "layer1"');
        // Moving layers
        this.graph.moveLayer(this.graph.getDefaultLayer(), { before: 'layer1' });
        assert.ok(cellsLayerNode.nextSibling === layer1Node, '"cells" layer view is before "layer1" layer view');
        assert.ok(layer2Node.nextSibling === cellsLayerNode, '"layer2" layer view is before "cells" layer view');

        const finalLayers = this.graph.getLayers();
        assert.strictEqual(finalLayers[0].id, 'layer2', 'First layer is "layer2"');
        assert.strictEqual(finalLayers[1].id, 'cells', 'Second layer is still "layer2"');
        assert.strictEqual(finalLayers[2].id, 'layer1', 'Third layer is "layer1"');

        this.graph.moveLayer(this.graph.getDefaultLayer(), { before: 'cells' });
        assert.deepEqual(this.graph.getLayers(), finalLayers, 'Inserting layer does not change order');

        this.graph.moveLayer(this.graph.getDefaultLayer(), { before: 'layer1' });
        assert.deepEqual(this.graph.getLayers(), finalLayers, 'Inserting layer does not change order');
    });

    QUnit.test('removing layers', (assert) => {
        const layer1 = new joint.dia.GraphLayer({ id: 'layer1' });
        this.graph.addLayer(layer1);

        assert.equal(layer1.graph, this.graph, 'Layer1 graph reference is set');

        const layer2 = new joint.dia.GraphLayer({ id: 'layer2' });
        this.graph.addLayer(layer2);

        assert.equal(layer2.graph, this.graph, 'Layer2 graph reference is set');

        assert.strictEqual(this.graph.getLayers().length, 3, 'There are 3 layers in the graph');

        this.graph.removeLayer(layer1);

        assert.equal(layer1.graph, null, 'Layer1 graph reference is removed');

        const layers = this.graph.getLayers();
        assert.strictEqual(layers.length, 2, 'There are 2 layers in the graph');
        assert.strictEqual(layers[0].id, 'cells', 'First layer is "cells"');
        assert.strictEqual(layers[1].id, 'layer2', 'Second layer is "layer2"');

        this.graph.removeLayer(layer2);

        assert.equal(layer2.graph, null, 'Layer2 graph reference is removed');

        const updatedLayers = this.graph.getLayers();
        assert.strictEqual(updatedLayers.length, 1, 'There is 1 layer in the graph');
        assert.strictEqual(updatedLayers[0].id, 'cells', 'The only layer is "cells"');

        assert.throws(() => {
            this.graph.removeLayer(this.graph.getLayer('cells'));
        }, new Error('dia.Graph: default layer cannot be removed.'), 'default layer cannot be removed');

        assert.strictEqual(this.graph.getLayers().length, 1, 'There is still 1 layer in the graph');
    });

    QUnit.test('reset cells and layers with fromJSON()', (assert) => {
        const layer1 = new joint.dia.GraphLayer({ id: 'layer1' });
        this.graph.addLayer(layer1);
        const layer2 = new joint.dia.GraphLayer({ id: 'layer2' });
        this.graph.addLayer(layer2);

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

        assert.equal(this.graph.getLayers().length, 3, 'There are 3 layers in the graph');

        this.graph.fromJSON({
            layers: [
                { id: 'cells' }
            ],
            cells: [{ id: 'rect3', type: 'standard.Rectangle'  }]
        });

        assert.equal(layer1.graph, null, 'Layer1 graph reference is removed after reset');
        assert.equal(layer2.graph, null, 'Layer2 graph reference is removed after reset');

        const layers = this.graph.getLayers();

        assert.equal(layers[0].graph, this.graph, 'Layer graph reference is set after reset');
        assert.equal(layers.length, 1, 'There is 1 layer in the graph');
        assert.equal(layers[0].id, 'cells', 'The only layer is "cells"');
        assert.equal(this.graph.getCells().length, 1, 'There is 1 cell in the graph');
        assert.ok(this.graph.getCell('rect3'), 'Cell "rect3" is added to the graph');
        assert.equal(this.paper.el.querySelectorAll('.joint-cells').length, 1, 'There is 1 layer view in the paper');
        assert.equal(this.paper.el.querySelectorAll('.joint-cell').length, 1, 'There is 1 cell view in the paper');

        this.graph.addLayer(layer1);

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

        this.graph.fromJSON({
            layers: [
                { id: 'layer1' },
                { id: 'layer2' },
            ],
            defaultLayer: 'layer2',
            cells: [
                { id: 'rect4', type: 'standard.Rectangle' },
            ]
        });

        const updatedLayers = this.graph.getLayers();

        assert.equal(updatedLayers.length, 2, 'There are 2 layers in the graph');
        assert.notOk(this.graph.hasLayer('cells'), 'Layer "cells" is removed after reset');
        assert.ok(this.graph.getCell('rect4'), 'Cell "rect4" is added to the graph after reset');
        assert.equal(this.graph.getLayer('layer1').getCells().length, 0, 'Layer "layer1" has no cells after reset');
        assert.equal(this.graph.getLayer('layer2').getCells().length, 1, 'Layer "layer2" has 1 cell after reset');
        assert.equal(this.paper.el.querySelectorAll('.joint-cells').length, 2, 'There are 2 layer views in the paper');
        assert.equal(this.paper.el.querySelectorAll('.joint-cells .joint-cell').length, 1, 'There is 1 cell view in the layer view');
    });


    QUnit.test('removing layer with cells', (assert) => {
        const layer1 = new joint.dia.GraphLayer({ id: 'layer1' });
        this.graph.addLayer(layer1);

        const rect1 = new joint.shapes.standard.Rectangle({
            id: 'rect1',
            layer: 'layer1'
        });

        const rect2 = new joint.shapes.standard.Rectangle({
            id: 'rect2',
            layer: 'layer1'
        });

        this.graph.addCells([rect1, rect2]);

        assert.strictEqual(this.graph.getLayers().length, 2, 'There are 2 layers in the graph');
        assert.strictEqual(layer1.cellCollection.length, 2, 'Layer "layer1" has 2 cells');

        this.graph.removeLayer(layer1);

        const layers = this.graph.getLayers();
        assert.strictEqual(layers.length, 1, 'There is 1 layer in the graph');
        assert.strictEqual(layers[0].id, 'cells', 'The only layer is "cells"');

        const defaultLayer = this.graph.getDefaultLayer();
        assert.strictEqual(defaultLayer.cellCollection.length, 0, 'Default layer has no cells');

        assert.ok(!this.graph.getCell('rect1'), 'Cell "rect1" is removed from the graph');
        assert.ok(!this.graph.getCell('rect2'), 'Cell "rect2" is removed from the graph');

        assert.notOk(rect1.graph, 'Cell "rect1" graph reference is removed');
        assert.notOk(rect2.graph, 'Cell "rect2" graph reference is removed');
    });

    QUnit.test('custom attributes in "layers"', (assert) => {

        const layer1 = new joint.dia.GraphLayer({ id: 'layer1', name: 'Layer 1' });

        this.graph.addLayer(layer1);

        const layers = this.graph.getLayers();
        assert.strictEqual(layers.length, 2, 'Graph has two layers');

        assert.equal(layers[1].get('name'), 'Layer 1', 'The custom attribute "name" is set correctly in the layer');

        layer1.unset('name');

        const updatedLayersJSON = this.graph.toJSON().layers;

        assert.strictEqual(updatedLayersJSON.length, 2, 'Graph still has two layers after unsetting custom attribute');
        assert.ok(!updatedLayersJSON[1].hasOwnProperty('name'), 'The custom attribute "name" is removed from the layer');

        layer1.set('name', 'Layer 1');

        const layer2 = new joint.dia.GraphLayer({ id: 'layer2', description: 'This is layer 2' });
        this.graph.addLayer(layer2);

        const json = JSON.stringify(this.graph.toJSON());

        assert.equal(json, '{"cells":[],"layers":[{"type":"GraphLayer","id":"cells"},{"type":"GraphLayer","id":"layer1","name":"Layer 1"},{"type":"GraphLayer","id":"layer2","description":"This is layer 2"}],"defaultLayer":"cells"}', 'Graph JSON includes custom attributes in "layers"');
    });
});
