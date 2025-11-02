import { Collection } from '../mvc/index.mjs';
import { DEFAULT_GRAPH_LAYER_TYPE, GraphLayer } from './GraphLayer.mjs';
import { CELL_MARKER, GRAPH_LAYER_MARKER, GRAPH_LAYER_COLLECTION_MARKER } from './symbols.mjs';
import * as util from '../util/index.mjs';

/**
 * @class GraphLayerCollection
 * @description A collection of layers used in dia.Graph. It facilitates creating layers from JSON using layerNamespace.
 */
export const GraphLayerCollection = Collection.extend({

    defaultLayerNamespace: {
        GraphLayer
    },

    /**
     * @override
     * @description Initializes the collection and sets up the layer and cell namespaces.
     */
    initialize: function(_models, options = {}) {
        const { layerNamespace, cellNamespace, graph } = options;

        // Initialize the namespace that holds all available layer classes.
        // Custom namespaces are merged with the default ones.
        this.layerNamespace = util.assign({}, this.defaultLayerNamespace, layerNamespace);

        // Initialize the namespace for all cell model classes, if provided.
        if (cellNamespace) {
            this.cellNamespace = cellNamespace;
        } else {
            /* eslint-disable no-undef */
            this.cellNamespace = typeof joint !== 'undefined' && util.has(joint, 'shapes') ? joint.shapes : null;
            /* eslint-enable no-undef */
        }

        this.graph = graph;
    },

    /**
     * @override
     * @description Overrides the default `model` method
     * to create layer models based on their `type` attribute.
     */
    model: function(attrs, opt) {

        const collection = opt.collection;
        const namespace = collection.layerNamespace;
        const { type } = attrs;

        // Find the model class based on the `type` attribute in the cell namespace
        const GraphLayerClass = util.getByPath(namespace, type, '.');
        if (!GraphLayerClass) {
            throw new Error(`dia.Graph: Could not find layer constructor for type: '${type}'. Make sure to add the constructor to 'layerNamespace'.`);
        }

        return new GraphLayerClass(attrs, opt);
    },

    // Override to set graph reference
    _addReference(layer, options) {
        Collection.prototype._addReference.call(this, layer, options);

        // assign graph and cellNamespace references
        // to the added layer
        layer.graph = this.graph;
        layer.cellCollection.cellNamespace = this.cellNamespace;
    },

    // Override to remove graph reference
    _removeReference(layer, options) {
        Collection.prototype._removeReference.call(this, layer, options);

        // remove graph and cellNamespace references
        // from the removed layer
        layer.graph = null;
        layer.cellCollection.cellNamespace = null;
    },

    /**
     * @override
     * @description Overrides the default `_prepareModel` method
     * to set default layer type if missing.
     */
    _prepareModel: function(attrs, options) {
        if (!attrs[GRAPH_LAYER_MARKER]) {
            // Add a mandatory `type` attribute if missing
            if (!attrs.type) {
                const preparedAttributes = util.clone(attrs);
                preparedAttributes.type = DEFAULT_GRAPH_LAYER_TYPE;
                arguments[0] = preparedAttributes;
            }
        }

        return Collection.prototype._prepareModel.apply(this, arguments);
    },

    /**
     * @override
     * @description Add an assertion to prevent direct resetting of the collection.
     */
    reset(models, options) {
        this._assertInternalCall(options);
        return Collection.prototype.reset.apply(this, arguments);
    },

    /**
     * @override
     * @description Add an assertion to prevent direct addition of layers.
     */
    add(models, options) {
        this._assertInternalCall(options);
        return Collection.prototype.add.apply(this, arguments);
    },

    /**
     * @override
     * @description Add an assertion to prevent direct removal of layers.
     */
    remove(models, options){
        this._assertInternalCall(options);
        return Collection.prototype.remove.apply(this, arguments);
    },

    /**
     * @override
     * @description Overrides the default `_onModelEvent` method
     * to distinguish between events coming from different model types.
     */
    _onModelEvent(_, model) {
        if (model && model[CELL_MARKER]) {
            // Do not filter cell `add` and `remove` events
            // See `mvc.Collection` for more details
            this.trigger.apply(this, arguments);
            return;
        }

        // For other events, use the default behavior
        Collection.prototype._onModelEvent.apply(this, arguments);
    },

    /**
     * @protected
     * @description Asserts that the collection manipulation
     * is done via internal graph methods. Otherwise, it throws an error.
     * This is a temporary measure until layers API is stabilized.
     */
    _assertInternalCall(options) {
        if (options && !options.graph && !options.silent) {
            throw new Error('dia.GraphLayerCollection: direct manipulation of the collection is not supported, use graph methods instead.');
        }
    },

    /**
     * @public
     * @description Inserts a layer before another layer or at the end if `beforeLayerId` is null.
     */
    insert(layerInit, beforeLayerId = null, options = {}) {

        const id = layerInit.id;
        if (id === beforeLayerId) {
            // Inserting before itself is a no-op
            return;
        }

        if (beforeLayerId && !this.has(beforeLayerId)) {
            throw new Error(`dia.GraphLayerCollection: Layer "${beforeLayerId}" does not exist`);
        }

        // See if the layer is already in the collection
        let currentIndex = -1;
        if (this.has(id)) {
            currentIndex = this.findIndex(l => l.id === id);
            if ((currentIndex === this.length - 1) && !beforeLayerId) {
                // The layer is already at the end
                return;
            }
            // Remove the layer from its current position
            this.remove(id, { silent: true });
        }

        // At what index to insert the layer?
        let insertAt;
        if (!beforeLayerId) {
            insertAt = this.length;
        } else {
            insertAt = this.findIndex(l => l.id === beforeLayerId);
        }

        if (currentIndex !== -1) {
            // Re-insert the layer at the new position.
            this.add(layerInit, {
                at: insertAt,
                silent: true
            });
            // Trigger `sort` event manually
            // since we are not using collection sorting workflow
            this.trigger('sort', this, options);
        } else {
            // Add to the collection and trigger an event
            // when new layer has been added
            this.add(layerInit, {
                ...options,
                at: insertAt,
            });
        }
    },

    /**
     * @public
     * @description Finds and returns a cell by its id from all layers.
     */
    getCell(cellRef) {
        // TODO: should we create a map of cells for faster lookup?
        for (const layer of this.models) {
            const cell = layer.cellCollection.get(cellRef);
            if (cell) {
                return cell;
            }
        }
        // Backward compatibility: return undefined if cell is not found
        return undefined;
    },

    /**
     * @public
     * @description Returns all cells in all layers in the correct order.
     */
    getCells() {
        const layers = this.models;
        if (layers.length === 1) {
            // Single layer:
            // Fast path, just return the copy of the only layer's cells
            return layers[0].getCells();
        }
        // Multiple layers:
        // Each layer has its models sorted already, so we can just concatenate
        // them in the order of layers.
        const cells = [];
        for (const layer of layers) {
            Array.prototype.push.apply(cells, layer.cellCollection.models);
        }
        return cells;
    },

    /**
     * @public
     * @description Removes a cell from its current layer.
     */
    removeCell(cell, options = {}) {
        const cellCollection = cell.collection?.layer?.cellCollection;
        if (!cellCollection) return;
        cellCollection.remove(cell, options);
    },

    /**
     * @public
     * @description Move a cell from its current layer to a target layer.
     */
    moveCellBetweenLayers(cell, targetLayerId, options = {}) {

        const sourceLayer = cell.collection?.layer;
        if (!sourceLayer) {
            throw new Error('dia.GraphLayerCollection: cannot move a cell that is not part of any layer.');
        }

        const targetLayer = this.get(targetLayerId);
        if (!targetLayer) {
            throw new Error(`dia.GraphLayerCollection: cannot move cell to layer '${targetLayerId}' because such layer does not exist.`);
        }

        if (sourceLayer === targetLayer) {
            // 1. The provided cell is already in the target layer
            // 2. Implicit default layer vs. explicit default (or vice versa)
            // No follow-up action needed
            return;
        }

        const moveOptions = {
            ...options,
            fromLayer: sourceLayer.id,
            toLayer: targetLayer.id
        };
        // Move the cell between the two layer collections
        sourceLayer.cellCollection.remove(cell, moveOptions);
        targetLayer.cellCollection.add(cell, moveOptions);
        // Trigger a single `move` event to ease distinguishing layer moves
        // from add/remove operations
        cell.trigger('move', cell, moveOptions);
    },

    /**
     * @public
     * @description Adds a cell to the specified layer.
     */
    addCellToLayer(cell, layerId, options = {}) {
        const targetLayer = this.get(layerId);
        if (!targetLayer) {
            throw new Error(`dia.GraphLayerCollection: layer "${layerId}" does not exist.`);
        }

        const addOptions = {
            ...options,
            toLayer: targetLayer.id
        };
        // Add the cell to the target layer collection
        targetLayer.cellCollection.add(cell, addOptions);
    }

});

Object.defineProperty(GraphLayerCollection.prototype, GRAPH_LAYER_COLLECTION_MARKER, {
    value: true,
});
