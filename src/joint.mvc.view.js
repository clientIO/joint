//      JointJS library.
//      (c) 2011-2015 client IO

joint.mvc.View = Backbone.View.extend({

    options: {
    },

    constructor: function(options) {

        Backbone.View.call(this, options);
    },

    initialize: function(options) {

        this.options = _.extend({}, joint.mvc.View.prototype.options || {}, this.options || {}, options || {});

        _.bindAll(this, 'remove', 'onRemove');

        joint.mvc.views[this.cid] = this;

        this.init();
    },

    init: function() {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    remove: function() {

        this.onRemove();

        joint.mvc.views[this.cid] = null;

        Backbone.View.prototype.remove.apply(this, arguments);

        return this;
    },

    onRemove: function() {
        // Intentionally empty.
        // This method is meant to be overriden.
    }
});
