import V from '../V/index.mjs';
import { HighlighterView } from '../dia/HighlighterView.mjs';

const MASK_CLIP = 20;

export const mask = HighlighterView.extend({

    tagName: 'rect',
    className: 'highlight-mask',
    attributes: {
        'pointer-events': 'none'
    },

    options: {
        padding: 3,
        maskClip: MASK_CLIP,
        deep: false,
        attrs: {
            'stroke': '#FEB663',
            'stroke-width': 3,
            'stroke-linecap': 'butt',
            'stroke-linejoin': 'miter',
        }
    },

    VISIBLE: 'white',
    INVISIBLE: 'black',

    MASK_ROOT_ATTRIBUTE_BLACKLIST: [
        'transform'
    ],

    transformMaskRoot(_cellView, rootEl) {
        const { MASK_ROOT_ATTRIBUTE_BLACKLIST } = this;
        MASK_ROOT_ATTRIBUTE_BLACKLIST.forEach(attrName => {
            rootEl.removeAttr(attrName);
        });
    },

    getMaskShape(cellView, vel) {
        const { deep } = this.options;
        if (vel.tagName() === 'G' && !deep) return null;
        const alphaNode = cellView.toAlpha(vel.node);
        if (!alphaNode) return null;
        const alphaEl = V(alphaNode);
        this.transformMaskRoot(cellView, alphaEl);
        return alphaEl;
    },

    getMaskId() {
        return `highlight-mask-${this.cid}`;
    },

    getMask(cellView, vNode) {

        const { VISIBLE, INVISIBLE, options } = this;
        const { padding, attrs } = options;
        // support both `strokeWidth` and `stroke-width` attribute names
        const strokeWidth = parseFloat(V('g').attr(attrs).attr('stroke-width'));
        const hasNodeFill = vNode.attr('fill') !== 'none';
        let magnetStrokeWidth = parseFloat(vNode.attr('stroke-width'));
        if (isNaN(magnetStrokeWidth)) magnetStrokeWidth = 1;
        // stroke of the invisible shape
        const minStrokeWidth = magnetStrokeWidth + padding * 2;
        // stroke of the visible shape
        const maxStrokeWidth = minStrokeWidth + strokeWidth * 2;
        let maskEl = this.getMaskShape(cellView, vNode);
        if (!maskEl) {
            const nodeBBox = cellView.getNodeBoundingRect(vNode.node);
            // Make sure the rect is visible
            nodeBBox.inflate(nodeBBox.width ? 0 : 0.5, nodeBBox.height ? 0 : 0.5);
            maskEl =  V('rect', nodeBBox.toJSON());
        }
        maskEl.attr(attrs);
        return V('mask', {
            'id': this.getMaskId()
        }).append([
            maskEl.clone().attr({
                'fill': hasNodeFill ? VISIBLE : 'none',
                'stroke': VISIBLE,
                'stroke-width': maxStrokeWidth
            }),
            maskEl.clone().attr({
                'fill': hasNodeFill ? INVISIBLE : 'none',
                'stroke': INVISIBLE,
                'stroke-width': minStrokeWidth
            })
        ]);
    },

    removeMask(paper) {
        const maskNode = paper.svg.getElementById(this.getMaskId());
        if (maskNode) {
            paper.defs.removeChild(maskNode);
        }
    },

    addMask(paper, maskEl) {
        paper.defs.appendChild(maskEl.node);
    },

    highlight(cellView, node) {
        const { options, vel } = this;
        const { padding, attrs, maskClip = MASK_CLIP, layer } = options;
        const color = ('stroke' in attrs) ? attrs['stroke'] : '#000000';
        if (!layer && node === cellView.el) {
            // If the highlighter is appended to the cellView
            // and we measure the size of the cellView wrapping group
            // it's necessary to remove the highlighter first
            vel.remove();
        }
        const highlighterBBox = cellView.getNodeBoundingRect(node).inflate(padding + maskClip);
        const highlightMatrix = this.getNodeMatrix(cellView, node);
        const maskEl = this.getMask(cellView, V(node));
        this.addMask(cellView.paper, maskEl);
        vel.attr(highlighterBBox.toJSON());
        vel.attr({
            'transform': V.matrixToTransformString(highlightMatrix),
            'mask': `url(#${maskEl.id})`,
            'fill': color
        });
    },

    unhighlight(cellView) {
        this.removeMask(cellView.paper);
    }

});
