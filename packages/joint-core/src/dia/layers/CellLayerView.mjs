import { LayerView } from './LayerView.mjs';
import { sortElements } from '../../util/index.mjs';
import { addClassNamePrefix } from '../../util/util.mjs';
import { sortingTypes } from '../Paper.mjs';

export const CellLayerView = LayerView.extend({

    SORT_DELAYING_BATCHES: ['add', 'reset', 'to-front', 'to-back'],

    style: {
        webkitUserSelect: 'none',
        userSelect: 'none'
    },

    init() {
        LayerView.prototype.init.apply(this, arguments);
        this.startListening();
    },

    className: function() {
        const { id } = this.options;
        return addClassNamePrefix(`${id}-layer`) + ' ' + addClassNamePrefix('viewport') + ' ' + addClassNamePrefix('joint-cell-layer');
    },

    startListening() {
        const { model, options: { paper }} = this;
        const graph = paper.model;

        this.listenTo(model, 'cells:sort', () => {
            if (graph.hasActiveBatch(this.SORT_DELAYING_BATCHES)) return;
            this.sort();
        });

        this.listenTo(model, 'cells:add', (cell, _collection, opt) => {
            if (!opt.initial) {
                this._requestCellViewInsertion(cell, opt);
            }
        });

        this.listenTo(model, 'cell:change:z', (cell, _value, opt) => {
            if (paper.options.sorting === sortingTypes.APPROX) {
                this._requestCellViewInsertion(cell, opt);
            }
        });

        this.listenTo(graph, 'batch:stop', (data) => {
            const name = data && data.batchName;
            const sortDelayingBatches = this.SORT_DELAYING_BATCHES;

            if (sortDelayingBatches.includes(name) && !graph.hasActiveBatch(sortDelayingBatches)) {
                this.sort();
            }
        });
    },

    sort() {
        const { options: { paper }} = this;
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
        const cellCollection = this.model.cells;

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
        const { options: { paper }} = this;

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

    _requestCellViewInsertion(cell, opt) {
        const { options: { paper }} = this;

        const viewLike = paper._getCellViewLike(cell);
        if (viewLike) {
            paper.requestViewUpdate(viewLike, paper.FLAG_INSERT, viewLike.UPDATE_PRIORITY, opt);
        }
    }
});
