import { Collection } from '../../mvc/index.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';

export class CellLayersCollection extends Collection {

    initialize(models, opt) {

        // Set the optional namespace where all model classes are defined.
        if (opt.cellLayerNamespace) {
            this.cellLayerNamespace = opt.cellLayerNamespace;
        } else {
            this.cellLayerNamespace = {
                CellLayer
            }
        }

        this.graph = opt.graph;
    }

    model(attrs, opt) {

        const collection = opt.collection;
        const namespace = collection.cellLayerNamespace;
        const { type } = attrs;

        // Find the model class based on the `type` attribute in the cell namespace
        const CellLayerClass = util.getByPath(namespace, type, '.');
        if (!CellLayerClass) {
            throw new Error(`dia.Graph: Could not find cell layer constructor for type: '${type}'. Make sure to add the constructor to 'cellLayerNamespace'.`);
        }

        return new CellLayerClass(attrs, opt);
    }

    _addReference(model, options) {
        Collection.prototype._addReference.apply(this, arguments);
        // If not in `dry` mode and the model does not have a graph reference yet,
        // set the reference.
        if (!options.dry && !model.graph) {
            model.graph = this.graph;
        }
    }

    _removeReference(model, options) {
        Collection.prototype._removeReference.apply(this, arguments);
        // If not in `dry` mode and the model has a reference to this exact graph,
        // remove the reference.
        if (!options.dry && model.graph === this.graph) {
            model.graph = null;
        }
    }

    _prepareModel(attrs, options) {
        let attributes;
        if (attrs instanceof CellLayer) {
            attributes = attrs.attributes;
        } else {
            attributes = attrs;
        }

        if (!util.isString(attributes.type)) {
            throw new TypeError('dia.Graph: cellLayer type must be a string.');
        }

        return super._prepareModel(attrs, options);
    }

    // `comparator` makes it easy to sort cell layers based on their `z` index.
    comparator(model) {
        return model.get('z') || 0;
    }
}
