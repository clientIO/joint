import { dia, elementTools, g } from '@joint/core';
import { Parallelogram } from '@joint/shapes-general';

export interface ParallelogramOffsetControlOptions extends elementTools.Control.Options {

    /** The value of the parallelogram offset after reset.
     *
     * `Boolean` - When set to `false` the reset feature is disabled.
     *
     * `Number` - The value of the offset.
     *
     */
    defaultOffset?: boolean | number;
}

/**
 * @category Shape-Specific
 */
export class ParallelogramOffsetControl extends elementTools.Control<ParallelogramOffsetControlOptions> {
    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    get element(): Parallelogram {
        return this.relatedView.model as Parallelogram;
    }

    protected getPosition(view: dia.ElementView) {
        const { model } = view;
        const { width, height } = model.size();
        const controlLevel = height * (1 / 3);
        const offsetSide = new g.Line(new g.Point(this.element.offset, 0), new g.Point(0, height));
        const levelLine = new g.Line(new g.Point(0, controlLevel), new g.Point(width, controlLevel));
        const controlPoint = offsetSide.intersect(levelLine);
        if (controlPoint) return controlPoint;
        return { x: 0, y: controlLevel };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
        const { model } = view;
        const { width } = model.size();
        let offset = coordinates.x * (3 / 2) ;
        offset = Math.max(0, Math.min(offset, width));
        this.element.offset = offset;
    }

    protected resetPosition(): void {
        const { defaultOffset = 0 } = this.options;
        if (defaultOffset === false) return;
        const offset = (defaultOffset === true) ? 0 : defaultOffset;
        this.element.offset = offset;
    }
}
