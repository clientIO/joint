import { Model } from '../mvc/index.mjs';
import { CellCollection } from './CellCollection.mjs';
import { GRAPH_LAYER_MARKER } from './symbols.mjs';

export const DEFAULT_GRAPH_LAYER_TYPE = 'GraphLayer';

/**
 * @class GraphLayer
 * @description A GraphLayer is a model representing a single layer in a dia.Graph.
 */
export class GraphLayer extends Model {

    [GRAPH_LAYER_MARKER] = true;

    preinitialize() {
        // This allows for propagating events from the inner `cellCollection` collection
        // without any prefix and therefore distinguish them from the events
        // fired by the GraphLayer model itself.
        this.eventPrefix = 'layer:';
    }

    defaults() {
        return {
            type: DEFAULT_GRAPH_LAYER_TYPE
        };
    }

    initialize(attrs, options = {}) {
        super.initialize(attrs, options);

        this.cellCollection = new CellCollection([], {
            layer: this
        });

        // Forward all events from the inner `cellCollection` collection
        this.cellCollection.on('all', this.trigger, this);
        // Listen to cell changes to manage z-index sorting
        this.cellCollection.on('change', this.onCellChange, this);
    }

    onCellChange(cell, opt) {
        if (opt.sort === false || !cell.hasChanged('z')) return;
        this.cellCollection.sort();
    }

    /**
     * @public
     * @description Returns all cells in this layer.
     */
    getCells() {
        return this.cellCollection.toArray();
    }
}
