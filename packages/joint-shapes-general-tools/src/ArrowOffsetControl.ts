import { dia, elementTools } from '@joint/core';
import { Arrow } from '@joint/shapes-general';

export interface ArrowOffsetControlOptions
    extends elementTools.Control.Options {
    /* This prop will set the default value of arrow thickness after the reset
     *
     * `defaultThickness` -  To assign a default thickness for the arrow. If not assigned it will be the 1/3 of the height.
     *
     */
    defaultThickness?: number;

    /* This prop will set the default value of arrowHeight after the reset
     *
     * `defaultArrowHeight` -  To assign a default height for the arrow. If not assigned it will be the 1/3 of the width.
     *
     */
    defaultArrowHeight?: number;
}

/**
 * @category Shape-Specific
 */
export class ArrowOffsetControl extends elementTools.Control<ArrowOffsetControlOptions> {
    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    get element(): Arrow {
        return this.relatedView.model as Arrow;
    }

    protected getPosition() {
        let { arrowHeight, thickness } = this.element;
        const { width, height } = this.element.size();
        return { x: width - arrowHeight, y: height / 2 - thickness / 2 };
    }

    protected setPosition(_view: dia.ElementView, coordinates: dia.Point) {
        const { width, height } = this.element.size();
        const arrowHeight = Math.max(0, Math.min(width - coordinates.x, width));
        this.element.arrowHeight = arrowHeight;
        const thickness = Math.max(
            0,
            Math.min(height - 2 * coordinates.y, height)
        );
        this.element.thickness = thickness;
    }

    protected resetPosition(): void {
        const { width, height } = this.element.size();
        const {
            defaultArrowHeight = width / 3,
            defaultThickness = height / 3,
        } = this.options;

        this.element.arrowHeight = defaultArrowHeight;
        this.element.thickness = defaultThickness;
    }
}
