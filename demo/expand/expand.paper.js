joint.dia.ExpandPaper = joint.dia.Paper.extend({

    initialize: function() {

        joint.dia.Paper.prototype.initialize.apply(this, arguments);
        this.listenTo(this.model, 'change:hidden', this.onHiddenChanged);
    },

    renderView: function(cell) {

        var graph = this.model;
        if (cell.isLink()) {
            var source = cell.get('source');
            var target = cell.get('target');

            if (target && target.id) {
                var targetCell = graph.getCell(target.id);
                if (!targetCell.isVisible()) {
                    cell.set('hidden', { silent: true });
                }
            }

            if (source && source.id) {
                var sourceCell = graph.getCell(source.id);
                if (!sourceCell.isVisible()) {
                    cell.set('hidden', { silent: true });
                }
            }
        }

        if (cell.isVisible()) {
            joint.dia.Paper.prototype.renderView.apply(this, arguments);
        }
    },

    onHiddenChanged: function(cell, hidden) {
        var cellView = cell.findView(paper);
        var graph = this.model;

        if (cell.isLink()) {
            var source = cell.get('source');
            var target = cell.get('target');

            if (target && target.id) {
                var targetCell = graph.getCell(target.id);
                targetCell.trigger('neighborHiddenChanged', target, hidden);
            }

            if (source && source.id) {
                var sourceCell = graph.getCell(source.id);
                sourceCell.trigger('neighborHiddenChanged', source, hidden);
            }
        }

        // hide affected links before elements
        if (cell.isElement() && hidden) {
            this.processLinksOnElementToggle(cell, hidden);
        }

        if (hidden && cellView) {
            this.removeView(cell);
        }

        else if (!hidden && !cellView) {
            joint.dia.Paper.prototype.renderView.call(this, cell);
        }

        // show affected links after elements are rendered
        if (cell.isElement() && !hidden) {
            this.processLinksOnElementToggle(cell, hidden);
        }
    },

    processLinksOnElementToggle: function(element, hidden) {

        var graph = this.model;
        var links = graph.getConnectedLinks(element);

        links.forEach(function(link) {

            var oppositeCell;
            var r = link.resolveOrientation(element);

            oppositeCell = graph.getCell(r.oppositeEnd.id);

            if (!r.oppositeEnd.id || oppositeCell && oppositeCell.isVisible()) {
                hidden ? link.hide() : link.show();
            }
        }, this);
    }
});
