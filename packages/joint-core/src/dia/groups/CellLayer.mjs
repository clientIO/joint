import { CellGroupCollection, CellGroup } from './CellGroup.mjs';

export class CellLayerCollection extends CellGroupCollection {

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }
}

export class CellLayer extends CellGroup {

    defaults() {
        return {
            type: 'CellLayer',
            collectionConstructor: CellLayerCollection,
        };
    }

    initialize(attrs) {
        super.initialize(attrs);

        this.cells.on('cell:change:z', () => {
            this.cells.sort();
        });

        this.cells.on('cell:change:layer', (cell, layerId) => {
            // If the cell's layer id is changed, we need to remove it from this cell layer.
            if (layerId !== this.id) {
                this.cells.remove(cell);
            }
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
