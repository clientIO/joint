joint.dia.Link.define('toggable.Link', null, {

    hide: function() {
        this.set('hidden', true)
    },

    show: function() {
        this.set('hidden', false)
    },

    isVisible: function() {
        return !this.get('hidden');
    },

    resolveOrientation: function(element) {

        var source = this.get('source');
        var target = this.get('target');
        var result;

        if (source && source.id !== element.id) {
            result = {
                oppositeEnd: source,
                currentEnd: target
            };
        }

        if (target && target.id !== element.id) {
            result = {
                oppositeEnd: target,
                currentEnd: source
            }
        }

        return result;
    }
});

joint.dia.Element.define('toggable.Element', {
    hidden: false
}, {
    options: {
        onPortExpand: function(cell, portId, expand) {
            console.log('on port expand event', arguments);
        }
    },

    initialize: function() {

        joint.dia.Element.prototype.initialize.apply(this, arguments);
        this.on('neighborHiddenChanged', this.neighborHiddenChanged);
    },

    neighborHiddenChanged: function(connection, hidden) {

        if (connection.port) {
            this.neighborHiddenChangedByPort(connection.port, hidden);
        }
    },

    hide: function() {
        this.set('hidden', true);
    },

    show: function() {
        this.set('hidden', false);
    },

    isVisible: function() {
        return !this.get('hidden');
    },

    isPortCollapsed: function(portId) {
        var collapsedList = this.get('collapsed') || {};
        return collapsedList[portId] > 0;
    },

    expandPort: function(portId) {

        if (portId) {

            if (this.isPortCollapsed(portId)) {
                this.graph.getConnectedLinks(this).forEach(function(link) {
                    var orientedEnds = link.resolveOrientation(this);
                    if (orientedEnds && orientedEnds.currentEnd.port === portId && orientedEnds.oppositeEnd.id) {
                        this.graph.getCell(orientedEnds.oppositeEnd.id).show();
                    }
                }, this);
            }
        }
    },

    neighborHiddenChangedByPort: function(portId, hidden) {

        var expand = !hidden;
        var collapsedList = _.clone(this.get('collapsed')) || {};

        if (expand) {
            // expand

            if (_.isFinite(collapsedList[portId])) {
                collapsedList[portId]--;
            }

            if (collapsedList[portId] <= 0) {
                delete collapsedList[portId];
                this.portProp(portId, 'collapsed', false);
                this.options.onPortExpand(this, portId, expand);
            }
        } else {
            // collapse

            if (!collapsedList[portId]) {
                collapsedList[portId] = 1;
                this.portProp(portId, 'collapsed', true);
                this.options.onPortExpand(this, portId, expand);
            } else {
                collapsedList[portId]++;
            }
        }

        this.set('collapsed', collapsedList);
    }
});
