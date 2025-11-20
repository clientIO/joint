import { isEmpty } from '../util/index.mjs';
import { Listener } from '../mvc/Listener.mjs';

/**
 * @class GraphTopologyIndex
 * @description Maintains an index of the graph topology (adjacency list)
 * for fast graph queries.
 */
export class GraphTopologyIndex extends Listener {

    constructor(options) {
        super(options);

        // Make sure there are no arguments passed to the callbacks.
        // See the `mvc.Listener` documentation for more details.
        this.callbackArguments = [];

        this.layerCollection = options.layerCollection;
        if (!this.layerCollection) {
            throw new Error('GraphTopologyIndex: "layerCollection" option is required.');
        }

        this.initializeIndex();
        this.startListening();
    }

    /**
     * @public
     * @description Start listening to graph and layer collection events
     * to maintain the topology index.
     */
    startListening() {
        this.listenTo(this.layerCollection.graph, {
            'add': this._restructureOnAdd,
            'remove': this._restructureOnRemove,
            'reset': this._restructureOnReset
        });
        // Listening to the collection instead of the graph
        // to avoid reacting to graph attribute change events
        // e.g. graph.set('source', ...);
        this.listenTo(this.layerCollection, {
            'change:source': this._restructureOnChangeSource,
            'change:target': this._restructureOnChangeTarget
        });
    }

    /**
     * @protected
     * @description Initialize the internal data structures.
     */
    initializeIndex() {
        // Outgoing edges per node. Note that we use a hash-table for the list
        // of outgoing edges for a faster lookup.
        // [nodeId] -> Object [edgeId] -> true
        this._out = {};
        // Ingoing edges per node.
        // [nodeId] -> Object [edgeId] -> true
        this._in = {};
        // `_nodes` is useful for quick lookup of all the elements in the graph, without
        // having to go through the whole cells array.
        // [node ID] -> true
        this._nodes = {};
        // `_edges` is useful for quick lookup of all the links in the graph, without
        // having to go through the whole cells array.
        // [edgeId] -> true
        this._edges = {};
    }

    /**
     * @protected
     * @description Restructure the topology index on graph reset.
     * E.g. when fromJSON or resetCells is called.
     */
    _restructureOnReset() {
        this.initializeIndex();
        this.layerCollection.getCells().forEach(this._restructureOnAdd, this);
    }

    /**
     * @protected
     * @description Restructure the topology index on cell addition.
     * @param {dia.Cell} cell - The cell being added.
     */
    _restructureOnAdd(cell) {
        if (cell.isLink()) {
            this._edges[cell.id] = true;
            const { source, target } = cell.attributes;
            if (source.id) {
                (this._out[source.id] || (this._out[source.id] = {}))[cell.id] = true;
            }
            if (target.id) {
                (this._in[target.id] || (this._in[target.id] = {}))[cell.id] = true;
            }
        } else {
            this._nodes[cell.id] = true;
        }
    }

    /**
     * @protected
     * @description Restructure the topology index on cell removal.
     * @param {dia.Cell} cell - The cell being removed.
     */
    _restructureOnRemove(cell) {
        if (cell.isLink()) {
            delete this._edges[cell.id];
            const { source, target } = cell.attributes;
            if (source.id && this._out[source.id] && this._out[source.id][cell.id]) {
                delete this._out[source.id][cell.id];
            }
            if (target.id && this._in[target.id] && this._in[target.id][cell.id]) {
                delete this._in[target.id][cell.id];
            }
        } else {
            delete this._nodes[cell.id];
        }
    }

    /**
     * @protected
     * @description Restructure the topology index on link source change.
     * @param {dia.Link} link - The link being changed.
     */
    _restructureOnChangeSource(link) {

        const prevSource = link.previous('source');
        if (prevSource.id && this._out[prevSource.id]) {
            delete this._out[prevSource.id][link.id];
        }
        const source = link.attributes.source;
        if (source.id) {
            (this._out[source.id] || (this._out[source.id] = {}))[link.id] = true;
        }
    }

    /**
     * @protected
     * @description Restructure the topology index on link target change.
     * @param {dia.Link} link - The link being changed.
     */
    _restructureOnChangeTarget(link) {

        const prevTarget = link.previous('target');
        if (prevTarget.id && this._in[prevTarget.id]) {
            delete this._in[prevTarget.id][link.id];
        }
        const target = link.get('target');
        if (target.id) {
            (this._in[target.id] || (this._in[target.id] = {}))[link.id] = true;
        }
    }

    /**
     * @public
     * @description Get all outbound edges for the node. Time complexity: O(1).
     * @param {string} nodeId - The id of the node.
     * @returns {Object} - An object of the form: [edgeId] -> true.
     */
    getOutboundEdges(nodeId) {
        return this._out[nodeId] || {};
    }

    /**
     * @public
     * @description Get all inbound edges for the node. Time complexity: O(1).
     * @param {string} nodeId - The id of the node.
     * @returns {Object} - An object of the form: [edgeId] -> true.
     */
    getInboundEdges(nodeId) {
        return this._in[nodeId] || {};
    }

    /**
     * @public
     * @description Get all sink nodes (leafs) in the graph. Time complexity: O(|V|).
     * @returns {string[]} - Array of node ids.
     */
    getSinkNodes() {
        const sinks = [];
        for (const nodeId in this._nodes) {
            if (!this._out[nodeId] || isEmpty(this._out[nodeId])) {
                sinks.push(nodeId);
            }
        }
        return sinks;
    }

    /**
     * @public
     * @description Get all source nodes (roots) in the graph. Time complexity: O(|V|).
     * @returns {string[]} - Array of node ids.
     */
    getSourceNodes() {
        const sources = [];
        for (const nodeId in this._nodes) {
            if (!this._in[nodeId] || isEmpty(this._in[nodeId])) {
                sources.push(nodeId);
            }
        }
        return sources;
    }

    /**
     * @public
     * @description Return `true` if `nodeId` is a source node (root). Time complexity: O(1).
     * @param {string} nodeId - The id of the node to check.
     * @returns {boolean}
     */
    isSourceNode(nodeId) {
        return !this._in[nodeId] || isEmpty(this._in[nodeId]);
    }

    /**
     * @public
     * @description Return `true` if `nodeId` is a sink node (leaf). Time complexity: O(1).
     * @param {string} nodeId - The id of the node to check.
     * @returns {boolean}
     */
    isSinkNode(nodeId) {
        return !this._out[nodeId] || isEmpty(this._out[nodeId]);
    }
}
