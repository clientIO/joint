import { Listener } from '../../mvc/Listener.mjs';
import { config } from '../../config/index.mjs';
import { CELL_MARKER } from '../Cell.mjs';

const DEFAULT_CELL_LAYER_ID = 'cells';

/**
 * @class CellLayersController
 * @description A controller that manages cell layers in a dia.Graph.
 */
export class CellLayersController extends Listener {

    constructor(context) {
        super(context);

        // Make sure there are no arguments passed to the callbacks.
        // See the `mvc.Listener` documentation for more details.
        this.callbackArguments = [];

        this.graph = context.graph;
        this.collection = this.graph.cellLayerCollection;

        // Default setup
        this.addCellLayer({
            id: DEFAULT_CELL_LAYER_ID,
            __legacy: true
        });
        this.defaultCellLayerId = DEFAULT_CELL_LAYER_ID;

        this.startListening();
    }

    startListening() {
        this.listenTo(this.collection, 'reset', (collection, opt = {}) => {
            this.onCellLayersCollectionReset(collection, opt);
        });

        this.listenTo(this.collection, 'remove', (cellLayer, opt = {}) => {
            this.onCellLayerRemove(cellLayer, opt);
        });

        this.listenTo(this.collection, 'cell:change', (cell, opt = {}) => {
            this.onCellChange(cell, opt);
        });
    }

    onCellLayerRemove(cellLayer, opt) {
        // remove all cells from removed cell layer
        cellLayer.cells.toArray().forEach(cell => {
            cell.remove(opt);
        });
    }

    resetCellLayers(cellLayers = [], opt = {}) {
        if (!Array.isArray(cellLayers) || cellLayers.length === 0) {
            throw new Error('dia.Graph: At least one cell layer must be defined.');
        }

        let defaultCellLayerId = opt.defaultCellLayer;

        if (!defaultCellLayerId) {
            defaultCellLayerId = cellLayers[0].id;
        }

        if (!cellLayers.some(layer => layer.id === defaultCellLayerId)) {
            throw new Error(`dia.Graph: default cell layer with id '${defaultCellLayerId}' must be one of the defined cell layers.`);
        }

        this.graph.startBatch('reset-layers', opt);
        if (this.defaultCellLayerId !== defaultCellLayerId) {
            this.defaultCellLayerId = defaultCellLayerId;
            this.graph.trigger('layers:default:change', this.graph, this.defaultCellLayerId, opt);
        }

        this.collection.reset(cellLayers, { ...opt, cellLayersController: this });
        this.graph.stopBatch('reset-layers', opt);
    }

    onCellLayersCollectionReset(collection, opt) {
        const previousCellLayers = opt.previousModels;

        // remove cells from the layers that have been removed
        previousCellLayers.forEach(previousLayer => {
            this.onCellLayerRemove(previousLayer, opt);
        });
    }

    onCellChange(cell, opt) {
        const layerAttribute = config.layerAttribute;

        if (!cell.hasChanged(layerAttribute))
            return;

        let layerId = this._getLayerId(cell);
        const previousLayerId = cell.previous(layerAttribute) || this.defaultCellLayerId;

        if (previousLayerId === layerId) {
            return; // no change
        }

        const previousLayer = this.getCellLayer(previousLayerId);
        previousLayer.remove(cell, {
            ...opt,
            cellLayersController: this,
            layerChange: true
        });

        const layer = this.getCellLayer(layerId);
        layer.add(cell, {
            ...opt,
            cellLayersController: this,
            layerChange: true
        });
    }

    resetLayersCollections(cells, opt = {}) {
        const { collection } = this;

        const layersMap = collection.reduce((map, layer) => {
            map[layer.id] = [];
            return map;
        }, {});

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const layerId = this._getLayerId(cell);
            if (collection.has(layerId)) {
                layersMap[layerId].push(cell);
            }
        }

        collection.each(layer => {
            layer.reset(layersMap[layer.id], { ...opt, cellLayersController: this });
        });
    }

    getDefaultCellLayer() {
        return this.collection.get(this.defaultCellLayerId);
    }

    setDefaultCellLayer(newDefaultLayerId, opt = {}) {
        if (!this.hasCellLayer(newDefaultLayerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${newDefaultLayerId}' does not exist.`);
        }

        const newDefaultLayer = this.getCellLayer(newDefaultLayerId);

        if (newDefaultLayerId === this.defaultCellLayerId) {
            return; // no change
        }

        if (this.hasCellLayer(this.defaultCellLayerId)) {
            const previousDefaultLayer = this.getCellLayer(this.defaultCellLayerId);
            const layerAttribute = config.layerAttribute;
            // set new default layer for paper to use when inserting to the new default layer
            this.defaultCellLayerId = newDefaultLayerId;
            // move all cells that do not have explicit layer set to the new default layer
            previousDefaultLayer.cells.toArray().forEach(cell => {
                if (cell.get(layerAttribute) == null) {
                    previousDefaultLayer.remove(cell, {
                        ...opt,
                        cellLayersController: this,
                        layerChange: true
                    });
                    newDefaultLayer.add(cell, {
                        ...opt,
                        cellLayersController: this,
                        layerChange: true
                    });
                }
            });
        } else {
            this.defaultCellLayerId = newDefaultLayerId;
        }

        this.graph.trigger('layers:default:change', this.graph, this.defaultCellLayerId, opt);
    }

    addCellLayer(cellLayer, { insertBefore } = {}) {
        const id = cellLayer.id;

        // insert before itself is a no-op
        if (id === insertBefore) {
            return;
        }

        const originalLayersArray = this.getCellLayers();

        let currentIndex = null;
        if (this.hasCellLayer(id)) {
            currentIndex = originalLayersArray.findIndex(layer => layer === cellLayer);
            if (currentIndex === originalLayersArray.length - 1 && !insertBefore) {
                return; // already at the end
            }

            // remove the layer from its current position
            this.collection.remove(id, { silent: true, cellLayersController: this });
        }

        // array after removal
        const layersArray = this.getCellLayers();
        let insertAt;
        if (!insertBefore) {
            insertAt = layersArray.length;
        } else {
            insertAt = layersArray.findIndex(layer => layer.id === insertBefore);
            if (insertAt === -1) {
                throw new Error(`dia.Graph: Cell layer with id '${insertBefore}' does not exist`);
            }
        }

        if (currentIndex != null) {
            this.collection.add(cellLayer, {
                at: insertAt,
                cellLayersController: this,
                silent: true
            });
            // trigger sort event manually since we are not using collection sorting workflow
            this.collection.trigger('sort', this.collection);
        } else {
            // add to the collection with event when new layer has been added
            this.collection.add(cellLayer, {
                at: insertAt,
                cellLayersController: this
            });
        }
    }

    removeCellLayer(layerId, opt) {
        const { collection, defaultCellLayerId } = this;

        if (layerId === defaultCellLayerId) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        this.graph.startBatch('remove-cell-layer');

        collection.remove(layerId, { ...opt, cellLayersController: this });

        this.graph.stopBatch('remove-cell-layer');
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
        return this.collection.has(layerId);
    }

    getCellLayer(layerId) {
        if (!this.hasCellLayer(layerId)) {
            throw new Error(`dia.Graph: Cell layer with id '${layerId}' does not exist.`);
        }

        return this.collection.get(layerId);
    }

    getCellLayers() {
        return this.collection.toArray();
    }

    // returns undefined if cell is not found
    // TODO: improve it in the future
    getCell(id) {
        for (let i = 0; i < this.collection.length; i++) {
            const cellLayer = this.collection.at(i);
            const cell = cellLayer.cells.get(id);
            if (cell) {
                return cell;
            }
        }
        // backward compatibility: return undefined if cell is not found
        return undefined;
    }

    getCells() {
        let cells = [];

        this.collection.each(cellLayer => {
            cells = cells.concat(cellLayer.cells.models);
        });

        return cells;
    }

    addCell(cell, opt = {}) {
        const layerId = this._getLayerId(cell);
        const layer = this.getCellLayer(layerId);

        layer.add(cell, { ...opt, cellLayersController: this });
    }

    resetCells(cells = [], opt = {}) {
        this.resetLayersCollections(cells, opt);
    }

    _getLayerId(cell) {
        // we don't use cell.layer() here because when the graph reference is not set on the cell
        // cell.layer() would return null
        if (cell[CELL_MARKER]) {
            return cell.get(config.layerAttribute) || this.defaultCellLayerId;
        }

        return cell[config.layerAttribute] || this.defaultCellLayerId;
    }
}
