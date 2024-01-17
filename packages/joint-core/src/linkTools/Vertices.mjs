import * as g from '../g/index.mjs';
import * as util from '../util/index.mjs';
import * as mvc from '../mvc/index.mjs';
import { ToolView } from '../dia/ToolView.mjs';
import V from '../V/index.mjs';


// Vertex Handles
var VertexHandle = mvc.View.extend({
    tagName: 'circle',
    svgElement: true,
    className: 'marker-vertex',
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown',
        dblclick: 'onDoubleClick',
        dbltap: 'onDoubleClick'
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
        const { vel, options } = this;
        const { scale } = options;
        let matrix = V.createSVGMatrix().translate(x, y);
        if (scale) matrix = matrix.scale(scale);
        vel.transform(matrix, { absolute: true });
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

export const Vertices = ToolView.extend({
    name: 'vertices',
    options: {
        handleClass: VertexHandle,
        snapRadius: 20,
        redundancyRemoval: true,
        vertexAdding: true,
        stopPropagation: true,
        scale: null
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
                scale: this.options.scale,
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
        const { vertexRemoving = true, vertexMoving = true } = this.options;
        if (vertexMoving) {
            this.listenTo(handle, 'will-change', this.onHandleWillChange);
            this.listenTo(handle, 'changing', this.onHandleChanging);
            this.listenTo(handle, 'changed', this.onHandleChanged);
        }
        if (vertexRemoving) {
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
        if (!options.redundancyRemoval) {
            linkView.checkMouseleave(util.normalizeEvent(evt));
            return;
        }
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
        this.update();
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
