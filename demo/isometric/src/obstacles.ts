import { g, dia, mvc } from 'jointjs';
import { GRID_COUNT, GRID_SIZE } from './theme';

// Simplified version of obstacle detection.
// It assumes that the grid is always square, which is true in our case
// It assumes that obstacles are always squares, which is true in our case
// It assumes that obstacles never overlap, which is true in our case
export default class Obstacles {

    step: number = GRID_SIZE;
    size: number = GRID_COUNT;
    grid: string[][] = [];
    graph: dia.Graph;
    listener: mvc.Listener<[]>;

    constructor(graph: dia.Graph) {
        this.graph = graph;
        const listener = new mvc.Listener();
        listener.listenTo(graph, 'reset', () => this.update());
        listener.listenTo(graph, 'add', (cell) => this.addCell(cell));
        listener.listenTo(graph, 'remove', (cell) => this.removeCell(cell));
        listener.listenTo(graph, 'change:position', (cell) => this.updateCellPosition(cell));
        listener.listenTo(graph, 'change:size', (cell) => this.updateCellSize(cell));
        this.reset();
    }

    protected getCellArea(bbox: g.Rect): g.Rect {
        const { step } = this;
        const x = Math.floor(bbox.x / step);
        const y = Math.floor(bbox.y / step);
        const width = Math.ceil(bbox.width / step);
        const height = Math.ceil(bbox.height / step);
        return new g.Rect({ x, y, width, height });
    }

    protected toggleArea(area: g.Rect, value: string) {
        const { x, y, width, height } = area;
        for (let i = Math.max(0, x); i < Math.min(x + width, this.size); i++) {
            for (let j = Math.max(0, y); j < Math.min(y + height, this.size); j++) {
                this.grid[i][j] = value;
            }
        }
    }

    protected addCell(cell: dia.Cell) {
        if (cell.isLink()) return;
        this.toggleArea(this.getCellArea(cell.getBBox()), cell.cid);
    }

    protected removeCell(cell: dia.Cell) {
        if (cell.isLink()) return;
        this.toggleArea(this.getCellArea(cell.getBBox()), null);
    }

    protected updateCellPosition(cell: dia.Cell) {
        if (cell.isLink()) return;
        const prevPosition = cell.previous('position');
        const prevBBox = cell.getBBox();
        prevBBox.x = prevPosition.x;
        prevBBox.y = prevPosition.y;
        this.toggleArea(this.getCellArea(prevBBox), null);
        this.toggleArea(this.getCellArea(cell.getBBox()), cell.cid);
    }

    protected updateCellSize(cell: dia.Cell) {
        if (cell.isLink()) return;
        const prevSize = cell.previous('size');
        const prevBBox = cell.getBBox();
        prevBBox.width = prevSize.width;
        prevBBox.height = prevSize.height;
        this.toggleArea(this.getCellArea(prevBBox), null);
        this.toggleArea(this.getCellArea(cell.getBBox()), cell.cid);
    }

    protected reset() {
        this.grid = Array.from({ length: this.size }, () => Array.from({ length: this.size }, () => null));
    }

    // Is the given bounding box free of obstacles?
    // If key is given, the occupied cells are ignored if they belong to the same cell key
    isFree(bbox: g.Rect, key: string = null): boolean {
        const area = this.getCellArea(bbox);
        const { x, y, width, height } = area;
        for (let i = x; i < x + width; i++) {
            for (let j = y; j < y + height; j++) {
                // check if the cell is out of the grid
                if (i < 0 || i >= this.size || j < 0 || j >= this.size) return false;
                // check if the cell is occupied
                const value = this.grid[i][j];
                if (value && value !== key) return false;
            }
        }
        return true;
    }

    // Update the whole grid based on the current graph
    update() {
        this.reset();
        this.graph.getElements().forEach((cell) => this.addCell(cell));
    }

    // Destroy the obstacles instance
    destroy() {
        this.listener.stopListening();
    }
}
