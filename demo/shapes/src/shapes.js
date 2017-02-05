var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});

// Global special attributes
joint.dia.attributes.lineStyle = {
    set: function(lineStyle, refBBox, node, attrs) {

        var n = attrs['strokeWidth'] || attrs['stroke-width'] || 1;
        var dasharray = {
            'dashed': (4*n) + ',' + (2*n),
            'dotted': n + ',' + n
        }[lineStyle] || 'none';

        return { 'stroke-dasharray': dasharray };
    }
};

joint.dia.attributes.fitRef = {
    set: function(fitRef, refBBox, node) {
        switch (node.tagName.toUpperCase()) {
            case 'ELLIPSE':
                return {
                    rx: refBBox.width / 2,
                    ry: refBBox.height / 2,
                    cx: refBBox.width / 2,
                    cy: refBBox.height / 2
                };
            case 'RECT':
                return {
                    width: refBBox.width,
                    height: refBBox.height
                };
            case 'PATH':
                var rect = _.extend(refBBox.toJSON(), fitRef);
                return {
                    d: V.rectToPath(rect)
                };
        }
    }
};

joint.dia.attributes.wrappedText = {
    qualify: _.isPlainObject,
    set: function(value, refBBox, node, attrs) {
        // option `width`
        var width = value.width || 0;
        if (width <= 0) {
            refBBox.width += width;
        } else {
            refBBox.width = width;
        }
        // option `height`
        var height = value.height || 0;
        if (height <= 0) {
            refBBox.height += height;
        } else {
            refBBox.height = height;
        }
        // option `text`
        var brokenText = joint.util.breakText(value.text + '', refBBox, {
            'font-size': attrs.fontSize,
            'font-family': attrs.fontFamily
        });
        V(node).text(brokenText);
    }
};


var Circle = joint.dia.Element.define('custom.Circle', {
    markup: '<g class="rotatable"><ellipse/><text/><path/></g>',
    attrs: {
        ellipse: {
            fill: '#FFFFFF',
            stroke: '#cbd2d7',
            strokeWidth: 3,
            lineStyle: 'dashed',
            fitRef: true
        },
        path: {
            stroke: '#cbd2d7',
            strokeWidth: 3,
            lineStyle: 'dotted',
            fill: 'none',
            d: ['M', 0, '25%', '100%', '25%', 'M', '100%', '75%', 0, '75%']
        },
        text: {
            fill: '#cbd2d7',
            fontSize: 20,
            fontFamily: 'Arial, helvetica, sans-serif',
            refX: '50%',
            refY: '50%',
            transform: 'rotate(45) scale(0.5,0.5)',
            yAlignment: 'middle',
            xAlignment: 'middle'
        }
    }

}, {

    setText: function(text) {
        return this.attr('text/text', text);
    }

}, {

    // Element specific special attributes
    attributes: {

        d: {
            // The path data `d` attribute to be defined via an array.
            // e.g. d: ['M', 0, '25%', '100%', '25%', 'M', '100%', '75%', 0, '75%']
            qualify: _.isArray,
            set: function(value, refBBox) {
                var i = 0;
                var attrValue = value.map(function(data, index) {
                    if (_.isString(data)) {
                        if (data.slice(-1) === '%') {
                            return parseFloat(data) / 100 * refBBox[((index - i) % 2) ? 'height' : 'width'];
                        } else {
                            i++;
                        }
                    }
                    return data;
                }).join(' ');
                return { d:  attrValue };
            }
        }
    }
});

var circle = (new Circle())
    .size(100, 100)
    .position(500,200)
    .setText('Special\nAttributes')
    .rotate(-45)
    .addTo(graph);

var Rectangle = joint.dia.Element.define('custom.Rectangle', {
    markup: [
        '<rect class="body"/>',
        '<circle class="red"/>',
        '<path class="green"/>',
        '<text class="content"/>'
    ].join(''),
    attrs: {
        '.body': {
            fill: '#ddd',
            stroke: '#000',
            refWidth: '100%',
            refHeight: '100%',
            rx: 5,
            ty: 5
        },
        '.red': {
            r: 12,
            fill: '#d00',
            stroke: '#000',
            refX: '100%',
            cy: 4,
            cx: -4
        },
        '.green': {
            r: 4,
            fill: '#0d0',
            stroke: '#000',
            refX: '100%',
            d: 'M -10 0 -3 -3 0 -10 3 -3 10 0 3 3 0 10 -3 3 z',
            transform: 'translate(-4,4)'
        },
        '.content': {
            wrappedText: {
                text: 'An element with text automatically wrapped to fit the rectangle.',
                width: -10,
                height: -10
            },
            fontSize: 14,
            fontFamily: 'sans-serif',
            textAnchor: 'middle',
            refX: '50%',
            refDy: -5,
            yAlignment: 'bottom'
        }
    }
});

var rectangle = (new Rectangle())
    .size(100,90)
    .position(200,100)
    .addTo(graph);

var Header = joint.dia.Element.define('custom.Header', {

    markup: [
        '<rect class="body"/>',
        '<rect class="header"/>',
        '<text class="caption"/>',
        '<text class="description"/>',
        '<image class="icon"/>'
    ].join(''),
    attrs: {
        '.body': {
            fitRef: true,
            fill: 'white',
            stroke: 'gray',
            strokeWidth: 3
        },
        '.header': {
            fill: 'gray',
            stroke: 'none',
            height: 20,
            refWidth: '100%'
        },
        '.caption': {
            refX: '50%',
            textAnchor: 'middle',
            fontSize: 12,
            fontFamily: 'sans-serif',
            y: 15,
            wrappedText: {
                text: 'Header',
                height: 0
            },
            fill: '#fff'
        },
        '.description': {
            refX: '50%',
            refX2: 15,
            refY: 25,
            textAnchor: 'middle',
            fontSize: 12,
            fontFamily: 'sans-serif',
            wrappedText: {
                text: 'Here is a descioption spread on multiple lines. Obviously wrapped automagically.',
                width: -40,
                height: -25
            },
            fill: '#aaa'
        },
        '.icon': {
            x: 3,
            y: 22,
            width: 30,
            height: 40,
            xlinkHref: 'http://placehold.it/30x40'
        }
    }
});

var header = (new Header())
    .size(140,120)
    .position(420,40)
    .addTo(graph);

var link = new joint.dia.Link({
    source: { id: circle.id },
    target: { id: rectangle.id },
    vertices: [{ x: 450, y: 300 }],
    router: { name: 'orthogonal' },
    attrs: {
        '.connection': {
            stroke: '#333',
            strokeWidth: 2,
            sourceMarker: {
                type: 'circle',
                fill: '#666',
                stroke: '#333',
                r: 5,
                cx: 5
            },
            targetMarker: {
                type: 'path',
                fill: '#666',
                stroke: '#000',
                d: 'M 10 -10 0 0 10 10 z'
            },
            vertexMarker: {
                type: 'circle',
                fill: '#666',
                stroke: '#333',
                r: 5
            }
        }
    }
}).addTo(graph);
