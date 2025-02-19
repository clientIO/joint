import { Model } from '../mvc/index.mjs';

export const LayersNames = {
    GRID: 'grid',
    CELLS: 'cells',
    BACK: 'back',
    FRONT: 'front',
    TOOLS: 'tools',
    LABELS: 'labels'
};

export class Layer extends Model {

    defaults() {
        return {
            name: '',
            displayName: '',
        };
    }

    initialize() {
        this.models = [];
    }

    addModel(item) {
        this.models.push(item);
    }

    removeModel(item) {
        const index = this.models.indexOf(item);
        if (index !== -1) {
            this.models.splice(index, 1);
        }
    }
}
