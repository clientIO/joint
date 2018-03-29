(function (joint, util, V, g) {

    var ToolView = joint.dia.ToolView;

    // Vertex Handles
    var VertexHandle = joint.mvc.View.extend({
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
            touchend: 'onPointerUp'
        },
        attributes: {
            'r': 7,
            'fill': '#FFFFFF',
            'stroke': '#1ABC9C',
            'stroke-width': 2,
            'cursor': 'move'
        },
        position: function (x, y) {
            this.vel.attr({ cx: x, cy: y });
        },
        onPointerDown: function (evt) {
            evt.stopPropagation();
            this.options.paper.undelegateEvents();
            this.delegateDocumentEvents();
            this.trigger('will-change');
        },
        onPointerMove: function (evt) {
            this.trigger('changing', this, evt);
        },
        onDoubleClick: function (evt) {
            this.trigger('remove', this, evt);
        },
        onPointerUp: function (evt) {
            this.trigger('changed', this, evt);
            this.undelegateDocumentEvents();
            this.options.paper.delegateEvents();
        }
    });

    var Vertices = ToolView.extend({
        options: {
            HandleClass: VertexHandle,
            snapRadius: 10,
            redundancyRemoval: true,
            vertexAdding: true,
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
            'mousedown .joint-vertices-path': 'onPathPointerDown'
        },
        onRender: function () {
            this.resetHandles();
            if (this.options.vertexAdding) {
                this.renderChildren();
                this.updatePath();
            }
            var relatedView = this.relatedView;
            var vertices = relatedView.model.vertices();
            for (var i = 0, n = vertices.length; i < n; i++) {
                var vertex = vertices[i];
                var handle = new (this.options.HandleClass)({ index: i, paper: this.paper });
                handle.render();
                handle.position(vertex.x, vertex.y);
                handle.vel.appendTo(this.el);
                this.handles.push(handle);
                this.startHandleListening(handle);
            }
            return this;
        },
        update: function () {
            this.render();
        },
        updatePath: function () {

            var connection = this.childNodes.connection;
            if (connection) connection.setAttribute('d', this.relatedView.getConnection().serialize());
        },
        startHandleListening: function (handle) {
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
        resetHandles: function () {
            var handles = this.handles;
            this.handles = [];
            this.stopListening();
            if (!Array.isArray(handles)) return;
            for (var i = 0, n = handles.length; i < n; i++) {
                handles[i].remove();
            }
        },
        getNeighborPoints: function (index) {
            var linkView = this.relatedView;
            var vertices = linkView.model.vertices();
            var prev = (index > 0) ? vertices[index - 1] : linkView.sourceAnchor;
            var next = (index < vertices.length - 1) ? vertices[index + 1] : linkView.targetAnchor;
            return {
                prev: new g.Point(prev),
                next: new g.Point(next)
            }
        },
        onHandleWillChange: function (handle, evt) {
            this.activate();
        },
        onHandleChanging: function (handle, evt) {
            var relatedView = this.relatedView;
            var paper = relatedView.paper;
            var index = handle.options.index;
            var vertex = paper.snapToGrid(evt.clientX, evt.clientY).toJSON();
            var link = relatedView.model;
            var snapRadius = this.options.snapRadius;
            if (snapRadius > 0) {
                var neighbors = this.getNeighborPoints(index);
                if (Math.abs(vertex.x - neighbors.prev.x) < snapRadius) {
                    vertex.x = neighbors.prev.x;
                } else if (Math.abs(vertex.x - neighbors.next.x) < snapRadius) {
                    vertex.x = neighbors.next.x;
                }

                if (Math.abs(vertex.y - neighbors.prev.y) < snapRadius) {
                    vertex.y = neighbors.prev.y;
                } else if (Math.abs(vertex.y - neighbors.next.y) < snapRadius) {
                    vertex.y = neighbors.next.y;
                }
            }
            link.vertex(index, vertex, { ui: true, tool: this.cid });
            handle.position(vertex.x, vertex.y);
        },
        onHandleChanged: function (handle, evt) {
            if (this.options.vertexAdding) this.updatePath();
            if (!this.options.redundancyRemoval) return;
            var verticesRemoved = this.relatedView.removeRedundantLinearVertices({ ui: true, tool: this.cid });
            if (verticesRemoved) this.render();
            this.deactivate();
        },
        onHandleRemove: function (handle) {
            var index = handle.options.index;
            this.relatedView.model.removeVertex(index, { ui: true });
        },
        onPathPointerDown: function (evt) {
            evt.stopPropagation();
            var vertex = paper.snapToGrid(evt.clientX, evt.clientY).toJSON();
            var index = this.relatedView.addVertex(vertex, { ui: true, tool: this.cid });
            this.render();
            var handle = this.handles[index];
            handle.onPointerDown(evt);
        },
        onRemove: function () {
            this.resetHandles();
        }
    });


    var SegmentHandle = joint.mvc.View.extend({
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
            touchend: 'onPointerUp'
        },
        children: [{
            tagName: 'line',
            selector: 'line',
            attributes: {
                'stroke': '#1ABC9C',
                'stroke-dasharray': '1,1',
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
                'rx': 2,
                'ry': 2,
                'fill': '#FFFFFF',
                'stroke': '#1ABC9C',
                'stroke-width': 2
            }
        }],
        onRender: function() {
            this.renderChildren();
        },
        position: function (x, y, angle, view) {

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
        onPointerDown: function (evt) {
            this.trigger('change:start', this, evt);
            evt.stopPropagation();
            this.options.paper.undelegateEvents();
            this.delegateDocumentEvents();
        },
        onPointerMove: function (evt) {
            this.trigger('changing', this, evt);
        },
        onPointerUp: function (evt) {
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
        options: {
            HandleClass: SegmentHandle,
            segmentLenghtThreshold: 40,
            redundancyRemoval: true
        },
        handels: null,
        onRender: function () {
            this.resetHandles();
            var relatedView = this.relatedView;
            var vertices = relatedView.model.vertices();
            vertices.unshift(relatedView.sourcePoint);
            vertices.push(relatedView.targetPoint);
            for (var i = 0, n = vertices.length; i < n - 1; i++) {
                var vertex = vertices[i];
                var nextVertex = vertices[i + 1];
                var handle = this.renderHandle(vertex, nextVertex);
                this.handles.push(handle);
                handle.options.index = i;
            }
            return this;
        },
        renderHandle: function(vertex, nextVertex) {
            var handle = new (this.options.HandleClass)({ paper: this.paper });
            handle.render();
            this.updateHandle(handle, vertex, nextVertex);
            handle.vel.appendTo(this.el);
            this.startHandleListening(handle);
            return handle;
        },
        update: function () {
            this.render();
            return this;
        },
        startHandleListening: function (handle) {
            this.listenTo(handle, 'change:start', this.onHandleChangeStart);
            this.listenTo(handle, 'changing', this.onHandleChanging);
            this.listenTo(handle, 'change:end', this.onHandleChangeEnd);
        },
        resetHandles: function () {
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

        onHandleChanging: function (handle, evt) {

            var relatedView = this.relatedView;
            var paper = relatedView.paper;
            var index = handle.options.index - 1;
            var position = paper.snapToGrid(evt.clientX, evt.clientY);
            var link = relatedView.model;
            var vertices = util.cloneDeep(link.vertices());
            var vertex = vertices[index];
            var nextVertex = vertices[index + 1];
            var axis = handle.options.axis;

            if (!vertex) {
                vertex = relatedView.sourceAnchor.toJSON();
                vertex[axis] = position[axis];
                if (relatedView.sourceBBox.containsPoint(vertex)) {
                    vertex[axis] = position[axis];
                } else {
                    vertices.unshift(vertex);
                    this.shiftHandleIndexes(1);
                }
            } else if (index === 0) {
                if (relatedView.sourceBBox.containsPoint(vertex)) {
                    vertices.shift();
                    this.shiftHandleIndexes(-1);
                } else {
                    vertex[axis] = position[axis];
                }
            } else {
                vertex[axis] = position[axis];
            }

            if (!nextVertex) {
                nextVertex = relatedView.targetAnchor.toJSON();
                nextVertex[axis] = position[axis];
                if (relatedView.targetBBox.containsPoint(nextVertex)) {
                    nextVertex[axis] = position[axis];
                } else {
                    vertices.push(nextVertex);
                }
            } else if (index === vertices.length - 2) {
                if (relatedView.targetBBox.containsPoint(nextVertex)) {
                    vertices.pop();
                } else {
                    nextVertex[axis] = position[axis];
                }
            } else {
                nextVertex[axis] = position[axis];
            }

            link.vertices(vertices, { ui: true, tool: this.cid });
            this.updateHandle(handle, vertex, nextVertex);
        },
        onHandleChangeStart: function (handle) {
            var index = handle.options.index;
            var handles = this.handles;
            if (!Array.isArray(handles)) return;
            for (var i = 0, n = handles.length; i < n; i++) {
                if (i !== index) handles[i].hide()
            }
            this.activate();
        },
        onHandleChangeEnd: function (handle) {
            if (this.options.redundancyRemoval) {
                this.relatedView.removeRedundantLinearVertices({ ui: true, tool: this.cid });
            }
            this.render();
            this.deactivate();
        },
        updateHandle: function (handle, vertex, nextVertex) {
            var vertical = Math.abs(vertex.x - nextVertex.x) < 1e-3;
            var horizontal = Math.abs(vertex.y - nextVertex.y) < 1e-3;
            if (vertical || horizontal) {
                var segmentLine = new g.Line(vertex, nextVertex);
                var length = segmentLine.length();
                if (length < this.options.segmentLenghtThreshold) {
                    handle.hide();
                } else {
                    var position = segmentLine.midpoint();
                    var angle = segmentLine.vector().vectorAngle(new g.Point(1, 0));
                    handle.position(position.x, position.y, angle, this.relatedView);
                    handle.show();
                    handle.options.axis = (vertical) ? 'x' : 'y';
                }
            } else {
                handle.hide();
            }
        },
        onRemove: function () {
            this.resetHandles();
        }
    });

    // End Markers
    var Arrowhead = ToolView.extend({
        tagName: 'path',
        xAxisVector: g.Point(1, 0),
        events: {
            mousedown: 'onPointerDown',
            touchstart: 'onPointerDown'
        },
        documentEvents: {
            mousemove: 'onPointerMove',
            touchmove: 'onPointerMove',
            mouseup: 'onPointerUp',
            touchend: 'onPointerUp'
        },
        onRender: function () {
            this.update()
        },
        update: function () {
            var ratio = this.ratio;
            var view = this.relatedView;
            var tangent = view.getTangentAtRatio(ratio);
            var position, angle;
            if (tangent) {
                position = tangent.start;
                angle = tangent.vector().vectorAngle(this.xAxisVector);
            } else {
                position = view.getPointAtRatio(ratio);
                angle = 0;
            }
            var matrix = V.createSVGMatrix().translate(position.x, position.y).rotate(angle);
            this.vel.transform(matrix, { absolute: true });
        },
        onPointerDown: function (evt) {
            evt.stopPropagation();
            var relatedView = this.relatedView;
            if (relatedView.can('arrowheadMove')) {
                relatedView.startArrowheadMove(this.arrowheadType);
                this.delegateDocumentEvents();
                relatedView.paper.undelegateEvents();
            }
            this.activate();
        },
        onPointerMove: function (evt) {
            var coords = paper.snapToGrid(evt.clientX, evt.clientY);
            this.relatedView.pointermove(evt, coords.x, coords.y);
        },
        onPointerUp: function (evt) {
            this.undelegateDocumentEvents();
            var relatedView = this.relatedView;
            var paper = relatedView.paper;
            var coords = paper.snapToGrid(evt.clientX, evt.clientY);
            relatedView.pointerup(evt, coords.x, coords.y);
            paper.delegateEvents();
            this.deactivate();
        }
    });

    var TargetArrowhead = Arrowhead.extend({
        ratio: 1,
        arrowheadType: 'target',
        attributes: {
            'd': 'M -20 -10 0 0 -20 10 Z',
            'fill': '#FFFFFF',
            'stroke': '#1ABC9C',
            'stroke-width': 2,
            'cursor': 'move',
            'class': 'source-arrowhead'
        }
    });

    var SourceArrowhead = Arrowhead.extend({
        ratio: 0,
        arrowheadType: 'source',
        attributes: {
            'd': 'M 20 -10 0 0 20 10 Z',
            'fill': '#FFFFFF',
            'stroke': '#1ABC9C',
            'stroke-width': 2,
            'cursor': 'move',
            'class': 'target-arrowhead'
        }
    });

    var Button = ToolView.extend({
        events: {
            'mousedown': 'onPointerDown',
            'touchstart': 'onPointerDown'
        },
        children: [{
            tagName: 'circle',
            selector: 'button',
            attributes: {
                'r': 7,
                'fill': '#FFFFFF',
                'stroke': '#333333',
                'stroke-width': 2,
                'cursor': 'pointer',
                'cx': 0,
                'cy': 0
            }
        }],
        options: {
            distance: 0,
            offset: 0
        },
        onRender: function () {
            this.renderChildren();
            this.update()
        },
        update: function () {
            var tangent, position, angle;
            var distance = this.options.distance || 0;
            if (util.isPercentage(distance)) {
                tangent = this.relatedView.getTangentAtRatio(parseFloat(distance) / 100);
            } else {
                tangent = this.relatedView.getTangentAtLength(distance)
            }
            if (tangent) {
                position = tangent.start;
                angle = tangent.vector().vectorAngle(new g.Point(1,0));
            } else {
                position = this.relatedView.getConnection().start;
                angle = 0;
            }
            var matrix = V.createSVGMatrix()
                .translate(position.x, position.y)
                .rotate(angle)
                .translate(0, this.options.offset || 0);
            this.vel.transform(matrix, { absolute: true });
        },
        onPointerDown: function (evt) {
            evt.stopPropagation();
            var action = this.options.action;
            if (typeof action === 'function') {
                action.call(this.relatedView, evt, this.relatedView);
            }
        }
    });


    var Remove = Button.extend({
        children: [{
            tagName: 'circle',
            selector: 'button',
            attributes: {
                'r': 7,
                'fill': '#FFFFFF',
                'stroke': '#F34612',
                'stroke-width': 2,
                'cursor': 'pointer'
            }
        }, {
            tagName: 'path',
            selector: 'icon',
            attributes: {
                'd': 'M -3 -3 3 3 M -3 3 3 -3',
                'fill': 'none',
                'stroke': '#F34612',
                'stroke-width': 1,
                'pointer-events': 'none'
            }
        }],
        options: {
            distance: 60,
            offset: 0,
            action: function(evt) {
                this.model.remove({ ui: true, tool: this.cid });
            }
        }
    });

    var Boundary = ToolView.extend({
        tagName: 'rect',
        options: {
            padding: 10
        },
        attributes: {
            'fill': 'none',
            'stroke': '#1ABC9C',
            'stroke-width': .5,
            'stroke-dasharray': '5, 5',
            'pointer-events': 'none'
        },
        onRender: function () {
            this.update();
        },
        update: function () {
            var bbox = this.relatedView.getConnection().bbox().inflate(this.options.padding);
            this.vel.attr(bbox.toJSON());
        }
    });

    var Anchor = ToolView.extend({
        tagName: 'circle',
        type: null,
        attributes: {
            'r': 6,
            'fill': '#F34612',
            'stroke': '#FFFFFF',
            'stroke-width': 2,
            'cursor': 'pointer'
        },
        events: {
            mousedown: 'onPointerDown',
            touchstart: 'onPointerDown'
        },
        documentEvents: {
            mousemove: 'onPointerMove',
            touchmove: 'onPointerMove',
            mouseup: 'onPointerUp',
            touchend: 'onPointerUp'
        },
        options: {
            snap: function(coords, view, magnet) {
                var bbox = view.getNodeUnrotatedBBox(magnet);
                var angle = view.model.angle();
                var origin = view.model.getBBox().center();
                var rotatedCoords = coords.clone().rotate(origin, angle);
                if (bbox.containsPoint(rotatedCoords)) return coords;
                return bbox.pointNearestToPoint(rotatedCoords).rotate(origin, -angle);
            },
            anchor: function(coords, view, magnet) {
                // take advantage of an existing logic inside of the
                // pin relative connection strategy
                var end = joint.connectionStrategies.pinRelative.call(
                    this.paper,
                    {},
                    view,
                    magnet,
                    coords,
                    this.model
                );
                return end.anchor;
            }
        },
        onRender: function() {
            this.update();
        },
        update: function() {
            var type = this.type;
            var view = this.relatedView;
            var position = view[type + 'Anchor'];
            this.el.setAttribute('transform', 'translate(' + position.x + ',' + position.y + ')');
            this.el.style.visibility = (view[type + 'View']) ? '' : 'hidden';
        },
        onPointerDown: function(evt) {
            evt.stopPropagation();
            this.paper.undelegateEvents();
            this.delegateDocumentEvents();
        },
        onPointerMove: function(evt) {
            var relatedView = this.relatedView;
            var relatedModel = relatedView.model;
            var type = this.type;
            var coords = this.paper.clientToLocalPoint(evt.clientX, evt.clientY);
            var view = relatedView[type + 'View'];
            var magnet = relatedView[type + 'Magnet'] || view.el;
            var snapFn = this.options.snap;
            if (typeof snapFn === 'function') {
                coords = snapFn.call(relatedView, coords, view, magnet, type, relatedView);
            }
            var anchor;
            var anchorFn = this.options.anchor;
            if (typeof anchorFn === 'function') {
                anchor = anchorFn.call(relatedView, coords, view, magnet, type, relatedView);
            }
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
            this.update();
        },
        onPointerUp: function(evt) {
            this.paper.delegateEvents();
            this.undelegateDocumentEvents();
        }
    });

    var SourceAnchor = Anchor.extend({
        type: 'source'
    });

    var TargetAnchor = Anchor.extend({
        type: 'target'
    });

    // Export
    joint.dia.linkTools = {
        Vertices: Vertices,
        Segments: Segments,
        SourceArrowhead: SourceArrowhead,
        TargetArrowhead: TargetArrowhead,
        SourceAnchor: SourceAnchor,
        TargetAnchor: TargetAnchor,
        Button: Button,
        Remove: Remove,
        Boundary: Boundary
    };

})(joint, joint.util, V, g);
