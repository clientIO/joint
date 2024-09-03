import * as g from '../g/index.mjs';
import { Control } from '../cellTools/Control.mjs';

export const RotateLabel = Control.extend({

    xAxisVector: new g.Point(1, 0),

    children() {
        const {
            buttonColor = '#333',
            iconColor = '#fff',
            outlineColor = '#fff'
        } = this.options;
        return [{
            selector: 'handle',
            tagName: 'g',
            attributes: {
                cursor: 'grab',
            },
            children: [{
                tagName: 'circle',
                attributes: {
                    r: 10,
                    fill: buttonColor,
                    stroke: outlineColor,
                },
            }, {
                tagName: 'path',
                attributes: {
                    d: 'M -5 0 A 5 5 0 1 1 0 5',
                    fill: 'transparent',
                    stroke: iconColor,
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                },
            }, {
                tagName: 'path',
                attributes: {
                    d: 'M -3 5 L 0 2.5 0 7.5 Z',
                    fill: iconColor,
                    stroke: iconColor,
                    strokeWidth: 1,
                    transform: 'rotate(-5, -3, 5)',
                }
            }]
        }];
    },

    getPosition(view) {
        const { offset = 0 } = this.options;
        const { x = 0, y = 0 } = typeof offset === 'number' ? { x: 0, y: offset } : offset;
        const label = this.getLabel();
        const labelPosition = this.getLabelPosition(label);
        const coords = view.getLabelCoordinates(labelPosition);
        let { angle = 0, args = {}} = labelPosition;
        const keepGradient = args.keepGradient;
        if (keepGradient) {
            const tangent = view.getTangentAtRatio(
                view.getClosestPointRatio(coords)
            );
            if (tangent) {
                // link slope angle
                angle += tangent.vector().vectorAngle(this.xAxisVector) || 0;
            }
        }
        const matrix = new DOMMatrix()
            .translate(coords.x, coords.y)
            .rotate(angle)
            .translate(x, y);
        return new g.Point(matrix.e, matrix.f);
    },

    // Override the default `computeVisibility` method to hide the tool if the label is not present.
    computeVisibility() {
        const visibility = Control.prototype.computeVisibility.apply(this, arguments);
        return visibility && !!this.getLabel();
    },

    setPosition(view, coordinates) {
        const model = view.model;
        const label = this.getLabel();
        if (!label) return;
        const labelPosition = this.getLabelPosition(label);
        const position = view.getLabelCoordinates(labelPosition);
        const angle = 90 - position.theta(coordinates);
        const index = this.getLabelIndex();
        model.prop(['labels', index, 'position', 'angle'], angle);
    },

    resetPosition(view) {
        const model = view.model;
        const index = this.getLabelIndex();
        model.prop(['labels', index, 'position', 'angle'], 0);
    },

    getLabelIndex() {
        return this.options.labelIndex || 0;
    },

    getLabel() {
        return this.relatedView.model.label(this.getLabelIndex()) || null;
    },

    getLabelPosition(label) {
        const view = this.relatedView;
        const labelPosition = view._normalizeLabelPosition(label.position);
        return view._mergeLabelPositionProperty(labelPosition, view._getDefaultLabelPositionProperty());
    },

});
