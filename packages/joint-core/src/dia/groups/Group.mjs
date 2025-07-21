import { Model, Collection } from '../../mvc/index.mjs';

export class GroupCollection extends Collection {

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }
}

export class Group extends Model {

    defaults() {
        return {
            type: 'Group',
            hidden: false,
            locked: false,
        };
    }

    initialize(attrs) {
        super.initialize(attrs);

        this.cells = new GroupCollection();

        this.cells.on('change:z', (cell, _, opt) => {
            this.cells.sort();
        });

        this.cells.on('change:group', (cell, groupName) => {
            // If the cell's group id is changed, we need to remove it from this group.
            if (groupName !== this.name) {
                this.cells.remove(cell);
            }
        });

        // Make all the events fired in the `cells` collection available.
        // to the outside world.
        this.cells.on('all', this.trigger, this);
    }

    add(cell) {
        this.cells.add(cell);
    }

    remove(cell) {
        // unsets the layer making it default for the purpose of the DOM location
        cell.layer(null);
        this.cells.remove(cell);
    }

    reset() {
        this.cells.toArray().forEach(cell => {
            this.remove(cell);
        });
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
