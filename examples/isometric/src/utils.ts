import { g, V, dia, util } from '@joint/core';
import IsometricShape, { View } from './shapes/isometric-shape';
import { GRID_COUNT, GRID_SIZE, SCALE, ISOMETRIC_SCALE, ROTATION_DEGREES } from './theme';
import { Link } from './shapes';

export const transformationMatrix = (view: View = View.Isometric, margin: number = 20) => {
    let matrix = V.createSVGMatrix().translate(margin, margin);
    if (view === View.Isometric) {
        matrix = matrix
            .translate(GRID_COUNT * GRID_SIZE * SCALE * ISOMETRIC_SCALE, 0)
            .rotate(ROTATION_DEGREES)
            .skewX(-ROTATION_DEGREES)
            .scaleNonUniform(SCALE, SCALE * ISOMETRIC_SCALE);
    } else {
        matrix = matrix
            .scale(SCALE, SCALE);
    }
    return matrix;
}

export const doLinesOverlap = (line1: g.Line, line2: g.Line) => {
    return (line1.start.y <= line2.start.y && line1.end.y > line2.start.y) ||
        (line1.start.y >= line2.start.y && line1.start.y < line2.end.y) ||
        (line1.start.y === line2.start.y && line1.end.y === line2.end.y);
}

/**
 * Sorts elements by their y position. If two elements overlap on y axis,
 * they are sorted by their x position.
 * Note: The lowest z-index is 0. The links are not sorted with this method
 * and should have z-index set to -1.
 */
export const sortElements = (graph) => {

    const elements = graph.getElements();

    elements.sort((a: IsometricShape, b: IsometricShape) => {
        const aBBox = a.getBBox();
        const bBBox = b.getBBox();
        const lineAY = aBBox.rightLine();
        const lineBY = bBBox.rightLine();
        const overlapOnY = doLinesOverlap(lineAY, lineBY);
        if (overlapOnY) {
            return Math.sign(lineAY.end.x - lineBY.end.x);
        }
        return Math.sign(lineAY.end.y - lineBY.end.y);
    });

    elements.forEach((element, index) => {
        element.set('z', index);
    });
}

export const drawGrid = (paper: dia.Paper, size: number, step: number, color = '#E0E0E0') => {
    const gridData = [];
    const j = size;
    for (let i = 0; i <= j; i++) {
        gridData.push(`M 0,${i * step} ${j * step},${i * step}`);
        gridData.push(`M ${i * step}, 0 ${i * step},${j * step}`);
    }
    const gridVEl = V('path').attr({
        'd': gridData.join(' '),
        'fill': 'none',
        'stroke': color
    });
    gridVEl.appendTo(paper.getLayerNode(dia.Paper.Layers.BACK));
}

export const switchView = (paper: dia.Paper, view: View, selectedCell: IsometricShape | Link) => {
    paper.model.getElements().forEach((element: IsometricShape) => {
        element.toggleView(view);
    });
    if (view === View.Isometric) {
        sortElements(paper.model);
    }
    paper.matrix(transformationMatrix(view));
    if (selectedCell) {
        selectedCell.addTools(paper, view);
    }
}
