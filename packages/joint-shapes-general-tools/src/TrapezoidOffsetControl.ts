import { dia, elementTools, g } from '@joint/core';
import { Trapezoid } from '@joint/shapes-general';

export interface TrapezoidOffsetControlOptions extends elementTools.Control.Options {

    /** The value of the trapezoid offset after reset.
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
export class TrapezoidOffsetControl extends elementTools.Control<TrapezoidOffsetControlOptions> {
    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    get element(): Trapezoid {
        return this.relatedView.model as Trapezoid;
    }

    protected getPosition(view: dia.ElementView) {
        const { model } = view;
        const { width, height } = model.size();
        const controlLevel = height * 1 / 4;
        const offsetSide = new g.Line(new g.Point(this.element.offset, 0), new g.Point(0, height));
        const levelLine = new g.Line(new g.Point(0, controlLevel), new g.Point(width, controlLevel));
        const controlPoint = offsetSide.intersect(levelLine);
        return controlPoint ?? { x: 0, y: controlLevel };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
        const { model } = view;
        const { width } = model.size();
        let offset = coordinates.x * (3 / 2) ;
        offset = Math.max(0, Math.min(offset, width / 2));
        this.element.offset = offset;
    }

    protected resetPosition(): void {
        const { defaultOffset = 0 } = this.options;
        if (defaultOffset === false) return;
        const offset = (defaultOffset === true) ? 0 : defaultOffset;
        this.element.offset = offset;
    }
}
