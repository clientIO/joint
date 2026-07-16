import { elementTools } from '@joint/core';

export default class ResizeTool extends elementTools.Control {
    getPosition(view) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    }

    setPosition(view, coordinates) {
        const model = view.model;
        model.resize(
            Math.max(Math.round(coordinates.x / 2) * 2, 10),
            Math.max(Math.round(coordinates.y / 2) * 2, 10)
        );
    }
}
