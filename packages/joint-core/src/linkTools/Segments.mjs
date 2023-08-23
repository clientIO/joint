import * as g from '../g/index.mjs';
import V from '../V/index.mjs';
import * as util from '../util/index.mjs';
import * as mvc from '../mvc/index.mjs';
import { ToolView } from '../dia/ToolView.mjs';
import { getAnchor } from './helpers.mjs';

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
        const { scale } = this.options;
        let matrix = V.createSVGMatrix().translate(x, y).rotate(angle);
        if (scale) matrix = matrix.scale(scale);

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

export const Segments = ToolView.extend({
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
            scale: this.options.scale,
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
        var anchorFn = this.options.anchor;
        if (typeof anchorFn !== 'function') anchorFn = null;

        const handleIndex = handle.options.index;

        const vertexPoints = [relatedView.sourcePoint.clone(), ...vertices, relatedView.targetPoint.clone()];
        let indexOffset = 0;

        // check if vertex before handle vertex exists
        if (handleIndex - 1 >= 0) {
            const v1 = vertexPoints[handleIndex - 1];
            const v2 = vertexPoints[handleIndex];

            const theta = new g.Line(v1, v2).vector().theta();

            // check only non-orthogonal segments
            if (theta % 90 !== 0) {
                vertices.splice(handleIndex - 1, 0, data.originalVertices[handleIndex - 1]);
                indexOffset++;
                this.shiftHandleIndexes(1);
            }
        }

        var vertex = vertices[index + indexOffset];
        var nextVertex = vertices[index + 1 + indexOffset];

        // check if vertex after handle vertex exists
        if (handleIndex + 2 < vertexPoints.length) {
            const v1 = vertexPoints[handleIndex + 1];
            const v2 = vertexPoints[handleIndex + 2];

            const theta = new g.Line(v1, v2).vector().theta();

            // check only non-orthogonal segments
            if (theta % 90 !== 0) {
                const isSingleVertex = data.originalVertices.length === 1;
                const origVIndex = isSingleVertex ? 0 : handleIndex;
                const additionalOffset = data.firstHandleShifted && !isSingleVertex ? 1 : 0;
                let nextVIndex = 1 + indexOffset;
                vertices.splice(handleIndex + nextVIndex, 0, data.originalVertices[origVIndex - additionalOffset]);
            }
        }

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
                data.firstHandleShifted = true;
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
        if (vertices.some(v => !v)) {
            // This can happen when the link is using a smart routing and the number of
            // vertices is not the same as the number of route points.
            throw new Error('Segments: incompatible router in use');
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
            targetAnchorDef: util.clone(model.prop(['target', 'anchor'])),
            originalVertices: util.cloneDeep(model.vertices()),
            firstHandleShifted: false
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
