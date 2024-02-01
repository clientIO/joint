import { dia, elementTools, g } from '@joint/core';
import { Cube } from "@joint/shapes-general";

export interface CubeCornerToolOptions extends elementTools.Control.Options {

    defaultCornerX?: number;

    defaultCornerY?: number;

    lockAngle?: boolean;

}

/**
 * @category Shape-Specific
 */
export class CubeCornerTool extends elementTools.Control<CubeCornerToolOptions> {

    /** @ignore */
    preinitialize() {
        this.options.selector = 'background';
    }

    get element(): Cube {
        return this.relatedView.model as Cube;
    }

    protected getPosition(_view: dia.ElementView) {
        const { cornerX, cornerY } = this.element;
        return { x: cornerX, y: cornerY };
    }

    protected setPosition(_view: dia.ElementView, coordinates: dia.Point) {
        const { width, height } = this.element.size();

        if (!this.options.lockAngle) {
            this.element.cornerX = Math.max(0, Math.min(coordinates.x, width));
            this.element.cornerY = Math.max(0, Math.min(coordinates.y, height));

        } else {
            const defaultPosition = this.getDefaultPosition();
            const aspectRatio = defaultPosition.x / defaultPosition.y;

            let x, y;
            if (aspectRatio > 1) {
                x = Math.max(0, Math.min(coordinates.x, width));
                y = x / aspectRatio;
            } else {
                y = Math.max(0, Math.min(coordinates.y, height));
                x = y * aspectRatio;
            }

            this.element.cornerX = x;
            this.element.cornerY = y;
        }
    }

    protected resetPosition(): void {
        const defaultPosition = this.getDefaultPosition();

        this.element.cornerX = defaultPosition.x;
        this.element.cornerY = defaultPosition.y;
    }

    private getDefaultPosition(): g.Point {
        const { width, height } = this.element.size();

        const {
            defaultCornerX = width / 3,
            defaultCornerY = height / 2.5,
        } = this.options;

        return new g.Point(defaultCornerX, defaultCornerY);
    }

}
