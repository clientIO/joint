import Backbone from 'backbone';
import {
    uniqueId,
    result,
    merge,
    forIn,
    isObject,
    isEqual,
    isString,
    cloneDeep,
    omit,
    uuid,
    isEmpty,
    assign,
    uniq,
    toArray,
    defaults,
    setByPath,
    unsetByPath,
    getByPath,
    timing,
    interpolate,
    nextFrame,
    without,
    cancelFrame,
    defaultsDeep,
    has
} from '../util/util.mjs';
import { cloneCells } from '../util/cloneCells.mjs';
import { attributes } from './attributes/index.mjs';
import * as g from '../g/index.mjs';


// Cell base model.
// --------------------------

export const Cell = Backbone.Model.extend({

    // This is the same as Backbone.Model with the only difference that is uses util.merge
    // instead of just _.extend. The reason is that we want to mixin attributes set in upper classes.
    constructor: function(attributes, options) {

        var defaults;
        var attrs = attributes || {};
        this.cid = uniqueId('c');
        this.attributes = {};
        if (options && options.collection) this.collection = options.collection;
        if (options && options.parse) attrs = this.parse(attrs, options) || {};
        if ((defaults = result(this, 'defaults'))) {
            //<custom code>
            // Replaced the call to _.defaults with util.merge.
            attrs = merge({}, defaults, attrs);
            //</custom code>
        }
        this.set(attrs, options);
        this.changed = {};
        this.initialize.apply(this, arguments);
    },

    translate: function(dx, dy, opt) {

        throw new Error('Must define a translate() method.');
    },

    toJSON: function() {

        var defaultAttrs = this.constructor.prototype.defaults.attrs || {};
        var attrs = this.attributes.attrs;
        var finalAttrs = {};

        // Loop through all the attributes and
        // omit the default attributes as they are implicitly reconstructable by the cell 'type'.
        forIn(attrs, function(attr, selector) {

            var defaultAttr = defaultAttrs[selector];

            forIn(attr, function(value, name) {

                // attr is mainly flat though it might have one more level (consider the `style` attribute).
                // Check if the `value` is object and if yes, go one level deep.
                if (isObject(value) && !Array.isArray(value)) {

                    forIn(value, function(value2, name2) {

                        if (!defaultAttr || !defaultAttr[name] || !isEqual(defaultAttr[name][name2], value2)) {

                            finalAttrs[selector] = finalAttrs[selector] || {};
                            (finalAttrs[selector][name] || (finalAttrs[selector][name] = {}))[name2] = value2;
                        }
                    });

                } else if (!defaultAttr || !isEqual(defaultAttr[name], value)) {
                    // `value` is not an object, default attribute for such a selector does not exist
                    // or it is different than the attribute value set on the model.

                    finalAttrs[selector] = finalAttrs[selector] || {};
                    finalAttrs[selector][name] = value;
                }
            });
        });

        var attributes = cloneDeep(omit(this.attributes, 'attrs'));
        attributes.attrs = finalAttrs;

        return attributes;
    },

    initialize: function(options) {

        if (!options || !options.id) {

            this.set('id', this.generateId(), { silent: true });
        }

        this._transitionIds = {};

        // Collect ports defined in `attrs` and keep collecting whenever `attrs` object changes.
        this.processPorts();
        this.on('change:attrs', this.processPorts, this);
    },

    generateId: function() {
        return uuid();
    },

    /**
     * @deprecated
     */
    processPorts: function() {

        // Whenever `attrs` changes, we extract ports from the `attrs` object and store it
        // in a more accessible way. Also, if any port got removed and there were links that had `target`/`source`
        // set to that port, we remove those links as well (to follow the same behaviour as
        // with a removed element).

        var previousPorts = this.ports;

        // Collect ports from the `attrs` object.
        var ports = {};
        forIn(this.get('attrs'), function(attrs, selector) {

            if (attrs && attrs.port) {

                // `port` can either be directly an `id` or an object containing an `id` (and potentially other data).
                if (attrs.port.id !== undefined) {
                    ports[attrs.port.id] = attrs.port;
                } else {
                    ports[attrs.port] = { id: attrs.port };
                }
            }
        });

        // Collect ports that have been removed (compared to the previous ports) - if any.
        // Use hash table for quick lookup.
        var removedPorts = {};
        forIn(previousPorts, function(port, id) {

            if (!ports[id]) removedPorts[id] = true;
        });

        // Remove all the incoming/outgoing links that have source/target port set to any of the removed ports.
        if (this.graph && !isEmpty(removedPorts)) {

            var inboundLinks = this.graph.getConnectedLinks(this, { inbound: true });
            inboundLinks.forEach(function(link) {

                if (removedPorts[link.get('target').port]) link.remove();
            });

            var outboundLinks = this.graph.getConnectedLinks(this, { outbound: true });
            outboundLinks.forEach(function(link) {

                if (removedPorts[link.get('source').port]) link.remove();
            });
        }

        // Update the `ports` object.
        this.ports = ports;
    },

    remove: function(opt = {}) {

        // Store the graph in a variable because `this.graph` won't be accessible
        // after `this.trigger('remove', ...)` down below.
        const { graph, collection } = this;
        if (!graph) {
            // The collection is a common Backbone collection (not the graph collection).
            if (collection) collection.remove(this, opt);
            return this;
        }

        graph.startBatch('remove');

        // First, unembed this cell from its parent cell if there is one.
        const parentCell = this.getParentCell();
        if (parentCell) {
            parentCell.unembed(this, opt);
        }

        // Remove also all the cells, which were embedded into this cell
        const embeddedCells = this.getEmbeddedCells();
        for (let i = 0, n = embeddedCells.length; i < n; i++) {
            const embed = embeddedCells[i];
            if (embed) {
                embed.remove(opt);
            }
        }

        this.trigger('remove', this, graph.attributes.cells, opt);

        graph.stopBatch('remove');

        return this;
    },

    toFront: function(opt) {

        var graph = this.graph;
        if (graph) {

            opt = opt || {};

            var z = graph.maxZIndex();

            var cells;

            if (opt.deep) {
                cells = this.getEmbeddedCells({ deep: true, breadthFirst: opt.breadthFirst !== false });
                cells.unshift(this);
            } else {
                cells = [this];
            }

            z = z - cells.length + 1;

            var collection = graph.get('cells');
            var shouldUpdate = (collection.indexOf(this) !== (collection.length - cells.length));
            if (!shouldUpdate) {
                shouldUpdate = cells.some(function(cell, index) {
                    return cell.get('z') !== z + index;
                });
            }

            if (shouldUpdate) {
                this.startBatch('to-front');

                z = z + cells.length;

                cells.forEach(function(cell, index) {
                    cell.set('z', z + index, opt);
                });

                this.stopBatch('to-front');
            }
        }

        return this;
    },

    toBack: function(opt) {

        var graph = this.graph;
        if (graph) {

            opt = opt || {};

            var z = graph.minZIndex();

            var cells;

            if (opt.deep) {
                cells = this.getEmbeddedCells({ deep: true, breadthFirst: opt.breadthFirst !== false });
                cells.unshift(this);
            } else {
                cells = [this];
            }

            var collection = graph.get('cells');
            var shouldUpdate = (collection.indexOf(this) !== 0);
            if (!shouldUpdate) {
                shouldUpdate = cells.some(function(cell, index) {
                    return cell.get('z') !== z + index;
                });
            }

            if (shouldUpdate) {
                this.startBatch('to-back');

                z -= cells.length;

                cells.forEach(function(cell, index) {
                    cell.set('z', z + index, opt);
                });

                this.stopBatch('to-back');
            }
        }

        return this;
    },

    parent: function(parent, opt) {

        // getter
        if (parent === undefined) return this.get('parent');
        // setter
        return this.set('parent', parent, opt);
    },

    embed: function(cell, opt) {

        if (this === cell || this.isEmbeddedIn(cell)) {

            throw new Error('Recursive embedding not allowed.');

        } else {

            this.startBatch('embed');

            var embeds = assign([], this.get('embeds'));

            // We keep all element ids after link ids.
            embeds[cell.isLink() ? 'unshift' : 'push'](cell.id);

            cell.parent(this.id, opt);
            this.set('embeds', uniq(embeds), opt);

            this.stopBatch('embed');
        }

        return this;
    },

    unembed: function(cell, opt) {

        this.startBatch('unembed');

        cell.unset('parent', opt);
        this.set('embeds', without(this.get('embeds'), cell.id), opt);

        this.stopBatch('unembed');

        return this;
    },

    getParentCell: function() {

        // unlike link.source/target, cell.parent stores id directly as a string
        var parentId = this.parent();
        var graph = this.graph;

        return (parentId && graph && graph.getCell(parentId)) || null;
    },

    // Return an array of ancestor cells.
    // The array is ordered from the parent of the cell
    // to the most distant ancestor.
    getAncestors: function() {

        var ancestors = [];

        if (!this.graph) {
            return ancestors;
        }

        var parentCell = this.getParentCell();
        while (parentCell) {
            ancestors.push(parentCell);
            parentCell = parentCell.getParentCell();
        }

        return ancestors;
    },

    getEmbeddedCells: function(opt) {

        opt = opt || {};

        // Cell models can only be retrieved when this element is part of a collection.
        // There is no way this element knows about other cells otherwise.
        // This also means that calling e.g. `translate()` on an element with embeds before
        // adding it to a graph does not translate its embeds.
        if (this.graph) {

            var cells;

            if (opt.deep) {

                if (opt.breadthFirst) {

                    // breadthFirst algorithm
                    cells = [];
                    var queue = this.getEmbeddedCells();

                    while (queue.length > 0) {

                        var parent = queue.shift();
                        cells.push(parent);
                        queue.push.apply(queue, parent.getEmbeddedCells());
                    }

                } else {

                    // depthFirst algorithm
                    cells = this.getEmbeddedCells();
                    cells.forEach(function(cell) {
                        cells.push.apply(cells, cell.getEmbeddedCells(opt));
                    });
                }

            } else {

                cells = toArray(this.get('embeds')).map(this.graph.getCell, this.graph);
            }

            return cells;
        }
        return [];
    },

    isEmbeddedIn: function(cell, opt) {

        var cellId = isString(cell) ? cell : cell.id;
        var parentId = this.parent();

        opt = defaults({ deep: true }, opt);

        // See getEmbeddedCells().
        if (this.graph && opt.deep) {

            while (parentId) {
                if (parentId === cellId) {
                    return true;
                }
                parentId = this.graph.getCell(parentId).parent();
            }

            return false;

        } else {

            // When this cell is not part of a collection check
            // at least whether it's a direct child of given cell.
            return parentId === cellId;
        }
    },

    // Whether or not the cell is embedded in any other cell.
    isEmbedded: function() {

        return !!this.parent();
    },

    // Isolated cloning. Isolated cloning has two versions: shallow and deep (pass `{ deep: true }` in `opt`).
    // Shallow cloning simply clones the cell and returns a new cell with different ID.
    // Deep cloning clones the cell and all its embedded cells recursively.
    clone: function(opt) {

        opt = opt || {};

        if (!opt.deep) {
            // Shallow cloning.

            var clone = Backbone.Model.prototype.clone.apply(this, arguments);
            // We don't want the clone to have the same ID as the original.
            clone.set('id', this.generateId());
            // A shallow cloned element does not carry over the original embeds.
            clone.unset('embeds');
            // And can not be embedded in any cell
            // as the clone is not part of the graph.
            clone.unset('parent');

            return clone;

        } else {
            // Deep cloning.

            // For a deep clone, simply call `graph.cloneCells()` with the cell and all its embedded cells.
            return toArray(cloneCells([this].concat(this.getEmbeddedCells({ deep: true }))));
        }
    },

    // A convenient way to set nested properties.
    // This method merges the properties you'd like to set with the ones
    // stored in the cell and makes sure change events are properly triggered.
    // You can either set a nested property with one object
    // or use a property path.
    // The most simple use case is:
    // `cell.prop('name/first', 'John')` or
    // `cell.prop({ name: { first: 'John' } })`.
    // Nested arrays are supported too:
    // `cell.prop('series/0/data/0/degree', 50)` or
    // `cell.prop({ series: [ { data: [ { degree: 50 } ] } ] })`.
    prop: function(props, value, opt) {

        var delim = '/';
        var _isString = isString(props);

        if (_isString || Array.isArray(props)) {
            // Get/set an attribute by a special path syntax that delimits
            // nested objects by the colon character.

            if (arguments.length > 1) {

                var path;
                var pathArray;

                if (_isString) {
                    path = props;
                    pathArray = path.split('/');
                } else {
                    path = props.join(delim);
                    pathArray = props.slice();
                }

                var property = pathArray[0];
                var pathArrayLength = pathArray.length;

                opt = opt || {};
                opt.propertyPath = path;
                opt.propertyValue = value;
                opt.propertyPathArray = pathArray;

                if (pathArrayLength === 1) {
                    // Property is not nested. We can simply use `set()`.
                    return this.set(property, value, opt);
                }

                var update = {};
                // Initialize the nested object. Subobjects are either arrays or objects.
                // An empty array is created if the sub-key is an integer. Otherwise, an empty object is created.
                // Note that this imposes a limitation on object keys one can use with Inspector.
                // Pure integer keys will cause issues and are therefore not allowed.
                var initializer = update;
                var prevProperty = property;

                for (var i = 1; i < pathArrayLength; i++) {
                    var pathItem = pathArray[i];
                    var isArrayIndex = Number.isFinite(_isString ? Number(pathItem) : pathItem);
                    initializer = initializer[prevProperty] = isArrayIndex ? [] : {};
                    prevProperty = pathItem;
                }

                // Fill update with the `value` on `path`.
                update = setByPath(update, pathArray, value, '/');

                var baseAttributes = merge({}, this.attributes);
                // if rewrite mode enabled, we replace value referenced by path with
                // the new one (we don't merge).
                opt.rewrite && unsetByPath(baseAttributes, path, '/');

                // Merge update with the model attributes.
                var attributes = merge(baseAttributes, update);
                // Finally, set the property to the updated attributes.
                return this.set(property, attributes[property], opt);

            } else {

                return getByPath(this.attributes, props, delim);
            }
        }

        return this.set(merge({}, this.attributes, props), value);
    },

    // A convenient way to unset nested properties
    removeProp: function(path, opt) {

        opt = opt || {};

        var pathArray = Array.isArray(path) ? path : path.split('/');

        // Once a property is removed from the `attrs` attribute
        // the cellView will recognize a `dirty` flag and re-render itself
        // in order to remove the attribute from SVG element.
        var property = pathArray[0];
        if (property === 'attrs') opt.dirty = true;

        if (pathArray.length === 1) {
            // A top level property
            return this.unset(path, opt);
        }

        // A nested property
        var nestedPath = pathArray.slice(1);
        var propertyValue = cloneDeep(this.get(property));

        unsetByPath(propertyValue, nestedPath, '/');

        return this.set(property, propertyValue, opt);
    },

    // A convenient way to set nested attributes.
    attr: function(attrs, value, opt) {

        var args = Array.from(arguments);
        if (args.length === 0) {
            return this.get('attrs');
        }

        if (Array.isArray(attrs)) {
            args[0] = ['attrs'].concat(attrs);
        } else if (isString(attrs)) {
            // Get/set an attribute by a special path syntax that delimits
            // nested objects by the colon character.
            args[0] = 'attrs/' + attrs;

        } else {

            args[0] = { 'attrs' : attrs };
        }

        return this.prop.apply(this, args);
    },

    // A convenient way to unset nested attributes
    removeAttr: function(path, opt) {

        if (Array.isArray(path)) {

            return this.removeProp(['attrs'].concat(path));
        }

        return this.removeProp('attrs/' + path, opt);
    },

    transition: function(path, value, opt, delim) {

        delim = delim || '/';

        var defaults = {
            duration: 100,
            delay: 10,
            timingFunction: timing.linear,
            valueFunction: interpolate.number
        };

        opt = assign(defaults, opt);

        var firstFrameTime = 0;
        var interpolatingFunction;

        var setter = function(runtime) {

            var id, progress, propertyValue;

            firstFrameTime = firstFrameTime || runtime;
            runtime -= firstFrameTime;
            progress = runtime / opt.duration;

            if (progress < 1) {
                this._transitionIds[path] = id = nextFrame(setter);
            } else {
                progress = 1;
                delete this._transitionIds[path];
            }

            propertyValue = interpolatingFunction(opt.timingFunction(progress));

            opt.transitionId = id;

            this.prop(path, propertyValue, opt);

            if (!id) this.trigger('transition:end', this, path);

        }.bind(this);

        var initiator = function(callback) {

            this.stopTransitions(path);

            interpolatingFunction = opt.valueFunction(getByPath(this.attributes, path, delim), value);

            this._transitionIds[path] = nextFrame(callback);

            this.trigger('transition:start', this, path);

        }.bind(this);

        return setTimeout(initiator, opt.delay, setter);
    },

    getTransitions: function() {

        return Object.keys(this._transitionIds);
    },

    stopTransitions: function(path, delim) {

        delim = delim || '/';

        var pathArray = path && path.split(delim);

        Object.keys(this._transitionIds).filter(pathArray && function(key) {

            return isEqual(pathArray, key.split(delim).slice(0, pathArray.length));

        }).forEach(function(key) {

            cancelFrame(this._transitionIds[key]);

            delete this._transitionIds[key];

            this.trigger('transition:end', this, key);

        }, this);

        return this;
    },

    // A shorcut making it easy to create constructs like the following:
    // `var el = (new joint.shapes.basic.Rect).addTo(graph)`.
    addTo: function(graph, opt) {

        graph.addCell(this, opt);
        return this;
    },

    // A shortcut for an equivalent call: `paper.findViewByModel(cell)`
    // making it easy to create constructs like the following:
    // `cell.findView(paper).highlight()`
    findView: function(paper) {

        return paper.findViewByModel(this);
    },

    isElement: function() {

        return false;
    },

    isLink: function() {

        return false;
    },

    startBatch: function(name, opt) {

        if (this.graph) { this.graph.startBatch(name, assign({}, opt, { cell: this })); }
        return this;
    },

    stopBatch: function(name, opt) {

        if (this.graph) { this.graph.stopBatch(name, assign({}, opt, { cell: this })); }
        return this;
    },

    getChangeFlag: function(attributes) {

        var flag = 0;
        if (!attributes) return flag;
        for (var key in attributes) {
            if (!attributes.hasOwnProperty(key) || !this.hasChanged(key)) continue;
            flag |= attributes[key];
        }
        return flag;
    },

    angle: function() {

        // To be overridden.
        return 0;
    },

    position: function() {

        // To be overridden.
        return new g.Point(0, 0);
    },

    getPointFromConnectedLink: function() {

        // To be overridden
        return new g.Point();
    },

    getBBox: function() {

        // To be overridden
        return new g.Rect(0, 0, 0, 0);
    }

}, {

    getAttributeDefinition: function(attrName) {

        var defNS = this.attributes;
        var globalDefNS = attributes;
        return (defNS && defNS[attrName]) || globalDefNS[attrName];
    },

    define: function(type, defaults, protoProps, staticProps) {

        protoProps = assign({
            defaults: defaultsDeep({ type: type }, defaults, this.prototype.defaults)
        }, protoProps);

        var Cell = this.extend(protoProps, staticProps);
        // es5 backward compatibility
        /* global joint: true */
        if (typeof joint !== 'undefined' && has(joint, 'shapes')) {
            setByPath(joint.shapes, type, Cell, '.');
        }
        /* global joint: false */
        return Cell;
    }
});

