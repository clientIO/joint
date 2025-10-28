import * as util from '../util/index.mjs';
import { Collection } from '../mvc/Collection.mjs';
import { CELL_MARKER } from './Cell.mjs';

export const CELL_COLLECTION_MARKER = Symbol('joint.cellCollectionMarker');

/**
 * @class CellCollection
 * @description A CellCollection is a collection of cells which supports z-index management.
 * Additionally, it facilitates creating cell models from JSON using cellNamespace
 * and stores a reference to the graph when the cell model has been added.
 */
export class CellCollection extends Collection {

    [CELL_COLLECTION_MARKER] = true;

    initialize(_models, opt) {
        this.cellNamespace = opt.cellNamespace;
        this.graph = opt.graph;
        this.layer = opt.layer;
    }

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel(model) {
        return Boolean(model[CELL_MARKER]);
    }

    // Overriding the default `model` method to create cell models
    // based on their `type` attribute and the `cellNamespace` option.
    model(attrs, opt) {

        const namespace = this.cellNamespace;
        const { type } = attrs;

        // Find the model class based on the `type` attribute in the cell namespace
        const ModelClass = util.getByPath(namespace, type, '.');
        if (!ModelClass) {
            throw new Error(`dia.Graph: Could not find cell constructor for type: '${type}'. Make sure to add the constructor to 'cellNamespace'.`);
        }

        return new ModelClass(attrs, opt);
    }

    // Override to set graph reference
    _addReference(model, options) {
        super._addReference(model, options);
        // If not in `dry` mode and the model does not have a graph reference yet,
        // set the reference.
        if (!options.dry && !model.graph) {
            model.graph = this.graph;
        }
    }

    // Override to remove graph reference
    _removeReference(model, options) {
        super._removeReference(model, options);
        // If not in `dry` mode and the model has a reference to this exact graph,
        // remove the reference.
        if (!options.dry && model.graph === this.graph) {
            model.graph = null;
        }
    }

    // remove graph reference additionally
    _removeReferenceFast(model, options) {
        if (!options.dry) {
            // If not in `dry` mode and the model has a reference
            // to this exact graph/collection, remove the reference.
            if (this === model.collection) {
                delete model.collection;
            }
            if (this.graph === model.graph) {
                model.graph = null;
            }
        }

        model.off('all', this._onModelEvent, this);
    }

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }

    // This method overrides base mvc.Collection implementation
    // in a way that improves performance of resetting large collections.
    // For layers specifically, there is an option where we put references
    // from the main collection in order to improve performance when
    // there is only one layer
    reset(models, options) {
        options = util.assign({}, { add: true, remove: false, merge: false }, options);

        for (let i = 0; i < this.models.length; i++) {
            this._removeReferenceFast(this.models[i], options);
        }
        options.previousModels = this.models;
        this._reset();

        for (let i = 0; i < models.length; i++) {
            const model = this._prepareModel(models[i], options);
            if (model) {
                this.models.push(model);
                this._addReference(model, options);
            }
        }

        this.length = this.models.length;

        const sort = this.comparator && options.sort !== false;

        if (sort) {
            this.sort({ silent: true });
        }

        if (!options.silent) {
            this.trigger('reset', this, options);
        }

        return this.models;
    }

    minZIndex() {
        return (this.first()?.get('z') || 0);
    }

    maxZIndex() {
        return (this.last()?.get('z') || 0);
    }
}
