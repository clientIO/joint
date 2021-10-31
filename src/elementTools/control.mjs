import * as g from '../g/index.mjs';
import { ToolView } from '../dia/ToolView.mjs';
import * as util from '../util/index.mjs';

export const Control = ToolView.extend({
    tagName: 'g',
    children: [{
        tagName: 'circle',
        selector: 'handle',
        attributes: {
            'cursor': 'pointer'
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

        getPosition: function(view) {
            //
        },

        setPosition: function(view, coords, tool) {
            //
        },

        defaultAnchorAttributes: {
            'stroke-width': 2,
            'stroke': '#FFFFFF',
            'fill': 'orange',
            'r': 6
        },

        areaSelector: 'root',
        areaPadding: 6,
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
        var childNodes = this.childNodes;
        if (!childNodes) return;
        var handleNode = childNodes.handle;
        if (!handleNode) return;
        var relatedView = this.relatedView;
        var options = this.options;
        var position = new g.Point(options.getPosition.call(this, relatedView, this));
        handleNode.setAttribute('transform', 'translate(' + position.x + ',' + position.y + ')');
        var anchorAttributes = options.defaultAnchorAttributes;
        for (var attrName in anchorAttributes) {
            handleNode.setAttribute(attrName, anchorAttributes[attrName]);
        }
    },
    updateArea: function() {
        var childNodes = this.childNodes;
        if (!childNodes) return;
        var areaNode = childNodes.area;
        if (!areaNode) return;
        var relatedView = this.relatedView;
        var view = relatedView;
        var [magnet] = view.findBySelector(this.options.areaSelector);
        if (!magnet) return;
        var model = view.model;
        var padding = this.options.areaPadding;
        if (!isFinite(padding)) padding = 0;
        var bbox, angle, center;
        bbox = view.getNodeUnrotatedBBox(magnet);
        angle = model.angle();
        center = bbox.center();
        if (angle) center.rotate(model.getBBox().center(), -angle);
        bbox.inflate(padding);
        areaNode.setAttribute('x', -bbox.width / 2);
        areaNode.setAttribute('y', -bbox.height / 2);
        areaNode.setAttribute('width', bbox.width);
        areaNode.setAttribute('height', bbox.height);
        areaNode.setAttribute('transform', 'translate(' + center.x + ',' + center.y + ') rotate(' + angle + ')');
    },

    toggleArea: function(visible) {
        this.childNodes.area.style.display = (visible) ? '' : 'none';
    },

    onPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        this.paper.undelegateEvents();
        this.delegateDocumentEvents();
        this.focus();
        this.toggleArea(true);
        this.relatedView.model.startBatch('control-move', { ui: true, tool: this.cid });
    },

    onPointerMove: function(evt) {
        var relatedView = this.relatedView;
        var normalizedEvent = util.normalizeEvent(evt);
        var coords = this.paper.clientToLocalPoint(normalizedEvent.clientX, normalizedEvent.clientY);
        this.options.setPosition.call(this, relatedView, coords, this);
        this.update();
    },

    onPointerUp: function(evt) {
        this.paper.delegateEvents();
        this.undelegateDocumentEvents();
        this.blur();
        this.toggleArea(false);
        var linkView = this.relatedView;
        linkView.model.stopBatch('control-move', { ui: true, tool: this.cid });
    }
});
