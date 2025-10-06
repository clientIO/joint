import { CellGroupCollection, CellGroup } from './CellGroup.mjs';

/**
 * @class CellLayerCollection
 * @description A CellLayerCollection is a collection of cells which supports sorting by z attribute.
 */
export class CellLayerCollection extends CellGroupCollection {

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }
}

/**
 * @class CellLayer
 * @description A CellLayer is a CellGroup with additional helper methods for z-index management.
 * The inner collection is sorted by z-index automatically.
 */
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

        this.cells.on('change', this.onCellChange, this);
    }

    onCellChange(cell, _opt) {
        if (!cell.hasChanged('z'))
            return;

        this.cells.sort();
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
