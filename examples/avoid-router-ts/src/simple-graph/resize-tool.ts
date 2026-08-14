import { dia, elementTools, g } from '@joint/core';

export default class ResizeTool extends elementTools.Control {
    getPosition(view: dia.ElementView): dia.Point {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    }

    setPosition(view: dia.ElementView, coordinates: g.Point): void {
        const model = view.model;
        model.resize(
            Math.max(Math.round(coordinates.x / 2) * 2, 10),
            Math.max(Math.round(coordinates.y / 2) * 2, 10)
        );
    }
}
