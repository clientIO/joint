import { Listener } from '../../mvc/Listener.mjs';

export class GraphLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;

        this.layers = this.graph.get('layers');
        this.layersMap = {};

        this.layers.forEach(layer => {
            this.layersMap[layer.name] = layer;
        });

        this.defaultLayerName = this.graph.defaultLayerName;

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
            const { layersMap } = this;

            for (let layerName in layersMap) {
                layersMap[layerName].clear();
            }

            cells.forEach(cell => {
                this.onAdd(cell);
            });
        });
    }

    onAdd(cell) {
        const { layersMap } = this;

        const layerName = cell.layer();
        const layer = layersMap[layerName];

        if (!cell.has('z')) {
            cell.set('z', layer.maxZIndex() + 1);
        }

        // mandatory add to the layer
        // so every cell now will have a layer specified
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

    getDefaultLayer() {
        return this.layersMap[this.defaultLayerName];
    }

    addLayer(layer, _opt) {
        const { layersMap } = this;

        if (layersMap[layer.name]) {
            throw new Error(`dia.Graph: Layer with name '${layer.name}' already exists.`);
        }

        this.layers = this.layers.concat([layer]);

        layersMap[layer.name] = layer;
        this.graph.set('layers', this.layers);
    }

    removeLayer(layerName, _opt) {
        const { layersMap, defaultLayerName } = this;

        if (layerName === defaultLayerName) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!layersMap[layerName]) {
            throw new Error(`dia.Graph: Layer with name '${layerName}' does not exist.`);
        }

        this.layers = this.layers.filter(l => l.name !== layerName);

        delete this.layersMap[layerName];
        this.set('layers', this.layers);
    }

    minZIndex(layerName) {
        const { layersMap, defaultLayerName } = this;

        layerName = layerName || defaultLayerName;

        const layer = layersMap[layerName];

        return layer.minZIndex();
    }

    maxZIndex(layerName) {
        const { layersMap, defaultLayerName } = this;

        layerName = layerName || defaultLayerName;

        const layer = layersMap[layerName];

        return layer.maxZIndex();
    }

    getLayersMap() {
        return this.layersMap;
    }

    getLayerCells(layerName) {
        return this.layersMap[layerName].get('cells');
    }
}
