import { Listener } from '../../mvc/Listener.mjs';
import { config } from '../../config/index.mjs';
import { CELL_MARKER } from '../Cell.mjs';

const DEFAULT_CELL_LAYER_ID = 'cells';

/**
 * @class CellLayersController
 * @description A controller that manages cell layers in a dia.Graph.
 */
export class CellLayersController extends Listener {

    legacyMode = true;

    constructor(context) {
        super(context);

        // Make sure there are no arguments passed to the callbacks.
        // See the `mvc.Listener` documentation for more details.
        this.callbackArguments = [];

        this.graph = context.graph;
        this.layerCollection = this.graph.layerCollection;

        // Default setup
        this.addCellLayer({
            id: DEFAULT_CELL_LAYER_ID,
        });

        // By default, we are in legacy mode
        // Any new layers added will disable legacy mode
        this.legacyMode = true;

        this.defaultCellLayerId = DEFAULT_CELL_LAYER_ID;

        this.startListening();
    }

    startListening() {
        this.listenTo(this.layerCollection, 'reset', (collection, opt = {}) => {
            this.onCellLayersCollectionReset(collection, opt);
        });

        this.listenTo(this.layerCollection, 'remove', (cellLayer, opt = {}) => {
            this.onCellLayerRemove(cellLayer, opt);
        });

        this.listenTo(this.layerCollection, 'cell:change', (cell, opt = {}) => {
            this.onCellChange(cell, opt);
        });
    }

    onCellLayerRemove(cellLayer, opt) {
        // Remove all cells from the removed layer
        cellLayer.cellCollection.toArray().forEach(cell => {
            cell.remove(opt);
        });
    }

    resetCellLayers(cellLayers = [], opt = {}) {
        if (!Array.isArray(cellLayers) || cellLayers.length === 0) {
            throw new Error('dia.Graph: At least one cell layer must be defined.');
        }

        // Resetting cell layers disables legacy mode
        this.legacyMode = false;

        let defaultCellLayerId = opt.defaultCellLayer;

        if (!defaultCellLayerId) {
            defaultCellLayerId = cellLayers[0].id;
        }

        if (!cellLayers.some(layer => layer.id === defaultCellLayerId)) {
            throw new Error(`dia.Graph: default cell layer with id '${defaultCellLayerId}' must be one of the defined cell layers.`);
        }

        this.graph.startBatch('reset-layers', opt);
        if (this.defaultCellLayerId !== defaultCellLayerId) {
            this.defaultCellLayerId = defaultCellLayerId;
            this.graph.trigger('layers:default:change', this.graph, this.defaultCellLayerId, opt);
        }

        this.layerCollection.reset(cellLayers, { ...opt, cellLayersController: this });
        this.graph.stopBatch('reset-layers', opt);
    }

    onCellLayersCollectionReset(collection, opt) {
        const previousCellLayers = opt.previousModels;

        // Remove cells from the layers that have been removed
        previousCellLayers.forEach(previousLayer => {
            this.onCellLayerRemove(previousLayer, opt);
        });
    }

    onCellChange(cell, opt) {
        if (!cell.hasChanged(config.layerAttribute)) return;
        this.layerCollection.moveCellBetweenLayers(cell, this._getLayerId(cell), opt);
    }

    resetLayersCollections(cells, opt = {}) {
        const { layerCollection } = this;

        const layersMap = layerCollection.reduce((map, layer) => {
            map[layer.id] = [];
            return map;
        }, {});

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const layerId = this._getLayerId(cell);
            if (layerCollection.has(layerId)) {
                layersMap[layerId].push(cell);
            }
        }

        layerCollection.each(layer => {
            layer.cellCollection.reset(layersMap[layer.id], { ...opt, cellLayersController: this });
        });
    }

    getDefaultCellLayer() {
        return this.layerCollection.get(this.defaultCellLayerId);
    }

    setDefaultCellLayer(newDefaultLayerId, options = {}) {
        if (!this.hasCellLayer(newDefaultLayerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${newDefaultLayerId}' does not exist.`);
        }

        if (newDefaultLayerId === this.defaultCellLayerId) {
            return; // no change
        }

        if (this.hasCellLayer(this.defaultCellLayerId)) {
            const previousDefaultLayer = this.getCellLayer(this.defaultCellLayerId);
            const layerAttribute = config.layerAttribute;
            // Set the new default layer for future cell additions
            this.defaultCellLayerId = newDefaultLayerId;
            // Reassign any cells lacking an explicit layer to the new default layer
            previousDefaultLayer.cellCollection.toArray().forEach(cell => {
                if (cell.get(layerAttribute) != null) return;
                this.layerCollection.moveCellBetweenLayers(cell, newDefaultLayerId, options);
            });
        } else {
            this.defaultCellLayerId = newDefaultLayerId;
        }

        this.graph.trigger('layers:default:change', this.graph, this.defaultCellLayerId, options);
    }

    addCellLayer(cellLayer, { insertBefore } = {}) {
        const id = cellLayer.id;

        // insert before itself is a no-op
        if (id === insertBefore) {
            return;
        }

        // Adding a new layer disables legacy mode
        this.legacyMode = false;

        const originalLayersArray = this.getCellLayers();

        let currentIndex = null;
        if (this.hasCellLayer(id)) {
            currentIndex = originalLayersArray.findIndex(layer => layer === cellLayer);
            if (currentIndex === originalLayersArray.length - 1 && !insertBefore) {
                return; // already at the end
            }

            // Remove the layer from its current position
            this.layerCollection.remove(id, { silent: true, cellLayersController: this });
        }

        // The cell layers array after removing the layer (if it existed)
        const layersArray = this.getCellLayers();
        let insertAt;
        if (!insertBefore) {
            insertAt = layersArray.length;
        } else {
            insertAt = layersArray.findIndex(layer => layer.id === insertBefore);
            if (insertAt === -1) {
                throw new Error(`dia.Graph: Cell layer with id '${insertBefore}' does not exist`);
            }
        }

        if (currentIndex != null) {
            this.layerCollection.add(cellLayer, {
                at: insertAt,
                cellLayersController: this,
                silent: true
            });
            // Trigger `sort` event manually
            // since we are not using collection sorting workflow
            this.layerCollection.trigger('sort', this.layerCollection);
        } else {
            // Add to the collection and trigger an event
            // when new layer has been added
            this.layerCollection.add(cellLayer, {
                at: insertAt,
                cellLayersController: this
            });
        }
    }

    removeCellLayer(layerId, opt) {
        const { layerCollection, defaultCellLayerId } = this;

        if (layerId === defaultCellLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        this.graph.startBatch('remove-cell-layer');

        layerCollection.remove(layerId, { ...opt, cellLayersController: this });

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
        return this.layerCollection.has(layerId);
    }

    getCellLayer(layerId) {
        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.layerCollection.get(layerId);
    }

    getCellLayers() {
        return this.layerCollection.toArray();
    }

    getCell(id) {
        // TODO: should we create a map of cells for faster lookup?
        for (const layer of this.layerCollection.models) {
            const cell = layer.cellCollection.get(id);
            if (cell) {
                return cell;
            }
        }
        // Backward compatibility: return undefined if cell is not found
        return undefined;
    }

    getCells() {
        const layers = this.layerCollection.models;
        if (layers.length === 1) {
            // Single layer:
            // Fast path, just return the copy of the only layer's cells
            return layers[0].cellCollection.models.slice();
        }
        // Multiple layers:
        // Each layer has its models sorted already, so we can just concatenate
        // them in the order of layers.
        const cells = [];
        for (const layer of layers) {
            Array.prototype.push.apply(cells, layer.cellCollection.models);
        }
        return cells;
    }

    addCell(cellInit, opt = {}) {
        const layerId = this._getLayerId(cellInit);
        const layer = this.getCellLayer(layerId);

        layer.cellCollection.add(cellInit, { ...opt, cellLayersController: this });
    }

    resetCells(cells = [], opt = {}) {
        this.resetLayersCollections(cells, opt);
    }

    _getLayerId(cellInit) {
        // we don't use cell.layer() here because when the graph reference is not set on the cell
        // cell.layer() would return null
        const cellAttributes = cellInit[CELL_MARKER]
            ? cellInit.attributes
            : cellInit;
        return cellAttributes[config.layerAttribute] || this.defaultCellLayerId;
    }
}
