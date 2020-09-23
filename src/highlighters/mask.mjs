import V from '../V/index.mjs';
import { HighlighterView } from '../dia/HighlighterView.mjs';

export const mask = HighlighterView.extend({

    tagName: 'rect',
    className: 'highlight-mask',
    attributes: {
        'pointer-events': 'none'
    },

    options: {
        padding: 3,
        maskClip: 20,
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
        'marker-start',
        'marker-end',
        'marker-mid',
        'transform'
    ],

    MASK_CHILD_ATTRIBUTE_BLACKLIST: [
        'stroke',
        'fill',
        'stroke-width',
        'stroke-opacity',
        'fill-opacity',
        'marker-start',
        'marker-end',
        'marker-mid'
    ],

    // TODO: change the list to a function callback
    MASK_REPLACE_TAGS: [
        'TEXT' // Experimental: it's currently not in use since the text is always removed
    ],

    // TODO: change the list to a function callback
    MASK_REMOVE_TAGS: [
        'TEXT'
    ],

    transformMaskChild(cellView, childEl) {
        const {
            MASK_CHILD_ATTRIBUTE_BLACKLIST,
            MASK_REPLACE_TAGS,
            MASK_REMOVE_TAGS
        } = this;
        const childTagName = childEl.tagName();
        if (MASK_REMOVE_TAGS.includes(childTagName)) {
            childEl.remove();
        } else if (MASK_REPLACE_TAGS.includes(childTagName)) {
            // Replace the child with a rectangle
            // Note: clone() method does not change the children ids
            const originalChild = cellView.vel.findOne(`#${childEl.id}`);
            if (originalChild) {
                const { node: originalNode } = originalChild;
                let childBBox = cellView.getNodeBoundingRect(originalNode);
                if (cellView.model.isElement()) {
                    childBBox = V.transformRect(childBBox, cellView.getNodeMatrix(originalNode));
                }
                const replacement = V('rect', childBBox.toJSON());
                const { x: ox, y: oy } = childBBox.center();
                const { angle, cx = ox, cy = oy } = originalChild.rotate();
                if (angle) replacement.rotate(angle, cx, cy);
                // Note: it's not important to keep the same sibling index since all subnodes are filled
                childEl.parent().append(replacement);
            }
            childEl.remove();
        } else {
            // Clean the child from certain attributes
            MASK_CHILD_ATTRIBUTE_BLACKLIST.forEach(attrName => {
                if (attrName === 'fill' && childEl.attr('fill') === 'none') return;
                childEl.removeAttr(attrName);
            });
        }
    },

    transformMaskRoot(_cellView, rootEl) {
        const { MASK_ROOT_ATTRIBUTE_BLACKLIST } = this;
        MASK_ROOT_ATTRIBUTE_BLACKLIST.forEach(attrName => {
            rootEl.removeAttr(attrName);
        });
    },

    getMaskShape(cellView, vel) {
        const { options } = this;
        const { deep } = options;
        let maskRoot;
        if (vel.tagName() === 'G') {
            if (!deep) return null;
            maskRoot = vel.clone();
            maskRoot.find('*').forEach(maskChild => this.transformMaskChild(cellView, maskChild));
        } else {
            maskRoot = vel.clone();
        }
        this.transformMaskRoot(cellView, maskRoot);
        return maskRoot;
    },

    getMaskId() {
        return `highlight-mask-${this.cid}`;
    },

    getMask(cellView, vel) {

        const { VISIBLE, INVISIBLE, options } = this;
        const { padding, attrs } = options;

        const strokeWidth = ('stroke-width' in attrs) ? attrs['stroke-width'] : 1;
        const hasNodeFill = vel.attr('fill') !== 'none';
        let magnetStrokeWidth = parseFloat(vel.attr('stroke-width'));
        if (isNaN(magnetStrokeWidth)) magnetStrokeWidth = 1;
        // stroke of the invisible shape
        const minStrokeWidth = magnetStrokeWidth + padding * 2;
        // stroke of the visible shape
        const maxStrokeWidth = minStrokeWidth + strokeWidth * 2;
        let maskEl = this.getMaskShape(cellView, vel);
        if (!maskEl) {
            maskEl =  V('rect', cellView.getNodeBoundingRect(vel.node).toJSON());
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

        const { options } = this;
        const { padding, attrs, maskClip } = options;
        const color = ('stroke' in attrs) ? attrs['stroke'] : '#000000';
        const highlighterBBox = cellView.getNodeBoundingRect(node).inflate(padding + maskClip);
        const maskEl = this.getMask(cellView, V(node));
        this.addMask(cellView.paper, maskEl);

        this.vel
            .attr(highlighterBBox.toJSON())
            .attr({
                'transform': V.matrixToTransformString(cellView.getNodeMatrix(node)),
                'mask': `url(#${maskEl.id})`,
                'fill': color
            });

        this.mount();
    },

    unhighlight(cellView) {
        this.vel.remove();
        this.removeMask(cellView.paper);
    }

});
