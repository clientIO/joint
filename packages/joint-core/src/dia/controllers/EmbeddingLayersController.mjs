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

        this.listenTo(graph, 'remove', (_context, cell) => {
            if (graph.hasLayer(cell.id)) {
                const layer = graph.getLayer(cell.id);
                const cells = layer.get('cells').models;
                cells.forEach((cell) => {
                    cell.layer(null); // Move all cells to the default layer
                });

                graph.removeLayer(layer);
                this.removeLayerView(layer);
            }
        });

        this.listenTo(graph, 'add', (_context, cell) => {
            const parentId = cell.get('parent');

            if (parentId) {
                this.onParentChange(cell, parentId);
            }
        });

        this.listenTo(graph, 'reset', (_context, { models: cells }) => {
            cells.forEach(cell => {
                const parentId = cell.get('parent');

                if (parentId) {
                    this.onParentChange(cell, cell.get('parent'));
                }
            });
        });

        this.listenTo(graph, 'change:parent', (_context, cell, parentId) => {
            this.onParentChange(cell, parentId);
        });

        this.listenTo(paper, 'cell:inserted', (_context, cellView) => {
            const cellId = cellView.model.id;
            if (paper.hasLayer(cellId)) {
                const layerView = paper.getLayer(cellId);
                cellView.el.after(layerView.el);
            }
        });
    }

    onParentChange(cell, parentId) {
        const { graph } = this;

        if (parentId) {
            // Create new layer if it's not exist
            if (!graph.hasLayer(parentId)) {
                const layer = new GraphLayer({
                    name: parentId
                });
                graph.addLayer(layer);
                this.insertLayerView(layer);
            }

            cell.layer(parentId); // Set the layer for the cell
        } else {
            cell.layer(null); // Move to the default layer
        }
    }

    insertLayerView(layer) {
        const { paper } = this;

        const cellId = layer.name;
        const layerView = paper.createLayer({ name: cellId, model: layer });
        // Do not append to the DOM immediately
        // Layer will be appended with the correspondent container
        paper.addLayer(layerView, { doNotAppend: true });

        const cellView = paper.findViewByModel(cellId);
        if (cellView.isMounted()) {
            // Append the layer if the container is already mounted
            cellView.el.after(layerView.el);
        }
    }

    removeLayerView(layer) {
        const { paper } = this;

        const cellId = layer.name;
        if (paper.hasLayer(cellId)) {
            const layerView = paper.getLayer(cellId);
            paper.removeLayer(layerView);
        }
    }
}
