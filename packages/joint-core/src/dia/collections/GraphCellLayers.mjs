import { Collection } from '../../mvc/index.mjs';
import { CellLayer } from '../groups/CellLayer.mjs';
import * as util from '../../util/index.mjs';

export const GraphCellLayers = Collection.extend({

    modelInstance: CellLayer,

    defaultCellLayerNamespace: {
        CellLayer: CellLayer,
        LegacyCellLayer: CellLayer
    },

    initialize: function(models, opt) {

        // Set the optional namespace where all model classes are defined.
        const cellLayerNamespace = opt.cellLayerNamespace || {};
        this.cellLayerNamespace = util.defaultsDeep({}, cellLayerNamespace, this.defaultCellLayerNamespace);

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

    _prepareModel: function(attrs, options) {
        let attributes;
        if (attrs instanceof CellLayer) {
            attributes = attrs.attributes;
        } else {
            attributes = attrs;
        }

        if (!util.isString(attributes.type)) {
            attributes.type = 'CellLayer'; // default type
        }

        return Collection.prototype._prepareModel.apply(this, arguments);
    },

    // Do not propagate inner cell layer collection events.
    // Allow only for cell layer model events.
    _onModelEvent(event, model) {
        if (model && model instanceof this.modelInstance) {
            if ((event === model.eventsPrefix + 'add' || event === model.eventsPrefix + 'remove') && model.collection !== this) return;
            if (event === 'changeId') {
                var prevId = this.modelId(model.previousAttributes(), model.idAttribute);
                var id = this.modelId(model.attributes, model.idAttribute);
                if (prevId != null) delete this._byId[prevId];
                if (id != null) this._byId[id] = model;
            }

            arguments[0] = arguments[0].replace(model.eventsPrefix, '');
            this.trigger.apply(this, arguments);
        }
    }
});
