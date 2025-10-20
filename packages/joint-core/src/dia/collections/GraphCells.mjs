import { Collection } from '../../mvc/Collection.mjs';
import * as util from '../../util/index.mjs';

/**
 * @class GraphCells
 * @description A collection of cells used in dia.Graph. It facilitates creating cell models from JSON using cellNamespace
 * and stores a reference to the graph when the cell model has been added.
 */
export const GraphCells = Collection.extend({

    initialize: function(models, opt) {

        // Set the optional namespace where all model classes are defined.
        if (opt.cellNamespace) {
            this.cellNamespace = opt.cellNamespace;
        } else {
            /* eslint-disable no-undef */
            this.cellNamespace = typeof joint !== 'undefined' && util.has(joint, 'shapes') ? joint.shapes : null;
            /* eslint-enable no-undef */
        }

        this.graph = opt.graph;
    },

    // Overriding the default `model` method to create cell models
    // based on their `type` attribute and the `cellNamespace` option.
    model: function(attrs, opt) {

        const collection = opt.collection;
        const namespace = collection.cellNamespace;
        const { type } = attrs;

        // Find the model class based on the `type` attribute in the cell namespace
        const ModelClass = util.getByPath(namespace, type, '.');
        if (!ModelClass) {
            throw new Error(`dia.Graph: Could not find cell constructor for type: '${type}'. Make sure to add the constructor to 'cellNamespace'.`);
        }

        return new ModelClass(attrs, opt);
    },

    // Override Collection's _addReference
    // to set the graph reference on the model.
    _addReference: function(model, options) {
        Collection.prototype._addReference.apply(this, arguments);
        // If not in `dry` mode and the model does not have a graph reference yet,
        // set the reference.
        if (!options.dry && !model.graph) {
            model.graph = this.graph;
        }
    },

    // Override Collection's _removeReference
    // to remove the graph reference from the model.
    _removeReference: function(model, options) {
        Collection.prototype._removeReference.apply(this, arguments);
        // If not in `dry` mode and the model has a reference to this exact graph,
        // remove the reference.
        if (!options.dry && model.graph === this.graph) {
            model.graph = null;
        }
    },

    // fast version of _removeReference for reset method.
    // It does not clear the `_byId` map because it is cleared as part of the reset.
    // TODO: move "fast" logic to the `mvc.Collection` in later versions.
    _removeReferenceFast: function(model, options) {
        if (this === model.collection) delete model.collection;
        model.off('all', this._onModelEvent, this);

        // If not in `dry` mode and the model has a reference to this exact graph,
        // remove the reference.
        if (!options.dry && model.graph === this.graph) {
            model.graph = null;
        }
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
        options = options ? util.clone(options) : {};
        for (let i = 0; i < this.models.length; i++) {
            this._removeReferenceFast(this.models[i], options);
        }
        options.previousModels = this.models;

        this._reset();

        options = util.assign({}, { add: true, remove: false, merge: false }, options);

        // Turn bare objects into model references, and prevent invalid models
        // from being added.
        let model;
        for (let i = 0; i < models.length; i++) {
            model = this._prepareModel(models[i], options);
            if (model) {
                this.models.push(model);
                this._addReference(model, options);
            }
        }

        this.length = this.models.length;

        if (!options.silent) this.trigger('reset', this, options);

        return this.models;
    },
});
