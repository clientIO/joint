import { CellGroupCollection, CellGroup } from './CellGroup.mjs';

export class CellLayerCollection extends CellGroupCollection {

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }
}

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

        this.cells.on('change', (cell) => {
            if (!cell.hasChanged('z')) return;
            this.cells.sort();
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

export const CELL_LAYER_MARKER = Symbol('joint.cellLayerMarker');

Object.defineProperty(CellLayer.prototype, CELL_LAYER_MARKER, {
    value: true,
});
