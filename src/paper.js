import { View } from './mvc';
import { V } from './vectorizer';
import * as g from './geometry';
import { Graph } from './graph';
import * as util from './util';
import $ from 'jquery';
import Backbone from 'backbone';
import { CellView } from './cellView';
import { ElementView } from './elementView';
import { Cell } from './cell';
import { Link } from './link';
import { LinkView } from './linkView';

export const Paper = View.extend({

    className: 'paper',

    options: {

        width: 800,
        height: 600,
        origin: { x: 0, y: 0 }, // x,y coordinates in top-left corner
        gridSize: 1,

        // Whether or not to draw the grid lines on the paper's DOM element.
        // e.g drawGrid: true, drawGrid: { color: 'red', thickness: 2 }
        drawGrid: false,

        // Whether or not to draw the background on the paper's DOM element.
        // e.g. background: { color: 'lightblue', image: '/paper-background.png', repeat: 'flip-xy' }
        background: false,

        perpendicularLinks: false,
        elementView: ElementView,
        linkView: LinkView,
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

        // Prevent the default action for blank:pointer<action>.
        preventDefaultBlankAction: true,

        // Restrict the translation of elements by given bounding box.
        // Option accepts a boolean:
        //  true - the translation is restricted to the paper area
        //  false - no restrictions
        // A method:
        // restrictTranslate: function(elementView) {
        //     const parentId = elementView.model.get('parent');
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
        defaultLink: () => new Link,

        // A connector that is used by links with no connector defined on the model.
        // e.g. { name: 'rounded', args: { radius: 5 }} or a function
        defaultConnector: { name: 'normal' },

        // A router that is used by links with no router defined on the model.
        // e.g. { name: 'oneSide', args: { padding: 10 }} or a function
        defaultRouter: { name: 'normal' },

        defaultAnchor: { name: 'center' },

        defaultConnectionPoint: { name: 'bbox' },

        /* CONNECTING */

        connectionStrategy: null,

        // Check whether to add a new link to the graph when user clicks on an a magnet.
        validateMagnet: function(cellView, magnet) {
            return magnet.getAttribute('magnet') !== 'passive';
        },

        // Check whether to allow or disallow the link connection while an arrowhead end (source/target)
        // being changed.
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            return (end === 'target' ? cellViewT : cellViewS) instanceof ElementView;
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
        // The cell with the highest z-index (visually on the top) will be chosen.
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

        // Custom validation after an interaction with a link ends.
        // Recognizes a function. If `false` is returned, the link is disallowed (removed or reverted)
        // (linkView, paper) => boolean
        allowLink: null,

        // Allowed number of mousemove events after which the pointerclick event will be still triggered.
        clickThreshold: 0,

        // Number of required mousemove events before the first pointermove event will be triggered.
        moveThreshold: 0,

        // Number of required mousemove events before the a link is created out of the magnet.
        // Or string `onleave` so the link is created when the pointer leaves the magnet
        magnetThreshold: 0,

        // The namespace, where all the cell views are defined.
        //TODO v.talas es6 joint.shapes
        cellViewNamespace: () => joint.shapes,

        // The namespace, where all the cell views are defined.
        //TODO v.talas es6 joint.highlighters
        highlighterNamespace: () => joint.highlighters
    },

    events: {
        'dblclick': 'pointerdblclick',
        'contextmenu': 'contextmenu',
        'mousedown': 'pointerdown',
        'touchstart': 'pointerdown',
        'mouseover': 'mouseover',
        'mouseout': 'mouseout',
        'mouseenter': 'mouseenter',
        'mouseleave': 'mouseleave',
        'mousewheel': 'mousewheel',
        'DOMMouseScroll': 'mousewheel',
        'mouseenter .joint-cell': 'mouseenter',
        'mouseleave .joint-cell': 'mouseleave',
        'mouseenter .joint-tools': 'mouseenter',
        'mouseleave .joint-tools': 'mouseleave',
        'mousedown .joint-cell [event]': 'onevent', // interaction with cell with `event` attribute set
        'touchstart .joint-cell [event]': 'onevent',
        'mousedown .joint-cell [magnet]': 'onmagnet', // interaction with cell with `magnet` attribute set
        'touchstart .joint-cell [magnet]': 'onmagnet',
        'dblclick .joint-cell [magnet]': 'magnetpointerdblclick',
        'contextmenu .joint-cell [magnet]': 'magnetcontextmenu',
        'mousedown .joint-link .label': 'onlabel', // interaction with link label
        'touchstart .joint-link .label': 'onlabel',
        'dragstart .joint-cell image': 'onImageDragStart' // firefox fix
    },

    documentEvents: {
        'mousemove': 'pointermove',
        'touchmove': 'pointermove',
        'mouseup': 'pointerup',
        'touchend': 'pointerup',
        'touchcancel': 'pointerup'
    },

    _highlights: {},

    init: function() {

        util.bindAll(this, 'pointerup');

        const model = this.model = this.options.model || new Graph;

        this.setGrid(this.options.drawGrid);
        this.cloneOptions();
        this.render();
        this.setDimensions();

        this.listenTo(model, 'add', this.onCellAdded)
            .listenTo(model, 'remove', this.removeView)
            .listenTo(model, 'reset', this.resetViews)
            .listenTo(model, 'sort', this._onSort)
            .listenTo(model, 'batch:stop', this._onBatchStop);

        this.on('cell:highlight', this.onCellHighlight)
            .on('cell:unhighlight', this.onCellUnhighlight)
            .on('scale translate', this.update);

        // Hash of all cell views.
        this._views = {};
        // Reference to the paper owner document
        this.$document = $(this.el.ownerDocument);
    },

    cloneOptions: function() {

        const options = this.options;

        // This is a fix for the case where two papers share the same options.
        // Changing origin.x for one paper would change the value of origin.x for the other.
        // This prevents that behavior.
        options.origin = util.assign({}, options.origin);
        options.defaultConnector = util.assign({}, options.defaultConnector);
        // Return the default highlighting options into the user specified options.
        options.highlighting = util.defaultsDeep(
            {},
            options.highlighting,
            this.constructor.prototype.options.highlighting
        );
    },

    render: function() {

        this.$el.empty();

        this.svg = V('svg').attr({ width: '100%', height: '100%' }).node;
        this.viewport = V('g').addClass(util.addClassNamePrefix('viewport')).node;
        this.defs = V('defs').node;
        this.tools = V('g').addClass(util.addClassNamePrefix('tools-container')).node;
        // Append `<defs>` element to the SVG document. This is useful for filters and gradients.
        // It's desired to have the defs defined before the viewport (e.g. to make a PDF document pick up defs properly).
        V(this.svg).append([this.defs, this.viewport, this.tools]);

        this.$background = $('<div/>').addClass(util.addClassNamePrefix('paper-background'));
        if (this.options.background) {
            this.drawBackground(this.options.background);
        }

        this.$grid = $('<div/>').addClass(util.addClassNamePrefix('paper-grid'));
        if (this.options.drawGrid) {
            this.drawGrid();
        }

        this.$el.append(this.$background, this.$grid, this.svg);

        return this;
    },

    update: function() {

        if (this.options.drawGrid) {
            this.drawGrid();
        }

        if (this._background) {
            this.updateBackgroundImage(this._background);
        }

        return this;
    },

    // For storing the current transformation matrix (CTM) of the paper's viewport.
    _viewportMatrix: null,

    // For verifying whether the CTM is up-to-date. The viewport transform attribute
    // could have been manipulated directly.
    _viewportTransformString: null,

    matrix: function(ctm) {

        const viewport = this.viewport;

        // Getter:
        if (ctm === undefined) {

            const transformString = viewport.getAttribute('transform');

            if ((this._viewportTransformString || null) === transformString) {
                // It's ok to return the cached matrix. The transform attribute has not changed since
                // the matrix was stored.
                ctm = this._viewportMatrix;
            } else {
                // The viewport transform attribute has changed. Measure the matrix and cache again.
                ctm = viewport.getCTM();
                this._viewportMatrix = ctm;
                this._viewportTransformString = transformString;
            }

            // Clone the cached current transformation matrix.
            // If no matrix previously stored the identity matrix is returned.
            return V.createSVGMatrix(ctm);
        }

        // Setter:
        ctm = V.createSVGMatrix(ctm);
        const ctmString = V.matrixToTransformString(ctm);
        viewport.setAttribute('transform', ctmString);
        this.tools.setAttribute('transform', ctmString);

        this._viewportMatrix = ctm;
        this._viewportTransformString = viewport.getAttribute('transform');

        return this;
    },

    clientMatrix: function() {

        return V.createSVGMatrix(this.viewport.getScreenCTM());
    },

    _sortDelayingBatches: ['add', 'to-front', 'to-back'],

    _onSort: function() {
        if (!this.model.hasActiveBatch(this._sortDelayingBatches)) {
            this.sortViews();
        }
    },

    _onBatchStop: function(data) {
        const name = data && data.batchName;
        if (this._sortDelayingBatches.includes(name) &&
            !this.model.hasActiveBatch(this._sortDelayingBatches)) {
            this.sortViews();
        }
    },

    onRemove: function() {

        //clean up all DOM elements/views to prevent memory leaks
        this.removeViews();
    },

    getComputedSize: function() {

        const options = this.options;
        let w = options.width;
        let h = options.height;
        if (!util.isNumber(w)) w = this.el.clientWidth;
        if (!util.isNumber(h)) h = this.el.clientHeight;
        return { width: w, height: h };
    },

    setDimensions: function(width, height) {

        const options = this.options;
        let w = (width === undefined) ? options.width : width;
        let h = (height === undefined) ? options.height : height;
        this.options.width = w;
        this.options.height = h;
        if (util.isNumber(w)) w = Math.round(w);
        if (util.isNumber(h)) h = Math.round(h);
        this.$el.css({
            width: (w === null) ? '' : w,
            height: (h === null) ? '' : h
        });
        const computedSize = this.getComputedSize();
        this.trigger('resize', computedSize.width, computedSize.height);
    },

    setOrigin: function(ox, oy) {

        return this.translate(ox || 0, oy || 0, { absolute: true });
    },

    // Expand/shrink the paper to fit the content. Snap the width/height to the grid
    // defined in `gridWidth`, `gridHeight`. `padding` adds to the resulting width/height of the paper.
    // When options { fitNegative: true } it also translates the viewport in order to make all
    // the content visible.
    fitToContent: function(gridWidth, gridHeight, padding, opt) { // alternatively function(opt)

        if (util.isObject(gridWidth)) {
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

        padding = util.normalizeSides(padding);

        // Calculate the paper size to accommodate all the graph's elements.
        const bbox = V(this.viewport).getBBox();

        const currentScale = this.scale();
        const currentTranslate = this.translate();

        bbox.x *= currentScale.sx;
        bbox.y *= currentScale.sy;
        bbox.width *= currentScale.sx;
        bbox.height *= currentScale.sy;

        let calcWidth = Math.max(Math.ceil((bbox.width + bbox.x) / gridWidth), 1) * gridWidth;
        let calcHeight = Math.max(Math.ceil((bbox.height + bbox.y) / gridHeight), 1) * gridHeight;

        let tx = 0;
        let ty = 0;

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

        const computedSize = this.getComputedSize();
        const dimensionChange = calcWidth != computedSize.width || calcHeight != computedSize.height;
        const originChange = tx != currentTranslate.tx || ty != currentTranslate.ty;

        // Change the dimensions only if there is a size discrepency or an origin change
        if (originChange) {
            this.translate(tx, ty);
        }
        if (dimensionChange) {
            this.setDimensions(calcWidth, calcHeight);
        }
    },

    scaleContentToFit: function(opt) {

        const contentBBox = this.getContentBBox();

        if (!contentBBox.width || !contentBBox.height) return;

        opt = opt || {};

        util.defaults(opt, {
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

        const padding = opt.padding;

        const minScaleX = opt.minScaleX || opt.minScale;
        const maxScaleX = opt.maxScaleX || opt.maxScale;
        const minScaleY = opt.minScaleY || opt.minScale;
        const maxScaleY = opt.maxScaleY || opt.maxScale;

        let fittingBBox;
        if (opt.fittingBBox) {
            fittingBBox = opt.fittingBBox;
        } else {
            const currentTranslate = this.translate();
            const computedSize = this.getComputedSize();
            fittingBBox = {
                x: currentTranslate.tx,
                y: currentTranslate.ty,
                width: computedSize.width,
                height: computedSize.height
            };
        }

        fittingBBox = new g.Rect(fittingBBox).inflate(-padding);

        const currentScale = this.scale();

        let newSx = fittingBBox.width / contentBBox.width * currentScale.sx;
        let newSy = fittingBBox.height / contentBBox.height * currentScale.sy;

        if (opt.preserveAspectRatio) {
            newSx = newSy = Math.min(newSx, newSy);
        }

        // snap scale to a grid
        if (opt.scaleGrid) {

            const gridSize = opt.scaleGrid;

            newSx = gridSize * Math.floor(newSx / gridSize);
            newSy = gridSize * Math.floor(newSy / gridSize);
        }

        // scale min/max boundaries
        newSx = Math.min(maxScaleX, Math.max(minScaleX, newSx));
        newSy = Math.min(maxScaleY, Math.max(minScaleY, newSy));

        this.scale(newSx, newSy);

        const contentTranslation = this.getContentBBox();

        const newOx = fittingBBox.x - contentTranslation.x;
        const newOy = fittingBBox.y - contentTranslation.y;

        this.translate(newOx, newOy);
    },

    // Return the dimensions of the content area in local units (without transformations).
    getContentArea: function() {

        return V(this.viewport).getBBox();
    },

    // Return the dimensions of the content bbox in client units (as it appears on screen).
    getContentBBox: function() {

        const crect = this.viewport.getBoundingClientRect();

        // Using Screen CTM was the only way to get the real viewport bounding box working in both
        // Google Chrome and Firefox.
        const clientCTM = this.clientMatrix();

        // for non-default origin we need to take the viewport translation into account
        const currentTranslate = this.translate();

        return new g.Rect({
            x: crect.left - clientCTM.e + currentTranslate.tx,
            y: crect.top - clientCTM.f + currentTranslate.ty,
            width: crect.width,
            height: crect.height
        });
    },

    // Returns a geometry rectangle representing the entire
    // paper area (coordinates from the left paper border to the right one
    // and the top border to the bottom one).
    getArea: function() {

        return this.paperToLocalRect(this.getComputedSize());
    },

    getRestrictedArea: function() {

        let restrictedArea;

        if (util.isFunction(this.options.restrictTranslate)) {
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
        let optionalViewClass;

        // A default basic class (either dia.ElementView or dia.LinkView)
        let defaultViewClass;

        // A special class defined for this model in the corresponding namespace.
        // e.g. joint.shapes.basic.Rect searches for joint.shapes.basic.RectView
        //TODO v.talas pre-es6 temporary (shapes)
        const namespace = util.result(this.options, 'cellViewNamespace');
        // const namespace = this.options.cellViewNamespace;

        const type = cell.get('type') + 'View';
        const namespaceViewClass = util.getByPath(namespace, type, '.');

        if (cell.isLink()) {
            optionalViewClass = this.options.linkView;
            defaultViewClass = LinkView;
        } else {
            optionalViewClass = this.options.elementView;
            defaultViewClass = ElementView;
        }

        // a) the paper options view is a class (deprecated)
        //  1. search the namespace for a view
        //  2. if no view was found, use view from the paper options
        // b) the paper options view is a function
        //  1. call the function from the paper options
        //  2. if no view was return, search the namespace for a view
        //  3. if no view was found, use the default
        const ViewClass = (optionalViewClass.prototype instanceof Backbone.View)
            ? namespaceViewClass || optionalViewClass
            : optionalViewClass.call(this, cell) || namespaceViewClass || defaultViewClass;

        return new ViewClass({
            model: cell,
            interactive: this.options.interactive
        });
    },

    onCellAdded: function(cell, graph, opt) {

        if (this.options.async && opt.async !== false && util.isNumber(opt.position)) {

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

        const view = this._views[cell.id];

        if (view) {
            view.remove();
            delete this._views[cell.id];
        }

        return view;
    },

    renderView: function(cell) {

        const view = this._views[cell.id] = this.createViewForModel(cell);

        this.viewport.appendChild(view.el);
        view.paper = this;
        view.render();

        return view;
    },

    onImageDragStart: function() {
        // This is the only way to prevent image dragging in Firefox that works.
        // Setting -moz-user-select: none, draggable="false" attribute or user-drag: none didn't help.

        return false;
    },

    beforeRenderViews: function(cells) {

        // Make sure links are always added AFTER elements.
        // They wouldn't find their sources/targets in the DOM otherwise.
        cells.sort(function(a) { return (a.isLink()) ? 1 : -1; });

        return cells;
    },

    afterRenderViews: function() {

        this.sortViews();
    },

    resetViews: function(cellsCollection, opt) {

        // clearing views removes any event listeners
        this.removeViews();

        let cells = cellsCollection.models.slice();

        // `beforeRenderViews()` can return changed cells array (e.g sorted).
        cells = this.beforeRenderViews(cells, opt) || cells;

        this.cancelRenderViews();

        if (this.options.async) {

            this.asyncRenderViews(cells, opt);
            // Sort the cells once all elements rendered (see asyncRenderViews()).

        } else {

            for (let i = 0, n = cells.length; i < n; i++) {
                this.renderView(cells[i]);
            }

            // Sort the cells in the DOM manually as we might have changed the order they
            // were added to the DOM (see above).
            this.sortViews();
        }
    },

    cancelRenderViews: function() {
        if (this._frameId) {
            util.cancelFrame(this._frameId);
            delete this._frameId;
        }
    },

    removeViews: function() {

        util.invoke(this._views, 'remove');

        this._views = {};
    },

    asyncBatchAdded: util.noop,

    asyncRenderViews: function(cells, opt) {

        if (this._frameId) {

            const batchSize = (this.options.async && this.options.async.batchSize) || 50;
            const batchCells = cells.splice(0, batchSize);

            batchCells.forEach(function(cell) {

                // The cell has to be part of the graph.
                // There is a chance in asynchronous rendering
                // that a cell was removed before it's rendered to the paper.
                if (cell.graph === this.model) this.renderView(cell);

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
            this._frameId = util.nextFrame(function() {
                this.asyncRenderViews(cells, opt);
            }, this);
        }
    },

    sortViews: function() {

        // Run insertion sort algorithm in order to efficiently sort DOM elements according to their
        // associated model `z` attribute.

        const $cells = $(this.viewport).children('[model-id]');
        const cells = this.model.get('cells');

        util.sortElements($cells, function(a, b) {

            const cellA = cells.get($(a).attr('model-id'));
            const cellB = cells.get($(b).attr('model-id'));

            return (cellA.get('z') || 0) > (cellB.get('z') || 0) ? 1 : -1;
        });
    },

    MIN_SCALE: 1e-6,

    scale: function(sx, sy, ox, oy) {

        // getter
        if (sx === undefined) {
            return V.matrixToScale(this.matrix());
        }

        // setter
        if (sy === undefined) {
            sy = sx;
        }
        if (ox === undefined) {
            ox = 0;
            oy = 0;
        }

        const translate = this.translate();

        if (ox || oy || translate.tx || translate.ty) {
            const newTx = translate.tx - ox * (sx - 1);
            const newTy = translate.ty - oy * (sy - 1);
            this.translate(newTx, newTy);
        }

        sx = Math.max(sx || 0, this.MIN_SCALE);
        sy = Math.max(sy || 0, this.MIN_SCALE);

        const ctm = this.matrix();
        ctm.a = sx;
        ctm.d = sy;

        this.matrix(ctm);

        this.trigger('scale', sx, sy, ox, oy);

        return this;
    },

    // Experimental - do not use in production.
    rotate: function(angle, cx, cy) {

        // getter
        if (angle === undefined) {
            return V.matrixToRotate(this.matrix());
        }

        // setter

        // If the origin is not set explicitly, rotate around the center. Note that
        // we must use the plain bounding box (`this.el.getBBox()` instead of the one that gives us
        // the real bounding box (`bbox()`) including transformations).
        if (cx === undefined) {
            const bbox = this.viewport.getBBox();
            cx = bbox.width / 2;
            cy = bbox.height / 2;
        }

        const ctm = this.matrix().translate(cx,cy).rotate(angle).translate(-cx,-cy);
        this.matrix(ctm);

        return this;
    },

    translate: function(tx, ty) {

        // getter
        if (tx === undefined) {
            return V.matrixToTranslate(this.matrix());
        }

        // setter

        const ctm = this.matrix();
        ctm.e = tx || 0;
        ctm.f = ty || 0;

        this.matrix(ctm);

        const newTranslate = this.translate();
        const origin = this.options.origin;
        origin.x = newTranslate.tx;
        origin.y = newTranslate.ty;

        this.trigger('translate', newTranslate.tx, newTranslate.ty);

        if (this.options.drawGrid) {
            this.drawGrid();
        }

        return this;
    },

    // Find the first view climbing up the DOM tree starting at element `el`. Note that `el` can also
    // be a selector or a jQuery object.
    findView: function($el) {

        const el = util.isString($el)
            ? this.viewport.querySelector($el)
            : $el instanceof $ ? $el[0] : $el;

        const id = this.findAttribute('model-id', el);
        if (id) return this._views[id];

        return undefined;
    },

    // Find a view for a model `cell`. `cell` can also be a string or number representing a model `id`.
    findViewByModel: function(cell) {

        const id = (util.isString(cell) || util.isNumber(cell)) ? cell : (cell && cell.id);

        return this._views[id];
    },

    // Find all views at given point
    findViewsFromPoint: function(p) {

        p = new g.Point(p);

        const views = this.model.getElements().map(this.findViewByModel, this);

        return views.filter(function(view) {
            return view && view.vel.getBBox({ target: this.viewport }).containsPoint(p);
        }, this);
    },

    // Find all views in given area
    findViewsInArea: function(rect, opt) {

        opt = util.defaults(opt || {}, { strict: false });
        rect = new g.Rect(rect);

        const views = this.model.getElements().map(this.findViewByModel, this);
        const method = opt.strict ? 'containsRect' : 'intersect';

        return views.filter(function(view) {
            return view && rect[method](view.vel.getBBox({ target: this.viewport }));
        }, this);
    },

    removeTools: function() {

        CellView.dispatchToolsEvent(this, 'remove');
        return this;
    },

    hideTools: function() {
        CellView.dispatchToolsEvent(this, 'hide');
        return this;
    },

    showTools: function() {
        CellView.dispatchToolsEvent(this, 'show');
        return this;
    },

    getModelById: function(id) {

        return this.model.getCell(id);
    },

    snapToGrid: function(x, y) {

        // Convert global coordinates to the local ones of the `viewport`. Otherwise,
        // improper transformation would be applied when the viewport gets transformed (scaled/rotated).
        return this.clientToLocalPoint(x, y).snapToGrid(this.options.gridSize);
    },

    localToPaperPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        const localPoint = new g.Point(x, y);
        const paperPoint = V.transformPoint(localPoint, this.matrix());
        return paperPoint;
    },

    localToPaperRect: function(x, y, width, height) {
        // allow `x` to be a rectangle and rest arguments undefined
        const localRect = new g.Rect(x, y, width, height);
        const paperRect = V.transformRect(localRect, this.matrix());
        return paperRect;
    },

    paperToLocalPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        const paperPoint = new g.Point(x, y);
        const localPoint = V.transformPoint(paperPoint, this.matrix().inverse());
        return localPoint;
    },

    paperToLocalRect: function(x, y, width, height) {
        // allow `x` to be a rectangle and rest arguments undefined
        const paperRect = new g.Rect(x, y, width, height);
        const localRect = V.transformRect(paperRect, this.matrix().inverse());
        return localRect;
    },

    localToClientPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        const localPoint = new g.Point(x, y);
        const clientPoint = V.transformPoint(localPoint, this.clientMatrix());
        return clientPoint;
    },

    localToClientRect: function(x, y, width, height) {
        // allow `x` to be a point and `y` undefined
        const localRect = new g.Rect(x, y, width, height);
        const clientRect = V.transformRect(localRect, this.clientMatrix());
        return clientRect;
    },

    // Transform client coordinates to the paper local coordinates.
    // Useful when you have a mouse event object and you'd like to get coordinates
    // inside the paper that correspond to `evt.clientX` and `evt.clientY` point.
    // Example: const localPoint = paper.clientToLocalPoint({ x: evt.clientX, y: evt.clientY });
    clientToLocalPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        const clientPoint = new g.Point(x, y);
        const localPoint = V.transformPoint(clientPoint, this.clientMatrix().inverse());
        return localPoint;
    },

    clientToLocalRect: function(x, y, width, height) {
        // allow `x` to be a point and `y` undefined
        const clientRect = new g.Rect(x, y, width, height);
        const localRect = V.transformRect(clientRect, this.clientMatrix().inverse());
        return localRect;
    },

    localToPagePoint: function(x, y) {

        return this.localToPaperPoint(x, y).offset(this.pageOffset());
    },

    localToPageRect: function(x, y, width, height) {

        return this.localToPaperRect(x, y, width, height).offset(this.pageOffset());
    },

    pageToLocalPoint: function(x, y) {

        const pagePoint = new g.Point(x, y);
        const paperPoint = pagePoint.difference(this.pageOffset());
        return this.paperToLocalPoint(paperPoint);
    },

    pageToLocalRect: function(x, y, width, height) {

        const pageOffset = this.pageOffset();
        const paperRect = new g.Rect(x, y, width, height);
        paperRect.x -= pageOffset.x;
        paperRect.y -= pageOffset.y;
        return this.paperToLocalRect(paperRect);
    },

    clientOffset: function() {

        const clientRect = this.svg.getBoundingClientRect();
        return new g.Point(clientRect.left, clientRect.top);
    },

    pageOffset: function() {

        return this.clientOffset().offset(window.scrollX, window.scrollY);
    },

    linkAllowed: function(linkView) {

        if (!(linkView instanceof LinkView)) {
            throw new Error('Must provide a linkView.');
        }

        const link = linkView.model;
        const paperOptions = this.options;
        const graph = this.model;
        const ns = graph.constructor.validations;

        if (!paperOptions.multiLinks) {
            if (!ns.multiLinks.call(this, graph, link)) return false;
        }

        if (!paperOptions.linkPinning) {
            // Link pinning is not allowed and the link is not connected to the target.
            if (!ns.linkPinning.call(this, graph, link)) return false;
        }

        if (typeof paperOptions.allowLink === 'function') {
            if (!paperOptions.allowLink.call(this, linkView, this)) return false;
        }

        return true;
    },

    getDefaultLink: function(cellView, magnet) {

        return util.isFunction(this.options.defaultLink)
            // default link is a function producing link model
            ? this.options.defaultLink.call(this, cellView, magnet)
            // default link is the Backbone model
            : this.options.defaultLink.clone();
    },

    // Cell highlighting.
    // ------------------

    resolveHighlighter: function(opt) {

        opt = opt || {};
        let highlighterDef = opt.highlighter;
        const paperOpt = this.options;

        /*
            Expecting opt.highlighter to have the following structure:
            {
                name: 'highlighter-name',
                options: {
                    some: 'value'
                }
            }
        */
        if (highlighterDef === undefined) {

            // check for built-in types
            const type = ['embedding', 'connecting', 'magnetAvailability', 'elementAvailability'].find(function(type) {
                return !!opt[type];
            });

            highlighterDef = (type && paperOpt.highlighting[type]) || paperOpt.highlighting['default'];
        }

        // Do nothing if opt.highlighter is falsy.
        // This allows the case to not highlight cell(s) in certain cases.
        // For example, if you want to NOT highlight when embedding elements.
        if (!highlighterDef) return false;

        // Allow specifying a highlighter by name.
        if (util.isString(highlighterDef)) {
            highlighterDef = {
                name: highlighterDef
            };
        }

        const name = highlighterDef.name;

        //TODO v.talas pre-es6 temporary
        const highlighters = util.result(paperOpt, 'highlighterNamespace');
        const highlighter = highlighters[name];
        // const highlighter = paperOpt.highlighterNamespace[name];

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
        if (!magnetEl.id) {
            magnetEl.id = V.uniqueId();
        }

        const key = opt.name + magnetEl.id + JSON.stringify(opt.options);
        if (!this._highlights[key]) {

            const highlighter = opt.highlighter;
            highlighter.highlight(cellView, magnetEl, util.assign({}, opt.options));

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

        const key = opt.name + magnetEl.id + JSON.stringify(opt.options);
        const highlight = this._highlights[key];
        if (highlight) {

            // Use the cellView and magnetEl that were used by the highlighter.highlight() method.
            highlight.highlighter.unhighlight(highlight.cellView, highlight.magnetEl, highlight.opt);

            this._highlights[key] = null;
        }
    },

    // Interaction.
    // ------------

    pointerdblclick: function(evt) {

        evt.preventDefault();

        // magnetpointerdblclick can stop propagation

        evt = util.normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        const localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {
            view.pointerdblclick(evt, localPoint.x, localPoint.y);

        } else {
            this.trigger('blank:pointerdblclick', evt, localPoint.x, localPoint.y);
        }
    },

    pointerclick: function(evt) {

        // magnetpointerclick can stop propagation

        const data = this.eventData(evt);
        // Trigger event only if mouse has not moved.
        if (data.mousemoved <= this.options.clickThreshold) {

            evt = util.normalizeEvent(evt);

            const view = this.findView(evt.target);
            if (this.guard(evt, view)) return;

            const localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

            if (view) {
                view.pointerclick(evt, localPoint.x, localPoint.y);

            } else {
                this.trigger('blank:pointerclick', evt, localPoint.x, localPoint.y);
            }
        }
    },

    contextmenu: function(evt) {

        if (this.options.preventContextMenu) evt.preventDefault();

        evt = util.normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        const localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {
            view.contextmenu(evt, localPoint.x, localPoint.y);

        } else {
            this.trigger('blank:contextmenu', evt, localPoint.x, localPoint.y);
        }
    },

    pointerdown: function(evt) {

        // onmagnet stops propagation when `addLinkFromMagnet` is allowed
        // onevent can stop propagation

        evt = util.normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        const localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (view) {

            evt.preventDefault();
            view.pointerdown(evt, localPoint.x, localPoint.y);

        } else {

            if (this.options.preventDefaultBlankAction) evt.preventDefault();

            this.trigger('blank:pointerdown', evt, localPoint.x, localPoint.y);
        }

        this.delegateDragEvents(view, evt.data);
    },

    pointermove: function(evt) {

        // mouse moved counter
        const data = this.eventData(evt);
        data.mousemoved || (data.mousemoved = 0);
        const mousemoved = ++data.mousemoved;

        if (mousemoved <= this.options.moveThreshold) return;

        evt = util.normalizeEvent(evt);

        const localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });

        const view = data.sourceView;
        if (view) {
            view.pointermove(evt, localPoint.x, localPoint.y);
        } else {
            this.trigger('blank:pointermove', evt, localPoint.x, localPoint.y);
        }

        this.eventData(evt, data);
    },

    pointerup: function(evt) {

        this.undelegateDocumentEvents();

        const normalizedEvt = util.normalizeEvent(evt);

        const localPoint = this.snapToGrid({ x: normalizedEvt.clientX, y: normalizedEvt.clientY });

        const view = this.eventData(evt).sourceView;
        if (view) {
            view.pointerup(normalizedEvt, localPoint.x, localPoint.y);
        } else {
            this.trigger('blank:pointerup', normalizedEvt, localPoint.x, localPoint.y);
        }

        if (!normalizedEvt.isPropagationStopped()) {
            this.pointerclick($.Event(evt, { type: 'click', data: evt.data }));
        }

        evt.stopImmediatePropagation();
        this.delegateEvents();
    },

    mouseover: function(evt) {

        evt = util.normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        if (view) {
            view.mouseover(evt);

        } else {
            if (this.el === evt.target) return; // prevent border of paper from triggering this
            this.trigger('blank:mouseover', evt);
        }
    },

    mouseout: function(evt) {

        evt = util.normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        if (view) {
            view.mouseout(evt);

        } else {
            if (this.el === evt.target) return; // prevent border of paper from triggering this
            this.trigger('blank:mouseout', evt);
        }
    },

    mouseenter: function(evt) {

        evt = util.normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;
        const relatedView = this.findView(evt.relatedTarget);
        if (view) {
            // mouse moved from tool over view?
            if (relatedView === view) return;
            view.mouseenter(evt);
        } else {
            if (relatedView) return;
            // `paper` (more descriptive), not `blank`
            this.trigger('paper:mouseenter', evt);
        }
    },

    mouseleave: function(evt) {

        evt = util.normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;
        const relatedView = this.findView(evt.relatedTarget);
        if (view) {
            // mouse moved from view over tool?
            if (relatedView === view) return;
            view.mouseleave(evt);
        } else {
            if (relatedView) return;
            // `paper` (more descriptive), not `blank`
            this.trigger('paper:mouseleave', evt);
        }
    },

    mousewheel: function(evt) {

        evt = util.normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        const originalEvent = evt.originalEvent;
        const localPoint = this.snapToGrid({ x: originalEvent.clientX, y: originalEvent.clientY });
        const delta = Math.max(-1, Math.min(1, (originalEvent.wheelDelta || -originalEvent.detail)));

        if (view) {
            view.mousewheel(evt, localPoint.x, localPoint.y, delta);

        } else {
            this.trigger('blank:mousewheel', evt, localPoint.x, localPoint.y, delta);
        }
    },

    onevent: function(evt) {

        const eventNode = evt.currentTarget;
        const eventName = eventNode.getAttribute('event');
        if (eventName) {
            const view = this.findView(eventNode);
            if (view) {

                evt = util.normalizeEvent(evt);
                if (this.guard(evt, view)) return;

                const localPoint = this.snapToGrid({ x: evt.clientX, y: evt.clientY });
                view.onevent(evt, eventName, localPoint.x, localPoint.y);
            }
        }
    },

    magnetEvent: function(evt, handler) {

        const magnetNode = evt.currentTarget;
        const magnetValue = magnetNode.getAttribute('magnet');
        if (magnetValue) {
            const view = this.findView(magnetNode);
            if (view) {
                evt = util.normalizeEvent(evt);
                if (this.guard(evt, view)) return;
                const localPoint = this.snapToGrid(evt.clientX, evt.clientY);
                handler.call(this, view, evt, magnetNode, localPoint.x, localPoint.y);
            }
        }
    },

    onmagnet: function(evt) {

        this.magnetEvent(evt, function(view, evt, _, x, y) {
            view.onmagnet(evt, x, y);
        });
    },


    magnetpointerdblclick: function(evt) {

        this.magnetEvent(evt, function(view, evt, magnet, x, y) {
            view.magnetpointerdblclick(evt, magnet, x, y);
        });
    },

    magnetcontextmenu: function(evt) {

        if (this.options.preventContextMenu) evt.preventDefault();
        this.magnetEvent(evt, function(view, evt, magnet, x, y) {
            view.magnetcontextmenu(evt, magnet, x, y);
        });
    },

    onlabel: function(evt) {

        const labelNode = evt.currentTarget;
        const view = this.findView(labelNode);
        if (view) {

            evt = util.normalizeEvent(evt);
            if (this.guard(evt, view)) return;

            const localPoint = this.snapToGrid(evt.clientX, evt.clientY);
            view.onlabel(evt, localPoint.x, localPoint.y);
        }
    },

    delegateDragEvents: function(view, data) {

        data || (data = {});
        this.eventData({ data: data }, { sourceView: view || null, mousemoved: 0 });
        this.delegateDocumentEvents(null, data);
        this.undelegateEvents();
    },

    // Guard the specified event. If the event is not interesting, guard returns `true`.
    // Otherwise, it returns `false`.
    guard: function(evt, view) {

        if (evt.type === 'mousedown' && evt.button === 2) {
            // handled as `contextmenu` type
            return true;
        }

        if (this.options.guard && this.options.guard(evt, view)) {
            return true;
        }

        if (evt.data && evt.data.guarded !== undefined) {
            return evt.data.guarded;
        }

        if (view && view.model && (view.model instanceof Cell)) {
            return false;
        }

        if (this.svg === evt.target || this.el === evt.target || $.contains(this.svg, evt.target)) {
            return false;
        }

        return true;    // Event guarded. Paper should not react on it in any way.
    },

    setGridSize: function(gridSize) {

        this.options.gridSize = gridSize;

        if (this.options.drawGrid) {
            this.drawGrid();
        }

        return this;
    },

    clearGrid: function() {

        if (this.$grid) {
            this.$grid.css('backgroundImage', 'none');
        }
        return this;
    },

    _getGriRefs: function() {

        if (!this._gridCache) {

            this._gridCache = {
                root: V('svg', { width: '100%', height: '100%' }, V('defs')),
                patterns: {},
                add: function(id, vel) {
                    V(this.root.node.childNodes[0]).append(vel);
                    this.patterns[id] = vel;
                    this.root.append(V('rect', { width: '100%', height: '100%', fill: 'url(#' + id + ')' }));
                },
                get: function(id) {
                    return  this.patterns[id];
                },
                exist: function(id) {
                    return this.patterns[id] !== undefined;
                }
            };
        }

        return this._gridCache;
    },

    setGrid: function(drawGrid) {

        this.clearGrid();

        this._gridCache = null;
        this._gridSettings = [];

        const optionsList = Array.isArray(drawGrid) ? drawGrid : [drawGrid || {}];
        optionsList.forEach(function(item) {
            this._gridSettings.push.apply(this._gridSettings, this._resolveDrawGridOption(item));
        }, this);
        return this;
    },

    _resolveDrawGridOption: function(opt) {

        const namespace = this.constructor.gridPatterns;
        if (util.isString(opt) && Array.isArray(namespace[opt])) {
            return namespace[opt].map(function(item) {
                return util.assign({}, item);
            });
        }

        const options = opt || { args: [{}] };
        const isArray = Array.isArray(options);
        let name = options.name;

        if (!isArray && !name && !options.markup ) {
            name = 'dot';
        }

        if (name && Array.isArray(namespace[name])) {
            const pattern = namespace[name].map(function(item) {
                return util.assign({}, item);
            });

            const args = Array.isArray(options.args) ? options.args : [options.args || {}];

            util.defaults(args[0], util.omit(opt, 'args'));
            for (let i = 0; i < args.length; i++) {
                if (pattern[i]) {
                    util.assign(pattern[i], args[i]);
                }
            }
            return pattern;
        }

        return isArray ? options : [options];
    },

    drawGrid: function(opt) {

        const gridSize = this.options.gridSize;
        if (gridSize <= 1) {
            return this.clearGrid();
        }

        const localOptions = Array.isArray(opt) ? opt : [opt];

        const ctm = this.matrix();
        const refs = this._getGriRefs();

        this._gridSettings.forEach(function(gridLayerSetting, index) {

            const id = 'pattern_'  + index;
            const options = util.merge(gridLayerSetting, localOptions[index], {
                sx: ctm.a || 1,
                sy: ctm.d || 1,
                ox: ctm.e || 0,
                oy: ctm.f || 0
            });

            options.width = gridSize * (ctm.a || 1) * (options.scaleFactor || 1);
            options.height = gridSize * (ctm.d || 1) * (options.scaleFactor || 1);

            if (!refs.exist(id)) {
                refs.add(id, V('pattern', { id: id, patternUnits: 'userSpaceOnUse' }, V(options.markup)));
            }

            const patternDefVel = refs.get(id);

            if (util.isFunction(options.update)) {
                options.update(patternDefVel.node.childNodes[0], options);
            }

            let x = options.ox % options.width;
            if (x < 0) x += options.width;

            let y = options.oy % options.height;
            if (y < 0) y += options.height;

            patternDefVel.attr({
                x: x,
                y: y,
                width: options.width,
                height: options.height
            });
        });

        let patternUri = new XMLSerializer().serializeToString(refs.root.node);
        patternUri = 'url(data:image/svg+xml;base64,' + btoa(patternUri) + ')';

        this.$grid.css('backgroundImage', patternUri);

        return this;
    },

    updateBackgroundImage: function(opt) {

        opt = opt || {};

        let backgroundPosition = opt.position || 'center';
        let backgroundSize = opt.size || 'auto auto';

        const currentScale = this.scale();
        const currentTranslate = this.translate();

        // backgroundPosition
        if (util.isObject(backgroundPosition)) {
            const x = currentTranslate.tx + (currentScale.sx * (backgroundPosition.x || 0));
            const y = currentTranslate.ty + (currentScale.sy * (backgroundPosition.y || 0));
            backgroundPosition = x + 'px ' + y + 'px';
        }

        // backgroundSize
        if (util.isObject(backgroundSize)) {
            backgroundSize = new g.Rect(backgroundSize).scale(currentScale.sx, currentScale.sy);
            backgroundSize = backgroundSize.width + 'px ' + backgroundSize.height + 'px';
        }

        this.$background.css({
            backgroundSize: backgroundSize,
            backgroundPosition: backgroundPosition
        });
    },

    drawBackgroundImage: function(img, opt) {

        // Clear the background image if no image provided
        if (!(img instanceof HTMLImageElement)) {
            this.$background.css('backgroundImage', '');
            return;
        }

        opt = opt || {};

        let backgroundImage;
        const backgroundSize = opt.size;
        let backgroundRepeat = opt.repeat || 'no-repeat';
        const backgroundOpacity = opt.opacity || 1;
        const backgroundQuality = Math.abs(opt.quality) || 1;
        const backgroundPattern = this.constructor.backgroundPatterns[util.camelCase(backgroundRepeat)];

        if (util.isFunction(backgroundPattern)) {
            // 'flip-x', 'flip-y', 'flip-xy', 'watermark' and custom
            img.width *= backgroundQuality;
            img.height *= backgroundQuality;
            const canvas = backgroundPattern(img, opt);
            if (!(canvas instanceof HTMLCanvasElement)) {
                throw new Error('dia.Paper: background pattern must return an HTML Canvas instance');
            }

            backgroundImage = canvas.toDataURL('image/png');
            backgroundRepeat = 'repeat';
            if (util.isObject(backgroundSize)) {
                // recalculate the tile size if an object passed in
                backgroundSize.width *= canvas.width / img.width;
                backgroundSize.height *= canvas.height / img.height;
            } else if (backgroundSize === undefined) {
                // calcule the tile size if no provided
                opt.size = {
                    width: canvas.width / backgroundQuality,
                    height: canvas.height / backgroundQuality
                };
            }
        } else {
            // backgroundRepeat:
            // no-repeat', 'round', 'space', 'repeat', 'repeat-x', 'repeat-y'
            backgroundImage = img.src;
            if (backgroundSize === undefined) {
                // pass the image size for  the backgroundSize if no size provided
                opt.size = {
                    width: img.width,
                    height: img.height
                };
            }
        }

        this.$background.css({
            opacity: backgroundOpacity,
            backgroundRepeat: backgroundRepeat,
            backgroundImage: 'url(' + backgroundImage + ')'
        });

        this.updateBackgroundImage(opt);
    },

    updateBackgroundColor: function(color) {

        this.$el.css('backgroundColor', color || '');
    },

    drawBackground: function(opt) {

        opt = opt || {};

        this.updateBackgroundColor(opt.color);

        if (opt.image) {
            opt = this._background = util.cloneDeep(opt);
            const img = document.createElement('img');
            img.onload = this.drawBackgroundImage.bind(this, img, opt);
            img.src = opt.image;
        } else {
            this.drawBackgroundImage(null);
            this._background = null;
        }

        return this;
    },

    setInteractivity: function(value) {

        this.options.interactive = value;

        util.invoke(this._views, 'setInteractivity', value);
    },

    // Paper definitions.
    // ------------------

    isDefined: function(defId) {

        return !!this.svg.getElementById(defId);
    },

    defineFilter: function(filter) {

        if (!util.isObject(filter)) {
            throw new TypeError('dia.Paper: defineFilter() requires 1. argument to be an object.');
        }

        let filterId = filter.id;
        const name = filter.name;
        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        if (!filterId) {
            filterId = name + this.svg.id + util.hashCode(JSON.stringify(filter));
        }
        // If the filter already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        // If not, create one.
        if (!this.isDefined(filterId)) {

            const namespace = util.filter;
            const filterSVGString = namespace[name] && namespace[name](filter.args || {});
            if (!filterSVGString) {
                throw new Error('Non-existing filter ' + name);
            }

            // Set the filter area to be 3x the bounding box of the cell
            // and center the filter around the cell.
            const filterAttrs = util.assign({
                filterUnits: 'objectBoundingBox',
                x: -1,
                y: -1,
                width: 3,
                height: 3
            }, filter.attrs, {
                id: filterId
            });

            V(filterSVGString, filterAttrs).appendTo(this.defs);
        }

        return filterId;
    },

    defineGradient: function(gradient) {

        if (!util.isObject(gradient)) {
            throw new TypeError('dia.Paper: defineGradient() requires 1. argument to be an object.');
        }

        let gradientId = gradient.id;
        const type = gradient.type;
        const stops = gradient.stops;
        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        if (!gradientId) {
            gradientId = type + this.svg.id + util.hashCode(JSON.stringify(gradient));
        }
        // If the gradient already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        // If not, create one.
        if (!this.isDefined(gradientId)) {

            const stopTemplate = util.template('<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>');
            const gradientStopsStrings = util.toArray(stops).map(function(stop) {
                return stopTemplate({
                    offset: stop.offset,
                    color: stop.color,
                    opacity: Number.isFinite(stop.opacity) ? stop.opacity : 1
                });
            });

            const gradientSVGString = [
                '<' + type + '>',
                gradientStopsStrings.join(''),
                '</' + type + '>'
            ].join('');

            const gradientAttrs = util.assign({ id: gradientId }, gradient.attrs);

            V(gradientSVGString, gradientAttrs).appendTo(this.defs);
        }

        return gradientId;
    },

    defineMarker: function(marker) {

        if (!util.isObject(marker)) {
            throw new TypeError('dia.Paper: defineMarker() requires 1. argument to be an object.');
        }

        let markerId = marker.id;

        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        if (!markerId) {
            markerId = this.svg.id + util.hashCode(JSON.stringify(marker));
        }

        if (!this.isDefined(markerId)) {

            const attrs = util.omit(marker, 'type', 'userSpaceOnUse');
            const pathMarker = V('marker', {
                id: markerId,
                orient: 'auto',
                overflow: 'visible',
                markerUnits: marker.markerUnits || 'userSpaceOnUse'
            }, [
                V(marker.type || 'path', attrs)
            ]);

            pathMarker.appendTo(this.defs);
        }

        return markerId;
    }
}, {

    backgroundPatterns: {

        flipXy: function(img) {
            // d b
            // q p

            const canvas = document.createElement('canvas');
            const imgWidth = img.width;
            const imgHeight = img.height;

            canvas.width = 2 * imgWidth;
            canvas.height = 2 * imgHeight;

            const ctx = canvas.getContext('2d');
            // top-left image
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // xy-flipped bottom-right image
            ctx.setTransform(-1, 0, 0, -1, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // x-flipped top-right image
            ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // y-flipped bottom-left image
            ctx.setTransform(1, 0, 0, -1, 0, canvas.height);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            return canvas;
        },

        flipX: function(img) {
            // d b
            // d b

            const canvas = document.createElement('canvas');
            const imgWidth = img.width;
            const imgHeight = img.height;

            canvas.width = imgWidth * 2;
            canvas.height = imgHeight;

            const ctx = canvas.getContext('2d');
            // left image
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // flipped right image
            ctx.translate(2 * imgWidth, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            return canvas;
        },

        flipY: function(img) {
            // d d
            // q q

            const canvas = document.createElement('canvas');
            const imgWidth = img.width;
            const imgHeight = img.height;

            canvas.width = imgWidth;
            canvas.height = imgHeight * 2;

            const ctx = canvas.getContext('2d');
            // top image
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            // flipped bottom image
            ctx.translate(0, 2 * imgHeight);
            ctx.scale(1, -1);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            return canvas;
        },

        watermark: function(img, opt) {
            //   d
            // d

            opt = opt || {};

            const imgWidth = img.width;
            const imgHeight = img.height;

            const canvas = document.createElement('canvas');
            canvas.width = imgWidth * 3;
            canvas.height = imgHeight * 3;

            const ctx = canvas.getContext('2d');
            const angle = util.isNumber(opt.watermarkAngle) ? -opt.watermarkAngle : -20;
            const radians = g.toRad(angle);
            const stepX = canvas.width / 4;
            const stepY = canvas.height / 4;

            for (let i = 0; i < 4; i ++) {
                for (let j = 0; j < 4; j++) {
                    if ((i + j) % 2 > 0) {
                        // reset the current transformations
                        ctx.setTransform(1, 0, 0, 1, (2 * i - 1) * stepX, (2 * j - 1)  * stepY);
                        ctx.rotate(radians);
                        ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                    }
                }
            }

            return canvas;
        }
    },

    gridPatterns: {
        dot: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'rect',
            update: function(el, opt) {
                V(el).attr({
                    width: opt.thickness * opt.sx,
                    height: opt.thickness * opt.sy,
                    fill: opt.color
                });
            }
        }],
        fixedDot: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'rect',
            update: function(el, opt) {
                const size = opt.sx <= 1 ? opt.thickness * opt.sx : opt.thickness;
                V(el).attr({ width: size, height: size, fill: opt.color });
            }
        }],
        mesh: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'path',
            update: function(el, opt) {

                let d;
                const width = opt.width;
                const height = opt.height;
                const thickness = opt.thickness;

                if (width - thickness >= 0 && height - thickness >= 0) {
                    d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                } else {
                    d = 'M 0 0 0 0';
                }

                V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
            }
        }],
        doubleMesh: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'path',
            update: function(el, opt) {

                let d;
                const width = opt.width;
                const height = opt.height;
                const thickness = opt.thickness;

                if (width - thickness >= 0 && height - thickness >= 0) {
                    d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                } else {
                    d = 'M 0 0 0 0';
                }

                V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
            }
        }, {
            color: '#000000',
            thickness: 3,
            scaleFactor: 4,
            markup: 'path',
            update: function(el, opt) {

                let d;
                const width = opt.width;
                const height = opt.height;
                const thickness = opt.thickness;

                if (width - thickness >= 0 && height - thickness >= 0) {
                    d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                } else {
                    d = 'M 0 0 0 0';
                }

                V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
            }
        }]
    }
});
