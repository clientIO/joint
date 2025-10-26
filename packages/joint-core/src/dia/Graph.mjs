import * as util from '../util/index.mjs';
import * as g from '../g/index.mjs';

import { Model } from '../mvc/Model.mjs';
import { wrappers, wrapWith } from '../util/wrappers.mjs';
import { cloneCells } from '../util/index.mjs';
import { CellLayersController } from './controllers/CellLayersController.mjs';
import { GraphCellLayers } from './collections/GraphCellLayers.mjs';
import { config } from '../config/index.mjs';
import { CELL_MARKER } from './Cell.mjs';

export const Graph = Model.extend({

    initialize: function(attrs, opt) {

        opt = opt || {};

        const cellLayerCollection = this.cellLayerCollection = new GraphCellLayers([], {
            cellLayerNamespace: opt.cellLayerNamespace,
            cellNamespace: opt.cellNamespace,
            /** @deprecated use cellNamespace instead */
            model: opt.cellModel,
            graph: this,
        });

        // Re-trigger events from the `cellLayerCollection` on the graph instance.
        cellLayerCollection.on('all', this._forwardCellLayerCollectionEvents, this);

        this.cellLayersController = new CellLayersController({ graph: this });

        // Retain legacy 'cells' collection in attributes for backward compatibility.
        // Applicable only when the default layer setup is used.
        this.attributes.cells = this.getCellLayer('cells').cellCollection;

        // `joint.dia.Graph` keeps an internal data structure (an adjacency list)
        // for fast graph queries. All changes that affect the structure of the graph
        // must be reflected in the `al` object. This object provides fast answers to
        // questions such as "what are the neighbours of this node" or "what
        // are the sibling links of this link".

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

        this._batches = {};

        this.on('reset', this._restructureOnReset, this);
        this.on('add', this._restructureOnAdd, this);
        this.on('remove', this._restructureOnRemove, this);
        this.on('remove', this._removeCell, this);

        cellLayerCollection.on('cell:change:source', this._restructureOnChangeSource, this);
        cellLayerCollection.on('cell:change:target', this._restructureOnChangeTarget, this);
    },

    _forwardCellLayerCollectionEvents: function(eventName) {
        // Forward cell events without prefix
        if (eventName.startsWith('cell:')) {
            // Skip 'cell:remove' events as they are handled on the graph level
            if (eventName === 'cell:remove') {
                return;
            }
            // Skip if a `cell` is added to a different layer due to layer change
            if (eventName === 'cell:add') {
                const options = arguments[2];
                if (options && options.layerChange) {
                    return;
                }
            }
            // Removing 'cell:' prefix
            arguments[0] = eventName.slice(5);
            this.trigger.apply(this, arguments);
            return;
        }
        // Do not forward layer events with 'layer:' prefix
        if (eventName.startsWith('layer:')) {
            // Backwards compatibility:
            // Trigger 'sort' event for 'layer:sort' events
            if (eventName === 'layer:sort') {
                this.trigger('sort', arguments[1], arguments[2]);
            }
            return;
        }
        // Forward other events with 'layers:' prefix
        arguments[0] = 'layers:' + eventName;
        this.trigger.apply(this, arguments);
    },

    _restructureOnAdd: function(cell) {

        if (cell.isLink()) {
            this._edges[cell.id] = true;
            var { source, target } = cell.attributes;
            if (source.id) {
                (this._out[source.id] || (this._out[source.id] = {}))[cell.id] = true;
            }
            if (target.id) {
                (this._in[target.id] || (this._in[target.id] = {}))[cell.id] = true;
            }
        } else {
            this._nodes[cell.id] = true;
        }
    },

    _restructureOnRemove: function(cell, _collection, options) {
        if (options.layerChange) return;

        if (cell.isLink()) {
            delete this._edges[cell.id];
            var { source, target } = cell.attributes;
            if (source.id && this._out[source.id] && this._out[source.id][cell.id]) {
                delete this._out[source.id][cell.id];
            }
            if (target.id && this._in[target.id] && this._in[target.id][cell.id]) {
                delete this._in[target.id][cell.id];
            }
        } else {
            delete this._nodes[cell.id];
        }
    },

    // restructure on the whole graph reset, e.g. when fromJSON or resetCells is called
    _restructureOnReset: function() {

        // Normalize into an array of cells. The original `collection` is GraphCells mvc collection.
        const cells = this.getCells();

        this._out = {};
        this._in = {};
        this._nodes = {};
        this._edges = {};

        cells.forEach(this._restructureOnAdd, this);
    },

    _restructureOnChangeSource: function(link) {

        var prevSource = link.previous('source');
        if (prevSource.id && this._out[prevSource.id]) {
            delete this._out[prevSource.id][link.id];
        }
        var source = link.attributes.source;
        if (source.id) {
            (this._out[source.id] || (this._out[source.id] = {}))[link.id] = true;
        }
    },

    _restructureOnChangeTarget: function(link) {

        var prevTarget = link.previous('target');
        if (prevTarget.id && this._in[prevTarget.id]) {
            delete this._in[prevTarget.id][link.id];
        }
        var target = link.get('target');
        if (target.id) {
            (this._in[target.id] || (this._in[target.id] = {}))[link.id] = true;
        }
    },

    // Return all outbound edges for the node. Return value is an object
    // of the form: [edgeId] -> true
    getOutboundEdges: function(node) {

        return (this._out && this._out[node]) || {};
    },

    // Return all inbound edges for the node. Return value is an object
    // of the form: [edgeId] -> true
    getInboundEdges: function(node) {

        return (this._in && this._in[node]) || {};
    },

    toJSON: function(opt = {}) {

        const { cellLayerCollection, cellLayersController } = this;
        // Get the graph model attributes as a base JSON.
        const json = Model.prototype.toJSON.apply(this, arguments);

        // Add `cells` array holding all the cells in the graph.
        json.cells = this.getCells().map(cell => cell.toJSON(opt.cellAttributes));

        if (cellLayersController.legacyMode) {
            // Backwards compatibility for legacy setup
            // with single default cell layer 'cells'.
            // In this case, we do not need to export cell layers.
            return json;
        }

        // Add `cellLayers` array holding all the cell layers in the graph.
        json.cellLayers = cellLayerCollection.toJSON();

        // Add `defaultCellLayer` property indicating the default cell layer ID.
        json.defaultCellLayer = cellLayersController.defaultCellLayerId;

        return json;
    },

    fromJSON: function(json, opt) {
        const { cells, cellLayers, defaultCellLayer, ...attrs } = json;

        if (!cells) {
            throw new Error('Graph JSON must contain cells array.');
        }

        if (cellLayers) {
            this.resetCellLayers(cellLayers, { ...opt, defaultCellLayer });
        }

        if (cells) {
            // Reset the cells collection.
            this.resetCells(cells, opt);
        }

        this.set(attrs, opt);

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
            sortedCells.shift().remove(opt);

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
                const layerId = cellAttributes[config.layerAttribute] || this.cellLayersController.defaultCellLayerId;
                const layer = this.cellLayersController.getCellLayer(layerId);
                // The `cell` is not part of the graph yet,
                // so no events need to be triggered.
                cellAttributes.z = layer.maxZIndex() + 1;
            }
        }

        return cellInit;
    },

    minZIndex: function(layerId) {
        return this.cellLayersController.minZIndex(layerId);
    },

    maxZIndex: function(layerId) {
        return this.cellLayersController.maxZIndex(layerId);
    },

    addCell: function(cell, opt) {

        if (Array.isArray(cell)) {
            return this.addCells(cell, opt);
        }

        this._prepareCell(cell, { ...opt, ensureZIndex: true });
        this.cellLayersController.addCell(cell, opt);

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

    // When adding a lot of cells, it is much more efficient to
    // reset the entire cells collection in one go.
    // Useful for bulk operations and optimizations.
    resetCells: function(cells, opt) {

        this.startBatch('reset', opt);

        const cellArray = util.toArray(cells);
        // Do not ensure z-index on reset for backwards compatibility
        const prepareOptions = { ...opt, ensureZIndex: false };
        for (const cell of cellArray) {
            this._prepareCell(cell, prepareOptions);
        }

        this.cellLayersController.resetCells(cellArray, opt);

        // Trigger a single `reset` event on the graph
        // (while multiple `reset` events are triggered on cell layers).
        // Backwards compatibility: use default cell layer collection
        // The `collection` parameter is retained for backwards compatibility,
        // and it is subject to removal in future releases.
        this.trigger('reset', this.getDefaultCellLayer().cellCollection, opt);

        this.stopBatch('reset', opt);

        return this;
    },

    resetCellLayers: function(cellLayers, opt) {
        this.cellLayersController.resetCellLayers(cellLayers, opt);
        return this;
    },

    removeCells: function(cells, opt) {

        if (cells.length) {

            this.startBatch('remove');
            util.invoke(cells, 'remove', opt);
            this.stopBatch('remove');
        }

        return this;
    },

    _removeCell: function(cell, collection, options) {

        options || (options = {});

        if (!options.clear) {
            // Applications might provide a `disconnectLinks` option set to `true` in order to
            // disconnect links when a cell is removed rather then removing them. The default
            // is to remove all the associated links.
            if (options.disconnectLinks) {
                this.disconnectLinks(cell, options);
            } else {
                this.removeLinks(cell, options);
            }
        }

        // Remove the cell from the cell layer
        collection.remove(cell, {
            ...options,
            cellLayersController: this.cellLayersController
        });
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

    addCellLayer(cellLayer, opt) {
        this.cellLayersController.addCellLayer(cellLayer, opt);
    },

    removeCellLayer(cellLayer, opt) {
        this.cellLayersController.removeCellLayer(cellLayer.id, opt);
    },

    getDefaultCellLayer() {
        return this.cellLayersController.getDefaultCellLayer();
    },

    setDefaultCellLayer(layerId, opt) {
        this.cellLayersController.setDefaultCellLayer(layerId, opt);
    },

    getCellLayer(layerId) {
        return this.cellLayersController.getCellLayer(layerId);
    },

    hasCellLayer(layerId) {
        return this.cellLayersController.hasCellLayer(layerId);
    },

    getCellLayers() {
        return this.cellLayersController.getCellLayers();
    },

    // Get a cell by `id`.
    getCell: function(id) {
        return this.cellLayersController.getCell(id);
    },

    getCells: function() {
        return this.cellLayersController.getCells();
    },

    getElements: function() {

        return this.getCells().filter(cell => cell.isElement());
    },

    getLinks: function() {

        return this.getCells().filter(cell => cell.isLink());
    },

    getFirstCell: function(layerId) {
        let cells;
        if (!layerId) {
            // Get the first cell from the bottommost layer
            const orderedLayers = this.getCellLayers();
            cells = orderedLayers[0].cellCollection.models;
        } else {
            cells = this.getCellLayer(layerId).cellCollection.models;
        }

        return cells[0];
    },

    getLastCell: function(layerId) {
        let cells;
        if (!layerId) {
            // Get the last cell from the topmost layer
            const orderedLayers = this.getCellLayers();
            cells = orderedLayers[orderedLayers.length - 1].cellCollection.models;
        } else {
            cells = this.getCellLayer(layerId).cellCollection.models;
        }

        return cells[cells.length - 1];
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
            util.forIn(graph.getOutboundEdges(model.id), function(_, edge) {
                // skip links that were already added
                // (those must be self-loop links)
                // (because they are inbound and outbound edges of the same two elements)
                if (edges[edge]) return;
                var link = graph.getCell(edge);
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
            util.forIn(graph.getInboundEdges(model.id), function(_, edge) {
                // skip links that were already added
                // (those must be self-loop links)
                // (because they are inbound and outbound edges of the same two elements)
                if (edges[edge]) return;
                var link = graph.getCell(edge);
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
                    util.forIn(this.getOutboundEdges(cell.id), function(exists, edge) {
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
                    util.forIn(this.getInboundEdges(cell.id), function(exists, edge) {
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

        var sources = [];
        util.forIn(this._nodes, function(exists, node) {
            if (!this._in[node] || util.isEmpty(this._in[node])) {
                sources.push(this.getCell(node));
            }
        }.bind(this));
        return sources;
    },

    // Get all the leafs of the graph. Time complexity: O(|V|).
    getSinks: function() {

        var sinks = [];
        util.forIn(this._nodes, function(exists, node) {
            if (!this._out[node] || util.isEmpty(this._out[node])) {
                sinks.push(this.getCell(node));
            }
        }.bind(this));
        return sinks;
    },

    // Return `true` if `element` is a root. Time complexity: O(1).
    isSource: function(element) {

        return !this._in[element.id] || util.isEmpty(this._in[element.id]);
    },

    // Return `true` if `element` is a leaf. Time complexity: O(1).
    isSink: function(element) {

        return !this._out[element.id] || util.isEmpty(this._out[element.id]);
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
    removeLinks: function(model, opt) {

        util.invoke(this.getConnectedLinks(model), 'remove', opt);
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
