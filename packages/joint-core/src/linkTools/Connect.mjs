import { Button } from './Button.mjs';
import * as util from '../util/index.mjs';

export const Connect = Button.extend({
    name: 'connect',
    documentEvents: {
        mousemove: 'drag',
        touchmove: 'drag',
        mouseup: 'dragend',
        touchend: 'dragend',
        touchcancel: 'dragend'
    },
    children: [{
        tagName: 'circle',
        selector: 'button',
        attributes: {
            'r': 7,
            'fill': '#333333',
            'cursor': 'pointer'
        }
    }, {
        tagName: 'path',
        selector: 'icon',
        attributes: {
            'd': 'M -4 -1 L 0 -1 L 0 -4 L 4 0 L 0 4 0 1 -4 1 z',
            'fill': '#FFFFFF',
            'stroke': 'none',
            'stroke-width': 2,
            'pointer-events': 'none'
        }
    }],
    options: {
        distance: 80,
        offset: 0,
        magnet: (view) => view.el,
        action: (evt, _view, tool) => tool.dragstart(evt),
    },
    getMagnetNode: function() {
        const { options, relatedView } = this;
        const { magnet } = options;
        let magnetNode;
        switch (typeof magnet) {
            case 'function': {
                magnetNode = magnet.call(this, relatedView, this);
                break;
            }
            case 'string': {
                magnetNode = relatedView.findNode(magnet);
                break;
            }
            default: {
                magnetNode = magnet;
                break;
            }
        }
        if (!magnetNode) magnetNode = relatedView.el;
        if (magnetNode instanceof SVGElement) return magnetNode;
        throw new Error('Connect: magnet must be an SVGElement');
    },
    dragstart: function(evt) {
        const { paper, relatedView } = this;
        const normalizedEvent = util.normalizeEvent(evt);
        const { x, y } = paper.clientToLocalPoint(normalizedEvent.clientX, normalizedEvent.clientY);
        relatedView.dragLinkStart(normalizedEvent, this.getMagnetNode(), x, y);
        paper.undelegateEvents();
        this.delegateDocumentEvents(null, normalizedEvent.data);
        this.focus();
    },
    drag: function(evt) {
        const { paper, relatedView } = this;
        const normalizedEvent = util.normalizeEvent(evt);
        const { x, y } = paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        relatedView.dragLink(normalizedEvent, x, y);
    },
    dragend: function(evt) {
        const { paper, relatedView } = this;
        const normalizedEvent = util.normalizeEvent(evt);
        const { x, y } = paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        relatedView.dragLinkEnd(normalizedEvent, x, y);
        this.undelegateDocumentEvents();
        paper.delegateEvents();
        this.blur();
        relatedView.checkMouseleave(normalizedEvent);
    }
});
