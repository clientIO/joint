import { Collection } from '../../mvc/Collection.mjs';
import { Listener } from '../../mvc/Listener.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';

const DEFAULT_CELL_LAYER_ID = 'cells';

export class CellLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;

        this.cellLayerCollection = new Collection();
        this.cellLayerAttributes = this.processGraphCellLayersAttribute(this.graph.get('cellLayers'));

        this.startListening();
    }

    startListening() {
        const { graph } = this;

        // make sure that `cellLayers` contains correct attributes
        this.listenTo(this.cellLayerCollection, 'change', (_context, cellLayer, opt) => {
            const id = cellLayer.id;
            const cellLayerIndex = this.cellLayerAttributes.findIndex(attrs => attrs.id === id);
            this.cellLayerAttributes[cellLayerIndex] = cellLayer.attributes;

            this.graph.set('cellLayers', this.cellLayerAttributes, { controller: this });
        });

        this.listenTo(graph, 'add', (_context, cell) => {
            this.onAdd(cell);
        });

        this.listenTo(graph, 'remove', (_context, cell) => {
            this.onRemove(cell);
        });

        this.graph.listenTo(graph, 'change:cellLayers', (_context, cellLayers, opt) => {
            if (opt.controller) {
                return; // do not process changes triggered by this controller
            }

            this.cellLayersAttributes = this.processGraphCellLayersAttribute(cellLayers);
        });

        this.listenTo(graph, 'reset', (_context, { models: cells }) => {
            const { cellLayerCollection } = this;

            cellLayerCollection.each(cellLayer => {
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

    processGraphCellLayersAttribute(cellLayers = []) {
        const cellLayerAttributes = cellLayers;

        this._ensureDefaultLayer(cellLayerAttributes);

        cellLayerAttributes.forEach(attributes => {
            if (this.cellLayerCollection.has(attributes.id)) {
                this.cellLayerCollection.get(attributes.id).set(attributes);
            } else {
                const cellLayer = this.createCellLayer(attributes);
                this.cellLayerCollection.add(cellLayer);
            }
        });

        // remove layers that are no longer in the cellLayers attribute
        this.cellLayerCollection.each(cellLayer => {
            if (!cellLayerAttributes.some(attrs => attrs.id === cellLayer.id)) {
                // move all cells to the default layer
                cellLayer.setEach('layer', null);
                this.cellLayerCollection.remove(cellLayer);
            }
        });

        this.graph.set('cellLayers', cellLayerAttributes, { controller: this });
        this.graph.trigger('layers:update', cellLayerAttributes);
        return cellLayerAttributes;
    }

    _ensureDefaultLayer(cellLayerAttributes) {
        const defaultLayers = cellLayerAttributes.filter(attrs => attrs.default === true);
        let newDefaultLayerId;

        if (defaultLayers.length > 1) {
            throw new Error('dia.Graph: Only one default cell layer can be defined.');
        }
        // if no default layer is defined, create one
        if (defaultLayers.length === 0) {
            cellLayerAttributes.push({
                id: DEFAULT_CELL_LAYER_ID,
                default: true
            });
            newDefaultLayerId = DEFAULT_CELL_LAYER_ID;
        }
        if (defaultLayers.length === 1) {
            newDefaultLayerId = defaultLayers[0].id;
        }

        if (this.defaultCellLayerId && newDefaultLayerId !== this.defaultCellLayerId) {
            // If default layer has changed ensure the layer is set explicitly in the cell
            const defaultLayer = this.getDefaultCellLayer();
            defaultLayer.setEach('layer', defaultLayer.id, { silent: true });
            defaultLayer.unset('default');
        }
        this.defaultCellLayerId = newDefaultLayerId;
    }

    createCellLayer(attributes) {
        const cellLayer = new CellLayer(attributes);

        return cellLayer;
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
        return this.cellLayerCollection.get(this.defaultCellLayerId);
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

        const defaultLayer = this.getDefaultCellLayer();
        this.cellLayerAttributes.find(attrs => attrs.id === defaultLayer.id).default = false;
        defaultLayer.setEach('layer', defaultLayer.id, { silent: true });
        defaultLayer.unset('default');

        this.cellLayerAttributes.find(attrs => attrs.id === layerId).default = true;
        const layer = this.getCellLayer(layerId);
        layer.set('default', true);
        this.defaultCellLayerId = layerId;

        // update the cellLayers attribute
        this.graph.set('cellLayers', this.cellLayerAttributes, { controller: this });
        this.graph.trigger('layers:update', this.cellLayerAttributes);
    }

    addCellLayer(cellLayer, _opt) {
        const { cellLayerCollection } = this;

        if (this.hasCellLayer(cellLayer.id)) {
            throw new Error(`dia.Graph: Layer with id '${cellLayer.id}' already exists.`);
        }

        cellLayerCollection.add(cellLayer);
    }

    insertCellLayer(cellLayer, insertBefore) {
        const id = cellLayer.id;

        if (!this.hasCellLayer(id)) {
            throw new Error(`dia.Graph: Layer with id '${id}' does not exist.`);
        }

        let currentIndex = this.cellLayerAttributes.findIndex(attrs => attrs.id === id);
        if (currentIndex === -1) {
            currentIndex = null;
        }

        let attributes;
        if (currentIndex != null) {
            attributes = this.cellLayerAttributes[currentIndex];
        } else {
            attributes = cellLayer.attributes;
        }

        if (!insertBefore) {
            if (currentIndex != null) {
                this.cellLayerAttributes.splice(currentIndex, 1); // remove existing layer attributes
            }
            this.cellLayerAttributes.push(attributes);
        } else {
            let insertAt = this.cellLayerAttributes.findIndex(attrs => attrs.id === insertBefore);
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
                this.cellLayerAttributes.splice(currentIndex, 1); // remove existing layer attributes
            }

            this.cellLayerAttributes.splice(insertAt, 0, attributes);
        }

        this.graph.set('cellLayers', this.cellLayerAttributes, { controller: this });
        this.graph.trigger('layers:update', this.cellLayerAttributes);
    }

    removeCellLayer(layerId, _opt) {
        const { cellLayerCollection, defaultCellLayerId } = this;

        if (layerId === defaultCellLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Layer with id '${layerId}' does not exist.`);
        }

        const layer = this.getCellLayer(layerId);
        // reset the layer to remove all cells from it
        layer.reset();

        cellLayerCollection.remove(layerId);

        // remove from the layers array
        if (this.cellLayerAttributes.some(attrs => attrs.id === layerId)) {
            this.cellLayerAttributes = this.cellLayerAttributes.filter(l => l.id !== layerId);

            this.graph.set('cellLayers', this.cellLayerAttributes, { controller: this });
            this.graph.trigger('layers:update', this.cellLayerAttributes);
        }
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
        return this.cellLayerCollection.has(layerId);
    }

    getCellLayer(layerId) {
        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.cellLayerCollection.get(layerId);
    }

    getCellLayers() {
        return this.cellLayerCollection.toArray();
    }

    getRootCellLayers() {
        return this.cellLayerAttributes.map(attrs => {
            return this.cellLayerCollection.get(attrs.id);
        });
    }

    getCellLayerCells(layerId) {
        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.cellLayerCollection.get(layerId).cells.toArray();
    }

    getCells() {
        const cells = [];

        this.cellLayerCollection.each(cellLayer => {
            cells.push(...cellLayer.cells);
        });

        return cells;
    }
}
