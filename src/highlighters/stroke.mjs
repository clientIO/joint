import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import { HighlighterView } from './HighlighterView.mjs';

export const StrokeHighlighterView = HighlighterView.extend({

    tagName: 'path',
    className: 'highlight-stroke',

    options: {
        padding: 3,
        rx: 0,
        ry: 0,
        useFirstSubpath: false,
        attrs: {
            'stroke-width': 3,
            'stroke': '#FEB663'
        }
    },

    highlight(cellView, magnetEl) {

        const { vel, options } = this;
        const { padding, useFirstSubpath, attrs } = options;
        const magnetVel = V(magnetEl);

        vel
            .attr({
                'pointer-events': 'none',
                'vector-effect': 'non-scaling-stroke',
                'fill': 'none'
            })
            .attr(attrs);

        if (cellView.isNodeConnection(magnetEl)) {

            vel.attr('d', cellView.getSerializedConnection());

        } else {

            let pathData;
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
                const magnetBBox = cellView.getNodeBoundingRect(magnetEl);
                pathData = V.rectToPath(util.assign({}, options, magnetBBox.toJSON()));
            }

            vel.attr('d', pathData);

            let highlightMatrix = cellView.getNodeMatrix(magnetEl);

            // Add padding to the highlight element.
            if (padding) {

                let magnetBBox = cellView.getNodeBoundingRect(magnetEl);

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

            vel.transform(highlightMatrix);
        }

        this.mount(cellView);
    }
});

export const stroke = {

    highlight: function(cellView, magnetEl, opt) {
        const id = StrokeHighlighterView.getId(magnetEl, opt);
        StrokeHighlighterView.add(cellView, magnetEl, id, opt);
    },

    unhighlight: function(cellView, magnetEl, opt) {
        const id = HighlighterView.getId(magnetEl, opt);
        StrokeHighlighterView.remove(cellView, id);
    }
};
