import $ from '../Dom.mjs';
import V from '../../V/index.mjs';

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
    while ((elem = elem.previousElementSibling)) {
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
    while ((elem = elem.nextElementSibling)) {
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


