//      JointJS library.
//      (c) 2011-2013 client IO


joint.dia.Paper = Backbone.View.extend({

    className: 'paper',

    options: {

        width: 800,
        height: 600,
        origin: { x: 0, y: 0 }, // x,y coordinates in top-left corner
        gridSize: 50,
        perpendicularLinks: false,
        elementView: joint.dia.ElementView,
        linkView: joint.dia.LinkView,
        snapLinks: false, // false, true, { radius: value }

        // Marks all available magnets with 'available-magnet' class name and all available cells with
        // 'available-cell' class name. Marks them when dragging a link is started and unmark
        // when the dragging is stopped.
        markAvailable: false,

        // Defines what link model is added to the graph after an user clicks on an active magnet.
        // Value could be the Backbone.model or a function returning the Backbone.model
        // defaultLink: function(elementView, magnet) { return condition ? new customLink1() : new customLink2() }
        defaultLink: new joint.dia.Link,

        /* CONNECTING */

        // Check whether to add a new link to the graph when user clicks on an a magnet.
        validateMagnet: function(cellView, magnet) {
            return magnet.getAttribute('magnet') !== 'passive';
        },

        // Check whether to allow or disallow the link connection while an arrowhead end (source/target)
        // being changed.
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            return (end === 'target' ? cellViewT : cellViewS) instanceof joint.dia.ElementView;
        },

        /* EMBEDDING */

        // Enables embedding. Reparents the dragged element with elements under it and makes sure that
        // all links and elements are visible taken the level of embedding into account.
        embeddingMode: false,

        // Check whether to allow or disallow the element embedding while an element being translated.
        validateEmbedding: function(childView, parentView) {
            // by default all elements can be in relation child-parent
            return true;
        },

        // Determines the way how a cell finds a suitable parent when it's dragged over the paper.
        // The cell with the highest z-index (visually on the top) will be choosen.
        findParentBy: 'bbox', // 'bbox'|'center'|'origin'|'corner'|'topRight'|'bottomLeft'

        // If enabled only the element on the very front is taken into account for the embedding.
        // If disabled the elements under the dragged view are tested one by one
        // (from front to back) until a valid parent found.
        frontParentOnly: true
    },

    events: {

        'mousedown': 'pointerdown',
        'dblclick': 'mousedblclick',
        'click': 'mouseclick',
        'touchstart': 'pointerdown',
        'mousemove': 'pointermove',
        'touchmove': 'pointermove',
        'mouseover .element': 'cellMouseover',
        'mouseover .link': 'cellMouseover',
        'mouseout .element': 'cellMouseout',
        'mouseout .link': 'cellMouseout'
    },

    constructor: function(options) {

	this._configure(options);
	Backbone.View.apply(this, arguments);
    },

    _configure: function(options) {

	if (this.options) options = _.extend({}, _.result(this, 'options'), options);
	this.options = options;
    },

    initialize: function() {

        _.bindAll(this, 'addCell', 'sortCells', 'resetCells', 'pointerup', 'asyncRenderCells');

        this.svg = V('svg').node;
        this.viewport = V('g').addClass('viewport').node;
        this.defs = V('defs').node;

        // Append `<defs>` element to the SVG document. This is useful for filters and gradients.
        V(this.svg).append([this.viewport, this.defs]);

        this.$el.append(this.svg);

        this.setOrigin();
        this.setDimensions();

	this.listenTo(this.model, 'add', this.onAddCell);
	this.listenTo(this.model, 'reset', this.resetCells);
	this.listenTo(this.model, 'sort', this.sortCells);

	$(document).on('mouseup touchend', this.pointerup);

        // Hold the value when mouse has been moved: when mouse moved, no click event will be triggered.
        this._mousemoved = false;

        // default cell highlighting
        this.on({ 'cell:highlight': this.onCellHighlight, 'cell:unhighlight': this.onCellUnhighlight });
    },

    remove: function() {

        //clean up all DOM elements/views to prevent memory leaks
        this.removeCells();

	$(document).off('mouseup touchend', this.pointerup);

	Backbone.View.prototype.remove.call(this);
    },

    setDimensions: function(width, height) {

        width = this.options.width = width || this.options.width;
        height = this.options.height = height || this.options.height;

        V(this.svg).attr({ width: width, height: height });

        this.trigger('resize', width, height);
    },

    setOrigin: function(ox, oy) {

        this.options.origin.x = ox || 0;
        this.options.origin.y = oy || 0;

        V(this.viewport).translate(ox, oy, { absolute: true });

        this.trigger('translate', ox, oy);
    },

    // Expand/shrink the paper to fit the content. Snap the width/height to the grid
    // defined in `gridWidth`, `gridHeight`. `padding` adds to the resulting width/height of the paper.
    // When options { fitNegative: true } it also translates the viewport in order to make all
    // the content visible.
    fitToContent: function(gridWidth, gridHeight, padding, opt) { // alternatively function(opt)

        if (_.isObject(gridWidth)) {
            // first parameter is an option object
            opt = gridWidth;
	    gridWidth = opt.gridWidth || 1;
	    gridHeight = opt.gridHeight || 1;
            padding = opt.padding || 0;

        } else {

            opt = opt || {};
	    gridWidth = gridWidth || 1;
	    gridHeight = gridHeight || 1;
            padding = padding || 0;
        }

	// Calculate the paper size to accomodate all the graph's elements.
	var bbox = V(this.viewport).bbox(true, this.svg);

        var currentScale = V(this.viewport).scale();

        bbox.x *= currentScale.sx;
        bbox.y *= currentScale.sy;
        bbox.width *= currentScale.sx;
        bbox.height *= currentScale.sy;

	var calcWidth = Math.max(Math.ceil((bbox.width + bbox.x) / gridWidth), 1) * gridWidth;
	var calcHeight = Math.max(Math.ceil((bbox.height + bbox.y) / gridHeight), 1) * gridHeight;

        var tx = 0;
        var ty = 0;

        if ((opt.allowNewOrigin == 'negative' && bbox.x < 0) || (opt.allowNewOrigin == 'positive' && bbox.x >= 0) || opt.allowNewOrigin == 'any') {
            tx = Math.ceil(-bbox.x / gridWidth) * gridWidth;
            tx += padding;
            calcWidth += tx;
        }

        if ((opt.allowNewOrigin == 'negative' && bbox.y < 0) || (opt.allowNewOrigin == 'positive' && bbox.y >= 0) || opt.allowNewOrigin == 'any') {
            ty = Math.ceil(-bbox.y / gridHeight) * gridHeight;
            ty += padding;
            calcHeight += ty;
        }

        calcWidth += padding;
        calcHeight += padding;

        // Make sure the resulting width and height are greater than minimum.
        calcWidth = Math.max(calcWidth, opt.minWidth || 0);
        calcHeight = Math.max(calcHeight, opt.minHeight || 0);

        var dimensionChange = calcWidth != this.options.width || calcHeight != this.options.height;
        var originChange = tx != this.options.origin.x || ty != this.options.origin.y;

	// Change the dimensions only if there is a size discrepency or an origin change
        if (originChange) {
            this.setOrigin(tx, ty);
        }
	if (dimensionChange) {
	    this.setDimensions(calcWidth, calcHeight);
	}
    },

    scaleContentToFit: function(opt) {

        var contentBBox = this.getContentBBox();

        if (!contentBBox.width || !contentBBox.height) return;

        opt = opt || {};

        _.defaults(opt, {
            padding: 0,
            preserveAspectRatio: true,
            scaleGrid: null,
            minScale: 0,
            maxScale: Number.MAX_VALUE
            //minScaleX
            //minScaleY
            //maxScaleX
            //maxScaleY
            //fittingBBox
        });

        var padding = opt.padding;

        var minScaleX = opt.minScaleX || opt.minScale;
        var maxScaleX = opt.maxScaleX || opt.maxScale;
        var minScaleY = opt.minScaleY || opt.minScale;
        var maxScaleY = opt.maxScaleY || opt.maxScale;

        var fittingBBox = opt.fittingBBox || ({
            x: this.options.origin.x,
            y: this.options.origin.y,
            width: this.options.width,
            height: this.options.height
        });

        fittingBBox = g.rect(fittingBBox).moveAndExpand({
            x: padding,
            y: padding,
            width: -2 * padding,
            height: -2 * padding
        });

        var currentScale = V(this.viewport).scale();

        var newSx = fittingBBox.width / contentBBox.width * currentScale.sx;
        var newSy = fittingBBox.height / contentBBox.height * currentScale.sy;

        if (opt.preserveAspectRatio) {
            newSx = newSy = Math.min(newSx, newSy);
        }

        // snap scale to a grid
        if (opt.scaleGrid) {

            var gridSize = opt.scaleGrid;

            newSx = gridSize * Math.floor(newSx / gridSize);
            newSy = gridSize * Math.floor(newSy / gridSize);
        }

        // scale min/max boundaries
        newSx = Math.min(maxScaleX, Math.max(minScaleX, newSx));
        newSy = Math.min(maxScaleY, Math.max(minScaleY, newSy));

        this.scale(newSx, newSy);

        var contentTranslation = this.getContentBBox();

        var newOx = fittingBBox.x - contentTranslation.x;
        var newOy = fittingBBox.y - contentTranslation.y;

        this.setOrigin(newOx, newOy);
    },

    getContentBBox: function() {

        var crect = this.viewport.getBoundingClientRect();

        // Using Screen CTM was the only way to get the real viewport bounding box working in both
        // Google Chrome and Firefox.
        var screenCTM = this.viewport.getScreenCTM();

        // for non-default origin we need to take the viewport translation into account
        var viewportCTM = this.viewport.getCTM();

        var bbox = g.rect({
            x: crect.left - screenCTM.e + viewportCTM.e,
            y: crect.top - screenCTM.f + viewportCTM.f,
            width: crect.width,
            height: crect.height
        });

        return bbox;
    },

    createViewForModel: function(cell) {

        var view;
        
        var type = cell.get('type');
        var module = type.split('.')[0];
        var entity = type.split('.')[1];

        // If there is a special view defined for this model, use that one instead of the default `elementView`/`linkView`.
        if (joint.shapes[module] && joint.shapes[module][entity + 'View']) {

            view = new joint.shapes[module][entity + 'View']({ model: cell, interactive: this.options.interactive });
            
        } else if (cell instanceof joint.dia.Element) {
                
            view = new this.options.elementView({ model: cell, interactive: this.options.interactive });

        } else {

            view = new this.options.linkView({ model: cell, interactive: this.options.interactive });
        }

        return view;
    },

    onAddCell: function(cell, graph, options) {

        if (this.options.async && options.async !== false && _.isNumber(options.position)) {

            this._asyncCells = this._asyncCells || [];
            this._asyncCells.push(cell);

            if (options.position == 0) {

                if (this._frameId) throw 'another asynchronous rendering in progress';

                this.asyncRenderCells(this._asyncCells);
                delete this._asyncCells;
            }

        } else {

            this.addCell(cell);
        }
    },

    addCell: function(cell) {

        var view = this.createViewForModel(cell);

        V(this.viewport).append(view.el);
        view.paper = this;
        view.render();

        // This is the only way to prevent image dragging in Firefox that works.
        // Setting -moz-user-select: none, draggable="false" attribute or user-drag: none didn't help.
        $(view.el).find('image').on('dragstart', function() { return false; });
    },

    beforeRenderCells: function(cells) {

        // Make sure links are always added AFTER elements.
        // They wouldn't find their sources/targets in the DOM otherwise.
        cells.sort(function(a, b) { return a instanceof joint.dia.Link ? 1 : -1; });

        return cells;
    },

    afterRenderCells: function() {

        this.sortCells();
    },

    resetCells: function(cellsCollection) {

        $(this.viewport).empty();

        var cells = cellsCollection.models.slice();

        cells = this.beforeRenderCells(cells);
        
	if (this._frameId) {

	    joint.util.cancelFrame(this._frameId);
            delete this._frameId;
	}

	if (this.options.async) {

	    this.asyncRenderCells(cells);
            // Sort the cells once all elements rendered (see asyncRenderCells()).

	} else {

            _.each(cells, this.addCell, this);

            // Sort the cells in the DOM manually as we might have changed the order they
            // were added to the DOM (see above).
            this.sortCells();
	}
    },

    removeCells: function() {

        this.model.get('cells').each(function(cell) {
            var view = this.findViewByModel(cell);
            view && view.remove();
        }, this);
    },

    asyncBatchAdded: _.identity,

    asyncRenderCells: function(cells, opt) {

        var done = false;

        if (this._frameId) {

            _.each(_.range(this.options.async && this.options.async.batchSize || 50), function() {

                var cell = cells.shift();
	        done = !cell;
                if (!done) this.addCell(cell);

            }, this);

            this.asyncBatchAdded();
        }

        if (done) {

            delete this._frameId;
            this.afterRenderCells();
	    this.trigger('render:done', opt);

	} else {

            this._frameId = joint.util.nextFrame(_.bind(function() {
		this.asyncRenderCells(cells, opt);
	    }, this));
        }
    },

    sortCells: function() {

        // Run insertion sort algorithm in order to efficiently sort DOM elements according to their
        // associated model `z` attribute.

        var $cells = $(this.viewport).children('[model-id]');
        var cells = this.model.get('cells');

        this.sortElements($cells, function(a, b) {

            var cellA = cells.get($(a).attr('model-id'));
            var cellB = cells.get($(b).attr('model-id'));
            
            return (cellA.get('z') || 0) > (cellB.get('z') || 0) ? 1 : -1;
        });
    },

    // Highly inspired by the jquery.sortElements plugin by Padolsey.
    // See http://james.padolsey.com/javascript/sorting-elements-with-jquery/.
    sortElements: function(elements, comparator) {

        var $elements = $(elements);
        
        var placements = $elements.map(function() {

            var sortElement = this;
            var parentNode = sortElement.parentNode;

            // Since the element itself will change position, we have
            // to have some way of storing it's original position in
            // the DOM. The easiest way is to have a 'flag' node:
            var nextSibling = parentNode.insertBefore(
                document.createTextNode(''),
                sortElement.nextSibling
            );

            return function() {
                
                if (parentNode === this) {
                    throw new Error(
                        "You can't sort elements if any one is a descendant of another."
                    );
                }
                
                // Insert before flag:
                parentNode.insertBefore(this, nextSibling);
                // Remove flag:
                parentNode.removeChild(nextSibling);
                
            };
        });

        return Array.prototype.sort.call($elements, comparator).each(function(i) {
            placements[i].call(this);
        });
    },

    scale: function(sx, sy, ox, oy) {

        sy = sy || sx;

        if (_.isUndefined(ox)) {

            ox = 0;
            oy = 0;
        }

        // Remove previous transform so that the new scale is not affected by previous scales, especially
        // the old translate() does not affect the new translate if an origin is specified.
        V(this.viewport).attr('transform', '');

        var oldTx = this.options.origin.x;
        var oldTy = this.options.origin.y;

        // TODO: V.scale() doesn't support setting scale origin. #Fix        
        if (ox || oy || oldTx || oldTy) {

            var newTx = oldTx - ox * (sx - 1);
            var newTy = oldTy - oy * (sy - 1);
            this.setOrigin(newTx, newTy);
        }

        V(this.viewport).scale(sx, sy);

	this.trigger('scale', sx, sy, ox, oy);

        return this;
    },

    rotate: function(deg, ox, oy) {
        
        // If the origin is not set explicitely, rotate around the center. Note that
        // we must use the plain bounding box (`this.el.getBBox()` instead of the one that gives us
        // the real bounding box (`bbox()`) including transformations).
        if (_.isUndefined(ox)) {

            var bbox = this.viewport.getBBox();
            ox = bbox.width/2;
            oy = bbox.height/2;
        }

        V(this.viewport).rotate(deg, ox, oy);
    },

    // Find the first view climbing up the DOM tree starting at element `el`. Note that `el` can also
    // be a selector or a jQuery object.
    findView: function(el) {

        var $el = this.$(el);

        if ($el.length === 0 || $el[0] === this.el) {

            return undefined;
        }

        if ($el.data('view')) {

            return $el.data('view');
        }

        return this.findView($el.parent());
    },

    // Find a view for a model `cell`. `cell` can also be a string representing a model `id`.
    findViewByModel: function(cell) {

        var id = _.isString(cell) ? cell : cell.id;
        
        var $view = this.$('[model-id="' + id + '"]');
        if ($view.length) {

            return $view.data('view');
        }
        return undefined;
    },

    // Find all views at given point
    findViewsFromPoint: function(p) {

	p = g.point(p);

        var views = _.map(this.model.getElements(), this.findViewByModel);

	return _.filter(views, function(view) {
	    return view && g.rect(V(view.el).bbox(false, this.viewport)).containsPoint(p);
	}, this);
    },

    // Find all views in given area
    findViewsInArea: function(r) {

	r = g.rect(r);

        var views = _.map(this.model.getElements(), this.findViewByModel);

	return _.filter(views, function(view) {
	    return view && r.intersect(g.rect(V(view.el).bbox(false, this.viewport)));
	}, this);
    },

    getModelById: function(id) {

        return this.model.getCell(id);
    },

    snapToGrid: function(p) {

        // Convert global coordinates to the local ones of the `viewport`. Otherwise,
        // improper transformation would be applied when the viewport gets transformed (scaled/rotated). 
        var localPoint = V(this.viewport).toLocalPoint(p.x, p.y);

        return {
            x: g.snapToGrid(localPoint.x, this.options.gridSize),
            y: g.snapToGrid(localPoint.y, this.options.gridSize)
        };
    },

    getDefaultLink: function(cellView, magnet) {

        return _.isFunction(this.options.defaultLink)
        // default link is a function producing link model
            ? this.options.defaultLink.call(this, cellView, magnet)
        // default link is the Backbone model
            : this.options.defaultLink.clone();
    },

    // Cell highlighting
    // -----------------

    onCellHighlight: function(cellView, el) {
        V(el).addClass('highlighted');
    },

    onCellUnhighlight: function(cellView, el) {
        V(el).removeClass('highlighted');
    },

    // Interaction.
    // ------------

    mousedblclick: function(evt) {
        
        evt.preventDefault();
        evt = joint.util.normalizeEvent(evt);
        
        var view = this.findView(evt.target);
        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {
            
            view.pointerdblclick(evt, localPoint.x, localPoint.y);
            
        } else {
            
            this.trigger('blank:pointerdblclick', evt, localPoint.x, localPoint.y);
        }
    },

    mouseclick: function(evt) {

        // Trigger event when mouse not moved.
        if (!this._mousemoved) {
            
            evt = joint.util.normalizeEvent(evt);

            var view = this.findView(evt.target);
            var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

            if (view) {

                view.pointerclick(evt, localPoint.x, localPoint.y);
                
            } else {

                this.trigger('blank:pointerclick', evt, localPoint.x, localPoint.y);
            }
        }

        this._mousemoved = false;
    },

    pointerdown: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        
        var view = this.findView(evt.target);

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });
        
        if (view) {

            this.sourceView = view;

            view.pointerdown(evt, localPoint.x, localPoint.y);
            
        } else {

            this.trigger('blank:pointerdown', evt, localPoint.x, localPoint.y);
        }
    },

    pointermove: function(evt) {

        evt.preventDefault();
        evt = joint.util.normalizeEvent(evt);

        if (this.sourceView) {

            // Mouse moved.
            this._mousemoved = true;

            var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

            this.sourceView.pointermove(evt, localPoint.x, localPoint.y);
        }
    },

    pointerup: function(evt) {

        evt = joint.util.normalizeEvent(evt);

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });
        
        if (this.sourceView) {

            this.sourceView.pointerup(evt, localPoint.x, localPoint.y);

            //"delete sourceView" occasionally throws an error in chrome (illegal access exception)
	    this.sourceView = null;

        } else {

            this.trigger('blank:pointerup', evt, localPoint.x, localPoint.y);
        }
    },
    
    cellMouseover: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (view) {

            view.mouseover(evt);
        }
    },

    cellMouseout: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (view) {

            view.mouseout(evt);
        }
    }
});
