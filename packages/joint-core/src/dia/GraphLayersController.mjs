import { Listener } from '../mvc/Listener.mjs';
import { config } from '../config/index.mjs';
import { CELL_MARKER, CELL_COLLECTION_MARKER, GRAPH_LAYER_MARKER, GRAPH_LAYER_COLLECTION_MARKER } from './symbols.mjs';

/**
 * @class GraphLayersController
 * @description A controller that manages layers in a dia.Graph.
 */
export class GraphLayersController extends Listener {

    legacyMode = true;

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
        const { layerCollection } = this;
        // Forward events from the `layerCollection` on the graph instance.
        this.listenTo(layerCollection, 'all', this.forwardEvent);
        // Handle layer removal events
        this.listenTo(layerCollection, 'layer:remove', this.onLayerRemove);
        // Listening to the collection instead of the graph itself
        // to avoid graph attribute change events
        this.listenTo(layerCollection, 'change', this.onCellChange);
    }

    onLayerRemove(layer, opt) {
        // When a layer is removed, also remove all its cells from the graph
        this.graph.removeCells(layer.getCells(), opt);
    }

    onCellChange(cell, opt) {
        if (!cell.hasChanged(config.layerAttribute)) return;
        // Move the cell to the appropriate layer
        const targetLayerId = this.graph.getCellLayerId(cell);
        this.layerCollection.moveCellBetweenLayers(cell, targetLayerId, {
            ...opt,
            graph: this.graph.cid
        });
    }

    forwardEvent(_, model) {
        if (!model) return;

        if (model[CELL_MARKER]) {
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

    forwardCellEvent(eventName) {
        // Skip cell 'remove' events as they are handled on the graph level
        if (eventName === 'remove') {
            return;
        }
        // Skip if a `cell` is added to a different layer due to layer change
        if (eventName === 'add' && arguments[2]?.fromLayer) {
            return;
        }
        this.graph.trigger.apply(this.graph, arguments);
    }

    forwardCellCollectionEvent(eventName) {
        if (eventName === 'sort') {
            // Backwards compatibility:
            // Trigger 'sort' event for cell collection 'sort' events
            this.graph.trigger.apply(this.graph, arguments);
        }
        // Do not forward `layer:remove` or `layer:sort` events to the graph
    }

    forwardLayerCollectionEvent(eventName) {
        if (eventName === 'reset') return;
        // Forward layer collection events with `layers:` prefix.
        // For example `layers:reset` event when the layer collection is reset
        arguments[0] = 'layers:' + arguments[0];
        this.graph.trigger.apply(this.graph, arguments);
    }

}
