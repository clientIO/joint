import { Element } from '../dia/Element.mjs';
import { ElementView } from '../dia/ElementView.mjs';
import { omit, assign, sanitizeHTML, merge, has, breakText, setByPath } from '../util/index.mjs';
import { env } from '../env/index.mjs';

export const Generic = Element.define('basic.Generic', {
    attrs: {
        '.': { fill: '#ffffff', stroke: 'none' }
    }
});

export const Rect = Generic.define('basic.Rect', {
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

export const TextView = ElementView.extend({

    presentationAttributes: ElementView.addPresentationAttributes({
        // The element view is not automatically re-scaled to fit the model size
        // when the attribute 'attrs' is changed.
        attrs: ['SCALE']
    }),

    confirmUpdate: function() {
        var flags = ElementView.prototype.confirmUpdate.apply(this, arguments);
        if (this.hasFlag(flags, 'SCALE')) {
            this.resize();
            flags = this.removeFlag(flags, 'SCALE');
        }
        return flags;
    }
});

export const Text = Generic.define('basic.Text', {
    attrs: {
        'text': {
            'font-size': 18,
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><text/></g></g>',
});

export const Circle = Generic.define('basic.Circle', {
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

export const Ellipse = Generic.define('basic.Ellipse', {
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

export const Polygon = Generic.define('basic.Polygon', {
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

export const Polyline = Generic.define('basic.Polyline', {
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

export const Image = Generic.define('basic.Image', {
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

export const Path = Generic.define('basic.Path', {
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

export const Rhombus = Path.define('basic.Rhombus', {
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

const svgForeignObjectSupported = env.test('svgforeignobject');

export const TextBlock = Generic.define('basic.TextBlock', {
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
            '.fobj': assign({}, size),
            div: {
                style: assign({}, size)
            }
        });
    },

    updateContent: function(cell, content) {

        if (svgForeignObjectSupported) {

            // Content element is a <div> element.
            this.attr({
                '.content': {
                    html: sanitizeHTML(content)
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
export const TextBlockView = ElementView.extend({

    presentationAttributes: svgForeignObjectSupported
        ? ElementView.prototype.presentationAttributes
        : ElementView.addPresentationAttributes({
            content: ['CONTENT'],
            size: ['CONTENT']
        }),

    initFlag: ['RENDER', 'CONTENT'],

    confirmUpdate: function() {
        var flags = ElementView.prototype.confirmUpdate.apply(this, arguments);
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
            var noTextAttrs = omit(renderingOnlyAttrs || model.get('attrs'), '.content');
            ElementView.prototype.update.call(this, model, noTextAttrs);

            if (!renderingOnlyAttrs || has(renderingOnlyAttrs, '.content')) {
                // Update the content itself.
                this.updateContent(model, renderingOnlyAttrs);
            }

        } else {

            ElementView.prototype.update.call(this, model, renderingOnlyAttrs);
        }
    },

    updateContent: function(cell, renderingOnlyAttrs) {

        // Create copy of the text attributes
        var textAttrs = merge({}, (renderingOnlyAttrs || cell.get('attrs'))['.content']);

        textAttrs = omit(textAttrs, 'text');

        // Break the content to fit the element size taking into account the attributes
        // set on the model.
        var text = breakText(cell.get('content'), cell.get('size'), textAttrs, {
            // measuring sandbox svg document
            svgDocument: this.paper.svg
        });

        // Create a new attrs with same structure as the model attrs { text: { *textAttributes* }}
        var attrs = setByPath({}, '.content', textAttrs, '/');

        // Replace text attribute with the one we just processed.
        attrs['.content'].text = text;

        // Update the view using renderingOnlyAttributes parameter.
        ElementView.prototype.update.call(this, cell, attrs);
    }
});
