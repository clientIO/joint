import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import * as mvc from '../mvc/index.mjs';

export const stroke = {

    defaultOptions: {

        padding: 3,
        rx: 0,
        ry: 0,
        useFirstSubpath: false,
        attrs: {
            'stroke-width': 3,
            'stroke': '#FEB663'
        }
    },

    _views: {},

    getHighlighterId: function(magnetEl, opt) {

        return magnetEl.id + JSON.stringify(opt);
    },

    removeHighlighter: function(id) {
        if (this._views[id]) {
            this._views[id].remove();
            this._views[id] = null;
        }
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    highlight: function(cellView, magnetEl, opt) {

        const id = this.getHighlighterId(magnetEl, opt);

        // Only highlight once.
        if (this._views[id]) return;

        const options = util.defaults(opt || {}, this.defaultOptions);
        const { padding, useFirstSubpath, attrs } = options;

        const magnetVel = V(magnetEl);
        const highlightVel = V('path')
            .attr({
                'pointer-events': 'none',
                'vector-effect': 'non-scaling-stroke',
                'fill': 'none'
            })
            .attr(attrs);

        if (cellView.isNodeConnection(magnetEl)) {

            highlightVel.attr('d', cellView.getSerializedConnection());

        } else {

            let pathData;
            let magnetBBox;
            try {
                pathData = magnetVel.convertToPathData().trim();
                if (magnetVel.tagName() === 'PATH' && useFirstSubpath) {
                    const secondSubpathIndex = pathData.search(/.M/i) + 1;
                    if (secondSubpathIndex > 0) {
                        pathData = pathData.substr(0, secondSubpathIndex);
                    }
                }
            } catch (error) {
                // Failed to get path data from magnet element.
                // Draw a rectangle around the entire cell view instead.
                magnetBBox = cellView.getNodeBoundingRect(magnetEl);
                pathData = V.rectToPath(Object.assign({}, options, magnetBBox));
            }

            highlightVel.attr('d', pathData);

            let highlightMatrix = magnetVel.getTransformToElement(cellView.el);

            // Add padding to the highlight element.
            if (padding) {

                magnetBBox || (magnetBBox = cellView.getNodeBoundingRect(magnetEl));

                const cx = magnetBBox.x + (magnetBBox.width / 2);
                const cy = magnetBBox.y + (magnetBBox.height / 2);

                magnetBBox = V.transformRect(magnetBBox, highlightMatrix);

                const width = Math.max(magnetBBox.width, 1);
                const height = Math.max(magnetBBox.height, 1);
                const sx = (width + padding) / width;
                const sy = (height + padding) / height;

                var paddingMatrix = V.createSVGMatrix({
                    a: sx,
                    b: 0,
                    c: 0,
                    d: sy,
                    e: cx - sx * cx,
                    f: cy - sy * cy
                });

                highlightMatrix = highlightMatrix.multiply(paddingMatrix);
            }

            highlightVel.transform(highlightMatrix);
        }

        // joint.mvc.View will handle the theme class name and joint class name prefix.
        const highlightView = this._views[id] = new mvc.View({
            svgElement: true,
            className: 'highlight-stroke',
            el: highlightVel.node
        });

        // Remove the highlight view when the cell is removed from the graph.
        const removeHandler = this.removeHighlighter.bind(this, id);
        const cell = cellView.model;
        highlightView.listenTo(cell, 'remove', removeHandler);
        highlightView.listenTo(cell.graph, 'reset', removeHandler);

        cellView.vel.append(highlightVel);
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    unhighlight: function(cellView, magnetEl, opt) {

        this.removeHighlighter(this.getHighlighterId(magnetEl, opt));
    }
};
