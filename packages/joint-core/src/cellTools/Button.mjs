import { evalCalcAttribute, isCalcAttribute } from '../dia/attributes/calc.mjs';
import { ToolView } from '../dia/ToolView.mjs';
import { getViewBBox } from './helpers.mjs';
import * as util from '../util/index.mjs';
import * as g from '../g/index.mjs';
import V from '../V/index.mjs';

export const Button = ToolView.extend({
    name: 'button',
    events: {
        'mousedown': 'onPointerDown',
        'touchstart': 'onPointerDown'
    },
    options: {
        distance: 0,
        offset: 0,
        scale: null,
        rotate: false
    },
    onRender: function() {
        this.renderChildren(this.options.markup);
        this.update();
    },
    update: function() {
        this.position();
        return this;
    },
    position: function() {
        const { vel } = this;
        vel.transform(this.getCellMatrix(), { absolute: true });
    },
    getCellMatrix() {
        return this.relatedView.model.isLink() ? this.getLinkMatrix() : this.getElementMatrix();
    },
    getElementMatrix() {
        const { relatedView: view, options } = this;
        let { x = 0, y = 0, offset = {}, useModelGeometry, rotate, scale } = options;
        let bbox = getViewBBox(view, useModelGeometry);
        const angle = view.model.angle();
        if (!rotate) bbox = bbox.bbox(angle);
        const { x: offsetX = 0, y: offsetY = 0 } = offset;
        if (util.isPercentage(x)) {
            x = parseFloat(x) / 100 * bbox.width;
        } else if (isCalcAttribute(x)) {
            x = Number(evalCalcAttribute(x, bbox));
        }
        if (util.isPercentage(y)) {
            y = parseFloat(y) / 100 * bbox.height;
        } else if (isCalcAttribute(y)) {
            y = Number(evalCalcAttribute(y, bbox));
        }
        let matrix = V.createSVGMatrix().translate(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        if (rotate) matrix = matrix.rotate(angle);
        matrix = matrix.translate(x + offsetX - bbox.width / 2, y + offsetY - bbox.height / 2);
        if (scale) matrix = matrix.scale(scale);
        return matrix;
    },
    getLinkMatrix() {
        const { relatedView: view, options } = this;
        const { offset = 0, distance = 0, rotate, scale } = options;
        let tangent, position, angle;
        if (util.isPercentage(distance)) {
            tangent = view.getTangentAtRatio(parseFloat(distance) / 100);
        } else {
            tangent = view.getTangentAtLength(distance);
        }
        if (tangent) {
            position = tangent.start;
            angle = tangent.vector().vectorAngle(new g.Point(1, 0)) || 0;
        } else {
            position = view.getConnection().start;
            angle = 0;
        }
        let matrix = V.createSVGMatrix()
            .translate(position.x, position.y)
            .rotate(angle)
            .translate(0, offset);
        if (!rotate) matrix = matrix.rotate(-angle);
        if (scale) matrix = matrix.scale(scale);
        return matrix;
    },
    onPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        var actionFn = this.options.action;
        if (typeof actionFn === 'function') {
            actionFn.call(this.relatedView, evt, this.relatedView, this);
        }
    }
});

export const Remove = Button.extend({
    name: 'remove',
    children: [{
        tagName: 'circle',
        selector: 'button',
        attributes: {
            'r': 7,
            'fill': '#FF1D00',
            'cursor': 'pointer'
        }
    }, {
        tagName: 'path',
        selector: 'icon',
        attributes: {
            'd': 'M -3 -3 3 3 M -3 3 3 -3',
            'fill': 'none',
            'stroke': '#FFFFFF',
            'stroke-width': 2,
            'pointer-events': 'none'
        }
    }],
    options: {
        distance: 60,
        offset: 0,
        action: function(evt, view, tool) {
            view.model.remove({ ui: true, tool: tool.cid });
        }
    }
});
