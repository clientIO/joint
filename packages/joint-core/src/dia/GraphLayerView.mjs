import { LayerView } from './LayerView.mjs';
import { sortElements } from '../util/index.mjs';
import { addClassNamePrefix } from '../util/util.mjs';
import { sortingTypes } from './Paper.mjs';

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
        this.listenTo(this.model, 'sort', this.onGraphLayerSort);
        this.listenTo(this.model, 'add', this.onCellAdd);
        this.listenTo(this.model, 'change', this.onCellChange);
        this.listenTo(this.graph, 'batch:stop', this.onGraphBatchStop);
        this.listenTo(this.graph, 'reset', this.onGraphReset);

    },

    beforePaperReferenceUnset() {
        this.stopListening(this.model);
        this.stopListening(this.graph);
    },

    onGraphLayerSort() {
        const { graph } = this;

        if (graph.hasActiveBatch(this.SORT_DELAYING_BATCHES)) return;
        this.sort();
    },

    onCellAdd(cell, _collection, opt = {}) {
        const { paper } = this;
        // When a cell is moved from one layer to another,
        // request insertion of its view in the new layer.
        if (opt.fromLayer) {
            paper.requestCellViewInsertion(cell, opt);
        }
    },

    onCellChange(cell, opt) {
        if (!cell.hasChanged('z')) return;

        const { paper } = this;
        if (paper.options.sorting === sortingTypes.APPROX) {
            paper.requestCellViewInsertion(cell, opt);
        }
    },

    onGraphBatchStop(data) {
        const { graph } = this;
        const name = data && data.batchName;
        const sortDelayingBatches = this.SORT_DELAYING_BATCHES;

        if (sortDelayingBatches.includes(name) && !graph.hasActiveBatch(sortDelayingBatches)) {
            this.sort();
        }
    },

    onGraphReset(_, opt) {
        if (opt.sort === false) return;
        this.sort();
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

// Internal tag to identify this object as a layer view instance.
// Used instead of `instanceof` for performance and cross-frame safety.

export const GRAPH_LAYER_VIEW_MARKER = Symbol('joint.graphLayerViewMarker');

Object.defineProperty(GraphLayerView.prototype, GRAPH_LAYER_VIEW_MARKER, {
    value: true,
});
