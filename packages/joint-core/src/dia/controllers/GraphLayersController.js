import { Listener } from '../mvc/Listener.mjs';

export class GraphLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;

        this.layers = this.graph.get('layers');
        this.layersMap = {};

        this.layers.forEach(layer => {
            this.layersMap[layer.name] = layer;
        });

        this.activeLayerName = this.defaultLayerName;

        //this.updateGraphLayers(layers);

        this.startListening();
    }

    startListening() {
        const { graph } = this;

        this.listenTo(graph, 'add', (_appContext, cell) => {
            this.onAdd(cell);
        });

        this.listenTo(graph, 'remove', (_appContext, cell) => {
            this.onRemove(cell);
        });

        this.listenTo(graph, 'reset', (_appContext, { models: cells }) => {
            const layers = this.get('layers');
            for (let layerName in layers) {
                layers[layerName].clear();
            }

            cells.forEach(cell => {
                this.onAdd(cell);
            });
        });
    }

    onAdd(cell) {
        const { activeLayerName, layersMap } = this;

        const layerName = cell.layer() || activeLayerName;
        const layer = layersMap[layerName];

        if (!cell.has('z')) {
            cell.set('z', layer.maxZIndex() + 1);
        }

        layer.add(cell);
    }

    onRemove(cell) {
        const { layersMap } = this;

        const layerName = cell.layer();

        const layer = layersMap[layerName];

        if (layer) {
            layer.remove(cell);
        }
    }

}
