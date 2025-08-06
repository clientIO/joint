import { Listener } from '../../mvc/Listener.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';

export class CellLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;

        this.defaultCellLayerId = 'cells';

        this.cellLayersMap = {};
        this.cellLayerAttributes = this.processGraphCellLayersAttribute(this.graph.get('cellLayers'));

        this.startListening();
    }

    startListening() {
        const { graph } = this;

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
            const { cellLayersMap } = this;

            for (let layerId in cellLayersMap) {
                cellLayersMap[layerId].reset();
            }

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

        const defaultLayers = cellLayerAttributes.filter(attrs => attrs.default === true);

        if (defaultLayers.length > 1) {
            throw new Error('dia.Graph: Only one default cell layer can be defined.');
        }
        // if no default layer is defined, create one
        if (defaultLayers.length === 0) {
            cellLayerAttributes.push({
                id: this.defaultCellLayerId,
                default: true
            });
        }
        if (defaultLayers.length === 1) {
            this.defaultCellLayerId = defaultLayers[0].id;
        }

        cellLayerAttributes.forEach(attributes => {
            const cellLayer = this.createCellLayer(attributes);
            this.cellLayersMap[attributes.id] = cellLayer;
        });

        this.graph.set('cellLayers', cellLayerAttributes, { controller: this });
        this.graph.trigger('layers:update', cellLayerAttributes);
        return cellLayerAttributes;
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
        return this.cellLayersMap[this.defaultCellLayerId];
    }

    setDefaultCellLayer(layerId) {
        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        if (layerId === this.defaultCellLayerId) {
            return; // no change
        }

        const defaultLayer = this.getDefaultCellLayer();
        defaultLayer.groupSet('layer', defaultLayer.id, { silent: true });

        this.cellLayerAttributes.find(attrs => attrs.id === defaultLayer.id).default = false;
        this.cellLayerAttributes.find(attrs => attrs.id === layerId).default = true;

        this.defaultCellLayerId = layerId;
        // update the cellLayers attribute
        this.graph.set('cellLayers', this.cellLayerAttributes, { controller: this });
        this.graph.trigger('layers:update', this.cellLayerAttributes);
    }

    addCellLayer(cellLayer, _opt) {
        const { cellLayersMap } = this;

        if (this.hasCellLayer(cellLayer.id)) {
            throw new Error(`dia.Graph: Layer with id '${cellLayer.id}' already exists.`);
        }

        cellLayersMap[cellLayer.id] = cellLayer;
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
            attributes = {
                id
            };
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
                this.cellLayerAttributes.splice(currentIndex, 1); // remove existing layer attributes
                if (currentIndex < insertAt) {
                    insertAt--;
                }
                // check if the resulting index is the same as the current index
                if (currentIndex === insertAt) {
                    return;
                }
            }

            this.cellLayerAttributes.splice(insertAt, 0, attributes);
        }

        this.graph.set('cellLayers', this.cellLayerAttributes, { controller: this });
        this.graph.trigger('layers:update', this.cellLayerAttributes);
    }

    removeCellLayer(layerId, _opt) {
        const { cellLayersMap, defaultCellLayerId } = this;

        if (layerId === defaultCellLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Layer with id '${layerId}' does not exist.`);
        }

        const layer = this.getCellLayer(layerId);
        // reset the layer to remove all cells from it
        layer.reset();

        delete cellLayersMap[layerId];

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
        return !!this.cellLayersMap[layerId];
    }

    getCellLayer(layerId) {
        if (!this.cellLayersMap[layerId]) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.cellLayersMap[layerId];
    }

    getCellLayers() {
        const cellLayers = [];

        for (let layerId in this.cellLayersMap) {
            cellLayers.push(this.cellLayersMap[layerId]);
        }

        return cellLayers;
    }

    getCellLayerCells(layerId) {
        return this.cellLayersMap[layerId].cells.toArray();
    }

    getCells() {
        const cells = [];

        for (let layerId in this.cellLayersMap) {
            cells.push(...this.cellLayersMap[layerId].cells);
        }

        return cells;
    }
}
