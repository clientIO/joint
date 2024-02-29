import V from '../V/index.mjs';
import {
    isNumber,
    assign,
    nextFrame,
    isObject,
    cancelFrame,
    defaults,
    defaultsDeep,
    addClassNamePrefix,
    normalizeSides,
    isFunction,
    isPlainObject,
    getByPath,
    sortElements,
    isString,
    guid,
    normalizeEvent,
    normalizeWheel,
    cap,
    debounce,
    omit,
    result,
    camelCase,
    cloneDeep,
    invoke,
    hashCode,
    filter as _filter,
    parseDOMJSON,
    toArray,
    has
} from '../util/index.mjs';
import { ViewBase } from '../mvc/ViewBase.mjs';
import { Rect, Point, toRad } from '../g/index.mjs';
import { View, views } from '../mvc/index.mjs';
import { CellView } from './CellView.mjs';
import { ElementView } from './ElementView.mjs';
import { LinkView } from './LinkView.mjs';
import { Cell } from './Cell.mjs';
import { Graph } from './Graph.mjs';
import { LayersNames, PaperLayer } from './PaperLayer.mjs';
import * as highlighters from '../highlighters/index.mjs';
import * as linkAnchors from '../linkAnchors/index.mjs';
import * as connectionPoints from '../connectionPoints/index.mjs';
import * as anchors from '../anchors/index.mjs';

import $ from '../mvc/Dom/index.mjs';
import { GridLayer } from './layers/GridLayer.mjs';

const sortingTypes = {
    NONE: 'sorting-none',
    APPROX: 'sorting-approximate',
    EXACT: 'sorting-exact'
};

const WHEEL_CAP = 50;
const WHEEL_WAIT_MS = 20;
const MOUNT_BATCH_SIZE = 1000;
const UPDATE_BATCH_SIZE = Infinity;
const MIN_PRIORITY = 9007199254740991; // Number.MAX_SAFE_INTEGER

const HighlightingTypes = CellView.Highlighting;

const defaultHighlighting = {
    [HighlightingTypes.DEFAULT]: {
        name: 'stroke',
        options: {
            padding: 3
        }
    },
    [HighlightingTypes.MAGNET_AVAILABILITY]: {
        name: 'addClass',
        options: {
            className: 'available-magnet'
        }
    },
    [HighlightingTypes.ELEMENT_AVAILABILITY]: {
        name: 'addClass',
        options: {
            className: 'available-cell'
        }
    }
};

const defaultLayers = [{
    name: LayersNames.GRID,
}, {
    name: LayersNames.BACK,
}, {
    name: LayersNames.CELLS,
}, {
    name: LayersNames.LABELS,
}, {
    name: LayersNames.FRONT
}, {
    name: LayersNames.TOOLS
}];

export const Paper = View.extend({

    className: 'paper',

    options: {

        width: 800,
        height: 600,
        gridSize: 1,
        // Whether or not to draw the grid lines on the paper's DOM element.
        // e.g drawGrid: true, drawGrid: { color: 'red', thickness: 2 }
        drawGrid: false,
        // If not set, the size of the visual grid is the same as the `gridSize`.
        drawGridSize: null,

        // Whether or not to draw the background on the paper's DOM element.
        // e.g. background: { color: 'lightblue', image: '/paper-background.png', repeat: 'flip-xy' }
        background: false,

        elementView: ElementView,
        linkView: LinkView,
        snapLabels: false, // false, true
        snapLinks: false, // false, true, { radius: value }
        snapLinksSelf: false, // false, true, { radius: value }

        // Should the link labels be rendered into its own layer?
        // `false` - the labels are part of the links
        // `true` - the labels are appended to LayersName.LABELS
        // [LayersName] - the labels are appended to the layer specified
        labelsLayer: false,

        // When set to FALSE, an element may not have more than 1 link with the same source and target element.
        multiLinks: true,

        // For adding custom guard logic.
        guard: function(evt, view) {

            // FALSE means the event isn't guarded.
            return false;
        },

        highlighting: defaultHighlighting,

        // Prevent the default context menu from being displayed.
        preventContextMenu: true,

        // Prevent the default action for blank:pointer<action>.
        preventDefaultBlankAction: true,

        // Prevent the default action for cell:pointer<action>.
        preventDefaultViewAction: true,

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
        // Value could be the mvc.model or a function returning the mvc.model
        // defaultLink: (elementView, magnet) => {
        //   return condition ? new customLink1() : new customLink2()
        // }
        defaultLink: function() {
            // Do not create hard dependency on the joint.shapes.standard namespace (by importing the standard.Link model directly)
            const { cellNamespace } = this.model.get('cells');
            const ctor = getByPath(cellNamespace, ['standard', 'Link']);
            if (!ctor) throw new Error('dia.Paper: no default link model found. Use `options.defaultLink` to specify a default link model.');
            return new ctor();
        },

        // A connector that is used by links with no connector defined on the model.
        // e.g. { name: 'rounded', args: { radius: 5 }} or a function
        defaultConnector: { name: 'normal' },

        // A router that is used by links with no router defined on the model.
        // e.g. { name: 'oneSide', args: { padding: 10 }} or a function
        defaultRouter: { name: 'normal' },

        defaultAnchor: { name: 'center' },

        defaultLinkAnchor: { name: 'connectionRatio' },

        defaultConnectionPoint: { name: 'boundary' },

        /* CONNECTING */

        connectionStrategy: null,

        // Check whether to add a new link to the graph when user clicks on an a magnet.
        validateMagnet: function(_cellView, magnet, _evt) {
            return magnet.getAttribute('magnet') !== 'passive';
        },

        // Check whether to allow or disallow the link connection while an arrowhead end (source/target)
        // being changed.
        validateConnection: function(cellViewS, _magnetS, cellViewT, _magnetT, end, _linkView) {
            return (end === 'target' ? cellViewT : cellViewS) instanceof ElementView;
        },

        /* EMBEDDING */

        // Enables embedding. Re-parent the dragged element with elements under it and makes sure that
        // all links and elements are visible taken the level of embedding into account.
        embeddingMode: false,

        // Check whether to allow or disallow the element embedding while an element being translated.
        validateEmbedding: function(childView, parentView) {
            // by default all elements can be in relation child-parent
            return true;
        },

        // Check whether to allow or disallow an embedded element to be unembedded / to become a root.
        validateUnembedding: function(childView) {
            // by default all elements can become roots
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

        // Number of required mousemove events before a link is created out of the magnet.
        // Or string `onleave` so the link is created when the pointer leaves the magnet
        magnetThreshold: 0,

        // Rendering Options

        sorting: sortingTypes.APPROX,

        frozen: false,

        autoFreeze: false,

        // no docs yet
        onViewUpdate: function(view, flag, priority, opt, paper) {
            // Do not update connected links when:
            // 1. the view was just inserted (added to the graph and rendered)
            // 2. the view was just mounted (added back to the paper by viewport function)
            // 3. the change was marked as `isolate`.
            // 4. the view model was just removed from the graph
            if ((flag & (view.FLAG_INSERT | view.FLAG_REMOVE)) || opt.mounting || opt.isolate) return;
            paper.requestConnectedLinksUpdate(view, priority, opt);
        },

        // no docs yet
        onViewPostponed: function(view, flag, paper) {
            return paper.forcePostponedViewUpdate(view, flag);
        },

        beforeRender: null, // function(opt, paper) { },

        afterRender: null, // function(stats, opt, paper) {

        viewport: null,

        // Default namespaces

        cellViewNamespace: null,

        routerNamespace: null,

        connectorNamespace: null,

        highlighterNamespace: highlighters,

        anchorNamespace: anchors,

        linkAnchorNamespace: linkAnchors,

        connectionPointNamespace: connectionPoints,

        overflow: false
    },

    events: {
        'dblclick': 'pointerdblclick',
        'dbltap': 'pointerdblclick',
        'contextmenu': 'contextmenu',
        'mousedown': 'pointerdown',
        'touchstart': 'pointerdown',
        'mouseover': 'mouseover',
        'mouseout': 'mouseout',
        'mouseenter': 'mouseenter',
        'mouseleave': 'mouseleave',
        'wheel': 'mousewheel',
        'mouseenter .joint-cell': 'mouseenter',
        'mouseleave .joint-cell': 'mouseleave',
        'mouseenter .joint-tools': 'mouseenter',
        'mouseleave .joint-tools': 'mouseleave',
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

    /* CSS within the SVG document
    * 1. Adding vector-effect: non-scaling-stroke; to prevent the stroke width from scaling for
    *    elements that use the `scalable` group.
    */
    stylesheet: /*css*/`
        .joint-element .scalable * {
            vector-effect: non-scaling-stroke;
        }
    `,

    svg: null,
    viewport: null,
    defs: null,
    tools: null,
    layers: null,

    // For storing the current transformation matrix (CTM) of the paper's viewport.
    _viewportMatrix: null,
    // For verifying whether the CTM is up-to-date. The viewport transform attribute
    // could have been manipulated directly.
    _viewportTransformString: null,
    // Updates data (priorities, unmounted views etc.)
    _updates: null,
    // Paper Layers
    _layers: null,

    SORT_DELAYING_BATCHES: ['add', 'to-front', 'to-back'],
    UPDATE_DELAYING_BATCHES: ['translate'],
    // If you interact with these elements,
    // the default interaction such as `element move` is prevented.
    FORM_CONTROL_TAG_NAMES: ['TEXTAREA', 'INPUT', 'BUTTON', 'SELECT', 'OPTION'] ,
    // If you interact with these elements, the events are not propagated to the paper
    // i.e. paper events such as `element:pointerdown` are not triggered.
    GUARDED_TAG_NAMES: [
        // Guard <select> for consistency. When you click on it:
        // Chrome: triggers `pointerdown`, `pointerup`, `pointerclick` to open
        // Firefox: triggers `pointerdown` on open, `pointerup` (and `pointerclick` only if you haven't moved).
        //          on close. However, if you open and then close by clicking elsewhere on the page,
        //           no other event is triggered.
        // Safari: when you open it, it triggers `pointerdown`. That's it.
        'SELECT',
    ],
    MIN_SCALE: 1e-6,

    init: function() {

        const { options } = this;
        if (!options.cellViewNamespace) {
            /* eslint-disable no-undef */
            options.cellViewNamespace = typeof joint !== 'undefined' && has(joint, 'shapes') ? joint.shapes : null;
            /* eslint-enable no-undef */
        }

        const model = this.model = options.model || new Graph;

        // Layers (SVGGroups)
        this._layers = {};

        this.cloneOptions();
        this.render();
        this._setDimensions();
        this.startListening();

        // Hash of all cell views.
        this._views = {};

        // Mouse wheel events buffer
        this._mw_evt_buffer = {
            event: null,
            deltas: [],
        };

        // Render existing cells in the graph
        this.resetViews(model.attributes.cells.models);
        // Start the Rendering Loop
        if (!this.isFrozen() && this.isAsync()) this.updateViewsAsync();
    },

    _resetUpdates: function() {
        if (this._updates && this._updates.id) cancelFrame(this._updates.id);

        return this._updates = {
            id: null,
            priorities: [{}, {}, {}],
            unmountedCids: [],
            mountedCids: [],
            unmounted: {},
            mounted: {},
            count: 0,
            keyFrozen: false,
            freezeKey: null,
            sort: false,
            disabled: false,
            idle: false
        };
    },

    startListening: function() {
        var model = this.model;
        this.listenTo(model, 'add', this.onCellAdded)
            .listenTo(model, 'remove', this.onCellRemoved)
            .listenTo(model, 'change', this.onCellChange)
            .listenTo(model, 'reset', this.onGraphReset)
            .listenTo(model, 'sort', this.onGraphSort)
            .listenTo(model, 'batch:stop', this.onGraphBatchStop);
        this.on('cell:highlight', this.onCellHighlight)
            .on('cell:unhighlight', this.onCellUnhighlight)
            .on('transform', this.update);
    },

    onCellAdded: function(cell, _, opt) {
        var position = opt.position;
        if (this.isAsync() || !isNumber(position)) {
            this.renderView(cell, opt);
        } else {
            if (opt.maxPosition === position) this.freeze({ key: 'addCells' });
            this.renderView(cell, opt);
            if (position === 0) this.unfreeze({ key: 'addCells' });
        }
    },

    onCellRemoved: function(cell, _, opt) {
        const view = this.findViewByModel(cell);
        if (view) this.requestViewUpdate(view, view.FLAG_REMOVE, view.UPDATE_PRIORITY, opt);
    },

    onCellChange: function(cell, opt) {
        if (cell === this.model.attributes.cells) return;
        if (cell.hasChanged('z') && this.options.sorting === sortingTypes.APPROX) {
            const view = this.findViewByModel(cell);
            if (view) this.requestViewUpdate(view, view.FLAG_INSERT, view.UPDATE_PRIORITY, opt);
        }
    },

    onGraphReset: function(collection, opt) {
        this.resetLayers();
        this.resetViews(collection.models, opt);
    },

    onGraphSort: function() {
        if (this.model.hasActiveBatch(this.SORT_DELAYING_BATCHES)) return;
        this.sortViews();
    },

    onGraphBatchStop: function(data) {
        if (this.isFrozen()) return;
        var name = data && data.batchName;
        var graph = this.model;
        if (!this.isAsync()) {
            var updateDelayingBatches = this.UPDATE_DELAYING_BATCHES;
            if (updateDelayingBatches.includes(name) && !graph.hasActiveBatch(updateDelayingBatches)) {
                this.updateViews(data);
            }
        }
        var sortDelayingBatches = this.SORT_DELAYING_BATCHES;
        if (sortDelayingBatches.includes(name) && !graph.hasActiveBatch(sortDelayingBatches)) {
            this.sortViews();
        }
    },

    cloneOptions: function() {

        const { options } = this;
        const {
            defaultConnector,
            defaultRouter,
            defaultConnectionPoint,
            defaultAnchor,
            defaultLinkAnchor,
            highlighting,
            cellViewNamespace,
            interactive
        } = options;

        // Default cellView namespace for ES5
        /* eslint-disable no-undef */
        if (!cellViewNamespace && typeof joint !== 'undefined' && has(joint, 'shapes')) {
            options.cellViewNamespace = joint.shapes;
        }
        /* eslint-enable no-undef */

        // Here if a function was provided, we can not clone it, as this would result in loosing the function.
        // If the default is used, the cloning is necessary in order to prevent modifying the options on prototype.
        if (!isFunction(defaultConnector)) {
            options.defaultConnector = cloneDeep(defaultConnector);
        }
        if (!isFunction(defaultRouter)) {
            options.defaultRouter = cloneDeep(defaultRouter);
        }
        if (!isFunction(defaultConnectionPoint)) {
            options.defaultConnectionPoint = cloneDeep(defaultConnectionPoint);
        }
        if (!isFunction(defaultAnchor)) {
            options.defaultAnchor = cloneDeep(defaultAnchor);
        }
        if (!isFunction(defaultLinkAnchor)) {
            options.defaultLinkAnchor = cloneDeep(defaultLinkAnchor);
        }
        if (isPlainObject(interactive)) {
            options.interactive = assign({}, interactive);
        }
        if (isPlainObject(highlighting)) {
            // Return the default highlighting options into the user specified options.
            options.highlighting = defaultsDeep({}, highlighting, defaultHighlighting);
        }
    },

    children: function() {
        var ns = V.namespace;
        return [{
            namespaceURI: ns.xhtml,
            tagName: 'div',
            className: addClassNamePrefix('paper-background'),
            selector: 'background',
            style: {
                position: 'absolute',
                inset: 0
            }
        }, {
            namespaceURI: ns.svg,
            tagName: 'svg',
            attributes: {
                'width': '100%',
                'height': '100%',
                'xmlns:xlink': ns.xlink
            },
            selector: 'svg',
            style: {
                position: 'absolute',
                inset: 0
            },
            children: [{
                // Append `<defs>` element to the SVG document. This is useful for filters and gradients.
                // It's desired to have the defs defined before the viewport (e.g. to make a PDF document pick up defs properly).
                tagName: 'defs',
                selector: 'defs'
            }, {
                tagName: 'g',
                className: addClassNamePrefix('layers'),
                selector: 'layers'
            }]
        }];
    },

    hasLayerView(layerName) {
        return  (layerName in this._layers);
    },

    getLayerView(layerName) {
        const { _layers } = this;
        if (layerName in _layers) return _layers[layerName];
        throw new Error(`dia.Paper: Unknown layer "${layerName}"`);
    },

    getLayerNode(layerName) {
        return this.getLayerView(layerName).el;
    },

    render: function() {

        this.renderChildren();
        const { el, childNodes, options, stylesheet } = this;
        const { svg, defs, layers } = childNodes;

        el.style.position = 'relative';
        svg.style.overflow = options.overflow ? 'visible' : 'hidden';

        this.svg = svg;
        this.defs = defs;
        this.layers = layers;

        this.renderLayers();

        V.ensureId(svg);

        this.addStylesheet(stylesheet);

        if (options.background) {
            this.drawBackground(options.background);
        }

        if (options.drawGrid) {
            this.setGrid(options.drawGrid);
        }

        return this;
    },

    addStylesheet: function(css) {
        if (!css) return;
        V(this.svg).prepend(V.createSVGStyle(css));
    },

    createLayer(name) {
        switch (name) {
            case LayersNames.GRID:
                return new GridLayer({ name, paper: this, patterns: this.constructor.gridPatterns });
            default:
                return new PaperLayer({ name });
        }
    },

    renderLayers: function(layers = defaultLayers) {
        this.removeLayers();
        // TODO: Layers to be read from the graph `layers` attribute
        layers.forEach(({ name, sorted }) => {
            const layerView = this.createLayer(name);
            this.layers.appendChild(layerView.el);
            this._layers[name] = layerView;
        });
        // Throws an exception if doesn't exist
        const cellsLayerView = this.getLayerView(LayersNames.CELLS);
        const toolsLayerView = this.getLayerView(LayersNames.TOOLS);
        const labelsLayerView = this.getLayerView(LayersNames.LABELS);
        // backwards compatibility
        this.tools = toolsLayerView.el;
        this.cells = this.viewport = cellsLayerView.el;
        // user-select: none;
        cellsLayerView.vel.addClass(addClassNamePrefix('viewport'));
        labelsLayerView.vel.addClass(addClassNamePrefix('viewport'));
        cellsLayerView.el.style.webkitUserSelect = 'none';
        cellsLayerView.el.style.userSelect = 'none';
        labelsLayerView.el.style.webkitUserSelect = 'none';
        labelsLayerView.el.style.userSelect = 'none';
    },

    removeLayers: function() {
        const { _layers } = this;
        Object.keys(_layers).forEach(name => {
            _layers[name].remove();
            delete _layers[name];
        });
    },

    resetLayers: function() {
        const { _layers } = this;
        Object.keys(_layers).forEach(name => {
            _layers[name].removePivots();
        });
    },

    update: function() {

        if (this._background) {
            this.updateBackgroundImage(this._background);
        }

        return this;
    },

    scale: function(sx, sy, data) {
        const ctm = this.matrix();
        // getter
        if (sx === undefined) {
            return V.matrixToScale(ctm);
        }
        // setter
        if (sy === undefined) {
            sy = sx;
        }
        sx = Math.max(sx || 0, this.MIN_SCALE);
        sy = Math.max(sy || 0, this.MIN_SCALE);
        ctm.a = sx;
        ctm.d = sy;
        this.matrix(ctm, data);
        return this;
    },

    scaleUniformAtPoint: function(scale, point, data) {
        const { a: sx, d: sy, e: tx, f: ty } = this.matrix();
        scale = Math.max(scale || 0, this.MIN_SCALE);
        if (scale === sx && scale === sy) {
            // The scale is the same as the current one.
            return this;
        }
        const matrix = V.createSVGMatrix()
            .translate(
                tx - point.x * (scale - sx),
                ty - point.y * (scale - sy)
            )
            .scale(scale, scale);
        this.matrix(matrix, data);
        return this;
    },

    translate: function(tx, ty, data) {
        const ctm = this.matrix();
        // getter
        if (tx === undefined) {
            return V.matrixToTranslate(ctm);
        }
        // setter
        tx || (tx = 0);
        ty || (ty = 0);
        if (ctm.e === tx && ctm.f === ty) return this;
        ctm.e = tx;
        ctm.f = ty;
        this.matrix(ctm, data);
        return this;
    },

    matrix: function(ctm, data = {}) {

        var viewport = this.layers;

        // Getter:
        if (ctm === undefined) {

            var transformString = viewport.getAttribute('transform');

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
        const prev = this.matrix();
        const current = V.createSVGMatrix(ctm);
        const currentTransformString = this._viewportTransformString;
        const ctmString = V.matrixToTransformString(current);
        if (ctmString === currentTransformString) {
            // The new transform string is the same as the current one.
            // No need to update the transform attribute.
            return this;
        }
        if (!currentTransformString && V.matrixToTransformString() === ctmString) {
            // The current transform string is empty and the new one is an identity matrix.
            // No need to update the transform attribute.
            return this;
        }

        const { a, d, e, f } = current;

        viewport.setAttribute('transform', ctmString);
        this._viewportMatrix = current;
        this._viewportTransformString = viewport.getAttribute('transform');

        // scale event
        if (a !== prev.a || d !== prev.d) {
            this.trigger('scale', a, d, data);
        }

        // translate event
        if (e !== prev.e || f !== prev.f) {
            this.trigger('translate', e, f, data);
        }

        this.trigger('transform', current, data);
        return this;
    },

    clientMatrix: function() {

        return V.createSVGMatrix(this.cells.getScreenCTM());
    },

    requestConnectedLinksUpdate: function(view, priority, opt) {
        if (view instanceof CellView) {
            var model = view.model;
            var links = this.model.getConnectedLinks(model);
            for (var j = 0, n = links.length; j < n; j++) {
                var link = links[j];
                var linkView = this.findViewByModel(link);
                if (!linkView) continue;
                var flagLabels = ['UPDATE'];
                if (link.getTargetCell() === model) flagLabels.push('TARGET');
                if (link.getSourceCell() === model) flagLabels.push('SOURCE');
                var nextPriority = Math.max(priority + 1, linkView.UPDATE_PRIORITY);
                this.scheduleViewUpdate(linkView, linkView.getFlag(flagLabels), nextPriority, opt);
            }
        }
    },

    forcePostponedViewUpdate: function(view, flag) {
        if (!view || !(view instanceof CellView)) return false;
        var model = view.model;
        if (model.isElement()) return false;
        if ((flag & view.getFlag(['SOURCE', 'TARGET'])) === 0) {
            var dumpOptions = { silent: true };
            // LinkView is waiting for the target or the source cellView to be rendered
            // This can happen when the cells are not in the viewport.
            var sourceFlag = 0;
            var sourceView = this.findViewByModel(model.getSourceCell());
            if (sourceView && !this.isViewMounted(sourceView)) {
                sourceFlag = this.dumpView(sourceView, dumpOptions);
                view.updateEndMagnet('source');
            }
            var targetFlag = 0;
            var targetView = this.findViewByModel(model.getTargetCell());
            if (targetView && !this.isViewMounted(targetView)) {
                targetFlag = this.dumpView(targetView, dumpOptions);
                view.updateEndMagnet('target');
            }
            if (sourceFlag === 0 && targetFlag === 0) {
                // If leftover flag is 0, all view updates were done.
                return !this.dumpView(view, dumpOptions);
            }
        }
        return false;
    },

    requestViewUpdate: function(view, flag, priority, opt) {
        opt || (opt = {});
        this.scheduleViewUpdate(view, flag, priority, opt);
        var isAsync = this.isAsync();
        if (this.isFrozen() || (isAsync && opt.async !== false)) return;
        if (this.model.hasActiveBatch(this.UPDATE_DELAYING_BATCHES)) return;
        var stats = this.updateViews(opt);
        if (isAsync) this.notifyAfterRender(stats, opt);
    },

    scheduleViewUpdate: function(view, type, priority, opt) {
        const { _updates: updates, options } = this;
        if (updates.idle) {
            if (options.autoFreeze) {
                updates.idle = false;
                this.unfreeze();
            }
        }
        const { FLAG_REMOVE, FLAG_INSERT, UPDATE_PRIORITY, cid } = view;
        let priorityUpdates = updates.priorities[priority];
        if (!priorityUpdates) priorityUpdates = updates.priorities[priority] = {};
        // Move higher priority updates to this priority
        if (priority > UPDATE_PRIORITY) {
            // Not the default priority for this view. It's most likely a link view
            // connected to another link view, which triggered the update.
            // TODO: If there is an update scheduled with a lower priority already, we should
            // change the requested priority to the lowest one. Does not seem to be critical
            // right now, as it "only" results in multiple updates on the same view.
            for (let i = priority - 1; i >= UPDATE_PRIORITY; i--) {
                const prevPriorityUpdates = updates.priorities[i];
                if (!prevPriorityUpdates || !(cid in prevPriorityUpdates)) continue;
                priorityUpdates[cid] |= prevPriorityUpdates[cid];
                delete prevPriorityUpdates[cid];
            }
        }
        let currentType = priorityUpdates[cid] || 0;
        // Prevent cycling
        if ((currentType & type) === type) return;
        if (!currentType) updates.count++;
        if (type & FLAG_REMOVE && currentType & FLAG_INSERT) {
            // When a view is removed we need to remove the insert flag as this is a reinsert
            priorityUpdates[cid] ^= FLAG_INSERT;
        } else if (type & FLAG_INSERT && currentType & FLAG_REMOVE) {
            // When a view is added we need to remove the remove flag as this is view was previously removed
            priorityUpdates[cid] ^= FLAG_REMOVE;
        }
        priorityUpdates[cid] |= type;
        const viewUpdateFn = options.onViewUpdate;
        if (typeof viewUpdateFn === 'function') viewUpdateFn.call(this, view, type, priority, opt || {}, this);
    },

    dumpViewUpdate: function(view) {
        if (!view) return 0;
        var updates = this._updates;
        var cid = view.cid;
        var priorityUpdates = updates.priorities[view.UPDATE_PRIORITY];
        var flag = this.registerMountedView(view) | priorityUpdates[cid];
        delete priorityUpdates[cid];
        return flag;
    },

    dumpView: function(view, opt = {}) {
        const flag = this.dumpViewUpdate(view);
        if (!flag) return 0;
        const shouldNotify = !opt.silent;
        if (shouldNotify) this.notifyBeforeRender(opt);
        const leftover = this.updateView(view, flag, opt);
        if (shouldNotify) {
            const stats = { updated: 1, priority: view.UPDATE_PRIORITY };
            this.notifyAfterRender(stats, opt);
        }
        return leftover;
    },

    updateView: function(view, flag, opt) {
        if (!view) return 0;
        const { FLAG_REMOVE, FLAG_INSERT, FLAG_INIT, model } = view;
        if (view instanceof CellView) {
            if (flag & FLAG_REMOVE) {
                this.removeView(model);
                return 0;
            }
            if (flag & FLAG_INSERT) {
                const isInitialInsert = !!(flag & FLAG_INIT);
                if (isInitialInsert) {
                    flag ^= FLAG_INIT;
                }
                this.insertView(view, isInitialInsert);
                flag ^= FLAG_INSERT;
            }
        }
        if (!flag) return 0;
        return view.confirmUpdate(flag, opt || {});
    },

    requireView: function(model, opt) {
        var view = this.findViewByModel(model);
        if (!view) return null;
        this.dumpView(view, opt);
        return view;
    },

    registerUnmountedView: function(view) {
        var cid = view.cid;
        var updates = this._updates;
        if (cid in updates.unmounted) return 0;
        var flag = updates.unmounted[cid] |= view.FLAG_INSERT;
        updates.unmountedCids.push(cid);
        delete updates.mounted[cid];
        return flag;
    },

    registerMountedView: function(view) {
        var cid = view.cid;
        var updates = this._updates;
        if (cid in updates.mounted) return 0;
        updates.mounted[cid] = true;
        updates.mountedCids.push(cid);
        var flag = updates.unmounted[cid] || 0;
        delete updates.unmounted[cid];
        return flag;
    },

    isViewMounted: function(view) {
        if (!view) return false;
        var cid = view.cid;
        var updates = this._updates;
        return (cid in updates.mounted);
    },

    dumpViews: function(opt) {
        var passingOpt = defaults({}, opt, { viewport: null });
        this.checkViewport(passingOpt);
        this.updateViews(passingOpt);
    },

    // Synchronous views update
    updateViews: function(opt) {
        this.notifyBeforeRender(opt);
        let batchStats;
        let updateCount = 0;
        let batchCount = 0;
        let priority = MIN_PRIORITY;
        do {
            batchCount++;
            batchStats = this.updateViewsBatch(opt);
            updateCount += batchStats.updated;
            priority = Math.min(batchStats.priority, priority);
        } while (!batchStats.empty);
        const stats = { updated: updateCount, batches: batchCount, priority };
        this.notifyAfterRender(stats, opt);
        return stats;
    },

    hasScheduledUpdates: function() {
        const priorities = this._updates.priorities;
        const priorityIndexes = Object.keys(priorities); // convert priorities to a dense array
        let i = priorityIndexes.length;
        while (i > 0 && i--) {
            // a faster way how to check if an object is empty
            for (let _key in priorities[priorityIndexes[i]]) return true;
        }
        return false;
    },

    updateViewsAsync: function(opt, data) {
        opt || (opt = {});
        data || (data = { processed: 0, priority: MIN_PRIORITY });
        const { _updates: updates, options } = this;
        const id = updates.id;
        if (id) {
            cancelFrame(id);
            if (data.processed === 0 && this.hasScheduledUpdates()) {
                this.notifyBeforeRender(opt);
            }
            const stats = this.updateViewsBatch(opt);
            const passingOpt = defaults({}, opt, {
                mountBatchSize: MOUNT_BATCH_SIZE - stats.mounted,
                unmountBatchSize: MOUNT_BATCH_SIZE - stats.unmounted
            });
            const checkStats = this.checkViewport(passingOpt);
            const unmountCount = checkStats.unmounted;
            const mountCount = checkStats.mounted;
            let processed = data.processed;
            const total = updates.count;
            if (stats.updated > 0) {
                // Some updates have been just processed
                processed += stats.updated + stats.unmounted;
                stats.processed = processed;
                data.priority = Math.min(stats.priority, data.priority);
                if (stats.empty && mountCount === 0) {
                    stats.unmounted += unmountCount;
                    stats.mounted += mountCount;
                    stats.priority = data.priority;
                    this.notifyAfterRender(stats, opt);
                    data.processed = 0;
                    data.priority = MIN_PRIORITY;
                    updates.count = 0;
                } else {
                    data.processed = processed;
                }
            } else {
                if (!updates.idle) {
                    if (options.autoFreeze) {
                        this.freeze();
                        updates.idle = true;
                        this.trigger('render:idle', opt);
                    }
                }
            }
            // Progress callback
            const progressFn = opt.progress;
            if (total && typeof progressFn === 'function') {
                progressFn.call(this, stats.empty, processed, total, stats, this);
            }
            // The current frame could have been canceled in a callback
            if (updates.id !== id) return;
        }
        if (updates.disabled) {
            throw new Error('dia.Paper: can not unfreeze the paper after it was removed');
        }
        updates.id = nextFrame(this.updateViewsAsync, this, opt, data);
    },

    notifyBeforeRender: function(opt = {}) {
        let beforeFn = opt.beforeRender;
        if (typeof beforeFn !== 'function') {
            beforeFn = this.options.beforeRender;
            if (typeof beforeFn !== 'function') return;
        }
        beforeFn.call(this, opt, this);
    },

    notifyAfterRender: function(stats, opt = {}) {
        let afterFn = opt.afterRender;
        if (typeof afterFn !== 'function') {
            afterFn = this.options.afterRender;
        }
        if (typeof afterFn === 'function') {
            afterFn.call(this, stats, opt, this);
        }
        this.trigger('render:done', stats, opt);
    },

    updateViewsBatch: function(opt) {
        opt || (opt = {});
        var batchSize = opt.batchSize || UPDATE_BATCH_SIZE;
        var updates = this._updates;
        var updateCount = 0;
        var postponeCount = 0;
        var unmountCount = 0;
        var mountCount = 0;
        var maxPriority = MIN_PRIORITY;
        var empty = true;
        var options = this.options;
        var priorities = updates.priorities;
        var viewportFn = 'viewport' in opt ? opt.viewport : options.viewport;
        if (typeof viewportFn !== 'function') viewportFn = null;
        var postponeViewFn = options.onViewPostponed;
        if (typeof postponeViewFn !== 'function') postponeViewFn = null;
        var priorityIndexes = Object.keys(priorities); // convert priorities to a dense array
        main: for (var i = 0, n = priorityIndexes.length; i < n; i++) {
            var priority = +priorityIndexes[i];
            var priorityUpdates = priorities[priority];
            for (var cid in priorityUpdates) {
                if (updateCount >= batchSize) {
                    empty = false;
                    break main;
                }
                var view = views[cid];
                if (!view) {
                    // This should not occur
                    delete priorityUpdates[cid];
                    continue;
                }
                var currentFlag = priorityUpdates[cid];
                if ((currentFlag & view.FLAG_REMOVE) === 0) {
                    // We should never check a view for viewport if we are about to remove the view
                    var isDetached = cid in updates.unmounted;
                    if (view.DETACHABLE && viewportFn && !viewportFn.call(this, view, !isDetached, this)) {
                        // Unmount View
                        if (!isDetached) {
                            this.registerUnmountedView(view);
                            this.detachView(view);
                        }
                        updates.unmounted[cid] |= currentFlag;
                        delete priorityUpdates[cid];
                        unmountCount++;
                        continue;
                    }
                    // Mount View
                    if (isDetached) {
                        currentFlag |= view.FLAG_INSERT;
                        mountCount++;
                    }
                    currentFlag |= this.registerMountedView(view);
                }
                var leftoverFlag = this.updateView(view, currentFlag, opt);
                if (leftoverFlag > 0) {
                    // View update has not finished completely
                    priorityUpdates[cid] = leftoverFlag;
                    if (!postponeViewFn || !postponeViewFn.call(this, view, leftoverFlag, this) || priorityUpdates[cid]) {
                        postponeCount++;
                        empty = false;
                        continue;
                    }
                }
                if (maxPriority > priority) maxPriority = priority;
                updateCount++;
                delete priorityUpdates[cid];
            }
        }
        return {
            priority: maxPriority,
            updated: updateCount,
            postponed: postponeCount,
            unmounted: unmountCount,
            mounted: mountCount,
            empty: empty
        };
    },

    getUnmountedViews: function() {
        const updates = this._updates;
        const unmountedCids = Object.keys(updates.unmounted);
        const n = unmountedCids.length;
        const unmountedViews = new Array(n);
        for (var i = 0; i < n; i++) {
            unmountedViews[i] = views[unmountedCids[i]];
        }
        return unmountedViews;
    },

    getMountedViews: function() {
        const updates = this._updates;
        const mountedCids = Object.keys(updates.mounted);
        const n = mountedCids.length;
        const mountedViews = new Array(n);
        for (var i = 0; i < n; i++) {
            mountedViews[i] = views[mountedCids[i]];
        }
        return mountedViews;
    },

    checkUnmountedViews: function(viewportFn, opt) {
        opt || (opt  = {});
        var mountCount = 0;
        if (typeof viewportFn !== 'function') viewportFn = null;
        var batchSize = 'mountBatchSize' in opt ? opt.mountBatchSize : Infinity;
        var updates = this._updates;
        var unmountedCids = updates.unmountedCids;
        var unmounted = updates.unmounted;
        for (var i = 0, n = Math.min(unmountedCids.length, batchSize); i < n; i++) {
            var cid = unmountedCids[i];
            if (!(cid in unmounted)) continue;
            var view = views[cid];
            if (!view) continue;
            if (view.DETACHABLE && viewportFn && !viewportFn.call(this, view, false, this)) {
                // Push at the end of all unmounted ids, so this can be check later again
                unmountedCids.push(cid);
                continue;
            }
            mountCount++;
            var flag = this.registerMountedView(view);
            if (flag) this.scheduleViewUpdate(view, flag, view.UPDATE_PRIORITY, { mounting: true });
        }
        // Get rid of views, that have been mounted
        unmountedCids.splice(0, i);
        return mountCount;
    },

    checkMountedViews: function(viewportFn, opt) {
        opt || (opt = {});
        var unmountCount = 0;
        if (typeof viewportFn !== 'function') return unmountCount;
        var batchSize = 'unmountBatchSize' in opt ? opt.unmountBatchSize : Infinity;
        var updates = this._updates;
        var mountedCids = updates.mountedCids;
        var mounted = updates.mounted;
        for (var i = 0, n = Math.min(mountedCids.length, batchSize); i < n; i++) {
            var cid = mountedCids[i];
            if (!(cid in mounted)) continue;
            var view = views[cid];
            if (!view) continue;
            if (!view.DETACHABLE || viewportFn.call(this, view, true, this)) {
                // Push at the end of all mounted ids, so this can be check later again
                mountedCids.push(cid);
                continue;
            }
            unmountCount++;
            var flag = this.registerUnmountedView(view);
            if (flag) this.detachView(view);
        }
        // Get rid of views, that have been unmounted
        mountedCids.splice(0, i);
        return unmountCount;
    },

    checkViewVisibility: function(cellView, opt = {}) {
        let viewportFn = 'viewport' in opt ? opt.viewport : this.options.viewport;
        if (typeof viewportFn !== 'function') viewportFn = null;
        const updates = this._updates;
        const { mounted, unmounted } = updates;
        const visible = !cellView.DETACHABLE || !viewportFn || viewportFn.call(this, cellView, false, this);

        let isUnmounted = false;
        let isMounted = false;

        if (cellView.cid in mounted && !visible) {
            const flag = this.registerUnmountedView(cellView);
            if (flag) this.detachView(cellView);
            const i = updates.mountedCids.indexOf(cellView.cid);
            updates.mountedCids.splice(i, 1);
            isUnmounted = true;
        }

        if (!isUnmounted && cellView.cid in unmounted && visible) {
            const i = updates.unmountedCids.indexOf(cellView.cid);
            updates.unmountedCids.splice(i, 1);
            var flag = this.registerMountedView(cellView);
            if (flag) this.scheduleViewUpdate(cellView, flag, cellView.UPDATE_PRIORITY, { mounting: true });
            isMounted = true;
        }

        return {
            mounted: isMounted ? 1 : 0,
            unmounted: isUnmounted ? 1 : 0
        };
    },

    checkViewport: function(opt) {
        var passingOpt = defaults({}, opt, {
            mountBatchSize: Infinity,
            unmountBatchSize: Infinity
        });
        var viewportFn = 'viewport' in passingOpt ? passingOpt.viewport : this.options.viewport;
        var unmountedCount = this.checkMountedViews(viewportFn, passingOpt);
        if (unmountedCount > 0) {
            // Do not check views, that have been just unmounted and pushed at the end of the cids array
            var unmountedCids = this._updates.unmountedCids;
            passingOpt.mountBatchSize = Math.min(unmountedCids.length - unmountedCount, passingOpt.mountBatchSize);
        }
        var mountedCount = this.checkUnmountedViews(viewportFn, passingOpt);
        return {
            mounted: mountedCount,
            unmounted: unmountedCount
        };
    },

    freeze: function(opt) {
        opt || (opt = {});
        var updates = this._updates;
        var key = opt.key;
        var isFrozen = this.options.frozen;
        var freezeKey = updates.freezeKey;
        if (key && key !== freezeKey)  {
            // key passed, but the paper is already freezed with another key
            if (isFrozen && freezeKey) return;
            updates.freezeKey = key;
            updates.keyFrozen = isFrozen;
        }
        this.options.frozen = true;
        var id = updates.id;
        updates.id = null;
        if (this.isAsync() && id) cancelFrame(id);
    },

    unfreeze: function(opt) {
        opt || (opt = {});
        var updates = this._updates;
        var key = opt.key;
        var freezeKey = updates.freezeKey;
        // key passed, but the paper is already freezed with another key
        if (key && freezeKey && key !== freezeKey) return;
        updates.freezeKey = null;
        // key passed, but the paper is already freezed
        if (key && key === freezeKey && updates.keyFrozen) return;
        if (this.isAsync()) {
            this.freeze();
            this.updateViewsAsync(opt);
        } else {
            this.updateViews(opt);
        }
        this.options.frozen = updates.keyFrozen = false;
        if (updates.sort) {
            this.sortViews();
            updates.sort = false;
        }
    },

    isAsync: function() {
        return !!this.options.async;
    },

    isFrozen: function() {
        return !!this.options.frozen;
    },

    isExactSorting: function() {
        return this.options.sorting === sortingTypes.EXACT;
    },

    onRemove: function() {

        this.freeze();
        this._updates.disabled = true;
        //clean up all DOM elements/views to prevent memory leaks
        this.removeLayers();
        this.removeViews();
    },

    getComputedSize: function() {

        var options = this.options;
        var w = options.width;
        var h = options.height;
        if (!isNumber(w)) w = this.el.clientWidth;
        if (!isNumber(h)) h = this.el.clientHeight;
        return { width: w, height: h };
    },

    setDimensions: function(width, height, data = {}) {
        const { options } = this;
        const { width: currentWidth, height: currentHeight } = options;
        let w = (width === undefined) ? currentWidth : width;
        let h = (height === undefined) ? currentHeight : height;
        if (currentWidth === w && currentHeight === h) return;
        options.width = w;
        options.height = h;
        this._setDimensions();
        const computedSize = this.getComputedSize();
        this.trigger('resize', computedSize.width, computedSize.height, data);
    },

    _setDimensions: function() {
        const { options } = this;
        let w = options.width;
        let h = options.height;
        if (isNumber(w)) w = `${Math.round(w)}px`;
        if (isNumber(h)) h = `${Math.round(h)}px`;
        this.$el.css({
            width: (w === null) ? '' : w,
            height: (h === null) ? '' : h
        });
    },

    // Expand/shrink the paper to fit the content.
    // Alternatively signature function(opt)
    fitToContent: function(gridWidth, gridHeight, padding, opt) {

        if (isObject(gridWidth)) {
            // first parameter is an option object
            opt = gridWidth;
        } else {
            // Support for a deprecated signature
            opt = assign({ gridWidth, gridHeight, padding }, opt);
        }

        const { x, y, width, height } = this.getFitToContentArea(opt);
        const { sx, sy } = this.scale();

        this.translate(-x * sx, -y * sy, opt);
        this.setDimensions(width * sx, height * sy, opt);

        return new Rect(x, y, width, height);
    },

    getFitToContentArea: function(opt = {}) {

        // Calculate the paper size to accommodate all the graph's elements.

        const gridWidth = opt.gridWidth || 1;
        const gridHeight = opt.gridHeight || 1;
        const padding = normalizeSides(opt.padding || 0);

        const minWidth = Math.max(opt.minWidth || 0, gridWidth);
        const minHeight = Math.max(opt.minHeight || 0, gridHeight);
        const maxWidth = opt.maxWidth || Number.MAX_VALUE;
        const maxHeight = opt.maxHeight || Number.MAX_VALUE;
        const newOrigin = opt.allowNewOrigin;

        const area = ('contentArea' in opt) ? new Rect(opt.contentArea) : this.getContentArea(opt);
        const { sx, sy } = this.scale();
        area.x *= sx;
        area.y *= sy;
        area.width *= sx;
        area.height *= sy;

        let calcWidth = Math.ceil((area.width + area.x) / gridWidth);
        let calcHeight = Math.ceil((area.height + area.y) / gridHeight);
        if (!opt.allowNegativeBottomRight) {
            calcWidth = Math.max(calcWidth, 1);
            calcHeight = Math.max(calcHeight, 1);
        }
        calcWidth *= gridWidth;
        calcHeight *= gridHeight;

        let tx = 0;
        if ((newOrigin === 'negative' && area.x < 0) || (newOrigin === 'positive' && area.x >= 0) || newOrigin === 'any') {
            tx = Math.ceil(-area.x / gridWidth) * gridWidth;
            tx += padding.left;
            calcWidth += tx;
        }

        let ty = 0;
        if ((newOrigin === 'negative' && area.y < 0) || (newOrigin === 'positive' && area.y >= 0) || newOrigin === 'any') {
            ty = Math.ceil(-area.y / gridHeight) * gridHeight;
            ty += padding.top;
            calcHeight += ty;
        }

        calcWidth += padding.right;
        calcHeight += padding.bottom;

        // Make sure the resulting width and height are greater than minimum.
        calcWidth = Math.max(calcWidth, minWidth);
        calcHeight = Math.max(calcHeight, minHeight);

        // Make sure the resulting width and height are lesser than maximum.
        calcWidth = Math.min(calcWidth, maxWidth);
        calcHeight = Math.min(calcHeight, maxHeight);

        return new Rect(-tx / sx, -ty / sy, calcWidth / sx, calcHeight / sy);
    },

    transformToFitContent: function(opt) {
        opt || (opt = {});

        let contentBBox, contentLocalOrigin;
        if ('contentArea' in opt) {
            const contentArea = opt.contentArea;
            contentBBox = this.localToPaperRect(contentArea);
            contentLocalOrigin = new Point(contentArea);
        } else {
            contentBBox = this.getContentBBox(opt);
            contentLocalOrigin = this.paperToLocalPoint(contentBBox);
        }

        if (!contentBBox.width || !contentBBox.height) return;

        defaults(opt, {
            padding: 0,
            preserveAspectRatio: true,
            scaleGrid: null,
            minScale: 0,
            maxScale: Number.MAX_VALUE,
            verticalAlign: 'top',
            horizontalAlign: 'left',
            //minScaleX
            //minScaleY
            //maxScaleX
            //maxScaleY
            //fittingBBox
        });

        const padding = normalizeSides(opt.padding);

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

        fittingBBox = new Rect(fittingBBox).moveAndExpand({
            x: padding.left,
            y: padding.top,
            width: -padding.left - padding.right,
            height: -padding.top - padding.bottom
        });

        const ctm = this.matrix();
        const { a: sx, d: sy, e: tx, f: ty } = ctm;

        let newSx = fittingBBox.width / contentBBox.width * sx;
        let newSy = fittingBBox.height / contentBBox.height * sy;

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

        const scaleDiff = {
            x: newSx / sx,
            y: newSy / sy
        };

        let newOx = fittingBBox.x - contentLocalOrigin.x * newSx - tx;
        let newOy = fittingBBox.y - contentLocalOrigin.y * newSy - ty;

        switch (opt.verticalAlign) {
            case 'middle':
                newOy = newOy + (fittingBBox.height - contentBBox.height * scaleDiff.y) / 2;
                break;
            case 'bottom':
                newOy = newOy + (fittingBBox.height - contentBBox.height * scaleDiff.y);
                break;
            case 'top':
            default:
                break;
        }

        switch (opt.horizontalAlign) {
            case 'middle':
                newOx = newOx + (fittingBBox.width - contentBBox.width * scaleDiff.x) / 2;
                break;
            case 'right':
                newOx = newOx + (fittingBBox.width - contentBBox.width * scaleDiff.x);
                break;
            case 'left':
            default:
                break;
        }

        ctm.a = newSx;
        ctm.d = newSy;
        ctm.e = newOx;
        ctm.f = newOy;
        this.matrix(ctm, opt);
    },

    scaleContentToFit: function(opt) {
        this.transformToFitContent(opt);
    },

    // Return the dimensions of the content area in local units (without transformations).
    getContentArea: function(opt) {

        if (opt && opt.useModelGeometry) {
            return this.model.getBBox() || new Rect();
        }

        return V(this.cells).getBBox();
    },

    // Return the dimensions of the content bbox in the paper units (as it appears on screen).
    getContentBBox: function(opt) {

        return this.localToPaperRect(this.getContentArea(opt));
    },

    // Returns a geometry rectangle representing the entire
    // paper area (coordinates from the left paper border to the right one
    // and the top border to the bottom one).
    getArea: function() {

        return this.paperToLocalRect(this.getComputedSize());
    },

    getRestrictedArea: function(...args) {

        const { restrictTranslate } = this.options;

        let restrictedArea;
        if (isFunction(restrictTranslate)) {
            // A method returning a bounding box
            restrictedArea = restrictTranslate.apply(this, args);
        } else if (restrictTranslate === true) {
            // The paper area
            restrictedArea = this.getArea();
        } else if (!restrictTranslate) {
            // falsy value
            restrictedArea = null;
        } else {
            // any other value
            restrictedArea = new Rect(restrictTranslate);
        }

        return restrictedArea;
    },

    createViewForModel: function(cell) {

        const { options } = this;
        // A class taken from the paper options.
        var optionalViewClass;

        // A default basic class (either dia.ElementView or dia.LinkView)
        var defaultViewClass;

        // A special class defined for this model in the corresponding namespace.
        // e.g. joint.shapes.standard.Rectangle searches for joint.shapes.standard.RectangleView
        var namespace = options.cellViewNamespace;
        var type = cell.get('type') + 'View';
        var namespaceViewClass = getByPath(namespace, type, '.');

        if (cell.isLink()) {
            optionalViewClass = options.linkView;
            defaultViewClass = LinkView;
        } else {
            optionalViewClass = options.elementView;
            defaultViewClass = ElementView;
        }

        // a) the paper options view is a class (deprecated)
        //  1. search the namespace for a view
        //  2. if no view was found, use view from the paper options
        // b) the paper options view is a function
        //  1. call the function from the paper options
        //  2. if no view was return, search the namespace for a view
        //  3. if no view was found, use the default
        var ViewClass = (optionalViewClass.prototype instanceof ViewBase)
            ? namespaceViewClass || optionalViewClass
            : optionalViewClass.call(this, cell) || namespaceViewClass || defaultViewClass;

        return new ViewClass({
            model: cell,
            interactive: options.interactive,
            labelsLayer: options.labelsLayer === true ? LayersNames.LABELS : options.labelsLayer
        });
    },

    removeView: function(cell) {

        const { id } = cell;
        const { _views, _updates } = this;
        const view = _views[id];
        if (view) {
            var { cid } = view;
            const { mounted, unmounted } = _updates;
            view.remove();
            delete _views[id];
            delete mounted[cid];
            delete unmounted[cid];
        }
        return view;
    },

    renderView: function(cell, opt) {

        const { id } = cell;
        const views = this._views;
        let view, flag;
        let create = true;
        if (id in views) {
            view = views[id];
            if (view.model === cell) {
                flag = view.FLAG_INSERT;
                create = false;
            } else {
                // The view for this `id` already exist.
                // The cell is a new instance of the model with identical id
                // We simply remove the existing view and create a new one
                this.removeView(cell);
            }
        }
        if (create) {
            view = views[id] = this.createViewForModel(cell);
            view.paper = this;
            flag = this.registerUnmountedView(view) | this.FLAG_INIT | view.getFlag(result(view, 'initFlag'));
        }
        this.requestViewUpdate(view, flag, view.UPDATE_PRIORITY, opt);
        return view;
    },

    onImageDragStart: function() {
        // This is the only way to prevent image dragging in Firefox that works.
        // Setting -moz-user-select: none, draggable="false" attribute or user-drag: none didn't help.

        return false;
    },

    resetViews: function(cells, opt) {
        opt || (opt = {});
        cells || (cells = []);
        this._resetUpdates();
        // clearing views removes any event listeners
        this.removeViews();
        // Allows to unfreeze normally while in the idle state using autoFreeze option
        const key = this.options.autoFreeze ? null : 'reset';
        this.freeze({ key });
        for (var i = 0, n = cells.length; i < n; i++) {
            this.renderView(cells[i], opt);
        }
        this.unfreeze({ key });
        this.sortViews();
    },

    removeViews: function() {

        invoke(this._views, 'remove');

        this._views = {};
    },

    sortViews: function() {

        if (!this.isExactSorting()) {
            // noop
            return;
        }
        if (this.isFrozen()) {
            // sort views once unfrozen
            this._updates.sort = true;
            return;
        }
        this.sortViewsExact();
    },

    sortViewsExact: function() {

        // Run insertion sort algorithm in order to efficiently sort DOM elements according to their
        // associated model `z` attribute.

        var cellNodes = Array.from(this.cells.childNodes).filter(node => node.getAttribute('model-id'));
        var cells = this.model.get('cells');

        sortElements(cellNodes, function(a, b) {
            var cellA = cells.get(a.getAttribute('model-id'));
            var cellB = cells.get(b.getAttribute('model-id'));
            var zA = cellA.attributes.z || 0;
            var zB = cellB.attributes.z || 0;
            return (zA === zB) ? 0 : (zA < zB) ? -1 : 1;
        });
    },

    insertView: function(view, isInitialInsert) {
        const layerView = this.getLayerView(LayersNames.CELLS);
        const { el, model } = view;
        switch (this.options.sorting) {
            case sortingTypes.APPROX:
                layerView.insertSortedNode(el, model.get('z'));
                break;
            case sortingTypes.EXACT:
            default:
                layerView.insertNode(el);
                break;
        }
        view.onMount(isInitialInsert);
    },

    detachView(view) {
        view.unmount();
        view.onDetach();
    },

    // Find the first view climbing up the DOM tree starting at element `el`. Note that `el` can also
    // be a selector or a jQuery object.
    findView: function($el) {

        var el = isString($el)
            ? this.cells.querySelector($el)
            : $el instanceof $ ? $el[0] : $el;

        var id = this.findAttribute('model-id', el);
        if (id) return this._views[id];

        return undefined;
    },

    // Find a view for a model `cell`. `cell` can also be a string or number representing a model `id`.
    findViewByModel: function(cell) {

        var id = (isString(cell) || isNumber(cell)) ? cell : (cell && cell.id);

        return this._views[id];
    },

    // Find all views at given point
    findViewsFromPoint: function(p) {

        p = new Point(p);

        var views = this.model.getElements().map(this.findViewByModel, this);

        return views.filter(function(view) {
            return view && view.vel.getBBox({ target: this.cells }).containsPoint(p);
        }, this);
    },

    // Find all views in given area
    findViewsInArea: function(rect, opt) {

        opt = defaults(opt || {}, { strict: false });
        rect = new Rect(rect);

        var views = this.model.getElements().map(this.findViewByModel, this);
        var method = opt.strict ? 'containsRect' : 'intersect';

        return views.filter(function(view) {
            return view && rect[method](view.vel.getBBox({ target: this.cells }));
        }, this);
    },

    removeTools: function() {
        this.dispatchToolsEvent('remove');
        return this;
    },

    hideTools: function() {
        this.dispatchToolsEvent('hide');
        return this;
    },

    showTools: function() {
        this.dispatchToolsEvent('show');
        return this;
    },

    dispatchToolsEvent: function(event, ...args) {
        if (typeof event !== 'string') return;
        this.trigger('tools:event', event, ...args);
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
        var localPoint = new Point(x, y);
        var paperPoint = V.transformPoint(localPoint, this.matrix());
        return paperPoint;
    },

    localToPaperRect: function(x, y, width, height) {
        // allow `x` to be a rectangle and rest arguments undefined
        var localRect = new Rect(x, y, width, height);
        var paperRect = V.transformRect(localRect, this.matrix());
        return paperRect;
    },

    paperToLocalPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        var paperPoint = new Point(x, y);
        var localPoint = V.transformPoint(paperPoint, this.matrix().inverse());
        return localPoint;
    },

    paperToLocalRect: function(x, y, width, height) {
        // allow `x` to be a rectangle and rest arguments undefined
        var paperRect = new Rect(x, y, width, height);
        var localRect = V.transformRect(paperRect, this.matrix().inverse());
        return localRect;
    },

    localToClientPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        var localPoint = new Point(x, y);
        var clientPoint = V.transformPoint(localPoint, this.clientMatrix());
        return clientPoint;
    },

    localToClientRect: function(x, y, width, height) {
        // allow `x` to be a point and `y` undefined
        var localRect = new Rect(x, y, width, height);
        var clientRect = V.transformRect(localRect, this.clientMatrix());
        return clientRect;
    },

    // Transform client coordinates to the paper local coordinates.
    // Useful when you have a mouse event object and you'd like to get coordinates
    // inside the paper that correspond to `evt.clientX` and `evt.clientY` point.
    // Example: var localPoint = paper.clientToLocalPoint({ x: evt.clientX, y: evt.clientY });
    clientToLocalPoint: function(x, y) {
        // allow `x` to be a point and `y` undefined
        var clientPoint = new Point(x, y);
        var localPoint = V.transformPoint(clientPoint, this.clientMatrix().inverse());
        return localPoint;
    },

    clientToLocalRect: function(x, y, width, height) {
        // allow `x` to be a point and `y` undefined
        var clientRect = new Rect(x, y, width, height);
        var localRect = V.transformRect(clientRect, this.clientMatrix().inverse());
        return localRect;
    },

    localToPagePoint: function(x, y) {

        return this.localToPaperPoint(x, y).offset(this.pageOffset());
    },

    localToPageRect: function(x, y, width, height) {

        return this.localToPaperRect(x, y, width, height).offset(this.pageOffset());
    },

    pageToLocalPoint: function(x, y) {

        var pagePoint = new Point(x, y);
        var paperPoint = pagePoint.difference(this.pageOffset());
        return this.paperToLocalPoint(paperPoint);
    },

    pageToLocalRect: function(x, y, width, height) {

        var pageOffset = this.pageOffset();
        var paperRect = new Rect(x, y, width, height);
        paperRect.x -= pageOffset.x;
        paperRect.y -= pageOffset.y;
        return this.paperToLocalRect(paperRect);
    },

    clientOffset: function() {

        var clientRect = this.svg.getBoundingClientRect();
        return new Point(clientRect.left, clientRect.top);
    },

    pageOffset: function() {

        return this.clientOffset().offset(window.scrollX, window.scrollY);
    },

    linkAllowed: function(linkView) {

        if (!(linkView instanceof LinkView)) {
            throw new Error('Must provide a linkView.');
        }

        var link = linkView.model;
        var paperOptions = this.options;
        var graph = this.model;
        var ns = graph.constructor.validations;

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

        return isFunction(this.options.defaultLink)
        // default link is a function producing link model
            ? this.options.defaultLink.call(this, cellView, magnet)
        // default link is the mvc model
            : this.options.defaultLink.clone();
    },

    // Cell highlighting.
    // ------------------

    resolveHighlighter: function(opt = {}) {

        let { highlighter: highlighterDef, type } = opt;
        const { highlighting,highlighterNamespace  } = this.options;

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

            // Is highlighting disabled?
            if (!highlighting) return false;
            // check for built-in types
            if (type) {
                highlighterDef = highlighting[type];
                // Is a specific type highlight disabled?
                if (highlighterDef === false) return false;
            }
            if (!highlighterDef) {
                // Type not defined use default highlight
                highlighterDef = highlighting['default'];
            }
        }

        // Do nothing if opt.highlighter is falsy.
        // This allows the case to not highlight cell(s) in certain cases.
        // For example, if you want to NOT highlight when embedding elements
        // or use a custom highlighter.
        if (!highlighterDef) return false;

        // Allow specifying a highlighter by name.
        if (isString(highlighterDef)) {
            highlighterDef = {
                name: highlighterDef
            };
        }

        const name = highlighterDef.name;
        const highlighter = highlighterNamespace[name];

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
            highlighter,
            options: highlighterDef.options || {},
            name
        };
    },

    onCellHighlight: function(cellView, magnetEl, opt) {
        const highlighterDescriptor = this.resolveHighlighter(opt);
        if (!highlighterDescriptor) return;
        const { highlighter, options } = highlighterDescriptor;
        highlighter.highlight(cellView, magnetEl, options);
    },

    onCellUnhighlight: function(cellView, magnetEl, opt) {
        const highlighterDescriptor = this.resolveHighlighter(opt);
        if (!highlighterDescriptor) return;
        const { highlighter, options } = highlighterDescriptor;
        highlighter.unhighlight(cellView, magnetEl, options);
    },

    // Interaction.
    // ------------

    pointerdblclick: function(evt) {

        evt.preventDefault();

        // magnetpointerdblclick can stop propagation

        evt = normalizeEvent(evt);

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

        if (view) {
            view.pointerdblclick(evt, localPoint.x, localPoint.y);

        } else {
            this.trigger('blank:pointerdblclick', evt, localPoint.x, localPoint.y);
        }
    },

    pointerclick: function(evt) {

        // magnetpointerclick can stop propagation

        var data = this.eventData(evt);
        // Trigger event only if mouse has not moved.
        if (data.mousemoved <= this.options.clickThreshold) {

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) return;

            var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

            if (view) {
                view.pointerclick(evt, localPoint.x, localPoint.y);

            } else {
                this.trigger('blank:pointerclick', evt, localPoint.x, localPoint.y);
            }
        }
    },

    contextmenu: function(evt) {

        if (this.options.preventContextMenu) evt.preventDefault();

        if (this.contextMenuFired) {
            this.contextMenuFired = false;
            return;
        }

        evt = normalizeEvent(evt);

        this.contextMenuTrigger(evt);
    },

    contextMenuTrigger: function(evt) {
        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

        if (view) {
            view.contextmenu(evt, localPoint.x, localPoint.y);

        } else {
            this.trigger('blank:contextmenu', evt, localPoint.x, localPoint.y);
        }
    },

    pointerdown: function(evt) {

        evt = normalizeEvent(evt);

        const { target, button } = evt;
        const view = this.findView(target);
        const isContextMenu = (button === 2);

        if (view) {

            if (!isContextMenu && this.guard(evt, view)) return;

            const isTargetFormNode = this.FORM_CONTROL_TAG_NAMES.includes(target.tagName);

            if (this.options.preventDefaultViewAction && !isTargetFormNode) {
                // If the target is a form element, we do not want to prevent the default action.
                // For example, we want to be able to select text in a text input or
                // to be able to click on a checkbox.
                evt.preventDefault();
            }

            if (isTargetFormNode) {
                // If the target is a form element, we do not want to start dragging the element.
                // For example, we want to be able to select text by dragging the mouse.
                view.preventDefaultInteraction(evt);
            }

            // Custom event
            const eventEvt = this.customEventTrigger(evt, view);
            if (eventEvt) {
            // `onevent` could have stopped propagation
                if (eventEvt.isPropagationStopped()) return;

                evt.data = eventEvt.data;
            }

            // Element magnet
            const magnetNode = target.closest('[magnet]');
            if (magnetNode && view.el !== magnetNode && view.el.contains(magnetNode)) {
                const magnetEvt = normalizeEvent(new $.Event(evt.originalEvent, {
                    data: evt.data,
                    // Originally the event listener was attached to the magnet element.
                    currentTarget: magnetNode
                }));
                this.onmagnet(magnetEvt);
                if (magnetEvt.isDefaultPrevented()) {
                    evt.preventDefault();
                }
                // `onmagnet` stops propagation when `addLinkFromMagnet` is allowed
                if (magnetEvt.isPropagationStopped()) {
                    // `magnet:pointermove` and `magnet:pointerup` events must be fired
                    if (isContextMenu) return;
                    this.delegateDragEvents(view, magnetEvt.data);
                    return;
                }
                evt.data = magnetEvt.data;
            }
        }

        if (isContextMenu) {
            this.contextMenuFired = true;
            const contextmenuEvt = new $.Event(evt.originalEvent, { type: 'contextmenu', data: evt.data });
            this.contextMenuTrigger(contextmenuEvt);
        } else {
            const localPoint = this.snapToGrid(evt.clientX, evt.clientY);
            if (view) {
                view.pointerdown(evt, localPoint.x, localPoint.y);
            } else {
                if (this.options.preventDefaultBlankAction) {
                    evt.preventDefault();
                }
                this.trigger('blank:pointerdown', evt, localPoint.x, localPoint.y);
            }

            this.delegateDragEvents(view, evt.data);
        }

    },

    pointermove: function(evt) {

        // mouse moved counter
        var data = this.eventData(evt);
        if (!data.mousemoved) {
            data.mousemoved = 0;
            // Make sure that events like `mouseenter` and `mouseleave` are
            // not triggered while the user is dragging a cellView.
            this.undelegateEvents();
            // Note: the events are undelegated after the first `pointermove` event.
            // Not on `pointerdown` to make sure that `dbltap` is recognized.
        }

        var mousemoved = ++data.mousemoved;

        if (mousemoved <= this.options.moveThreshold) return;

        evt = normalizeEvent(evt);

        var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

        var view = data.sourceView;
        if (view) {
            view.pointermove(evt, localPoint.x, localPoint.y);
        } else {
            this.trigger('blank:pointermove', evt, localPoint.x, localPoint.y);
        }

        this.eventData(evt, data);
    },

    pointerup: function(evt) {

        this.undelegateDocumentEvents();

        var normalizedEvt = normalizeEvent(evt);

        var localPoint = this.snapToGrid(normalizedEvt.clientX, normalizedEvt.clientY);

        var view = this.eventData(evt).sourceView;
        if (view) {
            view.pointerup(normalizedEvt, localPoint.x, localPoint.y);
        } else {
            this.trigger('blank:pointerup', normalizedEvt, localPoint.x, localPoint.y);
        }

        if (!normalizedEvt.isPropagationStopped()) {
            this.pointerclick(new $.Event(evt.originalEvent, { type: 'click', data: evt.data }));
        }

        this.delegateEvents();
    },

    mouseover: function(evt) {

        evt = normalizeEvent(evt);

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        if (view) {
            view.mouseover(evt);

        } else {
            if (this.el === evt.target) return; // prevent border of paper from triggering this
            this.trigger('blank:mouseover', evt);
        }
    },

    mouseout: function(evt) {

        evt = normalizeEvent(evt);

        var view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        if (view) {
            view.mouseout(evt);

        } else {
            if (this.el === evt.target) return; // prevent border of paper from triggering this
            this.trigger('blank:mouseout', evt);
        }
    },

    mouseenter: function(evt) {

        evt = normalizeEvent(evt);

        const {
            target, // The EventTarget the pointing device entered to
            relatedTarget, // The EventTarget the pointing device exited from
            currentTarget // The EventTarget on which the event listener was registered
        } = evt;
        const view = this.findView(target);
        if (this.guard(evt, view)) return;
        const relatedView = this.findView(relatedTarget);
        if (view) {
            if (relatedView === view) {
                // Mouse left a cell tool
                return;
            }
            view.mouseenter(evt);
            if (this.el.contains(relatedTarget)) {
                // The pointer remains inside the paper.
                return;
            }
        }
        if (relatedView) {
            return;
        }
        // prevent double `mouseenter` event if the `relatedTarget` is outside the paper
        // (mouseenter method would be fired twice)
        if (currentTarget === this.el) {
            // `paper` (more descriptive), not `blank`
            this.trigger('paper:mouseenter', evt);
        }
    },

    mouseleave: function(evt) {

        evt = normalizeEvent(evt);

        const {
            target, // The EventTarget the pointing device exited from
            relatedTarget, // The EventTarget the pointing device entered to
            currentTarget // The EventTarget on which the event listener was registered
        } = evt;
        const view = this.findView(target);
        if (this.guard(evt, view)) return;
        const relatedView = this.findView(relatedTarget);
        if (view) {
            if (relatedView === view) {
                // Mouse entered a cell tool
                return;
            }
            view.mouseleave(evt);
            if (this.el.contains(relatedTarget)) {
                // The pointer has exited a cellView. The pointer is still inside of the paper.
                return;
            }
        }
        if (relatedView) {
            // The pointer has entered a new cellView
            return;
        }
        // prevent double `mouseleave` event if the `relatedTarget` is outside the paper
        // (mouseleave method would be fired twice)
        if (currentTarget === this.el) {
            // There is no cellView under the pointer, nor the blank area of the paper
            this.trigger('paper:mouseleave', evt);
        }
    },

    _processMouseWheelEvtBuf: debounce(function() {
        const { event, deltas } = this._mw_evt_buffer;
        const deltaY = deltas.reduce((acc, deltaY) => acc + cap(deltaY, WHEEL_CAP), 0);

        const scale = Math.pow(0.995, deltaY); // 1.005 for inverted pinch/zoom
        const { x, y } = this.clientToLocalPoint(event.clientX, event.clientY);
        this.trigger('paper:pinch', event, x, y, scale);

        this._mw_evt_buffer = {
            event: null,
            deltas: [],
        };
    }, WHEEL_WAIT_MS, { maxWait: WHEEL_WAIT_MS }),

    mousewheel: function(evt) {

        evt = normalizeEvent(evt);

        const view = this.findView(evt.target);
        if (this.guard(evt, view)) return;

        const originalEvent = evt.originalEvent;
        const localPoint = this.snapToGrid(originalEvent.clientX, originalEvent.clientY);
        const { deltaX, deltaY } = normalizeWheel(originalEvent);

        const pinchHandlers = this._events['paper:pinch'];

        // Touchpad devices will send a fake CTRL press when a pinch is performed
        //
        // We also check if there are any subscribers to paper:pinch event. If there are none,
        // just skip the entire block of code (we don't want to blindly call
        // .preventDefault() if we really don't have to).
        if (evt.ctrlKey && pinchHandlers && pinchHandlers.length > 0) {
            // This is a pinch gesture, it's safe to assume that we must call .preventDefault()
            originalEvent.preventDefault();
            this._mw_evt_buffer.event = evt;
            this._mw_evt_buffer.deltas.push(deltaY);
            this._processMouseWheelEvtBuf();
        } else {
            const delta = Math.max(-1, Math.min(1, originalEvent.wheelDelta));
            if (view) {
                view.mousewheel(evt, localPoint.x, localPoint.y, delta);

            } else {
                this.trigger('blank:mousewheel', evt, localPoint.x, localPoint.y, delta);
            }

            this.trigger('paper:pan', evt, deltaX, deltaY);
        }
    },

    onevent: function(evt) {

        var eventNode = evt.currentTarget;
        var eventName = eventNode.getAttribute('event');
        if (eventName) {
            var view = this.findView(eventNode);
            if (view) {

                evt = normalizeEvent(evt);
                if (this.guard(evt, view)) return;

                var localPoint = this.snapToGrid(evt.clientX, evt.clientY);
                view.onevent(evt, eventName, localPoint.x, localPoint.y);
            }
        }
    },

    magnetEvent: function(evt, handler) {

        var magnetNode = evt.currentTarget;
        var magnetValue = magnetNode.getAttribute('magnet');
        if (magnetValue) {
            var view = this.findView(magnetNode);
            if (view) {
                evt = normalizeEvent(evt);
                if (this.guard(evt, view)) return;
                var localPoint = this.snapToGrid(evt.clientX, evt.clientY);
                handler.call(this, view, evt, magnetNode, localPoint.x, localPoint.y);
            }
        }
    },

    onmagnet: function(evt) {

        if (evt.button === 2) {
            this.contextMenuFired = true;
            this.magnetContextMenuFired = true;
            const contextmenuEvt = new $.Event(evt.originalEvent, {
                type: 'contextmenu',
                data: evt.data,
                currentTarget: evt.currentTarget,
            });
            this.magnetContextMenuTrigger(contextmenuEvt);
            if (contextmenuEvt.isPropagationStopped()) {
                evt.stopPropagation();
            }
        } else {
            this.magnetEvent(evt, function(view, evt, _, x, y) {
                view.onmagnet(evt, x, y);
            });
        }
    },

    magnetpointerdblclick: function(evt) {

        this.magnetEvent(evt, function(view, evt, magnet, x, y) {
            view.magnetpointerdblclick(evt, magnet, x, y);
        });
    },

    magnetcontextmenu: function(evt) {
        if (this.options.preventContextMenu) evt.preventDefault();

        if (this.magnetContextMenuFired) {
            this.magnetContextMenuFired = false;
            return;
        }

        this.magnetContextMenuTrigger(evt);
    },

    magnetContextMenuTrigger: function(evt) {
        this.magnetEvent(evt, function(view, evt, magnet, x, y) {
            view.magnetcontextmenu(evt, magnet, x, y);
        });
    },

    onlabel: function(evt) {

        var labelNode = evt.currentTarget;

        var view = this.findView(labelNode);
        if (!view) return;

        evt = normalizeEvent(evt);
        if (this.guard(evt, view)) return;

        // Custom event
        const eventEvt = this.customEventTrigger(evt, view, labelNode);
        if (eventEvt) {
            // `onevent` could have stopped propagation
            if (eventEvt.isPropagationStopped()) return;

            evt.data = eventEvt.data;
        }

        var localPoint = this.snapToGrid(evt.clientX, evt.clientY);
        view.onlabel(evt, localPoint.x, localPoint.y);
    },

    getPointerArgs(evt) {
        const normalizedEvt = normalizeEvent(evt);
        const { x, y } = this.snapToGrid(normalizedEvt.clientX, normalizedEvt.clientY);
        return [normalizedEvt, x, y];
    },

    delegateDragEvents: function(view, data) {

        data || (data = {});
        this.eventData({ data: data }, { sourceView: view || null, mousemoved: 0 });
        this.delegateDocumentEvents(null, data);
    },

    // Guard the specified event. If the event should be ignored, guard returns `true`.
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

        const { target } = evt;

        if (this.GUARDED_TAG_NAMES.includes(target.tagName)) {
            return true;
        }

        if (view && view.model && (view.model instanceof Cell)) {
            return false;
        }

        if (this.el === target || this.svg.contains(target)) {
            return false;
        }

        return true;    // Event guarded. Paper should not react on it in any way.
    },

    setGridSize: function(gridSize) {
        const { options } = this;
        options.gridSize = gridSize;
        if (options.drawGrid && !options.drawGridSize) {
            // Do not redraw the grid if the `drawGridSize` is set.
            this.getLayerView(LayersNames.GRID).renderGrid();
        }
        return this;
    },

    setGrid: function(drawGrid) {
        this.getLayerView(LayersNames.GRID).setGrid(drawGrid);
        return this;
    },

    updateBackgroundImage: function(opt) {

        opt = opt || {};

        var backgroundPosition = opt.position || 'center';
        var backgroundSize = opt.size || 'auto auto';

        var currentScale = this.scale();
        var currentTranslate = this.translate();

        // backgroundPosition
        if (isObject(backgroundPosition)) {
            var x = currentTranslate.tx + (currentScale.sx * (backgroundPosition.x || 0));
            var y = currentTranslate.ty + (currentScale.sy * (backgroundPosition.y || 0));
            backgroundPosition = x + 'px ' + y + 'px';
        }

        // backgroundSize
        if (isObject(backgroundSize)) {
            backgroundSize = new Rect(backgroundSize).scale(currentScale.sx, currentScale.sy);
            backgroundSize = backgroundSize.width + 'px ' + backgroundSize.height + 'px';
        }

        const { background } = this.childNodes;
        background.style.backgroundSize = backgroundSize;
        background.style.backgroundPosition = backgroundPosition;
    },

    drawBackgroundImage: function(img, opt) {

        // Clear the background image if no image provided
        if (!(img instanceof HTMLImageElement)) {
            this.childNodes.background.style.backgroundImage = '';
            return;
        }

        if (!this._background || this._background.id !== opt.id) {
            // Draw only the last image requested (see drawBackground())
            return;
        }

        opt = opt || {};

        var backgroundImage;
        var backgroundSize = opt.size;
        var backgroundRepeat = opt.repeat || 'no-repeat';
        var backgroundOpacity = opt.opacity || 1;
        var backgroundQuality = Math.abs(opt.quality) || 1;
        var backgroundPattern = this.constructor.backgroundPatterns[camelCase(backgroundRepeat)];

        if (isFunction(backgroundPattern)) {
            // 'flip-x', 'flip-y', 'flip-xy', 'watermark' and custom
            img.width *= backgroundQuality;
            img.height *= backgroundQuality;
            var canvas = backgroundPattern(img, opt);
            if (!(canvas instanceof HTMLCanvasElement)) {
                throw new Error('dia.Paper: background pattern must return an HTML Canvas instance');
            }

            backgroundImage = canvas.toDataURL('image/png');
            backgroundRepeat = 'repeat';
            if (isObject(backgroundSize)) {
                // recalculate the tile size if an object passed in
                backgroundSize.width *= canvas.width / img.width;
                backgroundSize.height *= canvas.height / img.height;
            } else if (backgroundSize === undefined) {
                // calculate the tile size if no provided
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

        this.childNodes.background.style.opacity = backgroundOpacity;
        this.childNodes.background.style.backgroundRepeat = backgroundRepeat;
        this.childNodes.background.style.backgroundImage = `url(${backgroundImage})`;

        this.updateBackgroundImage(opt);
    },

    updateBackgroundColor: function(color) {

        this.$el.css('backgroundColor', color || '');
    },

    drawBackground: function(opt) {

        opt = opt || {};

        this.updateBackgroundColor(opt.color);

        if (opt.image) {
            opt = this._background = cloneDeep(opt);
            guid(opt);
            var img = document.createElement('img');
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

        invoke(this._views, 'setInteractivity', value);
    },

    // Paper definitions.
    // ------------------

    isDefined: function(defId) {

        return !!this.svg.getElementById(defId);
    },

    defineFilter: function(filter) {

        if (!isObject(filter)) {
            throw new TypeError('dia.Paper: defineFilter() requires 1. argument to be an object.');
        }

        var filterId = filter.id;
        var name = filter.name;
        // Generate a hash code from the stringified filter definition. This gives us
        // a unique filter ID for different definitions.
        if (!filterId) {
            filterId = name + this.svg.id + hashCode(JSON.stringify(filter));
        }
        // If the filter already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        // If not, create one.
        if (!this.isDefined(filterId)) {

            var namespace = _filter;
            var filterSVGString = namespace[name] && namespace[name](filter.args || {});
            if (!filterSVGString) {
                throw new Error('Non-existing filter ' + name);
            }

            // SVG <filter/> attributes
            var filterAttrs = assign({
                filterUnits: 'userSpaceOnUse',
            }, filter.attrs, {
                id: filterId
            });

            V(filterSVGString, filterAttrs).appendTo(this.defs);
        }

        return filterId;
    },

    defineGradient: function(gradient) {
        if (!isObject(gradient)) {
            throw new TypeError('dia.Paper: defineGradient() requires 1. argument to be an object.');
        }
        const { svg, defs } = this;
        const {
            type,
            // Generate a hash code from the stringified filter definition. This gives us
            // a unique filter ID for different definitions.
            id = type + svg.id + hashCode(JSON.stringify(gradient)),
            stops,
            attrs = {}
        } = gradient;
        // If the gradient already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        if (this.isDefined(id)) return id;
        // If not, create one.
        const stopVEls = toArray(stops).map(({ offset, color, opacity }) => {
            return V('stop').attr({
                'offset': offset,
                'stop-color': color,
                'stop-opacity': Number.isFinite(opacity) ? opacity : 1
            });
        });
        const gradientVEl = V(type, attrs, stopVEls);
        gradientVEl.id = id;
        gradientVEl.appendTo(defs);
        return id;
    },

    definePattern: function(pattern) {
        if (!isObject(pattern)) {
            throw new TypeError('dia.Paper: definePattern() requires 1. argument to be an object.');
        }
        const { svg, defs } = this;
        const {
            // Generate a hash code from the stringified filter definition. This gives us
            // a unique filter ID for different definitions.
            id = svg.id + hashCode(JSON.stringify(pattern)),
            markup,
            attrs = {}
        } = pattern;
        if (!markup) {
            throw new TypeError('dia.Paper: definePattern() requires markup.');
        }
        // If the gradient already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        if (this.isDefined(id)) return id;
        // If not, create one.
        const patternVEl = V('pattern', {
            patternUnits: 'userSpaceOnUse'
        });
        patternVEl.id = id;
        patternVEl.attr(attrs);
        if (typeof markup === 'string') {
            patternVEl.append(V(markup));
        } else {
            const { fragment } = parseDOMJSON(markup);
            patternVEl.append(fragment);
        }
        patternVEl.appendTo(defs);
        return id;
    },

    defineMarker: function(marker) {
        if (!isObject(marker)) {
            throw new TypeError('dia.Paper: defineMarker() requires the first argument to be an object.');
        }
        const { svg, defs } = this;
        const {
            // Generate a hash code from the stringified filter definition. This gives us
            // a unique filter ID for different definitions.
            id = svg.id + hashCode(JSON.stringify(marker)),
            // user-provided markup
            // (e.g. defined when creating link via `attrs/line/sourceMarker/markup`)
            markup,
            // user-provided attributes
            // (e.g. defined when creating link via `attrs/line/sourceMarker/attrs`)
            // note: `transform` attrs are ignored by browsers
            attrs = {},
            // deprecated - use `attrs/markerUnits` instead (which has higher priority)
            markerUnits = 'userSpaceOnUse'
        } = marker;
        // If the marker already exists in the document,
        // we're done and we can just use it (reference it using `url()`).
        if (this.isDefined(id)) return id;
        // If not, create one.
        const markerVEl = V('marker', {
            orient: 'auto',
            overflow: 'visible',
            markerUnits: markerUnits
        });
        markerVEl.id = id;
        markerVEl.attr(attrs);
        let markerContentVEl;
        if (markup) {
            let markupVEl;
            if (typeof markup === 'string') {
                // Marker object has a `markup` property of type string.
                // - Construct V from the provided string.
                markupVEl = V(markup);
                // `markupVEl` is now either a single VEl, or an array of VEls.
                // - Coerce it to an array.
                markupVEl = (Array.isArray(markupVEl) ? markupVEl : [markupVEl]);
            } else {
                // Marker object has a `markup` property of type object.
                // - Construct V from the object by parsing it as DOM JSON.
                const { fragment } = parseDOMJSON(markup);
                markupVEl = V(fragment).children();
            }
            // `markupVEl` is an array with one or more VEls inside.
            // - If there are multiple VEls, wrap them in a newly-constructed <g> element
            if (markupVEl.length > 1) {
                markerContentVEl = V('g').append(markupVEl);
            } else {
                markerContentVEl = markupVEl[0];
            }
        } else {
            // Marker object is a flat structure.
            // - Construct a new V of type `marker.type`.
            const { type = 'path' } = marker;
            markerContentVEl = V(type);
        }
        // `markerContentVEl` is a single VEl.
        // Assign additional attributes to it (= context attributes + marker attributes):
        // - Attribute values are taken from non-special properties of `marker`.
        const markerAttrs = omit(marker, 'type', 'id', 'markup', 'attrs', 'markerUnits');
        const markerAttrsKeys = Object.keys(markerAttrs);
        markerAttrsKeys.forEach((key) => {
            const value = markerAttrs[key];
            const markupValue = markerContentVEl.attr(key); // value coming from markupVEl (if any) = higher priority
            if (markupValue == null) {
                // Default logic:
                markerContentVEl.attr(key, value);
            } else {
                // Properties with special logic should be added as cases to this switch block:
                switch(key) {
                    case 'transform':
                        // - Prepend `transform` to existing value.
                        markerContentVEl.attr(key, (value + ' ' + markupValue));
                        break;
                }
            }
        });
        markerContentVEl.appendTo(markerVEl);
        markerVEl.appendTo(defs);
        return id;
    },

    customEventTrigger: function(evt, view, rootNode = view.el) {

        const eventNode = evt.target.closest('[event]');

        if (eventNode && rootNode !== eventNode && view.el.contains(eventNode)) {
            const eventEvt = normalizeEvent(new $.Event(evt.originalEvent, {
                data: evt.data,
                // Originally the event listener was attached to the event element.
                currentTarget: eventNode
            }));

            this.onevent(eventEvt);

            if (eventEvt.isDefaultPrevented()) {
                evt.preventDefault();
            }

            return eventEvt;
        }

        return null;
    }

}, {

    sorting: sortingTypes,

    Layers: LayersNames,

    backgroundPatterns: {

        flipXy: function(img) {
            // d b
            // q p

            var canvas = document.createElement('canvas');
            var imgWidth = img.width;
            var imgHeight = img.height;

            canvas.width = 2 * imgWidth;
            canvas.height = 2 * imgHeight;

            var ctx = canvas.getContext('2d');
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

            var canvas = document.createElement('canvas');
            var imgWidth = img.width;
            var imgHeight = img.height;

            canvas.width = imgWidth * 2;
            canvas.height = imgHeight;

            var ctx = canvas.getContext('2d');
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

            var canvas = document.createElement('canvas');
            var imgWidth = img.width;
            var imgHeight = img.height;

            canvas.width = imgWidth;
            canvas.height = imgHeight * 2;

            var ctx = canvas.getContext('2d');
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

            var imgWidth = img.width;
            var imgHeight = img.height;

            var canvas = document.createElement('canvas');
            canvas.width = imgWidth * 3;
            canvas.height = imgHeight * 3;

            var ctx = canvas.getContext('2d');
            var angle = isNumber(opt.watermarkAngle) ? -opt.watermarkAngle : -20;
            var radians = toRad(angle);
            var stepX = canvas.width / 4;
            var stepY = canvas.height / 4;

            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    if ((i + j) % 2 > 0) {
                        // reset the current transformations
                        ctx.setTransform(1, 0, 0, 1, (2 * i - 1) * stepX, (2 * j - 1) * stepY);
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
            render: function(el, opt) {
                V(el).attr({
                    width: opt.thickness,
                    height: opt.thickness,
                    fill: opt.color
                });
            }
        }],
        fixedDot: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'rect',
            render: function(el, opt) {
                V(el).attr({ fill: opt.color });
            },
            update: function(el, opt, paper) {
                const { sx, sy } = paper.scale();
                const width = sx <= 1 ? opt.thickness : opt.thickness / sx;
                const height = sy <= 1 ? opt.thickness : opt.thickness / sy;
                V(el).attr({ width, height });
            }
        }],
        mesh: [{
            color: '#AAAAAA',
            thickness: 1,
            markup: 'path',
            render: function(el, opt) {

                var d;
                var width = opt.width;
                var height = opt.height;
                var thickness = opt.thickness;

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
            render: function(el, opt) {

                var d;
                var width = opt.width;
                var height = opt.height;
                var thickness = opt.thickness;

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
            render: function(el, opt) {

                var d;
                var width = opt.width;
                var height = opt.height;
                var thickness = opt.thickness;

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

