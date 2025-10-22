import { Collection } from '../../mvc/Collection.mjs';
import * as util from '../../util/util.mjs';
import { CELL_MARKER } from '../Cell.mjs';

/**
 * @class CellGroupCollection
 * @description A CellGroupCollection is a collection of cells used in CellGroup.
 * Supports fast reset functionality.
 */
export class CellGroupCollection extends Collection {

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel(model) {
        return Boolean(model[CELL_MARKER]);
    }

    modelId(attrs, idAttribute) {
	    return attrs[idAttribute || 'id'];
	}

    // fast version for reset function
    // it does not clear the `_byId` map
    _removeReferenceFast(model) {
        if (this === model.collection) delete model.collection;
        model.off('all', this._onModelEvent, this);
    }

    // This method overrides base mvc.Collection implementation
    // in a way that improves performance of resetting large collections.
    // For cell layers specifically, there is an option where we put references
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
}

export const CELL_GROUP_COLLECTION_MARKER = Symbol('joint.cellGroupCollectionMarker');

Object.defineProperty(CellGroupCollection.prototype, CELL_GROUP_COLLECTION_MARKER, {
    value: true,
});
