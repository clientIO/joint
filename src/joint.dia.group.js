(function(joint, _, Backbone) {

    // TODO:
    // - missing batches
    // - restrictTranslate paper option
    // - command manager (set attribute)
    // - hasCell --> has ?
    var graphUtils = joint.dia.Graph;

    joint.dia.Group = joint.dia.Cell.extend({

        defaults: {
            cells: []
        },

        initialize: function() {
            joint.dia.Cell.prototype.initialize.apply(this, arguments);
            // ?
        },

        position: function(x, y, opt) {

            var isSetter = _.isNumber(x);

            if (!isSetter) {
                return this.getBBox().origin();
            }

            // TODO: setter
        },

        // TODO: add to element
        size: function() {

        },

        // TODO: add to element
        angle: function() {

        },

        addCell: function(cell, opt) {
            if (!this.hasCell(cell)) {
                this.set('cells', this.get('cells').concat(cell), opt);
            }
            return this;
        },

        getCells: function() {
            return this.get('cells');
        },

        hasCell: function(cell) {

            return _.contains(this.getCells(), cell);
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

        scale: function(sx, sy, origin, opt) {

            graphUtils.scaleCells(sx, sy, origin, this.getCells(), opt);
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
                cells: _.toArray(graphUtils.cloneCells(this.getCells()))
            });

            return (opt && opt.deep) ? [clone] : clone;
        },


        addTo: function(graph, opt) {
            graph.addCells(this.getCells(), opt);
            graph.addGroup(this, opt);
            return this;
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

        fitEmbeds: function() {

            /// ?????? implement or not
        },
        // Ports

        processPorts: function() {
            // noop ? deprecated ?
        }
    });

})(joint, _, Backbone);
