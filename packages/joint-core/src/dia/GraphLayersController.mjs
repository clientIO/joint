import { Listener } from '../mvc/Listener.mjs';
import { config } from '../config/index.mjs';
import { CELL_MARKER } from './Cell.mjs';

const DEFAULT_LAYER_ID = 'cells';

/**
 * @class GraphLayersController
 * @description A controller that manages layers in a dia.Graph.
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
        this.insertLayer({
            id: DEFAULT_LAYER_ID,
        });

        // By default, we are in legacy mode
        // Any new layers added will disable legacy mode
        this.legacyMode = true;

        this.defaultLayerId = DEFAULT_LAYER_ID;

        this.startListening();
    }

    startListening() {
        this.listenTo(this.layerCollection, 'layer:remove', this.onLayerRemove, this);
        // Listening to the collection instead of the graph itself
        // to avoid graph attribute change events
        this.listenTo(this.layerCollection, 'change', this.onCellChange, this);
    }

    onLayerRemove(layer, opt) {
        // When a layer is removed, also remove all its cells from the graph
        this.clearLayer(layer, opt);
    }

    /**
     * @description Removes all cells from the specified layer.
     */
    clearLayer(layer, opt) {
        const cells = layer.cellCollection.models; // This is a live array
        while (cells.length > 0) {
            cells[0].remove(opt);
        }
    }

    resetLayers(layers, opt = {}) {
        if (!Array.isArray(layers) || layers.length === 0) {
            throw new Error('dia.Graph: At least one layer must be defined.');
        }

        // Resetting layers disables legacy mode
        this.legacyMode = false;

        const { defaultLayer: defaultLayerId = layers[0].id } = opt;

        if (!layers.some(layer => layer.id === defaultLayerId)) {
            throw new Error(`dia.Graph: default layer with id '${defaultLayerId}' must be one of the defined layers.`);
        }

        this.defaultLayerId = defaultLayerId;
        this.layerCollection.reset(layers, { ...opt, graph: this.graph.cid });
    }

    onCellChange(cell, opt) {
        if (!cell.hasChanged(config.layerAttribute)) return;
        this.layerCollection.moveCellBetweenLayers(cell, this._getLayerId(cell), opt);
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
        return this.layerCollection.get(this.defaultLayerId);
    }

    setDefaultLayer(newDefaultLayerId, options = {}) {
        if (!this.graph.hasLayer(newDefaultLayerId)) {
            throw new Error(`dia.Graph: Layer with id '${newDefaultLayerId}' does not exist.`);
        }

        if (newDefaultLayerId === this.defaultLayerId) {
            return; // no change
        }

        if (this.graph.hasLayer(this.defaultLayerId)) {
            const previousDefaultLayer = this.graph.getLayer(this.defaultLayerId);
            const layerAttribute = config.layerAttribute;
            // Set the new default layer for future cell additions
            this.defaultLayerId = newDefaultLayerId;
            // Reassign any cells lacking an explicit layer to the new default layer
            previousDefaultLayer.cellCollection.each(cell => {
                if (cell.get(layerAttribute) != null) return;
                this.layerCollection.moveCellBetweenLayers(cell, newDefaultLayerId, options);
            });
        } else {
            this.defaultLayerId = newDefaultLayerId;
        }

        this.graph.trigger('layers:default:change', this.graph, this.defaultLayerId, options);
    }

    insertLayer(layer, before = null, opt = {}) {
        const id = layer.id;

        // Adding a new layer disables legacy mode
        this.legacyMode = false;

        // insert before itself is a no-op
        if (id === before) {
            return;
        }

        if (before && !this.graph.hasLayer(before)) {
            throw new Error(`dia.Graph: Layer with id '${before}' does not exist`);
        }

        const originalLayersArray = this.graph.getLayers();

        let currentIndex = null;
        if (this.graph.hasLayer(id)) {
            currentIndex = originalLayersArray.findIndex(l => l === layer);
            if (currentIndex === originalLayersArray.length - 1 && !before) {
                return; // already at the end
            }

            // Remove the layer from its current position
            this.layerCollection.remove(id, { silent: true, graph: this.graph.cid });
        }

        // The layers array after removing the layer (if it existed)
        const layersArray = this.graph.getLayers();
        let insertAt;
        if (!before) {
            insertAt = layersArray.length;
        } else {
            insertAt = layersArray.findIndex(layer => layer.id === before);
        }

        if (currentIndex != null) {
            this.layerCollection.add(layer, {
                at: insertAt,
                graph: this.graph.cid,
                silent: true
            });
            // Trigger `sort` event manually
            // since we are not using collection sorting workflow
            this.layerCollection.trigger('sort', this.layerCollection, opt);
        } else {
            // Add to the collection and trigger an event
            // when new layer has been added
            this.layerCollection.add(layer, {
                ...opt,
                at: insertAt,
                graph: this.graph.cid
            });
        }
    }

    removeLayer(layerId, opt) {
        const { layerCollection, defaultLayerId } = this;

        if (layerId === defaultLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.graph.hasLayer(layerId)) {
            throw new Error(`dia.Graph: Layer with id '${layerId}' does not exist.`);
        }

        this.graph.startBatch('remove-layer');

        layerCollection.remove(layerId, { ...opt, graph: this.graph.cid });

        this.graph.stopBatch('remove-layer');
    }

    addCell(cellInit, opt = {}) {
        const layerId = this._getLayerId(cellInit);
        const layer = this.graph.getLayer(layerId);

        layer.cellCollection.add(cellInit, { ...opt, graph: this.graph.cid });
    }



    _getLayerId(cellInit) {
        // we don't use cell.layer() here because when the graph reference is not set on the cell
        // cell.layer() would return null
        const cellAttributes = cellInit[CELL_MARKER]
            ? cellInit.attributes
            : cellInit;
        return cellAttributes[config.layerAttribute] || this.defaultLayerId;
    }
}
