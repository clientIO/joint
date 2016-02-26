joint.highlighters.stroke = {

    defaultOptions: {
        padding: 3,
        rx: 0,
        ry: 0
    },

    _views: {},

    highlight: function(cellView, magnetEl, opt) {

        // Only highlight once.
        if (this._views[magnetEl.id]) return;

        opt = _.defaults(opt || {}, this.defaultOptions);

        var magnetVel = V(magnetEl);
        var magnetBBox = magnetVel.bbox(true/* without transforms */);

        try {

            var pathData = magnetVel.convertToPathData();

        } catch (error) {

            // Failed to get path data from magnet element.
            // Draw a rectangle around the entire cell view instead.
            pathData = V.rectToPath(_.extend({}, opt, magnetBBox));
        }

        var highlightVel = V('path').attr({
            d: pathData,
            'class': 'joint-highlight-stroke',
            'pointer-events': 'none'
        });

        highlightVel.transform(cellView.el.getCTM().inverse());
        highlightVel.transform(magnetEl.getCTM());

        var padding = opt.padding;
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

        // This will handle the joint-theme-* class name for us.
        var highlightView = this._views[magnetEl.id] = new joint.mvc.View({
            // This is necessary because we're passing in a vectorizer element (not jQuery).
            el: highlightVel.node,
            $el: highlightVel
        });

        // Remove the highlight view when the cell is removed from the graph.
        highlightView.listenTo(cellView.model, 'remove', highlightView.remove);

        cellView.vel.append(highlightVel);
    },

    unhighlight: function(cellView, magnetEl, opt) {

        opt = _.defaults(opt || {}, this.defaultOptions);

        if (this._views[magnetEl.id]) {
            this._views[magnetEl.id].remove();
            this._views[magnetEl.id] = null;
        }
    }
};
