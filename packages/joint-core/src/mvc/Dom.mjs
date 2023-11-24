import { isPlainObject, isArrayLike, camelCase, isEmpty } from '../util/utilHelpers.mjs';
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
('use strict');

if (!window.document) {
    throw new Error('$ requires a window with a document');
}

var arr = [];

var slice = arr.slice;

var push = arr.push;

var indexOf = arr.indexOf;

var document = window.document;

const version = '4.0.0-pre+c98597ea.dirty';

// Define a local copy of $
const $ = function(selector, context) {
    // The $ object is actually just the init constructor 'enhanced'
    // Need init if $ is called (just allow error to be thrown if not included)
    return new $.fn.init(selector, context);
};

$.fn = $.prototype = {
    // The current version of $ being used
    jquery: version,

    constructor: $,

    // The default length of a $ object is 0
    length: 0,

    toArray: function() {
        return slice.call(this);
    },

    // Get the Nth element in the matched element set OR
    // Get the whole matched element set as a clean array
    get: function(num) {
        // Return all the elements in a clean array
        if (num == null) {
            return slice.call(this);
        }

        // Return just the one element from the set
        return num < 0 ? this[num + this.length] : this[num];
    },

    // Take an array of elements and push it onto the stack
    // (returning the new matched element set)
    pushStack: function(elems) {
        // Build a new $ matched element set
        var ret = $.merge(this.constructor(), elems);

        // Add the old object onto the stack (as a reference)
        ret.prevObject = this;

        // Return the newly-formed element set
        return ret;
    },

    // Execute a callback for every element in the matched set.
    each: function(callback) {
        return $.each(this, callback);
    },

    slice: function() {
        return this.pushStack(slice.apply(this, arguments));
    },

    first: function() {
        return this.eq(0);
    },

    last: function() {
        return this.eq(-1);
    },

    even: function() {
        return this.pushStack(
            $.grep(this, function(_elem, i) {
                return (i + 1) % 2;
            })
        );
    },

    odd: function() {
        return this.pushStack(
            $.grep(this, function(_elem, i) {
                return i % 2;
            })
        );
    },

    eq: function(i) {
        var len = this.length,
            j = +i + (i < 0 ? len : 0);
        return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
    },

    end: function() {
        return this.prevObject || this.constructor();
    },
};

// Unique for each copy of $ on the page
$.expando = '$' + (version + Math.random()).replace(/\D/g, '');

// Assume $ is ready without the ready module
$.isReady = true;

Object.assign($, {

    error: function(msg) {
        throw new Error(msg);
    },

    each: function(obj, callback) {
        var length,
            i = 0;

        if (isArrayLike(obj)) {
            length = obj.length;
            for (; i < length; i++) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                    break;
                }
            }
        } else {
            for (i in obj) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                    break;
                }
            }
        }

        return obj;
    },

    // results is for internal usage only
    makeArray: function(arr, results) {
        var ret = results || [];

        if (arr != null) {
            if (isArrayLike(Object(arr))) {
                $.merge(ret, typeof arr === 'string' ? [arr] : arr);
            } else {
                push.call(ret, arr);
            }
        }

        return ret;
    },

    // Note: an element does not contain itself
    contains: function(a, b) {
        var bup = b && b.parentNode;

        return (
            a === bup ||
            !!(
                bup &&
                bup.nodeType === 1 &&
                // Support: IE 9 - 11+
                // IE doesn't have `contains` on SVG.
                (a.contains
                    ? a.contains(bup)
                    : a.compareDocumentPosition &&
                      a.compareDocumentPosition(bup) & 16)
            )
        );
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

    grep: function(elems, callback, invert) {
        var callbackInverse,
            matches = [],
            i = 0,
            length = elems.length,
            callbackExpect = !invert;

        // Go through the array, only saving the items
        // that pass the validator function
        for (; i < length; i++) {
            callbackInverse = !callback(elems[i], i);
            if (callbackInverse !== callbackExpect) {
                matches.push(elems[i]);
            }
        }

        return matches;
    },

    // A global GUID counter for objects
    guid: 1,
});

if (typeof Symbol === 'function') {
    $.fn[Symbol.iterator] = arr[Symbol.iterator];
}

var documentElement = document.documentElement;

// Only count HTML whitespace
// Other whitespace should count in values
// https://infra.spec.whatwg.org/#ascii-whitespace
var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;

var rcheckableType = /^(?:checkbox|radio)$/i;

var isIE = document.documentMode;

/**
 * Determines whether an object can have data
 */
function acceptData(owner) {
    // Accepts only:
    //  - Node
    //    - Node.ELEMENT_NODE
    //    - Node.DOCUMENT_NODE
    //  - Object
    //    - Any
    return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
}

function Data() {
    this.expando = $.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {
    cache: function(owner) {
        // Check if the owner object already has a cache
        var value = owner[this.expando];

        // If not, create one
        if (!value) {
            value = Object.create(null);

            // We can accept data for non-element nodes in modern browsers,
            // but we should not, see trac-8335.
            // Always return an empty object.
            if (acceptData(owner)) {
                // If it is a node unlikely to be stringify-ed or looped over
                // use plain assignment
                if (owner.nodeType) {
                    owner[this.expando] = value;

                    // Otherwise secure it in a non-enumerable property
                    // configurable must be true to allow the property to be
                    // deleted when data is removed
                } else {
                    Object.defineProperty(owner, this.expando, {
                        value: value,
                        configurable: true,
                    });
                }
            }
        }

        return value;
    },
    set: function(owner, data, value) {
        var prop,
            cache = this.cache(owner);

        // Handle: [ owner, key, value ] args
        // Always use camelCase key (gh-2257)
        if (typeof data === 'string') {
            cache[camelCase(data)] = value;

            // Handle: [ owner, { properties } ] args
        } else {
            // Copy the properties one-by-one to the cache object
            for (prop in data) {
                cache[camelCase(prop)] = data[prop];
            }
        }
        return cache;
    },
    get: function(owner, key) {
        return key === undefined
            ? this.cache(owner)
            : // Always use camelCase key (gh-2257)
            owner[this.expando] && owner[this.expando][camelCase(key)];
    },
    access: function(owner, key, value) {
        // In cases where either:
        //
        //   1. No key was specified
        //   2. A string key was specified, but no value provided
        //
        // Take the "read" path and allow the get method to determine
        // which value to return, respectively either:
        //
        //   1. The entire cache object
        //   2. The data stored at the key
        //
        if (
            key === undefined ||
            (key && typeof key === 'string' && value === undefined)
        ) {
            return this.get(owner, key);
        }

        // When the key is not a string, or both a key and value
        // are specified, set or extend (existing objects) with either:
        //
        //   1. An object of properties
        //   2. A key and value
        //
        this.set(owner, key, value);

        // Since the "set" path can have two possible entry points
        // return the expected data based on which path was taken[*]
        return value !== undefined ? value : key;
    },
    remove: function(owner, key) {
        var i,
            cache = owner[this.expando];

        if (cache === undefined) {
            return;
        }

        if (key !== undefined) {
            // Support array or space separated string of keys
            if (Array.isArray(key)) {
                // If key is an array of keys...
                // We always set camelCase keys, so remove that.
                key = key.map(camelCase);
            } else {
                key = camelCase(key);

                // If a key with the spaces exists, use it.
                // Otherwise, create an array by matching non-whitespace
                key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
            }

            i = key.length;

            while (i--) {
                delete cache[key[i]];
            }
        }

        // Remove the expando if there's no more data
        if (key === undefined || isEmpty(cache)) {
            // Support: Chrome <=35 - 45+
            // Webkit & Blink performance suffers when deleting properties
            // from DOM nodes, so set to undefined instead
            // https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
            if (owner.nodeType) {
                owner[this.expando] = undefined;
            } else {
                delete owner[this.expando];
            }
        }
    },
    hasData: function(owner) {
        var cache = owner[this.expando];
        return cache !== undefined && !isEmpty(cache);
    },
};

var dataPriv = new Data();

function nodeName(elem, name) {
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
}

// rsingleTag matches a string consisting of a single HTML element with no attributes
// and captures the element's name
const rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

function isObviousHtml(input) {
    return (
        input[0] === '<' && input[input.length - 1] === '>' && input.length >= 3
    );
}

// https://www.w3.org/TR/css3-selectors/#whitespace
var whitespace = '[\\x20\\t\\r\\n\\f]';

var booleans =
    'checked|selected|async|autofocus|autoplay|controls|' +
    'defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped';

var rleadingCombinator = new RegExp(
    '^' + whitespace + '*([>+~]|' + whitespace + ')' + whitespace + '*'
);

var rdescend = new RegExp(whitespace + '|>');

var rsibling = /[+~]/;

/**
 * Checks a node for validity as a $ selector context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext(context) {
    return (
        context &&
        typeof context.getElementsByTagName !== 'undefined' &&
        context
    );
}

// https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
var identifier =
    '(?:\\\\[\\da-fA-F]{1,6}' +
    whitespace +
    '?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+';

// Attribute selectors: https://www.w3.org/TR/selectors/#attribute-selectors
var attributes =
    '\\[' +
    whitespace +
    '*(' +
    identifier +
    ')(?:' +
    whitespace +
    // Operator (capture 2)
    '*([*^$|!~]?=)' +
    whitespace +
    // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
    '*(?:\'((?:\\\\.|[^\\\\\'])*)\'|"((?:\\\\.|[^\\\\"])*)"|(' +
    identifier +
    '))|)' +
    whitespace +
    '*\\]';

var pseudos =
    ':(' +
    identifier +
    ')(?:\\((' +
    // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
    // 1. quoted (capture 3; capture 4 or capture 5)
    '(\'((?:\\\\.|[^\\\\\'])*)\'|"((?:\\\\.|[^\\\\"])*)")|' +
    // 2. simple (capture 6)
    '((?:\\\\.|[^\\\\()[\\]]|' +
    attributes +
    ')*)|' +
    // 3. anything else (capture 2)
    '.*' +
    ')\\)|)';

var filterMatchExpr = {
    ID: new RegExp('^#(' + identifier + ')'),
    CLASS: new RegExp('^\\.(' + identifier + ')'),
    TAG: new RegExp('^(' + identifier + '|[*])'),
    ATTR: new RegExp('^' + attributes),
    PSEUDO: new RegExp('^' + pseudos),
    CHILD: new RegExp(
        '^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(' +
            whitespace +
            '*(even|odd|(([+-]|)(\\d*)n|)' +
            whitespace +
            '*(?:([+-]|)' +
            whitespace +
            '*(\\d+)|))' +
            whitespace +
            '*\\)|)',
        'i'
    ),
};

var rpseudo = new RegExp(pseudos);

// CSS escapes

var runescape = new RegExp(
        '\\\\[\\da-fA-F]{1,6}' + whitespace + '?|\\\\([^\\r\\n\\f])',
        'g'
    ),
    funescape = function(escape, nonHex) {
        var high = '0x' + escape.slice(1) - 0x10000;

        if (nonHex) {
            // Strip the backslash prefix from a non-hex escape sequence
            return nonHex;
        }

        // Replace a hexadecimal escape sequence with the encoded Unicode code point
        // Support: IE <=11+
        // For values outside the Basic Multilingual Plane (BMP), manually construct a
        // surrogate pair
        return high < 0
            ? String.fromCharCode(high + 0x10000)
            : String.fromCharCode(
                (high >> 10) | 0xd800,
                (high & 0x3ff) | 0xdc00
            );
    };

function unescapeSelector(sel) {
    return sel.replace(runescape, funescape);
}

function selectorError(msg) {
    $.error('Syntax error, unrecognized expression: ' + msg);
}

var rcomma = new RegExp('^' + whitespace + '*,' + whitespace + '*');

var rtrimCSS = new RegExp(
    '^' + whitespace + '+|((?:^|[^\\\\])(?:\\\\.)*)' + whitespace + '+$',
    'g'
);

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
    var keys = [];

    function cache(key, value) {
        // Use (key + " ") to avoid collision with native prototype properties
        // (see https://github.com/jquery/sizzle/issues/157)
        if (keys.push(key + ' ') > $.expr.cacheLength) {
            // Only keep the most recent entries
            delete cache[keys.shift()];
        }
        return (cache[key + ' '] = value);
    }
    return cache;
}

var tokenCache = createCache();

function tokenize(selector, parseOnly) {
    var matched,
        match,
        tokens,
        type,
        soFar,
        groups,
        preFilters,
        cached = tokenCache[selector + ' '];

    if (cached) {
        return parseOnly ? 0 : cached.slice(0);
    }

    soFar = selector;
    groups = [];
    preFilters = $.expr.preFilter;

    while (soFar) {
        // Comma and first run
        if (!matched || (match = rcomma.exec(soFar))) {
            if (match) {
                // Don't consume trailing commas as valid
                soFar = soFar.slice(match[0].length) || soFar;
            }
            groups.push((tokens = []));
        }

        matched = false;

        // Combinators
        if ((match = rleadingCombinator.exec(soFar))) {
            matched = match.shift();
            tokens.push({
                value: matched,

                // Cast descendant combinators to space
                type: match[0].replace(rtrimCSS, ' '),
            });
            soFar = soFar.slice(matched.length);
        }

        // Filters
        for (type in filterMatchExpr) {
            if (
                (match = $.expr.match[type].exec(soFar)) &&
                (!preFilters[type] || (match = preFilters[type](match)))
            ) {
                matched = match.shift();
                tokens.push({
                    value: matched,
                    type: type,
                    matches: match,
                });
                soFar = soFar.slice(matched.length);
            }
        }

        if (!matched) {
            break;
        }
    }

    // Return the length of the invalid excess
    // if we're just parsing
    // Otherwise, throw an error or return tokens
    if (parseOnly) {
        return soFar.length;
    }

    return soFar
        ? selectorError(selector)
        : // Cache the tokens
        tokenCache(selector, groups).slice(0);
}

var preFilter = {
    ATTR: function(match) {
        match[1] = unescapeSelector(match[1]);

        // Move the given value to match[3] whether quoted or unquoted
        match[3] = unescapeSelector(match[3] || match[4] || match[5] || '');

        if (match[2] === '~=') {
            match[3] = ' ' + match[3] + ' ';
        }

        return match.slice(0, 4);
    },

    CHILD: function(match) {
        /* matches from filterMatchExpr["CHILD"]
			1 type (only|nth|...)
			2 what (child|of-type)
			3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
			4 xn-component of xn+y argument ([+-]?\d*n|)
			5 sign of xn-component
			6 x of xn-component
			7 sign of y-component
			8 y of y-component
		*/
        match[1] = match[1].toLowerCase();

        if (match[1].slice(0, 3) === 'nth') {
            // nth-* requires argument
            if (!match[3]) {
                selectorError(match[0]);
            }

            // numeric x and y parameters for $.expr.filter.CHILD
            // remember that false/true cast respectively to 0/1
            match[4] = +(match[4]
                ? match[5] + (match[6] || 1)
                : 2 * (match[3] === 'even' || match[3] === 'odd'));
            match[5] = +(match[7] + match[8] || match[3] === 'odd');

            // other types prohibit arguments
        } else if (match[3]) {
            selectorError(match[0]);
        }

        return match;
    },

    PSEUDO: function(match) {
        var excess,
            unquoted = !match[6] && match[2];

        if (filterMatchExpr.CHILD.test(match[0])) {
            return null;
        }

        // Accept quoted arguments as-is
        if (match[3]) {
            match[2] = match[4] || match[5] || '';

            // Strip excess characters from unquoted arguments
        } else if (
            unquoted &&
            rpseudo.test(unquoted) &&
            // Get excess from tokenize (recursively)
            (excess = tokenize(unquoted, true)) &&
            // advance to the next closing parenthesis
            (excess =
                unquoted.indexOf(')', unquoted.length - excess) -
                unquoted.length)
        ) {
            // excess is a negative index
            match[0] = match[0].slice(0, excess);
            match[2] = unquoted.slice(0, excess);
        }

        // Return only captures needed by the pseudo filter method (type and argument)
        return match.slice(0, 3);
    },
};

function toSelector(tokens) {
    var i = 0,
        len = tokens.length,
        selector = '';
    for (; i < len; i++) {
        selector += tokens[i].value;
    }
    return selector;
}

// CSS string/identifier serialization
// https://drafts.csswg.org/cssom/#common-serializing-idioms
var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;

function fcssescape(ch, asCodePoint) {
    if (asCodePoint) {
        // U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
        if (ch === '\0') {
            return '\uFFFD';
        }

        // Control characters and (dependent upon position) numbers get escaped as code points
        return (
            ch.slice(0, -1) +
            '\\' +
            ch.charCodeAt(ch.length - 1).toString(16) +
            ' '
        );
    }

    // Other potentially-special ASCII characters get backslash-escaped
    return '\\' + ch;
}

$.escapeSelector = function(sel) {
    return (sel + '').replace(rcssescape, fcssescape);
};

var sort = arr.sort;

var splice = arr.splice;

var hasDuplicate;

// Document order sorting
function sortOrder(a, b) {
    // Flag for duplicate removal
    if (a === b) {
        hasDuplicate = true;
        return 0;
    }

    // Sort on method existence if only one input has compareDocumentPosition
    var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
    if (compare) {
        return compare;
    }

    // Calculate position if both inputs belong to the same document
    // Support: IE 11+
    // IE sometimes throws a "Permission denied" error when strict-comparing
    // two documents; shallow comparisons work.
    // eslint-disable-next-line eqeqeq
    compare =
        (a.ownerDocument || a) == (b.ownerDocument || b)
            ? a.compareDocumentPosition(b)
            : // Otherwise we know they are disconnected
            1;

    // Disconnected nodes
    if (compare & 1) {
        // Choose the first element that is related to the document
        // Support: IE 11+
        // IE sometimes throws a "Permission denied" error when strict-comparing
        // two documents; shallow comparisons work.
        // eslint-disable-next-line eqeqeq
        if (
            a == document ||
            (a.ownerDocument == document && $.contains(document, a))
        ) {
            return -1;
        }

        // Support: IE 11+
        // IE sometimes throws a "Permission denied" error when strict-comparing
        // two documents; shallow comparisons work.
        // eslint-disable-next-line eqeqeq
        if (
            b == document ||
            (b.ownerDocument == document && $.contains(document, b))
        ) {
            return 1;
        }

        // Maintain original order
        return 0;
    }

    return compare & 4 ? -1 : 1;
}

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
$.uniqueSort = function(results) {
    var elem,
        duplicates = [],
        j = 0,
        i = 0;

    hasDuplicate = false;

    sort.call(results, sortOrder);

    if (hasDuplicate) {
        while ((elem = results[i++])) {
            if (elem === results[i]) {
                j = duplicates.push(i);
            }
        }
        while (j--) {
            splice.call(results, duplicates[j], 1);
        }
    }

    return results;
};

$.fn.uniqueSort = function() {
    return this.pushStack($.uniqueSort(slice.apply(this)));
};

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

const matchExpr = {
    bool: new RegExp('^(?:' + booleans + ')$', 'i'),
    needsContext: new RegExp('^' + whitespace + '*[>+~]'),
};

Object.assign(matchExpr, filterMatchExpr);

$.find = function(selector, context, results, seed) {
    var elem,
        nid,
        groups,
        newSelector,
        newContext = context && context.ownerDocument,
        // nodeType defaults to 9, since context defaults to document
        nodeType = context ? context.nodeType : 9,
        i = 0;

    results = results || [];
    context = context || document;

    // Same basic safeguard as in the full selector module
    if (!selector || typeof selector !== 'string') {
        return results;
    }

    // Early return if context is not an element, document or document fragment
    if (nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
        return [];
    }

    if (seed) {
        while ((elem = seed[i++])) {
            if (elem.matches(selector)) {
                results.push(elem);
            }
        }
    } else {
        newSelector = selector;
        newContext = context;

        // qSA considers elements outside a scoping root when evaluating child or
        // descendant combinators, which is not what we want.
        // In such cases, we work around the behavior by prefixing every selector in the
        // list with an ID selector referencing the scope context.
        // The technique has to be used as well when a leading combinator is used
        // as such selectors are not recognized by querySelectorAll.
        // Thanks to Andrew Dupont for this technique.
        if (
            nodeType === 1 &&
                (rdescend.test(selector) || rleadingCombinator.test(selector))
        ) {
            // Expand context for sibling selectors
            newContext =
                    (rsibling.test(selector) &&
                        testContext(context.parentNode)) ||
                    context;

            // Outside of IE, if we're not changing the context we can
            // use :scope instead of an ID.
            if (newContext !== context || isIE) {
                // Capture the context ID, setting it first if necessary
                if ((nid = context.getAttribute('id'))) {
                    nid = $.escapeSelector(nid);
                } else {
                    context.setAttribute('id', (nid = $.expando));
                }
            }

            // Prefix every selector in the list
            groups = tokenize(selector);
            i = groups.length;
            while (i--) {
                groups[i] =
                        (nid ? '#' + nid : ':scope') +
                        ' ' +
                        toSelector(groups[i]);
            }
            newSelector = groups.join(',');
        }

        try {
            $.merge(results, newContext.querySelectorAll(newSelector));
        } finally {
            if (nid === $.expando) {
                context.removeAttribute('id');
            }
        }
    }

    return results;
};

$.expr =  {
    // Can be adjusted by the user
    cacheLength: 50,

    match: matchExpr,
    preFilter: preFilter,
};

var rneedsContext = $.expr.match.needsContext;

// Implement the identical functionality for filter and not
function winnow(elements, qualifier, not) {
    if (typeof qualifier === 'function') {
        return $.grep(elements, function(elem, i) {
            return !!qualifier.call(elem, i, elem) !== not;
        });
    }

    // Single element
    if (qualifier.nodeType) {
        return $.grep(elements, function(elem) {
            return (elem === qualifier) !== not;
        });
    }

    // Arraylike of elements ($, arguments, Array)
    if (typeof qualifier !== 'string') {
        return $.grep(elements, function(elem) {
            return indexOf.call(qualifier, elem) > -1 !== not;
        });
    }

    // Filtered directly for both simple and complex selectors
    return $.filter(qualifier, elements, not);
}

$.filter = function(expr, elems, not) {
    var elem = elems[0];

    if (not) {
        expr = ':not(' + expr + ')';
    }

    if (elems.length === 1 && elem.nodeType === 1) {
        return elem.matches(expr) ? [elem] : [];
    }

    return $.find(expr, null, null, $.grep(elems, (elem) => elem.nodeType === 1));
};

$.fn.find = function(selector) {
    var i,
        ret,
        len = this.length,
        self = this;

    if (typeof selector !== 'string') {
        return this.pushStack(
            $(selector).filter(function() {
                for (i = 0; i < len; i++) {
                    if ($.contains(self[i], this)) {
                        return true;
                    }
                }
            })
        );
    }

    ret = this.pushStack([]);

    for (i = 0; i < len; i++) {
        $.find(selector, self[i], ret);
    }

    return len > 1 ? $.uniqueSort(ret) : ret;
};

$.fn.filter =  function(selector) {
    return this.pushStack(winnow(this, selector || [], false));
};

$.fn.is = function(selector) {
    return !!winnow(
        this,

        // If this is a positional/relative selector, check membership in the returned set
        // so $("p:first").is("p:last") won't return true for a doc with two "p".
        typeof selector === 'string' && rneedsContext.test(selector)
            ? $(selector)
            : selector || [],
        false
    ).length;
};

// Initialize a $ object

// A central reference to the root $(document)
let root$;

// A simple way to check for HTML strings
// Prioritize #id over <tag> to avoid XSS via location.hash (trac-9521)
// Strict HTML recognition (trac-11290: must start with <)
// Shortcut simple #id case for speed
const rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;

const init = ($.fn.init = function(selector, context) {
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
        return root$.ready !== undefined
            ? root$.ready(selector)
            : // Execute immediately if ready is not present
            selector($);
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
        if (match && (match[1] || !context)) {
            // HANDLE: $(html) -> $(array)
            if (match[1]) {
                context = context instanceof $ ? context[0] : context;

                // Option to run scripts is true for back-compat
                // Intentionally let the error be thrown if parseHTML is not present
                $.merge(
                    this,
                    $.parseHTML(
                        match[1],
                        context && context.nodeType
                            ? context.ownerDocument || context
                            : document,
                        true
                    )
                );

                // HANDLE: $(html, props)
                if (rsingleTag.test(match[1]) && isPlainObject(context)) {
                    for (match in context) {
                        // Properties of context are called as methods if possible
                        if (typeof this[match] === 'function') {
                            this[match](context[match]);

                            // ...and otherwise set as attributes
                        } else {
                            this.attr(match, context[match]);
                        }
                    }
                }

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
        } else if (!context || context.jquery) {
            return (context || root$).find(selector);

            // HANDLE: $(expr, context)
            // (which is just equivalent to: $(context).find(expr)
        } else {
            return this.constructor(context).find(selector);
        }
    }
});

// Give the init function the $ prototype for later instantiation
init.prototype = $.fn;

// Initialize central reference
root$ = $(document);

var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
    return true;
}

function returnFalse() {
    return false;
}

function on(elem, types, selector, data, fn, one) {
    var origFn, type;

    // Types can be a map of types/handlers
    if (typeof types === 'object') {
        // ( types-Object, selector, data )
        if (typeof selector !== 'string') {
            // ( types-Object, data )
            data = data || selector;
            selector = undefined;
        }
        for (type in types) {
            on(elem, type, selector, data, types[type], one);
        }
        return elem;
    }

    if (data == null && fn == null) {
        // ( types, fn )
        fn = selector;
        data = selector = undefined;
    } else if (fn == null) {
        if (typeof selector === 'string') {
            // ( types, selector, fn )
            fn = data;
            data = undefined;
        } else {
            // ( types, data, fn )
            fn = data;
            data = selector;
            selector = undefined;
        }
    }
    if (fn === false) {
        fn = returnFalse;
    } else if (!fn) {
        return elem;
    }

    if (one === 1) {
        origFn = fn;
        fn = function(event) {
            // Can use an empty set, since event contains the info
            $().off(event);
            return origFn.apply(this, arguments);
        };

        // Use same guid so caller can remove using origFn
        fn.guid = origFn.guid || (origFn.guid = $.guid++);
    }
    return elem.each(function() {
        $.event.add(this, types, fn, data, selector);
    });
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
$.event = {
    add: function(elem, types, handler, data, selector) {
        var handleObjIn,
            eventHandle,
            tmp,
            events,
            t,
            handleObj,
            special,
            handlers,
            type,
            namespaces,
            origType,
            elemData = dataPriv.get(elem);

        // Only attach events to objects that accept data
        if (!acceptData(elem)) {
            return;
        }

        // Caller can pass in an object of custom data in lieu of the handler
        if (handler.handler) {
            handleObjIn = handler;
            handler = handleObjIn.handler;
            selector = handleObjIn.selector;
        }

        // Ensure that invalid selectors throw exceptions at attach time
        // Evaluate against documentElement in case elem is a non-element node (e.g., document)
        if (selector) {
            documentElement.matches(selector);
        }

        // Make sure that the handler has a unique ID, used to find/remove it later
        if (!handler.guid) {
            handler.guid = $.guid++;
        }

        // Init the element's event structure and main handler, if this is the first
        if (!(events = elemData.events)) {
            events = elemData.events = Object.create(null);
        }
        if (!(eventHandle = elemData.handle)) {
            eventHandle = elemData.handle = function(e) {
                // Discard the second event of a $.event.trigger() and
                // when an event is called after a page has unloaded
                return typeof $ !== 'undefined' &&
                    $.event.triggered !== e.type
                    ? $.event.dispatch.apply(elem, arguments)
                    : undefined;
            };
        }

        // Handle multiple events separated by a space
        types = (types || '').match(rnothtmlwhite) || [''];
        t = types.length;
        while (t--) {
            tmp = rtypenamespace.exec(types[t]) || [];
            type = origType = tmp[1];
            namespaces = (tmp[2] || '').split('.').sort();

            // There *must* be a type, no attaching namespace-only handlers
            if (!type) {
                continue;
            }

            // If event changes its type, use the special event handlers for the changed type
            special = $.event.special[type] || {};

            // If selector defined, determine special event api type, otherwise given type
            type = (selector ? special.delegateType : special.bindType) || type;

            // Update special based on newly reset type
            special = $.event.special[type] || {};

            // handleObj is passed to all event handlers
            handleObj = Object.assign(
                {
                    type: type,
                    origType: origType,
                    data: data,
                    handler: handler,
                    guid: handler.guid,
                    selector: selector,
                    needsContext:
                        selector &&
                        $.expr.match.needsContext.test(selector),
                    namespace: namespaces.join('.'),
                },
                handleObjIn
            );

            // Init the event handler queue if we're the first
            if (!(handlers = events[type])) {
                handlers = events[type] = [];
                handlers.delegateCount = 0;

                // Only use addEventListener if the special events handler returns false
                if (
                    !special.setup ||
                    special.setup.call(elem, data, namespaces, eventHandle) ===
                        false
                ) {
                    if (elem.addEventListener) {
                        elem.addEventListener(type, eventHandle);
                    }
                }
            }

            if (special.add) {
                special.add.call(elem, handleObj);

                if (!handleObj.handler.guid) {
                    handleObj.handler.guid = handler.guid;
                }
            }

            // Add to the element's handler list, delegates in front
            if (selector) {
                handlers.splice(handlers.delegateCount++, 0, handleObj);
            } else {
                handlers.push(handleObj);
            }
        }
    },

    // Detach an event or set of events from an element
    remove: function(elem, types, handler, selector, mappedTypes) {
        var j,
            origCount,
            tmp,
            events,
            t,
            handleObj,
            special,
            handlers,
            type,
            namespaces,
            origType,
            elemData = dataPriv.hasData(elem) && dataPriv.get(elem);

        if (!elemData || !(events = elemData.events)) {
            return;
        }

        // Once for each type.namespace in types; type may be omitted
        types = (types || '').match(rnothtmlwhite) || [''];
        t = types.length;
        while (t--) {
            tmp = rtypenamespace.exec(types[t]) || [];
            type = origType = tmp[1];
            namespaces = (tmp[2] || '').split('.').sort();

            // Unbind all events (on this namespace, if provided) for the element
            if (!type) {
                for (type in events) {
                    $.event.remove(
                        elem,
                        type + types[t],
                        handler,
                        selector,
                        true
                    );
                }
                continue;
            }

            special = $.event.special[type] || {};
            type = (selector ? special.delegateType : special.bindType) || type;
            handlers = events[type] || [];
            tmp =
                tmp[2] &&
                new RegExp(
                    '(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)'
                );

            // Remove matching events
            origCount = j = handlers.length;
            while (j--) {
                handleObj = handlers[j];

                if (
                    (mappedTypes || origType === handleObj.origType) &&
                    (!handler || handler.guid === handleObj.guid) &&
                    (!tmp || tmp.test(handleObj.namespace)) &&
                    (!selector ||
                        selector === handleObj.selector ||
                        (selector === '**' && handleObj.selector))
                ) {
                    handlers.splice(j, 1);

                    if (handleObj.selector) {
                        handlers.delegateCount--;
                    }
                    if (special.remove) {
                        special.remove.call(elem, handleObj);
                    }
                }
            }

            // Remove generic event handler if we removed something and no more handlers exist
            // (avoids potential for endless recursion during removal of special event handlers)
            if (origCount && !handlers.length) {
                if (
                    !special.teardown ||
                    special.teardown.call(elem, namespaces, elemData.handle) ===
                        false
                ) {
                    $.removeEvent(elem, type, elemData.handle);
                }

                delete events[type];
            }
        }

        // Remove data and the expando if it's no longer used
        if (isEmpty(events)) {
            dataPriv.remove(elem, 'handle events');
        }
    },

    dispatch: function(nativeEvent) {
        var i,
            j,
            ret,
            matched,
            handleObj,
            handlerQueue,
            args = new Array(arguments.length),
            // Make a writable $.Event from the native event object
            event = $.event.fix(nativeEvent),
            handlers =
                (dataPriv.get(this, 'events') || Object.create(null))[
                    event.type
                ] || [],
            special = $.event.special[event.type] || {};

        // Use the fix-ed $.Event rather than the (read-only) native event
        args[0] = event;

        for (i = 1; i < arguments.length; i++) {
            args[i] = arguments[i];
        }

        event.delegateTarget = this;

        // Call the preDispatch hook for the mapped type, and let it bail if desired
        if (
            special.preDispatch &&
            special.preDispatch.call(this, event) === false
        ) {
            return;
        }

        // Determine handlers
        handlerQueue = $.event.handlers.call(this, event, handlers);

        // Run delegates first; they may want to stop propagation beneath us
        i = 0;
        while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
            event.currentTarget = matched.elem;

            j = 0;
            while (
                (handleObj = matched.handlers[j++]) &&
                !event.isImmediatePropagationStopped()
            ) {
                // If the event is namespaced, then each handler is only invoked if it is
                // specially universal or its namespaces are a superset of the event's.
                if (
                    !event.rnamespace ||
                    handleObj.namespace === false ||
                    event.rnamespace.test(handleObj.namespace)
                ) {
                    event.handleObj = handleObj;
                    event.data = handleObj.data;

                    ret = (
                        ($.event.special[handleObj.origType] || {})
                            .handle || handleObj.handler
                    ).apply(matched.elem, args);

                    if (ret !== undefined) {
                        if ((event.result = ret) === false) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }
                }
            }
        }

        // Call the postDispatch hook for the mapped type
        if (special.postDispatch) {
            special.postDispatch.call(this, event);
        }

        return event.result;
    },

    handlers: function(event, handlers) {
        var i,
            handleObj,
            sel,
            matchedHandlers,
            matchedSelectors,
            handlerQueue = [],
            delegateCount = handlers.delegateCount,
            cur = event.target;

        // Find delegate handlers
        if (
            delegateCount &&
            // Support: Firefox <=42 - 66+
            // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
            // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
            // Support: IE 11+
            // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
            !(event.type === 'click' && event.button >= 1)
        ) {
            for (; cur !== this; cur = cur.parentNode || this) {
                // Don't check non-elements (trac-13208)
                // Don't process clicks on disabled elements (trac-6911, trac-8165, trac-11382, trac-11764)
                if (
                    cur.nodeType === 1 &&
                    !(event.type === 'click' && cur.disabled === true)
                ) {
                    matchedHandlers = [];
                    matchedSelectors = {};
                    for (i = 0; i < delegateCount; i++) {
                        handleObj = handlers[i];

                        // Don't conflict with Object.prototype properties (trac-13203)
                        sel = handleObj.selector + ' ';

                        if (matchedSelectors[sel] === undefined) {
                            matchedSelectors[sel] = handleObj.needsContext
                                ? $(sel, this).index(cur) > -1
                                : $.find(sel, this, null, [cur]).length;
                        }
                        if (matchedSelectors[sel]) {
                            matchedHandlers.push(handleObj);
                        }
                    }
                    if (matchedHandlers.length) {
                        handlerQueue.push({
                            elem: cur,
                            handlers: matchedHandlers,
                        });
                    }
                }
            }
        }

        // Add the remaining (directly-bound) handlers
        cur = this;
        if (delegateCount < handlers.length) {
            handlerQueue.push({
                elem: cur,
                handlers: handlers.slice(delegateCount),
            });
        }

        return handlerQueue;
    },

    addProp: function(name, hook) {
        Object.defineProperty($.Event.prototype, name, {
            enumerable: true,
            configurable: true,

            get:
                typeof hook === 'function'
                    ? function() {
                        if (this.originalEvent) {
                            return hook(this.originalEvent);
                        }
                    }
                    : function() {
                        if (this.originalEvent) {
                            return this.originalEvent[name];
                        }
                    },

            set: function(value) {
                Object.defineProperty(this, name, {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: value,
                });
            },
        });
    },

    fix: function(originalEvent) {
        return originalEvent[$.expando]
            ? originalEvent
            : new $.Event(originalEvent);
    },
};

$.event.special = Object.create(null);

$.event.special.load = {
    // Prevent triggered image.load events from bubbling to window.load
    noBubble: true,
};

$.event.special.click = {
    // Utilize native event to ensure correct state for checkable inputs
    setup: function(data) {
        // For mutual compressibility with _default, replace `this` access with a local var.
        // `|| data` is dead code meant only to preserve the variable through minification.
        var el = this || data;

        // Claim the first handler
        if (rcheckableType.test(el.type) && el.click && nodeName(el, 'input')) {
            // dataPriv.set( el, "click", ... )
            leverageNative(el, 'click', true);
        }

        // Return false to allow normal processing in the caller
        return false;
    },
};

$.event.special.trigger = function(data) {
    // For mutual compressibility with _default, replace `this` access with a local var.
    // `|| data` is dead code meant only to preserve the variable through minification.
    var el = this || data;

    // Force setup before triggering a click
    if (rcheckableType.test(el.type) && el.click && nodeName(el, 'input')) {
        leverageNative(el, 'click');
    }

    // Return non-false to allow normal event-path propagation
    return true;
};

// For cross-browser consistency, suppress native .click() on links
// Also prevent it if we're currently inside a leveraged native-event stack
$.event.special._default = function(event) {
    var target = event.target;
    return (
        (rcheckableType.test(target.type) &&
            target.click &&
            nodeName(target, 'input') &&
            dataPriv.get(target, 'click')) ||
        nodeName(target, 'a')
    );
};

$.event.special.beforeunload = {
    postDispatch: function(event) {
        // Support: Chrome <=73+
        // Chrome doesn't alert on `event.preventDefault()`
        // as the standard mandates.
        if (event.result !== undefined && event.originalEvent) {
            event.originalEvent.returnValue = event.result;
        }
    },
};

// Ensure the presence of an event listener that handles manually-triggered
// synthetic events by interrupting progress until reinvoked in response to
// *native* events that it fires directly, ensuring that state changes have
// already occurred before other listeners are invoked.
function leverageNative(el, type, isSetup) {
    // Missing `isSetup` indicates a trigger call, which must force setup through $.event.add
    if (!isSetup) {
        if (dataPriv.get(el, type) === undefined) {
            $.event.add(el, type, returnTrue);
        }
        return;
    }

    // Register the controller as a special universal handler for all event namespaces
    dataPriv.set(el, type, false);
    $.event.add(el, type, {
        namespace: false,
        handler: function(event) {
            var result,
                saved = dataPriv.get(this, type);

            if (event.isTrigger & 1 && this[type]) {
                // Interrupt processing of the outer synthetic .trigger()ed event
                if (!saved) {
                    // Store arguments for use when handling the inner native event
                    // There will always be at least one argument (an event object), so this array
                    // will not be confused with a leftover capture object.
                    saved = slice.call(arguments);
                    dataPriv.set(this, type, saved);

                    // Trigger the native event and capture its result
                    this[type]();
                    result = dataPriv.get(this, type);
                    dataPriv.set(this, type, false);

                    if (saved !== result) {
                        // Cancel the outer synthetic event
                        event.stopImmediatePropagation();
                        event.preventDefault();

                        return result;
                    }

                    // If this is an inner synthetic event for an event with a bubbling surrogate
                    // (focus or blur), assume that the surrogate already propagated from triggering
                    // the native event and prevent that from happening again here.
                    // This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the
                    // bubbling surrogate propagates *after* the non-bubbling base), but that seems
                    // less bad than duplication.
                } else if (($.event.special[type] || {}).delegateType) {
                    event.stopPropagation();
                }

                // If this is a native event triggered above, everything is now in order
                // Fire an inner synthetic event with the original arguments
            } else if (saved) {
                // ...and capture the result
                dataPriv.set(
                    this,
                    type,
                    $.event.trigger(saved[0], saved.slice(1), this)
                );

                // Abort handling of the native event by all $ handlers while allowing
                // native handlers on the same element to run. On target, this is achieved
                // by stopping immediate propagation just on the $ event. However,
                // the native event is re-wrapped by a $ one on each level of the
                // propagation so the only way to stop it for $ is to stop it for
                // everyone via native `stopPropagation()`. This is not a problem for
                // focus/blur which don't bubble, but it does also stop click on checkboxes
                // and radios. We accept this limitation.
                event.stopPropagation();
                event.isImmediatePropagationStopped = returnTrue;
            }
        },
    });
}

$.removeEvent = function(elem, type, handle) {
    // This "if" is needed for plain objects
    if (elem.removeEventListener) {
        elem.removeEventListener(type, handle);
    }
};

$.Event = function(src, props) {
    // Allow instantiation without the 'new' keyword
    if (!(this instanceof $.Event)) {
        return new $.Event(src, props);
    }

    // Event object
    if (src && src.type) {
        this.originalEvent = src;
        this.type = src.type;

        // Events bubbling up the document may have been marked as prevented
        // by a handler lower down the tree; reflect the correct value.
        this.isDefaultPrevented = src.defaultPrevented
            ? returnTrue
            : returnFalse;

        // Create target properties
        this.target = src.target;
        this.currentTarget = src.currentTarget;
        this.relatedTarget = src.relatedTarget;

        // Event type
    } else {
        this.type = src;
    }

    // Put explicitly provided properties onto the event object
    if (props) {
        Object.assign(this, props);
    }

    // Create a timestamp if incoming event doesn't have one
    this.timeStamp = (src && src.timeStamp) || Date.now();

    // Mark it as fixed
    this[$.expando] = true;
};

// $.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
$.Event.prototype = {
    constructor: $.Event,
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,
    isSimulated: false,

    preventDefault: function() {
        var e = this.originalEvent;

        this.isDefaultPrevented = returnTrue;

        if (e && !this.isSimulated) {
            e.preventDefault();
        }
    },
    stopPropagation: function() {
        var e = this.originalEvent;

        this.isPropagationStopped = returnTrue;

        if (e && !this.isSimulated) {
            e.stopPropagation();
        }
    },
    stopImmediatePropagation: function() {
        var e = this.originalEvent;

        this.isImmediatePropagationStopped = returnTrue;

        if (e && !this.isSimulated) {
            e.stopImmediatePropagation();
        }

        this.stopPropagation();
    },
};

// Includes all common event props including KeyEvent and MouseEvent specific props
[
    'altKey',
    'bubbles',
    'cancelable',
    'changedTouches',
    'ctrlKey',
    'detail',
    'eventPhase',
    'metaKey',
    'pageX',
    'pageY',
    'shiftKey',
    'view',
    'char',
    'code',
    'charCode',
    'key',
    'keyCode',
    'button',
    'buttons',
    'clientX',
    'clientY',
    'offsetX',
    'offsetY',
    'pointerId',
    'pointerType',
    'screenX',
    'screenY',
    'targetTouches',
    'toElement',
    'touches',
    'which',
].forEach((name) => $.event.addProp(name));

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in $.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
[
    ['mouseenter', 'mouseover'],
    ['mouseleave', 'mouseout'],
    ['pointerenter', 'pointerover'],
    ['pointerleave', 'pointerout'],
].forEach(([orig, fix]) => {
    $.event.special[orig] = {
        delegateType: fix,
        bindType: fix,
        handle: function(event) {
            var ret,
                target = this,
                related = event.relatedTarget,
                handleObj = event.handleObj;

            // For mouseenter/leave call the handler if related is outside the target.
            // NB: No relatedTarget if the mouse left/entered the browser window
            if (
                !related ||
                (related !== target && !$.contains(target, related))
            ) {
                event.type = handleObj.origType;
                ret = handleObj.handler.apply(this, arguments);
                event.type = fix;
            }
            return ret;
        },
    };
});

$.fn.on = function(types, selector, data, fn) {
    return on(this, types, selector, data, fn);
};

$.fn.one = function(types, selector, data, fn) {
    return on(this, types, selector, data, fn, 1);
};

$.fn.off = function(types, selector, fn) {
    var handleObj, type;
    if (types && types.preventDefault && types.handleObj) {
        // ( event )  dispatched $.Event
        handleObj = types.handleObj;
        $(types.delegateTarget).off(
            handleObj.namespace
                ? handleObj.origType + '.' + handleObj.namespace
                : handleObj.origType,
            handleObj.selector,
            handleObj.handler
        );
        return this;
    }
    if (typeof types === 'object') {
        // ( types-object [, selector] )
        for (type in types) {
            this.off(type, selector, types[type]);
        }
        return this;
    }
    if (selector === false || typeof selector === 'function') {
        // ( types [, fn] )
        fn = selector;
        selector = undefined;
    }
    if (fn === false) {
        fn = returnFalse;
    }
    return this.each(function() {
        $.event.remove(this, types, fn, selector);
    });
};

export { $ as default };
// 2397


