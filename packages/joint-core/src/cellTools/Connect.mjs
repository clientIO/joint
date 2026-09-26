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
        const linkDrag = paper.startLinkDrag(relatedView.createLinkFromMagnet(this.getMagnetNode(), x, y));
        this.linkDrag = linkDrag;
        // backwards compatibility events
        linkDrag.linkView.notifyPointerdown(normalizedEvent, x, y);
        paper.setDragging(normalizedEvent);
        paper.undelegateEvents();
        this.delegateDocumentEvents(null, normalizedEvent.data);
        this.focus();
    },
    drag: function(evt) {
        const { paper, linkDrag } = this;
        const [normalizedEvent, x, y] = paper.getPointerArgs(evt);
        linkDrag.move(normalizedEvent, x, y);
        // backwards compatibility events
        linkDrag.linkView.notifyPointermove(normalizedEvent, x, y);
    },
    dragend: function(evt) {
        const { paper, relatedView, linkDrag } = this;
        const [normalizedEvent, x, y] = paper.getPointerArgs(evt);
        const { linkView } = linkDrag;
        linkDrag.finish(normalizedEvent, x, y);
        this.linkDrag = null;
        // backwards compatibility events
        linkView.notifyPointerup(normalizedEvent, x, y);
        linkView.checkMouseleave(normalizedEvent);
        this.undelegateDocumentEvents();
        paper.delegateEvents();
        this.blur();
        relatedView.checkMouseleave(normalizedEvent);
    }
});
