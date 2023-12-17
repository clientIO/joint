import { assign } from '../util/index.mjs';
import V from '../V/index.mjs';
import { HighlighterView } from '../dia/HighlighterView.mjs';

export const stroke = HighlighterView.extend({

    tagName: 'path',
    className: 'highlight-stroke',
    attributes: {
        'pointer-events': 'none',
        'fill': 'none'
    },

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

    getPathData(cellView, node) {
        const { options } = this;
        const { useFirstSubpath } = options;
        let d;
        try {
            const vNode = V(node);
            d = vNode.convertToPathData().trim();
            if (vNode.tagName() === 'PATH' && useFirstSubpath) {
                const secondSubpathIndex = d.search(/.M/i) + 1;
                if (secondSubpathIndex > 0) {
                    d = d.substr(0, secondSubpathIndex);
                }
            }
        } catch (error) {
            // Failed to get path data from magnet element.
            // Draw a rectangle around the node instead.
            const nodeBBox = cellView.getNodeBoundingRect(node);
            d = V.rectToPath(assign({}, options, nodeBBox.toJSON()));
        }
        return d;
    },

    highlightConnection(cellView) {
        this.vel.attr('d', cellView.getSerializedConnection());
    },

    highlightNode(cellView, node) {
        const { vel, options } = this;
        const { padding, layer } = options;
        let highlightMatrix = this.getNodeMatrix(cellView, node);
        // Add padding to the highlight element.
        if (padding) {
            if (!layer && node === cellView.el) {
                // If the highlighter is appended to the cellView
                // and we measure the size of the cellView wrapping group
                // it's necessary to remove the highlighter first
                vel.remove();
            }
            let nodeBBox = cellView.getNodeBoundingRect(node);
            const cx = nodeBBox.x + (nodeBBox.width / 2);
            const cy = nodeBBox.y + (nodeBBox.height / 2);
            nodeBBox = V.transformRect(nodeBBox, highlightMatrix);
            const width = Math.max(nodeBBox.width, 1);
            const height = Math.max(nodeBBox.height, 1);
            const sx = (width + padding) / width;
            const sy = (height + padding) / height;
            const paddingMatrix = V.createSVGMatrix({
                a: sx,
                b: 0,
                c: 0,
                d: sy,
                e: cx - sx * cx,
                f: cy - sy * cy
            });
            highlightMatrix = highlightMatrix.multiply(paddingMatrix);
        }
        vel.attr({
            'd': this.getPathData(cellView, node),
            'transform': V.matrixToTransformString(highlightMatrix)
        });
    },

    highlight(cellView, node) {
        const { vel, options } = this;
        vel.attr(options.attrs);
        if (options.nonScalingStroke) {
            vel.attr('vector-effect', 'non-scaling-stroke');
        }
        if (cellView.isNodeConnection(node)) {
            this.highlightConnection(cellView);
        } else {
            this.highlightNode(cellView, node);
        }
    }

});
