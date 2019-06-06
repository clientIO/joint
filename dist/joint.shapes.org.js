/*! JointJS v3.0.0-beta (2019-06-06) - JavaScript diagramming library


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
this.joint = this.joint || {};
this.joint.shapes = this.joint.shapes || {};
(function (exports, Backbone, _, $, V, g$1) {
    'use strict';

    Backbone = Backbone && Backbone.hasOwnProperty('default') ? Backbone['default'] : Backbone;
    _ = _ && _.hasOwnProperty('default') ? _['default'] : _;
    $ = $ && $.hasOwnProperty('default') ? $['default'] : $;
    V = V && V.hasOwnProperty('default') ? V['default'] : V;

    // The class name prefix config is for advanced use only.

    var getByPath = function(obj, path, delim) {

        var keys = Array.isArray(path) ? path.slice() : path.split(delim || '/');
        var key;

        while (keys.length) {
            key = keys.shift();
            if (Object(obj) === obj && key in obj) {
                obj = obj[key];
            } else {
                return undefined;
            }
        }
        return obj;
    };

    var setByPath = function(obj, path, value, delim) {

        var keys = Array.isArray(path) ? path : path.split(delim || '/');

        var diver = obj;
        var i = 0;

        for (var len = keys.length; i < len - 1; i++) {
            // diver creates an empty object if there is no nested object under such a key.
            // This means that one can populate an empty nested object with setByPath().
            diver = diver[keys[i]] || (diver[keys[i]] = {});
        }
        diver[keys[len - 1]] = value;

        return obj;
    };

    var unsetByPath = function(obj, path, delim) {

        delim = delim || '/';

        var pathArray = Array.isArray(path) ? path.slice() : path.split(delim);

        var propertyToRemove = pathArray.pop();
        if (pathArray.length > 0) {

            // unsetting a nested attribute
            var parent = getByPath(obj, pathArray, delim);

            if (parent) {
                delete parent[propertyToRemove];
            }

        } else {

            // unsetting a primitive attribute
            delete obj[propertyToRemove];
        }

        return obj;
    };

    var uuid = function() {

        // credit: http://stackoverflow.com/posts/2117523/revisions

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (Math.random() * 16) | 0;
            var v = (c === 'x') ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    var nextFrame = (function() {

        var raf;

        if (typeof window !== 'undefined') {

            raf = window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame;
        }

        if (!raf) {

            var lastTime = 0;

            raf = function(callback) {

                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = setTimeout(function() {
                    callback(currTime + timeToCall);
                }, timeToCall);

                lastTime = currTime + timeToCall;

                return id;
            };
        }

        return function(callback, context) {
            var rest = [], len = arguments.length - 2;
            while ( len-- > 0 ) rest[ len ] = arguments[ len + 2 ];

            return (context !== undefined)
                ? raf(callback.bind.apply(callback, [ context ].concat( rest )))
                : raf(callback);
        };

    })();

    var cancelFrame = (function() {

        var caf;
        var client = typeof window != 'undefined';

        if (client) {

            caf = window.cancelAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||
                window.msCancelAnimationFrame ||
                window.msCancelRequestAnimationFrame ||
                window.oCancelAnimationFrame ||
                window.oCancelRequestAnimationFrame ||
                window.mozCancelAnimationFrame ||
                window.mozCancelRequestAnimationFrame;
        }

        caf = caf || clearTimeout;

        return client ? caf.bind(window) : caf;

    })();

    var isPercentage = function(val) {

        return isString(val) && val.slice(-1) === '%';
    };

    var parseCssNumeric = function(val, restrictUnits) {

        function getUnit(validUnitExp) {

            // one or more numbers, followed by
            // any number of (
            //  `.`, followed by
            //  one or more numbers
            // ), followed by
            // `validUnitExp`, followed by
            // end of string
            var matches = new RegExp('(?:\\d+(?:\\.\\d+)*)(' + validUnitExp + ')$').exec(val);

            if (!matches) { return null; }
            return matches[1];
        }

        var number = parseFloat(val);

        // if `val` cannot be parsed as a number, return `null`
        if (Number.isNaN(number)) { return null; }

        // else: we know `output.value`
        var output = {};
        output.value = number;

        // determine the unit
        var validUnitExp;
        if (restrictUnits == null) {
            // no restriction
            // accept any unit, as well as no unit
            validUnitExp = '[A-Za-z]*';

        } else if (Array.isArray(restrictUnits)) {
            // if this is an empty array, top restriction - return `null`
            if (restrictUnits.length === 0) { return null; }

            // else: restriction - an array of valid unit strings
            validUnitExp = restrictUnits.join('|');

        } else if (isString(restrictUnits)) {
            // restriction - a single valid unit string
            validUnitExp = restrictUnits;
        }
        var unit = getUnit(validUnitExp);

        // if we found no matches for `restrictUnits`, return `null`
        if (unit === null) { return null; }

        // else: we know the unit
        output.unit = unit;
        return output;
    };

    var breakText = function(text, size, styles, opt) {

        opt = opt || {};
        styles = styles || {};

        var width = size.width;
        var height = size.height;

        var svgDocument = opt.svgDocument || V('svg').node;
        var textSpan = V('tspan').node;
        var textElement = V('text').attr(styles).append(textSpan).node;
        var textNode = document.createTextNode('');

        // Prevent flickering
        textElement.style.opacity = 0;
        // Prevent FF from throwing an uncaught exception when `getBBox()`
        // called on element that is not in the render tree (is not measurable).
        // <tspan>.getComputedTextLength() returns always 0 in this case.
        // Note that the `textElement` resp. `textSpan` can become hidden
        // when it's appended to the DOM and a `display: none` CSS stylesheet
        // rule gets applied.
        textElement.style.display = 'block';
        textSpan.style.display = 'block';

        textSpan.appendChild(textNode);
        svgDocument.appendChild(textElement);

        if (!opt.svgDocument) {

            document.body.appendChild(svgDocument);
        }

        var separator = opt.separator || ' ';
        var eol = opt.eol || '\n';
        var hyphen = opt.hyphen ? new RegExp(opt.hyphen) : /[^\w\d]/;

        var words = text.split(separator);
        var full = [];
        var lines = [];
        var p, h;
        var lineHeight;

        for (var i = 0, l = 0, len = words.length; i < len; i++) {

            var word = words[i];

            if (!word) { continue; }

            if (eol && word.indexOf(eol) >= 0) {
                // word cotains end-of-line character
                if (word.length > 1) {
                    // separate word and continue cycle
                    var eolWords = word.split(eol);
                    for (var j = 0, jl = eolWords.length - 1; j < jl; j++) {
                        eolWords.splice(2 * j + 1, 0, eol);
                    }
                    Array.prototype.splice.apply(words, [i, 1].concat(eolWords));
                    i--;
                    len += eolWords.length - 1;
                } else {
                    // creates new line
                    l++;
                }
                continue;
            }


            textNode.data = lines[l] ? lines[l] + ' ' + word : word;

            if (textSpan.getComputedTextLength() <= width) {

                // the current line fits
                lines[l] = textNode.data;

                if (p || h) {
                    // We were partitioning. Put rest of the word onto next line
                    full[l++] = true;

                    // cancel partitioning and splitting by hyphens
                    p = 0;
                    h = 0;
                }

            } else {

                if (!lines[l] || p) {

                    var partition = !!p;

                    p = word.length - 1;

                    if (partition || !p) {

                        // word has only one character.
                        if (!p) {

                            if (!lines[l]) {

                                // we won't fit this text within our rect
                                lines = [];

                                break;
                            }

                            // partitioning didn't help on the non-empty line
                            // try again, but this time start with a new line

                            // cancel partitions created
                            words.splice(i, 2, word + words[i + 1]);

                            // adjust word length
                            len--;

                            full[l++] = true;
                            i--;

                            continue;
                        }

                        // move last letter to the beginning of the next word
                        words[i] = word.substring(0, p);
                        words[i + 1] = word.substring(p) + words[i + 1];

                    } else {

                        if (h) {
                            // cancel splitting and put the words together again
                            words.splice(i, 2, words[i] + words[i + 1]);
                            h = 0;
                        } else {
                            var hyphenIndex = word.search(hyphen);
                            if (hyphenIndex > -1 && hyphenIndex !== word.length - 1 && hyphenIndex !== 0) {
                                h = hyphenIndex + 1;
                                p = 0;
                            }

                            // We initiate partitioning or splitting
                            // split the long word into two words
                            words.splice(i, 1, word.substring(0, h || p), word.substring(h|| p));
                            // adjust words length
                            len++;

                        }

                        if (l && !full[l - 1]) {
                            // if the previous line is not full, try to fit max part of
                            // the current word there
                            l--;
                        }
                    }

                    i--;

                    continue;
                }

                l++;
                i--;
            }

            // if size.height is defined we have to check whether the height of the entire
            // text exceeds the rect height
            if (height !== undefined) {

                if (lineHeight === undefined) {

                    var heightValue;

                    // use the same defaults as in V.prototype.text
                    if (styles.lineHeight === 'auto') {
                        heightValue = { value: 1.5, unit: 'em' };
                    } else {
                        heightValue = parseCssNumeric(styles.lineHeight, ['em']) || { value: 1, unit: 'em' };
                    }

                    lineHeight = heightValue.value;
                    if (heightValue.unit === 'em') {
                        lineHeight *= textElement.getBBox().height;
                    }
                }

                if (lineHeight * lines.length > height) {

                    // remove overflowing lines
                    var lastL = Math.floor(height / lineHeight) - 1;
                    lines.splice(lastL + 1);

                    // add ellipsis
                    var ellipsis = opt.ellipsis;
                    if (!ellipsis || lastL < 0) { break; }
                    if (typeof ellipsis !== 'string') { ellipsis = '\u2026'; }

                    var lastLine = lines[lastL];
                    var k = lastLine.length;
                    var lastLineWithOmission, lastChar, separatorChar;
                    do {
                        lastChar = lastLine[k];
                        lastLineWithOmission = lastLine.substring(0, k);
                        if (!lastChar) {
                            separatorChar = (typeof separator === 'string') ? separator : ' ';
                            lastLineWithOmission += separatorChar;
                        } else if (lastChar.match(separator)) {
                            lastLineWithOmission += lastChar;
                        }
                        lastLineWithOmission += ellipsis;
                        textNode.data = lastLineWithOmission;
                        if (textSpan.getComputedTextLength() <= width) {
                            lines[lastL] = lastLineWithOmission;
                            break;
                        }
                        k--;
                    } while (k >= 0);
                    break;
                }
            }
        }

        if (opt.svgDocument) {

            // svg document was provided, remove the text element only
            svgDocument.removeChild(textElement);

        } else {

            // clean svg document
            document.body.removeChild(svgDocument);
        }

        return lines.join(eol);
    };

    // Return a new object with all four sides (top, right, bottom, left) in it.
    // Value of each side is taken from the given argument (either number or object).
    // Default value for a side is 0.
    // Examples:
    // normalizeSides(5) --> { top: 5, right: 5, bottom: 5, left: 5 }
    // normalizeSides({ horizontal: 5 }) --> { top: 0, right: 5, bottom: 0, left: 5 }
    // normalizeSides({ left: 5 }) --> { top: 0, right: 0, bottom: 0, left: 5 }
    // normalizeSides({ horizontal: 10, left: 5 }) --> { top: 0, right: 10, bottom: 0, left: 5 }
    // normalizeSides({ horizontal: 0, left: 5 }) --> { top: 0, right: 0, bottom: 0, left: 5 }
    var normalizeSides = function(box) {

        if (Object(box) !== box) { // `box` is not an object
            var val = 0; // `val` left as 0 if `box` cannot be understood as finite number
            if (isFinite(box)) { val = +box; } // actually also accepts string numbers (e.g. '100')

            return { top: val, right: val, bottom: val, left: val };
        }

        // `box` is an object
        var top, right, bottom, left;
        top = right = bottom = left = 0;

        if (isFinite(box.vertical)) { top = bottom = +box.vertical; }
        if (isFinite(box.horizontal)) { right = left = +box.horizontal; }

        if (isFinite(box.top)) { top = +box.top; } // overwrite vertical
        if (isFinite(box.right)) { right = +box.right; } // overwrite horizontal
        if (isFinite(box.bottom)) { bottom = +box.bottom; } // overwrite vertical
        if (isFinite(box.left)) { left = +box.left; } // overwrite horizontal

        return { top: top, right: right, bottom: bottom, left: left };
    };

    var timing = {

        linear: function(t) {
            return t;
        },

        quad: function(t) {
            return t * t;
        },

        cubic: function(t) {
            return t * t * t;
        },

        inout: function(t) {
            if (t <= 0) { return 0; }
            if (t >= 1) { return 1; }
            var t2 = t * t;
            var t3 = t2 * t;
            return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
        },

        exponential: function(t) {
            return Math.pow(2, 10 * (t - 1));
        },

        bounce: function(t) {
            for (var a = 0, b = 1; 1; a += b, b /= 2) {
                if (t >= (7 - 4 * a) / 11) {
                    var q = (11 - 6 * a - 11 * t) / 4;
                    return -q * q + b * b;
                }
            }
        },

        reverse: function(f) {
            return function(t) {
                return 1 - f(1 - t);
            };
        },

        reflect: function(f) {
            return function(t) {
                return .5 * (t < .5 ? f(2 * t) : (2 - f(2 - 2 * t)));
            };
        },

        clamp: function(f, n, x) {
            n = n || 0;
            x = x || 1;
            return function(t) {
                var r = f(t);
                return r < n ? n : r > x ? x : r;
            };
        },

        back: function(s) {
            if (!s) { s = 1.70158; }
            return function(t) {
                return t * t * ((s + 1) * t - s);
            };
        },

        elastic: function(x) {
            if (!x) { x = 1.5; }
            return function(t) {
                return Math.pow(2, 10 * (t - 1)) * Math.cos(20 * Math.PI * x / 3 * t);
            };
        }
    };

    var interpolate = {

        number: function(a, b) {
            var d = b - a;
            return function(t) {
                return a + d * t;
            };
        },

        object: function(a, b) {
            var s = Object.keys(a);
            return function(t) {
                var i, p;
                var r = {};
                for (i = s.length - 1; i != -1; i--) {
                    p = s[i];
                    r[p] = a[p] + (b[p] - a[p]) * t;
                }
                return r;
            };
        },

        hexColor: function(a, b) {

            var ca = parseInt(a.slice(1), 16);
            var cb = parseInt(b.slice(1), 16);
            var ra = ca & 0x0000ff;
            var rd = (cb & 0x0000ff) - ra;
            var ga = ca & 0x00ff00;
            var gd = (cb & 0x00ff00) - ga;
            var ba = ca & 0xff0000;
            var bd = (cb & 0xff0000) - ba;

            return function(t) {

                var r = (ra + rd * t) & 0x000000ff;
                var g = (ga + gd * t) & 0x0000ff00;
                var b = (ba + bd * t) & 0x00ff0000;

                return '#' + (1 << 24 | r | g | b).toString(16).slice(1);
            };
        },

        unit: function(a, b) {

            var r = /(-?[0-9]*.[0-9]*)(px|em|cm|mm|in|pt|pc|%)/;
            var ma = r.exec(a);
            var mb = r.exec(b);
            var p = mb[1].indexOf('.');
            var f = p > 0 ? mb[1].length - p - 1 : 0;
            a = +ma[1];
            var d = +mb[1] - a;
            var u = ma[2];

            return function(t) {
                return (a + d * t).toFixed(f) + u;
            };
        }
    };

    // Deprecated
    // Copy all the properties to the first argument from the following arguments.
    // All the properties will be overwritten by the properties from the following
    // arguments. Inherited properties are ignored.
    var mixin = _.assign;

    // Deprecated
    // Copy all properties to the first argument from the following
    // arguments only in case if they don't exists in the first argument.
    // All the function propererties in the first argument will get
    // additional property base pointing to the extenders same named
    // property function's call method.
    var supplement = _.defaults;

    // Deprecated
    // Same as `supplement()` but deep version.
    var deepSupplement = _.defaultsDeep;

    // Replacements for deprecated functions
    var assign = _.assign;
    var defaults = _.defaults;
    // no better-named replacement for `deepMixin`
    var defaultsDeep = _.defaultsDeep;

    // Lodash 3 vs 4 incompatible
    var invoke = _.invokeMap || _.invoke;
    var sortedIndex = _.sortedIndexBy || _.sortedIndex;
    var uniq = _.uniqBy || _.uniq;

    var clone = _.clone;
    var cloneDeep = _.cloneDeep;
    var isEmpty = _.isEmpty;
    var isEqual = _.isEqual;
    var isFunction = _.isFunction;
    var isPlainObject = _.isPlainObject;
    var toArray = _.toArray;
    var debounce = _.debounce;
    var groupBy = _.groupBy;
    var sortBy = _.sortBy;
    var flattenDeep = _.flattenDeep;
    var without = _.without;
    var difference = _.difference;
    var intersection = _.intersection;
    var union = _.union;
    var has = _.has;
    var result = _.result;
    var omit = _.omit;
    var pick = _.pick;
    var bindAll = _.bindAll;
    var forIn = _.forIn;
    var camelCase = _.camelCase;
    var uniqueId = _.uniqueId;

    var merge = function() {
        if (_.mergeWith) {
            var args = Array.from(arguments);
            var last = args[args.length - 1];

            var customizer = isFunction(last) ? last : noop;
            args.push(function(a, b) {
                var customResult = customizer(a, b);
                if (customResult !== undefined) {
                    return customResult;
                }

                if (Array.isArray(a) && !Array.isArray(b)) {
                    return b;
                }
            });

            return _.mergeWith.apply(this, args);
        }
        return _.merge.apply(this, arguments);
    };

    var isObject = function(value) {
        return !!value && (typeof value === 'object' || typeof value === 'function');
    };

    var isNumber = function(value) {
        var toString = Object.prototype.toString;
        return typeof value === 'number' || (!!value && typeof value === 'object' && toString.call(value) === '[object Number]');
    };

    var isString = function(value) {
        var toString = Object.prototype.toString;
        return typeof value === 'string' || (!!value && typeof value === 'object' && toString.call(value) === '[object String]');
    };

    var noop = function() {
    };

    // Clone `cells` returning an object that maps the original cell ID to the clone. The number
    // of clones is exactly the same as the `cells.length`.
    // This function simply clones all the `cells`. However, it also reconstructs
    // all the `source/target` and `parent/embed` references within the `cells`.
    // This is the main difference from the `cell.clone()` method. The
    // `cell.clone()` method works on one single cell only.
    // For example, for a graph: `A --- L ---> B`, `cloneCells([A, L, B])`
    // returns `[A2, L2, B2]` resulting to a graph: `A2 --- L2 ---> B2`, i.e.
    // the source and target of the link `L2` is changed to point to `A2` and `B2`.
    function cloneCells(cells) {

        cells = uniq(cells);

        // A map of the form [original cell ID] -> [clone] helping
        // us to reconstruct references for source/target and parent/embeds.
        // This is also the returned value.
        var cloneMap = toArray(cells).reduce(function(map, cell) {
            map[cell.id] = cell.clone();
            return map;
        }, {});

        toArray(cells).forEach(function(cell) {

            var clone$$1 = cloneMap[cell.id];
            // assert(clone exists)

            if (clone$$1.isLink()) {
                var source = clone$$1.source();
                var target = clone$$1.target();
                if (source.id && cloneMap[source.id]) {
                    // Source points to an element and the element is among the clones.
                    // => Update the source of the cloned link.
                    clone$$1.prop('source/id', cloneMap[source.id].id);
                }
                if (target.id && cloneMap[target.id]) {
                    // Target points to an element and the element is among the clones.
                    // => Update the target of the cloned link.
                    clone$$1.prop('target/id', cloneMap[target.id].id);
                }
            }

            // Find the parent of the original cell
            var parent = cell.get('parent');
            if (parent && cloneMap[parent]) {
                clone$$1.set('parent', cloneMap[parent].id);
            }

            // Find the embeds of the original cell
            var embeds = toArray(cell.get('embeds')).reduce(function(newEmbeds, embed) {
                // Embedded cells that are not being cloned can not be carried
                // over with other embedded cells.
                if (cloneMap[embed]) {
                    newEmbeds.push(cloneMap[embed].id);
                }
                return newEmbeds;
            }, []);

            if (!isEmpty(embeds)) {
                clone$$1.set('embeds', embeds);
            }
        });

        return cloneMap;
    }

    function setWrapper(attrName, dimension) {
        return function(value, refBBox) {
            var isValuePercentage = isPercentage(value);
            value = parseFloat(value);
            if (isValuePercentage) {
                value /= 100;
            }

            var attrs = {};
            if (isFinite(value)) {
                var attrValue = (isValuePercentage || value >= 0 && value <= 1)
                    ? value * refBBox[dimension]
                    : Math.max(value + refBBox[dimension], 0);
                attrs[attrName] = attrValue;
            }

            return attrs;
        };
    }

    function positionWrapper(axis, dimension, origin) {
        return function(value, refBBox) {
            var valuePercentage = isPercentage(value);
            value = parseFloat(value);
            if (valuePercentage) {
                value /= 100;
            }

            var delta;
            if (isFinite(value)) {
                var refOrigin = refBBox[origin]();
                if (valuePercentage || value > 0 && value < 1) {
                    delta = refOrigin[axis] + refBBox[dimension] * value;
                } else {
                    delta = refOrigin[axis] + value;
                }
            }

            var point = g$1.Point();
            point[axis] = delta || 0;
            return point;
        };
    }

    function offsetWrapper(axis, dimension, corner) {
        return function(value, nodeBBox) {
            var delta;
            if (value === 'middle') {
                delta = nodeBBox[dimension] / 2;
            } else if (value === corner) {
                delta = nodeBBox[dimension];
            } else if (isFinite(value)) {
                // TODO: or not to do a breaking change?
                delta = (value > -1 && value < 1) ? (-nodeBBox[dimension] * value) : -value;
            } else if (isPercentage(value)) {
                delta = nodeBBox[dimension] * parseFloat(value) / 100;
            } else {
                delta = 0;
            }

            var point = g$1.Point();
            point[axis] = -(nodeBBox[axis] + delta);
            return point;
        };
    }

    function shapeWrapper(shapeConstructor, opt) {
        var cacheName = 'joint-shape';
        var resetOffset = opt && opt.resetOffset;
        return function(value, refBBox, node) {
            var $node = $(node);
            var cache = $node.data(cacheName);
            if (!cache || cache.value !== value) {
                // only recalculate if value has changed
                var cachedShape = shapeConstructor(value);
                cache = {
                    value: value,
                    shape: cachedShape,
                    shapeBBox: cachedShape.bbox()
                };
                $node.data(cacheName, cache);
            }

            var shape = cache.shape.clone();
            var shapeBBox = cache.shapeBBox.clone();
            var shapeOrigin = shapeBBox.origin();
            var refOrigin = refBBox.origin();

            shapeBBox.x = refOrigin.x;
            shapeBBox.y = refOrigin.y;

            var fitScale = refBBox.maxRectScaleToFit(shapeBBox, refOrigin);
            // `maxRectScaleToFit` can give Infinity if width or height is 0
            var sx = (shapeBBox.width === 0 || refBBox.width === 0) ? 1 : fitScale.sx;
            var sy = (shapeBBox.height === 0 || refBBox.height === 0) ? 1 : fitScale.sy;

            shape.scale(sx, sy, shapeOrigin);
            if (resetOffset) {
                shape.translate(-shapeOrigin.x, -shapeOrigin.y);
            }

            return shape;
        };
    }

    // `d` attribute for SVGPaths
    function dWrapper(opt) {
        function pathConstructor(value) {
            return new g$1.Path(V.normalizePathData(value));
        }

        var shape = shapeWrapper(pathConstructor, opt);
        return function(value, refBBox, node) {
            var path = shape(value, refBBox, node);
            return {
                d: path.serialize()
            };
        };
    }

    // `points` attribute for SVGPolylines and SVGPolygons
    function pointsWrapper(opt) {
        var shape = shapeWrapper(g$1.Polyline, opt);
        return function(value, refBBox, node) {
            var polyline = shape(value, refBBox, node);
            return {
                points: polyline.serialize()
            };
        };
    }

    function atConnectionWrapper(method, opt) {
        var zeroVector = new g$1.Point(1, 0);
        return function(value) {
            var p, angle;
            var tangent = this[method](value);
            if (tangent) {
                angle = (opt.rotate) ? tangent.vector().vectorAngle(zeroVector) : 0;
                p = tangent.start;
            } else {
                p = this.path.start;
                angle = 0;
            }
            if (angle === 0) { return { transform: 'translate(' + p.x + ',' + p.y + ')' }; }
            return { transform: 'translate(' + p.x + ',' + p.y + ') rotate(' + angle + ')' };
        };
    }

    function isTextInUse(lineHeight, node, attrs) {
        return (attrs.text !== undefined);
    }

    function isLinkView() {
        return this.model.isLink();
    }

    function contextMarker(context) {
        var marker = {};
        // Stroke
        // The context 'fill' is disregared here. The usual case is to use the marker with a connection
        // (for which 'fill' attribute is set to 'none').
        var stroke = context.stroke;
        if (typeof stroke === 'string') {
            marker['stroke'] = stroke;
            marker['fill'] = stroke;
        }
        // Opacity
        // Again the context 'fill-opacity' is ignored.
        var strokeOpacity = context.strokeOpacity;
        if (strokeOpacity === undefined) { strokeOpacity = context['stroke-opacity']; }
        if (strokeOpacity === undefined) { strokeOpacity = context.opacity; }
        if (strokeOpacity !== undefined) {
            marker['stroke-opacity'] = strokeOpacity;
            marker['fill-opacity'] = strokeOpacity;
        }
        return marker;
    }

    var attributesNS = {

        xlinkHref: {
            set: 'xlink:href'
        },

        xlinkShow: {
            set: 'xlink:show'
        },

        xlinkRole: {
            set: 'xlink:role'
        },

        xlinkType: {
            set: 'xlink:type'
        },

        xlinkArcrole: {
            set: 'xlink:arcrole'
        },

        xlinkTitle: {
            set: 'xlink:title'
        },

        xlinkActuate: {
            set: 'xlink:actuate'
        },

        xmlSpace: {
            set: 'xml:space'
        },

        xmlBase: {
            set: 'xml:base'
        },

        xmlLang: {
            set: 'xml:lang'
        },

        preserveAspectRatio: {
            set: 'preserveAspectRatio'
        },

        requiredExtension: {
            set: 'requiredExtension'
        },

        requiredFeatures: {
            set: 'requiredFeatures'
        },

        systemLanguage: {
            set: 'systemLanguage'
        },

        externalResourcesRequired: {
            set: 'externalResourceRequired'
        },

        filter: {
            qualify: isPlainObject,
            set: function(filter$$1) {
                return 'url(#' + this.paper.defineFilter(filter$$1) + ')';
            }
        },

        fill: {
            qualify: isPlainObject,
            set: function(fill) {
                return 'url(#' + this.paper.defineGradient(fill) + ')';
            }
        },

        stroke: {
            qualify: isPlainObject,
            set: function(stroke) {
                return 'url(#' + this.paper.defineGradient(stroke) + ')';
            }
        },

        sourceMarker: {
            qualify: isPlainObject,
            set: function(marker, refBBox, node, attrs) {
                marker = assign(contextMarker(attrs), marker);
                return { 'marker-start': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        targetMarker: {
            qualify: isPlainObject,
            set: function(marker, refBBox, node, attrs) {
                marker = assign(contextMarker(attrs), { 'transform': 'rotate(180)' }, marker);
                return { 'marker-end': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        vertexMarker: {
            qualify: isPlainObject,
            set: function(marker, refBBox, node, attrs) {
                marker = assign(contextMarker(attrs), marker);
                return { 'marker-mid': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        text: {
            qualify: function(text, node, attrs) {
                return !attrs.textWrap || !isPlainObject(attrs.textWrap);
            },
            set: function(text, refBBox, node, attrs) {
                var $node = $(node);
                var cacheName = 'joint-text';
                var cache = $node.data(cacheName);
                var textAttrs = pick(attrs, 'lineHeight', 'annotations', 'textPath', 'x', 'textVerticalAnchor', 'eol');
                var fontSize = textAttrs.fontSize = attrs['font-size'] || attrs['fontSize'];
                var textHash = JSON.stringify([text, textAttrs]);
                // Update the text only if there was a change in the string
                // or any of its attributes.
                if (cache === undefined || cache !== textHash) {
                    // Chrome bug:
                    // Tspans positions defined as `em` are not updated
                    // when container `font-size` change.
                    if (fontSize) { node.setAttribute('font-size', fontSize); }
                    // Text Along Path Selector
                    var textPath = textAttrs.textPath;
                    if (isObject(textPath)) {
                        var pathSelector = textPath.selector;
                        if (typeof pathSelector === 'string') {
                            var pathNode = this.findBySelector(pathSelector)[0];
                            if (pathNode instanceof SVGPathElement) {
                                textAttrs.textPath = assign({ 'xlink:href': '#' + pathNode.id }, textPath);
                            }
                        }
                    }
                    V(node).text('' + text, textAttrs);
                    $node.data(cacheName, textHash);
                }
            }
        },

        textWrap: {
            qualify: isPlainObject,
            set: function(value, refBBox, node, attrs) {
                // option `width`
                var width = value.width || 0;
                if (isPercentage(width)) {
                    refBBox.width *= parseFloat(width) / 100;
                } else if (width <= 0) {
                    refBBox.width += width;
                } else {
                    refBBox.width = width;
                }
                // option `height`
                var height = value.height || 0;
                if (isPercentage(height)) {
                    refBBox.height *= parseFloat(height) / 100;
                } else if (height <= 0) {
                    refBBox.height += height;
                } else {
                    refBBox.height = height;
                }
                // option `text`
                var wrappedText;
                var text = value.text;
                if (text === undefined) { text = attrs.text; }
                if (text !== undefined) {
                    wrappedText = breakText('' + text, refBBox, {
                        'font-weight': attrs['font-weight'] || attrs.fontWeight,
                        'font-size': attrs['font-size'] || attrs.fontSize,
                        'font-family': attrs['font-family'] || attrs.fontFamily,
                        'lineHeight': attrs.lineHeight
                    }, {
                        // Provide an existing SVG Document here
                        // instead of creating a temporary one over again.
                        svgDocument: this.paper.svg,
                        ellipsis: value.ellipsis,
                        hyphen: value.hyphen
                    });
                } else {
                    wrappedText = '';
                }
                attributesNS.text.set.call(this, wrappedText, refBBox, node, attrs);
            }
        },

        title: {
            qualify: function(title, node) {
                // HTMLElement title is specified via an attribute (i.e. not an element)
                return node instanceof SVGElement;
            },
            set: function(title, refBBox, node) {
                var $node = $(node);
                var cacheName = 'joint-title';
                var cache = $node.data(cacheName);
                if (cache === undefined || cache !== title) {
                    $node.data(cacheName, title);
                    // Generally <title> element should be the first child element of its parent.
                    var firstChild = node.firstChild;
                    if (firstChild && firstChild.tagName.toUpperCase() === 'TITLE') {
                        // Update an existing title
                        firstChild.textContent = title;
                    } else {
                        // Create a new title
                        var titleNode = document.createElementNS(node.namespaceURI, 'title');
                        titleNode.textContent = title;
                        node.insertBefore(titleNode, firstChild);
                    }
                }
            }
        },

        lineHeight: {
            qualify: isTextInUse
        },

        textVerticalAnchor: {
            qualify: isTextInUse
        },

        textPath: {
            qualify: isTextInUse
        },

        annotations: {
            qualify: isTextInUse
        },

        // `port` attribute contains the `id` of the port that the underlying magnet represents.
        port: {
            set: function(port) {
                return (port === null || port.id === undefined) ? port : port.id;
            }
        },

        // `style` attribute is special in the sense that it sets the CSS style of the subelement.
        style: {
            qualify: isPlainObject,
            set: function(styles, refBBox, node) {
                $(node).css(styles);
            }
        },

        html: {
            set: function(html, refBBox, node) {
                $(node).html(html + '');
            }
        },

        ref: {
            // We do not set `ref` attribute directly on an element.
            // The attribute itself does not qualify for relative positioning.
        },

        // if `refX` is in [0, 1] then `refX` is a fraction of bounding box width
        // if `refX` is < 0 then `refX`'s absolute values is the right coordinate of the bounding box
        // otherwise, `refX` is the left coordinate of the bounding box

        refX: {
            position: positionWrapper('x', 'width', 'origin')
        },

        refY: {
            position: positionWrapper('y', 'height', 'origin')
        },

        // `ref-dx` and `ref-dy` define the offset of the subelement relative to the right and/or bottom
        // coordinate of the reference element.

        refDx: {
            position: positionWrapper('x', 'width', 'corner')
        },

        refDy: {
            position: positionWrapper('y', 'height', 'corner')
        },

        // 'ref-width'/'ref-height' defines the width/height of the subelement relatively to
        // the reference element size
        // val in 0..1         ref-width = 0.75 sets the width to 75% of the ref. el. width
        // val < 0 || val > 1  ref-height = -20 sets the height to the ref. el. height shorter by 20

        refWidth: {
            set: setWrapper('width', 'width')
        },

        refHeight: {
            set: setWrapper('height', 'height')
        },

        refRx: {
            set: setWrapper('rx', 'width')
        },

        refRy: {
            set: setWrapper('ry', 'height')
        },

        refRInscribed: {
            set: (function(attrName) {
                var widthFn = setWrapper(attrName, 'width');
                var heightFn = setWrapper(attrName, 'height');
                return function(value, refBBox) {
                    var fn = (refBBox.height > refBBox.width) ? widthFn : heightFn;
                    return fn(value, refBBox);
                };
            })('r')
        },

        refRCircumscribed: {
            set: function(value, refBBox) {
                var isValuePercentage = isPercentage(value);
                value = parseFloat(value);
                if (isValuePercentage) {
                    value /= 100;
                }

                var diagonalLength = Math.sqrt((refBBox.height * refBBox.height) + (refBBox.width * refBBox.width));

                var rValue;
                if (isFinite(value)) {
                    if (isValuePercentage || value >= 0 && value <= 1) { rValue = value * diagonalLength; }
                    else { rValue = Math.max(value + diagonalLength, 0); }
                }

                return { r: rValue };
            }
        },

        refCx: {
            set: setWrapper('cx', 'width')
        },

        refCy: {
            set: setWrapper('cy', 'height')
        },

        // `x-alignment` when set to `middle` causes centering of the subelement around its new x coordinate.
        // `x-alignment` when set to `right` uses the x coordinate as referenced to the right of the bbox.

        xAlignment: {
            offset: offsetWrapper('x', 'width', 'right')
        },

        // `y-alignment` when set to `middle` causes centering of the subelement around its new y coordinate.
        // `y-alignment` when set to `bottom` uses the y coordinate as referenced to the bottom of the bbox.

        yAlignment: {
            offset: offsetWrapper('y', 'height', 'bottom')
        },

        resetOffset: {
            offset: function(val, nodeBBox) {
                return (val)
                    ? { x: -nodeBBox.x, y: -nodeBBox.y }
                    : { x: 0, y: 0 };
            }

        },

        refDResetOffset: {
            set: dWrapper({ resetOffset: true })
        },

        refDKeepOffset: {
            set: dWrapper({ resetOffset: false })
        },

        refPointsResetOffset: {
            set: pointsWrapper({ resetOffset: true })
        },

        refPointsKeepOffset: {
            set: pointsWrapper({ resetOffset: false })
        },

        // LinkView Attributes

        connection: {
            qualify: isLinkView,
            set: function() {
                return { d: this.getSerializedConnection() };
            }
        },

        atConnectionLengthKeepGradient: {
            qualify: isLinkView,
            set: atConnectionWrapper('getTangentAtLength', { rotate: true })
        },

        atConnectionLengthIgnoreGradient: {
            qualify: isLinkView,
            set: atConnectionWrapper('getTangentAtLength', { rotate: false })
        },

        atConnectionRatioKeepGradient: {
            qualify: isLinkView,
            set: atConnectionWrapper('getTangentAtRatio', { rotate: true })
        },

        atConnectionRatioIgnoreGradient: {
            qualify: isLinkView,
            set: atConnectionWrapper('getTangentAtRatio', { rotate: false })
        }
    };

    // Aliases
    attributesNS.refR = attributesNS.refRInscribed;
    attributesNS.refD = attributesNS.refDResetOffset;
    attributesNS.refPoints = attributesNS.refPointsResetOffset;
    attributesNS.atConnectionLength = attributesNS.atConnectionLengthKeepGradient;
    attributesNS.atConnectionRatio = attributesNS.atConnectionRatioKeepGradient;

    // This allows to combine both absolute and relative positioning
    // refX: 50%, refX2: 20
    attributesNS.refX2 = attributesNS.refX;
    attributesNS.refY2 = attributesNS.refY;
    attributesNS.refWidth2 = attributesNS.refWidth;
    attributesNS.refHeight2 = attributesNS.refHeight;

    // Aliases for backwards compatibility
    attributesNS['ref-x'] = attributesNS.refX;
    attributesNS['ref-y'] = attributesNS.refY;
    attributesNS['ref-dy'] = attributesNS.refDy;
    attributesNS['ref-dx'] = attributesNS.refDx;
    attributesNS['ref-width'] = attributesNS.refWidth;
    attributesNS['ref-height'] = attributesNS.refHeight;
    attributesNS['x-alignment'] = attributesNS.xAlignment;
    attributesNS['y-alignment'] = attributesNS.yAlignment;

    var attributes = attributesNS;

    // Cell base model.
    // --------------------------

    var Cell = Backbone.Model.extend({

        // This is the same as Backbone.Model with the only difference that is uses util.merge
        // instead of just _.extend. The reason is that we want to mixin attributes set in upper classes.
        constructor: function(attributes$$1, options) {

            var defaults$$1;
            var attrs = attributes$$1 || {};
            this.cid = uniqueId('c');
            this.attributes = {};
            if (options && options.collection) { this.collection = options.collection; }
            if (options && options.parse) { attrs = this.parse(attrs, options) || {}; }
            if ((defaults$$1 = result(this, 'defaults'))) {
                //<custom code>
                // Replaced the call to _.defaults with util.merge.
                attrs = merge({}, defaults$$1, attrs);
                //</custom code>
            }
            this.set(attrs, options);
            this.changed = {};
            this.initialize.apply(this, arguments);
        },

        translate: function(dx, dy, opt) {

            throw new Error('Must define a translate() method.');
        },

        toJSON: function() {

            var defaultAttrs = this.constructor.prototype.defaults.attrs || {};
            var attrs = this.attributes.attrs;
            var finalAttrs = {};

            // Loop through all the attributes and
            // omit the default attributes as they are implicitly reconstructable by the cell 'type'.
            forIn(attrs, function(attr, selector) {

                var defaultAttr = defaultAttrs[selector];

                forIn(attr, function(value, name) {

                    // attr is mainly flat though it might have one more level (consider the `style` attribute).
                    // Check if the `value` is object and if yes, go one level deep.
                    if (isObject(value) && !Array.isArray(value)) {

                        forIn(value, function(value2, name2) {

                            if (!defaultAttr || !defaultAttr[name] || !isEqual(defaultAttr[name][name2], value2)) {

                                finalAttrs[selector] = finalAttrs[selector] || {};
                                (finalAttrs[selector][name] || (finalAttrs[selector][name] = {}))[name2] = value2;
                            }
                        });

                    } else if (!defaultAttr || !isEqual(defaultAttr[name], value)) {
                        // `value` is not an object, default attribute for such a selector does not exist
                        // or it is different than the attribute value set on the model.

                        finalAttrs[selector] = finalAttrs[selector] || {};
                        finalAttrs[selector][name] = value;
                    }
                });
            });

            var attributes$$1 = cloneDeep(omit(this.attributes, 'attrs'));
            attributes$$1.attrs = finalAttrs;

            return attributes$$1;
        },

        initialize: function(options) {

            if (!options || !options.id) {

                this.set('id', this.generateId(), { silent: true });
            }

            this._transitionIds = {};

            // Collect ports defined in `attrs` and keep collecting whenever `attrs` object changes.
            this.processPorts();
            this.on('change:attrs', this.processPorts, this);
        },

        generateId: function() {
            return uuid();
        },

        /**
         * @deprecated
         */
        processPorts: function() {

            // Whenever `attrs` changes, we extract ports from the `attrs` object and store it
            // in a more accessible way. Also, if any port got removed and there were links that had `target`/`source`
            // set to that port, we remove those links as well (to follow the same behaviour as
            // with a removed element).

            var previousPorts = this.ports;

            // Collect ports from the `attrs` object.
            var ports = {};
            forIn(this.get('attrs'), function(attrs, selector) {

                if (attrs && attrs.port) {

                    // `port` can either be directly an `id` or an object containing an `id` (and potentially other data).
                    if (attrs.port.id !== undefined) {
                        ports[attrs.port.id] = attrs.port;
                    } else {
                        ports[attrs.port] = { id: attrs.port };
                    }
                }
            });

            // Collect ports that have been removed (compared to the previous ports) - if any.
            // Use hash table for quick lookup.
            var removedPorts = {};
            forIn(previousPorts, function(port, id) {

                if (!ports[id]) { removedPorts[id] = true; }
            });

            // Remove all the incoming/outgoing links that have source/target port set to any of the removed ports.
            if (this.graph && !isEmpty(removedPorts)) {

                var inboundLinks = this.graph.getConnectedLinks(this, { inbound: true });
                inboundLinks.forEach(function(link) {

                    if (removedPorts[link.get('target').port]) { link.remove(); }
                });

                var outboundLinks = this.graph.getConnectedLinks(this, { outbound: true });
                outboundLinks.forEach(function(link) {

                    if (removedPorts[link.get('source').port]) { link.remove(); }
                });
            }

            // Update the `ports` object.
            this.ports = ports;
        },

        remove: function(opt) {

            opt = opt || {};

            // Store the graph in a variable because `this.graph` won't' be accessbile after `this.trigger('remove', ...)` down below.
            var graph = this.graph;
            if (!graph) {
                // The collection is a common backbone collection (not the graph collection).
                if (this.collection) { this.collection.remove(this, opt); }
                return this;
            }

            graph.startBatch('remove');

            // First, unembed this cell from its parent cell if there is one.
            var parentCell = this.getParentCell();
            if (parentCell) { parentCell.unembed(this); }

            // Remove also all the cells, which were embedded into this cell
            var embeddedCells = this.getEmbeddedCells();
            for (var i = 0, n = embeddedCells.length; i < n; i++) {
                var embed = embeddedCells[i];
                if (embed) { embed.remove(opt); }
            }

            this.trigger('remove', this, graph.attributes.cells, opt);

            graph.stopBatch('remove');

            return this;
        },

        toFront: function(opt) {

            var graph = this.graph;
            if (graph) {

                opt = opt || {};

                var z = graph.maxZIndex();

                var cells;

                if (opt.deep) {
                    cells = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                    cells.unshift(this);
                } else {
                    cells = [this];
                }

                z = z - cells.length + 1;

                var collection = graph.get('cells');
                var shouldUpdate = (collection.indexOf(this) !== (collection.length - cells.length));
                if (!shouldUpdate) {
                    shouldUpdate = cells.some(function(cell, index) {
                        return cell.get('z') !== z + index;
                    });
                }

                if (shouldUpdate) {
                    this.startBatch('to-front');

                    z = z + cells.length;

                    cells.forEach(function(cell, index) {
                        cell.set('z', z + index, opt);
                    });

                    this.stopBatch('to-front');
                }
            }

            return this;
        },

        toBack: function(opt) {

            var graph = this.graph;
            if (graph) {

                opt = opt || {};

                var z = graph.minZIndex();

                var cells;

                if (opt.deep) {
                    cells = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                    cells.unshift(this);
                } else {
                    cells = [this];
                }

                var collection = graph.get('cells');
                var shouldUpdate = (collection.indexOf(this) !== 0);
                if (!shouldUpdate) {
                    shouldUpdate = cells.some(function(cell, index) {
                        return cell.get('z') !== z + index;
                    });
                }

                if (shouldUpdate) {
                    this.startBatch('to-back');

                    z -= cells.length;

                    cells.forEach(function(cell, index) {
                        cell.set('z', z + index, opt);
                    });

                    this.stopBatch('to-back');
                }
            }

            return this;
        },

        parent: function(parent, opt) {

            // getter
            if (parent === undefined) { return this.get('parent'); }
            // setter
            return this.set('parent', parent, opt);
        },

        embed: function(cell, opt) {

            if (this === cell || this.isEmbeddedIn(cell)) {

                throw new Error('Recursive embedding not allowed.');

            } else {

                this.startBatch('embed');

                var embeds = assign([], this.get('embeds'));

                // We keep all element ids after link ids.
                embeds[cell.isLink() ? 'unshift' : 'push'](cell.id);

                cell.parent(this.id, opt);
                this.set('embeds', uniq(embeds), opt);

                this.stopBatch('embed');
            }

            return this;
        },

        unembed: function(cell, opt) {

            this.startBatch('unembed');

            cell.unset('parent', opt);
            this.set('embeds', without(this.get('embeds'), cell.id), opt);

            this.stopBatch('unembed');

            return this;
        },

        getParentCell: function() {

            // unlike link.source/target, cell.parent stores id directly as a string
            var parentId = this.parent();
            var graph = this.graph;

            return (parentId && graph && graph.getCell(parentId)) || null;
        },

        // Return an array of ancestor cells.
        // The array is ordered from the parent of the cell
        // to the most distant ancestor.
        getAncestors: function() {

            var ancestors = [];

            if (!this.graph) {
                return ancestors;
            }

            var parentCell = this.getParentCell();
            while (parentCell) {
                ancestors.push(parentCell);
                parentCell = parentCell.getParentCell();
            }

            return ancestors;
        },

        getEmbeddedCells: function(opt) {

            opt = opt || {};

            // Cell models can only be retrieved when this element is part of a collection.
            // There is no way this element knows about other cells otherwise.
            // This also means that calling e.g. `translate()` on an element with embeds before
            // adding it to a graph does not translate its embeds.
            if (this.graph) {

                var cells;

                if (opt.deep) {

                    if (opt.breadthFirst) {

                        // breadthFirst algorithm
                        cells = [];
                        var queue = this.getEmbeddedCells();

                        while (queue.length > 0) {

                            var parent = queue.shift();
                            cells.push(parent);
                            queue.push.apply(queue, parent.getEmbeddedCells());
                        }

                    } else {

                        // depthFirst algorithm
                        cells = this.getEmbeddedCells();
                        cells.forEach(function(cell) {
                            cells.push.apply(cells, cell.getEmbeddedCells(opt));
                        });
                    }

                } else {

                    cells = toArray(this.get('embeds')).map(this.graph.getCell, this.graph);
                }

                return cells;
            }
            return [];
        },

        isEmbeddedIn: function(cell, opt) {

            var cellId = isString(cell) ? cell : cell.id;
            var parentId = this.parent();

            opt = defaults({ deep: true }, opt);

            // See getEmbeddedCells().
            if (this.graph && opt.deep) {

                while (parentId) {
                    if (parentId === cellId) {
                        return true;
                    }
                    parentId = this.graph.getCell(parentId).parent();
                }

                return false;

            } else {

                // When this cell is not part of a collection check
                // at least whether it's a direct child of given cell.
                return parentId === cellId;
            }
        },

        // Whether or not the cell is embedded in any other cell.
        isEmbedded: function() {

            return !!this.parent();
        },

        // Isolated cloning. Isolated cloning has two versions: shallow and deep (pass `{ deep: true }` in `opt`).
        // Shallow cloning simply clones the cell and returns a new cell with different ID.
        // Deep cloning clones the cell and all its embedded cells recursively.
        clone: function(opt) {

            opt = opt || {};

            if (!opt.deep) {
                // Shallow cloning.

                var clone$$1 = Backbone.Model.prototype.clone.apply(this, arguments);
                // We don't want the clone to have the same ID as the original.
                clone$$1.set('id', this.generateId());
                // A shallow cloned element does not carry over the original embeds.
                clone$$1.unset('embeds');
                // And can not be embedded in any cell
                // as the clone is not part of the graph.
                clone$$1.unset('parent');

                return clone$$1;

            } else {
                // Deep cloning.

                // For a deep clone, simply call `graph.cloneCells()` with the cell and all its embedded cells.
                return toArray(cloneCells([this].concat(this.getEmbeddedCells({ deep: true }))));
            }
        },

        // A convenient way to set nested properties.
        // This method merges the properties you'd like to set with the ones
        // stored in the cell and makes sure change events are properly triggered.
        // You can either set a nested property with one object
        // or use a property path.
        // The most simple use case is:
        // `cell.prop('name/first', 'John')` or
        // `cell.prop({ name: { first: 'John' } })`.
        // Nested arrays are supported too:
        // `cell.prop('series/0/data/0/degree', 50)` or
        // `cell.prop({ series: [ { data: [ { degree: 50 } ] } ] })`.
        prop: function(props, value, opt) {

            var delim = '/';
            var _isString = isString(props);

            if (_isString || Array.isArray(props)) {
                // Get/set an attribute by a special path syntax that delimits
                // nested objects by the colon character.

                if (arguments.length > 1) {

                    var path;
                    var pathArray;

                    if (_isString) {
                        path = props;
                        pathArray = path.split('/');
                    } else {
                        path = props.join(delim);
                        pathArray = props.slice();
                    }

                    var property = pathArray[0];
                    var pathArrayLength = pathArray.length;

                    opt = opt || {};
                    opt.propertyPath = path;
                    opt.propertyValue = value;
                    opt.propertyPathArray = pathArray;

                    if (pathArrayLength === 1) {
                        // Property is not nested. We can simply use `set()`.
                        return this.set(property, value, opt);
                    }

                    var update = {};
                    // Initialize the nested object. Subobjects are either arrays or objects.
                    // An empty array is created if the sub-key is an integer. Otherwise, an empty object is created.
                    // Note that this imposes a limitation on object keys one can use with Inspector.
                    // Pure integer keys will cause issues and are therefore not allowed.
                    var initializer = update;
                    var prevProperty = property;

                    for (var i = 1; i < pathArrayLength; i++) {
                        var pathItem = pathArray[i];
                        var isArrayIndex = Number.isFinite(_isString ? Number(pathItem) : pathItem);
                        initializer = initializer[prevProperty] = isArrayIndex ? [] : {};
                        prevProperty = pathItem;
                    }

                    // Fill update with the `value` on `path`.
                    update = setByPath(update, pathArray, value, '/');

                    var baseAttributes = merge({}, this.attributes);
                    // if rewrite mode enabled, we replace value referenced by path with
                    // the new one (we don't merge).
                    opt.rewrite && unsetByPath(baseAttributes, path, '/');

                    // Merge update with the model attributes.
                    var attributes$$1 = merge(baseAttributes, update);
                    // Finally, set the property to the updated attributes.
                    return this.set(property, attributes$$1[property], opt);

                } else {

                    return getByPath(this.attributes, props, delim);
                }
            }

            return this.set(merge({}, this.attributes, props), value);
        },

        // A convenient way to unset nested properties
        removeProp: function(path, opt) {

            opt = opt || {};

            var pathArray = Array.isArray(path) ? path : path.split('/');

            // Once a property is removed from the `attrs` attribute
            // the cellView will recognize a `dirty` flag and re-render itself
            // in order to remove the attribute from SVG element.
            var property = pathArray[0];
            if (property === 'attrs') { opt.dirty = true; }

            if (pathArray.length === 1) {
                // A top level property
                return this.unset(path, opt);
            }

            // A nested property
            var nestedPath = pathArray.slice(1);
            var propertyValue = cloneDeep(this.get(property));

            unsetByPath(propertyValue, nestedPath, '/');

            return this.set(property, propertyValue, opt);
        },

        // A convenient way to set nested attributes.
        attr: function(attrs, value, opt) {

            var args = Array.from(arguments);
            if (args.length === 0) {
                return this.get('attrs');
            }

            if (Array.isArray(attrs)) {
                args[0] = ['attrs'].concat(attrs);
            } else if (isString(attrs)) {
                // Get/set an attribute by a special path syntax that delimits
                // nested objects by the colon character.
                args[0] = 'attrs/' + attrs;

            } else {

                args[0] = { 'attrs' : attrs };
            }

            return this.prop.apply(this, args);
        },

        // A convenient way to unset nested attributes
        removeAttr: function(path, opt) {

            if (Array.isArray(path)) {

                return this.removeProp(['attrs'].concat(path));
            }

            return this.removeProp('attrs/' + path, opt);
        },

        transition: function(path, value, opt, delim) {

            delim = delim || '/';

            var defaults$$1 = {
                duration: 100,
                delay: 10,
                timingFunction: timing.linear,
                valueFunction: interpolate.number
            };

            opt = assign(defaults$$1, opt);

            var firstFrameTime = 0;
            var interpolatingFunction;

            var setter = function(runtime) {

                var id, progress, propertyValue;

                firstFrameTime = firstFrameTime || runtime;
                runtime -= firstFrameTime;
                progress = runtime / opt.duration;

                if (progress < 1) {
                    this._transitionIds[path] = id = nextFrame(setter);
                } else {
                    progress = 1;
                    delete this._transitionIds[path];
                }

                propertyValue = interpolatingFunction(opt.timingFunction(progress));

                opt.transitionId = id;

                this.prop(path, propertyValue, opt);

                if (!id) { this.trigger('transition:end', this, path); }

            }.bind(this);

            var initiator = function(callback) {

                this.stopTransitions(path);

                interpolatingFunction = opt.valueFunction(getByPath(this.attributes, path, delim), value);

                this._transitionIds[path] = nextFrame(callback);

                this.trigger('transition:start', this, path);

            }.bind(this);

            return setTimeout(initiator, opt.delay, setter);
        },

        getTransitions: function() {

            return Object.keys(this._transitionIds);
        },

        stopTransitions: function(path, delim) {

            delim = delim || '/';

            var pathArray = path && path.split(delim);

            Object.keys(this._transitionIds).filter(pathArray && function(key) {

                return isEqual(pathArray, key.split(delim).slice(0, pathArray.length));

            }).forEach(function(key) {

                cancelFrame(this._transitionIds[key]);

                delete this._transitionIds[key];

                this.trigger('transition:end', this, key);

            }, this);

            return this;
        },

        // A shorcut making it easy to create constructs like the following:
        // `var el = (new joint.shapes.basic.Rect).addTo(graph)`.
        addTo: function(graph, opt) {

            graph.addCell(this, opt);
            return this;
        },

        // A shortcut for an equivalent call: `paper.findViewByModel(cell)`
        // making it easy to create constructs like the following:
        // `cell.findView(paper).highlight()`
        findView: function(paper) {

            return paper.findViewByModel(this);
        },

        isElement: function() {

            return false;
        },

        isLink: function() {

            return false;
        },

        startBatch: function(name, opt) {

            if (this.graph) { this.graph.startBatch(name, assign({}, opt, { cell: this })); }
            return this;
        },

        stopBatch: function(name, opt) {

            if (this.graph) { this.graph.stopBatch(name, assign({}, opt, { cell: this })); }
            return this;
        },

        getChangeFlag: function(attributes$$1) {

            var flag = 0;
            if (!attributes$$1) { return flag; }
            for (var key in attributes$$1) {
                if (!attributes$$1.hasOwnProperty(key) || !this.hasChanged(key)) { continue; }
                flag |= attributes$$1[key];
            }
            return flag;
        },

        angle: function() {

            // To be overridden.
            return 0;
        },

        position: function() {

            // To be overridden.
            return new g.Point(0, 0);
        },

        getPointFromConnectedLink: function() {

            // To be overridden
            return new g.Point();
        },

        getBBox: function() {

            // To be overridden
            return new g.Rect(0, 0, 0, 0);
        }

    }, {

        getAttributeDefinition: function(attrName) {

            var defNS = this.attributes;
            var globalDefNS = attributes;
            return (defNS && defNS[attrName]) || globalDefNS[attrName];
        },

        define: function(type, defaults$$1, protoProps, staticProps) {

            protoProps = assign({
                defaults: defaultsDeep({ type: type }, defaults$$1, this.prototype.defaults)
            }, protoProps);

            var Cell = this.extend(protoProps, staticProps);
            // es5 backward compatibility
            if (typeof joint !== 'undefined' && has(joint, 'shapes')) {
                setByPath(joint.shapes, type, Cell, '.');
            }
            return Cell;
        }
    });

    function portTransformAttrs(point, angle, opt) {

        var trans = point.toJSON();

        trans.angle = angle || 0;

        return defaults({}, opt, trans);
    }

    function lineLayout(ports, p1, p2) {
        return ports.map(function(port, index, ports) {
            var p = this.pointAt(((index + 0.5) / ports.length));
            // `dx`,`dy` per port offset option
            if (port.dx || port.dy) {
                p.offset(port.dx || 0, port.dy || 0);
            }

            return portTransformAttrs(p.round(), 0, port);
        }, g$1.line(p1, p2));
    }

    function ellipseLayout(ports, elBBox, startAngle, stepFn) {

        var center = elBBox.center();
        var ratio = elBBox.width / elBBox.height;
        var p1 = elBBox.topMiddle();

        var ellipse = g$1.Ellipse.fromRect(elBBox);

        return ports.map(function(port, index, ports) {

            var angle = startAngle + stepFn(index, ports.length);
            var p2 = p1.clone()
                .rotate(center, -angle)
                .scale(ratio, 1, center);

            var theta = port.compensateRotation ? -ellipse.tangentTheta(p2) : 0;

            // `dx`,`dy` per port offset option
            if (port.dx || port.dy) {
                p2.offset(port.dx || 0, port.dy || 0);
            }

            // `dr` delta radius option
            if (port.dr) {
                p2.move(center, port.dr);
            }

            return portTransformAttrs(p2.round(), theta, port);
        });
    }

    // Creates a point stored in arguments
    function argPoint(bbox, args) {

        var x = args.x;
        if (isString(x)) {
            x = parseFloat(x) / 100 * bbox.width;
        }

        var y = args.y;
        if (isString(y)) {
            y = parseFloat(y) / 100 * bbox.height;
        }

        return g$1.point(x || 0, y || 0);
    }


    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt opt Group options
     * @returns {Array<g.Point>}
     */
    var absolute = function(ports, elBBox, opt) {
        //TODO v.talas angle
        return ports.map(argPoint.bind(null, elBBox));
    };

    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt opt Group options
     * @returns {Array<g.Point>}
     */
    var fn = function(ports, elBBox, opt) {
        return opt.fn(ports, elBBox, opt);
    };

    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt opt Group options
     * @returns {Array<g.Point>}
     */
    var line = function(ports, elBBox, opt) {

        var start = argPoint(elBBox, opt.start || elBBox.origin());
        var end = argPoint(elBBox, opt.end || elBBox.corner());

        return lineLayout(ports, start, end);
    };

    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt opt Group options
     * @returns {Array<g.Point>}
     */
    var left = function(ports, elBBox, opt) {
        return lineLayout(ports, elBBox.origin(), elBBox.bottomLeft());
    };

    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt opt Group options
     * @returns {Array<g.Point>}
     */
    var right = function(ports, elBBox, opt) {
        return lineLayout(ports, elBBox.topRight(), elBBox.corner());
    };

    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt opt Group options
     * @returns {Array<g.Point>}
     */
    var top = function(ports, elBBox, opt) {
        return lineLayout(ports, elBBox.origin(), elBBox.topRight());
    };

    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt opt Group options
     * @returns {Array<g.Point>}
     */
    var bottom = function(ports, elBBox, opt) {
        return lineLayout(ports, elBBox.bottomLeft(), elBBox.corner());
    };

    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt Group options
     * @returns {Array<g.Point>}
     */
    var ellipseSpread = function(ports, elBBox, opt) {

        var startAngle = opt.startAngle || 0;
        var stepAngle = opt.step || 360 / ports.length;

        return ellipseLayout(ports, elBBox, startAngle, function(index) {
            return index * stepAngle;
        });
    };

    /**
     * @param {Array<Object>} ports
     * @param {g.Rect} elBBox
     * @param {Object=} opt Group options
     * @returns {Array<g.Point>}
     */
    var ellipse = function(ports, elBBox, opt) {

        var startAngle = opt.startAngle || 0;
        var stepAngle = opt.step || 20;

        return ellipseLayout(ports, elBBox, startAngle, function(index, count) {
            return (index + 0.5 - count / 2) * stepAngle;
        });
    };

    var Port = /*#__PURE__*/Object.freeze({
        absolute: absolute,
        fn: fn,
        line: line,
        left: left,
        right: right,
        top: top,
        bottom: bottom,
        ellipseSpread: ellipseSpread,
        ellipse: ellipse
    });

    function labelAttributes(opt1, opt2) {

        return defaultsDeep({}, opt1, opt2, {
            x: 0,
            y: 0,
            angle: 0,
            attrs: {
                '.': {
                    y: '0',
                    'text-anchor': 'start'
                }
            }
        });
    }

    function outsideLayout(portPosition, elBBox, autoOrient, opt) {

        opt = defaults({}, opt, { offset: 15 });
        var angle = elBBox.center().theta(portPosition);
        var x = getBBoxAngles(elBBox);

        var tx, ty, y, textAnchor;
        var offset = opt.offset;
        var orientAngle = 0;

        if (angle < x[1] || angle > x[2]) {
            y = '.3em';
            tx = offset;
            ty = 0;
            textAnchor = 'start';
        } else if (angle < x[0]) {
            y = '0';
            tx = 0;
            ty = -offset;
            if (autoOrient) {
                orientAngle = -90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        } else if (angle < x[3]) {
            y = '.3em';
            tx = -offset;
            ty = 0;
            textAnchor = 'end';
        } else {
            y = '.6em';
            tx = 0;
            ty = offset;
            if (autoOrient) {
                orientAngle = 90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        }

        var round = Math.round;
        return labelAttributes({
            x: round(tx),
            y: round(ty),
            angle: orientAngle,
            attrs: {
                '.': {
                    y: y,
                    'text-anchor': textAnchor
                }
            }
        });
    }

    function getBBoxAngles(elBBox) {

        var center = elBBox.center();

        var tl = center.theta(elBBox.origin());
        var bl = center.theta(elBBox.bottomLeft());
        var br = center.theta(elBBox.corner());
        var tr = center.theta(elBBox.topRight());

        return [tl, tr, br, bl];
    }

    function insideLayout(portPosition, elBBox, autoOrient, opt) {

        var angle = elBBox.center().theta(portPosition);
        opt = defaults({}, opt, { offset: 15 });

        var tx, ty, y, textAnchor;
        var offset = opt.offset;
        var orientAngle = 0;

        var bBoxAngles = getBBoxAngles(elBBox);

        if (angle < bBoxAngles[1] || angle > bBoxAngles[2]) {
            y = '.3em';
            tx = -offset;
            ty = 0;
            textAnchor = 'end';
        } else if (angle < bBoxAngles[0]) {
            y = '.6em';
            tx = 0;
            ty = offset;
            if (autoOrient) {
                orientAngle = 90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        } else if (angle < bBoxAngles[3]) {
            y = '.3em';
            tx = offset;
            ty = 0;
            textAnchor = 'start';
        } else {
            y = '0em';
            tx = 0;
            ty = -offset;
            if (autoOrient) {
                orientAngle = -90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        }

        var round = Math.round;
        return labelAttributes({
            x: round(tx),
            y: round(ty),
            angle: orientAngle,
            attrs: {
                '.': {
                    y: y,
                    'text-anchor': textAnchor
                }
            }
        });
    }

    function radialLayout(portCenterOffset, autoOrient, opt) {

        opt = defaults({}, opt, { offset: 20 });

        var origin = g$1.point(0, 0);
        var angle = -portCenterOffset.theta(origin);
        var orientAngle = angle;
        var offset = portCenterOffset.clone()
            .move(origin, opt.offset)
            .difference(portCenterOffset)
            .round();

        var y = '.3em';
        var textAnchor;

        if ((angle + 90) % 180 === 0) {
            textAnchor = autoOrient ? 'end' : 'middle';
            if (!autoOrient && angle === -270) {
                y = '0em';
            }
        } else if (angle > -270 && angle < -90) {
            textAnchor = 'start';
            orientAngle = angle - 180;
        } else {
            textAnchor = 'end';
        }

        var round = Math.round;
        return labelAttributes({
            x: round(offset.x),
            y: round(offset.y),
            angle: autoOrient ? orientAngle : 0,
            attrs: {
                '.': {
                    y: y,
                    'text-anchor': textAnchor
                }
            }
        });
    }

    var manual = function(portPosition, elBBox, opt) {
        return labelAttributes(opt, elBBox);
    };

    var left$1 = function(portPosition, elBBox, opt) {
        return labelAttributes(opt, { x: -15, attrs: { '.': { y: '.3em', 'text-anchor': 'end' }}});
    };

    var right$1 = function(portPosition, elBBox, opt) {
        return labelAttributes(opt, { x: 15, attrs: { '.': { y: '.3em', 'text-anchor': 'start' }}});
    };

    var top$1 = function(portPosition, elBBox, opt) {
        return labelAttributes(opt, { y: -15, attrs: { '.': { 'text-anchor': 'middle' }}});
    };

    var bottom$1 = function(portPosition, elBBox, opt) {
        return labelAttributes(opt, { y: 15, attrs: { '.': { y: '.6em', 'text-anchor': 'middle' }}});
    };

    var outsideOriented = function(portPosition, elBBox, opt) {
        return outsideLayout(portPosition, elBBox, true, opt);
    };

    var outside = function(portPosition, elBBox, opt) {
        return outsideLayout(portPosition, elBBox, false, opt);
    };

    var insideOriented = function(portPosition, elBBox, opt) {
        return insideLayout(portPosition, elBBox, true, opt);
    };

    var inside = function(portPosition, elBBox, opt) {
        return insideLayout(portPosition, elBBox, false, opt);
    };

    var radial = function(portPosition, elBBox, opt) {
        return radialLayout(portPosition.difference(elBBox.center()), false, opt);
    };

    var radialOriented = function(portPosition, elBBox, opt) {
        return radialLayout(portPosition.difference(elBBox.center()), true, opt);
    };

    var PortLabel = /*#__PURE__*/Object.freeze({
        manual: manual,
        left: left$1,
        right: right$1,
        top: top$1,
        bottom: bottom$1,
        outsideOriented: outsideOriented,
        outside: outside,
        insideOriented: insideOriented,
        inside: inside,
        radial: radial,
        radialOriented: radialOriented
    });

    var PortData = function(data) {

        var clonedData = cloneDeep(data) || {};
        this.ports = [];
        this.groups = {};
        this.portLayoutNamespace = Port;
        this.portLabelLayoutNamespace = PortLabel;

        this._init(clonedData);
    };

    PortData.prototype = {

        getPorts: function() {
            return this.ports;
        },

        getGroup: function(name) {
            return this.groups[name] || {};
        },

        getPortsByGroup: function(groupName) {

            return this.ports.filter(function(port) {
                return port.group === groupName;
            });
        },

        getGroupPortsMetrics: function(groupName, elBBox) {

            var group = this.getGroup(groupName);
            var ports = this.getPortsByGroup(groupName);

            var groupPosition = group.position || {};
            var groupPositionName = groupPosition.name;
            var namespace = this.portLayoutNamespace;
            if (!namespace[groupPositionName]) {
                groupPositionName = 'left';
            }

            var groupArgs = groupPosition.args || {};
            var portsArgs = ports.map(function(port) {
                return port && port.position && port.position.args;
            });
            var groupPortTransformations = namespace[groupPositionName](portsArgs, elBBox, groupArgs);

            var accumulator = {
                ports: ports,
                result: []
            };

            toArray(groupPortTransformations).reduce(function(res, portTransformation, index) {
                var port = res.ports[index];
                res.result.push({
                    portId: port.id,
                    portTransformation: portTransformation,
                    labelTransformation: this._getPortLabelLayout(port, g$1.Point(portTransformation), elBBox),
                    portAttrs: port.attrs,
                    portSize: port.size,
                    labelSize: port.label.size
                });
                return res;
            }.bind(this), accumulator);

            return accumulator.result;
        },

        _getPortLabelLayout: function(port, portPosition, elBBox) {

            var namespace = this.portLabelLayoutNamespace;
            var labelPosition = port.label.position.name || 'left';

            if (namespace[labelPosition]) {
                return namespace[labelPosition](portPosition, elBBox, port.label.position.args);
            }

            return null;
        },

        _init: function(data) {

            // prepare groups
            if (isObject(data.groups)) {
                var groups = Object.keys(data.groups);
                for (var i = 0, n = groups.length; i < n; i++) {
                    var key = groups[i];
                    this.groups[key] = this._evaluateGroup(data.groups[key]);
                }
            }

            // prepare ports
            var ports = toArray(data.items);
            for (var j = 0, m = ports.length; j < m; j++) {
                this.ports.push(this._evaluatePort(ports[j]));
            }
        },

        _evaluateGroup: function(group) {

            return merge(group, {
                position: this._getPosition(group.position, true),
                label: this._getLabel(group, true)
            });
        },

        _evaluatePort: function(port) {

            var evaluated = assign({}, port);

            var group = this.getGroup(port.group);

            evaluated.markup = evaluated.markup || group.markup;
            evaluated.attrs = merge({}, group.attrs, evaluated.attrs);
            evaluated.position = this._createPositionNode(group, evaluated);
            evaluated.label = merge({}, group.label, this._getLabel(evaluated));
            evaluated.z = this._getZIndex(group, evaluated);
            evaluated.size = assign({}, group.size, evaluated.size);

            return evaluated;
        },

        _getZIndex: function(group, port) {

            if (isNumber(port.z)) {
                return port.z;
            }
            if (isNumber(group.z) || group.z === 'auto') {
                return group.z;
            }
            return 'auto';
        },

        _createPositionNode: function(group, port) {

            return merge({
                name: 'left',
                args: {}
            }, group.position, { args: port.args });
        },

        _getPosition: function(position, setDefault) {

            var args = {};
            var positionName;

            if (isFunction(position)) {
                positionName = 'fn';
                args.fn = position;
            } else if (isString(position)) {
                positionName = position;
            } else if (position === undefined) {
                positionName = setDefault ? 'left' : null;
            } else if (Array.isArray(position)) {
                positionName = 'absolute';
                args.x = position[0];
                args.y = position[1];
            } else if (isObject(position)) {
                positionName = position.name;
                assign(args, position.args);
            }

            var result$$1 = { args: args };

            if (positionName) {
                result$$1.name = positionName;
            }
            return result$$1;
        },

        _getLabel: function(item, setDefaults) {

            var label = item.label || {};

            var ret = label;
            ret.position = this._getPosition(label.position, setDefaults);

            return ret;
        }
    };

    var elementPortPrototype = {

        _initializePorts: function() {

            this._createPortData();
            this.on('change:ports', function() {

                this._processRemovedPort();
                this._createPortData();
            }, this);
        },

        /**
         * remove links tied wiht just removed element
         * @private
         */
        _processRemovedPort: function() {

            var current = this.get('ports') || {};
            var currentItemsMap = {};

            toArray(current.items).forEach(function(item) {
                currentItemsMap[item.id] = true;
            });

            var previous = this.previous('ports') || {};
            var removed = {};

            toArray(previous.items).forEach(function(item) {
                if (!currentItemsMap[item.id]) {
                    removed[item.id] = true;
                }
            });

            var graph = this.graph;
            if (graph && !isEmpty(removed)) {

                var inboundLinks = graph.getConnectedLinks(this, { inbound: true });
                inboundLinks.forEach(function(link) {

                    if (removed[link.get('target').port]) { link.remove(); }
                });

                var outboundLinks = graph.getConnectedLinks(this, { outbound: true });
                outboundLinks.forEach(function(link) {

                    if (removed[link.get('source').port]) { link.remove(); }
                });
            }
        },

        /**
         * @returns {boolean}
         */
        hasPorts: function() {

            var ports = this.prop('ports/items');
            return Array.isArray(ports) && ports.length > 0;
        },

        /**
         * @param {string} id
         * @returns {boolean}
         */
        hasPort: function(id) {

            return this.getPortIndex(id) !== -1;
        },

        /**
         * @returns {Array<object>}
         */
        getPorts: function() {

            return cloneDeep(this.prop('ports/items')) || [];
        },

        /**
         * @param {string} id
         * @returns {object}
         */
        getPort: function(id) {

            return cloneDeep(toArray(this.prop('ports/items')).find(function(port) {
                return port.id && port.id === id;
            }));
        },

        /**
         * @param {string} groupName
         * @returns {Object<portId, {x: number, y: number, angle: number}>}
         */
        getPortsPositions: function(groupName) {

            var portsMetrics = this._portSettingsData.getGroupPortsMetrics(groupName, g$1.Rect(this.size()));

            return portsMetrics.reduce(function(positions, metrics) {
                var transformation = metrics.portTransformation;
                positions[metrics.portId] = {
                    x: transformation.x,
                    y: transformation.y,
                    angle: transformation.angle
                };
                return positions;
            }, {});
        },

        /**
         * @param {string|Port} port port id or port
         * @returns {number} port index
         */
        getPortIndex: function(port) {

            var id = isObject(port) ? port.id : port;

            if (!this._isValidPortId(id)) {
                return -1;
            }

            return toArray(this.prop('ports/items')).findIndex(function(item) {
                return item.id === id;
            });
        },

        /**
         * @param {object} port
         * @param {object} [opt]
         * @returns {joint.dia.Element}
         */
        addPort: function(port, opt) {

            if (!isObject(port) || Array.isArray(port)) {
                throw new Error('Element: addPort requires an object.');
            }

            var ports = assign([], this.prop('ports/items'));
            ports.push(port);
            this.prop('ports/items', ports, opt);

            return this;
        },

        /**
         * @param {string} portId
         * @param {string|object=} path
         * @param {*=} value
         * @param {object=} opt
         * @returns {joint.dia.Element}
         */
        portProp: function(portId, path, value, opt) {

            var index = this.getPortIndex(portId);

            if (index === -1) {
                throw new Error('Element: unable to find port with id ' + portId);
            }

            var args = Array.prototype.slice.call(arguments, 1);
            if (Array.isArray(path)) {
                args[0] = ['ports', 'items', index].concat(path);
            } else if (isString(path)) {

                // Get/set an attribute by a special path syntax that delimits
                // nested objects by the colon character.
                args[0] = ['ports/items/', index, '/', path].join('');

            } else {

                args = ['ports/items/' + index];
                if (isPlainObject(path)) {
                    args.push(path);
                    args.push(value);
                }
            }

            return this.prop.apply(this, args);
        },

        _validatePorts: function() {

            var portsAttr = this.get('ports') || {};

            var errorMessages = [];
            portsAttr = portsAttr || {};
            var ports = toArray(portsAttr.items);

            ports.forEach(function(p) {

                if (typeof p !== 'object') {
                    errorMessages.push('Element: invalid port ', p);
                }

                if (!this._isValidPortId(p.id)) {
                    p.id = this.generatePortId();
                }
            }, this);

            if (uniq(ports, 'id').length !== ports.length) {
                errorMessages.push('Element: found id duplicities in ports.');
            }

            return errorMessages;
        },

        generatePortId: function() {
            return this.generateId();
        },

        /**
         * @param {string} id port id
         * @returns {boolean}
         * @private
         */
        _isValidPortId: function(id) {

            return id !== null && id !== undefined && !isObject(id);
        },

        addPorts: function(ports, opt) {

            if (ports.length) {
                this.prop('ports/items', assign([], this.prop('ports/items')).concat(ports), opt);
            }

            return this;
        },

        removePort: function(port, opt) {

            var options = opt || {};
            var ports = assign([], this.prop('ports/items'));

            var index = this.getPortIndex(port);

            if (index !== -1) {
                ports.splice(index, 1);
                options.rewrite = true;
                this.prop('ports/items', ports, options);
            }

            return this;
        },

        removePorts: function(portsForRemoval, opt) {

            var options;

            if (Array.isArray(portsForRemoval)) {
                options = opt || {};

                if (portsForRemoval.length) {
                    options.rewrite = true;
                    var currentPorts = assign([], this.prop('ports/items'));
                    var remainingPorts = currentPorts.filter(function(cp) {
                        return !portsForRemoval.some(function(rp) {
                            var rpId = isObject(rp) ? rp.id : rp;
                            return cp.id === rpId;
                        });
                    });
                    this.prop('ports/items', remainingPorts, options);
                }
            } else {
                options = portsForRemoval || {};
                options.rewrite = true;
                this.prop('ports/items', [], options);
            }

            return this;
        },

        /**
         * @private
         */
        _createPortData: function() {

            var err = this._validatePorts();

            if (err.length > 0) {
                this.set('ports', this.previous('ports'));
                throw new Error(err.join(' '));
            }

            var prevPortData;

            if (this._portSettingsData) {

                prevPortData = this._portSettingsData.getPorts();
            }

            this._portSettingsData = new PortData(this.get('ports'));

            var curPortData = this._portSettingsData.getPorts();

            if (prevPortData) {

                var added = curPortData.filter(function(item) {
                    if (!prevPortData.find(function(prevPort) {
                        return prevPort.id === item.id;
                    })) {
                        return item;
                    }
                });

                var removed = prevPortData.filter(function(item) {
                    if (!curPortData.find(function(curPort) {
                        return curPort.id === item.id;
                    })) {
                        return item;
                    }
                });

                if (removed.length > 0) {
                    this.trigger('ports:remove', this, removed);
                }

                if (added.length > 0) {
                    this.trigger('ports:add', this, added);
                }
            }
        }
    };

    // Element base model.
    // -----------------------------

    var Element = Cell.extend({

        defaults: {
            position: { x: 0, y: 0 },
            size: { width: 1, height: 1 },
            angle: 0
        },

        initialize: function() {

            this._initializePorts();
            Cell.prototype.initialize.apply(this, arguments);
        },

        /**
         * @abstract
         */
        _initializePorts: function() {
            // implemented in ports.js
        },

        _refreshPorts: function() {
            // implemented in ports.js
        },

        isElement: function() {

            return true;
        },

        position: function(x, y, opt) {

            var isSetter = isNumber(y);

            opt = (isSetter ? opt : x) || {};

            // option `parentRelative` for setting the position relative to the element's parent.
            if (opt.parentRelative) {

                // Getting the parent's position requires the collection.
                // Cell.parent() holds cell id only.
                if (!this.graph) { throw new Error('Element must be part of a graph.'); }

                var parent = this.getParentCell();
                var parentPosition = parent && !parent.isLink()
                    ? parent.get('position')
                    : { x: 0, y: 0 };
            }

            if (isSetter) {

                if (opt.parentRelative) {
                    x += parentPosition.x;
                    y += parentPosition.y;
                }

                if (opt.deep) {
                    var currentPosition = this.get('position');
                    this.translate(x - currentPosition.x, y - currentPosition.y, opt);
                } else {
                    this.set('position', { x: x, y: y }, opt);
                }

                return this;

            } else { // Getter returns a geometry point.

                var elementPosition = g$1.Point(this.get('position'));

                return opt.parentRelative
                    ? elementPosition.difference(parentPosition)
                    : elementPosition;
            }
        },

        translate: function(tx, ty, opt) {

            tx = tx || 0;
            ty = ty || 0;

            if (tx === 0 && ty === 0) {
                // Like nothing has happened.
                return this;
            }

            opt = opt || {};
            // Pass the initiator of the translation.
            opt.translateBy = opt.translateBy || this.id;

            var position = this.get('position') || { x: 0, y: 0 };

            if (opt.restrictedArea && opt.translateBy === this.id) {

                // We are restricting the translation for the element itself only. We get
                // the bounding box of the element including all its embeds.
                // All embeds have to be translated the exact same way as the element.
                var bbox = this.getBBox({ deep: true });
                var ra = opt.restrictedArea;
                //- - - - - - - - - - - - -> ra.x + ra.width
                // - - - -> position.x      |
                // -> bbox.x
                //                ▓▓▓▓▓▓▓   |
                //         ░░░░░░░▓▓▓▓▓▓▓
                //         ░░░░░░░░░        |
                //   ▓▓▓▓▓▓▓▓░░░░░░░
                //   ▓▓▓▓▓▓▓▓               |
                //   <-dx->                     | restricted area right border
                //         <-width->        |   ░ translated element
                //   <- - bbox.width - ->       ▓ embedded element
                var dx = position.x - bbox.x;
                var dy = position.y - bbox.y;
                // Find the maximal/minimal coordinates that the element can be translated
                // while complies the restrictions.
                var x = Math.max(ra.x + dx, Math.min(ra.x + ra.width + dx - bbox.width, position.x + tx));
                var y = Math.max(ra.y + dy, Math.min(ra.y + ra.height + dy - bbox.height, position.y + ty));
                // recalculate the translation taking the restrictions into account.
                tx = x - position.x;
                ty = y - position.y;
            }

            var translatedPosition = {
                x: position.x + tx,
                y: position.y + ty
            };

            // To find out by how much an element was translated in event 'change:position' handlers.
            opt.tx = tx;
            opt.ty = ty;

            if (opt.transition) {

                if (!isObject(opt.transition)) { opt.transition = {}; }

                this.transition('position', translatedPosition, assign({}, opt.transition, {
                    valueFunction: interpolate.object
                }));

                // Recursively call `translate()` on all the embeds cells.
                invoke(this.getEmbeddedCells(), 'translate', tx, ty, opt);

            } else {

                this.startBatch('translate', opt);
                this.set('position', translatedPosition, opt);
                invoke(this.getEmbeddedCells(), 'translate', tx, ty, opt);
                this.stopBatch('translate', opt);
            }

            return this;
        },

        size: function(width, height, opt) {

            var currentSize = this.get('size');
            // Getter
            // () signature
            if (width === undefined) {
                return {
                    width: currentSize.width,
                    height: currentSize.height
                };
            }
            // Setter
            // (size, opt) signature
            if (isObject(width)) {
                opt = height;
                height = isNumber(width.height) ? width.height : currentSize.height;
                width = isNumber(width.width) ? width.width : currentSize.width;
            }

            return this.resize(width, height, opt);
        },

        resize: function(width, height, opt) {

            opt = opt || {};

            this.startBatch('resize', opt);

            if (opt.direction) {

                var currentSize = this.get('size');

                switch (opt.direction) {

                    case 'left':
                    case 'right':
                        // Don't change height when resizing horizontally.
                        height = currentSize.height;
                        break;

                    case 'top':
                    case 'bottom':
                        // Don't change width when resizing vertically.
                        width = currentSize.width;
                        break;
                }

                // Get the angle and clamp its value between 0 and 360 degrees.
                var angle = g$1.normalizeAngle(this.get('angle') || 0);

                var quadrant = {
                    'top-right': 0,
                    'right': 0,
                    'top-left': 1,
                    'top': 1,
                    'bottom-left': 2,
                    'left': 2,
                    'bottom-right': 3,
                    'bottom': 3
                }[opt.direction];

                if (opt.absolute) {

                    // We are taking the element's rotation into account
                    quadrant += Math.floor((angle + 45) / 90);
                    quadrant %= 4;
                }

                // This is a rectangle in size of the un-rotated element.
                var bbox = this.getBBox();

                // Pick the corner point on the element, which meant to stay on its place before and
                // after the rotation.
                var fixedPoint = bbox[['bottomLeft', 'corner', 'topRight', 'origin'][quadrant]]();

                // Find  an image of the previous indent point. This is the position, where is the
                // point actually located on the screen.
                var imageFixedPoint = g$1.Point(fixedPoint).rotate(bbox.center(), -angle);

                // Every point on the element rotates around a circle with the centre of rotation
                // in the middle of the element while the whole element is being rotated. That means
                // that the distance from a point in the corner of the element (supposed its always rect) to
                // the center of the element doesn't change during the rotation and therefore it equals
                // to a distance on un-rotated element.
                // We can find the distance as DISTANCE = (ELEMENTWIDTH/2)^2 + (ELEMENTHEIGHT/2)^2)^0.5.
                var radius = Math.sqrt((width * width) + (height * height)) / 2;

                // Now we are looking for an angle between x-axis and the line starting at image of fixed point
                // and ending at the center of the element. We call this angle `alpha`.

                // The image of a fixed point is located in n-th quadrant. For each quadrant passed
                // going anti-clockwise we have to add 90 degrees. Note that the first quadrant has index 0.
                //
                // 3 | 2
                // --c-- Quadrant positions around the element's center `c`
                // 0 | 1
                //
                var alpha = quadrant * Math.PI / 2;

                // Add an angle between the beginning of the current quadrant (line parallel with x-axis or y-axis
                // going through the center of the element) and line crossing the indent of the fixed point and the center
                // of the element. This is the angle we need but on the un-rotated element.
                alpha += Math.atan(quadrant % 2 == 0 ? height / width : width / height);

                // Lastly we have to deduct the original angle the element was rotated by and that's it.
                alpha -= g$1.toRad(angle);

                // With this angle and distance we can easily calculate the centre of the un-rotated element.
                // Note that fromPolar constructor accepts an angle in radians.
                var center = g$1.Point.fromPolar(radius, alpha, imageFixedPoint);

                // The top left corner on the un-rotated element has to be half a width on the left
                // and half a height to the top from the center. This will be the origin of rectangle
                // we were looking for.
                var origin = g$1.Point(center).offset(width / -2, height / -2);

                // Resize the element (before re-positioning it).
                this.set('size', { width: width, height: height }, opt);

                // Finally, re-position the element.
                this.position(origin.x, origin.y, opt);

            } else {

                // Resize the element.
                this.set('size', { width: width, height: height }, opt);
            }

            this.stopBatch('resize', opt);

            return this;
        },

        scale: function(sx, sy, origin, opt) {

            var scaledBBox = this.getBBox().scale(sx, sy, origin);
            this.startBatch('scale', opt);
            this.position(scaledBBox.x, scaledBBox.y, opt);
            this.resize(scaledBBox.width, scaledBBox.height, opt);
            this.stopBatch('scale');
            return this;
        },

        fitEmbeds: function(opt) {

            opt = opt || {};

            // Getting the children's size and position requires the collection.
            // Cell.get('embdes') helds an array of cell ids only.
            if (!this.graph) { throw new Error('Element must be part of a graph.'); }

            var embeddedCells = this.getEmbeddedCells();

            if (embeddedCells.length > 0) {

                this.startBatch('fit-embeds', opt);

                if (opt.deep) {
                    // Recursively apply fitEmbeds on all embeds first.
                    invoke(embeddedCells, 'fitEmbeds', opt);
                }

                // Compute cell's size and position  based on the children bbox
                // and given padding.
                var bbox = this.graph.getCellsBBox(embeddedCells);
                var padding = normalizeSides(opt.padding);

                // Apply padding computed above to the bbox.
                bbox.moveAndExpand({
                    x: -padding.left,
                    y: -padding.top,
                    width: padding.right + padding.left,
                    height: padding.bottom + padding.top
                });

                // Set new element dimensions finally.
                this.set({
                    position: { x: bbox.x, y: bbox.y },
                    size: { width: bbox.width, height: bbox.height }
                }, opt);

                this.stopBatch('fit-embeds');
            }

            return this;
        },

        // Rotate element by `angle` degrees, optionally around `origin` point.
        // If `origin` is not provided, it is considered to be the center of the element.
        // If `absolute` is `true`, the `angle` is considered is absolute, i.e. it is not
        // the difference from the previous angle.
        rotate: function(angle, absolute, origin, opt) {

            if (origin) {

                var center = this.getBBox().center();
                var size = this.get('size');
                var position = this.get('position');
                center.rotate(origin, this.get('angle') - angle);
                var dx = center.x - size.width / 2 - position.x;
                var dy = center.y - size.height / 2 - position.y;
                this.startBatch('rotate', { angle: angle, absolute: absolute, origin: origin });
                this.position(position.x + dx, position.y + dy, opt);
                this.rotate(angle, absolute, null, opt);
                this.stopBatch('rotate');

            } else {

                this.set('angle', absolute ? angle : (this.get('angle') + angle) % 360, opt);
            }

            return this;
        },

        angle: function() {
            return g$1.normalizeAngle(this.get('angle') || 0);
        },

        getBBox: function(opt) {

            opt = opt || {};

            if (opt.deep && this.graph) {

                // Get all the embedded elements using breadth first algorithm,
                // that doesn't use recursion.
                var elements = this.getEmbeddedCells({ deep: true, breadthFirst: true });
                // Add the model itself.
                elements.push(this);

                return this.graph.getCellsBBox(elements);
            }

            var position = this.get('position');
            var size = this.get('size');

            return new g$1.Rect(position.x, position.y, size.width, size.height);
        },

        getPointFromConnectedLink: function(link, endType) {
            // Center of the model
            var bbox = this.getBBox();
            var center = bbox.center();
            // Center of a port
            var endDef = link.get(endType);
            if (!endDef) { return center; }
            var portId = endDef.port;
            if (!portId) { return center; }
            var portGroup = this.portProp(portId, ['group']);
            var portsPositions = this.getPortsPositions(portGroup);
            var portCenter = new g$1.Point(portsPositions[portId]).offset(bbox.origin());
            var angle = this.angle();
            if (angle) { portCenter.rotate(center, -angle); }
            return portCenter;
        }
    });

    assign(Element.prototype, elementPortPrototype);

    // Link base model.
    // --------------------------

    var Link = Cell.extend({

        // The default markup for links.
        markup: [
            '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
            '<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
            '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
            '<path class="connection-wrap" d="M 0 0 0 0"/>',
            '<g class="labels"/>',
            '<g class="marker-vertices"/>',
            '<g class="marker-arrowheads"/>',
            '<g class="link-tools"/>'
        ].join(''),

        toolMarkup: [
            '<g class="link-tool">',
            '<g class="tool-remove" event="remove">',
            '<circle r="11" />',
            '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z" />',
            '<title>Remove link.</title>',
            '</g>',
            '<g class="tool-options" event="link:options">',
            '<circle r="11" transform="translate(25)"/>',
            '<path fill="white" transform="scale(.55) translate(29, -16)" d="M31.229,17.736c0.064-0.571,0.104-1.148,0.104-1.736s-0.04-1.166-0.104-1.737l-4.377-1.557c-0.218-0.716-0.504-1.401-0.851-2.05l1.993-4.192c-0.725-0.91-1.549-1.734-2.458-2.459l-4.193,1.994c-0.647-0.347-1.334-0.632-2.049-0.849l-1.558-4.378C17.165,0.708,16.588,0.667,16,0.667s-1.166,0.041-1.737,0.105L12.707,5.15c-0.716,0.217-1.401,0.502-2.05,0.849L6.464,4.005C5.554,4.73,4.73,5.554,4.005,6.464l1.994,4.192c-0.347,0.648-0.632,1.334-0.849,2.05l-4.378,1.557C0.708,14.834,0.667,15.412,0.667,16s0.041,1.165,0.105,1.736l4.378,1.558c0.217,0.715,0.502,1.401,0.849,2.049l-1.994,4.193c0.725,0.909,1.549,1.733,2.459,2.458l4.192-1.993c0.648,0.347,1.334,0.633,2.05,0.851l1.557,4.377c0.571,0.064,1.148,0.104,1.737,0.104c0.588,0,1.165-0.04,1.736-0.104l1.558-4.377c0.715-0.218,1.399-0.504,2.049-0.851l4.193,1.993c0.909-0.725,1.733-1.549,2.458-2.458l-1.993-4.193c0.347-0.647,0.633-1.334,0.851-2.049L31.229,17.736zM16,20.871c-2.69,0-4.872-2.182-4.872-4.871c0-2.69,2.182-4.872,4.872-4.872c2.689,0,4.871,2.182,4.871,4.872C20.871,18.689,18.689,20.871,16,20.871z"/>',
            '<title>Link options.</title>',
            '</g>',
            '</g>'
        ].join(''),

        doubleToolMarkup: undefined,

        // The default markup for showing/removing vertices. These elements are the children of the .marker-vertices element (see `this.markup`).
        // Only .marker-vertex and .marker-vertex-remove element have special meaning. The former is used for
        // dragging vertices (changing their position). The latter is used for removing vertices.
        vertexMarkup: [
            '<g class="marker-vertex-group" transform="translate(<%= x %>, <%= y %>)">',
            '<circle class="marker-vertex" idx="<%= idx %>" r="10" />',
            '<path class="marker-vertex-remove-area" idx="<%= idx %>" d="M16,5.333c-7.732,0-14,4.701-14,10.5c0,1.982,0.741,3.833,2.016,5.414L2,25.667l5.613-1.441c2.339,1.317,5.237,2.107,8.387,2.107c7.732,0,14-4.701,14-10.5C30,10.034,23.732,5.333,16,5.333z" transform="translate(5, -33)"/>',
            '<path class="marker-vertex-remove" idx="<%= idx %>" transform="scale(.8) translate(9.5, -37)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z">',
            '<title>Remove vertex.</title>',
            '</path>',
            '</g>'
        ].join(''),

        arrowheadMarkup: [
            '<g class="marker-arrowhead-group marker-arrowhead-group-<%= end %>">',
            '<path class="marker-arrowhead" end="<%= end %>" d="M 26 0 L 0 13 L 26 26 z" />',
            '</g>'
        ].join(''),

        // may be overwritten by user to change default label (its markup, attrs, position)
        defaultLabel: undefined,

        // deprecated
        // may be overwritten by user to change default label markup
        // lower priority than defaultLabel.markup
        labelMarkup: undefined,

        // private
        _builtins: {
            defaultLabel: {
                // builtin default markup:
                // used if neither defaultLabel.markup
                // nor label.markup is set
                markup: [
                    {
                        tagName: 'rect',
                        selector: 'rect' // faster than tagName CSS selector
                    }, {
                        tagName: 'text',
                        selector: 'text' // faster than tagName CSS selector
                    }
                ],
                // builtin default attributes:
                // applied only if builtin default markup is used
                attrs: {
                    text: {
                        fill: '#000000',
                        fontSize: 14,
                        textAnchor: 'middle',
                        yAlignment: 'middle',
                        pointerEvents: 'none'
                    },
                    rect: {
                        ref: 'text',
                        fill: '#ffffff',
                        rx: 3,
                        ry: 3,
                        refWidth: 1,
                        refHeight: 1,
                        refX: 0,
                        refY: 0
                    }
                },
                // builtin default position:
                // used if neither defaultLabel.position
                // nor label.position is set
                position: {
                    distance: 0.5
                }
            }
        },

        defaults: {
            type: 'link',
            source: {},
            target: {}
        },

        isLink: function() {

            return true;
        },

        disconnect: function(opt) {

            return this.set({
                source: { x: 0, y: 0 },
                target: { x: 0, y: 0 }
            }, opt);
        },

        source: function(source, args, opt) {

            // getter
            if (source === undefined) {
                return clone(this.get('source'));
            }

            // setter
            var setSource;
            var setOpt;

            // `source` is a cell
            // take only its `id` and combine with `args`
            var isCellProvided = source instanceof Cell;
            if (isCellProvided) { // three arguments
                setSource = clone(args) || {};
                setSource.id = source.id;
                setOpt = opt;
                return this.set('source', setSource, setOpt);
            }

            // `source` is a point-like object
            // for example, a g.Point
            // take only its `x` and `y` and combine with `args`
            var isPointProvided = !isPlainObject(source);
            if (isPointProvided) { // three arguments
                setSource = clone(args) || {};
                setSource.x = source.x;
                setSource.y = source.y;
                setOpt = opt;
                return this.set('source', setSource, setOpt);
            }

            // `source` is an object
            // no checking
            // two arguments
            setSource = source;
            setOpt = args;
            return this.set('source', setSource, setOpt);
        },

        target: function(target, args, opt) {

            // getter
            if (target === undefined) {
                return clone(this.get('target'));
            }

            // setter
            var setTarget;
            var setOpt;

            // `target` is a cell
            // take only its `id` argument and combine with `args`
            var isCellProvided = target instanceof Cell;
            if (isCellProvided) { // three arguments
                setTarget = clone(args) || {};
                setTarget.id = target.id;
                setOpt = opt;
                return this.set('target', setTarget, setOpt);
            }

            // `target` is a point-like object
            // for example, a g.Point
            // take only its `x` and `y` and combine with `args`
            var isPointProvided = !isPlainObject(target);
            if (isPointProvided) { // three arguments
                setTarget = clone(args) || {};
                setTarget.x = target.x;
                setTarget.y = target.y;
                setOpt = opt;
                return this.set('target', setTarget, setOpt);
            }

            // `target` is an object
            // no checking
            // two arguments
            setTarget = target;
            setOpt = args;
            return this.set('target', setTarget, setOpt);
        },

        router: function(name, args, opt) {

            // getter
            if (name === undefined) {
                var router = this.get('router');
                if (!router) {
                    if (this.get('manhattan')) { return { name: 'orthogonal' }; } // backwards compatibility
                    return null;
                }
                if (typeof router === 'object') { return clone(router); }
                return router; // e.g. a function
            }

            // setter
            var isRouterProvided = ((typeof name === 'object') || (typeof name === 'function'));
            var localRouter = isRouterProvided ? name : { name: name, args: args };
            var localOpt = isRouterProvided ? args : opt;

            return this.set('router', localRouter, localOpt);
        },

        connector: function(name, args, opt) {

            // getter
            if (name === undefined) {
                var connector = this.get('connector');
                if (!connector) {
                    if (this.get('smooth')) { return { name: 'smooth' }; } // backwards compatibility
                    return null;
                }
                if (typeof connector === 'object') { return clone(connector); }
                return connector; // e.g. a function
            }

            // setter
            var isConnectorProvided = ((typeof name === 'object' || typeof name === 'function'));
            var localConnector = isConnectorProvided ? name : { name: name, args: args };
            var localOpt = isConnectorProvided ? args : opt;

            return this.set('connector', localConnector, localOpt);
        },

        // Labels API

        // A convenient way to set labels. Currently set values will be mixined with `value` if used as a setter.
        label: function(idx, label, opt) {

            var labels = this.labels();

            idx = (isFinite(idx) && idx !== null) ? (idx | 0) : 0;
            if (idx < 0) { idx = labels.length + idx; }

            // getter
            if (arguments.length <= 1) { return this.prop(['labels', idx]); }
            // setter
            return this.prop(['labels', idx], label, opt);
        },

        labels: function(labels, opt) {

            // getter
            if (arguments.length === 0) {
                labels = this.get('labels');
                if (!Array.isArray(labels)) { return []; }
                return labels.slice();
            }
            // setter
            if (!Array.isArray(labels)) { labels = []; }
            return this.set('labels', labels, opt);
        },

        insertLabel: function(idx, label, opt) {

            if (!label) { throw new Error('dia.Link: no label provided'); }

            var labels = this.labels();
            var n = labels.length;
            idx = (isFinite(idx) && idx !== null) ? (idx | 0) : n;
            if (idx < 0) { idx = n + idx + 1; }

            labels.splice(idx, 0, label);
            return this.labels(labels, opt);
        },

        // convenience function
        // add label to end of labels array
        appendLabel: function(label, opt) {

            return this.insertLabel(-1, label, opt);
        },

        removeLabel: function(idx, opt) {

            var labels = this.labels();
            idx = (isFinite(idx) && idx !== null) ? (idx | 0) : -1;

            labels.splice(idx, 1);
            return this.labels(labels, opt);
        },

        // Vertices API

        vertex: function(idx, vertex, opt) {

            var vertices = this.vertices();

            idx = (isFinite(idx) && idx !== null) ? (idx | 0) : 0;
            if (idx < 0) { idx = vertices.length + idx; }

            // getter
            if (arguments.length <= 1) { return this.prop(['vertices', idx]); }

            // setter
            var setVertex = this._normalizeVertex(vertex);
            return this.prop(['vertices', idx], setVertex, opt);
        },

        vertices: function(vertices, opt) {

            // getter
            if (arguments.length === 0) {
                vertices = this.get('vertices');
                if (!Array.isArray(vertices)) { return []; }
                return vertices.slice();
            }

            // setter
            if (!Array.isArray(vertices)) { vertices = []; }
            var setVertices = [];
            for (var i = 0; i < vertices.length; i++) {
                var vertex = vertices[i];
                var setVertex = this._normalizeVertex(vertex);
                setVertices.push(setVertex);
            }
            return this.set('vertices', setVertices, opt);
        },

        insertVertex: function(idx, vertex, opt) {

            if (!vertex) { throw new Error('dia.Link: no vertex provided'); }

            var vertices = this.vertices();
            var n = vertices.length;
            idx = (isFinite(idx) && idx !== null) ? (idx | 0) : n;
            if (idx < 0) { idx = n + idx + 1; }

            var setVertex = this._normalizeVertex(vertex);
            vertices.splice(idx, 0, setVertex);
            return this.vertices(vertices, opt);
        },

        removeVertex: function(idx, opt) {

            var vertices = this.vertices();
            idx = (isFinite(idx) && idx !== null) ? (idx | 0) : -1;

            vertices.splice(idx, 1);
            return this.vertices(vertices, opt);
        },

        _normalizeVertex: function(vertex) {

            // is vertex a point-like object?
            // for example, a g.Point
            var isPointProvided = !isPlainObject(vertex);
            if (isPointProvided) { return { x: vertex.x, y: vertex.y }; }

            // else: return vertex unchanged
            return vertex;
        },

        // Transformations

        translate: function(tx, ty, opt) {

            // enrich the option object
            opt = opt || {};
            opt.translateBy = opt.translateBy || this.id;
            opt.tx = tx;
            opt.ty = ty;

            return this.applyToPoints(function(p) {
                return { x: (p.x || 0) + tx, y: (p.y || 0) + ty };
            }, opt);
        },

        scale: function(sx, sy, origin, opt) {

            return this.applyToPoints(function(p) {
                return g$1.Point(p).scale(sx, sy, origin).toJSON();
            }, opt);
        },

        applyToPoints: function(fn, opt) {

            if (!isFunction(fn)) {
                throw new TypeError('dia.Link: applyToPoints expects its first parameter to be a function.');
            }

            var attrs = {};

            var source = this.source();
            if (!source.id) {
                attrs.source = fn(source);
            }

            var target = this.target();
            if (!target.id) {
                attrs.target = fn(target);
            }

            var vertices = this.vertices();
            if (vertices.length > 0) {
                attrs.vertices = vertices.map(fn);
            }

            return this.set(attrs, opt);
        },

        getSourcePoint: function() {
            var sourceCell = this.getSourceCell();
            if (!sourceCell) { return new g$1.Point(this.source()); }
            return sourceCell.getPointFromConnectedLink(this, 'source');
        },

        getTargetPoint: function() {
            var targetCell = this.getTargetCell();
            if (!targetCell) { return new g$1.Point(this.target()); }
            return targetCell.getPointFromConnectedLink(this, 'target');
        },

        getPointFromConnectedLink: function(/* link, endType */) {
            return this.getPolyline().pointAt(0.5);
        },

        getPolyline: function() {
            var points = [this.getSourcePoint(), this.getTargetPoint()];
            var vertices = this.vertices();
            if (vertices.length > 0) {
                Array.prototype.push.apply(points, vertices.map(g$1.Point));
            }
            return new g$1.Polyline(points);
        },

        getBBox: function() {
            return this.getPolyline().bbox();
        },

        reparent: function(opt) {

            var newParent;

            if (this.graph) {

                var source = this.getSourceElement();
                var target = this.getTargetElement();
                var prevParent = this.getParentCell();

                if (source && target) {
                    if (source === target || source.isEmbeddedIn(target)) {
                        newParent = target;
                    } else if (target.isEmbeddedIn(source)) {
                        newParent = source;
                    } else {
                        newParent = this.graph.getCommonAncestor(source, target);
                    }
                }

                if (prevParent && (!newParent || newParent.id !== prevParent.id)) {
                    // Unembed the link if source and target has no common ancestor
                    // or common ancestor changed
                    prevParent.unembed(this, opt);
                }

                if (newParent) {
                    newParent.embed(this, opt);
                }
            }

            return newParent;
        },

        hasLoop: function(opt) {

            opt = opt || {};

            var sourceId = this.source().id;
            var targetId = this.target().id;

            if (!sourceId || !targetId) {
                // Link "pinned" to the paper does not have a loop.
                return false;
            }

            var loop = sourceId === targetId;

            // Note that there in the deep mode a link can have a loop,
            // even if it connects only a parent and its embed.
            // A loop "target equals source" is valid in both shallow and deep mode.
            if (!loop && opt.deep && this.graph) {

                var sourceElement = this.getSourceCell();
                var targetElement = this.getTargetCell();

                loop = sourceElement.isEmbeddedIn(targetElement) || targetElement.isEmbeddedIn(sourceElement);
            }

            return loop;
        },

        // unlike source(), this method returns null if source is a point
        getSourceCell: function() {

            var source = this.source();
            var graph = this.graph;

            return (source && source.id && graph && graph.getCell(source.id)) || null;
        },

        getSourceElement: function() {
            var cell = this;
            var visited = {};
            do {
                if (visited[cell.id]) { return null; }
                visited[cell.id] = true;
                cell = cell.getSourceCell();
            } while (cell && cell.isLink());
            return cell;
        },

        // unlike target(), this method returns null if target is a point
        getTargetCell: function() {

            var target = this.target();
            var graph = this.graph;

            return (target && target.id && graph && graph.getCell(target.id)) || null;
        },

        getTargetElement: function() {
            var cell = this;
            var visited = {};
            do {
                if (visited[cell.id]) { return null; }
                visited[cell.id] = true;
                cell = cell.getTargetCell();
            } while (cell && cell.isLink());
            return cell;
        },

        // Returns the common ancestor for the source element,
        // target element and the link itself.
        getRelationshipAncestor: function() {

            var connectionAncestor;

            if (this.graph) {

                var cells = [
                    this,
                    this.getSourceElement(), // null if source is a point
                    this.getTargetElement() // null if target is a point
                ].filter(function(item) {
                    return !!item;
                });

                connectionAncestor = this.graph.getCommonAncestor.apply(this.graph, cells);
            }

            return connectionAncestor || null;
        },

        // Is source, target and the link itself embedded in a given cell?
        isRelationshipEmbeddedIn: function(cell) {

            var cellId = (isString(cell) || isNumber(cell)) ? cell : cell.id;
            var ancestor = this.getRelationshipAncestor();

            return !!ancestor && (ancestor.id === cellId || ancestor.isEmbeddedIn(cellId));
        },

        // Get resolved default label.
        _getDefaultLabel: function() {

            var defaultLabel = this.get('defaultLabel') || this.defaultLabel || {};

            var label = {};
            label.markup = defaultLabel.markup || this.get('labelMarkup') || this.labelMarkup;
            label.position = defaultLabel.position;
            label.attrs = defaultLabel.attrs;
            label.size = defaultLabel.size;

            return label;
        }
    }, {

        endsEqual: function(a, b) {

            var portsEqual = a.port === b.port || !a.port && !b.port;
            return a.id === b.id && portsEqual;
        }
    });

    var Member = Element.define('org.Member', {
        size: { width: 180, height: 70 },
        attrs: {
            rect: { width: 170, height: 60 },

            '.card': {
                fill: '#FFFFFF', stroke: '#000000', 'stroke-width': 2,
                'pointer-events': 'visiblePainted', rx: 10, ry: 10
            },

            image: {
                width: 48, height: 48,
                ref: '.card', 'ref-x': 10, 'ref-y': 5
            },

            '.rank': {
                'text-decoration': 'underline',
                ref: '.card', 'ref-x': 0.9, 'ref-y': 0.2,
                'font-family': 'Courier New', 'font-size': 14,
                'text-anchor': 'end'
            },

            '.name': {
                'font-weight': '800',
                ref: '.card', 'ref-x': 0.9, 'ref-y': 0.6,
                'font-family': 'Courier New', 'font-size': 14,
                'text-anchor': 'end'
            }
        }
    }, {
        markup: '<g class="rotatable"><g class="scalable"><rect class="card"/><image/></g><text class="rank"/><text class="name"/></g>',
    });

    var Arrow = Link.define('org.Arrow', {
        source: { selector: '.card' }, target: { selector: '.card' },
        attrs: { '.connection': { stroke: '#585858', 'stroke-width': 3 }},
        z: -1
    });

    exports.Member = Member;
    exports.Arrow = Arrow;

}(this.joint.shapes.org = this.joint.shapes.org || {}, Backbone, _, $, V, g));
