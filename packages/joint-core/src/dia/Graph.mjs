import * as util from '../util/index.mjs';
import * as g from '../g/index.mjs';

import { Model } from '../mvc/Model.mjs';
import { Collection } from '../mvc/Collection.mjs';
import { wrappers, wrapWith } from '../util/wrappers.mjs';
import { cloneCells } from '../util/index.mjs';

const GraphCells = Collection.extend({

    initialize: function(models, opt) {

        // Set the optional namespace where all model classes are defined.
        if (opt.cellNamespace) {
            this.cellNamespace = opt.cellNamespace;
        } else {
            /* eslint-disable no-undef */
            this.cellNamespace = typeof joint !== 'undefined' && util.has(joint, 'shapes') ? joint.shapes : null;
            /* eslint-enable no-undef */
        }


        this.graph = opt.graph;
    },

    model: function(attrs, opt) {

        const collection = opt.collection;
        const namespace = collection.cellNamespace;
        const { type } = attrs;

        // Find the model class based on the `type` attribute in the cell namespace
        const ModelClass = util.getByPath(namespace, type, '.');
        if (!ModelClass) {
            throw new Error(`dia.Graph: Could not find cell constructor for type: '${type}'. Make sure to add the constructor to 'cellNamespace'.`);
        }

        const cell = new ModelClass(attrs, opt);
        // Add a reference to the graph. It is necessary to do this here because this is the earliest place
        // where a new model is created from a plain JS object. For other objects, see `joint.dia.Graph>>_prepareCell()`.
        if (!opt.dry) {
            cell.graph = collection.graph;
        }

        return cell;
    },

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator: function(model) {

        return model.get('z') || 0;
    }
});


export const Graph = Model.extend({

    initialize: function(attrs, opt) {

        opt = opt || {};

        // Passing `cellModel` function in the options object to graph allows for
        // setting models based on attribute objects. This is especially handy
        // when processing JSON graphs that are in a different than JointJS format.
        var cells = new GraphCells([], {
            model: opt.cellModel,
            cellNamespace: opt.cellNamespace,
            graph: this
        });
        Model.prototype.set.call(this, 'cells', cells);

        // Make all the events fired in the `cells` collection available.
        // to the outside world.
        cells.on('all', this.trigger, this);

        // JointJS automatically doesn't trigger re-sort if models attributes are changed later when
        // they're already in the collection. Therefore, we're triggering sort manually here.
        this.on('change:z', this._sortOnChangeZ, this);

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

        cells.on('add', this._restructureOnAdd, this);
        cells.on('remove', this._restructureOnRemove, this);
        cells.on('reset', this._restructureOnReset, this);
        cells.on('change:source', this._restructureOnChangeSource, this);
        cells.on('change:target', this._restructureOnChangeTarget, this);
        cells.on('remove', this._removeCell, this);
    },

    _sortOnChangeZ: function() {

        this.get('cells').sort();
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

    _restructureOnRemove: function(cell) {

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

    _restructureOnReset: function(cells) {

        // Normalize into an array of cells. The original `cells` is GraphCells mvc collection.
        cells = cells.models;

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

    toJSON: function() {

        // JointJS does not recursively call `toJSON()` on attributes that are themselves models/collections.
        // It just clones the attributes. Therefore, we must call `toJSON()` on the cells collection explicitly.
        var json = Model.prototype.toJSON.apply(this, arguments);
        json.cells = this.get('cells').toJSON();
        return json;
    },

    fromJSON: function(json, opt) {

        if (!json.cells) {

            throw new Error('Graph JSON must contain cells array.');
        }

        return this.set(json, opt);
    },

    set: function(key, val, opt) {

        var attrs;

        // Handle both `key`, value and {key: value} style arguments.
        if (typeof key === 'object') {
            attrs = key;
            opt = val;
        } else {
            (attrs = {})[key] = val;
        }

        // Make sure that `cells` attribute is handled separately via resetCells().
        if (attrs.hasOwnProperty('cells')) {
            this.resetCells(attrs.cells, opt);
            attrs = util.omit(attrs, 'cells');
        }

        // The rest of the attributes are applied via original set method.
        return Model.prototype.set.call(this, attrs, opt);
    },

    clear: function(opt) {

        opt = util.assign({}, opt, { clear: true });

        var collection = this.get('cells');

        if (collection.length === 0) return this;

        this.startBatch('clear', opt);

        // The elements come after the links.
        var cells = collection.sortBy(function(cell) {
            return cell.isLink() ? 1 : 2;
        });

        do {

            // Remove all the cells one by one.
            // Note that all the links are removed first, so it's
            // safe to remove the elements without removing the connected
            // links first.
            cells.shift().remove(opt);

        } while (cells.length > 0);

        this.stopBatch('clear');

        return this;
    },

    _prepareCell: function(cell, opt) {

        var attrs;
        if (cell instanceof Model) {
            attrs = cell.attributes;
            if (!cell.graph && (!opt || !opt.dry)) {
                // An element can not be member of more than one graph.
                // A cell stops being the member of the graph after it's explicitly removed.
                cell.graph = this;
            }
        } else {
            // In case we're dealing with a plain JS object, we have to set the reference
            // to the `graph` right after the actual model is created. This happens in the `model()` function
            // of `joint.dia.GraphCells`.
            attrs = cell;
        }

        if (!util.isString(attrs.type)) {
            throw new TypeError('dia.Graph: cell type must be a string.');
        }

        return cell;
    },

    minZIndex: function() {

        var firstCell = this.get('cells').first();
        return firstCell ? (firstCell.get('z') || 0) : 0;
    },

    maxZIndex: function() {

        var lastCell = this.get('cells').last();
        return lastCell ? (lastCell.get('z') || 0) : 0;
    },

    addCell: function(cell, opt) {

        if (Array.isArray(cell)) {

            return this.addCells(cell, opt);
        }

        if (cell instanceof Model) {

            if (!cell.has('z')) {
                cell.set('z', this.maxZIndex() + 1);
            }

        } else if (cell.z === undefined) {

            cell.z = this.maxZIndex() + 1;
        }

        this.get('cells').add(this._prepareCell(cell, opt), opt || {});

        return this;
    },

    addCells: function(cells, opt) {

        if (cells.length === 0) return this;

        cells = util.flattenDeep(cells);
        opt.maxPosition = opt.position = cells.length - 1;

        this.startBatch('add', opt);
        cells.forEach(function(cell) {
            this.addCell(cell, opt);
            opt.position--;
        }, this);
        this.stopBatch('add', opt);

        return this;
    },

    // When adding a lot of cells, it is much more efficient to
    // reset the entire cells collection in one go.
    // Useful for bulk operations and optimizations.
    resetCells: function(cells, opt) {

        var preparedCells = util.toArray(cells).map(function(cell) {
            return this._prepareCell(cell, opt);
        }, this);
        this.get('cells').reset(preparedCells, opt);

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

        options = options || {};

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
        // Silently remove the cell from the cells collection. Silently, because
        // `joint.dia.Cell.prototype.remove` already triggers the `remove` event which is
        // then propagated to the graph model. If we didn't remove the cell silently, two `remove` events
        // would be triggered on the graph model.
        this.get('cells').remove(cell, { silent: true });

        if (cell.graph === this) {
            // Remove the element graph reference only if the cell is the member of this graph.
            cell.graph = null;
        }
    },

    // Get a cell by `id`.
    getCell: function(id) {

        return this.get('cells').get(id);
    },

    getCells: function() {

        return this.get('cells').toArray();
    },

    getElements: function() {

        return this.get('cells').toArray().filter(cell => cell.isElement());
    },

    getLinks: function() {

        return this.get('cells').toArray().filter(cell => cell.isLink());
    },

    getFirstCell: function() {

        return this.get('cells').first();
    },

    getLastCell: function() {

        return this.get('cells').last();
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

    // Find all elements at given point
    findModelsFromPoint: function(p) {
        return this.getElements().filter(el => el.getBBox({ rotate: true }).containsPoint(p));
    },

    // Find all elements in given area
    findModelsInArea: function(rect, opt = {}) {
        const r = new g.Rect(rect);
        const { strict = false } = opt;
        const method = strict ? 'containsRect' : 'intersect';
        return this.getElements().filter(el => r[method](el.getBBox({ rotate: true })));
    },

    // Find all elements under the given element.
    findModelsUnderElement: function(element, opt = {}) {
        const { searchBy = 'bbox' } = opt;
        const bbox = element.getBBox().rotateAroundCenter(element.angle());
        const elements = (searchBy === 'bbox')
            ? this.findModelsInArea(bbox)
            : this.findModelsFromPoint(util.getRectPoint(bbox, searchBy));
        // don't account element itself or any of its descendants
        return elements.filter(el => element.id !== el.id && !el.isEmbeddedIn(element));
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
