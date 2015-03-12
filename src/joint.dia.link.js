//      JointJS diagramming library.
//      (c) 2011-2013 client IO


if (typeof exports === 'object') {

    var joint = {
        dia: {
            Cell: require('./joint.dia.cell').Cell,
            CellView: require('./joint.dia.cell').CellView
        }
    };
    var Backbone = require('backbone');
    var _ = require('lodash');
    var g = require('./geometry');
}



// joint.dia.Link base model.
// --------------------------
joint.dia.Link = joint.dia.Cell.extend({

    // The default markup for links.
    markup: [
        '<path class="connection" stroke="black"/>',
        '<path class="marker-source" fill="black" stroke="black" />',
        '<path class="marker-target" fill="black" stroke="black" />',
        '<path class="connection-wrap"/>',
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
        '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
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

    disconnect: function() {

        return this.set({ source: g.point(0, 0), target: g.point(0, 0) });
    },

    // A convenient way to set labels. Currently set values will be mixined with `value` if used as a setter.
    label: function(idx, value) {

        idx = idx || 0;
        
        var labels = this.get('labels') || [];
        
        // Is it a getter?
        if (arguments.length === 0 || arguments.length === 1) {
            
            return labels[idx];
        }

        var newValue = _.merge({}, labels[idx], value);

        var newLabels = labels.slice();
        newLabels[idx] = newValue;
        
        return this.set({ labels: newLabels });
    },

    translate: function(tx, ty, opt) {

        var attrs = {};
        var source = this.get('source');
        var target = this.get('target');
        var vertices = this.get('vertices');

        if (!source.id) {
            attrs.source = { x: source.x + tx, y: source.y + ty };
        }

        if (!target.id) {
            attrs.target = { x: target.x + tx, y: target.y + ty };
        }

        if (vertices && vertices.length) {
            attrs.vertices = _.map(vertices, function(vertex) {
                return { x: vertex.x + tx, y: vertex.y + ty };
            });
        }

        return this.set(attrs, opt);
    },

    reparent: function(opt) {

        var newParent;

        if (this.collection) {

            var source = this.collection.get(this.get('source').id);
            var target = this.collection.get(this.get('target').id);
            var prevParent = this.collection.get(this.get('parent'));

            if (source && target) {
                newParent = this.collection.getCommonAncestor(source, target);
            }

            if (prevParent && (!newParent || newParent.id != prevParent.id)) {
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

    isLink: function() {

        return true;
    },

    hasLoop: function() {

        var sourceId = this.get('source').id;
        var targetId = this.get('target').id;

        return sourceId && targetId && sourceId == targetId;
    }
});


// joint.dia.Link base view and controller.
// ----------------------------------------

joint.dia.LinkView = joint.dia.CellView.extend({

    className: function() {
        return _.unique(this.model.get('type').split('.').concat('link')).join(' ');
    },

    options: {

        shortLinkLength: 100,
        doubleLinkTools: false,
        longLinkLength: 160,
        linkToolsOffset: 40,
        doubleLinkToolsOffset: 60
    },
    
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

        // bind events
        this.startListening();
    },

    startListening: function() {

	this.listenTo(this.model, 'change:markup', this.render);
	this.listenTo(this.model, 'change:smooth change:manhattan change:router change:connector', this.update);
        this.listenTo(this.model, 'change:toolMarkup', function() {
            this.renderTools().updateToolsPosition();
        });
	this.listenTo(this.model, 'change:labels change:labelMarkup', function() {
            this.renderLabels().updateLabelPositions();
        });
        this.listenTo(this.model, 'change:vertices change:vertexMarkup', function(cell, changed, opt) {
            this.renderVertexMarkers();
            // If the vertices have been changed by a translation we do update only if the link was
            // only one translated. If the link was translated via another element which the link
            // is embedded in, this element will be translated as well and that triggers an update.
            // Note that all embeds in a model are sorted - first comes links, then elements.
            if (!opt.translateBy || (opt.translateBy == this.model.id || this.model.hasLoop())) {
                this.update();
            }
        });
	this.listenTo(this.model, 'change:source', function(cell, source) {
            this.watchSource(cell, source).update();
        });
	this.listenTo(this.model, 'change:target', function(cell, target) {
            this.watchTarget(cell, target).update();
        });
    },

    // Rendering
    //----------

    render: function() {

	this.$el.empty();

        // A special markup can be given in the `properties.markup` property. This might be handy
        // if e.g. arrowhead markers should be `<image>` elements or any other element than `<path>`s.
        // `.connection`, `.connection-wrap`, `.marker-source` and `.marker-target` selectors
        // of elements with special meaning though. Therefore, those classes should be preserved in any
        // special markup passed in `properties.markup`.
        var children = V(this.model.get('markup') || this.model.markup);

        // custom markup may contain only one children
        if (!_.isArray(children)) children = [children];

        // Cache all children elements for quicker access.
        this._V = {}; // vectorized markup;
        _.each(children, function(child) {
            var c = child.attr('class');
            c && (this._V[$.camelCase(c)] = child);
        }, this);

        // Only the connection path is mandatory
        if (!this._V.connection) throw new Error('link: no connection path in the markup');

        // partial rendering
        this.renderTools();
        this.renderVertexMarkers();
        this.renderArrowheadMarkers();

        V(this.el).append(children);

        // rendering labels has to be run after the link is appended to DOM tree. (otherwise <Text> bbox
        // returns zero values)
        this.renderLabels();

        // start watching the ends of the link for changes
        this.watchSource(this.model, this.model.get('source'))
            .watchTarget(this.model, this.model.get('target'))
            .update();

        return this;
    },

    renderLabels: function() {

        if (!this._V.labels) return this;

        this._labelCache = {};
        var $labels = $(this._V.labels.node).empty();

        var labels = this.model.get('labels') || [];
        if (!labels.length) return this;
        
        var labelTemplate = _.template(this.model.get('labelMarkup') || this.model.labelMarkup);
        // This is a prepared instance of a vectorized SVGDOM node for the label element resulting from
        // compilation of the labelTemplate. The purpose is that all labels will just `clone()` this
        // node to create a duplicate.
        var labelNodeInstance = V(labelTemplate());

        _.each(labels, function(label, idx) {

            var labelNode = labelNodeInstance.clone().node;
            // Cache label nodes so that the `updateLabels()` can just update the label node positions.
            this._labelCache[idx] = V(labelNode);

            var $text = $(labelNode).find('text');
            var $rect = $(labelNode).find('rect');

            // Text attributes with the default `text-anchor` and font-size set.
            var textAttributes = _.extend({ 'text-anchor': 'middle', 'font-size': 14 }, joint.util.getByPath(label, 'attrs/text', '/'));
            
            $text.attr(_.omit(textAttributes, 'text'));
                
            if (!_.isUndefined(textAttributes.text)) {

                V($text[0]).text(textAttributes.text + '');
            }

            // Note that we first need to append the `<text>` element to the DOM in order to
            // get its bounding box.
            $labels.append(labelNode);

            // `y-alignment` - center the text element around its y coordinate.
            var textBbox = V($text[0]).bbox(true, $labels[0]);
            V($text[0]).translate(0, -textBbox.height/2);

            // Add default values.
            var rectAttributes = _.extend({

                fill: 'white',
                rx: 3,
                ry: 3
                
            }, joint.util.getByPath(label, 'attrs/rect', '/'));
            
            $rect.attr(_.extend(rectAttributes, {

                x: textBbox.x,
                y: textBbox.y - textBbox.height/2,  // Take into account the y-alignment translation.
                width: textBbox.width,
                height: textBbox.height
            }));
            
        }, this);

        return this;
    },

    renderTools: function() {

        if (!this._V.linkTools) return this;

        // Tools are a group of clickable elements that manipulate the whole link.
        // A good example of this is the remove tool that removes the whole link.
        // Tools appear after hovering the link close to the `source` element/point of the link
        // but are offset a bit so that they don't cover the `marker-arrowhead`.

        var $tools = $(this._V.linkTools.node).empty();
        var toolTemplate = _.template(this.model.get('toolMarkup') || this.model.toolMarkup);
        var tool = V(toolTemplate());

        $tools.append(tool.node);
        
        // Cache the tool node so that the `updateToolsPosition()` can update the tool position quickly.
        this._toolCache = tool;

        // If `doubleLinkTools` is enabled, we render copy of the tools on the other side of the
        // link as well but only if the link is longer than `longLinkLength`.
        if (this.options.doubleLinkTools) {

            var tool2 = tool.clone();
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
        var markupTemplate = _.template(this.model.get('vertexMarkup') || this.model.vertexMarkup);
        
        _.each(this.model.get('vertices'), function(vertex, idx) {

            $markerVertices.append(V(markupTemplate(_.extend({ idx: idx }, vertex))).node);
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
        var markupTemplate = _.template(this.model.get('arrowheadMarkup') || this.model.arrowheadMarkup);

        this._V.sourceArrowhead = V(markupTemplate({ end: 'source' }));
        this._V.targetArrowhead = V(markupTemplate({ end: 'target' }));

        $markerArrowheads.append(this._V.sourceArrowhead.node, this._V.targetArrowhead.node);

        return this;
    },

    // Updating
    //---------

    // Default is to process the `attrs` object and set attributes on subelements based on the selectors.
    update: function() {

        // Update attributes.
        _.each(this.model.get('attrs'), function(attrs, selector) {

            var processedAttributes = [];

            // If the `fill` or `stroke` attribute is an object, it is in the special JointJS gradient format and so
            // it becomes a special attribute and is treated separately.
            if (_.isObject(attrs.fill)) {

                this.applyGradient(selector, 'fill', attrs.fill);
                processedAttributes.push('fill');
            }

            if (_.isObject(attrs.stroke)) {

                this.applyGradient(selector, 'stroke', attrs.stroke);
                processedAttributes.push('stroke');
            }

            // If the `filter` attribute is an object, it is in the special JointJS filter format and so
            // it becomes a special attribute and is treated separately.
            if (_.isObject(attrs.filter)) {

                this.applyFilter(selector, attrs.filter);
                processedAttributes.push('filter');
            }

            // remove processed special attributes from attrs
            if (processedAttributes.length > 0) {

                processedAttributes.unshift(attrs);
                attrs = _.omit.apply(_, processedAttributes);
            }

            this.findBySelector(selector).attr(attrs);

        }, this);

        // Path finding
        var vertices = this.route = this.findRoute(this.model.get('vertices') || []);

        // finds all the connection points taking new vertices into account
        this._findConnectionPoints(vertices);

        var pathData = this.getPathData(vertices);

        // The markup needs to contain a `.connection`
        this._V.connection.attr('d', pathData);
        this._V.connectionWrap && this._V.connectionWrap.attr('d', pathData);

        this._translateAndAutoOrientArrows(this._V.markerSource, this._V.markerTarget);

        //partials updates
        this.updateLabelPositions();
        this.updateToolsPosition();
        this.updateArrowheadMarkers();

        delete this.options.perpendicular;
        // Mark that postponed update has been already executed.
        this.updatePostponed = false;

        return this;
    },

    _findConnectionPoints: function(vertices) {

        // cache source and target points
        var sourcePoint, targetPoint, sourceMarkerPoint, targetMarkerPoint;

        var firstVertex = _.first(vertices);

        sourcePoint = this.getConnectionPoint(
            'source', this.model.get('source'), firstVertex || this.model.get('target')
        ).round();

        var lastVertex = _.last(vertices);

        targetPoint = this.getConnectionPoint(
            'target', this.model.get('target'), lastVertex || sourcePoint
        ).round();

        // Move the source point by the width of the marker taking into account
        // its scale around x-axis. Note that scale is the only transform that
        // makes sense to be set in `.marker-source` attributes object
        // as all other transforms (translate/rotate) will be replaced
        // by the `translateAndAutoOrient()` function.
        var cache = this._markerCache;

        if (this._V.markerSource) {

            cache.sourceBBox = cache.sourceBBox || this._V.markerSource.bbox(true);

            sourceMarkerPoint = g.point(sourcePoint).move(
                firstVertex || targetPoint,
                cache.sourceBBox.width * this._V.markerSource.scale().sx * -1
            ).round();
        }

        if (this._V.markerTarget) {

            cache.targetBBox = cache.targetBBox || this._V.markerTarget.bbox(true);

            targetMarkerPoint = g.point(targetPoint).move(
                lastVertex || sourcePoint,
                cache.targetBBox.width * this._V.markerTarget.scale().sx * -1
            ).round();
        }

        // if there was no markup for the marker, use the connection point.
        cache.sourcePoint = sourceMarkerPoint || sourcePoint;
        cache.targetPoint = targetMarkerPoint || targetPoint;

        // make connection points public
        this.sourcePoint = sourcePoint;
        this.targetPoint = targetPoint;
    },

    updateLabelPositions: function() {

        if (!this._V.labels) return this;

        // This method assumes all the label nodes are stored in the `this._labelCache` hash table
        // by their indexes in the `this.get('labels')` array. This is done in the `renderLabels()` method.

        var labels = this.model.get('labels') || [];
        if (!labels.length) return this;

        var connectionElement = this._V.connection.node;
        var connectionLength = connectionElement.getTotalLength();

        // Firefox returns connectionLength=NaN in odd cases (for bezier curves).
        // In that case we won't update labels at all.
        if (!_.isNaN(connectionLength)) {

            _.each(labels, function(label, idx) {

                var position = label.position;
                position = (position > connectionLength) ? connectionLength : position; // sanity check
                position = (position < 0) ? connectionLength + position : position;
                position = position > 1 ? position : connectionLength * position;

                var labelCoordinates = connectionElement.getPointAtLength(position);

                this._labelCache[idx].attr('transform', 'translate(' + labelCoordinates.x + ', ' + labelCoordinates.y + ')');

            }, this);
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
        var onModelChange = _.partial(this.onEndModelChange, endType);

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
        var end = this.model.get(endType) || {};

        if (endModel) {

            var selector = this.constructor.makeSelector(end);
            var oppositeEndType = endType == 'source' ? 'target' : 'source';
            var oppositeEnd = this.model.get(oppositeEndType) || {};
            var oppositeSelector = oppositeEnd.id && this.constructor.makeSelector(oppositeEnd);

            // Caching end models bounding boxes
            if (opt.isLoop && selector == oppositeSelector) {

                // Source and target elements are identical. We are handling `change` event for the
                // second time now. There is no need to calculate bbox and find magnet element again.
                // It was calculated already for opposite link end.
                this[endType + 'BBox'] = this[oppositeEndType + 'BBox'];
	        this[endType + 'View'] = this[oppositeEndType + 'View'];
	        this[endType + 'Magnet'] = this[oppositeEndType + 'Magnet'];

            } else if (opt.translateBy) {

                var bbox = this[endType + 'BBox'];
                bbox.x += opt.tx;
                bbox.y += opt.ty;

            } else {

                var view = this.paper.findViewByModel(end.id);
                var magnetElement = view.el.querySelector(selector);

                this[endType + 'BBox'] = view.getStrokeBBox(magnetElement);
	        this[endType + 'View'] = view;
	        this[endType + 'Magnet'] = magnetElement;
            }

            if (opt.isLoop && opt.translateBy &&
                this.model.isEmbeddedIn(endModel) &&
                !_.isEmpty(this.model.get('vertices'))) {
                // If the link is embedded, has a loop and vertices and the end model
                // has been translated, do not update yet. There are vertices still to be updated.
                doUpdate = false;
            }

            if (!this.updatePostponed && oppositeEnd.id) {

                var oppositeEndModel = this.paper.getModelById(oppositeEnd.id);

                // Passing `isLoop` flag via event option.
                // Note that if we are listening to the same model for event 'change' twice.
                // The same event will be handled by this method also twice.
                opt.isLoop = end.id == oppositeEnd.id;

                if (opt.isLoop || (opt.translateBy && oppositeEndModel.isEmbeddedIn(opt.translateBy))) {

                    // Here are two options:
                    // - Source and target are connected to the same model (not necessary the same port)
                    // - both end models are translated by same ancestor. We know that opposte end
                    //   model will be translated in the moment as well.
                    // In both situations there will be more changes on model that will trigger an
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

        // keep track which end had been changed very last
        this.lastEndChange = endType;

        doUpdate && this.update();
    },

    _translateAndAutoOrientArrows: function(sourceArrow, targetArrow) {

        // Make the markers "point" to their sticky points being auto-oriented towards
        // `targetPosition`/`sourcePosition`. And do so only if there is a markup for them.
        if (sourceArrow) {
            sourceArrow.translateAndAutoOrient(
                this.sourcePoint,
                _.first(this.route) || this.targetPoint,
                this.paper.viewport
            );
        }

        if (targetArrow) {
            targetArrow.translateAndAutoOrient(
                this.targetPoint,
                _.last(this.route) || this.sourcePoint,
                this.paper.viewport
            );
        }
    },

    removeVertex: function(idx) {

        var vertices = _.clone(this.model.get('vertices'));
        
        if (vertices && vertices.length) {

            vertices.splice(idx, 1);
            this.model.set('vertices', vertices, { ui: true });
        }

        return this;
    },

    // This method ads a new vertex to the `vertices` array of `.connection`. This method
    // uses a heuristic to find the index at which the new `vertex` should be placed at assuming
    // the new vertex is somewhere on the path.
    addVertex: function(vertex) {

        // As it is very hard to find a correct index of the newly created vertex,
        // a little heuristics is taking place here.
        // The heuristics checks if length of the newly created
        // path is lot more than length of the old path. If this is the case,
        // new vertex was probably put into a wrong index.
        // Try to put it into another index and repeat the heuristics again.

        var vertices = (this.model.get('vertices') || []).slice();
        // Store the original vertices for a later revert if needed.
        var originalVertices = vertices.slice();

        // A `<path>` element used to compute the length of the path during heuristics.
        var path = this._V.connection.node.cloneNode(false);
        
        // Length of the original path.        
        var originalPathLength = path.getTotalLength();
        // Current path length.
        var pathLength;
        // Tolerance determines the highest possible difference between the length
        // of the old and new path. The number has been chosen heuristically.
        var pathLengthTolerance = 20;
        // Total number of vertices including source and target points.
        var idx = vertices.length + 1;

        // Loop through all possible indexes and check if the difference between
        // path lengths changes significantly. If not, the found index is
        // most probably the right one.
        while (idx--) {

            vertices.splice(idx, 0, vertex);
            V(path).attr('d', this.getPathData(this.findRoute(vertices)));

            pathLength = path.getTotalLength();

            // Check if the path lengths changed significantly.
            if (pathLength - originalPathLength > pathLengthTolerance) {

                // Revert vertices to the original array. The path length has changed too much
                // so that the index was not found yet.
                vertices = originalVertices.slice();
                
            } else {

                break;
            }
        }

	if (idx === -1) {
	    // If no suitable index was found for such a vertex, make the vertex the first one.
	    idx = 0;
	    vertices.splice(idx, 0, vertex);
	}

        this.model.set('vertices', vertices, { ui: true });

        return idx;
    },

    // Send a token (an SVG element, usually a circle) along the connection path.
    // Example: `paper.findViewByModel(link).sendToken(V('circle', { r: 7, fill: 'green' }).node)`
    // `duration` is optional and is a time in milliseconds that the token travels from the source to the target of the link. Default is `1000`.
    // `callback` is optional and is a function to be called once the token reaches the target.
    sendToken: function(token, duration, callback) {

	duration = duration || 1000;

	V(this.paper.viewport).append(token);
	V(token).animateAlongPath({ dur: duration + 'ms', repeatCount: 1 }, this._V.connection.node);
	_.delay(function() { V(token).remove(); callback && callback(); }, duration);
    },

    findRoute: function(oldVertices) {

        var router = this.model.get('router');

        if (!router) {

            if (this.model.get('manhattan')) {
                // backwards compability
                router = { name: 'orthogonal' };
            } else {

                return oldVertices;
            }
        }

        var fn = joint.routers[router.name];

        if (!_.isFunction(fn)) {

            throw 'unknown router: ' + router.name;
        }

        var newVertices = fn.call(this, oldVertices || [], router.args || {}, this);

        return newVertices;
    },

    // Return the `d` attribute value of the `<path>` element representing the link
    // between `source` and `target`.
    getPathData: function(vertices) {

        var connector = this.model.get('connector');

        if (!connector) {

            // backwards compability
            connector = this.model.get('smooth') ? { name: 'smooth' } : { name: 'normal' };
        }

        if (!_.isFunction(joint.connectors[connector.name])) {

            throw 'unknown connector: ' + connector.name;
        }

        var pathData = joint.connectors[connector.name].call(
            this,
            this._markerCache.sourcePoint, // Note that the value is translated by the size
            this._markerCache.targetPoint, // of the marker. (We'r not using this.sourcePoint)
            vertices || (this.model.get('vertices') || {}),
            connector.args || {}, // options
            this
        );

        return pathData;
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
        _.isEmpty(selectorOrPoint) && (selectorOrPoint = { x: 0, y: 0 });
        _.isEmpty(referenceSelectorOrPoint) && (referenceSelectorOrPoint = { x: 0, y: 0 });

        if (!selectorOrPoint.id) {

            // If the source is a point, we don't need a reference point to find the sticky point of connection.
            spot = g.point(selectorOrPoint);

        } else {

            // If the source is an element, we need to find a point on the element boundary that is closest
            // to the reference point (or reference element).
            // Get the bounding box of the spot relative to the paper viewport. This is necessary
            // in order to follow paper viewport transformations (scale/rotate).
            // `_sourceBbox` (`_targetBbox`) comes from `_sourceBboxUpdate` (`_sourceBboxUpdate`)
            // method, it exists since first render and are automatically updated
            var spotBbox = end === 'source' ? this.sourceBBox : this.targetBBox;
            
            var reference;
            
            if (!referenceSelectorOrPoint.id) {

                // Reference was passed as a point, therefore, we're ready to find the sticky point of connection on the source element.
                reference = g.point(referenceSelectorOrPoint);

            } else {

                // Reference was passed as an element, therefore we need to find a point on the reference
                // element boundary closest to the source element.
                // Get the bounding box of the spot relative to the paper viewport. This is necessary
                // in order to follow paper viewport transformations (scale/rotate).
                var referenceBbox = end === 'source' ? this.targetBBox : this.sourceBBox;

                reference = g.rect(referenceBbox).intersectionWithLineFromCenterToPoint(g.rect(spotBbox).center());
                reference = reference || g.rect(referenceBbox).center();
            }

            // If `perpendicularLinks` flag is set on the paper and there are vertices
            // on the link, then try to find a connection point that makes the link perpendicular
            // even though the link won't point to the center of the targeted object.
            if (this.paper.options.perpendicularLinks || this.options.perpendicular) {

                var horizontalLineRect = g.rect(0, reference.y, this.paper.options.width, 1);
                var verticalLineRect = g.rect(reference.x, 0, 1, this.paper.options.height);
                var nearestSide;

                if (horizontalLineRect.intersect(g.rect(spotBbox))) {

                    nearestSide = g.rect(spotBbox).sideNearestToPoint(reference);
                    switch (nearestSide) {
                      case 'left':
                        spot = g.point(spotBbox.x, reference.y);
                        break;
                      case 'right':
                        spot = g.point(spotBbox.x + spotBbox.width, reference.y);
                        break;
                    default:
                        spot = g.rect(spotBbox).center();
                        break;
                    }
                    
                } else if (verticalLineRect.intersect(g.rect(spotBbox))) {

                    nearestSide = g.rect(spotBbox).sideNearestToPoint(reference);
                    switch (nearestSide) {
                      case 'top':
                        spot = g.point(reference.x, spotBbox.y);
                        break;
                      case 'bottom':
                        spot = g.point(reference.x, spotBbox.y + spotBbox.height);
                        break;
                    default:
                        spot = g.rect(spotBbox).center();
                        break;
                    }
                    
                } else {

                    // If there is no intersection horizontally or vertically with the object bounding box,
                    // then we fall back to the regular situation finding straight line (not perpendicular)
                    // between the object and the reference point.

                    spot = g.rect(spotBbox).intersectionWithLineFromCenterToPoint(reference);
                    spot = spot || g.rect(spotBbox).center();
                }
                
            } else if (this.paper.options.linkConnectionPoint) {

		var view = end === 'target' ? this.targetView : this.sourceView;
		var magnet = end === 'target' ? this.targetMagnet : this.sourceMagnet;

		spot = this.paper.options.linkConnectionPoint(this, view, magnet, reference);

	    } else {

            	spot = g.rect(spotBbox).intersectionWithLineFromCenterToPoint(reference);
                spot = spot || g.rect(spotBbox).center();
            }
        }

        return spot;
    },

    // Public API
    // ----------

    getConnectionLength: function() {

        return this._V.connection.node.getTotalLength();
    },

    getPointAtLength: function(length) {

        return this._V.connection.node.getPointAtLength(length);
    },

    // Interaction. The controller part.
    // ---------------------------------

    _beforeArrowheadMove: function() {

        this.model.trigger('batch:start');

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

        if (this._z) {
            this.model.set('z', this._z, { ui: true });
            delete this._z;
        }

        // Put `pointer-events` back to its original value. See `startArrowheadMove()` for explanation.
	// Value `auto` doesn't work in IE9. We force to use `visiblePainted` instead.
	// See `https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events`.
        this.el.style.pointerEvents = 'visiblePainted';

        if (this.paper.options.markAvailable) {
            this._unmarkAvailableMagnets();
        }

        this.model.trigger('batch:stop');
    },

    _createValidateConnectionArgs: function(arrowhead) {
        // It makes sure the arguments for validateConnection have the following form:
        // (source view, source magnet, target view, target magnet and link view)
        var args = [];

        args[4] = arrowhead;
        args[5] = this;

        var oppositeArrowhead, i = 0, j = 0;

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
            args[i+1] = end.selector && args[i].$el.find(end.selector)[0];
        }

        function validateConnectionArgs(cellView, magnet) {
            args[j] = cellView;
            args[j+1] = cellView.el === magnet ? undefined : magnet;
            return args;
        }

        return validateConnectionArgs;
    },

    _markAvailableMagnets: function() {

        var elements = this.paper.model.getElements();
        var validate = this.paper.options.validateConnection;

        _.chain(elements).map(this.paper.findViewByModel, this.paper).each(function(view) {

            var isElementAvailable = view.el.getAttribute('magnet') !== 'false' &&
                validate.apply(this.paper, this._validateConnectionArgs(view, null));

            var availableMagnets = _.filter(view.el.querySelectorAll('[magnet]'), function(magnet) {
                return validate.apply(this.paper, this._validateConnectionArgs(view, magnet));
            }, this);

            if (isElementAvailable) {
                V(view.el).addClass('available-magnet');
            }

            _.each(availableMagnets, function(magnet) {
                V(magnet).addClass('available-magnet');
            });

            if (isElementAvailable || availableMagnets.length) {
                V(view.el).addClass('available-cell');
            }

        }, this);
    },

    _unmarkAvailableMagnets: function() {

        _.each(this.paper.el.querySelectorAll('.available-cell, .available-magnet'), function(magnet) {
            V(magnet).removeClass('available-magnet').removeClass('available-cell');
        });
    },

    startArrowheadMove: function(end) {
        // Allow to delegate events from an another view to this linkView in order to trigger arrowhead
        // move without need to click on the actual arrowhead dom element.
        this._action = 'arrowhead-move';
        this._arrowhead = end;
        this._validateConnectionArgs = this._createValidateConnectionArgs(this._arrowhead);
        this._beforeArrowheadMove();
    },

    pointerdown: function(evt, x, y) {

        joint.dia.CellView.prototype.pointerdown.apply(this, arguments);

	this._dx = x;
        this._dy = y;

	var interactive = _.isFunction(this.options.interactive) ? this.options.interactive(this, 'pointerdown') : this.options.interactive;

        if (interactive === false) return;

	function can(feature) {
	    if (!_.isObject(interactive) || interactive[feature] !== false) return true;
	    return false;
	}

        var className = evt.target.getAttribute('class');

        switch (className) {

        case 'marker-vertex':
	    if (can('vertexMove')) {
		this._action = 'vertex-move';
		this._vertexIdx = evt.target.getAttribute('idx');
	    }
            break;

        case 'marker-vertex-remove':
        case 'marker-vertex-remove-area':
	    if (can('vertexRemove')) {
		this.removeVertex(evt.target.getAttribute('idx'));
	    }
            break;

        case 'marker-arrowhead':
	    if (can('arrowheadMove')) {
		this.startArrowheadMove(evt.target.getAttribute('end'));
	    }
            break;

        default:

            var targetParentEvent = evt.target.parentNode.getAttribute('event');

            if (targetParentEvent) {

                // `remove` event is built-in. Other custom events are triggered on the paper.
                if (targetParentEvent === 'remove') {
                    this.model.remove();
                } else {
                    this.paper.trigger(targetParentEvent, evt, this, x, y);
                }

            } else {

		if (can('vertexAdd')) {

                    // Store the index at which the new vertex has just been placed.
                    // We'll be update the very same vertex position in `pointermove()`.
                    this._vertexIdx = this.addVertex({ x: x, y: y });
                    this._action = 'vertex-move';
		}
            }
        }

        this.paper.trigger('link:pointerdown', evt, this, x, y);
    },

    pointermove: function(evt, x, y) {

        joint.dia.CellView.prototype.pointermove.apply(this, arguments);

        switch (this._action) {

          case 'vertex-move':

            var vertices = _.clone(this.model.get('vertices'));
            vertices[this._vertexIdx] = { x: x, y: y };
            this.model.set('vertices', vertices, { ui: true });
            break;

          case 'arrowhead-move':

            if (this.paper.options.snapLinks) {

                // checking view in close area of the pointer

                var r = this.paper.options.snapLinks.radius || 50;
                var viewsInArea = this.paper.findViewsInArea({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });

                this._closestView && this._closestView.unhighlight(this._closestEnd.selector, { connecting: true, snapping: true });
                this._closestView = this._closestEnd = null;

                var pointer = g.point(x,y);
                var distance, minDistance = Number.MAX_VALUE;

                _.each(viewsInArea, function(view) {

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

                    view.$('[magnet]').each(_.bind(function(index, magnet) {

                        var bbox = V(magnet).bbox(false, this.paper.viewport);

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

                    }, this));

                }, this);

                this._closestView && this._closestView.highlight(this._closestEnd.selector, { connecting: true, snapping: true });

                this.model.set(this._arrowhead, this._closestEnd || { x: x, y: y }, { ui: true });

            } else {

                // checking views right under the pointer

                // Touchmove event's target is not reflecting the element under the coordinates as mousemove does.
                // It holds the element when a touchstart triggered.
                var target = (evt.type === 'mousemove')
                    ? evt.target
                    : document.elementFromPoint(evt.clientX, evt.clientY);

                if (this._targetEvent !== target) {
                    // Unhighlight the previous view under pointer if there was one.
                    this._magnetUnderPointer && this._viewUnderPointer.unhighlight(this._magnetUnderPointer, { connecting: true });
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
                            this._magnetUnderPointer && this._viewUnderPointer.highlight(this._magnetUnderPointer, { connecting: true });
                        } else {
                            // This type of connection is not valid. Disregard this magnet.
                            this._magnetUnderPointer = null;
                        }
                    } else {
                        // Make sure we'll delete previous magnet
                        this._magnetUnderPointer = null;
                    }
                }

	        this._targetEvent = target;

                this.model.set(this._arrowhead, { x: x, y: y }, { ui: true });
            }

            break;
        }

        this._dx = x;
        this._dy = y;
    },

    pointerup: function(evt) {

        joint.dia.CellView.prototype.pointerup.apply(this, arguments);

        if (this._action === 'arrowhead-move') {

            if (this.paper.options.snapLinks) {

                this._closestView && this._closestView.unhighlight(this._closestEnd.selector, { connecting: true, snapping: true });
                this._closestView = this._closestEnd = null;

            } else {

                if (this._magnetUnderPointer) {
                    this._viewUnderPointer.unhighlight(this._magnetUnderPointer, { connecting: true });
                    // Find a unique `selector` of the element under pointer that is a magnet. If the
                    // `this._magnetUnderPointer` is the root element of the `this._viewUnderPointer` itself,
                    // the returned `selector` will be `undefined`. That means we can directly pass it to the
                    // `source`/`target` attribute of the link model below.
		    this.model.set(this._arrowhead, {
                        id: this._viewUnderPointer.model.id,
                        selector: this._viewUnderPointer.getSelector(this._magnetUnderPointer),
                        port: $(this._magnetUnderPointer).attr('port')
                    }, { ui: true });
                }

                delete this._viewUnderPointer;
                delete this._magnetUnderPointer;
            }

            // Reparent the link if embedding is enabled
            if (this.paper.options.embeddingMode && this.model.reparent()) {

                // Make sure we don't reverse to the original 'z' index (see afterArrowheadMove()).
                delete this._z;
            }

            this._afterArrowheadMove();
        }

        delete this._action;
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


if (typeof exports === 'object') {

    module.exports.Link = joint.dia.Link;
    module.exports.LinkView = joint.dia.LinkView;
}
