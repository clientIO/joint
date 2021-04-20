import ndarray from 'ndarray';
import uniq from 'uniq';
import ops from 'ndarray-ops';
import prefixSum from 'ndarray-prefix-sum';
import getContour from 'contour-2d';
import * as orientation from 'robust-orientation';

function Geometry(corners, grid) {
    this.corners = corners;
    this.grid = grid;
}

const proto = Geometry.prototype;

proto.stabRay = function (vx, vy, x) {
    return this.stabBox(vx, vy, x, vy);
}

proto.stabTile = function (x, y) {
    return this.stabBox(x, y, x, y);
}

proto.integrate = function (x, y) {
    if (x < 0 || y < 0) {
        return 0;
    }
    return this.grid.get(
        Math.min(x, this.grid.shape[0] - 1) | 0,
        Math.min(y, this.grid.shape[1] - 1) | 0);
}

proto.stabBox = function (ax, ay, bx, by) {
    const lox = Math.min(ax, bx);
    const loy = Math.min(ay, by);
    const hix = Math.max(ax, bx);
    const hiy = Math.max(ay, by);

    const s = this.integrate(lox - 1, loy - 1)
        - this.integrate(lox - 1, hiy)
        - this.integrate(hix, loy - 1)
        + this.integrate(hix, hiy);

    return s > 0;
}

function comparePair(a, b) {
    const d = a[0] - b[0];
    if (d) {
        return d;
    }
    return a[1] - b[1];
}

export function createGeometry(grid) {
    const loops = getContour(grid.transpose(1, 0));

    //Extract corners
    const corners = [];
    for (let k = 0; k < loops.length; ++k) {
        const polygon = loops[k];
        for (let i = 0; i < polygon.length; ++i) {
            const a = polygon[(i + polygon.length - 1) % polygon.length];
            const b = polygon[i];
            const c = polygon[(i + 1) % polygon.length];
            if (orientation[3](a, b, c) > 0) {
                const offset = [0, 0];
                for (let j = 0; j < 2; ++j) {
                    if (b[j] - a[j]) {
                        offset[j] = b[j] - a[j];
                    } else {
                        offset[j] = b[j] - c[j];
                    }
                    offset[j] = b[j] + Math.min(Math.round(offset[j] / Math.abs(offset[j])) | 0, 0);
                }
                if (offset[0] >= 0 && offset[0] < grid.shape[0] &&
                    offset[1] >= 0 && offset[1] < grid.shape[1] &&
                    grid.get(offset[0], offset[1]) === 0) {
                    corners.push(offset);
                }
            }
        }
    }

    //Remove duplicate corners
    uniq(corners, comparePair);

    //Create integral image
    const img = ndarray(new Int32Array(grid.shape[0] * grid.shape[1]), grid.shape);
    ops.gts(img, grid, 0);
    prefixSum(img);

    //Return resulting geometry
    return new Geometry(corners, img);
}
