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

    // Trigger events even if the model is in another collection.
    // Normally, all cells are part of the original Graph cellCollection,
    // this change allows cells to trigger 'add' and 'remove' events
    // when they are added/removed from a CellGroup.
    _onModelEvent(event, model) {
        if (model) {
            if (event === 'changeId') {
                var prevId = this.modelId(model.previousAttributes(), model.idAttribute);
                var id = this.modelId(model.attributes, model.idAttribute);
                if (prevId != null) delete this._byId[prevId];
                if (id != null) this._byId[id] = model;
            }
        }

        let prefix;
        if (event === 'add' || event === 'remove') {
            prefix = 'cells:';
        } else {
            prefix = 'cell:';
        }
        arguments[0] = prefix + event;
        this.trigger.apply(this, arguments);
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
    }

    initialize(attrs) {
        super.initialize(attrs);

        this.cells = new this.collectionConstructor();

        // Make all the events fired in the `cells` collection available.
        this.cells.on('all', function(eventName) {
            if (eventName === 'reset' || eventName === 'sort') {
                arguments[0] = 'cells:' + eventName;
            }
            this.trigger.apply(this, arguments);
        }, this);
    }

    add(cell, opt) {
        this.cells.add(cell, opt);
    }

    remove(cell, opt) {
        this.cells.remove(cell, opt);
    }

    reset(cells, opt) {
        if (cells == null) {
            cells = [];
        }
        this.cells.reset(cells, opt);
    }

    setEach(key, val, opt) {
        this.cells.toArray().forEach(cell => {
            cell.set(key, val, opt);
        });
    }
}
