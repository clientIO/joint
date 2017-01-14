joint.dia.specialAttributes = {

    filter: {
        qualify: _.isObject,
        exec: function($elements, filter) {
            this.applyFilter($elements, filter);            
        }
    },

    fill: {
        qualify: _.isObject,
        exec: function($elements, fill) {
            this.applyGradient($elements, 'fill', fill);
        }
    },

    stroke: {
        qualify: _.isObject,
        exec: function($elements, stroke) {
            this.applyGradient($elements, 'stroke', stroke);
        }        
    },

    text: {
        exec: function($elements, text, attrs) {
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
        exec: function($elements, port) {
            var portId = _.isUndefined(port.id) ? port : port.id;
            $elements.attr('port', portId);
        }        
    },

    // `style` attribute is special in the sense that it sets the CSS style of the subelement.    
    style: {
        qualify: _.isObject,
        exec: function($elements, styles) {
            $elements.css(styles);
        }
    },

    html: {
        exec: function($elements, html) {
            $elements.html(html + '');
        }
    }
};

