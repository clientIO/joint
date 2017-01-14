joint.dia.specialAttributes = {

    filter: {
        qualify: _.isObject,
        set: function($elements, filter) {
            this.applyFilter($elements, filter);
        }
    },

    fill: {
        qualify: _.isObject,
        set: function($elements, fill) {
            this.applyGradient($elements, 'fill', fill);
        }
    },

    stroke: {
        qualify: _.isObject,
        set: function($elements, stroke) {
            this.applyGradient($elements, 'stroke', stroke);
        }
    },

    text: {
        set: function($elements, text, attrs) {
            for (var i = 0, n = $elements.length; i < n; i++) {
                V($elements[i]).text(text + '', {
                    lineHeight: attrs.lineHeight,
                    textPath: attrs.textPath,
                    annotations: attrs.annotations
                });
            }
        }
    },

    lineHeight: {
        qualify: function(lh, attrs) {
            return _.isUndefined(attrs.text);
        }
    },

    textPath: {
        qualify: function(tp, attrs) {
            return _.isUndefined(attrs.text);
        }
    },

    annotations: {
        qualify: function(a, attrs) {
            return _.isUndefined(attrs.text);
        }
    },

    // `port` attribute contains the `id` of the port that the underlying magnet represents.
    port: {
        set: function($elements, port) {
            var portId = _.isUndefined(port.id) ? port : port.id;
            $elements.attr('port', portId);
        }
    },

    // `style` attribute is special in the sense that it sets the CSS style of the subelement.
    style: {
        qualify: _.isObject,
        set: function($elements, styles) {
            $elements.css(styles);
        }
    },

    html: {
        set: function($elements, html) {
            $elements.html(html + '');
        }
    }
};

