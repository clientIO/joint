//      JointJS, the JavaScript diagramming library.
//      (c) 2011-2013 client IO

joint.dia.GraphCells = Backbone.Collection.extend({

    cellNamespace: joint.shapes,

    initialize: function(models, opt) {

        // Backbone automatically doesn't trigger re-sort if models attributes are changed later when
        // they're already in the collection. Therefore, we're triggering sort manually here.
        this.on('change:z', this.sort, this);

        // Set the optional namespace where all model classes are defined.
        if (opt.cellNamespace) {
            this.cellNamespace = opt.cellNamespace;
        }
    },

    model: function(attrs, options) {

        var namespace = options.collection.cellNamespace;

        // Find the model class in the namespace or use the default one.
        var ModelClass = (attrs.type === 'link')
            ? joint.dia.Link
            : joint.util.getByPath(namespace, attrs.type, '.') || joint.dia.Element;

        return new ModelClass(attrs, options);
    },

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator: function(model) {

        return model.get('z') || 0;
    },

    // Get all inbound and outbound links connected to the cell `model`.
    getConnectedLinks: function(model, opt) {

        opt = opt || {};

        if (_.isUndefined(opt.inbound) && _.isUndefined(opt.outbound)) {
            opt.inbound = opt.outbound = true;
        }

        var links = this.filter(function(cell) {

            if (!cell.isLink()) return false;

            var source = cell.get('source');
            var target = cell.get('target');

            return (source && source.id === model.id && opt.outbound) ||
                (target && target.id === model.id  && opt.inbound);
        });

        // option 'deep' returns all links that are connected to any of the descendent cell
        // and are not descendents itself
        if (opt.deep) {

            var embeddedCells = model.getEmbeddedCells({ deep: true });

            _.each(this.difference(links, embeddedCells), function(cell) {

                if (!cell.isLink()) return;

                if (opt.outbound) {

                    var source = cell.get('source');

                    if (source && source.id && _.find(embeddedCells, { id: source.id })) {
                        links.push(cell);
                        return; // prevent a loop link to be pushed twice
                    }
                }

                if (opt.inbound) {

                    var target = cell.get('target');

                    if (target && target.id && _.find(embeddedCells, { id: target.id })) {
                        links.push(cell);
                    }
                }
            });
        }

        return links;
    },

    getNeighbors: function(model, opt) {

        opt = opt || {};

        var neighbors = _.transform(this.getConnectedLinks(model, opt), function(res, link) {

            var source = link.get('source');
            var target = link.get('target');
            var loop = link.hasLoop(opt);

            // Discard if it is a point, or if the neighbor was already added.
            if (opt.inbound && _.has(source, 'id') && !res[source.id]) {

                var sourceElement = this.get(source.id);

                if (loop || (sourceElement !== model && (!opt.deep || !sourceElement.isEmbeddedIn(model)))) {
                    res[source.id] = sourceElement;
                }
            }

            // Discard if it is a point, or if the neighbor was already added.
            if (opt.outbound && _.has(target, 'id') && !res[target.id]) {

                var targetElement = this.get(target.id);

                if (loop || targetElement !== model && (!opt.deep || !targetElement.isEmbeddedIn(model))) {
                    res[target.id] = targetElement;
                }
            }

        }, {}, this);

        return _.values(neighbors);
    },

    getCommonAncestor: function(/* cells */) {

        var cellsAncestors = _.map(arguments, function(cell) {

            var ancestors = [cell.id];
            var parentId = cell.get('parent');

            while (parentId) {

                ancestors.push(parentId);
                parentId = this.get(parentId).get('parent');
            }

            return ancestors;

        }, this);

        cellsAncestors = _.sortBy(cellsAncestors, 'length');

        var commonAncestor = _.find(cellsAncestors.shift(), function(ancestor) {

            return _.every(cellsAncestors, function(cellAncestors) {
                return _.contains(cellAncestors, ancestor);
            });
        });

        return this.get(commonAncestor);
    },

    // Return the bounding box of all cells in array provided. If no array
    // provided returns bounding box of all cells. Links are being ignored.
    getBBox: function(cells) {

        cells = cells || this.models;

        var origin = { x: Infinity, y: Infinity };
        var corner = { x: -Infinity, y: -Infinity };

        _.each(cells, function(cell) {

            // Links has no bounding box defined on the model.
            if (cell.isLink()) return;

            var bbox = cell.getBBox();
            origin.x = Math.min(origin.x, bbox.x);
            origin.y = Math.min(origin.y, bbox.y);
            corner.x = Math.max(corner.x, bbox.x + bbox.width);
            corner.y = Math.max(corner.y, bbox.y + bbox.height);
        });

        return g.rect(origin.x, origin.y, corner.x - origin.x, corner.y - origin.y);
    }
});


joint.dia.Graph = Backbone.Model.extend({

    initialize: function(attrs, opt) {

        opt = opt || {};

        // Passing `cellModel` function in the options object to graph allows for
        // setting models based on attribute objects. This is especially handy
        // when processing JSON graphs that are in a different than JointJS format.
        Backbone.Model.prototype.set.call(this, 'cells', new joint.dia.GraphCells([], {
            model: opt.cellModel,
            cellNamespace: opt.cellNamespace
        }));

        // Make all the events fired in the `cells` collection available.
        // to the outside world.
        this.get('cells').on('all', this.trigger, this);

        this.get('cells').on('remove', this._removeCell, this);
    },

    toJSON: function() {

        // Backbone does not recursively call `toJSON()` on attributes that are themselves models/collections.
        // It just clones the attributes. Therefore, we must call `toJSON()` on the cells collection explicitely.
        var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
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
            attrs = _.omit(attrs, 'cells');
        }

        // The rest of the attributes are applied via original set method.
        return Backbone.Model.prototype.set.call(this, attrs, opt);
    },

    clear: function(opt) {

        opt = _.extend({}, opt, { clear: true });

        var collection = this.get('cells');

        if (collection.length === 0) return this;

        this.trigger('batch:start', { batchName: 'clear' });

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

        this.trigger('batch:stop', { batchName: 'clear' });

        return this;
    },

    _prepareCell: function(cell) {

        var attrs = (cell instanceof Backbone.Model) ? cell.attributes : cell;

        if (_.isUndefined(attrs.z)) {
            attrs.z = this.maxZIndex() + 1;
        }

        if (!_.isString(attrs.type)) {
            throw new TypeError('dia.Graph: cell type must be a string.');
        }

        return cell;
    },

    maxZIndex: function() {

        var lastCell = this.get('cells').last();
        return lastCell ? (lastCell.get('z') || 0) : 0;
    },

    addCell: function(cell, options) {

        if (_.isArray(cell)) {

            return this.addCells(cell, options);
        }

        this.get('cells').add(this._prepareCell(cell), options || {});

        return this;
    },

    addCells: function(cells, options) {

        options = options || {};
        options.position = cells.length;

        _.each(cells, function(cell) {
            options.position--;
            this.addCell(cell, options);
        }, this);

        return this;
    },

    // When adding a lot of cells, it is much more efficient to
    // reset the entire cells collection in one go.
    // Useful for bulk operations and optimizations.
    resetCells: function(cells, opt) {

        this.get('cells').reset(_.map(cells, this._prepareCell, this), opt);

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
    },

    // Get a cell by `id`.
    getCell: function(id) {

        return this.get('cells').get(id);
    },

    getCells: function() {

        return this.get('cells').toArray();
    },

    getElements: function() {

        return this.get('cells').filter(function(cell) {

            return cell instanceof joint.dia.Element;
        });
    },

    getLinks: function() {

        return this.get('cells').filter(function(cell) {

            return cell instanceof joint.dia.Link;
        });
    },

    // Get all inbound and outbound links connected to the cell `model`.
    getConnectedLinks: function(model, opt) {

        return this.get('cells').getConnectedLinks(model, opt);
    },

    getNeighbors: function(model, opt) {

        return this.get('cells').getNeighbors(model, opt);
    },

    // Disconnect links connected to the cell `model`.
    disconnectLinks: function(model, options) {

        _.each(this.getConnectedLinks(model), function(link) {

            link.set(link.get('source').id === model.id ? 'source' : 'target', g.point(0, 0), options);
        });
    },

    // Remove links connected to the cell `model` completely.
    removeLinks: function(model, options) {

        _.invoke(this.getConnectedLinks(model), 'remove', options);
    },

    // Find all elements at given point
    findModelsFromPoint: function(p) {

        return _.filter(this.getElements(), function(el) {
            return el.getBBox().containsPoint(p);
        });
    },

    // Find all elements in given area
    findModelsInArea: function(r) {

        return _.filter(this.getElements(), function(el) {
            return el.getBBox().intersect(r);
        });
    },

    // Find all elements under the given element.
    findModelsUnderElement: function(element, opt) {

        opt = _.defaults(opt || {}, { searchBy: 'bbox' });

        var bbox = element.getBBox();
        var elements = (opt.searchBy == 'bbox')
            ? this.findModelsInArea(bbox)
            : this.findModelsFromPoint(bbox[opt.searchBy]());

        // don't account element itself or any of its descendents
        return _.reject(elements, function(el) {
            return element.id == el.id || el.isEmbeddedIn(element);
        });
    },

    // Return the bounding box of all `elements`.
    getBBox: function(/* elements */) {

        var collection = this.get('cells');
        return collection.getBBox.apply(collection, arguments);
    },

    getCommonAncestor: function(/* cells */) {

        var collection = this.get('cells');
        return collection.getCommonAncestor.apply(collection, arguments);
    }
});
