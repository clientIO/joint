import { dia, elementTools, g } from 'jointjs';
import IsometricShape from '../shapes/isometric-shape';
import { GRID_SIZE } from '../theme';
import { SIZE_TOOL_MARKUP } from './tools';

export class SizeControl extends elementTools.Control {

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

        const x = Math.round((coordinates.x - width) / GRID_SIZE);
        const y = Math.round((coordinates.y - height) / GRID_SIZE);

        const { x: elX, y: elY } = element.position()
        const newWidth = Math.max(GRID_SIZE, width + x * GRID_SIZE);
        const newHeight = Math.max(GRID_SIZE, height + y * GRID_SIZE);
        const newBBox = new g.Rect(elX, elY, newWidth, newHeight);

        if (!graph.get('obstacles').isFree(newBBox, element.cid)) return;

        element.resize(newWidth, newHeight);
    }
}
