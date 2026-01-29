import { Listener } from '../mvc/Listener.mjs';

/**
 * @class GraphHierarchyIndex
 * @description Maintains an index of cell hierarchy (parent-child relationships)
 * for fast embedding queries. This allows querying for embedded cells without
 * reading the `embeds` attribute directly.
 */
export class GraphHierarchyIndex extends Listener {

    constructor(options) {
        super(options);

        // Make sure there are no arguments passed to the callbacks.
        // See the `mvc.Listener` documentation for more details.
        this.callbackArguments = [];

        this.layerCollection = options.layerCollection;
        if (!this.layerCollection) {
            throw new Error('GraphHierarchyIndex: "layerCollection" option is required.');
        }

        this.initializeIndex();
        this.startListening();
    }

    /**
     * @public
     * @description Start listening to graph and layer collection events
     * to maintain the hierarchy index.
     */
    startListening() {
        this.listenTo(this.layerCollection.graph, {
            'add': this._restructureOnAdd,
            'remove': this._restructureOnRemove,
            'reset': this._restructureOnReset
        });
        // Listening to the collection instead of the graph
        // to avoid reacting to graph attribute change events
        this.listenTo(this.layerCollection, {
            'change:parent': this._restructureOnChangeParent
        });
    }

    /**
     * @protected
     * @description Initialize the internal data structures.
     */
    initializeIndex() {
        // Parent to children mapping.
        // [parentId] -> Object [childId] -> true
        this._children = {};
    }

    /**
     * @protected
     * @description Restructure the hierarchy index on graph reset.
     * E.g. when fromJSON or resetCells is called.
     */
    _restructureOnReset() {
        this.initializeIndex();
        this.layerCollection.getCells().forEach(this._restructureOnAdd, this);
    }

    /**
     * @protected
     * @description Restructure the hierarchy index on cell addition.
     * @param {dia.Cell} cell - The cell being added.
     */
    _restructureOnAdd(cell) {
        const parentId = cell.get('parent');
        if (parentId) {
            this._addChild(parentId, cell.id);
        }
    }

    /**
     * @protected
     * @description Restructure the hierarchy index on cell removal.
     * @param {dia.Cell} cell - The cell being removed.
     */
    _restructureOnRemove(cell) {
        const parentId = cell.get('parent');
        if (parentId) {
            this._removeChild(parentId, cell.id);
        }
        // Also remove this cell as a parent (cleanup any orphaned entries)
        delete this._children[cell.id];
    }

    /**
     * @protected
     * @description Restructure the hierarchy index on parent attribute change.
     * @param {dia.Cell} cell - The cell whose parent changed.
     */
    _restructureOnChangeParent(cell) {
        const prevParentId = cell.previous('parent');
        const newParentId = cell.get('parent');

        if (prevParentId) {
            this._removeChild(prevParentId, cell.id);
        }
        if (newParentId) {
            this._addChild(newParentId, cell.id);
        }
    }

    /**
     * @protected
     * @description Add a child to the parent's children set.
     * @param {string} parentId - The parent cell ID.
     * @param {string} childId - The child cell ID.
     */
    _addChild(parentId, childId) {
        if (!this._children[parentId]) {
            this._children[parentId] = {};
        }
        this._children[parentId][childId] = true;
    }

    /**
     * @protected
     * @description Remove a child from the parent's children set.
     * @param {string} parentId - The parent cell ID.
     * @param {string} childId - The child cell ID.
     */
    _removeChild(parentId, childId) {
        const children = this._children[parentId];
        if (!children) return;
        delete children[childId];
    }

    /**
     * @public
     * @description Get all direct children IDs for a parent. Time complexity: O(n) where n is number of children.
     * @param {string} parentId - The parent cell ID.
     * @returns {string[]} Array of child cell IDs.
     */
    getChildrenIds(parentId) {
        return Object.keys(this._children[parentId] || {});
    }

    /**
     * @public
     * @description Check if a cell has any children. Time complexity: O(1).
     * @param {string} parentId - The parent cell ID.
     * @returns {boolean} True if the cell has children.
     */
    hasChildren(parentId) {
        const children = this._children[parentId];
        if (!children) return false;
        // Check if the object has any keys
        for (const _ in children) {
            return true;
        }
        return false;
    }
}
