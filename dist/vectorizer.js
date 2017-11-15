/*! JointJS v2.0.1 (2017-11-15) - JavaScript diagramming library


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
(function(root, factory) {

    if (typeof define === 'function' && define.amd) {

        // AMD. Register as an anonymous module.
        define(['g'], function(g) {
            return factory(g);
        });

    } else if (typeof exports === 'object') {

        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var g = require('./geometry');

        module.exports = factory(g);

    } else {

        // Browser globals.
        var g = root.g;

        root.Vectorizer = root.V = factory(g);
    }

}(this, function(g) {

// Vectorizer.
// -----------

// A tiny library for making your life easier when dealing with SVG.
// The only Vectorizer dependency is the Geometry library.


var V;
var Vectorizer;

V = Vectorizer = (function() {

    'use strict';

    var hasSvg = typeof window === 'object' &&
                !!(
                    window.SVGAngle ||
                    document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')
                );

    // SVG support is required.
    if (!hasSvg) {

        // Return a function that throws an error when it is used.
        return function() {
            throw new Error('SVG is required to use Vectorizer.');
        };
    }

    // XML namespaces.
    var ns = {
        xmlns: 'http://www.w3.org/2000/svg',
        xml: 'http://www.w3.org/XML/1998/namespace',
        xlink: 'http://www.w3.org/1999/xlink'
    };

    var SVGversion = '1.1';

    var V = function(el, attrs, children) {

        // This allows using V() without the new keyword.
        if (!(this instanceof V)) {
            return V.apply(Object.create(V.prototype), arguments);
        }

        if (!el) return;

        if (V.isV(el)) {
            el = el.node;
        }

        attrs = attrs || {};

        if (V.isString(el)) {

            if (el.toLowerCase() === 'svg') {

                // Create a new SVG canvas.
                el = V.createSvgDocument();

            } else if (el[0] === '<') {

                // Create element from an SVG string.
                // Allows constructs of type: `document.appendChild(V('<rect></rect>').node)`.

                var svgDoc = V.createSvgDocument(el);

                // Note that `V()` might also return an array should the SVG string passed as
                // the first argument contain more than one root element.
                if (svgDoc.childNodes.length > 1) {

                    // Map child nodes to `V`s.
                    var arrayOfVels = [];
                    var i, len;

                    for (i = 0, len = svgDoc.childNodes.length; i < len; i++) {

                        var childNode = svgDoc.childNodes[i];
                        arrayOfVels.push(new V(document.importNode(childNode, true)));
                    }

                    return arrayOfVels;
                }

                el = document.importNode(svgDoc.firstChild, true);

            } else {

                el = document.createElementNS(ns.xmlns, el);
            }

            V.ensureId(el);
        }

        this.node = el;

        this.setAttributes(attrs);

        if (children) {
            this.append(children);
        }

        return this;
    };

    /**
     * @param {SVGGElement} toElem
     * @returns {SVGMatrix}
     */
    V.prototype.getTransformToElement = function(toElem) {
        toElem = V.toNode(toElem);
        return toElem.getScreenCTM().inverse().multiply(this.node.getScreenCTM());
    };

    /**
     * @param {SVGMatrix} matrix
     * @param {Object=} opt
     * @returns {Vectorizer|SVGMatrix} Setter / Getter
     */
    V.prototype.transform = function(matrix, opt) {

        var node = this.node;
        if (V.isUndefined(matrix)) {
            return V.transformStringToMatrix(this.attr('transform'));
        }

        if (opt && opt.absolute) {
            return this.attr('transform', V.matrixToTransformString(matrix));
        }

        var svgTransform = V.createSVGTransform(matrix);
        node.transform.baseVal.appendItem(svgTransform);
        return this;
    };

    V.prototype.translate = function(tx, ty, opt) {

        opt = opt || {};
        ty = ty || 0;

        var transformAttr = this.attr('transform') || '';
        var transform = V.parseTransformString(transformAttr);
        transformAttr = transform.value;
        // Is it a getter?
        if (V.isUndefined(tx)) {
            return transform.translate;
        }

        transformAttr = transformAttr.replace(/translate\([^\)]*\)/g, '').trim();

        var newTx = opt.absolute ? tx : transform.translate.tx + tx;
        var newTy = opt.absolute ? ty : transform.translate.ty + ty;
        var newTranslate = 'translate(' + newTx + ',' + newTy + ')';

        // Note that `translate()` is always the first transformation. This is
        // usually the desired case.
        this.attr('transform', (newTranslate + ' ' + transformAttr).trim());
        return this;
    };

    V.prototype.rotate = function(angle, cx, cy, opt) {

        opt = opt || {};

        var transformAttr = this.attr('transform') || '';
        var transform = V.parseTransformString(transformAttr);
        transformAttr = transform.value;

        // Is it a getter?
        if (V.isUndefined(angle)) {
            return transform.rotate;
        }

        transformAttr = transformAttr.replace(/rotate\([^\)]*\)/g, '').trim();

        angle %= 360;

        var newAngle = opt.absolute ? angle : transform.rotate.angle + angle;
        var newOrigin = (cx !== undefined && cy !== undefined) ? ',' + cx + ',' + cy : '';
        var newRotate = 'rotate(' + newAngle + newOrigin + ')';

        this.attr('transform', (transformAttr + ' ' + newRotate).trim());
        return this;
    };

    // Note that `scale` as the only transformation does not combine with previous values.
    V.prototype.scale = function(sx, sy) {

        sy = V.isUndefined(sy) ? sx : sy;

        var transformAttr = this.attr('transform') || '';
        var transform = V.parseTransformString(transformAttr);
        transformAttr = transform.value;

        // Is it a getter?
        if (V.isUndefined(sx)) {
            return transform.scale;
        }

        transformAttr = transformAttr.replace(/scale\([^\)]*\)/g, '').trim();

        var newScale = 'scale(' + sx + ',' + sy + ')';

        this.attr('transform', (transformAttr + ' ' + newScale).trim());
        return this;
    };

    // Get SVGRect that contains coordinates and dimension of the real bounding box,
    // i.e. after transformations are applied.
    // If `target` is specified, bounding box will be computed relatively to `target` element.
    V.prototype.bbox = function(withoutTransformations, target) {

        var box;
        var node = this.node;
        var ownerSVGElement = node.ownerSVGElement;

        // If the element is not in the live DOM, it does not have a bounding box defined and
        // so fall back to 'zero' dimension element.
        if (!ownerSVGElement) {
            return g.Rect(0, 0, 0, 0);
        }

        try {

            box = node.getBBox();

        } catch (e) {

            // Fallback for IE.
            box = {
                x: node.clientLeft,
                y: node.clientTop,
                width: node.clientWidth,
                height: node.clientHeight
            };
        }

        if (withoutTransformations) {
            return g.Rect(box);
        }

        var matrix = this.getTransformToElement(target || ownerSVGElement);

        return V.transformRect(box, matrix);
    };
    
    // Returns an SVGRect that contains coordinates and dimensions of the real bounding box,
    // i.e. after transformations are applied.
    // Fixes a browser implementation bug that returns incorrect bounding boxes for groups of svg elements.
    // Takes an (Object) `opt` argument (optional) with the following attributes:
    // (Object) `target` (optional): if not undefined, transform bounding boxes relative to `target`; if undefined, transform relative to this
    // (Boolean) `recursive` (optional): if true, recursively enter all groups and get a union of element bounding boxes (svg bbox fix); if false or undefined, return result of native function this.node.getBBox();
    V.prototype.getBBox = function(opt) {

        var options = {};

        var outputBBox;
        var node = this.node;
        var ownerSVGElement = node.ownerSVGElement;

        // If the element is not in the live DOM, it does not have a bounding box defined and
        // so fall back to 'zero' dimension element.
        if (!ownerSVGElement) {
            return g.Rect(0, 0, 0, 0);
        }

        if (opt) {
            if (opt.target) { // check if target exists
                options.target = V.toNode(opt.target); // works for V objects, jquery objects, and node objects
            }
            if (opt.recursive) {
                options.recursive = opt.recursive;
            }
        }

        if (!options.recursive) {
            try {
                outputBBox = node.getBBox();
            } catch (e) {
                // Fallback for IE.
                outputBBox = {
                    x: node.clientLeft,
                    y: node.clientTop,
                    width: node.clientWidth,
                    height: node.clientHeight
                };
            }

            if (!options.target) {
                // transform like this (that is, not at all)
                return g.Rect(outputBBox);
            } else {
                // transform like target
                var matrix = this.getTransformToElement(options.target);
                return V.transformRect(outputBBox, matrix);
            }
        } else { // if we want to calculate the bbox recursively
            // browsers report correct bbox around svg elements (one that envelops the path lines tightly)
            // but some browsers fail to report the same bbox when the elements are in a group (returning a looser bbox that also includes control points, like node.getClientRect())
            // this happens even if we wrap a single svg element into a group!
            // this option setting makes the function recursively enter all the groups from this and deeper, get bboxes of the elements inside, then return a union of those bboxes

            var children = this.children();
            var n = children.length;
            
            if (n === 0) {
                return this.getBBox({ target: options.target, recursive: false });
            }

            // recursion's initial pass-through setting:
            // recursive passes-through just keep the target as whatever was set up here during the initial pass-through
            if (!options.target) {
                // transform children/descendants like this (their parent/ancestor)
                options.target = this;
            } // else transform children/descendants like target

            for (var i = 0; i < n; i++) {
                var currentChild = children[i];

                var childBBox;

                // if currentChild is not a group element, get its bbox with a nonrecursive call
                if (currentChild.children().length === 0) {
                    childBBox = currentChild.getBBox({ target: options.target, recursive: false });
                }
                else {
                    // if currentChild is a group element (determined by checking the number of children), enter it with a recursive call
                    childBBox = currentChild.getBBox({ target: options.target, recursive: true });
                }

                if (!outputBBox) {
                    // if this is the first iteration
                    outputBBox = childBBox;
                } else {
                    // make a new bounding box rectangle that contains this child's bounding box and previous bounding box
                    outputBBox = outputBBox.union(childBBox);
                }
            }

            return outputBBox;
        }
    };

    V.prototype.text = function(content, opt) {

        // Replace all spaces with the Unicode No-break space (http://www.fileformat.info/info/unicode/char/a0/index.htm).
        // IE would otherwise collapse all spaces into one.
        content = V.sanitizeText(content);
        opt = opt || {};
        var eol = opt.eol;
        var lines = content.split('\n');
        var tspan;

        // An empty text gets rendered into the DOM in webkit-based browsers.
        // In order to unify this behaviour across all browsers
        // we rather hide the text element when it's empty.
        if (content) {
            this.removeAttr('display');
        } else {
            this.attr('display', 'none');
        }

        // Preserve spaces. In other words, we do not want consecutive spaces to get collapsed to one.
        this.attr('xml:space', 'preserve');

        // Easy way to erase all `<tspan>` children;
        this.node.textContent = '';

        var textNode = this.node;

        if (opt.textPath) {

            // Wrap the text in the SVG <textPath> element that points
            // to a path defined by `opt.textPath` inside the internal `<defs>` element.
            var defs = this.find('defs');
            if (defs.length === 0) {
                defs = V('defs');
                this.append(defs);
            }

            // If `opt.textPath` is a plain string, consider it to be directly the
            // SVG path data for the text to go along (this is a shortcut).
            // Otherwise if it is an object and contains the `d` property, then this is our path.
            var d = Object(opt.textPath) === opt.textPath ? opt.textPath.d : opt.textPath;
            if (d) {
                var path = V('path', { d: d });
                defs.append(path);
            }

            var textPath = V('textPath');
            // Set attributes on the `<textPath>`. The most important one
            // is the `xlink:href` that points to our newly created `<path/>` element in `<defs/>`.
            // Note that we also allow the following construct:
            // `t.text('my text', { textPath: { 'xlink:href': '#my-other-path' } })`.
            // In other words, one can completely skip the auto-creation of the path
            // and use any other arbitrary path that is in the document.
            if (!opt.textPath['xlink:href'] && path) {
                textPath.attr('xlink:href', '#' + path.node.id);
            }

            if (Object(opt.textPath) === opt.textPath) {
                textPath.attr(opt.textPath);
            }
            this.append(textPath);
            // Now all the `<tspan>`s will be inside the `<textPath>`.
            textNode = textPath.node;
        }

        var offset = 0;
        var x = ((opt.x !== undefined) ? opt.x : this.attr('x')) || 0;

        // Shift all the <tspan> but first by one line (`1em`)
        var lineHeight = opt.lineHeight || '1em';
        if (opt.lineHeight === 'auto') {
            lineHeight = '1.5em';
        }

        var firstLineHeight = 0;
        for (var i = 0; i < lines.length; i++) {

            var vLineAttributes = { 'class': 'v-line' };
            if (i === 0) {
                vLineAttributes.dy = '0em';
            } else {
                vLineAttributes.dy = lineHeight;
                vLineAttributes.x = x;
            }
            var vLine = V('tspan', vLineAttributes);

            var lastI = lines.length - 1;
            var line = lines[i];
            if (line) {

                // Get the line height based on the biggest font size in the annotations for this line.
                var maxFontSize = 0;
                if (opt.annotations) {

                    // Find the *compacted* annotations for this line.
                    var lineAnnotations = V.annotateString(lines[i], V.isArray(opt.annotations) ? opt.annotations : [opt.annotations], { offset: -offset, includeAnnotationIndices: opt.includeAnnotationIndices });

                    var lastJ = lineAnnotations.length - 1;
                    for (var j = 0; j < lineAnnotations.length; j++) {

                        var annotation = lineAnnotations[j];
                        if (V.isObject(annotation)) {

                            var fontSize = parseFloat(annotation.attrs['font-size']);
                            if (fontSize && fontSize > maxFontSize) {
                                maxFontSize = fontSize;
                            }

                            tspan = V('tspan', annotation.attrs);
                            if (opt.includeAnnotationIndices) {
                                // If `opt.includeAnnotationIndices` is `true`,
                                // set the list of indices of all the applied annotations
                                // in the `annotations` attribute. This list is a comma
                                // separated list of indices.
                                tspan.attr('annotations', annotation.annotations);
                            }
                            if (annotation.attrs['class']) {
                                tspan.addClass(annotation.attrs['class']);
                            }

                            if (eol && j === lastJ && i !== lastI) {
                                annotation.t += eol;
                            }
                            tspan.node.textContent = annotation.t;

                        } else {

                            if (eol && j === lastJ && i !== lastI) {
                                annotation += eol;
                            }
                            tspan = document.createTextNode(annotation || ' ');
                        }
                        vLine.append(tspan);
                    }

                    if (opt.lineHeight === 'auto' && maxFontSize && i !== 0) {

                        vLine.attr('dy', (maxFontSize * 1.2) + 'px');
                    }

                } else {

                    if (eol && i !== lastI) {
                        line += eol;
                    }

                    vLine.node.textContent = line;
                }

                if (i === 0) {
                    firstLineHeight = maxFontSize;
                }
            } else {

                // Make sure the textContent is never empty. If it is, add a dummy
                // character and make it invisible, making the following lines correctly
                // relatively positioned. `dy=1em` won't work with empty lines otherwise.
                vLine.addClass('v-empty-line');
                // 'opacity' needs to be specified with fill, stroke. Opacity without specification
                // is not applied in Firefox
                vLine.node.style.fillOpacity = 0;
                vLine.node.style.strokeOpacity = 0;
                vLine.node.textContent = '-';
            }

            V(textNode).append(vLine);

            offset += line.length + 1;      // + 1 = newline character.
        }

        // `alignment-baseline` does not work in Firefox.
        // Setting `dominant-baseline` on the `<text>` element doesn't work in IE9.
        // In order to have the 0,0 coordinate of the `<text>` element (or the first `<tspan>`)
        // in the top left corner we translate the `<text>` element by `0.8em`.
        // See `http://www.w3.org/Graphics/SVG/WG/wiki/How_to_determine_dominant_baseline`.
        // See also `http://apike.ca/prog_svg_text_style.html`.
        var y = this.attr('y');
        if (y === null) {
            this.attr('y', firstLineHeight || '0.8em');
        }

        return this;
    };

    /**
     * @public
     * @param {string} name
     * @returns {Vectorizer}
     */
    V.prototype.removeAttr = function(name) {

        var qualifiedName = V.qualifyAttr(name);
        var el = this.node;

        if (qualifiedName.ns) {
            if (el.hasAttributeNS(qualifiedName.ns, qualifiedName.local)) {
                el.removeAttributeNS(qualifiedName.ns, qualifiedName.local);
            }
        } else if (el.hasAttribute(name)) {
            el.removeAttribute(name);
        }
        return this;
    };

    V.prototype.attr = function(name, value) {

        if (V.isUndefined(name)) {

            // Return all attributes.
            var attributes = this.node.attributes;
            var attrs = {};

            for (var i = 0; i < attributes.length; i++) {
                attrs[attributes[i].name] = attributes[i].value;
            }

            return attrs;
        }

        if (V.isString(name) && V.isUndefined(value)) {
            return this.node.getAttribute(name);
        }

        if (typeof name === 'object') {

            for (var attrName in name) {
                if (name.hasOwnProperty(attrName)) {
                    this.setAttribute(attrName, name[attrName]);
                }
            }

        } else {

            this.setAttribute(name, value);
        }

        return this;
    };

    V.prototype.remove = function() {

        if (this.node.parentNode) {
            this.node.parentNode.removeChild(this.node);
        }

        return this;
    };

    V.prototype.empty = function() {

        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }

        return this;
    };

    /**
     * @private
     * @param {object} attrs
     * @returns {Vectorizer}
     */
    V.prototype.setAttributes = function(attrs) {

        for (var key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                this.setAttribute(key, attrs[key]);
            }
        }

        return this;
    };

    V.prototype.append = function(els) {

        if (!V.isArray(els)) {
            els = [els];
        }

        for (var i = 0, len = els.length; i < len; i++) {
            this.node.appendChild(V.toNode(els[i]));
        }

        return this;
    };

    V.prototype.prepend = function(els) {

        var child = this.node.firstChild;
        return child ? V(child).before(els) : this.append(els);
    };

    V.prototype.before = function(els) {

        var node = this.node;
        var parent = node.parentNode;

        if (parent) {

            if (!V.isArray(els)) {
                els = [els];
            }

            for (var i = 0, len = els.length; i < len; i++) {
                parent.insertBefore(V.toNode(els[i]), node);
            }
        }

        return this;
    };

    V.prototype.appendTo = function(node) {
        V.toNode(node).appendChild(this.node);
        return this;
    },

    V.prototype.svg = function() {

        return this.node instanceof window.SVGSVGElement ? this : V(this.node.ownerSVGElement);
    };

    V.prototype.defs = function() {

        var defs = this.svg().node.getElementsByTagName('defs');

        return (defs && defs.length) ? V(defs[0]) : undefined;
    };

    V.prototype.clone = function() {

        var clone = V(this.node.cloneNode(true/* deep */));
        // Note that clone inherits also ID. Therefore, we need to change it here.
        clone.node.id = V.uniqueId();
        return clone;
    };

    V.prototype.findOne = function(selector) {

        var found = this.node.querySelector(selector);
        return found ? V(found) : undefined;
    };

    V.prototype.find = function(selector) {

        var vels = [];
        var nodes = this.node.querySelectorAll(selector);

        if (nodes) {

            // Map DOM elements to `V`s.
            for (var i = 0; i < nodes.length; i++) {
                vels.push(V(nodes[i]));
            }
        }

        return vels;
    };

    // Returns an array of V elements made from children of this.node.
    V.prototype.children = function() {

        var children = this.node.childNodes;
        
        var outputArray = [];
        for (var i = 0; i < children.length; i++) {
            var currentChild = children[i];
            if (currentChild.nodeType === 1) {
                outputArray.push(V(children[i])); 
            }
        }
        return outputArray;
    };

    // Find an index of an element inside its container.
    V.prototype.index = function() {

        var index = 0;
        var node = this.node.previousSibling;

        while (node) {
            // nodeType 1 for ELEMENT_NODE
            if (node.nodeType === 1) index++;
            node = node.previousSibling;
        }

        return index;
    };

    V.prototype.findParentByClass = function(className, terminator) {

        var ownerSVGElement = this.node.ownerSVGElement;
        var node = this.node.parentNode;

        while (node && node !== terminator && node !== ownerSVGElement) {

            var vel = V(node);
            if (vel.hasClass(className)) {
                return vel;
            }

            node = node.parentNode;
        }

        return null;
    };

    // https://jsperf.com/get-common-parent
    V.prototype.contains = function(el) {

        var a = this.node;
        var b = V.toNode(el);
        var bup = b && b.parentNode;

        return (a === bup) || !!(bup && bup.nodeType === 1 && (a.compareDocumentPosition(bup) & 16));
    };

    // Convert global point into the coordinate space of this element.
    V.prototype.toLocalPoint = function(x, y) {

        var svg = this.svg().node;

        var p = svg.createSVGPoint();
        p.x = x;
        p.y = y;

        try {

            var globalPoint = p.matrixTransform(svg.getScreenCTM().inverse());
            var globalToLocalMatrix = this.getTransformToElement(svg).inverse();

        } catch (e) {
            // IE9 throws an exception in odd cases. (`Unexpected call to method or property access`)
            // We have to make do with the original coordianates.
            return p;
        }

        return globalPoint.matrixTransform(globalToLocalMatrix);
    };

    V.prototype.translateCenterToPoint = function(p) {

        var bbox = this.getBBox({ target: this.svg() });
        var center = bbox.center();

        this.translate(p.x - center.x, p.y - center.y);
        return this;
    };

    // Efficiently auto-orient an element. This basically implements the orient=auto attribute
    // of markers. The easiest way of understanding on what this does is to imagine the element is an
    // arrowhead. Calling this method on the arrowhead makes it point to the `position` point while
    // being auto-oriented (properly rotated) towards the `reference` point.
    // `target` is the element relative to which the transformations are applied. Usually a viewport.
    V.prototype.translateAndAutoOrient = function(position, reference, target) {

        // Clean-up previously set transformations except the scale. If we didn't clean up the
        // previous transformations then they'd add up with the old ones. Scale is an exception as
        // it doesn't add up, consider: `this.scale(2).scale(2).scale(2)`. The result is that the
        // element is scaled by the factor 2, not 8.

        var s = this.scale();
        this.attr('transform', '');
        this.scale(s.sx, s.sy);

        var svg = this.svg().node;
        var bbox = this.getBBox({ target: target || svg });

        // 1. Translate to origin.
        var translateToOrigin = svg.createSVGTransform();
        translateToOrigin.setTranslate(-bbox.x - bbox.width / 2, -bbox.y - bbox.height / 2);

        // 2. Rotate around origin.
        var rotateAroundOrigin = svg.createSVGTransform();
        var angle = g.point(position).changeInAngle(position.x - reference.x, position.y - reference.y, reference);
        rotateAroundOrigin.setRotate(angle, 0, 0);

        // 3. Translate to the `position` + the offset (half my width) towards the `reference` point.
        var translateFinal = svg.createSVGTransform();
        var finalPosition = g.point(position).move(reference, bbox.width / 2);
        translateFinal.setTranslate(position.x + (position.x - finalPosition.x), position.y + (position.y - finalPosition.y));

        // 4. Apply transformations.
        var ctm = this.getTransformToElement(target || svg);
        var transform = svg.createSVGTransform();
        transform.setMatrix(
            translateFinal.matrix.multiply(
                rotateAroundOrigin.matrix.multiply(
                    translateToOrigin.matrix.multiply(
                        ctm)))
        );

        // Instead of directly setting the `matrix()` transform on the element, first, decompose
        // the matrix into separate transforms. This allows us to use normal Vectorizer methods
        // as they don't work on matrices. An example of this is to retrieve a scale of an element.
        // this.node.transform.baseVal.initialize(transform);

        var decomposition = V.decomposeMatrix(transform.matrix);

        this.translate(decomposition.translateX, decomposition.translateY);
        this.rotate(decomposition.rotation);
        // Note that scale has been already applied, hence the following line stays commented. (it's here just for reference).
        //this.scale(decomposition.scaleX, decomposition.scaleY);

        return this;
    };

    V.prototype.animateAlongPath = function(attrs, path) {

        path = V.toNode(path);

        var id = V.ensureId(path);
        var animateMotion = V('animateMotion', attrs);
        var mpath = V('mpath', { 'xlink:href': '#' + id });

        animateMotion.append(mpath);

        this.append(animateMotion);
        try {
            animateMotion.node.beginElement();
        } catch (e) {
            // Fallback for IE 9.
            // Run the animation programatically if FakeSmile (`http://leunen.me/fakesmile/`) present
            if (document.documentElement.getAttribute('smiling') === 'fake') {

                // Register the animation. (See `https://answers.launchpad.net/smil/+question/203333`)
                var animation = animateMotion.node;
                animation.animators = [];

                var animationID = animation.getAttribute('id');
                if (animationID) id2anim[animationID] = animation;

                var targets = getTargets(animation);
                for (var i = 0, len = targets.length; i < len; i++) {
                    var target = targets[i];
                    var animator = new Animator(animation, target, i);
                    animators.push(animator);
                    animation.animators[i] = animator;
                    animator.register();
                }
            }
        }
        return this;
    };

    V.prototype.hasClass = function(className) {

        return new RegExp('(\\s|^)' + className + '(\\s|$)').test(this.node.getAttribute('class'));
    };

    V.prototype.addClass = function(className) {

        if (!this.hasClass(className)) {
            var prevClasses = this.node.getAttribute('class') || '';
            this.node.setAttribute('class', (prevClasses + ' ' + className).trim());
        }

        return this;
    };

    V.prototype.removeClass = function(className) {

        if (this.hasClass(className)) {
            var newClasses = this.node.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
            this.node.setAttribute('class', newClasses);
        }

        return this;
    };

    V.prototype.toggleClass = function(className, toAdd) {

        var toRemove = V.isUndefined(toAdd) ? this.hasClass(className) : !toAdd;

        if (toRemove) {
            this.removeClass(className);
        } else {
            this.addClass(className);
        }

        return this;
    };

    // Interpolate path by discrete points. The precision of the sampling
    // is controlled by `interval`. In other words, `sample()` will generate
    // a point on the path starting at the beginning of the path going to the end
    // every `interval` pixels.
    // The sampler can be very useful for e.g. finding intersection between two
    // paths (finding the two closest points from two samples).
    V.prototype.sample = function(interval) {

        interval = interval || 1;
        var node = this.node;
        var length = node.getTotalLength();
        var samples = [];
        var distance = 0;
        var sample;
        while (distance < length) {
            sample = node.getPointAtLength(distance);
            samples.push({ x: sample.x, y: sample.y, distance: distance });
            distance += interval;
        }
        return samples;
    };

    V.prototype.convertToPath = function() {

        var path = V('path');
        path.attr(this.attr());
        var d = this.convertToPathData();
        if (d) {
            path.attr('d', d);
        }
        return path;
    };

    V.prototype.convertToPathData = function() {

        var tagName = this.node.tagName.toUpperCase();

        switch (tagName) {
            case 'PATH':
                return this.attr('d');
            case 'LINE':
                return V.convertLineToPathData(this.node);
            case 'POLYGON':
                return V.convertPolygonToPathData(this.node);
            case 'POLYLINE':
                return V.convertPolylineToPathData(this.node);
            case 'ELLIPSE':
                return V.convertEllipseToPathData(this.node);
            case 'CIRCLE':
                return V.convertCircleToPathData(this.node);
            case 'RECT':
                return V.convertRectToPathData(this.node);
        }

        throw new Error(tagName + ' cannot be converted to PATH.');
    };

    // Find the intersection of a line starting in the center
    // of the SVG `node` ending in the point `ref`.
    // `target` is an SVG element to which `node`s transformations are relative to.
    // In JointJS, `target` is the `paper.viewport` SVG group element.
    // Note that `ref` point must be in the coordinate system of the `target` for this function to work properly.
    // Returns a point in the `target` coordinte system (the same system as `ref` is in) if
    // an intersection is found. Returns `undefined` otherwise.
    V.prototype.findIntersection = function(ref, target) {

        var svg = this.svg().node;
        target = target || svg;
        var bbox = this.getBBox({ target: target });
        var center = bbox.center();

        if (!bbox.intersectionWithLineFromCenterToPoint(ref)) return undefined;

        var spot;
        var tagName = this.node.localName.toUpperCase();

        // Little speed up optimalization for `<rect>` element. We do not do conversion
        // to path element and sampling but directly calculate the intersection through
        // a transformed geometrical rectangle.
        if (tagName === 'RECT') {

            var gRect = g.rect(
                parseFloat(this.attr('x') || 0),
                parseFloat(this.attr('y') || 0),
                parseFloat(this.attr('width')),
                parseFloat(this.attr('height'))
            );
            // Get the rect transformation matrix with regards to the SVG document.
            var rectMatrix = this.getTransformToElement(target);
            // Decompose the matrix to find the rotation angle.
            var rectMatrixComponents = V.decomposeMatrix(rectMatrix);
            // Now we want to rotate the rectangle back so that we
            // can use `intersectionWithLineFromCenterToPoint()` passing the angle as the second argument.
            var resetRotation = svg.createSVGTransform();
            resetRotation.setRotate(-rectMatrixComponents.rotation, center.x, center.y);
            var rect = V.transformRect(gRect, resetRotation.matrix.multiply(rectMatrix));
            spot = g.rect(rect).intersectionWithLineFromCenterToPoint(ref, rectMatrixComponents.rotation);

        } else if (tagName === 'PATH' || tagName === 'POLYGON' || tagName === 'POLYLINE' || tagName === 'CIRCLE' || tagName === 'ELLIPSE') {

            var pathNode = (tagName === 'PATH') ? this : this.convertToPath();
            var samples = pathNode.sample();
            var minDistance = Infinity;
            var closestSamples = [];

            var i, sample, gp, centerDistance, refDistance, distance;

            for (i = 0; i < samples.length; i++) {

                sample = samples[i];
                // Convert the sample point in the local coordinate system to the global coordinate system.
                gp = V.createSVGPoint(sample.x, sample.y);
                gp = gp.matrixTransform(this.getTransformToElement(target));
                sample = g.point(gp);
                centerDistance = sample.distance(center);
                // Penalize a higher distance to the reference point by 10%.
                // This gives better results. This is due to
                // inaccuracies introduced by rounding errors and getPointAtLength() returns.
                refDistance = sample.distance(ref) * 1.1;
                distance = centerDistance + refDistance;

                if (distance < minDistance) {
                    minDistance = distance;
                    closestSamples = [{ sample: sample, refDistance: refDistance }];
                } else if (distance < minDistance + 1) {
                    closestSamples.push({ sample: sample, refDistance: refDistance });
                }
            }

            closestSamples.sort(function(a, b) {
                return a.refDistance - b.refDistance;
            });

            if (closestSamples[0]) {
                spot = closestSamples[0].sample;
            }
        }

        return spot;
    };

    /**
     * @private
     * @param {string} name
     * @param {string} value
     * @returns {Vectorizer}
     */
    V.prototype.setAttribute = function(name, value) {

        var el = this.node;

        if (value === null) {
            this.removeAttr(name);
            return this;
        }

        var qualifiedName = V.qualifyAttr(name);

        if (qualifiedName.ns) {
            // Attribute names can be namespaced. E.g. `image` elements
            // have a `xlink:href` attribute to set the source of the image.
            el.setAttributeNS(qualifiedName.ns, name, value);
        } else if (name === 'id') {
            el.id = value;
        } else {
            el.setAttribute(name, value);
        }

        return this;
    };

    // Create an SVG document element.
    // If `content` is passed, it will be used as the SVG content of the `<svg>` root element.
    V.createSvgDocument = function(content) {

        var svg = '<svg xmlns="' + ns.xmlns + '" xmlns:xlink="' + ns.xlink + '" version="' + SVGversion + '">' + (content || '') + '</svg>';
        var xml = V.parseXML(svg, { async: false });
        return xml.documentElement;
    };

    V.idCounter = 0;

    // A function returning a unique identifier for this client session with every call.
    V.uniqueId = function() {

        return 'v-' + (++V.idCounter);
    };

    V.toNode = function(el) {
        return V.isV(el) ? el.node : (el.nodeName && el || el[0]);
    };

    V.ensureId = function(node) {
        node = V.toNode(node);
        return node.id || (node.id = V.uniqueId());
    };
    // Replace all spaces with the Unicode No-break space (http://www.fileformat.info/info/unicode/char/a0/index.htm).
    // IE would otherwise collapse all spaces into one. This is used in the text() method but it is
    // also exposed so that the programmer can use it in case he needs to. This is useful e.g. in tests
    // when you want to compare the actual DOM text content without having to add the unicode character in
    // the place of all spaces.
    V.sanitizeText = function(text) {

        return (text || '').replace(/ /g, '\u00A0');
    };

    V.isUndefined = function(value) {

        return typeof value === 'undefined';
    };

    V.isString = function(value) {

        return typeof value === 'string';
    };

    V.isObject = function(value) {

        return value && (typeof value === 'object');
    };

    V.isArray = Array.isArray;

    V.parseXML = function(data, opt) {

        opt = opt || {};

        var xml;

        try {
            var parser = new DOMParser();

            if (!V.isUndefined(opt.async)) {
                parser.async = opt.async;
            }

            xml = parser.parseFromString(data, 'text/xml');
        } catch (error) {
            xml = undefined;
        }

        if (!xml || xml.getElementsByTagName('parsererror').length) {
            throw new Error('Invalid XML: ' + data);
        }

        return xml;
    };

    /**
     * @param {string} name
     * @returns {{ns: string|null, local: string}} namespace and attribute name
     */
    V.qualifyAttr = function(name) {

        if (name.indexOf(':') !== -1) {
            var combinedKey = name.split(':');
            return {
                ns: ns[combinedKey[0]],
                local: combinedKey[1]
            };
        }

        return {
            ns: null,
            local: name
        };
    };

    V.transformRegex = /(\w+)\(([^,)]+),?([^)]+)?\)/gi;
    V.transformSeparatorRegex = /[ ,]+/;
    V.transformationListRegex = /^(\w+)\((.*)\)/;

    V.transformStringToMatrix = function(transform) {

        var transformationMatrix = V.createSVGMatrix();
        var matches = transform && transform.match(V.transformRegex);
        if (!matches) {
            return transformationMatrix;
        }

        for (var i = 0, n = matches.length; i < n; i++) {
            var transformationString = matches[i];

            var transformationMatch = transformationString.match(V.transformationListRegex);
            if (transformationMatch) {
                var sx, sy, tx, ty, angle;
                var ctm = V.createSVGMatrix();
                var args = transformationMatch[2].split(V.transformSeparatorRegex);
                switch (transformationMatch[1].toLowerCase()) {
                    case 'scale':
                        sx = parseFloat(args[0]);
                        sy = (args[1] === undefined) ? sx : parseFloat(args[1]);
                        ctm = ctm.scaleNonUniform(sx, sy);
                        break;
                    case 'translate':
                        tx = parseFloat(args[0]);
                        ty = parseFloat(args[1]);
                        ctm = ctm.translate(tx, ty);
                        break;
                    case 'rotate':
                        angle = parseFloat(args[0]);
                        tx = parseFloat(args[1]) || 0;
                        ty = parseFloat(args[2]) || 0;
                        if (tx !== 0 || ty !== 0) {
                            ctm = ctm.translate(tx, ty).rotate(angle).translate(-tx, -ty);
                        } else {
                            ctm = ctm.rotate(angle);
                        }
                        break;
                    case 'skewx':
                        angle = parseFloat(args[0]);
                        ctm = ctm.skewX(angle);
                        break;
                    case 'skewy':
                        angle = parseFloat(args[0]);
                        ctm = ctm.skewY(angle);
                        break;
                    case 'matrix':
                        ctm.a = parseFloat(args[0]);
                        ctm.b = parseFloat(args[1]);
                        ctm.c = parseFloat(args[2]);
                        ctm.d = parseFloat(args[3]);
                        ctm.e = parseFloat(args[4]);
                        ctm.f = parseFloat(args[5]);
                        break;
                    default:
                        continue;
                }

                transformationMatrix = transformationMatrix.multiply(ctm);
            }

        }
        return transformationMatrix;
    };

    V.matrixToTransformString = function(matrix) {
        matrix || (matrix = true);

        return 'matrix(' +
            (matrix.a !== undefined ? matrix.a : 1) + ',' +
            (matrix.b !== undefined ? matrix.b : 0) + ',' +
            (matrix.c !== undefined ? matrix.c : 0) + ',' +
            (matrix.d !== undefined ? matrix.d : 1) + ',' +
            (matrix.e !== undefined ? matrix.e : 0) + ',' +
            (matrix.f !== undefined ? matrix.f : 0) +
            ')';
    };

    V.parseTransformString = function(transform) {

        var translate, rotate, scale;

        if (transform) {

            var separator = V.transformSeparatorRegex;

            // Allow reading transform string with a single matrix
            if (transform.trim().indexOf('matrix') >= 0) {

                var matrix = V.transformStringToMatrix(transform);
                var decomposedMatrix = V.decomposeMatrix(matrix);

                translate = [decomposedMatrix.translateX, decomposedMatrix.translateY];
                scale = [decomposedMatrix.scaleX, decomposedMatrix.scaleY];
                rotate = [decomposedMatrix.rotation];

                var transformations = [];
                if (translate[0] !== 0 ||  translate[0] !== 0) {
                    transformations.push('translate(' + translate + ')');
                }
                if (scale[0] !== 1 ||  scale[1] !== 1) {
                    transformations.push('scale(' + scale + ')');
                }
                if (rotate[0] !== 0) {
                    transformations.push('rotate(' + rotate + ')');
                }
                transform = transformations.join(' ');

            } else {

                var translateMatch = transform.match(/translate\((.*?)\)/);
                if (translateMatch) {
                    translate = translateMatch[1].split(separator);
                }
                var rotateMatch = transform.match(/rotate\((.*?)\)/);
                if (rotateMatch) {
                    rotate = rotateMatch[1].split(separator);
                }
                var scaleMatch = transform.match(/scale\((.*?)\)/);
                if (scaleMatch) {
                    scale = scaleMatch[1].split(separator);
                }
            }
        }

        var sx = (scale && scale[0]) ? parseFloat(scale[0]) : 1;

        return {
            value: transform,
            translate: {
                tx: (translate && translate[0]) ? parseInt(translate[0], 10) : 0,
                ty: (translate && translate[1]) ? parseInt(translate[1], 10) : 0
            },
            rotate: {
                angle: (rotate && rotate[0]) ? parseInt(rotate[0], 10) : 0,
                cx: (rotate && rotate[1]) ? parseInt(rotate[1], 10) : undefined,
                cy: (rotate && rotate[2]) ? parseInt(rotate[2], 10) : undefined
            },
            scale: {
                sx: sx,
                sy: (scale && scale[1]) ? parseFloat(scale[1]) : sx
            }
        };
    };

    V.deltaTransformPoint = function(matrix, point) {

        var dx = point.x * matrix.a + point.y * matrix.c + 0;
        var dy = point.x * matrix.b + point.y * matrix.d + 0;
        return { x: dx, y: dy };
    };

    V.decomposeMatrix = function(matrix) {

        // @see https://gist.github.com/2052247

        // calculate delta transform point
        var px = V.deltaTransformPoint(matrix, { x: 0, y: 1 });
        var py = V.deltaTransformPoint(matrix, { x: 1, y: 0 });

        // calculate skew
        var skewX = ((180 / Math.PI) * Math.atan2(px.y, px.x) - 90);
        var skewY = ((180 / Math.PI) * Math.atan2(py.y, py.x));

        return {

            translateX: matrix.e,
            translateY: matrix.f,
            scaleX: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b),
            scaleY: Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d),
            skewX: skewX,
            skewY: skewY,
            rotation: skewX // rotation is the same as skew x
        };
    };

    // Return the `scale` transformation from the following equation:
    // `translate(tx, ty) . rotate(angle) . scale(sx, sy) === matrix(a,b,c,d,e,f)`
    V.matrixToScale = function(matrix) {

        var a,b,c,d;
        if (matrix) {
            a = V.isUndefined(matrix.a) ? 1 : matrix.a;
            d = V.isUndefined(matrix.d) ? 1 : matrix.d;
            b = matrix.b;
            c = matrix.c;
        } else {
            a = d = 1;
        }
        return {
            sx: b ? Math.sqrt(a * a + b * b) : a,
            sy: c ? Math.sqrt(c * c + d * d) : d
        };
    },

    // Return the `rotate` transformation from the following equation:
    // `translate(tx, ty) . rotate(angle) . scale(sx, sy) === matrix(a,b,c,d,e,f)`
    V.matrixToRotate = function(matrix) {

        var p = { x: 0, y: 1 };
        if (matrix) {
            p =  V.deltaTransformPoint(matrix, p);
        }

        return {
            angle: g.normalizeAngle(g.toDeg(Math.atan2(p.y, p.x)) - 90)
        };
    },

    // Return the `translate` transformation from the following equation:
    // `translate(tx, ty) . rotate(angle) . scale(sx, sy) === matrix(a,b,c,d,e,f)`
    V.matrixToTranslate = function(matrix) {

        return {
            tx: (matrix && matrix.e) || 0,
            ty: (matrix && matrix.f) || 0
        };
    },

    V.isV = function(object) {

        return object instanceof V;
    };

    // For backwards compatibility:
    V.isVElement = V.isV;

    var svgDocument = V('svg').node;

    V.createSVGMatrix = function(matrix) {

        var svgMatrix = svgDocument.createSVGMatrix();
        for (var component in matrix) {
            svgMatrix[component] = matrix[component];
        }

        return svgMatrix;
    };

    V.createSVGTransform = function(matrix) {

        if (!V.isUndefined(matrix)) {

            if (!(matrix instanceof SVGMatrix)) {
                matrix = V.createSVGMatrix(matrix);
            }

            return svgDocument.createSVGTransformFromMatrix(matrix);
        }

        return svgDocument.createSVGTransform();
    };

    V.createSVGPoint = function(x, y) {

        var p = svgDocument.createSVGPoint();
        p.x = x;
        p.y = y;
        return p;
    };

    V.transformRect = function(r, matrix) {

        var p = svgDocument.createSVGPoint();

        p.x = r.x;
        p.y = r.y;
        var corner1 = p.matrixTransform(matrix);

        p.x = r.x + r.width;
        p.y = r.y;
        var corner2 = p.matrixTransform(matrix);

        p.x = r.x + r.width;
        p.y = r.y + r.height;
        var corner3 = p.matrixTransform(matrix);

        p.x = r.x;
        p.y = r.y + r.height;
        var corner4 = p.matrixTransform(matrix);

        var minX = Math.min(corner1.x, corner2.x, corner3.x, corner4.x);
        var maxX = Math.max(corner1.x, corner2.x, corner3.x, corner4.x);
        var minY = Math.min(corner1.y, corner2.y, corner3.y, corner4.y);
        var maxY = Math.max(corner1.y, corner2.y, corner3.y, corner4.y);

        return g.Rect(minX, minY, maxX - minX, maxY - minY);
    };

    V.transformPoint = function(p, matrix) {

        return g.Point(V.createSVGPoint(p.x, p.y).matrixTransform(matrix));
    };

    // Convert a style represented as string (e.g. `'fill="blue"; stroke="red"'`) to
    // an object (`{ fill: 'blue', stroke: 'red' }`).
    V.styleToObject = function(styleString) {
        var ret = {};
        var styles = styleString.split(';');
        for (var i = 0; i < styles.length; i++) {
            var style = styles[i];
            var pair = style.split('=');
            ret[pair[0].trim()] = pair[1].trim();
        }
        return ret;
    };

    // Inspired by d3.js https://github.com/mbostock/d3/blob/master/src/svg/arc.js
    V.createSlicePathData = function(innerRadius, outerRadius, startAngle, endAngle) {

        var svgArcMax = 2 * Math.PI - 1e-6;
        var r0 = innerRadius;
        var r1 = outerRadius;
        var a0 = startAngle;
        var a1 = endAngle;
        var da = (a1 < a0 && (da = a0, a0 = a1, a1 = da), a1 - a0);
        var df = da < Math.PI ? '0' : '1';
        var c0 = Math.cos(a0);
        var s0 = Math.sin(a0);
        var c1 = Math.cos(a1);
        var s1 = Math.sin(a1);

        return (da >= svgArcMax)
            ? (r0
               ? 'M0,' + r1
               + 'A' + r1 + ',' + r1 + ' 0 1,1 0,' + (-r1)
               + 'A' + r1 + ',' + r1 + ' 0 1,1 0,' + r1
               + 'M0,' + r0
               + 'A' + r0 + ',' + r0 + ' 0 1,0 0,' + (-r0)
               + 'A' + r0 + ',' + r0 + ' 0 1,0 0,' + r0
               + 'Z'
               : 'M0,' + r1
               + 'A' + r1 + ',' + r1 + ' 0 1,1 0,' + (-r1)
               + 'A' + r1 + ',' + r1 + ' 0 1,1 0,' + r1
               + 'Z')
            : (r0
               ? 'M' + r1 * c0 + ',' + r1 * s0
               + 'A' + r1 + ',' + r1 + ' 0 ' + df + ',1 ' + r1 * c1 + ',' + r1 * s1
               + 'L' + r0 * c1 + ',' + r0 * s1
               + 'A' + r0 + ',' + r0 + ' 0 ' + df + ',0 ' + r0 * c0 + ',' + r0 * s0
               + 'Z'
               : 'M' + r1 * c0 + ',' + r1 * s0
               + 'A' + r1 + ',' + r1 + ' 0 ' + df + ',1 ' + r1 * c1 + ',' + r1 * s1
               + 'L0,0'
               + 'Z');
    };

    // Merge attributes from object `b` with attributes in object `a`.
    // Note that this modifies the object `a`.
    // Also important to note that attributes are merged but CSS classes are concatenated.
    V.mergeAttrs = function(a, b) {

        for (var attr in b) {

            if (attr === 'class') {
                // Concatenate classes.
                a[attr] = a[attr] ? a[attr] + ' ' + b[attr] : b[attr];
            } else if (attr === 'style') {
                // `style` attribute can be an object.
                if (V.isObject(a[attr]) && V.isObject(b[attr])) {
                    // `style` stored in `a` is an object.
                    a[attr] = V.mergeAttrs(a[attr], b[attr]);
                } else if (V.isObject(a[attr])) {
                    // `style` in `a` is an object but it's a string in `b`.
                    // Convert the style represented as a string to an object in `b`.
                    a[attr] = V.mergeAttrs(a[attr], V.styleToObject(b[attr]));
                } else if (V.isObject(b[attr])) {
                    // `style` in `a` is a string, in `b` it's an object.
                    a[attr] = V.mergeAttrs(V.styleToObject(a[attr]), b[attr]);
                } else {
                    // Both styles are strings.
                    a[attr] = V.mergeAttrs(V.styleToObject(a[attr]), V.styleToObject(b[attr]));
                }
            } else {
                a[attr] = b[attr];
            }
        }

        return a;
    };

    V.annotateString = function(t, annotations, opt) {

        annotations = annotations || [];
        opt = opt || {};

        var offset = opt.offset || 0;
        var compacted = [];
        var batch;
        var ret = [];
        var item;
        var prev;

        for (var i = 0; i < t.length; i++) {

            item = ret[i] = t[i];

            for (var j = 0; j < annotations.length; j++) {

                var annotation = annotations[j];
                var start = annotation.start + offset;
                var end = annotation.end + offset;

                if (i >= start && i < end) {
                    // Annotation applies.
                    if (V.isObject(item)) {
                        // There is more than one annotation to be applied => Merge attributes.
                        item.attrs = V.mergeAttrs(V.mergeAttrs({}, item.attrs), annotation.attrs);
                    } else {
                        item = ret[i] = { t: t[i], attrs: annotation.attrs };
                    }
                    if (opt.includeAnnotationIndices) {
                        (item.annotations || (item.annotations = [])).push(j);
                    }
                }
            }

            prev = ret[i - 1];

            if (!prev) {

                batch = item;

            } else if (V.isObject(item) && V.isObject(prev)) {
                // Both previous item and the current one are annotations. If the attributes
                // didn't change, merge the text.
                if (JSON.stringify(item.attrs) === JSON.stringify(prev.attrs)) {
                    batch.t += item.t;
                } else {
                    compacted.push(batch);
                    batch = item;
                }

            } else if (V.isObject(item)) {
                // Previous item was a string, current item is an annotation.
                compacted.push(batch);
                batch = item;

            } else if (V.isObject(prev)) {
                // Previous item was an annotation, current item is a string.
                compacted.push(batch);
                batch = item;

            } else {
                // Both previous and current item are strings.
                batch = (batch || '') + item;
            }
        }

        if (batch) {
            compacted.push(batch);
        }

        return compacted;
    };

    V.findAnnotationsAtIndex = function(annotations, index) {

        var found = [];

        if (annotations) {

            annotations.forEach(function(annotation) {

                if (annotation.start < index && index <= annotation.end) {
                    found.push(annotation);
                }
            });
        }

        return found;
    };

    V.findAnnotationsBetweenIndexes = function(annotations, start, end) {

        var found = [];

        if (annotations) {

            annotations.forEach(function(annotation) {

                if ((start >= annotation.start && start < annotation.end) || (end > annotation.start && end <= annotation.end) || (annotation.start >= start && annotation.end < end)) {
                    found.push(annotation);
                }
            });
        }

        return found;
    };

    // Shift all the text annotations after character `index` by `offset` positions.
    V.shiftAnnotations = function(annotations, index, offset) {

        if (annotations) {

            annotations.forEach(function(annotation) {

                if (annotation.start < index && annotation.end >= index) {
                    annotation.end += offset;
                } else if (annotation.start >= index) {
                    annotation.start += offset;
                    annotation.end += offset;
                }
            });
        }

        return annotations;
    };

    V.convertLineToPathData = function(line) {

        line = V(line);
        var d = [
            'M', line.attr('x1'), line.attr('y1'),
            'L', line.attr('x2'), line.attr('y2')
        ].join(' ');
        return d;
    };

    V.convertPolygonToPathData = function(polygon) {

        var points = V.getPointsFromSvgNode(V(polygon).node);

        if (!(points.length > 0)) return null;

        return V.svgPointsToPath(points) + ' Z';
    };

    V.convertPolylineToPathData = function(polyline) {

        var points = V.getPointsFromSvgNode(V(polyline).node);

        if (!(points.length > 0)) return null;

        return V.svgPointsToPath(points);
    };

    V.svgPointsToPath = function(points) {

        var i;

        for (i = 0; i < points.length; i++) {
            points[i] = points[i].x + ' ' + points[i].y;
        }

        return 'M ' + points.join(' L');
    };

    V.getPointsFromSvgNode = function(node) {

        node = V.toNode(node);
        var points = [];
        var nodePoints = node.points;
        if (nodePoints) {
            for (var i = 0; i < nodePoints.numberOfItems; i++) {
                points.push(nodePoints.getItem(i));
            }
        }

        return points;
    };

    V.KAPPA = 0.5522847498307935;

    V.convertCircleToPathData = function(circle) {

        circle = V(circle);
        var cx = parseFloat(circle.attr('cx')) || 0;
        var cy = parseFloat(circle.attr('cy')) || 0;
        var r = parseFloat(circle.attr('r'));
        var cd = r * V.KAPPA; // Control distance.

        var d = [
            'M', cx, cy - r,    // Move to the first point.
            'C', cx + cd, cy - r, cx + r, cy - cd, cx + r, cy, // I. Quadrant.
            'C', cx + r, cy + cd, cx + cd, cy + r, cx, cy + r, // II. Quadrant.
            'C', cx - cd, cy + r, cx - r, cy + cd, cx - r, cy, // III. Quadrant.
            'C', cx - r, cy - cd, cx - cd, cy - r, cx, cy - r, // IV. Quadrant.
            'Z'
        ].join(' ');
        return d;
    };

    V.convertEllipseToPathData = function(ellipse) {

        ellipse = V(ellipse);
        var cx = parseFloat(ellipse.attr('cx')) || 0;
        var cy = parseFloat(ellipse.attr('cy')) || 0;
        var rx = parseFloat(ellipse.attr('rx'));
        var ry = parseFloat(ellipse.attr('ry')) || rx;
        var cdx = rx * V.KAPPA; // Control distance x.
        var cdy = ry * V.KAPPA; // Control distance y.

        var d = [
            'M', cx, cy - ry,    // Move to the first point.
            'C', cx + cdx, cy - ry, cx + rx, cy - cdy, cx + rx, cy, // I. Quadrant.
            'C', cx + rx, cy + cdy, cx + cdx, cy + ry, cx, cy + ry, // II. Quadrant.
            'C', cx - cdx, cy + ry, cx - rx, cy + cdy, cx - rx, cy, // III. Quadrant.
            'C', cx - rx, cy - cdy, cx - cdx, cy - ry, cx, cy - ry, // IV. Quadrant.
            'Z'
        ].join(' ');
        return d;
    };

    V.convertRectToPathData = function(rect) {

        rect = V(rect);

        return V.rectToPath({
            x: parseFloat(rect.attr('x')) || 0,
            y: parseFloat(rect.attr('y')) || 0,
            width: parseFloat(rect.attr('width')) || 0,
            height: parseFloat(rect.attr('height')) || 0,
            rx: parseFloat(rect.attr('rx')) || 0,
            ry: parseFloat(rect.attr('ry')) || 0
        });
    };

    // Convert a rectangle to SVG path commands. `r` is an object of the form:
    // `{ x: [number], y: [number], width: [number], height: [number], top-ry: [number], top-ry: [number], bottom-rx: [number], bottom-ry: [number] }`,
    // where `x, y, width, height` are the usual rectangle attributes and [top-/bottom-]rx/ry allows for
    // specifying radius of the rectangle for all its sides (as opposed to the built-in SVG rectangle
    // that has only `rx` and `ry` attributes).
    V.rectToPath = function(r) {

        var d;
        var x = r.x;
        var y = r.y;
        var width = r.width;
        var height = r.height;
        var topRx = Math.min(r.rx || r['top-rx'] || 0, width / 2);
        var bottomRx = Math.min(r.rx || r['bottom-rx'] || 0, width / 2);
        var topRy = Math.min(r.ry || r['top-ry'] || 0, height / 2);
        var bottomRy = Math.min(r.ry || r['bottom-ry'] || 0, height / 2);

        if (topRx || bottomRx || topRy || bottomRy) {
            d = [
                'M', x, y + topRy,
                'v', height - topRy - bottomRy,
                'a', bottomRx, bottomRy, 0, 0, 0, bottomRx, bottomRy,
                'h', width - 2 * bottomRx,
                'a', bottomRx, bottomRy, 0, 0, 0, bottomRx, -bottomRy,
                'v', -(height - bottomRy - topRy),
                'a', topRx, topRy, 0, 0, 0, -topRx, -topRy,
                'h', -(width - 2 * topRx),
                'a', topRx, topRy, 0, 0, 0, -topRx, topRy,
                'Z'
            ];
        } else {
            d = [
                'M', x, y,
                'H', x + width,
                'V', y + height,
                'H', x,
                'V', y,
                'Z'
            ];
        }

        return d.join(' ');
    };

    V.namespace = ns;

    return V;

})();


    return V;

}));
