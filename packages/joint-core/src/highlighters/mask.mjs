import V from '../V/index.mjs';
import { HighlighterView } from '../dia/HighlighterView.mjs';

const MASK_CLIP = 20;

function forEachDescendant(vel, fn) {
    const descendants = vel.children();
    while (descendants.length > 0) {
        const descendant = descendants.shift();
        if (fn(descendant)) {
            descendants.push(...descendant.children());
        }
    }
}

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
        'marker-start',
        'marker-end',
        'marker-mid',
        'transform',
        'stroke-dasharray',
        'class',
    ],

    MASK_CHILD_ATTRIBUTE_BLACKLIST: [
        'stroke',
        'fill',
        'stroke-width',
        'stroke-opacity',
        'stroke-dasharray',
        'fill-opacity',
        'marker-start',
        'marker-end',
        'marker-mid',
        'class',
    ],

    // TODO: change the list to a function callback
    MASK_REPLACE_TAGS: [
        'FOREIGNOBJECT',
        'IMAGE',
        'USE',
        'TEXT',
        'TSPAN',
        'TEXTPATH'
    ],

    // TODO: change the list to a function callback
    MASK_REMOVE_TAGS: [
        'TEXT',
        'TSPAN',
        'TEXTPATH'
    ],

    transformMaskChild(cellView, childEl) {
        const {
            MASK_CHILD_ATTRIBUTE_BLACKLIST,
            MASK_REPLACE_TAGS,
            MASK_REMOVE_TAGS
        } = this;
        const childTagName = childEl.tagName();
        // Do not include the element in the mask's image
        if (!V.isSVGGraphicsElement(childEl) || MASK_REMOVE_TAGS.includes(childTagName)) {
            childEl.remove();
            return false;
        }
        // Replace the element with a rectangle
        if (MASK_REPLACE_TAGS.includes(childTagName)) {
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
            return false;
        }
        // Keep the element, but clean it from certain attributes
        MASK_CHILD_ATTRIBUTE_BLACKLIST.forEach(attrName => {
            if (attrName === 'fill' && childEl.attr('fill') === 'none') return;
            childEl.removeAttr(attrName);
        });
        return true;
    },

    transformMaskRoot(_cellView, rootEl) {
        const { MASK_ROOT_ATTRIBUTE_BLACKLIST } = this;
        MASK_ROOT_ATTRIBUTE_BLACKLIST.forEach(attrName => {
            rootEl.removeAttr(attrName);
        });
    },

    getMaskShape(cellView, vel) {
        const { options, MASK_REPLACE_TAGS } = this;
        const { deep } = options;
        const tagName = vel.tagName();
        let maskRoot;
        if (tagName === 'G') {
            if (!deep) return null;
            maskRoot = vel.clone();
            forEachDescendant(maskRoot, maskChild => this.transformMaskChild(cellView, maskChild));
        } else {
            if (MASK_REPLACE_TAGS.includes(tagName)) return null;
            maskRoot = vel.clone();
        }
        this.transformMaskRoot(cellView, maskRoot);
        return maskRoot;
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
