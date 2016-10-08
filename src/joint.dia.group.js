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

            this._setGroupRefs(this, this.getCells());
            this.on('change:cells', _.bind(this._setGroupRefs, this));
        },

        _setGroupRefs: function(group, cells, opt) {

            var removedCells = _.difference(group.previous('cells'), cells);

            _.each(cells, _.bind(this._setGroupRef, this, group));
            _.each(removedCells, _.bind(this._setGroupRef, this, null));
        },

        _setGroupRef: function(group, cell) {

            var prevGroup = cell.group;

            if (group && prevGroup && prevGroup !== group) {
                throw new Error('Group: cell already a member of another group.');
            }

            cell.group = group;
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

        removeCell: function(cell, opt) {
            if (this.hasCell(cell)) {
                this.set('cells', _.without(this.get('cells'), cell), opt);
            }
            return this;
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

            var attributes = _.merge({
                id: joint.util.uuid(),
                cells: _.toArray(graphUtils.cloneCells(this.getCells()))
            }, _.omit(this.attributes, 'id', 'cells'));

            var clone = new this.constructor(attributes);

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
