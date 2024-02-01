import { dia, elementTools, g } from '@joint/core';
import { Document } from '@joint/shapes-general';

export interface DocumentOffsetControlOptions extends elementTools.Control.Options {

    /** The value of the document offset after reset.
     *
     * `Boolean` - When set to `false` the reset feature is disabled.
     *
     * `Number` - The value of the offset.
     *
     */
    defaultOffset?: boolean | number;
}

export class DocumentOffsetControl extends elementTools.Control<DocumentOffsetControlOptions> {
    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    get element(): Document {
        return this.relatedView.model as Document;
    }

    protected getPosition(view: dia.ElementView) {
        const { model } = view;
        const { width, height } = model.size();

        const { CP2_X_FACTOR, CURVE_END_X_FACTOR, CP3_X_FACTOR } = this.element;
        const inverseCPXFactor = CP2_X_FACTOR * 2;
        const curveVertexXFactor = 0.7;

        const controlCurve = new g.Curve(new g.Point(CURVE_END_X_FACTOR * width, height - this.element.offset), new g.Point(inverseCPXFactor * width, height - 2 * this.element.offset), new g.Point(CP3_X_FACTOR * width, height - 2 * this.element.offset), new g.Point(width, height - this.element.offset));

        const offsetSide = new g.Line(new g.Point(curveVertexXFactor * width, 0), new g.Point(curveVertexXFactor * width, height));
        const controlPoint = offsetSide.intersect(controlCurve.toPolyline())[0];
        return controlPoint ?? { x: 0, y: 0 };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
        const { model } = view;
        const { height } = model.size();
        const offset = Math.max(0, Math.min((height - coordinates.y) / 2, height / 2));
        this.element.offset = offset;
    }

    protected resetPosition(): void {
        const { defaultOffset = 0 } = this.options;
        if (defaultOffset === false) return;
        const offset = (defaultOffset === true) ? 0 : defaultOffset;
        this.element.offset = offset;
    }
}
