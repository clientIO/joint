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

    _addReference: function(model, options) {
        Collection.prototype._addReference.apply(this, arguments);
        // If not in `dry` mode and the model does not have a graph reference yet,
        // set the reference.
        if (!options.dry && !model.graph) {
            model.graph = this.graph;
        }
    },

    _removeReference: function(model, options) {
        Collection.prototype._removeReference.apply(this, arguments);
        // If not in `dry` mode and the model has a reference to this exact graph,
        // remove the reference.
        if (!options.dry && model.graph === this.graph) {
            model.graph = null;
        }
    },
});
