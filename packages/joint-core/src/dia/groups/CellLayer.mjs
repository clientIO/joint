import { CellGroupCollection, CellGroup } from './CellGroup.mjs';
import * as util from '../../util/index.mjs';

/**
 * @class CellLayerCollection
 * @description A CellLayerCollection is a collection of cells which supports sorting by z attribute.
 */
export class CellLayerCollection extends CellGroupCollection {

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }

    // fast version for reset function
    // it does not clear the `_byId` map
    _removeReferenceFast(model) {
        if (this === model.collection) delete model.collection;
        model.off('all', this._onModelEvent, this);
    }

    // fast version for reset function
    // when we have references map passed from outside
    _addReferenceFast(model) {
        model.on('all', this._onModelEvent, this);
    }

    // This method overrides base mvc.Collection implementation
    // in a way that improves performance of resetting large collections.
    // For cell layers specifically, there is an option where we put references
    // from the main collection in order to improve performance when
    // there is only one layer
    reset(models, options) {
        options = options ? util.clone(options) : {};
        for (let i = 0; i < this.models.length; i++) {
            this._removeReferenceFast(this.models[i]);
        }
        options.previousModels = this.models;

        this._reset();
        options = util.assign({}, { add: true, remove: false, merge: false }, options);
        const sort = options.sort !== false;

        let model;
        // If we have references passed from outside, use them.
        // This is an optimization if we have only one layer in the graph.
        if (options.references) {
            this._byId = options.references;
            for (let i = 0; i < models.length; i++) {
                model = models[i];
                this.models.push(model);
                this._addReferenceFast(model, options);
            }
        } else {
            for (let i = 0; i < models.length; i++) {
                model = this._prepareModel(models[i], options);
                if (model) {
                    this.models.push(model);
                    this._addReference(model, options);
                }
            }
        }

        this.length = this.models.length;

        if (sort) {
            this.sort({ silent: true });
        }

        if (!options.silent) this.trigger('reset', this, options);

        return this.models;
    }
}

/**
 * @class CellLayer
 * @description A CellLayer is a CellGroup with additional helper methods for z-index management.
 * The inner collection is sorted by z-index automatically.
 */
export class CellLayer extends CellGroup {

    preinitialize() {
        super.preinitialize();
        this.collectionConstructor = CellLayerCollection;
    }

    defaults() {
        return {
            type: 'CellLayer',
        };
    }

    initialize(attrs) {
        super.initialize(attrs);

        this.cells.on('change', this.onCellChange, this);
    }

    onCellChange(cell, _opt) {
        if (!cell.hasChanged('z'))
            return;

        this.cells.sort();
    }

    minZIndex() {
        const firstCell = this.cells.first();
        return firstCell ? (firstCell.get('z') || 0) : 0;
    }

    maxZIndex() {
        const lastCell = this.cells.last();
        return lastCell ? (lastCell.get('z') || 0) : 0;
    }
}

export const CELL_LAYER_MARKER = Symbol('joint.cellLayerMarker');

Object.defineProperty(CellLayer.prototype, CELL_LAYER_MARKER, {
    value: true,
});
