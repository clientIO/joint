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
        // Parent to children mappings (links first, then elements).
        // Map(parentId -> Set of child IDs)
        this._linkChildren = new Map();
        this._elementChildren = new Map();
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
            this._addChild(parentId, cell);
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
            this._removeChild(parentId, cell);
        }
        // Also remove this cell as a parent (cleanup any orphaned entries)
        this._linkChildren.delete(cell.id);
        this._elementChildren.delete(cell.id);
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
            this._removeChild(prevParentId, cell);
        }
        if (newParentId) {
            this._addChild(newParentId, cell);
        }
    }

    /**
     * @protected
     * @description Add a child to the parent's children set.
     * @param {string} parentId - The parent cell ID.
     * @param {dia.Cell} child - The child cell.
     */
    _addChild(parentId, child) {
        const map = child.isLink() ? this._linkChildren : this._elementChildren;
        let children = map.get(parentId);
        if (!children) {
            children = new Set();
            map.set(parentId, children);
        }
        children.add(child.id);
    }

    /**
     * @protected
     * @description Remove a child from the parent's children set.
     * @param {string} parentId - The parent cell ID.
     * @param {dia.Cell} child - The child cell.
     */
    _removeChild(parentId, child) {
        const map = child.isLink() ? this._linkChildren : this._elementChildren;
        const children = map.get(parentId);
        if (children) {
            children.delete(child.id);
            // Clean up empty Set to prevent memory leaks
            if (children.size === 0) {
                map.delete(parentId);
            }
        }
    }

    /**
     * @public
     * @description Get all direct children IDs for a parent (links first, then elements).
     * Time complexity: O(n) where n is number of children.
     * @param {string} parentId - The parent cell ID.
     * @returns {Array} Array of child cell IDs.
     */
    getChildrenIds(parentId) {
        const linkChildren = this._linkChildren.get(parentId);
        const elementChildren = this._elementChildren.get(parentId);
        if (!linkChildren && !elementChildren) {
            return [];
        }
        // Links first, then elements
        return [
            ...(linkChildren || []),
            ...(elementChildren || [])
        ];
    }

    /**
     * @public
     * @description Check if a cell has any children. Time complexity: O(1).
     * @param {string} parentId - The parent cell ID.
     * @returns {boolean} True if the cell has children.
     */
    hasChildren(parentId) {
        const linkChildren = this._linkChildren.get(parentId);
        if (linkChildren && linkChildren.size > 0) return true;
        const elementChildren = this._elementChildren.get(parentId);
        if (elementChildren && elementChildren.size > 0) return true;
        return false;
    }
}
