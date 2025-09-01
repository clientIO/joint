import { Collection } from '../../mvc/Collection.mjs';
import { Listener } from '../../mvc/Listener.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';
import { cloneDeep } from '../../util/util.mjs';

const DEFAULT_CELL_LAYER_ID = 'cells';

export class CellLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;

        this.collection = new Collection();
        this.rootAttributes = this.processGraphCellLayersAttribute(this.graph.get('cellLayers'));
        this.graph.set('cellLayers', Array.from(this.rootAttributes), { cellLayersController: this });
        this.graph.trigger('layers:update', Array.from(this.rootAttributes));

        this.startListening();
    }

    startListening() {
        const { graph } = this;

        // make sure that `cellLayers` contains correct attributes
        this.listenTo(this.collection, 'change', (_context, cellLayer, opt) => {
            if (opt.cellLayersController) {
                return; // do not process changes triggered by this controllerf
            }

            const id = cellLayer.id;
            const cellLayerIndex = this.rootAttributes.findIndex(attrs => attrs.id === id);
            if (cellLayerIndex === -1) {
                return;
            }

            this.rootAttributes[cellLayerIndex] = cloneDeep(cellLayer.attributes);

            this.graph.set('cellLayers', Array.from(this.rootAttributes), { cellLayersController: this });
        });

        this.listenTo(graph, 'add', (_context, cell) => {
            this.onAdd(cell);
        });

        this.listenTo(graph, 'remove', (_context, cell) => {
            this.onRemove(cell);
        });

        this.graph.listenTo(graph, 'change:cellLayers', (_context, cellLayers, opt) => {
            if (opt.cellLayersController) {
                return; // do not process changes triggered by this controller
            }

            this.rootAttributes = this.processGraphCellLayersAttribute(cellLayers);
            this.graph.set('cellLayers', Array.from(this.rootAttributes), { cellLayersController: this });
            this.graph.trigger('layers:update', Array.from(this.rootAttributes));
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

    processGraphCellLayersAttribute(cellLayers = []) {
        const rootAttributes = Array.from(cellLayers);

        this._ensureDefaultLayer(rootAttributes);

        rootAttributes.forEach(attributes => {
            if (this.collection.has(attributes.id)) {
                this.collection.get(attributes.id).set(attributes, { cellLayersController: this });
            } else {
                const cellLayer = this.createCellLayer(attributes);
                this.collection.add(cellLayer);
            }
        });

        // remove layers that are no longer in the cellLayers attribute
        this.collection.each(cellLayer => {
            if (!rootAttributes.some(attrs => attrs.id === cellLayer.id)) {
                // move all cells to the default layer
                cellLayer.setEach('layer', null);
                this.collection.remove(cellLayer);
            }
        });
        return rootAttributes;
    }

    _ensureDefaultLayer(rootAttributes) {
        const defaultLayers = rootAttributes.filter(attrs => attrs.default === true);
        let newDefaultLayerId;

        if (defaultLayers.length > 1) {
            throw new Error('dia.Graph: Only one default cell layer can be defined.');
        }
        // if no default layer is defined, create one
        if (defaultLayers.length === 0) {
            rootAttributes.push({
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
            defaultLayer.unset('default', { silent: true });
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

        const { rootAttributes } = this;
        const defaultLayer = this.getDefaultCellLayer();
        rootAttributes.find(attrs => attrs.id === defaultLayer.id).default = false;
        defaultLayer.setEach('layer', defaultLayer.id, { silent: true });
        defaultLayer.unset('default', { silent: true });

        rootAttributes.find(attrs => attrs.id === layerId).default = true;
        const layer = this.getCellLayer(layerId);
        layer.set('default', true, { silent: true });
        this.defaultCellLayerId = layerId;

        // update the cellLayers attribute
        this.graph.set('cellLayers', Array.from(rootAttributes), { cellLayersController: this });
        this.graph.trigger('layers:update', Array.from(rootAttributes));
    }

    addCellLayer(cellLayer, _opt) {
        const { collection } = this;

        if (this.hasCellLayer(cellLayer.id)) {
            throw new Error(`dia.Graph: Layer with id '${cellLayer.id}' already exists.`);
        }

        collection.add(cellLayer);
    }

    insertCellLayer(cellLayer, insertBefore) {
        const id = cellLayer.id;

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
        this.graph.trigger('layers:update', Array.from(rootAttributes));
    }

    removeCellLayer(layerId, _opt) {
        const { collection, defaultCellLayerId } = this;

        if (layerId === defaultCellLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Layer with id '${layerId}' does not exist.`);
        }

        const layer = this.getCellLayer(layerId);
        // reset the layer to remove all cells from it
        layer.reset();

        collection.remove(layerId);

        // remove from the layers array
        if (this.rootAttributes.some(attrs => attrs.id === layerId)) {
            this.rootAttributes = this.rootAttributes.filter(l => l.id !== layerId);

            this.graph.set('cellLayers', Array.from(this.rootAttributes), { cellLayersController: this });
            this.graph.trigger('layers:update', Array.from(this.rootAttributes));
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

    getRootCellLayers() {
        return this.rootAttributes.map(attrs => {
            return this.collection.get(attrs.id);
        });
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
