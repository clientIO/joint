/*! JointJS v3.0.0-beta (2019-06-06) - JavaScript diagramming library


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
this.joint = this.joint || {};
this.joint.layout = this.joint.layout || {};
(function (exports, Backbone, _, $, V, g$1) {
    'use strict';

    Backbone = Backbone && Backbone.hasOwnProperty('default') ? Backbone['default'] : Backbone;
    _ = _ && _.hasOwnProperty('default') ? _['default'] : _;
    $ = $ && $.hasOwnProperty('default') ? $['default'] : $;
    V = V && V.hasOwnProperty('default') ? V['default'] : V;

    // The class name prefix config is for advanced use only.
    // Be aware that if you change the prefix, the JointJS CSS will no longer function properly.
    var classNamePrefix = 'joint-';
    var defaultTheme = 'default';

    var addClassNamePrefix = function(className) {

        if (!className) { return className; }

        return className.toString().split(' ').map(function(_className) {

            if (_className.substr(0, classNamePrefix.length) !== classNamePrefix) {
                _className = classNamePrefix + _className;
            }

            return _className;

        }).join(' ');
    };

    var removeClassNamePrefix = function(className) {

        if (!className) { return className; }

        return className.toString().split(' ').map(function(_className) {

            if (_className.substr(0, classNamePrefix.length) === classNamePrefix) {
                _className = _className.substr(classNamePrefix.length);
            }

            return _className;

        }).join(' ');
    };

    var parseDOMJSON = function(json, namespace) {

        var selectors = {};
        var groupSelectors = {};
        var svgNamespace = V.namespace.svg;

        var ns = namespace || svgNamespace;
        var fragment = document.createDocumentFragment();
        var queue = [json, fragment, ns];
        while (queue.length > 0) {
            ns = queue.pop();
            var parentNode = queue.pop();
            var siblingsDef = queue.pop();
            for (var i = 0, n = siblingsDef.length; i < n; i++) {
                var nodeDef = siblingsDef[i];
                // TagName
                if (!nodeDef.hasOwnProperty('tagName')) { throw new Error('json-dom-parser: missing tagName'); }
                var tagName = nodeDef.tagName;
                // Namespace URI
                if (nodeDef.hasOwnProperty('namespaceURI')) { ns = nodeDef.namespaceURI; }
                var node = document.createElementNS(ns, tagName);
                var svg = (ns === svgNamespace);

                var wrapper = (svg) ? V : $;
                // Attributes
                var attributes = nodeDef.attributes;
                if (attributes) { wrapper(node).attr(attributes); }
                // Style
                var style = nodeDef.style;
                if (style) { $(node).css(style); }
                // ClassName
                if (nodeDef.hasOwnProperty('className')) {
                    var className = nodeDef.className;
                    if (svg) {
                        node.className.baseVal = className;
                    } else {
                        node.className = className;
                    }
                }
                // TextContent
                if (nodeDef.hasOwnProperty('textContent')) {
                    node.textContent = nodeDef.textContent;
                }
                // Selector
                if (nodeDef.hasOwnProperty('selector')) {
                    var nodeSelector = nodeDef.selector;
                    if (selectors[nodeSelector]) { throw new Error('json-dom-parser: selector must be unique'); }
                    selectors[nodeSelector] = node;
                    wrapper(node).attr('joint-selector', nodeSelector);
                }
                // Groups
                if (nodeDef.hasOwnProperty('groupSelector')) {
                    var nodeGroups = nodeDef.groupSelector;
                    if (!Array.isArray(nodeGroups)) { nodeGroups = [nodeGroups]; }
                    for (var j = 0, m = nodeGroups.length; j < m; j++) {
                        var nodeGroup = nodeGroups[j];
                        var group = groupSelectors[nodeGroup];
                        if (!group) { group = groupSelectors[nodeGroup] = []; }
                        group.push(node);
                    }
                }
                parentNode.appendChild(node);
                // Children
                var childrenDef = nodeDef.children;
                if (Array.isArray(childrenDef)) { queue.push(childrenDef, node, ns); }
            }
        }
        return {
            fragment: fragment,
            selectors: selectors,
            groupSelectors: groupSelectors
        };
    };

    // Return a simple hash code from a string. See http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/.
    var hashCode = function(str) {

        var hash = 0;
        if (str.length === 0) { return hash; }
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };

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

    // Generate global unique id for obj and store it as a property of the object.
    var guid = function(obj) {

        guid.id = guid.id || 1;
        obj.id = (obj.id === undefined ? 'j_' + guid.id++ : obj.id);
        return obj.id;
    };

    var toKebabCase = function(string) {

        return string.replace(/[A-Z]/g, '-$&').toLowerCase();
    };

    var normalizeEvent = function(evt) {

        var normalizedEvent = evt;
        var touchEvt = evt.originalEvent && evt.originalEvent.changedTouches && evt.originalEvent.changedTouches[0];
        if (touchEvt) {
            for (var property in evt) {
                // copy all the properties from the input event that are not
                // defined on the touch event (functions included).
                if (touchEvt[property] === undefined) {
                    touchEvt[property] = evt[property];
                }
            }
            normalizedEvent = touchEvt;
        }

        // IE: evt.target could be set to SVGElementInstance for SVGUseElement
        var target = normalizedEvent.target;
        if (target) {
            var useElement = target.correspondingUseElement;
            if (useElement) { normalizedEvent.target = useElement; }
        }

        return normalizedEvent;
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


    // Highly inspired by the jquery.sortElements plugin by Padolsey.
    // See http://james.padolsey.com/javascript/sorting-elements-with-jquery/.
    var sortElements = function(elements, comparator) {

        var $elements = $(elements);
        var placements = $elements.map(function() {

            var sortElement = this;
            var parentNode = sortElement.parentNode;
            // Since the element itself will change position, we have
            // to have some way of storing it's original position in
            // the DOM. The easiest way is to have a 'flag' node:
            var nextSibling = parentNode.insertBefore(document.createTextNode(''), sortElement.nextSibling);

            return function() {

                if (parentNode === this) {
                    throw new Error('You can\'t sort elements if any one is a descendant of another.');
                }

                // Insert before flag:
                parentNode.insertBefore(this, nextSibling);
                // Remove flag:
                parentNode.removeChild(nextSibling);
            };
        });

        return Array.prototype.sort.call($elements, comparator).each(function(i) {
            placements[i].call(this);
        });
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

    // SVG filters.
    // (values in parentheses are default values)
    var filter = {

        // `color` ... outline color ('blue')
        // `width`... outline width (1)
        // `opacity` ... outline opacity (1)
        // `margin` ... gap between outline and the element (2)
        outline: function(args) {

            var tpl = '<filter><feFlood flood-color="${color}" flood-opacity="${opacity}" result="colored"/><feMorphology in="SourceAlpha" result="morphedOuter" operator="dilate" radius="${outerRadius}" /><feMorphology in="SourceAlpha" result="morphedInner" operator="dilate" radius="${innerRadius}" /><feComposite result="morphedOuterColored" in="colored" in2="morphedOuter" operator="in"/><feComposite operator="xor" in="morphedOuterColored" in2="morphedInner" result="outline"/><feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

            var margin = Number.isFinite(args.margin) ? args.margin : 2;
            var width = Number.isFinite(args.width) ? args.width : 1;

            return template(tpl)({
                color: args.color || 'blue',
                opacity: Number.isFinite(args.opacity) ? args.opacity : 1,
                outerRadius: margin + width,
                innerRadius: margin
            });
        },

        // `color` ... color ('red')
        // `width`... width (1)
        // `blur` ... blur (0)
        // `opacity` ... opacity (1)
        highlight: function(args) {

            var tpl = '<filter><feFlood flood-color="${color}" flood-opacity="${opacity}" result="colored"/><feMorphology result="morphed" in="SourceGraphic" operator="dilate" radius="${width}"/><feComposite result="composed" in="colored" in2="morphed" operator="in"/><feGaussianBlur result="blured" in="composed" stdDeviation="${blur}"/><feBlend in="SourceGraphic" in2="blured" mode="normal"/></filter>';

            return template(tpl)({
                color: args.color || 'red',
                width: Number.isFinite(args.width) ? args.width : 1,
                blur: Number.isFinite(args.blur) ? args.blur : 0,
                opacity: Number.isFinite(args.opacity) ? args.opacity : 1
            });
        },

        // `x` ... horizontal blur (2)
        // `y` ... vertical blur (optional)
        blur: function(args) {

            var x = Number.isFinite(args.x) ? args.x : 2;

            return template('<filter><feGaussianBlur stdDeviation="${stdDeviation}"/></filter>')({
                stdDeviation: Number.isFinite(args.y) ? [x, args.y] : x
            });
        },

        // `dx` ... horizontal shift (0)
        // `dy` ... vertical shift (0)
        // `blur` ... blur (4)
        // `color` ... color ('black')
        // `opacity` ... opacity (1)
        dropShadow: function(args) {

            var tpl = 'SVGFEDropShadowElement' in window
                ? '<filter><feDropShadow stdDeviation="${blur}" dx="${dx}" dy="${dy}" flood-color="${color}" flood-opacity="${opacity}"/></filter>'
                : '<filter><feGaussianBlur in="SourceAlpha" stdDeviation="${blur}"/><feOffset dx="${dx}" dy="${dy}" result="offsetblur"/><feFlood flood-color="${color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

            return template(tpl)({
                dx: args.dx || 0,
                dy: args.dy || 0,
                opacity: Number.isFinite(args.opacity) ? args.opacity : 1,
                color: args.color || 'black',
                blur: Number.isFinite(args.blur) ? args.blur : 4
            });
        },

        // `amount` ... the proportion of the conversion (1). A value of 1 (default) is completely grayscale. A value of 0 leaves the input unchanged.
        grayscale: function(args) {

            var amount = Number.isFinite(args.amount) ? args.amount : 1;

            return template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 0 ${d} ${e} ${f} 0 0 ${g} ${b} ${h} 0 0 0 0 0 1 0"/></filter>')({
                a: 0.2126 + 0.7874 * (1 - amount),
                b: 0.7152 - 0.7152 * (1 - amount),
                c: 0.0722 - 0.0722 * (1 - amount),
                d: 0.2126 - 0.2126 * (1 - amount),
                e: 0.7152 + 0.2848 * (1 - amount),
                f: 0.0722 - 0.0722 * (1 - amount),
                g: 0.2126 - 0.2126 * (1 - amount),
                h: 0.0722 + 0.9278 * (1 - amount)
            });
        },

        // `amount` ... the proportion of the conversion (1). A value of 1 (default) is completely sepia. A value of 0 leaves the input unchanged.
        sepia: function(args) {

            var amount = Number.isFinite(args.amount) ? args.amount : 1;

            return template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 0 ${d} ${e} ${f} 0 0 ${g} ${h} ${i} 0 0 0 0 0 1 0"/></filter>')({
                a: 0.393 + 0.607 * (1 - amount),
                b: 0.769 - 0.769 * (1 - amount),
                c: 0.189 - 0.189 * (1 - amount),
                d: 0.349 - 0.349 * (1 - amount),
                e: 0.686 + 0.314 * (1 - amount),
                f: 0.168 - 0.168 * (1 - amount),
                g: 0.272 - 0.272 * (1 - amount),
                h: 0.534 - 0.534 * (1 - amount),
                i: 0.131 + 0.869 * (1 - amount)
            });
        },

        // `amount` ... the proportion of the conversion (1). A value of 0 is completely un-saturated. A value of 1 (default) leaves the input unchanged.
        saturate: function(args) {

            var amount = Number.isFinite(args.amount) ? args.amount : 1;

            return template('<filter><feColorMatrix type="saturate" values="${amount}"/></filter>')({
                amount: 1 - amount
            });
        },

        // `angle` ...  the number of degrees around the color circle the input samples will be adjusted (0).
        hueRotate: function(args) {

            return template('<filter><feColorMatrix type="hueRotate" values="${angle}"/></filter>')({
                angle: args.angle || 0
            });
        },

        // `amount` ... the proportion of the conversion (1). A value of 1 (default) is completely inverted. A value of 0 leaves the input unchanged.
        invert: function(args) {

            var amount = Number.isFinite(args.amount) ? args.amount : 1;

            return template('<filter><feComponentTransfer><feFuncR type="table" tableValues="${amount} ${amount2}"/><feFuncG type="table" tableValues="${amount} ${amount2}"/><feFuncB type="table" tableValues="${amount} ${amount2}"/></feComponentTransfer></filter>')({
                amount: amount,
                amount2: 1 - amount
            });
        },

        // `amount` ... proportion of the conversion (1). A value of 0 will create an image that is completely black. A value of 1 (default) leaves the input unchanged.
        brightness: function(args) {

            return template('<filter><feComponentTransfer><feFuncR type="linear" slope="${amount}"/><feFuncG type="linear" slope="${amount}"/><feFuncB type="linear" slope="${amount}"/></feComponentTransfer></filter>')({
                amount: Number.isFinite(args.amount) ? args.amount : 1
            });
        },

        // `amount` ... proportion of the conversion (1). A value of 0 will create an image that is completely black. A value of 1 (default) leaves the input unchanged.
        contrast: function(args) {

            var amount = Number.isFinite(args.amount) ? args.amount : 1;

            return template('<filter><feComponentTransfer><feFuncR type="linear" slope="${amount}" intercept="${amount2}"/><feFuncG type="linear" slope="${amount}" intercept="${amount2}"/><feFuncB type="linear" slope="${amount}" intercept="${amount2}"/></feComponentTransfer></filter>')({
                amount: amount,
                amount2: .5 - amount / 2
            });
        }
    };

    /*
        Pre-compile the HTML to be used as a template.
    */
    var template = function(html) {

        /*
            Must support the variation in templating syntax found here:
            https://lodash.com/docs#template
        */
        var regex = /<%= ([^ ]+) %>|\$\{ ?([^{} ]+) ?\}|\{\{([^{} ]+)\}\}/g;

        return function(data) {

            data = data || {};

            return html.replace(regex, function(match) {

                var args = Array.from(arguments);
                var attr = args.slice(1, 4).find(function(_attr) {
                    return !!_attr;
                });

                var attrArray = attr.split('.');
                var value = data[attrArray.shift()];

                while (value !== undefined && attrArray.length) {
                    value = value[attrArray.shift()];
                }

                return value !== undefined ? value : '';
            });
        };
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

    var isBoolean = function(value) {
        var toString = Object.prototype.toString;
        return value === true || value === false || (!!value && typeof value === 'object' && toString.call(value) === '[object Boolean]');
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

    var wrapWith = function(object, methods, wrapper) {

        if (isString(wrapper)) {

            if (!wrappers[wrapper]) {
                throw new Error('Unknown wrapper: "' + wrapper + '"');
            }

            wrapper = wrappers[wrapper];
        }

        if (!isFunction(wrapper)) {
            throw new Error('Wrapper must be a function.');
        }

        toArray(methods).forEach(function(method) {
            object[method] = wrapper(object[method]);
        });
    };

    var wrappers = {

        cells: function(fn) {

            return function() {

                var args = Array.from(arguments);
                var n = args.length;
                var cells = n > 0 && args[0] || [];
                var opt = n > 1 && args[n - 1] || {};

                if (!Array.isArray(cells)) {

                    if (opt instanceof Cell) {
                        cells = args;
                    } else if (cells instanceof Cell) {
                        if (args.length > 1) {
                            args.pop();
                        }
                        cells = args;
                    }
                }

                if (opt instanceof Cell) {
                    opt = {};
                }

                return fn.call(this, cells, opt);
            };
        }

    };

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

    var elementViewPortPrototype = {

        portContainerMarkup: 'g',
        portMarkup: [{
            tagName: 'circle',
            selector: 'circle',
            attributes: {
                'r': 10,
                'fill': '#FFFFFF',
                'stroke': '#000000'
            }
        }],
        portLabelMarkup: [{
            tagName: 'text',
            selector: 'text',
            attributes: {
                'fill': '#000000'
            }
        }],
        /** @type {Object<string, {portElement: Vectorizer, portLabelElement: Vectorizer}>} */
        _portElementsCache: null,

        /**
         * @private
         */
        _initializePorts: function() {

            this._portElementsCache = {};
        },

        /**
         * @typedef {Object} Port
         *
         * @property {string} id
         * @property {Object} position
         * @property {Object} label
         * @property {Object} attrs
         * @property {string} markup
         * @property {string} group
         */

        /**
         * @private
         */
        _refreshPorts: function() {

            this._removePorts();
            this._portElementsCache = {};
            this._renderPorts();
        },

        /**
         * @private
         */
        _renderPorts: function() {

            // references to rendered elements without z-index
            var elementReferences = [];
            var elem = this._getContainerElement();

            for (var i = 0, count = elem.node.childNodes.length; i < count; i++) {
                elementReferences.push(elem.node.childNodes[i]);
            }

            var portsGropsByZ = groupBy(this.model._portSettingsData.getPorts(), 'z');
            var withoutZKey = 'auto';

            // render non-z first
            toArray(portsGropsByZ[withoutZKey]).forEach(function(port) {
                var portElement = this._getPortElement(port);
                elem.append(portElement);
                elementReferences.push(portElement);
            }, this);

            var groupNames = Object.keys(portsGropsByZ);
            for (var k = 0; k < groupNames.length; k++) {
                var groupName = groupNames[k];
                if (groupName !== withoutZKey) {
                    var z = parseInt(groupName, 10);
                    this._appendPorts(portsGropsByZ[groupName], z, elementReferences);
                }
            }

            this._updatePorts();
        },

        /**
         * @returns {V}
         * @private
         */
        _getContainerElement: function() {

            return this.rotatableNode || this.vel;
        },

        /**
         * @param {Array<Port>}ports
         * @param {number} z
         * @param refs
         * @private
         */
        _appendPorts: function(ports, z, refs) {

            var containerElement = this._getContainerElement();
            var portElements = toArray(ports).map(this._getPortElement, this);

            if (refs[z] || z < 0) {
                V(refs[Math.max(z, 0)]).before(portElements);
            } else {
                containerElement.append(portElements);
            }
        },

        /**
         * Try to get element from cache,
         * @param port
         * @returns {*}
         * @private
         */
        _getPortElement: function(port) {

            if (this._portElementsCache[port.id]) {
                return this._portElementsCache[port.id].portElement;
            }
            return this._createPortElement(port);
        },

        findPortNode: function(portId, selector) {
            var portCache = this._portElementsCache[portId];
            if (!portCache) { return null; }
            var portRoot = portCache.portContentElement.node;
            var portSelectors = portCache.portContentSelectors;
            return this.findBySelector(selector, portRoot, portSelectors)[0];
        },

        /**
         * @private
         */
        _updatePorts: function() {

            // layout ports without group
            this._updatePortGroup(undefined);
            // layout ports with explicit group
            var groupsNames = Object.keys(this.model._portSettingsData.groups);
            groupsNames.forEach(this._updatePortGroup, this);
        },

        /**
         * @private
         */
        _removePorts: function() {
            invoke(this._portElementsCache, 'portElement.remove');
        },

        /**
         * @param {Port} port
         * @returns {V}
         * @private
         */
        _createPortElement: function(port) {

            var portElement;
            var labelElement;

            var portContainerElement = V(this.portContainerMarkup).addClass('joint-port');

            var portMarkup = this._getPortMarkup(port);
            var portSelectors;
            if (Array.isArray(portMarkup)) {
                var portDoc = this.parseDOMJSON(portMarkup, portContainerElement.node);
                var portFragment = portDoc.fragment;
                if (portFragment.childNodes.length > 1) {
                    portElement = V('g').append(portFragment);
                } else {
                    portElement = V(portFragment.firstChild);
                }
                portSelectors = portDoc.selectors;
            } else {
                portElement = V(portMarkup);
                if (Array.isArray(portElement)) {
                    portElement = V('g').append(portElement);
                }
            }

            if (!portElement) {
                throw new Error('ElementView: Invalid port markup.');
            }

            portElement.attr({
                'port': port.id,
                'port-group': port.group
            });

            var labelMarkup = this._getPortLabelMarkup(port.label);
            var labelSelectors;
            if (Array.isArray(labelMarkup)) {
                var labelDoc = this.parseDOMJSON(labelMarkup, portContainerElement.node);
                var labelFragment = labelDoc.fragment;
                if (labelFragment.childNodes.length > 1) {
                    labelElement = V('g').append(labelFragment);
                } else {
                    labelElement = V(labelFragment.firstChild);
                }
                labelSelectors = labelDoc.selectors;
            } else {
                labelElement = V(labelMarkup);
                if (Array.isArray(labelElement)) {
                    labelElement = V('g').append(labelElement);
                }
            }

            if (!labelElement) {
                throw new Error('ElementView: Invalid port label markup.');
            }

            var portContainerSelectors;
            if (portSelectors && labelSelectors) {
                for (var key in labelSelectors) {
                    if (portSelectors[key] && key !== this.selector) { throw new Error('ElementView: selectors within port must be unique.'); }
                }
                portContainerSelectors = assign({}, portSelectors, labelSelectors);
            } else {
                portContainerSelectors = portSelectors || labelSelectors;
            }

            portContainerElement.append([
                portElement.addClass('joint-port-body'),
                labelElement.addClass('joint-port-label')
            ]);

            this._portElementsCache[port.id] = {
                portElement: portContainerElement,
                portLabelElement: labelElement,
                portSelectors: portContainerSelectors,
                portLabelSelectors: labelSelectors,
                portContentElement: portElement,
                portContentSelectors: portSelectors
            };

            return portContainerElement;
        },

        /**
         * @param {string=} groupName
         * @private
         */
        _updatePortGroup: function(groupName) {

            var elementBBox = g$1.Rect(this.model.size());
            var portsMetrics = this.model._portSettingsData.getGroupPortsMetrics(groupName, elementBBox);

            for (var i = 0, n = portsMetrics.length; i < n; i++) {
                var metrics = portsMetrics[i];
                var portId = metrics.portId;
                var cached = this._portElementsCache[portId] || {};
                var portTransformation = metrics.portTransformation;
                this.applyPortTransform(cached.portElement, portTransformation);
                this.updateDOMSubtreeAttributes(cached.portElement.node, metrics.portAttrs, {
                    rootBBox: new g$1.Rect(metrics.portSize),
                    selectors: cached.portSelectors
                });

                var labelTransformation = metrics.labelTransformation;
                if (labelTransformation) {
                    this.applyPortTransform(cached.portLabelElement, labelTransformation, (-portTransformation.angle || 0));
                    this.updateDOMSubtreeAttributes(cached.portLabelElement.node, labelTransformation.attrs, {
                        rootBBox: new g$1.Rect(metrics.labelSize),
                        selectors: cached.portLabelSelectors
                    });
                }
            }
        },

        /**
         * @param {Vectorizer} element
         * @param {{dx:number, dy:number, angle: number, attrs: Object, x:number: y:number}} transformData
         * @param {number=} initialAngle
         * @constructor
         */
        applyPortTransform: function(element, transformData, initialAngle) {

            var matrix = V.createSVGMatrix()
                .rotate(initialAngle || 0)
                .translate(transformData.x || 0, transformData.y || 0)
                .rotate(transformData.angle || 0);

            element.transform(matrix, { absolute: true });
        },

        /**
         * @param {Port} port
         * @returns {string}
         * @private
         */
        _getPortMarkup: function(port) {

            return port.markup || this.model.get('portMarkup') || this.model.portMarkup || this.portMarkup;
        },

        /**
         * @param {Object} label
         * @returns {string}
         * @private
         */
        _getPortLabelMarkup: function(label) {

            return label.markup || this.model.get('portLabelMarkup') || this.model.portLabelMarkup || this.portLabelMarkup;
        }
    };

    // Element base model.
    // -----------------------------

    var Element$1 = Cell.extend({

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

    assign(Element$1.prototype, elementPortPrototype);

    var GraphCells = Backbone.Collection.extend({

        initialize: function(models, opt) {

            // Set the optional namespace where all model classes are defined.
            if (opt.cellNamespace) {
                this.cellNamespace = opt.cellNamespace;
            } else {
                this.cellNamespace = typeof joint !== 'undefined' && has(joint, 'shapes') ? joint.shapes : null;
            }


            this.graph = opt.graph;
        },

        model: function(attrs, opt) {

            var collection = opt.collection;
            var namespace = collection.cellNamespace;

            // Find the model class in the namespace or use the default one.
            var ModelClass = (attrs.type === 'link')
                ? Link
                : getByPath(namespace, attrs.type, '.') || Element$1;

            var cell = new ModelClass(attrs, opt);
            // Add a reference to the graph. It is necessary to do this here because this is the earliest place
            // where a new model is created from a plain JS object. For other objects, see `joint.dia.Graph>>_prepareCell()`.
            if (!opt.dry) {
                cell.graph = collection.graph;
            }

            return cell;
        },

        // `comparator` makes it easy to sort cells based on their `z` index.
        comparator: function(model) {

            return model.get('z') || 0;
        }
    });


    var Graph = Backbone.Model.extend({

        _batches: {},

        initialize: function(attrs, opt) {

            opt = opt || {};

            // Passing `cellModel` function in the options object to graph allows for
            // setting models based on attribute objects. This is especially handy
            // when processing JSON graphs that are in a different than JointJS format.
            var cells = new GraphCells([], {
                model: opt.cellModel,
                cellNamespace: opt.cellNamespace,
                graph: this
            });
            Backbone.Model.prototype.set.call(this, 'cells', cells);

            // Make all the events fired in the `cells` collection available.
            // to the outside world.
            cells.on('all', this.trigger, this);

            // Backbone automatically doesn't trigger re-sort if models attributes are changed later when
            // they're already in the collection. Therefore, we're triggering sort manually here.
            this.on('change:z', this._sortOnChangeZ, this);

            // `joint.dia.Graph` keeps an internal data structure (an adjacency list)
            // for fast graph queries. All changes that affect the structure of the graph
            // must be reflected in the `al` object. This object provides fast answers to
            // questions such as "what are the neighbours of this node" or "what
            // are the sibling links of this link".

            // Outgoing edges per node. Note that we use a hash-table for the list
            // of outgoing edges for a faster lookup.
            // [nodeId] -> Object [edgeId] -> true
            this._out = {};
            // Ingoing edges per node.
            // [nodeId] -> Object [edgeId] -> true
            this._in = {};
            // `_nodes` is useful for quick lookup of all the elements in the graph, without
            // having to go through the whole cells array.
            // [node ID] -> true
            this._nodes = {};
            // `_edges` is useful for quick lookup of all the links in the graph, without
            // having to go through the whole cells array.
            // [edgeId] -> true
            this._edges = {};

            cells.on('add', this._restructureOnAdd, this);
            cells.on('remove', this._restructureOnRemove, this);
            cells.on('reset', this._restructureOnReset, this);
            cells.on('change:source', this._restructureOnChangeSource, this);
            cells.on('change:target', this._restructureOnChangeTarget, this);
            cells.on('remove', this._removeCell, this);
        },

        _sortOnChangeZ: function() {

            this.get('cells').sort();
        },

        _restructureOnAdd: function(cell) {

            if (cell.isLink()) {
                this._edges[cell.id] = true;
                var source = cell.source();
                var target = cell.target();
                if (source.id) {
                    (this._out[source.id] || (this._out[source.id] = {}))[cell.id] = true;
                }
                if (target.id) {
                    (this._in[target.id] || (this._in[target.id] = {}))[cell.id] = true;
                }
            } else {
                this._nodes[cell.id] = true;
            }
        },

        _restructureOnRemove: function(cell) {

            if (cell.isLink()) {
                delete this._edges[cell.id];
                var source = cell.source();
                var target = cell.target();
                if (source.id && this._out[source.id] && this._out[source.id][cell.id]) {
                    delete this._out[source.id][cell.id];
                }
                if (target.id && this._in[target.id] && this._in[target.id][cell.id]) {
                    delete this._in[target.id][cell.id];
                }
            } else {
                delete this._nodes[cell.id];
            }
        },

        _restructureOnReset: function(cells) {

            // Normalize into an array of cells. The original `cells` is GraphCells Backbone collection.
            cells = cells.models;

            this._out = {};
            this._in = {};
            this._nodes = {};
            this._edges = {};

            cells.forEach(this._restructureOnAdd, this);
        },

        _restructureOnChangeSource: function(link) {

            var prevSource = link.previous('source');
            if (prevSource.id && this._out[prevSource.id]) {
                delete this._out[prevSource.id][link.id];
            }
            var source = link.source();
            if (source.id) {
                (this._out[source.id] || (this._out[source.id] = {}))[link.id] = true;
            }
        },

        _restructureOnChangeTarget: function(link) {

            var prevTarget = link.previous('target');
            if (prevTarget.id && this._in[prevTarget.id]) {
                delete this._in[prevTarget.id][link.id];
            }
            var target = link.get('target');
            if (target.id) {
                (this._in[target.id] || (this._in[target.id] = {}))[link.id] = true;
            }
        },

        // Return all outbound edges for the node. Return value is an object
        // of the form: [edgeId] -> true
        getOutboundEdges: function(node) {

            return (this._out && this._out[node]) || {};
        },

        // Return all inbound edges for the node. Return value is an object
        // of the form: [edgeId] -> true
        getInboundEdges: function(node) {

            return (this._in && this._in[node]) || {};
        },

        toJSON: function() {

            // Backbone does not recursively call `toJSON()` on attributes that are themselves models/collections.
            // It just clones the attributes. Therefore, we must call `toJSON()` on the cells collection explicitly.
            var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
            json.cells = this.get('cells').toJSON();
            return json;
        },

        fromJSON: function(json, opt) {

            if (!json.cells) {

                throw new Error('Graph JSON must contain cells array.');
            }

            return this.set(json, opt);
        },

        set: function(key, val, opt) {

            var attrs;

            // Handle both `key`, value and {key: value} style arguments.
            if (typeof key === 'object') {
                attrs = key;
                opt = val;
            } else {
                (attrs = {})[key] = val;
            }

            // Make sure that `cells` attribute is handled separately via resetCells().
            if (attrs.hasOwnProperty('cells')) {
                this.resetCells(attrs.cells, opt);
                attrs = omit(attrs, 'cells');
            }

            // The rest of the attributes are applied via original set method.
            return Backbone.Model.prototype.set.call(this, attrs, opt);
        },

        clear: function(opt) {

            opt = assign({}, opt, { clear: true });

            var collection = this.get('cells');

            if (collection.length === 0) { return this; }

            this.startBatch('clear', opt);

            // The elements come after the links.
            var cells = collection.sortBy(function(cell) {
                return cell.isLink() ? 1 : 2;
            });

            do {

                // Remove all the cells one by one.
                // Note that all the links are removed first, so it's
                // safe to remove the elements without removing the connected
                // links first.
                cells.shift().remove(opt);

            } while (cells.length > 0);

            this.stopBatch('clear');

            return this;
        },

        _prepareCell: function(cell, opt) {

            var attrs;
            if (cell instanceof Backbone.Model) {
                attrs = cell.attributes;
                if (!cell.graph && (!opt || !opt.dry)) {
                    // An element can not be member of more than one graph.
                    // A cell stops being the member of the graph after it's explicitly removed.
                    cell.graph = this;
                }
            } else {
                // In case we're dealing with a plain JS object, we have to set the reference
                // to the `graph` right after the actual model is created. This happens in the `model()` function
                // of `joint.dia.GraphCells`.
                attrs = cell;
            }

            if (!isString(attrs.type)) {
                throw new TypeError('dia.Graph: cell type must be a string.');
            }

            return cell;
        },

        minZIndex: function() {

            var firstCell = this.get('cells').first();
            return firstCell ? (firstCell.get('z') || 0) : 0;
        },

        maxZIndex: function() {

            var lastCell = this.get('cells').last();
            return lastCell ? (lastCell.get('z') || 0) : 0;
        },

        addCell: function(cell, opt) {

            if (Array.isArray(cell)) {

                return this.addCells(cell, opt);
            }

            if (cell instanceof Backbone.Model) {

                if (!cell.has('z')) {
                    cell.set('z', this.maxZIndex() + 1);
                }

            } else if (cell.z === undefined) {

                cell.z = this.maxZIndex() + 1;
            }

            this.get('cells').add(this._prepareCell(cell, opt), opt || {});

            return this;
        },

        addCells: function(cells, opt) {

            if (cells.length === 0) { return this; }

            cells = flattenDeep(cells);
            opt.maxPosition = opt.position = cells.length - 1;

            this.startBatch('add', opt);
            cells.forEach(function(cell) {
                this.addCell(cell, opt);
                opt.position--;
            }, this);
            this.stopBatch('add', opt);

            return this;
        },

        // When adding a lot of cells, it is much more efficient to
        // reset the entire cells collection in one go.
        // Useful for bulk operations and optimizations.
        resetCells: function(cells, opt) {

            var preparedCells = toArray(cells).map(function(cell) {
                return this._prepareCell(cell, opt);
            }, this);
            this.get('cells').reset(preparedCells, opt);

            return this;
        },

        removeCells: function(cells, opt) {

            if (cells.length) {

                this.startBatch('remove');
                invoke(cells, 'remove', opt);
                this.stopBatch('remove');
            }

            return this;
        },

        _removeCell: function(cell, collection, options) {

            options = options || {};

            if (!options.clear) {
                // Applications might provide a `disconnectLinks` option set to `true` in order to
                // disconnect links when a cell is removed rather then removing them. The default
                // is to remove all the associated links.
                if (options.disconnectLinks) {

                    this.disconnectLinks(cell, options);

                } else {

                    this.removeLinks(cell, options);
                }
            }
            // Silently remove the cell from the cells collection. Silently, because
            // `joint.dia.Cell.prototype.remove` already triggers the `remove` event which is
            // then propagated to the graph model. If we didn't remove the cell silently, two `remove` events
            // would be triggered on the graph model.
            this.get('cells').remove(cell, { silent: true });

            if (cell.graph === this) {
                // Remove the element graph reference only if the cell is the member of this graph.
                cell.graph = null;
            }
        },

        // Get a cell by `id`.
        getCell: function(id) {

            return this.get('cells').get(id);
        },

        getCells: function() {

            return this.get('cells').toArray();
        },

        getElements: function() {

            return Object.keys(this._nodes).map(this.getCell, this);
        },

        getLinks: function() {

            return Object.keys(this._edges).map(this.getCell, this);
        },

        getFirstCell: function() {

            return this.get('cells').first();
        },

        getLastCell: function() {

            return this.get('cells').last();
        },

        // Get all inbound and outbound links connected to the cell `model`.
        getConnectedLinks: function(model, opt) {

            opt = opt || {};

            var indirect = opt.indirect;
            var inbound = opt.inbound;
            var outbound = opt.outbound;
            if ((inbound === undefined) && (outbound === undefined)) {
                inbound = outbound = true;
            }

            // the final array of connected link models
            var links = [];
            // a hash table of connected edges of the form: [edgeId] -> true
            // used for quick lookups to check if we already added a link
            var edges = {};

            if (outbound) {
                addOutbounds(this, model);
            }
            if (inbound) {
                addInbounds(this, model);
            }

            function addOutbounds(graph, model) {
                forIn(graph.getOutboundEdges(model.id), function(_$$1, edge) {
                    // skip links that were already added
                    // (those must be self-loop links)
                    // (because they are inbound and outbound edges of the same two elements)
                    if (edges[edge]) { return; }
                    var link = graph.getCell(edge);
                    links.push(link);
                    edges[edge] = true;
                    if (indirect) {
                        if (inbound) { addInbounds(graph, link); }
                        if (outbound) { addOutbounds(graph, link); }
                    }
                }.bind(graph));
                if (indirect && model.isLink()) {
                    var outCell = model.getTargetCell();
                    if (outCell && outCell.isLink()) {
                        if (!edges[outCell.id]) {
                            links.push(outCell);
                            addOutbounds(graph, outCell);
                        }
                    }
                }
            }

            function addInbounds(graph, model) {
                forIn(graph.getInboundEdges(model.id), function(_$$1, edge) {
                    // skip links that were already added
                    // (those must be self-loop links)
                    // (because they are inbound and outbound edges of the same two elements)
                    if (edges[edge]) { return; }
                    var link = graph.getCell(edge);
                    links.push(link);
                    edges[edge] = true;
                    if (indirect) {
                        if (inbound) { addInbounds(graph, link); }
                        if (outbound) { addOutbounds(graph, link); }
                    }
                }.bind(graph));
                if (indirect && model.isLink()) {
                    var inCell = model.getSourceCell();
                    if (inCell && inCell.isLink()) {
                        if (!edges[inCell.id]) {
                            links.push(inCell);
                            addInbounds(graph, inCell);
                        }
                    }
                }
            }

            // if `deep` option is `true`, check also all the links that are connected to any of the descendant cells
            if (opt.deep) {

                var embeddedCells = model.getEmbeddedCells({ deep: true });

                // in the first round, we collect all the embedded elements
                var embeddedElements = {};
                embeddedCells.forEach(function(cell) {
                    if (cell.isElement()) {
                        embeddedElements[cell.id] = true;
                    }
                });

                embeddedCells.forEach(function(cell) {
                    if (cell.isLink()) { return; }
                    if (outbound) {
                        forIn(this.getOutboundEdges(cell.id), function(exists, edge) {
                            if (!edges[edge]) {
                                var edgeCell = this.getCell(edge);
                                var sourceId = edgeCell.source().id;
                                var targetId = edgeCell.target().id;

                                // if `includeEnclosed` option is falsy, skip enclosed links
                                if (!opt.includeEnclosed
                                    && (sourceId && embeddedElements[sourceId])
                                    && (targetId && embeddedElements[targetId])) {
                                    return;
                                }

                                links.push(this.getCell(edge));
                                edges[edge] = true;
                            }
                        }.bind(this));
                    }
                    if (inbound) {
                        forIn(this.getInboundEdges(cell.id), function(exists, edge) {
                            if (!edges[edge]) {
                                var edgeCell = this.getCell(edge);
                                var sourceId = edgeCell.source().id;
                                var targetId = edgeCell.target().id;

                                // if `includeEnclosed` option is falsy, skip enclosed links
                                if (!opt.includeEnclosed
                                    && (sourceId && embeddedElements[sourceId])
                                    && (targetId && embeddedElements[targetId])) {
                                    return;
                                }

                                links.push(this.getCell(edge));
                                edges[edge] = true;
                            }
                        }.bind(this));
                    }
                }, this);
            }

            return links;
        },

        getNeighbors: function(model, opt) {

            opt || (opt = {});

            var inbound = opt.inbound;
            var outbound = opt.outbound;
            if (inbound === undefined && outbound === undefined) {
                inbound = outbound = true;
            }

            var neighbors = this.getConnectedLinks(model, opt).reduce(function(res, link) {

                var source = link.source();
                var target = link.target();
                var loop = link.hasLoop(opt);

                // Discard if it is a point, or if the neighbor was already added.
                if (inbound && has(source, 'id') && !res[source.id]) {

                    var sourceElement = this.getCell(source.id);
                    if (sourceElement.isElement()) {
                        if (loop || (sourceElement && sourceElement !== model && (!opt.deep || !sourceElement.isEmbeddedIn(model)))) {
                            res[source.id] = sourceElement;
                        }
                    }
                }

                // Discard if it is a point, or if the neighbor was already added.
                if (outbound && has(target, 'id') && !res[target.id]) {

                    var targetElement = this.getCell(target.id);
                    if (targetElement.isElement()) {
                        if (loop || (targetElement && targetElement !== model && (!opt.deep || !targetElement.isEmbeddedIn(model)))) {
                            res[target.id] = targetElement;
                        }
                    }
                }

                return res;
            }.bind(this), {});

            if (model.isLink()) {
                if (inbound) {
                    var sourceCell = model.getSourceCell();
                    if (sourceCell && sourceCell.isElement() && !neighbors[sourceCell.id]) {
                        neighbors[sourceCell.id] = sourceCell;
                    }
                }
                if (outbound) {
                    var targetCell = model.getTargetCell();
                    if (targetCell && targetCell.isElement() && !neighbors[targetCell.id]) {
                        neighbors[targetCell.id] = targetCell;
                    }
                }
            }

            return toArray(neighbors);
        },

        getCommonAncestor: function(/* cells */) {

            var cellsAncestors = Array.from(arguments).map(function(cell) {

                var ancestors = [];
                var parentId = cell.get('parent');

                while (parentId) {

                    ancestors.push(parentId);
                    parentId = this.getCell(parentId).get('parent');
                }

                return ancestors;

            }, this);

            cellsAncestors = cellsAncestors.sort(function(a, b) {
                return a.length - b.length;
            });

            var commonAncestor = toArray(cellsAncestors.shift()).find(function(ancestor) {
                return cellsAncestors.every(function(cellAncestors) {
                    return cellAncestors.includes(ancestor);
                });
            });

            return this.getCell(commonAncestor);
        },

        // Find the whole branch starting at `element`.
        // If `opt.deep` is `true`, take into account embedded elements too.
        // If `opt.breadthFirst` is `true`, use the Breadth-first search algorithm, otherwise use Depth-first search.
        getSuccessors: function(element, opt) {

            opt = opt || {};
            var res = [];
            // Modify the options so that it includes the `outbound` neighbors only. In other words, search forwards.
            this.search(element, function(el) {
                if (el !== element) {
                    res.push(el);
                }
            }, assign({}, opt, { outbound: true }));
            return res;
        },

        cloneCells: cloneCells,
        // Clone the whole subgraph (including all the connected links whose source/target is in the subgraph).
        // If `opt.deep` is `true`, also take into account all the embedded cells of all the subgraph cells.
        // Return a map of the form: [original cell ID] -> [clone].
        cloneSubgraph: function(cells, opt) {

            var subgraph = this.getSubgraph(cells, opt);
            return this.cloneCells(subgraph);
        },

        // Return `cells` and all the connected links that connect cells in the `cells` array.
        // If `opt.deep` is `true`, return all the cells including all their embedded cells
        // and all the links that connect any of the returned cells.
        // For example, for a single shallow element, the result is that very same element.
        // For two elements connected with a link: `A --- L ---> B`, the result for
        // `getSubgraph([A, B])` is `[A, L, B]`. The same goes for `getSubgraph([L])`, the result is again `[A, L, B]`.
        getSubgraph: function(cells, opt) {

            opt = opt || {};

            var subgraph = [];
            // `cellMap` is used for a quick lookup of existence of a cell in the `cells` array.
            var cellMap = {};
            var elements = [];
            var links = [];

            toArray(cells).forEach(function(cell) {
                if (!cellMap[cell.id]) {
                    subgraph.push(cell);
                    cellMap[cell.id] = cell;
                    if (cell.isLink()) {
                        links.push(cell);
                    } else {
                        elements.push(cell);
                    }
                }

                if (opt.deep) {
                    var embeds = cell.getEmbeddedCells({ deep: true });
                    embeds.forEach(function(embed) {
                        if (!cellMap[embed.id]) {
                            subgraph.push(embed);
                            cellMap[embed.id] = embed;
                            if (embed.isLink()) {
                                links.push(embed);
                            } else {
                                elements.push(embed);
                            }
                        }
                    });
                }
            });

            links.forEach(function(link) {
                // For links, return their source & target (if they are elements - not points).
                var source = link.source();
                var target = link.target();
                if (source.id && !cellMap[source.id]) {
                    var sourceElement = this.getCell(source.id);
                    subgraph.push(sourceElement);
                    cellMap[sourceElement.id] = sourceElement;
                    elements.push(sourceElement);
                }
                if (target.id && !cellMap[target.id]) {
                    var targetElement = this.getCell(target.id);
                    subgraph.push(this.getCell(target.id));
                    cellMap[targetElement.id] = targetElement;
                    elements.push(targetElement);
                }
            }, this);

            elements.forEach(function(element) {
                // For elements, include their connected links if their source/target is in the subgraph;
                var links = this.getConnectedLinks(element, opt);
                links.forEach(function(link) {
                    var source = link.source();
                    var target = link.target();
                    if (!cellMap[link.id] && source.id && cellMap[source.id] && target.id && cellMap[target.id]) {
                        subgraph.push(link);
                        cellMap[link.id] = link;
                    }
                });
            }, this);

            return subgraph;
        },

        // Find all the predecessors of `element`. This is a reverse operation of `getSuccessors()`.
        // If `opt.deep` is `true`, take into account embedded elements too.
        // If `opt.breadthFirst` is `true`, use the Breadth-first search algorithm, otherwise use Depth-first search.
        getPredecessors: function(element, opt) {

            opt = opt || {};
            var res = [];
            // Modify the options so that it includes the `inbound` neighbors only. In other words, search backwards.
            this.search(element, function(el) {
                if (el !== element) {
                    res.push(el);
                }
            }, assign({}, opt, { inbound: true }));
            return res;
        },

        // Perform search on the graph.
        // If `opt.breadthFirst` is `true`, use the Breadth-first Search algorithm, otherwise use Depth-first search.
        // By setting `opt.inbound` to `true`, you can reverse the direction of the search.
        // If `opt.deep` is `true`, take into account embedded elements too.
        // `iteratee` is a function of the form `function(element) {}`.
        // If `iteratee` explicitly returns `false`, the searching stops.
        search: function(element, iteratee, opt) {

            opt = opt || {};
            if (opt.breadthFirst) {
                this.bfs(element, iteratee, opt);
            } else {
                this.dfs(element, iteratee, opt);
            }
        },

        // Breadth-first search.
        // If `opt.deep` is `true`, take into account embedded elements too.
        // If `opt.inbound` is `true`, reverse the search direction (it's like reversing all the link directions).
        // `iteratee` is a function of the form `function(element, distance) {}`.
        // where `element` is the currently visited element and `distance` is the distance of that element
        // from the root `element` passed the `bfs()`, i.e. the element we started the search from.
        // Note that the `distance` is not the shortest or longest distance, it is simply the number of levels
        // crossed till we visited the `element` for the first time. It is especially useful for tree graphs.
        // If `iteratee` explicitly returns `false`, the searching stops.
        bfs: function(element, iteratee, opt) {

            opt = opt || {};
            var visited = {};
            var distance = {};
            var queue = [];

            queue.push(element);
            distance[element.id] = 0;

            while (queue.length > 0) {
                var next = queue.shift();
                if (!visited[next.id]) {
                    visited[next.id] = true;
                    if (iteratee(next, distance[next.id]) === false) { return; }
                    this.getNeighbors(next, opt).forEach(function(neighbor) {
                        distance[neighbor.id] = distance[next.id] + 1;
                        queue.push(neighbor);
                    });
                }
            }
        },

        // Depth-first search.
        // If `opt.deep` is `true`, take into account embedded elements too.
        // If `opt.inbound` is `true`, reverse the search direction (it's like reversing all the link directions).
        // `iteratee` is a function of the form `function(element, distance) {}`.
        // If `iteratee` explicitly returns `false`, the search stops.
        dfs: function(element, iteratee, opt, _visited, _distance) {

            opt = opt || {};
            var visited = _visited || {};
            var distance = _distance || 0;
            if (iteratee(element, distance) === false) { return; }
            visited[element.id] = true;

            this.getNeighbors(element, opt).forEach(function(neighbor) {
                if (!visited[neighbor.id]) {
                    this.dfs(neighbor, iteratee, opt, visited, distance + 1);
                }
            }, this);
        },

        // Get all the roots of the graph. Time complexity: O(|V|).
        getSources: function() {

            var sources = [];
            forIn(this._nodes, function(exists, node) {
                if (!this._in[node] || isEmpty(this._in[node])) {
                    sources.push(this.getCell(node));
                }
            }.bind(this));
            return sources;
        },

        // Get all the leafs of the graph. Time complexity: O(|V|).
        getSinks: function() {

            var sinks = [];
            forIn(this._nodes, function(exists, node) {
                if (!this._out[node] || isEmpty(this._out[node])) {
                    sinks.push(this.getCell(node));
                }
            }.bind(this));
            return sinks;
        },

        // Return `true` if `element` is a root. Time complexity: O(1).
        isSource: function(element) {

            return !this._in[element.id] || isEmpty(this._in[element.id]);
        },

        // Return `true` if `element` is a leaf. Time complexity: O(1).
        isSink: function(element) {

            return !this._out[element.id] || isEmpty(this._out[element.id]);
        },

        // Return `true` is `elementB` is a successor of `elementA`. Return `false` otherwise.
        isSuccessor: function(elementA, elementB) {

            var isSuccessor = false;
            this.search(elementA, function(element) {
                if (element === elementB && element !== elementA) {
                    isSuccessor = true;
                    return false;
                }
            }, { outbound: true });
            return isSuccessor;
        },

        // Return `true` is `elementB` is a predecessor of `elementA`. Return `false` otherwise.
        isPredecessor: function(elementA, elementB) {

            var isPredecessor = false;
            this.search(elementA, function(element) {
                if (element === elementB && element !== elementA) {
                    isPredecessor = true;
                    return false;
                }
            }, { inbound: true });
            return isPredecessor;
        },

        // Return `true` is `elementB` is a neighbor of `elementA`. Return `false` otherwise.
        // `opt.deep` controls whether to take into account embedded elements as well. See `getNeighbors()`
        // for more details.
        // If `opt.outbound` is set to `true`, return `true` only if `elementB` is a successor neighbor.
        // Similarly, if `opt.inbound` is set to `true`, return `true` only if `elementB` is a predecessor neighbor.
        isNeighbor: function(elementA, elementB, opt) {

            opt = opt || {};

            var inbound = opt.inbound;
            var outbound = opt.outbound;
            if ((inbound === undefined) && (outbound === undefined)) {
                inbound = outbound = true;
            }

            var isNeighbor = false;

            this.getConnectedLinks(elementA, opt).forEach(function(link) {

                var source = link.source();
                var target = link.target();

                // Discard if it is a point.
                if (inbound && has(source, 'id') && (source.id === elementB.id)) {
                    isNeighbor = true;
                    return false;
                }

                // Discard if it is a point, or if the neighbor was already added.
                if (outbound && has(target, 'id') && (target.id === elementB.id)) {
                    isNeighbor = true;
                    return false;
                }
            });

            return isNeighbor;
        },

        // Disconnect links connected to the cell `model`.
        disconnectLinks: function(model, opt) {

            this.getConnectedLinks(model).forEach(function(link) {

                link.set((link.source().id === model.id ? 'source' : 'target'), { x: 0, y: 0 }, opt);
            });
        },

        // Remove links connected to the cell `model` completely.
        removeLinks: function(model, opt) {

            invoke(this.getConnectedLinks(model), 'remove', opt);
        },

        // Find all elements at given point
        findModelsFromPoint: function(p) {

            return this.getElements().filter(function(el) {
                return el.getBBox().containsPoint(p);
            });
        },

        // Find all elements in given area
        findModelsInArea: function(rect, opt) {

            rect = g$1.rect(rect);
            opt = defaults(opt || {}, { strict: false });

            var method = opt.strict ? 'containsRect' : 'intersect';

            return this.getElements().filter(function(el) {
                return rect[method](el.getBBox());
            });
        },

        // Find all elements under the given element.
        findModelsUnderElement: function(element, opt) {

            opt = defaults(opt || {}, { searchBy: 'bbox' });

            var bbox = element.getBBox();
            var elements = (opt.searchBy === 'bbox')
                ? this.findModelsInArea(bbox)
                : this.findModelsFromPoint(bbox[opt.searchBy]());

            // don't account element itself or any of its descendants
            return elements.filter(function(el) {
                return element.id !== el.id && !el.isEmbeddedIn(element);
            });
        },


        // Return bounding box of all elements.
        getBBox: function() {

            return this.getCellsBBox(this.getCells());
        },

        // Return the bounding box of all cells in array provided.
        getCellsBBox: function(cells, opt) {
            opt || (opt = {});
            return toArray(cells).reduce(function(memo, cell) {
                var rect = cell.getBBox(opt);
                if (!rect) { return memo; }
                var angle = cell.angle();
                if (angle) { rect = rect.bbox(angle); }
                if (memo) {
                    return memo.union(rect);
                }
                return rect;
            }, null);
        },

        translate: function(dx, dy, opt) {

            // Don't translate cells that are embedded in any other cell.
            var cells = this.getCells().filter(function(cell) {
                return !cell.isEmbedded();
            });

            invoke(cells, 'translate', dx, dy, opt);

            return this;
        },

        resize: function(width, height, opt) {

            return this.resizeCells(width, height, this.getCells(), opt);
        },

        resizeCells: function(width, height, cells, opt) {

            // `getBBox` method returns `null` if no elements provided.
            // i.e. cells can be an array of links
            var bbox = this.getCellsBBox(cells);
            if (bbox) {
                var sx = Math.max(width / bbox.width, 0);
                var sy = Math.max(height / bbox.height, 0);
                invoke(cells, 'scale', sx, sy, bbox.origin(), opt);
            }

            return this;
        },

        startBatch: function(name, data) {

            data = data || {};
            this._batches[name] = (this._batches[name] || 0) + 1;

            return this.trigger('batch:start', assign({}, data, { batchName: name }));
        },

        stopBatch: function(name, data) {

            data = data || {};
            this._batches[name] = (this._batches[name] || 0) - 1;

            return this.trigger('batch:stop', assign({}, data, { batchName: name }));
        },

        hasActiveBatch: function(name) {

            if (arguments.length === 0) {
                return toArray(this._batches).some(function(batches) {
                    return batches > 0;
                });
            }
            if (Array.isArray(name)) {
                return name.some(function(name) {
                    return !!this._batches[name];
                }, this);
            }
            return !!this._batches[name];
        }

    }, {

        validations: {

            multiLinks: function(graph, link) {

                // Do not allow multiple links to have the same source and target.
                var source = link.source();
                var target = link.target();

                if (source.id && target.id) {

                    var sourceModel = link.getSourceCell();
                    if (sourceModel) {

                        var connectedLinks = graph.getConnectedLinks(sourceModel, { outbound: true });
                        var sameLinks = connectedLinks.filter(function(_link) {

                            var _source = _link.source();
                            var _target = _link.target();

                            return _source && _source.id === source.id &&
                                (!_source.port || (_source.port === source.port)) &&
                                _target && _target.id === target.id &&
                                (!_target.port || (_target.port === target.port));

                        });

                        if (sameLinks.length > 1) {
                            return false;
                        }
                    }
                }

                return true;
            },

            linkPinning: function(graph, link) {
                return link.source().id && link.target().id;
            }
        }

    });

    wrapWith(Graph.prototype, ['resetCells', 'addCells', 'removeCells'], wrappers.cells);

    var views = {};

    var View = Backbone.View.extend({

        options: {},
        theme: null,
        themeClassNamePrefix: addClassNamePrefix('theme-'),
        requireSetThemeOverride: false,
        defaultTheme: defaultTheme,
        children: null,
        childNodes: null,

        UPDATE_PRIORITY: 2,

        constructor: function(options) {

            this.requireSetThemeOverride = options && !!options.theme;
            this.options = assign({}, this.options, options);

            Backbone.View.call(this, options);
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

        renderChildren: function(children) {
            children || (children = result(this, 'children'));
            if (children) {
                var isSVG = this.svgElement;
                var namespace = V.namespace[isSVG ? 'svg' : 'xhtml'];
                var doc = parseDOMJSON(children, namespace);
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
                if (attributeValue) { return attributeValue; }
                // do not climb up the DOM
                if (currentNode === this.el) { return null; }
                // try parent node
                currentNode = currentNode.parentNode;
            }

            return null;
        },

        // Override the Backbone `_ensureElement()` method in order to create an
        // svg element (e.g., `<g>`) node that wraps all the nodes of the Cell view.
        // Expose class name setter as a separate method.
        _ensureElement: function() {
            if (!this.el) {
                var tagName = result(this, 'tagName');
                var attrs = assign({}, result(this, 'attributes'));
                var style = assign({}, result(this, 'style'));
                if (this.id) { attrs.id = result(this, 'id'); }
                this.setElement(this._createElement(tagName));
                this._setAttributes(attrs);
                this._setStyle(style);
            } else {
                this.setElement(result(this, 'el'));
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
            this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
            this.el = this.$el[0];
            if (this.svgElement) { this.vel = V(this.el); }
        },

        _ensureElClassName: function() {
            var className = result(this, 'className');
            if (!className) { return; }
            var prefixedClassName = addClassNamePrefix(className);
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

            Backbone.View.prototype.remove.apply(this, arguments);

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
            if (!events) { return this; }
            data || (data = {});
            var eventNS = this.getEventNamespace();
            for (var eventName in events) {
                var method = events[eventName];
                if (typeof method !== 'function') { method = this[method]; }
                if (!method) { continue; }
                $(element).on(eventName + eventNS, data, method.bind(this));
            }
            return this;
        },

        undelegateElementEvents: function(element) {
            $(element).off(this.getEventNamespace());
            return this;
        },

        delegateDocumentEvents: function(events, data) {
            events || (events = result(this, 'documentEvents'));
            return this.delegateElementEvents(document, events, data);
        },

        undelegateDocumentEvents: function() {
            return this.undelegateElementEvents(document);
        },

        eventData: function(evt, data) {
            if (!evt) { throw new Error('eventData(): event object required.'); }
            var currentData = evt.data;
            var key = '__' + this.cid + '__';
            if (data === undefined) {
                if (!currentData) { return {}; }
                return currentData[key] || {};
            }
            currentData || (currentData = evt.data = {});
            currentData[key] || (currentData[key] = {});
            assign(currentData[key], data);
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
            var protoProps = args[0] && assign({}, args[0]) || {};
            var staticProps = args[1] && assign({}, args[1]) || {};

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

            return Backbone.View.extend.call(this, protoProps, staticProps);
        }
    });

    // CellView base view and controller.
    // --------------------------------------------

    // This is the base view and controller for `ElementView` and `LinkView`.
    var CellView = View.extend({

        tagName: 'g',

        svgElement: true,

        selector: 'root',

        metrics: null,

        className: function() {

            var classNames = ['cell'];
            var type = this.model.get('type');

            if (type) {

                type.toLowerCase().split('.').forEach(function(value, index, list) {
                    classNames.push('type-' + list.slice(0, index + 1).join('-'));
                });
            }

            return classNames.join(' ');
        },

        _presentationAttributes: null,
        _flags: null,

        setFlags: function() {
            var flags = {};
            var attributes = {};
            var shift = 0;
            var i, n, label;
            var presentationAttributes = this.presentationAttributes;
            for (var attribute in presentationAttributes) {
                if (!presentationAttributes.hasOwnProperty(attribute)) { continue; }
                var labels = presentationAttributes[attribute];
                if (!Array.isArray(labels)) { labels = [labels]; }
                for (i = 0, n = labels.length; i < n; i++) {
                    label = labels[i];
                    var flag = flags[label];
                    if (!flag) {
                        flag = flags[label] = 1<<(shift++);
                    }
                    attributes[attribute] |= flag;
                }
            }
            var initFlag = this.initFlag;
            if (!Array.isArray(initFlag)) { initFlag = [initFlag]; }
            for (i = 0, n = initFlag.length; i < n; i++) {
                label = initFlag[i];
                if (!flags[label]) { flags[label] = 1<<(shift++); }
            }

            // 26 - 30 are reserved for paper flags
            // 31+ overflows maximal number
            if (shift > 25) { throw new Error('dia.CellView: Maximum number of flags exceeded.'); }

            this._flags = flags;
            this._presentationAttributes = attributes;
        },

        hasFlag: function(flag, label) {
            return flag & this.getFlag(label);
        },

        removeFlag: function(flag, label) {
            return flag ^ (flag & this.getFlag(label));
        },

        getFlag: function(label) {
            var flags = this._flags;
            if (!flags) { return 0; }
            var flag = 0;
            if (Array.isArray(label)) {
                for (var i = 0, n = label.length; i < n; i++) { flag |= flags[label[i]]; }
            } else {
                flag |= flags[label];
            }
            return flag;
        },

        attributes: function() {
            var cell = this.model;
            return {
                'model-id': cell.id,
                'data-type': cell.attributes.type
            };
        },

        constructor: function(options) {

            // Make sure a global unique id is assigned to this view. Store this id also to the properties object.
            // The global unique id makes sure that the same view can be rendered on e.g. different machines and
            // still be associated to the same object among all those clients. This is necessary for real-time
            // collaboration mechanism.
            options.id = options.id || guid(this);

            View.call(this, options);
        },

        initialize: function() {

            this.setFlags();

            View.prototype.initialize.apply(this, arguments);

            this.cleanNodesCache();

            // Store reference to this to the <g> DOM element so that the view is accessible through the DOM tree.
            this.$el.data('view', this);

            this.startListening();
        },

        startListening: function() {
            this.listenTo(this.model, 'change', this.onAttributesChange);
        },

        onAttributesChange: function(model, opt) {
            var flag = model.getChangeFlag(this._presentationAttributes);
            if (opt.updateHandled || !flag) { return; }
            if (opt.dirty && this.hasFlag(flag, 'UPDATE')) { flag |= this.getFlag('RENDER'); }
            // TODO: tool changes does not need to be sync
            // Fix Segments tools
            if (opt.tool) { opt.async = false; }
            var paper = this.paper;
            if (paper) { paper.requestViewUpdate(this, flag, this.UPDATE_PRIORITY, opt); }
        },

        parseDOMJSON: function(markup, root) {

            var doc = parseDOMJSON(markup);
            var selectors = doc.selectors;
            var groups = doc.groupSelectors;
            for (var group in groups) {
                if (selectors[group]) { throw new Error('dia.CellView: ambiguous group selector'); }
                selectors[group] = groups[group];
            }
            if (root) {
                var rootSelector = this.selector;
                if (selectors[rootSelector]) { throw new Error('dia.CellView: ambiguous root selector.'); }
                selectors[rootSelector] = root;
            }
            return { fragment: doc.fragment, selectors: selectors };
        },

        // Return `true` if cell link is allowed to perform a certain UI `feature`.
        // Example: `can('vertexMove')`, `can('labelMove')`.
        can: function(feature) {

            var interactive = isFunction(this.options.interactive)
                ? this.options.interactive(this)
                : this.options.interactive;

            return (isObject(interactive) && interactive[feature] !== false) ||
                (isBoolean(interactive) && interactive !== false);
        },

        findBySelector: function(selector, root, selectors) {

            root || (root = this.el);
            selectors || (selectors = this.selectors);

            // These are either descendants of `this.$el` of `this.$el` itself.
            // `.` is a special selector used to select the wrapping `<g>` element.
            if (!selector || selector === '.') { return [root]; }
            if (selectors) {
                var nodes = selectors[selector];
                if (nodes) {
                    if (Array.isArray(nodes)) { return nodes; }
                    return [nodes];
                }
            }
            // Maintaining backwards compatibility
            // e.g. `circle:first` would fail with querySelector() call
            return $(root).find(selector).toArray();
        },

        notify: function(eventName) {

            if (this.paper) {

                var args = Array.prototype.slice.call(arguments, 1);

                // Trigger the event on both the element itself and also on the paper.
                this.trigger.apply(this, [eventName].concat(args));

                // Paper event handlers receive the view object as the first argument.
                this.paper.trigger.apply(this.paper, [eventName, this].concat(args));
            }
        },

        getBBox: function(opt) {

            var bbox;
            if (opt && opt.useModelGeometry) {
                var model = this.model;
                bbox = model.getBBox().bbox(model.angle());
            } else {
                bbox = this.getNodeBBox(this.el);
            }

            return this.paper.localToPaperRect(bbox);
        },

        getNodeBBox: function(magnet) {

            var rect = this.getNodeBoundingRect(magnet);
            var magnetMatrix = this.getNodeMatrix(magnet);
            var translateMatrix = this.getRootTranslateMatrix();
            var rotateMatrix = this.getRootRotateMatrix();
            return V.transformRect(rect, translateMatrix.multiply(rotateMatrix).multiply(magnetMatrix));
        },

        getNodeUnrotatedBBox: function(magnet) {

            var rect = this.getNodeBoundingRect(magnet);
            var magnetMatrix = this.getNodeMatrix(magnet);
            var translateMatrix = this.getRootTranslateMatrix();
            return V.transformRect(rect, translateMatrix.multiply(magnetMatrix));
        },

        getRootTranslateMatrix: function() {

            var model = this.model;
            var position = model.position();
            var mt = V.createSVGMatrix().translate(position.x, position.y);
            return mt;
        },

        getRootRotateMatrix: function() {

            var mr = V.createSVGMatrix();
            var model = this.model;
            var angle = model.angle();
            if (angle) {
                var bbox = model.getBBox();
                var cx = bbox.width / 2;
                var cy = bbox.height / 2;
                mr = mr.translate(cx, cy).rotate(angle).translate(-cx, -cy);
            }
            return mr;
        },

        highlight: function(el, opt) {

            el = !el ? this.el : this.$(el)[0] || this.el;

            // set partial flag if the highlighted element is not the entire view.
            opt = opt || {};
            opt.partial = (el !== this.el);

            this.notify('cell:highlight', el, opt);
            return this;
        },

        unhighlight: function(el, opt) {

            el = !el ? this.el : this.$(el)[0] || this.el;

            opt = opt || {};
            opt.partial = el != this.el;

            this.notify('cell:unhighlight', el, opt);
            return this;
        },

        // Find the closest element that has the `magnet` attribute set to `true`. If there was not such
        // an element found, return the root element of the cell view.
        findMagnet: function(el) {

            var $el = this.$(el);
            var $rootEl = this.$el;

            if ($el.length === 0) {
                $el = $rootEl;
            }

            do {

                var magnet = $el.attr('magnet');
                if ((magnet || $el.is($rootEl)) && magnet !== 'false') {
                    return $el[0];
                }

                $el = $el.parent();

            } while ($el.length > 0);

            // If the overall cell has set `magnet === false`, then return `undefined` to
            // announce there is no magnet found for this cell.
            // This is especially useful to set on cells that have 'ports'. In this case,
            // only the ports have set `magnet === true` and the overall element has `magnet === false`.
            return undefined;
        },

        // Construct a unique selector for the `el` element within this view.
        // `prevSelector` is being collected through the recursive call.
        // No value for `prevSelector` is expected when using this method.
        getSelector: function(el, prevSelector) {

            var selector;

            if (el === this.el) {
                if (typeof prevSelector === 'string') { selector = '> ' + prevSelector; }
                return selector;
            }

            if (el) {

                var nthChild = V(el).index() + 1;
                selector = el.tagName + ':nth-child(' + nthChild + ')';

                if (prevSelector) {
                    selector += ' > ' + prevSelector;
                }

                selector = this.getSelector(el.parentNode, selector);
            }

            return selector;
        },

        getLinkEnd: function(magnet, x, y, link, endType) {

            var model = this.model;
            var id = model.id;
            var port = this.findAttribute('port', magnet);
            // Find a unique `selector` of the element under pointer that is a magnet.
            var selector = magnet.getAttribute('joint-selector');

            var end = { id: id };
            if (selector != null) { end.magnet = selector; }
            if (port != null) {
                end.port = port;
                if (!model.hasPort(port) && !selector) {
                    // port created via the `port` attribute (not API)
                    end.selector = this.getSelector(magnet);
                }
            } else if (selector == null && this.el !== magnet) {
                end.selector = this.getSelector(magnet);
            }

            var paper = this.paper;
            var connectionStrategy = paper.options.connectionStrategy;
            if (typeof connectionStrategy === 'function') {
                var strategy = connectionStrategy.call(paper, end, this, magnet, new g$1.Point(x, y), link, endType, paper);
                if (strategy) { end = strategy; }
            }

            return end;
        },

        getMagnetFromLinkEnd: function(end) {

            var root = this.el;
            var port = end.port;
            var selector = end.magnet;
            var model = this.model;
            var magnet;
            if (port != null && model.isElement() && model.hasPort(port)) {
                magnet = this.findPortNode(port, selector) || root;
            } else {
                if (!selector) { selector = end.selector; }
                if (!selector && port != null) {
                    // link end has only `id` and `port` property referencing
                    // a port created via the `port` attribute (not API).
                    selector = '[port="' + port + '"]';
                }
                magnet = this.findBySelector(selector, root, this.selectors)[0];
            }

            return magnet;
        },

        getAttributeDefinition: function(attrName) {

            return this.model.constructor.getAttributeDefinition(attrName);
        },

        setNodeAttributes: function(node, attrs) {

            if (!isEmpty(attrs)) {
                if (node instanceof SVGElement) {
                    V(node).attr(attrs);
                } else {
                    $(node).attr(attrs);
                }
            }
        },

        processNodeAttributes: function(node, attrs) {

            var attrName, attrVal, def, i, n;
            var normalAttrs, setAttrs, positionAttrs, offsetAttrs;
            var relatives = [];
            // divide the attributes between normal and special
            for (attrName in attrs) {
                if (!attrs.hasOwnProperty(attrName)) { continue; }
                attrVal = attrs[attrName];
                def = this.getAttributeDefinition(attrName);
                if (def && (!isFunction(def.qualify) || def.qualify.call(this, attrVal, node, attrs))) {
                    if (isString(def.set)) {
                        normalAttrs || (normalAttrs = {});
                        normalAttrs[def.set] = attrVal;
                    }
                    if (attrVal !== null) {
                        relatives.push(attrName, def);
                    }
                } else {
                    normalAttrs || (normalAttrs = {});
                    normalAttrs[toKebabCase(attrName)] = attrVal;
                }
            }

            // handle the rest of attributes via related method
            // from the special attributes namespace.
            for (i = 0, n = relatives.length; i < n; i+=2) {
                attrName = relatives[i];
                def = relatives[i+1];
                attrVal = attrs[attrName];
                if (isFunction(def.set)) {
                    setAttrs || (setAttrs = {});
                    setAttrs[attrName] = attrVal;
                }
                if (isFunction(def.position)) {
                    positionAttrs || (positionAttrs = {});
                    positionAttrs[attrName] = attrVal;
                }
                if (isFunction(def.offset)) {
                    offsetAttrs || (offsetAttrs = {});
                    offsetAttrs[attrName] = attrVal;
                }
            }

            return {
                raw: attrs,
                normal: normalAttrs,
                set: setAttrs,
                position: positionAttrs,
                offset: offsetAttrs
            };
        },

        updateRelativeAttributes: function(node, attrs, refBBox, opt) {

            opt || (opt = {});

            var attrName, attrVal, def;
            var rawAttrs = attrs.raw || {};
            var nodeAttrs = attrs.normal || {};
            var setAttrs = attrs.set;
            var positionAttrs = attrs.position;
            var offsetAttrs = attrs.offset;

            for (attrName in setAttrs) {
                attrVal = setAttrs[attrName];
                def = this.getAttributeDefinition(attrName);
                // SET - set function should return attributes to be set on the node,
                // which will affect the node dimensions based on the reference bounding
                // box. e.g. `width`, `height`, `d`, `rx`, `ry`, `points
                var setResult = def.set.call(this, attrVal, refBBox.clone(), node, rawAttrs);
                if (isObject(setResult)) {
                    assign(nodeAttrs, setResult);
                } else if (setResult !== undefined) {
                    nodeAttrs[attrName] = setResult;
                }
            }

            if (node instanceof HTMLElement) {
                // TODO: setting the `transform` attribute on HTMLElements
                // via `node.style.transform = 'matrix(...)';` would introduce
                // a breaking change (e.g. basic.TextBlock).
                this.setNodeAttributes(node, nodeAttrs);
                return;
            }

            // The final translation of the subelement.
            var nodeTransform = nodeAttrs.transform;
            var nodeMatrix = V.transformStringToMatrix(nodeTransform);
            var nodePosition = g$1.Point(nodeMatrix.e, nodeMatrix.f);
            if (nodeTransform) {
                nodeAttrs = omit(nodeAttrs, 'transform');
                nodeMatrix.e = nodeMatrix.f = 0;
            }

            // Calculate node scale determined by the scalable group
            // only if later needed.
            var sx, sy, translation;
            if (positionAttrs || offsetAttrs) {
                var nodeScale = this.getNodeScale(node, opt.scalableNode);
                sx = nodeScale.sx;
                sy = nodeScale.sy;
            }

            var positioned = false;
            for (attrName in positionAttrs) {
                attrVal = positionAttrs[attrName];
                def = this.getAttributeDefinition(attrName);
                // POSITION - position function should return a point from the
                // reference bounding box. The default position of the node is x:0, y:0 of
                // the reference bounding box or could be further specify by some
                // SVG attributes e.g. `x`, `y`
                translation = def.position.call(this, attrVal, refBBox.clone(), node, rawAttrs);
                if (translation) {
                    nodePosition.offset(g$1.Point(translation).scale(sx, sy));
                    positioned || (positioned = true);
                }
            }

            // The node bounding box could depend on the `size` set from the previous loop.
            // Here we know, that all the size attributes have been already set.
            this.setNodeAttributes(node, nodeAttrs);

            var offseted = false;
            if (offsetAttrs) {
                // Check if the node is visible
                var nodeBoundingRect = this.getNodeBoundingRect(node);
                if (nodeBoundingRect.width > 0 && nodeBoundingRect.height > 0) {
                    var nodeBBox = V.transformRect(nodeBoundingRect, nodeMatrix).scale(1 / sx, 1 / sy);
                    for (attrName in offsetAttrs) {
                        attrVal = offsetAttrs[attrName];
                        def = this.getAttributeDefinition(attrName);
                        // OFFSET - offset function should return a point from the element
                        // bounding box. The default offset point is x:0, y:0 (origin) or could be further
                        // specify with some SVG attributes e.g. `text-anchor`, `cx`, `cy`
                        translation = def.offset.call(this, attrVal, nodeBBox, node, rawAttrs);
                        if (translation) {
                            nodePosition.offset(g$1.Point(translation).scale(sx, sy));
                            offseted || (offseted = true);
                        }
                    }
                }
            }

            // Do not touch node's transform attribute if there is no transformation applied.
            if (nodeTransform !== undefined || positioned || offseted) {
                // Round the coordinates to 1 decimal point.
                nodePosition.round(1);
                nodeMatrix.e = nodePosition.x;
                nodeMatrix.f = nodePosition.y;
                node.setAttribute('transform', V.matrixToTransformString(nodeMatrix));
                // TODO: store nodeMatrix metrics?
            }
        },

        getNodeScale: function(node, scalableNode) {

            // Check if the node is a descendant of the scalable group.
            var sx, sy;
            if (scalableNode && scalableNode.contains(node)) {
                var scale = scalableNode.scale();
                sx = 1 / scale.sx;
                sy = 1 / scale.sy;
            } else {
                sx = 1;
                sy = 1;
            }

            return { sx: sx, sy: sy };
        },

        cleanNodesCache: function() {
            this.metrics = {};
        },

        nodeCache: function(magnet) {

            var metrics = this.metrics;
            // Don't use cache? It most likely a custom view with overridden update.
            if (!metrics) { return {}; }
            var id = V.ensureId(magnet);
            var value = metrics[id];
            if (!value) { value = metrics[id] = {}; }
            return value;
        },

        getNodeData: function(magnet) {

            var metrics = this.nodeCache(magnet);
            if (!metrics.data) { metrics.data = {}; }
            return metrics.data;
        },

        getNodeBoundingRect: function(magnet) {

            var metrics = this.nodeCache(magnet);
            if (metrics.boundingRect === undefined) { metrics.boundingRect = V(magnet).getBBox(); }
            return new g$1.Rect(metrics.boundingRect);
        },

        getNodeMatrix: function(magnet) {

            var metrics = this.nodeCache(magnet);
            if (metrics.magnetMatrix === undefined) {
                var target = this.rotatableNode || this.el;
                metrics.magnetMatrix = V(magnet).getTransformToElement(target);
            }
            return V.createSVGMatrix(metrics.magnetMatrix);
        },

        getNodeShape: function(magnet) {

            var metrics = this.nodeCache(magnet);
            if (metrics.geometryShape === undefined) { metrics.geometryShape = V(magnet).toGeometryShape(); }
            return metrics.geometryShape.clone();
        },

        isNodeConnection: function(node) {
            return this.model.isLink() && (!node || node === this.el);
        },

        findNodesAttributes: function(attrs, root, selectorCache, selectors) {

            var i, n, nodeAttrs, nodeId;
            var nodesAttrs = {};
            var mergeIds = [];
            for (var selector in attrs) {
                if (!attrs.hasOwnProperty(selector)) { continue; }
                var selected = selectorCache[selector] = this.findBySelector(selector, root, selectors);
                for (i = 0, n = selected.length; i < n; i++) {
                    var node = selected[i];
                    nodeId = V.ensureId(node);
                    nodeAttrs = attrs[selector];
                    // "unique" selectors are selectors that referencing a single node (defined by `selector`)
                    // groupSelector referencing a single node is not "unique"
                    var unique = (selectors && selectors[selector] === node);
                    var prevNodeAttrs = nodesAttrs[nodeId];
                    if (prevNodeAttrs) {
                        // Note, that nodes referenced by deprecated `CSS selectors` are not taken into account.
                        // e.g. css:`.circle` and selector:`circle` can be applied in a random order
                        if (!prevNodeAttrs.array) {
                            mergeIds.push(nodeId);
                            prevNodeAttrs.array = true;
                            prevNodeAttrs.attributes = [prevNodeAttrs.attributes];
                            prevNodeAttrs.selectedLength = [prevNodeAttrs.selectedLength];
                        }
                        var attributes = prevNodeAttrs.attributes;
                        var selectedLength = prevNodeAttrs.selectedLength;
                        if (unique) {
                            // node referenced by `selector`
                            attributes.unshift(nodeAttrs);
                            selectedLength.unshift(-1);
                        } else {
                            // node referenced by `groupSelector`
                            var sortIndex = sortedIndex(selectedLength, n);
                            attributes.splice(sortIndex, 0, nodeAttrs);
                            selectedLength.splice(sortIndex, 0, n);
                        }
                    } else {
                        nodesAttrs[nodeId] = {
                            attributes: nodeAttrs,
                            selectedLength: unique ? -1 : n,
                            node: node,
                            array: false
                        };
                    }
                }
            }

            for (i = 0, n = mergeIds.length; i < n; i++) {
                nodeId = mergeIds[i];
                nodeAttrs = nodesAttrs[nodeId];
                nodeAttrs.attributes = merge.apply(void 0, [ {} ].concat( nodeAttrs.attributes.reverse() ));
            }

            return nodesAttrs;
        },

        getEventTarget: function(evt, opt) {
            if ( opt === void 0 ) opt = {};

            // Touchmove/Touchend event's target is not reflecting the element under the coordinates as mousemove does.
            // It holds the element when a touchstart triggered.
            var target = evt.target;
            var type = evt.type;
            var clientX = evt.clientX; if ( clientX === void 0 ) clientX = 0;
            var clientY = evt.clientY; if ( clientY === void 0 ) clientY = 0;
            if (opt.fromPoint || type === 'touchmove' || type === 'touchend') {
                return document.elementFromPoint(clientX, clientY);
            }

            return target;
        },

        // Default is to process the `model.attributes.attrs` object and set attributes on subelements based on the selectors,
        // unless `attrs` parameter was passed.
        updateDOMSubtreeAttributes: function(rootNode, attrs, opt) {

            opt || (opt = {});
            opt.rootBBox || (opt.rootBBox = g$1.Rect());
            opt.selectors || (opt.selectors = this.selectors); // selector collection to use

            // Cache table for query results and bounding box calculation.
            // Note that `selectorCache` needs to be invalidated for all
            // `updateAttributes` calls, as the selectors might pointing
            // to nodes designated by an attribute or elements dynamically
            // created.
            var selectorCache = {};
            var bboxCache = {};
            var relativeItems = [];
            var item, node, nodeAttrs, nodeData, processedAttrs;

            var roAttrs = opt.roAttributes;
            var nodesAttrs = this.findNodesAttributes(roAttrs || attrs, rootNode, selectorCache, opt.selectors);
            // `nodesAttrs` are different from all attributes, when
            // rendering only  attributes sent to this method.
            var nodesAllAttrs = (roAttrs)
                ? this.findNodesAttributes(attrs, rootNode, selectorCache, opt.selectors)
                : nodesAttrs;

            for (var nodeId in nodesAttrs) {
                nodeData = nodesAttrs[nodeId];
                nodeAttrs = nodeData.attributes;
                node = nodeData.node;
                processedAttrs = this.processNodeAttributes(node, nodeAttrs);

                if (!processedAttrs.set && !processedAttrs.position && !processedAttrs.offset) {
                    // Set all the normal attributes right on the SVG/HTML element.
                    this.setNodeAttributes(node, processedAttrs.normal);

                } else {

                    var nodeAllAttrs = nodesAllAttrs[nodeId] && nodesAllAttrs[nodeId].attributes;
                    var refSelector = (nodeAllAttrs && (nodeAttrs.ref === undefined))
                        ? nodeAllAttrs.ref
                        : nodeAttrs.ref;

                    var refNode;
                    if (refSelector) {
                        refNode = (selectorCache[refSelector] || this.findBySelector(refSelector, rootNode, opt.selectors))[0];
                        if (!refNode) {
                            throw new Error('dia.ElementView: "' + refSelector + '" reference does not exist.');
                        }
                    } else {
                        refNode = null;
                    }

                    item = {
                        node: node,
                        refNode: refNode,
                        processedAttributes: processedAttrs,
                        allAttributes: nodeAllAttrs
                    };

                    // If an element in the list is positioned relative to this one, then
                    // we want to insert this one before it in the list.
                    var itemIndex = relativeItems.findIndex(function(item) {
                        return item.refNode === node;
                    });

                    if (itemIndex > -1) {
                        relativeItems.splice(itemIndex, 0, item);
                    } else {
                        relativeItems.push(item);
                    }
                }
            }

            var rotatableMatrix;
            for (var i = 0, n = relativeItems.length; i < n; i++) {
                item = relativeItems[i];
                node = item.node;
                refNode = item.refNode;

                // Find the reference element bounding box. If no reference was provided, we
                // use the optional bounding box.
                var vRotatable = V(opt.rotatableNode);
                var refNodeId = refNode ? V.ensureId(refNode) : '';
                var isRefNodeRotatable = !!vRotatable && !!refNode && vRotatable.contains(refNode);
                var unrotatedRefBBox = bboxCache[refNodeId];
                if (!unrotatedRefBBox) {
                    // Get the bounding box of the reference element relative to the `rotatable` `<g>` (without rotation)
                    // or to the root `<g>` element if no rotatable group present if reference node present.
                    // Uses the bounding box provided.
                    var transformationTarget = (isRefNodeRotatable) ? vRotatable : rootNode;
                    unrotatedRefBBox = bboxCache[refNodeId] = (refNode)
                        ? V(refNode).getBBox({ target: transformationTarget })
                        : opt.rootBBox;
                }

                if (roAttrs) {
                    // if there was a special attribute affecting the position amongst passed-in attributes
                    // we have to merge it with the rest of the element's attributes as they are necessary
                    // to update the position relatively (i.e `ref-x` && 'ref-dx')
                    processedAttrs = this.processNodeAttributes(node, item.allAttributes);
                    this.mergeProcessedAttributes(processedAttrs, item.processedAttributes);

                } else {
                    processedAttrs = item.processedAttributes;
                }

                var refBBox = unrotatedRefBBox;
                if (isRefNodeRotatable && !vRotatable.contains(node)) {
                    // if the referenced node is inside the rotatable group while the updated node is outside,
                    // we need to take the rotatable node transformation into account
                    if (!rotatableMatrix) { rotatableMatrix = V.transformStringToMatrix(vRotatable.attr('transform')); }
                    refBBox = V.transformRect(unrotatedRefBBox, rotatableMatrix);
                }

                this.updateRelativeAttributes(node, processedAttrs, refBBox, opt);
            }
        },

        mergeProcessedAttributes: function(processedAttrs, roProcessedAttrs) {

            processedAttrs.set || (processedAttrs.set = {});
            processedAttrs.position || (processedAttrs.position = {});
            processedAttrs.offset || (processedAttrs.offset = {});

            assign(processedAttrs.set, roProcessedAttrs.set);
            assign(processedAttrs.position, roProcessedAttrs.position);
            assign(processedAttrs.offset, roProcessedAttrs.offset);

            // Handle also the special transform property.
            var transform = processedAttrs.normal && processedAttrs.normal.transform;
            if (transform !== undefined && roProcessedAttrs.normal) {
                roProcessedAttrs.normal.transform = transform;
            }
            processedAttrs.normal = roProcessedAttrs.normal;
        },

        onRemove: function() {
            this.removeTools();
        },

        _toolsView: null,

        hasTools: function(name) {
            var toolsView = this._toolsView;
            if (!toolsView) { return false; }
            if (!name) { return true; }
            return (toolsView.getName() === name);
        },

        addTools: function(toolsView) {

            this.removeTools();

            if (toolsView) {
                this._toolsView = toolsView;
                toolsView.configure({ relatedView: this });
                toolsView.listenTo(this.paper, 'tools:event', this.onToolEvent.bind(this));
                toolsView.mount();
            }
            return this;
        },

        updateTools: function(opt) {

            var toolsView = this._toolsView;
            if (toolsView) { toolsView.update(opt); }
            return this;
        },

        removeTools: function() {

            var toolsView = this._toolsView;
            if (toolsView) {
                toolsView.remove();
                this._toolsView = null;
            }
            return this;
        },

        hideTools: function() {

            var toolsView = this._toolsView;
            if (toolsView) { toolsView.hide(); }
            return this;
        },

        showTools: function() {

            var toolsView = this._toolsView;
            if (toolsView) { toolsView.show(); }
            return this;
        },

        onToolEvent: function(event) {
            switch (event) {
                case 'remove':
                    this.removeTools();
                    break;
                case 'hide':
                    this.hideTools();
                    break;
                case 'show':
                    this.showTools();
                    break;
            }
        },

        // Interaction. The controller part.
        // ---------------------------------

        // Interaction is handled by the paper and delegated to the view in interest.
        // `x` & `y` parameters passed to these functions represent the coordinates already snapped to the paper grid.
        // If necessary, real coordinates can be obtained from the `evt` event object.

        // These functions are supposed to be overriden by the views that inherit from `joint.dia.Cell`,
        // i.e. `joint.dia.Element` and `joint.dia.Link`.

        pointerdblclick: function(evt, x, y) {

            this.notify('cell:pointerdblclick', evt, x, y);
        },

        pointerclick: function(evt, x, y) {

            this.notify('cell:pointerclick', evt, x, y);
        },

        contextmenu: function(evt, x, y) {

            this.notify('cell:contextmenu', evt, x, y);
        },

        pointerdown: function(evt, x, y) {

            if (this.model.graph) {
                this.model.startBatch('pointer');
                this._graph = this.model.graph;
            }

            this.notify('cell:pointerdown', evt, x, y);
        },

        pointermove: function(evt, x, y) {

            this.notify('cell:pointermove', evt, x, y);
        },

        pointerup: function(evt, x, y) {

            this.notify('cell:pointerup', evt, x, y);

            if (this._graph) {
                // we don't want to trigger event on model as model doesn't
                // need to be member of collection anymore (remove)
                this._graph.stopBatch('pointer', { cell: this.model });
                delete this._graph;
            }
        },

        mouseover: function(evt) {

            this.notify('cell:mouseover', evt);
        },

        mouseout: function(evt) {

            this.notify('cell:mouseout', evt);
        },

        mouseenter: function(evt) {

            this.notify('cell:mouseenter', evt);
        },

        mouseleave: function(evt) {

            this.notify('cell:mouseleave', evt);
        },

        mousewheel: function(evt, x, y, delta) {

            this.notify('cell:mousewheel', evt, x, y, delta);
        },

        onevent: function(evt, eventName, x, y) {

            this.notify(eventName, evt, x, y);
        },

        onmagnet: function() {

            // noop
        },

        magnetpointerdblclick: function() {

            // noop
        },

        magnetcontextmenu: function() {

            // noop
        },

        checkMouseleave: function checkMouseleave(evt) {
            var target = this.getEventTarget(evt, { fromPoint: true });
            var view = this.paper.findView(target);
            if (view === this) { return; }
            this.mouseleave(evt);
            if (!view) { return; }
            view.mouseenter(evt);
        },

        setInteractivity: function(value) {

            this.options.interactive = value;
        }
    }, {

        addPresentationAttributes: function(presentationAttributes) {
            return merge({}, this.prototype.presentationAttributes, presentationAttributes, function(a, b) {
                if (!a || !b) { return; }
                if (typeof a === 'string') { a = [a]; }
                if (typeof b === 'string') { b = [b]; }
                if (Array.isArray(a) && Array.isArray(b)) { return uniq(a.concat(b)); }
            });
        }
    });

    // Element base view and controller.
    // -------------------------------------------

    var ElementView = CellView.extend({

        /**
         * @abstract
         */
        _removePorts: function() {
            // implemented in ports.js
        },

        /**
         *
         * @abstract
         */
        _renderPorts: function() {
            // implemented in ports.js
        },

        className: function() {

            var classNames = CellView.prototype.className.apply(this).split(' ');

            classNames.push('element');

            return classNames.join(' ');
        },

        initialize: function() {

            CellView.prototype.initialize.apply(this, arguments);

            this._initializePorts();
        },

        presentationAttributes: {
            'attrs': ['UPDATE'],
            'position': ['TRANSLATE'],
            'size': ['RESIZE', 'PORTS'],
            'angle': ['ROTATE'],
            'markup': ['RENDER'],
            'ports': ['PORTS']
        },

        initFlag: ['RENDER'],

        UPDATE_PRIORITY: 0,

        confirmUpdate: function(flag, opt) {
            if (this.hasFlag(flag, 'RENDER')) {
                this.render();
                flag = this.removeFlag(flag, ['RENDER', 'UPDATE', 'RESIZE', 'TRANSLATE', 'ROTATE', 'PORTS']);
                return flag;
            }
            if (this.hasFlag(flag, 'RESIZE')) {
                this.resize(opt);
                // Resize method is calling `update()` internally
                flag = this.removeFlag(flag, ['RESIZE', 'UPDATE']);
            }
            if (this.hasFlag(flag, 'UPDATE')) {
                this.update(this.model, null, opt);
                flag = this.removeFlag(flag, 'UPDATE');
            }
            if (this.hasFlag(flag, 'TRANSLATE')) {
                this.translate();
                flag = this.removeFlag(flag, 'TRANSLATE');
            }
            if (this.hasFlag(flag, 'ROTATE')) {
                this.rotate();
                flag = this.removeFlag(flag, 'ROTATE');
            }
            if (this.hasFlag(flag, 'PORTS')) {
                this._refreshPorts();
                flag = this.removeFlag(flag, 'PORTS');
            }
            return flag;
        },

        /**
         * @abstract
         */
        _initializePorts: function() {

        },

        update: function(_$$1, renderingOnlyAttrs) {

            this.cleanNodesCache();

            var model = this.model;
            var modelAttrs = model.attr();
            this.updateDOMSubtreeAttributes(this.el, modelAttrs, {
                rootBBox: new g$1.Rect(model.size()),
                selectors: this.selectors,
                scalableNode: this.scalableNode,
                rotatableNode: this.rotatableNode,
                // Use rendering only attributes if they differs from the model attributes
                roAttributes: (renderingOnlyAttrs === modelAttrs) ? null : renderingOnlyAttrs
            });
        },

        rotatableSelector: 'rotatable',
        scalableSelector: 'scalable',
        scalableNode: null,
        rotatableNode: null,

        // `prototype.markup` is rendered by default. Set the `markup` attribute on the model if the
        // default markup is not desirable.
        renderMarkup: function() {

            var element = this.model;
            var markup = element.get('markup') || element.markup;
            if (!markup) { throw new Error('dia.ElementView: markup required'); }
            if (Array.isArray(markup)) { return this.renderJSONMarkup(markup); }
            if (typeof markup === 'string') { return this.renderStringMarkup(markup); }
            throw new Error('dia.ElementView: invalid markup');
        },

        renderJSONMarkup: function(markup) {

            var doc = this.parseDOMJSON(markup, this.el);
            var selectors = this.selectors = doc.selectors;
            this.rotatableNode = V(selectors[this.rotatableSelector]) || null;
            this.scalableNode = V(selectors[this.scalableSelector]) || null;
            // Fragment
            this.vel.append(doc.fragment);
        },

        renderStringMarkup: function(markup) {

            var vel = this.vel;
            vel.append(V(markup));
            // Cache transformation groups
            this.rotatableNode = vel.findOne('.rotatable');
            this.scalableNode = vel.findOne('.scalable');

            var selectors = this.selectors = {};
            selectors[this.selector] = this.el;
        },

        render: function() {

            this.vel.empty();
            this.renderMarkup();
            if (this.scalableNode) {
                // Double update is necessary for elements with the scalable group only
                // Note the resize() triggers the other `update`.
                this.update();
            }
            this.resize();
            if (this.rotatableNode) {
                // Translate transformation is applied on `this.el` while the rotation transformation
                // on `this.rotatableNode`
                this.rotate();
                this.translate();
            } else {
                this.updateTransformation();
            }
            this._refreshPorts();
            return this;
        },

        resize: function(opt) {

            if (this.scalableNode) { return this.sgResize(opt); }
            if (this.model.attributes.angle) { this.rotate(); }
            this.update();
        },

        translate: function() {

            if (this.rotatableNode) { return this.rgTranslate(); }
            this.updateTransformation();
        },

        rotate: function() {

            if (this.rotatableNode) {
                this.rgRotate();
                // It's necessary to call the update for the nodes outside
                // the rotatable group referencing nodes inside the group
                this.update();
                return;
            }
            this.updateTransformation();
        },

        updateTransformation: function() {

            var transformation = this.getTranslateString();
            var rotateString = this.getRotateString();
            if (rotateString) { transformation += ' ' + rotateString; }
            this.vel.attr('transform', transformation);
        },

        getTranslateString: function() {

            var position = this.model.attributes.position;
            return 'translate(' + position.x + ',' + position.y + ')';
        },

        getRotateString: function() {
            var attributes = this.model.attributes;
            var angle = attributes.angle;
            if (!angle) { return null; }
            var size = attributes.size;
            return 'rotate(' + angle + ',' + (size.width / 2) + ',' + (size.height / 2) + ')';
        },

        // Rotatable & Scalable Group
        // always slower, kept mainly for backwards compatibility

        rgRotate: function() {

            this.rotatableNode.attr('transform', this.getRotateString());
        },

        rgTranslate: function() {

            this.vel.attr('transform', this.getTranslateString());
        },

        sgResize: function(opt) {

            var model = this.model;
            var angle = model.angle();
            var size = model.size();
            var scalable = this.scalableNode;

            // Getting scalable group's bbox.
            // Due to a bug in webkit's native SVG .getBBox implementation, the bbox of groups with path children includes the paths' control points.
            // To work around the issue, we need to check whether there are any path elements inside the scalable group.
            var recursive = false;
            if (scalable.node.getElementsByTagName('path').length > 0) {
                // If scalable has at least one descendant that is a path, we need to switch to recursive bbox calculation.
                // If there are no path descendants, group bbox calculation works and so we can use the (faster) native function directly.
                recursive = true;
            }
            var scalableBBox = scalable.getBBox({ recursive: recursive });

            // Make sure `scalableBbox.width` and `scalableBbox.height` are not zero which can happen if the element does not have any content. By making
            // the width/height 1, we prevent HTML errors of the type `scale(Infinity, Infinity)`.
            var sx = (size.width / (scalableBBox.width || 1));
            var sy = (size.height / (scalableBBox.height || 1));
            scalable.attr('transform', 'scale(' + sx + ',' + sy + ')');

            // Now the interesting part. The goal is to be able to store the object geometry via just `x`, `y`, `angle`, `width` and `height`
            // Order of transformations is significant but we want to reconstruct the object always in the order:
            // resize(), rotate(), translate() no matter of how the object was transformed. For that to work,
            // we must adjust the `x` and `y` coordinates of the object whenever we resize it (because the origin of the
            // rotation changes). The new `x` and `y` coordinates are computed by canceling the previous rotation
            // around the center of the resized object (which is a different origin then the origin of the previous rotation)
            // and getting the top-left corner of the resulting object. Then we clean up the rotation back to what it originally was.

            // Cancel the rotation but now around a different origin, which is the center of the scaled object.
            var rotatable = this.rotatableNode;
            var rotation = rotatable && rotatable.attr('transform');
            if (rotation) {

                rotatable.attr('transform', rotation + ' rotate(' + (-angle) + ',' + (size.width / 2) + ',' + (size.height / 2) + ')');
                var rotatableBBox = scalable.getBBox({ target: this.paper.cells });

                // Store new x, y and perform rotate() again against the new rotation origin.
                model.set('position', { x: rotatableBBox.x, y: rotatableBBox.y }, assign({ updateHandled: true }, opt));
                this.translate();
                this.rotate();
            }

            // Update must always be called on non-rotated element. Otherwise, relative positioning
            // would work with wrong (rotated) bounding boxes.
            this.update();
        },

        // Embedding mode methods.
        // -----------------------

        prepareEmbedding: function(data) {

            data || (data = {});

            var model = data.model || this.model;
            var paper = data.paper || this.paper;
            var graph = paper.model;

            model.startBatch('to-front');

            // Bring the model to the front with all his embeds.
            model.toFront({ deep: true, ui: true });

            // Note that at this point cells in the collection are not sorted by z index (it's running in the batch, see
            // the dia.Graph._sortOnChangeZ), so we can't assume that the last cell in the collection has the highest z.
            var maxZ = graph.getElements().reduce(function(max, cell) {
                return Math.max(max, cell.attributes.z || 0);
            }, 0);

            // Move to front also all the inbound and outbound links that are connected
            // to any of the element descendant. If we bring to front only embedded elements,
            // links connected to them would stay in the background.
            var connectedLinks = graph.getConnectedLinks(model, { deep: true, includeEnclosed: true });
            connectedLinks.forEach(function(link) {
                if (link.attributes.z <= maxZ) { link.set('z', maxZ + 1, { ui: true }); }
            });

            model.stopBatch('to-front');

            // Before we start looking for suitable parent we remove the current one.
            var parentId = model.parent();
            if (parentId) {
                graph.getCell(parentId).unembed(model, { ui: true });
            }
        },

        processEmbedding: function(data) {

            data || (data = {});

            var model = data.model || this.model;
            var paper = data.paper || this.paper;
            var paperOptions = paper.options;

            var candidates = [];
            if (isFunction(paperOptions.findParentBy)) {
                var parents = toArray(paperOptions.findParentBy.call(paper.model, this));
                candidates = parents.filter(function(el) {
                    return el instanceof Cell && this.model.id !== el.id && !el.isEmbeddedIn(this.model);
                }.bind(this));
            } else {
                candidates = paper.model.findModelsUnderElement(model, { searchBy: paperOptions.findParentBy });
            }

            if (paperOptions.frontParentOnly) {
                // pick the element with the highest `z` index
                candidates = candidates.slice(-1);
            }

            var newCandidateView = null;
            var prevCandidateView = data.candidateEmbedView;

            // iterate over all candidates starting from the last one (has the highest z-index).
            for (var i = candidates.length - 1; i >= 0; i--) {

                var candidate = candidates[i];

                if (prevCandidateView && prevCandidateView.model.id == candidate.id) {

                    // candidate remains the same
                    newCandidateView = prevCandidateView;
                    break;

                } else {

                    var view = candidate.findView(paper);
                    if (paperOptions.validateEmbedding.call(paper, this, view)) {

                        // flip to the new candidate
                        newCandidateView = view;
                        break;
                    }
                }
            }

            if (newCandidateView && newCandidateView != prevCandidateView) {
                // A new candidate view found. Highlight the new one.
                this.clearEmbedding(data);
                data.candidateEmbedView = newCandidateView.highlight(null, { embedding: true });
            }

            if (!newCandidateView && prevCandidateView) {
                // No candidate view found. Unhighlight the previous candidate.
                this.clearEmbedding(data);
            }
        },

        clearEmbedding: function(data) {

            data || (data = {});

            var candidateView = data.candidateEmbedView;
            if (candidateView) {
                // No candidate view found. Unhighlight the previous candidate.
                candidateView.unhighlight(null, { embedding: true });
                data.candidateEmbedView = null;
            }
        },

        finalizeEmbedding: function(data) {

            data || (data = {});

            var candidateView = data.candidateEmbedView;
            var model = data.model || this.model;
            var paper = data.paper || this.paper;

            if (candidateView) {

                // We finished embedding. Candidate view is chosen to become the parent of the model.
                candidateView.model.embed(model, { ui: true });
                candidateView.unhighlight(null, { embedding: true });

                data.candidateEmbedView = null;
            }

            invoke(paper.model.getConnectedLinks(model, { deep: true }), 'reparent', { ui: true });
        },

        getDelegatedView: function() {

            var view = this;
            var model = view.model;
            var paper = view.paper;

            while (view) {
                if (model.isLink()) { break; }
                if (!model.isEmbedded() || view.can('stopDelegation')) { return view; }
                model = model.getParentCell();
                view = paper.findViewByModel(model);
            }

            return null;
        },

        // Interaction. The controller part.
        // ---------------------------------

        notifyPointerdown: function notifyPointerdown(evt, x, y) {
            CellView.prototype.pointerdown.call(this, evt, x, y);
            this.notify('element:pointerdown', evt, x, y);
        },

        notifyPointermove: function notifyPointermove(evt, x, y) {
            CellView.prototype.pointermove.call(this, evt, x, y);
            this.notify('element:pointermove', evt, x, y);
        },

        notifyPointerup: function notifyPointerup(evt, x, y) {
            this.notify('element:pointerup', evt, x, y);
            CellView.prototype.pointerup.call(this, evt, x, y);
        },

        pointerdblclick: function(evt, x, y) {

            CellView.prototype.pointerdblclick.apply(this, arguments);
            this.notify('element:pointerdblclick', evt, x, y);
        },

        pointerclick: function(evt, x, y) {

            CellView.prototype.pointerclick.apply(this, arguments);
            this.notify('element:pointerclick', evt, x, y);
        },

        contextmenu: function(evt, x, y) {

            CellView.prototype.contextmenu.apply(this, arguments);
            this.notify('element:contextmenu', evt, x, y);
        },

        pointerdown: function(evt, x, y) {

            if (this.isPropagationStopped(evt)) { return; }

            this.notifyPointerdown(evt, x, y);
            this.dragStart(evt, x, y);
        },

        pointermove: function(evt, x, y) {

            var data = this.eventData(evt);

            switch (data.action) {
                case 'magnet':
                    this.dragMagnet(evt, x, y);
                    break;
                case 'move':
                    (data.delegatedView || this).drag(evt, x, y);
                // eslint: no-fallthrough=false
                default:
                    this.notifyPointermove(evt, x, y);
                    break;
            }

            // Make sure the element view data is passed along.
            // It could have been wiped out in the handlers above.
            this.eventData(evt, data);
        },

        pointerup: function(evt, x, y) {

            var data = this.eventData(evt);
            switch (data.action) {
                case 'magnet':
                    this.dragMagnetEnd(evt, x, y);
                    break;
                case 'move':
                    (data.delegatedView || this).dragEnd(evt, x, y);
                // eslint: no-fallthrough=false
                default:
                    this.notifyPointerup(evt, x, y);
            }

            var magnet = data.targetMagnet;
            if (magnet) { this.magnetpointerclick(evt, magnet, x, y); }

            this.checkMouseleave(evt);
        },

        mouseover: function(evt) {

            CellView.prototype.mouseover.apply(this, arguments);
            this.notify('element:mouseover', evt);
        },

        mouseout: function(evt) {

            CellView.prototype.mouseout.apply(this, arguments);
            this.notify('element:mouseout', evt);
        },

        mouseenter: function(evt) {

            CellView.prototype.mouseenter.apply(this, arguments);
            this.notify('element:mouseenter', evt);
        },

        mouseleave: function(evt) {

            CellView.prototype.mouseleave.apply(this, arguments);
            this.notify('element:mouseleave', evt);
        },

        mousewheel: function(evt, x, y, delta) {

            CellView.prototype.mousewheel.apply(this, arguments);
            this.notify('element:mousewheel', evt, x, y, delta);
        },

        onmagnet: function(evt, x, y) {

            this.dragMagnetStart(evt, x, y);
        },

        magnetpointerdblclick: function(evt, magnet, x, y) {

            this.notify('element:magnet:pointerdblclick', evt, magnet, x, y);
        },

        magnetcontextmenu: function(evt, magnet, x, y) {

            this.notify('element:magnet:contextmenu', evt, magnet, x, y);
        },

        // Drag Start Handlers

        dragStart: function(evt, x, y) {

            var view = this.getDelegatedView();
            if (!view || !view.can('elementMove')) { return; }

            this.eventData(evt, {
                action: 'move',
                delegatedView: view
            });

            view.eventData(evt, {
                pointerOffset: view.model.position().difference(x, y),
                restrictedArea: this.paper.getRestrictedArea(view)
            });
        },

        dragMagnetStart: function(evt, x, y) {

            if (!this.can('addLinkFromMagnet')) { return; }

            var magnet = evt.currentTarget;
            var paper = this.paper;
            this.eventData(evt, { targetMagnet: magnet });
            evt.stopPropagation();

            if (paper.options.validateMagnet(this, magnet)) {

                if (paper.options.magnetThreshold <= 0) {
                    this.dragLinkStart(evt, magnet, x, y);
                }

                this.eventData(evt, { action: 'magnet' });
                this.stopPropagation(evt);

            } else {

                this.pointerdown(evt, x, y);
            }

            paper.delegateDragEvents(this, evt.data);
        },

        dragLinkStart: function(evt, magnet, x, y) {

            this.model.startBatch('add-link');

            var linkView = this.addLinkFromMagnet(magnet, x, y);

            // backwards compatibility events
            linkView.notifyPointerdown(evt, x, y);

            linkView.eventData(evt, linkView.startArrowheadMove('target', { whenNotAllowed: 'remove' }));
            this.eventData(evt, { linkView: linkView });
        },

        addLinkFromMagnet: function(magnet, x, y) {

            var paper = this.paper;
            var graph = paper.model;

            var link = paper.getDefaultLink(this, magnet);
            link.set({
                source: this.getLinkEnd(magnet, x, y, link, 'source'),
                target: { x: x, y: y }
            }).addTo(graph, {
                async: false,
                ui: true
            });

            return link.findView(paper);
        },

        // Drag Handlers

        drag: function(evt, x, y) {

            var paper = this.paper;
            var grid = paper.options.gridSize;
            var element = this.model;
            var data = this.eventData(evt);
            var pointerOffset = data.pointerOffset;
            var restrictedArea = data.restrictedArea;
            var embedding = data.embedding;

            // Make sure the new element's position always snaps to the current grid
            var elX = g$1.snapToGrid(x + pointerOffset.x, grid);
            var elY = g$1.snapToGrid(y + pointerOffset.y, grid);

            element.position(elX, elY, { restrictedArea: restrictedArea, deep: true, ui: true });

            if (paper.options.embeddingMode) {
                if (!embedding) {
                    // Prepare the element for embedding only if the pointer moves.
                    // We don't want to do unnecessary action with the element
                    // if an user only clicks/dblclicks on it.
                    this.prepareEmbedding(data);
                    embedding = true;
                }
                this.processEmbedding(data);
            }

            this.eventData(evt, {
                embedding: embedding
            });
        },

        dragMagnet: function(evt, x, y) {

            var data = this.eventData(evt);
            var linkView = data.linkView;
            if (linkView) {
                linkView.pointermove(evt, x, y);
            } else {
                var paper = this.paper;
                var magnetThreshold = paper.options.magnetThreshold;
                var currentTarget = this.getEventTarget(evt);
                var targetMagnet = data.targetMagnet;
                if (magnetThreshold === 'onleave') {
                    // magnetThreshold when the pointer leaves the magnet
                    if (targetMagnet === currentTarget || V(targetMagnet).contains(currentTarget)) { return; }
                } else {
                    // magnetThreshold defined as a number of movements
                    if (paper.eventData(evt).mousemoved <= magnetThreshold) { return; }
                }
                this.dragLinkStart(evt, targetMagnet, x, y);
            }
        },

        // Drag End Handlers

        dragEnd: function(evt, x, y) {

            var data = this.eventData(evt);
            if (data.embedding) { this.finalizeEmbedding(data); }
        },

        dragMagnetEnd: function(evt, x, y) {

            var data = this.eventData(evt);
            var linkView = data.linkView;
            if (!linkView) { return; }
            linkView.pointerup(evt, x, y);
            this.model.stopBatch('add-link');
        },

        magnetpointerclick: function(evt, magnet, x, y) {
            var paper = this.paper;
            if (paper.eventData(evt).mousemoved > paper.options.clickThreshold) { return; }
            this.notify('element:magnet:pointerclick', evt, magnet, x, y);
        }

    });

    assign(ElementView.prototype, elementViewPortPrototype);

    // Does not make any changes to vertices.
    // Returns the arguments that are passed to it, unchanged.
    var normal = function(vertices, opt, linkView) {

        return vertices;
    };

    // Routes the link always to/from a certain side
    //
    // Arguments:
    //   padding ... gap between the element and the first vertex. :: Default 40.
    //   side ... 'left' | 'right' | 'top' | 'bottom' :: Default 'bottom'.
    //
    var oneSide = function(vertices, opt, linkView) {

        var side = opt.side || 'bottom';
        var padding = normalizeSides(opt.padding || 40);

        // LinkView contains cached source an target bboxes.
        // Note that those are Geometry rectangle objects.
        var sourceBBox = linkView.sourceBBox;
        var targetBBox = linkView.targetBBox;
        var sourcePoint = sourceBBox.center();
        var targetPoint = targetBBox.center();

        var coordinate, dimension, direction;

        switch (side) {
            case 'bottom':
                direction = 1;
                coordinate = 'y';
                dimension = 'height';
                break;
            case 'top':
                direction = -1;
                coordinate = 'y';
                dimension = 'height';
                break;
            case 'left':
                direction = -1;
                coordinate = 'x';
                dimension = 'width';
                break;
            case 'right':
                direction = 1;
                coordinate = 'x';
                dimension = 'width';
                break;
            default:
                throw new Error('Router: invalid side');
        }

        // move the points from the center of the element to outside of it.
        sourcePoint[coordinate] += direction * (sourceBBox[dimension] / 2 + padding[side]);
        targetPoint[coordinate] += direction * (targetBBox[dimension] / 2 + padding[side]);

        // make link orthogonal (at least the first and last vertex).
        if ((direction * (sourcePoint[coordinate] - targetPoint[coordinate])) > 0) {
            targetPoint[coordinate] = sourcePoint[coordinate];
        } else {
            sourcePoint[coordinate] = targetPoint[coordinate];
        }

        return [sourcePoint].concat(vertices, targetPoint);
    };

    // bearing -> opposite bearing
    var opposites = {
        N: 'S',
        S: 'N',
        E: 'W',
        W: 'E'
    };

    // bearing -> radians
    var radians = {
        N: -Math.PI / 2 * 3,
        S: -Math.PI / 2,
        E: 0,
        W: Math.PI
    };

    // HELPERS //

    // returns a point `p` where lines p,p1 and p,p2 are perpendicular and p is not contained
    // in the given box
    function freeJoin(p1, p2, bbox) {

        var p = new g$1.Point(p1.x, p2.y);
        if (bbox.containsPoint(p)) { p = new g$1.Point(p2.x, p1.y); }
        // kept for reference
        // if (bbox.containsPoint(p)) p = null;

        return p;
    }

    // returns either width or height of a bbox based on the given bearing
    function getBBoxSize(bbox, bearing) {

        return bbox[(bearing === 'W' || bearing === 'E') ? 'width' : 'height'];
    }

    // simple bearing method (calculates only orthogonal cardinals)
    function getBearing(from, to) {

        if (from.x === to.x) { return (from.y > to.y) ? 'N' : 'S'; }
        if (from.y === to.y) { return (from.x > to.x) ? 'W' : 'E'; }
        return null;
    }

    // transform point to a rect
    function getPointBox(p) {

        return new g$1.Rect(p.x, p.y, 0, 0);
    }

    function getPaddingBox(opt) {

        // if both provided, opt.padding wins over opt.elementPadding
        var sides = normalizeSides(opt.padding || opt.elementPadding || 20);

        return {
            x: -sides.left,
            y: -sides.top,
            width: sides.left + sides.right,
            height: sides.top + sides.bottom
        };
    }

    // return source bbox
    function getSourceBBox(linkView, opt) {

        return linkView.sourceBBox.clone().moveAndExpand(getPaddingBox(opt));
    }

    // return target bbox
    function getTargetBBox(linkView, opt) {

        return linkView.targetBBox.clone().moveAndExpand(getPaddingBox(opt));
    }

    // return source anchor
    function getSourceAnchor(linkView, opt) {

        if (linkView.sourceAnchor) { return linkView.sourceAnchor; }

        // fallback: center of bbox
        var sourceBBox = getSourceBBox(linkView, opt);
        return sourceBBox.center();
    }

    // return target anchor
    function getTargetAnchor(linkView, opt) {

        if (linkView.targetAnchor) { return linkView.targetAnchor; }

        // fallback: center of bbox
        var targetBBox = getTargetBBox(linkView, opt);
        return targetBBox.center(); // default
    }

    // PARTIAL ROUTERS //

    function vertexVertex(from, to, bearing) {

        var p1 = new g$1.Point(from.x, to.y);
        var p2 = new g$1.Point(to.x, from.y);
        var d1 = getBearing(from, p1);
        var d2 = getBearing(from, p2);
        var opposite = opposites[bearing];

        var p = (d1 === bearing || (d1 !== opposite && (d2 === opposite || d2 !== bearing))) ? p1 : p2;

        return { points: [p], direction: getBearing(p, to) };
    }

    function elementVertex(from, to, fromBBox) {

        var p = freeJoin(from, to, fromBBox);

        return { points: [p], direction: getBearing(p, to) };
    }

    function vertexElement(from, to, toBBox, bearing) {

        var route = {};

        var points = [new g$1.Point(from.x, to.y), new g$1.Point(to.x, from.y)];
        var freePoints = points.filter(function(pt) {
            return !toBBox.containsPoint(pt);
        });
        var freeBearingPoints = freePoints.filter(function(pt) {
            return getBearing(pt, from) !== bearing;
        });

        var p;

        if (freeBearingPoints.length > 0) {
            // Try to pick a point which bears the same direction as the previous segment.

            p = freeBearingPoints.filter(function(pt) {
                return getBearing(from, pt) === bearing;
            }).pop();
            p = p || freeBearingPoints[0];

            route.points = [p];
            route.direction = getBearing(p, to);

        } else {
            // Here we found only points which are either contained in the element or they would create
            // a link segment going in opposite direction from the previous one.
            // We take the point inside element and move it outside the element in the direction the
            // route is going. Now we can join this point with the current end (using freeJoin).

            p = difference(points, freePoints)[0];

            var p2 = (new g$1.Point(to)).move(p, -getBBoxSize(toBBox, bearing) / 2);
            var p1 = freeJoin(p2, from, toBBox);

            route.points = [p1, p2];
            route.direction = getBearing(p2, to);
        }

        return route;
    }

    function elementElement(from, to, fromBBox, toBBox) {

        var route = elementVertex(to, from, toBBox);
        var p1 = route.points[0];

        if (fromBBox.containsPoint(p1)) {

            route = elementVertex(from, to, fromBBox);
            var p2 = route.points[0];

            if (toBBox.containsPoint(p2)) {

                var fromBorder = (new g$1.Point(from)).move(p2, -getBBoxSize(fromBBox, getBearing(from, p2)) / 2);
                var toBorder = (new g$1.Point(to)).move(p1, -getBBoxSize(toBBox, getBearing(to, p1)) / 2);
                var mid = (new g$1.Line(fromBorder, toBorder)).midpoint();

                var startRoute = elementVertex(from, mid, fromBBox);
                var endRoute = vertexVertex(mid, to, startRoute.direction);

                route.points = [startRoute.points[0], endRoute.points[0]];
                route.direction = endRoute.direction;
            }
        }

        return route;
    }

    // Finds route for situations where one element is inside the other.
    // Typically the route is directed outside the outer element first and
    // then back towards the inner element.
    function insideElement(from, to, fromBBox, toBBox, bearing) {

        var route = {};
        var boundary = fromBBox.union(toBBox).inflate(1);

        // start from the point which is closer to the boundary
        var reversed = boundary.center().distance(to) > boundary.center().distance(from);
        var start = reversed ? to : from;
        var end = reversed ? from : to;

        var p1, p2, p3;

        if (bearing) {
            // Points on circle with radius equals 'W + H` are always outside the rectangle
            // with width W and height H if the center of that circle is the center of that rectangle.
            p1 = g$1.Point.fromPolar(boundary.width + boundary.height, radians[bearing], start);
            p1 = boundary.pointNearestToPoint(p1).move(p1, -1);

        } else {
            p1 = boundary.pointNearestToPoint(start).move(start, 1);
        }

        p2 = freeJoin(p1, end, boundary);

        if (p1.round().equals(p2.round())) {
            p2 = g$1.Point.fromPolar(boundary.width + boundary.height, g$1.toRad(p1.theta(start)) + Math.PI / 2, end);
            p2 = boundary.pointNearestToPoint(p2).move(end, 1).round();
            p3 = freeJoin(p1, p2, boundary);
            route.points = reversed ? [p2, p3, p1] : [p1, p3, p2];

        } else {
            route.points = reversed ? [p2, p1] : [p1, p2];
        }

        route.direction = reversed ? getBearing(p1, to) : getBearing(p2, to);

        return route;
    }

    // MAIN ROUTER //

    // Return points through which a connection needs to be drawn in order to obtain an orthogonal link
    // routing from source to target going through `vertices`.
    function orthogonal(vertices, opt, linkView) {

        var sourceBBox = getSourceBBox(linkView, opt);
        var targetBBox = getTargetBBox(linkView, opt);

        var sourceAnchor = getSourceAnchor(linkView, opt);
        var targetAnchor = getTargetAnchor(linkView, opt);

        // if anchor lies outside of bbox, the bbox expands to include it
        sourceBBox = sourceBBox.union(getPointBox(sourceAnchor));
        targetBBox = targetBBox.union(getPointBox(targetAnchor));

        vertices = toArray(vertices).map(g$1.Point);
        vertices.unshift(sourceAnchor);
        vertices.push(targetAnchor);

        var bearing; // bearing of previous route segment

        var orthogonalVertices = []; // the array of found orthogonal vertices to be returned
        for (var i = 0, max = vertices.length - 1; i < max; i++) {

            var route = null;

            var from = vertices[i];
            var to = vertices[i + 1];

            var isOrthogonal = !!getBearing(from, to);

            if (i === 0) { // source

                if (i + 1 === max) { // route source -> target

                    // Expand one of the elements by 1px to detect situations when the two
                    // elements are positioned next to each other with no gap in between.
                    if (sourceBBox.intersect(targetBBox.clone().inflate(1))) {
                        route = insideElement(from, to, sourceBBox, targetBBox);

                    } else if (!isOrthogonal) {
                        route = elementElement(from, to, sourceBBox, targetBBox);
                    }

                } else { // route source -> vertex

                    if (sourceBBox.containsPoint(to)) {
                        route = insideElement(from, to, sourceBBox, getPointBox(to).moveAndExpand(getPaddingBox(opt)));

                    } else if (!isOrthogonal) {
                        route = elementVertex(from, to, sourceBBox);
                    }
                }

            } else if (i + 1 === max) { // route vertex -> target

                // prevent overlaps with previous line segment
                var isOrthogonalLoop = isOrthogonal && getBearing(to, from) === bearing;

                if (targetBBox.containsPoint(from) || isOrthogonalLoop) {
                    route = insideElement(from, to, getPointBox(from).moveAndExpand(getPaddingBox(opt)), targetBBox, bearing);

                } else if (!isOrthogonal) {
                    route = vertexElement(from, to, targetBBox, bearing);
                }

            } else if (!isOrthogonal) { // route vertex -> vertex
                route = vertexVertex(from, to, bearing);
            }

            // applicable to all routes:

            // set bearing for next iteration
            if (route) {
                Array.prototype.push.apply(orthogonalVertices, route.points);
                bearing = route.direction;

            } else {
                // orthogonal route and not looped
                bearing = getBearing(from, to);
            }

            // push `to` point to identified orthogonal vertices array
            if (i + 1 < max) {
                orthogonalVertices.push(to);
            }
        }

        return orthogonalVertices;
    }

    var config = {

        // size of the step to find a route (the grid of the manhattan pathfinder)
        step: 10,

        // the number of route finding loops that cause the router to abort
        // returns fallback route instead
        maximumLoops: 2000,

        // the number of decimal places to round floating point coordinates
        precision: 1,

        // maximum change of direction
        maxAllowedDirectionChange: 90,

        // should the router use perpendicular linkView option?
        // does not connect anchor of element but rather a point close-by that is orthogonal
        // this looks much better
        perpendicular: true,

        // should the source and/or target not be considered as obstacles?
        excludeEnds: [], // 'source', 'target'

        // should certain types of elements not be considered as obstacles?
        excludeTypes: ['basic.Text'],

        // possible starting directions from an element
        startDirections: ['top', 'right', 'bottom', 'left'],

        // possible ending directions to an element
        endDirections: ['top', 'right', 'bottom', 'left'],

        // specify the directions used above and what they mean
        directionMap: {
            top: { x: 0, y: -1 },
            right: { x: 1, y: 0 },
            bottom: { x: 0, y: 1 },
            left: { x: -1, y: 0 }
        },

        // cost of an orthogonal step
        cost: function() {

            return this.step;
        },

        // an array of directions to find next points on the route
        // different from start/end directions
        directions: function() {

            var step = this.step;
            var cost = this.cost();

            return [
                { offsetX: step, offsetY: 0, cost: cost },
                { offsetX: 0, offsetY: step, cost: cost },
                { offsetX: -step, offsetY: 0, cost: cost },
                { offsetX: 0, offsetY: -step, cost: cost }
            ];
        },

        // a penalty received for direction change
        penalties: function() {

            return {
                0: 0,
                45: this.step / 2,
                90: this.step / 2
            };
        },

        // padding applied on the element bounding boxes
        paddingBox: function() {

            var step = this.step;

            return {
                x: -step,
                y: -step,
                width: 2 * step,
                height: 2 * step
            };
        },

        // a router to use when the manhattan router fails
        // (one of the partial routes returns null)
        fallbackRouter: function(vertices, opt, linkView) {

            if (!isFunction(joint.routers.orthogonal)) {
                throw new Error('Manhattan requires the orthogonal router as default fallback.');
            }

            return joint.routers.orthogonal(vertices, assign({}, config, opt), linkView);
        },

        /* Deprecated */
        // a simple route used in situations when main routing method fails
        // (exceed max number of loop iterations, inaccessible)
        fallbackRoute: function(from, to, opt) {

            return null; // null result will trigger the fallbackRouter

            // left for reference:
            /*// Find an orthogonal route ignoring obstacles.

            var point = ((opt.previousDirAngle || 0) % 180 === 0)
                    ? new g.Point(from.x, to.y)
                    : new g.Point(to.x, from.y);

            return [point];*/
        },

        // if a function is provided, it's used to route the link while dragging an end
        // i.e. function(from, to, opt) { return []; }
        draggingRoute: null
    };

    // HELPER CLASSES //

    // Map of obstacles
    // Helper structure to identify whether a point lies inside an obstacle.
    function ObstacleMap(opt) {

        this.map = {};
        this.options = opt;
        // tells how to divide the paper when creating the elements map
        this.mapGridSize = 100;
    }

    ObstacleMap.prototype.build = function(graph, link) {

        var opt = this.options;

        // source or target element could be excluded from set of obstacles
        var excludedEnds = toArray(opt.excludeEnds).reduce(function(res, item) {

            var end = link.get(item);
            if (end) {
                var cell = graph.getCell(end.id);
                if (cell) {
                    res.push(cell);
                }
            }

            return res;
        }, []);

        // Exclude any embedded elements from the source and the target element.
        var excludedAncestors = [];

        var source = graph.getCell(link.get('source').id);
        if (source) {
            excludedAncestors = union(excludedAncestors, source.getAncestors().map(function(cell) {
                return cell.id;
            }));
        }

        var target = graph.getCell(link.get('target').id);
        if (target) {
            excludedAncestors = union(excludedAncestors, target.getAncestors().map(function(cell) {
                return cell.id;
            }));
        }

        // Builds a map of all elements for quicker obstacle queries (i.e. is a point contained
        // in any obstacle?) (a simplified grid search).
        // The paper is divided into smaller cells, where each holds information about which
        // elements belong to it. When we query whether a point lies inside an obstacle we
        // don't need to go through all obstacles, we check only those in a particular cell.
        var mapGridSize = this.mapGridSize;

        graph.getElements().reduce(function(map, element) {

            var isExcludedType = toArray(opt.excludeTypes).includes(element.get('type'));
            var isExcludedEnd = excludedEnds.find(function(excluded) {
                return excluded.id === element.id;
            });
            var isExcludedAncestor = excludedAncestors.includes(element.id);

            var isExcluded = isExcludedType || isExcludedEnd || isExcludedAncestor;
            if (!isExcluded) {
                var bbox = element.getBBox().moveAndExpand(opt.paddingBox);

                var origin = bbox.origin().snapToGrid(mapGridSize);
                var corner = bbox.corner().snapToGrid(mapGridSize);

                for (var x = origin.x; x <= corner.x; x += mapGridSize) {
                    for (var y = origin.y; y <= corner.y; y += mapGridSize) {
                        var gridKey = x + '@' + y;
                        map[gridKey] = map[gridKey] || [];
                        map[gridKey].push(bbox);
                    }
                }
            }

            return map;
        }, this.map);

        return this;
    };

    ObstacleMap.prototype.isPointAccessible = function(point) {

        var mapKey = point.clone().snapToGrid(this.mapGridSize).toString();

        return toArray(this.map[mapKey]).every(function(obstacle) {
            return !obstacle.containsPoint(point);
        });
    };

    // Sorted Set
    // Set of items sorted by given value.
    function SortedSet() {
        this.items = [];
        this.hash = {};
        this.values = {};
        this.OPEN = 1;
        this.CLOSE = 2;
    }

    SortedSet.prototype.add = function(item, value) {

        if (this.hash[item]) {
            // item removal
            this.items.splice(this.items.indexOf(item), 1);
        } else {
            this.hash[item] = this.OPEN;
        }

        this.values[item] = value;

        var index = sortedIndex(this.items, item, function(i) {
            return this.values[i];
        }.bind(this));

        this.items.splice(index, 0, item);
    };

    SortedSet.prototype.remove = function(item) {

        this.hash[item] = this.CLOSE;
    };

    SortedSet.prototype.isOpen = function(item) {

        return this.hash[item] === this.OPEN;
    };

    SortedSet.prototype.isClose = function(item) {

        return this.hash[item] === this.CLOSE;
    };

    SortedSet.prototype.isEmpty = function() {

        return this.items.length === 0;
    };

    SortedSet.prototype.pop = function() {

        var item = this.items.shift();
        this.remove(item);
        return item;
    };

    // HELPERS //

    // return source bbox
    function getSourceBBox$1(linkView, opt) {

        // expand by padding box
        if (opt && opt.paddingBox) { return linkView.sourceBBox.clone().moveAndExpand(opt.paddingBox); }

        return linkView.sourceBBox.clone();
    }

    // return target bbox
    function getTargetBBox$1(linkView, opt) {

        // expand by padding box
        if (opt && opt.paddingBox) { return linkView.targetBBox.clone().moveAndExpand(opt.paddingBox); }

        return linkView.targetBBox.clone();
    }

    // return source anchor
    function getSourceAnchor$1(linkView, opt) {

        if (linkView.sourceAnchor) { return linkView.sourceAnchor; }

        // fallback: center of bbox
        var sourceBBox = getSourceBBox$1(linkView, opt);
        return sourceBBox.center();
    }

    // return target anchor
    function getTargetAnchor$1(linkView, opt) {

        if (linkView.targetAnchor) { return linkView.targetAnchor; }

        // fallback: center of bbox
        var targetBBox = getTargetBBox$1(linkView, opt);
        return targetBBox.center(); // default
    }

    // returns a direction index from start point to end point
    // corrects for grid deformation between start and end
    function getDirectionAngle(start, end, numDirections, grid, opt) {

        var quadrant = 360 / numDirections;
        var angleTheta = start.theta(fixAngleEnd(start, end, grid, opt));
        var normalizedAngle = g$1.normalizeAngle(angleTheta + (quadrant / 2));
        return quadrant * Math.floor(normalizedAngle / quadrant);
    }

    // helper function for getDirectionAngle()
    // corrects for grid deformation
    // (if a point is one grid steps away from another in both dimensions,
    // it is considered to be 45 degrees away, even if the real angle is different)
    // this causes visible angle discrepancies if `opt.step` is much larger than `paper.gridSize`
    function fixAngleEnd(start, end, grid, opt) {

        var step = opt.step;

        var diffX = end.x - start.x;
        var diffY = end.y - start.y;

        var gridStepsX = diffX / grid.x;
        var gridStepsY = diffY / grid.y;

        var distanceX = gridStepsX * step;
        var distanceY = gridStepsY * step;

        return new g$1.Point(start.x + distanceX, start.y + distanceY);
    }

    // return the change in direction between two direction angles
    function getDirectionChange(angle1, angle2) {

        var directionChange = Math.abs(angle1 - angle2);
        return (directionChange > 180) ? (360 - directionChange) : directionChange;
    }

    // fix direction offsets according to current grid
    function getGridOffsets(directions, grid, opt) {

        var step = opt.step;

        toArray(opt.directions).forEach(function(direction) {

            direction.gridOffsetX = (direction.offsetX / step) * grid.x;
            direction.gridOffsetY = (direction.offsetY / step) * grid.y;
        });
    }

    // get grid size in x and y dimensions, adapted to source and target positions
    function getGrid(step, source, target) {

        return {
            source: source.clone(),
            x: getGridDimension(target.x - source.x, step),
            y: getGridDimension(target.y - source.y, step)
        };
    }

    // helper function for getGrid()
    function getGridDimension(diff, step) {

        // return step if diff = 0
        if (!diff) { return step; }

        var absDiff = Math.abs(diff);
        var numSteps = Math.round(absDiff / step);

        // return absDiff if less than one step apart
        if (!numSteps) { return absDiff; }

        // otherwise, return corrected step
        var roundedDiff = numSteps * step;
        var remainder = absDiff - roundedDiff;
        var stepCorrection = remainder / numSteps;

        return step + stepCorrection;
    }

    // return a clone of point snapped to grid
    function snapToGrid(point, grid) {

        var source = grid.source;

        var snappedX = g$1.snapToGrid(point.x - source.x, grid.x) + source.x;
        var snappedY = g$1.snapToGrid(point.y - source.y, grid.y) + source.y;

        return new g$1.Point(snappedX, snappedY);
    }

    // round the point to opt.precision
    function round(point, precision) {

        return point.round(precision);
    }

    // snap to grid and then round the point
    function align(point, grid, precision) {

        return round(snapToGrid(point.clone(), grid), precision);
    }

    // return a string representing the point
    // string is rounded in both dimensions
    function getKey(point) {

        return point.clone().toString();
    }

    // return a normalized vector from given point
    // used to determine the direction of a difference of two points
    function normalizePoint(point) {

        return new g$1.Point(
            point.x === 0 ? 0 : Math.abs(point.x) / point.x,
            point.y === 0 ? 0 : Math.abs(point.y) / point.y
        );
    }

    // PATHFINDING //

    // reconstructs a route by concatenating points with their parents
    function reconstructRoute(parents, points, tailPoint, from, to, grid, opt) {

        var route = [];

        var prevDiff = normalizePoint(to.difference(tailPoint));

        // tailPoint is assumed to be aligned already
        var currentKey = getKey(tailPoint);
        var parent = parents[currentKey];

        var point;
        while (parent) {

            // point is assumed to be aligned already
            point = points[currentKey];

            var diff = normalizePoint(point.difference(parent));
            if (!diff.equals(prevDiff)) {
                route.unshift(point);
                prevDiff = diff;
            }

            // parent is assumed to be aligned already
            currentKey = getKey(parent);
            parent = parents[currentKey];
        }

        // leadPoint is assumed to be aligned already
        var leadPoint = points[currentKey];

        var fromDiff = normalizePoint(leadPoint.difference(from));
        if (!fromDiff.equals(prevDiff)) {
            route.unshift(leadPoint);
        }

        return route;
    }

    // heuristic method to determine the distance between two points
    function estimateCost(from, endPoints) {

        var min = Infinity;

        for (var i = 0, len = endPoints.length; i < len; i++) {
            var cost = from.manhattanDistance(endPoints[i]);
            if (cost < min) { min = cost; }
        }

        return min;
    }

    // find points around the bbox taking given directions into account
    // lines are drawn from anchor in given directions, intersections recorded
    // if anchor is outside bbox, only those directions that intersect get a rect point
    // the anchor itself is returned as rect point (representing some directions)
    // (since those directions are unobstructed by the bbox)
    function getRectPoints(anchor, bbox, directionList, grid, opt) {

        var precision = opt.precision;
        var directionMap = opt.directionMap;

        var anchorCenterVector = anchor.difference(bbox.center());

        var keys = isObject(directionMap) ? Object.keys(directionMap) : [];
        var dirList = toArray(directionList);
        var rectPoints = keys.reduce(function(res, key) {

            if (dirList.includes(key)) {
                var direction = directionMap[key];

                // create a line that is guaranteed to intersect the bbox if bbox is in the direction
                // even if anchor lies outside of bbox
                var endpoint = new g$1.Point(
                    anchor.x + direction.x * (Math.abs(anchorCenterVector.x) + bbox.width),
                    anchor.y + direction.y * (Math.abs(anchorCenterVector.y) + bbox.height)
                );
                var intersectionLine = new g$1.Line(anchor, endpoint);

                // get the farther intersection, in case there are two
                // (that happens if anchor lies next to bbox)
                var intersections = intersectionLine.intersect(bbox) || [];
                var numIntersections = intersections.length;
                var farthestIntersectionDistance;
                var farthestIntersection = null;
                for (var i = 0; i < numIntersections; i++) {
                    var currentIntersection = intersections[i];
                    var distance = anchor.squaredDistance(currentIntersection);
                    if ((farthestIntersectionDistance === undefined) || (distance > farthestIntersectionDistance)) {
                        farthestIntersectionDistance = distance;
                        farthestIntersection = currentIntersection;
                    }
                }

                // if an intersection was found in this direction, it is our rectPoint
                if (farthestIntersection) {
                    var point = align(farthestIntersection, grid, precision);

                    // if the rectPoint lies inside the bbox, offset it by one more step
                    if (bbox.containsPoint(point)) {
                        point = align(point.offset(direction.x * grid.x, direction.y * grid.y), grid, precision);
                    }

                    // then add the point to the result array
                    // aligned
                    res.push(point);
                }
            }

            return res;
        }, []);

        // if anchor lies outside of bbox, add it to the array of points
        if (!bbox.containsPoint(anchor)) {
            // aligned
            rectPoints.push(align(anchor, grid, precision));
        }

        return rectPoints;
    }

    // finds the route between two points/rectangles (`from`, `to`) implementing A* algorithm
    // rectangles get rect points assigned by getRectPoints()
    function findRoute(from, to, map, opt) {

        var precision = opt.precision;

        // Get grid for this route.

        var sourceAnchor, targetAnchor;

        if (from instanceof g$1.Rect) { // `from` is sourceBBox
            sourceAnchor = round(getSourceAnchor$1(this, opt).clone(), precision);
        } else {
            sourceAnchor = round(from.clone(), precision);
        }

        if (to instanceof g$1.Rect) { // `to` is targetBBox
            targetAnchor = round(getTargetAnchor$1(this, opt).clone(), precision);
        } else {
            targetAnchor = round(to.clone(), precision);
        }

        var grid = getGrid(opt.step, sourceAnchor, targetAnchor);

        // Get pathfinding points.

        var start, end; // aligned with grid by definition
        var startPoints, endPoints; // assumed to be aligned with grid already

        // set of points we start pathfinding from
        if (from instanceof g$1.Rect) { // `from` is sourceBBox
            start = sourceAnchor;
            startPoints = getRectPoints(start, from, opt.startDirections, grid, opt);

        } else {
            start = sourceAnchor;
            startPoints = [start];
        }

        // set of points we want the pathfinding to finish at
        if (to instanceof g$1.Rect) { // `to` is targetBBox
            end = targetAnchor;
            endPoints = getRectPoints(targetAnchor, to, opt.endDirections, grid, opt);

        } else {
            end = targetAnchor;
            endPoints = [end];
        }

        // take into account only accessible rect points (those not under obstacles)
        startPoints = startPoints.filter(map.isPointAccessible, map);
        endPoints = endPoints.filter(map.isPointAccessible, map);

        // Check that there is an accessible route point on both sides.
        // Otherwise, use fallbackRoute().
        if (startPoints.length > 0 && endPoints.length > 0) {

            // The set of tentative points to be evaluated, initially containing the start points.
            // Rounded to nearest integer for simplicity.
            var openSet = new SortedSet();
            // Keeps reference to actual points for given elements of the open set.
            var points = {};
            // Keeps reference to a point that is immediate predecessor of given element.
            var parents = {};
            // Cost from start to a point along best known path.
            var costs = {};

            for (var i = 0, n = startPoints.length; i < n; i++) {
                // startPoint is assumed to be aligned already
                var startPoint = startPoints[i];

                var key = getKey(startPoint);

                openSet.add(key, estimateCost(startPoint, endPoints));
                points[key] = startPoint;
                costs[key] = 0;
            }

            var previousRouteDirectionAngle = opt.previousDirectionAngle; // undefined for first route
            var isPathBeginning = (previousRouteDirectionAngle === undefined);

            // directions
            var direction, directionChange;
            var directions = opt.directions;
            getGridOffsets(directions, grid, opt);

            var numDirections = directions.length;

            var endPointsKeys = toArray(endPoints).reduce(function(res, endPoint) {
                // endPoint is assumed to be aligned already

                var key = getKey(endPoint);
                res.push(key);
                return res;
            }, []);

            // main route finding loop
            var loopsRemaining = opt.maximumLoops;
            while (!openSet.isEmpty() && loopsRemaining > 0) {

                // remove current from the open list
                var currentKey = openSet.pop();
                var currentPoint = points[currentKey];
                var currentParent = parents[currentKey];
                var currentCost = costs[currentKey];

                var isRouteBeginning = (currentParent === undefined); // undefined for route starts
                var isStart = currentPoint.equals(start); // (is source anchor or `from` point) = can leave in any direction

                var previousDirectionAngle;
                if (!isRouteBeginning) { previousDirectionAngle = getDirectionAngle(currentParent, currentPoint, numDirections, grid, opt); } // a vertex on the route
                else if (!isPathBeginning) { previousDirectionAngle = previousRouteDirectionAngle; } // beginning of route on the path
                else if (!isStart) { previousDirectionAngle = getDirectionAngle(start, currentPoint, numDirections, grid, opt); } // beginning of path, start rect point
                else { previousDirectionAngle = null; } // beginning of path, source anchor or `from` point

                // check if we reached any endpoint
                if (endPointsKeys.indexOf(currentKey) >= 0) {
                    opt.previousDirectionAngle = previousDirectionAngle;
                    return reconstructRoute(parents, points, currentPoint, start, end, grid, opt);
                }

                // go over all possible directions and find neighbors
                for (i = 0; i < numDirections; i++) {
                    direction = directions[i];

                    var directionAngle = direction.angle;
                    directionChange = getDirectionChange(previousDirectionAngle, directionAngle);

                    // if the direction changed rapidly, don't use this point
                    // any direction is allowed for starting points
                    if (!(isPathBeginning && isStart) && directionChange > opt.maxAllowedDirectionChange) { continue; }

                    var neighborPoint = align(currentPoint.clone().offset(direction.gridOffsetX, direction.gridOffsetY), grid, precision);
                    var neighborKey = getKey(neighborPoint);

                    // Closed points from the openSet were already evaluated.
                    if (openSet.isClose(neighborKey) || !map.isPointAccessible(neighborPoint)) { continue; }

                    // We can only enter end points at an acceptable angle.
                    if (endPointsKeys.indexOf(neighborKey) >= 0) { // neighbor is an end point

                        var isNeighborEnd = neighborPoint.equals(end); // (is target anchor or `to` point) = can be entered in any direction

                        if (!isNeighborEnd) {
                            var endDirectionAngle = getDirectionAngle(neighborPoint, end, numDirections, grid, opt);
                            var endDirectionChange = getDirectionChange(directionAngle, endDirectionAngle);

                            if (endDirectionChange > opt.maxAllowedDirectionChange) { continue; }
                        }
                    }

                    // The current direction is ok.

                    var neighborCost = direction.cost;
                    var neighborPenalty = isStart ? 0 : opt.penalties[directionChange]; // no penalties for start point
                    var costFromStart = currentCost + neighborCost + neighborPenalty;

                    if (!openSet.isOpen(neighborKey) || (costFromStart < costs[neighborKey])) {
                        // neighbor point has not been processed yet
                        // or the cost of the path from start is lower than previously calculated

                        points[neighborKey] = neighborPoint;
                        parents[neighborKey] = currentPoint;
                        costs[neighborKey] = costFromStart;
                        openSet.add(neighborKey, costFromStart + estimateCost(neighborPoint, endPoints));
                    }
                }

                loopsRemaining--;
            }
        }

        // no route found (`to` point either wasn't accessible or finding route took
        // way too much calculation)
        return opt.fallbackRoute.call(this, start, end, opt);
    }

    // resolve some of the options
    function resolveOptions(opt) {

        opt.directions = result(opt, 'directions');
        opt.penalties = result(opt, 'penalties');
        opt.paddingBox = result(opt, 'paddingBox');
        opt.padding = result(opt, 'padding');

        if (opt.padding) {
            // if both provided, opt.padding wins over opt.paddingBox
            var sides = normalizeSides(opt.padding);
            opt.paddingBox = {
                x: -sides.left,
                y: -sides.top,
                width: sides.left + sides.right,
                height: sides.top + sides.bottom
            };
        }

        toArray(opt.directions).forEach(function(direction) {

            var point1 = new g$1.Point(0, 0);
            var point2 = new g$1.Point(direction.offsetX, direction.offsetY);

            direction.angle = g$1.normalizeAngle(point1.theta(point2));
        });
    }

    // initialization of the route finding
    function router(vertices, opt, linkView) {

        resolveOptions(opt);

        // enable/disable linkView perpendicular option
        linkView.options.perpendicular = !!opt.perpendicular;

        var sourceBBox = getSourceBBox$1(linkView, opt);
        var targetBBox = getTargetBBox$1(linkView, opt);

        var sourceAnchor = getSourceAnchor$1(linkView, opt);
        //var targetAnchor = getTargetAnchor(linkView, opt);

        // pathfinding
        var map = (new ObstacleMap(opt)).build(linkView.paper.model, linkView.model);
        var oldVertices = toArray(vertices).map(g$1.Point);
        var newVertices = [];
        var tailPoint = sourceAnchor; // the origin of first route's grid, does not need snapping

        // find a route by concatenating all partial routes (routes need to pass through vertices)
        // source -> vertex[1] -> ... -> vertex[n] -> target
        var to, from;

        for (var i = 0, len = oldVertices.length; i <= len; i++) {

            var partialRoute = null;

            from = to || sourceBBox;
            to = oldVertices[i];

            if (!to) {
                // this is the last iteration
                // we ran through all vertices in oldVertices
                // 'to' is not a vertex.

                to = targetBBox;

                // If the target is a point (i.e. it's not an element), we
                // should use dragging route instead of main routing method if it has been provided.
                var isEndingAtPoint = !linkView.model.get('source').id || !linkView.model.get('target').id;

                if (isEndingAtPoint && isFunction(opt.draggingRoute)) {
                    // Make sure we are passing points only (not rects).
                    var dragFrom = (from === sourceBBox) ? sourceAnchor : from;
                    var dragTo = to.origin();

                    partialRoute = opt.draggingRoute.call(linkView, dragFrom, dragTo, opt);
                }
            }

            // if partial route has not been calculated yet use the main routing method to find one
            partialRoute = partialRoute || findRoute.call(linkView, from, to, map, opt);

            if (partialRoute === null) { // the partial route cannot be found
                return opt.fallbackRouter(vertices, opt, linkView);
            }

            var leadPoint = partialRoute[0];

            // remove the first point if the previous partial route had the same point as last
            if (leadPoint && leadPoint.equals(tailPoint)) { partialRoute.shift(); }

            // save tailPoint for next iteration
            tailPoint = partialRoute[partialRoute.length - 1] || tailPoint;

            Array.prototype.push.apply(newVertices, partialRoute);
        }

        return newVertices;
    }

    // public function
    var manhattan = function(vertices, opt, linkView) {
        return router(vertices, assign({}, config, opt), linkView);
    };

    var config$1 = {

        maxAllowedDirectionChange: 45,

        // cost of a diagonal step
        diagonalCost: function() {

            var step = this.step;
            return Math.ceil(Math.sqrt(step * step << 1));
        },

        // an array of directions to find next points on the route
        // different from start/end directions
        directions: function() {

            var step = this.step;
            var cost = this.cost();
            var diagonalCost = this.diagonalCost();

            return [
                { offsetX: step, offsetY: 0, cost: cost },
                { offsetX: step, offsetY: step, cost: diagonalCost },
                { offsetX: 0, offsetY: step, cost: cost },
                { offsetX: -step, offsetY: step, cost: diagonalCost },
                { offsetX: -step, offsetY: 0, cost: cost },
                { offsetX: -step, offsetY: -step, cost: diagonalCost },
                { offsetX: 0, offsetY: -step, cost: cost },
                { offsetX: step, offsetY: -step, cost: diagonalCost }
            ];
        },

        // a simple route used in situations when main routing method fails
        // (exceed max number of loop iterations, inaccessible)
        fallbackRoute: function(from, to, opt) {

            // Find a route which breaks by 45 degrees ignoring all obstacles.

            var theta = from.theta(to);

            var route = [];

            var a = { x: to.x, y: from.y };
            var b = { x: from.x, y: to.y };

            if (theta % 180 > 90) {
                var t = a;
                a = b;
                b = t;
            }

            var p1 = (theta % 90) < 45 ? a : b;
            var l1 = new g.Line(from, p1);

            var alpha = 90 * Math.ceil(theta / 90);

            var p2 = g.Point.fromPolar(l1.squaredLength(), g.toRad(alpha + 135), p1);
            var l2 = new g.Line(to, p2);

            var intersectionPoint = l1.intersection(l2);
            var point = intersectionPoint ? intersectionPoint : to;

            var directionFrom = intersectionPoint ? point : from;

            var quadrant = 360 / opt.directions.length;
            var angleTheta = directionFrom.theta(to);
            var normalizedAngle = g.normalizeAngle(angleTheta + (quadrant / 2));
            var directionAngle = quadrant * Math.floor(normalizedAngle / quadrant);

            opt.previousDirectionAngle = directionAngle;

            if (point) { route.push(point.round()); }
            route.push(to);

            return route;
        }
    };

    // public function
    var metro = function(vertices, opt, linkView) {

        if (!isFunction(manhattan)) {
            throw new Error('Metro requires the manhattan router.');
        }

        return manhattan(vertices, assign({}, config$1, opt), linkView);
    };



    var routers = /*#__PURE__*/Object.freeze({
        normal: normal,
        oneSide: oneSide,
        orthogonal: orthogonal,
        manhattan: manhattan,
        metro: metro
    });

    // default size of jump if not specified in options
    var JUMP_SIZE = 5;

    // available jump types
    // first one taken as default
    var JUMP_TYPES = ['arc', 'gap', 'cubic'];

    // takes care of math. error for case when jump is too close to end of line
    var CLOSE_PROXIMITY_PADDING = 1;

    // list of connector types not to jump over.
    var IGNORED_CONNECTORS = ['smooth'];

    /**
     * Transform start/end and route into series of lines
     * @param {g.point} sourcePoint start point
     * @param {g.point} targetPoint end point
     * @param {g.point[]} route optional list of route
     * @return {g.line[]} [description]
     */
    function createLines(sourcePoint, targetPoint, route) {
        // make a flattened array of all points
        var points = [].concat(sourcePoint, route, targetPoint);
        return points.reduce(function(resultLines, point, idx) {
            // if there is a next point, make a line with it
            var nextPoint = points[idx + 1];
            if (nextPoint != null) {
                resultLines[idx] = g$1.line(point, nextPoint);
            }
            return resultLines;
        }, []);
    }

    function setupUpdating(jumpOverLinkView) {
        var updateList = jumpOverLinkView.paper._jumpOverUpdateList;

        // first time setup for this paper
        if (updateList == null) {
            updateList = jumpOverLinkView.paper._jumpOverUpdateList = [];
            jumpOverLinkView.paper.on('cell:pointerup', updateJumpOver);
            jumpOverLinkView.paper.model.on('reset', function() {
                updateList = jumpOverLinkView.paper._jumpOverUpdateList = [];
            });
        }

        // add this link to a list so it can be updated when some other link is updated
        if (updateList.indexOf(jumpOverLinkView) < 0) {
            updateList.push(jumpOverLinkView);

            // watch for change of connector type or removal of link itself
            // to remove the link from a list of jump over connectors
            jumpOverLinkView.listenToOnce(jumpOverLinkView.model, 'change:connector remove', function() {
                updateList.splice(updateList.indexOf(jumpOverLinkView), 1);
            });
        }
    }

    /**
     * Handler for a batch:stop event to force
     * update of all registered links with jump over connector
     * @param {object} batchEvent optional object with info about batch
     */
    function updateJumpOver() {
        var updateList = this._jumpOverUpdateList;
        for (var i = 0; i < updateList.length; i++) {
            updateList[i].update();
        }
    }

    /**
     * Utility function to collect all intersection poinst of a single
     * line against group of other lines.
     * @param {g.line} line where to find points
     * @param {g.line[]} crossCheckLines lines to cross
     * @return {g.point[]} list of intersection points
     */
    function findLineIntersections(line, crossCheckLines) {
        return toArray(crossCheckLines).reduce(function(res, crossCheckLine) {
            var intersection$$1 = line.intersection(crossCheckLine);
            if (intersection$$1) {
                res.push(intersection$$1);
            }
            return res;
        }, []);
    }

    /**
     * Sorting function for list of points by their distance.
     * @param {g.point} p1 first point
     * @param {g.point} p2 second point
     * @return {number} squared distance between points
     */
    function sortPoints(p1, p2) {
        return g$1.line(p1, p2).squaredLength();
    }

    /**
     * Split input line into multiple based on intersection points.
     * @param {g.line} line input line to split
     * @param {g.point[]} intersections poinst where to split the line
     * @param {number} jumpSize the size of jump arc (length empty spot on a line)
     * @return {g.line[]} list of lines being split
     */
    function createJumps(line, intersections, jumpSize) {
        return intersections.reduce(function(resultLines, point, idx) {
            // skipping points that were merged with the previous line
            // to make bigger arc over multiple lines that are close to each other
            if (point.skip === true) {
                return resultLines;
            }

            // always grab the last line from buffer and modify it
            var lastLine = resultLines.pop() || line;

            // calculate start and end of jump by moving by a given size of jump
            var jumpStart = g$1.point(point).move(lastLine.start, -(jumpSize));
            var jumpEnd = g$1.point(point).move(lastLine.start, +(jumpSize));

            // now try to look at the next intersection point
            var nextPoint = intersections[idx + 1];
            if (nextPoint != null) {
                var distance = jumpEnd.distance(nextPoint);
                if (distance <= jumpSize) {
                    // next point is close enough, move the jump end by this
                    // difference and mark the next point to be skipped
                    jumpEnd = nextPoint.move(lastLine.start, distance);
                    nextPoint.skip = true;
                }
            } else {
                // this block is inside of `else` as an optimization so the distance is
                // not calculated when we know there are no other intersection points
                var endDistance = jumpStart.distance(lastLine.end);
                // if the end is too close to possible jump, draw remaining line instead of a jump
                if (endDistance < jumpSize * 2 + CLOSE_PROXIMITY_PADDING) {
                    resultLines.push(lastLine);
                    return resultLines;
                }
            }

            var startDistance = jumpEnd.distance(lastLine.start);
            if (startDistance < jumpSize * 2 + CLOSE_PROXIMITY_PADDING) {
                // if the start of line is too close to jump, draw that line instead of a jump
                resultLines.push(lastLine);
                return resultLines;
            }

            // finally create a jump line
            var jumpLine = g$1.line(jumpStart, jumpEnd);
            // it's just simple line but with a `isJump` property
            jumpLine.isJump = true;

            resultLines.push(
                g$1.line(lastLine.start, jumpStart),
                jumpLine,
                g$1.line(jumpEnd, lastLine.end)
            );
            return resultLines;
        }, []);
    }

    /**
     * Assemble `D` attribute of a SVG path by iterating given lines.
     * @param {g.line[]} lines source lines to use
     * @param {number} jumpSize the size of jump arc (length empty spot on a line)
     * @return {string}
     */
    function buildPath(lines, jumpSize, jumpType) {

        var path = new g$1.Path();
        var segment;

        // first move to the start of a first line
        segment = g$1.Path.createSegment('M', lines[0].start);
        path.appendSegment(segment);

        // make a paths from lines
        toArray(lines).forEach(function(line, index) {

            if (line.isJump) {
                var angle, diff;

                var control1, control2;

                if (jumpType === 'arc') { // approximates semicircle with 2 curves
                    angle = -90;
                    // determine rotation of arc based on difference between points
                    diff = line.start.difference(line.end);
                    // make sure the arc always points up (or right)
                    var xAxisRotate = Number((diff.x < 0) || (diff.x === 0 && diff.y < 0));
                    if (xAxisRotate) { angle += 180; }

                    var midpoint = line.midpoint();
                    var centerLine = new g$1.Line(midpoint, line.end).rotate(midpoint, angle);

                    var halfLine;

                    // first half
                    halfLine = new g$1.Line(line.start, midpoint);

                    control1 = halfLine.pointAt(2 / 3).rotate(line.start, angle);
                    control2 = centerLine.pointAt(1 / 3).rotate(centerLine.end, -angle);

                    segment = g$1.Path.createSegment('C', control1, control2, centerLine.end);
                    path.appendSegment(segment);

                    // second half
                    halfLine = new g$1.Line(midpoint, line.end);

                    control1 = centerLine.pointAt(1 / 3).rotate(centerLine.end, angle);
                    control2 = halfLine.pointAt(1 / 3).rotate(line.end, -angle);

                    segment = g$1.Path.createSegment('C', control1, control2, line.end);
                    path.appendSegment(segment);

                } else if (jumpType === 'gap') {
                    segment = g$1.Path.createSegment('M', line.end);
                    path.appendSegment(segment);

                } else if (jumpType === 'cubic') { // approximates semicircle with 1 curve
                    angle = line.start.theta(line.end);

                    var xOffset = jumpSize * 0.6;
                    var yOffset = jumpSize * 1.35;

                    // determine rotation of arc based on difference between points
                    diff = line.start.difference(line.end);
                    // make sure the arc always points up (or right)
                    xAxisRotate = Number((diff.x < 0) || (diff.x === 0 && diff.y < 0));
                    if (xAxisRotate) { yOffset *= -1; }

                    control1 = g$1.Point(line.start.x + xOffset, line.start.y + yOffset).rotate(line.start, angle);
                    control2 = g$1.Point(line.end.x - xOffset, line.end.y + yOffset).rotate(line.end, angle);

                    segment = g$1.Path.createSegment('C', control1, control2, line.end);
                    path.appendSegment(segment);
                }

            } else {
                segment = g$1.Path.createSegment('L', line.end);
                path.appendSegment(segment);
            }
        });

        return path;
    }

    /**
     * Actual connector function that will be run on every update.
     * @param {g.point} sourcePoint start point of this link
     * @param {g.point} targetPoint end point of this link
     * @param {g.point[]} route of this link
     * @param {object} opt options
     * @property {number} size optional size of a jump arc
     * @return {string} created `D` attribute of SVG path
     */
    var jumpover = function(sourcePoint, targetPoint, route, opt) { // eslint-disable-line max-params

        setupUpdating(this);

        var raw = opt.raw;
        var jumpSize = opt.size || JUMP_SIZE;
        var jumpType = opt.jump && ('' + opt.jump).toLowerCase();
        var ignoreConnectors = opt.ignoreConnectors || IGNORED_CONNECTORS;

        // grab the first jump type as a default if specified one is invalid
        if (JUMP_TYPES.indexOf(jumpType) === -1) {
            jumpType = JUMP_TYPES[0];
        }

        var paper = this.paper;
        var graph = paper.model;
        var allLinks = graph.getLinks();

        // there is just one link, draw it directly
        if (allLinks.length === 1) {
            return buildPath(
                createLines(sourcePoint, targetPoint, route),
                jumpSize, jumpType
            );
        }

        var thisModel = this.model;
        var thisIndex = allLinks.indexOf(thisModel);
        var defaultConnector = paper.options.defaultConnector || {};

        // not all links are meant to be jumped over.
        var links = allLinks.filter(function(link, idx) {

            var connector = link.get('connector') || defaultConnector;

            // avoid jumping over links with connector type listed in `ignored connectors`.
            if (toArray(ignoreConnectors).includes(connector.name)) {
                return false;
            }
            // filter out links that are above this one and  have the same connector type
            // otherwise there would double hoops for each intersection
            if (idx > thisIndex) {
                return connector.name !== 'jumpover';
            }
            return true;
        });

        // find views for all links
        var linkViews = links.map(function(link) {
            return paper.findViewByModel(link);
        });

        // create lines for this link
        var thisLines = createLines(
            sourcePoint,
            targetPoint,
            route
        );

        // create lines for all other links
        var linkLines = linkViews.map(function(linkView) {
            if (linkView == null) {
                return [];
            }
            if (linkView === this) {
                return thisLines;
            }
            return createLines(
                linkView.sourcePoint,
                linkView.targetPoint,
                linkView.route
            );
        }, this);

        // transform lines for this link by splitting with jump lines at
        // points of intersection with other links
        var jumpingLines = thisLines.reduce(function(resultLines, thisLine) {
            // iterate all links and grab the intersections with this line
            // these are then sorted by distance so the line can be split more easily

            var intersections = links.reduce(function(res, link, i) {
                // don't intersection with itself
                if (link !== thisModel) {

                    var lineIntersections = findLineIntersections(thisLine, linkLines[i]);
                    res.push.apply(res, lineIntersections);
                }
                return res;
            }, []).sort(function(a, b) {
                return sortPoints(thisLine.start, a) - sortPoints(thisLine.start, b);
            });

            if (intersections.length > 0) {
                // split the line based on found intersection points
                resultLines.push.apply(resultLines, createJumps(thisLine, intersections, jumpSize));
            } else {
                // without any intersection the line goes uninterrupted
                resultLines.push(thisLine);
            }
            return resultLines;
        }, []);

        var path = buildPath(jumpingLines, jumpSize, jumpType);
        return (raw) ? path : path.serialize();
    };

    var normal$1 = function(sourcePoint, targetPoint, route, opt) {

        var raw = opt && opt.raw;
        var points = [sourcePoint].concat(route).concat([targetPoint]);

        var polyline = new g$1.Polyline(points);
        var path = new g$1.Path(polyline);

        return (raw) ? path : path.serialize();
    };

    var rounded = function(sourcePoint, targetPoint, route, opt) {

        opt || (opt = {});

        var offset = opt.radius || 10;
        var raw = opt.raw;
        var path = new g$1.Path();
        var segment;

        segment = g$1.Path.createSegment('M', sourcePoint);
        path.appendSegment(segment);

        var _13 = 1 / 3;
        var _23 = 2 / 3;

        var curr;
        var prev, next;
        var prevDistance, nextDistance;
        var startMove, endMove;
        var roundedStart, roundedEnd;
        var control1, control2;

        for (var index = 0, n = route.length; index < n; index++) {

            curr = new g$1.Point(route[index]);

            prev = route[index - 1] || sourcePoint;
            next = route[index + 1] || targetPoint;

            prevDistance = nextDistance || (curr.distance(prev) / 2);
            nextDistance = curr.distance(next) / 2;

            startMove = -Math.min(offset, prevDistance);
            endMove = -Math.min(offset, nextDistance);

            roundedStart = curr.clone().move(prev, startMove).round();
            roundedEnd = curr.clone().move(next, endMove).round();

            control1 = new g$1.Point((_13 * roundedStart.x) + (_23 * curr.x), (_23 * curr.y) + (_13 * roundedStart.y));
            control2 = new g$1.Point((_13 * roundedEnd.x) + (_23 * curr.x), (_23 * curr.y) + (_13 * roundedEnd.y));

            segment = g$1.Path.createSegment('L', roundedStart);
            path.appendSegment(segment);

            segment = g$1.Path.createSegment('C', control1, control2, roundedEnd);
            path.appendSegment(segment);
        }

        segment = g$1.Path.createSegment('L', targetPoint);
        path.appendSegment(segment);

        return (raw) ? path : path.serialize();
    };

    var smooth = function(sourcePoint, targetPoint, route, opt) {

        var raw = opt && opt.raw;
        var path;

        if (route && route.length !== 0) {

            var points = [sourcePoint].concat(route).concat([targetPoint]);
            var curves = g$1.Curve.throughPoints(points);

            path = new g$1.Path(curves);

        } else {
            // if we have no route, use a default cubic bezier curve
            // cubic bezier requires two control points
            // the control points have `x` midway between source and target
            // this produces an S-like curve

            path = new g$1.Path();

            var segment;

            segment = g$1.Path.createSegment('M', sourcePoint);
            path.appendSegment(segment);

            if ((Math.abs(sourcePoint.x - targetPoint.x)) >= (Math.abs(sourcePoint.y - targetPoint.y))) {
                var controlPointX = (sourcePoint.x + targetPoint.x) / 2;

                segment = g$1.Path.createSegment('C', controlPointX, sourcePoint.y, controlPointX, targetPoint.y, targetPoint.x, targetPoint.y);
                path.appendSegment(segment);

            } else {
                var controlPointY = (sourcePoint.y + targetPoint.y) / 2;

                segment = g$1.Path.createSegment('C', sourcePoint.x, controlPointY, targetPoint.x, controlPointY, targetPoint.x, targetPoint.y);
                path.appendSegment(segment);

            }
        }

        return (raw) ? path : path.serialize();
    };



    var connectors = /*#__PURE__*/Object.freeze({
        jumpover: jumpover,
        normal: normal$1,
        rounded: rounded,
        smooth: smooth
    });

    // Link base view and controller.
    // ----------------------------------------

    var LinkView = CellView.extend({

        className: function() {

            var classNames = CellView.prototype.className.apply(this).split(' ');

            classNames.push('link');

            return classNames.join(' ');
        },

        options: {

            shortLinkLength: 105,
            doubleLinkTools: false,
            longLinkLength: 155,
            linkToolsOffset: 40,
            doubleLinkToolsOffset: 65,
            sampleInterval: 50,
        },

        _labelCache: null,
        _labelSelectors: null,
        _markerCache: null,
        _V: null,
        _dragData: null, // deprecated

        metrics: null,
        decimalsRounding: 2,

        initialize: function() {

            CellView.prototype.initialize.apply(this, arguments);

            // `_.labelCache` is a mapping of indexes of labels in the `this.get('labels')` array to
            // `<g class="label">` nodes wrapped by Vectorizer. This allows for quick access to the
            // nodes in `updateLabelPosition()` in order to update the label positions.
            this._labelCache = {};

            // a cache of label selectors
            this._labelSelectors = {};

            // keeps markers bboxes and positions again for quicker access
            this._markerCache = {};

            // cache of default markup nodes
            this._V = {};

            // connection path metrics
            this.metrics = {};
        },

        presentationAttributes: {
            markup: ['RENDER'],
            attrs: ['UPDATE'],
            router: ['UPDATE'],
            connector: ['UPDATE'],
            smooth: ['UPDATE'],
            manhattan: ['UPDATE'],
            toolMarkup: ['TOOLS'],
            labels: ['LABELS'],
            labelMarkup: ['LABELS'],
            vertices: ['VERTICES', 'UPDATE'],
            vertexMarkup: ['VERTICES'],
            source: ['SOURCE', 'UPDATE'],
            target: ['TARGET', 'UPDATE']
        },

        initFlag: ['RENDER', 'SOURCE', 'TARGET'],

        UPDATE_PRIORITY: 1,

        confirmUpdate: function(flags, opt) {

            opt || (opt = {});

            var model = this.model;
            var attributes = model.attributes;

            if (this.hasFlag(flags, 'SOURCE')) {
                if (!this.updateEndProperties('source')) { return flags; }
                flags = this.removeFlag(flags, 'SOURCE');
            }

            if (this.hasFlag(flags, 'TARGET')) {
                if (!this.updateEndProperties('target')) { return flags; }
                flags = this.removeFlag(flags, 'TARGET');
            }

            var sourceView = this.sourceView;
            var targetView = this.targetView;
            if (sourceView && !sourceView.el.firstChild || targetView && !targetView.el.firstChild) {
                // Wait for the sourceView and targetView to be rendered
                return flags;
            }

            if (this.hasFlag(flags, 'RENDER')) {
                this.render();
                flags = this.removeFlag(flags, ['RENDER', 'UPDATE', 'VERTICES', 'TOOLS', 'LABELS']);
                return flags;
            }

            if (this.hasFlag(flags, 'VERTICES')) {
                this.renderVertexMarkers();
                flags = this.removeFlag(flags, 'VERTICES');
            }

            if (this.hasFlag(flags, 'UPDATE')) {
                this.update(model, null, opt);
                flags = this.removeFlag(flags, ['UPDATE', 'TOOLS', 'LABELS']);
                return flags;
            }

            if (this.hasFlag(flags, 'TOOLS')) {
                this.renderTools().updateToolsPosition();
                flags = this.removeFlag(flags, 'TOOLS');
            }

            if (this.hasFlag(flags, 'LABELS')) {
                this.onLabelsChange(model, attributes.labels, opt);
                flags = this.removeFlag(flags, 'LABELS');
            }

            return flags;
        },

        onLabelsChange: function(link, labels, opt) {

            var requireRender = true;

            var previousLabels = this.model.previous('labels');

            if (previousLabels) {
                // Here is an optimization for cases when we know, that change does
                // not require re-rendering of all labels.
                if (('propertyPathArray' in opt) && ('propertyValue' in opt)) {
                    // The label is setting by `prop()` method
                    var pathArray = opt.propertyPathArray || [];
                    var pathLength = pathArray.length;
                    if (pathLength > 1) {
                        // We are changing a single label here e.g. 'labels/0/position'
                        var labelExists = !!previousLabels[pathArray[1]];
                        if (labelExists) {
                            if (pathLength === 2) {
                                // We are changing the entire label. Need to check if the
                                // markup is also being changed.
                                requireRender = ('markup' in Object(opt.propertyValue));
                            } else if (pathArray[2] !== 'markup') {
                                // We are changing a label property but not the markup
                                requireRender = false;
                            }
                        }
                    }
                }
            }

            if (requireRender) {
                this.renderLabels();
            } else {
                this.updateLabels();
            }

            this.updateLabelPositions();
        },

        // Rendering.
        // ----------

        render: function() {

            this.vel.empty();
            this._V = {};
            this.renderMarkup();
            // rendering labels has to be run after the link is appended to DOM tree. (otherwise <Text> bbox
            // returns zero values)
            this.renderLabels();
            this.update();

            return this;
        },

        renderMarkup: function() {

            var link = this.model;
            var markup = link.get('markup') || link.markup;
            if (!markup) { throw new Error('dia.LinkView: markup required'); }
            if (Array.isArray(markup)) { return this.renderJSONMarkup(markup); }
            if (typeof markup === 'string') { return this.renderStringMarkup(markup); }
            throw new Error('dia.LinkView: invalid markup');
        },

        renderJSONMarkup: function(markup) {

            var doc = this.parseDOMJSON(markup, this.el);
            // Selectors
            this.selectors = doc.selectors;
            // Fragment
            this.vel.append(doc.fragment);
        },

        renderStringMarkup: function(markup) {

            // A special markup can be given in the `properties.markup` property. This might be handy
            // if e.g. arrowhead markers should be `<image>` elements or any other element than `<path>`s.
            // `.connection`, `.connection-wrap`, `.marker-source` and `.marker-target` selectors
            // of elements with special meaning though. Therefore, those classes should be preserved in any
            // special markup passed in `properties.markup`.
            var children = V(markup);
            // custom markup may contain only one children
            if (!Array.isArray(children)) { children = [children]; }
            // Cache all children elements for quicker access.
            var cache = this._V; // vectorized markup;
            for (var i = 0, n = children.length; i < n; i++) {
                var child = children[i];
                var className = child.attr('class');
                if (className) {
                    // Strip the joint class name prefix, if there is one.
                    className = removeClassNamePrefix(className);
                    cache[$.camelCase(className)] = child;
                }
            }
            // partial rendering
            this.renderTools();
            this.renderVertexMarkers();
            this.renderArrowheadMarkers();
            this.vel.append(children);
        },

        _getLabelMarkup: function(labelMarkup) {

            if (!labelMarkup) { return undefined; }

            if (Array.isArray(labelMarkup)) { return this.parseDOMJSON(labelMarkup, null); }
            if (typeof labelMarkup === 'string') { return this._getLabelStringMarkup(labelMarkup); }
            throw new Error('dia.linkView: invalid label markup');
        },

        _getLabelStringMarkup: function(labelMarkup) {

            var children = V(labelMarkup);
            var fragment = document.createDocumentFragment();

            if (!Array.isArray(children)) {
                fragment.appendChild(children.node);

            } else {
                for (var i = 0, n = children.length; i < n; i++) {
                    var currentChild = children[i].node;
                    fragment.appendChild(currentChild);
                }
            }

            return { fragment: fragment, selectors: {}}; // no selectors
        },

        // Label markup fragment may come wrapped in <g class="label" />, or not.
        // If it doesn't, add the <g /> container here.
        _normalizeLabelMarkup: function(markup) {

            if (!markup) { return undefined; }

            var fragment = markup.fragment;
            if (!(markup.fragment instanceof DocumentFragment) || !markup.fragment.hasChildNodes()) { throw new Error('dia.LinkView: invalid label markup.'); }

            var vNode;
            var childNodes = fragment.childNodes;

            if ((childNodes.length > 1) || childNodes[0].nodeName.toUpperCase() !== 'G') {
                // default markup fragment is not wrapped in <g />
                // add a <g /> container
                vNode = V('g').append(fragment);
            } else {
                vNode = V(childNodes[0]);
            }

            vNode.addClass('label');

            return { node: vNode.node, selectors: markup.selectors };
        },

        renderLabels: function() {

            var cache = this._V;
            var vLabels = cache.labels;
            var labelCache = this._labelCache = {};
            var labelSelectors = this._labelSelectors = {};
            var model = this.model;
            var labels = model.attributes.labels || [];
            var labelsCount = labels.length;

            if (labelsCount === 0) {
                if (vLabels) { vLabels.remove(); }
                return this;
            }

            if (vLabels) {
                vLabels.empty();
            }  else {
                // there is no label container in the markup but some labels are defined
                // add a <g class="labels" /> container
                vLabels = cache.labels = V('g').addClass('labels');
            }

            var container = vLabels.node;

            for (var i = 0; i < labelsCount; i++) {

                var label = labels[i];
                var labelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(label.markup));
                var labelNode;
                var selectors;
                if (labelMarkup) {

                    labelNode = labelMarkup.node;
                    selectors = labelMarkup.selectors;

                } else {

                    var builtinDefaultLabel =  model._builtins.defaultLabel;
                    var builtinDefaultLabelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(builtinDefaultLabel.markup));
                    var defaultLabel = model._getDefaultLabel();
                    var defaultLabelMarkup = this._normalizeLabelMarkup(this._getLabelMarkup(defaultLabel.markup));
                    var defaultMarkup = defaultLabelMarkup || builtinDefaultLabelMarkup;

                    labelNode = defaultMarkup.node;
                    selectors = defaultMarkup.selectors;
                }

                labelNode.setAttribute('label-idx', i); // assign label-idx
                container.appendChild(labelNode);
                labelCache[i] = labelNode; // cache node for `updateLabels()` so it can just update label node positions

                var rootSelector = this.selector;
                if (selectors[rootSelector]) { throw new Error('dia.LinkView: ambiguous label root selector.'); }
                selectors[rootSelector] = labelNode;

                labelSelectors[i] = selectors; // cache label selectors for `updateLabels()`
            }

            if (!container.parentNode) {
                this.el.appendChild(container);
            }

            this.updateLabels();

            return this;
        },

        // merge default label attrs into label attrs
        // keep `undefined` or `null` because `{}` means something else
        _mergeLabelAttrs: function(hasCustomMarkup, labelAttrs, defaultLabelAttrs, builtinDefaultLabelAttrs) {

            if (labelAttrs === null) { return null; }
            if (labelAttrs === undefined) {

                if (defaultLabelAttrs === null) { return null; }
                if (defaultLabelAttrs === undefined) {

                    if (hasCustomMarkup) { return undefined; }
                    return builtinDefaultLabelAttrs;
                }

                if (hasCustomMarkup) { return defaultLabelAttrs; }
                return merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs);
            }

            if (hasCustomMarkup) { return merge({}, defaultLabelAttrs, labelAttrs); }
            return merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs, labelAttrs);
        },

        updateLabels: function() {

            if (!this._V.labels) { return this; }

            var model = this.model;
            var labels = model.get('labels') || [];
            var canLabelMove = this.can('labelMove');

            var builtinDefaultLabel = model._builtins.defaultLabel;
            var builtinDefaultLabelAttrs = builtinDefaultLabel.attrs;

            var defaultLabel = model._getDefaultLabel();
            var defaultLabelMarkup = defaultLabel.markup;
            var defaultLabelAttrs = defaultLabel.attrs;

            for (var i = 0, n = labels.length; i < n; i++) {

                var labelNode = this._labelCache[i];
                labelNode.setAttribute('cursor', (canLabelMove ? 'move' : 'default'));

                var selectors = this._labelSelectors[i];

                var label = labels[i];
                var labelMarkup = label.markup;
                var labelAttrs = label.attrs;

                var attrs = this._mergeLabelAttrs(
                    (labelMarkup || defaultLabelMarkup),
                    labelAttrs,
                    defaultLabelAttrs,
                    builtinDefaultLabelAttrs
                );

                this.updateDOMSubtreeAttributes(labelNode, attrs, {
                    rootBBox: new g$1.Rect(label.size),
                    selectors: selectors
                });
            }

            return this;
        },

        renderTools: function() {

            if (!this._V.linkTools) { return this; }

            // Tools are a group of clickable elements that manipulate the whole link.
            // A good example of this is the remove tool that removes the whole link.
            // Tools appear after hovering the link close to the `source` element/point of the link
            // but are offset a bit so that they don't cover the `marker-arrowhead`.

            var $tools = $(this._V.linkTools.node).empty();
            var toolTemplate = template(this.model.get('toolMarkup') || this.model.toolMarkup);
            var tool = V(toolTemplate());

            $tools.append(tool.node);

            // Cache the tool node so that the `updateToolsPosition()` can update the tool position quickly.
            this._toolCache = tool;

            // If `doubleLinkTools` is enabled, we render copy of the tools on the other side of the
            // link as well but only if the link is longer than `longLinkLength`.
            if (this.options.doubleLinkTools) {

                var tool2;
                if (this.model.get('doubleToolMarkup') || this.model.doubleToolMarkup) {
                    toolTemplate = template(this.model.get('doubleToolMarkup') || this.model.doubleToolMarkup);
                    tool2 = V(toolTemplate());
                } else {
                    tool2 = tool.clone();
                }

                $tools.append(tool2.node);
                this._tool2Cache = tool2;
            }

            return this;
        },

        renderVertexMarkers: function() {

            if (!this._V.markerVertices) { return this; }

            var $markerVertices = $(this._V.markerVertices.node).empty();

            // A special markup can be given in the `properties.vertexMarkup` property. This might be handy
            // if default styling (elements) are not desired. This makes it possible to use any
            // SVG elements for .marker-vertex and .marker-vertex-remove tools.
            var markupTemplate = template(this.model.get('vertexMarkup') || this.model.vertexMarkup);

            this.model.vertices().forEach(function(vertex, idx) {
                $markerVertices.append(V(markupTemplate(assign({ idx: idx }, vertex))).node);
            });

            return this;
        },

        renderArrowheadMarkers: function() {

            // Custom markups might not have arrowhead markers. Therefore, jump of this function immediately if that's the case.
            if (!this._V.markerArrowheads) { return this; }

            var $markerArrowheads = $(this._V.markerArrowheads.node);

            $markerArrowheads.empty();

            // A special markup can be given in the `properties.vertexMarkup` property. This might be handy
            // if default styling (elements) are not desired. This makes it possible to use any
            // SVG elements for .marker-vertex and .marker-vertex-remove tools.
            var markupTemplate = template(this.model.get('arrowheadMarkup') || this.model.arrowheadMarkup);

            this._V.sourceArrowhead = V(markupTemplate({ end: 'source' }));
            this._V.targetArrowhead = V(markupTemplate({ end: 'target' }));

            $markerArrowheads.append(this._V.sourceArrowhead.node, this._V.targetArrowhead.node);

            return this;
        },

        // Updating.
        // ---------

        // Default is to process the `attrs` object and set attributes on subelements based on the selectors.
        update: function(model, attributes, opt) {

            opt || (opt = {});

            this.cleanNodesCache();

            // update the link path
            this.updateConnection(opt);

            // update SVG attributes defined by 'attrs/'.
            this.updateDOMSubtreeAttributes(this.el, this.model.attr(), { selectors: this.selectors });

            this.updateDefaultConnectionPath();

            // update the label position etc.
            this.updateLabelPositions();
            this.updateToolsPosition();
            this.updateArrowheadMarkers();

            this.updateTools(opt);

            // *Deprecated*
            // Local perpendicular flag (as opposed to one defined on paper).
            // Could be enabled inside a connector/router. It's valid only
            // during the update execution.
            this.options.perpendicular = null;

            return this;
        },

        removeRedundantLinearVertices: function(opt) {
            var link = this.model;
            var vertices = link.vertices();
            var conciseVertices = [];
            var n = vertices.length;
            var m = 0;
            for (var i = 0; i < n; i++) {
                var current = new g$1.Point(vertices[i]).round();
                var prev = new g$1.Point(conciseVertices[m - 1] || this.sourceAnchor).round();
                if (prev.equals(current)) { continue; }
                var next = new g$1.Point(vertices[i + 1] || this.targetAnchor).round();
                if (prev.equals(next)) { continue; }
                var line = new g$1.Line(prev, next);
                if (line.pointOffset(current) === 0) { continue; }
                conciseVertices.push(vertices[i]);
                m++;
            }
            if (n === m) { return 0; }
            link.vertices(conciseVertices, opt);
            return (n - m);
        },

        updateDefaultConnectionPath: function() {

            var cache = this._V;

            if (cache.connection) {
                cache.connection.attr('d', this.getSerializedConnection());
            }

            if (cache.connectionWrap) {
                cache.connectionWrap.attr('d', this.getSerializedConnection());
            }

            if (cache.markerSource && cache.markerTarget) {
                this._translateAndAutoOrientArrows(cache.markerSource, cache.markerTarget);
            }
        },

        getEndView: function(type) {
            switch (type) {
                case 'source':
                    return this.sourceView || null;
                case 'target':
                    return this.targetView || null;
                default:
                    throw new Error('dia.LinkView: type parameter required.');
            }
        },

        getEndAnchor: function(type) {
            switch (type) {
                case 'source':
                    return new g$1.Point(this.sourceAnchor);
                case 'target':
                    return new g$1.Point(this.targetAnchor);
                default:
                    throw new Error('dia.LinkView: type parameter required.');
            }
        },

        getEndMagnet: function(type) {
            switch (type) {
                case 'source':
                    var sourceView = this.sourceView;
                    if (!sourceView) { break; }
                    return this.sourceMagnet || sourceView.el;
                case 'target':
                    var targetView = this.targetView;
                    if (!targetView) { break; }
                    return this.targetMagnet || targetView.el;
                default:
                    throw new Error('dia.LinkView: type parameter required.');
            }
            return null;
        },

        updateConnection: function(opt) {

            opt = opt || {};

            var model = this.model;
            var route, path;

            if (opt.translateBy && model.isRelationshipEmbeddedIn(opt.translateBy)) {
                // The link is being translated by an ancestor that will
                // shift source point, target point and all vertices
                // by an equal distance.
                var tx = opt.tx || 0;
                var ty = opt.ty || 0;

                route = (new g$1.Polyline(this.route)).translate(tx, ty).points;

                // translate source and target connection and marker points.
                this._translateConnectionPoints(tx, ty);

                // translate the path itself
                path = this.path;
                path.translate(tx, ty);

            } else {

                var vertices = model.vertices();
                // 1. Find Anchors

                var anchors = this.findAnchors(vertices);
                var sourceAnchor = this.sourceAnchor = anchors.source;
                var targetAnchor = this.targetAnchor = anchors.target;

                // 2. Find Route
                route = this.findRoute(vertices, opt);

                // 3. Find Connection Points
                var connectionPoints = this.findConnectionPoints(route, sourceAnchor, targetAnchor);
                var sourcePoint = this.sourcePoint = connectionPoints.source;
                var targetPoint = this.targetPoint = connectionPoints.target;

                // 3b. Find Marker Connection Point - Backwards Compatibility
                var markerPoints = this.findMarkerPoints(route, sourcePoint, targetPoint);

                // 4. Find Connection
                path = this.findPath(route, markerPoints.source || sourcePoint, markerPoints.target || targetPoint);
            }

            this.route = route;
            this.path = path;
            this.metrics = {};
        },

        findMarkerPoints: function(route, sourcePoint, targetPoint) {

            var firstWaypoint = route[0];
            var lastWaypoint = route[route.length - 1];

            // Move the source point by the width of the marker taking into account
            // its scale around x-axis. Note that scale is the only transform that
            // makes sense to be set in `.marker-source` attributes object
            // as all other transforms (translate/rotate) will be replaced
            // by the `translateAndAutoOrient()` function.
            var cache = this._markerCache;
            // cache source and target points
            var sourceMarkerPoint, targetMarkerPoint;

            if (this._V.markerSource) {

                cache.sourceBBox = cache.sourceBBox || this._V.markerSource.getBBox();
                sourceMarkerPoint = g$1.Point(sourcePoint).move(
                    firstWaypoint || targetPoint,
                    cache.sourceBBox.width * this._V.markerSource.scale().sx * -1
                ).round();
            }

            if (this._V.markerTarget) {

                cache.targetBBox = cache.targetBBox || this._V.markerTarget.getBBox();
                targetMarkerPoint = g$1.Point(targetPoint).move(
                    lastWaypoint || sourcePoint,
                    cache.targetBBox.width * this._V.markerTarget.scale().sx * -1
                ).round();
            }

            // if there was no markup for the marker, use the connection point.
            cache.sourcePoint = sourceMarkerPoint || sourcePoint.clone();
            cache.targetPoint = targetMarkerPoint || targetPoint.clone();

            return {
                source: sourceMarkerPoint,
                target: targetMarkerPoint
            };
        },

        findAnchorsOrdered: function(firstEndType, firstRef, secondEndType, secondRef) {

            var firstAnchor, secondAnchor;
            var firstAnchorRef, secondAnchorRef;
            var model = this.model;
            var firstDef = model.get(firstEndType);
            var secondDef = model.get(secondEndType);
            var firstView = this.getEndView(firstEndType);
            var secondView = this.getEndView(secondEndType);
            var firstMagnet = this.getEndMagnet(firstEndType);
            var secondMagnet = this.getEndMagnet(secondEndType);

            // Anchor first
            if (firstView) {
                if (firstRef) {
                    firstAnchorRef = new g$1.Point(firstRef);
                } else if (secondView) {
                    firstAnchorRef = secondMagnet;
                } else {
                    firstAnchorRef = new g$1.Point(secondDef);
                }
                firstAnchor = this.getAnchor(firstDef.anchor, firstView, firstMagnet, firstAnchorRef, firstEndType);
            } else {
                firstAnchor = new g$1.Point(firstDef);
            }

            // Anchor second
            if (secondView) {
                secondAnchorRef = new g$1.Point(secondRef || firstAnchor);
                secondAnchor = this.getAnchor(secondDef.anchor, secondView, secondMagnet, secondAnchorRef, secondEndType);
            } else {
                secondAnchor = new g$1.Point(secondDef);
            }

            var res = {};
            res[firstEndType] = firstAnchor;
            res[secondEndType] = secondAnchor;
            return res;
        },

        findAnchors: function(vertices) {

            var model = this.model;
            var firstVertex = vertices[0];
            var lastVertex = vertices[vertices.length - 1];

            if (model.target().priority && !model.source().priority) {
                // Reversed order
                return this.findAnchorsOrdered('target', lastVertex, 'source', firstVertex);
            }

            // Usual order
            return this.findAnchorsOrdered('source', firstVertex, 'target', lastVertex);
        },

        findConnectionPoints: function(route, sourceAnchor, targetAnchor) {

            var firstWaypoint = route[0];
            var lastWaypoint = route[route.length - 1];
            var model = this.model;
            var sourceDef = model.get('source');
            var targetDef = model.get('target');
            var sourceView = this.sourceView;
            var targetView = this.targetView;
            var paperOptions = this.paper.options;
            var sourceMagnet, targetMagnet;

            // Connection Point Source
            var sourcePoint;
            if (sourceView && !sourceView.isNodeConnection(this.sourceMagnet)) {
                sourceMagnet = (this.sourceMagnet || sourceView.el);
                var sourceConnectionPointDef = sourceDef.connectionPoint || paperOptions.defaultConnectionPoint;
                var sourcePointRef = firstWaypoint || targetAnchor;
                var sourceLine = new g$1.Line(sourcePointRef, sourceAnchor);
                sourcePoint = this.getConnectionPoint(sourceConnectionPointDef, sourceView, sourceMagnet, sourceLine, 'source');
            } else {
                sourcePoint = sourceAnchor;
            }
            // Connection Point Target
            var targetPoint;
            if (targetView && !targetView.isNodeConnection(this.targetMagnet)) {
                targetMagnet = (this.targetMagnet || targetView.el);
                var targetConnectionPointDef = targetDef.connectionPoint || paperOptions.defaultConnectionPoint;
                var targetPointRef = lastWaypoint || sourceAnchor;
                var targetLine = new g$1.Line(targetPointRef, targetAnchor);
                targetPoint = this.getConnectionPoint(targetConnectionPointDef, targetView, targetMagnet, targetLine, 'target');
            } else {
                targetPoint = targetAnchor;
            }

            return {
                source: sourcePoint,
                target: targetPoint
            };
        },

        getAnchor: function(anchorDef, cellView, magnet, ref, endType) {

            var isConnection = cellView.isNodeConnection(magnet);
            var paperOptions = this.paper.options;
            if (!anchorDef) {
                if (isConnection) {
                    anchorDef = paperOptions.defaultLinkAnchor;
                } else {
                    if (paperOptions.perpendicularLinks || this.options.perpendicular) {
                        // Backwards compatibility
                        // If `perpendicularLinks` flag is set on the paper and there are vertices
                        // on the link, then try to find a connection point that makes the link perpendicular
                        // even though the link won't point to the center of the targeted object.
                        anchorDef = { name: 'perpendicular' };
                    } else {
                        anchorDef = paperOptions.defaultAnchor;
                    }
                }
            }

            if (!anchorDef) { throw new Error('Anchor required.'); }
            var anchorFn;
            if (typeof anchorDef === 'function') {
                anchorFn = anchorDef;
            } else {
                var anchorName = anchorDef.name;
                var anchorNamespace = isConnection ? 'linkAnchorNamespace' : 'anchorNamespace';
                anchorFn = paperOptions[anchorNamespace][anchorName];
                if (typeof anchorFn !== 'function') { throw new Error('Unknown anchor: ' + anchorName); }
            }
            var anchor = anchorFn.call(this, cellView, magnet, ref, anchorDef.args || {}, endType, this);
            if (!anchor) { return new g$1.Point(); }
            return anchor.round(this.decimalsRounding);
        },


        getConnectionPoint: function(connectionPointDef, view, magnet, line, endType) {

            var connectionPoint;
            var anchor = line.end;
            var paperOptions = this.paper.options;

            // Backwards compatibility
            if (typeof paperOptions.linkConnectionPoint === 'function') {
                var linkConnectionMagnet = (magnet === view.el) ? undefined : magnet;
                connectionPoint = paperOptions.linkConnectionPoint(this, view, linkConnectionMagnet, line.start, endType);
                if (connectionPoint) { return connectionPoint; }
            }

            if (!connectionPointDef) { return anchor; }
            var connectionPointFn;
            if (typeof connectionPointDef === 'function') {
                connectionPointFn = connectionPointDef;
            } else {
                var connectionPointName = connectionPointDef.name;
                connectionPointFn = paperOptions.connectionPointNamespace[connectionPointName];
                if (typeof connectionPointFn !== 'function') { throw new Error('Unknown connection point: ' + connectionPointName); }
            }
            connectionPoint = connectionPointFn.call(this, line, view, magnet, connectionPointDef.args || {}, endType, this);
            if (!connectionPoint) { return anchor; }
            return connectionPoint.round(this.decimalsRounding);
        },

        _translateConnectionPoints: function(tx, ty) {

            var cache = this._markerCache;

            cache.sourcePoint.offset(tx, ty);
            cache.targetPoint.offset(tx, ty);
            this.sourcePoint.offset(tx, ty);
            this.targetPoint.offset(tx, ty);
            this.sourceAnchor.offset(tx, ty);
            this.targetAnchor.offset(tx, ty);
        },

        // if label position is a number, normalize it to a position object
        // this makes sure that label positions can be merged properly
        _normalizeLabelPosition: function(labelPosition) {

            if (typeof labelPosition === 'number') { return { distance: labelPosition, offset: null, angle: 0, args: null }; }
            return labelPosition;
        },

        updateLabelPositions: function() {

            if (!this._V.labels) { return this; }

            var path = this.path;
            if (!path) { return this; }

            // This method assumes all the label nodes are stored in the `this._labelCache` hash table
            // by their indices in the `this.get('labels')` array. This is done in the `renderLabels()` method.

            var model = this.model;
            var labels = model.get('labels') || [];
            if (!labels.length) { return this; }

            var builtinDefaultLabel = model._builtins.defaultLabel;
            var builtinDefaultLabelPosition = builtinDefaultLabel.position;

            var defaultLabel = model._getDefaultLabel();
            var defaultLabelPosition = this._normalizeLabelPosition(defaultLabel.position);

            var defaultPosition = merge({}, builtinDefaultLabelPosition, defaultLabelPosition);

            for (var idx = 0, n = labels.length; idx < n; idx++) {
                var label = labels[idx];
                var labelPosition = this._normalizeLabelPosition(label.position);
                var position = merge({}, defaultPosition, labelPosition);
                var transformationMatrix = this._getLabelTransformationMatrix(position);
                this._labelCache[idx].setAttribute('transform', V.matrixToTransformString(transformationMatrix));
            }

            return this;
        },

        updateToolsPosition: function() {

            if (!this._V.linkTools) { return this; }

            // Move the tools a bit to the target position but don't cover the `sourceArrowhead` marker.
            // Note that the offset is hardcoded here. The offset should be always
            // more than the `this.$('.marker-arrowhead[end="source"]')[0].bbox().width` but looking
            // this up all the time would be slow.

            var scale = '';
            var offset = this.options.linkToolsOffset;
            var connectionLength = this.getConnectionLength();

            // Firefox returns connectionLength=NaN in odd cases (for bezier curves).
            // In that case we won't update tools position at all.
            if (!Number.isNaN(connectionLength)) {

                // If the link is too short, make the tools half the size and the offset twice as low.
                if (connectionLength < this.options.shortLinkLength) {
                    scale = 'scale(.5)';
                    offset /= 2;
                }

                var toolPosition = this.getPointAtLength(offset);

                this._toolCache.attr('transform', 'translate(' + toolPosition.x + ', ' + toolPosition.y + ') ' + scale);

                if (this.options.doubleLinkTools && connectionLength >= this.options.longLinkLength) {

                    var doubleLinkToolsOffset = this.options.doubleLinkToolsOffset || offset;

                    toolPosition = this.getPointAtLength(connectionLength - doubleLinkToolsOffset);
                    this._tool2Cache.attr('transform', 'translate(' + toolPosition.x + ', ' + toolPosition.y + ') ' + scale);
                    this._tool2Cache.attr('visibility', 'visible');

                } else if (this.options.doubleLinkTools) {

                    this._tool2Cache.attr('visibility', 'hidden');
                }
            }

            return this;
        },

        updateArrowheadMarkers: function() {

            if (!this._V.markerArrowheads) { return this; }

            // getting bbox of an element with `display="none"` in IE9 ends up with access violation
            if ($.css(this._V.markerArrowheads.node, 'display') === 'none') { return this; }

            var sx = this.getConnectionLength() < this.options.shortLinkLength ? .5 : 1;
            this._V.sourceArrowhead.scale(sx);
            this._V.targetArrowhead.scale(sx);

            this._translateAndAutoOrientArrows(this._V.sourceArrowhead, this._V.targetArrowhead);

            return this;
        },

        updateEndProperties: function(endType) {

            var endViewProperty = endType + 'View';
            var endMagnetProperty = endType + 'Magnet';
            var endDef = this.model.get(endType);
            var endId = endDef && endDef.id;

            if (!endId) {
                // the link end is a point ~ rect 0x0
                this[endViewProperty] = this[endMagnetProperty] = null;
                return true;
            }

            var paper = this.paper;
            var endModel = paper.getModelById(endId);
            if (!endModel) { throw new Error('LinkView: invalid ' + endType + ' cell.'); }

            var endView = endModel.findView(paper);
            if (!endView) {
                // A view for a model should always exist
                return false;
            }

            this[endViewProperty] = endView;
            var connectedMagnet = endView.getMagnetFromLinkEnd(endDef);
            if (connectedMagnet === endView.el) { connectedMagnet = null; }
            this[endMagnetProperty] = connectedMagnet;
            return true;
        },

        _translateAndAutoOrientArrows: function(sourceArrow, targetArrow) {

            // Make the markers "point" to their sticky points being auto-oriented towards
            // `targetPosition`/`sourcePosition`. And do so only if there is a markup for them.
            var route = toArray(this.route);
            if (sourceArrow) {
                sourceArrow.translateAndAutoOrient(
                    this.sourcePoint,
                    route[0] || this.targetPoint,
                    this.paper.cells
                );
            }

            if (targetArrow) {
                targetArrow.translateAndAutoOrient(
                    this.targetPoint,
                    route[route.length - 1] || this.sourcePoint,
                    this.paper.cells
                );
            }
        },

        _getLabelPositionAngle: function(idx) {

            var labelPosition = this.model.label(idx).position || {};
            return (labelPosition.angle || 0);
        },

        _getLabelPositionArgs: function(idx) {

            var labelPosition = this.model.label(idx).position || {};
            return labelPosition.args;
        },

        _getDefaultLabelPositionArgs: function() {

            var defaultLabel = this.model._getDefaultLabel();
            var defaultLabelPosition = defaultLabel.position || {};
            return defaultLabelPosition.args;
        },

        // merge default label position args into label position args
        // keep `undefined` or `null` because `{}` means something else
        _mergeLabelPositionArgs: function(labelPositionArgs, defaultLabelPositionArgs) {

            if (labelPositionArgs === null) { return null; }
            if (labelPositionArgs === undefined) {

                if (defaultLabelPositionArgs === null) { return null; }
                return defaultLabelPositionArgs;
            }

            return merge({}, defaultLabelPositionArgs, labelPositionArgs);
        },

        // Add default label at given position at end of `labels` array.
        // Four signatures:
        // - obj, obj = point, opt
        // - obj, num, obj = point, angle, opt
        // - num, num, obj = x, y, opt
        // - num, num, num, obj = x, y, angle, opt
        // Assigns relative coordinates by default:
        // `opt.absoluteDistance` forces absolute coordinates.
        // `opt.reverseDistance` forces reverse absolute coordinates (if absoluteDistance = true).
        // `opt.absoluteOffset` forces absolute coordinates for offset.
        // Additional args:
        // `opt.keepGradient` auto-adjusts the angle of the label to match path gradient at position.
        // `opt.ensureLegibility` rotates labels so they are never upside-down.
        addLabel: function(p1, p2, p3, p4) {

            // normalize data from the four possible signatures
            var localX;
            var localY;
            var localAngle = 0;
            var localOpt;
            if (typeof p1 !== 'number') {
                // {x, y} object provided as first parameter
                localX = p1.x;
                localY = p1.y;
                if (typeof p2 === 'number') {
                    // angle and opt provided as second and third parameters
                    localAngle = p2;
                    localOpt = p3;
                } else {
                    // opt provided as second parameter
                    localOpt = p2;
                }
            } else {
                // x and y provided as first and second parameters
                localX = p1;
                localY = p2;
                if (typeof p3 === 'number') {
                    // angle and opt provided as third and fourth parameters
                    localAngle = p3;
                    localOpt = p4;
                } else {
                    // opt provided as third parameter
                    localOpt = p3;
                }
            }

            // merge label position arguments
            var defaultLabelPositionArgs = this._getDefaultLabelPositionArgs();
            var labelPositionArgs = localOpt;
            var positionArgs = this._mergeLabelPositionArgs(labelPositionArgs, defaultLabelPositionArgs);

            // append label to labels array
            var label = { position: this.getLabelPosition(localX, localY, localAngle, positionArgs) };
            var idx = -1;
            this.model.insertLabel(idx, label, localOpt);
            return idx;
        },

        // Add a new vertex at calculated index to the `vertices` array.
        addVertex: function(x, y, opt) {

            // accept input in form `{ x, y }, opt` or `x, y, opt`
            var isPointProvided = (typeof x !== 'number');
            var localX = isPointProvided ? x.x : x;
            var localY = isPointProvided ? x.y : y;
            var localOpt = isPointProvided ? y : opt;

            var vertex = { x: localX, y: localY };
            var idx = this.getVertexIndex(localX, localY);
            this.model.insertVertex(idx, vertex, localOpt);
            return idx;
        },

        // Send a token (an SVG element, usually a circle) along the connection path.
        // Example: `link.findView(paper).sendToken(V('circle', { r: 7, fill: 'green' }).node)`
        // `opt.duration` is optional and is a time in milliseconds that the token travels from the source to the target of the link. Default is `1000`.
        // `opt.directon` is optional and it determines whether the token goes from source to target or other way round (`reverse`)
        // `opt.connection` is an optional selector to the connection path.
        // `callback` is optional and is a function to be called once the token reaches the target.
        sendToken: function(token, opt, callback) {

            function onAnimationEnd(vToken, callback) {
                return function() {
                    vToken.remove();
                    if (typeof callback === 'function') {
                        callback();
                    }
                };
            }

            var duration, isReversed, selector;
            if (isObject(opt)) {
                duration = opt.duration;
                isReversed = (opt.direction === 'reverse');
                selector = opt.connection;
            } else {
                // Backwards compatibility
                duration = opt;
                isReversed = false;
                selector = null;
            }

            duration = duration || 1000;

            var animationAttributes = {
                dur: duration + 'ms',
                repeatCount: 1,
                calcMode: 'linear',
                fill: 'freeze'
            };

            if (isReversed) {
                animationAttributes.keyPoints = '1;0';
                animationAttributes.keyTimes = '0;1';
            }

            var vToken = V(token);
            var connection;
            if (typeof selector === 'string') {
                // Use custom connection path.
                connection = this.findBySelector(selector, this.el, this.selectors)[0];
            } else {
                // Select connection path automatically.
                var cache = this._V;
                connection = (cache.connection) ? cache.connection.node : this.el.querySelector('path');
            }

            if (!(connection instanceof SVGPathElement)) {
                throw new Error('dia.LinkView: token animation requires a valid connection path.');
            }

            vToken
                .appendTo(this.paper.cells)
                .animateAlongPath(animationAttributes, connection);

            setTimeout(onAnimationEnd(vToken, callback), duration);
        },

        findRoute: function(vertices) {

            vertices || (vertices = []);

            var namespace = routers;
            var router = this.model.router();
            var defaultRouter = this.paper.options.defaultRouter;

            if (!router) {
                if (defaultRouter) { router = defaultRouter; }
                else { return vertices.map(g$1.Point); } // no router specified
            }

            var routerFn = isFunction(router) ? router : namespace[router.name];
            if (!isFunction(routerFn)) {
                throw new Error('dia.LinkView: unknown router: "' + router.name + '".');
            }

            var args = router.args || {};

            var route = routerFn.call(
                this, // context
                vertices, // vertices
                args, // options
                this // linkView
            );

            if (!route) { return vertices.map(g$1.Point); }
            return route;
        },

        // Return the `d` attribute value of the `<path>` element representing the link
        // between `source` and `target`.
        findPath: function(route, sourcePoint, targetPoint) {

            var namespace = connectors;
            var connector = this.model.connector();
            var defaultConnector = this.paper.options.defaultConnector;

            if (!connector) {
                connector = defaultConnector || {};
            }

            var connectorFn = isFunction(connector) ? connector : namespace[connector.name];
            if (!isFunction(connectorFn)) {
                throw new Error('dia.LinkView: unknown connector: "' + connector.name + '".');
            }

            var args = clone(connector.args || {});
            args.raw = true; // Request raw g.Path as the result.

            var path = connectorFn.call(
                this, // context
                sourcePoint, // start point
                targetPoint, // end point
                route, // vertices
                args, // options
                this // linkView
            );

            if (typeof path === 'string') {
                // Backwards compatibility for connectors not supporting `raw` option.
                path = new g$1.Path(V.normalizePathData(path));
            }

            return path;
        },

        // Public API.
        // -----------

        getConnection: function() {

            var path = this.path;
            if (!path) { return null; }

            return path.clone();
        },

        getSerializedConnection: function() {

            var path = this.path;
            if (!path) { return null; }

            var metrics = this.metrics;
            if (metrics.hasOwnProperty('data')) { return metrics.data; }
            var data = path.serialize();
            metrics.data = data;
            return data;
        },

        getConnectionSubdivisions: function() {

            var path = this.path;
            if (!path) { return null; }

            var metrics = this.metrics;
            if (metrics.hasOwnProperty('segmentSubdivisions')) { return metrics.segmentSubdivisions; }
            var subdivisions = path.getSegmentSubdivisions();
            metrics.segmentSubdivisions = subdivisions;
            return subdivisions;
        },

        getConnectionLength: function() {

            var path = this.path;
            if (!path) { return 0; }

            var metrics = this.metrics;
            if (metrics.hasOwnProperty('length')) { return metrics.length; }
            var length = path.length({ segmentSubdivisions: this.getConnectionSubdivisions() });
            metrics.length = length;
            return length;
        },

        getPointAtLength: function(length) {

            var path = this.path;
            if (!path) { return null; }

            return path.pointAtLength(length, { segmentSubdivisions: this.getConnectionSubdivisions() });
        },

        getPointAtRatio: function(ratio) {

            var path = this.path;
            if (!path) { return null; }
            if (joint.util.isPercentage(ratio)) { ratio = parseFloat(ratio) / 100; }
            return path.pointAt(ratio, { segmentSubdivisions: this.getConnectionSubdivisions() });
        },

        getTangentAtLength: function(length) {

            var path = this.path;
            if (!path) { return null; }

            return path.tangentAtLength(length, { segmentSubdivisions: this.getConnectionSubdivisions() });
        },

        getTangentAtRatio: function(ratio) {

            var path = this.path;
            if (!path) { return null; }

            return path.tangentAt(ratio, { segmentSubdivisions: this.getConnectionSubdivisions() });
        },

        getClosestPoint: function(point) {

            var path = this.path;
            if (!path) { return null; }

            return path.closestPoint(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
        },

        getClosestPointLength: function(point) {

            var path = this.path;
            if (!path) { return null; }

            return path.closestPointLength(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
        },

        getClosestPointRatio: function(point) {

            var path = this.path;
            if (!path) { return null; }

            return path.closestPointNormalizedLength(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
        },

        // Get label position object based on two provided coordinates, x and y.
        // (Used behind the scenes when user moves labels around.)
        // Two signatures:
        // - num, num, obj = x, y, options
        // - num, num, num, obj = x, y, angle, options
        // Accepts distance/offset options = `absoluteDistance: boolean`, `reverseDistance: boolean`, `absoluteOffset: boolean`
        // - `absoluteOffset` is necessary in order to move beyond connection endpoints
        // Additional options = `keepGradient: boolean`, `ensureLegibility: boolean`
        getLabelPosition: function(x, y, p3, p4) {

            var position = {};

            // normalize data from the two possible signatures
            var localAngle = 0;
            var localOpt;
            if (typeof p3 === 'number') {
                // angle and opt provided as third and fourth argument
                localAngle = p3;
                localOpt = p4;
            } else {
                // opt provided as third argument
                localOpt = p3;
            }

            // save localOpt as `args` of the position object that is passed along
            if (localOpt) { position.args = localOpt; }

            // identify distance/offset settings
            var isDistanceRelative = !(localOpt && localOpt.absoluteDistance); // relative by default
            var isDistanceAbsoluteReverse = (localOpt && localOpt.absoluteDistance && localOpt.reverseDistance); // non-reverse by default
            var isOffsetAbsolute = localOpt && localOpt.absoluteOffset; // offset is non-absolute by default

            // find closest point t
            var path = this.path;
            var pathOpt = { segmentSubdivisions: this.getConnectionSubdivisions() };
            var labelPoint = new g$1.Point(x, y);
            var t = path.closestPointT(labelPoint, pathOpt);

            // DISTANCE:
            var labelDistance = path.lengthAtT(t, pathOpt);
            if (isDistanceRelative) { labelDistance = (labelDistance / this.getConnectionLength()) || 0; } // fix to prevent NaN for 0 length
            if (isDistanceAbsoluteReverse) { labelDistance = (-1 * (this.getConnectionLength() - labelDistance)) || 1; } // fix for end point (-0 => 1)
            position.distance = labelDistance;

            // OFFSET:
            // use absolute offset if:
            // - opt.absoluteOffset is true,
            // - opt.absoluteOffset is not true but there is no tangent
            var tangent;
            if (!isOffsetAbsolute) { tangent = path.tangentAtT(t); }
            var labelOffset;
            if (tangent) {
                labelOffset = tangent.pointOffset(labelPoint);
            } else {
                var closestPoint = path.pointAtT(t);
                var labelOffsetDiff = labelPoint.difference(closestPoint);
                labelOffset = { x: labelOffsetDiff.x, y: labelOffsetDiff.y };
            }
            position.offset = labelOffset;

            // ANGLE:
            position.angle = localAngle;

            return position;
        },

        _getLabelTransformationMatrix: function(labelPosition) {

            var labelDistance;
            var labelAngle = 0;
            var args = {};
            if (typeof labelPosition === 'number') {
                labelDistance = labelPosition;
            } else if (typeof labelPosition.distance === 'number') {
                args = labelPosition.args || {};
                labelDistance = labelPosition.distance;
                labelAngle = labelPosition.angle || 0;
            } else {
                throw new Error('dia.LinkView: invalid label position distance.');
            }

            var isDistanceRelative = ((labelDistance > 0) && (labelDistance <= 1));

            var labelOffset = 0;
            var labelOffsetCoordinates = { x: 0, y: 0 };
            if (labelPosition.offset) {
                var positionOffset = labelPosition.offset;
                if (typeof positionOffset === 'number') { labelOffset = positionOffset; }
                if (positionOffset.x) { labelOffsetCoordinates.x = positionOffset.x; }
                if (positionOffset.y) { labelOffsetCoordinates.y = positionOffset.y; }
            }

            var isOffsetAbsolute = ((labelOffsetCoordinates.x !== 0) || (labelOffsetCoordinates.y !== 0) || labelOffset === 0);

            var isKeepGradient = args.keepGradient;
            var isEnsureLegibility = args.ensureLegibility;

            var path = this.path;
            var pathOpt = { segmentSubdivisions: this.getConnectionSubdivisions() };

            var distance = isDistanceRelative ? (labelDistance * this.getConnectionLength()) : labelDistance;
            var tangent = path.tangentAtLength(distance, pathOpt);

            var translation;
            var angle = labelAngle;
            if (tangent) {
                if (isOffsetAbsolute) {
                    translation = tangent.start;
                    translation.offset(labelOffsetCoordinates);
                } else {
                    var normal$$1 = tangent.clone();
                    normal$$1.rotate(tangent.start, -90);
                    normal$$1.setLength(labelOffset);
                    translation = normal$$1.end;
                }
                if (isKeepGradient) {
                    angle = (tangent.angle() + labelAngle);
                    if (isEnsureLegibility) {
                        angle = g$1.normalizeAngle(((angle + 90) % 180) - 90);
                    }
                }
            } else {
                // fallback - the connection has zero length
                translation = path.start;
                if (isOffsetAbsolute) { translation.offset(labelOffsetCoordinates); }
            }

            return V.createSVGMatrix()
                .translate(translation.x, translation.y)
                .rotate(angle);
        },

        getLabelCoordinates: function(labelPosition) {

            var transformationMatrix = this._getLabelTransformationMatrix(labelPosition);
            return new g$1.Point(transformationMatrix.e, transformationMatrix.f);
        },

        getVertexIndex: function(x, y) {

            var model = this.model;
            var vertices = model.vertices();

            var vertexLength = this.getClosestPointLength(new g$1.Point(x, y));

            var idx = 0;
            for (var n = vertices.length; idx < n; idx++) {
                var currentVertex = vertices[idx];
                var currentVertexLength = this.getClosestPointLength(currentVertex);
                if (vertexLength < currentVertexLength) { break; }
            }

            return idx;
        },

        // Interaction. The controller part.
        // ---------------------------------

        notifyPointerdown: function notifyPointerdown(evt, x, y) {
            CellView.prototype.pointerdown.call(this, evt, x, y);
            this.notify('link:pointerdown', evt, x, y);
        },

        notifyPointermove: function notifyPointermove(evt, x, y) {
            CellView.prototype.pointermove.call(this, evt, x, y);
            this.notify('link:pointermove', evt, x, y);
        },

        notifyPointerup: function notifyPointerup(evt, x, y) {
            this.notify('link:pointerup', evt, x, y);
            CellView.prototype.pointermove.call(this, evt, x, y);
        },

        pointerdblclick: function(evt, x, y) {

            CellView.prototype.pointerdblclick.apply(this, arguments);
            this.notify('link:pointerdblclick', evt, x, y);
        },

        pointerclick: function(evt, x, y) {

            CellView.prototype.pointerclick.apply(this, arguments);
            this.notify('link:pointerclick', evt, x, y);
        },

        contextmenu: function(evt, x, y) {

            CellView.prototype.contextmenu.apply(this, arguments);
            this.notify('link:contextmenu', evt, x, y);
        },

        pointerdown: function(evt, x, y) {

            this.notifyPointerdown(evt, x, y);

            // Backwards compatibility for the default markup
            var className = evt.target.getAttribute('class');
            switch (className) {

                case 'marker-vertex':
                    this.dragVertexStart(evt, x, y);
                    return;

                case 'marker-vertex-remove':
                case 'marker-vertex-remove-area':
                    this.dragVertexRemoveStart(evt, x, y);
                    return;

                case 'marker-arrowhead':
                    this.dragArrowheadStart(evt, x, y);
                    return;

                case 'connection':
                case 'connection-wrap':
                    this.dragConnectionStart(evt, x, y);
                    return;

                case 'marker-source':
                case 'marker-target':
                    return;
            }

            this.dragStart(evt, x, y);
        },

        pointermove: function(evt, x, y) {

            // Backwards compatibility
            var dragData = this._dragData;
            if (dragData) { this.eventData(evt, dragData); }

            var data = this.eventData(evt);
            switch (data.action) {

                case 'vertex-move':
                    this.dragVertex(evt, x, y);
                    break;

                case 'label-move':
                    this.dragLabel(evt, x, y);
                    break;

                case 'arrowhead-move':
                    this.dragArrowhead(evt, x, y);
                    break;

                case 'move':
                    this.drag(evt, x, y);
                    break;
            }

            // Backwards compatibility
            if (dragData) { assign(dragData, this.eventData(evt)); }

            this.notifyPointermove(evt, x, y);
        },

        pointerup: function(evt, x, y) {

            // Backwards compatibility
            var dragData = this._dragData;
            if (dragData) {
                this.eventData(evt, dragData);
                this._dragData = null;
            }

            var data = this.eventData(evt);
            switch (data.action) {

                case 'vertex-move':
                    this.dragVertexEnd(evt, x, y);
                    break;

                case 'label-move':
                    this.dragLabelEnd(evt, x, y);
                    break;

                case 'arrowhead-move':
                    this.dragArrowheadEnd(evt, x, y);
                    break;

                case 'move':
                    this.dragEnd(evt, x, y);
            }

            this.notifyPointerup(evt, x, y);
            this.checkMouseleave(evt);
        },

        mouseover: function(evt) {

            CellView.prototype.mouseover.apply(this, arguments);
            this.notify('link:mouseover', evt);
        },

        mouseout: function(evt) {

            CellView.prototype.mouseout.apply(this, arguments);
            this.notify('link:mouseout', evt);
        },

        mouseenter: function(evt) {

            CellView.prototype.mouseenter.apply(this, arguments);
            this.notify('link:mouseenter', evt);
        },

        mouseleave: function(evt) {

            CellView.prototype.mouseleave.apply(this, arguments);
            this.notify('link:mouseleave', evt);
        },

        mousewheel: function(evt, x, y, delta) {

            CellView.prototype.mousewheel.apply(this, arguments);
            this.notify('link:mousewheel', evt, x, y, delta);
        },

        onevent: function(evt, eventName, x, y) {

            // Backwards compatibility
            var linkTool = V(evt.target).findParentByClass('link-tool', this.el);
            if (linkTool) {
                // No further action to be executed
                evt.stopPropagation();

                // Allow `interactive.useLinkTools=false`
                if (this.can('useLinkTools')) {
                    if (eventName === 'remove') {
                        // Built-in remove event
                        this.model.remove({ ui: true });
                        // Do not trigger link pointerdown
                        return;

                    } else {
                        // link:options and other custom events inside the link tools
                        this.notify(eventName, evt, x, y);
                    }
                }

                this.notifyPointerdown(evt, x, y);

            } else {
                CellView.prototype.onevent.apply(this, arguments);
            }
        },

        onlabel: function(evt, x, y) {

            this.notifyPointerdown(evt, x, y);

            this.dragLabelStart(evt, x, y);

            var stopPropagation = this.eventData(evt).stopPropagation;
            if (stopPropagation) { evt.stopPropagation(); }
        },

        // Drag Start Handlers

        dragConnectionStart: function(evt, x, y) {

            if (!this.can('vertexAdd')) { return; }

            // Store the index at which the new vertex has just been placed.
            // We'll be update the very same vertex position in `pointermove()`.
            var vertexIdx = this.addVertex({ x: x, y: y }, { ui: true });
            this.eventData(evt, {
                action: 'vertex-move',
                vertexIdx: vertexIdx
            });
        },

        dragLabelStart: function(evt, x, y) {

            if (!this.can('labelMove')) {
                // Backwards compatibility:
                // If labels can't be dragged no default action is triggered.
                this.eventData(evt, { stopPropagation: true });
                return;
            }

            var labelNode = evt.currentTarget;
            var labelIdx = parseInt(labelNode.getAttribute('label-idx'), 10);

            var positionAngle = this._getLabelPositionAngle(labelIdx);
            var labelPositionArgs = this._getLabelPositionArgs(labelIdx);
            var defaultLabelPositionArgs = this._getDefaultLabelPositionArgs();
            var positionArgs = this._mergeLabelPositionArgs(labelPositionArgs, defaultLabelPositionArgs);

            this.eventData(evt, {
                action: 'label-move',
                labelIdx: labelIdx,
                positionAngle: positionAngle,
                positionArgs: positionArgs,
                stopPropagation: true
            });

            this.paper.delegateDragEvents(this, evt.data);
        },

        dragVertexStart: function(evt, x, y) {

            if (!this.can('vertexMove')) { return; }

            var vertexNode = evt.target;
            var vertexIdx = parseInt(vertexNode.getAttribute('idx'), 10);
            this.eventData(evt, {
                action: 'vertex-move',
                vertexIdx: vertexIdx
            });
        },

        dragVertexRemoveStart: function(evt, x, y) {

            if (!this.can('vertexRemove')) { return; }

            var removeNode = evt.target;
            var vertexIdx = parseInt(removeNode.getAttribute('idx'), 10);
            this.model.removeVertex(vertexIdx);
        },

        dragArrowheadStart: function(evt, x, y) {

            if (!this.can('arrowheadMove')) { return; }

            var arrowheadNode = evt.target;
            var arrowheadType = arrowheadNode.getAttribute('end');
            var data = this.startArrowheadMove(arrowheadType, { ignoreBackwardsCompatibility: true });

            this.eventData(evt, data);
        },

        dragStart: function(evt, x, y) {

            if (!this.can('linkMove')) { return; }

            this.eventData(evt, {
                action: 'move',
                dx: x,
                dy: y
            });
        },

        // Drag Handlers
        dragLabel: function(evt, x, y) {

            var data = this.eventData(evt);
            var label = { position: this.getLabelPosition(x, y, data.positionAngle, data.positionArgs) };
            this.model.label(data.labelIdx, label);
        },

        dragVertex: function(evt, x, y) {

            var data = this.eventData(evt);
            this.model.vertex(data.vertexIdx, { x: x, y: y }, { ui: true });
        },

        dragArrowhead: function(evt, x, y) {

            var data = this.eventData(evt);

            if (this.paper.options.snapLinks) {

                this._snapArrowhead(x, y, data);

            } else {

                this._connectArrowhead(this.getEventTarget(evt), x, y, data);
            }
        },

        drag: function(evt, x, y) {

            var data = this.eventData(evt);
            this.model.translate(x - data.dx, y - data.dy, { ui: true });
            this.eventData(evt, {
                dx: x,
                dy: y
            });
        },

        // Drag End Handlers

        dragLabelEnd: function() {
            // noop
        },

        dragVertexEnd: function() {
            // noop
        },

        dragArrowheadEnd: function(evt, x, y) {

            var data = this.eventData(evt);
            var paper = this.paper;

            if (paper.options.snapLinks) {
                this._snapArrowheadEnd(data);
            } else {
                this._connectArrowheadEnd(data, x, y);
            }

            if (!paper.linkAllowed(this)) {
                // If the changed link is not allowed, revert to its previous state.
                this._disallow(data);
            } else {
                this._finishEmbedding(data);
                this._notifyConnectEvent(data, evt);
            }

            this._afterArrowheadMove(data);
        },

        dragEnd: function() {
            // noop
        },

        _disallow: function(data) {

            switch (data.whenNotAllowed) {

                case 'remove':
                    this.model.remove({ ui: true });
                    break;

                case 'revert':
                default:
                    this.model.set(data.arrowhead, data.initialEnd, { ui: true });
                    break;
            }
        },

        _finishEmbedding: function(data) {

            // Reparent the link if embedding is enabled
            if (this.paper.options.embeddingMode && this.model.reparent()) {
                // Make sure we don't reverse to the original 'z' index (see afterArrowheadMove()).
                data.z = null;
            }
        },

        _notifyConnectEvent: function(data, evt) {

            var arrowhead = data.arrowhead;
            var initialEnd = data.initialEnd;
            var currentEnd = this.model.prop(arrowhead);
            var endChanged = currentEnd && !Link.endsEqual(initialEnd, currentEnd);
            if (endChanged) {
                var paper = this.paper;
                if (initialEnd.id) {
                    this.notify('link:disconnect', evt, paper.findViewByModel(initialEnd.id), data.initialMagnet, arrowhead);
                }
                if (currentEnd.id) {
                    this.notify('link:connect', evt, paper.findViewByModel(currentEnd.id), data.magnetUnderPointer, arrowhead);
                }
            }
        },

        _snapArrowhead: function(x, y, data) {

            // checking view in close area of the pointer

            var r = this.paper.options.snapLinks.radius || 50;
            var viewsInArea = this.paper.findViewsInArea({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });

            var prevClosestView = data.closestView || null;
            var prevClosestMagnet = data.closestMagnet || null;

            data.closestView = data.closestMagnet = null;

            var distance;
            var minDistance = Number.MAX_VALUE;
            var pointer = g$1.Point(x, y);
            var paper = this.paper;

            viewsInArea.forEach(function(view) {

                // skip connecting to the element in case '.': { magnet: false } attribute present
                if (view.el.getAttribute('magnet') !== 'false') {

                    // find distance from the center of the model to pointer coordinates
                    distance = view.model.getBBox().center().distance(pointer);

                    // the connection is looked up in a circle area by `distance < r`
                    if (distance < r && distance < minDistance) {

                        if (prevClosestMagnet === view.el || paper.options.validateConnection.apply(
                            paper, data.validateConnectionArgs(view, null)
                        )) {
                            minDistance = distance;
                            data.closestView = view;
                            data.closestMagnet = view.el;
                        }
                    }
                }

                view.$('[magnet]').each(function(index, magnet) {

                    var bbox = view.getNodeBBox(magnet);

                    distance = pointer.distance({
                        x: bbox.x + bbox.width / 2,
                        y: bbox.y + bbox.height / 2
                    });

                    if (distance < r && distance < minDistance) {

                        if (prevClosestMagnet === magnet || paper.options.validateConnection.apply(
                            paper, data.validateConnectionArgs(view, magnet)
                        )) {
                            minDistance = distance;
                            data.closestView = view;
                            data.closestMagnet = magnet;
                        }
                    }

                }.bind(this));

            }, this);

            var end;
            var closestView = data.closestView;
            var closestMagnet = data.closestMagnet;
            var endType = data.arrowhead;
            var newClosestMagnet = (prevClosestMagnet !== closestMagnet);
            if (prevClosestView && newClosestMagnet) {
                prevClosestView.unhighlight(prevClosestMagnet, {
                    connecting: true,
                    snapping: true
                });
            }

            if (closestView) {

                if (!newClosestMagnet) { return; }

                closestView.highlight(closestMagnet, {
                    connecting: true,
                    snapping: true
                });
                end = closestView.getLinkEnd(closestMagnet, x, y, this.model, endType);

            } else {
                end = { x: x, y: y };
            }

            this.model.set(endType, end || { x: x, y: y }, { ui: true });
        },

        _snapArrowheadEnd: function(data) {

            // Finish off link snapping.
            // Everything except view unhighlighting was already done on pointermove.
            var closestView = data.closestView;
            var closestMagnet = data.closestMagnet;
            if (closestView && closestMagnet) {

                closestView.unhighlight(closestMagnet, { connecting: true, snapping: true });
                data.magnetUnderPointer = closestView.findMagnet(closestMagnet);
            }

            data.closestView = data.closestMagnet = null;
        },

        _connectArrowhead: function(target, x, y, data) {

            // checking views right under the pointer

            if (data.eventTarget !== target) {
                // Unhighlight the previous view under pointer if there was one.
                if (data.magnetUnderPointer) {
                    data.viewUnderPointer.unhighlight(data.magnetUnderPointer, {
                        connecting: true
                    });
                }

                data.viewUnderPointer = this.paper.findView(target);
                if (data.viewUnderPointer) {
                    // If we found a view that is under the pointer, we need to find the closest
                    // magnet based on the real target element of the event.
                    data.magnetUnderPointer = data.viewUnderPointer.findMagnet(target);

                    if (data.magnetUnderPointer && this.paper.options.validateConnection.apply(
                        this.paper,
                        data.validateConnectionArgs(data.viewUnderPointer, data.magnetUnderPointer)
                    )) {
                        // If there was no magnet found, do not highlight anything and assume there
                        // is no view under pointer we're interested in reconnecting to.
                        // This can only happen if the overall element has the attribute `'.': { magnet: false }`.
                        if (data.magnetUnderPointer) {
                            data.viewUnderPointer.highlight(data.magnetUnderPointer, {
                                connecting: true
                            });
                        }
                    } else {
                        // This type of connection is not valid. Disregard this magnet.
                        data.magnetUnderPointer = null;
                    }
                } else {
                    // Make sure we'll unset previous magnet.
                    data.magnetUnderPointer = null;
                }
            }

            data.eventTarget = target;

            this.model.set(data.arrowhead, { x: x, y: y }, { ui: true });
        },

        _connectArrowheadEnd: function(data, x, y) {

            var view = data.viewUnderPointer;
            var magnet = data.magnetUnderPointer;
            if (!magnet || !view) { return; }

            view.unhighlight(magnet, { connecting: true });

            var endType = data.arrowhead;
            var end = view.getLinkEnd(magnet, x, y, this.model, endType);
            this.model.set(endType, end, { ui: true });
        },

        _beforeArrowheadMove: function(data) {

            data.z = this.model.get('z');
            this.model.toFront();

            // Let the pointer propagate through the link view elements so that
            // the `evt.target` is another element under the pointer, not the link itself.
            var style = this.el.style;
            data.pointerEvents = style.pointerEvents;
            style.pointerEvents = 'none';

            if (this.paper.options.markAvailable) {
                this._markAvailableMagnets(data);
            }
        },

        _afterArrowheadMove: function(data) {

            if (data.z !== null) {
                this.model.set('z', data.z, { ui: true });
                data.z = null;
            }

            // Put `pointer-events` back to its original value. See `_beforeArrowheadMove()` for explanation.
            this.el.style.pointerEvents = data.pointerEvents;

            if (this.paper.options.markAvailable) {
                this._unmarkAvailableMagnets(data);
            }
        },

        _createValidateConnectionArgs: function(arrowhead) {
            // It makes sure the arguments for validateConnection have the following form:
            // (source view, source magnet, target view, target magnet and link view)
            var args = [];

            args[4] = arrowhead;
            args[5] = this;

            var oppositeArrowhead;
            var i = 0;
            var j = 0;

            if (arrowhead === 'source') {
                i = 2;
                oppositeArrowhead = 'target';
            } else {
                j = 2;
                oppositeArrowhead = 'source';
            }

            var end = this.model.get(oppositeArrowhead);

            if (end.id) {
                var view = args[i] = this.paper.findViewByModel(end.id);
                var magnet = view.getMagnetFromLinkEnd(end);
                if (magnet === view.el) { magnet = undefined; }
                args[i + 1] = magnet;
            }

            function validateConnectionArgs(cellView, magnet) {
                args[j] = cellView;
                args[j + 1] = cellView.el === magnet ? undefined : magnet;
                return args;
            }

            return validateConnectionArgs;
        },

        _markAvailableMagnets: function(data) {

            function isMagnetAvailable(view, magnet) {
                var paper = view.paper;
                var validate = paper.options.validateConnection;
                return validate.apply(paper, this.validateConnectionArgs(view, magnet));
            }

            var paper = this.paper;
            var elements = paper.model.getCells();
            data.marked = {};

            for (var i = 0, n = elements.length; i < n; i++) {
                var view = elements[i].findView(paper);

                if (!view) {
                    continue;
                }

                var magnets = Array.prototype.slice.call(view.el.querySelectorAll('[magnet]'));
                if (view.el.getAttribute('magnet') !== 'false') {
                    // Element wrapping group is also a magnet
                    magnets.push(view.el);
                }

                var availableMagnets = magnets.filter(isMagnetAvailable.bind(data, view));

                if (availableMagnets.length > 0) {
                    // highlight all available magnets
                    for (var j = 0, m = availableMagnets.length; j < m; j++) {
                        view.highlight(availableMagnets[j], { magnetAvailability: true });
                    }
                    // highlight the entire view
                    view.highlight(null, { elementAvailability: true });

                    data.marked[view.model.id] = availableMagnets;
                }
            }
        },

        _unmarkAvailableMagnets: function(data) {

            var markedKeys = Object.keys(data.marked);
            var id;
            var markedMagnets;

            for (var i = 0, n = markedKeys.length; i < n; i++) {
                id = markedKeys[i];
                markedMagnets = data.marked[id];

                var view = this.paper.findViewByModel(id);
                if (view) {
                    for (var j = 0, m = markedMagnets.length; j < m; j++) {
                        view.unhighlight(markedMagnets[j], { magnetAvailability: true });
                    }
                    view.unhighlight(null, { elementAvailability: true });
                }
            }

            data.marked = null;
        },

        startArrowheadMove: function(end, opt) {

            opt || (opt = {});

            // Allow to delegate events from an another view to this linkView in order to trigger arrowhead
            // move without need to click on the actual arrowhead dom element.
            var data = {
                action: 'arrowhead-move',
                arrowhead: end,
                whenNotAllowed: opt.whenNotAllowed || 'revert',
                initialMagnet: this[end + 'Magnet'] || (this[end + 'View'] ? this[end + 'View'].el : null),
                initialEnd: clone(this.model.get(end)),
                validateConnectionArgs: this._createValidateConnectionArgs(end)
            };

            this._beforeArrowheadMove(data);

            if (opt.ignoreBackwardsCompatibility !== true) {
                this._dragData = data;
            }

            return data;
        }
    });

    Object.defineProperty(LinkView.prototype, 'sourceBBox', {

        enumerable: true,

        get: function() {
            var sourceView = this.sourceView;
            if (!sourceView) {
                var sourceDef = this.model.source();
                return new g$1.Rect(sourceDef.x, sourceDef.y);
            }
            var sourceMagnet = this.sourceMagnet;
            if (sourceView.isNodeConnection(sourceMagnet)) {
                return new g$1.Rect(this.sourceAnchor);
            }
            return sourceView.getNodeBBox(sourceMagnet || sourceView.el);
        }

    });

    Object.defineProperty(LinkView.prototype, 'targetBBox', {

        enumerable: true,

        get: function() {
            var targetView = this.targetView;
            if (!targetView) {
                var targetDef = this.model.target();
                return new g$1.Rect(targetDef.x, targetDef.y);
            }
            var targetMagnet = this.targetMagnet;
            if (targetView.isNodeConnection(targetMagnet)) {
                return new g$1.Rect(this.targetAnchor);
            }
            return targetView.getNodeBBox(targetMagnet || targetView.el);
        }
    });

    var stroke = {

        defaultOptions: {

            padding: 3,
            rx: 0,
            ry: 0,
            attrs: {
                'stroke-width': 3,
                'stroke': '#FEB663'
            }
        },

        _views: {},

        getHighlighterId: function(magnetEl, opt) {

            return magnetEl.id + JSON.stringify(opt);
        },

        removeHighlighter: function(id) {
            if (this._views[id]) {
                this._views[id].remove();
                this._views[id] = null;
            }
        },

        /**
         * @param {joint.dia.CellView} cellView
         * @param {Element} magnetEl
         * @param {object=} opt
         */
        highlight: function(cellView, magnetEl, opt) {

            var id = this.getHighlighterId(magnetEl, opt);

            // Only highlight once.
            if (this._views[id]) { return; }

            var options = defaults(opt || {}, this.defaultOptions);

            var magnetVel = V(magnetEl);
            var magnetBBox;

            try {

                var pathData = magnetVel.convertToPathData();

            } catch (error) {

                // Failed to get path data from magnet element.
                // Draw a rectangle around the entire cell view instead.
                magnetBBox = magnetVel.bbox(true/* without transforms */);
                pathData = V.rectToPath(assign({}, options, magnetBBox));
            }

            var highlightVel = V('path').attr({
                'd': pathData,
                'pointer-events': 'none',
                'vector-effect': 'non-scaling-stroke',
                'fill': 'none'
            }).attr(options.attrs);

            if (cellView.isNodeConnection(magnetEl)) {

                highlightVel.attr('d', cellView.getSerializedConnection());

            } else {

                var highlightMatrix = magnetVel.getTransformToElement(cellView.el);

                // Add padding to the highlight element.
                var padding = options.padding;
                if (padding) {

                    magnetBBox || (magnetBBox = magnetVel.bbox(true));

                    var cx = magnetBBox.x + (magnetBBox.width / 2);
                    var cy = magnetBBox.y + (magnetBBox.height / 2);

                    magnetBBox = V.transformRect(magnetBBox, highlightMatrix);

                    var width = Math.max(magnetBBox.width, 1);
                    var height = Math.max(magnetBBox.height, 1);
                    var sx = (width + padding) / width;
                    var sy = (height + padding) / height;

                    var paddingMatrix = V.createSVGMatrix({
                        a: sx,
                        b: 0,
                        c: 0,
                        d: sy,
                        e: cx - sx * cx,
                        f: cy - sy * cy
                    });

                    highlightMatrix = highlightMatrix.multiply(paddingMatrix);
                }

                highlightVel.transform(highlightMatrix);
            }

            // joint.mvc.View will handle the theme class name and joint class name prefix.
            var highlightView = this._views[id] = new View({
                svgElement: true,
                className: 'highlight-stroke',
                el: highlightVel.node
            });

            // Remove the highlight view when the cell is removed from the graph.
            var removeHandler = this.removeHighlighter.bind(this, id);
            var cell = cellView.model;
            highlightView.listenTo(cell, 'remove', removeHandler);
            highlightView.listenTo(cell.graph, 'reset', removeHandler);

            cellView.vel.append(highlightVel);
        },

        /**
         * @param {joint.dia.CellView} cellView
         * @param {Element} magnetEl
         * @param {object=} opt
         */
        unhighlight: function(cellView, magnetEl, opt) {

            this.removeHighlighter(this.getHighlighterId(magnetEl, opt));
        }
    };

    var opacity = {

        /**
         * @param {joint.dia.CellView} cellView
         * @param {Element} magnetEl
         */
        highlight: function(cellView, magnetEl) {

            V(magnetEl).addClass(addClassNamePrefix('highlight-opacity'));
        },

        /**
         * @param {joint.dia.CellView} cellView
         * @param {Element} magnetEl
         */
        unhighlight: function(cellView, magnetEl) {

            V(magnetEl).removeClass(addClassNamePrefix('highlight-opacity'));
        }
    };

    var addClass = {

        className: addClassNamePrefix('highlighted'),

        /**
         * @param {joint.dia.CellView} cellView
         * @param {Element} magnetEl
         * @param {object=} opt
         */
        highlight: function(cellView, magnetEl, opt) {

            var options = opt || {};
            var className = options.className || this.className;
            V(magnetEl).addClass(className);
        },

        /**
         * @param {joint.dia.CellView} cellView
         * @param {Element} magnetEl
         * @param {object=} opt
         */
        unhighlight: function(cellView, magnetEl, opt) {

            var options = opt || {};
            var className = options.className || this.className;
            V(magnetEl).removeClass(className);
        }
    };



    var highlighters = /*#__PURE__*/Object.freeze({
        stroke: stroke,
        opacity: opacity,
        addClass: addClass
    });

    function connectionRatio(view, _magnet, _refPoint, opt) {

        var ratio = ('ratio' in opt) ? opt.ratio : 0.5;
        return view.getPointAtRatio(ratio);
    }

    function connectionLength(view, _magnet, _refPoint, opt) {

        var length = ('length' in opt) ? opt.length : 20;
        return view.getPointAtLength(length);
    }

    function _connectionPerpendicular(view, _magnet, refPoint, opt) {

        var OFFSET = 1e6;
        var path = view.getConnection();
        var segmentSubdivisions = view.getConnectionSubdivisions();
        var verticalLine = new g$1.Line(refPoint.clone().offset(0, OFFSET), refPoint.clone().offset(0, -OFFSET));
        var horizontalLine = new g$1.Line(refPoint.clone().offset(OFFSET, 0), refPoint.clone().offset(-OFFSET, 0));
        var verticalIntersections = verticalLine.intersect(path, { segmentSubdivisions: segmentSubdivisions });
        var horizontalIntersections = horizontalLine.intersect(path, { segmentSubdivisions: segmentSubdivisions });
        var intersections = [];
        if (verticalIntersections) { Array.prototype.push.apply(intersections, verticalIntersections); }
        if (horizontalIntersections) { Array.prototype.push.apply(intersections, horizontalIntersections); }
        if (intersections.length > 0) { return refPoint.chooseClosest(intersections); }
        if ('fallbackAt' in opt) {
            return getPointAtLink(view, opt.fallbackAt);
        }
        return connectionClosest(view, _magnet, refPoint, opt);
    }

    function _connectionClosest(view, _magnet, refPoint, _opt) {

        var closestPoint = view.getClosestPoint(refPoint);
        if (!closestPoint) { return new g$1.Point(); }
        return closestPoint;
    }

    function resolveRef(fn) {
        return function(view, magnet, ref, opt) {
            if (ref instanceof Element) {
                var refView = this.paper.findView(ref);
                var refPoint;
                if (refView) {
                    if (refView.isNodeConnection(ref)) {
                        var distance = ('fixedAt' in opt) ? opt.fixedAt : '50%';
                        refPoint = getPointAtLink(refView, distance);
                    } else {
                        refPoint = refView.getNodeBBox(ref).center();
                    }
                } else {
                    // Something went wrong
                    refPoint = new g$1.Point();
                }
                return fn.call(this, view, magnet, refPoint, opt);
            }
            return fn.apply(this, arguments);
        };
    }

    function getPointAtLink(view, value) {
        var parsedValue = parseFloat(value);
        if (isPercentage(value)) {
            return view.getPointAtRatio(parsedValue / 100);
        } else {
            return view.getPointAtLength(parsedValue);
        }
    }
    var connectionPerpendicular = resolveRef(_connectionPerpendicular);
    var connectionClosest = resolveRef(_connectionClosest);

    var linkAnchors = /*#__PURE__*/Object.freeze({
        resolveRef: resolveRef,
        connectionRatio: connectionRatio,
        connectionLength: connectionLength,
        connectionPerpendicular: connectionPerpendicular,
        connectionClosest: connectionClosest
    });

    function offset(p1, p2, offset) {

        if (!isFinite(offset)) { return p1; }
        var length = p1.distance(p2);
        if (offset === 0 && length > 0) { return p1; }
        return p1.move(p2, -Math.min(offset, length - 1));
    }

    function stroke$1(magnet) {

        var stroke = magnet.getAttribute('stroke-width');
        if (stroke === null) { return 0; }
        return parseFloat(stroke) || 0;
    }

    // Connection Points

    function anchorIntersection(line, view, magnet, opt) {

        return offset(line.end, line.start, opt.offset);
    }

    function bboxIntersection(line, view, magnet, opt) {

        var bbox = view.getNodeBBox(magnet);
        if (opt.stroke) { bbox.inflate(stroke$1(magnet) / 2); }
        var intersections = line.intersect(bbox);
        var cp = (intersections)
            ? line.start.chooseClosest(intersections)
            : line.end;
        return offset(cp, line.start, opt.offset);
    }

    function rectangleIntersection(line, view, magnet, opt) {

        var angle = view.model.angle();
        if (angle === 0) {
            return bboxIntersection(line, view, magnet, opt);
        }

        var bboxWORotation = view.getNodeUnrotatedBBox(magnet);
        if (opt.stroke) { bboxWORotation.inflate(stroke$1(magnet) / 2); }
        var center = bboxWORotation.center();
        var lineWORotation = line.clone().rotate(center, angle);
        var intersections = lineWORotation.setLength(1e6).intersect(bboxWORotation);
        var cp = (intersections)
            ? lineWORotation.start.chooseClosest(intersections).rotate(center, -angle)
            : line.end;
        return offset(cp, line.start, opt.offset);
    }

    function findShapeNode(magnet) {
        if (!magnet) { return null; }
        var node = magnet;
        do {
            var tagName = node.tagName;
            if (typeof tagName !== 'string') { return null; }
            tagName = tagName.toUpperCase();
            if (tagName === 'G') {
                node = node.firstElementChild;
            } else if (tagName === 'TITLE') {
                node = node.nextElementSibling;
            } else { break; }
        } while (node);
        return node;
    }

    var BNDR_SUBDIVISIONS = 'segmentSubdivisons';
    var BNDR_SHAPE_BBOX = 'shapeBBox';

    function boundaryIntersection(line, view, magnet, opt) {

        var node, intersection$$1;
        var selector = opt.selector;
        var anchor = line.end;

        if (typeof selector === 'string') {
            node = view.findBySelector(selector)[0];
        } else if (Array.isArray(selector)) {
            node = getByPath(magnet, selector);
        } else {
            node = findShapeNode(magnet);
        }

        if (!V.isSVGGraphicsElement(node)) {
            if (node === magnet || !V.isSVGGraphicsElement(magnet)) { return anchor; }
            node = magnet;
        }

        var localShape = view.getNodeShape(node);
        var magnetMatrix = view.getNodeMatrix(node);
        var translateMatrix = view.getRootTranslateMatrix();
        var rotateMatrix = view.getRootRotateMatrix();
        var targetMatrix = translateMatrix.multiply(rotateMatrix).multiply(magnetMatrix);
        var localMatrix = targetMatrix.inverse();
        var localLine = V.transformLine(line, localMatrix);
        var localRef = localLine.start.clone();
        var data = view.getNodeData(node);

        if (opt.insideout === false) {
            if (!data[BNDR_SHAPE_BBOX]) { data[BNDR_SHAPE_BBOX] = localShape.bbox(); }
            var localBBox = data[BNDR_SHAPE_BBOX];
            if (localBBox.containsPoint(localRef)) { return anchor; }
        }

        // Caching segment subdivisions for paths
        var pathOpt;
        if (localShape instanceof g$1.Path) {
            var precision = opt.precision || 2;
            if (!data[BNDR_SUBDIVISIONS]) { data[BNDR_SUBDIVISIONS] = localShape.getSegmentSubdivisions({ precision: precision }); }
            pathOpt = {
                precision: precision,
                segmentSubdivisions: data[BNDR_SUBDIVISIONS]
            };
        }

        if (opt.extrapolate === true) { localLine.setLength(1e6); }

        intersection$$1 = localLine.intersect(localShape, pathOpt);
        if (intersection$$1) {
            // More than one intersection
            if (V.isArray(intersection$$1)) { intersection$$1 = localRef.chooseClosest(intersection$$1); }
        } else if (opt.sticky === true) {
            // No intersection, find the closest point instead
            if (localShape instanceof g$1.Rect) {
                intersection$$1 = localShape.pointNearestToPoint(localRef);
            } else if (localShape instanceof g$1.Ellipse) {
                intersection$$1 = localShape.intersectionWithLineFromCenterToPoint(localRef);
            } else {
                intersection$$1 = localShape.closestPoint(localRef, pathOpt);
            }
        }

        var cp = (intersection$$1) ? V.transformPoint(intersection$$1, targetMatrix) : anchor;
        var cpOffset = opt.offset || 0;
        if (opt.stroke) { cpOffset += stroke$1(node) / 2; }

        return offset(cp, line.start, cpOffset);
    }

    var anchor = anchorIntersection;
    var bbox = bboxIntersection;
    var rectangle = rectangleIntersection;
    var boundary = boundaryIntersection;

    var connectionPoints = /*#__PURE__*/Object.freeze({
        anchor: anchor,
        bbox: bbox,
        rectangle: rectangle,
        boundary: boundary
    });

    function bboxWrapper(method) {

        return function(view, magnet, ref, opt) {

            var rotate = !!opt.rotate;
            var bbox = (rotate) ? view.getNodeUnrotatedBBox(magnet) : view.getNodeBBox(magnet);
            var anchor = bbox[method]();

            var dx = opt.dx;
            if (dx) {
                var dxPercentage = isPercentage(dx);
                dx = parseFloat(dx);
                if (isFinite(dx)) {
                    if (dxPercentage) {
                        dx /= 100;
                        dx *= bbox.width;
                    }
                    anchor.x += dx;
                }
            }

            var dy = opt.dy;
            if (dy) {
                var dyPercentage = isPercentage(dy);
                dy = parseFloat(dy);
                if (isFinite(dy)) {
                    if (dyPercentage) {
                        dy /= 100;
                        dy *= bbox.height;
                    }
                    anchor.y += dy;
                }
            }

            return (rotate) ? anchor.rotate(view.model.getBBox().center(), -view.model.angle()) : anchor;
        };
    }

    function _perpendicular(view, magnet, refPoint, opt) {

        var angle = view.model.angle();
        var bbox = view.getNodeBBox(magnet);
        var anchor = bbox.center();
        var topLeft = bbox.origin();
        var bottomRight = bbox.corner();

        var padding = opt.padding;
        if (!isFinite(padding)) { padding = 0; }

        if ((topLeft.y + padding) <= refPoint.y && refPoint.y <= (bottomRight.y - padding)) {
            var dy = (refPoint.y - anchor.y);
            anchor.x += (angle === 0 || angle === 180) ? 0 : dy * 1 / Math.tan(g$1.toRad(angle));
            anchor.y += dy;
        } else if ((topLeft.x + padding) <= refPoint.x && refPoint.x <= (bottomRight.x - padding)) {
            var dx = (refPoint.x - anchor.x);
            anchor.y += (angle === 90 || angle === 270) ? 0 : dx * Math.tan(g$1.toRad(angle));
            anchor.x += dx;
        }

        return anchor;
    }

    function _midSide(view, magnet, refPoint, opt) {

        var rotate = !!opt.rotate;
        var bbox, angle, center;
        if (rotate) {
            bbox = view.getNodeUnrotatedBBox(magnet);
            center = view.model.getBBox().center();
            angle = view.model.angle();
        } else {
            bbox = view.getNodeBBox(magnet);
        }

        var padding = opt.padding;
        if (isFinite(padding)) { bbox.inflate(padding); }

        if (rotate) { refPoint.rotate(center, angle); }

        var side = bbox.sideNearestToPoint(refPoint);
        var anchor;
        switch (side) {
            case 'left':
                anchor = bbox.leftMiddle();
                break;
            case 'right':
                anchor = bbox.rightMiddle();
                break;
            case 'top':
                anchor = bbox.topMiddle();
                break;
            case 'bottom':
                anchor = bbox.bottomMiddle();
                break;
        }

        return (rotate) ? anchor.rotate(center, -angle) : anchor;
    }

    // Can find anchor from model, when there is no selector or the link end
    // is connected to a port
    function _modelCenter(view, _magnet, _refPoint, opt, endType) {
        return view.model.getPointFromConnectedLink(this.model, endType).offset(opt.dx, opt.dy);
    }

    //joint.anchors
    var center = bboxWrapper('center');
    var top$2 = bboxWrapper('topMiddle');
    var bottom$2 = bboxWrapper('bottomMiddle');
    var left$2 = bboxWrapper('leftMiddle');
    var right$2 = bboxWrapper('rightMiddle');
    var topLeft = bboxWrapper('origin');
    var topRight = bboxWrapper('topRight');
    var bottomLeft = bboxWrapper('bottomLeft');
    var bottomRight = bboxWrapper('corner');
    var perpendicular = resolveRef(_perpendicular);
    var midSide = resolveRef(_midSide);
    var modelCenter = _modelCenter;

    var anchors = /*#__PURE__*/Object.freeze({
        center: center,
        top: top$2,
        bottom: bottom$2,
        left: left$2,
        right: right$2,
        topLeft: topLeft,
        topRight: topRight,
        bottomLeft: bottomLeft,
        bottomRight: bottomRight,
        perpendicular: perpendicular,
        midSide: midSide,
        modelCenter: modelCenter
    });

    var sortingTypes = {
        NONE: 'sorting-none',
        APPROX: 'sorting-approximate',
        EXACT: 'sorting-exact'
    };

    var FLAG_INSERT = 1<<30;
    var FLAG_REMOVE = 1<<29;

    var MOUNT_BATCH_SIZE = 1000;
    var UPDATE_BATCH_SIZE = Infinity;
    var MIN_PRIORITY = 2;

    var Paper = View.extend({

        className: 'paper',

        options: {

            width: 800,
            height: 600,
            origin: { x: 0, y: 0 }, // x,y coordinates in top-left corner
            gridSize: 1,

            // Whether or not to draw the grid lines on the paper's DOM element.
            // e.g drawGrid: true, drawGrid: { color: 'red', thickness: 2 }
            drawGrid: false,

            // Whether or not to draw the background on the paper's DOM element.
            // e.g. background: { color: 'lightblue', image: '/paper-background.png', repeat: 'flip-xy' }
            background: false,

            perpendicularLinks: false,
            elementView: ElementView,
            linkView: LinkView,
            snapLinks: false, // false, true, { radius: value }

            // When set to FALSE, an element may not have more than 1 link with the same source and target element.
            multiLinks: true,

            // For adding custom guard logic.
            guard: function(evt, view) {

                // FALSE means the event isn't guarded.
                return false;
            },

            highlighting: {
                'default': {
                    name: 'stroke',
                    options: {
                        padding: 3
                    }
                },
                magnetAvailability: {
                    name: 'addClass',
                    options: {
                        className: 'available-magnet'
                    }
                },
                elementAvailability: {
                    name: 'addClass',
                    options: {
                        className: 'available-cell'
                    }
                }
            },

            // Prevent the default context menu from being displayed.
            preventContextMenu: true,

            // Prevent the default action for blank:pointer<action>.
            preventDefaultBlankAction: true,

            // Restrict the translation of elements by given bounding box.
            // Option accepts a boolean:
            //  true - the translation is restricted to the paper area
            //  false - no restrictions
            // A method:
            // restrictTranslate: function(elementView) {
            //     var parentId = elementView.model.get('parent');
            //     return parentId && this.model.getCell(parentId).getBBox();
            // },
            // Or a bounding box:
            // restrictTranslate: { x: 10, y: 10, width: 790, height: 590 }
            restrictTranslate: false,

            // Marks all available magnets with 'available-magnet' class name and all available cells with
            // 'available-cell' class name. Marks them when dragging a link is started and unmark
            // when the dragging is stopped.
            markAvailable: false,

            // Defines what link model is added to the graph after an user clicks on an active magnet.
            // Value could be the Backbone.model or a function returning the Backbone.model
            // defaultLink: function(elementView, magnet) { return condition ? new customLink1() : new customLink2() }
            defaultLink: new Link,

            // A connector that is used by links with no connector defined on the model.
            // e.g. { name: 'rounded', args: { radius: 5 }} or a function
            defaultConnector: { name: 'normal' },

            // A router that is used by links with no router defined on the model.
            // e.g. { name: 'oneSide', args: { padding: 10 }} or a function
            defaultRouter: { name: 'normal' },

            defaultAnchor: { name: 'center' },

            defaultLinkAnchor: { name: 'connectionRatio' },

            defaultConnectionPoint: { name: 'bbox' },

            /* CONNECTING */

            connectionStrategy: null,

            // Check whether to add a new link to the graph when user clicks on an a magnet.
            validateMagnet: function(cellView, magnet) {
                return magnet.getAttribute('magnet') !== 'passive';
            },

            // Check whether to allow or disallow the link connection while an arrowhead end (source/target)
            // being changed.
            validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
                return (end === 'target' ? cellViewT : cellViewS) instanceof ElementView;
            },

            /* EMBEDDING */

            // Enables embedding. Re-parent the dragged element with elements under it and makes sure that
            // all links and elements are visible taken the level of embedding into account.
            embeddingMode: false,

            // Check whether to allow or disallow the element embedding while an element being translated.
            validateEmbedding: function(childView, parentView) {
                // by default all elements can be in relation child-parent
                return true;
            },

            // Determines the way how a cell finds a suitable parent when it's dragged over the paper.
            // The cell with the highest z-index (visually on the top) will be chosen.
            findParentBy: 'bbox', // 'bbox'|'center'|'origin'|'corner'|'topRight'|'bottomLeft'

            // If enabled only the element on the very front is taken into account for the embedding.
            // If disabled the elements under the dragged view are tested one by one
            // (from front to back) until a valid parent found.
            frontParentOnly: true,

            // Interactive flags. See online docs for the complete list of interactive flags.
            interactive: {
                labelMove: false
            },

            // When set to true the links can be pinned to the paper.
            // i.e. link source/target can be a point e.g. link.get('source') ==> { x: 100, y: 100 };
            linkPinning: true,

            // Custom validation after an interaction with a link ends.
            // Recognizes a function. If `false` is returned, the link is disallowed (removed or reverted)
            // (linkView, paper) => boolean
            allowLink: null,

            // Allowed number of mousemove events after which the pointerclick event will be still triggered.
            clickThreshold: 0,

            // Number of required mousemove events before the first pointermove event will be triggered.
            moveThreshold: 0,

            // Number of required mousemove events before the a link is created out of the magnet.
            // Or string `onleave` so the link is created when the pointer leaves the magnet
            magnetThreshold: 0,

            // Rendering Options

            sorting: sortingTypes.EXACT,

            frozen: false,

            onViewUpdate: function(view, flag, opt, paper) {
                if ((flag & FLAG_INSERT) || opt.mounting) { return; }
                paper.requestConnectedLinksUpdate(view, opt);
            },

            onViewPostponed: function(view, flag /* paper */) {
                return this.forcePostponedViewUpdate(view, flag);
            },

            viewport: null,

            // Default namespaces

            cellViewNamespace: null,

            highlighterNamespace: highlighters,

            anchorNamespace: anchors,

            linkAnchorNamespace: linkAnchors,

            connectionPointNamespace: connectionPoints
        },

        events: {
            'dblclick': 'pointerdblclick',
            'contextmenu': 'contextmenu',
            'mousedown': 'pointerdown',
            'touchstart': 'pointerdown',
            'mouseover': 'mouseover',
            'mouseout': 'mouseout',
            'mouseenter': 'mouseenter',
            'mouseleave': 'mouseleave',
            'mousewheel': 'mousewheel',
            'DOMMouseScroll': 'mousewheel',
            'mouseenter .joint-cell': 'mouseenter',
            'mouseleave .joint-cell': 'mouseleave',
            'mouseenter .joint-tools': 'mouseenter',
            'mouseleave .joint-tools': 'mouseleave',
            'mousedown .joint-cell [event]': 'onevent', // interaction with cell with `event` attribute set
            'touchstart .joint-cell [event]': 'onevent',
            'mousedown .joint-cell [magnet]': 'onmagnet', // interaction with cell with `magnet` attribute set
            'touchstart .joint-cell [magnet]': 'onmagnet',
            'dblclick .joint-cell [magnet]': 'magnetpointerdblclick',
            'contextmenu .joint-cell [magnet]': 'magnetcontextmenu',
            'mousedown .joint-link .label': 'onlabel', // interaction with link label
            'touchstart .joint-link .label': 'onlabel',
            'dragstart .joint-cell image': 'onImageDragStart' // firefox fix
        },

        documentEvents: {
            'mousemove': 'pointermove',
            'touchmove': 'pointermove',
            'mouseup': 'pointerup',
            'touchend': 'pointerup',
            'touchcancel': 'pointerup'
        },

        svg: null,
        viewport: null,
        defs: null,
        tools: null,
        $background: null,
        layers: null,
        $grid: null,
        $document: null,

        _highlights: null,
        _zPivots: null,
        // For storing the current transformation matrix (CTM) of the paper's viewport.
        _viewportMatrix: null,
        // For verifying whether the CTM is up-to-date. The viewport transform attribute
        // could have been manipulated directly.
        _viewportTransformString: null,
        // Updates data (priorities, unmounted views etc.)
        _updates: null,

        SORT_DELAYING_BATCHES: ['add', 'to-front', 'to-back'],
        UPDATE_DELAYING_BATCHES: ['translate'],
        MIN_SCALE: 1e-6,

        init: function() {

            var ref = this;
            var options = ref.options;
            var el = ref.el;
            if (!options.cellViewNamespace) {
                options.cellViewNamespace = typeof joint !== 'undefined' && has(joint, 'shapes') ? joint.shapes : null;
            }

            var model = this.model = options.model || new Graph;

            this.setGrid(options.drawGrid);
            this.cloneOptions();
            this.render();
            this.setDimensions();
            this.startListening();

            // Hash of all cell views.
            this._views = {};
            // z-index pivots
            this._zPivots = {};
            // Reference to the paper owner document
            this.$document = $(el.ownerDocument);
            // Highlighters references
            this._highlights = {};
            // Render existing cells in the graph
            this.resetViews(model.attributes.cells.models);
            // Start the Rendering Loop
            if (!this.isFrozen() && this.isAsync()) { this.updateViewsAsync(); }
        },

        _resetUpdates: function() {
            return this._updates = {
                id: null,
                priorities: [{}, {}, {}],
                unmountedCids: [],
                mountedCids: [],
                unmounted: {},
                mounted: {},
                count: 0,
                keyFrozen: false,
                freezeKey: null,
                sort: false
            };
        },

        startListening: function() {
            var model = this.model;
            this.listenTo(model, 'add', this.onCellAdded)
                .listenTo(model, 'remove', this.onCellRemoved)
                .listenTo(model, 'change', this.onCellChange)
                .listenTo(model, 'reset', this.onGraphReset)
                .listenTo(model, 'sort', this.onGraphSort)
                .listenTo(model, 'batch:stop', this.onGraphBatchStop);
            this.on('cell:highlight', this.onCellHighlight)
                .on('cell:unhighlight', this.onCellUnhighlight)
                .on('scale translate', this.update);
        },

        onCellAdded: function(cell, _$$1, opt) {
            var position = opt.position;
            if (this.isAsync() || !isNumber(position)) {
                this.renderView(cell, opt);
            } else {
                if (opt.maxPosition === position) { this.freeze({ key: 'addCells' }); }
                this.renderView(cell, opt);
                if (position === 0) { this.unfreeze({ key: 'addCells' }); }
            }
        },

        onCellRemoved: function(cell) {
            this.requestViewUpdate(this.findViewByModel(cell), FLAG_REMOVE, 0);
        },

        onCellChange: function(cell) {
            if (cell === this.model.attributes.cells) { return; }
            if (cell.hasChanged('z') && this.options.sorting === sortingTypes.APPROX) {
                var view = this.findViewByModel(cell);
                if (view) { this.requestViewUpdate(view, FLAG_INSERT, view.UPDATE_PRIORITY); }
            }
        },

        onGraphReset: function(collection, opt) {
            this.removeZPivots();
            this.resetViews(collection.models, opt);
        },

        onGraphSort: function() {
            if (this.model.hasActiveBatch(this.SORT_DELAYING_BATCHES)) { return; }
            this.sortViews();
        },

        onGraphBatchStop: function(data) {
            if (this.isFrozen()) { return; }
            var name = data && data.batchName;
            var graph = this.model;
            if (!this.isAsync()) {
                var updateDelayingBatches = this.UPDATE_DELAYING_BATCHES;
                if (updateDelayingBatches.includes(name) && !graph.hasActiveBatch(updateDelayingBatches)) {
                    this.updateViews(data);
                }
            }
            var sortDelayingBatches = this.SORT_DELAYING_BATCHES;
            if (sortDelayingBatches.includes(name) && !graph.hasActiveBatch(sortDelayingBatches)) {
                this.sortViews();
            }
        },

        cloneOptions: function() {

            var options = this.options;

            // This is a fix for the case where two papers share the same options.
            // Changing origin.x for one paper would change the value of origin.x for the other.
            // This prevents that behavior.
            options.origin = assign({}, options.origin);
            options.defaultConnector = assign({}, options.defaultConnector);
            // Return the default highlighting options into the user specified options.
            options.highlighting = defaultsDeep(
                {},
                options.highlighting,
                this.constructor.prototype.options.highlighting
            );

            // Default cellView namespace for ES5
            if (!options.cellViewNamespace && typeof joint !== 'undefined' && has(joint, 'shapes')) {
                options.cellViewNamespace = joint.shapes;
            }
        },

        children: function() {
            var ns = V.namespace;
            return [{
                namespaceURI: ns.xhtml,
                tagName: 'div',
                className: addClassNamePrefix('paper-background'),
                selector: 'background'
            }, {
                namespaceURI: ns.xhtml,
                tagName: 'div',
                className: addClassNamePrefix('paper-grid'),
                selector: 'grid'
            }, {
                namespaceURI: ns.svg,
                tagName: 'svg',
                attributes: {
                    'width': '100%',
                    'height': '100%',
                    'xmlns:xlink': ns.xlink,
                    'xmlns': ns.svg
                },
                selector: 'svg',
                children: [{
                    // Append `<defs>` element to the SVG document. This is useful for filters and gradients.
                    // It's desired to have the defs defined before the viewport (e.g. to make a PDF document pick up defs properly).
                    tagName: 'defs',
                    selector: 'defs'
                }, {
                    tagName: 'g',
                    className: addClassNamePrefix('layers'),
                    selector: 'layers',
                    children: [{
                        tagName: 'g',
                        className: addClassNamePrefix('cells-layer viewport'),
                        selector: 'cells',
                    }, {
                        tagName: 'g',
                        className: addClassNamePrefix('tools-layer'),
                        selector: 'tools'
                    }]
                }]
            }];
        },

        render: function() {

            this.renderChildren();
            var ref = this;
            var childNodes = ref.childNodes;
            var options = ref.options;
            var svg = childNodes.svg;
            var cells = childNodes.cells;
            var defs = childNodes.defs;
            var tools = childNodes.tools;
            var layers = childNodes.layers;
            var background = childNodes.background;
            var grid = childNodes.grid;

            this.svg = svg;
            this.defs = defs;
            this.tools = tools;
            this.cells = cells;
            this.layers = layers;
            this.$background = $(background);
            this.$grid = $(grid);

            // backwards compatibility
            this.viewport = cells;

            if (options.background) {
                this.drawBackground(options.background);
            }

            if (options.drawGrid) {
                this.drawGrid();
            }

            return this;
        },

        update: function() {

            if (this.options.drawGrid) {
                this.drawGrid();
            }

            if (this._background) {
                this.updateBackgroundImage(this._background);
            }

            return this;
        },

        matrix: function(ctm) {

            var viewport = this.layers;

            // Getter:
            if (ctm === undefined) {

                var transformString = viewport.getAttribute('transform');

                if ((this._viewportTransformString || null) === transformString) {
                    // It's ok to return the cached matrix. The transform attribute has not changed since
                    // the matrix was stored.
                    ctm = this._viewportMatrix;
                } else {
                    // The viewport transform attribute has changed. Measure the matrix and cache again.
                    ctm = viewport.getCTM();
                    this._viewportMatrix = ctm;
                    this._viewportTransformString = transformString;
                }

                // Clone the cached current transformation matrix.
                // If no matrix previously stored the identity matrix is returned.
                return V.createSVGMatrix(ctm);
            }

            // Setter:
            ctm = V.createSVGMatrix(ctm);
            var ctmString = V.matrixToTransformString(ctm);
            viewport.setAttribute('transform', ctmString);

            this._viewportMatrix = ctm;
            this._viewportTransformString = viewport.getAttribute('transform');

            return this;
        },

        clientMatrix: function() {

            return V.createSVGMatrix(this.cells.getScreenCTM());
        },

        requestConnectedLinksUpdate: function(view, opt) {
            if (view instanceof CellView) {
                var model = view.model;
                var links = this.model.getConnectedLinks(model);
                for (var j = 0, n = links.length; j < n; j++) {
                    var link = links[j];
                    var linkView = this.findViewByModel(link);
                    if (!linkView) { continue; }
                    var flagLabels = ['UPDATE'];
                    if (link.getTargetCell() === model) { flagLabels.push('TARGET'); }
                    if (link.getSourceCell() === model) { flagLabels.push('SOURCE'); }
                    this.scheduleViewUpdate(linkView, linkView.getFlag(flagLabels), linkView.UPDATE_PRIORITY, opt);
                }
            }
        },

        forcePostponedViewUpdate: function(view, flag) {
            if (!view || !(view instanceof CellView)) { return false; }
            var model = view.model;
            if (model.isElement()) { return false; }
            if ((flag & view.getFlag(['SOURCE', 'TARGET'])) === 0) {
                // LinkView is waiting for the target or the source cellView to be rendered
                // This can happen when the cells are not in the viewport.
                var sourceView = this.findViewByModel(model.getSourceCell());
                var sourceFlag = this.dumpView(sourceView);
                var targetView = this.findViewByModel(model.getTargetCell());
                var targetFlag = this.dumpView(targetView);
                return sourceFlag === 0 && targetFlag === 0;
            }
            return false;
        },

        requestViewUpdate: function(view, flag, priority, opt) {
            opt || (opt = {});
            this.scheduleViewUpdate(view, flag, priority, opt);
            var isAsync = this.isAsync();
            if (this.isFrozen() || (isAsync && opt.async !== false)) { return; }
            if (this.model.hasActiveBatch(this.UPDATE_DELAYING_BATCHES)) { return; }
            var stats = this.updateViews(opt);
            if (isAsync) { this.trigger('render:done', stats, opt); }
        },

        scheduleViewUpdate: function(view, type, priority, opt) {
            var updates = this._updates;
            var priorityUpdates = updates.priorities[priority];
            if (!priorityUpdates) { priorityUpdates = updates.priorities[priority] = {}; }
            var currentType = priorityUpdates[view.cid] || 0;
            // prevent cycling
            if ((currentType & type) === type) { return; }
            if (!currentType) { updates.count++; }
            if (type & FLAG_REMOVE && currentType & FLAG_INSERT) {
                // When a view is removed we need to remove the insert flag as this is a reinsert
                priorityUpdates[view.cid] ^= FLAG_INSERT;
            } else if (type & FLAG_INSERT && currentType & FLAG_REMOVE) {
                // When a view is added we need to remove the remove flag as this is view was previously removed
                priorityUpdates[view.cid] ^= FLAG_REMOVE;
            }
            priorityUpdates[view.cid] |= type;
            var viewUpdateFn = this.options.onViewUpdate;
            if (typeof viewUpdateFn === 'function') { viewUpdateFn.call(this, view, type, opt || {}, this); }
        },

        dumpViewUpdate: function(view) {
            if (!view) { return 0; }
            var updates = this._updates;
            var cid = view.cid;
            var priorityUpdates = updates.priorities[view.UPDATE_PRIORITY];
            var flag = this.registerMountedView(view) | priorityUpdates[cid];
            delete priorityUpdates[cid];
            return flag;
        },

        dumpView: function(view, opt) {
            var flag = this.dumpViewUpdate(view);
            if (!flag) { return 0; }
            return this.updateView(view, flag, opt);
        },

        updateView: function(view, flag, opt) {
            if (!view) { return 0; }
            if (view instanceof CellView) {
                if (flag & FLAG_REMOVE) {
                    this.removeView(view.model);
                    return 0;
                }
                if (flag & FLAG_INSERT) {
                    this.insertView(view);
                    flag ^= FLAG_INSERT;
                }
            }
            if (!flag) { return 0; }
            return view.confirmUpdate(flag, opt || {});
        },

        requireView: function(model, opt) {
            var view = this.findViewByModel(model);
            if (!view) { return null; }
            this.dumpView(view, opt);
            return view;
        },

        registerUnmountedView: function(view) {
            var cid = view.cid;
            var updates = this._updates;
            if (cid in updates.unmounted) { return 0; }
            var flag = updates.unmounted[cid] |= FLAG_INSERT;
            updates.unmountedCids.push(cid);
            delete updates.mounted[cid];
            return flag;
        },

        registerMountedView: function(view) {
            var cid = view.cid;
            var updates = this._updates;
            if (cid in updates.mounted) { return 0; }
            updates.mounted[cid] = true;
            updates.mountedCids.push(cid);
            var flag = updates.unmounted[cid] || 0;
            delete updates.unmounted[cid];
            return flag;
        },

        dumpViews: function(opt) {
            var passingOpt = defaults({}, opt, { viewport: null });
            this.checkViewport(passingOpt);
            this.updateViews(passingOpt);
        },

        updateViews: function(opt) {
            var stats;
            var updateCount = 0;
            var batchCount = 0;
            var priority = MIN_PRIORITY;
            do {
                batchCount++;
                stats = this.updateViewsBatch(opt);
                updateCount += stats.updated;
                priority = Math.min(stats.priority, priority);
            } while (!stats.empty);
            return { updated: updateCount, batches: batchCount, priority: priority };
        },

        updateViewsAsync: function(opt, data) {
            opt || (opt = {});
            data || (data = { processed: 0, priority: MIN_PRIORITY });
            var updates = this._updates;
            var id = updates.id;
            if (id) {
                cancelFrame(id);
                var stats = this.updateViewsBatch(opt);
                var passingOpt = defaults({}, opt, {
                    mountBatchSize: MOUNT_BATCH_SIZE - stats.mounted,
                    unmountBatchSize: MOUNT_BATCH_SIZE - stats.unmounted
                });
                var checkStats = this.checkViewport(passingOpt);
                var unmountCount = checkStats.unmounted;
                var mountCount = checkStats.mounted;
                var processed = data.processed;
                var total = updates.count;
                if (stats.updated > 0) {
                    // Some updates have been just processed
                    processed += stats.updated + stats.unmounted;
                    stats.processed = processed;
                    data.priority = Math.min(stats.priority, data.priority);
                    if (stats.empty && mountCount === 0) {
                        stats.unmounted += unmountCount;
                        stats.mounted += mountCount;
                        stats.priority = data.priority;
                        this.trigger('render:done', stats, opt);
                        data.processed = 0;
                        updates.count = 0;
                    } else {
                        data.processed = processed;
                    }
                }
                // Progress callback
                var progressFn = opt.progress;
                if (total && typeof progressFn === 'function') {
                    progressFn.call(this, stats.empty, processed, total, stats, this);
                }
                // The current frame could have been canceled in a callback
                if (updates.id !== id) { return; }
            }
            updates.id = nextFrame(this.updateViewsAsync, this, opt, data);
        },

        updateViewsBatch: function(opt) {
            opt || (opt = {});
            var batchSize = opt.batchSize || UPDATE_BATCH_SIZE;
            var updates = this._updates;
            var updateCount = 0;
            var postponeCount = 0;
            var unmountCount = 0;
            var mountCount = 0;
            var maxPriority = MIN_PRIORITY;
            var empty = true;
            var options = this.options;
            var priorities = updates.priorities;
            var viewportFn = 'viewport' in opt ? opt.viewport : options.viewport;
            if (typeof viewportFn !== 'function') { viewportFn = null; }
            var postponeViewFn = options.onViewPostponed;
            if (typeof postponeViewFn !== 'function') { postponeViewFn = null; }
            main: for (var priority = 0, n = priorities.length; priority < n; priority++) {
                var priorityUpdates = priorities[priority];
                for (var cid in priorityUpdates) {
                    if (updateCount >= batchSize) {
                        empty = false;
                        break main;
                    }
                    var view = views[cid];
                    if (!view) {
                        // This should not occur
                        delete priorityUpdates[cid];
                        continue;
                    }
                    var currentFlag = priorityUpdates[cid];
                    var isDetached = cid in updates.unmounted;
                    if (viewportFn && !viewportFn.call(this, view, isDetached, this)) {
                        // Unmount View
                        if (!isDetached) {
                            this.registerUnmountedView(view);
                            view.unmount();
                        }
                        updates.unmounted[cid] |= currentFlag;
                        delete priorityUpdates[cid];
                        unmountCount++;
                        continue;
                    }
                    // Mount View
                    if (isDetached) {
                        currentFlag |= FLAG_INSERT;
                        mountCount++;
                    }
                    currentFlag |= this.registerMountedView(view);
                    var leftoverFlag = this.updateView(view, currentFlag, opt);
                    if (leftoverFlag > 0) {
                        // View update has not finished completely
                        priorityUpdates[cid] = leftoverFlag;
                        postponeCount++;
                        if (postponeViewFn && postponeViewFn.call(this, view, leftoverFlag, this)) {
                            // postponed view update was resolved
                            empty = false;
                        }
                        continue;
                    }
                    if (maxPriority > priority) { maxPriority = priority; }
                    updateCount++;
                    delete priorityUpdates[cid];
                }
            }
            return {
                priority: maxPriority,
                updated: updateCount,
                postponed: postponeCount,
                unmounted: unmountCount,
                mounted: mountCount,
                empty: empty
            };
        },

        checkUnmountedViews: function(viewportFn, opt) {
            opt || (opt  = {});
            var mountCount = 0;
            if (typeof viewportFn !== 'function') { viewportFn = null; }
            var batchSize = 'mountBatchSize' in opt ? opt.mountBatchSize : Infinity;
            var updates = this._updates;
            var unmountedCids = updates.unmountedCids;
            var unmounted = updates.unmounted;
            for (var i = 0, n = Math.min(unmountedCids.length, batchSize); i < n; i++) {
                var cid = unmountedCids[i];
                if (!(cid in unmounted)) { continue; }
                var view = views[cid];
                if (!view) { continue; }
                if (viewportFn && !viewportFn.call(this, view, true, this)) {
                    // Push at the end of all unmounted ids, so this can be check later again
                    unmountedCids.push(cid);
                    continue;
                }
                mountCount++;
                var flag = this.registerMountedView(view);
                if (flag) { this.scheduleViewUpdate(view, flag, view.UPDATE_PRIORITY, { mounting: true }); }
            }
            // Get rid of views, that have been mounted
            unmountedCids.splice(0, i);
            return mountCount;
        },

        checkMountedViews: function(viewportFn, opt) {
            opt || (opt = {});
            var unmountCount = 0;
            if (typeof viewportFn !== 'function') { return unmountCount; }
            var batchSize = 'unmountBatchSize' in opt ? opt.unmountBatchSize : Infinity;
            var updates = this._updates;
            var mountedCids = updates.mountedCids;
            var mounted = updates.mounted;
            for (var i = 0, n = Math.min(mountedCids.length, batchSize); i < n; i++) {
                var cid = mountedCids[i];
                if (!(cid in mounted)) { continue; }
                var view = views[cid];
                if (!view) { continue; }
                if (viewportFn.call(this, view, true)) {
                    // Push at the end of all mounted ids, so this can be check later again
                    mountedCids.push(cid);
                    continue;
                }
                unmountCount++;
                var flag = this.registerUnmountedView(view);
                if (flag) { view.unmount(); }
            }
            // Get rid of views, that have been unmounted
            mountedCids.splice(0, i);
            return unmountCount;
        },

        checkViewport: function(opt) {
            var passingOpt = defaults({}, opt, {
                mountBatchSize: Infinity,
                unmountBatchSize: Infinity
            });
            var viewportFn = 'viewport' in passingOpt ? passingOpt.viewport : this.options.viewport;
            var unmountedCount = this.checkMountedViews(viewportFn, passingOpt);
            if (unmountedCount > 0) {
                // Do not check views, that have been just unmounted and pushed at the end of the cids array
                var unmountedCids = this._updates.unmountedCids;
                passingOpt.mountBatchSize = Math.min(unmountedCids.length - unmountedCount, passingOpt.mountBatchSize);
            }
            var mountedCount = this.checkUnmountedViews(viewportFn, passingOpt);
            return {
                mounted: mountedCount,
                unmounted: unmountedCount
            };
        },

        freeze: function(opt) {
            opt || (opt = {});
            var updates = this._updates;
            var key = opt.key;
            var isFrozen = this.options.frozen;
            var freezeKey = updates.freezeKey;
            if (key && key !== freezeKey)  {
                // key passed, but the paper is already freezed with another key
                if (isFrozen && freezeKey) { return; }
                updates.freezeKey = key;
                updates.keyFrozen = isFrozen;
            }
            this.options.frozen = true;
            var id = updates.id;
            updates.id = null;
            if (this.isAsync() && id) { cancelFrame(id); }
        },

        unfreeze: function(opt) {
            opt || (opt = {});
            var updates = this._updates;
            var key = opt.key;
            var freezeKey = updates.freezeKey;
            // key passed, but the paper is already freezed with another key
            if (key && freezeKey && key !== freezeKey) { return; }
            updates.freezeKey = null;
            // key passed, but the paper is already freezed
            if (key && key === freezeKey && updates.keyFrozen) { return; }
            if (this.isAsync()) {
                this.freeze();
                this.updateViewsAsync(opt);
            } else {
                this.updateViews(opt);
            }
            this.options.frozen = updates.keyFrozen = false;
            if (updates.sort) {
                this.sortViews();
                updates.sort = false;
            }
        },

        isAsync: function() {
            return !!this.options.async;
        },

        isFrozen: function() {
            return !!this.options.frozen;
        },

        isExactSorting: function() {
            return this.options.sorting === sortingTypes.EXACT;
        },

        onRemove: function() {

            this.freeze();
            //clean up all DOM elements/views to prevent memory leaks
            this.removeViews();
        },

        getComputedSize: function() {

            var options = this.options;
            var w = options.width;
            var h = options.height;
            if (!isNumber(w)) { w = this.el.clientWidth; }
            if (!isNumber(h)) { h = this.el.clientHeight; }
            return { width: w, height: h };
        },

        setDimensions: function(width, height) {

            var options = this.options;
            var w = (width === undefined) ? options.width : width;
            var h = (height === undefined) ? options.height : height;
            this.options.width = w;
            this.options.height = h;
            if (isNumber(w)) { w = Math.round(w); }
            if (isNumber(h)) { h = Math.round(h); }
            this.$el.css({
                width: (w === null) ? '' : w,
                height: (h === null) ? '' : h
            });
            var computedSize = this.getComputedSize();
            this.trigger('resize', computedSize.width, computedSize.height);
        },

        setOrigin: function(ox, oy) {

            return this.translate(ox || 0, oy || 0, { absolute: true });
        },

        // Expand/shrink the paper to fit the content. Snap the width/height to the grid
        // defined in `gridWidth`, `gridHeight`. `padding` adds to the resulting width/height of the paper.
        // When options { fitNegative: true } it also translates the viewport in order to make all
        // the content visible.
        fitToContent: function(gridWidth, gridHeight, padding, opt) { // alternatively function(opt)

            if (isObject(gridWidth)) {
                // first parameter is an option object
                opt = gridWidth;
                gridWidth = opt.gridWidth || 1;
                gridHeight = opt.gridHeight || 1;
                padding = opt.padding || 0;

            } else {

                opt || (opt = {});
                gridWidth = gridWidth || 1;
                gridHeight = gridHeight || 1;
                padding = padding || 0;
            }

            // Calculate the paper size to accomodate all the graph's elements.

            padding = normalizeSides(padding);

            var area = ('contentArea' in opt) ? new g$1.Rect(opt.contentArea) : this.getContentArea(opt);

            var currentScale = this.scale();
            var currentTranslate = this.translate();
            var sx = currentScale.sx;
            var sy = currentScale.sy;

            area.x *= sx;
            area.y *= sy;
            area.width *= sx;
            area.height *= sy;

            var calcWidth = Math.max(Math.ceil((area.width + area.x) / gridWidth), 1) * gridWidth;
            var calcHeight = Math.max(Math.ceil((area.height + area.y) / gridHeight), 1) * gridHeight;

            var tx = 0;
            var ty = 0;

            if ((opt.allowNewOrigin == 'negative' && area.x < 0) || (opt.allowNewOrigin == 'positive' && area.x >= 0) || opt.allowNewOrigin == 'any') {
                tx = Math.ceil(-area.x / gridWidth) * gridWidth;
                tx += padding.left;
                calcWidth += tx;
            }

            if ((opt.allowNewOrigin == 'negative' && area.y < 0) || (opt.allowNewOrigin == 'positive' && area.y >= 0) || opt.allowNewOrigin == 'any') {
                ty = Math.ceil(-area.y / gridHeight) * gridHeight;
                ty += padding.top;
                calcHeight += ty;
            }

            calcWidth += padding.right;
            calcHeight += padding.bottom;

            // Make sure the resulting width and height are greater than minimum.
            calcWidth = Math.max(calcWidth, opt.minWidth || 0);
            calcHeight = Math.max(calcHeight, opt.minHeight || 0);

            // Make sure the resulting width and height are lesser than maximum.
            calcWidth = Math.min(calcWidth, opt.maxWidth || Number.MAX_VALUE);
            calcHeight = Math.min(calcHeight, opt.maxHeight || Number.MAX_VALUE);

            var computedSize = this.getComputedSize();
            var dimensionChange = calcWidth != computedSize.width || calcHeight != computedSize.height;
            var originChange = tx != currentTranslate.tx || ty != currentTranslate.ty;

            // Change the dimensions only if there is a size discrepency or an origin change
            if (originChange) {
                this.translate(tx, ty);
            }
            if (dimensionChange) {
                this.setDimensions(calcWidth, calcHeight);
            }

            return new g$1.Rect(-tx / sx, -ty / sy, calcWidth / sx, calcHeight / sy);
        },

        scaleContentToFit: function(opt) {

            opt || (opt = {});

            var contentBBox, contentLocalOrigin;
            if ('contentArea' in opt) {
                var contentArea = opt.contentArea;
                contentBBox = this.localToPaperRect(contentArea);
                contentLocalOrigin = new g$1.Point(contentArea);
            } else {
                contentBBox = this.getContentBBox(opt);
                contentLocalOrigin = this.paperToLocalPoint(contentBBox);
            }

            if (!contentBBox.width || !contentBBox.height) { return; }

            defaults(opt, {
                padding: 0,
                preserveAspectRatio: true,
                scaleGrid: null,
                minScale: 0,
                maxScale: Number.MAX_VALUE
                //minScaleX
                //minScaleY
                //maxScaleX
                //maxScaleY
                //fittingBBox
            });

            var padding = opt.padding;

            var minScaleX = opt.minScaleX || opt.minScale;
            var maxScaleX = opt.maxScaleX || opt.maxScale;
            var minScaleY = opt.minScaleY || opt.minScale;
            var maxScaleY = opt.maxScaleY || opt.maxScale;

            var fittingBBox;
            if (opt.fittingBBox) {
                fittingBBox = opt.fittingBBox;
            } else {
                var currentTranslate = this.translate();
                var computedSize = this.getComputedSize();
                fittingBBox = {
                    x: currentTranslate.tx,
                    y: currentTranslate.ty,
                    width: computedSize.width,
                    height: computedSize.height
                };
            }

            fittingBBox = new g$1.Rect(fittingBBox).inflate(-padding);

            var currentScale = this.scale();

            var newSx = fittingBBox.width / contentBBox.width * currentScale.sx;
            var newSy = fittingBBox.height / contentBBox.height * currentScale.sy;

            if (opt.preserveAspectRatio) {
                newSx = newSy = Math.min(newSx, newSy);
            }

            // snap scale to a grid
            if (opt.scaleGrid) {

                var gridSize = opt.scaleGrid;

                newSx = gridSize * Math.floor(newSx / gridSize);
                newSy = gridSize * Math.floor(newSy / gridSize);
            }

            // scale min/max boundaries
            newSx = Math.min(maxScaleX, Math.max(minScaleX, newSx));
            newSy = Math.min(maxScaleY, Math.max(minScaleY, newSy));

            var origin = this.options.origin;
            var newOx = fittingBBox.x - contentLocalOrigin.x * newSx - origin.x;
            var newOy = fittingBBox.y - contentLocalOrigin.y * newSy - origin.y;

            this.scale(newSx, newSy);
            this.translate(newOx, newOy);
        },

        // Return the dimensions of the content area in local units (without transformations).
        getContentArea: function(opt) {

            if (opt && opt.useModelGeometry) {
                var graph = this.model;
                return graph.getCellsBBox(graph.getCells(), { includeLinks: true }) || new g$1.Rect();
            }

            return V(this.cells).getBBox();
        },

        // Return the dimensions of the content bbox in the paper units (as it appears on screen).
        getContentBBox: function(opt) {

            return this.localToPaperRect(this.getContentArea(opt));
        },

        // Returns a geometry rectangle represeting the entire
        // paper area (coordinates from the left paper border to the right one
        // and the top border to the bottom one).
        getArea: function() {

            return this.paperToLocalRect(this.getComputedSize());
        },

        getRestrictedArea: function() {

            var restrictedArea;

            if (isFunction(this.options.restrictTranslate)) {
                // A method returning a bounding box
                restrictedArea = this.options.restrictTranslate.apply(this, arguments);
            } else if (this.options.restrictTranslate === true) {
                // The paper area
                restrictedArea = this.getArea();
            } else {
                // Either false or a bounding box
                restrictedArea = this.options.restrictTranslate || null;
            }

            return restrictedArea;
        },

        createViewForModel: function(cell) {

            // A class taken from the paper options.
            var optionalViewClass;

            // A default basic class (either dia.ElementView or dia.LinkView)
            var defaultViewClass;

            // A special class defined for this model in the corresponding namespace.
            // e.g. joint.shapes.basic.Rect searches for joint.shapes.basic.RectView
            var namespace = this.options.cellViewNamespace;
            var type = cell.get('type') + 'View';
            var namespaceViewClass = getByPath(namespace, type, '.');

            if (cell.isLink()) {
                optionalViewClass = this.options.linkView;
                defaultViewClass = LinkView;
            } else {
                optionalViewClass = this.options.elementView;
                defaultViewClass = ElementView;
            }

            // a) the paper options view is a class (deprecated)
            //  1. search the namespace for a view
            //  2. if no view was found, use view from the paper options
            // b) the paper options view is a function
            //  1. call the function from the paper options
            //  2. if no view was return, search the namespace for a view
            //  3. if no view was found, use the default
            var ViewClass = (optionalViewClass.prototype instanceof Backbone.View)
                ? namespaceViewClass || optionalViewClass
                : optionalViewClass.call(this, cell) || namespaceViewClass || defaultViewClass;

            return new ViewClass({
                model: cell,
                interactive: this.options.interactive
            });
        },

        removeView: function(cell) {

            var id = cell.id;
            var view = this._views[id];
            if (view) {
                view.remove();
                delete this._views[id];
            }
            return view;
        },

        renderView: function(cell, opt) {

            var id = cell.id;
            var views$$1 = this._views;
            var view, flag;
            if (id in views$$1) {
                view = views$$1[id];
                flag = FLAG_INSERT;
            } else {
                view = views$$1[cell.id] = this.createViewForModel(cell);
                view.paper = this;
                flag = FLAG_INSERT | view.getFlag(view.initFlag);
            }
            this.requestViewUpdate(view, flag, view.UPDATE_PRIORITY, opt);
            return view;
        },

        onImageDragStart: function() {
            // This is the only way to prevent image dragging in Firefox that works.
            // Setting -moz-user-select: none, draggable="false" attribute or user-drag: none didn't help.

            return false;
        },

        resetViews: function(cells, opt) {
            opt || (opt = {});
            cells || (cells = []);
            this._resetUpdates();
            // clearing views removes any event listeners
            this.removeViews();
            this.freeze({ key: 'reset' });
            for (var i = 0, n = cells.length; i < n; i++) {
                this.renderView(cells[i], opt);
            }
            this.unfreeze({ key: 'reset' });
            this.sortViews();
        },

        removeViews: function() {

            invoke(this._views, 'remove');

            this._views = {};
        },

        sortViews: function() {

            if (!this.isExactSorting()) {
                // noop
                return;
            }
            if (this.isFrozen()) {
                // sort views once unfrozen
                this._updates.sort = true;
                return;
            }
            this.sortViewsExact();
        },

        sortViewsExact: function() {

            // Run insertion sort algorithm in order to efficiently sort DOM elements according to their
            // associated model `z` attribute.

            var $cells = $(this.cells).children('[model-id]');
            var cells = this.model.get('cells');

            sortElements($cells, function(a, b) {
                var cellA = cells.get(a.getAttribute('model-id'));
                var cellB = cells.get(b.getAttribute('model-id'));
                var zA = cellA.attributes.z || 0;
                var zB = cellB.attributes.z || 0;
                return (zA === zB) ? 0 : (zA < zB) ? -1 : 1;
            });
        },


        insertView: function(view) {
            var layer = this.cells;
            switch (this.options.sorting) {
                case sortingTypes.APPROX:
                    var z = view.model.get('z');
                    var pivot = this.addZPivot(z);
                    layer.insertBefore(view.el, pivot);
                    break;
                case sortingTypes.EXACT:
                default:
                    layer.appendChild(view.el);
                    break;
            }
        },

        addZPivot: function(z) {
            z = +z;
            z || (z = 0);
            var pivots = this._zPivots;
            var pivot = pivots[z];
            if (pivot) { return pivot; }
            pivot = pivots[z] = document.createComment('z-index:' + (z + 1));
            var neighborZ = -Infinity;
            for (var currentZ in pivots) {
                currentZ = +currentZ;
                if (currentZ < z && currentZ > neighborZ) {
                    neighborZ = currentZ;
                    if (neighborZ === z - 1) { continue; }
                }
            }
            var layer = this.cells;
            if (neighborZ !== -Infinity) {
                var neighborPivot = pivots[neighborZ];
                // Insert After
                layer.insertBefore(pivot, neighborPivot.nextSibling);
            } else {
                // First Child
                layer.insertBefore(pivot, layer.firstChild);
            }
            return pivot;
        },

        removeZPivots: function() {
            var ref = this;
            var pivots = ref._zPivots;
            var viewport = ref.viewport;
            for (var z in pivots) { viewport.removeChild(pivots[z]); }
            this._zPivots = {};
        },

        scale: function(sx, sy, ox, oy) {

            // getter
            if (sx === undefined) {
                return V.matrixToScale(this.matrix());
            }

            // setter
            if (sy === undefined) {
                sy = sx;
            }
            if (ox === undefined) {
                ox = 0;
                oy = 0;
            }

            var translate = this.translate();

            if (ox || oy || translate.tx || translate.ty) {
                var newTx = translate.tx - ox * (sx - 1);
                var newTy = translate.ty - oy * (sy - 1);
                this.translate(newTx, newTy);
            }

            sx = Math.max(sx || 0, this.MIN_SCALE);
            sy = Math.max(sy || 0, this.MIN_SCALE);

            var ctm = this.matrix();
            ctm.a = sx;
            ctm.d = sy;

            this.matrix(ctm);

            this.trigger('scale', sx, sy, ox, oy);

            return this;
        },

        // Experimental - do not use in production.
        rotate: function(angle, cx, cy) {

            // getter
            if (angle === undefined) {
                return V.matrixToRotate(this.matrix());
            }

            // setter

            // If the origin is not set explicitely, rotate around the center. Note that
            // we must use the plain bounding box (`this.el.getBBox()` instead of the one that gives us
            // the real bounding box (`bbox()`) including transformations).
            if (cx === undefined) {
                var bbox$$1 = this.cells.getBBox();
                cx = bbox$$1.width / 2;
                cy = bbox$$1.height / 2;
            }

            var ctm = this.matrix().translate(cx, cy).rotate(angle).translate(-cx, -cy);
            this.matrix(ctm);

            return this;
        },

        translate: function(tx, ty) {

            // getter
            if (tx === undefined) {
                return V.matrixToTranslate(this.matrix());
            }

            // setter

            var ctm = this.matrix();
            ctm.e = tx || 0;
            ctm.f = ty || 0;

            this.matrix(ctm);

            var newTranslate = this.translate();
            var origin = this.options.origin;
            origin.x = newTranslate.tx;
            origin.y = newTranslate.ty;

            this.trigger('translate', newTranslate.tx, newTranslate.ty);

            if (this.options.drawGrid) {
                this.drawGrid();
            }

            return this;
        },

        // Find the first view climbing up the DOM tree starting at element `el`. Note that `el` can also
        // be a selector or a jQuery object.
        findView: function($el) {

            var el = isString($el)
                ? this.cells.querySelector($el)
                : $el instanceof $ ? $el[0] : $el;

            var id = this.findAttribute('model-id', el);
            if (id) { return this._views[id]; }

            return undefined;
        },

        // Find a view for a model `cell`. `cell` can also be a string or number representing a model `id`.
        findViewByModel: function(cell) {

            var id = (isString(cell) || isNumber(cell)) ? cell : (cell && cell.id);

            return this._views[id];
        },

        // Find all views at given point
        findViewsFromPoint: function(p) {

            p = new g$1.Point(p);

            var views$$1 = this.model.getElements().map(this.findViewByModel, this);

            return views$$1.filter(function(view) {
                return view && view.vel.getBBox({ target: this.cells }).containsPoint(p);
            }, this);
        },

        // Find all views in given area
        findViewsInArea: function(rect, opt) {

            opt = defaults(opt || {}, { strict: false });
            rect = new g$1.Rect(rect);

            var views$$1 = this.model.getElements().map(this.findViewByModel, this);
            var method = opt.strict ? 'containsRect' : 'intersect';

            return views$$1.filter(function(view) {
                return view && rect[method](view.vel.getBBox({ target: this.cells }));
            }, this);
        },

        removeTools: function() {
            this.dispatchToolsEvent('remove');
            return this;
        },

        hideTools: function() {
            this.dispatchToolsEvent('hide');
            return this;
        },

        showTools: function() {
            this.dispatchToolsEvent('show');
            return this;
        },

        dispatchToolsEvent: function(event) {
            var ref;

            var args = [], len = arguments.length - 1;
            while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
            if (typeof event !== 'string') { return; }
            (ref = this).trigger.apply(ref, [ 'tools:event', event ].concat( args ));
        },


        getModelById: function(id) {

            return this.model.getCell(id);
        },

        snapToGrid: function(x, y) {

            // Convert global coordinates to the local ones of the `viewport`. Otherwise,
            // improper transformation would be applied when the viewport gets transformed (scaled/rotated).
            return this.clientToLocalPoint(x, y).snapToGrid(this.options.gridSize);
        },

        localToPaperPoint: function(x, y) {
            // allow `x` to be a point and `y` undefined
            var localPoint = new g$1.Point(x, y);
            var paperPoint = V.transformPoint(localPoint, this.matrix());
            return paperPoint;
        },

        localToPaperRect: function(x, y, width, height) {
            // allow `x` to be a rectangle and rest arguments undefined
            var localRect = new g$1.Rect(x, y, width, height);
            var paperRect = V.transformRect(localRect, this.matrix());
            return paperRect;
        },

        paperToLocalPoint: function(x, y) {
            // allow `x` to be a point and `y` undefined
            var paperPoint = new g$1.Point(x, y);
            var localPoint = V.transformPoint(paperPoint, this.matrix().inverse());
            return localPoint;
        },

        paperToLocalRect: function(x, y, width, height) {
            // allow `x` to be a rectangle and rest arguments undefined
            var paperRect = new g$1.Rect(x, y, width, height);
            var localRect = V.transformRect(paperRect, this.matrix().inverse());
            return localRect;
        },

        localToClientPoint: function(x, y) {
            // allow `x` to be a point and `y` undefined
            var localPoint = new g$1.Point(x, y);
            var clientPoint = V.transformPoint(localPoint, this.clientMatrix());
            return clientPoint;
        },

        localToClientRect: function(x, y, width, height) {
            // allow `x` to be a point and `y` undefined
            var localRect = new g$1.Rect(x, y, width, height);
            var clientRect = V.transformRect(localRect, this.clientMatrix());
            return clientRect;
        },

        // Transform client coordinates to the paper local coordinates.
        // Useful when you have a mouse event object and you'd like to get coordinates
        // inside the paper that correspond to `evt.clientX` and `evt.clientY` point.
        // Example: var localPoint = paper.clientToLocalPoint({ x: evt.clientX, y: evt.clientY });
        clientToLocalPoint: function(x, y) {
            // allow `x` to be a point and `y` undefined
            var clientPoint = new g$1.Point(x, y);
            var localPoint = V.transformPoint(clientPoint, this.clientMatrix().inverse());
            return localPoint;
        },

        clientToLocalRect: function(x, y, width, height) {
            // allow `x` to be a point and `y` undefined
            var clientRect = new g$1.Rect(x, y, width, height);
            var localRect = V.transformRect(clientRect, this.clientMatrix().inverse());
            return localRect;
        },

        localToPagePoint: function(x, y) {

            return this.localToPaperPoint(x, y).offset(this.pageOffset());
        },

        localToPageRect: function(x, y, width, height) {

            return this.localToPaperRect(x, y, width, height).offset(this.pageOffset());
        },

        pageToLocalPoint: function(x, y) {

            var pagePoint = new g$1.Point(x, y);
            var paperPoint = pagePoint.difference(this.pageOffset());
            return this.paperToLocalPoint(paperPoint);
        },

        pageToLocalRect: function(x, y, width, height) {

            var pageOffset = this.pageOffset();
            var paperRect = new g$1.Rect(x, y, width, height);
            paperRect.x -= pageOffset.x;
            paperRect.y -= pageOffset.y;
            return this.paperToLocalRect(paperRect);
        },

        clientOffset: function() {

            var clientRect = this.svg.getBoundingClientRect();
            return new g$1.Point(clientRect.left, clientRect.top);
        },

        pageOffset: function() {

            return this.clientOffset().offset(window.scrollX, window.scrollY);
        },

        linkAllowed: function(linkView) {

            if (!(linkView instanceof LinkView)) {
                throw new Error('Must provide a linkView.');
            }

            var link = linkView.model;
            var paperOptions = this.options;
            var graph = this.model;
            var ns = graph.constructor.validations;

            if (!paperOptions.multiLinks) {
                if (!ns.multiLinks.call(this, graph, link)) { return false; }
            }

            if (!paperOptions.linkPinning) {
                // Link pinning is not allowed and the link is not connected to the target.
                if (!ns.linkPinning.call(this, graph, link)) { return false; }
            }

            if (typeof paperOptions.allowLink === 'function') {
                if (!paperOptions.allowLink.call(this, linkView, this)) { return false; }
            }

            return true;
        },

        getDefaultLink: function(cellView, magnet) {

            return isFunction(this.options.defaultLink)
            // default link is a function producing link model
                ? this.options.defaultLink.call(this, cellView, magnet)
            // default link is the Backbone model
                : this.options.defaultLink.clone();
        },

        // Cell highlighting.
        // ------------------

        resolveHighlighter: function(opt) {

            opt = opt || {};
            var highlighterDef = opt.highlighter;
            var paperOpt = this.options;

            /*
                    Expecting opt.highlighter to have the following structure:
                    {
                        name: 'highlighter-name',
                        options: {
                            some: 'value'
                        }
                    }
                */
            if (highlighterDef === undefined) {

                // check for built-in types
                var type = ['embedding', 'connecting', 'magnetAvailability', 'elementAvailability'].find(function(type) {
                    return !!opt[type];
                });

                highlighterDef = (type && paperOpt.highlighting[type]) || paperOpt.highlighting['default'];
            }

            // Do nothing if opt.highlighter is falsey.
            // This allows the case to not highlight cell(s) in certain cases.
            // For example, if you want to NOT highlight when embedding elements.
            if (!highlighterDef) { return false; }

            // Allow specifying a highlighter by name.
            if (isString(highlighterDef)) {
                highlighterDef = {
                    name: highlighterDef
                };
            }

            var name = highlighterDef.name;
            var highlighter = paperOpt.highlighterNamespace[name];

            // Highlighter validation
            if (!highlighter) {
                throw new Error('Unknown highlighter ("' + name + '")');
            }
            if (typeof highlighter.highlight !== 'function') {
                throw new Error('Highlighter ("' + name + '") is missing required highlight() method');
            }
            if (typeof highlighter.unhighlight !== 'function') {
                throw new Error('Highlighter ("' + name + '") is missing required unhighlight() method');
            }

            return {
                highlighter: highlighter,
                options: highlighterDef.options || {},
                name: name
            };
        },

        onCellHighlight: function(cellView, magnetEl, opt) {

            opt = this.resolveHighlighter(opt);
            if (!opt) { return; }
            if (!magnetEl.id) {
                magnetEl.id = V.uniqueId();
            }

            var key = opt.name + magnetEl.id + JSON.stringify(opt.options);
            if (!this._highlights[key]) {

                var highlighter = opt.highlighter;
                highlighter.highlight(cellView, magnetEl, assign({}, opt.options));

                this._highlights[key] = {
                    cellView: cellView,
                    magnetEl: magnetEl,
                    opt: opt.options,
                    highlighter: highlighter
                };
            }
        },

        onCellUnhighlight: function(cellView, magnetEl, opt) {

            opt = this.resolveHighlighter(opt);
            if (!opt) { return; }

            var key = opt.name + magnetEl.id + JSON.stringify(opt.options);
            var highlight = this._highlights[key];
            if (highlight) {

                // Use the cellView and magnetEl that were used by the highlighter.highlight() method.
                highlight.highlighter.unhighlight(highlight.cellView, highlight.magnetEl, highlight.opt);

                this._highlights[key] = null;
            }
        },

        // Interaction.
        // ------------

        pointerdblclick: function(evt) {

            evt.preventDefault();

            // magnetpointerdblclick can stop propagation

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) { return; }

            var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

            if (view) {
                view.pointerdblclick(evt, localPoint.x, localPoint.y);

            } else {
                this.trigger('blank:pointerdblclick', evt, localPoint.x, localPoint.y);
            }
        },

        pointerclick: function(evt) {

            // magnetpointerclick can stop propagation

            var data = this.eventData(evt);
            // Trigger event only if mouse has not moved.
            if (data.mousemoved <= this.options.clickThreshold) {

                evt = normalizeEvent(evt);

                var view = this.findView(evt.target);
                if (this.guard(evt, view)) { return; }

                var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

                if (view) {
                    view.pointerclick(evt, localPoint.x, localPoint.y);

                } else {
                    this.trigger('blank:pointerclick', evt, localPoint.x, localPoint.y);
                }
            }
        },

        contextmenu: function(evt) {

            if (this.options.preventContextMenu) { evt.preventDefault(); }

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) { return; }

            var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

            if (view) {
                view.contextmenu(evt, localPoint.x, localPoint.y);

            } else {
                this.trigger('blank:contextmenu', evt, localPoint.x, localPoint.y);
            }
        },

        pointerdown: function(evt) {

            // onmagnet stops propagation when `addLinkFromMagnet` is allowed
            // onevent can stop propagation

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) { return; }

            var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

            if (view) {

                evt.preventDefault();
                view.pointerdown(evt, localPoint.x, localPoint.y);

            } else {

                if (this.options.preventDefaultBlankAction) { evt.preventDefault(); }

                this.trigger('blank:pointerdown', evt, localPoint.x, localPoint.y);
            }

            this.delegateDragEvents(view, evt.data);
        },

        pointermove: function(evt) {

            // mouse moved counter
            var data = this.eventData(evt);
            data.mousemoved || (data.mousemoved = 0);
            var mousemoved = ++data.mousemoved;

            if (mousemoved <= this.options.moveThreshold) { return; }

            evt = normalizeEvent(evt);

            var localPoint = this.snapToGrid(evt.clientX, evt.clientY);

            var view = data.sourceView;
            if (view) {
                view.pointermove(evt, localPoint.x, localPoint.y);
            } else {
                this.trigger('blank:pointermove', evt, localPoint.x, localPoint.y);
            }

            this.eventData(evt, data);
        },

        pointerup: function(evt) {

            this.undelegateDocumentEvents();

            var normalizedEvt = normalizeEvent(evt);

            var localPoint = this.snapToGrid(normalizedEvt.clientX, normalizedEvt.clientY);

            var view = this.eventData(evt).sourceView;
            if (view) {
                view.pointerup(normalizedEvt, localPoint.x, localPoint.y);
            } else {
                this.trigger('blank:pointerup', normalizedEvt, localPoint.x, localPoint.y);
            }

            if (!normalizedEvt.isPropagationStopped()) {
                this.pointerclick($.Event(evt, { type: 'click', data: evt.data }));
            }

            evt.stopImmediatePropagation();
            this.delegateEvents();
        },

        mouseover: function(evt) {

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) { return; }

            if (view) {
                view.mouseover(evt);

            } else {
                if (this.el === evt.target) { return; } // prevent border of paper from triggering this
                this.trigger('blank:mouseover', evt);
            }
        },

        mouseout: function(evt) {

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) { return; }

            if (view) {
                view.mouseout(evt);

            } else {
                if (this.el === evt.target) { return; } // prevent border of paper from triggering this
                this.trigger('blank:mouseout', evt);
            }
        },

        mouseenter: function(evt) {

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) { return; }
            var relatedView = this.findView(evt.relatedTarget);
            if (view) {
                // mouse moved from tool over view?
                if (relatedView === view) { return; }
                view.mouseenter(evt);
            } else {
                if (relatedView) { return; }
                // `paper` (more descriptive), not `blank`
                this.trigger('paper:mouseenter', evt);
            }
        },

        mouseleave: function(evt) {

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) { return; }
            var relatedView = this.findView(evt.relatedTarget);
            if (view) {
                // mouse moved from view over tool?
                if (relatedView === view) { return; }
                view.mouseleave(evt);
            } else {
                if (relatedView) { return; }
                // `paper` (more descriptive), not `blank`
                this.trigger('paper:mouseleave', evt);
            }
        },

        mousewheel: function(evt) {

            evt = normalizeEvent(evt);

            var view = this.findView(evt.target);
            if (this.guard(evt, view)) { return; }

            var originalEvent = evt.originalEvent;
            var localPoint = this.snapToGrid(originalEvent.clientX, originalEvent.clientY);
            var delta = Math.max(-1, Math.min(1, (originalEvent.wheelDelta || -originalEvent.detail)));

            if (view) {
                view.mousewheel(evt, localPoint.x, localPoint.y, delta);

            } else {
                this.trigger('blank:mousewheel', evt, localPoint.x, localPoint.y, delta);
            }
        },

        onevent: function(evt) {

            var eventNode = evt.currentTarget;
            var eventName = eventNode.getAttribute('event');
            if (eventName) {
                var view = this.findView(eventNode);
                if (view) {

                    evt = normalizeEvent(evt);
                    if (this.guard(evt, view)) { return; }

                    var localPoint = this.snapToGrid(evt.clientX, evt.clientY);
                    view.onevent(evt, eventName, localPoint.x, localPoint.y);
                }
            }
        },

        magnetEvent: function(evt, handler) {

            var magnetNode = evt.currentTarget;
            var magnetValue = magnetNode.getAttribute('magnet');
            if (magnetValue) {
                var view = this.findView(magnetNode);
                if (view) {
                    evt = normalizeEvent(evt);
                    if (this.guard(evt, view)) { return; }
                    var localPoint = this.snapToGrid(evt.clientX, evt.clientY);
                    handler.call(this, view, evt, magnetNode, localPoint.x, localPoint.y);
                }
            }
        },

        onmagnet: function(evt) {

            this.magnetEvent(evt, function(view, evt, _$$1, x, y) {
                view.onmagnet(evt, x, y);
            });
        },


        magnetpointerdblclick: function(evt) {

            this.magnetEvent(evt, function(view, evt, magnet, x, y) {
                view.magnetpointerdblclick(evt, magnet, x, y);
            });
        },

        magnetcontextmenu: function(evt) {

            if (this.options.preventContextMenu) { evt.preventDefault(); }
            this.magnetEvent(evt, function(view, evt, magnet, x, y) {
                view.magnetcontextmenu(evt, magnet, x, y);
            });
        },

        onlabel: function(evt) {

            var labelNode = evt.currentTarget;
            var view = this.findView(labelNode);
            if (view) {

                evt = normalizeEvent(evt);
                if (this.guard(evt, view)) { return; }

                var localPoint = this.snapToGrid(evt.clientX, evt.clientY);
                view.onlabel(evt, localPoint.x, localPoint.y);
            }
        },

        getPointerArgs: function getPointerArgs(evt) {
            var normalizedEvt = normalizeEvent(evt);
            var ref = this.snapToGrid(normalizedEvt.clientX, normalizedEvt.clientY);
            var x = ref.x;
            var y = ref.y;
            return [normalizedEvt, x, y];
        },

        delegateDragEvents: function(view, data) {

            data || (data = {});
            this.eventData({ data: data }, { sourceView: view || null, mousemoved: 0 });
            this.delegateDocumentEvents(null, data);
            this.undelegateEvents();
        },

        // Guard the specified event. If the event is not interesting, guard returns `true`.
        // Otherwise, it returns `false`.
        guard: function(evt, view) {

            if (evt.type === 'mousedown' && evt.button === 2) {
                // handled as `contextmenu` type
                return true;
            }

            if (this.options.guard && this.options.guard(evt, view)) {
                return true;
            }

            if (evt.data && evt.data.guarded !== undefined) {
                return evt.data.guarded;
            }

            if (view && view.model && (view.model instanceof Cell)) {
                return false;
            }

            if (this.svg === evt.target || this.el === evt.target || $.contains(this.svg, evt.target)) {
                return false;
            }

            return true;    // Event guarded. Paper should not react on it in any way.
        },

        setGridSize: function(gridSize) {

            this.options.gridSize = gridSize;

            if (this.options.drawGrid) {
                this.drawGrid();
            }

            return this;
        },

        clearGrid: function() {

            if (this.$grid) {
                this.$grid.css('backgroundImage', 'none');
            }
            return this;
        },

        _getGriRefs: function() {

            if (!this._gridCache) {

                this._gridCache = {
                    root: V('svg', { width: '100%', height: '100%' }, V('defs')),
                    patterns: {},
                    add: function(id, vel) {
                        V(this.root.node.childNodes[0]).append(vel);
                        this.patterns[id] = vel;
                        this.root.append(V('rect', { width: '100%', height: '100%', fill: 'url(#' + id + ')' }));
                    },
                    get: function(id) {
                        return this.patterns[id];
                    },
                    exist: function(id) {
                        return this.patterns[id] !== undefined;
                    }
                };
            }

            return this._gridCache;
        },

        setGrid: function(drawGrid) {

            this.clearGrid();

            this._gridCache = null;
            this._gridSettings = [];

            var optionsList = Array.isArray(drawGrid) ? drawGrid : [drawGrid || {}];
            optionsList.forEach(function(item) {
                this._gridSettings.push.apply(this._gridSettings, this._resolveDrawGridOption(item));
            }, this);
            return this;
        },

        _resolveDrawGridOption: function(opt) {

            var namespace = this.constructor.gridPatterns;
            if (isString(opt) && Array.isArray(namespace[opt])) {
                return namespace[opt].map(function(item) {
                    return assign({}, item);
                });
            }

            var options = opt || { args: [{}] };
            var isArray = Array.isArray(options);
            var name = options.name;

            if (!isArray && !name && !options.markup) {
                name = 'dot';
            }

            if (name && Array.isArray(namespace[name])) {
                var pattern = namespace[name].map(function(item) {
                    return assign({}, item);
                });

                var args = Array.isArray(options.args) ? options.args : [options.args || {}];

                defaults(args[0], omit(opt, 'args'));
                for (var i = 0; i < args.length; i++) {
                    if (pattern[i]) {
                        assign(pattern[i], args[i]);
                    }
                }
                return pattern;
            }

            return isArray ? options : [options];
        },

        drawGrid: function(opt) {

            var gridSize = this.options.gridSize;
            if (gridSize <= 1) {
                return this.clearGrid();
            }

            var localOptions = Array.isArray(opt) ? opt : [opt];

            var ctm = this.matrix();
            var refs = this._getGriRefs();

            this._gridSettings.forEach(function(gridLayerSetting, index) {

                var id = 'pattern_' + index;
                var options = merge(gridLayerSetting, localOptions[index], {
                    sx: ctm.a || 1,
                    sy: ctm.d || 1,
                    ox: ctm.e || 0,
                    oy: ctm.f || 0
                });

                options.width = gridSize * (ctm.a || 1) * (options.scaleFactor || 1);
                options.height = gridSize * (ctm.d || 1) * (options.scaleFactor || 1);

                if (!refs.exist(id)) {
                    refs.add(id, V('pattern', { id: id, patternUnits: 'userSpaceOnUse' }, V(options.markup)));
                }

                var patternDefVel = refs.get(id);

                if (isFunction(options.update)) {
                    options.update(patternDefVel.node.childNodes[0], options);
                }

                var x = options.ox % options.width;
                if (x < 0) { x += options.width; }

                var y = options.oy % options.height;
                if (y < 0) { y += options.height; }

                patternDefVel.attr({
                    x: x,
                    y: y,
                    width: options.width,
                    height: options.height
                });
            });

            var patternUri = new XMLSerializer().serializeToString(refs.root.node);
            patternUri = 'url(data:image/svg+xml;base64,' + btoa(patternUri) + ')';

            this.$grid.css('backgroundImage', patternUri);

            return this;
        },

        updateBackgroundImage: function(opt) {

            opt = opt || {};

            var backgroundPosition = opt.position || 'center';
            var backgroundSize = opt.size || 'auto auto';

            var currentScale = this.scale();
            var currentTranslate = this.translate();

            // backgroundPosition
            if (isObject(backgroundPosition)) {
                var x = currentTranslate.tx + (currentScale.sx * (backgroundPosition.x || 0));
                var y = currentTranslate.ty + (currentScale.sy * (backgroundPosition.y || 0));
                backgroundPosition = x + 'px ' + y + 'px';
            }

            // backgroundSize
            if (isObject(backgroundSize)) {
                backgroundSize = new g$1.Rect(backgroundSize).scale(currentScale.sx, currentScale.sy);
                backgroundSize = backgroundSize.width + 'px ' + backgroundSize.height + 'px';
            }

            this.$background.css({
                backgroundSize: backgroundSize,
                backgroundPosition: backgroundPosition
            });
        },

        drawBackgroundImage: function(img, opt) {

            // Clear the background image if no image provided
            if (!(img instanceof HTMLImageElement)) {
                this.$background.css('backgroundImage', '');
                return;
            }

            opt = opt || {};

            var backgroundImage;
            var backgroundSize = opt.size;
            var backgroundRepeat = opt.repeat || 'no-repeat';
            var backgroundOpacity = opt.opacity || 1;
            var backgroundQuality = Math.abs(opt.quality) || 1;
            var backgroundPattern = this.constructor.backgroundPatterns[camelCase(backgroundRepeat)];

            if (isFunction(backgroundPattern)) {
                // 'flip-x', 'flip-y', 'flip-xy', 'watermark' and custom
                img.width *= backgroundQuality;
                img.height *= backgroundQuality;
                var canvas = backgroundPattern(img, opt);
                if (!(canvas instanceof HTMLCanvasElement)) {
                    throw new Error('dia.Paper: background pattern must return an HTML Canvas instance');
                }

                backgroundImage = canvas.toDataURL('image/png');
                backgroundRepeat = 'repeat';
                if (isObject(backgroundSize)) {
                    // recalculate the tile size if an object passed in
                    backgroundSize.width *= canvas.width / img.width;
                    backgroundSize.height *= canvas.height / img.height;
                } else if (backgroundSize === undefined) {
                    // calcule the tile size if no provided
                    opt.size = {
                        width: canvas.width / backgroundQuality,
                        height: canvas.height / backgroundQuality
                    };
                }
            } else {
                // backgroundRepeat:
                // no-repeat', 'round', 'space', 'repeat', 'repeat-x', 'repeat-y'
                backgroundImage = img.src;
                if (backgroundSize === undefined) {
                    // pass the image size for  the backgroundSize if no size provided
                    opt.size = {
                        width: img.width,
                        height: img.height
                    };
                }
            }

            this.$background.css({
                opacity: backgroundOpacity,
                backgroundRepeat: backgroundRepeat,
                backgroundImage: 'url(' + backgroundImage + ')'
            });

            this.updateBackgroundImage(opt);
        },

        updateBackgroundColor: function(color) {

            this.$el.css('backgroundColor', color || '');
        },

        drawBackground: function(opt) {

            opt = opt || {};

            this.updateBackgroundColor(opt.color);

            if (opt.image) {
                opt = this._background = cloneDeep(opt);
                var img = document.createElement('img');
                img.onload = this.drawBackgroundImage.bind(this, img, opt);
                img.src = opt.image;
            } else {
                this.drawBackgroundImage(null);
                this._background = null;
            }

            return this;
        },

        setInteractivity: function(value) {

            this.options.interactive = value;

            invoke(this._views, 'setInteractivity', value);
        },

        // Paper definitions.
        // ------------------

        isDefined: function(defId) {

            return !!this.svg.getElementById(defId);
        },

        defineFilter: function(filter$$1) {

            if (!isObject(filter$$1)) {
                throw new TypeError('dia.Paper: defineFilter() requires 1. argument to be an object.');
            }

            var filterId = filter$$1.id;
            var name = filter$$1.name;
            // Generate a hash code from the stringified filter definition. This gives us
            // a unique filter ID for different definitions.
            if (!filterId) {
                filterId = name + this.svg.id + hashCode(JSON.stringify(filter$$1));
            }
            // If the filter already exists in the document,
            // we're done and we can just use it (reference it using `url()`).
            // If not, create one.
            if (!this.isDefined(filterId)) {

                var namespace = filter;
                var filterSVGString = namespace[name] && namespace[name](filter$$1.args || {});
                if (!filterSVGString) {
                    throw new Error('Non-existing filter ' + name);
                }

                // Set the filter area to be 3x the bounding box of the cell
                // and center the filter around the cell.
                var filterAttrs = assign({
                    filterUnits: 'objectBoundingBox',
                    x: -1,
                    y: -1,
                    width: 3,
                    height: 3
                }, filter$$1.attrs, {
                    id: filterId
                });

                V(filterSVGString, filterAttrs).appendTo(this.defs);
            }

            return filterId;
        },

        defineGradient: function(gradient) {

            if (!isObject(gradient)) {
                throw new TypeError('dia.Paper: defineGradient() requires 1. argument to be an object.');
            }

            var gradientId = gradient.id;
            var type = gradient.type;
            var stops = gradient.stops;
            // Generate a hash code from the stringified filter definition. This gives us
            // a unique filter ID for different definitions.
            if (!gradientId) {
                gradientId = type + this.svg.id + hashCode(JSON.stringify(gradient));
            }
            // If the gradient already exists in the document,
            // we're done and we can just use it (reference it using `url()`).
            // If not, create one.
            if (!this.isDefined(gradientId)) {

                var stopTemplate = template('<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>');
                var gradientStopsStrings = toArray(stops).map(function(stop) {
                    return stopTemplate({
                        offset: stop.offset,
                        color: stop.color,
                        opacity: Number.isFinite(stop.opacity) ? stop.opacity : 1
                    });
                });

                var gradientSVGString = [
                    '<' + type + '>',
                    gradientStopsStrings.join(''),
                    '</' + type + '>'
                ].join('');

                var gradientAttrs = assign({ id: gradientId }, gradient.attrs);

                V(gradientSVGString, gradientAttrs).appendTo(this.defs);
            }

            return gradientId;
        },

        defineMarker: function(marker) {

            if (!isObject(marker)) {
                throw new TypeError('dia.Paper: defineMarker() requires 1. argument to be an object.');
            }

            var markerId = marker.id;

            // Generate a hash code from the stringified filter definition. This gives us
            // a unique filter ID for different definitions.
            if (!markerId) {
                markerId = this.svg.id + hashCode(JSON.stringify(marker));
            }

            if (!this.isDefined(markerId)) {

                var attrs = omit(marker, 'type', 'userSpaceOnUse');
                var pathMarker = V('marker', {
                    id: markerId,
                    orient: 'auto',
                    overflow: 'visible',
                    markerUnits: marker.markerUnits || 'userSpaceOnUse'
                }, [
                    V(marker.type || 'path', attrs)
                ]);

                pathMarker.appendTo(this.defs);
            }

            return markerId;
        }

    }, {

        sorting: sortingTypes,

        backgroundPatterns: {

            flipXy: function(img) {
                // d b
                // q p

                var canvas = document.createElement('canvas');
                var imgWidth = img.width;
                var imgHeight = img.height;

                canvas.width = 2 * imgWidth;
                canvas.height = 2 * imgHeight;

                var ctx = canvas.getContext('2d');
                // top-left image
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                // xy-flipped bottom-right image
                ctx.setTransform(-1, 0, 0, -1, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                // x-flipped top-right image
                ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                // y-flipped bottom-left image
                ctx.setTransform(1, 0, 0, -1, 0, canvas.height);
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

                return canvas;
            },

            flipX: function(img) {
                // d b
                // d b

                var canvas = document.createElement('canvas');
                var imgWidth = img.width;
                var imgHeight = img.height;

                canvas.width = imgWidth * 2;
                canvas.height = imgHeight;

                var ctx = canvas.getContext('2d');
                // left image
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                // flipped right image
                ctx.translate(2 * imgWidth, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

                return canvas;
            },

            flipY: function(img) {
                // d d
                // q q

                var canvas = document.createElement('canvas');
                var imgWidth = img.width;
                var imgHeight = img.height;

                canvas.width = imgWidth;
                canvas.height = imgHeight * 2;

                var ctx = canvas.getContext('2d');
                // top image
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                // flipped bottom image
                ctx.translate(0, 2 * imgHeight);
                ctx.scale(1, -1);
                ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

                return canvas;
            },

            watermark: function(img, opt) {
                //   d
                // d

                opt = opt || {};

                var imgWidth = img.width;
                var imgHeight = img.height;

                var canvas = document.createElement('canvas');
                canvas.width = imgWidth * 3;
                canvas.height = imgHeight * 3;

                var ctx = canvas.getContext('2d');
                var angle = isNumber(opt.watermarkAngle) ? -opt.watermarkAngle : -20;
                var radians = g$1.toRad(angle);
                var stepX = canvas.width / 4;
                var stepY = canvas.height / 4;

                for (var i = 0; i < 4; i++) {
                    for (var j = 0; j < 4; j++) {
                        if ((i + j) % 2 > 0) {
                            // reset the current transformations
                            ctx.setTransform(1, 0, 0, 1, (2 * i - 1) * stepX, (2 * j - 1) * stepY);
                            ctx.rotate(radians);
                            ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                        }
                    }
                }

                return canvas;
            }
        },

        gridPatterns: {
            dot: [{
                color: '#AAAAAA',
                thickness: 1,
                markup: 'rect',
                update: function(el, opt) {
                    V(el).attr({
                        width: opt.thickness * opt.sx,
                        height: opt.thickness * opt.sy,
                        fill: opt.color
                    });
                }
            }],
            fixedDot: [{
                color: '#AAAAAA',
                thickness: 1,
                markup: 'rect',
                update: function(el, opt) {
                    var size = opt.sx <= 1 ? opt.thickness * opt.sx : opt.thickness;
                    V(el).attr({ width: size, height: size, fill: opt.color });
                }
            }],
            mesh: [{
                color: '#AAAAAA',
                thickness: 1,
                markup: 'path',
                update: function(el, opt) {

                    var d;
                    var width = opt.width;
                    var height = opt.height;
                    var thickness = opt.thickness;

                    if (width - thickness >= 0 && height - thickness >= 0) {
                        d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                    } else {
                        d = 'M 0 0 0 0';
                    }

                    V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
                }
            }],
            doubleMesh: [{
                color: '#AAAAAA',
                thickness: 1,
                markup: 'path',
                update: function(el, opt) {

                    var d;
                    var width = opt.width;
                    var height = opt.height;
                    var thickness = opt.thickness;

                    if (width - thickness >= 0 && height - thickness >= 0) {
                        d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                    } else {
                        d = 'M 0 0 0 0';
                    }

                    V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
                }
            }, {
                color: '#000000',
                thickness: 3,
                scaleFactor: 4,
                markup: 'path',
                update: function(el, opt) {

                    var d;
                    var width = opt.width;
                    var height = opt.height;
                    var thickness = opt.thickness;

                    if (width - thickness >= 0 && height - thickness >= 0) {
                        d = ['M', width, 0, 'H0 M0 0 V0', height].join(' ');
                    } else {
                        d = 'M 0 0 0 0';
                    }

                    V(el).attr({ 'd': d, stroke: opt.color, 'stroke-width': opt.thickness });
                }
            }]
        }
    });

    var ToolView = View.extend({
        name: null,
        tagName: 'g',
        className: 'tool',
        svgElement: true,
        _visible: true,

        init: function() {
            var name = this.name;
            if (name) { this.vel.attr('data-tool-name', name); }
        },

        configure: function(view, toolsView) {
            this.relatedView = view;
            this.paper = view.paper;
            this.parentView = toolsView;
            this.simulateRelatedView(this.el);
            return this;
        },

        simulateRelatedView: function(el) {
            if (el) { el.setAttribute('model-id', this.relatedView.model.id); }
        },

        getName: function() {
            return this.name;
        },

        show: function() {
            this.el.style.display = '';
            this._visible = true;
        },

        hide: function() {
            this.el.style.display = 'none';
            this._visible = false;
        },

        isVisible: function() {
            return !!this._visible;
        },

        focus: function() {
            var opacity = this.options.focusOpacity;
            if (isFinite(opacity)) { this.el.style.opacity = opacity; }
            this.parentView.focusTool(this);
        },

        blur: function() {
            this.el.style.opacity = '';
            this.parentView.blurTool(this);
        },

        update: function() {
            // to be overridden
        }
    });

    var ToolsView = View.extend({
        tagName: 'g',
        className: 'tools',
        svgElement: true,
        tools: null,
        options: {
            tools: null,
            relatedView: null,
            name: null,
            component: false
        },

        configure: function(options) {
            options = assign(this.options, options);
            var tools = options.tools;
            if (!Array.isArray(tools)) { return this; }
            var relatedView = options.relatedView;
            if (!(relatedView instanceof CellView)) { return this; }
            var views$$1 = this.tools = [];
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                if (!(tool instanceof ToolView)) { continue; }
                tool.configure(relatedView, this);
                tool.render();
                this.vel.append(tool.el);
                views$$1.push(tool);
            }
            return this;
        },

        getName: function() {
            return this.options.name;
        },

        update: function(opt) {

            opt || (opt = {});
            var tools = this.tools;
            if (!tools) { return; }
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                if (opt.tool !== tool.cid && tool.isVisible()) {
                    tool.update();
                }
            }
            return this;
        },

        focusTool: function(focusedTool) {

            var tools = this.tools;
            if (!tools) { return this; }
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                if (focusedTool === tool) {
                    tool.show();
                } else {
                    tool.hide();
                }
            }
            return this;
        },

        blurTool: function(blurredTool) {
            var tools = this.tools;
            if (!tools) { return this; }
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                if (tool !== blurredTool && !tool.isVisible()) {
                    tool.show();
                    tool.update();
                }
            }
            return this;
        },

        hide: function() {
            return this.focusTool(null);
        },

        show: function() {
            return this.blurTool(null);
        },

        onRemove: function() {

            var tools = this.tools;
            if (!tools) { return this; }
            for (var i = 0, n = tools.length; i < n; i++) {
                tools[i].remove();
            }
            this.tools = null;
        },

        mount: function() {
            var options = this.options;
            var relatedView = options.relatedView;
            if (relatedView) {
                var container = (options.component) ? relatedView.el : relatedView.paper.tools;
                container.appendChild(this.el);
            }
            return this;
        }

    });

    var DirectedGraph = {

        exportElement: function(element) {

            // The width and height of the element.
            return element.size();
        },

        exportLink: function(link) {

            var labelSize = link.get('labelSize') || {};
            var edge = {
                // The number of ranks to keep between the source and target of the edge.
                minLen: link.get('minLen') || 1,
                // The weight to assign edges. Higher weight edges are generally
                // made shorter and straighter than lower weight edges.
                weight: link.get('weight') || 1,
                // Where to place the label relative to the edge.
                // l = left, c = center r = right.
                labelpos: link.get('labelPosition') || 'c',
                // How many pixels to move the label away from the edge.
                // Applies only when labelpos is l or r.
                labeloffset: link.get('labelOffset') || 0,
                // The width of the edge label in pixels.
                width: labelSize.width || 0,
                // The height of the edge label in pixels.
                height: labelSize.height || 0
            };

            return edge;
        },

        importElement: function(opt, v, gl) {

            var element = this.getCell(v);
            var glNode = gl.node(v);

            if (opt.setPosition) {
                opt.setPosition(element, glNode);
            } else {
                element.set('position', {
                    x: glNode.x - glNode.width / 2,
                    y: glNode.y - glNode.height / 2
                });
            }
        },

        importLink: function(opt, edgeObj, gl) {

            var link = this.getCell(edgeObj.name);
            var glEdge = gl.edge(edgeObj);
            var points = glEdge.points || [];

            // check the `setLinkVertices` here for backwards compatibility
            if (opt.setVertices || opt.setLinkVertices) {
                if (isFunction(opt.setVertices)) {
                    opt.setVertices(link, points);
                } else {
                    // Remove the first and last point from points array.
                    // Those are source/target element connection points
                    // ie. they lies on the edge of connected elements.
                    link.set('vertices', points.slice(1, points.length - 1));
                }
            }

            if (opt.setLabels && ('x' in glEdge) && ('y' in glEdge)) {
                var labelPosition = { x: glEdge.x, y: glEdge.y };
                if (isFunction(opt.setLabels)) {
                    opt.setLabels(link, labelPosition, points);
                } else {
                    // Convert the absolute label position to a relative position
                    // towards the closest point on the edge
                    var polyline = g$1.Polyline(points);
                    var length = polyline.closestPointLength(labelPosition);
                    var closestPoint = polyline.pointAtLength(length);
                    var distance = length / polyline.length();
                    link.label(0, {
                        position: {
                            distance: distance,
                            offset: g$1.Point(labelPosition).difference(closestPoint).toJSON()
                        }
                    });
                }
            }
        },

        layout: function(graphOrCells, opt) {

            var graph;

            if (graphOrCells instanceof Graph) {
                graph = graphOrCells;
            } else {
                // Reset cells in dry mode so the graph reference is not stored on the cells.
                // `sort: false` to prevent elements to change their order based on the z-index
                graph = (new Graph()).resetCells(graphOrCells, { dry: true, sort: false });
            }

            // This is not needed anymore.
            graphOrCells = null;

            opt = defaults(opt || {}, {
                resizeClusters: true,
                clusterPadding: 10,
                exportElement: this.exportElement,
                exportLink: this.exportLink
            });

            // create a graphlib.Graph that represents the joint.dia.Graph
            // var glGraph = graph.toGraphLib({
            var glGraph = DirectedGraph.toGraphLib(graph, {
                directed: true,
                // We are about to use edge naming feature.
                multigraph: true,
                // We are able to layout graphs with embeds.
                compound: true,
                setNodeLabel: opt.exportElement,
                setEdgeLabel: opt.exportLink,
                setEdgeName: function(link) {
                    // Graphlib edges have no ids. We use edge name property
                    // to store and retrieve ids instead.
                    return link.id;
                }
            });

            var glLabel = {};
            var marginX = opt.marginX || 0;
            var marginY = opt.marginY || 0;

            // Dagre layout accepts options as lower case.
            // Direction for rank nodes. Can be TB, BT, LR, or RL
            if (opt.rankDir) { glLabel.rankdir = opt.rankDir; }
            // Alignment for rank nodes. Can be UL, UR, DL, or DR
            if (opt.align) { glLabel.align = opt.align; }
            // Number of pixels that separate nodes horizontally in the layout.
            if (opt.nodeSep) { glLabel.nodesep = opt.nodeSep; }
            // Number of pixels that separate edges horizontally in the layout.
            if (opt.edgeSep) { glLabel.edgesep = opt.edgeSep; }
            // Number of pixels between each rank in the layout.
            if (opt.rankSep) { glLabel.ranksep = opt.rankSep; }
            // Type of algorithm to assign a rank to each node in the input graph.
            // Possible values: network-simplex, tight-tree or longest-path
            if (opt.ranker) { glLabel.ranker = opt.ranker; }
            // Number of pixels to use as a margin around the left and right of the graph.
            if (marginX) { glLabel.marginx = marginX; }
            // Number of pixels to use as a margin around the top and bottom of the graph.
            if (marginY) { glLabel.marginy = marginY; }

            // Set the option object for the graph label.
            glGraph.setGraph(glLabel);

            // Executes the layout.
            dagre.layout(glGraph, { debugTiming: !!opt.debugTiming });

            // Wrap all graph changes into a batch.
            graph.startBatch('layout');

            DirectedGraph.fromGraphLib(glGraph, {
                importNode: this.importElement.bind(graph, opt),
                importEdge: this.importLink.bind(graph, opt)
            });

            // // Update the graph.
            // graph.fromGraphLib(glGraph, {
            //     importNode: this.importElement.bind(graph, opt),
            //     importEdge: this.importLink.bind(graph, opt)
            // });

            if (opt.resizeClusters) {
                // Resize and reposition cluster elements (parents of other elements)
                // to fit their children.
                // 1. filter clusters only
                // 2. map id on cells
                // 3. sort cells by their depth (the deepest first)
                // 4. resize cell to fit their direct children only.
                var clusters = glGraph.nodes()
                    .filter(function(v) { return glGraph.children(v).length > 0; })
                    .map(graph.getCell.bind(graph))
                    .sort(function(aCluster, bCluster) {
                        return bCluster.getAncestors().length - aCluster.getAncestors().length;
                    });

                invoke(clusters, 'fitEmbeds', { padding: opt.clusterPadding });
            }

            graph.stopBatch('layout');

            // Width and height of the graph extended by margins.
            var glSize = glGraph.graph();
            // Return the bounding box of the graph after the layout.
            return g$1.Rect(
                marginX,
                marginY,
                Math.abs(glSize.width - 2 * marginX),
                Math.abs(glSize.height - 2 * marginY)
            );
        },

        fromGraphLib: function(glGraph, opt) {

            opt = opt || {};

            var importNode = opt.importNode || noop;
            var importEdge = opt.importEdge || noop;
            var graph = (this instanceof Graph) ? this : new Graph;

            // Import all nodes.
            glGraph.nodes().forEach(function(node) {
                importNode.call(graph, node, glGraph, graph, opt);
            });

            // Import all edges.
            glGraph.edges().forEach(function(edge) {
                importEdge.call(graph, edge, glGraph, graph, opt);
            });

            return graph;
        },

        // Create new graphlib graph from existing JointJS graph.
        toGraphLib: function(graph, opt) {

            opt = opt || {};

            var glGraphType = pick(opt, 'directed', 'compound', 'multigraph');
            var glGraph = new dagre.graphlib.Graph(glGraphType);
            var setNodeLabel = opt.setNodeLabel || noop;
            var setEdgeLabel = opt.setEdgeLabel || noop;
            var setEdgeName = opt.setEdgeName || noop;
            var collection = graph.get('cells');

            for (var i = 0, n = collection.length; i < n; i++) {

                var cell = collection.at(i);
                if (cell.isLink()) {

                    var source = cell.get('source');
                    var target = cell.get('target');

                    // Links that end at a point are ignored.
                    if (!source.id || !target.id) { break; }

                    // Note that if we are creating a multigraph we can name the edges. If
                    // we try to name edges on a non-multigraph an exception is thrown.
                    glGraph.setEdge(source.id, target.id, setEdgeLabel(cell), setEdgeName(cell));

                } else {

                    glGraph.setNode(cell.id, setNodeLabel(cell));

                    // For the compound graphs we have to take embeds into account.
                    if (glGraph.isCompound() && cell.has('parent')) {
                        var parentId = cell.get('parent');
                        if (collection.has(parentId)) {
                            // Make sure the parent cell is included in the graph (this can
                            // happen when the layout is run on part of the graph only).
                            glGraph.setParent(cell.id, parentId);
                        }
                    }
                }
            }

            return glGraph;
        }
    };

    Graph.prototype.toGraphLib = function(opt) {

        return DirectedGraph.toGraphLib(this, opt);
    };

    Graph.prototype.fromGraphLib = function(glGraph, opt) {

        return DirectedGraph.fromGraphLib.call(this, glGraph, opt);
    };

    exports.DirectedGraph = DirectedGraph;

}(this.joint.layout.DirectedGraph = this.joint.layout.DirectedGraph || {}, Backbone, _, $, V, g));
