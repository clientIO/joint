import * as g from '../g/index.mjs';
import * as util from '../util/index.mjs';
import { ToolView } from '../dia/ToolView.mjs';
import { getAnchor, snapAnchor } from './helpers.mjs';

const Anchor = ToolView.extend({
    tagName: 'g',
    type: null,
    children: [{
        tagName: 'circle',
        selector: 'anchor',
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
        snap: snapAnchor,
        anchor: getAnchor,
        scale: null,
        resetAnchor: true,
        customAnchorAttributes: {
            'stroke-width': 4,
            'stroke': '#33334F',
            'fill': '#FFFFFF',
            'r': 5
        },
        defaultAnchorAttributes: {
            'stroke-width': 2,
            'stroke': '#FFFFFF',
            'fill': '#33334F',
            'r': 6
        },
        areaPadding: 6,
        snapRadius: 10,
        restrictArea: true,
        redundancyRemoval: true
    },
    onRender: function() {
        this.renderChildren();
        this.toggleArea(false);
        this.update();
    },
    update: function() {
        var type = this.type;
        var relatedView = this.relatedView;
        var view = relatedView.getEndView(type);
        if (view) {
            this.updateAnchor();
            this.updateArea();
            this.el.style.display = '';
        } else {
            this.el.style.display = 'none';
        }
        return this;
    },
    updateAnchor: function() {
        var childNodes = this.childNodes;
        if (!childNodes) return;
        var anchorNode = childNodes.anchor;
        if (!anchorNode) return;
        var relatedView = this.relatedView;
        var type = this.type;
        var position = relatedView.getEndAnchor(type);
        var options = this.options;
        var customAnchor = relatedView.model.prop([type, 'anchor']);
        let transformString =  `translate(${position.x},${position.y})`;
        if (options.scale) {
            transformString += ` scale(${options.scale})`;
        }
        anchorNode.setAttribute('transform', transformString);
        var anchorAttributes = (customAnchor) ? options.customAnchorAttributes : options.defaultAnchorAttributes;
        for (var attrName in anchorAttributes) {
            anchorNode.setAttribute(attrName, anchorAttributes[attrName]);
        }
    },
    updateArea: function() {
        var childNodes = this.childNodes;
        if (!childNodes) return;
        var areaNode = childNodes.area;
        if (!areaNode) return;
        var relatedView = this.relatedView;
        var type = this.type;
        var view = relatedView.getEndView(type);
        var model = view.model;
        var magnet = relatedView.getEndMagnet(type);
        var padding = this.options.areaPadding;
        if (!isFinite(padding)) padding = 0;
        var bbox, angle, center;
        if (view.isNodeConnection(magnet)) {
            bbox = view.getNodeBBox(magnet);
            angle = 0;
            center = bbox.center();
        } else {
            bbox = view.getNodeUnrotatedBBox(magnet);
            angle = model.angle();
            center = bbox.center();
            if (angle) center.rotate(model.getBBox().center(), -angle);
            // TODO: get the link's magnet rotation into account
        }
        bbox.inflate(padding);
        areaNode.setAttribute('x', -bbox.width / 2);
        areaNode.setAttribute('y', -bbox.height / 2);
        areaNode.setAttribute('width', bbox.width);
        areaNode.setAttribute('height', bbox.height);
        areaNode.setAttribute('transform', 'translate(' + center.x + ',' + center.y + ') rotate(' + angle + ')');
    },
    toggleArea: function(visible) {
        var childNodes = this.childNodes;
        if (!childNodes) return;
        var areaNode = childNodes.area;
        if (!areaNode) return;
        areaNode.style.display = (visible) ? '' : 'none';
    },
    onPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        this.paper.undelegateEvents();
        this.delegateDocumentEvents();
        this.focus();
        this.toggleArea(this.options.restrictArea);
        this.relatedView.model.startBatch('anchor-move', { ui: true, tool: this.cid });
    },
    resetAnchor: function(anchor) {
        var type = this.type;
        var relatedModel = this.relatedView.model;
        if (anchor) {
            relatedModel.prop([type, 'anchor'], anchor, {
                rewrite: true,
                ui: true,
                tool: this.cid
            });
        } else {
            relatedModel.removeProp([type, 'anchor'], {
                ui: true,
                tool: this.cid
            });
        }
    },
    onPointerMove: function(evt) {

        var relatedView = this.relatedView;
        var type = this.type;
        var view = relatedView.getEndView(type);
        var model = view.model;
        var magnet = relatedView.getEndMagnet(type);
        var normalizedEvent = util.normalizeEvent(evt);
        var coords = this.paper.clientToLocalPoint(normalizedEvent.clientX, normalizedEvent.clientY);
        var snapFn = this.options.snap;
        if (typeof snapFn === 'function') {
            coords = snapFn.call(relatedView, coords, view, magnet, type, relatedView, this);
            coords = new g.Point(coords);
        }

        if (this.options.restrictArea) {
            if (view.isNodeConnection(magnet)) {
                // snap coords to the link's connection
                var pointAtConnection = view.getClosestPoint(coords);
                if (pointAtConnection) coords = pointAtConnection;
            } else {
                // snap coords within node bbox
                var bbox = view.getNodeUnrotatedBBox(magnet);
                var angle = model.angle();
                var origin = model.getBBox().center();
                var rotatedCoords = coords.clone().rotate(origin, angle);
                if (!bbox.containsPoint(rotatedCoords)) {
                    coords = bbox.pointNearestToPoint(rotatedCoords).rotate(origin, -angle);
                }
            }
        }

        var anchor;
        var anchorFn = this.options.anchor;
        if (typeof anchorFn === 'function') {
            anchor = anchorFn.call(relatedView, coords, view, magnet, type, relatedView);
        }

        this.resetAnchor(anchor);
        this.update();
    },

    onPointerUp: function(evt) {
        const normalizedEvent = util.normalizeEvent(evt);
        this.paper.delegateEvents();
        this.undelegateDocumentEvents();
        this.blur();
        this.toggleArea(false);
        var linkView = this.relatedView;
        if (this.options.redundancyRemoval) linkView.removeRedundantLinearVertices({ ui: true, tool: this.cid });
        linkView.checkMouseleave(normalizedEvent);
        linkView.model.stopBatch('anchor-move', { ui: true, tool: this.cid });
    },

    onPointerDblClick: function() {
        var anchor = this.options.resetAnchor;
        if (anchor === false) return; // reset anchor disabled
        if (anchor === true) anchor = null; // remove the current anchor
        this.resetAnchor(util.cloneDeep(anchor));
        this.update();
    }
});

export const SourceAnchor = Anchor.extend({
    name: 'source-anchor',
    type: 'source'
});

export const TargetAnchor = Anchor.extend({
    name: 'target-anchor',
    type: 'target'
});
