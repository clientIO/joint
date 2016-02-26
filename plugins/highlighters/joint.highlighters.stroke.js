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
            magnetBBox = g.rect(magnetBBox);
            pathData = V.rectToPath(_.extend({}, opt, magnetBBox));
        }

        var svg = V('svg').node;
        var appendToEl = cellView.vel;
        var highlightVel = V('path').attr({
            d: pathData,
            class: 'joint-highlight-stroke'
        });
        var invertedCellViewMatrix = appendToEl.node.getCTM().inverse();
        var invertedCellViewTransform = svg.createSVGTransformFromMatrix(invertedCellViewMatrix);
        highlightVel.node.transform.baseVal.appendItem(invertedCellViewTransform);

        var matrix = magnetEl.getCTM();
        var transform = svg.createSVGTransformFromMatrix(matrix);
        highlightVel.node.transform.baseVal.appendItem(transform);

        if (opt.padding) {

            // Add padding to the highlight element.
            var cx = magnetBBox.x + (magnetBBox.width / 2);
            var cy = magnetBBox.y + (magnetBBox.height / 2);
            var sx = (magnetBBox.width + opt.padding) / magnetBBox.width;
            var sy = (magnetBBox.height + opt.padding) / magnetBBox.height;
            var paddingMatrix = svg.createSVGMatrix();
            paddingMatrix.a = sx;
            paddingMatrix.b = 0;
            paddingMatrix.c = 0;
            paddingMatrix.d = sy;
            paddingMatrix.e = cx - sx * cx;
            paddingMatrix.f = cy - sy * cy;
            var paddingTransform = svg.createSVGTransformFromMatrix(paddingMatrix);
            highlightVel.node.transform.baseVal.appendItem(paddingTransform);
        }

        // This will handle the joint-theme-* class name for us.
        var highlightView = this._views[magnetEl.id] = new joint.mvc.View({
            // This is necessary because we're passing in a vectorizer element (not jQuery).
            el: highlightVel.node,
            $el: highlightVel
        });

        // Remove the highlight view when the cell is removed from the graph.
        highlightView.listenTo(cellView.model, 'remove', highlightView.remove);

        appendToEl.append(highlightVel);
    },

    unhighlight: function(cellView, magnetEl, opt) {

        opt = _.defaults(opt || {}, this.defaultOptions);

        if (this._views[magnetEl.id]) {
            this._views[magnetEl.id].remove();
            this._views[magnetEl.id] = null;
        }
    }
};
