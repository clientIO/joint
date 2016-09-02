//      JointJS library.
//      (c) 2011-2015 client IO

joint.dia.Paper = joint.mvc.View.extend({

    className: 'paper',

    options: {

        width: 800,
        height: 600,
        origin: { x: 0, y: 0 }, // x,y coordinates in top-left corner
        gridSize: 1,

        /*
            Whether or not to draw the grid lines on the paper's DOM element.
            e.g drawGrid: true, drawGrid: { color: 'red', thickness: 2 }
         */
        drawGrid: false,

        perpendicularLinks: false,
        elementView: joint.dia.ElementView,
        linkView: joint.dia.LinkView,
        snapLinks: false, // false, true, { radius: value }

        // When set to FALSE, an element may not have more than 1 link with the same source and target element.
        multiLinks: true,

        // For adding custom guard logic.
        guard: function(evt, view) {

            // FALSE means the event isn't guarded.
            return false;
        },

        highlighting: {
            'default': {
                name: 'stroke',
                options: {
                    padding: 3
                }
            },
            magnetAvailability: {
                name: 'addClass',
                options: {
                    className: 'available-magnet'
                }
            },
            elementAvailability: {
                name: 'addClass',
                options: {
                    className: 'available-cell'
                }
            }
        },

        // Prevent the default context menu from being displayed.
        preventContextMenu: true,

        // Restrict the translation of elements by given bounding box.
        // Option accepts a boolean:
        //  true - the translation is restricted to the paper area
        //  false - no restrictions
        // A method:
        // restrictTranslate: function(elementView) {
        //     var parentId = elementView.model.get('parent');
        //     return parentId && this.model.getCell(parentId).getBBox();
        // },
        // Or a bounding box:
        // restrictTranslate: { x: 10, y: 10, width: 790, height: 590 }
        restrictTranslate: false,
        // Marks all available magnets with 'available-magnet' class name and all available cells with
        // 'available-cell' class name. Marks them when dragging a link is started and unmark
        // when the dragging is stopped.
        markAvailable: false,

        // Defines what link model is added to the graph after an user clicks on an active magnet.
        // Value could be the Backbone.model or a function returning the Backbone.model
        // defaultLink: function(elementView, magnet) { return condition ? new customLink1() : new customLink2() }
        defaultLink: new joint.dia.Link,

        // A connector that is used by links with no connector defined on the model.
        // e.g. { name: 'rounded', args: { radius: 5 }} or a function
        defaultConnector: { name: 'normal' },

        // A router that is used by links with no router defined on the model.
        // e.g. { name: 'oneSide', args: { padding: 10 }} or a function
        defaultRouter: { name: 'normal' },

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
        frontParentOnly: true,

        // Interactive flags. See online docs for the complete list of interactive flags.
        interactive: {
            labelMove: false
        },

        // When set to true the links can be pinned to the paper.
        // i.e. link source/target can be a point e.g. link.get('source') ==> { x: 100, y: 100 };
        linkPinning: true,

        // Allowed number of mousemove events after which the pointerclick event will be still triggered.
        clickThreshold: 0,

        // The namespace, where all the cell views are defined.
        cellViewNamespace: joint.shapes,

        // The namespace, where all the cell views are defined.
        highlighterNamespace: joint.highlighters
    },

    events: {

        'mousedown': 'pointerdown',
        'dblclick': 'mousedblclick',
        'click': 'mouseclick',
        'touchstart': 'pointerdown',
        'touchend': 'mouseclick',
        'touchmove': 'pointermove',
        'mousemove': 'pointermove',
        'mouseover .joint-cell': 'cellMouseover',
        'mouseout .joint-cell': 'cellMouseout',
        'contextmenu': 'contextmenu',
        'mousewheel': 'mousewheel',
        'DOMMouseScroll': 'mousewheel'
    },

    _highlights: [],

    init: function() {

        _.bindAll(this, 'pointerup');

        this.model = this.options.model || new joint.dia.Graph;

        // This is a fix for the case where two papers share the same options.
        // Changing origin.x for one paper would change the value of origin.x for the other.
        // This prevents that behavior.
        this.options.origin = _.clone(this.options.origin);
        this.options.defaultConnector = _.clone(this.options.defaultConnector);
        // Return default highlighting options into the user specified options.
        _.defaults(this.options.highlighting, this.constructor.prototype.options.highlighting);
        this.options.highlighting = _.cloneDeep(this.options.highlighting);

        this.svg = V('svg').node;
        this.viewport = V('g').addClass(joint.util.addClassNamePrefix('viewport')).node;
        this.defs = V('defs').node;

        // Append `<defs>` element to the SVG document. This is useful for filters and gradients.
        V(this.svg).append([this.viewport, this.defs]);

        this.$el.append(this.svg);

        this.listenTo(this.model, 'add', this.onCellAdded);
        this.listenTo(this.model, 'remove', this.removeView);
        this.listenTo(this.model, 'reset', this.resetViews);
        this.listenTo(this.model, 'sort', this._onSort);
        this.listenTo(this.model, 'batch:stop', this._onBatchStop);

        this.setOrigin();
        this.setDimensions();

        $(document).on('mouseup touchend', this.pointerup);

        // Hold the value when mouse has been moved: when mouse moved, no click event will be triggered.
        this._mousemoved = 0;
        // Hash of all cell views.
        this._views = {};

        this.on('cell:highlight', this.onCellHighlight, this);
        this.on('cell:unhighlight', this.onCellUnhighlight, this);
    },

    _onSort: function() {
        if (!this.model.hasActiveBatch('add')) {
            this.sortViews();
        }
    },

    _onBatchStop: function(data) {
        var name = data && data.batchName;
        if (name === 'add' && !this.model.hasActiveBatch('add')) {
            this.sortViews();
        }
    },

    onRemove: function() {

        //clean up all DOM elements/views to prevent memory leaks
        this.removeViews();

        $(document).off('mouseup touchend', this.pointerup);
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

        if (this.options.drawGrid) {
            this.drawGrid();
        }
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

        padding = joint.util.normalizeSides(padding);

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
            tx += padding.left;
            calcWidth += tx;
        }

        if ((opt.allowNewOrigin == 'negative' && bbox.y < 0) || (opt.allowNewOrigin == 'positive' && bbox.y >= 0) || opt.allowNewOrigin == 'any') {
            ty = Math.ceil(-bbox.y / gridHeight) * gridHeight;
            ty += padding.top;
            calcHeight += ty;
        }

        calcWidth += padding.right;
        calcHeight += padding.bottom;

        // Make sure the resulting width and height are greater than minimum.
        calcWidth = Math.max(calcWidth, opt.minWidth || 0);
        calcHeight = Math.max(calcHeight, opt.minHeight || 0);

        // Make sure the resulting width and height are lesser than maximum.
        calcWidth = Math.min(calcWidth, opt.maxWidth || Number.MAX_VALUE);
        calcHeight = Math.min(calcHeight, opt.maxHeight || Number.MAX_VALUE);

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

        return g.rect({
            x: crect.left - screenCTM.e + viewportCTM.e,
            y: crect.top - screenCTM.f + viewportCTM.f,
            width: crect.width,
            height: crect.height
        });
    },

    // Returns a geometry rectangle represeting the entire
    // paper area (coordinates from the left paper border to the right one
    // and the top border to the bottom one).
    getArea: function() {

        var transformationMatrix = this.viewport.getCTM().inverse();
        var noTransformationBBox = { x: 0, y: 0, width: this.options.width, height: this.options.height };

        return g.rect(V.transformRect(noTransformationBBox, transformationMatrix));
    },

    getRestrictedArea: function() {

        var restrictedArea;

        if (_.isFunction(this.options.restrictTranslate)) {
            // A method returning a bounding box
            restrictedArea = this.options.restrictTranslate.apply(this, arguments);
        } else if (this.options.restrictTranslate === true) {
            // The paper area
            restrictedArea = this.getArea();
        } else {
            // Either false or a bounding box
            restrictedArea = this.options.restrictTranslate || null;
        }

        return restrictedArea;
    },

    createViewForModel: function(cell) {

        // A class taken from the paper options.
        var optionalViewClass;

        // A default basic class (either dia.ElementView or dia.LinkView)
        var defaultViewClass;

        // A special class defined for this model in the corresponding namespace.
        // e.g. joint.shapes.basic.Rect searches for joint.shapes.basic.RectView
        var namespace = this.options.cellViewNamespace;
        var type = cell.get('type') + 'View';
        var namespaceViewClass = joint.util.getByPath(namespace, type, '.');

        if (cell.isLink()) {
            optionalViewClass = this.options.linkView;
            defaultViewClass = joint.dia.LinkView;
        } else {
            optionalViewClass = this.options.elementView;
            defaultViewClass = joint.dia.ElementView;
        }

        // a) the paper options view is a class (deprecated)
        //  1. search the namespace for a view
        //  2. if no view was found, use view from the paper options
        // b) the paper options view is a function
        //  1. call the function from the paper options
        //  2. if no view was return, search the namespace for a view
        //  3. if no view was found, use the default
        var ViewClass = (optionalViewClass.prototype instanceof Backbone.View)
            ? namespaceViewClass || optionalViewClass
            : optionalViewClass.call(this, cell) || namespaceViewClass || defaultViewClass;

        return new ViewClass({
            model: cell,
            interactive: this.options.interactive
        });
    },

    onCellAdded: function(cell, graph, opt) {

        if (this.options.async && opt.async !== false && _.isNumber(opt.position)) {

            this._asyncCells = this._asyncCells || [];
            this._asyncCells.push(cell);

            if (opt.position == 0) {

                if (this._frameId) throw new Error('another asynchronous rendering in progress');

                this.asyncRenderViews(this._asyncCells, opt);
                delete this._asyncCells;
            }

        } else {

            this.renderView(cell);
        }
    },

    removeView: function(cell) {

        var view = this._views[cell.id];

        if (view) {
            view.remove();
            delete this._views[cell.id];
        }

        return view;
    },

    renderView: function(cell) {

        var view = this._views[cell.id] = this.createViewForModel(cell);

        V(this.viewport).append(view.el);
        view.paper = this;
        view.render();

        // This is the only way to prevent image dragging in Firefox that works.
        // Setting -moz-user-select: none, draggable="false" attribute or user-drag: none didn't help.
        $(view.el).find('image').on('dragstart', function() { return false; });

        return view;
    },

    beforeRenderViews: function(cells) {

        // Make sure links are always added AFTER elements.
        // They wouldn't find their sources/targets in the DOM otherwise.
        cells.sort(function(a) { return a instanceof joint.dia.Link ? 1 : -1; });

        return cells;
    },

    afterRenderViews: function() {

        this.sortViews();
    },

    resetViews: function(cellsCollection, opt) {

        // clearing views removes any event listeners
        this.removeViews();

        var cells = cellsCollection.models.slice();

        // `beforeRenderViews()` can return changed cells array (e.g sorted).
        cells = this.beforeRenderViews(cells, opt) || cells;

        if (this._frameId) {

            joint.util.cancelFrame(this._frameId);
            delete this._frameId;
        }

        if (this.options.async) {

            this.asyncRenderViews(cells, opt);
            // Sort the cells once all elements rendered (see asyncRenderViews()).

        } else {

            _.each(cells, this.renderView, this);

            // Sort the cells in the DOM manually as we might have changed the order they
            // were added to the DOM (see above).
            this.sortViews();
        }
    },

    removeViews: function() {

        _.invoke(this._views, 'remove');

        this._views = {};
    },

    asyncBatchAdded: _.noop,

    asyncRenderViews: function(cells, opt) {

        if (this._frameId) {

            var batchSize = (this.options.async && this.options.async.batchSize) || 50;
            var batchCells = cells.splice(0, batchSize);
            var collection = this.model.get('cells');

            _.each(batchCells, function(cell) {

                // The cell has to be part of the graph collection.
                // There is a chance in asynchronous rendering
                // that a cell was removed before it's rendered to the paper.
                if (cell.collection === collection) this.renderView(cell);

            }, this);

            this.asyncBatchAdded();
        }

        if (!cells.length) {

            // No cells left to render.
            delete this._frameId;
            this.afterRenderViews(opt);
            this.trigger('render:done', opt);

        } else {

            // Schedule a next batch to render.
            this._frameId = joint.util.nextFrame(function() {
                this.asyncRenderViews(cells, opt);
            }, this);
        }
    },

    sortViews: function() {

        // Run insertion sort algorithm in order to efficiently sort DOM elements according to their
        // associated model `z` attribute.

        var $cells = $(this.viewport).children('[model-id]');
        var cells = this.model.get('cells');

        joint.util.sortElements($cells, function(a, b) {

            var cellA = cells.get($(a).attr('model-id'));
            var cellB = cells.get($(b).attr('model-id'));

            return (cellA.get('z') || 0) > (cellB.get('z') || 0) ? 1 : -1;
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

        if (this.options.drawGrid) {
            this.drawGrid();
        }

        return this;
    },

    rotate: function(deg, ox, oy) {

        // If the origin is not set explicitely, rotate around the center. Note that
        // we must use the plain bounding box (`this.el.getBBox()` instead of the one that gives us
        // the real bounding box (`bbox()`) including transformations).
        if (_.isUndefined(ox)) {

            var bbox = this.viewport.getBBox();
            ox = bbox.width / 2;
            oy = bbox.height / 2;
        }

        V(this.viewport).rotate(deg, ox, oy);
    },

    // Find the first view climbing up the DOM tree starting at element `el`. Note that `el` can also
    // be a selector or a jQuery object.
    findView: function($el) {

        var el = _.isString($el)
            ? this.viewport.querySelector($el)
            : $el instanceof $ ? $el[0] : $el;

        while (el && el !== this.el && el !== document) {

            var id = el.getAttribute('model-id');
            if (id) return this._views[id];

            el = el.parentNode;
        }

        return undefined;
    },

    // Find a view for a model `cell`. `cell` can also be a string representing a model `id`.
    findViewByModel: function(cell) {

        var id = _.isString(cell) ? cell : cell.id;

        return this._views[id];
    },

    // Find all views at given point
    findViewsFromPoint: function(p) {

        p = g.point(p);

        var views = _.map(this.model.getElements(), this.findViewByModel, this);

        return _.filter(views, function(view) {
            return view && g.rect(view.vel.bbox(false, this.viewport)).containsPoint(p);
        }, this);
    },

    // Find all views in given area
    findViewsInArea: function(rect, opt) {

        opt = _.defaults(opt || {}, { strict: false });
        rect = g.rect(rect);

        var views = _.map(this.model.getElements(), this.findViewByModel, this);
        var method = opt.strict ? 'containsRect' : 'intersect';

        return _.filter(views, function(view) {
            return view && rect[method](g.rect(view.vel.bbox(false, this.viewport)));
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

    // Transform client coordinates to the paper local coordinates.
    // Useful when you have a mouse event object and you'd like to get coordinates
    // inside the paper that correspond to `evt.clientX` and `evt.clientY` point.
    // Exmaple: var paperPoint = paper.clientToLocalPoint({ x: evt.clientX, y: evt.clientY });
    clientToLocalPoint: function(p) {

        p = g.point(p);

        // This is a hack for Firefox! If there wasn't a fake (non-visible) rectangle covering the
        // whole SVG area, `$(paper.svg).offset()` used below won't work.
        var fakeRect = V('rect', { width: this.options.width, height: this.options.height, x: 0, y: 0, opacity: 0 });
        V(this.svg).prepend(fakeRect);

        var paperOffset = $(this.svg).offset();

        // Clean up the fake rectangle once we have the offset of the SVG document.
        fakeRect.remove();

        var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;

        p.offset(scrollLeft - paperOffset.left, scrollTop - paperOffset.top);

        // Transform point into the viewport coordinate system.
        return V.transformPoint(p, this.viewport.getCTM().inverse());
    },

    linkAllowed: function(linkViewOrModel) {

        var link;

        if (linkViewOrModel instanceof joint.dia.Link) {
            link = linkViewOrModel;
        } else if (linkViewOrModel instanceof joint.dia.LinkView) {
            link = linkViewOrModel.model;
        } else {
            throw new Error('Must provide link model or view.');
        }

        if (!this.options.multiLinks) {

            // Do not allow multiple links to have the same source and target.

            var source = link.get('source');
            var target = link.get('target');

            if (source.id && target.id) {

                var sourceModel = link.getSourceElement();

                if (sourceModel) {

                    var connectedLinks = this.model.getConnectedLinks(sourceModel, {
                        outbound: true,
                        inbound: false
                    });

                    var numSameLinks = _.filter(connectedLinks, function(_link) {

                        var _source = _link.get('source');
                        var _target = _link.get('target');

                        return _source && _source.id === source.id &&
                                (!_source.port || (_source.port === source.port)) &&
                                _target && _target.id === target.id &&
                                (!_target.port || (_target.port === target.port));

                    }).length;

                    if (numSameLinks > 1) {
                        return false;
                    }
                }
            }
        }

        if (
            !this.options.linkPinning &&
            (
                !_.has(link.get('source'), 'id') ||
                !_.has(link.get('target'), 'id')
            )
        ) {
            // Link pinning is not allowed and the link is not connected to the target.
            return false;
        }

        return true;
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
    resolveHighlighter: function(opt) {

        opt = opt || {};
        var highlighterDef = opt.highlighter;
        var paperOpt = this.options;

        /*
            Expecting opt.highlighter to have the following structure:
            {
                name: 'highlighter-name',
                options: {
                    some: 'value'
                }
            }
        */
        if (_.isUndefined(highlighterDef)) {

            // check for built-in types
            var type = _.chain(opt)
                .pick('embedding', 'connecting', 'magnetAvailability', 'elementAvailability')
                .keys().first().value();

            highlighterDef = (type && paperOpt.highlighting[type]) || paperOpt.highlighting['default'];
        }

        // Do nothing if opt.highlighter is falsey.
        // This allows the case to not highlight cell(s) in certain cases.
        // For example, if you want to NOT highlight when embedding elements.
        if (!highlighterDef) return false;

        // Allow specifying a highlighter by name.
        if (_.isString(highlighterDef)) {
            highlighterDef = {
                name: highlighterDef
            };
        }

        var name = highlighterDef.name;
        var highlighter = paperOpt.highlighterNamespace[name];

        // Highlighter validation
        if (!highlighter) {
            throw new Error('Unknown highlighter ("' + name + '")');
        }
        if (typeof highlighter.highlight !== 'function') {
            throw new Error('Highlighter ("' + name + '") is missing required highlight() method');
        }
        if (typeof highlighter.unhighlight !== 'function') {
            throw new Error('Highlighter ("' + name + '") is missing required unhighlight() method');
        }

        return {
            highlighter: highlighter,
            options: highlighterDef.options || {},
            name: name
        };
    },

    onCellHighlight: function(cellView, magnetEl, opt) {

        opt = this.resolveHighlighter(opt);
        if (!opt) return;

        var key = opt.name + magnetEl.id + JSON.stringify(opt.options);
        if (!this._highlights[key]) {

            var highlighter = opt.highlighter;
            highlighter.highlight(cellView, magnetEl, _.clone(opt.options));

            this._highlights[key] = {
                cellView: cellView,
                magnetEl: magnetEl,
                opt: opt.options,
                highlighter: highlighter
            };
        }
    },

    onCellUnhighlight: function(cellView, magnetEl, opt) {

        opt = this.resolveHighlighter(opt);
        if (!opt) return;

        var key = opt.name + magnetEl.id + JSON.stringify(opt.options);
        var highlight = this._highlights[key];
        if (highlight) {

            // Use the cellView and magnetEl that were used by the highlighter.highlight() method.
            highlight.highlighter.unhighlight(highlight.cellView, highlight.magnetEl, highlight.opt);

            this._highlights[key] = null;
        }
    },

    // Interaction.
    // ------------

    mousedblclick: function(evt) {

        evt.preventDefault();
        evt = joint.util.normalizeEvent(evt);

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {

            view.pointerdblclick(evt, localPoint.x, localPoint.y);

        } else {

            this.trigger('blank:pointerdblclick', evt, localPoint.x, localPoint.y);
        }
    },

    mouseclick: function(evt) {

        // Trigger event when mouse not moved.
        if (this._mousemoved <= this.options.clickThreshold) {

            evt = joint.util.normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) return;

            var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

            if (view) {

                view.pointerclick(evt, localPoint.x, localPoint.y);

            } else {

                this.trigger('blank:pointerclick', evt, localPoint.x, localPoint.y);
            }
        }
    },

    // Guard guards the event received. If the event is not interesting, guard returns `true`.
    // Otherwise, it return `false`.
    guard: function(evt, view) {

        if (this.options.guard && this.options.guard(evt, view)) {
            return true;
        }

        if (evt.data && !_.isUndefined(evt.data.guarded)) {
            return evt.data.guarded;
        }

        if (view && view.model && (view.model instanceof joint.dia.Cell)) {
            return false;
        }

        if (this.svg === evt.target || this.el === evt.target || $.contains(this.svg, evt.target)) {
            return false;
        }

        return true;    // Event guarded. Paper should not react on it in any way.
    },

    contextmenu: function(evt) {

        evt = joint.util.normalizeEvent(evt);

        if (this.options.preventContextMenu) {
            evt.preventDefault();
        }

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {

            view.contextmenu(evt, localPoint.x, localPoint.y);

        } else {

            this.trigger('blank:contextmenu', evt, localPoint.x, localPoint.y);
        }
    },

    pointerdown: function(evt) {

        evt = joint.util.normalizeEvent(evt);

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        evt.preventDefault();

        this._mousemoved = 0;

        var localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {

            this.sourceView = view;

            view.pointerdown(evt, localPoint.x, localPoint.y);

        } else {

            this.trigger('blank:pointerdown', evt, localPoint.x, localPoint.y);
        }
    },

    pointermove: function(evt) {

        if (this.sourceView) {

            evt.preventDefault();
            evt = joint.util.normalizeEvent(evt);

            // Mouse moved counter.
            this._mousemoved++;

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

    mousewheel: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        var originalEvent = evt.originalEvent;
        var localPoint = this.snapToGrid({ x: originalEvent.clientX, y: originalEvent.clientY });
        var delta = Math.max(-1, Math.min(1, (originalEvent.wheelDelta || -originalEvent.detail)));

        if (view) {

            view.mousewheel(evt, localPoint.x, localPoint.y, delta);

        } else {

            this.trigger('blank:mousewheel', evt, localPoint.x, localPoint.y, delta);
        }
    },

    cellMouseover: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (view) {
            if (this.guard(evt, view)) return;
            view.mouseover(evt);
        }
    },

    cellMouseout: function(evt) {

        evt = joint.util.normalizeEvent(evt);
        var view = this.findView(evt.target);
        if (view) {
            if (this.guard(evt, view)) return;
            view.mouseout(evt);
        }
    },

    setGridSize: function(gridSize) {

        this.options.gridSize = gridSize;

        if (this.options.drawGrid) {
            this.drawGrid();
        }

        return this;
    },

    clearGrid: function() {

        this.el.style.backgroundImage = 'none';
        return this;
    },

    drawGrid: function(opt) {

        opt = _.defaults(opt || {}, this.options.drawGrid, {
            color: '#aaa',
            thickness: 1
        });

        var gridSize = this.options.gridSize;

        if (gridSize <= 1) {
            return this.clearGrid();
        }

        var currentScale = V(this.viewport).scale();
        var scaleX = currentScale.sx;
        var scaleY = currentScale.sy;
        var originX = this.options.origin.x;
        var originY = this.options.origin.y;
        var gridX = gridSize * scaleX;
        var gridY = gridSize * scaleY;

        var canvas = document.createElement('canvas');

        canvas.width = gridX;
        canvas.height = gridY;

        gridX = originX >= 0 ? originX % gridX : gridX + originX % gridX;
        gridY = originY >= 0 ? originY % gridY : gridY + originY % gridY;

        var context = canvas.getContext('2d');
        context.beginPath();
        context.rect(gridX, gridY, opt.thickness * scaleX, opt.thickness * scaleY);
        context.fillStyle = opt.color;
        context.fill();

        var backgroundImage = canvas.toDataURL('image/png');
        this.el.style.backgroundImage = 'url("' + backgroundImage + '")';

        return this;
    },

    setInteractivity: function(value) {

        this.options.interactive = value;

        _.invoke(this._views, 'setInteractivity', value);
    }
});
