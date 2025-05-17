import { View } from '../mvc/index.mjs';
import { addClassNamePrefix } from '../util/util.mjs';

export class LayerView extends View {

    preinitialize() {
        this.tagName = 'g';
        this.svgElement = true;
        this.pivotNodes = {};
    }

    init(...args) {
        super.init(...args);
    }

    className() {
        const { name } = this.options;
        if (!name) return null;
        return addClassNamePrefix(`${name}-layer`);
    }

    insertSortedNode(node, z) {
        this.el.insertBefore(node, this.insertPivot(z));
    }

    insertNode(node) {
        const { el } = this;
        if (node.parentNode !== el) {
            el.appendChild(node);
        }
    }

    insertPivot(z) {
        const { el, pivotNodes } = this;
        z = +z;
        z || (z = 0);
        let pivotNode = pivotNodes[z];
        if (pivotNode) return pivotNode;
        pivotNode = pivotNodes[z] = document.createComment('z-index:' + (z + 1));
        let neighborZ = -Infinity;
        for (let currentZ in pivotNodes) {
            currentZ = +currentZ;
            if (currentZ < z && currentZ > neighborZ) {
                neighborZ = currentZ;
                if (neighborZ === z - 1) continue;
            }
        }
        if (neighborZ !== -Infinity) {
            const neighborPivot = pivotNodes[neighborZ];
            // Insert After
            el.insertBefore(pivotNode, neighborPivot.nextSibling);
        } else {
            // First Child
            el.insertBefore(pivotNode, el.firstChild);
        }
        return pivotNode;
    }

    removePivots() {
        const { el, pivotNodes } = this;
        for (let z in pivotNodes) {
            el.removeChild(pivotNodes[z]);
        }
        this.pivotNodes = {};
    }

    isEmpty() {
        return this.el.children.length === 0;
    }

    get name() {
        return this.options.name;
    }
}
