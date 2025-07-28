import { Listener } from '../../mvc/Listener.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';

export class CellLayersController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;

        this.defaultCellLayerId = this.graph.defaultCellLayerId;

        if (!this.graph.has('cellLayers')) {
            this.graph.set('cellLayers', [{
                id: this.defaultCellLayerId,
                default: true,
                order: 1
            }]);
        }

        this.cellLayersMap = {};
        this.cellLayerAttributes = this.graph.get('cellLayers');

        this.cellLayerAttributes.forEach(attributes => {
            const cellLayer = this.createCellLayer(attributes);
            this.cellLayersMap[attributes.id] = cellLayer;
        });

        this.startListening();
    }

    startListening() {
        const { graph } = this;

        this.listenTo(graph, 'add', (_context, cell) => {
            this.onAdd(cell);
        });

        this.listenTo(graph, 'remove', (_context, cell) => {
            this.onRemove(cell);
        });

        this.listenTo(graph, 'reset', (_context, { models: cells }) => {
            const { cellLayersMap } = this;

            for (let layerId in cellLayersMap) {
                cellLayersMap[layerId].reset();
            }

            cells.forEach(cell => {
                this.onAdd(cell, true);
            });
        });

        this.listenTo(graph, 'change:layer', (_context, cell, layerId, opt) => {
            if (!layerId) {
                layerId = this.defaultCellLayerId;
            }
            const previousLayerId = cell.previous('layer') || this.defaultCellLayerId;

            if (previousLayerId === layerId) {
                return; // no change
            }

            const previousLayer = this.getCellLayer(previousLayerId);
            previousLayer.remove(cell, opt);

            const layer = this.getCellLayer(layerId);
            layer.add(cell, opt);
        });
    }

    createCellLayer(attributes) {
        const cellLayer = new CellLayer(attributes);

        return cellLayer;
    }

    onAdd(cell, reset = false) {
        const layerId = cell.layer() || this.defaultCellLayerId;
        const layer = this.getCellLayer(layerId);

        // compatibility
        // in the version before groups, z-index was not set on reset
        if (!reset) {
            if (!cell.has('z')) {
                cell.set('z', layer.maxZIndex() + 1);
            }
        }

        // add to the layer without triggering rendering update
        // when the cell is just added to the graph, it will be rendered normally by the paper
        layer.add(cell, { initial: true });
    }

    onRemove(cell) {
        const layerId = cell.layer() || this.defaultCellLayerId;

        if (this.hasCellLayer(layerId)) {
            const layer = this.getCellLayer(layerId);
            layer.remove(cell);
        }
    }

    getDefaultCellLayer() {
        return this.cellLayersMap[this.defaultCellLayerId];
    }

    addCellLayer(cellLayer, _opt) {
        const { cellLayersMap } = this;

        if (this.hasCellLayer(cellLayer.id)) {
            throw new Error(`dia.Graph: Layer with id '${cellLayer.id}' already exists.`);
        }

        cellLayersMap[cellLayer.id] = cellLayer;

        this.cellLayerAttributes = this.cellLayerAttributes.concat([{ id: cellLayer.id }]);

        this.graph.set('cellLayers', this.cellLayerAttributes);
    }

    removeCellLayer(layerId, _opt) {
        const { cellLayersMap, defaultCellLayerId } = this;

        if (layerId === defaultCellLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Layer with id '${layerId}' does not exist.`);
        }

        const layer = this.getCellLayer(layerId);
        // reset the layer to remove all cells from it
        layer.reset();

        this.cellLayerAttributes = this.cellLayerAttributes.filter(l => l.id !== layerId);
        delete cellLayersMap[layerId];

        this.graph.set('cellLayers', this.cellLayerAttributes);
    }

    minZIndex(layerId) {
        const { defaultCellLayerId } = this;

        layerId = layerId || defaultCellLayerId;

        const layer = this.getCellLayer(layerId);

        return layer.minZIndex();
    }

    maxZIndex(layerId) {
        const { defaultCellLayerId } = this;

        layerId = layerId || defaultCellLayerId;

        const layer = this.getCellLayer(layerId);

        return layer.maxZIndex();
    }

    hasCellLayer(layerId) {
        return !!this.cellLayersMap[layerId];
    }

    getCellLayer(layerId) {
        if (!this.cellLayersMap[layerId]) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.cellLayersMap[layerId];
    }

    getCellLayers() {
        const cellLayers = [];

        for (let layerId in this.cellLayersMap) {
            cellLayers.push(this.cellLayersMap[layerId]);
        }

        return cellLayers;
    }

    getCellLayerCells(layerId) {
        return this.cellLayersMap[layerId].cells.toArray();
    }

    getCells() {
        const cells = [];

        for (let layerId in this.cellLayersMap) {
            cells.push(...this.cellLayersMap[layerId].cells);
        }

        return cells;
    }
}
