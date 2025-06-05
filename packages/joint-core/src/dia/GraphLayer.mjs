import { Model, Collection } from '../mvc/index.mjs';

class LayerCells extends Collection {

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }
}

export class GraphLayer extends Model {

    defaults() {
        return {
            displayName: '',
            hidden: false,
            locked: false,
        };
    }

    initialize(attrs) {
        super.initialize(attrs);

        this.name = attrs.name;

        const cells = new LayerCells();
        this.set('cells', cells);

        cells.on('change:z', () => {
            cells.sort();
        });

        // Make all the events fired in the `cells` collection available.
        // to the outside world.
        cells.on('all', this.trigger, this);
    }

    add(cell) {
        cell.setLayer(this.name);
        this.get('cells').add(cell);
    }

    remove(cell) {
        cell.setLayer();
        this.get('cells').remove(cell);
    }

    clear() {
        this.get('cells').reset();
    }

    minZIndex() {
        const firstCell = this.get('cells').first();
        return firstCell ? (firstCell.get('z') || 0) : 0;
    }

    maxZIndex() {
        const lastCell = this.get('cells').last();
        return lastCell ? (lastCell.get('z') || 0) : 0;
    }
}
