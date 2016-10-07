(function(joint, _, Backbone) {

    var graphUtils = joint.dia.Graph;

    joint.dia.Group = joint.dia.Cell.extend({

        initialize: function() {
            joint.dia.Cell.prototype.initialize.apply(this, arguments);
            // ?
        },

        getCells: function() {
            return this.get('cells');
        },

        getBBox: function(opt) {
            return graphUtils.getCellsBBox(this.getCells(), opt);
        },

        resize: function(width, height, opt) {
            graphUtils.resizeCells(width, height, this.getCells(), opt);
            return this;
        },

        translate: function(dx, dy, opt) {
            graphUtils.translateCells(dx, dy, this.getCells(), opt);
            return this;
        },

        rotate: function(angle, absolute, origin, opt) {
            // ?? absolute = true
            var rotateOpt = _.defaults({ absolute: !!absolute }, opt);
            var rotateOrigin = origin || this.getBBox().center();
            graphUtils.rotateCells(angle, rotateOrigin, this.getCells(), rotateOpt);
            return this;
        },

        remove: function() {
            graphUtils.removeCells(this.getCells());
            return this;
        },

        toJSON: function() {
            return {
                id: this.id,
                cells: _.map(this.get('cells'), 'id')
            };
        },

        toFront: function(opt) {
            _.invoke(this.getCells(), 'toFront', opt);
            return this;
        },

        toBack: function(opt) {
            _.invoke(this.getCells(), 'toBack', opt);
            return this;
        },

        embed: function(cell, opt) {
            throw new Error('Group can not embed cells.');
        },

        unembed: function(cell, opt) {
            throw new Error('Group can not unembed cells.');
        },

        clone: function(opt) {

            var clone = Backbone.Model.prototype.clone.apply(this, arguments);

            clone.set({
                id: joint.util.uuid(),
                cells: graphUtils.cloneCells(this.getCells())
            });

            return (opt && opt.deep) ? [clone] : clone;
        },

        // Embeds

        isEmbeddedIn: function() {
            return false;
        },

        isEmbedded: function() {
            return false;
        },

        getAncestors: function() {
            // return join of all cell's ancestors?
            return [];
        },

        getEmbeddedCells: function() {
            // return concatination of all cell's embeds?
            return [];
        },

        addTo: function(graph, opt) {
            this.graph.addCells(this.getCells(), opt);
            this.graph.addGroup(this, opt);
            return this;
        },

        // Ports

        processPorts: function() {
            // noop ? deprecated ?
        }
    });

})(joint, _, Backbone);
