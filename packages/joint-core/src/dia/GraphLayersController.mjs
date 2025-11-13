import { Listener } from '../mvc/Listener.mjs';
import { config } from '../config/index.mjs';
import { CELL_MARKER, CELL_COLLECTION_MARKER, GRAPH_LAYER_MARKER, GRAPH_LAYER_COLLECTION_MARKER } from './symbols.mjs';

/**
 * @class GraphLayersController
 * @description Coordinates interactions between the graph and its layers.
 * Automatically moves cells between layers when the layer attribute changes.
 */
export class GraphLayersController extends Listener {

    constructor(options) {
        super(options);

        // Make sure there are no arguments passed to the callbacks.
        // See the `mvc.Listener` documentation for more details.
        this.callbackArguments = [];

        const graph = options.graph;
        if (!graph) {
            throw new Error('GraphLayersController: "graph" option is required.');
        }

        this.graph = graph;
        this.layerCollection = graph.layerCollection;

        this.startListening();
    }

    startListening() {
        // Handle all events from the layer collection and its inner cell collections.
        this.listenTo(this.layerCollection, 'all', this.onLayerCollectionEvent);
    }

    /**
     * @description When a cell changes its layer attribute,
     * move the cell to the target layer.
     */
    onCellChange(cell, options) {
        if (!cell.hasChanged(config.layerAttribute)) return;
        // Move the cell to the appropriate layer
        const targetLayerId = this.graph.getCellLayerId(cell);
        this.layerCollection.moveCellBetweenLayers(cell, targetLayerId, options);
    }

    /**
     * @description When a cell is removed from a layer,
     * also remove its embeds and connected links from the graph.
     * Note: an embedded cell might come from a different layer,
     * so we can not use the layer's cell collection to remove it.
     */
    onCellRemove(cell, options) {
        // If the cell is being moved from one layer to another,
        // no further action is needed.
        if (options.fromLayer) return;

        // When replacing a cell, we do not want to remove its embeds or
        // unembed it from its parent.
        if (options.replace) return;

        // First, unembed this cell from its parent cell if there is one.
        const parentCell = cell.getParentCell();
        if (parentCell) {
            parentCell.unembed(cell, options);
        }

        // Remove also all the cells, which were embedded into this cell
        const embeddedCells = cell.getEmbeddedCells();
        for (let i = 0, n = embeddedCells.length; i < n; i++) {
            const embed = embeddedCells[i];
            if (embed) {
                this.layerCollection.removeCell(embed, options);
            }
        }

        // When not clearing the whole graph or replacing the cell,
        // we don't want to remove the connected links.
        if (!options.clear) {

            // Applications might provide a `disconnectLinks` option set to `true` in order to
            // disconnect links when a cell is removed rather then removing them. The default
            // is to remove all the associated links.
            if (options.disconnectLinks) {
                this.graph.disconnectLinks(cell, options);
            } else {
                this.graph.removeLinks(cell, options);
            }
        }
    }

    onLayerCollectionEvent(eventName, model) {
        if (!model) return;

        if (model[CELL_MARKER]) {
            // First handle cell-specific cases that require custom processing,
            // then forward the event to the graph.
            // For example, when a cell is removed from a layer, its embeds and
            // connected links must be removed as well. Listeners on the graph
            // should receive removal notifications in the following order:
            // embeds → links → cell.
            switch (eventName) {
                case 'change': /* ('change', cell, options) */
                    this.onCellChange.call(this, model, arguments[2]);
                    break;
                case 'remove': /* ('remove', cell, collection, options) */
                    // When a cell is removed from a layer,
                    // ensure it is also removed from the graph.
                    this.onCellRemove.call(this, model, arguments[3]);
                    break;
            }
            // Notify the graph about cell events.
            this.forwardCellEvent.apply(this, arguments);
            return;
        }

        if (model[CELL_COLLECTION_MARKER]) {
            this.forwardCellCollectionEvent.apply(this, arguments);
            return;
        }

        if (model[GRAPH_LAYER_MARKER]) {
            this.forwardLayerEvent.apply(this, arguments);
            return;
        }

        if (model[GRAPH_LAYER_COLLECTION_MARKER]) {
            this.forwardLayerCollectionEvent.apply(this, arguments);
            return;
        }
    }

    forwardLayerEvent() {
        // Note: the layer event prefix is `layer:`
        this.graph.trigger.apply(this.graph, arguments);
    }

    forwardCellEvent(eventName, cell) {
        // Moving a cell from one layer to another is an internal operation
        // that should not be exposed at the graph level.
        // The single `move` event is triggered instead.
        if ((eventName === 'remove' || eventName === 'add') && arguments[3]?.fromLayer) return;

        this.graph.trigger.apply(this.graph, arguments);
    }

    forwardCellCollectionEvent(eventName) {
        // Do not forward `layer:remove` or `layer:sort` events to the graph
        if (eventName !== 'sort') return;
        // Backwards compatibility:
        // Trigger 'sort' event for cell collection 'sort' events
        this.graph.trigger.apply(this.graph, arguments);
    }

    forwardLayerCollectionEvent(eventName) {
        if (eventName === 'reset') {
            // Currently, there is no need to forward `layers:reset` event.
            // The graph `fromJSON()` triggers a single `reset` event after
            // resetting cells, layers and attributes.
            return;
        }
        // Forward layer collection events with `layers:` prefix.
        // For example `layers:reset` event when the layer collection is reset
        arguments[0] = 'layers:' + arguments[0];
        this.graph.trigger.apply(this.graph, arguments);
    }
}
