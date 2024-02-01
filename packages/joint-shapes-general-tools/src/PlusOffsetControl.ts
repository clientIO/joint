import { dia, elementTools } from '@joint/core';
import { Plus } from '@joint/shapes-general';

export interface PlusOffsetControlOptions extends elementTools.Control.Options {
    /** The value of the Plus offset after reset.
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
export class PlusOffsetControl extends elementTools.Control<PlusOffsetControlOptions> {
    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    get element(): Plus {
        return this.relatedView.model as Plus;
    }

    protected getPosition(_view: dia.ElementView) {
        const { offset } = this.element;
        return { x: offset, y: offset };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
        const { model } = view;
        const { width } = model.size();
        let offset = Math.max(coordinates.x, coordinates.y);
        offset = Math.max(0, Math.min(offset, width / 2));
        this.element.offset = offset;
    }

    protected resetPosition(): void {
        const { defaultOffset = 0 } = this.options;
        if (defaultOffset === false) return;
        const offset = defaultOffset === true ? 0 : defaultOffset;
        this.element.offset = offset;
    }
}
