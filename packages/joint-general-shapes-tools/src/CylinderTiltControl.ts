import { dia, elementTools, shapes } from '@joint/core';

export interface CylinderTiltControlOptions extends elementTools.Control.Options {

    /** The value of the cylinder tilt after reset.
     *
     * `Boolean` - When set to `false` the reset feature is disabled.
     *
     * `Number` - The value of the cylinder tilt.
     *
     */
    defaultTilt?: boolean | number;
}

/**
 * @category Shape-Specific
 */
export class CylinderTiltControl extends elementTools.Control<CylinderTiltControlOptions> {

    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    public getTilt(): number {
        const model = this.relatedView.model as shapes.standard.Cylinder;
        return Number(model.topRy());
    }

    public setTilt(tilt: number): void {
        const model = this.relatedView.model as shapes.standard.Cylinder;
        model.topRy(tilt, { ui: true, tool: this.cid });
    }

    protected getPosition(view: dia.ElementView) {
        const { model } = view;
        const { width } = model.size();
        const tilt = this.getTilt();
        return { x: width / 2, y: 2 * tilt };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
        const { model } = view;
        const { height } = model.size();
        const tilt = Math.min(Math.max(coordinates.y, 0), height) / 2;
        this.setTilt(tilt);
    }

    protected resetPosition(): void {
        const { defaultTilt = 0 } = this.options;
        if (defaultTilt === false) return;
        const tilt = (defaultTilt === true) ? 0 : defaultTilt;
        this.setTilt(tilt);
    }
}
