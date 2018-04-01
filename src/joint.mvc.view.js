
joint.mvc.View = Backbone.View.extend({

    options: {},
    theme: null,
    themeClassNamePrefix: joint.util.addClassNamePrefix('theme-'),
    requireSetThemeOverride: false,
    defaultTheme: joint.config.defaultTheme,
    children: null,
    childNodes: null,

    constructor: function(options) {

        this.requireSetThemeOverride = options && !!options.theme;
        this.options = joint.util.assign({}, this.options, options);

        Backbone.View.call(this, options);
    },

    initialize: function(options) {

        joint.util.bindAll(this, 'setTheme', 'onSetTheme', 'remove', 'onRemove');

        joint.mvc.views[this.cid] = this;

        this.setTheme(this.options.theme || this.defaultTheme);
        this.init();
    },

    renderChildren: function(children) {
        children || (children = this.children);
        if (children) {
            var namespace = V.namespace[this.svgElement ? 'xmlns' : 'xhtml'];
            var doc = joint.util.parseDOMJSON(children, namespace);
            this.vel.empty().append(doc.fragment);
            this.childNodes = doc.selectors;
        }
        return this;
    },

    // Override the Backbone `_ensureElement()` method in order to create an
    // svg element (e.g., `<g>`) node that wraps all the nodes of the Cell view.
    // Expose class name setter as a separate method.
    _ensureElement: function() {
        if (!this.el) {
            var tagName = joint.util.result(this, 'tagName');
            var attrs = joint.util.assign({}, joint.util.result(this, 'attributes'));
            if (this.id) attrs.id = joint.util.result(this, 'id');
            this.setElement(this._createElement(tagName));
            this._setAttributes(attrs);
        } else {
            this.setElement(joint.util.result(this, 'el'));
        }
        this._ensureElClassName();
    },

    _setAttributes: function(attrs) {
        if (this.svgElement) {
            this.vel.attr(attrs);
        } else {
            this.$el.attr(attrs);
        }
    },

    _createElement: function(tagName) {
        if (this.svgElement) {
            return document.createElementNS(V.namespace.xmlns, tagName);
        } else {
            return document.createElement(tagName);
        }
    },

    // Utilize an alternative DOM manipulation API by
    // adding an element reference wrapped in Vectorizer.
    _setElement: function(el) {
        this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
        this.el = this.$el[0];
        if (this.svgElement) this.vel = V(this.el);
    },

    _ensureElClassName: function() {
        var className = joint.util.result(this, 'className');
        var prefixedClassName = joint.util.addClassNamePrefix(className);
        // Note: className removal here kept for backwards compatibility only
        if (this.svgElement) {
            this.vel.removeClass(className).addClass(prefixedClassName);
        } else {
            this.$el.removeClass(className).addClass(prefixedClassName);
        }
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

        if (this.svgElement) {
            this.vel.addClass(className);
        } else {
            this.$el.addClass(className);
        }

        return this;
    },

    removeThemeClassName: function(theme) {

        theme = theme || this.theme;

        var className = this.themeClassNamePrefix + theme;

        if (this.svgElement) {
            this.vel.removeClass(className);
        } else {
            this.$el.removeClass(className);
        }

        return this;
    },

    onSetTheme: function(oldTheme, newTheme) {
        // Intentionally empty.
        // This method is meant to be overriden.
    },

    remove: function() {

        this.onRemove();
        this.undelegateDocumentEvents();

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
    },

    delegateElementEvents: function(element, events, data) {
        if (!events) return this;
        data || (data = {});
        var eventNS = this.getEventNamespace();
        for (var eventName in events) {
            var method = events[eventName];
            if (typeof method !== 'function') method = this[method];
            if (!method) continue;
            $(element).on(eventName + eventNS, data, method.bind(this));
        }
        return this;
    },

    undelegateElementEvents: function(element) {
        $(element).off(this.getEventNamespace());
        return this;
    },

    delegateDocumentEvents: function(events, data) {
        events || (events = joint.util.result(this, 'documentEvents'));
        return this.delegateElementEvents(document, events, data);
    },

    undelegateDocumentEvents: function() {
        return this.undelegateElementEvents(document);
    },

    eventData: function(evt, data) {
        if (!evt) throw new Error('eventData(): event object required.');
        var currentData = evt.data;
        var key = '__' + this.cid + '__';
        if (data === undefined) {
            if (!currentData) return {};
            return currentData[key] || {};
        }
        currentData || (currentData = evt.data = {});
        currentData[key] || (currentData[key] = {});
        joint.util.assign(currentData[key], data);
        return this;
    }

}, {

    extend: function() {

        var args = Array.from(arguments);

        // Deep clone the prototype and static properties objects.
        // This prevents unexpected behavior where some properties are overwritten outside of this function.
        var protoProps = args[0] && joint.util.assign({}, args[0]) || {};
        var staticProps = args[1] && joint.util.assign({}, args[1]) || {};

        // Need the real render method so that we can wrap it and call it later.
        var renderFn = protoProps.render || (this.prototype && this.prototype.render) || null;

        /*
            Wrap the real render method so that:
                .. `onRender` is always called.
                .. `this` is always returned.
        */
        protoProps.render = function() {

            if (renderFn) {
                // Call the original render method.
                renderFn.apply(this, arguments);
            }

            // Should always call onRender() method.
            this.onRender();

            // Should always return itself.
            return this;
        };

        return Backbone.View.extend.call(this, protoProps, staticProps);
    }
});

