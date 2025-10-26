import { CellGroup } from './CellGroup.mjs';
import { CellLayerCollection } from '../collections/CellLayerCollection.mjs';

export const CELL_LAYER_MARKER = Symbol('joint.cellLayerMarker');

/**
 * @class CellLayer
 * @description A CellLayer is a CellGroup with additional helper methods for z-index management.
 * The inner collection is sorted by z-index automatically.
 */
export class CellLayer extends CellGroup {

    [CELL_LAYER_MARKER] = true;

    preinitialize() {
        super.preinitialize();
        this.collectionConstructor = CellLayerCollection;
    }

    defaults() {
        return {
            type: 'CellLayer',
        };
    }

    initialize(attrs, options) {
        super.initialize(attrs, options);

        this.cells.on('change', this.onCellChange, this);
    }

    getCollectionOptions(_attrs, options = {}) {
        return {
            layer: this,
            graph: options.graph,
            cellNamespace: options.cellNamespace,
        };
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
