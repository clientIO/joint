joint.connectors.normal = function(sourcePoint, targetPoint, vertices) {

    var chromeFix = 1e-3;

    // Construct the `d` attribute of the `<path>` element.
    var d = ['M', sourcePoint.x, sourcePoint.y];

    _.each(vertices, function(vertex) {

        d.push(vertex.x, vertex.y);
    });

    d.push(targetPoint.x + chromeFix, targetPoint.y + chromeFix);

    return d.join(' ');
};

var PatternLinkView = joint.dia.LinkView.extend({

    patternMarkup: [
        '<pattern id="pattern-<%= id %>" patternUnits="userSpaceOnUse">',
        '<image xlink:href=""/>',
        '</pattern>'
    ].join(''),

    render: function() {

        if (!this.pattern) {

            this.pattern = V(joint.util.template(this.patternMarkup)({ id: this.id }));
            this.patternImage = this.pattern.findOne('image');

            V(this.paper.svg).defs().append(this.pattern);
        }

        joint.dia.LinkView.prototype.render.apply(this, arguments);

        this._V.connection.attr({ 'stroke': 'url(#pattern-' + this.id + ')' });

        return this;
    },

    remove: function() {

        joint.util.cancelFrame(this.frameId);

        joint.dia.LinkView.prototype.remove.apply(this, arguments);

        this.pattern.remove();
    },

    update: function() {

        joint.dia.LinkView.prototype.update.apply(this, arguments);

        this.strokeWidth = this._V.connection.attr('stroke-width') || 1;

        joint.util.cancelFrame(this.frameId);

        this.frameId = joint.util.nextFrame(_.bind(this.fillWithPattern, this));

        return this;
    },

    fillWithPattern: function() {

        var strokeWidth = this.strokeWidth;

        var bbox = g.rect(V(this.el).bbox(true)).inflate(strokeWidth);

        var points = [].concat(this.sourcePoint, this.route, this.targetPoint);

        points = _.map(points, function(point) {
            return g.point(point.x - bbox.x, point.y - bbox.y);
        });

        var canvas = document.createElement('canvas');
        canvas.width = bbox.width;
        canvas.height = bbox.height;

        var ctx = canvas.getContext('2d');
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        for (var i=0, pointsCount = points.length - 1; i < pointsCount; i++) {

            ctx.save();

            var gradientPoints = this.gradientPoints(points[i], points[i+1], strokeWidth);
            var gradient = ctx.createLinearGradient.apply(ctx, gradientPoints);

            this.drawPattern.call(this, ctx, points[i], points[i+1], strokeWidth, gradient, points, i);

            ctx.restore();
        }

        var dataUri = canvas.toDataURL('image/png');

        this.pattern.attr(bbox);
        this.patternImage.attr({ width: bbox.width, height: bbox.height, 'xlink:href': dataUri });
    },

    gradientPoints: function(from, to, width) {

        var angle = g.toRad(from.theta(to) - 90);
        var center = g.line(from, to).midpoint();
        var start = g.point.fromPolar(width / 2, angle, center);
        var end = g.point.fromPolar(width / 2, Math.PI + angle, center);

        return [start.x, start.y, end.x, end.y];
    },

    drawPattern: function(ctx, from, to, width, gradient) {

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = width - 2;
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.closePath();
    }

});

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 1200,
    height: 800,
    gridSize: 1,
    model: graph,
    perpendicularLinks: true,
    linkView: PatternLinkView.extend({

        drawPattern: function(ctx, from, to, width, gradient) {

            var innerWidth = width - 4;
            var outerWidth = width;
            var buttFrom = g.point(from).move(to, -outerWidth / 2);
            var buttTo = g.point(to).move(from, -outerWidth / 2);

            ctx.beginPath();
            ctx.lineWidth = outerWidth;
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';

            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            ctx.closePath();

            gradient.addColorStop(0.000, 'rgba(86, 170, 255, 1)');
            gradient.addColorStop(0.500, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1.000, 'rgba(86, 170, 255, 1)');

            ctx.beginPath();
            ctx.lineWidth = innerWidth;
            ctx.strokeStyle = gradient;
            ctx.moveTo(from.x, from.y);

            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            ctx.closePath();

            ctx.lineCap = "square";

            ctx.beginPath();
            ctx.lineWidth = innerWidth;
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(buttFrom.x, buttFrom.y);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = innerWidth;
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.moveTo(to.x, to.y);
            ctx.lineTo(buttTo.x, buttTo.y);
            ctx.stroke();
            ctx.closePath();
        }
    })
});





var r1 = new joint.shapes.basic.Rect({
    size: { width: 100, height: 100 },
    position: { x: 100, y: 100 },
    attrs: {
        rect: {
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: '0%', color: '#fcfff4' },
                    { offset: '100%', color: '#e9e9ce' }
                ],
                attrs: { x1: '0%', y1: '0%', x2: '100%', y2: '100%' }
            }
        }
    }
});

var r2 = r1.clone().translate(300, 300).addTo(graph);
var r3 = r1.clone().translate(0,300).addTo(graph);

var link1 = new joint.dia.Link({
    source: { id: r1.id },
    target: { id: r2.id },
    attrs: {
        '.connection': { 'stroke-width': 10 },
        '.connection-wrap': { 'stroke-width': 20 }
    }
});

var link2 = new joint.dia.Link({
    source: { id: r2.id },
    target: { id: r3.id },
    attrs: {
        '.connection': { 'stroke-width': 15 }
    }
});

var link3 = new joint.dia.Link({
    source: { id: r1.id },
    target: { id: r3.id },
    attrs: {
        '.connection': {
            'stroke-width': 20
            //'stroke-linecap': 'round'
        },
        '.marker-source': { d: 'M 0 0 5 0 5 20 0 20 z', fill: 'rgba(86, 170, 255, 1.000)' },
        '.marker-target': { d: 'M 0 0 5 0 5 20 0 20 z', fill: 'rgba(86, 170, 255, 1.000)' }

    }
    //connector: { name: 'rounded' },
});

graph.resetCells([r1, r2, r3, link1, link2, link3]);
