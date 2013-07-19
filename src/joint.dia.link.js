/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//      JointJS diagramming library.
//      (c) 2011-2013 client IO


// joint.dia.Link base model.
// --------------------------

joint.dia.Link = joint.dia.Cell.extend({

    defaults: {

        type: 'link'
    },

    disconnect: function() {

        return this.set({ source: g.point(0, 0), target: g.point(0, 0) });
    },

    // A convenient way to set labels. Currently set values will be mixined with `value` if used as a setter.
    label: function(idx, value) {

        idx = idx || 0;
        
        var labels = this.get('labels');
        
        // Is it a getter?
        if (arguments.length === 0 || arguments.length === 1) {
            
            return labels && labels[idx];
        }

        var newValue = _.deepExtend({}, labels[idx], value);

        var newLabels = labels.slice();
        newLabels[idx] = newValue;
        
        return this.set({ labels: newLabels });
    }
});


// joint.dia.Link base view and controller.
// ----------------------------------------

joint.dia.LinkView = joint.dia.CellView.extend({

    // The default markup for links.
    markup: [
        '<path class="connection" stroke="black"/>',
        '<path class="marker-source" fill="black" stroke="black" />',
        '<path class="marker-target" fill="black" stroke="black" />',
        '<path class="connection-wrap"/>',
        '<g class="labels" />',
        '<g class="marker-vertices"/>',
        '<g class="marker-arrowheads"/>',
        '<g class="link-tools" />'
    ].join(''),

    labelMarkup: [
        '<g class="label" transform="translate(<%= x %>, <%= y %>)">',
        '<rect />',
        '<text />',
        '</g>'
    ].join(''),
    
    toolMarkup: [
        '<g class="link-tool" transform="translate(<%= x %>, <%= y %>)">',
        '<g class="tool-remove" event="remove">',
        '<circle r="11" />',
        '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
        '<title>Remove link.</title>',
        '</g>',
        '</g>'
    ].join(''),

    // The default markup for showing/removing vertices. These elements are the children of the .marker-vertices element (see `this.markup`).
    // Only .marker-vertex and .marker-vertex-remove element have special meaning. The former is used for
    // dragging vertices (changin their position). The latter is used for removing vertices.
    vertexMarkup: [
        '<g class="marker-vertex-group" transform="translate(<%= x %>, <%= y %>)">',
        '<circle class="marker-vertex" idx="<%= idx %>" r="10"/>',
        '<path class="marker-vertex-remove-area" idx="<%= idx %>" d="M16,5.333c-7.732,0-14,4.701-14,10.5c0,1.982,0.741,3.833,2.016,5.414L2,25.667l5.613-1.441c2.339,1.317,5.237,2.107,8.387,2.107c7.732,0,14-4.701,14-10.5C30,10.034,23.732,5.333,16,5.333z" transform="translate(5, -33)"/>',
        '<path class="marker-vertex-remove" idx="<%= idx %>" transform="scale(.8) translate(9.5, -37)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z">',
        '<title>Remove vertex.</title>',
        '</path>',
        '</g>'
    ].join(''),

    arrowheadMarkup: [
        '<g class="marker-arrowhead-group" transform="translate(<%= x %>, <%= y %>)">',
        '<path class="marker-arrowhead" end="<%= end %>" d="M 26 0 L 0 13 L 26 26 z" />',
        '</g>'
    ].join(''),
    
    initialize: function() {

        joint.dia.CellView.prototype.initialize.apply(this, arguments);

        _.bindAll(this, 'update', 'updateEnds', 'render');
        
        // Assign CSS class to the element based on the element type.
        V(this.el).attr({ 'class': 'link', 'model-id': this.model.id });

        this.model.on({

            'change:vertices': this.update,
            'change:source': this.updateEnds,
            'change:target': this.updateEnds,
	    'change:markup': this.render,
            'change:labels': this.update,
            'change:smooth': this.update
        });
    },

    // Default is to process the `attrs` object and set attributes on subelements based on the selectors.
    update: function() {

        this.renderVertexMarkers();

        this.renderArrowheadMarkers();

        this.renderTools();


        // Update attributes.
        _.each(this.model.get('attrs'), function(attrs, selector) {

            var $selected = this.findBySelector(selector);

            $selected.attr(attrs);
            
        }, this);

        var firstVertex = _.first(this.model.get('vertices'));
        var lastVertex = _.last(this.model.get('vertices'));

        var sourcePosition = this.getConnectionPoint(this.model.get('source'), firstVertex || this.model.get('target')).round();
        var targetPosition = this.getConnectionPoint(this.model.get('target'), lastVertex || sourcePosition);

        // Make the markers "point" to their sticky points being auto-oriented towards `targetPosition`/`sourcePosition`.
        V(this.$('.marker-source')[0]).translateAndAutoOrient(sourcePosition, firstVertex || targetPosition, this.paper.viewport);
        V(this.$('.marker-target')[0]).translateAndAutoOrient(targetPosition, lastVertex || sourcePosition, this.paper.viewport);
        
        this.$('.connection, .connection-wrap').attr('d', this.getPathData(this.model.get('vertices')));

        this.renderLabels();
        
        return this;
    },

    render: function() {

        // A special markup can be given in the `properties.markup` property. This might be handy
        // if e.g. arrowhead markers should be `<image>` elements or any other element than `<path>`s.
        // `.connection`, `.connection-wrap`, `.marker-source` and `.marker-target` selectors
        // of elements with special meaning though. Therefore, those classes should be preserved in any
        // special markup passed in `properties.markup`.
        var markup = this.model.get('markup') || this.markup;
        
        var children = V(markup);
        
	$(this.el).empty();
        V(this.el).append(children);

        // Note that `updateEnds()` calls `update()` internally.
        this.updateEnds();

        return this;
    },

    updateEnds: function() {

        var cell;

        // First, stop listening to `change` and `remove` events on previous `source` and `target` cells.
        if (this._isModel(this.model.previous('source'))) {
            
            cell = this.paper.getModelById(this.model.previous('source').id);
            this.stopListening(cell, 'change');
        }
        if (this._isModel(this.model.previous('target'))) {
            
            cell = this.paper.getModelById(this.model.previous('target').id);
            this.stopListening(cell, 'change');
        }

        // Listen on changes in `source` and `target` cells and update the link if any change happens.
        if (this._isModel(this.model.get('source'))) {

            cell = this.paper.getModelById(this.model.get('source').id);
            this.listenTo(cell, 'change', this.update);
        }
        if (this._isModel(this.model.get('target'))) {

            cell = this.paper.getModelById(this.model.get('target').id);
            this.listenTo(cell, 'change', this.update);
        }

        this.update();
    },

    renderLabels: function() {

        var $labels = this.$('.labels').empty();

        var labelTemplate = _.template(this.model.get('labelMarkup') || this.labelMarkup);

        var labels = this.model.get('labels') || [];

        var connectionElement = this.$('.connection')[0];
        var connectionLength = connectionElement.getTotalLength();

        _.each(labels, function(label) {

            var position = label.position;
            position = (position > connectionLength) ? connectionLength : position; // sanity check
            position = (position < 0) ? connectionLength + position : position;
            position = position > 1 ? position : connectionLength * position;

            var labelCoordinates = connectionElement.getPointAtLength(position);
            
            var labelNode = V(labelTemplate({ x: labelCoordinates.x, y: labelCoordinates.y })).node;

            var $text = $(labelNode).find('text');
            var $rect = $(labelNode).find('rect');

            // Text attributes with the default `text-anchor` set.
            var textAttributes = _.extend({ 'text-anchor': 'middle' }, label.attrs.text);
            
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
                
            }, label.attrs.rect);
            
            $rect.attr(_.extend(rectAttributes, {

                x: textBbox.x,
                y: textBbox.y - textBbox.height/2,  // Take into account the y-alignment translation.
                width: textBbox.width,
                height: textBbox.height
            }));
            
        }, this);
    },

    renderTools: function() {
        // Tools are a group of clickable elements that manipulate the whole link.
        // A good example of this is the remove tool that removes the whole link.
        // Tools appear after hovering the link close to the `source` element/point of the link
        // but are offset a bit so that they don't cover the `marker-arrowhead`.

        var $tools = this.$('.link-tools').empty();

        var toolTemplate = _.template(this.model.get('toolMarkup') || this.toolMarkup);

        var firstVertex = _.first(this.model.get('vertices'));
        var lastVertex = _.last(this.model.get('vertices'));
        
        var sourcePosition = this.getConnectionPoint(this.model.get('source'), firstVertex || this.model.get('target')).round();
        var targetPosition = this.getConnectionPoint(this.model.get('target'), lastVertex || sourcePosition);

        // Move the halo a bit to the target position but don't cover the `sourceArrowhead` marker.
        var offset = -50;
        var sourceArrowhead = this.$('.marker-arrowhead[end="source"]')[0];
        if (sourceArrowhead) {
            offset = -V(sourceArrowhead).bbox().width * 2;
        }
        sourcePosition.move(firstVertex || targetPosition, offset);
        
        var tool = V(toolTemplate({ x: sourcePosition.x, y: sourcePosition.y })).node;

        $tools.append(tool);
    },

    renderVertexMarkers: function() {

        var $markerVertices = this.$('.marker-vertices').empty();

        // A special markup can be given in the `properties.vertexMarkup` property. This might be handy
        // if default styling (elements) are not desired. This makes it possible to use any
        // SVG elements for .marker-vertex and .marker-vertex-remove tools.
        var markupTemplate = _.template(this.model.get('vertexMarkup') || this.vertexMarkup);
        
        _.each(this.model.get('vertices'), function(vertex, idx) {

            $markerVertices.append(V(markupTemplate({ x: vertex.x, y: vertex.y, 'idx': idx })).node);
        });
        
        return this;
    },

    renderArrowheadMarkers: function() {

        var $markerArrowheads = this.$('.marker-arrowheads');

        // Custom markups might not have arrowhead markers. Therefore, jump of this function immediately if that's the case.
        if ($markerArrowheads.length === 0) return;
        
        $markerArrowheads.empty();

        // A special markup can be given in the `properties.vertexMarkup` property. This might be handy
        // if default styling (elements) are not desired. This makes it possible to use any
        // SVG elements for .marker-vertex and .marker-vertex-remove tools.
        var markupTemplate = _.template(this.model.get('arrowheadMarkup') || this.arrowheadMarkup);


        var firstVertex = _.first(this.model.get('vertices'));
        var lastVertex = _.last(this.model.get('vertices'));

        var sourcePosition = this.getConnectionPoint(this.model.get('source'), firstVertex || this.model.get('target')).round();
        var targetPosition = this.getConnectionPoint(this.model.get('target'), lastVertex || sourcePosition);
        
        var sourceArrowhead = V(markupTemplate({ x: sourcePosition.x, y: sourcePosition.y, 'end': 'source' })).node;
        var targetArrowhead = V(markupTemplate({ x: targetPosition.x, y: targetPosition.y, 'end': 'target' })).node;

        $markerArrowheads.append(sourceArrowhead);
        $markerArrowheads.append(targetArrowhead);

        // Make the markers "point" to their sticky points being auto-oriented towards `targetPosition`/`sourcePosition`.
        V(sourceArrowhead).translateAndAutoOrient(sourcePosition, firstVertex || targetPosition, this.paper.viewport);
        V(targetArrowhead).translateAndAutoOrient(targetPosition, lastVertex || sourcePosition, this.paper.viewport);
        
        return this;
    },
    
    removeVertex: function(idx) {

        var vertices = _.clone(this.model.get('vertices'));
        
        if (vertices && vertices.length) {

            vertices.splice(idx, 1);
            this.model.set('vertices', vertices);
        }

        return this;
    },

    // This method ads a new vertex to the `vertices` array of `.connection`. This method
    // uses a heuristic to find the index at which the new `vertex` should be placed at assuming
    // the new vertex is somewhere on the path.
    addVertex: function(vertex) {

        this.model.set('attrs', this.model.get('attrs') || {});
        var attrs = this.model.get('attrs');
        
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
        var path = this.$('.connection')[0].cloneNode(false);
        
        // Length of the original path.        
        var originalPathLength = path.getTotalLength();
        // Current path length.
        var pathLength;
        // Tolerance determines the highest possible difference between the length
        // of the old and new path. The number has been chosen heuristically.
        var pathLengthTolerance = 10;
        // Total number of vertices including source and target points.
        var idx = vertices.length + 1;

        // Loop through all possible indexes and check if the difference between
        // path lengths changes significantly. If not, the found index is
        // most probably the right one.
        while (idx--) {

            vertices.splice(idx, 0, vertex);
            V(path).attr('d', this.getPathData(vertices));

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

        this.model.set('vertices', vertices);

        return idx;
    },

    // Return the `d` attribute value of the `<path>` element representing the link between `source` and `target`.
    getPathData: function(vertices) {

        var firstVertex = _.first(vertices);
        var lastVertex = _.last(vertices);

        var sourcePoint = this.getConnectionPoint(this.model.get('source'), firstVertex || this.model.get('target')).round();
        var targetPoint = this.getConnectionPoint(this.model.get('target'), lastVertex || sourcePoint);

        var markerSource = this.$('.marker-source')[0];
        // Move the source point by the width of the marker taking into account its scale around x-axis.
        // Note that scale is the only transform that makes sense to be set in `.marker-source` attributes object
        // as all other transforms (translate/rotate) will be replaced by the `translateAndAutoOrient()` function.
        var markerSourceBbox = V(markerSource).bbox(true);
        var markerSourceScaleX = V(markerSource).scale().sx;

        sourcePoint.move(firstVertex || targetPoint, -markerSourceBbox.width * markerSourceScaleX);

        var markerTarget = this.$('.marker-target')[0];
        var markerTargetBbox = V(markerTarget).bbox(true);
        var markerTargetScaleX = V(markerTarget).scale().sx;

        targetPoint.move(lastVertex || sourcePoint, -markerTargetBbox.width * markerTargetScaleX);

        var d;
        if (this.model.get('smooth')) {

            d = g.bezier.curveThroughPoints([sourcePoint].concat(vertices || []).concat([targetPoint]));
            
        } else {
            
            // Construct the `d` attribute of the `<path>` element.
            d = ['M', sourcePoint.x, sourcePoint.y];
            _.each(vertices, function(vertex) {

                d.push(vertex.x, vertex.y);
            });
            d.push(targetPoint.x, targetPoint.y);
        }

        return d.join(' ');
    },

    // Find a point that is the start of the connection.
    // If `selectorOrPoint` is a point, then we're done and that point is the start of the connection.
    // If the `selectorOrPoint` is an element however, we need to know a reference point (or element)
    // that the link leads to in order to determine the start of the connection on the original element.
    getConnectionPoint: function(selectorOrPoint, referenceSelectorOrPoint) {

        var spot;

        if (this._isPoint(selectorOrPoint)) {
            // If the source is a point, we don't need a reference point to find the sticky point of connection.

            spot = g.point(selectorOrPoint);
            
        } else {
            // If the source is an element, we need to find a point on the element boundary that is closest
            // to the reference point (or reference element).

            // Get the bounding box of the spot relative to the paper viewport. This is necessary
            // in order to follow paper viewport transformations (scale/rotate).
            var spotBbox = V(this.paper.$(this._makeSelector(selectorOrPoint))[0]).bbox(false, this.paper.viewport);
            
            var reference;
            
            if (this._isPoint(referenceSelectorOrPoint)) {
                // Reference was passed as a point, therefore, we're ready to find the sticky point of connection on the source element.

                reference = g.point(referenceSelectorOrPoint);
                
            } else {
                // Reference was passed as an element, therefore we need to find a point on the reference
                // element boundary closest to the source element.

                // Get the bounding box of the spot relative to the paper viewport. This is necessary
                // in order to follow paper viewport transformations (scale/rotate).
                var referenceBbox = V(this.paper.$(this._makeSelector(referenceSelectorOrPoint))[0]).bbox(false, this.paper.viewport);
                
                reference = g.rect(referenceBbox).intersectionWithLineFromCenterToPoint(g.rect(spotBbox).center());
                reference = reference || g.rect(referenceBbox).center();
            }

            // If `perpendicularLinks` flag is set on the paper and there are vertices
            // on the link, then try to find a connection point that makes the link perpendicular
            // even though the link won't point to the center of the targeted object.
            if (this.paper.options.perpendicularLinks) {

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
                
            } else {
            
                spot = g.rect(spotBbox).intersectionWithLineFromCenterToPoint(reference);
                spot = spot || g.rect(spotBbox).center();
            }
        }

        return spot;
    },

    _isModel: function(end) {

        return end && end.id;
    },

    _isPoint: function(end) {

        return !this._isModel(end);
    },

    _makeSelector: function(end) {

        return '[model-id="' + end.id + '"]' + (end.selector ? ' ' + end.selector : '');
    },

    // Public API
    // ----------

    getConnectionLength: function() {

        return this.$('.connection')[0].getTotalLength();
    },


    // Interaction. The controller part.
    // ---------------------------------

    pointerdown: function(evt, x, y) {

        joint.dia.CellView.prototype.pointerdown.apply(this, arguments);

        delete this._action;
        
        this._dx = x;
        this._dy = y;

        if (this.options.interactive === false) {

            return;
        }
        
        var targetClass = V(evt.target).attr('class');
        var targetParentEvent = V($(evt.target).parent()[0]).attr('event');

        if (targetClass === 'marker-vertex') {

            this._vertexIdx = $(evt.target).attr('idx');
            this._action = 'vertex-move';

        } else if (targetClass === 'marker-vertex-remove' ||
                   targetClass === 'marker-vertex-remove-area') {

            this.removeVertex($(evt.target).attr('idx'));

        } else if (targetClass === 'marker-arrowhead') {

            this._arrowheadEnd = $(evt.target).attr('end');
            this._action = 'arrowhead-move';
            this._originalZ = this.model.get('z');
            this.model.set('z', Number.MAX_VALUE);
            // Let the pointer propagate throught the link view elements so that
            // the `evt.target` is another element under the pointer, not the link itself.
            this.$el.css({ 'pointer-events': 'none' });

        } else if (targetParentEvent) {

            // `remove` event is built-in. Other custom events are triggered on the paper.
            if (targetParentEvent === 'remove') {
                
                this.model.remove();
                
            } else {

                this.paper.trigger(targetParentEvent, evt, this, x, y);
            }
            
        } else {

            // Store the index at which the new vertex has just been placed.
            // We'll be update the very same vertex position in `pointermove()`.
            this._vertexIdx = this.addVertex({ x: x, y: y });
            this._action = 'vertex-move';
        }
    },

    pointermove: function(evt, x, y) {

        joint.dia.CellView.prototype.pointermove.apply(this, arguments);

        if (this.options.interactive === false) {

            return;
        }

        switch (this._action) {

          case 'vertex-move':
            
            var vertices = _.clone(this.model.get('vertices'));
            vertices[this._vertexIdx] = { x: x, y: y };
            this.model.set('vertices', vertices);
            break;

          case 'arrowhead-move':

            // Unhighlight the previous view under pointer if there was one.
            if (this._viewUnderPointer) {

                this._viewUnderPointer.unhighlight(this._magnetUnderPointer);
            }
            
            this._viewUnderPointer = this.paper.findView(evt.target);
            if (this._viewUnderPointer && this._viewUnderPointer.model instanceof joint.dia.Link) {

                // Do not allow linking links with links.
                this._viewUnderPointer = null;
            }

            // If we found a view that is under the pointer, we need to find the closest
            // magnet based on the real target element of the event.
            if (this._viewUnderPointer) {
                
                this._magnetUnderPointer = this._viewUnderPointer.findMagnet(evt.target);
                if (!this._magnetUnderPointer) {

                    // If there was no magnet found, do not highlight anything and assume there
                    // is no view under pointer we're interested in reconnecting to.
                    // This can only happen if the overall element has the attribute `'.': { magnet: false }`.
                    this._viewUnderPointer = null;
                }
            }

            if (this._viewUnderPointer) {

                this._viewUnderPointer.highlight(this._magnetUnderPointer);
            }
            
            this.model.set(this._arrowheadEnd, { x: x, y: y });
            break;
        }
        
        this._dx = x;
        this._dy = y;
    },

    pointerup: function(evt) {

        joint.dia.CellView.prototype.pointerup.apply(this, arguments);

        if (this._action === 'arrowhead-move') {

            // Put `pointer-events` back to `auto`. See `pointerdown()` for explanation.
            this.$el.css({ 'pointer-events': 'auto' });

            this.model.set('z', this._originalZ);
            delete this._originalZ;

            if (this._viewUnderPointer) {

                // Find a unique `selector` of the element under pointer that is a magnet. If the
                // `this._magnetUnderPointer` is the root element of the `this._viewUnderPointer` itself,
                // the returned `selector` will be `undefined`. That means we can directly pass it to the
                // `source`/`target` attribute of the link model below.
                var selector = this._viewUnderPointer.getSelector(this._magnetUnderPointer);
                    
		this.model.set(this._arrowheadEnd, { id: this._viewUnderPointer.model.id, selector: selector });
                
                this._viewUnderPointer.unhighlight(this._magnetUnderPointer);
                delete this._viewUnderPointer;
                delete this._magnetUnderPointer;
            }
        }
    }
});
