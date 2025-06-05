import { LayerView } from '../LayerView.mjs';

export class GraphLayerView extends LayerView {

    init(...args) {
        super.init(...args);

        const { model } = this;

        this.startListening();

        this.listenTo(model, 'change:graph', (_, graph) => {
            if (graph)
            this.startGra
        });
    }

    get SORT_DELAYING_BATCHES() {
        return ['add', 'to-front', 'to-back'];
    }

    startListening() {
        const { model } = this;
        if (!model)
            return;

        this.listenTo(model, 'sort', () => {
            if (this.model.hasActiveBatch(this.SORT_DELAYING_BATCHES)) return;
            this.sortLayer();
        });

        const graph = model.get('graph');

        if (!graph)
            return;

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
        const cellNodes = Array.from(this.el.childNodes).filter(node => node.getAttribute('model-id'));
        const cells = this.model.get('cells');

        sortElements(cellNodes, function(a, b) {
            const cellA = cells.get(a.getAttribute('model-id'));
            const cellB = cells.get(b.getAttribute('model-id'));
            const zA = cellA.attributes.z || 0;
            const zB = cellB.attributes.z || 0;
            return (zA === zB) ? 0 : (zA < zB) ? -1 : 1;
        });
    }

}
