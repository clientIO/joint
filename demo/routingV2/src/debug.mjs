import * as joint from '../../../joint.mjs';

export const debugConf = {
    showGrid: false,
    showGetInBox: false,
    gridUpdateBenchmark: true,
    fullGridUpdateBenchmark: true,
    routerBenchmark: true,
    fullRouterBenchmark: true,
}
export const debugStore = {
    gridPrinted: false,
    fullRouterTimeDone: false,
    fullRouterTime: 0,
    fullGridTimeDone: false,
    fullGridTime: 0,
}
export const debugLog = function () {};

// ======= Visual debugging
// broken
// export function showDebugGrid(pathfinder) {
//     const { grid, step, _graph: graph } = pathfinder;
//     const ro = new joint.shapes.standard.Rectangle({
//         debugIgnore: true,
//         position: { x: 0, y: 0 },
//         size: { width: step, height: step },
//         attrs: {
//             body: {
//                 pointerEvents: 'none',
//                 fill: '#ff0000',
//                 fillOpacity: 0.2,
//                 stroke: 'white',
//                 strokeWidth: 1
//             }
//         }
//     });
//
//     const gridCells = [];
//     for (let i = 0; i < grid.shape[0]; i++) {
//         for (let j = 0; j < grid.shape[1]; j++) {
//             if (grid.getBinary(i, j) === 1) {
//                 const dc = ro.clone();
//                 dc.position(i * step, j * step);
//                 gridCells.push(dc);
//             }
//         }
//     }
//
//     graph.addCells(gridCells);
// }
