import { Model, Collection } from '../../mvc/index.mjs';

class LayerCells extends Collection {

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }
}

export class GraphLayer extends Model {

    defaults() {
        return {
            type: 'GraphLayer',
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

        cells.on('change:layer', (cell, layerName) => {
            // If the cell's layer is changed, we need to remove it from this layer.
            if (layerName !== this.name) {
                this.get('cells').remove(cell);
            }
        });

        // Make all the events fired in the `cells` collection available.
        // to the outside world.
        cells.on('all', this.trigger, this);
    }

    add(cell) {
        this.get('cells').add(cell);
    }

    remove(cell) {
        // unsets the layer making it default for the purpose of the DOM location
        cell.layer(null);
        this.get('cells').remove(cell);
    }

    reset() {
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
