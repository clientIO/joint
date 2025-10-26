import { Collection } from '../../mvc/index.mjs';
import { CELL_LAYER_MARKER, CellLayer } from '../groups/CellLayer.mjs';
import { CELL_LAYER_COLLECTION_MARKER } from './CellLayerCollection.mjs';
import { CELL_MARKER } from '../Cell.mjs';
import * as util from '../../util/index.mjs';

/**
 * @class GraphCellLayers
 * @description A collection of cell layers used in dia.Graph. It facilitates creating cell layers from JSON using cellLayerNamespace.
 */
export const GraphCellLayers = Collection.extend({

    defaultCellLayerNamespace: {
        CellLayer: CellLayer
    },

    initialize: function(_models, opt = {}) {
        // Set the namespace where all cell layer classes are defined.
        const cellLayerNamespace = opt.cellLayerNamespace || {};
        this.cellLayerNamespace = util.defaultsDeep({}, cellLayerNamespace, this.defaultCellLayerNamespace);

        // Set the namespace where all cell classes are defined.
        if (opt.cellNamespace) {
            this.cellNamespace = opt.cellNamespace;
        } else {
            /* eslint-disable no-undef */
            this.cellNamespace = typeof joint !== 'undefined' && util.has(joint, 'shapes') ? joint.shapes : null;
            /* eslint-enable no-undef */
        }

        this.graph = opt.graph;
    },

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

    _prepareModel: function(attrs, options) {
        if (!attrs[CELL_LAYER_MARKER]) {
            const preparedAttributes = util.clone(attrs);
            const preparedOptions = util.clone(options);

            if (!preparedAttributes.type) {
                preparedAttributes.type = 'CellLayer';
            }

            preparedOptions.graph = this.graph;
            preparedOptions.cellNamespace = this.cellNamespace;

            return Collection.prototype._prepareModel.call(this, preparedAttributes, preparedOptions);
        }

        attrs.cells.graph = this.graph;
        attrs.cells.cellNamespace = this.cellNamespace;

        return Collection.prototype._prepareModel.apply(this, arguments);
    },

    // Do not propagate inner cell layer collection events.
    // Allow only for cell layer model events.
    _onModelEvent(_eventName, entity) {
        if (!entity) return;

        if (entity[CELL_LAYER_MARKER]) {
            this._onCellLayerEvent.apply(this, arguments);
            return;
        }

        if (entity[CELL_MARKER]) {
            this._onCellEvent.apply(this, arguments);
            return;
        }

        if (entity[CELL_LAYER_COLLECTION_MARKER]) {
            this._onCellLayerCollectionEvent.apply(this, arguments);
            return;
        }
    },

    _onCellLayerEvent(eventName, layer) {
        if ((eventName === layer.eventPrefix + 'add' || eventName === layer.eventPrefix + 'remove') && layer.collection !== this)
            return;

        if (eventName === 'changeId') {
            var prevId = this.modelId(layer.previousAttributes(), layer.idAttribute);
            var id = this.modelId(layer.attributes, layer.idAttribute);
            if (prevId != null) this._byId.delete(prevId);
            if (id != null) this._byId.set(id, layer);
        }

        arguments[0] = arguments[0].slice(layer.eventPrefix.length);

        this.trigger.apply(this, arguments);
    },

    _onCellEvent() {
        // retrigger cell events with `cell:` prefix
        arguments[0] = 'cell:' + arguments[0];

        this.trigger.apply(this, arguments);
    },

    _onCellLayerCollectionEvent() {
        // retrigger cell layer collection events with `layer:` prefix
        arguments[0] = 'layer:' + arguments[0];

        this.trigger.apply(this, arguments);
    },

    reset(models = [], options = {}) {
        if (!options.cellLayersController && !options.silent) {
            throw new Error('dia.GraphCellLayers: resetting collection directly is not supported, use graph.resetCellLayers() method instead.');
        }
        return Collection.prototype.reset.call(this, models, options);
    },

    add(models, options = {}) {
        if (!options.cellLayersController && !options.silent) {
            throw new Error('dia.GraphCellLayers: adding cell layers directly to the collection is not supported, use graph.addCellLayer() method instead.');
        }
        return Collection.prototype.add.call(this, models, options);
    },

    remove(models, options = {}) {
        if (!options.cellLayersController && !options.silent) {
            throw new Error('dia.GraphCellLayers: removing cell layers directly from the collection is not supported, use graph.removeCellLayer() method instead.');
        }
        return Collection.prototype.remove.call(this, models, options);
    },

    _
});
