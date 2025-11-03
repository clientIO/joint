import * as util from '../util/index.mjs';
import * as g from '../g/index.mjs';

import { Model } from '../mvc/Model.mjs';
import { Listener } from '../mvc/Listener.mjs';
import { wrappers, wrapWith } from '../util/wrappers.mjs';
import { cloneCells } from '../util/index.mjs';
import { GraphLayersController } from './GraphLayersController.mjs';
import { GraphLayerCollection } from './GraphLayerCollection.mjs';
import { config } from '../config/index.mjs';
import { CELL_MARKER } from './symbols.mjs';
import { GraphTopologyIndex } from './GraphTopologyIndex.mjs';

// The ID of the default graph layer.
const DEFAULT_LAYER_ID = 'cells';

export const Graph = Model.extend({

    /**
     * @todo Remove in v5.0.0
     * @description In legacy mode, the information about layers is not
     * exported into JSON.
     */
    legacyMode: true,

    /**
     * @protected
     * @description The ID of the default layer.
     */
    defaultLayerId: DEFAULT_LAYER_ID,

    initialize: function(attrs, options = {}) {

        const layerCollection = this.layerCollection = new GraphLayerCollection([], {
            layerNamespace: options.layerNamespace,
            cellNamespace: options.cellNamespace,
            graph: this,
            /** @deprecated use cellNamespace instead */
            model: options.cellModel,
        });

        // The default setup includes a single default layer.
        layerCollection.add({ id: DEFAULT_LAYER_ID }, { graph: this.cid });

        /**
         * @todo Remove in v5.0.0
         * @description Retain legacy 'cells' collection in attributes for backward compatibility.
         * Applicable only when the default layer setup is used.
         */
        this.attributes.cells = this.getLayer(DEFAULT_LAYER_ID).cellCollection;

        // Controller that manages communication between the graph and its layers.
        this.layersController = new GraphLayersController({ graph: this });

        // `Graph` keeps an internal data structure (an adjacency list)
        // for fast graph queries. All changes that affect the structure of the graph
        // must be reflected in the `al` object. This object provides fast answers to
        // questions such as "what are the neighbors of this node" or "what
        // are the sibling links of this link".
        this.topologyIndex = new GraphTopologyIndex({ layerCollection });

        this._batches = {};
    },

    toJSON: function(opt = {}) {

        const { layerCollection } = this;
        // Get the graph model attributes as a base JSON.
        const json = Model.prototype.toJSON.apply(this, arguments);

        // Add `cells` array holding all the cells in the graph.
        json.cells = this.getCells().map(cell => cell.toJSON(opt.cellAttributes));

        if (this.legacyMode) {
            // Backwards compatibility for legacy setup
            // with single default layer 'cells'.
            // In this case, we do not need to export layers.
            return json;
        }

        // Add `layers` array holding all the layers in the graph.
        json.layers = layerCollection.toJSON();

        // Add `defaultLayer` property indicating the default layer ID.
        json.defaultLayer = this.defaultLayerId;

        return json;
    },

    fromJSON: function(json, opt) {
        const { cells, layers, defaultLayer, ...attributes } = json;

        if (!cells) {
            throw new Error('Graph JSON must contain cells array.');
        }

        // The `fromJSON` should trigger a single 'reset' event at the end.
        // Set all attributes silently for now.
        this.set(attributes, { silent: true });

        if (layers) {
            // Reset the layers collection
            // (`layers:reset` is not forwarded to the graph).
            this._resetLayers(layers, defaultLayer, opt);
        }

        if (cells) {
            // Reset the cells collection and trigger the 'reset' event.
            this.resetCells(cells, opt);
        }

        return this;
    },

    /** @deprecated  */
    clear: function(opt) {
        opt = util.assign({}, opt, { clear: true });

        const cells = this.getCells();

        if (cells.length === 0) return this;

        this.startBatch('clear', opt);

        const sortedCells = util.sortBy(cells, (cell) => {
            return cell.isLink() ? 1 : 2;
        });

        do {
            // Remove all the cells one by one.
            // Note that all the links are removed first, so it's
            // safe to remove the elements without removing the connected
            // links first.
            this.layerCollection.removeCell(sortedCells.shift(), opt);

        } while (sortedCells.length > 0);

        this.stopBatch('clear');

        return this;
    },

    _prepareCell: function(cellInit, opt) {

        let cellAttributes;
        if (cellInit[CELL_MARKER]) {
            cellAttributes = cellInit.attributes;
        } else {
            cellAttributes = cellInit;
        }

        if (!util.isString(cellAttributes.type)) {
            throw new TypeError('dia.Graph: cell type must be a string.');
        }

        // Backward compatibility: prior v4.2, z-index was not set during reset.
        if (opt && opt.ensureZIndex) {
            if (cellAttributes.z === undefined) {
                const layerId = cellAttributes[config.layerAttribute] || this.defaultLayerId;
                const zIndex = this.maxZIndex(layerId) + 1;
                if (cellInit[CELL_MARKER]) {
                    // Set with event in case there is a listener
                    // directly on the cell instance
                    // (the cell is not part of graph yet)
                    cellInit.set('z', zIndex, opt);
                } else {
                    cellAttributes.z = zIndex;
                }
            }
        }

        return cellInit;
    },

    minZIndex: function(layerId = this.defaultLayerId) {
        const layer = this.getLayer(layerId);
        return layer.cellCollection.minZIndex();
    },

    maxZIndex: function(layerId = this.defaultLayerId) {
        const layer = this.getLayer(layerId);
        return layer.cellCollection.maxZIndex();
    },

    addCell: function(cellInit, options) {

        if (Array.isArray(cellInit)) {
            return this.addCells(cellInit, options);
        }

        this._prepareCell(cellInit, { ...options, ensureZIndex: true });
        this.layerCollection.addCellToLayer(cellInit, this.getCellLayerId(cellInit), options);

        return this;
    },

    addCells: function(cells, opt) {

        if (cells.length === 0) return this;

        cells = util.flattenDeep(cells);
        opt.maxPosition = opt.position = cells.length - 1;

        this.startBatch('add', opt);
        cells.forEach((cell) => {
            this.addCell(cell, opt);
            opt.position--;
        });
        this.stopBatch('add', opt);

        return this;
    },

    /**
     * @public
     * @description Reset the cells in the graph.
     * Useful for bulk operations and optimizations.
     */
    resetCells: function(cellInits, options) {
        const { layerCollection } = this;
        // Note: `cellInits` is always an array and `options` is always an object.
        // See `wrappers.cells` at the end of this file.

        // When resetting cells, do not set z-index if not provided.
        const prepareOptions = { ...options, ensureZIndex: false };

        // Initialize a map of layer IDs to arrays of cells
        const layerCellsMap = layerCollection.reduce((map, layer) => {
            map[layer.id] = [];
            return map;
        }, {});

        // Distribute cells into their respective layers
        for (let i = 0; i < cellInits.length; i++) {
            const cellInit = cellInits[i];
            const layerId = this.getCellLayerId(cellInit);
            if (layerId in layerCellsMap) {
                this._prepareCell(cellInit, prepareOptions);
                layerCellsMap[layerId].push(cellInit);
            } else {
                throw new Error(`dia.Graph: Layer "${layerId}" does not exist.`);
            }
        }

        // Reset each layer's cell collection with the corresponding cells.
        layerCollection.each(layer => {
            layer.cellCollection.reset(layerCellsMap[layer.id], options);
        });

        // Trigger a single `reset` event on the graph
        // (while multiple `reset` events are triggered on layers).
        // Backwards compatibility: use default layer collection
        // The `collection` parameter is retained for backwards compatibility,
        // and it is subject to removal in future releases.
        this.trigger('reset', this.getDefaultLayer().cellCollection, options);

        return this;
    },

    /**
     * @public
     * @description Get the layer ID in which the cell resides.
     * Cells without an explicit layer are assigned to the default layer.
     * @param {dia.Cell | Object} cellInit - Cell model or attributes.
     * @returns {string} - The layer ID.
     */
    getCellLayerId: function(cellInit) {
        if (!cellInit) {
            throw new Error('dia.Graph: No cell provided.');
        }
        const cellAttributes = cellInit[CELL_MARKER]
            ? cellInit.attributes
            : cellInit;
        return cellAttributes[config.layerAttribute] || this.defaultLayerId;
    },

    /**
     * @protected
     * @description Reset the layers in the graph.
     * It assumes the existing cells have been removed beforehand
     * or can be discarded.
     */
    _resetLayers: function(layers, defaultLayerId, options = {}) {
        if (!Array.isArray(layers) || layers.length === 0) {
            throw new Error('dia.Graph: At least one layer must be defined.');
        }

        // Resetting layers disables legacy mode
        this.legacyMode = false;

        this.layerCollection.reset(layers, { ...options, graph: this.cid });

        // If no default layer is specified, use the first layer as default
        if (defaultLayerId) {
            // The default layer must be one of the defined layers
            if (!this.hasLayer(defaultLayerId)) {
                throw new Error(`dia.Graph: default layer "${defaultLayerId}" does not exist.`);
            }
            this.defaultLayerId = defaultLayerId;
        } else {
            this.defaultLayerId = this.layerCollection.at(0).id;
        }

        return this;
    },

    /**
     * @public
     * @description Remove multiple cells from the graph.
     * @param {Array<dia.Cell | dia.Cell.ID>} cellRefs - Array of cell references (models or IDs) to remove.
     * @param {Object} [options] - Removal options. See {@link dia.Graph#removeCell}.
     */
    removeCells: function(cellRefs, options) {
        if (!cellRefs.length) return this;
        // Remove multiple cells in a single batch
        this.startBatch('remove');
        for (const cellRef of cellRefs) {
            if (!cellRef) continue;
            let cell;
            if (cellRef[CELL_MARKER]) {
                cell = cellRef;
            } else {
                cell = this.getCell(cellRef);
                if (!cell) {
                    // The cell might have been already removed (embedded cell, connected link, etc.)
                    continue;
                }
            }
            this.layerCollection.removeCell(cell, options);
        }
        this.stopBatch('remove');
        return this;
    },

    /**
     * @protected
     * @description Replace an existing cell with a new cell.
     */
    _replaceCell: function(currentCell, newCellInit, opt = {}) {
        const batchName = 'replace-cell';
        const replaceOptions = { ...opt, replace: true };
        this.startBatch(batchName, opt);
        // 1. Remove the cell without removing connected links or embedded cells.
        this.layerCollection.removeCell(currentCell, replaceOptions);

        const newCellInitAttributes = (newCellInit[CELL_MARKER])
            ? newCellInit.attributes
            : newCellInit;
        // 2. Combine the current cell attributes with the new cell attributes
        const replacementCellAttributes = Object.assign({}, currentCell.attributes, newCellInitAttributes);
        let replacement;

        if (newCellInit[CELL_MARKER]) {
            // If the new cell is a model, set the merged attributes on the model
            newCellInit.set(replacementCellAttributes, replaceOptions);
            replacement = newCellInit;
        } else {
            replacement = replacementCellAttributes;
        }

        // 3. Add the replacement cell
        this.addCell(replacement, replaceOptions);
        this.stopBatch(batchName);
    },

    /**
     * @protected
     * @description Synchronize a single graph cell with the provided cell (model or attributes).
     * If the cell with the same `id` exists, it is updated. If the cell does not exist, it is added.
     * If the existing cell type is different from the incoming cell type, the existing cell is replaced.
     */
    _syncCell: function(cellInit, opt = {}) {
        const cellAttributes = (cellInit[CELL_MARKER])
            ? cellInit.attributes
            : cellInit;
        const currentCell = this.getCell(cellInit.id);
        if (currentCell) {
            // `cellInit` is either a model or attributes object
            if ('type' in cellAttributes && currentCell.get('type') !== cellAttributes.type) {
                // Replace the cell if the type has changed
                this._replaceCell(currentCell, cellInit, opt);
            } else {
                // Update existing cell
                // Note: the existing cell attributes are not removed,
                // if they're missing in `cellAttributes`.
                currentCell.set(cellAttributes, opt);
            }
        } else {
            // The cell does not exist yet, add it
            this.addCell(cellInit, opt);
        }
    },

    /**
     * @public
     * @description Synchronize the graph cells with the provided array of cells (models or attributes).
     */
    syncCells: function(cellInits, opt = {}) {

        const batchName = 'sync-cells';
        const { remove = false, ...setOpt } = opt;

        let currentCells, newCellsMap;
        if (remove) {
            // We need to track existing cells to remove the missing ones later
            currentCells = this.getCells();
            newCellsMap = new Map();
        }

        // Observe changes to the graph cells
        let changeObserver, changedLayers;
        const shouldSort = opt.sort !== false;
        if (shouldSort) {
            changeObserver = new Listener();
            changedLayers = new Set();
            changeObserver.listenTo(this, {
                'add': (cell) => {
                    changedLayers.add(this.getCellLayerId(cell));
                },
                'change': (cell) => {
                    if (cell.hasChanged(config.layerAttribute) || cell.hasChanged('z')) {
                        changedLayers.add(this.getCellLayerId(cell));
                    }
                }
            });
        }

        this.startBatch(batchName, opt);

        // Prevent multiple sorts during sync
        setOpt.sort = false;

        // Add or update incoming cells
        for (const cellInit of cellInits) {
            if (remove) {
                // only track existence
                newCellsMap.set(cellInit.id, true);
            }
            this._syncCell(cellInit, setOpt);
        }

        if (remove) {
            // Remove cells not present in the incoming array
            for (const cell of currentCells) {
                if (!newCellsMap.has(cell.id)) {
                    this.layerCollection.removeCell(cell, setOpt);
                }
            }
        }

        if (shouldSort) {
            // Sort layers that had changes affecting z-index or layer
            changeObserver.stopListening();
            for (const layerId of changedLayers) {
                this.getLayer(layerId).cellCollection.sort(opt);
            }
        }

        this.stopBatch(batchName);
    },

    /**
     * @public
     * @description Remove a cell from the graph.
     * @param {dia.Cell} cell
     * @param {Object} [options]
     * @param {boolean} [options.disconnectLinks=false] - If `true`, the connected links are
     * disconnected instead of removed.
     * @param {boolean} [options.clear=false] - If `true`, the connected links
     * are kept. @internal
     * @param {boolean} [options.replace=false] - If `true`, the connected links and
     * embedded cells are kept. @internal
     * @throws Will throw an error if no cell is provided
     * @throws Will throw an error if the ID of the cell to remove
     * does not exist in the graph
     **/
    removeCell: function(cellRef, options) {
        if (!cellRef) {
            throw new Error('dia.Graph: no cell provided.');
        }
        const cell = cellRef[CELL_MARKER] ? cellRef : this.getCell(cellRef);
        if (!cell) {
            throw new Error('dia.Graph: cell to remove does not exist in the graph.');
        }
        if (cell.graph !== this) return;
        this.startBatch('remove');
        cell.collection.remove(cell, options);
        this.stopBatch('remove');
    },

    transferCellEmbeds: function(sourceCell, targetCell, opt = {}) {

        const batchName = 'transfer-embeds';
        this.startBatch(batchName);

        // Embed children of the source cell in the target cell.
        const children = sourceCell.getEmbeddedCells();
        targetCell.embed(children, { ...opt, reparent: true });

        this.stopBatch(batchName);
    },

    transferCellConnectedLinks: function(sourceCell, targetCell, opt = {}) {

        const batchName = 'transfer-connected-links';
        this.startBatch(batchName);

        // Reconnect all the links connected to the old cell to the new cell.
        const connectedLinks = this.getConnectedLinks(sourceCell, opt);
        connectedLinks.forEach((link) => {

            if (link.getSourceCell() === sourceCell) {
                link.prop(['source', 'id'], targetCell.id, opt);
            }

            if (link.getTargetCell() === sourceCell) {
                link.prop(['target', 'id'], targetCell.id, opt);
            }
        });

        this.stopBatch(batchName);
    },

    /**
     * @private
     * Helper method for addLayer and moveLayer methods
     */
    _getBeforeLayerIdFromOptions(options, layer = null) {
        let { before = null, index } = options;

        if (before && index !== undefined) {
            throw new Error('dia.Graph: Options "before" and "index" are mutually exclusive.');
        }

        let computedBefore;
        if (index !== undefined) {
            const layersArray = this.getLayers();
            if (index >= layersArray.length) {
                // If index is greater than the number of layers,
                // return before as null (move to the end).
                computedBefore = null;
            } else if (index < 0) {
                // If index is negative, move to the beginning.
                computedBefore = layersArray[0].id;
            } else {
                const originalIndex = layersArray.indexOf(layer);
                if (originalIndex !== -1 && index > originalIndex) {
                    // If moving a layer upwards in the stack, we need to adjust the index
                    // to account for the layer being removed from its original position.
                    index += 1;
                }
                // Otherwise, get the layer ID at the specified index.
                computedBefore = layersArray[index]?.id || null;
            }
        } else {
            computedBefore = before;
        }

        return computedBefore;
    },

    /**
     * @public
     * Adds a new layer to the graph.
     * @param {GraphLayer | GraphLayerJSON} layerInit
     * @param {*} options
     * @param {string | null} [options.before] - ID of the layer
     * before which to insert the new layer. If `null`, the layer is added at the end.
     * @param {number} [options.index] - Zero-based index to which to add the layer.
     * @throws Will throw an error if the layer to add is invalid
     * @throws Will throw an error if a layer with the same ID already exists
     * @throws Will throw if `before` reference is invalid
     */
    addLayer(layerInit, options = {}) {
        if (!layerInit || !layerInit.id) {
            throw new Error('dia.Graph: Layer to add is invalid.');
        }
        if (this.hasLayer(layerInit.id)) {
            throw new Error(`dia.Graph: Layer "${layerInit.id}" already exists.`);
        }
        const { before = null, index, ...insertOptions } = options;
        insertOptions.graph = this.cid;

        // Adding a new layer disables legacy mode
        this.legacyMode = false;

        const beforeId = this._getBeforeLayerIdFromOptions({ before, index });
        this.layerCollection.insert(layerInit, beforeId, insertOptions);
    },

    /**
     * @public
     * Moves an existing layer to a new position in the layer stack.
     * @param {string | GraphLayer} layerRef - ID or reference of the layer to move.
     * @param {*} options
     * @param {string | null} [options.before] - ID of the layer
     * before which to insert the moved layer. If `null`, the layer is moved to the end.
     * @param {number} [options.index] - Zero-based index to which to move the layer.
     * @throws Will throw an error if the layer to move does not exist
     * @throws Will throw an error if `before` reference is invalid
     * @throws Will throw an error if both `before` and `index` options are provided
     */
    moveLayer(layerRef, options = {}) {
        if (!layerRef || !this.hasLayer(layerRef)) {
            throw new Error('dia.Graph: Layer to move does not exist.');
        }
        const layer = this.getLayer(layerRef);
        const { before = null, index, ...insertOptions } = options;
        insertOptions.graph = this.cid;

        // Moving a layer disables legacy mode
        this.legacyMode = false;

        const beforeId = this._getBeforeLayerIdFromOptions({ before, index }, layer);
        this.layerCollection.insert(layer, beforeId, insertOptions);
    },

    /**
     * @public
     * Removes an existing layer from the graph.
     * @param {string | GraphLayer} layerRef - ID or reference of the layer to remove.
     * @param {*} options
     * @throws Will throw an error if no layer is provided
     * @throws Will throw an error if the layer to remove does not exist
     */
    removeLayer(layerRef, options = {}) {
        if (!layerRef) {
            throw new Error('dia.Graph: No layer provided.');
        }

        // The layer must exist
        const layerId = layerRef.id ? layerRef.id : layerRef;
        const layer = this.getLayer(layerId);

        // Prevent removing the default layer
        // Note: if there is only one layer, it is also the default layer.
        const { id: defaultLayerId } = this.getDefaultLayer();
        if (layerId === defaultLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        // A layer with cells cannot be removed
        if (layer.cellCollection.length > 0) {
            throw new Error(`dia.Graph: Layer "${layerId}" cannot be removed because it is not empty.`);
        }

        this.layerCollection.remove(layerId, { ...options, graph: this.cid });
    },

    getDefaultLayer() {
        return this.layerCollection.get(this.defaultLayerId);
    },

    setDefaultLayer(layerRef, options = {}) {
        if (!layerRef) {
            throw new Error('dia.Graph: No default layer ID provided.');
        }

        // Make sure the layer exists
        const defaultLayerId = layerRef.id ? layerRef.id : layerRef;
        const defaultLayer = this.getLayer(defaultLayerId);

        // If the default layer is not changing, do nothing
        const currentDefaultLayerId = this.defaultLayerId;
        if (defaultLayerId === currentDefaultLayerId) {
            // The default layer stays the same
            return;
        }

        // Get all cells that belong to the current default layer implicitly
        const implicitLayerCells = this.getImplicitLayerCells();

        // Set the new default layer ID
        this.defaultLayerId = defaultLayerId;

        const batchName = 'default-layer-change';
        this.startBatch(batchName, options);

        if (implicitLayerCells.length > 0) {
            // Reassign any cells lacking an explicit layer to the new default layer.
            // Do not sort yet, wait until all cells are moved.
            const moveOptions = { ...options, sort: false };
            for (const cell of implicitLayerCells) {
                this.layerCollection.moveCellBetweenLayers(cell, defaultLayerId, moveOptions);
            }
            // Now sort the new default layer
            if (options.sort !== false) {
                defaultLayer.cellCollection.sort(options);
            }
        }

        // Pretend to trigger the event on the layer itself.
        // It will bubble up as `layer:default` event on the graph.
        defaultLayer.trigger(defaultLayer.eventPrefix + 'default', defaultLayer, {
            ...options,
            previousDefaultLayerId: currentDefaultLayerId
        });

        this.stopBatch(batchName, options);
    },

    /**
     * @protected
     * @description Get all cells that do not have an explicit layer assigned.
     * These cells belong to the default layer implicitly.
     * @return {Array<dia.Cell>} Array of cells without an explicit layer.
     */
    getImplicitLayerCells() {
        return this.getDefaultLayer().cellCollection.filter(cell => {
            return cell.get(config.layerAttribute) == null;
        });
    },

    getLayer(layerId) {
        if (!this.hasLayer(layerId)) {
            throw new Error(`dia.Graph: Layer "${layerId}" does not exist.`);
        }
        return this.layerCollection.get(layerId);
    },

    hasLayer(layerRef) {
        return this.layerCollection.has(layerRef);
    },

    getLayers() {
        return this.layerCollection.toArray();
    },

    getCell: function(cellRef) {
        return this.layerCollection.getCell(cellRef);
    },

    getCells: function() {
        return this.layerCollection.getCells();
    },

    getElements: function() {

        return this.getCells().filter(cell => cell.isElement());
    },

    getLinks: function() {

        return this.getCells().filter(cell => cell.isLink());
    },

    getFirstCell: function(layerId) {
        let layer;
        if (!layerId) {
            // Get the first cell from the bottom-most layer
            layer = this.getLayers().at(0);
        } else {
            layer = this.getLayer(layerId);
        }
        return layer.cellCollection.models.at(0);
    },

    getLastCell: function(layerId) {
        let layer;
        if (!layerId) {
            // Get the last cell from the top-most layer
            layer = this.getLayers().at(-1);
        } else {
            layer = this.getLayer(layerId);
        }
        return layer.cellCollection.models.at(-1);
    },

    // Get all inbound and outbound links connected to the cell `model`.
    getConnectedLinks: function(model, opt) {

        opt = opt || {};

        var indirect = opt.indirect;
        var inbound = opt.inbound;
        var outbound = opt.outbound;
        if ((inbound === undefined) && (outbound === undefined)) {
            inbound = outbound = true;
        }

        // the final array of connected link models
        var links = [];
        // a hash table of connected edges of the form: [edgeId] -> true
        // used for quick lookups to check if we already added a link
        var edges = {};

        if (outbound) {
            addOutbounds(this, model);
        }
        if (inbound) {
            addInbounds(this, model);
        }

        function addOutbounds(graph, model) {
            util.forIn(graph.topologyIndex.getOutboundEdges(model.id), function(_, edge) {
                // skip links that were already added
                // (those must be self-loop links)
                // (because they are inbound and outbound edges of the same two elements)
                if (edges[edge]) return;
                var link = graph.getCell(edge);
                if (!link) return;
                links.push(link);
                edges[edge] = true;
                if (indirect) {
                    if (inbound) addInbounds(graph, link);
                    if (outbound) addOutbounds(graph, link);
                }
            }.bind(graph));
            if (indirect && model.isLink()) {
                var outCell = model.getTargetCell();
                if (outCell && outCell.isLink()) {
                    if (!edges[outCell.id]) {
                        links.push(outCell);
                        addOutbounds(graph, outCell);
                    }
                }
            }
        }

        function addInbounds(graph, model) {
            util.forIn(graph.topologyIndex.getInboundEdges(model.id), function(_, edge) {
                // skip links that were already added
                // (those must be self-loop links)
                // (because they are inbound and outbound edges of the same two elements)
                if (edges[edge]) return;
                var link = graph.getCell(edge);
                if (!link) return;
                links.push(link);
                edges[edge] = true;
                if (indirect) {
                    if (inbound) addInbounds(graph, link);
                    if (outbound) addOutbounds(graph, link);
                }
            }.bind(graph));
            if (indirect && model.isLink()) {
                var inCell = model.getSourceCell();
                if (inCell && inCell.isLink()) {
                    if (!edges[inCell.id]) {
                        links.push(inCell);
                        addInbounds(graph, inCell);
                    }
                }
            }
        }

        // if `deep` option is `true`, check also all the links that are connected to any of the descendant cells
        if (opt.deep) {

            var embeddedCells = model.getEmbeddedCells({ deep: true });

            // in the first round, we collect all the embedded elements
            var embeddedElements = {};
            embeddedCells.forEach(function(cell) {
                if (cell.isElement()) {
                    embeddedElements[cell.id] = true;
                }
            });

            embeddedCells.forEach(function(cell) {
                if (cell.isLink()) return;
                if (outbound) {
                    util.forIn(this.topologyIndex.getOutboundEdges(cell.id), function(exists, edge) {
                        if (!edges[edge]) {
                            var edgeCell = this.getCell(edge);
                            var { source, target } = edgeCell.attributes;
                            var sourceId = source.id;
                            var targetId = target.id;

                            // if `includeEnclosed` option is falsy, skip enclosed links
                            if (!opt.includeEnclosed
                                && (sourceId && embeddedElements[sourceId])
                                && (targetId && embeddedElements[targetId])) {
                                return;
                            }

                            links.push(this.getCell(edge));
                            edges[edge] = true;
                        }
                    }.bind(this));
                }
                if (inbound) {
                    util.forIn(this.topologyIndex.getInboundEdges(cell.id), function(exists, edge) {
                        if (!edges[edge]) {
                            var edgeCell = this.getCell(edge);
                            var { source, target } = edgeCell.attributes;
                            var sourceId = source.id;
                            var targetId = target.id;

                            // if `includeEnclosed` option is falsy, skip enclosed links
                            if (!opt.includeEnclosed
                                && (sourceId && embeddedElements[sourceId])
                                && (targetId && embeddedElements[targetId])) {
                                return;
                            }

                            links.push(this.getCell(edge));
                            edges[edge] = true;
                        }
                    }.bind(this));
                }
            }, this);
        }

        return links;
    },

    getNeighbors: function(model, opt) {

        opt || (opt = {});

        var inbound = opt.inbound;
        var outbound = opt.outbound;
        if (inbound === undefined && outbound === undefined) {
            inbound = outbound = true;
        }

        var neighbors = this.getConnectedLinks(model, opt).reduce(function(res, link) {

            var { source, target } = link.attributes;
            var loop = link.hasLoop(opt);

            // Discard if it is a point, or if the neighbor was already added.
            if (inbound && util.has(source, 'id') && !res[source.id]) {

                var sourceElement = this.getCell(source.id);
                if (sourceElement.isElement()) {
                    if (loop || (sourceElement && sourceElement !== model && (!opt.deep || !sourceElement.isEmbeddedIn(model)))) {
                        res[source.id] = sourceElement;
                    }
                }
            }

            // Discard if it is a point, or if the neighbor was already added.
            if (outbound && util.has(target, 'id') && !res[target.id]) {

                var targetElement = this.getCell(target.id);
                if (targetElement.isElement()) {
                    if (loop || (targetElement && targetElement !== model && (!opt.deep || !targetElement.isEmbeddedIn(model)))) {
                        res[target.id] = targetElement;
                    }
                }
            }

            return res;
        }.bind(this), {});

        if (model.isLink()) {
            if (inbound) {
                var sourceCell = model.getSourceCell();
                if (sourceCell && sourceCell.isElement() && !neighbors[sourceCell.id]) {
                    neighbors[sourceCell.id] = sourceCell;
                }
            }
            if (outbound) {
                var targetCell = model.getTargetCell();
                if (targetCell && targetCell.isElement() && !neighbors[targetCell.id]) {
                    neighbors[targetCell.id] = targetCell;
                }
            }
        }

        return util.toArray(neighbors);
    },

    getCommonAncestor: function(/* cells */) {

        var cellsAncestors = Array.from(arguments).map(function(cell) {

            var ancestors = [];
            var parentId = cell.get('parent');

            while (parentId) {

                ancestors.push(parentId);
                parentId = this.getCell(parentId).get('parent');
            }

            return ancestors;

        }, this);

        cellsAncestors = cellsAncestors.sort(function(a, b) {
            return a.length - b.length;
        });

        var commonAncestor = util.toArray(cellsAncestors.shift()).find(function(ancestor) {
            return cellsAncestors.every(function(cellAncestors) {
                return cellAncestors.includes(ancestor);
            });
        });

        return this.getCell(commonAncestor);
    },

    // Find the whole branch starting at `element`.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // If `opt.breadthFirst` is `true`, use the Breadth-first search algorithm, otherwise use Depth-first search.
    getSuccessors: function(element, opt) {

        opt = opt || {};
        var res = [];
        // Modify the options so that it includes the `outbound` neighbors only. In other words, search forwards.
        this.search(element, function(el) {
            if (el !== element) {
                res.push(el);
            }
        }, util.assign({}, opt, { outbound: true }));
        return res;
    },

    cloneCells: cloneCells,
    // Clone the whole subgraph (including all the connected links whose source/target is in the subgraph).
    // If `opt.deep` is `true`, also take into account all the embedded cells of all the subgraph cells.
    // Return a map of the form: [original cell ID] -> [clone].
    cloneSubgraph: function(cells, opt) {

        var subgraph = this.getSubgraph(cells, opt);
        return this.cloneCells(subgraph);
    },

    // Return `cells` and all the connected links that connect cells in the `cells` array.
    // If `opt.deep` is `true`, return all the cells including all their embedded cells
    // and all the links that connect any of the returned cells.
    // For example, for a single shallow element, the result is that very same element.
    // For two elements connected with a link: `A --- L ---> B`, the result for
    // `getSubgraph([A, B])` is `[A, L, B]`. The same goes for `getSubgraph([L])`, the result is again `[A, L, B]`.
    getSubgraph: function(cells, opt) {

        opt = opt || {};

        var subgraph = [];
        // `cellMap` is used for a quick lookup of existence of a cell in the `cells` array.
        var cellMap = {};
        var elements = [];
        var links = [];

        util.toArray(cells).forEach(function(cell) {
            if (!cellMap[cell.id]) {
                subgraph.push(cell);
                cellMap[cell.id] = cell;
                if (cell.isLink()) {
                    links.push(cell);
                } else {
                    elements.push(cell);
                }
            }

            if (opt.deep) {
                var embeds = cell.getEmbeddedCells({ deep: true });
                embeds.forEach(function(embed) {
                    if (!cellMap[embed.id]) {
                        subgraph.push(embed);
                        cellMap[embed.id] = embed;
                        if (embed.isLink()) {
                            links.push(embed);
                        } else {
                            elements.push(embed);
                        }
                    }
                });
            }
        });

        links.forEach(function(link) {
            // For links, return their source & target (if they are elements - not points).
            var { source, target } = link.attributes;
            if (source.id && !cellMap[source.id]) {
                var sourceElement = this.getCell(source.id);
                subgraph.push(sourceElement);
                cellMap[sourceElement.id] = sourceElement;
                elements.push(sourceElement);
            }
            if (target.id && !cellMap[target.id]) {
                var targetElement = this.getCell(target.id);
                subgraph.push(this.getCell(target.id));
                cellMap[targetElement.id] = targetElement;
                elements.push(targetElement);
            }
        }, this);

        elements.forEach(function(element) {
            // For elements, include their connected links if their source/target is in the subgraph;
            var links = this.getConnectedLinks(element, opt);
            links.forEach(function(link) {
                var { source, target } = link.attributes;
                if (!cellMap[link.id] && source.id && cellMap[source.id] && target.id && cellMap[target.id]) {
                    subgraph.push(link);
                    cellMap[link.id] = link;
                }
            });
        }, this);

        return subgraph;
    },

    // Find all the predecessors of `element`. This is a reverse operation of `getSuccessors()`.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // If `opt.breadthFirst` is `true`, use the Breadth-first search algorithm, otherwise use Depth-first search.
    getPredecessors: function(element, opt) {

        opt = opt || {};
        var res = [];
        // Modify the options so that it includes the `inbound` neighbors only. In other words, search backwards.
        this.search(element, function(el) {
            if (el !== element) {
                res.push(el);
            }
        }, util.assign({}, opt, { inbound: true }));
        return res;
    },

    // Perform search on the graph.
    // If `opt.breadthFirst` is `true`, use the Breadth-first Search algorithm, otherwise use Depth-first search.
    // By setting `opt.inbound` to `true`, you can reverse the direction of the search.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // `iteratee` is a function of the form `function(element) {}`.
    // If `iteratee` explicitly returns `false`, the searching stops.
    search: function(element, iteratee, opt) {

        opt = opt || {};
        if (opt.breadthFirst) {
            this.bfs(element, iteratee, opt);
        } else {
            this.dfs(element, iteratee, opt);
        }
    },

    // Breadth-first search.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // If `opt.inbound` is `true`, reverse the search direction (it's like reversing all the link directions).
    // `iteratee` is a function of the form `function(element, distance) {}`.
    // where `element` is the currently visited element and `distance` is the distance of that element
    // from the root `element` passed the `bfs()`, i.e. the element we started the search from.
    // Note that the `distance` is not the shortest or longest distance, it is simply the number of levels
    // crossed till we visited the `element` for the first time. It is especially useful for tree graphs.
    // If `iteratee` explicitly returns `false`, the searching stops.
    bfs: function(element, iteratee, opt = {}) {

        const visited = {};
        const distance = {};
        const queue = [];

        queue.push(element);
        distance[element.id] = 0;

        while (queue.length > 0) {
            var next = queue.shift();
            if (visited[next.id]) continue;
            visited[next.id] = true;
            if (iteratee.call(this, next, distance[next.id]) === false) continue;
            const neighbors = this.getNeighbors(next, opt);
            for (let i = 0, n = neighbors.length; i < n; i++) {
                const neighbor = neighbors[i];
                distance[neighbor.id] = distance[next.id] + 1;
                queue.push(neighbor);
            }
        }
    },

    // Depth-first search.
    // If `opt.deep` is `true`, take into account embedded elements too.
    // If `opt.inbound` is `true`, reverse the search direction (it's like reversing all the link directions).
    // `iteratee` is a function of the form `function(element, distance) {}`.
    // If `iteratee` explicitly returns `false`, the search stops.
    dfs: function(element, iteratee, opt = {}) {

        const visited = {};
        const distance = {};
        const queue = [];

        queue.push(element);
        distance[element.id] = 0;

        while (queue.length > 0) {
            const next = queue.pop();
            if (visited[next.id]) continue;
            visited[next.id] = true;
            if (iteratee.call(this, next, distance[next.id]) === false) continue;
            const neighbors = this.getNeighbors(next, opt);
            const lastIndex = queue.length;
            for (let i = 0, n = neighbors.length; i < n; i++) {
                const neighbor = neighbors[i];
                distance[neighbor.id] = distance[next.id] + 1;
                queue.splice(lastIndex, 0, neighbor);
            }
        }
    },

    // Get all the roots of the graph. Time complexity: O(|V|).
    getSources: function() {
        return this.topologyIndex.getSourceNodes().map(nodeId => this.getCell(nodeId));
    },

    // Get all the leafs of the graph. Time complexity: O(|V|).
    getSinks: function() {
        return this.topologyIndex.getSinkNodes().map(nodeId => this.getCell(nodeId));
    },

    // Return `true` if `element` is a root. Time complexity: O(1).
    isSource: function(element) {
        return this.topologyIndex.isSourceNode(element.id);
    },

    // Return `true` if `element` is a leaf. Time complexity: O(1).
    isSink: function(element) {
        return this.topologyIndex.isSinkNode(element.id);
    },

    // Return `true` is `elementB` is a successor of `elementA`. Return `false` otherwise.
    isSuccessor: function(elementA, elementB) {

        var isSuccessor = false;
        this.search(elementA, function(element) {
            if (element === elementB && element !== elementA) {
                isSuccessor = true;
                return false;
            }
        }, { outbound: true });
        return isSuccessor;
    },

    // Return `true` is `elementB` is a predecessor of `elementA`. Return `false` otherwise.
    isPredecessor: function(elementA, elementB) {

        var isPredecessor = false;
        this.search(elementA, function(element) {
            if (element === elementB && element !== elementA) {
                isPredecessor = true;
                return false;
            }
        }, { inbound: true });
        return isPredecessor;
    },

    // Return `true` is `elementB` is a neighbor of `elementA`. Return `false` otherwise.
    // `opt.deep` controls whether to take into account embedded elements as well. See `getNeighbors()`
    // for more details.
    // If `opt.outbound` is set to `true`, return `true` only if `elementB` is a successor neighbor.
    // Similarly, if `opt.inbound` is set to `true`, return `true` only if `elementB` is a predecessor neighbor.
    isNeighbor: function(elementA, elementB, opt) {

        opt = opt || {};

        var inbound = opt.inbound;
        var outbound = opt.outbound;
        if ((inbound === undefined) && (outbound === undefined)) {
            inbound = outbound = true;
        }

        var isNeighbor = false;

        this.getConnectedLinks(elementA, opt).forEach(function(link) {

            var { source, target } = link.attributes;

            // Discard if it is a point.
            if (inbound && util.has(source, 'id') && (source.id === elementB.id)) {
                isNeighbor = true;
                return false;
            }

            // Discard if it is a point, or if the neighbor was already added.
            if (outbound && util.has(target, 'id') && (target.id === elementB.id)) {
                isNeighbor = true;
                return false;
            }
        });

        return isNeighbor;
    },

    // Disconnect links connected to the cell `model`.
    disconnectLinks: function(model, opt) {

        this.getConnectedLinks(model).forEach(function(link) {

            link.set((link.attributes.source.id === model.id ? 'source' : 'target'), { x: 0, y: 0 }, opt);
        });
    },

    // Remove links connected to the cell `model` completely.
    removeLinks: function(cell, opt) {
        this.getConnectedLinks(cell).forEach(link => {
            this.layerCollection.removeCell(link, opt);
        });
    },

    // Find all cells at given point

    findElementsAtPoint: function(point, opt) {
        return this._filterAtPoint(this.getElements(), point, opt);
    },

    findLinksAtPoint: function(point, opt) {
        return this._filterAtPoint(this.getLinks(), point, opt);
    },

    findCellsAtPoint: function(point, opt) {
        return this._filterAtPoint(this.getCells(), point, opt);
    },

    _filterAtPoint: function(cells, point, opt = {}) {
        return cells.filter(el => el.getBBox({ rotate: true }).containsPoint(point, opt));
    },

    // Find all cells in given area

    findElementsInArea: function(area, opt = {}) {
        return this._filterInArea(this.getElements(), area, opt);
    },

    findLinksInArea: function(area, opt = {}) {
        return this._filterInArea(this.getLinks(), area, opt);
    },

    findCellsInArea: function(area, opt = {}) {
        return this._filterInArea(this.getCells(), area, opt);
    },

    _filterInArea: function(cells, area, opt = {}) {
        const r = new g.Rect(area);
        const { strict = false } = opt;
        const method = strict ? 'containsRect' : 'intersect';
        return cells.filter(el => r[method](el.getBBox({ rotate: true })));
    },

    // Find all cells under the given element.

    findElementsUnderElement: function(element, opt) {
        return this._filterCellsUnderElement(this.getElements(), element, opt);
    },

    findLinksUnderElement: function(element, opt) {
        return this._filterCellsUnderElement(this.getLinks(), element, opt);
    },

    findCellsUnderElement: function(element, opt) {
        return this._filterCellsUnderElement(this.getCells(), element, opt);
    },

    _isValidElementUnderElement: function(el1, el2) {
        return el1.id !== el2.id && !el1.isEmbeddedIn(el2);
    },

    _isValidLinkUnderElement: function(link, el) {
        return (
            link.source().id !== el.id &&
            link.target().id !== el.id &&
            !link.isEmbeddedIn(el)
        );
    },

    _validateCellsUnderElement: function(cells, element) {
        return cells.filter(cell => {
            return cell.isLink()
                ? this._isValidLinkUnderElement(cell, element)
                : this._isValidElementUnderElement(cell, element);
        });
    },

    _getFindUnderElementGeometry: function(element, searchBy = 'bbox') {
        const bbox = element.getBBox({ rotate: true });
        return (searchBy !== 'bbox') ? util.getRectPoint(bbox, searchBy) : bbox;
    },

    _filterCellsUnderElement: function(cells, element, opt = {}) {
        const geometry = this._getFindUnderElementGeometry(element, opt.searchBy);
        const filteredCells = (geometry.type === g.types.Point)
            ? this._filterAtPoint(cells, geometry)
            : this._filterInArea(cells, geometry, opt);
        return this._validateCellsUnderElement(filteredCells, element);
    },

    // @deprecated use `findElementsInArea` instead
    findModelsInArea: function(area, opt) {
        return this.findElementsInArea(area, opt);
    },

    // @deprecated use `findElementsAtPoint` instead
    findModelsFromPoint: function(point) {
        return this.findElementsAtPoint(point);
    },

    // @deprecated use `findModelsUnderElement` instead
    findModelsUnderElement: function(element, opt) {
        return this.findElementsUnderElement(element, opt);
    },

    // Return bounding box of all elements.
    getBBox: function() {

        return this.getCellsBBox(this.getCells());
    },

    // Return the bounding box of all cells in array provided.
    getCellsBBox: function(cells, opt = {}) {
        const { rotate = true } = opt;
        return util.toArray(cells).reduce(function(memo, cell) {
            const rect = cell.getBBox({ rotate });
            if (!rect) return memo;
            if (memo) {
                return memo.union(rect);
            }
            return rect;
        }, null);
    },

    translate: function(dx, dy, opt) {

        // Don't translate cells that are embedded in any other cell.
        var cells = this.getCells().filter(function(cell) {
            return !cell.isEmbedded();
        });

        util.invoke(cells, 'translate', dx, dy, opt);

        return this;
    },

    resize: function(width, height, opt) {

        return this.resizeCells(width, height, this.getCells(), opt);
    },

    resizeCells: function(width, height, cells, opt) {

        // `getBBox` method returns `null` if no elements provided.
        // i.e. cells can be an array of links
        var bbox = this.getCellsBBox(cells);
        if (bbox) {
            var sx = Math.max(width / bbox.width, 0);
            var sy = Math.max(height / bbox.height, 0);
            util.invoke(cells, 'scale', sx, sy, bbox.origin(), opt);
        }

        return this;
    },

    startBatch: function(name, data) {

        data = data || {};
        this._batches[name] = (this._batches[name] || 0) + 1;

        return this.trigger('batch:start', util.assign({}, data, { batchName: name }));
    },

    stopBatch: function(name, data) {

        data = data || {};
        this._batches[name] = (this._batches[name] || 0) - 1;

        return this.trigger('batch:stop', util.assign({}, data, { batchName: name }));
    },

    hasActiveBatch: function(name) {

        const batches = this._batches;
        let names;

        if (arguments.length === 0) {
            names = Object.keys(batches);
        } else if (Array.isArray(name)) {
            names = name;
        } else {
            names = [name];
        }

        return names.some((batch) => batches[batch] > 0);
    }

}, {

    validations: {

        multiLinks: function(graph, link) {

            // Do not allow multiple links to have the same source and target.
            var { source, target } = link.attributes;

            if (source.id && target.id) {

                var sourceModel = link.getSourceCell();
                if (sourceModel) {

                    var connectedLinks = graph.getConnectedLinks(sourceModel, { outbound: true });
                    var sameLinks = connectedLinks.filter(function(_link) {

                        var { source: _source, target: _target } = _link.attributes;
                        return _source && _source.id === source.id &&
                            (!_source.port || (_source.port === source.port)) &&
                            _target && _target.id === target.id &&
                            (!_target.port || (_target.port === target.port));

                    });

                    if (sameLinks.length > 1) {
                        return false;
                    }
                }
            }

            return true;
        },

        linkPinning: function(_graph, link) {
            var { source, target } = link.attributes;
            return source.id && target.id;
        }
    }

});

wrapWith(Graph.prototype, ['resetCells', 'addCells', 'removeCells'], wrappers.cells);
