joint.highlighters.stroke = {

    defaultOptions: {
        padding: 3,
        rx: 0,
        ry: 0,
        attrs: {
            'stroke-width': 3,
            stroke: '#FEB663'
        }
    },

    _views: {},

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    highlight: function(cellView, magnetEl, opt) {

        // Only highlight once.
        if (this._views[magnetEl.id]) return;

        var options = _.defaults(opt || {}, this.defaultOptions);

        var magnetVel = V(magnetEl);
        var magnetBBox = magnetVel.bbox(true/* without transforms */);

        try {

            var pathData = magnetVel.convertToPathData();

        } catch (error) {

            // Failed to get path data from magnet element.
            // Draw a rectangle around the entire cell view instead.
            pathData = V.rectToPath(_.extend({}, options, magnetBBox));
        }

        var highlightVel = V('path').attr({
            d: pathData,
            'pointer-events': 'none',
            'vector-effect': 'non-scaling-stroke',
            'fill': 'none'
        }).attr(options.attrs);

        highlightVel.transform(cellView.el.getCTM().inverse());
        highlightVel.transform(magnetEl.getCTM());

        var padding = options.padding;
        if (padding) {

            // Add padding to the highlight element.
            var cx = magnetBBox.x + (magnetBBox.width / 2);
            var cy = magnetBBox.y + (magnetBBox.height / 2);
            var sx = (magnetBBox.width + padding) / magnetBBox.width;
            var sy = (magnetBBox.height + padding) / magnetBBox.height;
            highlightVel.transform({
                a: sx,
                b: 0,
                c: 0,
                d: sy,
                e: cx - sx * cx,
                f: cy - sy * cy
            });
        }

        // joint.mvc.View will handle the theme class name and joint class name prefix.
        var highlightView = this._views[magnetEl.id] = new joint.mvc.View({
            className: 'highlight-stroke',
            // This is necessary because we're passing in a vectorizer element (not jQuery).
            el: highlightVel.node,
            $el: highlightVel
        });

        // Remove the highlight view when the cell is removed from the graph.
        highlightView.listenTo(cellView.model, 'remove', highlightView.remove);

        cellView.vel.append(highlightVel);
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    unhighlight: function(cellView, magnetEl, opt) {

        if (this._views[magnetEl.id]) {
            this._views[magnetEl.id].remove();
            this._views[magnetEl.id] = null;
        }
    }
};
