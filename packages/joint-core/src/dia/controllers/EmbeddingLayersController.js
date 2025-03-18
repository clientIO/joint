import { Listener } from '../mvc/Listener.mjs';
import { Layer } from '../Layer.mjs';

export class EmbeddingLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;
        this.paper = context.paper;
        this.layers = {};

        this.startListening();
    }

    startListening() {
        const { graph } = this;

        this.listenTo(graph, 'remove', (_appContext, cell) => {
            if (this.layers[cell.id]) {
                const layer = this.layers[cell.id];
                const cells = layer.get('cells').models;
                cells.forEach((cell) => {
                    graph.moveToLayer(cell);
                });

                this.removePaperLayer(layer);
                delete this.layers[cell.id];
            }
        });

        this.listenTo(graph, 'change:parent', (_appContext, cell, parentId) => {
            const { layersMap, embeddingLayers, defaultLayerName, activeLayerName } = this;

            const currentLayer = cell.layer() || defaultLayerName;

            if (layersMap[currentLayer]) {
                layersMap[currentLayer].remove(cell);
            } else if (embeddingLayers[currentLayer]) {
                embeddingLayers[currentLayer].remove(cell);
            }

            if (parentId && !embeddingLayers[parentId]) {
                embeddingLayers[parentId] = new Layer({
                    name: parentId,
                    displayName: parentId
                });
                this.insertPaperLayer(embeddingLayers[parentId]);
            }

            const targetLayer = embeddingLayers[parentId] || layersMap[activeLayerName];

            targetLayer.add(cell);
        });
    }

    insertPaperLayer(layer) {
        const { paper } = this;

        const cellId = layer.get('name');
        const layerView = paper.createLayer({ name: cellId, model: layer });

        const cellView = paper.findViewByModel(cellId);
        if (cellView.isMounted()) {
            cellView.el.after(layerView.el);
        }

        this.layers[cellId] = layerView;
    }

    removePaperLayer(layer) {
        const cellId = layer.get('name');
        const layerView = this.layers[cellId];

        delete this.layers[cellId];

        layerView.remove();
    }
}
