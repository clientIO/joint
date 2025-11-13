import { View } from '../mvc/index.mjs';
import { addClassNamePrefix, clone } from '../util/util.mjs';
import { LAYER_VIEW_MARKER } from './symbols.mjs';

export const LayerView = View.extend({

    tagName: 'g',
    svgElement: true,
    pivotNodes: null,
    defaultTheme: null,

    UPDATE_PRIORITY: 4,

    options: {
        id: ''
    },

    paper: null,

    init: function() {
        this.pivotNodes = {};
        this.id = this.options.id || this.cid;
    },

    setPaperReference: function(paper) {
        this.paper = paper;
        this.afterPaperReferenceSet(paper);
    },

    unsetPaperReference: function() {
        if (!this.paper) return;
        this.beforePaperReferenceUnset(this.paper);
        this.paper = null;
    },

    assertPaperReference() {
        if (!this.paper) {
            throw new Error('LayerView: paper reference is not set.');
        }
    },

    afterPaperReferenceSet: function() {
        // Can be overridden in subclasses.
    },

    beforePaperReferenceUnset: function() {
        // Can be overridden in subclasses.
    },

    // prevents id to be set on the DOM element
    _setAttributes: function(attrs) {
        const newAttrs = clone(attrs);
        delete newAttrs.id;

        View.prototype._setAttributes.call(this, newAttrs);
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

    reset: function() {
        this.removePivots();
    }
});

Object.defineProperty(LayerView.prototype, LAYER_VIEW_MARKER, {
    value: true,
});
