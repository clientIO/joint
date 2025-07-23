import { Listener } from '../../mvc/Listener.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';

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
            if (graph.hasCellLayer(cell.id)) {
                const cellLayer = graph.getCellLayer(cell.id);
                graph.removeCellLayer(cellLayer);
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
            if (paper.hasLayerView(cellId)) {
                this.insertEmbeddedLayer(cellView);
            }
        });
    }

    onParentChange(cell, parentId) {
        const { graph, paper } = this;

        if (parentId) {
            // Create new layer if it's not exist
            if (!graph.hasCellLayer(parentId)) {
                const cellLayer = new CellLayer({
                    id: parentId
                });
                graph.addCellLayer(cellLayer);

                const cellView = paper.findViewByModel(parentId);
                if (cellView.isMounted()) {
                    this.insertEmbeddedLayer(cellView);
                }
            }

            cell.layer(parentId); // Set the layer for the cell
        } else {
            cell.layer(null); // Move to the default layer
        }
    }

    insertEmbeddedLayer(cellView) {
        const cellId = cellView.model.id;
        const layerView = this.paper.getLayerView(cellId);
        cellView.el.after(layerView.el);
    }
}
