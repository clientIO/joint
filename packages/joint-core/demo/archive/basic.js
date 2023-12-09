const Generic = joint.dia.Element.define('basic.Generic', {
    attrs: {
        '.': { fill: '#ffffff', stroke: 'none' }
    }
});

const Rect = Generic.define('basic.Rect', {
    attrs: {
        'rect': {
            fill: '#ffffff',
            stroke: '#000000',
            width: 100,
            height: 60
        },
        'text': {
            fill: '#000000',
            text: '',
            'font-size': 14,
            'ref-x': .5,
            'ref-y': .5,
            'text-anchor': 'middle',
            'y-alignment': 'middle',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/></g>'
});

const TextView = joint.dia.ElementView.extend({

    presentationAttributes: joint.dia.ElementView.addPresentationAttributes({
        // The element view is not automatically re-scaled to fit the model size
        // when the attribute 'attrs' is changed.
        attrs: ['SCALE']
    }),

    confirmUpdate: function() {
        var flags = joint.dia.ElementView.prototype.confirmUpdate.apply(this, arguments);
        if (this.hasFlag(flags, 'SCALE')) {
            this.resize();
            flags = this.removeFlag(flags, 'SCALE');
        }
        return flags;
    }
});

const Text = Generic.define('basic.Text', {
    attrs: {
        'text': {
            'font-size': 18,
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><text/></g></g>',
});

const Circle = Generic.define('basic.Circle', {
    size: { width: 60, height: 60 },
    attrs: {
        'circle': {
            fill: '#ffffff',
            stroke: '#000000',
            r: 30,
            cx: 30,
            cy: 30
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle/></g><text/></g>',
});

const Ellipse = Generic.define('basic.Ellipse', {
    size: { width: 60, height: 40 },
    attrs: {
        'ellipse': {
            fill: '#ffffff',
            stroke: '#000000',
            rx: 30,
            ry: 20,
            cx: 30,
            cy: 20
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><ellipse/></g><text/></g>',
});

const Polygon = Generic.define('basic.Polygon', {
    size: { width: 60, height: 40 },
    attrs: {
        'polygon': {
            fill: '#ffffff',
            stroke: '#000000'
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-dy': 20,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polygon/></g><text/></g>',
});

const Polyline = Generic.define('basic.Polyline', {
    size: { width: 60, height: 40 },
    attrs: {
        'polyline': {
            fill: '#ffffff',
            stroke: '#000000'
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-dy': 20,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polyline/></g><text/></g>',
});

const Image = Generic.define('basic.Image', {
    attrs: {
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-dy': 20,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><image/></g><text/></g>',
});

const Path = Generic.define('basic.Path', {
    size: { width: 60, height: 60 },
    attrs: {
        'path': {
            fill: '#ffffff',
            stroke: '#000000'
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref': 'path',
            'ref-x': .5,
            'ref-dy': 10,
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }

}, {
    markup: '<g class="rotatable"><g class="scalable"><path/></g><text/></g>',
});

const Rhombus = Path.define('basic.Rhombus', {
    attrs: {
        'path': {
            d: 'M 30 0 L 60 30 30 60 0 30 z'
        },
        'text': {
            'ref-y': .5,
            'ref-dy': null,
            'y-alignment': 'middle'
        }
    }
});

const svgForeignObjectSupported = joint.env.test('svgforeignobject');

const TextBlock = Generic.define('basic.TextBlock', {
    // see joint.css for more element styles
    attrs: {
        rect: {
            fill: '#ffffff',
            stroke: '#000000',
            width: 80,
            height: 100
        },
        text: {
            fill: '#000000',
            'font-size': 14,
            'font-family': 'Arial, helvetica, sans-serif'
        },
        '.content': {
            text: '',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            'x-alignment': 'middle'
        }
    },

    content: ''
}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable"><rect/></g>',
        svgForeignObjectSupported
            ? '<foreignObject class="fobj"><body xmlns="http://www.w3.org/1999/xhtml"><div class="content"/></body></foreignObject>'
            : '<text class="content"/>',
        '</g>'
    ].join(''),

    initialize: function() {

        this.listenTo(this, 'change:size', this.updateSize);
        this.listenTo(this, 'change:content', this.updateContent);
        this.updateSize(this, this.get('size'));
        this.updateContent(this, this.get('content'));
        Generic.prototype.initialize.apply(this, arguments);
    },

    updateSize: function(cell, size) {

        // Selector `foreignObject' doesn't work across all browsers, we're using class selector instead.
        // We have to clone size as we don't want attributes.div.style to be same object as attributes.size.
        this.attr({
            '.fobj': Object.assign({}, size),
            div: {
                style: Object.assign({}, size)
            }
        });
    },

    updateContent: function(cell, content) {

        if (svgForeignObjectSupported) {

            // Content element is a <div> element.
            this.attr({
                '.content': {
                    html: joint.util.sanitizeHTML(content)
                }
            });

        } else {

            // Content element is a <text> element.
            // SVG elements don't have innerHTML attribute.
            this.attr({
                '.content': {
                    text: content
                }
            });
        }
    },

    // Here for backwards compatibility:
    setForeignObjectSize: function() {

        this.updateSize.apply(this, arguments);
    },

    // Here for backwards compatibility:
    setDivContent: function() {

        this.updateContent.apply(this, arguments);
    }
});

// TextBlockView implements the fallback for IE when no foreignObject exists and
// the text needs to be manually broken.
const TextBlockView = joint.dia.ElementView.extend({

    presentationAttributes: svgForeignObjectSupported
        ? joint.dia.ElementView.prototype.presentationAttributes
        : joint.dia.ElementView.addPresentationAttributes({
            content: ['CONTENT'],
            size: ['CONTENT']
        }),

    initFlag: ['RENDER', 'CONTENT'],

    confirmUpdate: function() {
        var flags = joint.dia.ElementView.prototype.confirmUpdate.apply(this, arguments);
        if (this.hasFlag(flags, 'CONTENT')) {
            this.updateContent(this.model);
            flags = this.removeFlag(flags, 'CONTENT');
        }
        return flags;
    },

    update: function(_, renderingOnlyAttrs) {

        var model = this.model;

        if (!svgForeignObjectSupported) {

            // Update everything but the content first.
            var noTextAttrs = joint.util.omit(renderingOnlyAttrs || model.get('attrs'), '.content');
            joint.dia.ElementView.prototype.update.call(this, model, noTextAttrs);

            if (!renderingOnlyAttrs || joint.util.has(renderingOnlyAttrs, '.content')) {
                // Update the content itself.
                this.updateContent(model, renderingOnlyAttrs);
            }

        } else {

            joint.dia.ElementView.prototype.update.call(this, model, renderingOnlyAttrs);
        }
    },

    updateContent: function(cell, renderingOnlyAttrs) {

        // Create copy of the text attributes
        var textAttrs = joint.util.merge({}, (renderingOnlyAttrs || cell.get('attrs'))['.content']);

        textAttrs = joint.util.omit(textAttrs, 'text');

        // Break the content to fit the element size taking into account the attributes
        // set on the model.
        var text = joint.util.breakText(cell.get('content'), cell.get('size'), textAttrs, {
            // measuring sandbox svg document
            svgDocument: this.paper.svg
        });

        // Create a new attrs with same structure as the model attrs { text: { *textAttributes* }}
        var attrs = joint.util.setByPath({}, '.content', textAttrs, '/');

        // Replace text attribute with the one we just processed.
        attrs['.content'].text = text;

        // Update the view using renderingOnlyAttributes parameter.
        joint.dia.ElementView.prototype.update.call(this, cell, attrs);
    }
});

const shapes = {
    ...joint.shapes,
    basic: {
        Generic,
        Rect,
        Text,
        TextView,
        Circle,
        Ellipse,
        Polygon,
        Polyline,
        Image,
        Path,
        Rhombus,
        TextBlock,
        TextBlockView,
    }
};

var graph = new joint.dia.Graph({}, { cellNamespace: shapes });

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph,
    cellViewNamespace: shapes,
    markAvailable: true,
    linkConnectionPoint: joint.util.shapePerimeterConnectionPoint
});

var rb = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 100, height: 40 },
    attrs: { text: { text: 'basic.Rect' }}
});
graph.addCell(rb);

var tb = new joint.shapes.basic.Text({
    position: { x: 170, y: 50 },
    size: { width: 100, height: 30 },
    attrs: { text: { text: 'basic.Text' }}
});
graph.addCell(tb);

var cb = new joint.shapes.basic.Circle({
    position: { x: 300, y: 70 },
    size: { width: 100, height: 40 },
    attrs: { text: { text: 'basic.Circle' }}
});
graph.addCell(cb);

var ib = new joint.shapes.basic.Image({
    position: { x: 450, y: 50 },
    size: { width: 40, height: 40 },
    attrs: {
        text: { text: 'basic.Image' },
        image: { 'xlink:href': 'http://placehold.it/48x48', width: 48, height: 48 }
    }
});
graph.addCell(ib);

var pb = new joint.shapes.basic.Path({
    position: { x: 50, y: 150 },
    size: { width: 40, height: 40 },
    attrs: {
        path: { d: 'M25.979,12.896 19.312,12.896 19.312,6.229 12.647,6.229 12.647,12.896 5.979,12.896 5.979,19.562 12.647,19.562 12.647,26.229 19.312,26.229 19.312,19.562 25.979,19.562z' },
        text: { text: 'basic.Path' }
    }
});
graph.addCell(pb);

var rh = new joint.shapes.basic.Rhombus({
    position: { x: 50, y: 250 },
    size: { width: 70, height: 70 },
    attrs: { text: { text: 'basic.Rhombus', 'font-size': 8 }}
});
graph.addCell(rh);

var tbl = new joint.shapes.basic.TextBlock({
    position: { x: 400, y: 150 },
    size: { width: 180, height: 100 },
    content: 'Lorem ipsum dolor sit amet,\n consectetur adipiscing elit. Nulla vel porttitor est.'
});
graph.addCell(tbl);

// An example of a custom element.
// -------------------------------

var MyElementWithPorts = joint.shapes.basic.Generic.extend({

    defaults: joint.util.defaultsDeep({

        markup: [
            '<g class="rotatable">',
            '<g class="scalable">',
            '<rect/>',
            '</g>',
            '<g class="inPorts">',
            '<g class="port1"><circle/><text/></g>',
            '<g class="port2"><circle/><text/></g>',
            '</g>',
            '<g class="outPorts">',
            '<g class="port3"><circle/><text/></g>',
            '<g class="port4"><circle/><text/></g>',
            '</g>',
            '</g>'
        ].join(''),

        type: 'basic.Generic',
        attrs: {
            '.': { magnet: false },
            rect: {
                width: 150, height: 250,
                stroke: 'black'
            },
            circle: {
                r: 5,
                magnet: true,
                stroke: 'black'
            },
            text: {
                fill: 'black',
                'pointer-events': 'none'
            },
            '.label': { text: 'Model', dx: 5, dy: 5 },
            '.inPorts text': { dx:-15, 'text-anchor': 'end' },
            '.outPorts text':{ dx: 15 },
            '.inPorts circle': { fill: 'PaleGreen' },
            '.outPorts circle': { fill: 'Tomato' }
        }

    }, joint.shapes.basic.Generic.prototype.defaults)
});

var d = new MyElementWithPorts({
    position: { x: 250, y: 150 },
    size: { width: 80, height: 80 },
    attrs: {
        '.port1 text': { text: 'port1' },
        '.port2 text': { text: 'port2' },
        '.port3 text': { text: 'port3' },
        '.port4 text': { text: 'port4' },
        '.port1': { ref: 'rect', 'ref-y': .2 },
        '.port2': { ref: 'rect', 'ref-y': .4 },
        '.port3': { ref: 'rect', 'ref-y': .2, 'ref-dx': 0 },
        '.port4': { ref: 'rect', 'ref-y': .4, 'ref-dx': 0 }
    }
});

graph.addCell(d);


// An example showing auto-resize of the joint.shapes.basic.Rect element based on the size of the text in it:

rb.on('change:attrs', function(element) {

    var text = rb.attr('text/text');
    var fontSize = parseInt(rb.attr('text/font-size'), 10);

    var svgDocument = V('svg').node;
    var textElement = V('<text><tspan></tspan></text>').node;
    var textSpan = textElement.firstChild;
    var textNode = document.createTextNode('');

    textSpan.appendChild(textNode);
    svgDocument.appendChild(textElement);
    document.body.appendChild(svgDocument);

    var lines = text.split('\n');
    var width = 0;

    // Find the longest line width.
    lines.forEach(function(line) {

        textNode.data = line;
        var lineWidth = textSpan.getComputedTextLength();

        width = Math.max(width, lineWidth);
    });

    var height = lines.length * (fontSize * 1.2);

    V(svgDocument).remove();

    element.resize(width + 10, height);
});

// Image decorated rectangle shape example.

joint.shapes.basic.DecoratedRect = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect/></g><image/><text/></g>',

    defaults: joint.util.defaultsDeep({

        type: 'basic.DecoratedRect',
        size: { width: 100, height: 60 },
        attrs: {
            'rect': { fill: '#FFFFFF', stroke: 'black', width: 100, height: 60 },
            'text': { 'font-size': 14, text: '', 'ref-x': .5, 'ref-y': .5, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle', fill: 'black' },
            'image': { 'ref-x': 2, 'ref-y': 2, ref: 'rect', width: 16, height: 16 }
        }

    }, joint.shapes.basic.Generic.prototype.defaults)
});

var decoratedRect = new joint.shapes.basic.DecoratedRect({
    position: { x: 150, y: 80 },
    size: { width: 100, height: 60 },
    attrs: {
        text: { text: 'My Element' },
        image: { 'xlink:href': 'http://placehold.it/16x16' }
    }
});
graph.addCell(decoratedRect);


joint.shapes.basic.Cylinder = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable"><path/></g><text/></g>',

    defaults: joint.util.defaultsDeep({

        type: 'basic.Cylinder',
        size: { width: 40, height: 40 },
        attrs: {
            'path': {
                fill: '#FFFFFF', stroke: '#cbd2d7', 'stroke-width': 3,
                d: [
                    'M 0 10 C 10 5, 30 5, 40 10 C 30 15, 10 15, 0 10',
                    'L 0 20',
                    'C 10 25, 30 25, 40 20',
                    'L 40 10'
                ].join(' ')
            },
            'text': { fill: '#435460', 'font-size': 14, text: '', 'ref-x': .5, 'ref-y': .7, ref: 'path', 'y-alignment': 'middle', 'text-anchor': 'middle', 'font-family': 'Arial, helvetica, sans-serif' }
        }

    }, joint.shapes.basic.Generic.prototype.defaults)
});

var cylinder = new joint.shapes.basic.Cylinder({

    position: { x: 200, y: 200 },
    size: { width: 180, height: 150 },
    attrs: {
        text: { text: 'SEQUENCE\nLIBRARY' }
    }
});

graph.addCell(cylinder);

var c = V('circle', { r: 8, fill: 'red' });
var cylinderView = cylinder.findView(paper);
var cylinderPath = cylinderView.vel.findOne('path');
var cylinderScalable = cylinderView.vel.findOne('.scalable');
var cylinderScalableCTM = cylinderScalable.node.getCTM().inverse();

c.animateAlongPath({ dur: '4s', repeatCount: 'indefinite' }, cylinderPath.node);
c.scale(cylinderScalableCTM.a, cylinderScalableCTM.d);
cylinderScalable.append(c);
