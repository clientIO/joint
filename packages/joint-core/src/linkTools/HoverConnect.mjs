import { Connect } from '../linkTools/Connect.mjs';
import V from '../V/index.mjs';
import $ from '../mvc/Dom/index.mjs';
import * as util from '../util/index.mjs';
import * as g from '../g/index.mjs';

export const HoverConnect = Connect.extend({

    name: 'hover-connect',

    defaultMarkup: [
        {
            tagName: 'circle',
            attributes: {
                'r': 7,
                'fill': '#333333',
                'cursor': 'pointer'
            }
        },
        {
            tagName: 'path',
            attributes: {
                'd': 'M -4 -1 L 0 -1 L 0 -4 L 4 0 L 0 4 0 1 -4 1 z',
                'fill': '#FFFFFF',
                'stroke': 'none',
                'stroke-width': 2
            }
        }
    ],

    children() {
        const { options, defaultMarkup } = this;
        return [
            {
                tagName: 'path',
                selector: 'track',
                attributes: {
                    'fill': 'none',
                    'stroke': 'transparent',
                    'stroke-width': options.trackWidth || 15,
                    'cursor': 'pointer'
                }
            },
            {
                tagName: 'g',
                selector: 'button',
                attributes: {
                    'pointer-events': 'none',
                    'display': 'none'
                },
                children: options.markup || defaultMarkup
            }
        ];
    },

    events: Object.assign({
        mousemove: 'onMousemove',
        mouseenter: 'onMouseenter',
        mouseleave: 'onMouseleave'
    }, Connect.prototype.events),

    onRender: function() {
        this.renderChildren();
        this.update();
    },

    trackPath: null,

    update() {
        const { childNodes } = this;
        this.trackPath = this.getTrackPath();
        Connect.prototype.update.apply(this, arguments);
        childNodes.track.setAttribute(
            'd',
            this.trackPath.serialize()
        );
    },

    position() {
        const { el, childNodes } = this;
        childNodes.button.setAttribute(
            'transform',
            V.matrixToTransformString(this.getButtonMatrix())
        );
        el.setAttribute(
            'transform',
            V.matrixToTransformString(this.getTrackMatrix())
        );
    },

    getButtonMatrix() {
        const { options, trackPath } = this;
        const { offset = 0, distance = 0, rotate, scale } = options;
        let tangent, position, angle;
        if (util.isPercentage(distance)) {
            tangent = trackPath.tangentAtRatio(parseFloat(distance) / 100);
        } else {
            tangent = trackPath.tangentAtLength(distance);
        }
        if (tangent) {
            position = tangent.start;
            angle = tangent.vector().vectorAngle(new g.Point(1, 0)) || 0;
        } else {
            position = trackPath.start;
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

    getTrackPath() {
        return this.relatedView.getConnection();
    },

    getTrackMatrix() {
        return V.createSVGMatrix();
    },

    getTrackRatioFromEvent(evt) {
        const { relatedView, trackPath } = this;
        const localPoint = relatedView.paper.clientToLocalPoint(evt.clientX, evt.clientY);
        const trackPoint = V.transformPoint(localPoint, this.getTrackMatrix().inverse());
        return trackPath.closestPointLength(trackPoint);
    },

    canShowButton() {
        // Has been the paper events undelegated? If so, we can't show the button.
        // TODO: add a method to the paper to check if the events are delegated.
        return $.event.has(this.paper.el);
    },

    showButton() {
        this.childNodes.button.style.display = 'block';
    },

    hideButton() {
        this.childNodes.button.style.display = '';
    },

    onMousemove(evt) {
        const { trackPath } = this;
        if (!trackPath) return;
        const { options } = this;
        options.distance = this.getTrackRatioFromEvent(evt);
        this.position();
    },

    onMouseenter() {
        if (!this.canShowButton()) return;
        this.showButton();
    },

    onMouseleave() {
        this.hideButton();
    }
});
