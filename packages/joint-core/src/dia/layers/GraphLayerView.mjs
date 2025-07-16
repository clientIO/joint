import { LayerView } from './LayerView.mjs';
import { sortElements } from '../../util/index.mjs';
import { sortingTypes } from '../Paper.mjs';

export const GraphLayerView = LayerView.extend({

    SORT_DELAYING_BATCHES: ['add', 'reset', 'to-front', 'to-back'],

    init() {
        LayerView.prototype.init.apply(this, arguments);

        this.startListening();
    },

    startListening() {
        const { model, options: { paper } } = this;
        const graph = paper.model;

        this.listenTo(model, 'sort', () => {
            if (graph.hasActiveBatch(this.SORT_DELAYING_BATCHES)) return;
            this.sort();
        });

        this.listenTo(graph, 'batch:stop', (data) => {
            const name = data && data.batchName;
            const sortDelayingBatches = this.SORT_DELAYING_BATCHES;

            if (sortDelayingBatches.includes(name) && !graph.hasActiveBatch(sortDelayingBatches)) {
                this.sort();
            }
        });

        this.listenTo(model, 'updateCell', (cell, opt) => {
            if (
                cell.hasChanged('layer') ||
                (cell.hasChanged('z') && paper.options.sorting === sortingTypes.APPROX)
            ) {
                const view = paper.findViewByModel(cell);
                if (view) {
                    paper.requestViewUpdate(view, view.FLAG_INSERT, view.UPDATE_PRIORITY, opt);
                }
            }
        });
    },

    sort() {
        const { options: { paper } } = this;
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
        const cells = this.model.get('cells');

        sortElements(cellNodes, function(a, b) {
            const cellA = cells.get(a.getAttribute('model-id'));
            const cellB = cells.get(b.getAttribute('model-id'));
            const zA = cellA.attributes.z || 0;
            const zB = cellB.attributes.z || 0;
            return (zA === zB) ? 0 : (zA < zB) ? -1 : 1;
        });
    },

    insertCellView(cellView) {
        const { el, model } = cellView;
        const { options: { paper } } = this;

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

    getCellViewNode(cellId) {
        const cellNode = this.el.querySelector(`[model-id="${cellId}"]`);
        if (!cellNode) {
            return null;
        }
        return cellNode;
    },

    // TODO: make it work properly from inside of paper
    _prepareRemove() {
        const cellNodes = Array.from(this.el.children).filter(node => node.getAttribute('model-id'));
        const cells = this.model.get('cells');

        cellNodes.forEach((node) => {
            const cellId = node.getAttribute('model-id');

            if (!cells.has(cellId)) {
                this.el.removeChild(node);
            }
        });
    }
});
