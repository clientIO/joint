import { CellGroup } from './CellGroup.mjs';
import { CellLayerCollection } from '../collections/CellLayerCollection.mjs';

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

    add(cell, opt = {}) {
        if (!opt.cellLayersController) {
            throw new Error('dia.CellLayer: adding cells directly to a CellLayer is not supported. Please use cell.layer() method to control the layer assignment.');
        }

        return super.add(cell, opt);
    }

    remove(cell, opt = {}) {
        if (!opt.cellLayersController) {
            throw new Error('dia.CellLayer: removing cells directly from a CellLayer is not supported. Please use cell.layer() method to control the layer assignment.');
        }

        return super.remove(cell, opt);
    }

    reset(cells = [], opt = {}) {
        if (!opt.cellLayersController) {
            throw new Error('dia.CellLayer: resetting cells directly is not supported. Please use graph.resetCellLayers() to reset cell layers.');
        }

        return super.reset(cells, opt);
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

export const CELL_LAYER_MARKER = Symbol('joint.cellLayerMarker');

Object.defineProperty(CellLayer.prototype, CELL_LAYER_MARKER, {
    value: true,
});
