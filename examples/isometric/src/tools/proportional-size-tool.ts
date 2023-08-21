import { dia, elementTools, g } from 'jointjs';
import IsometricShape, { PyramidShape } from '../shapes/isometric-shape';
import { SIZE_TOOL_MARKUP } from './tools';
import { GRID_SIZE } from '../theme';

export class ProportionalSizeControl extends elementTools.Control {

    preinitialize() {
        this.options.selector = 'base';
        this.children = SIZE_TOOL_MARKUP;
    }

    protected getPosition(view: dia.ElementView) {
        const { width, height } = view.model.size();
        return new g.Point(width, height);
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point) {

        const element = view.model as IsometricShape;
        const graph = element.graph;

        const { width, height } = element.size();

        const step = Math.round((coordinates.x - width) / GRID_SIZE);
        const sizePerStep = step * GRID_SIZE;

        const newWidth = Math.max(GRID_SIZE, width + sizePerStep);
        const newHeight = Math.max(GRID_SIZE, height + sizePerStep);

        const { x, y } = element.position()
        const newBBox = new g.Rect(x, y, newWidth, newHeight);

        if (!graph.get('obstacles').isFree(newBBox, element.cid)) return;

        // Pyramids that are tall as wide are not appealing in isometric view
        if (element instanceof PyramidShape) {
            const pyramidStep = step <= -1 && width === GRID_SIZE && height === GRID_SIZE ? 0 : step;
            element.set('isometricHeight', element.isometricHeight + GRID_SIZE * pyramidStep)
        }

        element.resize(newWidth, newHeight);
    }
}
