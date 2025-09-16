
import * as util from '../util/index.mjs';
import { ToolView } from '../dia/ToolView.mjs';
import { getToolOptions, getViewBBox } from './helpers.mjs';

export const Boundary = ToolView.extend({
    name: 'boundary',
    tagName: 'rect',
    options: {
        padding: 10,
        useModelGeometry: false,
    },
    attributes: {
        'fill': 'none',
        'stroke': '#33334F',
        'stroke-width': .5,
        'stroke-dasharray': '5, 5',
        'pointer-events': 'none'
    },
    onRender: function() {
        this.update();
    },
    update: function() {
        const { relatedView: view, vel } = this;
        const { useModelGeometry, rotate, relative, padding } = getToolOptions(this);
        const normalizedPadding = util.normalizeSides(padding);
        let bbox = getViewBBox(view, { useModelGeometry, relative }).moveAndExpand({
            x: -normalizedPadding.left,
            y: -normalizedPadding.top,
            width: normalizedPadding.left + normalizedPadding.right,
            height: normalizedPadding.top + normalizedPadding.bottom
        });
        const model = view.model;
        // With relative positioning, rotation is implicit
        // (the tool rotates along with the element).
        if (model.isElement() && !relative) {
            const angle = model.angle();
            if (angle) {
                if (rotate) {
                    const origin = model.getCenter();
                    vel.rotate(angle, origin.x, origin.y, { absolute: true });
                } else {
                    bbox = bbox.bbox(angle);
                }
            }
        }
        vel.attr(bbox.toJSON());
        return this;
    }
});
