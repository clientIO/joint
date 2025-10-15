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

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset(models, options) {
        options = options ? util.clone(options) : {};
        for (var i = 0; i < this.models.length; i++) {
            this._removeReference(this.models[i], options);
        }
        options.previousModels = this.models;
        this._reset();
        models = this.addWithReset(models, options);
        if (!options.silent) this.trigger('reset', this, options);
        return models;
    }

    // Add a model, or list of models to the set. `models` may be
    // Models or raw JavaScript objects to be converted to Models, or any
    // combination of the two.
    addWithReset(models, options) {
        if (models == null) return;

        options = util.assign({}, { add: true, remove: false, merge: false }, options);

        const sort = options.sort !== false;
        // Turn bare objects into model references, and prevent invalid models
        // from being added.
        let model, i;
        for (i = 0; i < models.length; i++) {
            model = this._prepareModel(models[i], options);
            if (model) {
                this.models.push(model);
                this._addReference(model, options);
            }
        }

        this.length = this.models.length;

        if (sort) this.sort({ silent: true });


        return this.models
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
