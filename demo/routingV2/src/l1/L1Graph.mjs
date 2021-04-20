import * as vtx from './L1Vertex.mjs';
const NIL = vtx.NIL;
const NUM_LANDMARKS = vtx.NUM_LANDMARKS;
const LANDMARK_DIST = vtx.LANDMARK_DIST;

function heuristic(tDist, tx, ty, node) {
    const nx = +node.x;
    const ny = +node.y;
    let pi = Math.abs(nx - tx) + Math.abs(ny - ty);
    const nDist = node.landmark;
    for (let i = 0; i < NUM_LANDMARKS; ++i) {
        pi = Math.max(pi, tDist[i] - nDist[i]);
    }
    return 1.0000009536743164 * pi;
}

export function L1Graph() {
    this.target = vtx.create(0, 0);
    this.verts = [];
    this.freeList = this.target;
    this.toVisit = NIL;
    this.lastS = null;
    this.lastT = null;
    this.srcX = 0;
    this.srcY = 0;
    this.dstX = 0;
    this.dstY = 0;
    this.landmarks = [];
    this.landmarkDist = LANDMARK_DIST.slice();
}

const proto = L1Graph.prototype;

proto.vertex = function (x, y) {
    const v = vtx.create(x, y);
    this.verts.push(v);
    return v;
}

proto.link = function (u, v) {
    vtx.link(u, v);
}

proto.setSourceAndTarget = function (sx, sy, tx, ty) {
    this.srcX = sx | 0;
    this.srcY = sy | 0;
    this.dstX = tx | 0;
    this.dstY = ty | 0;
}

// Mark vertex connected to source
proto.addS = function (v) {
    if ((v.state & 2) === 0) {
        v.heuristic = heuristic(this.landmarkDist, this.dstX, this.dstY, v);
        v.weight = Math.abs(this.srcX - v.x) + Math.abs(this.srcY - v.y) + v.heuristic;
        v.state |= 2;
        v.pred = null;
        this.toVisit = vtx.push(this.toVisit, v);
        this.freeList = vtx.insert(this.freeList, v);
        this.lastS = v;
    }
}

// Mark vertex connected to target
proto.addT = function (v) {
    if ((v.state & 1) === 0) {
        v.state |= 1;
        this.freeList = vtx.insert(this.freeList, v);
        this.lastT = v;

        //Update heuristic
        const d = Math.abs(v.x - this.dstX) + Math.abs(v.y - this.dstY);
        const vDist = v.landmark;
        const tDist = this.landmarkDist;
        for (let i = 0; i < NUM_LANDMARKS; ++i) {
            tDist[i] = Math.min(tDist[i], vDist[i] + d);
        }
    }
}

//Retrieves the path from dst->src
proto.getPath = function (out) {
    let prevX = this.dstX;
    let prevY = this.dstY;
    out.push(prevX, prevY);
    let head = this.target.pred;
    while (head) {
        if (prevX !== head.x && prevY !== head.y) {
            out.push(head.x, prevY);
        }
        if (prevX !== head.x || prevY !== head.y) {
            out.push(head.x, head.y);
        }
        prevX = head.x;
        prevY = head.y;
        head = head.pred;
    }
    if (prevX !== this.srcX && prevY !== this.srcY) {
        out.push(this.srcX, prevY);
    }
    if (prevX !== this.srcX || prevY !== this.srcY) {
        out.push(this.srcX, this.srcY);
    }
    return out;
}

proto.findComponents = function () {
    const verts = this.verts;
    const n = verts.length;
    for (let i = 0; i < n; ++i) {
        verts[i].component = -1;
    }
    const components = [];
    for (let i = 0; i < n; ++i) {
        const root = verts[i];
        if (root.component >= 0) {
            continue;
        }
        const label = components.length;
        root.component = label;
        const toVisit = [root];
        let ptr = 0;
        while (ptr < toVisit.length) {
            const v = toVisit[ptr++];
            const adj = v.edges;
            for (let j = 0; j < adj.length; ++j) {
                const u = adj[j];
                if (u.component >= 0) {
                    continue;
                }
                u.component = label;
                toVisit.push(u);
            }
        }
        components.push(toVisit);
    }
    return components;
}

//Find all landmarks
function compareVert(a, b) {
    const d = a.x - b.x;
    if (d) {
        return d;
    }
    return a.y - b.y;
}

//For each connected component compute a set of landmarks
proto.findLandmarks = function (component) {
    component.sort(compareVert);
    let v = component[component.length >>> 1];
    for (let k = 0; k < NUM_LANDMARKS; ++k) {
        v.weight = 0.0;
        this.landmarks.push(v);
        for (let toVisit = v; toVisit !== NIL;) {
            v = toVisit;
            v.state = 2;
            toVisit = vtx.pop(toVisit);
            const w = v.weight;
            const adj = v.edges;
            for (let i = 0; i < adj.length; ++i) {
                let u = adj[i];
                if (u.state === 2) {
                    continue;
                }
                const d = w + Math.abs(v.x - u.x) + Math.abs(v.y - u.y);
                if (u.state === 0) {
                    u.state = 1;
                    u.weight = d;
                    toVisit = vtx.push(toVisit, u);
                } else if (d < u.weight) {
                    u.weight = d;
                    toVisit = vtx.decreaseKey(toVisit, u);
                }
            }
        }
        let farthestD = 0;
        for (let i = 0; i < component.length; ++i) {
            const u = component[i];
            u.state = 0;
            u.landmark[k] = u.weight;
            let s = Infinity;
            for (let j = 0; j <= k; ++j) {
                s = Math.min(s, u.landmark[j]);
            }
            if (s > farthestD) {
                v = u;
                farthestD = s;
            }
        }
    }
}

proto.init = function () {
    const components = this.findComponents();
    for (let i = 0; i < components.length; ++i) {
        this.findLandmarks(components[i]);
    }
}

//Runs a* on the graph
proto.search = function () {
    const target = this.target;
    let freeList = this.freeList;
    const tDist = this.landmarkDist;

    //Initialize target properties
    let dist = Infinity;

    //Test for case where S and T are disconnected
    if (this.lastS && this.lastT &&
        this.lastS.component === this.lastT.component) {

        const sx = +this.srcX;
        const sy = +this.srcY;
        const tx = +this.dstX;
        const ty = +this.dstY;

        for (let toVisit = this.toVisit; toVisit !== NIL;) {
            const node = toVisit;
            const nx = +node.x;
            const ny = +node.y;
            const d = Math.floor(node.weight - node.heuristic);

            if (node.state === 3) {
                //If node is connected to target, exit
                dist = d + Math.abs(tx - nx) + Math.abs(ty - ny);
                target.pred = node;
                break;
            }

            //Mark node closed
            node.state = 4;

            //Pop node from toVisit queue
            toVisit = vtx.pop(toVisit);

            const adj = node.edges;
            const n = adj.length;
            for (let i = 0; i < n; ++i) {
                const v = adj[i];
                const state = v.state;
                if (state === 4) {
                    continue;
                }
                const vd = d + Math.abs(nx - v.x) + Math.abs(ny - v.y);
                if (state < 2) {
                    const vh = heuristic(tDist, tx, ty, v);
                    v.state |= 2;
                    v.heuristic = vh;
                    v.weight = vh + vd;
                    v.pred = node;
                    toVisit = vtx.push(toVisit, v);
                    freeList = vtx.insert(freeList, v);
                } else {
                    const vw = vd + v.heuristic;
                    if (vw < v.weight) {
                        v.weight = vw;
                        v.pred = node;
                        toVisit = vtx.decreaseKey(toVisit, v);
                    }
                }
            }
        }
    }

    // Clear the free list & priority queue
    vtx.clear(freeList);

    // Reset pointers
    this.freeList = target;
    this.toVisit = NIL;
    this.lastS = this.lastT = null;

    // Reset landmark distance
    for (let i = 0; i < NUM_LANDMARKS; ++i) {
        tDist[i] = Infinity;
    }

    // Return target distance
    return dist;
}
