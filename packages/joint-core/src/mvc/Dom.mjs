import { isPlainObject, isArrayLike } from '../util/utilHelpers.mjs';
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

if (!window.document) {
    throw new Error('$ requires a window with a document');
}

var arr = [];

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

    eq: function(i) {
        var len = this.length,
            j = +i + (i < 0 ? len : 0);
        return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
    },
};

// Unique for each copy of $ on the page
$.expando = 'DOM' + (version + Math.random()).replace(/\D/g, '');

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

var isIE = document.documentMode;

// rsingleTag matches a string consisting of a single HTML element with no attributes
// and captures the element's name
const rsingleTag =
    /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

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
var rcssescape = /([\0-\x1F\x7F]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;

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
    return this.pushStack($.uniqueSort(Array.from(this)));
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
                (rsibling.test(selector) && testContext(context.parentNode)) ||
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
                    (nid ? '#' + nid : ':scope') + ' ' + toSelector(groups[i]);
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

$.expr = {
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

    return $.find(
        expr,
        null,
        null,
        $.grep(elems, (elem) => elem.nodeType === 1)
    );
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

$.fn.filter = function(selector) {
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

export { $ as default };
