import { Listener } from '../../mvc/Listener.mjs';
import { GraphLayer } from '../layers/GraphLayer.mjs';

export class EmbeddingLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;
        this.paper = context.paper;

        this.startListening();
    }

    startListening() {
        const { graph, paper } = this;

        this.listenTo(graph, 'remove', (_appContext, cell) => {
            const layersMap = graph.getLayersMap();

            if (layersMap[cell.id]) {
                const layer = layersMap[cell.id];
                const cells = layer.get('cells').models;
                cells.forEach((cell) => {
                    graph.addToLayer(cell);
                });

                graph.removeLayer(layer);
                this.removeEmbeddingLayer(layer);
            }
        });

        this.listenTo(graph, 'change:parent', (_appContext, cell, parentId) => {
            const layersMap = graph.getLayersMap();

            const currentLayer = cell.layer();

            if (layersMap[currentLayer]) {
                layersMap[currentLayer].remove(cell);
            }

            let layer;
            if (parentId && !layersMap[parentId]) {
                layer = new GraphLayer({
                    name: parentId
                });
                graph.addLayer(layer);
                this.insertEmbeddingLayer(layer);
            }

            graph.addToLayer(cell, layersMap[parentId]);
        });

        this.listenTo(paper, 'cell:inserted', (_appContext, cellView) => {
            const cellId = cellView.model.id;
            if (paper.hasLayer(cellId)) {
                const layerView = paper.getLayer(cellId);
                cellView.el.after(layerView.el);
            }
        });
    }

    insertEmbeddingLayer(layer) {
        const { paper } = this;

        const cellId = layer.name;
        const layerView = paper.createLayer({ name: cellId, model: layer });
        paper.addLayer(layerView, { doNotAppend: true });

        const cellView = paper.findViewByModel(cellId);
        if (cellView.isMounted()) {
            cellView.el.after(layerView.el);
        }
    }

    removeEmbeddingLayer(layer) {
        const { paper } = this;

        const cellId = layer.name;
        if (paper.hasLayer(cellId)) {
            const layerView = paper.getLayer(cellId);
            paper.removeLayer(layerView);
        }
    }
}
