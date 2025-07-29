import { Listener } from '../../mvc/Listener.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';

export class EmbeddingLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;
        this.paper = context.paper;

        this.embeddedCellLayers = {};

        this.startListening();
    }

    startListening() {
        const { graph, paper, embeddedCellLayers } = this;

        this.listenTo(graph, 'remove', (_context, cell) => {
            if (embeddedCellLayers[cell.id]) {
                paper.requestLayerViewRemove(cell.id);
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
        const { paper, embeddedCellLayers } = this;

        if (parentId) {
            // Create new layer if it's not exist
            if (!embeddedCellLayers[parentId]) {
                const cellLayer = new CellLayer({
                    id: parentId
                });
                embeddedCellLayers[cellLayer] = cellLayer;
                paper.renderLayerView({
                    id: parentId,
                    model: cellLayer,
                });

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
