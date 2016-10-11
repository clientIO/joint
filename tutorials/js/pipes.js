joint.connectors.normalDimFix = function(sourcePoint, targetPoint, vertices) {

    var dimensionFix = 1e-3;

    var d = ['M', sourcePoint.x, sourcePoint.y];

    _.each(vertices, function(vertex) { d.push(vertex.x, vertex.y); });

    d.push(targetPoint.x + dimensionFix, targetPoint.y + dimensionFix);

    return d.join(' ');
};

var PatternLinkView = joint.dia.LinkView.extend({

    patternMarkup: [
        '<pattern id="pattern-<%= id %>" patternUnits="userSpaceOnUse">',
        '<image xlink:href=""/>',
        '</pattern>'
    ].join(''),

    initialize: function() {

        joint.dia.LinkView.prototype.initialize.apply(this, arguments);

        _.bindAll(this, 'fillWithPattern');
    },

    render: function() {

        joint.dia.LinkView.prototype.render.apply(this, arguments);

        // make sure that pattern doesn't already exist
        if (!this.pattern) {
            
            this.pattern = V(_.template(this.patternMarkup)({ id: this.id }));
            this.patternImage = this.pattern.findOne('image');

            V(this.paper.svg).defs().append(this.pattern);
        }

        // tell the '.connection' path to use the pattern
        var connection = V(this.el).findOne('.connection').attr({
            stroke: 'url(#pattern-' + this.id + ')'
        });

        // cache the stroke width
        this.strokeWidth = connection.attr('stroke-width') || 1;

        return this;
    },

    remove: function() {

        // make sure we stop an ongoing pattern update
        joint.util.cancelFrame(this.frameId);

        joint.dia.LinkView.prototype.remove.apply(this, arguments);

        this.pattern.remove();
    },
    
    update: function() {

        joint.dia.LinkView.prototype.update.apply(this, arguments);

        joint.util.cancelFrame(this.frameId);

        this.frameId = joint.util.nextFrame(this.fillWithPattern);

        return this;
    },

    fillWithPattern: function() {

        var strokeWidth = this.strokeWidth;

        // we get the bounding box of the linkView without the transformations
        // and expand it to all 4 sides by the stroke width
        // (making sure there is always enough room for drawing,
        // even if the bounding box was tiny.
        // Note that the bounding box doesn't include the stroke.)
        var bbox = g.rect(V(this.el).bbox(true)).moveAndExpand({
            x: - strokeWidth,
            y: - strokeWidth,
            width: 2 * strokeWidth,
            height: 2 * strokeWidth
        });

        // create an array of all points the link goes through
        // (route doesn't contain the connection points)
        var points = [].concat(this.sourcePoint, this.route, this.targetPoint);

        // transform all points to the links coordinate system
        points = _.map(points, function(point) {
            return g.point(point.x - bbox.x, point.y - bbox.y);
        });

        // create a canvas of the size same as the link bounding box
        var canvas = document.createElement('canvas');
        canvas.width = bbox.width;
        canvas.height = bbox.height;

        var ctx = canvas.getContext('2d');
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        // iterate over the points and execute the drawing function
        // for each segment
        for (var i=0, pointsCount = points.length - 1; i < pointsCount; i++) {

            ctx.save();
            
            var gradientPoints = this.gradientPoints(points[i], points[i+1], strokeWidth);
            var gradient = ctx.createLinearGradient.apply(ctx, gradientPoints);

            this.drawPattern.call(this, ctx, points[i], points[i+1], strokeWidth, gradient);
            
            ctx.restore();
        }

        // generate data URI from the canvas
        var dataUri = canvas.toDataURL('image/png');

        // update the pattern image and the dimensions
        this.pattern.attr(bbox);
        this.patternImage.attr({ width: bbox.width, height: bbox.height, 'xlink:href': dataUri });
    },

    // finds a gradient with perpendicular direction to a link segment
    gradientPoints: function(from, to, width) {

        var angle = g.toRad(from.theta(to) - 90);
        var center = g.line(from, to).midpoint();
        var start = g.point.fromPolar(width / 2, angle, center);
        var end = g.point.fromPolar(width / 2, Math.PI + angle, center);

        return [start.x, start.y, end.x, end.y];
    },

    // A drawing function executed for all links segments.
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
});

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#paper-pipes'),
    width: 600,
    height: 600,
    gridSize: 1,
    model: graph,
    perpendicularLinks: true,
    // tell the paper to use our LinkView
    linkView: PatternLinkView
});

var rect1 = new joint.shapes.basic.Rect({
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

var rect2 = rect1.clone().translate(300, 300);

var rect3 = rect1.clone().translate(0, 300);

var link1 = new joint.dia.Link({
    source: { id: rect1.id },
    target: { id: rect3.id },
    attrs: {
        '.connection': { 'stroke-width': 20 },
        '.marker-source': { d: 'M 0 0 5 0 5 20 0 20 z', fill: 'rgba(86, 170, 255, 1.000)' },
        '.marker-target': { d: 'M 0 0 5 0 5 20 0 20 z', fill: 'rgba(86, 170, 255, 1.000)' }
    },
    // tell the link to use our connector
    // (connectors are sought in `joint.connectors` namespace)
    connector: { name: 'normalDimFix' }
});

var link2 = link1.clone().prop({
    source: { id: rect1.id },
    target: { id: rect2.id },
    attrs: { '.connection': { 'stroke-width': 30 }},
    vertices: [g.point(450,150)]
});

var link3 = link1.clone().prop({
    source: { id: rect2.id },
    target: { id: rect3.id },
    attrs: { '.connection': { 'stroke-width': 15 }}
});

graph.resetCells([rect1, rect2, rect3, link1, link2, link3]);


