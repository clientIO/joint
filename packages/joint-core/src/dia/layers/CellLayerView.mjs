import { LayerView } from './LayerView.mjs';
import { sortElements } from '../../util/index.mjs';
import { addClassNamePrefix } from '../../util/util.mjs';
import { sortingTypes } from '../Paper.mjs';

/**
 * @class CellLayerView
 * @description A CellLayerView is responsible for managing the rendering of cell views inside a cell layer.
 * It listens to the corresponding CellLayer model and updates the DOM accordingly.
 * It uses dia.Paper sorting options to sort cell views in the DOM based on their `z` attribute.
 */
export const CellLayerView = LayerView.extend({

    SORT_DELAYING_BATCHES: ['add', 'reset', 'to-front', 'to-back'],

    style: {
        webkitUserSelect: 'none',
        userSelect: 'none'
    },

    init() {
        LayerView.prototype.init.apply(this, arguments);

        this.paper = this.options.paper;
        this.startListening();
    },

    className: function() {
        const { id } = this.options;
        return [
            addClassNamePrefix(`${id}-layer`),
            addClassNamePrefix('cell-layer')
        ].join(' ');
    },

    startListening() {
        const { model, paper } = this;
        const graph = paper.model;

        this.listenTo(model, 'sort', this.onCellLayerSort);

        this.listenTo(model, 'add', this.onCellAdd);

        this.listenTo(model, 'change', this.onCellChange);

        this.listenTo(graph, 'batch:stop', this.onGraphBatchStop);
    },

    onCellLayerSort() {
        const { paper } = this;
        const graph = paper.model;

        if (graph.hasActiveBatch(this.SORT_DELAYING_BATCHES)) return;
        this.sort();
    },

    onCellAdd(cell, _collection, opt = {}) {
        // When a cell is moved from one layer to another,
        // request insertion of its view in the new layer.
        if (opt.fromLayer) {
            this.requestCellViewInsertion(cell, opt);
        }
    },

    onCellChange(cell, opt) {
        if (!cell.hasChanged('z')) return;

        const { paper } = this;
        if (paper.options.sorting === sortingTypes.APPROX) {
            this.requestCellViewInsertion(cell, opt);
        }
    },

    onGraphBatchStop(data) {
        const { paper } = this;
        const graph = paper.model;

        const name = data && data.batchName;
        const sortDelayingBatches = this.SORT_DELAYING_BATCHES;

        if (sortDelayingBatches.includes(name) && !graph.hasActiveBatch(sortDelayingBatches)) {
            this.sort();
        }
    },

    sort() {
        const { paper } = this;
        if (!paper)
            return;

        if (!paper.isExactSorting()) {
            // noop
            return;
        }
        if (paper.isFrozen()) {
            // sort views once unfrozen
            paper._updates.sort = true;
            return;
        }
        this.sortExact();
    },

    sortExact() {
        // Run insertion sort algorithm in order to efficiently sort DOM elements according to their
        // associated model `z` attribute.
        const cellNodes = Array.from(this.el.children).filter(node => node.getAttribute('model-id'));
        const cellCollection = this.model.cellCollection;

        sortElements(cellNodes, function(a, b) {
            const cellA = cellCollection.get(a.getAttribute('model-id'));
            const cellB = cellCollection.get(b.getAttribute('model-id'));
            const zA = cellA.attributes.z || 0;
            const zB = cellB.attributes.z || 0;
            return (zA === zB) ? 0 : (zA < zB) ? -1 : 1;
        });
    },

    insertCellView(cellView) {
        const { el, model } = cellView;
        const { paper } = this;

        switch (paper.options.sorting) {
            case sortingTypes.APPROX:
                this.insertSortedNode(el, model.get('z'));
                break;
            case sortingTypes.EXACT:
            default:
                this.insertNode(el);
                break;
        }
    },

    requestCellViewsInsertion(opt = {}) {
        const { model } = this;

        const cellsArray = model.cellCollection.models;
        for (let i = 0; i < cellsArray.length; i++) {
            const cell = cellsArray[i];
            this.requestCellViewInsertion(cell, opt);
        }
    },

    requestCellViewInsertion(cell, opt = {}) {
        const { paper } = this;

        const viewLike = paper._getCellViewLike(cell);
        if (viewLike) {
            paper.requestViewUpdate(viewLike, paper.FLAG_INSERT, viewLike.UPDATE_PRIORITY, opt);
        }
    }
});

// Internal tag to identify this object as a cell layer view instance.
// Used instead of `instanceof` for performance and cross-frame safety.

export const CELL_LAYER_VIEW_MARKER = Symbol('joint.cellLayerViewMarker');

Object.defineProperty(CellLayerView.prototype, CELL_LAYER_VIEW_MARKER, {
    value: true,
});
