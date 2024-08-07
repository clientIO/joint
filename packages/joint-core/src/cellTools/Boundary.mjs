
import * as util from '../util/index.mjs';
import { ToolView } from '../dia/ToolView.mjs';
import { getViewBBox } from './helpers.mjs';

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
        const { relatedView: view, options, vel } = this;
        const { useModelGeometry, rotate } = options;
        const padding = util.normalizeSides(options.padding);
        let bbox = getViewBBox(view, useModelGeometry).moveAndExpand({
            x: -padding.left,
            y: -padding.top,
            width: padding.left + padding.right,
            height: padding.top + padding.bottom
        });
        var model = view.model;
        if (model.isElement()) {
            var angle = model.angle();
            if (angle) {
                if (rotate) {
                    var origin = model.getBBox().center();
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
