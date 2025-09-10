import { Collection } from '../../mvc/index.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';
import * as util from '../../util/index.mjs';

export const GraphCellLayers = Collection.extend({

    initialize: function(models, opt) {

        // Set the optional namespace where all model classes are defined.
        if (opt.cellLayerNamespace) {
            this.cellLayerNamespace = opt.cellLayerNamespace;
        } else {
            this.cellLayerNamespace = {
                CellLayer
            }
        }

        this.graph = opt.graph;
    },

    model: function(attrs, opt) {

        const collection = opt.collection;
        const namespace = collection.cellLayerNamespace;
        const { type } = attrs;

        // Find the model class based on the `type` attribute in the cell namespace
        const CellLayerClass = util.getByPath(namespace, type, '.');
        if (!CellLayerClass) {
            throw new Error(`dia.Graph: Could not find cell layer constructor for type: '${type}'. Make sure to add the constructor to 'cellLayerNamespace'.`);
        }

        return new CellLayerClass(attrs, opt);
    },

    _addReference: function(model, options) {
        Collection.prototype._addReference.apply(this, arguments);
        // If not in `dry` mode and the model does not have a graph reference yet,
        // set the reference.
        if (!options.dry && !model.graph) {
            model.graph = this.graph;
        }
    },

    _removeReference: function(model, options) {
        Collection.prototype._removeReference.apply(this, arguments);
        // If not in `dry` mode and the model has a reference to this exact graph,
        // remove the reference.
        if (!options.dry && model.graph === this.graph) {
            model.graph = null;
        }
    },

    _prepareModel: function(attrs, options) {
        let attributes;
        if (attrs instanceof CellLayer) {
            attributes = attrs.attributes;
        } else {
            attributes = attrs;
        }

        if (!util.isString(attributes.type)) {
            throw new TypeError('dia.Graph: cellLayer type must be a string.');
        }

        return Collection.prototype._prepareModel.apply(this, arguments);
    },

    _onModelEvent(event, model) {
        if (model) {
            if (event === 'changeId') {
                var prevId = this.modelId(model.previousAttributes(), model.idAttribute);
                var id = this.modelId(model.attributes, model.idAttribute);
                if (prevId != null) delete this._byId[prevId];
                if (id != null) this._byId[id] = model;
            }
        }
        arguments[0] = 'layer:' + event;
        //retrigger model events with the `cell:` prefix
        this.trigger.apply(this, arguments);
    }
});
