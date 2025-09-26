import { ToolView } from '../dia/ToolView.mjs';
import * as util from '../util/index.mjs';
import { getToolOptions, getViewBBox } from './helpers.mjs';

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
        const { options: { handleAttributes }} = this;
        handleNode.setAttribute('transform', this.getHandleTransformString());
        if (handleAttributes) {
            for (let attrName in handleAttributes) {
                handleNode.setAttribute(attrName, handleAttributes[attrName]);
            }
        }
    },
    getHandleTransformString() {
        const { relatedView, options } = this;
        const { scale } = options;
        const { model } = relatedView;
        const relativePos = this.getPosition(relatedView, this);
        const translate = this.isOverlay()
            // The tool is rendered in the coordinate system of the paper
            ? model.getAbsolutePointFromRelative(relativePos)
            // The tool is rendered in the coordinate system of the relatedView
            : relativePos;
        let transformString =  `translate(${translate.x},${translate.y})`;
        if (scale) {
            transformString += ` scale(${scale})`;
        }
        return transformString;
    },
    updateExtras: function(extrasNode) {
        const { relatedView, options } = this;
        const { selector, relative, useModelGeometry } = getToolOptions(this);
        if (!selector) {
            // Hide the extras if no selector is given.
            this.toggleExtras(false);
            return;
        }
        // Get the size for the extras rectangle and update it.
        let bbox;
        if (useModelGeometry) {
            if (selector !== 'root') {
                // A selector other than null or `root` was provided.
                console.warn('Control: selector will be ignored when `useModelGeometry` is used.');
            }
            bbox = getViewBBox(relatedView, { useModelGeometry, relative });
        } else {
            // The reference node for calculating the bounding box of the extras.
            const el = relatedView.findNode(selector);
            if (!el) throw new Error('Control: invalid selector.');
            bbox = getViewBBox(relatedView, { el });
        }
        let padding = options.padding;
        if (!isFinite(padding)) padding = 0;
        const model = relatedView.model;
        // With relative positioning, rotation is implicit
        // (the tool rotates along with the element).
        const angle = relative ? 0 : model.angle();
        const center = bbox.center();
        if (angle) center.rotate(model.getCenter(), -angle);
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
        this.setPosition(relatedView, relativeCoords, evt);
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
    onPointerDblClick: function(evt) {
        const { relatedView } = this;
        this.resetPosition(relatedView, evt);
        this.update();
    }

});
