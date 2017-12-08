// Super fast (non-interactive) view for JointJS links
joint.dia.LightLinkView = joint.dia.CellView.extend({

    node: V('<path class="connection" fill="none" /><path class="connection-wrapper" fill="none" />'),

    init: function() {
        // noop
        this.listenTo(this.model, 'change:vertices change:color change:thickness', this.update);

        this._V = {};
    },

    render: function() {

        var model = this.model;

        this._sourceModel = model.getSourceElement();
        this._targetModel = model.getTargetElement();

        if (this._sourceModel) {
            this._sourceModel.on('change:position', this.update, this);
        }
        if (this._targetModel) {
            this._targetModel.on('change:position', this.update, this);
        }

        var svgPath = this._pathNode = this.node[0].clone();
        var svgWrapper = this._wrapperNode = this.node[1].clone();

        V(this.el).append([svgPath, svgWrapper]);

        this.update();
    },

    getTargetPosition: function() {
        return g.point(this._targetPosition);
    },

    update: function() {

        var model = this.model;
		    var vertices = model.get('vertices') || [];

        var sourceBBox = (this._sourceModel) ? this._sourceModel.getBBox() : g.rect(model.get('source'));
        var targetBBox = (this._targetModel) ? this._targetModel.getBBox() : g.rect(model.get('target'));
        var sourcePosition = sourceBBox.center().toJSON();
        var targetRefPoint = _.last(vertices) || sourcePosition;
        var targetPosition = this._targetPosition = targetBBox.intersectionWithLineFromCenterToPoint(targetRefPoint) || targetBBox.center();

        var connector = (model.get('smooth')) ? 'smooth' : 'normal';
        var color = model.get('color') || 'black';
        var thickness = model.get('thickness') || 1;

        // draw line
        var path = this._pathNode;
        var wrapper = this._wrapperNode;
        var d = joint.connectors[connector](sourcePosition, targetPosition, vertices);

        path.attr({
            'd': d,
            'stroke': color,
            'stroke-width': thickness,
            'marker-end': 'url(#' + this.constructor.getMarkerId(this.paper, color) + ')'
        });

        wrapper.attr({
            'd': d,
            'opacity': 0,
            'stroke': 'transparent',
            'stroke-width': thickness + 10,
            'cursor': 'pointer'
        });
    },

    isLink: function() {
        return true;
    }

}, {

    getMarkerId: function(paper, color) {

        var markerId = paper._markerIds && paper._markerIds[color];
        if (!markerId) {
            // SVG Markers are pretty fast. Let's take advantage of this.
            var arrowMarker = V('marker', {
                viewBox: "0 0 10 10",
                refX: 9,
                refY: 5,
                markerWidth: 6,
                markerHeight: 6,
                orient: "auto"
            }, [
                V('path', {
                    'd': "M 0 0 L 10 5 L 0 10 z",
                    'fill': color
                })
            ]);
            V(paper.defs).append(arrowMarker);
            paper._markerIds = paper._markerIds || {};
            markerId = paper._markerIds[color] = arrowMarker.attr('id');
        }

        return markerId;
    },

    showTools: function(linkView) {

        this.hideTools();

        var tools = this._tools = [];

        var targetPosition = linkView.getTargetPosition();
        var targetMarker = V('<circle/>', {
            r: 7,
            fill: 'yellow',
            stroke: 'black',
            cx: targetPosition.x,
            cy: targetPosition.y,
            cursor: 'move',
            class: 'marker-arrowhead',
            end: 'target'
        });

        tools.push(targetMarker);

        _.each(linkView.model.get('vertices'), function(vertex, index) {
            var vertexMarker = V('<circle/>', {
                'class': 'marker-vertex',
                idx: index,
                r: 5,
                fill: 'blue',
                stroke: 'black',
                cx: vertex.x,
                cy: vertex.y,
                cursor: 'move'
            });
            tools.push(vertexMarker);
        });

        linkView.vel.append(tools);
    },

    hideTools: function() {
        if (this._tools) {
            _.invoke(this._tools, 'remove');
            this._tools = null;
        }
    }
});



var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 600,
    height: 500,
    gridSize: 20,
    model: graph,
    // tell paper to use our custom link view for all links
    linkView: joint.dia.LightLinkView
});


paper.on('cell:mouseenter', function(cellView, evt) {
    if (cellView.model.isLink() && !joint.dia.LightLinkView._tools) {
        joint.dia.LightLinkView.showTools(cellView);
    }
});
paper.on('cell:mouseleave', function(cellView, evt) {
    if (cellView.model.isLink()) {
        joint.dia.LightLinkView.hideTools();
    }
});
paper.on('cell:pointerdblclick', function(cellView, evt) {
    if (V(evt.target).hasClass('marker-vertex')) {
        console.log(parseInt(evt.target.getAttribute('idx')));
        var vertices = (cellView.model.get('vertices') || []).slice();
        vertices.splice(parseInt(evt.target.getAttribute('idx')), 1);
        cellView.model.set('vertices', vertices);
        joint.dia.LightLinkView.showTools(cellView);
    }
});

var model = new joint.shapes.basic.Generic({
    markup: '<rect/>',
    size: {
        width: 100,
        height: 50
    },
    attrs: {
        rect: {
            'ref-width': '100%',
            'ref-height': '100%',
            'fill': 'lightblue'
        }
    },
    z: 2
});

var link = new joint.dia.Link({
    source: {
        id: 'a'
    },
    target: {
        id: 'b'
    },
    z: 1
});

var a = model.clone().position(100, 100).set('id', 'a');
var b = model.clone().position(200, 300).set('id', 'b');
var l1 = link.clone().set({
    smooth: true,
    color: 'red',
    thickness: 2,
    vertices: [{
        x: 400,
        y: 200
    }]
});
var l2 = link.clone().set({
    smooth: false,
    color: 'blue',
    thickness: 3
});

var l3 = link.clone().set({
    smooth: false,
    color: 'green',
    thickness: 4,
    target: { x: 10, y: 10 },
    vertices: [{
        x: 100,
        y: 10
    }, {
        x: 50,
        y: 50
    }]
});

graph.addCells([a, b, l1, l2, l3]);
