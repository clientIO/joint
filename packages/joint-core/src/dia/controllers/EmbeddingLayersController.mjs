import { Listener } from '../../mvc/Listener.mjs';
import { Group } from '../groups/Group.mjs';

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
            if (graph.hasGroup(cell.id)) {
                const group = graph.getGroup(cell.id);
                group.reset();
                graph.removeGroup(group);
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
                this.insertEmbeddedLayer(cellView);
            }
        });
    }

    onParentChange(cell, parentId) {
        const { graph, paper } = this;

        if (parentId) {
            // Create new layer if it's not exist
            if (!graph.hasGroup(parentId)) {
                const group = new Group({
                    name: parentId
                });
                graph.addGroup(group);

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
        const layer = this.paper.getLayer(cellId);
        cellView.el.after(layer.el);
    }
}
