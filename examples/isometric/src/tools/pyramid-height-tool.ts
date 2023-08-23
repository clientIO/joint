import { elementTools, dia, g } from 'jointjs';
import { PyramidShape } from '../shapes/isometric-shape';
import { ISOMETRIC_HEIGHT_TOOL_MARKUP } from './tools';
import { GRID_SIZE } from '../theme';

interface PyramidHeightControlOptions extends elementTools.Control.Options {
    /** The value of the isometric height after reset.
     *
     * `Boolean` - When set to `false` the reset feature is disabled.
     *
     * `Number` - The value of the isometric height.
     *
     */
    defaultIsometricHeight?: boolean | number;
}

export class PyramidHeightControl extends elementTools.Control<PyramidHeightControlOptions> {

    preinitialize() {
        this.options.selector = 'base';
        this.children = ISOMETRIC_HEIGHT_TOOL_MARKUP;
    }

    get element(): PyramidShape {
        return this.relatedView.model as PyramidShape;
    }

    protected getPosition() {
        return new g.Point(this.element.topX, this.element.topY);
    }

    protected setPosition(_: dia.ElementView, coordinates: dia.Point) {
        const { height } = this.element.size();
        const step = Math.round((this.element.topY - coordinates.y) / GRID_SIZE)
        const isometricHeight = Math.max(height, this.element.isometricHeight + step * GRID_SIZE);
        this.element.set('isometricHeight', isometricHeight);
    }

    protected resetPosition(): void {
        const { defaultIsometricHeight = 0 } = this.options;
        if (defaultIsometricHeight === false) return;
        const isometricHeight = (defaultIsometricHeight === true) ? 0 : defaultIsometricHeight;
        this.element.set('isometricHeight', isometricHeight);
    }
}
