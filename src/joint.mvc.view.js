
joint.mvc.View = Backbone.View.extend({

    options: {},
    theme: null,
    themeClassNamePrefix: joint.util.addClassNamePrefix('theme-'),
    requireSetThemeOverride: false,
    defaultTheme: joint.config.defaultTheme,

    constructor: function(options) {

        Backbone.View.call(this, options);
    },

    initialize: function(options) {

        this.requireSetThemeOverride = options && !!options.theme;

        this.options = _.extend({}, this.options, options);

        _.bindAll(this, 'setTheme', 'onSetTheme', 'remove', 'onRemove');

        joint.mvc.views[this.cid] = this;

        this.setTheme(this.options.theme || this.defaultTheme);
        this._ensureElClassName();
        this.init();
    },

    // Override the Backbone `_ensureElement()` method in order to create an
    // svg element (e.g., `<g>`) node that wraps all the nodes of the Cell view.
    _ensureElement: function() {
        var el;

        if (this.svgElement) {

            if (!this.el) {

                var attrs = _.extend({ id: this.id }, _.result(this, 'attributes'));
                if (this.className) attrs['class'] = _.result(this, 'className');
                el = V(_.result(this, 'tagName'), attrs).node;

            } else {

                el = _.result(this, 'el');
            }

            this.setElement(el, false);

        } else {

            Backbone.View.prototype._ensureElement.call(this);

        }

    },

    // Utilize an alternative DOM manipulation API by
    // adding an element reference wrapped in Vectorizer.
    _setElement: function(el) {

        if (this.svgElement) {

            this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
            this.el = this.$el[0];
            this.vel = V(this.el);

        } else {

            Backbone.View.prototype._setElement.call(this, el);

        }

    },

    _ensureElClassName: function() {

        var className = _.result(this, 'className');
        var prefixedClassName = joint.util.addClassNamePrefix(className);

        this.$el.removeClass(className);
        this.$el.addClass(prefixedClassName);
    },

    init: function() {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    onRender: function() {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    setTheme: function(theme, opt) {

        opt = opt || {};

        // Theme is already set, override is required, and override has not been set.
        // Don't set the theme.
        if (this.theme && this.requireSetThemeOverride && !opt.override) {
            return this;
        }

        this.removeThemeClassName();
        this.addThemeClassName(theme);
        this.onSetTheme(this.theme/* oldTheme */, theme/* newTheme */);
        this.theme = theme;

        return this;
    },

    addThemeClassName: function(theme) {

        theme = theme || this.theme;

        var className = this.themeClassNamePrefix + theme;

        this.$el.addClass(className);

        return this;
    },

    removeThemeClassName: function(theme) {

        theme = theme || this.theme;

        var className = this.themeClassNamePrefix + theme;

        this.$el.removeClass(className);

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
    },

    getEventNamespace: function() {
        // Returns a per-session unique namespace
        return '.joint-event-ns-' + this.cid;
    }
});

(function() {

    joint.mvc.View._extend = joint.mvc.View.extend;

    joint.mvc.View.extend = function(protoProps, staticProps) {

        var protoPropsClone = _.clone(protoProps || {});

        var render = protoPropsClone.render;

        protoPropsClone.render = function() {

            if (render) {
                // Call the original render method.
                render.apply(this, arguments);
            }

            // Should always call onRender() method.
            this.onRender();

            // Should always return itself.
            return this;
        };

        return joint.mvc.View._extend.call(this, protoPropsClone, staticProps);
    };

})();
