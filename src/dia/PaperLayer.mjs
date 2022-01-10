import { mvc } from '../core.mjs';
import { addClassNamePrefix } from '../util/util.mjs';

export const LayersNames = {
    CELLS: 'cells',
    BACK: 'back',
    FRONT: 'front',
    TOOLS: 'tools',
    LABELS: 'labels'
};

export const PaperLayer = mvc.View.extend({

    tagName: 'g',
    svgElement: true,
    pivotNodes: null,
    defaultTheme: null,

    options: {
        name: '',
        sort: false
    },

    className: function() {
        return addClassNamePrefix(`${this.options.name}-layer`);
    },

    init: function() {
        this.pivotNodes = {};
    },

    insertNode: function(node, z) {
        const { el, options } = this;
        if (options.sort) {
            el.insertBefore(node, this.insertPivot(z));
        } else {
            if (node.parentNode !== el) {
                el.appendChild(node);
            }
        }
    },

    insertPivot: function(z) {
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
    },

    removePivots: function() {
        const { el, pivotNodes } = this;
        for (let z in pivotNodes) el.removeChild(pivotNodes[z]);
        this.pivotNodes = {};
    }

});
