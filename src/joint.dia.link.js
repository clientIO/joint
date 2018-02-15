
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

    labelMarkup: [
        '<g class="label">',
        '<rect />',
        '<text />',
        '</g>'
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

    source: function(source, opt) {

        // getter
        if (source === undefined) return this.get('source');
        // setter
        return this.set('source', source, opt);
    },

    target: function(target, opt) {

        // getter
        if (target === undefined) return this.get('target');
        // setter
        return this.set('target', target, opt);
    },

    parent: function() {

        // only getter
        return this.get('parent');
    },

    // Labels API

    // A convenient way to set labels. Currently set values will be mixined with `value` if used as a setter.
    label: function(idx, value, opt) {

        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : 0;
        // Is it a getter?
        if (arguments.length <= 1) return this.prop(['labels', idx]);
        return this.prop(['labels', idx], value, opt);
    },

    labels: function (labels, opt) {

        // Getter
        if (arguments.length === 0) {
            labels = this.get('labels');
            if (!Array.isArray(labels)) return [];
            return labels.slice();
        }
        // Setter
        if (!Array.isArray(labels)) labels = [];
        return this.set('labels', labels, opt);
    },

    addLabel: function (idx, value, opt) {

        var labels = this.labels();
        var n = labels.length;
        value || (value = { x: 0, y: 0 });
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : n;
        if (idx < 0) idx = n + idx + 1;
        labels.splice(idx, 0, value);
        return this.labels(labels, opt);
    },

    removeLabel: function (idx, opt) {

        var labels = this.labels();
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : -1;
        labels.splice(idx, 1);
        return this.labels(labels, opt);
    },

    // Vertices API

    vertex: function (idx, value, opt) {

        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : 0;
        // Is it a getter?
        if (arguments.length <= 1) return this.prop(['vertices', idx]);
        return this.prop(['vertices', idx], value, opt);
    },

    vertices: function (vertices, opt) {

        // Getter
        if (arguments.length === 0) {
            vertices = this.get('vertices');
            if (!Array.isArray(vertices)) return [];
            return vertices.slice();
        }
        // Setter
        if (!Array.isArray(vertices)) vertices = [];
        return this.set('vertices', vertices, opt);
    },

    addVertex: function (idx, value, opt) {

        var vertices = this.vertices();
        var n = vertices.length;
        value || (value = { x: 0, y: 0 });
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : n;
        if (idx < 0) idx = n + idx + 1;
        vertices.splice(idx, 0, value);
        return this.vertices(vertices, opt);
    },

    removeVertex: function (idx, opt) {

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

            var source = this.graph.getCell(this.source().id);
            var target = this.graph.getCell(this.target().id);
            var prevParent = this.graph.getCell(this.parent());

            if (source && target) {
                newParent = this.graph.getCommonAncestor(source, target);
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

            var sourceElement = this.graph.getCell(sourceId);
            var targetElement = this.graph.getCell(targetId);

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
    }
},
    {
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

        shortLinkLength: 100,
        doubleLinkTools: false,
        longLinkLength: 160,
        linkToolsOffset: 40,
        doubleLinkToolsOffset: 60,
        sampleInterval: 50,

        // Default attributes to maintain backwards compatibility
        labelAttrs: {
            text: {
                textAnchor: 'middle',
                fontSize: 14,
                fill: '#000000',
                pointerEvents: 'none',
                yAlignment: 'middle'
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
        }
    },

    _z: null,

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
        if (!opt.translateBy || !this.model.target().id) {
            opt.updateConnectionOnly = true;
            this.update(this.model, null, opt);
        }
    },

    onTargetChange: function(cell, target, opt) {

        // Start watching the new target model.
        this.watchTarget(cell, target);
        // See `onSourceChange` method.
        if (!opt.translateBy) {
            opt.updateConnectionOnly = true;
            this.update(this.model, null, opt);
        }
    },

    onVerticesChange: function(cell, changed, opt) {

        this.renderVertexMarkers();

        // If the vertices have been changed by a translation we do update only if the link was
        // the only link that was translated. If the link was translated via another element which the link
        // is embedded in, this element will be translated as well and that triggers an update.
        // Note that all embeds in a model are sorted - first comes links, then elements.
        if (!opt.translateBy || opt.translateBy === this.model.id) {
            // Vertices were changed (not as a reaction on translate)
            // or link.translate() was called or
            opt.updateConnectionOnly = true;
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
        var cache = this._V = {}; // vectorized markup;
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

    renderLabels: function() {

        var cache = this._V;
        var vLabels = cache.labels;
        var labelCache = this._labelCache = {};

        if (vLabels) vLabels.empty();

        var model = this.model;
        var labels = model.get('labels') || [];
        var labelsCount = labels.length;
        if (labelsCount === 0) {
            return this;
        }

        if (!vLabels) {
            // There is no label container in the markup but some labels are defined.
            vLabels = cache.labels = V('g').addClass('labels').appendTo(this.el);
        }

        // This is a prepared instance of a vectorized SVGDOM node for the label element resulting from
        // compilation of the labelTemplate. The purpose is that all labels will just `clone()` this
        // node to create a duplicate.
        var defaultLabelMarkup = model.get('labelMarkup') || model.labelMarkup;
        var defaultLabel = V(defaultLabelMarkup);

        for (var i = 0; i < labelsCount; i++) {

            var label = labels[i];
            var labelMarkup = label.markup;
            // Cache label nodes so that the `updateLabels()` can just update the label node positions.
            var vLabelNode = labelCache[i] = (labelMarkup)
                ? V('g').append(V(labelMarkup))
                : defaultLabel.clone();

            vLabelNode
                .addClass('label')
                .attr('label-idx', i)
                .appendTo(vLabels);
        }

        this.updateLabels();

        return this;
    },

    updateLabels: function() {

        if (!this._V.labels) {
            return this;
        }

        var labels = this.model.get('labels') || [];
        var canLabelMove = this.can('labelMove');

        for (var i = 0, n = labels.length; i < n; i++) {

            var vLabel = this._labelCache[i];
            var label = labels[i];

            vLabel.attr('cursor', (canLabelMove ? 'move' : 'default'));

            var labelAttrs = label.attrs;
            if (!label.markup) {
                labelAttrs = joint.util.merge({}, this.options.labelAttrs, labelAttrs);
            }

            this.updateDOMSubtreeAttributes(vLabel.node, labelAttrs, {
                rootBBox: new g.Rect(label.size)
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
        this.updateDOMSubtreeAttributes(this.el, this.model.attr());

        this.updateDefaultConnectionPath();

        // update the label position etc.
        this.updateLabelPositions();
        this.updateToolsPosition();
        this.updateArrowheadMarkers();

        // Local perpendicular flag (as opposed to one defined on paper).
        // Could be enabled inside a connector/router. It's valid only
        // during the update execution.
        this.options.perpendicular = null;
        // Mark that postponed update has been already executed.
        this.updatePostponed = false;

        return this;
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
            // Necessary path finding
            route = this.findRoute(model.vertices(), opt);
            // finds all the connection points taking new vertices into account
            this._findConnectionPoints(route);

            path = this.findPath(route);
        }

        this.route = route;
        this.path = path;
        this.metrics = {};
    },

    _findConnectionPoints: function(vertices) {

        // cache source and target points
        var sourcePoint, targetPoint, sourceMarkerPoint, targetMarkerPoint;
        var verticesArr = joint.util.toArray(vertices);

        var firstVertex = verticesArr[0];

        sourcePoint = this.getConnectionPoint(
            'source', this.model.source(), firstVertex || this.model.target()
        ).round();

        var lastVertex = verticesArr[verticesArr.length - 1];

        targetPoint = this.getConnectionPoint(
            'target', this.model.target(), lastVertex || sourcePoint
        ).round();

        // Move the source point by the width of the marker taking into account
        // its scale around x-axis. Note that scale is the only transform that
        // makes sense to be set in `.marker-source` attributes object
        // as all other transforms (translate/rotate) will be replaced
        // by the `translateAndAutoOrient()` function.
        var cache = this._markerCache;

        if (this._V.markerSource) {

            cache.sourceBBox = cache.sourceBBox || this._V.markerSource.getBBox();

            sourceMarkerPoint = g.point(sourcePoint).move(
                firstVertex || targetPoint,
                cache.sourceBBox.width * this._V.markerSource.scale().sx * -1
            ).round();
        }

        if (this._V.markerTarget) {

            cache.targetBBox = cache.targetBBox || this._V.markerTarget.getBBox();

            targetMarkerPoint = g.point(targetPoint).move(
                lastVertex || sourcePoint,
                cache.targetBBox.width * this._V.markerTarget.scale().sx * -1
            ).round();
        }

        // if there was no markup for the marker, use the connection point.
        cache.sourcePoint = sourceMarkerPoint || sourcePoint.clone();
        cache.targetPoint = targetMarkerPoint || targetPoint.clone();

        // make connection points public
        this.sourcePoint = sourcePoint;
        this.targetPoint = targetPoint;
    },

    _translateConnectionPoints: function(tx, ty) {

        var cache = this._markerCache;

        cache.sourcePoint.offset(tx, ty);
        cache.targetPoint.offset(tx, ty);
        this.sourcePoint.offset(tx, ty);
        this.targetPoint.offset(tx, ty);
    },

    updateLabelPositions: function() {

        if (!this._V.labels) return this;

        var path = this.path;
        if (!path) return this;

        // This method assumes all the label nodes are stored in the `this._labelCache` hash table
        // by their indexes in the `this.get('labels')` array. This is done in the `renderLabels()` method.

        var labels = this.model.get('labels') || [];
        if (!labels.length) return this;

        var connectionLength = this.getConnectionLength();

        for (var idx = 0, n = labels.length; idx < n; idx++) {

            var label = labels[idx];
            var position = label.position;
            var isPositionObject = joint.util.isObject(position);

            var distance = isPositionObject ? position.distance : position;
            var offset = isPositionObject ? position.offset : { x: 0, y: 0 };

            if (Number.isFinite(distance)) {
                distance = (distance > connectionLength) ? connectionLength : distance; // sanity check
                distance = (distance < 0) ? connectionLength + distance : distance;
                distance = (distance > 1) ? distance : connectionLength * distance;
            } else {
                distance = connectionLength / 2;
            }

            var tangent = this.getTangentAtLength(distance);
            var labelCoordinates = (tangent) ? tangent.start : path.start;

            if (joint.util.isObject(offset)) {

                // Just offset the label by the x,y provided in the offset object.
                labelCoordinates = labelCoordinates.clone().offset(offset);

            } else if (Number.isFinite(offset) && tangent) {

                // Offset the label based on the path tangent
                var angle = tangent.vector().vectorAngle(new g.Point(1,0));
                labelCoordinates = labelCoordinates.clone().offset(0, offset).rotate(labelCoordinates, -angle);
            }

            this._labelCache[idx].attr('transform', 'translate(' + labelCoordinates.x + ', ' + labelCoordinates.y + ')');
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
            var oppositeSelector = oppositeEnd.id && this.constructor.makeSelector(oppositeEnd);

            // Caching end models bounding boxes.
            // If `opt.handleBy` equals the client-side ID of this link view and it is a loop link, then we already cached
            // the bounding boxes in the previous turn (e.g. for loop link, the change:source event is followed
            // by change:target and so on change:source, we already chached the bounding boxes of - the same - element).
            if (opt.handleBy === this.cid && selector == oppositeSelector) {

                // Source and target elements are identical. We're dealing with a loop link. We are handling `change` event for the
                // second time now. There is no need to calculate bbox and find magnet element again.
                // It was calculated already for opposite link end.
                this[endType + 'BBox'] = this[oppositeEndType + 'BBox'];
                this[endType + 'View'] = this[oppositeEndType + 'View'];
                this[endType + 'Magnet'] = this[oppositeEndType + 'Magnet'];

            } else if (opt.translateBy) {
                // `opt.translateBy` optimizes the way we calculate bounding box of the source/target element.
                // If `opt.translateBy` is an ID of the element that was originally translated. This allows us
                // to just offset the cached bounding box by the translation instead of calculating the bounding
                // box from scratch on every translate.

                var bbox = this[endType + 'BBox'];
                bbox.x += opt.tx;
                bbox.y += opt.ty;

            } else {
                // The slowest path, source/target could have been rotated or resized or any attribute
                // that affects the bounding box of the view might have been changed.

                var view = this.paper.findViewByModel(end.id);
                var magnetElement = view.el.querySelector(selector);

                this[endType + 'BBox'] = view.getStrokeBBox(magnetElement);
                this[endType + 'View'] = view;
                this[endType + 'Magnet'] = magnetElement;
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

            if (!this.updatePostponed && oppositeEnd.id) {
                // The update was not postponed (that can happen e.g. on the first change event) and the opposite
                // end is a model (opposite end is the opposite end of the link we're just updating, e.g. if
                // we're reacting on change:source event, the oppositeEnd is the target model).

                var oppositeEndModel = this.paper.getModelById(oppositeEnd.id);

                // Passing `handleBy` flag via event option.
                // Note that if we are listening to the same model for event 'change' twice.
                // The same event will be handled by this method also twice.
                if (end.id === oppositeEnd.id) {
                    // We're dealing with a loop link. Tell the handlers in the next turn that they should update
                    // the link instead of me. (We know for sure there will be a next turn because
                    // loop links react on at least two events: change on the source model followed by a change on
                    // the target model).
                    opt.handleBy = this.cid;
                }

                if (opt.handleBy === this.cid || (opt.translateBy && oppositeEndModel.isEmbeddedIn(opt.translateBy))) {

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
            this[endType + 'BBox'] = g.rect(end.x || 0, end.y || 0, 1, 1);
            this[endType + 'View'] = this[endType + 'Magnet'] = null;
        }

        if (doUpdate) {
            opt.updateConnectionOnly = true;
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

    // This method adds a new label to the `labels` array.
    // Sorted by order of addition.
    addLabel: function(label, opt) {

        var link = this.model;
        var idx = -1; // add at end of `labels`

        link.addLabel(idx, label, opt);
        return idx;
    },

    // This method adds a new vertex at calculated index to the `vertices` array. This method
    // uses a heuristic to find the index at which the new `vertex` should be placed, assuming
    // that the new vertex is somewhere on the path.
    // Sorted by distance along path.
    addVertex: function(vertex, opt) {

        var link = this.model;
        var vertices = link.vertices();
        var vertexLength = this.getClosestPointLength(vertex);
        var idx = 0;

        for (var n = vertices.length; idx < n; idx++) {
            var currentVertex = vertices[idx];
            var currentVertexLength = this.getClosestPointLength(currentVertex);
            if (vertexLength < currentVertexLength) break;
        }

        link.addVertex(idx, vertex, opt);
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
            connection = this.findBySelector(selector)[0];
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

    findRoute: function(oldVertices) {

        var namespace = joint.routers;
        var router = this.model.get('router');
        var defaultRouter = this.paper.options.defaultRouter;

        if (!router) {

            if (this.model.get('manhattan')) {
                // backwards compability
                router = { name: 'orthogonal' };
            } else if (defaultRouter) {
                router = defaultRouter;
            } else {
                return oldVertices;
            }
        }

        var routerFn = joint.util.isFunction(router) ? router : namespace[router.name];
        if (!joint.util.isFunction(routerFn)) {
            throw new Error('unknown router: "' + router.name + '"');
        }

        var args = router.args || {};

        var newVertices = routerFn.call(this, oldVertices || [], args, this);

        return newVertices;
    },

    // Return the `d` attribute value of the `<path>` element representing the link
    // between `source` and `target`.
    findPath: function(route) {

        var namespace = joint.connectors;
        var connector = this.model.get('connector');
        var defaultConnector = this.paper.options.defaultConnector;

        if (!connector) {
            // backwards compability
            if (this.model.get('smooth')) {
                connector = { name: 'smooth' };
            } else {
                connector = defaultConnector || {};
            }
        }

        var connectorFn = joint.util.isFunction(connector) ? connector : namespace[connector.name];
        if (!joint.util.isFunction(connectorFn)) {
            throw new Error('unknown connector: "' + connector.name + '"');
        }

        var args = joint.util.clone(connector.args || {});
        // Request raw g.Path as the result.
        args.raw = true;

        var path = connectorFn.call(
            this,
            this._markerCache.sourcePoint, // Note that the value is translated by the size
            this._markerCache.targetPoint, // of the marker. (We'r not using this.sourcePoint)
            route || this.model.vertices(),
            args, // options
            this
        );

        if (typeof path === 'string') {
            // Backwards compatibility for connectors not supporting `raw` option.
            path = new g.Path(V.normalizePathData(path));
        }

        return path;
    },

    // Find a point that is the start of the connection.
    // If `selectorOrPoint` is a point, then we're done and that point is the start of the connection.
    // If the `selectorOrPoint` is an element however, we need to know a reference point (or element)
    // that the link leads to in order to determine the start of the connection on the original element.
    getConnectionPoint: function(end, selectorOrPoint, referenceSelectorOrPoint) {

        var spot;

        // If the `selectorOrPoint` (or `referenceSelectorOrPoint`) is `undefined`, the `source`/`target` of the link model is `undefined`.
        // We want to allow this however so that one can create links such as `var link = new joint.dia.Link` and
        // set the `source`/`target` later.
        joint.util.isEmpty(selectorOrPoint) && (selectorOrPoint = { x: 0, y: 0 });
        joint.util.isEmpty(referenceSelectorOrPoint) && (referenceSelectorOrPoint = { x: 0, y: 0 });

        if (!selectorOrPoint.id) {

            // If the source is a point, we don't need a reference point to find the sticky point of connection.
            spot = g.Point(selectorOrPoint);

        } else {

            // If the source is an element, we need to find a point on the element boundary that is closest
            // to the reference point (or reference element).
            // Get the bounding box of the spot relative to the paper viewport. This is necessary
            // in order to follow paper viewport transformations (scale/rotate).
            // `_sourceBbox` (`_targetBbox`) comes from `_sourceBboxUpdate` (`_sourceBboxUpdate`)
            // method, it exists since first render and are automatically updated
            var spotBBox = g.Rect(end === 'source' ? this.sourceBBox : this.targetBBox);

            var reference;

            if (!referenceSelectorOrPoint.id) {

                // Reference was passed as a point, therefore, we're ready to find the sticky point of connection on the source element.
                reference = g.Point(referenceSelectorOrPoint);

            } else {

                // Reference was passed as an element, therefore we need to find a point on the reference
                // element boundary closest to the source element.
                // Get the bounding box of the spot relative to the paper viewport. This is necessary
                // in order to follow paper viewport transformations (scale/rotate).
                var referenceBBox = g.Rect(end === 'source' ? this.targetBBox : this.sourceBBox);

                reference = referenceBBox.intersectionWithLineFromCenterToPoint(spotBBox.center());
                reference = reference || referenceBBox.center();
            }

            var paperOptions = this.paper.options;
            // If `perpendicularLinks` flag is set on the paper and there are vertices
            // on the link, then try to find a connection point that makes the link perpendicular
            // even though the link won't point to the center of the targeted object.
            if (paperOptions.perpendicularLinks || this.options.perpendicular) {

                var nearestSide;
                var spotOrigin = spotBBox.origin();
                var spotCorner = spotBBox.corner();

                if (spotOrigin.y <= reference.y && reference.y <= spotCorner.y) {

                    nearestSide = spotBBox.sideNearestToPoint(reference);
                    switch (nearestSide) {
                        case 'left':
                            spot = g.Point(spotOrigin.x, reference.y);
                            break;
                        case 'right':
                            spot = g.Point(spotCorner.x, reference.y);
                            break;
                        default:
                            spot = spotBBox.center();
                            break;
                    }

                } else if (spotOrigin.x <= reference.x && reference.x <= spotCorner.x) {

                    nearestSide = spotBBox.sideNearestToPoint(reference);
                    switch (nearestSide) {
                        case 'top':
                            spot = g.Point(reference.x, spotOrigin.y);
                            break;
                        case 'bottom':
                            spot = g.Point(reference.x, spotCorner.y);
                            break;
                        default:
                            spot = spotBBox.center();
                            break;
                    }

                } else {

                    // If there is no intersection horizontally or vertically with the object bounding box,
                    // then we fall back to the regular situation finding straight line (not perpendicular)
                    // between the object and the reference point.
                    spot = spotBBox.intersectionWithLineFromCenterToPoint(reference);
                    spot = spot || spotBBox.center();
                }

            } else if (paperOptions.linkConnectionPoint) {

                var view = (end === 'target') ? this.targetView : this.sourceView;
                var magnet = (end === 'target') ? this.targetMagnet : this.sourceMagnet;

                spot = paperOptions.linkConnectionPoint(this, view, magnet, reference, end);

            } else {

                spot = spotBBox.intersectionWithLineFromCenterToPoint(reference);
                spot = spot || spotBBox.center();
            }
        }

        return spot;
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

    getClosestPointNormalizedLength: function(point) {

        var path = this.path;
        if (!path) return null;

        return path.closestPointNormalizedLength(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
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

        this._dx = x;
        this._dy = y;

        // if are simulating pointerdown on a link during a magnet click, skip link interactions
        if (evt.target.getAttribute('magnet') != null) return;

        var className = joint.util.removeClassNamePrefix(evt.target.getAttribute('class'));
        var parentClassName = joint.util.removeClassNamePrefix(evt.target.parentNode.getAttribute('class'));
        var labelNode;
        if (parentClassName === 'label') {
            className = parentClassName;
            labelNode = evt.target.parentNode;
        } else {
            labelNode = evt.target;
        }

        switch (className) {

            case 'marker-vertex':
                if (this.can('vertexMove')) {
                    this._action = 'vertex-move';
                    this._vertexIdx = parseInt(evt.target.getAttribute('idx'), 10);
                }
                break;

            case 'marker-vertex-remove':
            case 'marker-vertex-remove-area':
                if (this.can('vertexRemove')) {
                    this.model.removeVertex(evt.target.getAttribute('idx'));
                }
                break;

            case 'marker-arrowhead':
                if (this.can('arrowheadMove')) {
                    this.startArrowheadMove(evt.target.getAttribute('end'));
                }
                break;

            case 'label':
                if (this.can('labelMove')) {
                    this._action = 'label-move';
                    this._labelIdx = parseInt(V(labelNode).attr('label-idx'), 10);
                }
                break;

            default:

                if (this.can('vertexAdd')) {

                    // Store the index at which the new vertex has just been placed.
                    // We'll be update the very same vertex position in `pointermove()`.
                    this._vertexIdx = this.addVertex({ x: x, y: y }, { ui: true });
                    this._action = 'vertex-move';
                }
        }
    },

    pointermove: function(evt, x, y) {

        switch (this._action) {

            case 'vertex-move':

                this.model.vertex(this._vertexIdx, { x: x, y: y }, { ui: true });
                break;

            case 'label-move':

                var dragPoint = { x: x, y: y };
                var path = this.path;
                var pathOpt = { segmentSubdivisions: this.getConnectionSubdivisions() };
                var t = path.closestPointT(dragPoint, pathOpt);
                var tangent = path.tangentAtT(t, pathOpt);
                var labelOffset = (tangent) ? tangent.pointOffset(dragPoint) : 0;
                var labelDistance = path.lengthAtT(t, pathOpt) / this.getConnectionLength();

                this.model.label(this._labelIdx, {
                    position: {
                        distance: labelDistance,
                        offset: labelOffset
                    }
                });
                break;

            case 'arrowhead-move':

                if (this.paper.options.snapLinks) {

                    // checking view in close area of the pointer

                    var r = this.paper.options.snapLinks.radius || 50;
                    var viewsInArea = this.paper.findViewsInArea({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });

                    if (this._closestView) {
                        this._closestView.unhighlight(this._closestEnd.selector, {
                            connecting: true,
                            snapping: true
                        });
                    }
                    this._closestView = this._closestEnd = null;

                    var distance;
                    var minDistance = Number.MAX_VALUE;
                    var pointer = g.point(x, y);

                    viewsInArea.forEach(function(view) {

                        // skip connecting to the element in case '.': { magnet: false } attribute present
                        if (view.el.getAttribute('magnet') !== 'false') {

                            // find distance from the center of the model to pointer coordinates
                            distance = view.model.getBBox().center().distance(pointer);

                            // the connection is looked up in a circle area by `distance < r`
                            if (distance < r && distance < minDistance) {

                                if (this.paper.options.validateConnection.apply(
                                    this.paper, this._validateConnectionArgs(view, null)
                                )) {
                                    minDistance = distance;
                                    this._closestView = view;
                                    this._closestEnd = { id: view.model.id };
                                }
                            }
                        }

                        view.$('[magnet]').each(function(index, magnet) {

                            var bbox = V(magnet).getBBox({ target: this.paper.viewport });

                            distance = pointer.distance({
                                x: bbox.x + bbox.width / 2,
                                y: bbox.y + bbox.height / 2
                            });

                            if (distance < r && distance < minDistance) {

                                if (this.paper.options.validateConnection.apply(
                                    this.paper, this._validateConnectionArgs(view, magnet)
                                )) {
                                    minDistance = distance;
                                    this._closestView = view;
                                    this._closestEnd = {
                                        id: view.model.id,
                                        selector: view.getSelector(magnet),
                                        port: magnet.getAttribute('port')
                                    };
                                }
                            }

                        }.bind(this));

                    }, this);

                    if (this._closestView) {
                        this._closestView.highlight(this._closestEnd.selector, {
                            connecting: true,
                            snapping: true
                        });
                    }

                    this.model.set(this._arrowhead, this._closestEnd || { x: x, y: y }, { ui: true });

                } else {

                    // checking views right under the pointer

                    // Touchmove event's target is not reflecting the element under the coordinates as mousemove does.
                    // It holds the element when a touchstart triggered.
                    var target = (evt.type === 'mousemove')
                        ? evt.target
                        : document.elementFromPoint(evt.clientX, evt.clientY);

                    if (this._eventTarget !== target) {
                        // Unhighlight the previous view under pointer if there was one.
                        if (this._magnetUnderPointer) {
                            this._viewUnderPointer.unhighlight(this._magnetUnderPointer, {
                                connecting: true
                            });
                        }

                        this._viewUnderPointer = this.paper.findView(target);
                        if (this._viewUnderPointer) {
                            // If we found a view that is under the pointer, we need to find the closest
                            // magnet based on the real target element of the event.
                            this._magnetUnderPointer = this._viewUnderPointer.findMagnet(target);

                            if (this._magnetUnderPointer && this.paper.options.validateConnection.apply(
                                this.paper,
                                this._validateConnectionArgs(this._viewUnderPointer, this._magnetUnderPointer)
                            )) {
                                // If there was no magnet found, do not highlight anything and assume there
                                // is no view under pointer we're interested in reconnecting to.
                                // This can only happen if the overall element has the attribute `'.': { magnet: false }`.
                                if (this._magnetUnderPointer) {
                                    this._viewUnderPointer.highlight(this._magnetUnderPointer, {
                                        connecting: true
                                    });
                                }
                            } else {
                                // This type of connection is not valid. Disregard this magnet.
                                this._magnetUnderPointer = null;
                            }
                        } else {
                            // Make sure we'll unset previous magnet.
                            this._magnetUnderPointer = null;
                        }
                    }

                    this._eventTarget = target;

                    this.model.set(this._arrowhead, { x: x, y: y }, { ui: true });
                }
                break;
        }

        this._dx = x;
        this._dy = y;

        joint.dia.CellView.prototype.pointermove.apply(this, arguments);
        this.notify('link:pointermove', evt, x, y);
    },

    pointerup: function(evt, x, y) {

        if (this._action === 'label-move') {

            // noop

        } else if (this._action === 'arrowhead-move') {

            var model = this.model;
            var paper = this.paper;
            var paperOptions = paper.options;
            var arrowhead = this._arrowhead;
            var initialEnd = this._initialEnd;
            var magnetUnderPointer;

            if (paperOptions.snapLinks) {

                // Finish off link snapping.
                // Everything except view unhighlighting was already done on pointermove.
                if (this._closestView) {
                    this._closestView.unhighlight(this._closestEnd.selector, {
                        connecting: true,
                        snapping: true
                    });

                    magnetUnderPointer = this._closestView.findMagnet(this._closestEnd.selector);
                }

                this._closestView = this._closestEnd = null;

            } else {

                var viewUnderPointer = this._viewUnderPointer;
                magnetUnderPointer = this._magnetUnderPointer;

                this._viewUnderPointer = null;
                this._magnetUnderPointer = null;

                if (magnetUnderPointer) {

                    viewUnderPointer.unhighlight(magnetUnderPointer, { connecting: true });
                    // Find a unique `selector` of the element under pointer that is a magnet. If the
                    // `this._magnetUnderPointer` is the root element of the `this._viewUnderPointer` itself,
                    // the returned `selector` will be `undefined`. That means we can directly pass it to the
                    // `source`/`target` attribute of the link model below.
                    var selector = viewUnderPointer.getSelector(magnetUnderPointer);
                    var port = magnetUnderPointer.getAttribute('port');
                    var arrowheadValue = { id: viewUnderPointer.model.id };
                    if (port != null) arrowheadValue.port = port;
                    if (selector != null) arrowheadValue.selector = selector;
                    model.set(arrowhead, arrowheadValue, { ui: true });
                }
            }

            // If the changed link is not allowed, revert to its previous state.
            if (!paper.linkAllowed(this)) {

                switch (this._whenNotAllowed) {

                    case 'remove':
                        model.remove({ ui: true });
                        break;

                    case 'revert':
                    default:
                        model.set(arrowhead, initialEnd, { ui: true });
                        break;
                }

            } else {

                // Reparent the link if embedding is enabled
                if (paperOptions.embeddingMode && model.reparent()) {
                    // Make sure we don't reverse to the original 'z' index (see afterArrowheadMove()).
                    this._z = null;
                }

                var currentEnd = model.prop(arrowhead);
                var endChanged = currentEnd && !joint.dia.Link.endsEqual(initialEnd, currentEnd);
                if (endChanged) {

                    if (initialEnd.id) {
                        this.notify('link:disconnect', evt, paper.findViewByModel(initialEnd.id), this._initialMagnet, arrowhead);
                    }
                    if (currentEnd.id) {
                        this.notify('link:connect', evt, paper.findViewByModel(currentEnd.id), magnetUnderPointer, arrowhead);
                    }
                }
            }

            this._afterArrowheadMove();
        }

        this._action = null;
        this._whenNotAllowed = null;
        this._initialMagnet = null;
        this._initialEnd = null;
        this._validateConnectionArgs = null;
        this._eventTarget = null;

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

    event: function(evt, eventName, x, y) {

        // Backwards compatibility
        var linkTool = V(evt.target).findParentByClass('link-tool', this.el);
        if (linkTool) {
            // No further action to be executed
            evt.stopPropagation();

            // Allow `interactive.useLinkTools=false`
            if (this.can('useLinkTools')) {
                if (eventName === 'remove') {
                    // Built-in remove event
                    this.model.remove({ ui: true });

                } else {
                    // link:options and other custom events inside the link tools
                    this.notify(eventName, evt, x, y);
                }
            }

        } else {
            joint.dia.CellView.prototype.event.apply(this, arguments);
        }
    },

    _beforeArrowheadMove: function() {

        this._z = this.model.get('z');
        this.model.toFront();

        // Let the pointer propagate throught the link view elements so that
        // the `evt.target` is another element under the pointer, not the link itself.
        this.el.style.pointerEvents = 'none';

        if (this.paper.options.markAvailable) {
            this._markAvailableMagnets();
        }
    },

    _afterArrowheadMove: function() {

        if (this._z !== null) {
            this.model.set('z', this._z, { ui: true });
            this._z = null;
        }

        // Put `pointer-events` back to its original value. See `startArrowheadMove()` for explanation.
        // Value `auto` doesn't work in IE9. We force to use `visiblePainted` instead.
        // See `https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events`.
        this.el.style.pointerEvents = 'visiblePainted';

        if (this.paper.options.markAvailable) {
            this._unmarkAvailableMagnets();
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
            args[i] = this.paper.findViewByModel(end.id);
            args[i + 1] = end.selector && args[i].el.querySelector(end.selector);
        }

        function validateConnectionArgs(cellView, magnet) {
            args[j] = cellView;
            args[j + 1] = cellView.el === magnet ? undefined : magnet;
            return args;
        }

        return validateConnectionArgs;
    },

    _markAvailableMagnets: function() {

        function isMagnetAvailable(view, magnet) {
            var paper = view.paper;
            var validate = paper.options.validateConnection;
            return validate.apply(paper, this._validateConnectionArgs(view, magnet));
        }

        var paper = this.paper;
        var elements = paper.model.getElements();
        this._marked = {};

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

            var availableMagnets = magnets.filter(isMagnetAvailable.bind(this, view));

            if (availableMagnets.length > 0) {
                // highlight all available magnets
                for (var j = 0, m = availableMagnets.length; j < m; j++) {
                    view.highlight(availableMagnets[j], { magnetAvailability: true });
                }
                // highlight the entire view
                view.highlight(null, { elementAvailability: true });

                this._marked[view.model.id] = availableMagnets;
            }
        }
    },

    _unmarkAvailableMagnets: function() {

        var markedKeys = Object.keys(this._marked);
        var id;
        var markedMagnets;

        for (var i = 0, n = markedKeys.length; i < n; i++) {
            id = markedKeys[i];
            markedMagnets = this._marked[id];

            var view = this.paper.findViewByModel(id);
            if (view) {
                for (var j = 0, m = markedMagnets.length; j < m; j++) {
                    view.unhighlight(markedMagnets[j], { magnetAvailability: true });
                }
                view.unhighlight(null, { elementAvailability: true });
            }
        }

        this._marked = null;
    },

    startArrowheadMove: function(end, opt) {

        opt = joint.util.defaults(opt || {}, { whenNotAllowed: 'revert' });
        // Allow to delegate events from an another view to this linkView in order to trigger arrowhead
        // move without need to click on the actual arrowhead dom element.
        this._action = 'arrowhead-move';
        this._whenNotAllowed = opt.whenNotAllowed;
        this._arrowhead = end;
        this._initialMagnet = this[end + 'Magnet'] || (this[end + 'View'] ? this[end + 'View'].el : null);
        this._initialEnd = joint.util.assign({}, this.model.get(end)) || { x: 0, y: 0 };
        this._validateConnectionArgs = this._createValidateConnectionArgs(this._arrowhead);
        this._beforeArrowheadMove();
    }
}, {

    makeSelector: function(end) {

        var selector = '[model-id="' + end.id + '"]';
        // `port` has a higher precendence over `selector`. This is because the selector to the magnet
        // might change while the name of the port can stay the same.
        if (end.port) {
            selector += ' [port="' + end.port + '"]';
        } else if (end.selector) {
            selector += ' ' + end.selector;
        }

        return selector;
    }

});
