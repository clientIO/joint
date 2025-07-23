import { Model, Collection } from '../../mvc/index.mjs';

export class CellGroupCollection extends Collection {

    _prepareModel(attrs, _options) {
        if (this._isModel(attrs)) {
            // do not change collection attribute of a cell model
            return attrs;
        } else {
            throw new Error('CellGroupCollection only accepts Cell instances.');
        }
    }

    _onModelEvent(event, model, collection, options) {
        if (model) {
            if ((event === 'add' || event === 'remove') && collection !== this) return;
            if (event === 'changeId') {
                var prevId = this.modelId(model.previousAttributes(), model.idAttribute);
                var id = this.modelId(model.attributes, model.idAttribute);
                if (prevId != null) delete this._byId[prevId];
                if (id != null) this._byId[id] = model;
            }
        }
        arguments[0] = 'cell:' + event;
        //retrigger model events with the `cell:` prefix
        this.trigger.apply(this, arguments);
    }
}

export class CellGroup extends Model {

    defaults() {
        return {
            type: 'CellGroup',
            collectionConstructor: CellGroupCollection,
        };
    }

    initialize(attrs) {
        super.initialize(attrs);

        this.cells = new this.attributes.collectionConstructor();

        // Make all the events fired in the `cells` collection available.
        // to the outside world.
        this.cells.on('all', this.trigger, this);
    }

    add(cell) {
        this.cells.add(cell);
    }

    remove(cell) {
        this.cells.remove(cell);
    }

    reset() {
        this.cells.toArray().forEach(cell => {
            this.remove(cell);
        });
    }
}
