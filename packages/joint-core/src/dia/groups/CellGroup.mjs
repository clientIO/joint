import { Model, Collection } from '../../mvc/index.mjs';

export class CellGroupCollection extends Collection {

    _prepareModel(attrs, _options) {
        if (this._isModel(attrs)) {
            // Do not change collection attribute of a cell model;
            // make sure that the cell will get the collection assigned
            // when it is added to the graph collection.
            // This makes sure that when the cell is removed or added
            // to the collection, events on dia.Graph will be triggered properly.
            return attrs;
        } else {
            throw new Error('CellGroupCollection only accepts Cell instances.');
        }
    }
}

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

    initialize(attrs) {
        super.initialize(attrs);

        this.cells = new this.collectionConstructor();

        // Make all the events fired in the `cells` collection available.
        this.cells.on('all', this.trigger, this);
    }

    add(cell, opt) {
        this.cells.add(cell, opt);
    }

    remove(cell, opt) {
        this.cells.remove(cell, opt);
    }

    reset(cells = [], opt) {
        this.cells.reset(cells, opt);
    }

    setEach(key, val, opt) {
        this.cells.toArray().forEach(cell => {
            cell.set(key, val, opt);
        });
    }
}

export const CELL_GROUP_MARKER = Symbol('joint.cellGroupMarker');

Object.defineProperty(CellGroup.prototype, CELL_GROUP_MARKER, {
    value: true,
});
