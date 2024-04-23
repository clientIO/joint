import * as g from '../g/index.mjs';
import V from '../V/index.mjs';
import * as util from '../util/index.mjs';
import { ToolView } from '../dia/ToolView.mjs';

// End Markers
const Arrowhead = ToolView.extend({
    tagName: 'path',
    xAxisVector: new g.Point(1, 0),
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown'
    },
    documentEvents: {
        mousemove: 'onPointerMove',
        touchmove: 'onPointerMove',
        mouseup: 'onPointerUp',
        touchend: 'onPointerUp',
        touchcancel: 'onPointerUp'
    },
    options: {
        scale: null
    },
    onRender: function() {
        this.update();
    },
    update: function() {
        var ratio = this.ratio;
        var view = this.relatedView;
        var tangent = view.getTangentAtRatio(ratio);
        var position, angle;
        if (tangent) {
            position = tangent.start;
            angle = tangent.vector().vectorAngle(this.xAxisVector) || 0;
        } else {
            position = view.getPointAtRatio(ratio);
            angle = 0;
        }
        if (!position) return this;
        var matrix = V.createSVGMatrix().translate(position.x, position.y).rotate(angle);
        const { scale } = this.options;
        if (scale) matrix = matrix.scale(scale);
        this.vel.transform(matrix, { absolute: true });
        return this;
    },
    onPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        var relatedView = this.relatedView;
        var paper = relatedView.paper;
        relatedView.model.startBatch('arrowhead-move', { ui: true, tool: this.cid });
        relatedView.startArrowheadMove(this.arrowheadType);
        this.delegateDocumentEvents();
        paper.undelegateEvents();
        this.focus();
        this.el.style.pointerEvents = 'none';
        relatedView.notifyPointerdown(...paper.getPointerArgs(evt));
    },
    onPointerMove: function(evt) {
        var normalizedEvent = util.normalizeEvent(evt);
        var coords = this.paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        this.relatedView.pointermove(normalizedEvent, coords.x, coords.y);
    },
    onPointerUp: function(evt) {
        this.undelegateDocumentEvents();
        var relatedView = this.relatedView;
        var paper = relatedView.paper;
        var normalizedEvent = util.normalizeEvent(evt);
        var coords = paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        relatedView.pointerup(normalizedEvent, coords.x, coords.y);
        paper.delegateEvents();
        this.blur();
        this.el.style.pointerEvents = '';
        relatedView.model.stopBatch('arrowhead-move', { ui: true, tool: this.cid });
    }
});

export const TargetArrowhead = Arrowhead.extend({
    name: 'target-arrowhead',
    ratio: 1,
    arrowheadType: 'target',
    attributes: {
        'd': 'M -10 -8 10 0 -10 8 Z',
        'fill': '#33334F',
        'stroke': '#FFFFFF',
        'stroke-width': 2,
        'cursor': 'move',
        'class': 'target-arrowhead'
    }
});

export const SourceArrowhead = Arrowhead.extend({
    name: 'source-arrowhead',
    ratio: 0,
    arrowheadType: 'source',
    attributes: {
        'd': 'M 10 -8 -10 0 10 8 Z',
        'fill': '#33334F',
        'stroke': '#FFFFFF',
        'stroke-width': 2,
        'cursor': 'move',
        'class': 'source-arrowhead'
    }
});
