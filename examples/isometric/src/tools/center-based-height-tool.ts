import { dia, elementTools, g } from 'jointjs';
import { GRID_SIZE } from '../theme';
import { ISOMETRIC_HEIGHT_TOOL_MARKUP } from './tools';
import IsometricShape from '../shapes/isometric-shape';

interface CenterBasedHeightControlOptions extends elementTools.Control.Options {
    /** The value of the isometric height after reset.
     *
     * `Boolean` - When set to `false` the reset feature is disabled.
     *
     * `Number` - The value of the isometric height.
     *
     */
    defaultIsometricHeight?: boolean | number;
}
export class CenterBasedHeightControl extends elementTools.Control<CenterBasedHeightControlOptions> {

    preinitialize() {
        this.options.selector = 'base';
        this.children = ISOMETRIC_HEIGHT_TOOL_MARKUP;
    }

    get isometricHeight(): number {
        let { defaultIsometricHeight = 0 } = this.options;
        const fallBackIsometricHeight = typeof defaultIsometricHeight === 'number' ? defaultIsometricHeight : 0;
        return this.element.get('isometricHeight') ?? fallBackIsometricHeight;
    }

    get element(): IsometricShape {
        return this.relatedView.model as IsometricShape;
    }

    protected getPosition(view: dia.ElementView) {
        const element = view.model as IsometricShape;
        const { width, height } = element.size();
        const top = new g.Rect(element.topX, element.topY, width, height);
        return top.center();
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
        const element = view.model as IsometricShape;
        const { width, height } = element.size();
        const top = new g.Rect(element.topX, element.topY, width, height);
        const step = Math.round((top.center().y - coordinates.y) / GRID_SIZE) / 2;
        const isometricHeight = Math.max(0, element.isometricHeight + step * GRID_SIZE);
        element.set('isometricHeight', isometricHeight);
    }

    protected resetPosition(view: dia.ElementView): void {
        const element = view.model as IsometricShape;
        const { defaultIsometricHeight = 0 } = this.options;
        if (defaultIsometricHeight === false) return;
        const isometricHeight = (defaultIsometricHeight === true) ? 0 : defaultIsometricHeight;
        element.set('isometricHeight', isometricHeight);
    }
}
