import Backbone from 'backbone';
import * as util from './util';
import { attributesNS as attributes } from './attributes';

export const Cell = Backbone.Model.extend({

    // This is the same as Backbone.Model with the only difference that is uses util.merge
    // instead of just _.extend. The reason is that we want to mixin attributes set in upper classes.
    constructor: function(attributes, options) {

        let defaults;
        let attrs = attributes || {};
        this.cid = util.uniqueId('c');
        this.attributes = {};
        if (options && options.collection) this.collection = options.collection;
        if (options && options.parse) attrs = this.parse(attrs, options) || {};
        if ((defaults = util.result(this, 'defaults'))) {
            //<custom code>
            // Replaced the call to _.defaults with util.merge.
            attrs = util.merge({}, defaults, attrs);
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

        const defaultAttrs = this.constructor.prototype.defaults.attrs || {};
        const attrs = this.attributes.attrs;
        const finalAttrs = {};

        // Loop through all the attributes and
        // omit the default attributes as they are implicitly reconstructable by the cell 'type'.
        util.forIn(attrs, function(attr, selector) {

            const defaultAttr = defaultAttrs[selector];

            util.forIn(attr, function(value, name) {

                // attr is mainly flat though it might have one more level (consider the `style` attribute).
                // Check if the `value` is object and if yes, go one level deep.
                if (util.isObject(value) && !Array.isArray(value)) {

                    util.forIn(value, function(value2, name2) {

                        if (!defaultAttr || !defaultAttr[name] || !util.isEqual(defaultAttr[name][name2], value2)) {

                            finalAttrs[selector] = finalAttrs[selector] || {};
                            (finalAttrs[selector][name] || (finalAttrs[selector][name] = {}))[name2] = value2;
                        }
                    });

                } else if (!defaultAttr || !util.isEqual(defaultAttr[name], value)) {
                    // `value` is not an object, default attribute for such a selector does not exist
                    // or it is different than the attribute value set on the model.

                    finalAttrs[selector] = finalAttrs[selector] || {};
                    finalAttrs[selector][name] = value;
                }
            });
        });

        const attributes = util.cloneDeep(util.omit(this.attributes, 'attrs'));
        //const attributes = JSON.parse(JSON.stringify(_.omit(this.attributes, 'attrs')));
        attributes.attrs = finalAttrs;

        return attributes;
    },

    initialize: function(options) {

        if (!options || !options.id) {

            this.set('id', util.uuid(), { silent: true });
        }

        this._transitionIds = {};

        // Collect ports defined in `attrs` and keep collecting whenever `attrs` object changes.
        this.processPorts();
        this.on('change:attrs', this.processPorts, this);
    },

    /**
     * @deprecated
     */
    processPorts: function() {

        // Whenever `attrs` changes, we extract ports from the `attrs` object and store it
        // in a more accessible way. Also, if any port got removed and there were links that had `target`/`source`
        // set to that port, we remove those links as well (to follow the same behaviour as
        // with a removed element).

        const previousPorts = this.ports;

        // Collect ports from the `attrs` object.
        const ports = {};
        util.forIn(this.get('attrs'), function(attrs, selector) {

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
        const removedPorts = {};
        util.forIn(previousPorts, function(port, id) {

            if (!ports[id]) removedPorts[id] = true;
        });

        // Remove all the incoming/outgoing links that have source/target port set to any of the removed ports.
        if (this.graph && !util.isEmpty(removedPorts)) {

            const inboundLinks = this.graph.getConnectedLinks(this, { inbound: true });
            inboundLinks.forEach(function(link) {

                if (removedPorts[link.get('target').port]) link.remove();
            });

            const outboundLinks = this.graph.getConnectedLinks(this, { outbound: true });
            outboundLinks.forEach(function(link) {

                if (removedPorts[link.get('source').port]) link.remove();
            });
        }

        // Update the `ports` object.
        this.ports = ports;
    },

    remove: function(opt) {

        opt = opt || {};

        // Store the graph in a variable because `this.graph` won't' be accessbile after `this.trigger('remove', ...)` down below.
        const graph = this.graph;
        if (!graph) {
            // The collection is a common backbone collection (not the graph collection).
            if (this.collection) this.collection.remove(this, opt);
            return this;
        }

        graph.startBatch('remove');

        // First, unembed this cell from its parent cell if there is one.
        const parentCell = this.getParentCell();
        if (parentCell) parentCell.unembed(this);

        // Remove also all the cells, which were embedded into this cell
        const embeddedCells = this.getEmbeddedCells();
        for (let i = 0, n = embeddedCells.length; i < n; i++) {
            const embed = embeddedCells[i];
            if (embed) embed.remove(opt);
        }

        this.trigger('remove', this, graph.attributes.cells, opt);

        graph.stopBatch('remove');

        return this;
    },

    toFront: function(opt) {

        const graph = this.graph;
        if (graph) {

            opt = opt || {};

            let z = graph.maxZIndex();

            let cells;

            if (opt.deep) {
                cells = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                cells.unshift(this);
            } else {
                cells = [this];
            }

            z = z - cells.length + 1;

            const collection = graph.get('cells');
            let shouldUpdate = (collection.indexOf(this) !== (collection.length - cells.length));
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

        const graph = this.graph;
        if (graph) {

            opt = opt || {};

            let z = graph.minZIndex();

            let cells;

            if (opt.deep) {
                cells = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                cells.unshift(this);
            } else {
                cells = [this];
            }

            const collection = graph.get('cells');
            let shouldUpdate = (collection.indexOf(this) !== 0);
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

            const embeds = util.assign([], this.get('embeds'));

            // We keep all element ids after link ids.
            embeds[cell.isLink() ? 'unshift' : 'push'](cell.id);

            cell.parent(this.id, opt);
            this.set('embeds', util.uniq(embeds), opt);

            this.stopBatch('embed');
        }

        return this;
    },

    unembed: function(cell, opt) {

        this.startBatch('unembed');

        cell.unset('parent', opt);
        this.set('embeds', util.without(this.get('embeds'), cell.id), opt);

        this.stopBatch('unembed');

        return this;
    },

    getParentCell: function() {

        // unlike link.source/target, cell.parent stores id directly as a string
        const parentId = this.parent();
        const graph = this.graph;

        return (parentId && graph && graph.getCell(parentId)) || null;
    },

    // Return an array of ancestor cells.
    // The array is ordered from the parent of the cell
    // to the most distant ancestor.
    getAncestors: function() {

        const ancestors = [];

        if (!this.graph) {
            return ancestors;
        }

        let parentCell = this.getParentCell();
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

            let cells;

            if (opt.deep) {

                if (opt.breadthFirst) {

                    // breadthFirst algorithm
                    cells = [];
                    const queue = this.getEmbeddedCells();

                    while (queue.length > 0) {

                        const parent = queue.shift();
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

                cells = util.toArray(this.get('embeds')).map(this.graph.getCell, this.graph);
            }

            return cells;
        }
        return [];
    },

    isEmbeddedIn: function(cell, opt) {

        const cellId = util.isString(cell) ? cell : cell.id;
        let parentId = this.parent();

        opt = util.defaults({ deep: true }, opt);

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

            const clone = Backbone.Model.prototype.clone.apply(this, arguments);
            // We don't want the clone to have the same ID as the original.
            clone.set('id', util.uuid());
            // A shallow cloned element does not carry over the original embeds.
            clone.unset('embeds');
            // And can not be embedded in any cell
            // as the clone is not part of the graph.
            clone.unset('parent');

            return clone;

        } else {
            // Deep cloning.

            // For a deep clone, simply call `graph.cloneCells()` with the cell and all its embedded cells.
            return util.toArray(util.cloneCells.call(null, [this].concat(this.getEmbeddedCells({ deep: true }))));
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

        const delim = '/';
        const isString = util.isString(props);

        if (isString || Array.isArray(props)) {
            // Get/set an attribute by a special path syntax that delimits
            // nested objects by the colon character.

            if (arguments.length > 1) {

                let path;
                let pathArray;

                if (isString) {
                    path = props;
                    pathArray = path.split('/');
                } else {
                    path = props.join(delim);
                    pathArray = props.slice();
                }

                const property = pathArray[0];
                const pathArrayLength = pathArray.length;

                opt = opt || {};
                opt.propertyPath = path;
                opt.propertyValue = value;
                opt.propertyPathArray = pathArray;

                if (pathArrayLength === 1) {
                    // Property is not nested. We can simply use `set()`.
                    return this.set(property, value, opt);
                }

                let update = {};
                // Initialize the nested object. Subobjects are either arrays or objects.
                // An empty array is created if the sub-key is an integer. Otherwise, an empty object is created.
                // Note that this imposes a limitation on object keys one can use with Inspector.
                // Pure integer keys will cause issues and are therefore not allowed.
                let initializer = update;
                let prevProperty = property;

                for (let i = 1; i < pathArrayLength; i++) {
                    const pathItem = pathArray[i];
                    const isArrayIndex = Number.isFinite(isString ? Number(pathItem) : pathItem);
                    initializer = initializer[prevProperty] = isArrayIndex ? [] : {};
                    prevProperty = pathItem;
                }

                // Fill update with the `value` on `path`.
                update = util.setByPath(update, pathArray, value, '/');

                const baseAttributes = util.merge({}, this.attributes);
                // if rewrite mode enabled, we replace value referenced by path with
                // the new one (we don't merge).
                opt.rewrite && util.unsetByPath(baseAttributes, path, '/');

                // Merge update with the model attributes.
                const attributes = util.merge(baseAttributes, update);
                // Finally, set the property to the updated attributes.
                return this.set(property, attributes[property], opt);

            } else {

                return util.getByPath(this.attributes, props, delim);
            }
        }

        return this.set(util.merge({}, this.attributes, props), value);
    },

    // A convenient way to unset nested properties
    removeProp: function(path, opt) {

        // Once a property is removed from the `attrs` attribute
        // the cellView will recognize a `dirty` flag and rerender itself
        // in order to remove the attribute from SVG element.
        opt = opt || {};
        opt.dirty = true;

        const pathArray = Array.isArray(path) ? path : path.split('/');

        if (pathArray.length === 1) {
            // A top level property
            return this.unset(path, opt);
        }

        // A nested property
        const property = pathArray[0];
        const nestedPath = pathArray.slice(1);
        const propertyValue = util.cloneDeep(this.get(property));

        util.unsetByPath(propertyValue, nestedPath, '/');

        return this.set(property, propertyValue, opt);
    },

    // A convenient way to set nested attributes.
    attr: function(attrs, value, opt) {

        const args = Array.from(arguments);
        if (args.length === 0) {
            return this.get('attrs');
        }

        if (Array.isArray(attrs)) {
            args[0] = ['attrs'].concat(attrs);
        } else if (util.isString(attrs)) {
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

        const defaults = {
            duration: 100,
            delay: 10,
            timingFunction: util.timing.linear,
            valueFunction: util.interpolate.number
        };

        opt = util.assign(defaults, opt);

        let firstFrameTime = 0;
        let interpolatingFunction;

        const setter = function(runtime) {

            let id, progress, propertyValue;

            firstFrameTime = firstFrameTime || runtime;
            runtime -= firstFrameTime;
            progress = runtime / opt.duration;

            if (progress < 1) {
                this._transitionIds[path] = id = util.nextFrame(setter);
            } else {
                progress = 1;
                delete this._transitionIds[path];
            }

            propertyValue = interpolatingFunction(opt.timingFunction(progress));

            opt.transitionId = id;

            this.prop(path, propertyValue, opt);

            if (!id) this.trigger('transition:end', this, path);

        }.bind(this);

        const initiator = function(callback) {

            this.stopTransitions(path);

            interpolatingFunction = opt.valueFunction(util.getByPath(this.attributes, path, delim), value);

            this._transitionIds[path] = util.nextFrame(callback);

            this.trigger('transition:start', this, path);

        }.bind(this);

        return setTimeout(initiator, opt.delay, setter);
    },

    getTransitions: function() {

        return Object.keys(this._transitionIds);
    },

    stopTransitions: function(path, delim) {

        delim = delim || '/';

        const pathArray = path && path.split(delim);

        Object.keys(this._transitionIds).filter(pathArray && function(key) {

            return util.isEqual(pathArray, key.split(delim).slice(0, pathArray.length));

        }).forEach(function(key) {

            util.cancelFrame(this._transitionIds[key]);

            delete this._transitionIds[key];

            this.trigger('transition:end', this, key);

        }, this);

        return this;
    },

    // A shorcut making it easy to create constructs like the following:
    // `const el = (new joint.shapes.basic.Rect).addTo(graph)`.
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

        if (this.graph) { this.graph.startBatch(name, util.assign({}, opt, { cell: this })); }
        return this;
    },

    stopBatch: function(name, opt) {

        if (this.graph) { this.graph.stopBatch(name, util.assign({}, opt, { cell: this })); }
        return this;
    }

}, {

    getAttributeDefinition: function(attrName) {

        const defNS = this.attributes;
        const globalDefNS = attributes;
        return (defNS && defNS[attrName]) || globalDefNS[attrName];
    },

    define: function(type, defaults, protoProps, staticProps) {

        protoProps = util.assign({
            defaults: util.defaultsDeep({ type: type }, defaults, this.prototype.defaults)
        }, protoProps);

        const Cell = this.extend(protoProps, staticProps);
        //TODO v.talas es6 shapes
        util.setByPath(joint.shapes, type, Cell, '.');
        return Cell;
    }
});

