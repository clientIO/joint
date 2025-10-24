import { Model, Collection } from '../../mvc/index.mjs';
import { CellGroupCollection } from '../collections/CellGroupCollection.mjs';

/**
 * @class CellGroup
 * @description A CellGroup is a model that contains a collection of cells.
 */
export class CellGroup extends Model {

    defaults() {
        return {
            type: 'CellGroup'
        };
    }

    preinitialize() {
        this.collectionConstructor = CellGroupCollection;
        // this allows for propagating events from the inner `cells` collection
        // without any prefix and therefore distinguish them from the events
        // fired by the CellGroup model itself.
        this.eventPrefix = 'self:';
    }

    initialize(attrs, options) {
        super.initialize(attrs);

        const collectionOptions = this.getCollectionOptions(attrs, options);

        this.cells = new this.collectionConstructor([], collectionOptions);

        // Make all the events fired in the `cells` collection available.
        this.cells.on('all', this.trigger, this);
    }

    /**
     * @protected
     */
    getCollectionOptions(_attrs, _options) {
        return {}
    }

    add(cell, opt) {
        return this.cells.add(cell, opt);
    }

    remove(cell, opt) {
        this.cells.remove(cell, opt);
    }

    reset(cells = [], opt) {
        return this.cells.reset(cells, opt);
    }
}

export const CELL_GROUP_MARKER = Symbol('joint.cellGroupMarker');

Object.defineProperty(CellGroup.prototype, CELL_GROUP_MARKER, {
    value: true,
});
