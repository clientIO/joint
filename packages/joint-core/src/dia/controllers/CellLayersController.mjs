import { Listener } from '../../mvc/Listener.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';

const DEFAULT_CELL_LAYER_ID = 'cells';

export class CellLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;
        this.collection = this.graph.cellLayerCollection;

        // Default setup
        this.defaultCellLayerId = DEFAULT_CELL_LAYER_ID;
        this.addCellLayer({
            id: DEFAULT_CELL_LAYER_ID,
            type: 'LegacyCellLayer',
        });

        this.startListening();
    }

    startListening() {
        const { graph } = this;

        // remove all cells from this layer when the layer is removed from the graph
        this.listenTo(this.collection, 'remove', (_context, cellLayer, opt = {}) => {
            this.onCellLayerRemove(cellLayer, opt);
        });

        this.listenTo(graph, 'add', (_context, cell, _, opt = {}) => {
            this.onCellAdd(cell, opt);
        });

        this.listenTo(graph, 'remove', (_context, cell, _, opt = {}) => {
            this.onCellRemove(cell, opt);
        });

        this.listenTo(graph, 'reset', (_context, { models: cells }, opt = {}) => {
            this.onGraphReset(cells, opt);
        });

        this.listenTo(graph, 'change', (_context, cell, opt = {}) => {
            this.onCellChange(cell, opt);
        });
    }

    resetCellLayers(cellLayers = [], opt = {}) {
        let defaultCellLayerId = opt.defaultCellLayer;

        if (!defaultCellLayerId) {
            defaultCellLayerId = DEFAULT_CELL_LAYER_ID;

            cellLayers.push({
                id: DEFAULT_CELL_LAYER_ID,
                type: 'LegacyCellLayer',
            });
        }

        if (!cellLayers.some(layer => layer.id === defaultCellLayerId)) {
            throw new Error(`dia.Graph: default cell layer with id '${defaultCellLayerId}' must be one of the defined cell layers.`);
        }

        this.defaultCellLayerId = defaultCellLayerId;

        const attributes = cellLayers.map(cellLayer => {
            if (cellLayer instanceof CellLayer) {
                return cellLayer.attributes;
            } else {
                return cellLayer;
            }
        });

        this.collection.reset(attributes, opt);
        this.graph.cellCollection.each(cell => {
            this.onCellAdd(cell, opt);
        });
    }

    onCellAdd(cell, opt) {
        const layerId = cell.layer() || this.defaultCellLayerId;
        const layer = this.getCellLayer(layerId);

        // add to the layer without triggering rendering update
        // when the cell is just added to the graph, it will be rendered normally by the paper
        layer.add(cell, { ...opt, initial: true });
    }

    onCellRemove(cell, opt) {
        const layerId = cell.layer() || this.defaultCellLayerId;

        if (this.hasCellLayer(layerId)) {
            const layer = this.getCellLayer(layerId);
            layer.remove(cell, opt);
        }
    }

    onCellChange(cell, opt) {
        if (!cell.hasChanged('layer')) return;

        let layerId = cell.get('layer');
        if (!layerId) {
            layerId = this.defaultCellLayerId;
        }
        const previousLayerId = cell.previous('layer') || this.defaultCellLayerId;

        if (previousLayerId === layerId) {
            return; // no change
        }

        const previousLayer = this.getCellLayer(previousLayerId);
        previousLayer.remove(cell, opt);

        const layer = this.getCellLayer(layerId);
        layer.add(cell, opt);
    }

    onGraphReset(cells, opt = {}) {
        const { collection } = this;

        collection.each(cellLayer => {
            cellLayer.reset([], opt);
        });

        cells.forEach(cell => {
            this.onCellAdd(cell, opt);
        });
    }

    onCellLayerRemove(cellLayer, opt) {
        cellLayer.cells.toArray().forEach(cell => {
            cell.remove(opt);
        });
    }

    getDefaultCellLayer() {
        return this.collection.get(this.defaultCellLayerId);
    }

    setDefaultCellLayer(layerId) {
        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        const layer = this.getCellLayer(layerId);
        this._changeDefaultLayer(layer);
    }

    _changeDefaultLayer(newDefaultLayer) {
        const newDefaultLayerId = newDefaultLayer.id;

        if (newDefaultLayerId === this.defaultCellLayerId) {
            return; // no change
        }

        if (this.hasCellLayer(this.defaultCellLayerId)) {
            const previousDefaultLayer = this.getCellLayer(this.defaultCellLayerId);
            // set new default layer for paper to use when inserting to the new default layer
            this.defaultCellLayerId = newDefaultLayerId;
            previousDefaultLayer.cells.toArray().forEach(cell => {
                if (cell.get('layer') == null) {
                    previousDefaultLayer.remove(cell);
                    newDefaultLayer.add(cell);
                }
            });
        } else {
            this.defaultCellLayerId = newDefaultLayerId;
        }
    }

    /**
     * Adds a new cell layer to the end of the layers collection
     */
    addCellLayer(cellLayer, opt) {
        const { collection } = this;

        collection.add(cellLayer, opt);
    }

    insertCellLayer(cellLayer, { insertBefore } = {}) {
        const id = cellLayer.id;

        // insert before itself is a no-op
        if (id === insertBefore) {
            return;
        }

        if (!this.hasCellLayer(id)) {
            throw new Error(`dia.Graph: Cell layer with id '${id}' does not exist.`);
        }

        const originalLayersArray = this.getCellLayers();
        let currentIndex = originalLayersArray.findIndex(layer => layer === cellLayer);
        if (currentIndex === originalLayersArray.length - 1 && !insertBefore) {
            return; // already at the end
        }

        // remove the layer from its current position
        this.collection.remove(id, { silent: true });

        // array after removal
        const layersArray = this.getCellLayers();
        let insertAt;
        if (!insertBefore) {
            if (currentIndex === originalLayersArray.length - 1) {
                return; // already at the end
            }
            insertAt = layersArray.length;
        } else {
            insertAt = layersArray.findIndex(layer => layer.id === insertBefore);
            if (insertAt === -1) {
                throw new Error(`dia.Graph: Cell layer with id '${insertBefore}' does not exist`);
            }
        }

        this.collection.add(cellLayer, { at: insertAt, silent: true });
        // trigger sort event manually since we are not using collection sorting workflow
        this.collection.trigger('sort', this.collection);
    }

    removeCellLayer(layerId, opt) {
        const { collection, defaultCellLayerId } = this;

        if (layerId === defaultCellLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        this.graph.startBatch('remove-cell-layer');

        collection.remove(layerId, opt);

        this.graph.stopBatch('remove-cell-layer');
    }

    minZIndex(layerId) {
        const { defaultCellLayerId } = this;

        layerId = layerId || defaultCellLayerId;

        const layer = this.getCellLayer(layerId);

        return layer.minZIndex();
    }

    maxZIndex(layerId) {
        const { defaultCellLayerId } = this;

        layerId = layerId || defaultCellLayerId;

        const layer = this.getCellLayer(layerId);

        return layer.maxZIndex();
    }

    hasCellLayer(layerId) {
        return this.collection.has(layerId);
    }

    getCellLayer(layerId) {
        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.collection.get(layerId);
    }

    getCellLayers() {
        return this.collection.toArray();
    }

    getCellLayerCells(layerId) {
        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.collection.get(layerId).cells.toArray();
    }

    getCells() {
        const cells = [];

        this.collection.each(cellLayer => {
            cells.push(...cellLayer.cells);
        });

        return cells;
    }
}
