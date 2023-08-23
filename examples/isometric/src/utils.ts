import { g, V, dia, util } from 'jointjs';
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

export interface Node {
    el: dia.Element,
    behind: Node[],
    visited: boolean,
    depth?: number
}

const topologicalSort = (nodes: Node[]) => {
    let depth = 0;

    const visitNode = (node: Node) => {
        if (!node.visited) {
            node.visited = true;

            for (let i = 0; i < node.behind.length; ++i) {
                if (node.behind[i] == null) {
                    break;
                }
                else {
                    visitNode(node.behind[i]);
                    delete node.behind[i];
                }
            }

            node.depth = depth++;
            node.el.set('z', node.depth);
        }
    }

    for (let i = 0; i < nodes.length; ++i)
    {
        visitNode(nodes[i]);
    }
}

export const sortElements = (graph) => {
    const elements = graph.getElements();
    const nodes: Node[] = elements.map(el => {
        return {
            el: el,
            behind: [],
            visited: false
        }
    });

    for (let i = 0; i < nodes.length; ++i)
    {
        const a = nodes[i].el;
        const aBBox = a.getBBox();
        const aMax = aBBox.bottomRight();

        for (let j = 0; j < nodes.length; ++j)
        {
            if (i != j)
            {
                const b = nodes[j].el;
                const bBBox = b.getBBox();
                const bMin = bBBox.topLeft();

                if (bMin.x < aMax.x && bMin.y < aMax.y)
                {
                    nodes[i].behind.push(nodes[j]);
                }
            }
        }
    }

    topologicalSort(nodes);

    return nodes;
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
