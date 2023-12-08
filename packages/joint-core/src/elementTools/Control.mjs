import { ToolView } from '../dia/ToolView.mjs';
import * as util from '../util/index.mjs';

export const Control = ToolView.extend({
    tagName: 'g',
    children: [{
        tagName: 'circle',
        selector: 'handle',
        attributes: {
            'cursor': 'pointer',
            'stroke-width': 2,
            'stroke': '#FFFFFF',
            'fill': '#33334F',
            'r': 6
        }
    }, {
        tagName: 'rect',
        selector: 'extras',
        attributes: {
            'pointer-events': 'none',
            'fill': 'none',
            'stroke': '#33334F',
            'stroke-dasharray': '2,4',
            'rx': 5,
            'ry': 5
        }
    }],
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown',
        dblclick: 'onPointerDblClick',
        dbltap: 'onPointerDblClick'
    },
    documentEvents: {
        mousemove: 'onPointerMove',
        touchmove: 'onPointerMove',
        mouseup: 'onPointerUp',
        touchend: 'onPointerUp',
        touchcancel: 'onPointerUp'
    },
    options: {
        handleAttributes: null,
        selector: 'root',
        padding: 6,
        scale: null
    },

    getPosition: function() {
        // To be overridden
    },
    setPosition: function() {
        // To be overridden
    },
    resetPosition: function() {
        // To be overridden
    },
    onRender: function() {
        this.renderChildren();
        this.toggleExtras(false);
        this.update();
    },
    update: function() {
        const { handle, extras } = this.childNodes;
        if (handle) {
            this.updateHandle(handle);
        } else {
            throw new Error('Control: markup selector `handle` is required');
        }
        if (extras) {
            this.updateExtras(extras);
        }
        return this;
    },
    updateHandle: function(handleNode) {
        const { relatedView, options } = this;
        const { model } = relatedView;
        const relativePos = this.getPosition(relatedView, this);
        const absolutePos = model.getAbsolutePointFromRelative(relativePos);
        const { handleAttributes, scale } = options;
        let transformString =  `translate(${absolutePos.x},${absolutePos.y})`;
        if (scale) {
            transformString += ` scale(${scale})`;
        }
        handleNode.setAttribute('transform', transformString);
        if (handleAttributes) {
            for (let attrName in handleAttributes) {
                handleNode.setAttribute(attrName, handleAttributes[attrName]);
            }
        }
    },
    updateExtras: function(extrasNode) {
        const { relatedView, options } = this;
        const { selector } = this.options;
        if (!selector) {
            this.toggleExtras(false);
            return;
        }
        const magnet = relatedView.findNode(selector);
        if (!magnet) throw new Error('Control: invalid selector.');
        let padding = options.padding;
        if (!isFinite(padding)) padding = 0;
        const bbox = relatedView.getNodeUnrotatedBBox(magnet);
        const model = relatedView.model;
        const angle = model.angle();
        const center = bbox.center();
        if (angle) center.rotate(model.getBBox().center(), -angle);
        bbox.inflate(padding);
        extrasNode.setAttribute('x', -bbox.width / 2);
        extrasNode.setAttribute('y', -bbox.height / 2);
        extrasNode.setAttribute('width', bbox.width);
        extrasNode.setAttribute('height', bbox.height);
        extrasNode.setAttribute('transform', `translate(${center.x},${center.y}) rotate(${angle})`);
    },
    toggleExtras: function(visible) {
        const { extras } = this.childNodes;
        if (!extras) return;
        extras.style.display = (visible) ? '' : 'none';
    },
    onPointerDown: function(evt) {
        const { relatedView, paper } = this;
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        paper.undelegateEvents();
        this.delegateDocumentEvents();
        this.focus();
        this.toggleExtras(true);
        relatedView.model.startBatch('control-move', { ui: true, tool: this.cid });
    },
    onPointerMove: function(evt) {
        const { relatedView, paper } = this;
        const { model } = relatedView;
        const { clientX, clientY } = util.normalizeEvent(evt);
        const coords = paper.clientToLocalPoint(clientX, clientY);
        const relativeCoords = model.getRelativePointFromAbsolute(coords);
        this.setPosition(relatedView, relativeCoords, this);
        this.update();
    },
    onPointerUp: function(_evt) {
        const { relatedView, paper } = this;
        paper.delegateEvents();
        this.undelegateDocumentEvents();
        this.blur();
        this.toggleExtras(false);
        relatedView.model.stopBatch('control-move', { ui: true, tool: this.cid });
    },
    onPointerDblClick: function() {
        const { relatedView } = this;
        this.resetPosition(relatedView, this);
        this.update();
    }

});
