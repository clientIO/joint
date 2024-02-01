import { dia, elementTools } from '@joint/core';
import { Note } from '@joint/shapes-general';

export interface NoteOffsetControlOptions extends elementTools.Control.Options {
    /** The value of the Note offset after reset.
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
export class NoteOffsetControl extends elementTools.Control<NoteOffsetControlOptions> {
    /** @ignore */
    preinitialize() {
        this.options.selector = 'sheet';
    }

    get element(): Note {
        return this.relatedView.model as Note;
    }

    protected getPosition(_view: dia.ElementView) {
        const { offset } = this.element;
        return { x: offset, y: offset };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
        const { model } = view;
        const { width } = model.size();
        let offset = Math.max(coordinates.x, coordinates.y);
        offset = Math.max(0, Math.min(width, offset));
        this.element.offset = offset;
    }

    protected resetPosition(): void {
        const { defaultOffset = 0 } = this.options;
        if (defaultOffset === false) return;
        const offset = defaultOffset === true ? 0 : defaultOffset;
        this.element.offset = offset;
    }
}
