import $ from './Dom.mjs';

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

    findAttribute: function(attributeName, node) {

        var currentNode = node;

        while (currentNode && currentNode.nodeType === 1) {
            var attributeValue = currentNode.getAttribute(attributeName);
            // attribute found
            if (attributeValue) return attributeValue;
            // do not climb up the DOM
            if (currentNode === this.el) return null;
            // try parent node
            currentNode = currentNode.parentNode;
        }

        return null;
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
        if (!style) return;
        for (var name in style) {
            this.el.style[name] = style[name];
        }
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

const DoubleTapEventName = 'dbltap';
if ($.event && !(DoubleTapEventName in $.event.special)) {
    const maxDelay = config.doubleTapInterval;
    const minDelay = 30;
    $.event.special[DoubleTapEventName] = {
        bindType: 'touchend',
        delegateType: 'touchend',
        handle: function(event, ...args) {
            const { handleObj, target } = event;
            const targetData  = $.data(target);
            const now = new Date().getTime();
            const delta = 'lastTouch' in targetData ? now - targetData.lastTouch : 0;
            if (delta < maxDelay && delta > minDelay) {
                targetData.lastTouch = null;
                event.type = handleObj.origType;
                // let jQuery handle the triggering of "dbltap" event handlers
                handleObj.handler.call(this, event, ...args);
            } else {
                targetData.lastTouch = now;
            }
        }
    };
}


$.parseHTML = function(string) {
    const context = document.implementation.createHTMLDocument();
    // Set the base href for the created document so any parsed elements with URLs
    // are based on the document's URL
    const base = context.createElement('base');
    base.href = document.location.href;
    context.head.appendChild(base);

    context.body.innerHTML = string;
    return $(context.body.children);
};

$.fn.removeClass = function() {
    if (!this[0]) return this;
    V.prototype.removeClass.apply({ node: this[0] }, arguments);
    return this;
};

$.fn.addClass = function() {
    if (!this[0]) return this;
    V.prototype.addClass.apply({ node: this[0] }, arguments);
    return this;
};

$.fn.hasClass = function() {
    if (!this[0]) return false;
    return V.prototype.hasClass.apply({ node: this[0] }, arguments);
};

$.fn.attr = function(name, value) {
    if (!this[0]) return '';
    if (typeof name === 'string' && value === undefined) {
        return this[0].getAttribute(name);
    }
    if (typeof name === 'string') {
        this[0].setAttribute(name, value);
        return this;
    }
    Object.keys(name).forEach(key => {
        this[0].setAttribute(key, name[key]);
    });
    return this;
};

$.fn.empty = function() {
    var elem,
        i = 0;

    for ( ; ( elem = this[ i ] ) != null; i++ ) {
        if ( elem.nodeType === 1 ) {

            // Prevent memory leaks
            // jQuery.cleanData( getAll( elem, false ) );

            // Remove any remaining nodes
            elem.textContent = '';
        }
    }

    return this;
};

$.fn.append = function(...nodes) {
    if (!this[0]) return this;
    nodes.forEach(node => {
        if (typeof node === 'string') {
            node = $.parseHTML(node);
        }
        this[0].appendChild(node[0] || node);
    });
    return this;
};

$.fn.html = function(html) {
    if (!this[0]) return '';
    if (html === undefined) {
        return this[0].innerHTML;
    }
    this[0].innerHTML = html;
    return this;
};

$.fn.appendTo = function(parent) {
    if (!this[0]) return this;
    $(parent).append(this);
    return this;
};

$.fn.css = function(styles) {
    if (!this[0]) return this;
    if (typeof styles === 'string' && arguments.length === 1) {
        return this[0].style[styles];
    }
    if (typeof styles === 'string' && arguments.length === 2) {
        this[0].style[styles] = arguments[1];
        return this;
    }

    Object.keys(styles).forEach(key => {
        this[0].style[key] = styles[key];
    });
    return this;
};

$.fn.remove = function() {
    if (!this[0]) return this;
    const nodes = [this[0], ...Array.from(this[0].getElementsByTagName('*'))];
    for (let i = 0; i < nodes.length; i++) {
        $.event.remove(nodes[i]);
    }
    this[0].remove();
    return this;
};

$.fn.data = function() { return this; };


$.data = function() { return this; };


$.attr = function(el, name) {
    if (!el) return '';
    return el.getAttribute(name);
};

$.htmlPrefilter = function(html) { return html; };

// From test

$.fn.has = function(e) {
    return this.find(e).length > 0;
};

$.fn.trigger = function(name, data) {
    if (!this[0]) return this;
    if (name === 'click') {
        this[0].click();
    } else if (name === 'contextmenu') {
        this[0].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
    } else {

        let event;
        // Native
        if (window.CustomEvent) {
            event = new CustomEvent(name, { detail: data });
        } else {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(name, true, true, data);
        }

        this[0].dispatchEvent(event);
    }

    return this;
};

$.fn.click = function() { this.trigger('click'); };


// Native (optional filter function)
function getPreviousSiblings(elem, filter) {
    var sibs = [];
    while (elem = elem.previousElementSibling) {
        if (!filter || filter(elem)) sibs.push(elem);
    }
    return sibs;
}

$.fn.prevAll = function() {
    return $(getPreviousSiblings(this[0]));
};


$.fn.index = function() {
    return this.prevAll().length;
};

$.fn.nextAll = function() {
    var sibs = [];
    var elem = this[0];
    while (elem = elem.nextElementSibling) {
        sibs.push(elem);
    }
    return $(sibs);
};

$.fn.prev = function() {
    if (!this[0]) return $();
    return $(this[0].previousElementSibling);
};

$.fn.text = function() {
    if (!this[0]) return '';
    return this[0].textContent;
};

$.fn.prop = function(name) {
    if (!this[0]) return '';
    return this[0][name];
};

$.fn.parent = function(i) {
    if (!this[0]) return $();
    return $(this[0].parentNode);
};

$.fn.width = function() {
    if (!this[0]) return 0;
    return this[0].getBoundingClientRect().width;
};

$.fn.height = function() {
    if (!this[0]) return 0;
    return this[0].getBoundingClientRect().height;
};

// JJ+ is using it as a setter
$.fn.offset = function() {
    if (!this[0]) return { top: 0, left: 0 };
    const box = this[0].getBoundingClientRect();
    return {
        top: box.top + window.pageYOffset - document.documentElement.clientTop,
        left: box.left + window.pageXOffset - document.documentElement.clientLeft
    };
};


// For test only (verified)

$.fn.children = function(selector) {
    const [el] = this;
    if (!el) return $();
    if (selector) {
        return $(Array.from(el.children).filter(child => child.matches(selector)));
    }
    return $(el.children);
};


