import { CellGroupCollection } from './CellGroupCollection.mjs';
import * as util from '../../util/index.mjs';

export const CELL_LAYER_COLLECTION_MARKER = Symbol('joint.cellLayerCollectionMarker');

/**
 * @class CellLayerCollection
 * @description A CellLayerCollection is a collection of cells which supports sorting by z attribute.
 * Additionally, it facilitates creating cell models from JSON using cellNamespace
 * and stores a reference to the graph when the cell model has been added.
 */
export class CellLayerCollection extends CellGroupCollection {

    [CELL_LAYER_COLLECTION_MARKER] = true;

    initialize(_models, opt) {
        this.cellNamespace = opt.cellNamespace;
        this.graph = opt.graph;
        this.layer = opt.layer;
    }

    // Overriding the default `model` method to create cell models
    // based on their `type` attribute and the `cellNamespace` option.
    model(attrs, opt) {

        const namespace = this.cellNamespace;
        const { type } = attrs;

        // Find the model class based on the `type` attribute in the cell namespace
        const ModelClass = util.getByPath(namespace, type, '.');
        if (!ModelClass) {
            throw new Error(`dia.Graph: Could not find cell constructor for type: '${type}'. Make sure to add the constructor to 'cellNamespace'.`);
        }

        return new ModelClass(attrs, opt);
    }

    // Override to set graph reference
    _addReference(model, options) {
        super._addReference(model, options);
        // If not in `dry` mode and the model does not have a graph reference yet,
        // set the reference.
        if (!options.dry && !model.graph) {
            model.graph = this.graph;
        }
    }

    // Override to remove graph reference
    _removeReference(model, options) {
        super._removeReference(model, options);
        // If not in `dry` mode and the model has a reference to this exact graph,
        // remove the reference.
        if (!options.dry && model.graph === this.graph) {
            model.graph = null;
        }
    }

    // remove graph reference additionally
    _removeReferenceFast(model, options) {
        super._removeReferenceFast(model, options);
        // If not in `dry` mode and the model has a reference to this exact graph,
        // remove the reference.
        if (!options.dry && model.graph === this.graph) {
            model.graph = null;
        }
    }

    // `comparator` makes it easy to sort cells based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }
}
