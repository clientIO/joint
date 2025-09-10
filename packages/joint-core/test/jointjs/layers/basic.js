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

        assert.ok(defaultCellLayer.cells.has('rect1'), 'Default cell layer has rectangle cell');
        assert.ok(defaultCellLayer.cells.has('ellipse1'), 'Default cell layer has ellipse cell');

        const layerViewNode = this.paper.getLayerViewNode(defaultCellLayer.id);

        assert.ok(layerViewNode.querySelector(`[model-id="rect1"]`), 'Layer view has rectangle cell view node');
        assert.ok(layerViewNode.querySelector(`[model-id="ellipse1"]`), 'Layer view has ellipse cell view node');
    });

    QUnit.test('default fromJSON() cellLayers', (assert) => {
        this.graph.fromJSON({
            cellLayers: [
                { id: 'layer1', type: 'CellLayer' },
                { id: 'layer2', type: 'CellLayer' }
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
        assert.ok(this.graph.hasCellLayer('cells'), 'Graph has default layer "cells"');

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 3, 'There are 3 root layers in the graph');
        assert.equal(cellLayers[0].id, 'layer1', 'First layer is "layer1"');
        assert.equal(cellLayers[1].id, 'layer2', 'Second layer is "layer2"');
        assert.equal(cellLayers[2].id, 'cells', 'Third layer is "cells"');

        const layer1 = cellLayers[0];
        const layer2 = cellLayers[1];

        assert.ok(layer1.cells.has('rect1'), 'Layer "layer1" has rectangle cell');
        assert.ok(layer2.cells.has('ellipse1'), 'Layer "layer2" has ellipse cell');

        const layerViewNode = this.paper.getLayerViewNode('layer1');

        assert.ok(layerViewNode.querySelector(`[model-id="rect1"]`), 'Layer view for "layer1" has rectangle cell view node');

        const layerViewNode2 = this.paper.getLayerViewNode('layer2');

        assert.ok(layerViewNode2.querySelector(`[model-id="ellipse1"]`), 'Layer view for "layer2" has ellipse cell view node');
    });

    QUnit.test('Changing layer() attribute', (assert) => {
        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const defaultLayer = this.graph.getDefaultCellLayer();

        assert.ok(defaultLayer.cells.has(rect.id), 'Rectangle cell added to default layer');
        assert.ok(this.paper.getLayerViewNode(defaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to default layer view');

        const newLayer = new joint.dia.CellLayer({ id: 'newLayer' });
        this.graph.addCellLayer(newLayer);

        assert.ok(this.paper.hasLayerView('newLayer'), 'Paper has layer view "newLayer"');

        rect.set('layer', 'newLayer');

        assert.ok(newLayer.cells.has(rect.id), 'Rectangle cell moved to new layer');
        assert.ok(!defaultLayer.cells.has(rect.id), 'Rectangle cell removed from default layer');

        assert.ok(this.paper.getLayerViewNode('newLayer').querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to new layer view');

        rect.set('layer', null);

        assert.ok(defaultLayer.cells.has(rect.id), 'Rectangle cell moved back to default layer');
        assert.ok(!newLayer.cells.has(rect.id), 'Rectangle cell removed from new layer');

        assert.ok(this.paper.getLayerViewNode(defaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view moved back to default layer view');
    });

    QUnit.test('Changing default layer', (assert) => {
        const newLayer = new joint.dia.CellLayer({ id: 'newLayer' });
        this.graph.addCellLayer(newLayer);

        assert.ok(this.paper.hasLayerView('newLayer'), 'Paper has layer view "newLayer"');

        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const defaultLayer = this.graph.getDefaultCellLayer();

        assert.equal(rect.get('layer'), undefined, 'The layer is not defined (default)');
        assert.equal(defaultLayer.id, 'cells', 'Default layer is "cells"');
        assert.ok(defaultLayer.cells.has(rect.id), 'Rectangle cell added to default layer');
        assert.ok(this.paper.getLayerViewNode(defaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to default layer view');

        this.graph.setDefaultCellLayer('newLayer');

        const newDefaultLayer = this.graph.getDefaultCellLayer();
        assert.equal(newDefaultLayer.id, 'newLayer', 'New default layer is "newLayer"');

        assert.equal(rect.get('layer'), undefined, 'layer attr is still undefined');
        assert.ok(newDefaultLayer.cells.has(rect.id), 'Rectangle cell moved to new default layer');
        assert.ok(!defaultLayer.cells.has(rect.id), 'Rectangle cell removed from old default layer');

        assert.ok(this.paper.getLayerViewNode(newDefaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view moved to new default layer view');
    });

    QUnit.test('Adding new default layer', (assert) => {
        const newLayer = new joint.dia.CellLayer({ id: 'newLayer', default: true });
        this.graph.addCellLayer(newLayer);

        assert.ok(this.paper.hasLayerView('newLayer'), 'Paper has layer view "newLayer"');

        const rect = new joint.shapes.standard.Rectangle();
        rect.addTo(this.graph);

        const newDefaultLayer = this.graph.getDefaultCellLayer();
        assert.equal(newDefaultLayer.id, 'newLayer', 'New default layer is "newLayer"');

        assert.equal(rect.get('layer'), undefined, 'The layer is not defined (default)');
        assert.ok(newDefaultLayer.cells.has(rect.id), 'Rectangle cell added to new default layer');
        assert.ok(this.paper.getLayerViewNode(newDefaultLayer.id).querySelector(`[model-id="${rect.id}"]`), 'Rectangle cell view added to new default layer view');
    });

    QUnit.test('Inserting layers', (assert) => {

        const layer1 = new joint.dia.CellLayer({ id: 'layer1' });

        this.graph.addCellLayer(layer1);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers[0].id, 'cells', 'First layer is "cells"');
        assert.strictEqual(cellLayers[1].id, 'layer1', 'Second layer is "layer1"');

        const layer2 = new joint.dia.CellLayer({ id: 'layer2' });
        this.graph.addCellLayer(layer2);
        this.graph.insertCellLayer(layer2, 'layer1');

        const updatedCellLayers = this.graph.getCellLayers();
        assert.strictEqual(updatedCellLayers[0].id, 'cells', 'First layer is still "cells"');
        assert.strictEqual(updatedCellLayers[1].id, 'layer2', 'Second layer is now "layer2"');
        assert.strictEqual(updatedCellLayers[2].id, 'layer1', 'Third layer is "layer1"');

        this.graph.insertCellLayer(this.graph.getDefaultCellLayer(), 'layer1');

        const finalCellLayers = this.graph.getCellLayers();
        assert.strictEqual(finalCellLayers[0].id, 'layer2', 'First layer is "layer2"');
        assert.strictEqual(finalCellLayers[1].id, 'cells', 'Second layer is still "layer2"');
        assert.strictEqual(finalCellLayers[2].id, 'layer1', 'Third layer is "layer1"');

        this.graph.insertCellLayer(this.graph.getDefaultCellLayer(), 'cells');
        assert.deepEqual(this.graph.getCellLayers(), finalCellLayers, 'Inserting layer does not change order');

        this.graph.insertCellLayer(this.graph.getDefaultCellLayer(), 'layer1');
        assert.deepEqual(this.graph.getCellLayers(), finalCellLayers, 'Inserting layer does not change order');
    });

    QUnit.test('removing layers', (assert) => {
        const layer1 = new joint.dia.CellLayer({ id: 'layer1' });
        this.graph.addCellLayer(layer1);

        const layer2 = new joint.dia.CellLayer({ id: 'layer2' });
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

    QUnit.test('removing layer with cells', (assert) => {
        const layer1 = new joint.dia.CellLayer({ id: 'layer1' });
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
        assert.strictEqual(layer1.cells.length, 2, 'Layer "layer1" has 2 cells');

        this.graph.removeCellLayer(layer1);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 1, 'There is 1 layer in the graph');
        assert.strictEqual(cellLayers[0].id, 'cells', 'The only layer is "cells"');

        const defaultLayer = this.graph.getDefaultCellLayer();
        assert.strictEqual(defaultLayer.cells.length, 0, 'Default layer has no cells');

        assert.ok(!this.graph.getCell('rect1'), 'Cell "rect1" is removed from the graph');
        assert.ok(!this.graph.getCell('rect2'), 'Cell "rect2" is removed from the graph');
    });


    QUnit.test('using `set("cellLayers")` set on Graph', (assert) => {

        this.graph.set('cellLayers', [{
            id: 'layer1',
            type: 'CellLayer'
        }]);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 2, 'Graph has two cell layers');

        assert.ok(this.graph.hasCellLayer('layer1'), 'Graph has layer "layer1"');
        const defaultLayer = this.graph.getDefaultCellLayer();
        assert.equal(defaultLayer.id, 'cells', 'Default layer is "cells"');

        this.graph.addCell({
            type: 'standard.Rectangle',
            id: 'rect1'
        });

        this.graph.addCell({
            type: 'standard.Rectangle',
            id: 'rect2',
            layer: 'layer1'
        });

        this.graph.set('cellLayers', [{
            id: 'layer1',
            type: 'CellLayer',
            default: true
        }]);

        assert.equal(this.graph.getDefaultCellLayer().id, 'layer1', 'Default layer is now "layer1"');
        assert.equal(this.graph.getCellLayer('layer1').cells.length, 2, 'Layer "layer1" has two cells');

        const rect1 = this.graph.getCell('rect1');
        assert.equal(rect1.get('layer'),  undefined, 'Cell "rect1" has no layer attribute');

        this.graph.set('cellLayers', [{
            id: 'layer1',
            type: 'CellLayer'
        }]);

        assert.equal(this.graph.getDefaultCellLayer().id, 'cells', 'Default layer is back to "cells"');
        assert.equal(this.graph.getCellLayers().length, 2, 'There are 2 layers in the graph');
    });


    QUnit.test('custom attributes in "cellLayers"', (assert) => {

        const layer1 = new joint.dia.CellLayer({ id: 'layer1', name: 'Layer 1' });

        this.graph.addCellLayer(layer1);

        const cellLayers = this.graph.getCellLayers();
        assert.strictEqual(cellLayers.length, 2, 'Graph has two cell layers');

        assert.equal(cellLayers[1].get('name'), 'Layer 1', 'The custom attribute "name" is set correctly in the cell layer');

        layer1.unset('name');

        const updatedCellLayersJSON = this.graph.toJSON().cellLayers;

        assert.strictEqual(updatedCellLayersJSON.length, 2, 'Graph still has two cell layers after unsetting custom attribute');
        assert.ok(!updatedCellLayersJSON[1].hasOwnProperty('name'), 'The custom attribute "name" is removed from the cell layer');

        layer1.set('name', 'Layer 1');

        const layer2 = new joint.dia.CellLayer({ id: 'layer2', description: 'This is layer 2' });
        this.graph.addCellLayer(layer2);

        const json = JSON.stringify(this.graph.toJSON());

        assert.equal(json, `{"cells":[],"cellLayers":[{"type":"CellLayer","id":"cells","default":true},{"type":"CellLayer","id":"layer1","name":"Layer 1"},{"type":"CellLayer","id":"layer2","description":"This is layer 2"}]}`, 'Graph JSON includes custom attributes in "cellLayers"');
    });
});
