import { Cell } from './Cell.mjs';
import { clone, isPlainObject, isFunction, isString, isNumber } from '../util/index.mjs';
import { Point, Polyline } from '../g/index.mjs';

// Link base model.
// --------------------------

export const Link = Cell.extend({

    // may be overwritten by user to change default label (its markup, size, attrs, position)
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
                    textVerticalAnchor: 'middle',
                    pointerEvents: 'none'
                },
                rect: {
                    ref: 'text',
                    fill: '#ffffff',
                    rx: 3,
                    ry: 3,
                    x: 'calc(x)',
                    y: 'calc(y)',
                    width: 'calc(w)',
                    height: 'calc(h)'
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
            return clone(this.get('source'));
        }

        // setter
        var setSource;
        var setOpt;

        // `source` is a cell
        // take only its `id` and combine with `args`
        var isCellProvided = source instanceof Cell;
        if (isCellProvided) { // three arguments
            setSource = clone(args) || {};
            setSource.id = source.id;
            setOpt = opt;
            return this.set('source', setSource, setOpt);
        }

        // `source` is a point-like object
        // for example, a g.Point
        // take only its `x` and `y` and combine with `args`
        var isPointProvided = !isPlainObject(source);
        if (isPointProvided) { // three arguments
            setSource = clone(args) || {};
            setSource.x = source.x;
            setSource.y = source.y;
            setOpt = opt;
            return this.set('source', setSource, setOpt);
        }

        // `source` is an object
        // no checking
        // two arguments
        setSource = source;
        setOpt = args;
        return this.set('source', setSource, setOpt);
    },

    target: function(target, args, opt) {

        // getter
        if (target === undefined) {
            return clone(this.get('target'));
        }

        // setter
        var setTarget;
        var setOpt;

        // `target` is a cell
        // take only its `id` argument and combine with `args`
        var isCellProvided = target instanceof Cell;
        if (isCellProvided) { // three arguments
            setTarget = clone(args) || {};
            setTarget.id = target.id;
            setOpt = opt;
            return this.set('target', setTarget, setOpt);
        }

        // `target` is a point-like object
        // for example, a g.Point
        // take only its `x` and `y` and combine with `args`
        var isPointProvided = !isPlainObject(target);
        if (isPointProvided) { // three arguments
            setTarget = clone(args) || {};
            setTarget.x = target.x;
            setTarget.y = target.y;
            setOpt = opt;
            return this.set('target', setTarget, setOpt);
        }

        // `target` is an object
        // no checking
        // two arguments
        setTarget = target;
        setOpt = args;
        return this.set('target', setTarget, setOpt);
    },

    router: function(name, args, opt) {

        // getter
        if (name === undefined) {
            var router = this.get('router');
            if (!router) {
                return null;
            }
            if (typeof router === 'object') return clone(router);
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
                return null;
            }
            if (typeof connector === 'object') return clone(connector);
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

    hasLabels: function() {
        const { labels } = this.attributes;
        return Array.isArray(labels) && labels.length > 0;
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
        var setVertex = this._normalizeVertex(vertex);
        return this.prop(['vertices', idx], setVertex, opt);
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
        var setVertices = [];
        for (var i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            var setVertex = this._normalizeVertex(vertex);
            setVertices.push(setVertex);
        }
        return this.set('vertices', setVertices, opt);
    },

    insertVertex: function(idx, vertex, opt) {

        if (!vertex) throw new Error('dia.Link: no vertex provided');

        var vertices = this.vertices();
        var n = vertices.length;
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : n;
        if (idx < 0) idx = n + idx + 1;

        var setVertex = this._normalizeVertex(vertex);
        vertices.splice(idx, 0, setVertex);
        return this.vertices(vertices, opt);
    },

    removeVertex: function(idx, opt) {

        var vertices = this.vertices();
        idx = (isFinite(idx) && idx !== null) ? (idx | 0) : -1;

        vertices.splice(idx, 1);
        return this.vertices(vertices, opt);
    },

    _normalizeVertex: function(vertex) {

        // is vertex a point-like object?
        // for example, a g.Point
        var isPointProvided = !isPlainObject(vertex);
        if (isPointProvided) return { x: vertex.x, y: vertex.y };

        // else: return vertex unchanged
        return vertex;
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
            return Point(p).scale(sx, sy, origin).toJSON();
        }, opt);
    },

    applyToPoints: function(fn, opt) {

        if (!isFunction(fn)) {
            throw new TypeError('dia.Link: applyToPoints expects its first parameter to be a function.');
        }

        var attrs = {};

        var { source, target } = this.attributes;
        if (!source.id) {
            attrs.source = fn(source);
        }
        if (!target.id) {
            attrs.target = fn(target);
        }

        var vertices = this.vertices();
        if (vertices.length > 0) {
            attrs.vertices = vertices.map(fn);
        }

        return this.set(attrs, opt);
    },

    getSourcePoint: function() {
        var sourceCell = this.getSourceCell();
        if (!sourceCell) return new Point(this.source());
        return sourceCell.getPointFromConnectedLink(this, 'source');
    },

    getTargetPoint: function() {
        var targetCell = this.getTargetCell();
        if (!targetCell) return new Point(this.target());
        return targetCell.getPointFromConnectedLink(this, 'target');
    },

    getPointFromConnectedLink: function(/* link, endType */) {
        return this.getPolyline().pointAt(0.5);
    },

    getPolyline: function() {
        const points = [
            this.getSourcePoint(),
            ...this.vertices().map(Point),
            this.getTargetPoint()
        ];
        return new Polyline(points);
    },

    getBBox: function() {
        return this.getPolyline().bbox();
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

        var { source, target } = this.attributes;
        var sourceId = source.id;
        var targetId = target.id;

        if (!sourceId || !targetId) {
            // Link "pinned" to the paper does not have a loop.
            return false;
        }

        var loop = sourceId === targetId;

        // Note that there in the deep mode a link can have a loop,
        // even if it connects only a parent and its embed.
        // A loop "target equals source" is valid in both shallow and deep mode.
        if (!loop && opt.deep && this.graph) {

            var sourceElement = this.getSourceCell();
            var targetElement = this.getTargetCell();

            loop = sourceElement.isEmbeddedIn(targetElement) || targetElement.isEmbeddedIn(sourceElement);
        }

        return loop;
    },

    // unlike source(), this method returns null if source is a point
    getSourceCell: function() {

        const { graph, attributes } = this;
        var source = attributes.source;
        return (source && source.id && graph && graph.getCell(source.id)) || null;
    },

    getSourceElement: function() {
        var cell = this;
        var visited = {};
        do {
            if (visited[cell.id]) return null;
            visited[cell.id] = true;
            cell = cell.getSourceCell();
        } while (cell && cell.isLink());
        return cell;
    },

    // unlike target(), this method returns null if target is a point
    getTargetCell: function() {

        const { graph, attributes } = this;
        var target = attributes.target;
        return (target && target.id && graph && graph.getCell(target.id)) || null;
    },

    getTargetElement: function() {
        var cell = this;
        var visited = {};
        do {
            if (visited[cell.id]) return null;
            visited[cell.id] = true;
            cell = cell.getTargetCell();
        } while (cell && cell.isLink());
        return cell;
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

        var cellId = (isString(cell) || isNumber(cell)) ? cell : cell.id;
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

