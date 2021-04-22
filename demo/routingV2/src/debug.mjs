import * as joint from '../../../../rappid/rappid.mjs';

export const debugConf = {
    showGraph: false,
    showGrid: false,
    showGetInBox: false,
    gridBenchmark: true,
    gridUpdateBenchmark: true,
    plannerBenchmark: true,
    routerBenchmark: false,
    fullRouterBenchmark: true,

    // demo project setup
    graphType: 'random' // grid-layout or random
}
export const debugStore = {
    gridPrinted: false,
    graphPrinted: false,
    fullRouterTimeDone: false,
    fullRouterTime: 0
}
export const debugLog = function () {};

// ======= Visual debugging
export function showDebugGraph(pathfinder) {
    const { planner, step, _graph: graph } = pathfinder;
    const c = new joint.shapes.standard.Circle({
        debugIgnore: true,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
        attrs: {
            body: {
                refCx: 0,
                refCy: 0,
                pointerEvents: 'none',
                fill: 'white',
                stroke: 'red',
                strokeWidth: 3
            }
        }
    });

    const l = new joint.shapes.standard.Link({
        debugIgnore: true,
        router: {
            name: 'normal'
        },
        attrs: {
            line: {
                sourceMarker: null,
                targetMarker: null,
                stroke: 'blue',
                strokeDasharray: '5 5',
                strokeOpacity: 0.5,
                strokeWidth: 1
            }
        },
        markup: [{
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }],
        z: -1
    });

    const debugCells = [];
    const debugLinks = [];

    planner.graph.verts.forEach(vert => {
        const ds = c.clone();
        ds.position(vert.x * step, vert.y * step);

        vert.edges.forEach(edge => {
            const ls = l.clone();
            l.source({ x: vert.x * step, y: vert.y * step });
            l.target({ x: edge.x * step, y: edge.y * step });
            debugLinks.push(ls);
        });

        debugCells.push(ds);
    });

    graph.addCells(debugLinks).addCells(debugCells);
}

export function showDebugGrid(pathfinder) {
    const { grid, step, _graph: graph } = pathfinder;
    const ro = new joint.shapes.standard.Rectangle({
        debugIgnore: true,
        position: { x: 0, y: 0 },
        size: { width: step, height: step },
        attrs: {
            body: {
                pointerEvents: 'none',
                fill: '#ff0000',
                fillOpacity: 0.2,
                stroke: 'white',
                strokeWidth: 1
            }
        }
    });

    const gridCells = [];
    for (let i = 0; i < grid.shape[0]; i++) {
        for (let j = 0; j < grid.shape[1]; j++) {
            if (grid.getBinary(i, j) === 1) {
                const dc = ro.clone();
                dc.position(i * step, j * step);
                gridCells.push(dc);
            }
        }
    }

    graph.addCells(gridCells);
}
