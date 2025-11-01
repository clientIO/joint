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

    constructor(options) {
        super(options);

        // Make sure there are no arguments passed to the callbacks.
        // See the `mvc.Listener` documentation for more details.
        this.callbackArguments = [];

        const graph = options.graph;
        this.graph = graph;
        this.layerCollection = graph.layerCollection;

        // The default setup includes a single default layer.
        this.layerCollection.add({ id: DEFAULT_LAYER_ID }, { graph: graph.cid });
        this.defaultLayerId = DEFAULT_LAYER_ID;

        this.startListening();
    }

    startListening() {
        this.listenTo(this.layerCollection, 'layer:remove', this.onLayerRemove);
        // Listening to the collection instead of the graph itself
        // to avoid graph attribute change events
        this.listenTo(this.layerCollection, 'change', this.onCellChange);
    }

    onLayerRemove(layer, opt) {
        // When a layer is removed, also remove all its cells from the graph
        this.graph.removeCells(layer.getCells(), opt);
    }

    onCellChange(cell, opt) {
        if (!cell.hasChanged(config.layerAttribute)) return;
        this.layerCollection.moveCellBetweenLayers(cell, this._getLayerId(cell), {
            ...opt,
            graph: this.graph.cid
        });
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
                this.layerCollection.moveCellBetweenLayers(cell, newDefaultLayerId, {
                    ...options,
                    graph: this.graph.cid
                });
            });
        } else {
            this.defaultLayerId = newDefaultLayerId;
        }

        this.graph.trigger('layers:default:change', this.graph, this.defaultLayerId, options);
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
