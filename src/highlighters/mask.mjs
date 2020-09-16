import V from '../V/index.mjs';
import { HighlighterView } from './HighlighterView.mjs';

export const MaskHighlighterView = HighlighterView.extend({

    tagName: 'rect',
    className: 'highlight-mask',
    attributes: {
        'pointer-events': 'none'
    },

    options: {
        padding: 3,
        maskClip: 20,
        attrs: {
            'stroke': '#FEB663',
            'stroke-width': 3,
            'stroke-linecap': 'butt',
            'stroke-linejoin': 'miter',
        }
    },

    VISIBLE: 'white',
    INVISIBLE: 'black',

    MASK_ATTRIBUTE_BLACKLIST: [
        'joint-selector',
        'marker-start',
        'marker-end',
        'marker-mid',
        'transform'
    ],

    getMaskShape(vel, bbox) {
        if (vel.tagName() === 'G') {
            return V('rect', bbox.toJSON());
        }
        const shapeEl = vel.clone();
        this.MASK_ATTRIBUTE_BLACKLIST.forEach(attr => {
            shapeEl.removeAttr(attr);
        });

        return shapeEl;
    },

    getMaskId() {
        return `highlight-mask-${this.cid}`;
    },

    getMask(vel, bbox) {

        const { VISIBLE, INVISIBLE, options } = this;
        const { padding, attrs } = options;

        const strokeWidth = ('stroke-width' in attrs) ? attrs['stroke-width'] : 1;
        const hasNodeFill = vel.attr('fill') !== 'none';
        let magnetStrokeWidth = parseFloat(vel.attr('stroke-width'), 10);
        if (isNaN(magnetStrokeWidth)) magnetStrokeWidth = 1;
        // stroke of the invisible shape
        const minStrokeWidth = magnetStrokeWidth + padding * 2;
        // stroke of the visible shape
        const maxStrokeWidth = minStrokeWidth + strokeWidth * 2;
        const maskShape = this.getMaskShape(vel, bbox).attr(attrs);

        return V('mask', {
            'id': this.getMaskId()
        }).append([
            maskShape.clone().attr({
                'fill': hasNodeFill ? VISIBLE : 'none',
                'stroke': VISIBLE,
                'stroke-width': maxStrokeWidth
            }),
            maskShape.clone().attr({
                'fill': hasNodeFill ? INVISIBLE : 'none',
                'stroke': INVISIBLE,
                'stroke-width': minStrokeWidth
            })
        ]);
    },

    highlight(cellView, node) {

        const { options } = this;
        const { padding, attrs, maskClip } = options;
        const color = ('stroke' in attrs) ? attrs['stroke'] : '#000000';

        let maskImageEl, magnetBBox;
        if (cellView.isNodeConnection(node)) {
            magnetBBox = cellView.getConnection().bbox();
            maskImageEl = V('path')
                .attr({
                    'fill': 'none',
                    'd': cellView.getSerializedConnection(),
                });
        } else {
            magnetBBox = cellView.getNodeBoundingRect(node);
            maskImageEl = V(node);
        }

        const maskEl = this.getMask(maskImageEl, magnetBBox);
        const highlighterBBox = magnetBBox.clone().inflate(padding + maskClip);

        cellView.paper.defs.appendChild(maskEl.node);

        this.vel
            .transform(cellView.getNodeMatrix(node))
            .attr(highlighterBBox.toJSON())
            .attr({
                'mask': `url(#${maskEl.id})`,
                'fill': color
            });

        this.mount(cellView);
    },

    unhighlight(cellView) {
        this.vel.remove();
        const { paper } = cellView;
        const maskNode = paper.svg.getElementById(this.getMaskId());
        if (maskNode) {
            paper.defs.removeChild(maskNode);
        }
    }

});

export const mask = {

    highlight: function(cellView, magnetEl, opt) {
        const id = MaskHighlighterView.getId(magnetEl, opt);
        MaskHighlighterView.add(cellView, magnetEl, id, opt);
    },

    unhighlight: function(cellView, magnetEl, opt) {
        const id = MaskHighlighterView.getId(magnetEl, opt);
        HighlighterView.remove(cellView, id);
    }
};
