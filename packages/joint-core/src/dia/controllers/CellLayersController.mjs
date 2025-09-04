import { Listener } from '../../mvc/Listener.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';

const DEFAULT_CELL_LAYER_ID = 'cells';

export class CellLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;
        this.collection = this.graph.cellLayersCollection;

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

        this.listenTo(this.collection, 'add', (_context, cellLayer) => {
            this.onCellLayerAdd(cellLayer);
        });

        this.listenTo(this.collection, 'reset', (_context, { models: cellLayers }) => {
            this.defaultCellLayerId = cellLayers.find(layer => layer.get('default') === true).id;

            cellLayers.forEach(cellLayer => {
                this.onCellLayerAdd(cellLayer);
            });
        });

        /*this.listenTo(this.collection, 'change:default', (_context, cellLayer, isDefault, opt) => {

        });*/

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

    resetCellLayers(cellLayers = []) {
        const attributes = cellLayers.map(cellLayer => {
            if (cellLayer instanceof CellLayer) {
                return cellLayer.attributes;
            } else {
                return cellLayer;
            }
        });

        this._ensureDefaultLayer(attributes);
        this.collection.reset(attributes);
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
            this.defaultCellLayerId = DEFAULT_CELL_LAYER_ID;
        }
    }

    onCellLayerAdd(cellLayer) {
        if (!cellLayer.has('z')) {
            const lastLayer = this.collection.last();
            const lastZ = lastLayer ? (lastLayer.get('z') || 0) : 0;
            cellLayer.set('z', lastZ + 1, { cellLayersController: this });
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

        if (layerId === this.defaultCellLayerId) {
            return; // no change
        }

        if (!this.defaultCellLayerId) {
            // should not happen
            return;
        }

        const layer = this.getCellLayer(layerId);
        layer.set('default', true, { cellLayersController: this });
        this.defaultCellLayerId = layerId;
    }

    addCellLayer(cellLayer, _opt) {
        const { collection } = this;

        collection.add(cellLayer);
    }

    insertCellLayer(cellLayer, insertBefore) {
        /*const id = cellLayer.id;

        if (!this.hasCellLayer(id)) {
            throw new Error(`dia.Graph: Layer with id '${id}' does not exist.`);
        }

        const { rootAttributes } = this;

        let currentIndex = rootAttributes.findIndex(attrs => attrs.id === id);
        if (currentIndex === -1) {
            currentIndex = null;
        }

        let attributes;
        if (currentIndex != null) {
            attributes = rootAttributes[currentIndex];
        } else {
            attributes = cellLayer.attributes;
        }

        if (!insertBefore) {
            if (currentIndex != null) {
                rootAttributes.splice(currentIndex, 1); // remove existing layer attributes
            }
            rootAttributes.push(attributes);
        } else {
            let insertAt = rootAttributes.findIndex(attrs => attrs.id === insertBefore);
            if (insertAt === -1) {
                throw new Error(`dia.Graph: Layer with id '${insertBefore}' is not inserted before.`);
            }
            if (id === insertBefore) {
                return;
            }
            if (currentIndex != null) {
                if (currentIndex < insertAt) {
                    insertAt--;
                }
                // check if the resulting index is the same as the current index
                if (currentIndex === insertAt) {
                    return;
                }
                rootAttributes.splice(currentIndex, 1); // remove existing layer attributes
            }

            rootAttributes.splice(insertAt, 0, attributes);
        }

        this.graph.set('cellLayers', Array.from(rootAttributes), { cellLayersController: this });
        this.graph.trigger('layers:update', Array.from(rootAttributes));*/
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
