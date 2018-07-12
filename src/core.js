// Global namespace.

var joint = {

    version: '[%= pkg.version %]',

    config: {
        // The class name prefix config is for advanced use only.
        // Be aware that if you change the prefix, the JointJS CSS will no longer function properly.
        classNamePrefix: 'joint-',
        defaultTheme: 'default'
    },

    // `joint.dia` namespace.
    dia: {},

    // `joint.ui` namespace.
    ui: {},

    // `joint.layout` namespace.
    layout: {},

    // `joint.shapes` namespace.
    shapes: {},

    // `joint.format` namespace.
    format: {},

    // `joint.connectors` namespace.
    connectors: {},

    // `joint.highlighters` namespace.
    highlighters: {},

    // `joint.routers` namespace.
    routers: {},

    // `joint.anchors` namespace.
    anchors: {},

    // `joint.connectionPoints` namespace.
    connectionPoints: {},

    // `joint.connectionStrategies` namespace.
    connectionStrategies: {},

    // `joint.linkTools` namespace.
    linkTools: {},

    // `joint.mvc` namespace.
    mvc: {
        views: {}
    },

    setTheme: function(theme, opt) {

        opt = opt || {};

        joint.util.invoke(joint.mvc.views, 'setTheme', theme, opt);

        // Update the default theme on the view prototype.
        joint.mvc.View.prototype.defaultTheme = theme;
    },

    // `joint.env` namespace.
    env: {

        _results: {},

        _tests: {

            svgforeignobject: function() {
                return !!document.createElementNS &&
              /SVGForeignObject/.test(({}).toString.call(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')));
            }
        },

        addTest: function(name, fn) {

            return joint.env._tests[name] = fn;
        },

        test: function(name) {

            var fn = joint.env._tests[name];

            if (!fn) {
                throw new Error('Test not defined ("' + name + '"). Use `joint.env.addTest(name, fn) to add a new test.`');
            }

            var result = joint.env._results[name];

            if (typeof result !== 'undefined') {
                return result;
            }

            try {
                result = fn();
            } catch (error) {
                result = false;
            }

            // Cache the test result.
            joint.env._results[name] = result;

            return result;
        }
    },

    util: {

        // Return a simple hash code from a string. See http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/.
        hashCode: function(str) {

            var hash = 0;
            if (str.length == 0) return hash;
            for (var i = 0; i < str.length; i++) {
                var c = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + c;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        },

        getByPath: function(obj, path, delim) {

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
        },

        setByPath: function(obj, path, value, delim) {

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
        },

        unsetByPath: function(obj, path, delim) {

            delim = delim || '/';

            var pathArray = Array.isArray(path) ? path.slice() : path.split(delim);

            var propertyToRemove = pathArray.pop();
            if (pathArray.length > 0) {

                // unsetting a nested attribute
                var parent = joint.util.getByPath(obj, pathArray, delim);

                if (parent) {
                    delete parent[propertyToRemove];
                }

            } else {

                // unsetting a primitive attribute
                delete obj[propertyToRemove];
            }

            return obj;
        },

        flattenObject: function(obj, delim, stop) {

            delim = delim || '/';
            var ret = {};

            for (var key in obj) {

                if (!obj.hasOwnProperty(key)) continue;

                var shouldGoDeeper = typeof obj[key] === 'object';
                if (shouldGoDeeper && stop && stop(obj[key])) {
                    shouldGoDeeper = false;
                }

                if (shouldGoDeeper) {

                    var flatObject = this.flattenObject(obj[key], delim, stop);

                    for (var flatKey in flatObject) {
                        if (!flatObject.hasOwnProperty(flatKey)) continue;
                        ret[key + delim + flatKey] = flatObject[flatKey];
                    }

                } else {

                    ret[key] = obj[key];
                }
            }

            return ret;
        },

        uuid: function() {

            // credit: http://stackoverflow.com/posts/2117523/revisions

            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16|0;
                var v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },

        // Generate global unique id for obj and store it as a property of the object.
        guid: function(obj) {

            this.guid.id = this.guid.id || 1;
            obj.id = (obj.id === undefined ? 'j_' + this.guid.id++ : obj.id);
            return obj.id;
        },

        toKebabCase: function(string) {

            return string.replace(/[A-Z]/g, '-$&').toLowerCase();
        },

        normalizeEvent: function(evt) {

            var touchEvt = evt.originalEvent && evt.originalEvent.changedTouches && evt.originalEvent.changedTouches[0];
            if (touchEvt) {
                for (var property in evt) {
                    // copy all the properties from the input event that are not
                    // defined on the touch event (functions included).
                    if (touchEvt[property] === undefined) {
                        touchEvt[property] = evt[property];
                    }
                }
                return touchEvt;
            }

            return evt;
        },

        nextFrame: (function() {

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
                    var id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);

                    lastTime = currTime + timeToCall;

                    return id;
                };
            }

            return function(callback, context) {
                return context
                    ? raf(callback.bind(context))
                    : raf(callback);
            };

        })(),

        cancelFrame: (function() {

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

        })(),

        // ** Deprecated **
        shapePerimeterConnectionPoint: function(linkView, view, magnet, reference) {

            var bbox;
            var spot;

            if (!magnet) {

                // There is no magnet, try to make the best guess what is the
                // wrapping SVG element. This is because we want this "smart"
                // connection points to work out of the box without the
                // programmer to put magnet marks to any of the subelements.
                // For example, we want the functoin to work on basic.Path elements
                // without any special treatment of such elements.
                // The code below guesses the wrapping element based on
                // one simple assumption. The wrapping elemnet is the
                // first child of the scalable group if such a group exists
                // or the first child of the rotatable group if not.
                // This makese sense because usually the wrapping element
                // is below any other sub element in the shapes.
                var scalable = view.$('.scalable')[0];
                var rotatable = view.$('.rotatable')[0];

                if (scalable && scalable.firstChild) {

                    magnet = scalable.firstChild;

                } else if (rotatable && rotatable.firstChild) {

                    magnet = rotatable.firstChild;
                }
            }

            if (magnet) {

                spot = V(magnet).findIntersection(reference, linkView.paper.viewport);
                if (!spot) {
                    bbox = V(magnet).getBBox({ target: linkView.paper.viewport });
                }

            } else {

                bbox = view.model.getBBox();
                spot = bbox.intersectionWithLineFromCenterToPoint(reference);
            }
            return spot || bbox.center();
        },

        isPercentage: function(val) {

            return joint.util.isString(val) && val.slice(-1) === '%';
        },

        parseCssNumeric: function(strValue, restrictUnits) {

            restrictUnits = restrictUnits || [];
            var cssNumeric = { value: parseFloat(strValue) };

            if (Number.isNaN(cssNumeric.value)) {
                return null;
            }

            var validUnitsExp = restrictUnits.join('|');

            if (joint.util.isString(strValue)) {
                var matches = new RegExp('(\\d+)(' + validUnitsExp + ')$').exec(strValue);
                if (!matches) {
                    return null;
                }
                if (matches[2]) {
                    cssNumeric.unit = matches[2];
                }
            }
            return cssNumeric;
        },

        breakText: function(text, size, styles, opt) {

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

            var words = text.split(separator);
            var full = [];
            var lines = [];
            var p;
            var lineHeight;

            for (var i = 0, l = 0, len = words.length; i < len; i++) {

                var word = words[i];

                if (!word) continue;

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

                    if (p) {
                        // We were partitioning. Put rest of the word onto next line
                        full[l++] = true;

                        // cancel partitioning
                        p = 0;
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

                            // We initiate partitioning
                            // split the long word into two words
                            words.splice(i, 1, word.substring(0, p), word.substring(p));

                            // adjust words length
                            len++;

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
                            heightValue = joint.util.parseCssNumeric(styles.lineHeight, ['em']) || { value: 1, unit: 'em' };
                        }

                        lineHeight = heightValue.value;
                        if (heightValue.unit === 'em' ) {
                            lineHeight *= textElement.getBBox().height;
                        }
                    }

                    if (lineHeight * lines.length > height) {

                        // remove overflowing lines
                        lines.splice(Math.floor(height / lineHeight));

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
        },

        // Sanitize HTML
        // Based on https://gist.github.com/ufologist/5a0da51b2b9ef1b861c30254172ac3c9
        // Parses a string into an array of DOM nodes.
        // Then outputs it back as a string.
        sanitizeHTML: function(html) {

            // Ignores tags that are invalid inside a <div> tag (e.g. <body>, <head>)

            // If documentContext (second parameter) is not specified or given as `null` or `undefined`, a new document is used.
            // Inline events will not execute when the HTML is parsed; this includes, for example, sending GET requests for images.

            // If keepScripts (last parameter) is `false`, scripts are not executed.
            var output = $($.parseHTML('<div>' + html + '</div>', null, false));

            output.find('*').each(function() { // for all nodes
                var currentNode = this;

                $.each(currentNode.attributes, function() { // for all attributes in each node
                    var currentAttribute = this;

                    var attrName = currentAttribute.name;
                    var attrValue = currentAttribute.value;

                    // Remove attribute names that start with "on" (e.g. onload, onerror...).
                    // Remove attribute values that start with "javascript:" pseudo protocol (e.g. `href="javascript:alert(1)"`).
                    if (attrName.indexOf('on') === 0 || attrValue.indexOf('javascript:') === 0) {
                        $(currentNode).removeAttr(attrName);
                    }
                });
            });

            return output.html();
        },

        // Download `blob` as file with `fileName`.
        // Does not work in IE9.
        downloadBlob: function(blob, fileName) {

            if (window.navigator.msSaveBlob) { // requires IE 10+
                // pulls up a save dialog
                window.navigator.msSaveBlob(blob, fileName);

            } else { // other browsers
                // downloads directly in Chrome and Safari

                // presents a save/open dialog in Firefox
                // Firefox bug: `from` field in save dialog always shows `from:blob:`
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1053327

                var url = window.URL.createObjectURL(blob);
                var link = document.createElement('a');

                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);
                window.URL.revokeObjectURL(url); // mark the url for garbage collection
            }
        },

        // Download `dataUri` as file with `fileName`.
        // Does not work in IE9.
        downloadDataUri: function(dataUri, fileName) {

            var blob = joint.util.dataUriToBlob(dataUri);
            joint.util.downloadBlob(blob, fileName);
        },

        // Convert an uri-encoded data component (possibly also base64-encoded) to a blob.
        dataUriToBlob: function(dataUri) {

            // first, make sure there are no newlines in the data uri
            dataUri = dataUri.replace(/\s/g, '');
            dataUri = decodeURIComponent(dataUri);

            var firstCommaIndex = dataUri.indexOf(','); // split dataUri as `dataTypeString`,`data`

            var dataTypeString = dataUri.slice(0, firstCommaIndex); // e.g. 'data:image/jpeg;base64'
            var mimeString = dataTypeString.split(':')[1].split(';')[0]; // e.g. 'image/jpeg'

            var data = dataUri.slice(firstCommaIndex + 1);
            var decodedString;
            if (dataTypeString.indexOf('base64') >= 0) { // data may be encoded in base64
                decodedString = atob(data); // decode data
            } else {
                // convert the decoded string to UTF-8
                decodedString = unescape(encodeURIComponent(data));
            }
            // write the bytes of the string to a typed array
            var ia = new Uint8Array(decodedString.length);
            for (var i = 0; i < decodedString.length; i++) {
                ia[i] = decodedString.charCodeAt(i);
            }

            return new Blob([ia], { type: mimeString }); // return the typed array as Blob
        },

        // Read an image at `url` and return it as base64-encoded data uri.
        // The mime type of the image is inferred from the `url` file extension.
        // If data uri is provided as `url`, it is returned back unchanged.
        // `callback` is a method with `err` as first argument and `dataUri` as second argument.
        // Works with IE9.
        imageToDataUri: function(url, callback) {

            if (!url || url.substr(0, 'data:'.length) === 'data:') {
                // No need to convert to data uri if it is already in data uri.

                // This not only convenient but desired. For example,
                // IE throws a security error if data:image/svg+xml is used to render
                // an image to the canvas and an attempt is made to read out data uri.
                // Now if our image is already in data uri, there is no need to render it to the canvas
                // and so we can bypass this error.

                // Keep the async nature of the function.
                return setTimeout(function() {
                    callback(null, url);
                }, 0);
            }

            // chrome, IE10+
            var modernHandler = function(xhr, callback) {

                if (xhr.status === 200) {

                    var reader = new FileReader();

                    reader.onload = function(evt) {
                        var dataUri = evt.target.result;
                        callback(null, dataUri);
                    };

                    reader.onerror = function() {
                        callback(new Error('Failed to load image ' + url));
                    };

                    reader.readAsDataURL(xhr.response);
                } else {
                    callback(new Error('Failed to load image ' + url));
                }
            };

            var legacyHandler = function(xhr, callback) {

                var Uint8ToString = function(u8a) {
                    var CHUNK_SZ = 0x8000;
                    var c = [];
                    for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
                        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
                    }
                    return c.join('');
                };

                if (xhr.status === 200) {

                    var bytes = new Uint8Array(xhr.response);

                    var suffix = (url.split('.').pop()) || 'png';
                    var map = {
                        'svg': 'svg+xml'
                    };
                    var meta = 'data:image/' + (map[suffix] || suffix) + ';base64,';
                    var b64encoded = meta + btoa(Uint8ToString(bytes));
                    callback(null, b64encoded);
                } else {
                    callback(new Error('Failed to load image ' + url));
                }
            };

            var xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);
            xhr.addEventListener('error', function() {
                callback(new Error('Failed to load image ' + url));
            });

            xhr.responseType = window.FileReader ? 'blob' : 'arraybuffer';

            xhr.addEventListener('load', function() {
                if (window.FileReader) {
                    modernHandler(xhr, callback);
                } else {
                    legacyHandler(xhr, callback);
                }
            });

            xhr.send();
        },

        getElementBBox: function(el) {

            var $el = $(el);
            if ($el.length === 0) {
                throw new Error('Element not found')
            }

            var element = $el[0];
            var doc = element.ownerDocument;
            var clientBBox = element.getBoundingClientRect();

            var strokeWidthX = 0;
            var strokeWidthY = 0;

            // Firefox correction
            if (element.ownerSVGElement) {

                var vel = V(element);
                var bbox = vel.getBBox({ target: vel.svg() });

                // if FF getBoundingClientRect includes stroke-width, getBBox doesn't.
                // To unify this across all browsers we need to adjust the final bBox with `stroke-width` value.
                strokeWidthX = (clientBBox.width - bbox.width);
                strokeWidthY = (clientBBox.height - bbox.height);
            }

            return  {
                x: clientBBox.left + window.pageXOffset - doc.documentElement.offsetLeft + strokeWidthX / 2,
                y: clientBBox.top + window.pageYOffset - doc.documentElement.offsetTop + strokeWidthY / 2,
                width: clientBBox.width - strokeWidthX,
                height: clientBBox.height - strokeWidthY
            };
        },


        // Highly inspired by the jquery.sortElements plugin by Padolsey.
        // See http://james.padolsey.com/javascript/sorting-elements-with-jquery/.
        sortElements: function(elements, comparator) {

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
        },

        // Sets attributes on the given element and its descendants based on the selector.
        // `attrs` object: { [SELECTOR1]: { attrs1 }, [SELECTOR2]: { attrs2}, ... } e.g. { 'input': { color : 'red' }}
        setAttributesBySelector: function(element, attrs) {

            var $element = $(element);

            joint.util.forIn(attrs, function(attrs, selector) {
                var $elements = $element.find(selector).addBack().filter(selector);
                // Make a special case for setting classes.
                // We do not want to overwrite any existing class.
                if (joint.util.has(attrs, 'class')) {
                    $elements.addClass(attrs['class']);
                    attrs = joint.util.omit(attrs, 'class');
                }
                $elements.attr(attrs);
            });
        },

        // Return a new object with all four sides (top, right, bottom, left) in it.
        // Value of each side is taken from the given argument (either number or object).
        // Default value for a side is 0.
        // Examples:
        // joint.util.normalizeSides(5) --> { top: 5, right: 5, bottom: 5, left: 5 }
        // joint.util.normalizeSides({ horizontal: 5 }) --> { top: 0, right: 5, bottom: 0, left: 5 }
        // joint.util.normalizeSides({ left: 5 }) --> { top: 0, right: 0, bottom: 0, left: 5 }
        // joint.util.normalizeSides({ horizontal: 10, left: 5 }) --> { top: 0, right: 10, bottom: 0, left: 5 }
        // joint.util.normalizeSides({ horizontal: 0, left: 5 }) --> { top: 0, right: 0, bottom: 0, left: 5 }
        normalizeSides: function(box) {

            if (Object(box) !== box) { // `box` is not an object
                var val = 0; // `val` left as 0 if `box` cannot be understood as finite number
                if (isFinite(box)) val = +box; // actually also accepts string numbers (e.g. '100')

                return { top: val, right: val, bottom: val, left: val };
            }

            // `box` is an object
            var top, right, bottom, left;
            top = right = bottom = left = 0;

            if (isFinite(box.vertical)) top = bottom = +box.vertical;
            if (isFinite(box.horizontal)) right = left = +box.horizontal;

            if (isFinite(box.top)) top = +box.top; // overwrite vertical
            if (isFinite(box.right)) right = +box.right; // overwrite horizontal
            if (isFinite(box.bottom)) bottom = +box.bottom; // overwrite vertical
            if (isFinite(box.left)) left = +box.left; // overwrite horizontal

            return { top: top, right: right, bottom: bottom, left: left };
        },

        timing: {

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
                if (t <= 0) return 0;
                if (t >= 1) return 1;
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
                if (!s) s = 1.70158;
                return function(t) {
                    return t * t * ((s + 1) * t - s);
                };
            },

            elastic: function(x) {
                if (!x) x = 1.5;
                return function(t) {
                    return Math.pow(2, 10 * (t - 1)) * Math.cos(20 * Math.PI * x / 3 * t);
                };
            }
        },

        interpolate: {

            number: function(a, b) {
                var d = b - a;
                return function(t) { return a + d * t; };
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

                    return '#' + (1 << 24 | r | g | b ).toString(16).slice(1);
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
        },

        // SVG filters.
        // (values in parentheses are default values)
        filter: {

            // `color` ... outline color ('blue')
            // `width`... outline width (1)
            // `opacity` ... outline opacity (1)
            // `margin` ... gap between outline and the element (2)
            outline: function(args) {

                var tpl = '<filter><feFlood flood-color="${color}" flood-opacity="${opacity}" result="colored"/><feMorphology in="SourceAlpha" result="morphedOuter" operator="dilate" radius="${outerRadius}" /><feMorphology in="SourceAlpha" result="morphedInner" operator="dilate" radius="${innerRadius}" /><feComposite result="morphedOuterColored" in="colored" in2="morphedOuter" operator="in"/><feComposite operator="xor" in="morphedOuterColored" in2="morphedInner" result="outline"/><feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

                var margin = Number.isFinite(args.margin) ? args.margin : 2;
                var width = Number.isFinite(args.width) ? args.width : 1;

                return joint.util.template(tpl)({
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

                return joint.util.template(tpl)({
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

                return joint.util.template('<filter><feGaussianBlur stdDeviation="${stdDeviation}"/></filter>')({
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

                return joint.util.template(tpl)({
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

                return joint.util.template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 0 ${d} ${e} ${f} 0 0 ${g} ${b} ${h} 0 0 0 0 0 1 0"/></filter>')({
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

                return joint.util.template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 0 ${d} ${e} ${f} 0 0 ${g} ${h} ${i} 0 0 0 0 0 1 0"/></filter>')({
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

                return joint.util.template('<filter><feColorMatrix type="saturate" values="${amount}"/></filter>')({
                    amount: 1 - amount
                });
            },

            // `angle` ...  the number of degrees around the color circle the input samples will be adjusted (0).
            hueRotate: function(args) {

                return joint.util.template('<filter><feColorMatrix type="hueRotate" values="${angle}"/></filter>')({
                    angle: args.angle || 0
                });
            },

            // `amount` ... the proportion of the conversion (1). A value of 1 (default) is completely inverted. A value of 0 leaves the input unchanged.
            invert: function(args) {

                var amount = Number.isFinite(args.amount) ? args.amount : 1;

                return joint.util.template('<filter><feComponentTransfer><feFuncR type="table" tableValues="${amount} ${amount2}"/><feFuncG type="table" tableValues="${amount} ${amount2}"/><feFuncB type="table" tableValues="${amount} ${amount2}"/></feComponentTransfer></filter>')({
                    amount: amount,
                    amount2: 1 - amount
                });
            },

            // `amount` ... proportion of the conversion (1). A value of 0 will create an image that is completely black. A value of 1 (default) leaves the input unchanged.
            brightness: function(args) {

                return joint.util.template('<filter><feComponentTransfer><feFuncR type="linear" slope="${amount}"/><feFuncG type="linear" slope="${amount}"/><feFuncB type="linear" slope="${amount}"/></feComponentTransfer></filter>')({
                    amount: Number.isFinite(args.amount) ? args.amount : 1
                });
            },

            // `amount` ... proportion of the conversion (1). A value of 0 will create an image that is completely black. A value of 1 (default) leaves the input unchanged.
            contrast: function(args) {

                var amount = Number.isFinite(args.amount) ? args.amount : 1;

                return joint.util.template('<filter><feComponentTransfer><feFuncR type="linear" slope="${amount}" intercept="${amount2}"/><feFuncG type="linear" slope="${amount}" intercept="${amount2}"/><feFuncB type="linear" slope="${amount}" intercept="${amount2}"/></feComponentTransfer></filter>')({
                    amount: amount,
                    amount2: .5 - amount / 2
                });
            }
        },

        format: {

            // Formatting numbers via the Python Format Specification Mini-language.
            // See http://docs.python.org/release/3.1.3/library/string.html#format-specification-mini-language.
            // Heavilly inspired by the D3.js library implementation.
            number: function(specifier, value, locale) {

                locale = locale || {

                    currency: ['$', ''],
                    decimal: '.',
                    thousands: ',',
                    grouping: [3]
                };

                // See Python format specification mini-language: http://docs.python.org/release/3.1.3/library/string.html#format-specification-mini-language.
                // [[fill]align][sign][symbol][0][width][,][.precision][type]
                var re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;

                var match = re.exec(specifier);
                var fill = match[1] || ' ';
                var align = match[2] || '>';
                var sign = match[3] || '';
                var symbol = match[4] || '';
                var zfill = match[5];
                var width = +match[6];
                var comma = match[7];
                var precision = match[8];
                var type = match[9];
                var scale = 1;
                var prefix = '';
                var suffix = '';
                var integer = false;

                if (precision) precision = +precision.substring(1);

                if (zfill || fill === '0' && align === '=') {
                    zfill = fill = '0';
                    align = '=';
                    if (comma) width -= Math.floor((width - 1) / 4);
                }

                switch (type) {
                    case 'n':
                        comma = true; type = 'g';
                        break;
                    case '%':
                        scale = 100; suffix = '%'; type = 'f';
                        break;
                    case 'p':
                        scale = 100; suffix = '%'; type = 'r';
                        break;
                    case 'b':
                    case 'o':
                    case 'x':
                    case 'X':
                        if (symbol === '#') prefix = '0' + type.toLowerCase();
                        break;
                    case 'c':
                    case 'd':
                        integer = true; precision = 0;
                        break;
                    case 's':
                        scale = -1; type = 'r';
                        break;
                }

                if (symbol === '$') {
                    prefix = locale.currency[0];
                    suffix = locale.currency[1];
                }

                // If no precision is specified for `'r'`, fallback to general notation.
                if (type == 'r' && !precision) type = 'g';

                // Ensure that the requested precision is in the supported range.
                if (precision != null) {
                    if (type == 'g') precision = Math.max(1, Math.min(21, precision));
                    else if (type == 'e' || type == 'f') precision = Math.max(0, Math.min(20, precision));
                }

                var zcomma = zfill && comma;

                // Return the empty string for floats formatted as ints.
                if (integer && (value % 1)) return '';

                // Convert negative to positive, and record the sign prefix.
                var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, '-') : sign;

                var fullSuffix = suffix;

                // Apply the scale, computing it from the value's exponent for si format.
                // Preserve the existing suffix, if any, such as the currency symbol.
                if (scale < 0) {
                    var unit = this.prefix(value, precision);
                    value = unit.scale(value);
                    fullSuffix = unit.symbol + suffix;
                } else {
                    value *= scale;
                }

                // Convert to the desired precision.
                value = this.convert(type, value, precision);

                // Break the value into the integer part (before) and decimal part (after).
                var i = value.lastIndexOf('.');
                var before = i < 0 ? value : value.substring(0, i);
                var after = i < 0 ? '' : locale.decimal + value.substring(i + 1);

                function formatGroup(value) {

                    var i = value.length;
                    var t = [];
                    var j = 0;
                    var g = locale.grouping[0];
                    while (i > 0 && g > 0) {
                        t.push(value.substring(i -= g, i + g));
                        g = locale.grouping[j = (j + 1) % locale.grouping.length];
                    }
                    return t.reverse().join(locale.thousands);
                }

                // If the fill character is not `'0'`, grouping is applied before padding.
                if (!zfill && comma && locale.grouping) {

                    before = formatGroup(before);
                }

                var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length);
                var padding = length < width ? new Array(length = width - length + 1).join(fill) : '';

                // If the fill character is `'0'`, grouping is applied after padding.
                if (zcomma) before = formatGroup(padding + before);

                // Apply prefix.
                negative += prefix;

                // Rejoin integer and decimal parts.
                value = before + after;

                return (align === '<' ? negative + value + padding
                    : align === '>' ? padding + negative + value
                        : align === '^' ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length)
                            : negative + (zcomma ? value : padding + value)) + fullSuffix;
            },

            // Formatting string via the Python Format string.
            // See https://docs.python.org/2/library/string.html#format-string-syntax)
            string: function(formatString, value) {

                var fieldDelimiterIndex;
                var fieldDelimiter = '{';
                var endPlaceholder = false;
                var formattedStringArray = [];

                while ((fieldDelimiterIndex = formatString.indexOf(fieldDelimiter)) !== -1) {

                    var pieceFormatedString, formatSpec, fieldName;

                    pieceFormatedString = formatString.slice(0, fieldDelimiterIndex);

                    if (endPlaceholder) {
                        formatSpec = pieceFormatedString.split(':');
                        fieldName = formatSpec.shift().split('.');
                        pieceFormatedString = value;

                        for (var i = 0; i < fieldName.length; i++)
                            pieceFormatedString = pieceFormatedString[fieldName[i]];

                        if (formatSpec.length)
                            pieceFormatedString = this.number(formatSpec, pieceFormatedString);
                    }

                    formattedStringArray.push(pieceFormatedString);

                    formatString = formatString.slice(fieldDelimiterIndex + 1);
                    endPlaceholder = !endPlaceholder;
                    fieldDelimiter = (endPlaceholder) ? '}' : '{';
                }
                formattedStringArray.push(formatString);

                return formattedStringArray.join('');
            },

            convert: function(type, value, precision) {

                switch (type) {
                    case 'b': return value.toString(2);
                    case 'c': return String.fromCharCode(value);
                    case 'o': return value.toString(8);
                    case 'x': return value.toString(16);
                    case 'X': return value.toString(16).toUpperCase();
                    case 'g': return value.toPrecision(precision);
                    case 'e': return value.toExponential(precision);
                    case 'f': return value.toFixed(precision);
                    case 'r': return (value = this.round(value, this.precision(value, precision))).toFixed(Math.max(0, Math.min(20, this.precision(value * (1 + 1e-15), precision))));
                    default: return value + '';
                }
            },

            round: function(value, precision) {

                return precision
                    ? Math.round(value * (precision = Math.pow(10, precision))) / precision
                    : Math.round(value);
            },

            precision: function(value, precision) {

                return precision - (value ? Math.ceil(Math.log(value) / Math.LN10) : 1);
            },

            prefix: function(value, precision) {

                var prefixes = ['y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'].map(function(d, i) {
                    var k = Math.pow(10, Math.abs(8 - i) * 3);
                    return {
                        scale: i > 8 ? function(d) { return d / k; } : function(d) { return d * k; },
                        symbol: d
                    };
                });

                var i = 0;
                if (value) {
                    if (value < 0) value *= -1;
                    if (precision) value = this.round(value, this.precision(value, precision));
                    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
                    i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
                }
                return prefixes[8 + i / 3];
            }
        },

        /*
            Pre-compile the HTML to be used as a template.
        */
        template: function(html) {

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
        },

        /**
         * @param {Element} el Element, which content is intent to display in full-screen mode, 'window.top.document.body' is default.
         */
        toggleFullScreen: function(el) {

            var topDocument = window.top.document;
            el = el || topDocument.body;

            function prefixedResult(el, prop) {

                var prefixes = ['webkit', 'moz', 'ms', 'o', ''];
                for (var i = 0; i < prefixes.length; i++) {
                    var prefix = prefixes[i];
                    var propName = prefix ? (prefix + prop) : (prop.substr(0, 1).toLowerCase() + prop.substr(1));
                    if (el[propName] !== undefined) {
                        return joint.util.isFunction(el[propName]) ? el[propName]() : el[propName];
                    }
                }
            }

            if (prefixedResult(topDocument, 'FullscreenElement') || prefixedResult(topDocument, 'FullScreenElement')) {
                prefixedResult(topDocument, 'ExitFullscreen') || // Spec.
                prefixedResult(topDocument, 'CancelFullScreen'); // Firefox
            } else {
                prefixedResult(el, 'RequestFullscreen') || // Spec.
                prefixedResult(el, 'RequestFullScreen'); // Firefox
            }
        },

        addClassNamePrefix: function(className) {

            if (!className) return className;

            return className.toString().split(' ').map(function(_className) {

                if (_className.substr(0, joint.config.classNamePrefix.length) !== joint.config.classNamePrefix) {
                    _className = joint.config.classNamePrefix + _className;
                }

                return _className;

            }).join(' ');
        },

        removeClassNamePrefix: function(className) {

            if (!className) return className;

            return className.toString().split(' ').map(function(_className) {

                if (_className.substr(0, joint.config.classNamePrefix.length) === joint.config.classNamePrefix) {
                    _className = _className.substr(joint.config.classNamePrefix.length);
                }

                return _className;

            }).join(' ');
        },

        wrapWith: function(object, methods, wrapper) {

            if (joint.util.isString(wrapper)) {

                if (!joint.util.wrappers[wrapper]) {
                    throw new Error('Unknown wrapper: "' + wrapper + '"');
                }

                wrapper = joint.util.wrappers[wrapper];
            }

            if (!joint.util.isFunction(wrapper)) {
                throw new Error('Wrapper must be a function.');
            }

            this.toArray(methods).forEach(function(method) {
                object[method] = wrapper(object[method]);
            });
        },

        wrappers: {

            /*
                Prepares a function with the following usage:

                    fn([cell, cell, cell], opt);
                    fn([cell, cell, cell]);
                    fn(cell, cell, cell, opt);
                    fn(cell, cell, cell);
                    fn(cell);
            */
            cells: function(fn) {

                return function() {

                    var args = Array.from(arguments);
                    var n = args.length;
                    var cells = n > 0 && args[0] || [];
                    var opt = n > 1 && args[n - 1] || {};

                    if (!Array.isArray(cells)) {

                        if (opt instanceof joint.dia.Cell) {
                            cells = args;
                        } else if (cells instanceof joint.dia.Cell) {
                            if (args.length > 1) {
                                args.pop();
                            }
                            cells = args;
                        }
                    }

                    if (opt instanceof joint.dia.Cell) {
                        opt = {};
                    }

                    return fn.call(this, cells, opt);
                };
            }
        },

        parseDOMJSON: function(json, namespace) {

            var selectors = {};
            var svgNamespace = V.namespace.xmlns;
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
                    if (!nodeDef.hasOwnProperty('tagName')) throw new Error('json-dom-parser: missing tagName');
                    var tagName = nodeDef.tagName;
                    // Namespace URI
                    if (nodeDef.hasOwnProperty('namespaceURI')) ns = nodeDef.namespaceURI;
                    var node = document.createElementNS(ns, tagName);
                    var svg = (ns === svgNamespace);
                    var wrapper = (svg) ? V : $;
                    // Attributes
                    var attributes = nodeDef.attributes;
                    if (attributes) wrapper(node).attr(attributes);
                    // Style
                    var style = nodeDef.style;
                    if (style) $(node).css(style);
                    // ClassName
                    if (nodeDef.hasOwnProperty('className')) {
                        var className = nodeDef.className;
                        if (svg) {
                            node.className.baseVal = className;
                        } else {
                            node.className = className;
                        }
                    }
                    // Selector
                    if (nodeDef.hasOwnProperty('selector')) {
                        var nodeSelector = nodeDef.selector;
                        if (selectors[nodeSelector]) throw new Error('json-dom-parser: selector must be unique');
                        selectors[nodeSelector] = node;
                        wrapper(node).attr('joint-selector', nodeSelector);
                    }
                    parentNode.appendChild(node);
                    // Children
                    var childrenDef = nodeDef.children;
                    if (Array.isArray(childrenDef)) queue.push(childrenDef, node, ns);
                }
            }
            return {
                fragment: fragment,
                selectors: selectors
            }
        },

        /* global _:true */

        // Copy all the properties to the first argument from the following arguments.
        // All the properties will be overwritten by the properties from the following
        // arguments. Inherited properties are ignored.
        mixin: _.assign,

        // Copy all properties to the first argument from the following
        // arguments only in case if they don't exists in the first argument.
        // All the function propererties in the first argument will get
        // additional property base pointing to the extenders same named
        // property function's call method.
        supplement: _.defaults,

        // Same as `mixin()` but deep version.
        deepMixin: _.mixin,

        // Same as `supplement()` but deep version.
        deepSupplement: _.defaultsDeep,

        // lodash 3 vs 4 incompatible
        sortedIndex: _.sortedIndexBy || _.sortedIndex,
        uniq: _.uniqBy || _.uniq,
        uniqueId: _.uniqueId,
        sortBy: _.sortBy,
        isFunction: _.isFunction,
        result: _.result,
        union: _.union,
        invoke: _.invokeMap || _.invoke,
        difference: _.difference,
        intersection: _.intersection,
        omit: _.omit,
        pick: _.pick,
        has: _.has,
        bindAll: _.bindAll,
        assign: _.assign,
        defaults: _.defaults,
        defaultsDeep: _.defaultsDeep,
        isPlainObject: _.isPlainObject,
        isEmpty: _.isEmpty,
        isEqual: _.isEqual,
        cloneDeep: _.cloneDeep,
        toArray: _.toArray,
        flattenDeep: _.flattenDeep,
        camelCase: _.camelCase,
        groupBy: _.groupBy,
        forIn: _.forIn,
        without: _.without,
        debounce: _.debounce,
        clone: _.clone,

        merge: function() {
            if (_.mergeWith) {
                var args = Array.from(arguments);
                var last = args[args.length - 1];

                var customizer =  this.isFunction(last) ? last : this.noop;
                args.push(function(a,b) {
                    var customResult = customizer(a, b);
                    if (customResult !== undefined) {
                        return customResult;
                    }

                    if (Array.isArray(a) && !Array.isArray(b)) {
                        return b;
                    }
                });

                return _.mergeWith.apply(this, args)
            }
            return _.merge.apply(this, arguments);
        },

        /* global _:false */

        noop: function() {},

        isBoolean: function(value) {
            var toString = Object.prototype.toString;
            return value === true || value === false || (!!value && typeof value === 'object' && toString.call(value) === '[object Boolean]');
        },

        isObject: function(value) {
            return !!value && (typeof value === 'object' || typeof value === 'function');
        },

        isNumber: function(value) {
            var toString = Object.prototype.toString;
            return typeof value === 'number' || (!!value && typeof value === 'object' && toString.call(value) === '[object Number]');
        },

        isString: function(value) {
            var toString = Object.prototype.toString;
            return typeof value === 'string' || (!!value && typeof value === 'object' && toString.call(value) === '[object String]');
        }
    }
};
