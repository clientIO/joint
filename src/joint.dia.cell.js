//      JointJS.
//      (c) 2011-2013 client IO


if (typeof exports === 'object') {

    var joint = {
        util: require('./core').util,
        dia: {
            Link: require('./joint.dia.link').Link
        }
    };
    var Backbone = require('backbone');
    var _ = require('lodash');
}


// joint.dia.Cell base model.
// --------------------------

joint.dia.Cell = Backbone.Model.extend({

    // This is the same as Backbone.Model with the only difference that is uses _.merge
    // instead of just _.extend. The reason is that we want to mixin attributes set in upper classes.
    constructor: function(attributes, options) {

        var defaults;
        var attrs = attributes || {};
        this.cid = _.uniqueId('c');
        this.attributes = {};
        if (options && options.collection) this.collection = options.collection;
        if (options && options.parse) attrs = this.parse(attrs, options) || {};
        if (defaults = _.result(this, 'defaults')) {
            //<custom code>
            // Replaced the call to _.defaults with _.merge.
            attrs = _.merge({}, defaults, attrs);
            //</custom code>
        }
        this.set(attrs, options);
        this.changed = {};
        this.initialize.apply(this, arguments);
    },

    toJSON: function() {

        var defaultAttrs = this.constructor.prototype.defaults.attrs || {};
        var attrs = this.attributes.attrs;
        var finalAttrs = {};

        // Loop through all the attributes and
        // omit the default attributes as they are implicitly reconstructable by the cell 'type'.
        _.each(attrs, function(attr, selector) {

            var defaultAttr = defaultAttrs[selector];

            _.each(attr, function(value, name) {
                
                // attr is mainly flat though it might have one more level (consider the `style` attribute).
                // Check if the `value` is object and if yes, go one level deep.
                if (_.isObject(value) && !_.isArray(value)) {
                    
                    _.each(value, function(value2, name2) {

                        if (!defaultAttr || !defaultAttr[name] || !_.isEqual(defaultAttr[name][name2], value2)) {

                            finalAttrs[selector] = finalAttrs[selector] || {};
                            (finalAttrs[selector][name] || (finalAttrs[selector][name] = {}))[name2] = value2;
                        }
                    });

                } else if (!defaultAttr || !_.isEqual(defaultAttr[name], value)) {
                    // `value` is not an object, default attribute for such a selector does not exist
                    // or it is different than the attribute value set on the model.

                    finalAttrs[selector] = finalAttrs[selector] || {};
                    finalAttrs[selector][name] = value;
                }
            });
        });

        var attributes = _.cloneDeep(_.omit(this.attributes, 'attrs'));
        //var attributes = JSON.parse(JSON.stringify(_.omit(this.attributes, 'attrs')));
        attributes.attrs = finalAttrs;

        return attributes;
    },

    initialize: function(options) {

        if (!options || !options.id) {

            this.set('id', joint.util.uuid(), { silent: true });
        }

	this._transitionIds = {};

        // Collect ports defined in `attrs` and keep collecting whenever `attrs` object changes.
        this.processPorts();
        this.on('change:attrs', this.processPorts, this);
    },

    processPorts: function() {

        // Whenever `attrs` changes, we extract ports from the `attrs` object and store it
        // in a more accessible way. Also, if any port got removed and there were links that had `target`/`source`
        // set to that port, we remove those links as well (to follow the same behaviour as
        // with a removed element).

        var previousPorts = this.ports;

        // Collect ports from the `attrs` object.
        var ports = {};
        _.each(this.get('attrs'), function(attrs, selector) {

            if (attrs && attrs.port) {

                // `port` can either be directly an `id` or an object containing an `id` (and potentially other data).
                if (!_.isUndefined(attrs.port.id)) {
                    ports[attrs.port.id] = attrs.port;
                } else {
                    ports[attrs.port] = { id: attrs.port };
                }
            }
        });

        // Collect ports that have been removed (compared to the previous ports) - if any.
        // Use hash table for quick lookup.
        var removedPorts = {};
        _.each(previousPorts, function(port, id) {

            if (!ports[id]) removedPorts[id] = true;
        });

        // Remove all the incoming/outgoing links that have source/target port set to any of the removed ports.
        if (this.collection && !_.isEmpty(removedPorts)) {
            
            var inboundLinks = this.collection.getConnectedLinks(this, { inbound: true });
            _.each(inboundLinks, function(link) {

                if (removedPorts[link.get('target').port]) link.remove();
            });

            var outboundLinks = this.collection.getConnectedLinks(this, { outbound: true });
            _.each(outboundLinks, function(link) {

                if (removedPorts[link.get('source').port]) link.remove();
            });
        }

        // Update the `ports` object.
        this.ports = ports;
    },

    remove: function(options) {

	var collection = this.collection;

	if (collection) {
	    collection.trigger('batch:start');
	}

        // First, unembed this cell from its parent cell if there is one.
        var parentCellId = this.get('parent');
        if (parentCellId) {
            
            var parentCell = this.collection && this.collection.get(parentCellId);
            parentCell.unembed(this);
        }
        
        _.invoke(this.getEmbeddedCells(), 'remove', options);
        
        this.trigger('remove', this, this.collection, options);

	if (collection) {
	    collection.trigger('batch:stop');
	}

	return this;
    },

    toFront: function(opt) {

        if (this.collection) {

            opt = opt || {};

            var z = (this.collection.last().get('z') || 0) + 1;

            this.trigger('batch:start').set('z', z, opt);

            if (opt.deep) {

                var cells = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                _.each(cells, function(cell) { cell.set('z', ++z, opt); });

            }

            this.trigger('batch:stop');
        }

	return this;
    },

    toBack: function(opt) {

        if (this.collection) {

            opt = opt || {};
            
            var z = (this.collection.first().get('z') || 0) - 1;

            this.trigger('batch:start');

            if (opt.deep) {

                var cells = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                _.eachRight(cells, function(cell) { cell.set('z', z--, opt); });

            }

            this.set('z', z, opt).trigger('batch:stop');
        }

	return this;
    },

    embed: function(cell, opt) {

	if (this == cell || this.isEmbeddedIn(cell)) {

	    throw new Error('Recursive embedding not allowed.');

	} else {

	    this.trigger('batch:start');

            var embeds = _.clone(this.get('embeds') || []);

            // We keep all element ids after links ids.
            embeds[cell.isLink() ? 'unshift' : 'push'](cell.id);

	    cell.set('parent', this.id, opt);
	    this.set('embeds', _.uniq(embeds), opt);

	    this.trigger('batch:stop');
	}

	return this;
    },

    unembed: function(cell, opt) {

	this.trigger('batch:start');

        cell.unset('parent', opt);
        this.set('embeds', _.without(this.get('embeds'), cell.id), opt);

	this.trigger('batch:stop');

	return this;
    },

    getEmbeddedCells: function(opt) {

        opt = opt || {};

        // Cell models can only be retrieved when this element is part of a collection.
        // There is no way this element knows about other cells otherwise.
        // This also means that calling e.g. `translate()` on an element with embeds before
        // adding it to a graph does not translate its embeds.
        if (this.collection) {

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
                    _.each(cells, function(cell) {
                        cells.push.apply(cells, cell.getEmbeddedCells(opt));
                    });
                }

            } else {

                cells = _.map(this.get('embeds'), this.collection.get, this.collection);
            }

            return cells;
        }
        return [];
    },

    isEmbeddedIn: function(cell, opt) {

        var cellId = _.isString(cell) ? cell : cell.id;

        opt = _.defaults({ deep: true }, opt);

        var parentId = this.get('parent');

        // See getEmbeddedCells().
        if (this.collection && opt.deep) {

            while (parentId) {
                if (parentId == cellId) {
                    return true;
                }
                parentId = this.collection.get(parentId).get('parent');
            }

            return false;

        } else {

            // When this cell is not part of a collection check
            // at least whether it's a direct child of given cell.
            return parentId == cellId;
        }
    },

    clone: function(opt) {

        opt = opt || {};

        var clone = Backbone.Model.prototype.clone.apply(this, arguments);
        
        // We don't want the clone to have the same ID as the original.
        clone.set('id', joint.util.uuid(), { silent: true });
        clone.set('embeds', '');

        if (!opt.deep) return clone;

        // The rest of the `clone()` method deals with embeds. If `deep` option is set to `true`,
        // the return value is an array of all the embedded clones created.

        var embeds = _.sortBy(this.getEmbeddedCells(), function(cell) {
            // Sort embeds that links come before elements.
            return cell instanceof joint.dia.Element;
        });

        var clones = [clone];

        // This mapping stores cloned links under the `id`s of they originals.
        // This prevents cloning a link more then once. Consider a link 'self loop' for example.
        var linkCloneMapping = {};
        
        _.each(embeds, function(embed) {

            var embedClones = embed.clone({ deep: true });

            // Embed the first clone returned from `clone({ deep: true })` above. The first
            // cell is always the clone of the cell that called the `clone()` method, i.e. clone of `embed` in this case.
            clone.embed(embedClones[0]);

            _.each(embedClones, function(embedClone) {

                if (embedClone instanceof joint.dia.Link) {

                    if (embedClone.get('source').id == this.id) {

                        embedClone.prop('source', { id: clone.id });
                    }

                    if (embedClone.get('target').id == this.id) {

                        embedClone.prop('target', { id: clone.id });
                    }

                    linkCloneMapping[embed.id] = embedClone;

                    // Skip links. Inbound/outbound links are not relevant for them.
                    return;
                }

                clones.push(embedClone);

                // Collect all inbound links, clone them (if not done already) and set their target to the `embedClone.id`.
                var inboundLinks = this.collection.getConnectedLinks(embed, { inbound: true });

                _.each(inboundLinks, function(link) {

                    var linkClone = linkCloneMapping[link.id] || link.clone();

                    // Make sure we don't clone a link more then once.
                    linkCloneMapping[link.id] = linkClone;

                    linkClone.prop('target', { id: embedClone.id });
                });

                // Collect all inbound links, clone them (if not done already) and set their source to the `embedClone.id`.
                var outboundLinks = this.collection.getConnectedLinks(embed, { outbound: true });

                _.each(outboundLinks, function(link) {

                    var linkClone = linkCloneMapping[link.id] || link.clone();

                    // Make sure we don't clone a link more then once.
                    linkCloneMapping[link.id] = linkClone;

                    linkClone.prop('source', { id: embedClone.id });
                });

            }, this);
            
        }, this);

        // Add link clones to the array of all the new clones.
        clones = clones.concat(_.values(linkCloneMapping));

        return clones;
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

        if (_.isString(props)) {
            // Get/set an attribute by a special path syntax that delimits
            // nested objects by the colon character.

            if (typeof value !== 'undefined') {

		var path = props;
		var pathArray = path.split('/');
		var property = pathArray[0];

                opt = opt || {};
                opt.propertyPath = path;
                opt.propertyValue = value;

	        if (pathArray.length == 1) {
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
		_.each(_.rest(pathArray), function(key) {
                    initializer = initializer[prevProperty] = (_.isFinite(Number(key)) ? [] : {});
                    prevProperty = key;
		});
		// Fill update with the `value` on `path`.
		update = joint.util.setByPath(update, path, value, '/');

                var baseAttributes = _.merge({}, this.attributes);
                // if rewrite mode enabled, we replace value referenced by path with
                // the new one (we don't merge).
                opt.rewrite && joint.util.unsetByPath(baseAttributes, path, '/');

		// Merge update with the model attributes.
		var attributes = _.merge(baseAttributes, update);
		// Finally, set the property to the updated attributes.
		return this.set(property, attributes[property], opt);

            } else {

                return joint.util.getByPath(this.attributes, props, delim);
            }
        }

        return this.set(_.merge({}, this.attributes, props), value);
    },

    // A convenient way to set nested attributes.
    attr: function(attrs, value, opt) {
        
        if (_.isString(attrs)) {
            // Get/set an attribute by a special path syntax that delimits
            // nested objects by the colon character.
            return this.prop('attrs/' + attrs, value, opt);
        }
        
        return this.prop({ 'attrs': attrs }, value);
    },

    // A convenient way to unset nested attributes
    removeAttr: function(path, opt) {

        if (_.isArray(path)) {
            _.each(path, function(p) { this.removeAttr(p, opt); }, this);
            return this;
        }
        
        var attrs = joint.util.unsetByPath(_.merge({}, this.get('attrs')), path, '/');

        return this.set('attrs', attrs, _.extend({ dirty: true }, opt));
    },

    transition: function(path, value, opt, delim) {

	delim = delim || '/';

	var defaults = {
	    duration: 100,
	    delay: 10,
	    timingFunction: joint.util.timing.linear,
	    valueFunction: joint.util.interpolate.number
	};

	opt = _.extend(defaults, opt);

	var firstFrameTime = 0;
	var interpolatingFunction;

	var setter = _.bind(function(runtime) {

	    var id, progress, propertyValue, status;

	    firstFrameTime = firstFrameTime || runtime;
	    runtime -= firstFrameTime;
	    progress = runtime / opt.duration;

	    if (progress < 1) {
		this._transitionIds[path] = id = joint.util.nextFrame(setter);
	    } else {
		progress = 1;
		delete this._transitionIds[path];
	    }

	    propertyValue = interpolatingFunction(opt.timingFunction(progress));

	    opt.transitionId = id;

	    this.prop(path, propertyValue, opt);

	    if (!id) this.trigger('transition:end', this, path);

	}, this);

	var initiator =_.bind(function(callback) {

	    this.stopTransitions(path);

	    interpolatingFunction = opt.valueFunction(joint.util.getByPath(this.attributes, path, delim), value);

	    this._transitionIds[path] = joint.util.nextFrame(callback);

	    this.trigger('transition:start', this, path);

	}, this);

	return _.delay(initiator, opt.delay, setter);
    },

    getTransitions: function() {
	return _.keys(this._transitionIds);
    },

    stopTransitions: function(path, delim) {

	delim = delim || '/';

	var pathArray = path && path.split(delim);

	_(this._transitionIds).keys().filter(pathArray && function(key) {

	    return _.isEqual(pathArray, key.split(delim).slice(0, pathArray.length));

	}).each(function(key) {

	    joint.util.cancelFrame(this._transitionIds[key]);

	    delete this._transitionIds[key];

	    this.trigger('transition:end', this, key);

	}, this);

	return this;
    },

    // A shorcut making it easy to create constructs like the following:
    // `var el = (new joint.shapes.basic.Rect).addTo(graph)`.
    addTo: function(graph) {

	graph.addCell(this);
	return this;
    },

    // A shortcut for an equivalent call: `paper.findViewByModel(cell)`
    // making it easy to create constructs like the following:
    // `cell.findView(paper).highlight()`
    findView: function(paper) {

        return paper.findViewByModel(this);
    },

    isLink: function() {

        return false;
    }
});

// joint.dia.CellView base view and controller.
// --------------------------------------------

// This is the base view and controller for `joint.dia.ElementView` and `joint.dia.LinkView`.

joint.dia.CellView = Backbone.View.extend({

    tagName: 'g',

    attributes: function() {

        return { 'model-id': this.model.id }
    },

    constructor: function(options) {

	this._configure(options);
	Backbone.View.apply(this, arguments);
    },

    _configure: function(options) {

	if (this.options) options = _.extend({}, _.result(this, 'options'), options);
	this.options = options;
        // Make sure a global unique id is assigned to this view. Store this id also to the properties object.
        // The global unique id makes sure that the same view can be rendered on e.g. different machines and
        // still be associated to the same object among all those clients. This is necessary for real-time
        // collaboration mechanism.
        this.options.id = this.options.id || joint.util.guid(this);
    },

    initialize: function() {

        _.bindAll(this, 'remove', 'update');

        // Store reference to this to the <g> DOM element so that the view is accessible through the DOM tree.
        this.$el.data('view', this);

	this.listenTo(this.model, 'remove', this.remove);
	this.listenTo(this.model, 'change:attrs', this.onChangeAttrs);
    },

    onChangeAttrs: function(cell, attrs, opt) {

        if (opt.dirty) {

            // dirty flag could be set when a model attribute was removed and it needs to be cleared
            // also from the DOM element. See cell.removeAttr().
            return this.render();
        }

        return this.update();
    },

    // Override the Backbone `_ensureElement()` method in order to create a `<g>` node that wraps
    // all the nodes of the Cell view.
    _ensureElement: function() {

        var el;

        if (!this.el) {

            var attrs = _.extend({ id: this.id }, _.result(this, 'attributes'));
            if (this.className) attrs['class'] = _.result(this, 'className');
            el = V(_.result(this, 'tagName'), attrs).node;

        } else {

            el = _.result(this, 'el')
        }

        this.setElement(el, false);
    },
    
    findBySelector: function(selector) {

        // These are either descendants of `this.$el` of `this.$el` itself. 
       // `.` is a special selector used to select the wrapping `<g>` element.
        var $selected = selector === '.' ? this.$el : this.$el.find(selector);
        return $selected;
    },

    notify: function(evt) {

        if (this.paper) {

            var args = Array.prototype.slice.call(arguments, 1);

            // Trigger the event on both the element itself and also on the paper.
            this.trigger.apply(this, [evt].concat(args));
            
            // Paper event handlers receive the view object as the first argument.
            this.paper.trigger.apply(this.paper, [evt, this].concat(args));
        }
    },

    getStrokeBBox: function(el) {
        // Return a bounding box rectangle that takes into account stroke.
        // Note that this is a naive and ad-hoc implementation that does not
        // works only in certain cases and should be replaced as soon as browsers will
        // start supporting the getStrokeBBox() SVG method.
        // @TODO any better solution is very welcome!

        var isMagnet = !!el;
        
        el = el || this.el;
        var bbox = V(el).bbox(false, this.paper.viewport);

        var strokeWidth;
        if (isMagnet) {

            strokeWidth = V(el).attr('stroke-width');
            
        } else {

            strokeWidth = this.model.attr('rect/stroke-width') || this.model.attr('circle/stroke-width') || this.model.attr('ellipse/stroke-width') || this.model.attr('path/stroke-width');
        }

        strokeWidth = parseFloat(strokeWidth) || 0;

        return g.rect(bbox).moveAndExpand({ x: -strokeWidth/2, y: -strokeWidth/2, width: strokeWidth, height: strokeWidth });
    },
    
    getBBox: function() {

        return V(this.el).bbox();
    },

    highlight: function(el, opt) {

        el = !el ? this.el : this.$(el)[0] || this.el;

        // set partial flag if the highlighted element is not the entire view.
        opt = opt || {};
        opt.partial = el != this.el;

        this.notify('cell:highlight', el, opt);
        return this;
    },

    unhighlight: function(el, opt) {

        el = !el ? this.el : this.$(el)[0] || this.el;

        opt = opt || {};
        opt.partial = el != this.el;

        this.notify('cell:unhighlight', el, opt);
        return this;
    },

    // Find the closest element that has the `magnet` attribute set to `true`. If there was not such
    // an element found, return the root element of the cell view.
    findMagnet: function(el) {

        var $el = this.$(el);

        if ($el.length === 0 || $el[0] === this.el) {

            // If the overall cell has set `magnet === false`, then return `undefined` to
            // announce there is no magnet found for this cell.
            // This is especially useful to set on cells that have 'ports'. In this case,
            // only the ports have set `magnet === true` and the overall element has `magnet === false`.
            var attrs = this.model.get('attrs') || {};
            if (attrs['.'] && attrs['.']['magnet'] === false) {
                return undefined;
            }

            return this.el;
        }

        if ($el.attr('magnet')) {

            return $el[0];
        }

        return this.findMagnet($el.parent());
    },

    // `selector` is a CSS selector or `'.'`. `filter` must be in the special JointJS filter format:
    // `{ name: <name of the filter>, args: { <arguments>, ... }`.
    // An example is: `{ filter: { name: 'blur', args: { radius: 5 } } }`.
    applyFilter: function(selector, filter) {

        var $selected = this.findBySelector(selector);

        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        var filterId = filter.name + this.paper.svg.id + joint.util.hashCode(JSON.stringify(filter));

        // If the filter already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        // If not, create one.
        if (!this.paper.svg.getElementById(filterId)) {

            var filterSVGString = joint.util.filter[filter.name] && joint.util.filter[filter.name](filter.args || {});
            if (!filterSVGString) {
                throw new Error('Non-existing filter ' + filter.name);
            }
            var filterElement = V(filterSVGString);
	    // Set the filter area to be 3x the bounding box of the cell
	    // and center the filter around the cell.
	    filterElement.attr({
		filterUnits: 'objectBoundingBox',
		x: -1, y: -1, width: 3, height: 3
	    });
            if (filter.attrs) filterElement.attr(filter.attrs);
            filterElement.node.id = filterId;
            V(this.paper.svg).defs().append(filterElement);
        }

        $selected.each(function() {
            
            V(this).attr('filter', 'url(#' + filterId + ')');
        });
    },

    // `selector` is a CSS selector or `'.'`. `attr` is either a `'fill'` or `'stroke'`.
    // `gradient` must be in the special JointJS gradient format:
    // `{ type: <linearGradient|radialGradient>, stops: [ { offset: <offset>, color: <color> }, ... ]`.
    // An example is: `{ fill: { type: 'linearGradient', stops: [ { offset: '10%', color: 'green' }, { offset: '50%', color: 'blue' } ] } }`.
    applyGradient: function(selector, attr, gradient) {

        var $selected = this.findBySelector(selector);

        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        var gradientId = gradient.type + this.paper.svg.id + joint.util.hashCode(JSON.stringify(gradient));

        // If the gradient already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        // If not, create one.
        if (!this.paper.svg.getElementById(gradientId)) {

            var gradientSVGString = [
                '<' + gradient.type + '>',
                _.map(gradient.stops, function(stop) {
                    return '<stop offset="' + stop.offset + '" stop-color="' + stop.color + '" stop-opacity="' + (_.isFinite(stop.opacity) ? stop.opacity : 1) + '" />'
                }).join(''),
                '</' + gradient.type + '>'
            ].join('');
            
            var gradientElement = V(gradientSVGString);
            if (gradient.attrs) { gradientElement.attr(gradient.attrs); }
            gradientElement.node.id = gradientId;
            V(this.paper.svg).defs().append(gradientElement);
        }

        $selected.each(function() {
            
            V(this).attr(attr, 'url(#' + gradientId + ')');
        });
    },

    // Construct a unique selector for the `el` element within this view.
    // `selector` is being collected through the recursive call. No value for `selector` is expected when using this method.
    getSelector: function(el, selector) {

        if (el === this.el) {

            return selector;
        }

        var index = $(el).index();

        selector = el.tagName + ':nth-child(' + (index + 1) + ')' + ' ' + (selector || '');

        return this.getSelector($(el).parent()[0], selector + ' ');
    },

    // Interaction. The controller part.
    // ---------------------------------

    // Interaction is handled by the paper and delegated to the view in interest.
    // `x` & `y` parameters passed to these functions represent the coordinates already snapped to the paper grid.
    // If necessary, real coordinates can be obtained from the `evt` event object.

    // These functions are supposed to be overriden by the views that inherit from `joint.dia.Cell`,
    // i.e. `joint.dia.Element` and `joint.dia.Link`.

    pointerdblclick: function(evt, x, y) {

        this.notify('cell:pointerdblclick', evt, x, y);
    },

    pointerclick: function(evt, x, y) {

        this.notify('cell:pointerclick', evt, x, y);
    },
    
    pointerdown: function(evt, x, y) {

	if (this.model.collection) {
	    this.model.trigger('batch:start');
	    this._collection = this.model.collection;
	}

        this.notify('cell:pointerdown', evt, x, y);
    },
    
    pointermove: function(evt, x, y) {

        this.notify('cell:pointermove', evt, x, y);
    },
    
    pointerup: function(evt, x, y) {

        this.notify('cell:pointerup', evt, x, y);

	if (this._collection) {
	    // we don't want to trigger event on model as model doesn't
	    // need to be member of collection anymore (remove)
	    this._collection.trigger('batch:stop');
	    delete this._collection;
	}

    },

    mouseover: function(evt) {

        this.notify('cell:mouseover', evt);
    },

    mouseout: function(evt) {

        this.notify('cell:mouseout', evt);
    }
});


if (typeof exports === 'object') {

    module.exports.Cell = joint.dia.Cell;
    module.exports.CellView = joint.dia.CellView;
}
