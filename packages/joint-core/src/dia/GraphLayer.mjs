import { Model } from '../mvc/index.mjs';
import { CellLayerCollection } from './CellCollection.mjs';

export const GRAPH_LAYER_MARKER = Symbol('joint.graphLayerMarker');

/**
 * @class GraphLayer
 * @description A GraphLayer is a model representing a single layer in a dia.Graph.
 */
export class GraphLayer extends Model {

    [GRAPH_LAYER_MARKER] = true;

    preinitialize() {
        // This allows for propagating events from the inner `cellCollection` collection
        // without any prefix and therefore distinguish them from the events
        // fired by the CellGroup model itself.
        this.eventPrefix = 'self:';
    }

    defaults() {
        return {
            type: 'GraphLayer',
        };
    }

    initialize(attrs, options = {}) {
        super.initialize(attrs, options);

        this.cellCollection = new CellLayerCollection([], {
            layer: this,
            graph: options.graph,
            cellNamespace: options.cellNamespace,
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

    minZIndex() {
        const firstCell = this.cellCollection.first();
        return firstCell ? (firstCell.get('z') || 0) : 0;
    }

    maxZIndex() {
        const lastCell = this.cellCollection.last();
        return lastCell ? (lastCell.get('z') || 0) : 0;
    }
}
