//      JointJS library.
//      (c) 2011-2015 client IO

joint.mvc.View = Backbone.View.extend({

    options: {
        theme: 'default'
    },

    theme: null,
    themeClassNamePrefix: 'joint-theme-',
    requireSetThemeOverride: false,

    constructor: function(options) {

        Backbone.View.call(this, options);
    },

    initialize: function(options) {

        this.requireSetThemeOverride = options && !!options.theme;

        this.options = _.extend({}, joint.mvc.View.prototype.options || {}, this.options || {}, options || {});

        _.bindAll(this, 'setTheme', 'onSetTheme', 'remove', 'onRemove');

        joint.mvc.views[this.cid] = this;

        this.setTheme(this.options.theme);
        this.init();
    },

    init: function() {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    setTheme: function(theme, opt) {

        opt = opt || {};

        // Theme is already set, override is required, and override has not been set.
        // Don't set the theme.
        if (this.theme && this.requireSetThemeOverride && !opt.override) return;

        this.onSetTheme(this.theme/* oldTheme */, theme/* newTheme */);

        if (this.theme) {

            this.$el.removeClass(this.themeClassNamePrefix + this.theme);
        }

        this.$el.addClass(this.themeClassNamePrefix + theme);

        this.theme = theme;

        return this;
    },

    onSetTheme: function(oldTheme, newTheme) {
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
