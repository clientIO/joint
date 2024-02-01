import { dia, elementTools, g } from '@joint/core';
import { Hexagon } from '@joint/shapes-general';

export interface HexagonOffsetControlOptions extends elementTools.Control.Options {

    /** The value of the hexagon offset after reset.
     *
     * `Boolean` - When set to `false` the reset feature is disabled.
     *
     * `Number` - The value of the offset.
     *
     */
    defaultOffset?: boolean | number;
}

export class HexagonOffsetControl extends elementTools.Control<HexagonOffsetControlOptions> {
    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    get element(): Hexagon {
        return this.relatedView.model as Hexagon;
    }

    protected getPosition(view: dia.ElementView) {
        const { model } = view;
        const { width, height } = model.size();
        const controlLevel = height * 0.5;

        const offsetSide = new g.Line(new g.Point(this.element.offset, 0), new g.Point(this.element.offset, height));
        const levelLine = new g.Line(new g.Point(0, controlLevel), new g.Point(width, controlLevel));
        const controlPoint = offsetSide.intersect(levelLine);
        return controlPoint ?? { x: 0, y: controlLevel };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
        const { model } = view;
        const { width } = model.size();
        const offset = Math.max(0, Math.min(coordinates.x, width / 2));
        this.element.offset = offset;
    }

    protected resetPosition(): void {
        const { defaultOffset = 0 } = this.options;
        if (defaultOffset === false) return;
        const offset = (defaultOffset === true) ? 0 : defaultOffset;
        this.element.offset = offset;
    }
}
