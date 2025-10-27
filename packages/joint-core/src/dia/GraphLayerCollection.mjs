import { Collection } from '../mvc/index.mjs';
import { GRAPH_LAYER_MARKER, GraphLayer } from './GraphLayer.mjs';
import { CELL_COLLECTION_MARKER } from './CellCollection.mjs';
import { CELL_MARKER } from './Cell.mjs';
import * as util from '../util/index.mjs';

/**
 * @class GraphLayerCollection
 * @description A collection of cell layers used in dia.Graph. It facilitates creating cell layers from JSON using cellLayerNamespace.
 */
export const GraphLayerCollection = Collection.extend({

    defaultCellLayerNamespace: {
        GraphLayer
    },

    /**
     * @override
     * @description Initializes the collection and sets up the cell layer and cell namespaces.
     */
    initialize: function(_models, opt = {}) {
        const { cellLayerNamespace, cellNamespace } = opt;

        // Initialize the namespace that holds all available cell layer classes.
        // Custom namespaces are merged with the default ones.
        this.cellLayerNamespace = util.assign({}, this.defaultCellLayerNamespace, cellLayerNamespace);

        // Initialize the namespace for all cell model classes, if provided.
        if (cellNamespace) {
            this.cellNamespace = cellNamespace;
        } else {
            /* eslint-disable no-undef */
            this.cellNamespace = typeof joint !== 'undefined' && util.has(joint, 'shapes') ? joint.shapes : null;
            /* eslint-enable no-undef */
        }

        this.graph = opt.graph;
    },

    /**
     * @override
     * @description Overrides the default `model` method
     * to create cell layer models based on their `type` attribute.
     */
    model: function(attrs, opt) {

        const collection = opt.collection;
        const namespace = collection.cellLayerNamespace;
        const { type } = attrs;

        // Find the model class based on the `type` attribute in the cell namespace
        const CellLayerClass = util.getByPath(namespace, type, '.');
        if (!CellLayerClass) {
            throw new Error(`dia.Graph: Could not find cell layer constructor for type: '${type}'. Make sure to add the constructor to 'cellLayerNamespace'.`);
        }

        return new CellLayerClass(attrs, opt);
    },

    /**
     * @override
     * @description Overrides the default `_prepareModel` method
     * to set `cellNamespace` and `graph` references on the created cell layers.
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
        // `attrs` is already a CellLayer instance
        attrs.cellCollection.graph = this.graph;
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
            this._onCellLayerEvent.apply(this, arguments);
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

    _onCellLayerEvent(eventName, layer) {
        if (
            layer.collection !== this &&
            (eventName === layer.eventPrefix + 'add' || eventName === layer.eventPrefix + 'remove')
        ) {
            return;
        }

        if (eventName === 'changeId') {
            var prevId = this.modelId(layer.previousAttributes(), layer.idAttribute);
            var id = this.modelId(layer.attributes, layer.idAttribute);
            if (prevId != null) this._byId.delete(prevId);
            if (id != null) this._byId.set(id, layer);
        }

        // TODO: write why
        // Self: events
        arguments[0] = arguments[0].slice(layer.eventPrefix.length);

        this.trigger.apply(this, arguments);
    },

    _onCellEvent() {
        // forward cell events with `cell:` prefix
        arguments[0] = 'cell:' + arguments[0];

        this.trigger.apply(this, arguments);
    },

    _onCellCollectionEvent() {
        // forward cell layer collection events with `layer:` prefix
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
     * This is a temporary measure until cell layers API is stabilized.
     */
    _assertInternalCall(options) {
        if (options && !options.cellLayersController && !options.silent) {
            throw new Error('dia.GraphLayerCollection: direct manipulation of the collection is not supported, use graph methods instead.');
        }
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
            cellLayersController: this.graph.layersController,
            fromLayer: sourceLayer.id,
            toLayer: targetLayer.id
        };
        // Move the cell between the two layer collections
        sourceLayer.cellCollection.remove(cell, moveOptions);
        targetLayer.cellCollection.add(cell, moveOptions);
    },
});
