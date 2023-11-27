
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

import { isArrayLike } from '../util/utilHelpers.mjs';

if (!window.document) {
    throw new Error('$ requires a window with a document');
}

const arr = [];
const document = window.document;

// Define a local copy of $
const $ = function(selector) {
    // The $ object is actually just the init constructor 'enhanced'
    // Need init if $ is called (just allow error to be thrown if not included)
    return new $.fn.init(selector);
};

$.fn = $.prototype = {

    constructor: $,

    // The default length of a $ object is 0
    length: 0,

    toArray: function() {
        return Array.from(this);
    },

    // Get the Nth element in the matched element set OR
    // Get the whole matched element set as a clean array
    get: function(num) {
        // Return all the elements in a clean array
        if (num == null) {
            return Array.from(this);
        }

        // Return just the one element from the set
        return num < 0 ? this[num + this.length] : this[num];
    },

    // Take an array of elements and push it onto the stack
    // (returning the new matched element set)
    pushStack: function(elements) {
        // Build a new $ matched element set
        const ret = $.merge(this.constructor(), elements);
        // Add the old object onto the stack (as a reference)
        ret.prevObject = this;
        // Return the newly-formed element set
        return ret;
    },
};

Object.assign($, {

    // results is for internal usage only
    makeArray: function(arr, results) {
        const ret = results || [];
        if (arr != null) {
            if (isArrayLike(Object(arr))) {
                $.merge(ret, typeof arr === 'string' ? [arr] : arr);
            } else {
                Array.prototype.push.call(ret, arr);
            }
        }
        return ret;
    },

    merge: function(first, second) {
        var len = +second.length,
            j = 0,
            i = first.length;

        for (; j < len; j++) {
            first[i++] = second[j];
        }

        first.length = i;

        return first;
    },

    // A global GUID counter for objects
    guid: 1,
});

if (typeof Symbol === 'function') {
    $.fn[Symbol.iterator] = arr[Symbol.iterator];
}


/*
 * Optional limited selector module for custom builds.
 *
 * Note that this DOES NOT SUPPORT many documented jQuery
 * features in exchange for its smaller size:
 *
 * * Attribute not equal selector (!=)
 * * Positional selectors (:first; :eq(n); :odd; etc.)
 * * Type selectors (:input; :checkbox; :button; etc.)
 * * State-based selectors (:animated; :visible; :hidden; etc.)
 * * :has(selector) in browsers without native support
 * * :not(complex selector) in IE
 * * custom selectors via jQuery extensions
 * * Reliable functionality on XML fragments
 * * Matching against non-elements
 * * Reliable sorting of disconnected nodes
 * * querySelectorAll bug fixes (e.g., unreliable :focus on WebKit)
 *
 * If any of these are unacceptable tradeoffs, either use the full
 * selector engine or  customize this stub for the project's specific
 * needs.
 */

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

// Initialize a $ object

// A central reference to the root $(document)
let root$;

// A simple way to check for HTML strings
// Prioritize #id over <tag> to avoid XSS via location.hash (trac-9521)
// Strict HTML recognition (trac-11290: must start with <)
// Shortcut simple #id case for speed
const rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;

function isObviousHtml(input) {
    return (
        input[0] === '<' && input[input.length - 1] === '>' && input.length >= 3
    );
}

const init = ($.fn.init = function(selector) {
    var match, elem;

    // HANDLE: $(""), $(null), $(undefined), $(false)
    if (!selector) {
        return this;
    }

    // HANDLE: $(DOMElement)
    if (selector.nodeType) {
        this[0] = selector;
        this.length = 1;
        return this;

        // HANDLE: $(function)
        // Shortcut for document ready
    } else if (typeof selector === 'function') {
        throw new Error('Not supported');
    } else {
        // Handle obvious HTML strings
        match = selector + '';
        if (isObviousHtml(match)) {
            // Assume that strings that start and end with <> are HTML and skip
            // the regex check. This also handles browser-supported HTML wrappers
            // like TrustedHTML.
            match = [null, selector, null];

            // Handle HTML strings or selectors
        } else if (typeof selector === 'string') {
            match = rquickExpr.exec(selector);
        } else {
            return $.makeArray(selector, this);
        }

        // Match html or make sure no context is specified for #id
        // Note: match[1] may be a string or a TrustedHTML wrapper
        if (match && (match[1])) {
            // HANDLE: $(html) -> $(array)
            if (match[1]) {

                // Option to run scripts is true for back-compat
                // Intentionally let the error be thrown if parseHTML is not present
                $.merge(
                    this,
                    $.parseHTML(
                        match[1],
                        document,
                        true
                    )
                );

                return this;

                // HANDLE: $(#id)
            } else {
                elem = document.getElementById(match[2]);
                if (elem) {
                    // Inject the element directly into the $ object
                    this[0] = elem;
                    this.length = 1;
                }
                return this;
            }

            // HANDLE: $(expr) & $(expr, $(...))
        } else {
            return (root$).find(selector);
        }
    }
});

// Give the init function the $ prototype for later instantiation
init.prototype = $.fn;

// Initialize central reference
root$ = $(document);

export { $ as default };
