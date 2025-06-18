import { LayerView } from './LayerView.mjs';
import { sortElements } from '../../util/index.mjs';

export class GraphLayerView extends LayerView {

    init(...args) {
        super.init(...args);

        const { model } = this;

        if (model.graph) {
            this.startListening(model.graph);
        }

        this.listenTo(model, 'addedToGraph', (graph) => {
            this.stopListening();
            this.startListening(graph);
        });

        this.listenTo(model, 'removedFromGraph', () => {
            this.stopListening();
        });
    }

    get SORT_DELAYING_BATCHES() {
        return ['add', 'reset', 'to-front', 'to-back'];
    }

    startListening(graph) {
        const { model } = this;

        this.listenTo(model, 'sort', () => {
            if (graph.hasActiveBatch(this.SORT_DELAYING_BATCHES)) return;
            this.sortLayer();
        });

        this.listenTo(graph, 'batch:stop', (data) => {
            const name = data && data.batchName;
            const sortDelayingBatches = this.SORT_DELAYING_BATCHES;

            if (sortDelayingBatches.includes(name) && !graph.hasActiveBatch(sortDelayingBatches)) {
                this.sortLayer();
            }
        });
    }

    sortLayer() {
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
        this.sortLayerExact();
    }

    sortLayerExact() {
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
    }

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

}
