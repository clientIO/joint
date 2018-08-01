
// joint.dia.Link base model.
// --------------------------

joint.dia.Link = joint.dia.Cell.extend({

    // The default markup for links.
    markup: [
        '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
        '<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
        '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
        '<path class="connection-wrap" d="M 0 0 0 0"/>',
        '<g class="labels"/>',
        '<g class="marker-vertices"/>',
        '<g class="marker-arrowheads"/>',
        '<g class="link-tools"/>'
    ].join(''),

    toolMarkup: [
        '<g class="link-tool">',
        '<g class="tool-remove" event="remove">',
        '<circle r="11" />',
        '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z" />',
        '<title>Remove link.</title>',
        '</g>',
        '<g class="tool-options" event="link:options">',
        '<circle r="11" transform="translate(25)"/>',
        '<path fill="white" transform="scale(.55) translate(29, -16)" d="M31.229,17.736c0.064-0.571,0.104-1.148,0.104-1.736s-0.04-1.166-0.104-1.737l-4.377-1.557c-0.218-0.716-0.504-1.401-0.851-2.05l1.993-4.192c-0.725-0.91-1.549-1.734-2.458-2.459l-4.193,1.994c-0.647-0.347-1.334-0.632-2.049-0.849l-1.558-4.378C17.165,0.708,16.588,0.667,16,0.667s-1.166,0.041-1.737,0.105L12.707,5.15c-0.716,0.217-1.401,0.502-2.05,0.849L6.464,4.005C5.554,4.73,4.73,5.554,4.005,6.464l1.994,4.192c-0.347,0.648-0.632,1.334-0.849,2.05l-4.378,1.557C0.708,14.834,0.667,15.412,0.667,16s0.041,1.165,0.105,1.736l4.378,1.558c0.217,0.715,0.502,1.401,0.849,2.049l-1.994,4.193c0.725,0.909,1.549,1.733,2.459,2.458l4.192-1.993c0.648,0.347,1.334,0.633,2.05,0.851l1.557,4.377c0.571,0.064,1.148,0.104,1.737,0.104c0.588,0,1.165-0.04,1.736-0.104l1.558-4.377c0.715-0.218,1.399-0.504,2.049-0.851l4.193,1.993c0.909-0.725,1.733-1.549,2.458-2.458l-1.993-4.193c0.347-0.647,0.633-1.334,0.851-2.049L31.229,17.736zM16,20.871c-2.69,0-4.872-2.182-4.872-4.871c0-2.69,2.182-4.872,4.872-4.872c2.689,0,4.871,2.182,4.871,4.872C20.871,18.689,18.689,20.871,16,20.871z"/>',
        '<title>Link options.</title>',
        '</g>',
        '</g>'
    ].join(''),

    doubleToolMarkup: undefined,

    // The default markup for showing/removing vertices. These elements are the children of the .marker-vertices element (see `this.markup`).
    // Only .marker-vertex and .marker-vertex-remove element have special meaning. The former is used for
    // dragging vertices (changin their position). The latter is used for removing vertices.
    vertexMarkup: [
        '<g class="marker-vertex-group" transform="translate(<%= x %>, <%= y %>)">',
        '<circle class="marker-vertex" idx="<%= idx %>" r="10" />',
        '<path class="marker-vertex-remove-area" idx="<%= idx %>" d="M16,5.333c-7.732,0-14,4.701-14,10.5c0,1.982,0.741,3.833,2.016,5.414L2,25.667l5.613-1.441c2.339,1.317,5.237,2.107,8.387,2.107c7.732,0,14-4.701,14-10.5C30,10.034,23.732,5.333,16,5.333z" transform="translate(5, -33)"/>',
        '<path class="marker-vertex-remove" idx="<%= idx %>" transform="scale(.8) translate(9.5, -37)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z">',
        '<title>Remove vertex.</title>',
        '</path>',
        '</g>'
    ].join(''),

    arrowheadMarkup: [
        '<g class="marker-arrowhead-group marker-arrowhead-group-<%= end %>">',
        '<path class="marker-arrowhead" end="<%= end %>" d="M 26 0 L 0 13 L 26 26 z" />',
        '</g>'
    ].join(''),

    // may be overwritten by user to change default label (its markup, attrs, position)
    defaultLabel: undefined,

    // deprecated
    // may be overwritten by user to change default label markup
    // lower priority than defaultLabel.markup
    labelMarkup: undefined,

    // private
    _builtins: {
        defaultLabel: {
            // builtin default markup:
            // used if neither defaultLabel.markup
            // nor label.markup is set
            markup: [
                {
                    tagName: 'rect',
                    selector: 'rect' // faster than tagName CSS selector
                }, {
                    tagName: 'text',
                    selector: 'text' // faster than tagName CSS selector
                }
            ],
            // builtin default attributes:
            // applied only if builtin default markup is used
            attrs: {
                text: {
                    fill: '#000000',
                    fontSize: 14,
                    textAnchor: 'middle',
                    yAlignment: 'middle',
                    pointerEvents: 'none'
                },
                rect: {
                    ref: 'text',
                    fill: '#ffffff',
                    rx: 3,
                    ry: 3,
                    refWidth: 1,
                    refHeight: 1,
                    refX: 0,
                    refY: 0
                }
            },
            // builtin default position:
            // used if neither defaultLabel.position
            // nor label.position is set
            position: {
                distance: 0.5
            }
        }
    },

    defaults: {
        type: 'link',
        source: {},
        target: {}
    },

    isLink: function() {

        return true;
    },

    disconnect: function(opt) {

        return this.set({
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 }
        }, opt);
    },

    source: function(source, args, opt) {

        // getter
        if (source === undefined) {
            return joint.util.clone(this.get('source'));
        }

        // setter
        var localSource;
        var localOpt;

        // `source` is a cell
        // take only its `id` and combine with `args`
        var isCellProvided = source instanceof joint.dia.Cell;
        if (isCellProvided) { // three arguments
            localSource = joint.util.clone(args) || {};
            localSource.id = source.id;
            localOpt = opt;
            return this.set('source', localSource, localOpt);
        }

        // `source` is a g.Point
        // take only its `x` and `y` and combine with `args`
        var isPointProvided = source instanceof g.Point;
        if (isPointProvided) { // three arguments
            localSource = joint.util.clone(args) || {};
            localSource.x = source.x;
            localSource.y = source.y;
            localOpt = opt;
            return this.set('source', localSource, localOpt);
        }

        // `source` is an object
        // no checking
        // two arguments
        localSource = source;
        localOpt = args;
        return this.set('source', localSource, localOpt);
    },

    target: function(target, args, opt) {

        // getter
        if (target === undefined) {
            return joint.util.clone(this.get('target'));
        }

        // setter
        var localTarget;
        var localOpt;

        // `target` is a cell
        // take only its `id` argument and combine with `args`
        var isCellProvided = target instanceof joint.dia.Cell;
        if (isCellProvided) { // three arguments
            localTarget = joint.util.clone(args) || {};
            localTarget.id = target.id;
            localOpt = opt;
            return this.set('target', localTarget, localOpt);
        }

        // `target` is a g.Point
        // take only its `x` and `y` and combine with `args`
        var isPointProvided = target instanceof g.Point;
        if (isPointProvided) { // three arguments
            localTarget = joint.util.clone(args) || {};
            localTarget.x = target.x;
            localTarget.y = target.y;
            localOpt = opt;
            return this.set('target', localTarget, localOpt);
        }

        // `target` is an object
        // no checking
        // two arguments
        localTarget = target;
        localOpt = args;
        return this.set('target', localTarget, localOpt);
    },

    router: function(name, args, opt) {

        // getter
        if (name === undefined) {
            var router = this.get('router');
            if (!router) {
                if (this.get('manhattan')) return { name: 'orthogonal' }; // backwards compatibility
                return null;
            }
            if (typeof router === 'object') return joint.util.clone(router);
            return router; // e.g. a function
        }

        // setter
        var isRouterProvided = ((typeof name === 'object') || (typeof name === 'function'));
        var localRouter = isRouterProvided ? name : { name: name, args: args };
        var localOpt = isRouterProvided ? args : opt;

        return this.set('router', localRouter, localOpt);
    },

    connector: function(name, args, opt) {

        // getter
        if (name === undefined) {
            var connector = this.get('connector');
            if (!connector) {
                if (this.get('smooth')) return { name: 'smooth' }; // backwards compatibility
                return null;
            }
            if (typeof connector === 'object') return joint.util.clone(connector);
            return connector; // e.g. a function
        }

        // setter
        var isConnectorProvided = ((typeof name === 'object' || typeof name === 'function'));
        var localConnector = isConnectorProvided ? name : { name: name, args: args };
        var localOpt = isConnectorProvided ? args : opt;

        return this.set('connector', localConnector, localOpt);
    },

    // Labels API

    // A convenient way to set labels. Currently set values will be mixined with `value` if used as a setter.
    label: function(idx, label, opt) {

        var labels = this.labels();

        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : 0;
        if (idx < 0) idx = labels.length + idx;

        // getter
        if (arguments.length <= 1) return this.prop(['labels', idx]);
        // setter
        return this.prop(['labels', idx], label, opt);
    },

    labels: function(labels, opt) {

        // getter
        if (arguments.length === 0) {
            labels = this.get('labels');
            if (!Array.isArray(labels)) return [];
            return labels.slice();
        }
        // setter
        if (!Array.isArray(labels)) labels = [];
        return this.set('labels', labels, opt);
    },

    insertLabel: function(idx, label, opt) {

        if (!label) throw new Error('dia.Link: no label provided');

        var labels = this.labels();
        var n = labels.length;
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : n;
        if (idx < 0) idx = n + idx + 1;

        labels.splice(idx, 0, label);
        return this.labels(labels, opt);
    },

    // convenience function
    // add label to end of labels array
    appendLabel: function(label, opt) {

        return this.insertLabel(-1, label, opt);
    },

    removeLabel: function(idx, opt) {

        var labels = this.labels();
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : -1;

        labels.splice(idx, 1);
        return this.labels(labels, opt);
    },

    // Vertices API

    vertex: function(idx, vertex, opt) {

        var vertices = this.vertices();

        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : 0;
        if (idx < 0) idx = vertices.length + idx;

        // getter
        if (arguments.length <= 1) return this.prop(['vertices', idx]);
        // setter
        return this.prop(['vertices', idx], vertex, opt);
    },

    vertices: function(vertices, opt) {

        // getter
        if (arguments.length === 0) {
            vertices = this.get('vertices');
            if (!Array.isArray(vertices)) return [];
            return vertices.slice();
        }
        // setter
        if (!Array.isArray(vertices)) vertices = [];
        return this.set('vertices', vertices, opt);
    },

    insertVertex: function(idx, vertex, opt) {

        if (!vertex) throw new Error('dia.Link: no vertex provided');

        var vertices = this.vertices();
        var n = vertices.length;
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : n;
        if (idx < 0) idx = n + idx + 1;

        vertices.splice(idx, 0, vertex);
        return this.vertices(vertices, opt);
    },

    removeVertex: function(idx, opt) {

        var vertices = this.vertices();
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : -1;

        vertices.splice(idx, 1);
        return this.vertices(vertices, opt);
    },

    // Transformations

    translate: function(tx, ty, opt) {

        // enrich the option object
        opt = opt || {};
        opt.translateBy = opt.translateBy || this.id;
        opt.tx = tx;
        opt.ty = ty;

        return this.applyToPoints(function(p) {
            return { x: (p.x || 0) + tx, y: (p.y || 0) + ty };
        }, opt);
    },

    scale: function(sx, sy, origin, opt) {

        return this.applyToPoints(function(p) {
            return g.point(p).scale(sx, sy, origin).toJSON();
        }, opt);
    },

    applyToPoints: function(fn, opt) {

        if (!joint.util.isFunction(fn)) {
            throw new TypeError('dia.Link: applyToPoints expects its first parameter to be a function.');
        }

        var attrs = {};

        var source = this.source();
        if (!source.id) {
            attrs.source = fn(source);
        }

        var target = this.target();
        if (!target.id) {
            attrs.target = fn(target);
        }

        var vertices = this.vertices();
        if (vertices.length > 0) {
            attrs.vertices = vertices.map(fn);
        }

        return this.set(attrs, opt);
    },

    reparent: function(opt) {

        var newParent;

        if (this.graph) {

            var source = this.getSourceElement();
            var target = this.getTargetElement();
            var prevParent = this.getParentCell();

            if (source && target) {
                if (source === target || source.isEmbeddedIn(target)) {
                    newParent = target;
                } else if (target.isEmbeddedIn(source)) {
                    newParent = source;
                } else {
                    newParent = this.graph.getCommonAncestor(source, target);
                }
            }

            if (prevParent && (!newParent || newParent.id !== prevParent.id)) {
                // Unembed the link if source and target has no common ancestor
                // or common ancestor changed
                prevParent.unembed(this, opt);
            }

            if (newParent) {
                newParent.embed(this, opt);
            }
        }

        return newParent;
    },

    hasLoop: function(opt) {

        opt = opt || {};

        var sourceId = this.source().id;
        var targetId = this.target().id;

        if (!sourceId || !targetId) {
            // Link "pinned" to the paper does not have a loop.
            return false;
        }

        var loop = sourceId === targetId;

        // Note that there in the deep mode a link can have a loop,
        // even if it connects only a parent and its embed.
        // A loop "target equals source" is valid in both shallow and deep mode.
        if (!loop && opt.deep && this.graph) {

            var sourceElement = this.getSourceElement();
            var targetElement = this.getTargetElement();

            loop = sourceElement.isEmbeddedIn(targetElement) || targetElement.isEmbeddedIn(sourceElement);
        }

        return loop;
    },

    // unlike source(), this method returns null if source is a point
    getSourceElement: function() {

        var source = this.source();
        var graph = this.graph;

        return (source && source.id && graph && graph.getCell(source.id)) || null;
    },

    // unlike target(), this method returns null if target is a point
    getTargetElement: function() {

        var target = this.target();
        var graph = this.graph;

        return (target && target.id && graph && graph.getCell(target.id)) || null;
    },

    // Returns the common ancestor for the source element,
    // target element and the link itself.
    getRelationshipAncestor: function() {

        var connectionAncestor;

        if (this.graph) {

            var cells = [
                this,
                this.getSourceElement(), // null if source is a point
                this.getTargetElement() // null if target is a point
            ].filter(function(item) {
                return !!item;
            });

            connectionAncestor = this.graph.getCommonAncestor.apply(this.graph, cells);
        }

        return connectionAncestor || null;
    },

    // Is source, target and the link itself embedded in a given cell?
    isRelationshipEmbeddedIn: function(cell) {

        var cellId = (joint.util.isString(cell) || joint.util.isNumber(cell)) ? cell : cell.id;
        var ancestor = this.getRelationshipAncestor();

        return !!ancestor && (ancestor.id === cellId || ancestor.isEmbeddedIn(cellId));
    },

    // Get resolved default label.
    _getDefaultLabel: function() {

        var defaultLabel = this.get('defaultLabel') || this.defaultLabel || {};

        var label = {};
        label.markup = defaultLabel.markup || this.get('labelMarkup') || this.labelMarkup;
        label.position = defaultLabel.position;
        label.attrs = defaultLabel.attrs;
        label.size = defaultLabel.size;

        return label;
    }
}, {

    endsEqual: function(a, b) {

        var portsEqual = a.port === b.port || !a.port && !b.port;
        return a.id === b.id && portsEqual;
    }
});


// joint.dia.Link base view and controller.
// ----------------------------------------

joint.dia.LinkView = joint.dia.CellView.extend({

    className: function() {

        var classNames = joint.dia.CellView.prototype.className.apply(this).split(' ');

        classNames.push('link');

        return classNames.join(' ');
    },

    options: {

        shortLinkLength: 105,
        doubleLinkTools: false,
        longLinkLength: 155,
        linkToolsOffset: 40,
        doubleLinkToolsOffset: 65,
        sampleInterval: 50,
    },

    _labelCache: null,
    _labelSelectors: null,
    _markerCache: null,
    _V: null,
    _dragData: null, // deprecated

    metrics: null,
    decimalsRounding: 2,

    initialize: function(options) {

        joint.dia.CellView.prototype.initialize.apply(this, arguments);

        // create methods in prototype, so they can be accessed from any instance and
        // don't need to be create over and over
        if (typeof this.constructor.prototype.watchSource !== 'function') {
            this.constructor.prototype.watchSource = this.createWatcher('source');
            this.constructor.prototype.watchTarget = this.createWatcher('target');
        }

        // `_.labelCache` is a mapping of indexes of labels in the `this.get('labels')` array to
        // `<g class="label">` nodes wrapped by Vectorizer. This allows for quick access to the
        // nodes in `updateLabelPosition()` in order to update the label positions.
        this._labelCache = {};

        // a cache of label selectors
        this._labelSelectors = {};

        // keeps markers bboxes and positions again for quicker access
        this._markerCache = {};

        // cache of default markup nodes
        this._V = {},

        // connection path metrics
        this.metrics = {},

        // bind events
        this.startListening();
    },

    startListening: function() {

        var model = this.model;

        this.listenTo(model, 'change:markup', this.render);
        this.listenTo(model, 'change:smooth change:manhattan change:router change:connector', this.update);
        this.listenTo(model, 'change:toolMarkup', this.onToolsChange);
        this.listenTo(model, 'change:labels change:labelMarkup', this.onLabelsChange);
        this.listenTo(model, 'change:vertices change:vertexMarkup', this.onVerticesChange);
        this.listenTo(model, 'change:source', this.onSourceChange);
        this.listenTo(model, 'change:target', this.onTargetChange);
    },

    onSourceChange: function(cell, source, opt) {

        // Start watching the new source model.
        this.watchSource(cell, source);
        // This handler is called when the source attribute is changed.
        // This can happen either when someone reconnects the link (or moves arrowhead),
        // or when an embedded link is translated by its ancestor.
        // 1. Always do update.
        // 2. Do update only if the opposite end ('target') is also a point.
        var model = this.model;
        if (!opt.translateBy || !model.get('target').id || !source.id) {
            this.update(model, null, opt);
        }
    },

    onTargetChange: function(cell, target, opt) {

        // Start watching the new target model.
        this.watchTarget(cell, target);
        // See `onSourceChange` method.
        var model = this.model;
        if (!opt.translateBy || (model.get('source').id && !target.id && joint.util.isEmpty(model.get('vertices')))) {
            this.update(model, null, opt);
        }
    },

    onVerticesChange: function(cell, changed, opt) {

        this.renderVertexMarkers();

        // If the vertices have been changed by a translation we do update only if the link was
        // the only link that was translated. If the link was translated via another element which the link
        // is embedded in, this element will be translated as well and that triggers an update.
        // Note that all embeds in a model are sorted - first comes links, then elements.
        if (!opt.translateBy || opt.translateBy === this.model.id || this.model.hasLoop()) {
            // Vertices were changed (not as a reaction on translate)
            // or link.translate() was called or
            this.update(cell, null, opt);
        }
    },

    onToolsChange: function() {

        this.renderTools().updateToolsPosition();
    },

    onLabelsChange: function(link, labels, opt) {

        var requireRender = true;

        var previousLabels = this.model.previous('labels');

        if (previousLabels) {
            // Here is an optimalization for cases when we know, that change does
            // not require rerendering of all labels.
            if (('propertyPathArray' in opt) && ('propertyValue' in opt)) {
                // The label is setting by `prop()` method
                var pathArray = opt.propertyPathArray || [];
                var pathLength = pathArray.length;
                if (pathLength > 1) {
                    // We are changing a single label here e.g. 'labels/0/position'
                    var labelExists = !!previousLabels[pathArray[1]];
                    if (labelExists) {
                        if (pathLength === 2) {
                            // We are changing the entire label. Need to check if the
                            // markup is also being changed.
                            requireRender = ('markup' in Object(opt.propertyValue));
                        } else if (pathArray[2] !== 'markup') {
                            // We are changing a label property but not the markup
                            requireRender = false;
                        }
                    }
                }
            }
        }

        if (requireRender) {
            this.renderLabels();
        } else {
            this.updateLabels();
        }

        this.updateLabelPositions();
    },

    // Rendering.
    // ----------

    render: function() {

        this.vel.empty();
        this._V = {};
        this.renderMarkup();
        // rendering labels has to be run after the link is appended to DOM tree. (otherwise <Text> bbox
        // returns zero values)
        this.renderLabels();
        // start watching the ends of the link for changes
        var model = this.model;
        this.watchSource(model, model.source())
            .watchTarget(model, model.target())
            .update();

        return this;
    },

    renderMarkup: function() {

        var link = this.model;
        var markup = link.get('markup') || link.markup;
        if (!markup) throw new Error('dia.LinkView: markup required');
        if (Array.isArray(markup)) return this.renderJSONMarkup(markup);
        if (typeof markup === 'string') return this.renderStringMarkup(markup);
        throw new Error('dia.LinkView: invalid markup');
    },

    renderJSONMarkup: function(markup) {

        var doc = joint.util.parseDOMJSON(markup);
        // Selectors
        var selectors = this.selectors = doc.selectors;
        var rootSelector = this.selector;
        if (selectors[rootSelector]) throw new Error('dia.LinkView: ambiguous root selector.');
        selectors[rootSelector] = this.el;
        // Fragment
        this.vel.append(doc.fragment);
    },

    renderStringMarkup: function(markup) {

        // A special markup can be given in the `properties.markup` property. This might be handy
        // if e.g. arrowhead markers should be `<image>` elements or any other element than `<path>`s.
        // `.connection`, `.connection-wrap`, `.marker-source` and `.marker-target` selectors
        // of elements with special meaning though. Therefore, those classes should be preserved in any
        // special markup passed in `properties.markup`.
        var children = V(markup);
        // custom markup may contain only one children
        if (!Array.isArray(children)) children = [children];
        // Cache all children elements for quicker access.
        var cache = this._V; // vectorized markup;
        for (var i = 0, n = children.length; i < n; i++) {
            var child = children[i];
            var className = child.attr('class');
            if (className) {
                // Strip the joint class name prefix, if there is one.
                className = joint.util.removeClassNamePrefix(className);
                cache[$.camelCase(className)] = child;
            }
        }
        // partial rendering
        this.renderTools();
        this.renderVertexMarkers();
        this.renderArrowheadMarkers();
        this.vel.append(children);
    },

    _getLabelMarkup: function(labelMarkup) {

        if (!labelMarkup) return undefined;

        if (Array.isArray(labelMarkup)) return this._getLabelJSONMarkup(labelMarkup);
        if (typeof labelMarkup === 'string') return this._getLabelStringMarkup(labelMarkup);
        throw new Error('dia.linkView: invalid label markup');
    },

    _getLabelJSONMarkup: function(labelMarkup) {

        return joint.util.parseDOMJSON(labelMarkup); // fragment and selectors
    },

    _getLabelStringMarkup: function(labelMarkup) {

        var children = V(labelMarkup);
        var fragment = document.createDocumentFragment();

        if (!Array.isArray(children)) {
            fragment.append(children.node);

        } else {
            for (var i = 0, n = children.length; i < n; i++) {
                var currentChild = children[i].node;
                fragment.appendChild(currentChild);
            }
        }

        return { fragment: fragment, selectors: {}}; // no selectors
    },

    // Label markup fragment may come wrapped in <g class="label" />, or not.
    // If it doesn't, add the <g /> container here.
    _normalizeLabelMarkup: function(markup) {

        if (!markup) return undefined;

        var fragment = markup.fragment;
        if (!(markup.fragment instanceof DocumentFragment) || !markup.fragment.hasChildNodes()) throw new Error('dia.LinkView: invalid label markup.');

        var vNode;
        var childNodes = fragment.childNodes;

        if ((childNodes.length > 1) || childNodes[0].nodeName.toUpperCase() !== 'G') {
            // default markup fragment is not wrapped in <g />
            // add a <g /> container

            vNode = V('g');
            vNode.append(fragment);
            vNode.addClass('label');

        } else {
            vNode = V(childNodes[0]);
            vNode.addClass('label');
        }

        return { node: vNode.node, selectors: markup.selectors };
    },

    renderLabels: function() {

        var cache = this._V;
        var vLabels = cache.labels;
        var labelCache = this._labelCache = {};
        var labelSelectors = this._labelSelectors = {};

        if (vLabels) vLabels.empty();

        var model = this.model;
        var labels = model.get('labels') || [];
        var labelsCount = labels.length;
        if (labelsCount === 0) return this;

        if (!vLabels) {
            // there is no label container in the markup but some labels are defined
            // add a <g class="labels" /> container
            vLabels = cache.labels = V('g').addClass('labels').appendTo(this.el);
        }

        for (var i = 0; i < labelsCount; i++) {

            var label = labels[i];
            var labelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(label.markup));

            var node;
            var selectors;
            if (labelMarkup) {
                node = labelMarkup.node;
                selectors = labelMarkup.selectors;

            } else {
                var builtinDefaultLabel =  model._builtins.defaultLabel;
                var builtinDefaultLabelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(builtinDefaultLabel.markup));

                var defaultLabel = model._getDefaultLabel();
                var defaultLabelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(defaultLabel.markup));

                var defaultMarkup = defaultLabelMarkup || builtinDefaultLabelMarkup;

                node = defaultMarkup.node;
                selectors = defaultMarkup.selectors;
            }

            var vLabel = V(node);
            vLabel.attr('label-idx', i); // assign label-idx
            vLabel.appendTo(vLabels);
            labelCache[i] = vLabel; // cache node for `updateLabels()` so it can just update label node positions

            selectors[this.selector] = vLabel.node;
            labelSelectors[i] = selectors; // cache label selectors for `updateLabels()`
        }

        this.updateLabels();

        return this;
    },

    // merge default label attrs into label attrs
    // keep `undefined` or `null` because `{}` means something else
    _mergeLabelAttrs: function(hasCustomMarkup, labelAttrs, defaultLabelAttrs, builtinDefaultLabelAttrs) {

        if (labelAttrs === null) return null;
        if (labelAttrs === undefined) {

            if (defaultLabelAttrs === null) return null;
            if (defaultLabelAttrs === undefined) {

                if (hasCustomMarkup) return undefined;
                return builtinDefaultLabelAttrs;
            }

            if (hasCustomMarkup) return defaultLabelAttrs;
            return joint.util.merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs);
        }

        if (hasCustomMarkup) return joint.util.merge({}, defaultLabelAttrs, labelAttrs);
        return joint.util.merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs, labelAttrs);
    },

    updateLabels: function() {

        if (!this._V.labels) return this;

        var model = this.model;
        var labels = model.get('labels') || [];
        var canLabelMove = this.can('labelMove');

        var builtinDefaultLabel = model._builtins.defaultLabel;
        var builtinDefaultLabelAttrs = builtinDefaultLabel.attrs;

        var defaultLabel = model._getDefaultLabel();
        var defaultLabelMarkup = defaultLabel.markup;
        var defaultLabelAttrs = defaultLabel.attrs;

        for (var i = 0, n = labels.length; i < n; i++) {

            var vLabel = this._labelCache[i];
            vLabel.attr('cursor', (canLabelMove ? 'move' : 'default'));

            var selectors = this._labelSelectors[i];

            var label = labels[i];
            var labelMarkup = label.markup;
            var labelAttrs = label.attrs;

            var attrs = this._mergeLabelAttrs(
                (labelMarkup || defaultLabelMarkup),
                labelAttrs,
                defaultLabelAttrs,
                builtinDefaultLabelAttrs
            );

            this.updateDOMSubtreeAttributes(vLabel.node, attrs, {
                rootBBox: new g.Rect(label.size),
                selectors: selectors
            });
        }

        return this;
    },

    renderTools: function() {

        if (!this._V.linkTools) return this;

        // Tools are a group of clickable elements that manipulate the whole link.
        // A good example of this is the remove tool that removes the whole link.
        // Tools appear after hovering the link close to the `source` element/point of the link
        // but are offset a bit so that they don't cover the `marker-arrowhead`.

        var $tools = $(this._V.linkTools.node).empty();
        var toolTemplate = joint.util.template(this.model.get('toolMarkup') || this.model.toolMarkup);
        var tool = V(toolTemplate());

        $tools.append(tool.node);

        // Cache the tool node so that the `updateToolsPosition()` can update the tool position quickly.
        this._toolCache = tool;

        // If `doubleLinkTools` is enabled, we render copy of the tools on the other side of the
        // link as well but only if the link is longer than `longLinkLength`.
        if (this.options.doubleLinkTools) {

            var tool2;
            if (this.model.get('doubleToolMarkup') || this.model.doubleToolMarkup) {
                toolTemplate = joint.util.template(this.model.get('doubleToolMarkup') || this.model.doubleToolMarkup);
                tool2 = V(toolTemplate());
            } else {
                tool2 = tool.clone();
            }

            $tools.append(tool2.node);
            this._tool2Cache = tool2;
        }

        return this;
    },

    renderVertexMarkers: function() {

        if (!this._V.markerVertices) return this;

        var $markerVertices = $(this._V.markerVertices.node).empty();

        // A special markup can be given in the `properties.vertexMarkup` property. This might be handy
        // if default styling (elements) are not desired. This makes it possible to use any
        // SVG elements for .marker-vertex and .marker-vertex-remove tools.
        var markupTemplate = joint.util.template(this.model.get('vertexMarkup') || this.model.vertexMarkup);

        this.model.vertices().forEach(function(vertex, idx) {

            $markerVertices.append(V(markupTemplate(joint.util.assign({ idx: idx }, vertex))).node);
        });

        return this;
    },

    renderArrowheadMarkers: function() {

        // Custom markups might not have arrowhead markers. Therefore, jump of this function immediately if that's the case.
        if (!this._V.markerArrowheads) return this;

        var $markerArrowheads = $(this._V.markerArrowheads.node);

        $markerArrowheads.empty();

        // A special markup can be given in the `properties.vertexMarkup` property. This might be handy
        // if default styling (elements) are not desired. This makes it possible to use any
        // SVG elements for .marker-vertex and .marker-vertex-remove tools.
        var markupTemplate = joint.util.template(this.model.get('arrowheadMarkup') || this.model.arrowheadMarkup);

        this._V.sourceArrowhead = V(markupTemplate({ end: 'source' }));
        this._V.targetArrowhead = V(markupTemplate({ end: 'target' }));

        $markerArrowheads.append(this._V.sourceArrowhead.node, this._V.targetArrowhead.node);

        return this;
    },

    // Updating.
    // ---------

    // Default is to process the `attrs` object and set attributes on subelements based on the selectors.
    update: function(model, attributes, opt) {

        opt || (opt = {});

        // update the link path
        this.updateConnection(opt);

        // update SVG attributes defined by 'attrs/'.
        this.updateDOMSubtreeAttributes(this.el, this.model.attr(), { selectors: this.selectors });

        this.updateDefaultConnectionPath();

        // update the label position etc.
        this.updateLabelPositions();
        this.updateToolsPosition();
        this.updateArrowheadMarkers();

        this.updateTools(opt);
        // Local perpendicular flag (as opposed to one defined on paper).
        // Could be enabled inside a connector/router. It's valid only
        // during the update execution.
        this.options.perpendicular = null;
        // Mark that postponed update has been already executed.
        this.updatePostponed = false;

        return this;
    },

    removeRedundantLinearVertices: function(opt) {
        var link = this.model;
        var vertices = link.vertices();
        var conciseVertices = [];
        var n = vertices.length;
        var m = 0;
        for (var i = 0; i < n; i++) {
            var current = new g.Point(vertices[i]).round();
            var prev = new g.Point(conciseVertices[m - 1] || this.sourceAnchor).round();
            if (prev.equals(current)) continue;
            var next = new g.Point(vertices[i + 1] || this.targetAnchor).round();
            if (prev.equals(next)) continue;
            var line = new g.Line(prev, next);
            if (line.pointOffset(current) === 0) continue;
            conciseVertices.push(vertices[i]);
            m++;
        }
        if (n === m) return 0;
        link.vertices(conciseVertices, opt);
        return (n - m);
    },

    updateDefaultConnectionPath: function() {

        var cache = this._V;

        if (cache.connection) {
            cache.connection.attr('d', this.getSerializedConnection());
        }

        if (cache.connectionWrap) {
            cache.connectionWrap.attr('d', this.getSerializedConnection());
        }

        if (cache.markerSource && cache.markerTarget) {
            this._translateAndAutoOrientArrows(cache.markerSource, cache.markerTarget);
        }
    },

    getEndView: function(type) {
        switch (type) {
            case 'source':
                return this.sourceView || null;
            case 'target':
                return this.targetView || null;
            default:
                throw new Error('dia.LinkView: type parameter required.');
        }
    },

    getEndAnchor: function(type) {
        switch (type) {
            case 'source':
                return new g.Point(this.sourceAnchor);
            case 'target':
                return new g.Point(this.targetAnchor);
            default:
                throw new Error('dia.LinkView: type parameter required.');
        }
    },

    getEndMagnet: function(type) {
        switch (type) {
            case 'source':
                var sourceView = this.sourceView;
                if (!sourceView) break;
                return this.sourceMagnet || sourceView.el;
            case 'target':
                var targetView = this.targetView;
                if (!targetView) break;
                return this.targetMagnet || targetView.el;
            default:
                throw new Error('dia.LinkView: type parameter required.');
        }
        return null;
    },

    updateConnection: function(opt) {

        opt = opt || {};

        var model = this.model;
        var route, path;

        if (opt.translateBy && model.isRelationshipEmbeddedIn(opt.translateBy)) {
            // The link is being translated by an ancestor that will
            // shift source point, target point and all vertices
            // by an equal distance.
            var tx = opt.tx || 0;
            var ty = opt.ty || 0;

            route = (new g.Polyline(this.route)).translate(tx, ty).points;

            // translate source and target connection and marker points.
            this._translateConnectionPoints(tx, ty);

            // translate the path itself
            path = this.path;
            path.translate(tx, ty);

        } else {

            var vertices = model.vertices();
            // 1. Find Anchors

            var anchors = this.findAnchors(vertices);
            var sourceAnchor = this.sourceAnchor = anchors.source;
            var targetAnchor = this.targetAnchor = anchors.target;

            // 2. Find Route
            route = this.findRoute(vertices, opt);

            // 3. Find Connection Points
            var connectionPoints = this.findConnectionPoints(route, sourceAnchor, targetAnchor);
            var sourcePoint = this.sourcePoint = connectionPoints.source;
            var targetPoint = this.targetPoint = connectionPoints.target;

            // 3b. Find Marker Connection Point - Backwards Compatibility
            var markerPoints = this.findMarkerPoints(route, sourcePoint, targetPoint);

            // 4. Find Connection
            path = this.findPath(route, markerPoints.source || sourcePoint, markerPoints.target || targetPoint);
        }

        this.route = route;
        this.path = path;
        this.metrics = {};
    },

    findMarkerPoints: function(route, sourcePoint, targetPoint) {

        var firstWaypoint = route[0];
        var lastWaypoint = route[route.length - 1];

        // Move the source point by the width of the marker taking into account
        // its scale around x-axis. Note that scale is the only transform that
        // makes sense to be set in `.marker-source` attributes object
        // as all other transforms (translate/rotate) will be replaced
        // by the `translateAndAutoOrient()` function.
        var cache = this._markerCache;
        // cache source and target points
        var sourceMarkerPoint, targetMarkerPoint;

        if (this._V.markerSource) {

            cache.sourceBBox = cache.sourceBBox || this._V.markerSource.getBBox();
            sourceMarkerPoint = g.point(sourcePoint).move(
                firstWaypoint || targetPoint,
                cache.sourceBBox.width * this._V.markerSource.scale().sx * -1
            ).round();
        }

        if (this._V.markerTarget) {

            cache.targetBBox = cache.targetBBox || this._V.markerTarget.getBBox();
            targetMarkerPoint = g.point(targetPoint).move(
                lastWaypoint || sourcePoint,
                cache.targetBBox.width * this._V.markerTarget.scale().sx * -1
            ).round();
        }

        // if there was no markup for the marker, use the connection point.
        cache.sourcePoint = sourceMarkerPoint || sourcePoint.clone();
        cache.targetPoint = targetMarkerPoint || targetPoint.clone();

        return {
            source: sourceMarkerPoint,
            target: targetMarkerPoint
        }
    },

    findAnchors: function(vertices) {

        var model = this.model;
        var firstVertex = vertices[0];
        var lastVertex = vertices[vertices.length - 1];
        var sourceDef = model.get('source');
        var targetDef = model.get('target');
        var sourceView = this.sourceView;
        var targetView = this.targetView;
        var sourceMagnet, targetMagnet;

        // Anchor Source
        var sourceAnchor;
        if (sourceView) {
            sourceMagnet = (this.sourceMagnet || sourceView.el);
            var sourceAnchorRef;
            if (firstVertex) {
                sourceAnchorRef = new g.Point(firstVertex);
            } else if (targetView) {
                // TODO: the source anchor reference is not a point, how to deal with this?
                sourceAnchorRef = this.targetMagnet || targetView.el;
            } else {
                sourceAnchorRef = new g.Point(targetDef);
            }
            sourceAnchor = this.getAnchor(sourceDef.anchor, sourceView, sourceMagnet, sourceAnchorRef, 'source');
        } else {
            sourceAnchor = new g.Point(sourceDef);
        }

        // Anchor Target
        var targetAnchor;
        if (targetView) {
            targetMagnet = (this.targetMagnet || targetView.el);
            var targetAnchorRef = new g.Point(lastVertex || sourceAnchor);
            targetAnchor = this.getAnchor(targetDef.anchor, targetView, targetMagnet, targetAnchorRef, 'target');
        } else {
            targetAnchor = new g.Point(targetDef);
        }

        // Con
        return {
            source: sourceAnchor,
            target: targetAnchor
        }
    },

    findConnectionPoints: function(route, sourceAnchor, targetAnchor) {

        var firstWaypoint = route[0];
        var lastWaypoint = route[route.length - 1];
        var model = this.model;
        var sourceDef = model.get('source');
        var targetDef = model.get('target');
        var sourceView = this.sourceView;
        var targetView = this.targetView;
        var paperOptions = this.paper.options;
        var sourceMagnet, targetMagnet;

        // Connection Point Source
        var sourcePoint;
        if (sourceView) {
            sourceMagnet = (this.sourceMagnet || sourceView.el);
            var sourceConnectionPointDef = sourceDef.connectionPoint || paperOptions.defaultConnectionPoint;
            var sourcePointRef = firstWaypoint || targetAnchor;
            var sourceLine = new g.Line(sourcePointRef, sourceAnchor);
            sourcePoint = this.getConnectionPoint(sourceConnectionPointDef, sourceView, sourceMagnet, sourceLine, 'source');
        } else {
            sourcePoint = sourceAnchor;
        }
        // Connection Point Target
        var targetPoint;
        if (targetView) {
            targetMagnet = (this.targetMagnet || targetView.el);
            var targetConnectionPointDef = targetDef.connectionPoint || paperOptions.defaultConnectionPoint;
            var targetPointRef = lastWaypoint || sourceAnchor;
            var targetLine = new g.Line(targetPointRef, targetAnchor);
            targetPoint = this.getConnectionPoint(targetConnectionPointDef, targetView, targetMagnet, targetLine, 'target');
        } else {
            targetPoint = targetAnchor;
        }

        return {
            source: sourcePoint,
            target: targetPoint
        }
    },

    getAnchor: function(anchorDef, cellView, magnet, ref, endType) {

        if (!anchorDef) {
            var paperOptions = this.paper.options;
            if (paperOptions.perpendicularLinks || this.options.perpendicular) {
                // Backwards compatibility
                // If `perpendicularLinks` flag is set on the paper and there are vertices
                // on the link, then try to find a connection point that makes the link perpendicular
                // even though the link won't point to the center of the targeted object.
                anchorDef = { name: 'perpendicular' };
            } else {
                anchorDef = paperOptions.defaultAnchor;
            }
        }

        if (!anchorDef) throw new Error('Anchor required.');
        var anchorFn;
        if (typeof anchorDef === 'function') {
            anchorFn = anchorDef;
        } else {
            var anchorName = anchorDef.name;
            anchorFn = joint.anchors[anchorName];
            if (typeof anchorFn !== 'function') throw new Error('Unknown anchor: ' + anchorName);
        }
        var anchor = anchorFn.call(this, cellView, magnet, ref, anchorDef.args || {}, endType, this);
        if (anchor) return anchor.round(this.decimalsRounding);
        return new g.Point()
    },


    getConnectionPoint: function(connectionPointDef, view, magnet, line, endType) {

        var connectionPoint;
        var anchor = line.end;
        // Backwards compatibility
        var paperOptions = this.paper.options;
        if (typeof paperOptions.linkConnectionPoint === 'function') {
            var linkConnectionMagnet = (magnet === view.el) ? undefined : magnet;
            connectionPoint = paperOptions.linkConnectionPoint(this, view, linkConnectionMagnet, line.start, endType);
            if (connectionPoint) return connectionPoint;
        }

        if (!connectionPointDef) return anchor;
        var connectionPointFn;
        if (typeof connectionPointDef === 'function') {
            connectionPointFn = connectionPointDef;
        } else {
            var connectionPointName = connectionPointDef.name;
            connectionPointFn = joint.connectionPoints[connectionPointName];
            if (typeof connectionPointFn !== 'function') throw new Error('Unknown connection point: ' + connectionPointName);
        }
        connectionPoint = connectionPointFn.call(this, line, view, magnet, connectionPointDef.args || {}, endType, this);
        if (connectionPoint) return connectionPoint.round(this.decimalsRounding);
        return anchor;
    },

    _translateConnectionPoints: function(tx, ty) {

        var cache = this._markerCache;

        cache.sourcePoint.offset(tx, ty);
        cache.targetPoint.offset(tx, ty);
        this.sourcePoint.offset(tx, ty);
        this.targetPoint.offset(tx, ty);
        this.sourceAnchor.offset(tx, ty);
        this.targetAnchor.offset(tx, ty);
    },

    // if label position is a number, normalize it to a position object
    // this makes sure that label positions can be merged properly
    _normalizeLabelPosition: function(labelPosition) {

        if (typeof labelPosition === 'number') return { distance: labelPosition, offset: null, args: null };
        return labelPosition;
    },

    updateLabelPositions: function() {

        if (!this._V.labels) return this;

        var path = this.path;
        if (!path) return this;

        // This method assumes all the label nodes are stored in the `this._labelCache` hash table
        // by their indices in the `this.get('labels')` array. This is done in the `renderLabels()` method.

        var model = this.model;
        var labels = model.get('labels') || [];
        if (!labels.length) return this;

        var builtinDefaultLabel = model._builtins.defaultLabel;
        var builtinDefaultLabelPosition = builtinDefaultLabel.position;

        var defaultLabel = model._getDefaultLabel();
        var defaultLabelPosition = this._normalizeLabelPosition(defaultLabel.position);

        var defaultPosition = joint.util.merge({}, builtinDefaultLabelPosition, defaultLabelPosition);

        for (var idx = 0, n = labels.length; idx < n; idx++) {

            var label = labels[idx];
            var labelPosition = this._normalizeLabelPosition(label.position);

            var position = joint.util.merge({}, defaultPosition, labelPosition);

            var labelPoint = this.getLabelCoordinates(position);
            this._labelCache[idx].attr('transform', 'translate(' + labelPoint.x + ', ' + labelPoint.y + ')');
        }

        return this;
    },

    updateToolsPosition: function() {

        if (!this._V.linkTools) return this;

        // Move the tools a bit to the target position but don't cover the `sourceArrowhead` marker.
        // Note that the offset is hardcoded here. The offset should be always
        // more than the `this.$('.marker-arrowhead[end="source"]')[0].bbox().width` but looking
        // this up all the time would be slow.

        var scale = '';
        var offset = this.options.linkToolsOffset;
        var connectionLength = this.getConnectionLength();

        // Firefox returns connectionLength=NaN in odd cases (for bezier curves).
        // In that case we won't update tools position at all.
        if (!Number.isNaN(connectionLength)) {

            // If the link is too short, make the tools half the size and the offset twice as low.
            if (connectionLength < this.options.shortLinkLength) {
                scale = 'scale(.5)';
                offset /= 2;
            }

            var toolPosition = this.getPointAtLength(offset);

            this._toolCache.attr('transform', 'translate(' + toolPosition.x + ', ' + toolPosition.y + ') ' + scale);

            if (this.options.doubleLinkTools && connectionLength >= this.options.longLinkLength) {

                var doubleLinkToolsOffset = this.options.doubleLinkToolsOffset || offset;

                toolPosition = this.getPointAtLength(connectionLength - doubleLinkToolsOffset);
                this._tool2Cache.attr('transform', 'translate(' + toolPosition.x + ', ' + toolPosition.y + ') ' + scale);
                this._tool2Cache.attr('visibility', 'visible');

            } else if (this.options.doubleLinkTools) {

                this._tool2Cache.attr('visibility', 'hidden');
            }
        }

        return this;
    },

    updateArrowheadMarkers: function() {

        if (!this._V.markerArrowheads) return this;

        // getting bbox of an element with `display="none"` in IE9 ends up with access violation
        if ($.css(this._V.markerArrowheads.node, 'display') === 'none') return this;

        var sx = this.getConnectionLength() < this.options.shortLinkLength ? .5 : 1;
        this._V.sourceArrowhead.scale(sx);
        this._V.targetArrowhead.scale(sx);

        this._translateAndAutoOrientArrows(this._V.sourceArrowhead, this._V.targetArrowhead);

        return this;
    },

    // Returns a function observing changes on an end of the link. If a change happens and new end is a new model,
    // it stops listening on the previous one and starts listening to the new one.
    createWatcher: function(endType) {

        // create handler for specific end type (source|target).
        var onModelChange = function(endModel, opt) {
            this.onEndModelChange(endType, endModel, opt);
        };

        function watchEndModel(link, end) {

            end = end || {};

            var endModel = null;
            var previousEnd = link.previous(endType) || {};

            if (previousEnd.id) {
                this.stopListening(this.paper.getModelById(previousEnd.id), 'change', onModelChange);
            }

            if (end.id) {
                // If the observed model changes, it caches a new bbox and do the link update.
                endModel = this.paper.getModelById(end.id);
                this.listenTo(endModel, 'change', onModelChange);
            }

            onModelChange.call(this, endModel, { cacheOnly: true });

            return this;
        }

        return watchEndModel;
    },

    onEndModelChange: function(endType, endModel, opt) {

        var doUpdate = !opt.cacheOnly;
        var model = this.model;
        var end = model.get(endType) || {};

        if (endModel) {

            var selector = this.constructor.makeSelector(end);
            var oppositeEndType = endType == 'source' ? 'target' : 'source';
            var oppositeEnd = model.get(oppositeEndType) || {};
            var endId = end.id;
            var oppositeEndId = oppositeEnd.id;
            var oppositeSelector = oppositeEndId && this.constructor.makeSelector(oppositeEnd);

            // Caching end models bounding boxes.
            // If `opt.handleBy` equals the client-side ID of this link view and it is a loop link, then we already cached
            // the bounding boxes in the previous turn (e.g. for loop link, the change:source event is followed
            // by change:target and so on change:source, we already chached the bounding boxes of - the same - element).
            if (opt.handleBy === this.cid && (endId === oppositeEndId) && selector == oppositeSelector) {

                // Source and target elements are identical. We're dealing with a loop link. We are handling `change` event for the
                // second time now. There is no need to calculate bbox and find magnet element again.
                // It was calculated already for opposite link end.
                this[endType + 'View'] = this[oppositeEndType + 'View'];
                this[endType + 'Magnet'] = this[oppositeEndType + 'Magnet'];

            } else if (opt.translateBy) {
                // `opt.translateBy` optimizes the way we calculate bounding box of the source/target element.
                // If `opt.translateBy` is an ID of the element that was originally translated.

                // Noop

            } else {
                // The slowest path, source/target could have been rotated or resized or any attribute
                // that affects the bounding box of the view might have been changed.

                var connectedModel = this.paper.model.getCell(endId);
                if (!connectedModel) throw new Error('LinkView: invalid ' + endType + ' cell.');
                var connectedView = connectedModel.findView(this.paper);
                if (connectedView) {
                    var connectedMagnet = connectedView.getMagnetFromLinkEnd(end);
                    if (connectedMagnet === connectedView.el) connectedMagnet = null;
                    this[endType + 'View'] = connectedView;
                    this[endType + 'Magnet'] = connectedMagnet;
                } else {
                    // the view is not rendered yet
                    this[endType + 'View'] = this[endType + 'Magnet'] = null;
                }
            }

            if (opt.handleBy === this.cid && opt.translateBy &&
                model.isEmbeddedIn(endModel) &&
                !joint.util.isEmpty(model.get('vertices'))) {
                // Loop link whose element was translated and that has vertices (that need to be translated with
                // the parent in which my element is embedded).
                // If the link is embedded, has a loop and vertices and the end model
                // has been translated, do not update yet. There are vertices still to be updated (change:vertices
                // event will come in the next turn).
                doUpdate = false;
            }

            if (!this.updatePostponed && oppositeEndId) {
                // The update was not postponed (that can happen e.g. on the first change event) and the opposite
                // end is a model (opposite end is the opposite end of the link we're just updating, e.g. if
                // we're reacting on change:source event, the oppositeEnd is the target model).

                var oppositeEndModel = this.paper.getModelById(oppositeEndId);

                // Passing `handleBy` flag via event option.
                // Note that if we are listening to the same model for event 'change' twice.
                // The same event will be handled by this method also twice.
                if (end.id === oppositeEnd.id) {
                    // We're dealing with a loop link. Tell the handlers in the next turn that they should update
                    // the link instead of me. (We know for sure there will be a next turn because
                    // loop links react on at least two events: change on the source model followed by a change on
                    // the target model).
                    if (!opt.translateBy || joint.util.isEmpty(model.get('vertices')) || !model.isEmbeddedIn(opt.translateBy)) {
                        opt.handleBy = this.cid;
                    } else {
                        doUpdate = false;
                    }
                }

                if (doUpdate && (opt.handleBy === this.cid || (opt.translateBy && oppositeEndModel.isEmbeddedIn(opt.translateBy)))) {

                    // Here are two options:
                    // - Source and target are connected to the same model (not necessarily the same port).
                    // - Both end models are translated by the same ancestor. We know that opposite end
                    //   model will be translated in the next turn as well.
                    // In both situations there will be more changes on the model that trigger an
                    // update. So there is no need to update the linkView yet.
                    this.updatePostponed = true;
                    doUpdate = false;
                }
            }

        } else {

            // the link end is a point ~ rect 1x1
            this[endType + 'View'] = this[endType + 'Magnet'] = null;
        }

        if (doUpdate) {
            this.update(model, null, opt);
        }
    },

    _translateAndAutoOrientArrows: function(sourceArrow, targetArrow) {

        // Make the markers "point" to their sticky points being auto-oriented towards
        // `targetPosition`/`sourcePosition`. And do so only if there is a markup for them.
        var route = joint.util.toArray(this.route);
        if (sourceArrow) {
            sourceArrow.translateAndAutoOrient(
                this.sourcePoint,
                route[0] || this.targetPoint,
                this.paper.viewport
            );
        }

        if (targetArrow) {
            targetArrow.translateAndAutoOrient(
                this.targetPoint,
                route[route.length - 1] || this.sourcePoint,
                this.paper.viewport
            );
        }
    },

    _getDefaultLabelPositionArgs: function() {

        var defaultLabel = this.model._getDefaultLabel();
        var defaultLabelPosition = defaultLabel.position || {};
        return defaultLabelPosition.args;
    },

    _getLabelPositionArgs: function(idx) {

        var labelPosition = this.model.label(idx).position || {};
        return labelPosition.args;
    },

    // merge default label position args into label position args
    // keep `undefined` or `null` because `{}` means something else
    _mergeLabelPositionArgs: function(labelPositionArgs, defaultLabelPositionArgs) {

        if (labelPositionArgs === null) return null;
        if (labelPositionArgs === undefined) {

            if (defaultLabelPositionArgs === null) return null;
            return defaultLabelPositionArgs;
        }

        return joint.util.merge({}, defaultLabelPositionArgs, labelPositionArgs);
    },

    // Add default label at given position at end of `labels` array.
    // Assigns relative coordinates by default.
    // `opt.absoluteDistance` forces absolute coordinates.
    // `opt.reverseDistance` forces reverse absolute coordinates (if absoluteDistance = true).
    // `opt.absoluteOffset` forces absolute coordinates for offset.
    addLabel: function(x, y, opt) {

        // accept input in form `{ x, y }, opt` or `x, y, opt`
        var isPointProvided = (typeof x !== 'number');
        var localX = isPointProvided ? x.x : x;
        var localY = isPointProvided ? x.y : y;
        var localOpt = isPointProvided ? y : opt;

        var defaultLabelPositionArgs = this._getDefaultLabelPositionArgs();
        var labelPositionArgs = localOpt;
        var positionArgs = this._mergeLabelPositionArgs(labelPositionArgs, defaultLabelPositionArgs);

        var label = { position: this.getLabelPosition(localX, localY, positionArgs) };
        var idx = -1;
        this.model.insertLabel(idx, label, localOpt);
        return idx;
    },

    // Add a new vertex at calculated index to the `vertices` array.
    addVertex: function(x, y, opt) {

        // accept input in form `{ x, y }, opt` or `x, y, opt`
        var isPointProvided = (typeof x !== 'number');
        var localX = isPointProvided ? x.x : x;
        var localY = isPointProvided ? x.y : y;
        var localOpt = isPointProvided ? y : opt;

        var vertex = { x: localX, y: localY };
        var idx = this.getVertexIndex(localX, localY);
        this.model.insertVertex(idx, vertex, localOpt);
        return idx;
    },

    // Send a token (an SVG element, usually a circle) along the connection path.
    // Example: `link.findView(paper).sendToken(V('circle', { r: 7, fill: 'green' }).node)`
    // `opt.duration` is optional and is a time in milliseconds that the token travels from the source to the target of the link. Default is `1000`.
    // `opt.directon` is optional and it determines whether the token goes from source to target or other way round (`reverse`)
    // `opt.connection` is an optional selector to the connection path.
    // `callback` is optional and is a function to be called once the token reaches the target.
    sendToken: function(token, opt, callback) {

        function onAnimationEnd(vToken, callback) {
            return function() {
                vToken.remove();
                if (typeof callback === 'function') {
                    callback();
                }
            };
        }

        var duration, isReversed, selector;
        if (joint.util.isObject(opt)) {
            duration = opt.duration;
            isReversed = (opt.direction === 'reverse');
            selector = opt.connection;
        } else {
            // Backwards compatibility
            duration = opt;
            isReversed = false;
            selector = null;
        }

        duration = duration || 1000;

        var animationAttributes = {
            dur: duration + 'ms',
            repeatCount: 1,
            calcMode: 'linear',
            fill: 'freeze'
        };

        if (isReversed) {
            animationAttributes.keyPoints = '1;0';
            animationAttributes.keyTimes = '0;1';
        }

        var vToken = V(token);
        var connection;
        if (typeof selector === 'string') {
            // Use custom connection path.
            connection = this.findBySelector(selector, this.el, this.selectors)[0];
        } else {
            // Select connection path automatically.
            var cache = this._V;
            connection = (cache.connection) ? cache.connection.node : this.el.querySelector('path');
        }

        if (!(connection instanceof SVGPathElement)) {
            throw new Error('dia.LinkView: token animation requires a valid connection path.');
        }

        vToken
            .appendTo(this.paper.viewport)
            .animateAlongPath(animationAttributes, connection);

        setTimeout(onAnimationEnd(vToken, callback), duration);
    },

    findRoute: function(vertices) {

        vertices || (vertices = []);

        var namespace = joint.routers;
        var router = this.model.router();
        var defaultRouter = this.paper.options.defaultRouter;

        if (!router) {
            if (defaultRouter) router = defaultRouter;
            else return vertices.map(g.Point, g); // no router specified
        }

        var routerFn = joint.util.isFunction(router) ? router : namespace[router.name];
        if (!joint.util.isFunction(routerFn)) {
            throw new Error('dia.LinkView: unknown router: "' + router.name + '".');
        }

        var args = router.args || {};

        var route = routerFn.call(
            this, // context
            vertices, // vertices
            args, // options
            this // linkView
        );

        if (!route) return vertices.map(g.Point, g);
        return route;
    },

    // Return the `d` attribute value of the `<path>` element representing the link
    // between `source` and `target`.
    findPath: function(route, sourcePoint, targetPoint) {

        var namespace = joint.connectors;
        var connector = this.model.connector();
        var defaultConnector = this.paper.options.defaultConnector;

        if (!connector) {
            connector = defaultConnector || {};
        }

        var connectorFn = joint.util.isFunction(connector) ? connector : namespace[connector.name];
        if (!joint.util.isFunction(connectorFn)) {
            throw new Error('dia.LinkView: unknown connector: "' + connector.name + '".');
        }

        var args = joint.util.clone(connector.args || {});
        args.raw = true; // Request raw g.Path as the result.

        var path = connectorFn.call(
            this, // context
            sourcePoint, // start point
            targetPoint, // end point
            route, // vertices
            args, // options
            this // linkView
        );

        if (typeof path === 'string') {
            // Backwards compatibility for connectors not supporting `raw` option.
            path = new g.Path(V.normalizePathData(path));
        }

        return path;
    },

    // Public API.
    // -----------

    getConnection: function() {

        var path = this.path;
        if (!path) return null;

        return path.clone();
    },

    getSerializedConnection: function() {

        var path = this.path;
        if (!path) return null;

        var metrics = this.metrics;
        if (metrics.hasOwnProperty('data')) return metrics.data;
        var data = path.serialize();
        metrics.data = data;
        return data;
    },

    getConnectionSubdivisions: function() {

        var path = this.path;
        if (!path) return null;

        var metrics = this.metrics;
        if (metrics.hasOwnProperty('segmentSubdivisions')) return metrics.segmentSubdivisions;
        var subdivisions = path.getSegmentSubdivisions();
        metrics.segmentSubdivisions = subdivisions;
        return subdivisions;
    },

    getConnectionLength: function() {

        var path = this.path;
        if (!path) return 0;

        var metrics = this.metrics;
        if (metrics.hasOwnProperty('length')) return metrics.length;
        var length = path.length({ segmentSubdivisions: this.getConnectionSubdivisions() });
        metrics.length = length;
        return length;
    },

    getPointAtLength: function(length) {

        var path = this.path;
        if (!path) return null;

        return path.pointAtLength(length, { segmentSubdivisions: this.getConnectionSubdivisions() });
    },

    getPointAtRatio: function(ratio) {

        var path = this.path;
        if (!path) return null;

        return path.pointAt(ratio, { segmentSubdivisions: this.getConnectionSubdivisions() });
    },

    getTangentAtLength: function(length) {

        var path = this.path;
        if (!path) return null;

        return path.tangentAtLength(length, { segmentSubdivisions: this.getConnectionSubdivisions() });
    },

    getTangentAtRatio: function(ratio) {

        var path = this.path;
        if (!path) return null;

        return path.tangentAt(ratio, { segmentSubdivisions: this.getConnectionSubdivisions() });
    },

    getClosestPoint: function(point) {

        var path = this.path;
        if (!path) return null;

        return path.closestPoint(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
    },

    getClosestPointLength: function(point) {

        var path = this.path;
        if (!path) return null;

        return path.closestPointLength(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
    },

    getClosestPointRatio: function(point) {

        var path = this.path;
        if (!path) return null;

        return path.closestPointNormalizedLength(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
    },

    // accepts options `absoluteDistance: boolean`, `reverseDistance: boolean`, `absoluteOffset: boolean`
    // to move beyond connection endpoints, absoluteOffset has to be set
    getLabelPosition: function(x, y, opt) {

        var position = {};

        var localOpt = opt || {};
        if (opt) position.args = opt;

        var isDistanceRelative = !localOpt.absoluteDistance; // relative by default
        var isDistanceAbsoluteReverse = (localOpt.absoluteDistance && localOpt.reverseDistance); // non-reverse by default
        var isOffsetAbsolute = localOpt.absoluteOffset; // offset is non-absolute by default

        var path = this.path;
        var pathOpt = { segmentSubdivisions: this.getConnectionSubdivisions() };

        var labelPoint = new g.Point(x, y);
        var t = path.closestPointT(labelPoint, pathOpt);

        // GET DISTANCE:

        var labelDistance = path.lengthAtT(t, pathOpt);
        if (isDistanceRelative) labelDistance = (labelDistance / this.getConnectionLength()) || 0; // fix to prevent NaN for 0 length
        if (isDistanceAbsoluteReverse) labelDistance = (-1 * (this.getConnectionLength() - labelDistance)) || 1; // fix for end point (-0 => 1)

        position.distance = labelDistance;

        // GET OFFSET:
        // use absolute offset if:
        // - opt.absoluteOffset is true,
        // - opt.absoluteOffset is not true but there is no tangent

        var tangent;
        if (!isOffsetAbsolute) tangent = path.tangentAtT(t);

        var labelOffset;
        if (tangent) {
            labelOffset = tangent.pointOffset(labelPoint);

        } else {
            var closestPoint = path.pointAtT(t);
            var labelOffsetDiff = labelPoint.difference(closestPoint);
            labelOffset = { x: labelOffsetDiff.x, y: labelOffsetDiff.y };
        }

        position.offset = labelOffset;

        return position;
    },

    getLabelCoordinates: function(labelPosition) {

        var labelDistance;
        if (typeof labelPosition === 'number') labelDistance = labelPosition;
        else if (typeof labelPosition.distance === 'number') labelDistance = labelPosition.distance;
        else throw new Error('dia.LinkView: invalid label position distance.');

        var isDistanceRelative = ((labelDistance > 0) && (labelDistance <= 1));

        var labelOffset = 0;
        var labelOffsetCoordinates = { x: 0, y: 0 };
        if (labelPosition.offset) {
            var positionOffset = labelPosition.offset;
            if (typeof positionOffset === 'number') labelOffset = positionOffset;
            if (positionOffset.x) labelOffsetCoordinates.x = positionOffset.x;
            if (positionOffset.y) labelOffsetCoordinates.y = positionOffset.y;
        }

        var isOffsetAbsolute = ((labelOffsetCoordinates.x !== 0) || (labelOffsetCoordinates.y !== 0) || labelOffset === 0);

        var path = this.path;
        var pathOpt = { segmentSubdivisions: this.getConnectionSubdivisions() };

        var distance = isDistanceRelative ? (labelDistance * this.getConnectionLength()) : labelDistance;

        var point;

        if (isOffsetAbsolute) {
            point = path.pointAtLength(distance, pathOpt);
            point.offset(labelOffsetCoordinates);

        } else {
            var tangent = path.tangentAtLength(distance, pathOpt);

            if (tangent) {
                tangent.rotate(tangent.start, -90);
                tangent.setLength(labelOffset);
                point = tangent.end;

            } else {
                // fallback - the connection has zero length
                point = path.start;
            }
        }

        return point;
    },

    getVertexIndex: function(x, y) {

        var model = this.model;
        var vertices = model.vertices();

        var vertexLength = this.getClosestPointLength(new g.Point(x, y));

        var idx = 0;
        for (var n = vertices.length; idx < n; idx++) {
            var currentVertex = vertices[idx];
            var currentVertexLength = this.getClosestPointLength(currentVertex);
            if (vertexLength < currentVertexLength) break;
        }

        return idx;
    },

    // Interaction. The controller part.
    // ---------------------------------

    pointerdblclick: function(evt, x, y) {

        joint.dia.CellView.prototype.pointerdblclick.apply(this, arguments);
        this.notify('link:pointerdblclick', evt, x, y);
    },

    pointerclick: function(evt, x, y) {

        joint.dia.CellView.prototype.pointerclick.apply(this, arguments);
        this.notify('link:pointerclick', evt, x, y);
    },

    contextmenu: function(evt, x, y) {

        joint.dia.CellView.prototype.contextmenu.apply(this, arguments);
        this.notify('link:contextmenu', evt, x, y);
    },

    pointerdown: function(evt, x, y) {

        joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
        this.notify('link:pointerdown', evt, x, y);

        // Backwards compatibility for the default markup
        var className = evt.target.getAttribute('class');
        switch (className) {

            case 'marker-vertex':
                this.dragVertexStart(evt, x, y);
                return;

            case 'marker-vertex-remove':
            case 'marker-vertex-remove-area':
                this.dragVertexRemoveStart(evt, x, y);
                return;

            case 'marker-arrowhead':
                this.dragArrowheadStart(evt, x, y);
                return;

            case 'connection':
            case 'connection-wrap':
                this.dragConnectionStart(evt, x, y);
                return;

            case 'marker-source':
            case 'marker-target':
                return;
        }

        this.dragStart(evt, x, y);
    },

    pointermove: function(evt, x, y) {

        // Backwards compatibility
        var dragData = this._dragData;
        if (dragData) this.eventData(evt, dragData);

        var data = this.eventData(evt);
        switch (data.action) {

            case 'vertex-move':
                this.dragVertex(evt, x, y);
                break;

            case 'label-move':
                this.dragLabel(evt, x, y);
                break;

            case 'arrowhead-move':
                this.dragArrowhead(evt, x, y);
                break;

            case 'move':
                this.drag(evt, x, y);
                break;
        }

        // Backwards compatibility
        if (dragData) joint.util.assign(dragData, this.eventData(evt));

        joint.dia.CellView.prototype.pointermove.apply(this, arguments);
        this.notify('link:pointermove', evt, x, y);
    },

    pointerup: function(evt, x, y) {

        // Backwards compatibility
        var dragData = this._dragData;
        if (dragData) {
            this.eventData(evt, dragData);
            this._dragData = null;
        }

        var data = this.eventData(evt);
        switch (data.action) {

            case 'vertex-move':
                this.dragVertexEnd(evt, x, y);
                break;

            case 'label-move':
                this.dragLabelEnd(evt, x, y);
                break;

            case 'arrowhead-move':
                this.dragArrowheadEnd(evt, x, y);
                break;

            case 'move':
                this.dragEnd(evt, x, y);
        }

        this.notify('link:pointerup', evt, x, y);
        joint.dia.CellView.prototype.pointerup.apply(this, arguments);
    },

    mouseover: function(evt) {

        joint.dia.CellView.prototype.mouseover.apply(this, arguments);
        this.notify('link:mouseover', evt);
    },

    mouseout: function(evt) {

        joint.dia.CellView.prototype.mouseout.apply(this, arguments);
        this.notify('link:mouseout', evt);
    },

    mouseenter: function(evt) {

        joint.dia.CellView.prototype.mouseenter.apply(this, arguments);
        this.notify('link:mouseenter', evt);
    },

    mouseleave: function(evt) {

        joint.dia.CellView.prototype.mouseleave.apply(this, arguments);
        this.notify('link:mouseleave', evt);
    },

    mousewheel: function(evt, x, y, delta) {

        joint.dia.CellView.prototype.mousewheel.apply(this, arguments);
        this.notify('link:mousewheel', evt, x, y, delta);
    },

    onevent: function(evt, eventName, x, y) {

        // Backwards compatibility
        var linkTool = V(evt.target).findParentByClass('link-tool', this.el);
        if (linkTool) {
            // Allow `interactive.useLinkTools=false`
            if (this.can('useLinkTools')) {
                if (eventName === 'remove') {
                    // No further action to be executed
                    evt.stopPropagation();
                    // Built-in remove event
                    this.model.remove({ ui: true });

                } else {
                    // link:options and other custom events inside the link tools
                    this.notify(eventName, evt, x, y);
                }
            }

        } else {
            joint.dia.CellView.prototype.onevent.apply(this, arguments);
        }
    },

    onlabel: function(evt, x, y) {

        joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
        this.notify('link:pointerdown', evt, x, y);

        this.dragLabelStart(evt, x, y);

        var stopPropagation = this.eventData(evt).stopPropagation;
        if (stopPropagation) evt.stopPropagation();
    },

    // Drag Start Handlers

    dragConnectionStart: function(evt, x, y) {

        if (!this.can('vertexAdd')) return;

        // Store the index at which the new vertex has just been placed.
        // We'll be update the very same vertex position in `pointermove()`.
        var vertexIdx = this.addVertex({ x: x, y: y }, { ui: true });
        this.eventData(evt, {
            action: 'vertex-move',
            vertexIdx: vertexIdx
        });
    },

    dragLabelStart: function(evt, x, y) {

        if (!this.can('labelMove')) {
            // Backwards compatibility:
            // If labels can't be dragged no default action is triggered.
            this.eventData(evt, { stopPropagation: true });
            return;
        }

        var labelNode = evt.currentTarget;
        var labelIdx = parseInt(labelNode.getAttribute('label-idx'), 10);

        var defaultLabelPositionArgs = this._getDefaultLabelPositionArgs();
        var labelPositionArgs = this._getLabelPositionArgs(labelIdx);
        var positionArgs = this._mergeLabelPositionArgs(labelPositionArgs, defaultLabelPositionArgs);

        this.eventData(evt, {
            action: 'label-move',
            labelIdx: labelIdx,
            positionArgs: positionArgs,
            stopPropagation: true
        });

        this.paper.delegateDragEvents(this, evt.data);
    },

    dragVertexStart: function(evt, x, y) {

        if (!this.can('vertexMove')) return;

        var vertexNode = evt.target;
        var vertexIdx = parseInt(vertexNode.getAttribute('idx'), 10);
        this.eventData(evt, {
            action: 'vertex-move',
            vertexIdx: vertexIdx
        });
    },

    dragVertexRemoveStart: function(evt, x, y) {

        if (!this.can('vertexRemove')) return;

        var removeNode = evt.target;
        var vertexIdx = parseInt(removeNode.getAttribute('idx'), 10);
        this.model.removeVertex(vertexIdx);
    },

    dragArrowheadStart: function(evt, x, y) {

        if (!this.can('arrowheadMove')) return;

        var arrowheadNode = evt.target;
        var arrowheadType = arrowheadNode.getAttribute('end');
        var data = this.startArrowheadMove(arrowheadType, { ignoreBackwardsCompatibility: true });

        this.eventData(evt, data);
    },

    dragStart: function(evt, x, y) {

        if (!this.can('linkMove')) return;

        this.eventData(evt, {
            action: 'move',
            dx: x,
            dy: y
        });
    },

    // Drag Handlers

    dragLabel: function(evt, x, y) {

        var data = this.eventData(evt);
        var label = { position: this.getLabelPosition(x, y, data.positionArgs) };
        this.model.label(data.labelIdx, label);
    },

    dragVertex: function(evt, x, y) {

        var data = this.eventData(evt);
        this.model.vertex(data.vertexIdx, { x: x, y: y }, { ui: true });
    },

    dragArrowhead: function(evt, x, y) {

        var data = this.eventData(evt);

        if (this.paper.options.snapLinks) {

            this._snapArrowhead(x, y, data);

        } else {
            // Touchmove event's target is not reflecting the element under the coordinates as mousemove does.
            // It holds the element when a touchstart triggered.
            var target = (evt.type === 'mousemove')
                ? evt.target
                : document.elementFromPoint(evt.clientX, evt.clientY);

            this._connectArrowhead(target, x, y, data);
        }
    },

    drag: function(evt, x, y) {

        var data = this.eventData(evt);
        this.model.translate(x - data.dx, y - data.dy, { ui: true });
        this.eventData(evt, {
            dx: x,
            dy: y
        });
    },

    // Drag End Handlers

    dragLabelEnd: function() {
        // noop
    },

    dragVertexEnd: function() {
        // noop
    },

    dragArrowheadEnd: function(evt, x, y) {

        var data = this.eventData(evt);
        var paper = this.paper;

        if (paper.options.snapLinks) {
            this._snapArrowheadEnd(data);
        } else {
            this._connectArrowheadEnd(data, x, y);
        }

        if (!paper.linkAllowed(this)) {
            // If the changed link is not allowed, revert to its previous state.
            this._disallow(data);
        } else {
            this._finishEmbedding(data);
            this._notifyConnectEvent(data, evt);
        }

        this._afterArrowheadMove(data);

        // mouseleave event is not triggered due to changing pointer-events to `none`.
        if (!this.vel.contains(evt.target)) {
            this.mouseleave(evt);
        }
    },

    dragEnd: function() {
        // noop
    },

    _disallow: function(data) {

        switch (data.whenNotAllowed) {

            case 'remove':
                this.model.remove({ ui: true });
                break;

            case 'revert':
            default:
                this.model.set(data.arrowhead, data.initialEnd, { ui: true });
                break;
        }
    },

    _finishEmbedding: function(data) {

        // Reparent the link if embedding is enabled
        if (this.paper.options.embeddingMode && this.model.reparent()) {
            // Make sure we don't reverse to the original 'z' index (see afterArrowheadMove()).
            data.z = null;
        }
    },

    _notifyConnectEvent: function(data, evt) {

        var arrowhead = data.arrowhead;
        var initialEnd = data.initialEnd;
        var currentEnd = this.model.prop(arrowhead);
        var endChanged = currentEnd && !joint.dia.Link.endsEqual(initialEnd, currentEnd);
        if (endChanged) {
            var paper = this.paper;
            if (initialEnd.id) {
                this.notify('link:disconnect', evt, paper.findViewByModel(initialEnd.id), data.initialMagnet, arrowhead);
            }
            if (currentEnd.id) {
                this.notify('link:connect', evt, paper.findViewByModel(currentEnd.id), data.magnetUnderPointer, arrowhead);
            }
        }
    },

    _snapArrowhead: function(x, y, data) {

        // checking view in close area of the pointer

        var r = this.paper.options.snapLinks.radius || 50;
        var viewsInArea = this.paper.findViewsInArea({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });

        if (data.closestView) {
            data.closestView.unhighlight(data.closestMagnet, {
                connecting: true,
                snapping: true
            });
        }
        data.closestView = data.closestMagnet = null;

        var distance;
        var minDistance = Number.MAX_VALUE;
        var pointer = g.point(x, y);
        var paper = this.paper;

        viewsInArea.forEach(function(view) {

            // skip connecting to the element in case '.': { magnet: false } attribute present
            if (view.el.getAttribute('magnet') !== 'false') {

                // find distance from the center of the model to pointer coordinates
                distance = view.model.getBBox().center().distance(pointer);

                // the connection is looked up in a circle area by `distance < r`
                if (distance < r && distance < minDistance) {

                    if (paper.options.validateConnection.apply(
                        paper, data.validateConnectionArgs(view, null)
                    )) {
                        minDistance = distance;
                        data.closestView = view;
                        data.closestMagnet = view.el;
                    }
                }
            }

            view.$('[magnet]').each(function(index, magnet) {

                var bbox = view.getNodeBBox(magnet);

                distance = pointer.distance({
                    x: bbox.x + bbox.width / 2,
                    y: bbox.y + bbox.height / 2
                });

                if (distance < r && distance < minDistance) {

                    if (paper.options.validateConnection.apply(
                        paper, data.validateConnectionArgs(view, magnet)
                    )) {
                        minDistance = distance;
                        data.closestView = view;
                        data.closestMagnet = magnet;
                    }
                }

            }.bind(this));

        }, this);

        var end;
        var closestView = data.closestView;
        var closestMagnet = data.closestMagnet;
        var endType = data.arrowhead;
        if (closestView) {
            closestView.highlight(closestMagnet, {
                connecting: true,
                snapping: true
            });
            end = closestView.getLinkEnd(closestMagnet, x, y, this.model, endType);
        } else {
            end = { x: x, y: y };
        }

        this.model.set(endType, end || { x: x, y: y }, { ui: true });
    },

    _snapArrowheadEnd: function(data) {

        // Finish off link snapping.
        // Everything except view unhighlighting was already done on pointermove.
        var closestView = data.closestView;
        var closestMagnet = data.closestMagnet;
        if (closestView && closestMagnet) {

            closestView.unhighlight(closestMagnet, { connecting: true, snapping: true });
            data.magnetUnderPointer = closestView.findMagnet(closestMagnet);
        }

        data.closestView = data.closestMagnet = null;
    },

    _connectArrowhead: function(target, x, y, data) {

        // checking views right under the pointer

        if (data.eventTarget !== target) {
            // Unhighlight the previous view under pointer if there was one.
            if (data.magnetUnderPointer) {
                data.viewUnderPointer.unhighlight(data.magnetUnderPointer, {
                    connecting: true
                });
            }

            data.viewUnderPointer = this.paper.findView(target);
            if (data.viewUnderPointer) {
                // If we found a view that is under the pointer, we need to find the closest
                // magnet based on the real target element of the event.
                data.magnetUnderPointer = data.viewUnderPointer.findMagnet(target);

                if (data.magnetUnderPointer && this.paper.options.validateConnection.apply(
                    this.paper,
                    data.validateConnectionArgs(data.viewUnderPointer, data.magnetUnderPointer)
                )) {
                    // If there was no magnet found, do not highlight anything and assume there
                    // is no view under pointer we're interested in reconnecting to.
                    // This can only happen if the overall element has the attribute `'.': { magnet: false }`.
                    if (data.magnetUnderPointer) {
                        data.viewUnderPointer.highlight(data.magnetUnderPointer, {
                            connecting: true
                        });
                    }
                } else {
                    // This type of connection is not valid. Disregard this magnet.
                    data.magnetUnderPointer = null;
                }
            } else {
                // Make sure we'll unset previous magnet.
                data.magnetUnderPointer = null;
            }
        }

        data.eventTarget = target;

        this.model.set(data.arrowhead, { x: x, y: y }, { ui: true });
    },

    _connectArrowheadEnd: function(data, x, y) {

        var view = data.viewUnderPointer;
        var magnet = data.magnetUnderPointer;
        if (!magnet || !view) return;

        view.unhighlight(magnet, { connecting: true });

        var endType = data.arrowhead;
        var end = view.getLinkEnd(magnet, x, y, this.model, endType);
        this.model.set(endType, end, { ui: true });
    },

    _beforeArrowheadMove: function(data) {

        data.z = this.model.get('z');
        this.model.toFront();

        // Let the pointer propagate throught the link view elements so that
        // the `evt.target` is another element under the pointer, not the link itself.
        this.el.style.pointerEvents = 'none';

        if (this.paper.options.markAvailable) {
            this._markAvailableMagnets(data);
        }
    },

    _afterArrowheadMove: function(data) {

        if (data.z !== null) {
            this.model.set('z', data.z, { ui: true });
            data.z = null;
        }

        // Put `pointer-events` back to its original value. See `startArrowheadMove()` for explanation.
        // Value `auto` doesn't work in IE9. We force to use `visiblePainted` instead.
        // See `https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events`.
        this.el.style.pointerEvents = 'visiblePainted';

        if (this.paper.options.markAvailable) {
            this._unmarkAvailableMagnets(data);
        }
    },

    _createValidateConnectionArgs: function(arrowhead) {
        // It makes sure the arguments for validateConnection have the following form:
        // (source view, source magnet, target view, target magnet and link view)
        var args = [];

        args[4] = arrowhead;
        args[5] = this;

        var oppositeArrowhead;
        var i = 0;
        var j = 0;

        if (arrowhead === 'source') {
            i = 2;
            oppositeArrowhead = 'target';
        } else {
            j = 2;
            oppositeArrowhead = 'source';
        }

        var end = this.model.get(oppositeArrowhead);

        if (end.id) {
            var view = args[i] = this.paper.findViewByModel(end.id);
            var magnet = view.getMagnetFromLinkEnd(end);
            if (magnet === view.el) magnet = undefined;
            args[i + 1] = magnet;
        }

        function validateConnectionArgs(cellView, magnet) {
            args[j] = cellView;
            args[j + 1] = cellView.el === magnet ? undefined : magnet;
            return args;
        }

        return validateConnectionArgs;
    },

    _markAvailableMagnets: function(data) {

        function isMagnetAvailable(view, magnet) {
            var paper = view.paper;
            var validate = paper.options.validateConnection;
            return validate.apply(paper, this.validateConnectionArgs(view, magnet));
        }

        var paper = this.paper;
        var elements = paper.model.getElements();
        data.marked = {};

        for (var i = 0, n = elements.length; i < n; i++) {
            var view = elements[i].findView(paper);

            if (!view) {
                continue;
            }

            var magnets = Array.prototype.slice.call(view.el.querySelectorAll('[magnet]'));
            if (view.el.getAttribute('magnet') !== 'false') {
                // Element wrapping group is also a magnet
                magnets.push(view.el);
            }

            var availableMagnets = magnets.filter(isMagnetAvailable.bind(data, view));

            if (availableMagnets.length > 0) {
                // highlight all available magnets
                for (var j = 0, m = availableMagnets.length; j < m; j++) {
                    view.highlight(availableMagnets[j], { magnetAvailability: true });
                }
                // highlight the entire view
                view.highlight(null, { elementAvailability: true });

                data.marked[view.model.id] = availableMagnets;
            }
        }
    },

    _unmarkAvailableMagnets: function(data) {

        var markedKeys = Object.keys(data.marked);
        var id;
        var markedMagnets;

        for (var i = 0, n = markedKeys.length; i < n; i++) {
            id = markedKeys[i];
            markedMagnets = data.marked[id];

            var view = this.paper.findViewByModel(id);
            if (view) {
                for (var j = 0, m = markedMagnets.length; j < m; j++) {
                    view.unhighlight(markedMagnets[j], { magnetAvailability: true });
                }
                view.unhighlight(null, { elementAvailability: true });
            }
        }

        data.marked = null;
    },

    startArrowheadMove: function(end, opt) {

        opt || (opt = {});

        // Allow to delegate events from an another view to this linkView in order to trigger arrowhead
        // move without need to click on the actual arrowhead dom element.
        var data = {
            action: 'arrowhead-move',
            arrowhead: end,
            whenNotAllowed: opt.whenNotAllowed || 'revert',
            initialMagnet: this[end + 'Magnet'] || (this[end + 'View'] ? this[end + 'View'].el : null),
            initialEnd: joint.util.clone(this.model.get(end)),
            validateConnectionArgs: this._createValidateConnectionArgs(end)
        };

        this._beforeArrowheadMove(data);

        if (opt.ignoreBackwardsCompatibility !== true) {
            this._dragData = data;
        }

        return data;
    }
}, {

    makeSelector: function(end) {

        var selector = '';
        // `port` has a higher precendence over `selector`. This is because the selector to the magnet
        // might change while the name of the port can stay the same.
        if (end.port) {
            selector += '[port="' + end.port + '"]';
        } else if (end.selector) {
            selector +=  end.selector;
        }

        return selector;
    }

});


Object.defineProperty(joint.dia.LinkView.prototype, 'sourceBBox', {

    enumerable: true,

    get: function() {
        var sourceView = this.sourceView;
        var sourceMagnet = this.sourceMagnet;
        if (sourceView) {
            if (!sourceMagnet) sourceMagnet = sourceView.el;
            return sourceView.getNodeBBox(sourceMagnet);
        }
        var sourceDef = this.model.source();
        return new g.Rect(sourceDef.x, sourceDef.y, 1, 1);
    }

});

Object.defineProperty(joint.dia.LinkView.prototype, 'targetBBox', {

    enumerable: true,

    get: function() {
        var targetView = this.targetView;
        var targetMagnet = this.targetMagnet;
        if (targetView) {
            if (!targetMagnet) targetMagnet = targetView.el;
            return targetView.getNodeBBox(targetMagnet);
        }
        var targetDef = this.model.target();
        return new g.Rect(targetDef.x, targetDef.y, 1, 1);
    }
});
