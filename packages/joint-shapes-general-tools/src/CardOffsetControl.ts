import { dia, elementTools } from '@joint/core';
import { Card } from "@joint/shapes-general";


export interface CardOffsetControlOptions extends elementTools.Control.Options {

    defaultOffset?: boolean | number; // use false to disable the reset function

}

/**
 * @category Shape-Specific
 */
export class CardOffsetControl extends elementTools.Control<CardOffsetControlOptions> {

    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    get element(): Card {
        return this.relatedView.model as Card;
    }

    protected getPosition(_view: dia.ElementView) {
        const { offset } = this.element;
        const { width, height } = this.element.size();
        return {
            x: width - offset,
            y: height / 2
        };
    }

    protected setPosition(_view: dia.ElementView, coordinates: dia.Point) {
        const { width } = this.element.size();

        this.element.offset = Math.max(0, Math.min(width / 2, width - coordinates.x));
    }

    protected resetPosition(): void {
        const { defaultOffset } = this.options;

        if (defaultOffset === false) {
            return;
        } else {
            this.element.offset = (defaultOffset === true ? 0 : defaultOffset);
        }
    }

}
