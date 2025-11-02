import { LayerView } from './LayerView.mjs';
import { sortElements } from '../util/index.mjs';
import { addClassNamePrefix } from '../util/util.mjs';
import { sortingTypes } from './Paper.mjs';
import { GRAPH_LAYER_VIEW_MARKER } from './symbols.mjs';

/**
 * @class GraphLayerView
 * @description A GraphLayerView is responsible for managing the rendering of cell views inside a layer.
 * It listens to the corresponding GraphLayer model and updates the DOM accordingly.
 * It uses dia.Paper sorting options to sort cell views in the DOM based on their `z` attribute.
 */
export const GraphLayerView = LayerView.extend({

    SORT_DELAYING_BATCHES: ['add', 'to-front', 'to-back'],

    style: {
        webkitUserSelect: 'none',
        userSelect: 'none'
    },

    graph: null,

    init() {
        LayerView.prototype.init.apply(this, arguments);
        this.graph = this.model.graph;
    },

    className: function() {
        const { id } = this.options;
        return [
            addClassNamePrefix(`${id}-layer`),
            addClassNamePrefix('cells')
        ].join(' ');
    },

    afterPaperReferenceSet(paper) {
        this.listenTo(this.model, 'sort', this.onCellCollectionSort);
        this.listenTo(this.model, 'change', this.onCellChange);
        this.listenTo(this.model, 'move', this.onCellMove);
        this.listenTo(this.graph, 'batch:stop', this.onGraphBatchStop);
    },

    beforePaperReferenceUnset() {
        this.stopListening(this.model);
        this.stopListening(this.graph);
    },

    onCellCollectionSort() {
        if (this.graph.hasActiveBatch(this.SORT_DELAYING_BATCHES)) return;
        this.sort();
    },

    onCellMove(cell, opt = {}) {
        // When a cell is moved from one layer to another,
        // request insertion of its view in the new layer.
        this.paper.requestCellViewInsertion(cell, opt);
    },

    onCellChange(cell, opt) {
        if (!cell.hasChanged('z')) return;
        // Re-insert the cell view to maintain correct z-ordering
        if (this.paper.options.sorting === sortingTypes.APPROX) {
            this.paper.requestCellViewInsertion(cell, opt);
        }
    },

    onGraphBatchStop(data) {
        const name = data && data.batchName;
        const sortDelayingBatches = this.SORT_DELAYING_BATCHES;
        // After certain batches, sorting may be required
        if (sortDelayingBatches.includes(name) && !this.graph.hasActiveBatch(sortDelayingBatches)) {
            this.sort();
        }
    },

    sort() {
        this.assertPaperReference();
        const { paper } = this;

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
        this.assertPaperReference();
        const { paper } = this;
        const { el, model } = cellView;

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

});

Object.defineProperty(GraphLayerView.prototype, GRAPH_LAYER_VIEW_MARKER, {
    value: true,
});
