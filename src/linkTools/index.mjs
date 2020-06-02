import * as g from '../g/index.mjs';
import V from '../V/index.mjs';
import * as util from '../util/index.mjs';
import * as connectionStrategies from '../connectionStrategies/index.mjs';
import * as mvc from '../mvc/index.mjs';
import { ToolView } from '../dia/ToolView.mjs';

function getAnchor(coords, view, magnet) {
    // take advantage of an existing logic inside of the
    // pin relative connection strategy
    var end = connectionStrategies.pinRelative.call(
        this.paper,
        {},
        view,
        magnet,
        coords,
        this.model
    );
    return end.anchor;
}

function snapAnchor(coords, view, magnet, type, relatedView, toolView) {
    var snapRadius = toolView.options.snapRadius;
    var isSource = (type === 'source');
    var refIndex = (isSource ? 0 : -1);
    var ref = this.model.vertex(refIndex) || this.getEndAnchor(isSource ? 'target' : 'source');
    if (ref) {
        if (Math.abs(ref.x - coords.x) < snapRadius) coords.x = ref.x;
        if (Math.abs(ref.y - coords.y) < snapRadius) coords.y = ref.y;
    }
    return coords;
}

function getViewBBox(view, useModelGeometry) {
    const { model } = view;
    if (useModelGeometry) return model.getBBox();
    return (model.isLink()) ? view.getConnection().bbox() : view.getNodeUnrotatedBBox(view.el);
}

// Vertex Handles
var VertexHandle = mvc.View.extend({
    tagName: 'circle',
    svgElement: true,
    className: 'marker-vertex',
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown',
        dblclick: 'onDoubleClick'
    },
    documentEvents: {
        mousemove: 'onPointerMove',
        touchmove: 'onPointerMove',
        mouseup: 'onPointerUp',
        touchend: 'onPointerUp',
        touchcancel: 'onPointerUp'
    },
    attributes: {
        'r': 6,
        'fill': '#33334F',
        'stroke': '#FFFFFF',
        'stroke-width': 2,
        'cursor': 'move'
    },
    position: function(x, y) {
        this.vel.attr({ cx: x, cy: y });
    },
    onPointerDown: function(evt) {
        if (this.options.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        this.options.paper.undelegateEvents();
        this.delegateDocumentEvents(null, evt.data);
        this.trigger('will-change', this, evt);
    },
    onPointerMove: function(evt) {
        this.trigger('changing', this, evt);
    },
    onDoubleClick: function(evt) {
        this.trigger('remove', this, evt);
    },
    onPointerUp: function(evt) {
        this.trigger('changed', this, evt);
        this.undelegateDocumentEvents();
        this.options.paper.delegateEvents();
    }
});

var Vertices = ToolView.extend({
    name: 'vertices',
    options: {
        handleClass: VertexHandle,
        snapRadius: 20,
        redundancyRemoval: true,
        vertexAdding: true,
        stopPropagation: true
    },
    children: [{
        tagName: 'path',
        selector: 'connection',
        className: 'joint-vertices-path',
        attributes: {
            'fill': 'none',
            'stroke': 'transparent',
            'stroke-width': 10,
            'cursor': 'cell'
        }
    }],
    handles: null,
    events: {
        'mousedown .joint-vertices-path': 'onPathPointerDown',
        'touchstart .joint-vertices-path': 'onPathPointerDown'
    },
    onRender: function() {
        if (this.options.vertexAdding) {
            this.renderChildren();
            this.updatePath();
        }
        this.resetHandles();
        this.renderHandles();
        return this;
    },
    update: function() {
        var relatedView = this.relatedView;
        var vertices = relatedView.model.vertices();
        if (vertices.length === this.handles.length) {
            this.updateHandles();
        } else {
            this.resetHandles();
            this.renderHandles();
        }
        if (this.options.vertexAdding) {
            this.updatePath();
        }
        return this;
    },
    resetHandles: function() {
        var handles = this.handles;
        this.handles = [];
        this.stopListening();
        if (!Array.isArray(handles)) return;
        for (var i = 0, n = handles.length; i < n; i++) {
            handles[i].remove();
        }
    },
    renderHandles: function() {
        var relatedView = this.relatedView;
        var vertices = relatedView.model.vertices();
        for (var i = 0, n = vertices.length; i < n; i++) {
            var vertex = vertices[i];
            var handle = new (this.options.handleClass)({
                index: i,
                paper: this.paper,
                guard: evt => this.guard(evt)
            });
            handle.render();
            handle.position(vertex.x, vertex.y);
            this.simulateRelatedView(handle.el);
            handle.vel.appendTo(this.el);
            this.handles.push(handle);
            this.startHandleListening(handle);
        }
    },
    updateHandles: function() {
        var relatedView = this.relatedView;
        var vertices = relatedView.model.vertices();
        for (var i = 0, n = vertices.length; i < n; i++) {
            var vertex = vertices[i];
            var handle = this.handles[i];
            if (!handle) return;
            handle.position(vertex.x, vertex.y);
        }
    },
    updatePath: function() {
        var connection = this.childNodes.connection;
        if (connection) connection.setAttribute('d', this.relatedView.getSerializedConnection());
    },
    startHandleListening: function(handle) {
        var relatedView = this.relatedView;
        if (relatedView.can('vertexMove')) {
            this.listenTo(handle, 'will-change', this.onHandleWillChange);
            this.listenTo(handle, 'changing', this.onHandleChanging);
            this.listenTo(handle, 'changed', this.onHandleChanged);
        }
        if (relatedView.can('vertexRemove')) {
            this.listenTo(handle, 'remove', this.onHandleRemove);
        }
    },
    getNeighborPoints: function(index) {
        var linkView = this.relatedView;
        var vertices = linkView.model.vertices();
        var prev = (index > 0) ? vertices[index - 1] : linkView.sourceAnchor;
        var next = (index < vertices.length - 1) ? vertices[index + 1] : linkView.targetAnchor;
        return {
            prev: new g.Point(prev),
            next: new g.Point(next)
        };
    },
    onHandleWillChange: function(_handle, evt) {
        this.focus();
        const { relatedView, options } = this;
        relatedView.model.startBatch('vertex-move', { ui: true, tool: this.cid });
        if (!options.stopPropagation) relatedView.notifyPointerdown(...relatedView.paper.getPointerArgs(evt));
    },
    onHandleChanging: function(handle, evt) {
        const { options, relatedView: linkView } = this;
        var index = handle.options.index;
        var [normalizedEvent, x, y] = linkView.paper.getPointerArgs(evt);
        var vertex = { x, y };
        this.snapVertex(vertex, index);
        linkView.model.vertex(index, vertex, { ui: true, tool: this.cid });
        handle.position(vertex.x, vertex.y);
        if (!options.stopPropagation) linkView.notifyPointermove(normalizedEvent, x, y);
    },
    onHandleChanged: function(_handle, evt) {
        const { options, relatedView: linkView } = this;
        if (options.vertexAdding) this.updatePath();
        if (!options.redundancyRemoval) return;
        var verticesRemoved = linkView.removeRedundantLinearVertices({ ui: true, tool: this.cid });
        if (verticesRemoved) this.render();
        this.blur();
        linkView.model.stopBatch('vertex-move', { ui: true, tool: this.cid });
        if (this.eventData(evt).vertexAdded) {
            linkView.model.stopBatch('vertex-add', { ui: true, tool: this.cid });
        }
        var [normalizedEvt, x, y] = linkView.paper.getPointerArgs(evt);
        if (!options.stopPropagation) linkView.notifyPointerup(normalizedEvt, x, y);
        linkView.checkMouseleave(normalizedEvt);
    },
    snapVertex: function(vertex, index) {
        var snapRadius = this.options.snapRadius;
        if (snapRadius > 0) {
            var neighbors = this.getNeighborPoints(index);
            var prev = neighbors.prev;
            var next = neighbors.next;
            if (Math.abs(vertex.x - prev.x) < snapRadius) {
                vertex.x = prev.x;
            } else if (Math.abs(vertex.x - next.x) < snapRadius) {
                vertex.x = next.x;
            }
            if (Math.abs(vertex.y - prev.y) < snapRadius) {
                vertex.y = neighbors.prev.y;
            } else if (Math.abs(vertex.y - next.y) < snapRadius) {
                vertex.y = next.y;
            }
        }
    },
    onHandleRemove: function(handle, evt) {
        var index = handle.options.index;
        var linkView = this.relatedView;
        linkView.model.removeVertex(index, { ui: true });
        if (this.options.vertexAdding) this.updatePath();
        linkView.checkMouseleave(util.normalizeEvent(evt));
    },
    onPathPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        var normalizedEvent = util.normalizeEvent(evt);
        var vertex = this.paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY).toJSON();
        var relatedView = this.relatedView;
        relatedView.model.startBatch('vertex-add', { ui: true, tool: this.cid });
        var index = relatedView.getVertexIndex(vertex.x, vertex.y);
        this.snapVertex(vertex, index);
        relatedView.model.insertVertex(index, vertex, { ui: true, tool: this.cid });
        this.render();
        var handle = this.handles[index];
        this.eventData(normalizedEvent, { vertexAdded: true });
        handle.onPointerDown(normalizedEvent);
    },
    onRemove: function() {
        this.resetHandles();
    }
}, {
    VertexHandle: VertexHandle // keep as class property
});

var SegmentHandle = mvc.View.extend({
    tagName: 'g',
    svgElement: true,
    className: 'marker-segment',
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown'
    },
    documentEvents: {
        mousemove: 'onPointerMove',
        touchmove: 'onPointerMove',
        mouseup: 'onPointerUp',
        touchend: 'onPointerUp',
        touchcancel: 'onPointerUp'
    },
    children: [{
        tagName: 'line',
        selector: 'line',
        attributes: {
            'stroke': '#33334F',
            'stroke-width': 2,
            'fill': 'none',
            'pointer-events': 'none'
        }
    }, {
        tagName: 'rect',
        selector: 'handle',
        attributes: {
            'width': 20,
            'height': 8,
            'x': -10,
            'y': -4,
            'rx': 4,
            'ry': 4,
            'fill': '#33334F',
            'stroke': '#FFFFFF',
            'stroke-width': 2
        }
    }],
    onRender: function() {
        this.renderChildren();
    },
    position: function(x, y, angle, view) {

        var matrix = V.createSVGMatrix().translate(x, y).rotate(angle);
        var handle = this.childNodes.handle;
        handle.setAttribute('transform', V.matrixToTransformString(matrix));
        handle.setAttribute('cursor', (angle % 180 === 0) ? 'row-resize' : 'col-resize');

        var viewPoint = view.getClosestPoint(new g.Point(x, y));
        var line = this.childNodes.line;
        line.setAttribute('x1', x);
        line.setAttribute('y1', y);
        line.setAttribute('x2', viewPoint.x);
        line.setAttribute('y2', viewPoint.y);
    },
    onPointerDown: function(evt) {
        if (this.options.guard(evt)) return;
        this.trigger('change:start', this, evt);
        evt.stopPropagation();
        evt.preventDefault();
        this.options.paper.undelegateEvents();
        this.delegateDocumentEvents(null, evt.data);
    },
    onPointerMove: function(evt) {
        this.trigger('changing', this, evt);
    },
    onPointerUp: function(evt) {
        this.undelegateDocumentEvents();
        this.options.paper.delegateEvents();
        this.trigger('change:end', this, evt);
    },
    show: function() {
        this.el.style.display = '';
    },
    hide: function() {
        this.el.style.display = 'none';
    }
});

var Segments = ToolView.extend({
    name: 'segments',
    precision: .5,
    options: {
        handleClass: SegmentHandle,
        segmentLengthThreshold: 40,
        redundancyRemoval: true,
        anchor: getAnchor,
        snapRadius: 10,
        snapHandle: true,
        stopPropagation: true
    },
    handles: null,
    onRender: function() {
        this.resetHandles();
        var relatedView = this.relatedView;
        var vertices = relatedView.model.vertices();
        vertices.unshift(relatedView.sourcePoint);
        vertices.push(relatedView.targetPoint);
        for (var i = 0, n = vertices.length; i < n - 1; i++) {
            var vertex = vertices[i];
            var nextVertex = vertices[i + 1];
            var handle = this.renderHandle(vertex, nextVertex);
            this.simulateRelatedView(handle.el);
            this.handles.push(handle);
            handle.options.index = i;
        }
        return this;
    },
    renderHandle: function(vertex, nextVertex) {
        var handle = new (this.options.handleClass)({
            paper: this.paper,
            guard: evt => this.guard(evt)
        });
        handle.render();
        this.updateHandle(handle, vertex, nextVertex);
        handle.vel.appendTo(this.el);
        this.startHandleListening(handle);
        return handle;
    },
    update: function() {
        this.render();
        return this;
    },
    startHandleListening: function(handle) {
        this.listenTo(handle, 'change:start', this.onHandleChangeStart);
        this.listenTo(handle, 'changing', this.onHandleChanging);
        this.listenTo(handle, 'change:end', this.onHandleChangeEnd);
    },
    resetHandles: function() {
        var handles = this.handles;
        this.handles = [];
        this.stopListening();
        if (!Array.isArray(handles)) return;
        for (var i = 0, n = handles.length; i < n; i++) {
            handles[i].remove();
        }
    },
    shiftHandleIndexes: function(value) {
        var handles = this.handles;
        for (var i = 0, n = handles.length; i < n; i++) handles[i].options.index += value;
    },
    resetAnchor: function(type, anchor) {
        var relatedModel = this.relatedView.model;
        if (anchor) {
            relatedModel.prop([type, 'anchor'], anchor, {
                rewrite: true,
                ui: true,
                tool: this.cid
            });
        } else {
            relatedModel.removeProp([type, 'anchor'], {
                ui: true,
                tool: this.cid
            });
        }
    },
    snapHandle: function(handle, position, data) {

        var index = handle.options.index;
        var linkView = this.relatedView;
        var link = linkView.model;
        var vertices = link.vertices();
        var axis = handle.options.axis;
        var prev = vertices[index - 2] || data.sourceAnchor;
        var next = vertices[index + 1] || data.targetAnchor;
        var snapRadius = this.options.snapRadius;
        if (Math.abs(position[axis] - prev[axis]) < snapRadius) {
            position[axis] = prev[axis];
        } else if (Math.abs(position[axis] - next[axis]) < snapRadius) {
            position[axis] = next[axis];
        }
        return position;
    },

    onHandleChanging: function(handle, evt) {

        const { options } = this;
        var data = this.eventData(evt);
        var relatedView = this.relatedView;
        var paper = relatedView.paper;
        var index = handle.options.index - 1;
        var normalizedEvent = util.normalizeEvent(evt);
        var coords = paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        var position = this.snapHandle(handle, coords.clone(), data);
        var axis = handle.options.axis;
        var offset = (this.options.snapHandle) ? 0 : (coords[axis] - position[axis]);
        var link = relatedView.model;
        var vertices = util.cloneDeep(link.vertices());
        var vertex = vertices[index];
        var nextVertex = vertices[index + 1];
        var anchorFn = this.options.anchor;
        if (typeof anchorFn !== 'function') anchorFn = null;

        // First Segment
        var sourceView = relatedView.sourceView;
        var sourceBBox = relatedView.sourceBBox;
        var changeSourceAnchor = false;
        var deleteSourceAnchor = false;
        if (!vertex) {
            vertex = relatedView.sourceAnchor.toJSON();
            vertex[axis] = position[axis];
            if (sourceBBox.containsPoint(vertex)) {
                vertex[axis] = position[axis];
                changeSourceAnchor = true;
            } else {
                // we left the area of the source magnet for the first time
                vertices.unshift(vertex);
                this.shiftHandleIndexes(1);
                deleteSourceAnchor = true;
            }
        } else if (index === 0) {
            if (sourceBBox.containsPoint(vertex)) {
                vertices.shift();
                this.shiftHandleIndexes(-1);
                changeSourceAnchor = true;
            } else {
                vertex[axis] = position[axis];
                deleteSourceAnchor = true;
            }
        } else {
            vertex[axis] = position[axis];
        }

        if (anchorFn && sourceView) {
            if (changeSourceAnchor) {
                var sourceAnchorPosition = data.sourceAnchor.clone();
                sourceAnchorPosition[axis] = position[axis];
                var sourceAnchor = anchorFn.call(relatedView, sourceAnchorPosition, sourceView, relatedView.sourceMagnet || sourceView.el, 'source', relatedView);
                this.resetAnchor('source', sourceAnchor);
            }
            if (deleteSourceAnchor) {
                this.resetAnchor('source', data.sourceAnchorDef);
            }
        }

        // Last segment
        var targetView = relatedView.targetView;
        var targetBBox = relatedView.targetBBox;
        var changeTargetAnchor = false;
        var deleteTargetAnchor = false;
        if (!nextVertex) {
            nextVertex = relatedView.targetAnchor.toJSON();
            nextVertex[axis] = position[axis];
            if (targetBBox.containsPoint(nextVertex)) {
                changeTargetAnchor = true;
            } else {
                // we left the area of the target magnet for the first time
                vertices.push(nextVertex);
                deleteTargetAnchor = true;
            }
        } else if (index === vertices.length - 2) {
            if (targetBBox.containsPoint(nextVertex)) {
                vertices.pop();
                changeTargetAnchor = true;
            } else {
                nextVertex[axis] = position[axis];
                deleteTargetAnchor = true;
            }
        } else {
            nextVertex[axis] = position[axis];
        }

        if (anchorFn && targetView) {
            if (changeTargetAnchor) {
                var targetAnchorPosition = data.targetAnchor.clone();
                targetAnchorPosition[axis] = position[axis];
                var targetAnchor = anchorFn.call(relatedView, targetAnchorPosition, targetView, relatedView.targetMagnet || targetView.el, 'target', relatedView);
                this.resetAnchor('target', targetAnchor);
            }
            if (deleteTargetAnchor) {
                this.resetAnchor('target', data.targetAnchorDef);
            }
        }

        link.vertices(vertices, { ui: true, tool: this.cid });
        this.updateHandle(handle, vertex, nextVertex, offset);
        if (!options.stopPropagation) relatedView.notifyPointermove(normalizedEvent, coords.x, coords.y);
    },
    onHandleChangeStart: function(handle, evt) {
        const { options, handles, relatedView: linkView } = this;
        const { model, paper } = linkView;
        var index = handle.options.index;
        if (!Array.isArray(handles)) return;
        for (var i = 0, n = handles.length; i < n; i++) {
            if (i !== index) handles[i].hide();
        }
        this.focus();
        this.eventData(evt, {
            sourceAnchor: linkView.sourceAnchor.clone(),
            targetAnchor: linkView.targetAnchor.clone(),
            sourceAnchorDef: util.clone(model.prop(['source', 'anchor'])),
            targetAnchorDef: util.clone(model.prop(['target', 'anchor']))
        });
        model.startBatch('segment-move', { ui: true, tool: this.cid });
        if (!options.stopPropagation) linkView.notifyPointerdown(...paper.getPointerArgs(evt));
    },
    onHandleChangeEnd: function(_handle, evt) {
        const { options, relatedView: linkView }= this;
        const { paper, model } = linkView;
        if (options.redundancyRemoval) {
            linkView.removeRedundantLinearVertices({ ui: true, tool: this.cid });
        }
        const normalizedEvent = util.normalizeEvent(evt);
        const coords = paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        this.render();
        this.blur();
        model.stopBatch('segment-move', { ui: true, tool: this.cid });
        if (!options.stopPropagation) linkView.notifyPointerup(normalizedEvent, coords.x, coords.y);
        linkView.checkMouseleave(normalizedEvent);
    },
    updateHandle: function(handle, vertex, nextVertex, offset) {
        var vertical = Math.abs(vertex.x - nextVertex.x) < this.precision;
        var horizontal = Math.abs(vertex.y - nextVertex.y) < this.precision;
        if (vertical || horizontal) {
            var segmentLine = new g.Line(vertex, nextVertex);
            var length = segmentLine.length();
            if (length < this.options.segmentLengthThreshold) {
                handle.hide();
            } else {
                var position = segmentLine.midpoint();
                var axis = (vertical) ? 'x' : 'y';
                position[axis] += offset || 0;
                var angle = segmentLine.vector().vectorAngle(new g.Point(1, 0));
                handle.position(position.x, position.y, angle, this.relatedView);
                handle.show();
                handle.options.axis = axis;
            }
        } else {
            handle.hide();
        }
    },
    onRemove: function() {
        this.resetHandles();
    }
}, {
    SegmentHandle: SegmentHandle // keep as class property
});

// End Markers
var Arrowhead = ToolView.extend({
    tagName: 'path',
    xAxisVector: new g.Point(1, 0),
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown'
    },
    documentEvents: {
        mousemove: 'onPointerMove',
        touchmove: 'onPointerMove',
        mouseup: 'onPointerUp',
        touchend: 'onPointerUp',
        touchcancel: 'onPointerUp'
    },
    onRender: function() {
        this.update();
    },
    update: function() {
        var ratio = this.ratio;
        var view = this.relatedView;
        var tangent = view.getTangentAtRatio(ratio);
        var position, angle;
        if (tangent) {
            position = tangent.start;
            angle = tangent.vector().vectorAngle(this.xAxisVector) || 0;
        } else {
            position = view.getPointAtRatio(ratio);
            angle = 0;
        }
        if (!position) return this;
        var matrix = V.createSVGMatrix().translate(position.x, position.y).rotate(angle);
        this.vel.transform(matrix, { absolute: true });
        return this;
    },
    onPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        var relatedView = this.relatedView;
        relatedView.model.startBatch('arrowhead-move', { ui: true, tool: this.cid });
        if (relatedView.can('arrowheadMove')) {
            relatedView.startArrowheadMove(this.arrowheadType);
            this.delegateDocumentEvents();
            relatedView.paper.undelegateEvents();
        }
        this.focus();
        this.el.style.pointerEvents = 'none';
    },
    onPointerMove: function(evt) {
        var normalizedEvent = util.normalizeEvent(evt);
        var coords = this.paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        this.relatedView.pointermove(normalizedEvent, coords.x, coords.y);
    },
    onPointerUp: function(evt) {
        this.undelegateDocumentEvents();
        var relatedView = this.relatedView;
        var paper = relatedView.paper;
        var normalizedEvent = util.normalizeEvent(evt);
        var coords = paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        relatedView.pointerup(normalizedEvent, coords.x, coords.y);
        paper.delegateEvents();
        this.blur();
        this.el.style.pointerEvents = '';
        relatedView.model.stopBatch('arrowhead-move', { ui: true, tool: this.cid });
    }
});

var TargetArrowhead = Arrowhead.extend({
    name: 'target-arrowhead',
    ratio: 1,
    arrowheadType: 'target',
    attributes: {
        'd': 'M -10 -8 10 0 -10 8 Z',
        'fill': '#33334F',
        'stroke': '#FFFFFF',
        'stroke-width': 2,
        'cursor': 'move',
        'class': 'target-arrowhead'
    }
});

var SourceArrowhead = Arrowhead.extend({
    name: 'source-arrowhead',
    ratio: 0,
    arrowheadType: 'source',
    attributes: {
        'd': 'M 10 -8 -10 0 10 8 Z',
        'fill': '#33334F',
        'stroke': '#FFFFFF',
        'stroke-width': 2,
        'cursor': 'move',
        'class': 'source-arrowhead'
    }
});

var Button = ToolView.extend({
    name: 'button',
    events: {
        'mousedown': 'onPointerDown',
        'touchstart': 'onPointerDown'
    },
    options: {
        distance: 0,
        offset: 0,
        rotate: false
    },
    onRender: function() {
        this.renderChildren(this.options.markup);
        this.update();
    },
    update: function() {
        this.position();
        return this;
    },
    position: function() {
        const { relatedView: view, vel } = this;
        const matrix = view.model.isLink() ? this.getLinkMatrix() : this.getElementMatrix();
        vel.transform(matrix, { absolute: true });
    },
    getElementMatrix() {
        const { relatedView: view, options } = this;
        let { x = 0, y = 0, offset = {}, useModelGeometry, rotate } = options;
        let bbox = getViewBBox(view, useModelGeometry);
        const angle = view.model.angle();
        if (!rotate) bbox = bbox.bbox(angle);
        const { x: offsetX = 0, y: offsetY = 0 } = offset;
        if (util.isPercentage(x)) {
            x = parseFloat(x) / 100 * bbox.width;
        }
        if (util.isPercentage(y)) {
            y = parseFloat(y) / 100 * bbox.height;
        }
        let matrix = V.createSVGMatrix().translate(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        if (rotate) matrix = matrix.rotate(angle);
        matrix = matrix.translate(x + offsetX - bbox.width / 2, y + offsetY - bbox.height / 2);
        return matrix;
    },
    getLinkMatrix() {
        const { relatedView: view, options } = this;
        const { offset = 0, distance = 0, rotate } = options;
        let tangent, position, angle;
        if (util.isPercentage(distance)) {
            tangent = view.getTangentAtRatio(parseFloat(distance) / 100);
        } else {
            tangent = view.getTangentAtLength(distance);
        }
        if (tangent) {
            position = tangent.start;
            angle = tangent.vector().vectorAngle(new g.Point(1, 0)) || 0;
        } else {
            position = view.getConnection().start;
            angle = 0;
        }
        let matrix = V.createSVGMatrix()
            .translate(position.x, position.y)
            .rotate(angle)
            .translate(0, offset);
        if (!rotate) matrix = matrix.rotate(-angle);
        return matrix;
    },
    onPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        var actionFn = this.options.action;
        if (typeof actionFn === 'function') {
            actionFn.call(this.relatedView, evt, this.relatedView, this);
        }
    }
});


var Remove = Button.extend({
    children: [{
        tagName: 'circle',
        selector: 'button',
        attributes: {
            'r': 7,
            'fill': '#FF1D00',
            'cursor': 'pointer'
        }
    }, {
        tagName: 'path',
        selector: 'icon',
        attributes: {
            'd': 'M -3 -3 3 3 M -3 3 3 -3',
            'fill': 'none',
            'stroke': '#FFFFFF',
            'stroke-width': 2,
            'pointer-events': 'none'
        }
    }],
    options: {
        distance: 60,
        offset: 0,
        action: function(evt, view, tool) {
            view.model.remove({ ui: true, tool: tool.cid });
        }
    }
});

var Boundary = ToolView.extend({
    name: 'boundary',
    tagName: 'rect',
    options: {
        padding: 10,
        useModelGeometry: false,
    },
    attributes: {
        'fill': 'none',
        'stroke': '#33334F',
        'stroke-width': .5,
        'stroke-dasharray': '5, 5',
        'pointer-events': 'none'
    },
    onRender: function() {
        this.update();
    },
    update: function() {
        const { relatedView: view, options, vel } = this;
        const { useModelGeometry, rotate } = options;
        const padding = util.normalizeSides(options.padding);
        let bbox = getViewBBox(view, useModelGeometry).moveAndExpand({
            x: -padding.left,
            y: -padding.top,
            width: padding.left + padding.right,
            height: padding.top + padding.bottom
        });
        var model = view.model;
        if (model.isElement()) {
            var angle = model.angle();
            if (angle) {
                if (rotate) {
                    var origin = model.getBBox().center();
                    vel.rotate(angle, origin.x, origin.y, { absolute: true });
                } else {
                    bbox = bbox.bbox(angle);
                }
            }
        }
        vel.attr(bbox.toJSON());
        return this;
    }
});

var Anchor = ToolView.extend({
    tagName: 'g',
    type: null,
    children: [{
        tagName: 'circle',
        selector: 'anchor',
        attributes: {
            'cursor': 'pointer'
        }
    }, {
        tagName: 'rect',
        selector: 'area',
        attributes: {
            'pointer-events': 'none',
            'fill': 'none',
            'stroke': '#33334F',
            'stroke-dasharray': '2,4',
            'rx': 5,
            'ry': 5
        }
    }],
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown',
        dblclick: 'onPointerDblClick'
    },
    documentEvents: {
        mousemove: 'onPointerMove',
        touchmove: 'onPointerMove',
        mouseup: 'onPointerUp',
        touchend: 'onPointerUp',
        touchcancel: 'onPointerUp'
    },
    options: {
        snap: snapAnchor,
        anchor: getAnchor,
        resetAnchor: true,
        customAnchorAttributes: {
            'stroke-width': 4,
            'stroke': '#33334F',
            'fill': '#FFFFFF',
            'r': 5
        },
        defaultAnchorAttributes: {
            'stroke-width': 2,
            'stroke': '#FFFFFF',
            'fill': '#33334F',
            'r': 6
        },
        areaPadding: 6,
        snapRadius: 10,
        restrictArea: true,
        redundancyRemoval: true
    },
    onRender: function() {
        this.renderChildren();
        this.toggleArea(false);
        this.update();
    },
    update: function() {
        var type = this.type;
        var relatedView = this.relatedView;
        var view = relatedView.getEndView(type);
        if (view) {
            this.updateAnchor();
            this.updateArea();
            this.el.style.display = '';
        } else {
            this.el.style.display = 'none';
        }
        return this;
    },
    updateAnchor: function() {
        var childNodes = this.childNodes;
        if (!childNodes) return;
        var anchorNode = childNodes.anchor;
        if (!anchorNode) return;
        var relatedView = this.relatedView;
        var type = this.type;
        var position = relatedView.getEndAnchor(type);
        var options = this.options;
        var customAnchor = relatedView.model.prop([type, 'anchor']);
        anchorNode.setAttribute('transform', 'translate(' + position.x + ',' + position.y + ')');
        var anchorAttributes = (customAnchor) ? options.customAnchorAttributes : options.defaultAnchorAttributes;
        for (var attrName in anchorAttributes) {
            anchorNode.setAttribute(attrName, anchorAttributes[attrName]);
        }
    },
    updateArea: function() {
        var childNodes = this.childNodes;
        if (!childNodes) return;
        var areaNode = childNodes.area;
        if (!areaNode) return;
        var relatedView = this.relatedView;
        var type = this.type;
        var view = relatedView.getEndView(type);
        var model = view.model;
        var magnet = relatedView.getEndMagnet(type);
        var padding = this.options.areaPadding;
        if (!isFinite(padding)) padding = 0;
        var bbox, angle, center;
        if (view.isNodeConnection(magnet)) {
            bbox = view.getBBox();
            angle = 0;
            center = bbox.center();
        } else {
            bbox = view.getNodeUnrotatedBBox(magnet);
            angle = model.angle();
            center = bbox.center();
            if (angle) center.rotate(model.getBBox().center(), -angle);
            // TODO: get the link's magnet rotation into account
        }
        bbox.inflate(padding);
        areaNode.setAttribute('x', -bbox.width / 2);
        areaNode.setAttribute('y', -bbox.height / 2);
        areaNode.setAttribute('width', bbox.width);
        areaNode.setAttribute('height', bbox.height);
        areaNode.setAttribute('transform', 'translate(' + center.x + ',' + center.y + ') rotate(' + angle + ')');
    },
    toggleArea: function(visible) {
        this.childNodes.area.style.display = (visible) ? '' : 'none';
    },
    onPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        this.paper.undelegateEvents();
        this.delegateDocumentEvents();
        this.focus();
        this.toggleArea(this.options.restrictArea);
        this.relatedView.model.startBatch('anchor-move', { ui: true, tool: this.cid });
    },
    resetAnchor: function(anchor) {
        var type = this.type;
        var relatedModel = this.relatedView.model;
        if (anchor) {
            relatedModel.prop([type, 'anchor'], anchor, {
                rewrite: true,
                ui: true,
                tool: this.cid
            });
        } else {
            relatedModel.removeProp([type, 'anchor'], {
                ui: true,
                tool: this.cid
            });
        }
    },
    onPointerMove: function(evt) {

        var relatedView = this.relatedView;
        var type = this.type;
        var view = relatedView.getEndView(type);
        var model = view.model;
        var magnet = relatedView.getEndMagnet(type);
        var normalizedEvent = util.normalizeEvent(evt);
        var coords = this.paper.clientToLocalPoint(normalizedEvent.clientX, normalizedEvent.clientY);
        var snapFn = this.options.snap;
        if (typeof snapFn === 'function') {
            coords = snapFn.call(relatedView, coords, view, magnet, type, relatedView, this);
            coords = new g.Point(coords);
        }

        if (this.options.restrictArea) {
            if (view.isNodeConnection(magnet)) {
                // snap coords to the link's connection
                var pointAtConnection = view.getClosestPoint(coords);
                if (pointAtConnection) coords = pointAtConnection;
            } else {
                // snap coords within node bbox
                var bbox = view.getNodeUnrotatedBBox(magnet);
                var angle = model.angle();
                var origin = model.getBBox().center();
                var rotatedCoords = coords.clone().rotate(origin, angle);
                if (!bbox.containsPoint(rotatedCoords)) {
                    coords = bbox.pointNearestToPoint(rotatedCoords).rotate(origin, -angle);
                }
            }
        }

        var anchor;
        var anchorFn = this.options.anchor;
        if (typeof anchorFn === 'function') {
            anchor = anchorFn.call(relatedView, coords, view, magnet, type, relatedView);
        }

        this.resetAnchor(anchor);
        this.update();
    },

    onPointerUp: function(evt) {
        this.paper.delegateEvents();
        this.undelegateDocumentEvents();
        this.blur();
        this.toggleArea(false);
        var linkView = this.relatedView;
        if (this.options.redundancyRemoval) linkView.removeRedundantLinearVertices({ ui: true, tool: this.cid });
        linkView.model.stopBatch('anchor-move', { ui: true, tool: this.cid });
    },

    onPointerDblClick: function() {
        var anchor = this.options.resetAnchor;
        if (anchor === false) return; // reset anchor disabled
        if (anchor === true) anchor = null; // remove the current anchor
        this.resetAnchor(util.cloneDeep(anchor));
        this.update();
    }
});

var SourceAnchor = Anchor.extend({
    name: 'source-anchor',
    type: 'source'
});

var TargetAnchor = Anchor.extend({
    name: 'target-anchor',
    type: 'target'
});

export { Vertices, Segments, SourceArrowhead, TargetArrowhead, SourceAnchor, TargetAnchor, Button, Remove, Boundary };
