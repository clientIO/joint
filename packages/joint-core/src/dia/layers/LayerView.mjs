import { View } from '../../mvc/index.mjs';
import { addClassNamePrefix } from '../../util/util.mjs';

export const LayerView = View.extend({

    tagName: 'g',
    svgElement: true,
    pivotNodes: null,
    defaultTheme: null,

    UPDATE_PRIORITY: 10,

    options: {
        id: ''
    },

    init: function() {
        this.pivotNodes = {};
        this.id = this.options.id || this.cid;
    },

    className: function() {
        const { id } = this.options;
        return addClassNamePrefix(`${id}-layer`);
    },

    insertSortedNode: function(node, z) {
        this.el.insertBefore(node, this.insertPivot(z));
    },

    insertNode: function(node) {
        const { el } = this;
        if (node.parentNode !== el) {
            el.appendChild(node);
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
    },

    isEmpty: function() {
        // Check if the layer has any child elements (pivot comments are not counted).
        return this.el.children.length === 0;
    },
});
