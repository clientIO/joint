import { Collection } from '../mvc/index.mjs';
import { GRAPH_LAYER_MARKER, GraphLayer } from './GraphLayer.mjs';
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

    /**
     * @override
     * @description Overrides the default `_prepareModel` method
     * to set `cellNamespace` and `graph` references on the created layers.
     */
    _prepareModel: function(attrs, options) {
        if (!attrs[GRAPH_LAYER_MARKER]) {
            // Add a mandatory `type` attribute if missing
            let preparedAttributes;
            if (!attrs.type) {
                preparedAttributes = util.clone(attrs);
                // TODO: no hard-coded type
                preparedAttributes.type = 'GraphLayer';
            } else {
                preparedAttributes = attrs;
            }

            const preparedOptions = util.clone(options);
            preparedOptions.graph = this.graph;
            preparedOptions.cellNamespace = this.cellNamespace;

            return Collection.prototype._prepareModel.call(this, preparedAttributes, preparedOptions);
        }
        // `attrs` is already a GraphLayer instance
        attrs.cellCollection.graph = this.graph;
        attrs.graph = this.graph;
        attrs.cellCollection.cellNamespace = this.cellNamespace;

        return Collection.prototype._prepareModel.apply(this, arguments);
    },

    /**
     * @override
     * @description Overrides the default `_onModelEvent` method
     * to distinguish between events coming from different model types.
     */
    _onModelEvent(_eventName, model) {
        if (!model) return;

        if (model[GRAPH_LAYER_MARKER]) {
            this._onLayerEvent.apply(this, arguments);
            return;
        }

        if (model[CELL_MARKER]) {
            this._onCellEvent.apply(this, arguments);
            return;
        }

        if (model[CELL_COLLECTION_MARKER]) {
            this._onCellCollectionEvent.apply(this, arguments);
            return;
        }
    },

    _onLayerEvent(eventName, layer) {
        const layerEventPrefix = layer.eventPrefix;
        if (
            layer.collection !== this &&
            (eventName === layerEventPrefix + 'add' || eventName === layerEventPrefix + 'remove')
        ) {
            return;
        }

        // Layer was changed
        if (eventName === 'changeId') {
            const prevId = this.modelId(layer.previousAttributes(), layer.idAttribute);
            const id = this.modelId(layer.attributes, layer.idAttribute);
            if (prevId != null) this._byId.delete(prevId);
            if (id != null) this._byId.set(id, layer);
        }

        // `self:` prefix
        // forward layer model events without prefix
        arguments[0] = arguments[0].slice(layerEventPrefix.length);

        this.trigger.apply(this, arguments);
    },

    _onCellEvent() {
        // forward cell events with `cell:` prefix
        arguments[0] = 'cell:' + arguments[0];

        this.trigger.apply(this, arguments);
    },

    _onCellCollectionEvent() {
        // forward layer collection events with `layer:` prefix
        arguments[0] = 'layer:' + arguments[0];

        this.trigger.apply(this, arguments);
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
