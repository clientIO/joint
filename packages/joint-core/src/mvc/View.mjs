import $ from './Dom/index.mjs';

import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import { ViewBase } from './ViewBase.mjs';
import { config } from '../config/index.mjs';

export const views = {};

export const View = ViewBase.extend({

    options: {},
    theme: null,
    themeClassNamePrefix: util.addClassNamePrefix('theme-'),
    requireSetThemeOverride: false,
    defaultTheme: config.defaultTheme,
    children: null,
    childNodes: null,

    DETACHABLE: true,
    UPDATE_PRIORITY: 2,
    FLAG_INSERT: 1<<30,
    FLAG_REMOVE: 1<<29,
    FLAG_INIT: 1<<28,

    constructor: function(options) {

        this.requireSetThemeOverride = options && !!options.theme;
        this.options = util.assign({}, this.options, options);

        ViewBase.call(this, options);
    },

    initialize: function() {

        views[this.cid] = this;

        this.setTheme(this.options.theme || this.defaultTheme);
        this.init();
    },

    unmount: function() {
        if (this.svgElement) {
            this.vel.remove();
        } else {
            this.$el.remove();
        }
    },

    isMounted: function() {
        return this.el.parentNode !== null;
    },

    renderChildren: function(children) {
        children || (children = util.result(this, 'children'));
        if (children) {
            var isSVG = this.svgElement;
            var namespace = V.namespace[isSVG ? 'svg' : 'xhtml'];
            var doc = util.parseDOMJSON(children, namespace);
            (isSVG ? this.vel : this.$el).empty().append(doc.fragment);
            this.childNodes = doc.selectors;
        }
        return this;
    },

    findAttributeNode: function(attributeName, node) {
        let currentNode = node;
        while (currentNode && currentNode.nodeType === 1) {
            // attribute found
            // (empty value does not count as attribute found)
            if (currentNode.getAttribute(attributeName)) return currentNode;
            // do not climb up the DOM
            if (currentNode === this.el) return null;
            // try parent node
            currentNode = currentNode.parentNode;
        }
        return null;
    },

    findAttribute: function(attributeName, node) {
        const matchedNode = this.findAttributeNode(attributeName, node);
        return matchedNode && matchedNode.getAttribute(attributeName);
    },

    // Override the mvc ViewBase `_ensureElement()` method in order to create an
    // svg element (e.g., `<g>`) node that wraps all the nodes of the Cell view.
    // Expose class name setter as a separate method.
    _ensureElement: function() {
        if (!this.el) {
            var tagName = util.result(this, 'tagName');
            var attrs = util.assign({}, util.result(this, 'attributes'));
            var style = util.assign({}, util.result(this, 'style'));
            if (this.id) attrs.id = util.result(this, 'id');
            this.setElement(this._createElement(tagName));
            this._setAttributes(attrs);
            this._setStyle(style);
        } else {
            this.setElement(util.result(this, 'el'));
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

    _setStyle: function(style) {
        this.$el.css(style);
    },

    _createElement: function(tagName) {
        if (this.svgElement) {
            return document.createElementNS(V.namespace.svg, tagName);
        } else {
            return document.createElement(tagName);
        }
    },

    // Utilize an alternative DOM manipulation API by
    // adding an element reference wrapped in Vectorizer.
    _setElement: function(el) {
        this.$el = el instanceof $ ? el : $(el);
        this.el = this.$el[0];
        if (this.svgElement) this.vel = V(this.el);
    },

    _ensureElClassName: function() {
        var className = util.result(this, 'className');
        if (!className) return;
        var prefixedClassName = util.addClassNamePrefix(className);
        // Note: className removal here kept for backwards compatibility only
        if (this.svgElement) {
            this.vel.removeClass(className).addClass(prefixedClassName);
        } else {
            this.$el.removeClass(className).addClass(prefixedClassName);
        }
    },

    init: function() {
        // Intentionally empty.
        // This method is meant to be overridden.
    },

    onRender: function() {
        // Intentionally empty.
        // This method is meant to be overridden.
    },

    confirmUpdate: function() {
        // Intentionally empty.
        // This method is meant to be overridden.
        return 0;
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
        if (!theme) return this;

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
        // This method is meant to be overridden.
    },

    remove: function() {

        this.onRemove();
        this.undelegateDocumentEvents();

        views[this.cid] = null;

        ViewBase.prototype.remove.apply(this, arguments);

        return this;
    },

    onRemove: function() {
        // Intentionally empty.
        // This method is meant to be overridden.
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
        events || (events = util.result(this, 'documentEvents'));
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
        util.assign(currentData[key], data);
        return this;
    },

    stopPropagation: function(evt) {
        this.eventData(evt, { propagationStopped: true });
        return this;
    },

    isPropagationStopped: function(evt) {
        return !!this.eventData(evt).propagationStopped;
    }

}, {

    extend: function() {

        var args = Array.from(arguments);

        // Deep clone the prototype and static properties objects.
        // This prevents unexpected behavior where some properties are overwritten outside of this function.
        var protoProps = args[0] && util.assign({}, args[0]) || {};
        var staticProps = args[1] && util.assign({}, args[1]) || {};

        // Need the real render method so that we can wrap it and call it later.
        var renderFn = protoProps.render || (this.prototype && this.prototype.render) || null;

        /*
            Wrap the real render method so that:
                .. `onRender` is always called.
                .. `this` is always returned.
        */
        protoProps.render = function() {

            if (typeof renderFn === 'function') {
                // Call the original render method.
                renderFn.apply(this, arguments);
            }

            if (this.render.__render__ === renderFn) {
                // Should always call onRender() method.
                // Should call it only once when renderFn is actual prototype method i.e. not the wrapper
                this.onRender();
            }

            // Should always return itself.
            return this;
        };

        protoProps.render.__render__ = renderFn;

        return ViewBase.extend.call(this, protoProps, staticProps);
    }
});
