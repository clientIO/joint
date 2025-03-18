import { Listener } from '../mvc/Listener.mjs';
import { Layer } from '../Layer.mjs';

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
                    graph.moveToLayer(cell);
                });

                graph.removeLayer(layer);
                this.removePaperLayer(layer);
            }
        });

        this.listenTo(graph, 'change:parent', (_appContext, cell, parentId) => {
            const layersMap = graph.getLayersMap();
            const activeLayer = graph.getActiveLayer();

            const currentLayer = cell.layer();

            if (layersMap[currentLayer]) {
                layersMap[currentLayer].remove(cell);
            }

            let layer;
            if (parentId && !layersMap[parentId]) {
                layer = new Layer({
                    name: parentId
                });
                graph.addLayer(layer);
                this.insertEmbeddingLayer(layer);
            }

            const targetLayer = layer || activeLayer;

            targetLayer.add(cell);
        });

        this.listenTo(paper, 'cell:inserted', (_appContext, cellView) => {
            const cellId = cellView.model.id;
            if (paper.hasLayerView(cellId)) {
                const layerView = paper.getLayerView(cellView);
                el.after(layerView.el);
            }
        });
    }

    insertEmbeddingLayer(layer) {
        const { paper } = this;

        const cellId = layer.get('name');
        const layerView = paper.createLayer({ name: cellId, model: layer });
        paper.addLayer(cellId, layerView, { doNotAppend: true });

        const cellView = paper.findViewByModel(cellId);
        if (cellView.isMounted()) {
            cellView.el.after(layerView.el);
        }
    }

    removeEmbeddingLayer(layer) {
        const { paper } = this;

        const cellId = layer.get('name');
        const layerView = paper.hasLayerView(cellId);
        if (layerView) {
            paper.removeLayer(cellId);
        }
    }
}
