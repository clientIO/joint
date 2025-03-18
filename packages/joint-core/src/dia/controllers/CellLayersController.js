import { Listener } from '../mvc/Listener.mjs';

export class CellLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;
        this.paper = context.paper;

        this.layers = model.get('layers');

        this.updateGraphLayers(layers);

        this.startListening();
    }

    startListening() {
        const { graph, paper } = this;

        this.listenTo(graph, 'change:layers', (_appContext, graph, layers) => {
            this.updateGraphLayers(layers)
        });
    }

    updateGraphLayers(layers) {
        const { graph, paper } = this;

        const removedLayerNames = this.layers.filter(layer => !layers.some(l => l.name === layer.name)).map(layer => layer.name);
        removedLayerNames.forEach(layerName => paper.removeLayer(layerName));

        this.layers = this.model.get('layers');

        this.layers.forEach(layer => {
            if (!paper.hasLayerView(layer.name)) {
                paper.renderLayer({
                    name: layer.name,
                    model: layer
                });
            }
            paper.moveLayer(layer.name, LayersNames.FRONT);
        });
    }

}
