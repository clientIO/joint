/*!
 * jQuery JavaScript Library v4.0.0-pre+c98597ea.dirty
 * https://jquery.com/
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2023-11-23T16:43Z
 */

'use strict';

if (!window.document) {
    throw new Error('jQuery requires a window with a document');
}

var arr = [];

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

// Support: IE 11+
// IE doesn't have Array#flat; provide a fallback.
var flat = arr.flat
    ? function(array) {
        return arr.flat.call(array);
    }
    : function(array) {
        return arr.concat.apply([], array);
    };

var push = arr.push;

var indexOf = arr.indexOf;

// [[Class]] -> type pairs
var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call(Object);

// All support tests are defined in their respective modules.
var support = {};

function toType(obj) {
    if (obj == null) {
        return obj + '';
    }

    return typeof obj === 'object'
        ? class2type[toString.call(obj)] || 'object'
        : typeof obj;
}

function isWindow(obj) {
    return obj != null && obj === obj.window;
}

function isArrayLike(obj) {
    var length = !!obj && obj.length,
        type = toType(obj);

    if (typeof obj === 'function' || isWindow(obj)) {
        return false;
    }

    return (
        type === 'array' ||
        length === 0 ||
        (typeof length === 'number' && length > 0 && length - 1 in obj)
    );
}

var document = window.document;

var preservedScriptAttributes = {
    type: true,
    src: true,
    nonce: true,
    noModule: true,
};

function DOMEval(code, node, doc) {
    doc = doc || document;

    var i,
        script = doc.createElement('script');

    script.text = code;
    if (node) {
        for (i in preservedScriptAttributes) {
            if (node[i]) {
                script[i] = node[i];
            }
        }
    }
    doc.head.appendChild(script).parentNode.removeChild(script);
}

var version = '4.0.0-pre+c98597ea.dirty',
    rhtmlSuffix = /HTML$/i,
    // Define a local copy of jQuery
    jQuery = function(selector, context) {
        // The jQuery object is actually just the init constructor 'enhanced'
        // Need init if jQuery is called (just allow error to be thrown if not included)
        return new jQuery.fn.init(selector, context);
    };

jQuery.fn = jQuery.prototype = {
    // The current version of jQuery being used
    jquery: version,

    constructor: jQuery,

    // The default length of a jQuery object is 0
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
        // Build a new jQuery matched element set
        var ret = jQuery.merge(this.constructor(), elems);

        // Add the old object onto the stack (as a reference)
        ret.prevObject = this;

        // Return the newly-formed element set
        return ret;
    },

    // Execute a callback for every element in the matched set.
    each: function(callback) {
        return jQuery.each(this, callback);
    },

    map: function(callback) {
        return this.pushStack(
            jQuery.map(this, function(elem, i) {
                return callback.call(elem, i, elem);
            })
        );
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
            jQuery.grep(this, function(_elem, i) {
                return (i + 1) % 2;
            })
        );
    },

    odd: function() {
        return this.pushStack(
            jQuery.grep(this, function(_elem, i) {
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

Object.assign(jQuery, {
    // Unique for each copy of jQuery on the page
    expando: 'jQuery' + (version + Math.random()).replace(/\D/g, ''),

    // Assume jQuery is ready without the ready module
    isReady: true,

    error: function(msg) {
        throw new Error(msg);
    },

    noop: function() {},

    isPlainObject: function(obj) {
        var proto, Ctor;

        // Detect obvious negatives
        // Use toString instead of jQuery.type to catch host objects
        if (!obj || toString.call(obj) !== '[object Object]') {
            return false;
        }

        proto = getProto(obj);

        // Objects with no prototype (e.g., `Object.create( null )`) are plain
        if (!proto) {
            return true;
        }

        // Objects with prototype are plain iff they were constructed by a global Object function
        Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
        return (
            typeof Ctor === 'function' &&
            fnToString.call(Ctor) === ObjectFunctionString
        );
    },

    isEmptyObject: function(obj) {
        var name;

        for (name in obj) {
            return false;
        }
        return true;
    },

    // Evaluates a script in a provided context; falls back to the global one
    // if not specified.
    globalEval: function(code, options, doc) {
        DOMEval(code, { nonce: options && options.nonce }, doc);
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

    // Retrieve the text value of an array of DOM nodes
    text: function(elem) {
        var node,
            ret = '',
            i = 0,
            nodeType = elem.nodeType;

        if (!nodeType) {
            // If no nodeType, this is expected to be an array
            while ((node = elem[i++])) {
                // Do not traverse comment nodes
                ret += jQuery.text(node);
            }
        }
        if (nodeType === 1 || nodeType === 11) {
            return elem.textContent;
        }
        if (nodeType === 9) {
            return elem.documentElement.textContent;
        }
        if (nodeType === 3 || nodeType === 4) {
            return elem.nodeValue;
        }

        // Do not include comment or processing instruction nodes

        return ret;
    },

    // results is for internal usage only
    makeArray: function(arr, results) {
        var ret = results || [];

        if (arr != null) {
            if (isArrayLike(Object(arr))) {
                jQuery.merge(ret, typeof arr === 'string' ? [arr] : arr);
            } else {
                push.call(ret, arr);
            }
        }

        return ret;
    },

    inArray: function(elem, arr, i) {
        return arr == null ? -1 : indexOf.call(arr, elem, i);
    },

    isXMLDoc: function(elem) {
        var namespace = elem && elem.namespaceURI,
            docElem = elem && (elem.ownerDocument || elem).documentElement;

        // Assume HTML when documentElement doesn't yet exist, such as inside
        // document fragments.
        return !rhtmlSuffix.test(
            namespace || (docElem && docElem.nodeName) || 'HTML'
        );
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

    // arg is for internal usage only
    map: function(elems, callback, arg) {
        var length,
            value,
            i = 0,
            ret = [];

        // Go through the array, translating each of the items to their new values
        if (isArrayLike(elems)) {
            length = elems.length;
            for (; i < length; i++) {
                value = callback(elems[i], i, arg);

                if (value != null) {
                    ret.push(value);
                }
            }

            // Go through every key on the object,
        } else {
            for (i in elems) {
                value = callback(elems[i], i, arg);

                if (value != null) {
                    ret.push(value);
                }
            }
        }

        // Flatten any nested arrays
        return flat(ret);
    },

    // A global GUID counter for objects
    guid: 1,

    // jQuery.support is not used in Core but other projects attach their
    // properties to it so it needs to exist.
    support: support,
});

if (typeof Symbol === 'function') {
    jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
}

// Populate the class2type map
jQuery.each(
    'Boolean Number String Function Array Date RegExp Object Error Symbol'.split(
        ' '
    ),
    function(_i, name) {
        class2type['[object ' + name + ']'] = name.toLowerCase();
    }
);

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

// Matches dashed string for camelizing
var rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
function fcamelCase(_all, letter) {
    return letter.toUpperCase();
}

// Convert dashed to camelCase
function camelCase(string) {
    return string.replace(rdashAlpha, fcamelCase);
}

function Data() {
    this.expando = jQuery.expando + Data.uid++;
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
        if (key === undefined || jQuery.isEmptyObject(cache)) {
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
        return cache !== undefined && !jQuery.isEmptyObject(cache);
    },
};

var dataPriv = new Data();

function nodeName(elem, name) {
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
}

// rsingleTag matches a string consisting of a single HTML element with no attributes
// and captures the element's name
var rsingleTag =
    /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

function isObviousHtml(input) {
    return (
        input[0] === '<' && input[input.length - 1] === '>' && input.length >= 3
    );
}

var pop = arr.pop;

// https://www.w3.org/TR/css3-selectors/#whitespace
var whitespace = '[\\x20\\t\\r\\n\\f]';

// Support: Chrome 105 - 111 only, Safari 15.4 - 16.3 only
// Make sure the `:has()` argument is parsed unforgivingly.
// We include `*` in the test to detect buggy implementations that are
// _selectively_ forgiving (specifically when the list includes at least
// one valid selector).
// Note that we treat complete lack of support for `:has()` as if it were
// spec-compliant support, which is fine because use of `:has()` in such
// environments will fail in the qSA path and fall back to jQuery traversal
// anyway.
try {
    document.querySelector(':has(*,:jqfake)');
    support.cssHas = false;
} catch (e) {
    support.cssHas = true;
}

// Build QSA regex.
// Regex strategy adopted from Diego Perini.
var rbuggyQSA = [];

if (isIE) {
    rbuggyQSA.push(
        // Support: IE 9 - 11+
        // IE's :disabled selector does not pick up the children of disabled fieldsets
        ':enabled',
        ':disabled',

        // Support: IE 11+
        // IE 11 doesn't find elements on a `[name='']` query in some cases.
        // Adding a temporary attribute to the document before the selection works
        // around the issue.
        '\\[' +
            whitespace +
            '*name' +
            whitespace +
            '*=' +
            whitespace +
            '*(?:\'\'|"")'
    );
}

if (!support.cssHas) {
    // Support: Chrome 105 - 110+, Safari 15.4 - 16.3+
    // Our regular `try-catch` mechanism fails to detect natively-unsupported
    // pseudo-classes inside `:has()` (such as `:has(:contains("Foo"))`)
    // in browsers that parse the `:has()` argument as a forgiving selector list.
    // https://drafts.csswg.org/selectors/#relational now requires the argument
    // to be parsed unforgivingly, but browsers have not yet fully adjusted.
    rbuggyQSA.push(':has');
}

rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join('|'));

var rtrimCSS = new RegExp(
    '^' + whitespace + '+|((?:^|[^\\\\])(?:\\\\.)*)' + whitespace + '+$',
    'g'
);

// https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
var identifier =
    '(?:\\\\[\\da-fA-F]{1,6}' +
    whitespace +
    '?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+';

var booleans =
    'checked|selected|async|autofocus|autoplay|controls|' +
    'defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped';

var rleadingCombinator = new RegExp(
    '^' + whitespace + '*([>+~]|' + whitespace + ')' + whitespace + '*'
);

var rdescend = new RegExp(whitespace + '|>');

var rsibling = /[+~]/;

// Support: IE 9 - 11+
// IE requires a prefix.
var matches = documentElement.matches || documentElement.msMatchesSelector;

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
        if (keys.push(key + ' ') > jQuery.expr.cacheLength) {
            // Only keep the most recent entries
            delete cache[keys.shift()];
        }
        return (cache[key + ' '] = value);
    }
    return cache;
}

/**
 * Checks a node for validity as a jQuery selector context
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
    jQuery.error('Syntax error, unrecognized expression: ' + msg);
}

var rcomma = new RegExp('^' + whitespace + '*,' + whitespace + '*');

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
    preFilters = jQuery.expr.preFilter;

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
                (match = jQuery.expr.match[type].exec(soFar)) &&
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

            // numeric x and y parameters for jQuery.expr.filter.CHILD
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

jQuery.escapeSelector = function(sel) {
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
            (a.ownerDocument == document && jQuery.contains(document, a))
        ) {
            return -1;
        }

        // Support: IE 11+
        // IE sometimes throws a "Permission denied" error when strict-comparing
        // two documents; shallow comparisons work.
        // eslint-disable-next-line eqeqeq
        if (
            b == document ||
            (b.ownerDocument == document && jQuery.contains(document, b))
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
jQuery.uniqueSort = function(results) {
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

jQuery.fn.uniqueSort = function() {
    return this.pushStack(jQuery.uniqueSort(slice.apply(this)));
};

var i,
    outermostContext,
    // Local document vars
    document$1,
    documentElement$1,
    documentIsHTML,
    // Instance-specific data
    dirruns = 0,
    done = 0,
    classCache = createCache(),
    compilerCache = createCache(),
    nonnativeSelectorCache = createCache(),
    // Regular expressions

    // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
    rwhitespace = new RegExp(whitespace + '+', 'g'),
    ridentifier = new RegExp('^' + identifier + '$'),
    matchExpr = Object.assign(
        {
            bool: new RegExp('^(?:' + booleans + ')$', 'i'),

            // For use in libraries implementing .is()
            // We use this for POS matching in `select`
            needsContext: new RegExp(
                '^' +
                    whitespace +
                    '*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(' +
                    whitespace +
                    '*((?:-\\d)?\\d*)' +
                    whitespace +
                    '*\\)|)(?=[^-]|$)',
                'i'
            ),
        },
        filterMatchExpr
    ),
    rinputs = /^(?:input|select|textarea|button)$/i,
    rheader = /^h\d$/i,
    // Easily-parseable/retrievable ID or TAG or CLASS selectors
    rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
    // Used for iframes; see `setDocument`.
    // Support: IE 9 - 11+
    // Removing the function wrapper causes a "Permission Denied"
    // error in IE.
    unloadHandler = function() {
        setDocument();
    },
    inDisabledFieldset = addCombinator(
        function(elem) {
            return elem.disabled === true && nodeName(elem, 'fieldset');
        },
        { dir: 'parentNode', next: 'legend' }
    );

function find(selector, context, results, seed) {
    var m,
        i,
        elem,
        nid,
        match,
        groups,
        newSelector,
        newContext = context && context.ownerDocument,
        // nodeType defaults to 9, since context defaults to document
        nodeType = context ? context.nodeType : 9;

    results = results || [];

    // Return early from calls with invalid selector or context
    if (
        typeof selector !== 'string' ||
        !selector ||
        (nodeType !== 1 && nodeType !== 9 && nodeType !== 11)
    ) {
        return results;
    }

    // Try to shortcut find operations (as opposed to filters) in HTML documents
    if (!seed) {
        setDocument(context);
        context = context || document$1;

        if (documentIsHTML) {
            // If the selector is sufficiently simple, try using a "get*By*" DOM method
            // (excepting DocumentFragment context, where the methods don't exist)
            if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {
                // ID selector
                if ((m = match[1])) {
                    // Document context
                    if (nodeType === 9) {
                        if ((elem = context.getElementById(m))) {
                            push.call(results, elem);
                        }
                        return results;

                        // Element context
                    } else {
                        if (
                            newContext &&
                            (elem = newContext.getElementById(m)) &&
                            jQuery.contains(context, elem)
                        ) {
                            push.call(results, elem);
                            return results;
                        }
                    }

                    // Type selector
                } else if (match[2]) {
                    push.apply(results, context.getElementsByTagName(selector));
                    return results;

                    // Class selector
                } else if ((m = match[3]) && context.getElementsByClassName) {
                    push.apply(results, context.getElementsByClassName(m));
                    return results;
                }
            }

            // Take advantage of querySelectorAll
            if (
                !nonnativeSelectorCache[selector + ' '] &&
                (!rbuggyQSA || !rbuggyQSA.test(selector))
            ) {
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
                    (rdescend.test(selector) ||
                        rleadingCombinator.test(selector))
                ) {
                    // Expand context for sibling selectors
                    newContext =
                        (rsibling.test(selector) &&
                            testContext(context.parentNode)) ||
                        context;

                    // Outside of IE, if we're not changing the context we can
                    // use :scope instead of an ID.
                    // Support: IE 11+
                    // IE sometimes throws a "Permission denied" error when strict-comparing
                    // two documents; shallow comparisons work.
                    // eslint-disable-next-line eqeqeq
                    if (newContext != context || isIE) {
                        // Capture the context ID, setting it first if necessary
                        if ((nid = context.getAttribute('id'))) {
                            nid = jQuery.escapeSelector(nid);
                        } else {
                            context.setAttribute('id', (nid = jQuery.expando));
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
                    push.apply(
                        results,
                        newContext.querySelectorAll(newSelector)
                    );
                    return results;
                } catch (qsaError) {
                    nonnativeSelectorCache(selector, true);
                } finally {
                    if (nid === jQuery.expando) {
                        context.removeAttribute('id');
                    }
                }
            }
        }
    }

    // All others
    return select(selector.replace(rtrimCSS, '$1'), context, results, seed);
}

/**
 * Mark a function for special use by jQuery selector module
 * @param {Function} fn The function to mark
 */
function markFunction(fn) {
    fn[jQuery.expando] = true;
    return fn;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo(type) {
    return function(elem) {
        return nodeName(elem, 'input') && elem.type === type;
    };
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo(type) {
    return function(elem) {
        return (
            (nodeName(elem, 'input') || nodeName(elem, 'button')) &&
            elem.type === type
        );
    };
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo(disabled) {
    // Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
    return function(elem) {
        // Only certain elements can match :enabled or :disabled
        // https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
        // https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
        if ('form' in elem) {
            // Check for inherited disabledness on relevant non-disabled elements:
            // * listed form-associated elements in a disabled fieldset
            //   https://html.spec.whatwg.org/multipage/forms.html#category-listed
            //   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
            // * option elements in a disabled optgroup
            //   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
            // All such elements have a "form" property.
            if (elem.parentNode && elem.disabled === false) {
                // Option elements defer to a parent optgroup if present
                if ('label' in elem) {
                    if ('label' in elem.parentNode) {
                        return elem.parentNode.disabled === disabled;
                    } else {
                        return elem.disabled === disabled;
                    }
                }

                // Support: IE 6 - 11+
                // Use the isDisabled shortcut property to check for disabled fieldset ancestors
                return (
                    elem.isDisabled === disabled ||
                    // Where there is no isDisabled, check manually
                    (elem.isDisabled !== !disabled &&
                        inDisabledFieldset(elem) === disabled)
                );
            }

            return elem.disabled === disabled;

            // Try to winnow out elements that can't be disabled before trusting the disabled property.
            // Some victims get caught in our net (label, legend, menu, track), but it shouldn't
            // even exist on them, let alone have a boolean value.
        } else if ('label' in elem) {
            return elem.disabled === disabled;
        }

        // Remaining elements are neither :enabled nor :disabled
        return false;
    };
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo(fn) {
    return markFunction(function(argument) {
        argument = +argument;
        return markFunction(function(seed, matches) {
            var j,
                matchIndexes = fn([], seed.length, argument),
                i = matchIndexes.length;

            // Match elements found at the specified indexes
            while (i--) {
                if (seed[(j = matchIndexes[i])]) {
                    seed[j] = !(matches[j] = seed[j]);
                }
            }
        });
    });
}

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [node] An element or document object to use to set the document
 */
function setDocument(node) {
    var subWindow,
        doc = node ? node.ownerDocument || node : document;

    // Return early if doc is invalid or already selected
    // Support: IE 11+
    // IE sometimes throws a "Permission denied" error when strict-comparing
    // two documents; shallow comparisons work.
    // eslint-disable-next-line eqeqeq
    if (doc == document$1 || doc.nodeType !== 9) {
        return;
    }

    // Update global variables
    document$1 = doc;
    documentElement$1 = document$1.documentElement;
    documentIsHTML = !jQuery.isXMLDoc(document$1);

    // Support: IE 9 - 11+
    // Accessing iframe documents after unload throws "permission denied" errors (see trac-13936)
    // Support: IE 11+
    // IE sometimes throws a "Permission denied" error when strict-comparing
    // two documents; shallow comparisons work.
    // eslint-disable-next-line eqeqeq
    if (
        isIE &&
        document != document$1 &&
        (subWindow = document$1.defaultView) &&
        subWindow.top !== subWindow
    ) {
        subWindow.addEventListener('unload', unloadHandler);
    }
}

find.matches = function(expr, elements) {
    return find(expr, null, null, elements);
};

find.matchesSelector = function(elem, expr) {
    setDocument(elem);

    if (
        documentIsHTML &&
        !nonnativeSelectorCache[expr + ' '] &&
        (!rbuggyQSA || !rbuggyQSA.test(expr))
    ) {
        try {
            return matches.call(elem, expr);
        } catch (e) {
            nonnativeSelectorCache(expr, true);
        }
    }

    return find(expr, document$1, null, [elem]).length > 0;
};

jQuery.expr = {
    // Can be adjusted by the user
    cacheLength: 50,

    createPseudo: markFunction,

    match: matchExpr,

    find: {
        ID: function(id, context) {
            if (
                typeof context.getElementById !== 'undefined' &&
                documentIsHTML
            ) {
                var elem = context.getElementById(id);
                return elem ? [elem] : [];
            }
        },

        TAG: function(tag, context) {
            if (typeof context.getElementsByTagName !== 'undefined') {
                return context.getElementsByTagName(tag);

                // DocumentFragment nodes don't have gEBTN
            } else {
                return context.querySelectorAll(tag);
            }
        },

        CLASS: function(className, context) {
            if (
                typeof context.getElementsByClassName !== 'undefined' &&
                documentIsHTML
            ) {
                return context.getElementsByClassName(className);
            }
        },
    },

    relative: {
        '>': { dir: 'parentNode', first: true },
        ' ': { dir: 'parentNode' },
        '+': { dir: 'previousSibling', first: true },
        '~': { dir: 'previousSibling' },
    },

    preFilter: preFilter,

    filter: {
        ID: function(id) {
            var attrId = unescapeSelector(id);
            return function(elem) {
                return elem.getAttribute('id') === attrId;
            };
        },

        TAG: function(nodeNameSelector) {
            var expectedNodeName =
                unescapeSelector(nodeNameSelector).toLowerCase();
            return nodeNameSelector === '*'
                ? function() {
                    return true;
                }
                : function(elem) {
                    return nodeName(elem, expectedNodeName);
                };
        },

        CLASS: function(className) {
            var pattern = classCache[className + ' '];

            return (
                pattern ||
                ((pattern = new RegExp(
                    '(^|' +
                        whitespace +
                        ')' +
                        className +
                        '(' +
                        whitespace +
                        '|$)'
                )) &&
                    classCache(className, function(elem) {
                        return pattern.test(
                            (typeof elem.className === 'string' &&
                                elem.className) ||
                                (typeof elem.getAttribute !== 'undefined' &&
                                    elem.getAttribute('class')) ||
                                ''
                        );
                    }))
            );
        },

        ATTR: function(name, operator, check) {
            return function(elem) {
                var result = jQuery.attr(elem, name);

                if (result == null) {
                    return operator === '!=';
                }
                if (!operator) {
                    return true;
                }

                result += '';

                if (operator === '=') {
                    return result === check;
                }
                if (operator === '!=') {
                    return result !== check;
                }
                if (operator === '^=') {
                    return check && result.indexOf(check) === 0;
                }
                if (operator === '*=') {
                    return check && result.indexOf(check) > -1;
                }
                if (operator === '$=') {
                    return check && result.slice(-check.length) === check;
                }
                if (operator === '~=') {
                    return (
                        (' ' + result.replace(rwhitespace, ' ') + ' ').indexOf(
                            check
                        ) > -1
                    );
                }
                if (operator === '|=') {
                    return (
                        result === check ||
                        result.slice(0, check.length + 1) === check + '-'
                    );
                }

                return false;
            };
        },

        CHILD: function(type, what, _argument, first, last) {
            var simple = type.slice(0, 3) !== 'nth',
                forward = type.slice(-4) !== 'last',
                ofType = what === 'of-type';

            return first === 1 && last === 0
                ? // Shortcut for :nth-*(n)
                function(elem) {
                    return !!elem.parentNode;
                }
                : function(elem, _context, xml) {
                    var cache,
                        outerCache,
                        node,
                        nodeIndex,
                        start,
                        dir =
                              simple !== forward
                                  ? 'nextSibling'
                                  : 'previousSibling',
                        parent = elem.parentNode,
                        name = ofType && elem.nodeName.toLowerCase(),
                        useCache = !xml && !ofType,
                        diff = false;

                    if (parent) {
                        // :(first|last|only)-(child|of-type)
                        if (simple) {
                            while (dir) {
                                node = elem;
                                while ((node = node[dir])) {
                                    if (
                                        ofType
                                            ? nodeName(node, name)
                                            : node.nodeType === 1
                                    ) {
                                        return false;
                                    }
                                }

                                // Reverse direction for :only-* (if we haven't yet done so)
                                start = dir =
                                      type === 'only' &&
                                      !start &&
                                      'nextSibling';
                            }
                            return true;
                        }

                        start = [
                            forward ? parent.firstChild : parent.lastChild,
                        ];

                        // non-xml :nth-child(...) stores cache data on `parent`
                        if (forward && useCache) {
                            // Seek `elem` from a previously-cached index
                            outerCache =
                                  parent[jQuery.expando] ||
                                  (parent[jQuery.expando] = {});
                            cache = outerCache[type] || [];
                            nodeIndex = cache[0] === dirruns && cache[1];
                            diff = nodeIndex && cache[2];
                            node = nodeIndex && parent.childNodes[nodeIndex];

                            while (
                                (node =
                                      (++nodeIndex && node && node[dir]) ||
                                      // Fallback to seeking `elem` from the start
                                      (diff = nodeIndex = 0) ||
                                      start.pop())
                            ) {
                                // When found, cache indexes on `parent` and break
                                if (
                                    node.nodeType === 1 &&
                                      ++diff &&
                                      node === elem
                                ) {
                                    outerCache[type] = [
                                        dirruns,
                                        nodeIndex,
                                        diff,
                                    ];
                                    break;
                                }
                            }
                        } else {
                            // Use previously-cached element index if available
                            if (useCache) {
                                outerCache =
                                      elem[jQuery.expando] ||
                                      (elem[jQuery.expando] = {});
                                cache = outerCache[type] || [];
                                nodeIndex = cache[0] === dirruns && cache[1];
                                diff = nodeIndex;
                            }

                            // xml :nth-child(...)
                            // or :nth-last-child(...) or :nth(-last)?-of-type(...)
                            if (diff === false) {
                                // Use the same loop as above to seek `elem` from the start
                                while (
                                    (node =
                                          (++nodeIndex && node && node[dir]) ||
                                          (diff = nodeIndex = 0) ||
                                          start.pop())
                                ) {
                                    if (
                                        (ofType
                                            ? nodeName(node, name)
                                            : node.nodeType === 1) &&
                                          ++diff
                                    ) {
                                        // Cache the index of each encountered element
                                        if (useCache) {
                                            outerCache =
                                                  node[jQuery.expando] ||
                                                  (node[jQuery.expando] = {});
                                            outerCache[type] = [
                                                dirruns,
                                                diff,
                                            ];
                                        }

                                        if (node === elem) {
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        // Incorporate the offset, then check against cycle size
                        diff -= last;
                        return (
                            diff === first ||
                              (diff % first === 0 && diff / first >= 0)
                        );
                    }
                };
        },

        PSEUDO: function(pseudo, argument) {
            // pseudo-class names are case-insensitive
            // https://www.w3.org/TR/selectors/#pseudo-classes
            // Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
            // Remember that setFilters inherits from pseudos
            var fn =
                jQuery.expr.pseudos[pseudo] ||
                jQuery.expr.setFilters[pseudo.toLowerCase()] ||
                selectorError('unsupported pseudo: ' + pseudo);

            // The user may use createPseudo to indicate that
            // arguments are needed to create the filter function
            // just as jQuery does
            if (fn[jQuery.expando]) {
                return fn(argument);
            }

            return fn;
        },
    },

    pseudos: {
        // Potentially complex pseudos
        not: markFunction(function(selector) {
            // Trim the selector passed to compile
            // to avoid treating leading and trailing
            // spaces as combinators
            var input = [],
                results = [],
                matcher = compile(selector.replace(rtrimCSS, '$1'));

            return matcher[jQuery.expando]
                ? markFunction(function(seed, matches, _context, xml) {
                    var elem,
                        unmatched = matcher(seed, null, xml, []),
                        i = seed.length;

                    // Match elements unmatched by `matcher`
                    while (i--) {
                        if ((elem = unmatched[i])) {
                            seed[i] = !(matches[i] = elem);
                        }
                    }
                })
                : function(elem, _context, xml) {
                    input[0] = elem;
                    matcher(input, null, xml, results);

                    // Don't keep the element
                    // (see https://github.com/jquery/sizzle/issues/299)
                    input[0] = null;
                    return !results.pop();
                };
        }),

        has: markFunction(function(selector) {
            return function(elem) {
                return find(selector, elem).length > 0;
            };
        }),

        contains: markFunction(function(text) {
            text = unescapeSelector(text);
            return function(elem) {
                return (
                    (elem.textContent || jQuery.text(elem)).indexOf(text) > -1
                );
            };
        }),

        // "Whether an element is represented by a :lang() selector
        // is based solely on the element's language value
        // being equal to the identifier C,
        // or beginning with the identifier C immediately followed by "-".
        // The matching of C against the element's language value is performed case-insensitively.
        // The identifier C does not have to be a valid language name."
        // https://www.w3.org/TR/selectors/#lang-pseudo
        lang: markFunction(function(lang) {
            // lang value must be a valid identifier
            if (!ridentifier.test(lang || '')) {
                selectorError('unsupported lang: ' + lang);
            }
            lang = unescapeSelector(lang).toLowerCase();
            return function(elem) {
                var elemLang;
                do {
                    if (
                        (elemLang = documentIsHTML
                            ? elem.lang
                            : elem.getAttribute('xml:lang') ||
                              elem.getAttribute('lang'))
                    ) {
                        elemLang = elemLang.toLowerCase();
                        return (
                            elemLang === lang ||
                            elemLang.indexOf(lang + '-') === 0
                        );
                    }
                } while ((elem = elem.parentNode) && elem.nodeType === 1);
                return false;
            };
        }),

        // Miscellaneous
        target: function(elem) {
            var hash = window.location && window.location.hash;
            return hash && hash.slice(1) === elem.id;
        },

        root: function(elem) {
            return elem === documentElement$1;
        },

        focus: function(elem) {
            return (
                elem === document$1.activeElement &&
                document$1.hasFocus() &&
                !!(elem.type || elem.href || ~elem.tabIndex)
            );
        },

        // Boolean properties
        enabled: createDisabledPseudo(false),
        disabled: createDisabledPseudo(true),

        checked: function(elem) {
            // In CSS3, :checked should return both checked and selected elements
            // https://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
            return (
                (nodeName(elem, 'input') && !!elem.checked) ||
                (nodeName(elem, 'option') && !!elem.selected)
            );
        },

        selected: function(elem) {
            // Support: IE <=11+
            // Accessing the selectedIndex property
            // forces the browser to treat the default option as
            // selected when in an optgroup.
            if (isIE && elem.parentNode) {
                // eslint-disable-next-line no-unused-expressions
                elem.parentNode.selectedIndex;
            }

            return elem.selected === true;
        },

        // Contents
        empty: function(elem) {
            // https://www.w3.org/TR/selectors/#empty-pseudo
            // :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
            //   but not by others (comment: 8; processing instruction: 7; etc.)
            // nodeType < 6 works because attributes (2) do not appear as children
            for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                if (elem.nodeType < 6) {
                    return false;
                }
            }
            return true;
        },

        parent: function(elem) {
            return !jQuery.expr.pseudos.empty(elem);
        },

        // Element/input types
        header: function(elem) {
            return rheader.test(elem.nodeName);
        },

        input: function(elem) {
            return rinputs.test(elem.nodeName);
        },

        button: function(elem) {
            return (
                (nodeName(elem, 'input') && elem.type === 'button') ||
                nodeName(elem, 'button')
            );
        },

        text: function(elem) {
            return nodeName(elem, 'input') && elem.type === 'text';
        },

        // Position-in-collection
        first: createPositionalPseudo(function() {
            return [0];
        }),

        last: createPositionalPseudo(function(_matchIndexes, length) {
            return [length - 1];
        }),

        eq: createPositionalPseudo(function(_matchIndexes, length, argument) {
            return [argument < 0 ? argument + length : argument];
        }),

        even: createPositionalPseudo(function(matchIndexes, length) {
            var i = 0;
            for (; i < length; i += 2) {
                matchIndexes.push(i);
            }
            return matchIndexes;
        }),

        odd: createPositionalPseudo(function(matchIndexes, length) {
            var i = 1;
            for (; i < length; i += 2) {
                matchIndexes.push(i);
            }
            return matchIndexes;
        }),

        lt: createPositionalPseudo(function(matchIndexes, length, argument) {
            var i;

            if (argument < 0) {
                i = argument + length;
            } else if (argument > length) {
                i = length;
            } else {
                i = argument;
            }

            for (; --i >= 0; ) {
                matchIndexes.push(i);
            }
            return matchIndexes;
        }),

        gt: createPositionalPseudo(function(matchIndexes, length, argument) {
            var i = argument < 0 ? argument + length : argument;
            for (; ++i < length; ) {
                matchIndexes.push(i);
            }
            return matchIndexes;
        }),
    },
};

jQuery.expr.pseudos.nth = jQuery.expr.pseudos.eq;

// Add button/input type pseudos
for (i in {
    radio: true,
    checkbox: true,
    file: true,
    password: true,
    image: true,
}) {
    jQuery.expr.pseudos[i] = createInputPseudo(i);
}
for (i in { submit: true, reset: true }) {
    jQuery.expr.pseudos[i] = createButtonPseudo(i);
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = jQuery.expr.filters = jQuery.expr.pseudos;
jQuery.expr.setFilters = new setFilters();

function addCombinator(matcher, combinator, base) {
    var dir = combinator.dir,
        skip = combinator.next,
        key = skip || dir,
        checkNonElements = base && key === 'parentNode',
        doneName = done++;

    return combinator.first
        ? // Check against closest ancestor/preceding element
        function(elem, context, xml) {
            while ((elem = elem[dir])) {
                if (elem.nodeType === 1 || checkNonElements) {
                    return matcher(elem, context, xml);
                }
            }
            return false;
        }
        : // Check against all ancestor/preceding elements
        function(elem, context, xml) {
            var oldCache,
                outerCache,
                newCache = [dirruns, doneName];

            // We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
            if (xml) {
                while ((elem = elem[dir])) {
                    if (elem.nodeType === 1 || checkNonElements) {
                        if (matcher(elem, context, xml)) {
                            return true;
                        }
                    }
                }
            } else {
                while ((elem = elem[dir])) {
                    if (elem.nodeType === 1 || checkNonElements) {
                        outerCache =
                              elem[jQuery.expando] ||
                              (elem[jQuery.expando] = {});

                        if (skip && nodeName(elem, skip)) {
                            elem = elem[dir] || elem;
                        } else if (
                            (oldCache = outerCache[key]) &&
                              oldCache[0] === dirruns &&
                              oldCache[1] === doneName
                        ) {
                            // Assign to newCache so results back-propagate to previous elements
                            return (newCache[2] = oldCache[2]);
                        } else {
                            // Reuse newcache so results back-propagate to previous elements
                            outerCache[key] = newCache;

                            // A match means we're done; a fail means we have to keep checking
                            if ((newCache[2] = matcher(elem, context, xml))) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        };
}

function elementMatcher(matchers) {
    return matchers.length > 1
        ? function(elem, context, xml) {
            var i = matchers.length;
            while (i--) {
                if (!matchers[i](elem, context, xml)) {
                    return false;
                }
            }
            return true;
        }
        : matchers[0];
}

function multipleContexts(selector, contexts, results) {
    var i = 0,
        len = contexts.length;
    for (; i < len; i++) {
        find(selector, contexts[i], results);
    }
    return results;
}

function condense(unmatched, map, filter, context, xml) {
    var elem,
        newUnmatched = [],
        i = 0,
        len = unmatched.length,
        mapped = map != null;

    for (; i < len; i++) {
        if ((elem = unmatched[i])) {
            if (!filter || filter(elem, context, xml)) {
                newUnmatched.push(elem);
                if (mapped) {
                    map.push(i);
                }
            }
        }
    }

    return newUnmatched;
}

function setMatcher(
    preFilter,
    selector,
    matcher,
    postFilter,
    postFinder,
    postSelector
) {
    if (postFilter && !postFilter[jQuery.expando]) {
        postFilter = setMatcher(postFilter);
    }
    if (postFinder && !postFinder[jQuery.expando]) {
        postFinder = setMatcher(postFinder, postSelector);
    }
    return markFunction(function(seed, results, context, xml) {
        var temp,
            i,
            elem,
            matcherOut,
            preMap = [],
            postMap = [],
            preexisting = results.length,
            // Get initial elements from seed or context
            elems =
                seed ||
                multipleContexts(
                    selector || '*',
                    context.nodeType ? [context] : context,
                    []
                ),
            // Prefilter to get matcher input, preserving a map for seed-results synchronization
            matcherIn =
                preFilter && (seed || !selector)
                    ? condense(elems, preMap, preFilter, context, xml)
                    : elems;

        if (matcher) {
            // If we have a postFinder, or filtered seed, or non-seed postFilter
            // or preexisting results,
            matcherOut =
                postFinder || (seed ? preFilter : preexisting || postFilter)
                    ? // ...intermediate processing is necessary
                    []
                    : // ...otherwise use results directly
                    results;

            // Find primary matches
            matcher(matcherIn, matcherOut, context, xml);
        } else {
            matcherOut = matcherIn;
        }

        // Apply postFilter
        if (postFilter) {
            temp = condense(matcherOut, postMap);
            postFilter(temp, [], context, xml);

            // Un-match failing elements by moving them back to matcherIn
            i = temp.length;
            while (i--) {
                if ((elem = temp[i])) {
                    matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
                }
            }
        }

        if (seed) {
            if (postFinder || preFilter) {
                if (postFinder) {
                    // Get the final matcherOut by condensing this intermediate into postFinder contexts
                    temp = [];
                    i = matcherOut.length;
                    while (i--) {
                        if ((elem = matcherOut[i])) {
                            // Restore matcherIn since elem is not yet a final match
                            temp.push((matcherIn[i] = elem));
                        }
                    }
                    postFinder(null, (matcherOut = []), temp, xml);
                }

                // Move matched elements from seed to results to keep them synchronized
                i = matcherOut.length;
                while (i--) {
                    if (
                        (elem = matcherOut[i]) &&
                        (temp = postFinder
                            ? indexOf.call(seed, elem)
                            : preMap[i]) > -1
                    ) {
                        seed[temp] = !(results[temp] = elem);
                    }
                }
            }

            // Add elements to results, through postFinder if defined
        } else {
            matcherOut = condense(
                matcherOut === results
                    ? matcherOut.splice(preexisting, matcherOut.length)
                    : matcherOut
            );
            if (postFinder) {
                postFinder(null, results, matcherOut, xml);
            } else {
                push.apply(results, matcherOut);
            }
        }
    });
}

function matcherFromTokens(tokens) {
    var checkContext,
        matcher,
        j,
        len = tokens.length,
        leadingRelative = jQuery.expr.relative[tokens[0].type],
        implicitRelative = leadingRelative || jQuery.expr.relative[' '],
        i = leadingRelative ? 1 : 0,
        // The foundational matcher ensures that elements are reachable from top-level context(s)
        matchContext = addCombinator(
            function(elem) {
                return elem === checkContext;
            },
            implicitRelative,
            true
        ),
        matchAnyContext = addCombinator(
            function(elem) {
                return indexOf.call(checkContext, elem) > -1;
            },
            implicitRelative,
            true
        ),
        matchers = [
            function(elem, context, xml) {
                // Support: IE 11+
                // IE sometimes throws a "Permission denied" error when strict-comparing
                // two documents; shallow comparisons work.
                // eslint-disable-next-line eqeqeq
                var ret =
                    (!leadingRelative &&
                        (xml || context != outermostContext)) ||
                    ((checkContext = context).nodeType
                        ? matchContext(elem, context, xml)
                        : matchAnyContext(elem, context, xml));

                // Avoid hanging onto element
                // (see https://github.com/jquery/sizzle/issues/299)
                checkContext = null;
                return ret;
            },
        ];

    for (; i < len; i++) {
        if ((matcher = jQuery.expr.relative[tokens[i].type])) {
            matchers = [addCombinator(elementMatcher(matchers), matcher)];
        } else {
            matcher = jQuery.expr.filter[tokens[i].type].apply(
                null,
                tokens[i].matches
            );

            // Return special upon seeing a positional matcher
            if (matcher[jQuery.expando]) {
                // Find the next relative operator (if any) for proper handling
                j = ++i;
                for (; j < len; j++) {
                    if (jQuery.expr.relative[tokens[j].type]) {
                        break;
                    }
                }
                return setMatcher(
                    i > 1 && elementMatcher(matchers),
                    i > 1 &&
                        toSelector(
                            // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                            tokens.slice(0, i - 1).concat({
                                value: tokens[i - 2].type === ' ' ? '*' : '',
                            })
                        ).replace(rtrimCSS, '$1'),
                    matcher,
                    i < j && matcherFromTokens(tokens.slice(i, j)),
                    j < len && matcherFromTokens((tokens = tokens.slice(j))),
                    j < len && toSelector(tokens)
                );
            }
            matchers.push(matcher);
        }
    }

    return elementMatcher(matchers);
}

function matcherFromGroupMatchers(elementMatchers, setMatchers) {
    var bySet = setMatchers.length > 0,
        byElement = elementMatchers.length > 0,
        superMatcher = function(seed, context, xml, results, outermost) {
            var elem,
                j,
                matcher,
                matchedCount = 0,
                i = '0',
                unmatched = seed && [],
                setMatched = [],
                contextBackup = outermostContext,
                // We must always have either seed elements or outermost context
                elems =
                    seed || (byElement && jQuery.expr.find.TAG('*', outermost)),
                // Use integer dirruns iff this is the outermost matcher
                dirrunsUnique = (dirruns +=
                    contextBackup == null ? 1 : Math.random() || 0.1);

            if (outermost) {
                // Support: IE 11+
                // IE sometimes throws a "Permission denied" error when strict-comparing
                // two documents; shallow comparisons work.
                // eslint-disable-next-line eqeqeq
                outermostContext =
                    context == document$1 || context || outermost;
            }

            // Add elements passing elementMatchers directly to results
            for (; (elem = elems[i]) != null; i++) {
                if (byElement && elem) {
                    j = 0;

                    // Support: IE 11+
                    // IE sometimes throws a "Permission denied" error when strict-comparing
                    // two documents; shallow comparisons work.
                    // eslint-disable-next-line eqeqeq
                    if (!context && elem.ownerDocument != document$1) {
                        setDocument(elem);
                        xml = !documentIsHTML;
                    }
                    while ((matcher = elementMatchers[j++])) {
                        if (matcher(elem, context || document$1, xml)) {
                            push.call(results, elem);
                            break;
                        }
                    }
                    if (outermost) {
                        dirruns = dirrunsUnique;
                    }
                }

                // Track unmatched elements for set filters
                if (bySet) {
                    // They will have gone through all possible matchers
                    if ((elem = !matcher && elem)) {
                        matchedCount--;
                    }

                    // Lengthen the array for every element, matched or not
                    if (seed) {
                        unmatched.push(elem);
                    }
                }
            }

            // `i` is now the count of elements visited above, and adding it to `matchedCount`
            // makes the latter nonnegative.
            matchedCount += i;

            // Apply set filters to unmatched elements
            // NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
            // equals `i`), unless we didn't visit _any_ elements in the above loop because we have
            // no element matchers and no seed.
            // Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
            // case, which will result in a "00" `matchedCount` that differs from `i` but is also
            // numerically zero.
            if (bySet && i !== matchedCount) {
                j = 0;
                while ((matcher = setMatchers[j++])) {
                    matcher(unmatched, setMatched, context, xml);
                }

                if (seed) {
                    // Reintegrate element matches to eliminate the need for sorting
                    if (matchedCount > 0) {
                        while (i--) {
                            if (!(unmatched[i] || setMatched[i])) {
                                setMatched[i] = pop.call(results);
                            }
                        }
                    }

                    // Discard index placeholder values to get only actual matches
                    setMatched = condense(setMatched);
                }

                // Add matches to results
                push.apply(results, setMatched);

                // Seedless set matches succeeding multiple successful matchers stipulate sorting
                if (
                    outermost &&
                    !seed &&
                    setMatched.length > 0 &&
                    matchedCount + setMatchers.length > 1
                ) {
                    jQuery.uniqueSort(results);
                }
            }

            // Override manipulation of globals by nested matchers
            if (outermost) {
                dirruns = dirrunsUnique;
                outermostContext = contextBackup;
            }

            return unmatched;
        };

    return bySet ? markFunction(superMatcher) : superMatcher;
}

function compile(selector, match /* Internal Use Only */) {
    var i,
        setMatchers = [],
        elementMatchers = [],
        cached = compilerCache[selector + ' '];

    if (!cached) {
        // Generate a function of recursive functions that can be used to check each element
        if (!match) {
            match = tokenize(selector);
        }
        i = match.length;
        while (i--) {
            cached = matcherFromTokens(match[i]);
            if (cached[jQuery.expando]) {
                setMatchers.push(cached);
            } else {
                elementMatchers.push(cached);
            }
        }

        // Cache the compiled function
        cached = compilerCache(
            selector,
            matcherFromGroupMatchers(elementMatchers, setMatchers)
        );

        // Save selector and tokenization
        cached.selector = selector;
    }
    return cached;
}

/**
 * A low-level selection function that works with jQuery's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with jQuery selector compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
function select(selector, context, results, seed) {
    var i,
        tokens,
        token,
        type,
        find,
        compiled = typeof selector === 'function' && selector,
        match = !seed && tokenize((selector = compiled.selector || selector));

    results = results || [];

    // Try to minimize operations if there is only one selector in the list and no seed
    // (the latter of which guarantees us context)
    if (match.length === 1) {
        // Reduce context if the leading compound selector is an ID
        tokens = match[0] = match[0].slice(0);
        if (
            tokens.length > 2 &&
            (token = tokens[0]).type === 'ID' &&
            context.nodeType === 9 &&
            documentIsHTML &&
            jQuery.expr.relative[tokens[1].type]
        ) {
            context = (jQuery.expr.find.ID(
                unescapeSelector(token.matches[0]),
                context
            ) || [])[0];
            if (!context) {
                return results;

                // Precompiled matchers will still verify ancestry, so step up a level
            } else if (compiled) {
                context = context.parentNode;
            }

            selector = selector.slice(tokens.shift().value.length);
        }

        // Fetch a seed set for right-to-left matching
        i = matchExpr.needsContext.test(selector) ? 0 : tokens.length;
        while (i--) {
            token = tokens[i];

            // Abort if we hit a combinator
            if (jQuery.expr.relative[(type = token.type)]) {
                break;
            }
            if ((find = jQuery.expr.find[type])) {
                // Search, expanding context for leading sibling combinators
                if (
                    (seed = find(
                        unescapeSelector(token.matches[0]),
                        (rsibling.test(tokens[0].type) &&
                            testContext(context.parentNode)) ||
                            context
                    ))
                ) {
                    // If seed is empty or no tokens remain, we can return early
                    tokens.splice(i, 1);
                    selector = seed.length && toSelector(tokens);
                    if (!selector) {
                        push.apply(results, seed);
                        return results;
                    }

                    break;
                }
            }
        }
    }

    // Compile and execute a filtering function if one is not provided
    // Provide `match` to avoid retokenization if we modified the selector above
    (compiled || compile(selector, match))(
        seed,
        context,
        !documentIsHTML,
        results,
        !context ||
            (rsibling.test(selector) && testContext(context.parentNode)) ||
            context
    );
    return results;
}

// Initialize against the default document
setDocument();

jQuery.find = find;

// These have always been private, but they used to be documented as part of
// Sizzle so let's maintain them for now for backwards compatibility purposes.
find.compile = compile;
find.select = select;
find.setDocument = setDocument;
find.tokenize = tokenize;

var rneedsContext = jQuery.expr.match.needsContext;

// Implement the identical functionality for filter and not
function winnow(elements, qualifier, not) {
    if (typeof qualifier === 'function') {
        return jQuery.grep(elements, function(elem, i) {
            return !!qualifier.call(elem, i, elem) !== not;
        });
    }

    // Single element
    if (qualifier.nodeType) {
        return jQuery.grep(elements, function(elem) {
            return (elem === qualifier) !== not;
        });
    }

    // Arraylike of elements (jQuery, arguments, Array)
    if (typeof qualifier !== 'string') {
        return jQuery.grep(elements, function(elem) {
            return indexOf.call(qualifier, elem) > -1 !== not;
        });
    }

    // Filtered directly for both simple and complex selectors
    return jQuery.filter(qualifier, elements, not);
}

jQuery.filter = function(expr, elems, not) {
    var elem = elems[0];

    if (not) {
        expr = ':not(' + expr + ')';
    }

    if (elems.length === 1 && elem.nodeType === 1) {
        return jQuery.find.matchesSelector(elem, expr) ? [elem] : [];
    }

    return jQuery.find.matches(
        expr,
        jQuery.grep(elems, function(elem) {
            return elem.nodeType === 1;
        })
    );
};

Object.assign(jQuery.fn, {
    find: function(selector) {
        var i,
            ret,
            len = this.length,
            self = this;

        if (typeof selector !== 'string') {
            return this.pushStack(
                jQuery(selector).filter(function() {
                    for (i = 0; i < len; i++) {
                        if (jQuery.contains(self[i], this)) {
                            return true;
                        }
                    }
                })
            );
        }

        ret = this.pushStack([]);

        for (i = 0; i < len; i++) {
            jQuery.find(selector, self[i], ret);
        }

        return len > 1 ? jQuery.uniqueSort(ret) : ret;
    },
    filter: function(selector) {
        return this.pushStack(winnow(this, selector || [], false));
    },
    not: function(selector) {
        return this.pushStack(winnow(this, selector || [], true));
    },
    is: function(selector) {
        return !!winnow(
            this,

            // If this is a positional/relative selector, check membership in the returned set
            // so $("p:first").is("p:last") won't return true for a doc with two "p".
            typeof selector === 'string' && rneedsContext.test(selector)
                ? jQuery(selector)
                : selector || [],
            false
        ).length;
    },
});

// Initialize a jQuery object

// A central reference to the root jQuery(document)
var rootjQuery,
    // A simple way to check for HTML strings
    // Prioritize #id over <tag> to avoid XSS via location.hash (trac-9521)
    // Strict HTML recognition (trac-11290: must start with <)
    // Shortcut simple #id case for speed
    rquickExpr$1 = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,
    init = (jQuery.fn.init = function(selector, context) {
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
            return rootjQuery.ready !== undefined
                ? rootjQuery.ready(selector)
                : // Execute immediately if ready is not present
                selector(jQuery);
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
                match = rquickExpr$1.exec(selector);
            } else {
                return jQuery.makeArray(selector, this);
            }

            // Match html or make sure no context is specified for #id
            // Note: match[1] may be a string or a TrustedHTML wrapper
            if (match && (match[1] || !context)) {
                // HANDLE: $(html) -> $(array)
                if (match[1]) {
                    context = context instanceof jQuery ? context[0] : context;

                    // Option to run scripts is true for back-compat
                    // Intentionally let the error be thrown if parseHTML is not present
                    jQuery.merge(
                        this,
                        jQuery.parseHTML(
                            match[1],
                            context && context.nodeType
                                ? context.ownerDocument || context
                                : document,
                            true
                        )
                    );

                    // HANDLE: $(html, props)
                    if (
                        rsingleTag.test(match[1]) &&
                        jQuery.isPlainObject(context)
                    ) {
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
                        // Inject the element directly into the jQuery object
                        this[0] = elem;
                        this.length = 1;
                    }
                    return this;
                }

                // HANDLE: $(expr) & $(expr, $(...))
            } else if (!context || context.jquery) {
                return (context || rootjQuery).find(selector);

                // HANDLE: $(expr, context)
                // (which is just equivalent to: $(context).find(expr)
            } else {
                return this.constructor(context).find(selector);
            }
        }
    });

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery(document);

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
            jQuery().off(event);
            return origFn.apply(this, arguments);
        };

        // Use same guid so caller can remove using origFn
        fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
    }
    return elem.each(function() {
        jQuery.event.add(this, types, fn, data, selector);
    });
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {
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
            jQuery.find.matchesSelector(documentElement, selector);
        }

        // Make sure that the handler has a unique ID, used to find/remove it later
        if (!handler.guid) {
            handler.guid = jQuery.guid++;
        }

        // Init the element's event structure and main handler, if this is the first
        if (!(events = elemData.events)) {
            events = elemData.events = Object.create(null);
        }
        if (!(eventHandle = elemData.handle)) {
            eventHandle = elemData.handle = function(e) {
                // Discard the second event of a jQuery.event.trigger() and
                // when an event is called after a page has unloaded
                return typeof jQuery !== 'undefined' &&
                    jQuery.event.triggered !== e.type
                    ? jQuery.event.dispatch.apply(elem, arguments)
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
            special = jQuery.event.special[type] || {};

            // If selector defined, determine special event api type, otherwise given type
            type = (selector ? special.delegateType : special.bindType) || type;

            // Update special based on newly reset type
            special = jQuery.event.special[type] || {};

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
                        jQuery.expr.match.needsContext.test(selector),
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
                    jQuery.event.remove(
                        elem,
                        type + types[t],
                        handler,
                        selector,
                        true
                    );
                }
                continue;
            }

            special = jQuery.event.special[type] || {};
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
                    jQuery.removeEvent(elem, type, elemData.handle);
                }

                delete events[type];
            }
        }

        // Remove data and the expando if it's no longer used
        if (jQuery.isEmptyObject(events)) {
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
            // Make a writable jQuery.Event from the native event object
            event = jQuery.event.fix(nativeEvent),
            handlers =
                (dataPriv.get(this, 'events') || Object.create(null))[
                    event.type
                ] || [],
            special = jQuery.event.special[event.type] || {};

        // Use the fix-ed jQuery.Event rather than the (read-only) native event
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
        handlerQueue = jQuery.event.handlers.call(this, event, handlers);

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
                        (jQuery.event.special[handleObj.origType] || {})
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
                            // matchedSelectors[sel] = handleObj.needsContext
                            //     ? jQuery(sel, this).index(cur) > -1
                            //     : jQuery.find(sel, this, null, [cur]).length;

                            // matchedSelectors[sel] = handleObj.needsContext
                            //     ? !!this.querySelector(sel)
                            //     : this.querySelectorAll(sel).length;

                            matchedSelectors[sel] = handleObj.needsContext
                                ? jQuery(sel, this).index(cur) > -1
                                : Array.from(this.querySelectorAll(sel)).includes(cur);
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
        Object.defineProperty(jQuery.Event.prototype, name, {
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
        return originalEvent[jQuery.expando]
            ? originalEvent
            : new jQuery.Event(originalEvent);
    },

    special: Object.assign(Object.create(null), {
        load: {
            // Prevent triggered image.load events from bubbling to window.load
            noBubble: true,
        },
        click: {
            // Utilize native event to ensure correct state for checkable inputs
            setup: function(data) {
                // For mutual compressibility with _default, replace `this` access with a local var.
                // `|| data` is dead code meant only to preserve the variable through minification.
                var el = this || data;

                // Claim the first handler
                if (
                    rcheckableType.test(el.type) &&
                    el.click &&
                    nodeName(el, 'input')
                ) {
                    // dataPriv.set( el, "click", ... )
                    leverageNative(el, 'click', true);
                }

                // Return false to allow normal processing in the caller
                return false;
            },
            trigger: function(data) {
                // For mutual compressibility with _default, replace `this` access with a local var.
                // `|| data` is dead code meant only to preserve the variable through minification.
                var el = this || data;

                // Force setup before triggering a click
                if (
                    rcheckableType.test(el.type) &&
                    el.click &&
                    nodeName(el, 'input')
                ) {
                    leverageNative(el, 'click');
                }

                // Return non-false to allow normal event-path propagation
                return true;
            },

            // For cross-browser consistency, suppress native .click() on links
            // Also prevent it if we're currently inside a leveraged native-event stack
            _default: function(event) {
                var target = event.target;
                return (
                    (rcheckableType.test(target.type) &&
                        target.click &&
                        nodeName(target, 'input') &&
                        dataPriv.get(target, 'click')) ||
                    nodeName(target, 'a')
                );
            },
        },

        beforeunload: {
            postDispatch: function(event) {
                // Support: Chrome <=73+
                // Chrome doesn't alert on `event.preventDefault()`
                // as the standard mandates.
                if (event.result !== undefined && event.originalEvent) {
                    event.originalEvent.returnValue = event.result;
                }
            },
        },
    }),
};

// Ensure the presence of an event listener that handles manually-triggered
// synthetic events by interrupting progress until reinvoked in response to
// *native* events that it fires directly, ensuring that state changes have
// already occurred before other listeners are invoked.
function leverageNative(el, type, isSetup) {
    // Missing `isSetup` indicates a trigger call, which must force setup through jQuery.event.add
    if (!isSetup) {
        if (dataPriv.get(el, type) === undefined) {
            jQuery.event.add(el, type, returnTrue);
        }
        return;
    }

    // Register the controller as a special universal handler for all event namespaces
    dataPriv.set(el, type, false);
    jQuery.event.add(el, type, {
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
                } else if ((jQuery.event.special[type] || {}).delegateType) {
                    event.stopPropagation();
                }

                // If this is a native event triggered above, everything is now in order
                // Fire an inner synthetic event with the original arguments
            } else if (saved) {
                // ...and capture the result
                dataPriv.set(
                    this,
                    type,
                    jQuery.event.trigger(saved[0], saved.slice(1), this)
                );

                // Abort handling of the native event by all jQuery handlers while allowing
                // native handlers on the same element to run. On target, this is achieved
                // by stopping immediate propagation just on the jQuery event. However,
                // the native event is re-wrapped by a jQuery one on each level of the
                // propagation so the only way to stop it for jQuery is to stop it for
                // everyone via native `stopPropagation()`. This is not a problem for
                // focus/blur which don't bubble, but it does also stop click on checkboxes
                // and radios. We accept this limitation.
                event.stopPropagation();
                event.isImmediatePropagationStopped = returnTrue;
            }
        },
    });
}

jQuery.removeEvent = function(elem, type, handle) {
    // This "if" is needed for plain objects
    if (elem.removeEventListener) {
        elem.removeEventListener(type, handle);
    }
};

jQuery.Event = function(src, props) {
    // Allow instantiation without the 'new' keyword
    if (!(this instanceof jQuery.Event)) {
        return new jQuery.Event(src, props);
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
    this[jQuery.expando] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
    constructor: jQuery.Event,
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
jQuery.each(
    {
        altKey: true,
        bubbles: true,
        cancelable: true,
        changedTouches: true,
        ctrlKey: true,
        detail: true,
        eventPhase: true,
        metaKey: true,
        pageX: true,
        pageY: true,
        shiftKey: true,
        view: true,
        char: true,
        code: true,
        charCode: true,
        key: true,
        keyCode: true,
        button: true,
        buttons: true,
        clientX: true,
        clientY: true,
        offsetX: true,
        offsetY: true,
        pointerId: true,
        pointerType: true,
        screenX: true,
        screenY: true,
        targetTouches: true,
        toElement: true,
        touches: true,
        which: true,
    },
    jQuery.event.addProp
);

jQuery.each(
    { focus: 'focusin', blur: 'focusout' },
    function(type, delegateType) {
        // Support: IE 11+
        // Attach a single focusin/focusout handler on the document while someone wants focus/blur.
        // This is because the former are synchronous in IE while the latter are async. In other
        // browsers, all those handlers are invoked synchronously.
        function focusMappedHandler(nativeEvent) {
            // `eventHandle` would already wrap the event, but we need to change the `type` here.
            var event = jQuery.event.fix(nativeEvent);
            event.type = nativeEvent.type === 'focusin' ? 'focus' : 'blur';
            event.isSimulated = true;

            // focus/blur don't bubble while focusin/focusout do; simulate the former by only
            // invoking the handler at the lower level.
            if (event.target === event.currentTarget) {
                // The setup part calls `leverageNative`, which, in turn, calls
                // `jQuery.event.add`, so event handle will already have been set
                // by this point.
                dataPriv.get(this, 'handle')(event);
            }
        }

        jQuery.event.special[type] = {
            // Utilize native event if possible so blur/focus sequence is correct
            setup: function() {
                // Claim the first handler
                // dataPriv.set( this, "focus", ... )
                // dataPriv.set( this, "blur", ... )
                leverageNative(this, type, true);

                if (isIE) {
                    this.addEventListener(delegateType, focusMappedHandler);
                } else {
                    // Return false to allow normal processing in the caller
                    return false;
                }
            },
            trigger: function() {
                // Force setup before trigger
                leverageNative(this, type);

                // Return non-false to allow normal event-path propagation
                return true;
            },

            teardown: function() {
                if (isIE) {
                    this.removeEventListener(delegateType, focusMappedHandler);
                } else {
                    // Return false to indicate standard teardown should be applied
                    return false;
                }
            },

            // Suppress native focus or blur if we're currently inside
            // a leveraged native-event stack
            _default: function(event) {
                return dataPriv.get(event.target, type);
            },

            delegateType: delegateType,
        };
    }
);

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
jQuery.each(
    {
        mouseenter: 'mouseover',
        mouseleave: 'mouseout',
        pointerenter: 'pointerover',
        pointerleave: 'pointerout',
    },
    function(orig, fix) {
        jQuery.event.special[orig] = {
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
                    (related !== target && !jQuery.contains(target, related))
                ) {
                    event.type = handleObj.origType;
                    ret = handleObj.handler.apply(this, arguments);
                    event.type = fix;
                }
                return ret;
            },
        };
    }
);

Object.assign(jQuery.fn, {
    on: function(types, selector, data, fn) {
        return on(this, types, selector, data, fn);
    },
    one: function(types, selector, data, fn) {
        return on(this, types, selector, data, fn, 1);
    },
    off: function(types, selector, fn) {
        var handleObj, type;
        if (types && types.preventDefault && types.handleObj) {
            // ( event )  dispatched jQuery.Event
            handleObj = types.handleObj;
            jQuery(types.delegateTarget).off(
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
            jQuery.event.remove(this, types, fn, selector);
        });
    },
});

var isAttached = function(elem) {
        return (
            jQuery.contains(elem.ownerDocument, elem) ||
            elem.getRootNode(composed) === elem.ownerDocument
        );
    },
    composed = { composed: true };

// Support: IE 9 - 11+
// Check attachment across shadow DOM boundaries when possible (gh-3504).
// Provide a fallback for browsers without Shadow DOM v1 support.
if (!documentElement.getRootNode) {
    isAttached = function(elem) {
        return jQuery.contains(elem.ownerDocument, elem);
    };
}

// rtagName captures the name from the first start tag in a string of HTML
// https://html.spec.whatwg.org/multipage/syntax.html#tag-open-state
// https://html.spec.whatwg.org/multipage/syntax.html#tag-name-state
var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;

var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;

var wrapMap = {
    // Table parts need to be wrapped with `<table>` or they're
    // stripped to their contents when put in a div.
    // XHTML parsers do not magically insert elements in the
    // same way that tag soup parsers do, so we cannot shorten
    // this by omitting <tbody> or other required elements.
    thead: ['table'],
    col: ['colgroup', 'table'],
    tr: ['tbody', 'table'],
    td: ['tr', 'tbody', 'table'],
};

wrapMap.tbody =
    wrapMap.tfoot =
    wrapMap.colgroup =
    wrapMap.caption =
        wrapMap.thead;
wrapMap.th = wrapMap.td;

function getAll(context, tag) {
    // Support: IE <=9 - 11+
    // Use typeof to avoid zero-argument method invocation on host objects (trac-15151)
    var ret;

    if (typeof context.getElementsByTagName !== 'undefined') {
        ret = context.getElementsByTagName(tag || '*');
    } else if (typeof context.querySelectorAll !== 'undefined') {
        ret = context.querySelectorAll(tag || '*');
    } else {
        ret = [];
    }

    if (tag === undefined || (tag && nodeName(context, tag))) {
        return jQuery.merge([context], ret);
    }

    return ret;
}

// Mark scripts as having already been evaluated
function setGlobalEval(elems, refElements) {
    var i = 0,
        l = elems.length;

    for (; i < l; i++) {
        dataPriv.set(
            elems[i],
            'globalEval',
            !refElements || dataPriv.get(refElements[i], 'globalEval')
        );
    }
}

var rhtml = /<|&#?\w+;/;

function buildFragment(elems, context, scripts, selection, ignored) {
    var elem,
        tmp,
        tag,
        wrap,
        attached,
        j,
        fragment = context.createDocumentFragment(),
        nodes = [],
        i = 0,
        l = elems.length;

    for (; i < l; i++) {
        elem = elems[i];

        if (elem || elem === 0) {
            // Add nodes directly
            if (
                toType(elem) === 'object' &&
                (elem.nodeType || isArrayLike(elem))
            ) {
                jQuery.merge(nodes, elem.nodeType ? [elem] : elem);

                // Convert non-html into a text node
            } else if (!rhtml.test(elem)) {
                nodes.push(context.createTextNode(elem));

                // Convert html into DOM nodes
            } else {
                tmp = tmp || fragment.appendChild(context.createElement('div'));

                // Deserialize a standard representation
                tag = (rtagName.exec(elem) || ['', ''])[1].toLowerCase();
                wrap = wrapMap[tag] || arr;

                // Create wrappers & descend into them.
                j = wrap.length;
                while (--j > -1) {
                    tmp = tmp.appendChild(context.createElement(wrap[j]));
                }

                tmp.innerHTML = jQuery.htmlPrefilter(elem);

                jQuery.merge(nodes, tmp.childNodes);

                // Remember the top-level container
                tmp = fragment.firstChild;

                // Ensure the created nodes are orphaned (trac-12392)
                tmp.textContent = '';
            }
        }
    }

    // Remove wrapper from fragment
    fragment.textContent = '';

    i = 0;
    while ((elem = nodes[i++])) {
        // Skip elements already in the context collection (trac-4087)
        if (selection && jQuery.inArray(elem, selection) > -1) {
            if (ignored) {
                ignored.push(elem);
            }
            continue;
        }

        attached = isAttached(elem);

        // Append to fragment
        tmp = getAll(fragment.appendChild(elem), 'script');

        // Preserve script evaluation history
        if (attached) {
            setGlobalEval(tmp);
        }

        // Capture executables
        if (scripts) {
            j = 0;
            while ((elem = tmp[j++])) {
                if (rscriptType.test(elem.type || '')) {
                    scripts.push(elem);
                }
            }
        }
    }

    return fragment;
}

// Argument "data" should be string of html or a TrustedHTML wrapper of obvious HTML
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function(data, context, keepScripts) {
    if (typeof data !== 'string' && !isObviousHtml(data + '')) {
        return [];
    }
    if (typeof context === 'boolean') {
        keepScripts = context;
        context = false;
    }

    var base, parsed, scripts;

    if (!context) {
        // Stop scripts or inline event handlers from being executed immediately
        // by using document.implementation
        context = document.implementation.createHTMLDocument('');

        // Set the base href for the created document
        // so any parsed elements with URLs
        // are based on the document's URL (gh-2965)
        base = context.createElement('base');
        base.href = document.location.href;
        context.head.appendChild(base);
    }

    parsed = rsingleTag.exec(data);
    scripts = !keepScripts && [];

    // Single tag
    if (parsed) {
        return [context.createElement(parsed[1])];
    }

    parsed = buildFragment([data], context, scripts);

    if (scripts && scripts.length) {
        jQuery(scripts).remove();
    }

    return jQuery.merge([], parsed.childNodes);
};

export { jQuery as default };
