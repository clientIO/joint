
/*!
 * jQuery JavaScript Library v4.0.0-pre+c98597ea.dirty
 * https://jquery.com/
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2023-11-24T14:04Z
 */

import { dataUser } from './dom/dom-data';

if (!window.document) {
    throw new Error('$ requires a window with a document');
}

const document = window.document;

// Define a local copy of $
const $ = function(selector) {
    // The $ object is actually just the init constructor 'enhanced'
    // Need init if $ is called (just allow error to be thrown if not included)
    return new $.Dom(selector);
};

$.fn = $.prototype = {
    constructor: $,
    // The default length of a $ object is 0
    length: 0,
};

// A global GUID counter for objects
$.guid = 1;

// User data storage
$.data = dataUser;

$.merge = function(first, second) {
    let len = +second.length;
    let i = first.length;
    for (let j = 0; j < len; j++) {
        first[i++] = second[j];
    }
    first.length = i;
    return first;
};

$.parseHTML = function(string) {
    // Inline events will not execute when the HTML is parsed; this includes, for example, sending GET requests for images.
    const context = document.implementation.createHTMLDocument();
    // Set the base href for the created document so any parsed elements with URLs
    // are based on the document's URL
    const base = context.createElement('base');
    base.href = document.location.href;
    context.head.appendChild(base);

    context.body.innerHTML = string;
    // remove scripts
    const scripts = context.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        scripts[i].remove();
    }
    return Array.from(context.body.children);
};

if (typeof Symbol === 'function') {
    $.fn[Symbol.iterator] = Array.prototype[Symbol.iterator];
}

$.fn.toArray = function() {
    return Array.from(this);
};

// Take an array of elements and push it onto the stack
// (returning the new matched element set)
$.fn.pushStack = function(elements) {
    // Build a new $ matched element set
    const ret = $.merge(this.constructor(), elements);
    // Add the old object onto the stack (as a reference)
    ret.prevObject = this;
    // Return the newly-formed element set
    return ret;
};

$.fn.find = function(selector) {
    const [el] = this;
    const ret = this.pushStack([]);
    if (!el) return ret;
    // Early return if context is not an element, document or document fragment
    const { nodeType } = el;
    if (nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
        return ret;
    }
    if (typeof selector !== 'string') {
        if (el !== selector && el.contains(selector)) {
            $.merge(ret, [selector]);
        }
    } else {
        $.merge(ret, el.querySelectorAll(selector));
    }
    return ret;
};

// A simple way to check for HTML strings
// Prioritize #id over <tag> to avoid XSS via location.hash (trac-9521)
// Strict HTML recognition (trac-11290: must start with <)
// Shortcut simple #id case for speed
const rQuickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;

function isObviousHtml(input) {
    return (
        input[0] === '<' && input[input.length - 1] === '>' && input.length >= 3
    );
}

const Dom = function(selector) {

    if (!selector) {
        // HANDLE: $(""), $(null), $(undefined), $(false)
        return this;
    }

    if (typeof selector === 'function') {
        // HANDLE: $(function)
        // Shortcut for document ready
        throw new Error('function not supported');
    }

    if (arguments.length > 1) {
        throw new Error('selector with context not supported');
    }

    if (selector.nodeType) {
        // HANDLE: $(DOMElement)
        this[0] = selector;
        this.length = 1;
        return this;
    }

    let match;
    if (isObviousHtml(selector + '')) {
        // Handle obvious HTML strings
        // Assume that strings that start and end with <> are HTML and skip
        // the regex check. This also handles browser-supported HTML wrappers
        // like TrustedHTML.
        match = [null, selector, null];
    } else if (typeof selector === 'string') {
        // Handle HTML strings or selectors
        match = rQuickExpr.exec(selector);
    } else {
        // Array-like
        return $.merge(this, selector);
    }

    if (!match || !match[1]) {
        // HANDLE: $(expr)
        return $root.find(selector);
    }

    // Match html or make sure no context is specified for #id
    // Note: match[1] may be a string or a TrustedHTML wrapper
    if (match[1]) {
        // HANDLE: $(html) -> $(array)
        $.merge(this, $.parseHTML(match[1]));
        return this;
    }

    // HANDLE: $(#id)
    const el = document.getElementById(match[2]);
    if (el) {
        // Inject the element directly into the $ object
        this[0] = el;
        this.length = 1;
    }
    return this;
};

$.Dom = Dom;

// Give the init function the $ prototype for later instantiation
Dom.prototype = $.fn;

// A central reference to the root $(document)
const $root = $(document);


// $.fn.addBack = function() {
//     this.add(this.prevObject);
// };

export { $ as default };
