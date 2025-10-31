import { Collection } from '../mvc/index.mjs';
import { DEFAULT_GRAPH_LAYER_TYPE, GRAPH_LAYER_MARKER, GraphLayer } from './GraphLayer.mjs';
import { CELL_COLLECTION_MARKER } from './CellCollection.mjs';
import { CELL_MARKER } from './Cell.mjs';
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
    _onModelEvent(_eventName, model) {
        if (!model) return;

        if (model[CELL_MARKER]) {
            // Do not filter cell `add` and `remove` events
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

});

// Internal tag to identify this object as a graph layer collection instance.
// Used instead of `instanceof` for performance and cross-frame safety.

export const GRAPH_LAYER_COLLECTION_MARKER = Symbol('joint.graphLayerCollection');

Object.defineProperty(GraphLayerCollection.prototype, GRAPH_LAYER_COLLECTION_MARKER, {
    value: true,
});
