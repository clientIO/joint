import { CellView } from './CellView.mjs';
import { Link } from './Link.mjs';
import V from '../V/index.mjs';
import { addClassNamePrefix, merge, assign, isObject, isFunction, clone, isPercentage, result, isEqual } from '../util/index.mjs';
import { Point, Line, Path, normalizeAngle, Rect, Polyline } from '../g/index.mjs';
import * as routers from '../routers/index.mjs';
import * as connectors from '../connectors/index.mjs';
import { env } from '../env/index.mjs';

const Flags = {
    TOOLS: CellView.Flags.TOOLS,
    RENDER: 'RENDER',
    UPDATE: 'UPDATE',
    LABELS: 'LABELS',
    SOURCE: 'SOURCE',
    TARGET: 'TARGET',
    CONNECTOR: 'CONNECTOR'
};

// Link base view and controller.
// ----------------------------------------

export const LinkView = CellView.extend({

    className: function() {

        var classNames = CellView.prototype.className.apply(this).split(' ');

        classNames.push('link');

        return classNames.join(' ');
    },

    _labelCache: null,
    _labelSelectors: null,
    _V: null,
    _dragData: null, // deprecated

    metrics: null,
    decimalsRounding: 2,

    initialize: function() {

        CellView.prototype.initialize.apply(this, arguments);

        // `_.labelCache` is a mapping of indexes of labels in the `this.get('labels')` array to
        // `<g class="label">` nodes wrapped by Vectorizer. This allows for quick access to the
        // nodes in `updateLabelPosition()` in order to update the label positions.
        this._labelCache = {};

        // a cache of label selectors
        this._labelSelectors = {};

        // cache of default markup nodes
        this._V = {};

        // connection path metrics
        this.cleanNodesCache();
    },

    presentationAttributes: {
        markup: [Flags.RENDER],
        attrs: [Flags.UPDATE],
        router: [Flags.UPDATE],
        connector: [Flags.CONNECTOR],
        labels: [Flags.LABELS],
        labelMarkup: [Flags.LABELS],
        vertices: [Flags.UPDATE],
        source: [Flags.SOURCE, Flags.UPDATE],
        target: [Flags.TARGET, Flags.UPDATE]
    },

    initFlag: [Flags.RENDER, Flags.SOURCE, Flags.TARGET, Flags.TOOLS],

    UPDATE_PRIORITY: 1,

    confirmUpdate: function(flags, opt) {

        opt || (opt = {});

        if (this.hasFlag(flags, Flags.SOURCE)) {
            if (!this.updateEndProperties('source')) return flags;
            flags = this.removeFlag(flags, Flags.SOURCE);
        }

        if (this.hasFlag(flags, Flags.TARGET)) {
            if (!this.updateEndProperties('target')) return flags;
            flags = this.removeFlag(flags, Flags.TARGET);
        }

        const { paper, sourceView, targetView } = this;
        if (paper && ((sourceView && !paper.isViewMounted(sourceView)) || (targetView && !paper.isViewMounted(targetView)))) {
            // Wait for the sourceView and targetView to be rendered
            return flags;
        }

        if (this.hasFlag(flags, Flags.RENDER)) {
            this.render();
            this.updateHighlighters(true);
            this.updateTools(opt);
            flags = this.removeFlag(flags, [Flags.RENDER, Flags.UPDATE, Flags.LABELS, Flags.TOOLS, Flags.CONNECTOR]);

            if (env.test('isSafari')) {
                this.__fixSafariBug268376();
            }

            return flags;
        }

        let updateHighlighters = false;

        const { model } = this;
        const { attributes } = model;
        let updateLabels = this.hasFlag(flags, Flags.LABELS);

        if (updateLabels) {
            this.onLabelsChange(model, attributes.labels, opt);
            flags = this.removeFlag(flags, Flags.LABELS);
            updateHighlighters = true;
        }

        const updateAll = this.hasFlag(flags, Flags.UPDATE);
        const updateConnector = this.hasFlag(flags, Flags.CONNECTOR);
        if (updateAll || updateConnector) {
            if (!updateAll) {
                // Keep the current route and update the geometry
                this.updatePath();
                this.updateDOM();
            } else if (opt.translateBy && model.isRelationshipEmbeddedIn(opt.translateBy)) {
                // The link is being translated by an ancestor that will
                // shift source point, target point and all vertices
                // by an equal distance.
                this.translate(opt.tx, opt.ty);
            } else {
                this.update();
            }
            this.updateTools(opt);
            flags = this.removeFlag(flags, [Flags.UPDATE, Flags.TOOLS, Flags.CONNECTOR]);
            updateLabels = false;
            updateHighlighters = true;
        }

        if (updateLabels) {
            this.updateLabelPositions();
        }

        if (updateHighlighters) {
            this.updateHighlighters();
        }

        if (this.hasFlag(flags, Flags.TOOLS)) {
            this.updateTools(opt);
            flags = this.removeFlag(flags, Flags.TOOLS);
        }

        return flags;
    },

    __fixSafariBug268376: function() {
        // Safari has a bug where any change after the first render is not reflected in the DOM.
        // https://bugs.webkit.org/show_bug.cgi?id=268376
        const { el } = this;
        const childNodes = Array.from(el.childNodes);
        const fragment = document.createDocumentFragment();
        for (let i = 0, n = childNodes.length; i < n; i++) {
            el.removeChild(childNodes[i]);
            fragment.appendChild(childNodes[i]);
        }
        el.appendChild(fragment);
    },

    requestConnectionUpdate: function(opt) {
        this.requestUpdate(this.getFlag(Flags.UPDATE), opt);
    },

    isLabelsRenderRequired: function(opt = {}) {

        const previousLabels = this.model.previous('labels');
        if (!previousLabels) return true;

        // Here is an optimization for cases when we know, that change does
        // not require re-rendering of all labels.
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
                        return ('markup' in Object(opt.propertyValue));
                    } else if (pathArray[2] !== 'markup') {
                        // We are changing a label property but not the markup
                        return false;
                    }
                }
            }
        }

        return true;
    },

    onLabelsChange: function(_link, _labels, opt) {

        // Note: this optimization works in async=false mode only
        if (this.isLabelsRenderRequired(opt)) {
            this.renderLabels();
        } else {
            this.updateLabels();
        }
    },

    // Rendering.
    // ----------

    render: function() {

        this.vel.empty();
        this.unmountLabels();
        this._V = {};
        this.renderMarkup();
        // rendering labels has to be run after the link is appended to DOM tree. (otherwise <Text> bbox
        // returns zero values)
        this.renderLabels();
        this.update();

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

        var doc = this.parseDOMJSON(markup, this.el);
        // Selectors
        this.selectors = doc.selectors;
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

        this.vel.append(children);
    },

    _getLabelMarkup: function(labelMarkup) {

        if (!labelMarkup) return undefined;

        if (Array.isArray(labelMarkup)) return this.parseDOMJSON(labelMarkup, null);
        if (typeof labelMarkup === 'string') return this._getLabelStringMarkup(labelMarkup);
        throw new Error('dia.linkView: invalid label markup');
    },

    _getLabelStringMarkup: function(labelMarkup) {

        var children = V(labelMarkup);
        var fragment = document.createDocumentFragment();

        if (!Array.isArray(children)) {
            fragment.appendChild(children.node);

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
            vNode = V('g').append(fragment);
        } else {
            vNode = V(childNodes[0]);
        }

        vNode.addClass('label');

        return { node: vNode.node, selectors: markup.selectors };
    },

    renderLabels: function() {

        var cache = this._V;
        var vLabels = cache.labels;
        var labelCache = this._labelCache = {};
        var labelSelectors = this._labelSelectors = {};
        var model = this.model;
        var labels = model.attributes.labels || [];
        var labelsCount = labels.length;

        if (labelsCount === 0) {
            if (vLabels) vLabels.remove();
            return this;
        }

        if (vLabels) {
            vLabels.empty();
        }  else {
            // there is no label container in the markup but some labels are defined
            // add a <g class="labels" /> container
            vLabels = cache.labels = V('g').addClass('labels');
            if (this.options.labelsLayer) {
                vLabels.addClass(addClassNamePrefix(result(this, 'className')));
                vLabels.attr('model-id', model.id);
            }
        }

        for (var i = 0; i < labelsCount; i++) {

            var label = labels[i];
            var labelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(label.markup));
            var labelNode;
            var selectors;
            if (labelMarkup) {

                labelNode = labelMarkup.node;
                selectors = labelMarkup.selectors;

            } else {

                var builtinDefaultLabel =  model._builtins.defaultLabel;
                var builtinDefaultLabelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(builtinDefaultLabel.markup));
                var defaultLabel = model._getDefaultLabel();
                var defaultLabelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(defaultLabel.markup));
                var defaultMarkup = defaultLabelMarkup || builtinDefaultLabelMarkup;

                labelNode = defaultMarkup.node;
                selectors = defaultMarkup.selectors;
            }

            labelNode.setAttribute('label-idx', i); // assign label-idx
            vLabels.append(labelNode);
            labelCache[i] = labelNode; // cache node for `updateLabels()` so it can just update label node positions

            var rootSelector = this.selector;
            if (selectors[rootSelector]) throw new Error('dia.LinkView: ambiguous label root selector.');
            selectors[rootSelector] = labelNode;

            labelSelectors[i] = selectors; // cache label selectors for `updateLabels()`
        }
        if (!vLabels.parent()) {
            this.mountLabels();
        }

        this.updateLabels();

        return this;
    },

    mountLabels: function() {
        const { el, paper, model, _V, options } = this;
        const { labels: vLabels } = _V;
        if (!vLabels || !model.hasLabels()) return;
        const { node } = vLabels;
        if (options.labelsLayer) {
            paper.getLayerView(options.labelsLayer).insertSortedNode(node, model.get('z'));
        } else {
            if (node.parentNode !== el) {
                el.appendChild(node);
            }
        }
    },

    unmountLabels: function() {
        const { options, _V } = this;
        if (!_V) return;
        const { labels: vLabels } = _V;
        if (vLabels && options.labelsLayer) {
            vLabels.remove();
        }
    },

    findLabelNodes: function(labelIndex, selector) {
        const labelRoot = this._labelCache[labelIndex];
        if (!labelRoot) return [];
        const labelSelectors = this._labelSelectors[labelIndex];
        return this.findBySelector(selector, labelRoot, labelSelectors);
    },

    findLabelNode: function(labelIndex, selector) {
        const [node = null] = this.findLabelNodes(labelIndex, selector);
        return node;
    },

    // merge default label attrs into label attrs (or use built-in default label attrs if neither is provided)
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
            return merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs);
        }

        if (hasCustomMarkup) return merge({}, defaultLabelAttrs, labelAttrs);
        return merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs, labelAttrs);
    },

    // merge default label size into label size (no built-in default)
    // keep `undefined` or `null` because `{}` means something else
    _mergeLabelSize: function(labelSize, defaultLabelSize) {

        if (labelSize === null) return null;
        if (labelSize === undefined) {

            if (defaultLabelSize === null) return null;
            if (defaultLabelSize === undefined) return undefined;

            return defaultLabelSize;
        }

        return merge({}, defaultLabelSize, labelSize);
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
        var defaultLabelSize = defaultLabel.size;

        for (var i = 0, n = labels.length; i < n; i++) {

            var labelNode = this._labelCache[i];
            labelNode.setAttribute('cursor', (canLabelMove ? 'move' : 'default'));

            var selectors = this._labelSelectors[i];

            var label = labels[i];
            var labelMarkup = label.markup;
            var labelAttrs = label.attrs;
            var labelSize = label.size;

            var attrs = this._mergeLabelAttrs(
                (labelMarkup || defaultLabelMarkup),
                labelAttrs,
                defaultLabelAttrs,
                builtinDefaultLabelAttrs
            );

            var size = this._mergeLabelSize(
                labelSize,
                defaultLabelSize
            );

            this.updateDOMSubtreeAttributes(labelNode, attrs, {
                rootBBox: new Rect(size),
                selectors: selectors
            });
        }

        return this;
    },

    // remove vertices that lie on (or nearly on) straight lines within the link
    // return the number of removed points
    removeRedundantLinearVertices: function(opt) {

        const SIMPLIFY_THRESHOLD = 0.001;

        const link = this.model;
        const vertices = link.vertices();
        const routePoints = [this.sourceAnchor, ...vertices, this.targetAnchor];
        const numRoutePoints = routePoints.length;

        // put routePoints into a polyline and try to simplify
        const polyline = new Polyline(routePoints);
        polyline.simplify({ threshold: SIMPLIFY_THRESHOLD });
        const polylinePoints = polyline.points.map((point) => (point.toJSON())); // JSON of points after simplification
        const numPolylinePoints = polylinePoints.length; // number of points after simplification

        // shortcut if simplification did not remove any redundant vertices:
        if (numRoutePoints === numPolylinePoints) return 0;

        // else: set simplified polyline points as link vertices
        // remove first and last polyline points again (= source/target anchors)
        link.vertices(polylinePoints.slice(1, numPolylinePoints - 1), opt);
        return (numRoutePoints - numPolylinePoints);
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
                return new Point(this.sourceAnchor);
            case 'target':
                return new Point(this.targetAnchor);
            default:
                throw new Error('dia.LinkView: type parameter required.');
        }
    },

    getEndConnectionPoint: function(type) {
        switch (type) {
            case 'source':
                return new Point(this.sourcePoint);
            case 'target':
                return new Point(this.targetPoint);
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


    // Updating.
    // ---------

    update: function() {
        this.updateRoute();
        this.updatePath();
        this.updateDOM();
        return this;
    },

    translate: function(tx = 0, ty = 0) {
        const { route, path } = this;
        if (!route || !path) return;
        // translate the route
        const polyline = new Polyline(route);
        polyline.translate(tx, ty);
        this.route = polyline.points;
        // translate source and target connection and anchor points.
        this.sourcePoint.offset(tx, ty);
        this.targetPoint.offset(tx, ty);
        this.sourceAnchor.offset(tx, ty);
        this.targetAnchor.offset(tx, ty);
        // translate the geometry path
        path.translate(tx, ty);
        this.updateDOM();
    },

    updateDOM() {
        const { el, model, selectors } = this;
        this.cleanNodesCache();
        // update SVG attributes defined by 'attrs/'.
        this.updateDOMSubtreeAttributes(el, model.attr(), { selectors });
        // update the label position etc.
        this.updateLabelPositions();
        // *Deprecated*
        // Local perpendicular flag (as opposed to one defined on paper).
        // Could be enabled inside a connector/router. It's valid only
        // during the update execution.
        this.options.perpendicular = null;
    },

    updateRoute: function() {
        const { model } = this;
        const vertices = model.vertices();
        // 1. Find Anchors
        const anchors = this.findAnchors(vertices);
        const sourceAnchor = this.sourceAnchor = anchors.source;
        const targetAnchor = this.targetAnchor = anchors.target;
        // 2. Find Route
        const route = this.findRoute(vertices);
        this.route = route;
        // 3. Find Connection Points
        var connectionPoints = this.findConnectionPoints(route, sourceAnchor, targetAnchor);
        this.sourcePoint = connectionPoints.source;
        this.targetPoint = connectionPoints.target;
    },

    updatePath: function() {
        const { route, sourcePoint, targetPoint } = this;
        // 4. Find Connection
        const path = this.findPath(route, sourcePoint.clone(), targetPoint.clone());
        this.path = path;
    },

    findAnchorsOrdered: function(firstEndType, firstRef, secondEndType, secondRef) {

        var firstAnchor, secondAnchor;
        var firstAnchorRef, secondAnchorRef;
        var model = this.model;
        var firstDef = model.get(firstEndType);
        var secondDef = model.get(secondEndType);
        var firstView = this.getEndView(firstEndType);
        var secondView = this.getEndView(secondEndType);
        var firstMagnet = this.getEndMagnet(firstEndType);
        var secondMagnet = this.getEndMagnet(secondEndType);

        // Anchor first
        if (firstView) {
            if (firstRef) {
                firstAnchorRef = new Point(firstRef);
            } else if (secondView) {
                firstAnchorRef = secondMagnet;
            } else {
                firstAnchorRef = new Point(secondDef);
            }
            firstAnchor = this.getAnchor(firstDef.anchor, firstView, firstMagnet, firstAnchorRef, firstEndType);
        } else {
            firstAnchor = new Point(firstDef);
        }

        // Anchor second
        if (secondView) {
            secondAnchorRef = new Point(secondRef || firstAnchor);
            secondAnchor = this.getAnchor(secondDef.anchor, secondView, secondMagnet, secondAnchorRef, secondEndType);
        } else {
            secondAnchor = new Point(secondDef);
        }

        var res = {};
        res[firstEndType] = firstAnchor;
        res[secondEndType] = secondAnchor;
        return res;
    },

    findAnchors: function(vertices) {

        var model = this.model;
        var firstVertex = vertices[0];
        var lastVertex = vertices[vertices.length - 1];

        if (model.target().priority && !model.source().priority) {
            // Reversed order
            return this.findAnchorsOrdered('target', lastVertex, 'source', firstVertex);
        }

        // Usual order
        return this.findAnchorsOrdered('source', firstVertex, 'target', lastVertex);
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
        if (sourceView && !sourceView.isNodeConnection(this.sourceMagnet)) {
            sourceMagnet = (this.sourceMagnet || sourceView.el);
            var sourceConnectionPointDef = sourceDef.connectionPoint || paperOptions.defaultConnectionPoint;
            var sourcePointRef = firstWaypoint || targetAnchor;
            var sourceLine = new Line(sourcePointRef, sourceAnchor);
            sourcePoint = this.getConnectionPoint(
                sourceConnectionPointDef,
                sourceView,
                sourceMagnet,
                sourceLine,
                'source'
            );
        } else {
            sourcePoint = sourceAnchor;
        }
        // Connection Point Target
        var targetPoint;
        if (targetView && !targetView.isNodeConnection(this.targetMagnet)) {
            targetMagnet = (this.targetMagnet || targetView.el);
            var targetConnectionPointDef = targetDef.connectionPoint || paperOptions.defaultConnectionPoint;
            var targetPointRef = lastWaypoint || sourceAnchor;
            var targetLine = new Line(targetPointRef, targetAnchor);
            targetPoint = this.getConnectionPoint(
                targetConnectionPointDef,
                targetView,
                targetMagnet,
                targetLine,
                'target'
            );
        } else {
            targetPoint = targetAnchor;
        }

        return {
            source: sourcePoint,
            target: targetPoint
        };
    },

    getAnchor: function(anchorDef, cellView, magnet, ref, endType) {

        var isConnection = cellView.isNodeConnection(magnet);
        var paperOptions = this.paper.options;
        if (!anchorDef) {
            if (isConnection) {
                anchorDef = paperOptions.defaultLinkAnchor;
            } else {
                if (this.options.perpendicular) {
                    // Backwards compatibility
                    // See `manhattan` router for more details
                    anchorDef = { name: 'perpendicular' };
                } else {
                    anchorDef = paperOptions.defaultAnchor;
                }
            }
        }

        if (!anchorDef) throw new Error('Anchor required.');
        var anchorFn;
        if (typeof anchorDef === 'function') {
            anchorFn = anchorDef;
        } else {
            var anchorName = anchorDef.name;
            var anchorNamespace = isConnection ? 'linkAnchorNamespace' : 'anchorNamespace';
            anchorFn = paperOptions[anchorNamespace][anchorName];
            if (typeof anchorFn !== 'function') throw new Error('Unknown anchor: ' + anchorName);
        }
        var anchor = anchorFn.call(
            this,
            cellView,
            magnet,
            ref,
            anchorDef.args || {},
            endType,
            this
        );
        if (!anchor) return new Point();
        return anchor.round(this.decimalsRounding);
    },


    getConnectionPoint: function(connectionPointDef, view, magnet, line, endType) {

        var connectionPoint;
        var anchor = line.end;
        var paperOptions = this.paper.options;

        if (!connectionPointDef) return anchor;
        var connectionPointFn;
        if (typeof connectionPointDef === 'function') {
            connectionPointFn = connectionPointDef;
        } else {
            var connectionPointName = connectionPointDef.name;
            connectionPointFn = paperOptions.connectionPointNamespace[connectionPointName];
            if (typeof connectionPointFn !== 'function') throw new Error('Unknown connection point: ' + connectionPointName);
        }
        connectionPoint = connectionPointFn.call(this, line, view, magnet, connectionPointDef.args || {}, endType, this);
        if (!connectionPoint) return anchor;
        return connectionPoint.round(this.decimalsRounding);
    },

    // combine default label position with built-in default label position
    _getDefaultLabelPositionProperty: function() {

        var model = this.model;

        var builtinDefaultLabel = model._builtins.defaultLabel;
        var builtinDefaultLabelPosition = builtinDefaultLabel.position;

        var defaultLabel = model._getDefaultLabel();
        var defaultLabelPosition = this._normalizeLabelPosition(defaultLabel.position);

        return merge({}, builtinDefaultLabelPosition, defaultLabelPosition);
    },

    // if label position is a number, normalize it to a position object
    // this makes sure that label positions can be merged properly
    _normalizeLabelPosition: function(labelPosition) {

        if (typeof labelPosition === 'number') return { distance: labelPosition, offset: null, angle: 0, args: null };
        return labelPosition;
    },

    // expects normalized position properties
    // e.g. `this._normalizeLabelPosition(labelPosition)` and `this._getDefaultLabelPositionProperty()`
    _mergeLabelPositionProperty: function(normalizedLabelPosition, normalizedDefaultLabelPosition) {

        if (normalizedLabelPosition === null) return null;
        if (normalizedLabelPosition === undefined) {

            if (normalizedDefaultLabelPosition === null) return null;
            return normalizedDefaultLabelPosition;
        }

        return merge({}, normalizedDefaultLabelPosition, normalizedLabelPosition);
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

        var defaultLabelPosition = this._getDefaultLabelPositionProperty();

        for (var idx = 0, n = labels.length; idx < n; idx++) {
            var labelNode = this._labelCache[idx];
            if (!labelNode) continue;
            var label = labels[idx];
            var labelPosition = this._normalizeLabelPosition(label.position);
            var position = this._mergeLabelPositionProperty(labelPosition, defaultLabelPosition);
            var transformationMatrix = this._getLabelTransformationMatrix(position);
            labelNode.setAttribute('transform', V.matrixToTransformString(transformationMatrix));
            this._cleanLabelMatrices(idx);
        }

        return this;
    },

    _cleanLabelMatrices: function(index) {
        // Clean magnetMatrix for all nodes of the label.
        // Cached BoundingRect does not need to updated when the position changes
        // TODO: this doesn't work for labels with XML String markups.
        const { metrics, _labelSelectors } = this;
        const selectors = _labelSelectors[index];
        if (!selectors) return;
        for (let selector in selectors) {
            const { id } = selectors[selector];
            if (id && (id in metrics)) delete metrics[id].magnetMatrix;
        }
    },

    updateEndProperties: function(endType) {

        const { model, paper } = this;
        const endViewProperty = `${endType}View`;
        const endDef = model.get(endType);
        const endId = endDef && endDef.id;

        if (!endId) {
            // the link end is a point ~ rect 0x0
            this[endViewProperty] = null;
            this.updateEndMagnet(endType);
            return true;
        }

        const endModel = paper.getModelById(endId);
        if (!endModel) throw new Error('LinkView: invalid ' + endType + ' cell.');

        const endView = endModel.findView(paper);
        if (!endView) {
            // A view for a model should always exist
            return false;
        }

        this[endViewProperty] = endView;
        this.updateEndMagnet(endType);
        return true;
    },

    updateEndMagnet: function(endType) {

        const endMagnetProperty = `${endType}Magnet`;
        const endView = this.getEndView(endType);
        if (endView) {
            let connectedMagnet = endView.getMagnetFromLinkEnd(this.model.get(endType));
            if (connectedMagnet === endView.el) connectedMagnet = null;
            this[endMagnetProperty] = connectedMagnet;
        } else {
            this[endMagnetProperty] = null;
        }
    },

    _getLabelPositionProperty: function(idx) {

        return (this.model.label(idx).position || {});
    },

    _getLabelPositionAngle: function(idx) {

        var labelPosition = this._getLabelPositionProperty(idx);
        return (labelPosition.angle || 0);
    },

    _getLabelPositionArgs: function(idx) {

        var labelPosition = this._getLabelPositionProperty(idx);
        return labelPosition.args;
    },

    _getDefaultLabelPositionArgs: function() {

        var defaultLabel = this.model._getDefaultLabel();
        var defaultLabelPosition = defaultLabel.position || {};
        return defaultLabelPosition.args;
    },

    // merge default label position args into label position args
    // keep `undefined` or `null` because `{}` means something else
    _mergeLabelPositionArgs: function(labelPositionArgs, defaultLabelPositionArgs) {

        if (labelPositionArgs === null) return null;
        if (labelPositionArgs === undefined) {

            if (defaultLabelPositionArgs === null) return null;
            return defaultLabelPositionArgs;
        }

        return merge({}, defaultLabelPositionArgs, labelPositionArgs);
    },

    // Add default label at given position at end of `labels` array.
    // Four signatures:
    // - obj, obj = point, opt
    // - obj, num, obj = point, angle, opt
    // - num, num, obj = x, y, opt
    // - num, num, num, obj = x, y, angle, opt
    // Assigns relative coordinates by default:
    // `opt.absoluteDistance` forces absolute coordinates.
    // `opt.reverseDistance` forces reverse absolute coordinates (if absoluteDistance = true).
    // `opt.absoluteOffset` forces absolute coordinates for offset.
    // Additional args:
    // `opt.keepGradient` auto-adjusts the angle of the label to match path gradient at position.
    // `opt.ensureLegibility` rotates labels so they are never upside-down.
    addLabel: function(p1, p2, p3, p4) {

        // normalize data from the four possible signatures
        var localX;
        var localY;
        var localAngle = 0;
        var localOpt;
        if (typeof p1 !== 'number') {
            // {x, y} object provided as first parameter
            localX = p1.x;
            localY = p1.y;
            if (typeof p2 === 'number') {
                // angle and opt provided as second and third parameters
                localAngle = p2;
                localOpt = p3;
            } else {
                // opt provided as second parameter
                localOpt = p2;
            }
        } else {
            // x and y provided as first and second parameters
            localX = p1;
            localY = p2;
            if (typeof p3 === 'number') {
                // angle and opt provided as third and fourth parameters
                localAngle = p3;
                localOpt = p4;
            } else {
                // opt provided as third parameter
                localOpt = p3;
            }
        }

        // merge label position arguments
        var defaultLabelPositionArgs = this._getDefaultLabelPositionArgs();
        var labelPositionArgs = localOpt;
        var positionArgs = this._mergeLabelPositionArgs(labelPositionArgs, defaultLabelPositionArgs);

        // append label to labels array
        var label = { position: this.getLabelPosition(localX, localY, localAngle, positionArgs) };
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
    // `opt.direction` is optional and it determines whether the token goes from source to target or other way round (`reverse`)
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
        if (isObject(opt)) {
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
            connection = this.findNode(selector);
        } else {
            // Select connection path automatically.
            var cache = this._V;
            connection = (cache.connection) ? cache.connection.node : this.el.querySelector('path');
        }

        if (!(connection instanceof SVGPathElement)) {
            throw new Error('dia.LinkView: token animation requires a valid connection path.');
        }

        vToken
            .appendTo(this.paper.cells)
            .animateAlongPath(animationAttributes, connection);

        setTimeout(onAnimationEnd(vToken, callback), duration);
    },

    findRoute: function(vertices) {

        vertices || (vertices = []);

        var namespace = this.paper.options.routerNamespace || routers;
        var router = this.model.router();
        var defaultRouter = this.paper.options.defaultRouter;

        if (!router) {
            if (defaultRouter) router = defaultRouter;
            else return vertices.map(Point); // no router specified
        }

        var routerFn = isFunction(router) ? router : namespace[router.name];
        if (!isFunction(routerFn)) {
            throw new Error('dia.LinkView: unknown router: "' + router.name + '".');
        }

        var args = router.args || {};

        var route = routerFn.call(
            this, // context
            vertices, // vertices
            args, // options
            this // linkView
        );

        if (!route) return vertices.map(Point);
        return route;
    },

    // Return the `d` attribute value of the `<path>` element representing the link
    // between `source` and `target`.
    findPath: function(route, sourcePoint, targetPoint) {

        var namespace = this.paper.options.connectorNamespace || connectors;
        var connector = this.model.connector();
        var defaultConnector = this.paper.options.defaultConnector;

        if (!connector) {
            connector = defaultConnector || {};
        }

        var connectorFn = isFunction(connector) ? connector : namespace[connector.name];
        if (!isFunction(connectorFn)) {
            throw new Error('dia.LinkView: unknown connector: "' + connector.name + '".');
        }

        var args = clone(connector.args || {});
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
            path = new Path(V.normalizePathData(path));
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
        if (isPercentage(ratio)) ratio = parseFloat(ratio) / 100;
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

    // Get label position object based on two provided coordinates, x and y.
    // (Used behind the scenes when user moves labels around.)
    // Two signatures:
    // - num, num, obj = x, y, options
    // - num, num, num, obj = x, y, angle, options
    // Accepts distance/offset options = `absoluteDistance: boolean`, `reverseDistance: boolean`, `absoluteOffset: boolean`
    // - `absoluteOffset` is necessary in order to move beyond connection endpoints
    // Additional options = `keepGradient: boolean`, `ensureLegibility: boolean`
    getLabelPosition: function(x, y, p3, p4) {

        var position = {};

        // normalize data from the two possible signatures
        var localAngle = 0;
        var localOpt;
        if (typeof p3 === 'number') {
            // angle and opt provided as third and fourth argument
            localAngle = p3;
            localOpt = p4;
        } else {
            // opt provided as third argument
            localOpt = p3;
        }

        // save localOpt as `args` of the position object that is passed along
        if (localOpt) position.args = localOpt;

        // identify distance/offset settings
        var isDistanceRelative = !(localOpt && localOpt.absoluteDistance); // relative by default
        var isDistanceAbsoluteReverse = (localOpt && localOpt.absoluteDistance && localOpt.reverseDistance); // non-reverse by default
        var isOffsetAbsolute = localOpt && localOpt.absoluteOffset; // offset is non-absolute by default

        // find closest point t
        var path = this.path;
        var pathOpt = { segmentSubdivisions: this.getConnectionSubdivisions() };
        var labelPoint = new Point(x, y);
        var t = path.closestPointT(labelPoint, pathOpt);

        // DISTANCE:
        var labelDistance = path.lengthAtT(t, pathOpt);
        if (isDistanceRelative) labelDistance = (labelDistance / this.getConnectionLength()) || 0; // fix to prevent NaN for 0 length
        if (isDistanceAbsoluteReverse) labelDistance = (-1 * (this.getConnectionLength() - labelDistance)) || 1; // fix for end point (-0 => 1)
        position.distance = labelDistance;

        // OFFSET:
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

        // ANGLE:
        position.angle = localAngle;

        return position;
    },

    _getLabelTransformationMatrix: function(labelPosition) {

        var labelDistance;
        var labelAngle = 0;
        var args = {};
        if (typeof labelPosition === 'number') {
            labelDistance = labelPosition;
        } else if (typeof labelPosition.distance === 'number') {
            args = labelPosition.args || {};
            labelDistance = labelPosition.distance;
            labelAngle = labelPosition.angle || 0;
        } else {
            throw new Error('dia.LinkView: invalid label position distance.');
        }

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

        var isKeepGradient = args.keepGradient;
        var isEnsureLegibility = args.ensureLegibility;

        var path = this.path;
        var pathOpt = { segmentSubdivisions: this.getConnectionSubdivisions() };

        var distance = isDistanceRelative ? (labelDistance * this.getConnectionLength()) : labelDistance;
        var tangent = path.tangentAtLength(distance, pathOpt);

        var translation;
        var angle = labelAngle;
        if (tangent) {
            if (isOffsetAbsolute) {
                translation = tangent.start.clone();
                translation.offset(labelOffsetCoordinates);
            } else {
                var normal = tangent.clone();
                normal.rotate(tangent.start, -90);
                normal.setLength(labelOffset);
                translation = normal.end;
            }

            if (isKeepGradient) {
                angle = (tangent.angle() + labelAngle);
                if (isEnsureLegibility) {
                    angle = normalizeAngle(((angle + 90) % 180) - 90);
                }
            }

        } else {
            // fallback - the connection has zero length
            translation = path.start.clone();
            if (isOffsetAbsolute) translation.offset(labelOffsetCoordinates);
        }

        return V.createSVGMatrix()
            .translate(translation.x, translation.y)
            .rotate(angle);
    },

    getLabelCoordinates: function(labelPosition) {

        var transformationMatrix = this._getLabelTransformationMatrix(labelPosition);
        return new Point(transformationMatrix.e, transformationMatrix.f);
    },

    getVertexIndex: function(x, y) {

        var model = this.model;
        var vertices = model.vertices();

        var vertexLength = this.getClosestPointLength(new Point(x, y));

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

    notifyPointerdown(evt, x, y) {
        CellView.prototype.pointerdown.call(this, evt, x, y);
        this.notify('link:pointerdown', evt, x, y);
    },

    notifyPointermove(evt, x, y) {
        CellView.prototype.pointermove.call(this, evt, x, y);
        this.notify('link:pointermove', evt, x, y);
    },

    notifyPointerup(evt, x, y) {
        this.notify('link:pointerup', evt, x, y);
        CellView.prototype.pointerup.call(this, evt, x, y);
    },

    pointerdblclick: function(evt, x, y) {

        CellView.prototype.pointerdblclick.apply(this, arguments);
        this.notify('link:pointerdblclick', evt, x, y);
    },

    pointerclick: function(evt, x, y) {

        CellView.prototype.pointerclick.apply(this, arguments);
        this.notify('link:pointerclick', evt, x, y);
    },

    contextmenu: function(evt, x, y) {

        CellView.prototype.contextmenu.apply(this, arguments);
        this.notify('link:contextmenu', evt, x, y);
    },

    pointerdown: function(evt, x, y) {

        this.notifyPointerdown(evt, x, y);
        this.dragStart(evt, x, y);
    },

    pointermove: function(evt, x, y) {

        // Backwards compatibility
        var dragData = this._dragData;
        if (dragData) this.eventData(evt, dragData);

        var data = this.eventData(evt);
        switch (data.action) {

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
        if (dragData) assign(dragData, this.eventData(evt));

        this.notifyPointermove(evt, x, y);
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

            case 'label-move':
                this.dragLabelEnd(evt, x, y);
                break;

            case 'arrowhead-move':
                this.dragArrowheadEnd(evt, x, y);
                break;

            case 'move':
                this.dragEnd(evt, x, y);
        }

        this.notifyPointerup(evt, x, y);
        this.checkMouseleave(evt);
    },

    mouseover: function(evt) {

        CellView.prototype.mouseover.apply(this, arguments);
        this.notify('link:mouseover', evt);
    },

    mouseout: function(evt) {

        CellView.prototype.mouseout.apply(this, arguments);
        this.notify('link:mouseout', evt);
    },

    mouseenter: function(evt) {

        CellView.prototype.mouseenter.apply(this, arguments);
        this.notify('link:mouseenter', evt);
    },

    mouseleave: function(evt) {

        CellView.prototype.mouseleave.apply(this, arguments);
        this.notify('link:mouseleave', evt);
    },

    mousewheel: function(evt, x, y, delta) {

        CellView.prototype.mousewheel.apply(this, arguments);
        this.notify('link:mousewheel', evt, x, y, delta);
    },

    onlabel: function(evt, x, y) {

        this.notifyPointerdown(evt, x, y);

        this.dragLabelStart(evt, x, y);

        var stopPropagation = this.eventData(evt).stopPropagation;
        if (stopPropagation) evt.stopPropagation();
    },

    // Drag Start Handlers

    dragLabelStart: function(evt, x, y) {

        if (this.can('labelMove')) {

            if (this.isDefaultInteractionPrevented(evt)) return;

            var labelNode = evt.currentTarget;
            var labelIdx = parseInt(labelNode.getAttribute('label-idx'), 10);

            var defaultLabelPosition = this._getDefaultLabelPositionProperty();
            var initialLabelPosition = this._normalizeLabelPosition(this._getLabelPositionProperty(labelIdx));
            var position = this._mergeLabelPositionProperty(initialLabelPosition, defaultLabelPosition);

            var coords = this.getLabelCoordinates(position);
            var dx = coords.x - x; // how much needs to be added to cursor x to get to label x
            var dy = coords.y - y; // how much needs to be added to cursor y to get to label y

            var positionAngle = this._getLabelPositionAngle(labelIdx);
            var labelPositionArgs = this._getLabelPositionArgs(labelIdx);
            var defaultLabelPositionArgs = this._getDefaultLabelPositionArgs();
            var positionArgs = this._mergeLabelPositionArgs(labelPositionArgs, defaultLabelPositionArgs);

            this.eventData(evt, {
                action: 'label-move',
                labelIdx: labelIdx,
                dx: dx,
                dy: dy,
                positionAngle: positionAngle,
                positionArgs: positionArgs,
                stopPropagation: true
            });

        } else {

            // Backwards compatibility:
            // If labels can't be dragged no default action is triggered.
            this.eventData(evt, { stopPropagation: true });
        }

        this.paper.delegateDragEvents(this, evt.data);
    },

    dragArrowheadStart: function(evt, x, y) {

        if (!this.can('arrowheadMove')) return;

        var arrowheadNode = evt.target;
        var arrowheadType = arrowheadNode.getAttribute('end');
        var data = this.startArrowheadMove(arrowheadType, { ignoreBackwardsCompatibility: true });

        this.eventData(evt, data);
    },

    dragStart: function(evt, x, y) {

        if (this.isDefaultInteractionPrevented(evt)) return;

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
        var label = { position: this.getLabelPosition((x + data.dx), (y + data.dy), data.positionAngle, data.positionArgs) };
        if (this.paper.options.snapLabels) delete label.position.offset;
        // The `touchmove' events are not fired
        // when the original event target is removed from the DOM.
        // The labels are currently re-rendered completely when only
        // the position changes. This is why we need to make sure that
        // the label is updated synchronously.
        // TODO: replace `touchmove` with `pointermove` (breaking change).
        const setOptions = { ui: true };
        if (this.paper.isAsync() && evt.type === 'touchmove') {
            setOptions.async = false;
        }
        this.model.label(data.labelIdx, label, setOptions);
    },

    dragArrowhead: function(evt, x, y) {
        if (this.paper.options.snapLinks) {
            const isSnapped = this._snapArrowhead(evt, x, y);
            if (!isSnapped && this.paper.options.snapLinksSelf) {
                this._snapArrowheadSelf(evt, x, y);
            }
        } else {
            if (this.paper.options.snapLinksSelf) {
                this._snapArrowheadSelf(evt, x, y);
            } else {
                this._connectArrowhead(this.getEventTarget(evt), x, y, this.eventData(evt));
            }
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
        var endChanged = currentEnd && !Link.endsEqual(initialEnd, currentEnd);
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

    _snapToPoints: function(snapPoint, points, radius) {
        let closestPointX = null;
        let closestDistanceX = Infinity;

        let closestPointY = null;
        let closestDistanceY = Infinity;

        let x = snapPoint.x;
        let y = snapPoint.y;

        for (let i = 0; i < points.length; i++) {
            const distX = Math.abs(points[i].x - snapPoint.x);
            if (distX < closestDistanceX) {
                closestDistanceX = distX;
                closestPointX = points[i];
            }

            const distY = Math.abs(points[i].y - snapPoint.y);
            if (distY < closestDistanceY) {
                closestDistanceY = distY;
                closestPointY = points[i];
            }
        }

        if (closestDistanceX < radius) {
            x = closestPointX.x;
        }
        if (closestDistanceY < radius) {
            y = closestPointY.y;
        }

        return { x, y };
    },

    _snapArrowheadSelf: function(evt, x, y) {

        const { paper, model } = this;
        const { snapLinksSelf } = paper.options;
        const data = this.eventData(evt);
        const radius = snapLinksSelf.radius || 20;

        const anchor = this.getEndAnchor(data.arrowhead === 'source' ? 'target' : 'source');
        const vertices = model.vertices();
        const points = [anchor, ...vertices];

        const snapPoint = this._snapToPoints({ x: x, y: y }, points, radius);

        const point = paper.localToClientPoint(snapPoint);
        this._connectArrowhead(document.elementFromPoint(point.x, point.y), snapPoint.x, snapPoint.y, this.eventData(evt));
    },

    _snapArrowhead: function(evt, x, y) {

        const { paper } = this;
        const { snapLinks, connectionStrategy } = paper.options;
        const data = this.eventData(evt);
        let isSnapped = false;
        // checking view in close area of the pointer

        var r = snapLinks.radius || 50;
        var viewsInArea = paper.findViewsInArea({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });

        var prevClosestView = data.closestView || null;
        var prevClosestMagnet = data.closestMagnet || null;
        var prevMagnetProxy = data.magnetProxy || null;

        data.closestView = data.closestMagnet = data.magnetProxy = null;

        var minDistance = Number.MAX_VALUE;
        var pointer = new Point(x, y);

        viewsInArea.forEach(function(view) {
            const candidates = [];
            // skip connecting to the element in case '.': { magnet: false } attribute present
            if (view.el.getAttribute('magnet') !== 'false') {
                candidates.push({
                    bbox: view.model.getBBox(),
                    magnet: view.el
                });
            }

            view.$('[magnet]').toArray().forEach(magnet => {
                candidates.push({
                    bbox: view.getNodeBBox(magnet),
                    magnet
                });
            });

            candidates.forEach(candidate => {
                const { magnet, bbox } = candidate;
                // find distance from the center of the model to pointer coordinates
                const distance = bbox.center().squaredDistance(pointer);
                // the connection is looked up in a circle area by `distance < r`
                if (distance < minDistance) {
                    const isAlreadyValidated = prevClosestMagnet === magnet;
                    if (isAlreadyValidated || paper.options.validateConnection.apply(
                        paper, data.validateConnectionArgs(view, (view.el === magnet) ? null : magnet)
                    )) {
                        minDistance = distance;
                        data.closestView = view;
                        data.closestMagnet = magnet;
                    }
                }
            });

        }, this);

        var end;
        var magnetProxy = null;
        var closestView = data.closestView;
        var closestMagnet = data.closestMagnet;
        if (closestMagnet) {
            magnetProxy = data.magnetProxy = closestView.findProxyNode(closestMagnet, 'highlighter');
        }
        var endType = data.arrowhead;
        var newClosestMagnet = (prevClosestMagnet !== closestMagnet);
        if (prevClosestView && newClosestMagnet) {
            prevClosestView.unhighlight(prevMagnetProxy, {
                connecting: true,
                snapping: true
            });
        }

        if (closestView) {
            const { prevEnd, prevX, prevY } = data;
            data.prevX = x;
            data.prevY = y;
            isSnapped = true;

            if (!newClosestMagnet)  {
                if (typeof connectionStrategy !== 'function' || (prevX === x && prevY === y)) {
                    // the magnet has not changed and the link's end does not depend on the x and y
                    return isSnapped;
                }
            }

            end = closestView.getLinkEnd(closestMagnet, x, y, this.model, endType);
            if (!newClosestMagnet && isEqual(prevEnd, end)) {
                // the source/target json has not changed
                return isSnapped;
            }

            data.prevEnd = end;

            if (newClosestMagnet) {
                closestView.highlight(magnetProxy, {
                    connecting: true,
                    snapping: true
                });
            }

        } else {

            end = { x: x, y: y };
        }

        this.model.set(endType, end || { x: x, y: y }, { ui: true });

        if (prevClosestView) {
            this.notify('link:snap:disconnect', evt, prevClosestView, prevClosestMagnet, endType);
        }
        if (closestView) {
            this.notify('link:snap:connect', evt, closestView, closestMagnet, endType);
        }

        return isSnapped;
    },

    _snapArrowheadEnd: function(data) {

        // Finish off link snapping.
        // Everything except view unhighlighting was already done on pointermove.
        var closestView = data.closestView;
        var closestMagnet = data.closestMagnet;
        if (closestView && closestMagnet) {

            closestView.unhighlight(data.magnetProxy, { connecting: true, snapping: true });
            data.magnetUnderPointer = closestView.findMagnet(closestMagnet);
        }

        data.closestView = data.closestMagnet = null;
    },

    _connectArrowhead: function(target, x, y, data) {

        // checking views right under the pointer
        const { paper, model } = this;

        if (data.eventTarget !== target) {
            // Unhighlight the previous view under pointer if there was one.
            if (data.magnetProxy) {
                data.viewUnderPointer.unhighlight(data.magnetProxy, {
                    connecting: true
                });
            }

            const viewUnderPointer = data.viewUnderPointer = paper.findView(target);
            if (viewUnderPointer) {
                // If we found a view that is under the pointer, we need to find the closest
                // magnet based on the real target element of the event.
                const magnetUnderPointer = data.magnetUnderPointer = viewUnderPointer.findMagnet(target);
                const magnetProxy = data.magnetProxy = viewUnderPointer.findProxyNode(magnetUnderPointer, 'highlighter');

                if (magnetUnderPointer && this.paper.options.validateConnection.apply(
                    paper,
                    data.validateConnectionArgs(viewUnderPointer, magnetUnderPointer)
                )) {
                    // If there was no magnet found, do not highlight anything and assume there
                    // is no view under pointer we're interested in reconnecting to.
                    // This can only happen if the overall element has the attribute `'.': { magnet: false }`.
                    if (magnetProxy) {
                        viewUnderPointer.highlight(magnetProxy, {
                            connecting: true
                        });
                    }
                } else {
                    // This type of connection is not valid. Disregard this magnet.
                    data.magnetUnderPointer = null;
                    data.magnetProxy = null;
                }
            } else {
                // Make sure we'll unset previous magnet.
                data.magnetUnderPointer = null;
                data.magnetProxy = null;
            }
        }

        data.eventTarget = target;

        model.set(data.arrowhead, { x: x, y: y }, { ui: true });
    },

    _connectArrowheadEnd: function(data = {}, x, y) {

        const { model } = this;
        const { viewUnderPointer, magnetUnderPointer, magnetProxy, arrowhead } = data;

        if (!magnetUnderPointer || !magnetProxy || !viewUnderPointer) return;

        viewUnderPointer.unhighlight(magnetProxy, { connecting: true });

        // The link end is taken from the magnet under the pointer, not the proxy.
        const end = viewUnderPointer.getLinkEnd(magnetUnderPointer, x, y, model, arrowhead);
        model.set(arrowhead, end, { ui: true });
    },

    _beforeArrowheadMove: function(data) {

        data.z = this.model.get('z');
        this.model.toFront();

        // Let the pointer propagate through the link view elements so that
        // the `evt.target` is another element under the pointer, not the link itself.
        var style = this.el.style;
        data.pointerEvents = style.pointerEvents;
        style.pointerEvents = 'none';

        if (this.paper.options.markAvailable) {
            this._markAvailableMagnets(data);
        }
    },

    _afterArrowheadMove: function(data) {

        if (data.z !== null) {
            this.model.set('z', data.z, { ui: true });
            data.z = null;
        }

        // Put `pointer-events` back to its original value. See `_beforeArrowheadMove()` for explanation.
        this.el.style.pointerEvents = data.pointerEvents;

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
        var elements = paper.model.getCells();
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
            initialEnd: clone(this.model.get(end)),
            validateConnectionArgs: this._createValidateConnectionArgs(end)
        };

        this._beforeArrowheadMove(data);

        if (opt.ignoreBackwardsCompatibility !== true) {
            this._dragData = data;
        }

        return data;
    },

    // Lifecycle methods

    onMount: function() {
        CellView.prototype.onMount.apply(this, arguments);
        this.mountLabels();
    },

    onDetach: function() {
        CellView.prototype.onDetach.apply(this, arguments);
        this.unmountLabels();
    },

    onRemove: function() {
        CellView.prototype.onRemove.apply(this, arguments);
        this.unmountLabels();
    }

}, {

    Flags: Flags,
});

Object.defineProperty(LinkView.prototype, 'sourceBBox', {

    enumerable: true,

    get: function() {
        var sourceView = this.sourceView;
        if (!sourceView) {
            var sourceDef = this.model.source();
            return new Rect(sourceDef.x, sourceDef.y);
        }
        var sourceMagnet = this.sourceMagnet;
        if (sourceView.isNodeConnection(sourceMagnet)) {
            return new Rect(this.sourceAnchor);
        }
        return sourceView.getNodeBBox(sourceMagnet || sourceView.el);
    }

});

Object.defineProperty(LinkView.prototype, 'targetBBox', {

    enumerable: true,

    get: function() {
        var targetView = this.targetView;
        if (!targetView) {
            var targetDef = this.model.target();
            return new Rect(targetDef.x, targetDef.y);
        }
        var targetMagnet = this.targetMagnet;
        if (targetView.isNodeConnection(targetMagnet)) {
            return new Rect(this.targetAnchor);
        }
        return targetView.getNodeBBox(targetMagnet || targetView.el);
    }
});

