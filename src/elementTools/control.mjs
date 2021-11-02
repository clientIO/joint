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
        selector: 'area',
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
        areaSelector: 'root',
        areaPadding: 6,
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
        this.toggleArea(false);
        this.update();
    },
    update: function() {
        this.updateHandle();
        this.updateArea();
        return this;
    },
    updateHandle: function() {
        const { relatedView, childNodes, options } = this;
        if (!childNodes) return;
        const handleNode = childNodes.handle;
        if (!handleNode) throw new Error('Control: markup selector `handle` is required');
        const position = this.getPosition(relatedView, this);
        handleNode.setAttribute('transform', `translate(${position.x},${position.y})`);
        const { handleAttributes } = options;
        if (handleAttributes) {
            for (let attrName in handleAttributes) {
                handleNode.setAttribute(attrName, handleAttributes[attrName]);
            }
        }
    },
    updateArea: function() {
        const { relatedView, childNodes, options } = this;
        if (!childNodes) return;
        const areaNode = childNodes.area;
        if (!areaNode) return;
        const [magnet] = relatedView.findBySelector(options.areaSelector);
        if (!magnet) return;
        const model = relatedView.model;
        let padding = options.areaPadding;
        if (!isFinite(padding)) padding = 0;
        let bbox, angle, center;
        bbox = relatedView.getNodeUnrotatedBBox(magnet);
        angle = model.angle();
        center = bbox.center();
        if (angle) center.rotate(model.getBBox().center(), -angle);
        bbox.inflate(padding);
        areaNode.setAttribute('x', -bbox.width / 2);
        areaNode.setAttribute('y', -bbox.height / 2);
        areaNode.setAttribute('width', bbox.width);
        areaNode.setAttribute('height', bbox.height);
        areaNode.setAttribute('transform', `translate(${center.x},${center.y}) rotate(${angle})`);
    },
    toggleArea: function(visible) {
        this.childNodes.area.style.display = (visible) ? '' : 'none';
    },
    onPointerDown: function(evt) {
        const { relatedView, paper } = this;
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        paper.undelegateEvents();
        this.delegateDocumentEvents();
        this.focus();
        this.toggleArea(true);
        relatedView.model.startBatch('control-move', { ui: true, tool: this.cid });
    },
    onPointerMove: function(evt) {
        const { relatedView, paper } = this;
        const { clientX, clientY } = util.normalizeEvent(evt);
        const coords = paper.clientToLocalPoint(clientX, clientY);
        this.setPosition(relatedView, coords, this);
        this.update();
    },
    onPointerUp: function(_evt) {
        const { relatedView, paper } = this;
        paper.delegateEvents();
        this.undelegateDocumentEvents();
        this.blur();
        this.toggleArea(false);
        relatedView.model.stopBatch('control-move', { ui: true, tool: this.cid });
    },
    onPointerDblClick: function() {
        const { relatedView } = this;
        this.resetPosition(relatedView, this);
        this.update();
    }

});
