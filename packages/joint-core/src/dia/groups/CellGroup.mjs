import { Model } from '../../mvc/index.mjs';
import { CellGroupCollection } from '../collections/CellGroupCollection.mjs';

export const CELL_GROUP_MARKER = Symbol('joint.cellGroupMarker');

/**
 * @class CellGroup
 * @description A CellGroup is a model that contains a collection of cells.
 */
export class CellGroup extends Model {

    [CELL_GROUP_MARKER] = true;

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
     * Returns the options to be passed to the inner `cells` collection constructor.
     */
    getCollectionOptions(_attrs, _options) {
        return {};
    }
}
