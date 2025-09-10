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
            default: true,
            type: 'CellLayer',
        });

        this.startListening();
    }

    startListening() {
        const { graph } = this;

        // if a new layer is added and it is marked as default,
        // change the default layer
        this.listenTo(this.collection, 'layer:add', (_context, cellLayer) => {
            if (cellLayer.get('default') === true) {
                this._changeDefaultLayer(cellLayer);
            }
        });

        // remove all cells from this layer when the layer is removed from the graph
        this.listenTo(this.collection, 'layer:remove', (_context, cellLayer, opt) => {
            cellLayer.cells.toArray().forEach(cell => {
                cell.remove(opt);
            });
        });

        this.listenTo(graph, 'add', (_context, cell) => {
            this.onAdd(cell);
        });

        this.listenTo(graph, 'remove', (_context, cell) => {
            this.onRemove(cell);
        });

        this.listenTo(graph, 'reset', (_context, { models: cells }) => {
            const { collection } = this;

            collection.each(cellLayer => {
                cellLayer.reset();
            });

            cells.forEach(cell => {
                this.onAdd(cell, true);
            });
        });

        this.listenTo(graph, 'change:layer', (_context, cell, layerId, opt) => {
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
        });
    }

    resetCellLayers(cellLayers = [], opt = {}) {
        const attributes = cellLayers.map(cellLayer => {
            if (cellLayer instanceof CellLayer) {
                return cellLayer.attributes;
            } else {
                return cellLayer;
            }
        });

        this._ensureDefaultLayer(attributes);
        this.defaultCellLayerId = attributes.find(attrs => attrs.default === true).id;

        this.collection.reset(attributes, opt);
        this.graph.cellCollection.each(cell => {
            this.onAdd(cell);
        });
    }

    _ensureDefaultLayer(attributes) {
        const defaultLayers = attributes.filter(attrs => attrs.default === true);

        if (defaultLayers.length > 1) {
            throw new Error('dia.Graph: Only one default cell layer can be defined.');
        }
        // if no default layer is defined, create one
        if (defaultLayers.length === 0) {
            attributes.push({
                id: DEFAULT_CELL_LAYER_ID,
                default: true,
                type: 'CellLayer',
            });
        }
    }

    onAdd(cell, reset = false) {
        const layerId = cell.layer() || this.defaultCellLayerId;
        const layer = this.getCellLayer(layerId);

        // compatibility
        // in the version before groups, z-index was not set on reset
        if (!reset) {
            if (!cell.has('z')) {
                cell.set('z', layer.maxZIndex() + 1);
            }
        }

        // add to the layer without triggering rendering update
        // when the cell is just added to the graph, it will be rendered normally by the paper
        layer.add(cell, { initial: true });
    }

    onRemove(cell) {
        const layerId = cell.layer() || this.defaultCellLayerId;

        if (this.hasCellLayer(layerId)) {
            const layer = this.getCellLayer(layerId);
            layer.remove(cell);
        }
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
        layer.set('default', true, { cellLayersController: this });
    }

    _changeDefaultLayer(newDefaultLayer) {
        if (newDefaultLayer.id === this.defaultCellLayerId) {
            return; // no change
        }

        if (this.hasCellLayer(this.defaultCellLayerId)) {
            const previousDefaultLayer = this.getCellLayer(this.defaultCellLayerId);
            previousDefaultLayer.unset('default', { cellLayersController: this });
            // set new default layer for paper to use when inserting to the new default layer
            this.defaultCellLayerId = newDefaultLayer.id;
            previousDefaultLayer.cells.toArray().forEach(cell => {
                if (cell.get('layer') == null) {
                    previousDefaultLayer.remove(cell);
                    newDefaultLayer.add(cell);
                }
            });
        } else {
            this.defaultCellLayerId = newDefaultLayer.id;
        }
    }

    addCellLayer(cellLayer, _opt) {
        const { collection } = this;

        collection.add(cellLayer);
    }

    insertCellLayer(cellLayer, insertBefore) {
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
        this.collection.trigger('sort', this.collection.toArray());
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
