import { Listener } from '../mvc/Listener.mjs';
import { config } from '../config/index.mjs';
import { CELL_MARKER } from './Cell.mjs';

const DEFAULT_CELL_LAYER_ID = 'cells';

/**
 * @class GraphLayersController
 * @description A controller that manages cell layers in a dia.Graph.
 */
export class GraphLayersController extends Listener {

    legacyMode = true;

    constructor(context) {
        super(context);

        // Make sure there are no arguments passed to the callbacks.
        // See the `mvc.Listener` documentation for more details.
        this.callbackArguments = [];

        this.graph = context.graph;
        this.layerCollection = this.graph.layerCollection;

        // Default setup
        this.addLayer({
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

    resetLayers(layers, opt = {}) {
        if (!Array.isArray(layers) || layers.length === 0) {
            throw new Error('dia.Graph: At least one cell layer must be defined.');
        }

        // Resetting cell layers disables legacy mode
        this.legacyMode = false;

        let defaultCellLayerId = opt.defaultCellLayer;
        if (!defaultCellLayerId) {
            defaultCellLayerId = layers[0].id;
        }

        if (!layers.some(layer => layer.id === defaultCellLayerId)) {
            throw new Error(`dia.Graph: default cell layer with id '${defaultCellLayerId}' must be one of the defined cell layers.`);
        }

        this.graph.startBatch('reset-layers', opt);
        if (this.defaultCellLayerId !== defaultCellLayerId) {
            this.defaultCellLayerId = defaultCellLayerId;
            this.graph.trigger('layers:default:change', this.graph, this.defaultCellLayerId, opt);
        }

        this.layerCollection.reset(layers, { ...opt, graph: this.graph.cid });
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
        this.moveCellBetweenLayers(cell, this._getLayerId(cell), opt);
    }

    resetCells(cells = [], opt = {}) {
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
            layer.cellCollection.reset(layersMap[layer.id], { ...opt, graph: this.graph.cid });
        });
    }

    getDefaultLayer() {
        return this.layerCollection.get(this.defaultCellLayerId);
    }

    setDefaultLayer(newDefaultLayerId, options = {}) {
        if (!this.hasLayer(newDefaultLayerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${newDefaultLayerId}' does not exist.`);
        }

        if (newDefaultLayerId === this.defaultCellLayerId) {
            return; // no change
        }

        if (this.hasLayer(this.defaultCellLayerId)) {
            const previousDefaultLayer = this.getLayer(this.defaultCellLayerId);
            const layerAttribute = config.layerAttribute;
            // Set the new default layer for future cell additions
            this.defaultCellLayerId = newDefaultLayerId;
            // Reassign any cells lacking an explicit layer to the new default layer
            previousDefaultLayer.cellCollection.each(cell => {
                if (cell.get(layerAttribute) != null) return;
                this.moveCellBetweenLayers(cell, newDefaultLayerId, options);
            });
        } else {
            this.defaultCellLayerId = newDefaultLayerId;
        }

        this.graph.trigger('layers:default:change', this.graph, this.defaultCellLayerId, options);
    }

    addLayer(cellLayer, { insertBefore } = {}) {
        const id = cellLayer.id;

        // insert before itself is a no-op
        if (id === insertBefore) {
            return;
        }

        // Adding a new layer disables legacy mode
        this.legacyMode = false;

        const originalLayersArray = this.getLayers();

        let currentIndex = null;
        if (this.hasLayer(id)) {
            currentIndex = originalLayersArray.findIndex(layer => layer === cellLayer);
            if (currentIndex === originalLayersArray.length - 1 && !insertBefore) {
                return; // already at the end
            }

            // Remove the layer from its current position
            this.layerCollection.remove(id, { silent: true, graph: this.graph.cid });
        }

        // The cell layers array after removing the layer (if it existed)
        const layersArray = this.getLayers();
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
                graph: this.graph.cid,
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
                graph: this.graph.cid
            });
        }
    }

    removeLayer(layerId, opt) {
        const { layerCollection, defaultCellLayerId } = this;

        if (layerId === defaultCellLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.hasLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        this.graph.startBatch('remove-cell-layer');

        layerCollection.remove(layerId, { ...opt, graph: this.graph.cid });

        this.graph.stopBatch('remove-cell-layer');
    }

    minZIndex(layerId = this.defaultCellLayerId) {
        const layer = this.getLayer(layerId);
        return layer.cellCollection.minZIndex();
    }

    maxZIndex(layerId = this.defaultCellLayerId) {
        const layer = this.getLayer(layerId);
        return layer.cellCollection.maxZIndex();
    }

    hasLayer(layerId) {
        return this.layerCollection.has(layerId);
    }

    getLayer(layerId) {
        if (!this.hasLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.layerCollection.get(layerId);
    }

    getLayers() {
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
        const layer = this.getLayer(layerId);

        layer.cellCollection.add(cellInit, { ...opt, graph: this.graph.cid });
    }

    /**
     * @public
     * @description Move a cell from its current layer to a target layer.
     */
    moveCellBetweenLayers(cell, targetLayerId, options = {}) {

        const sourceLayer = cell.collection?.layer;
        if (!sourceLayer) {
            throw new Error('dia.GraphLayersController: cannot move a cell that is not part of any layer.');
        }

        const targetLayer = this.layerCollection.get(targetLayerId);
        if (!targetLayer) {
            throw new Error(`dia.GraphLayersController: cannot move cell to layer '${targetLayerId}' because such layer does not exist.`);
        }

        if (sourceLayer === targetLayer) {
            // 1. The provided cell is already in the target layer
            // 2. Implicit default layer vs. explicit default (or vice versa)
            // No follow-up action needed
            return;
        }

        const moveOptions = {
            ...options,
            graph: this.graph.cid,
            fromLayer: sourceLayer.id,
            toLayer: targetLayer.id
        };
        // Move the cell between the two layer collections
        sourceLayer.cellCollection.remove(cell, moveOptions);
        targetLayer.cellCollection.add(cell, moveOptions);
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
