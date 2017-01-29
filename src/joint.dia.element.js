// joint.dia.Element base model.
// -----------------------------

joint.dia.Element = joint.dia.Cell.extend({

    defaults: {
        position: { x: 0, y: 0 },
        size: { width: 1, height: 1 },
        angle: 0
    },

    initialize: function() {

        this._initializePorts();
        joint.dia.Cell.prototype.initialize.apply(this, arguments);
    },

    /**
     * @abstract
     */
    _initializePorts: function() {
        // implemented in ports.js
    },

    isElement: function() {

        return true;
    },

    position: function(x, y, opt) {

        var isSetter = _.isNumber(y);

        opt = (isSetter ? opt : x) || {};

        // option `parentRelative` for setting the position relative to the element's parent.
        if (opt.parentRelative) {

            // Getting the parent's position requires the collection.
            // Cell.get('parent') helds cell id only.
            if (!this.graph) throw new Error('Element must be part of a graph.');

            var parent = this.graph.getCell(this.get('parent'));
            var parentPosition = parent && !parent.isLink()
                ? parent.get('position')
                : { x: 0, y: 0 };
        }

        if (isSetter) {

            if (opt.parentRelative) {
                x += parentPosition.x;
                y += parentPosition.y;
            }

            return this.set('position', { x: x, y: y }, opt);

        } else { // Getter returns a geometry point.

            var elementPosition = g.point(this.get('position'));

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
            // recalculate the translation taking the resctrictions into account.
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

            if (!_.isObject(opt.transition)) opt.transition = {};

            this.transition('position', translatedPosition, _.extend({}, opt.transition, {
                valueFunction: joint.util.interpolate.object
            }));

        } else {

            this.set('position', translatedPosition, opt);
        }

        // Recursively call `translate()` on all the embeds cells.
        _.invoke(this.getEmbeddedCells(), 'translate', tx, ty, opt);

        return this;
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
            var angle = g.normalizeAngle(this.get('angle') || 0);

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

            // This is a rectangle in size of the unrotated element.
            var bbox = this.getBBox();

            // Pick the corner point on the element, which meant to stay on its place before and
            // after the rotation.
            var fixedPoint = bbox[['bottomLeft', 'corner', 'topRight', 'origin'][quadrant]]();

            // Find  an image of the previous indent point. This is the position, where is the
            // point actually located on the screen.
            var imageFixedPoint = g.point(fixedPoint).rotate(bbox.center(), -angle);

            // Every point on the element rotates around a circle with the centre of rotation
            // in the middle of the element while the whole element is being rotated. That means
            // that the distance from a point in the corner of the element (supposed its always rect) to
            // the center of the element doesn't change during the rotation and therefore it equals
            // to a distance on unrotated element.
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
            // of the element. This is the angle we need but on the unrotated element.
            alpha += Math.atan(quadrant % 2 == 0 ? height / width : width / height);

            // Lastly we have to deduct the original angle the element was rotated by and that's it.
            alpha -= g.toRad(angle);

            // With this angle and distance we can easily calculate the centre of the unrotated element.
            // Note that fromPolar constructor accepts an angle in radians.
            var center = g.point.fromPolar(radius, alpha, imageFixedPoint);

            // The top left corner on the unrotated element has to be half a width on the left
            // and half a height to the top from the center. This will be the origin of rectangle
            // we were looking for.
            var origin = g.point(center).offset(width / -2, height / -2);

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
        if (!this.graph) throw new Error('Element must be part of a graph.');

        var embeddedCells = this.getEmbeddedCells();

        if (embeddedCells.length > 0) {

            this.startBatch('fit-embeds', opt);

            if (opt.deep) {
                // Recursively apply fitEmbeds on all embeds first.
                _.invoke(embeddedCells, 'fitEmbeds', opt);
            }

            // Compute cell's size and position  based on the children bbox
            // and given padding.
            var bbox = this.graph.getCellsBBox(embeddedCells);
            var padding = joint.util.normalizeSides(opt.padding);

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
    // If `absolute` is `true`, the `angle` is considered is abslute, i.e. it is not
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

        return g.rect(position.x, position.y, size.width, size.height);
    }
});

// joint.dia.Element base view and controller.
// -------------------------------------------


joint.dia.ElementView = joint.dia.CellView.extend({

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

        var classNames = joint.dia.CellView.prototype.className.apply(this).split(' ');

        classNames.push('element');

        return classNames.join(' ');
    },

    initialize: function() {

        joint.dia.CellView.prototype.initialize.apply(this, arguments);

        var model = this.model;

        this.listenTo(model, 'change:position', this.translate);
        this.listenTo(model, 'change:size', this.resize);
        this.listenTo(model, 'change:angle', this.rotate);
        this.listenTo(model, 'change:markup', this.render);

        this._initializePorts();
    },

    /**
     * @abstract
     */
    _initializePorts: function() {

    },

    update: function(cell, renderingOnlyAttrs) {
        this._removePorts();
        this.updateAttributes(renderingOnlyAttrs);
        this._renderPorts();
    },

    findNodesAttributes: function(attrs, selectorCache) {

        var nodesAttrs = {};

        for (var selector in attrs) {
            if (!attrs.hasOwnProperty(selector)) continue;
            var $selected = selectorCache[selector] = this.findBySelector(selector);

            for (var i = 0, n = $selected.length; i < n; i++) {
                var node = $selected[i];
                var nodeId = V.ensureId(node);
                var nodeAttrs = attrs[selector];
                var prevNodeAttrs = nodesAttrs[nodeId];
                if (prevNodeAttrs) {
                    _.assign(prevNodeAttrs.attributes, nodeAttrs);
                } else {
                    nodesAttrs[nodeId] = {
                        attributes: _.clone(nodeAttrs),
                        node: node
                    };
                }
            }
        }

        return nodesAttrs;
    },

    // Default is to process the `model.attributes.attrs` object and set attributes on subelements based on the selectors,
    // unless `attrs` parameter was passed.
    updateAttributes: function(attrs) {

        // Cache table for query results and bounding box calculation.
        // Note that `selectorCache` needs to be invalidated for all
        // `updateAttributes` calls, as the selectors might pointing
        // to nodes designated by an attribute or elements dynamically
        // created.
        var selectorCache = {};
        var bboxCache = {};

        var model = this.model;
        var modelAttrs = model.get('attrs');
        var nodesAttrs = this.findNodesAttributes(attrs || modelAttrs, selectorCache);
        // `nodesAttrs` are different from attributes defined on the model, when
        // custom attributes sent to this method.
        var nodesModelAttrs = (attrs)
            ? nodesModelAttrs = this.findNodesAttributes(modelAttrs, selectorCache)
            : nodesAttrs;

        var item;
        var relativeItems = [];
        var node, nodeAttrs, nodeData;
        var relativeAttrs, normalAttrs, processedAttrs;

        for (var nodeId in nodesAttrs) {
            nodeData = nodesAttrs[nodeId];
            nodeAttrs = nodeData.attributes;
            node = nodeData.node;
            processedAttrs = this.processAttributes(nodeAttrs, node);
            normalAttrs = processedAttrs.normal;
            relativeAttrs = processedAttrs.relative;

            if (_.isEmpty(relativeAttrs)) {
                // Set all the normal attributes right on the SVG/HTML element.
                this.setNodeAttributes(node, normalAttrs);

            } else {

                var nodeModelAttrs = nodesModelAttrs[nodeId] || {};
                var refSelector = (nodeAttrs.ref === undefined)
                    ? nodeModelAttrs.ref
                    : nodeAttrs.ref;

                var refNode;
                if (refSelector) {
                    refNode = (selectorCache[refSelector] || this.findBySelector(refSelector))[0];
                    if (!refNode) {
                        throw new Error('dia.ElementView: "' + refSelector + '" reference does not exists.');
                    }
                } else {
                    refNode = null;
                }

                item = {
                    node: node,
                    refNode: refNode,
                    relativeAttributes: relativeAttrs,
                    normalAttributes: normalAttrs,
                    modelAttributes: nodeModelAttrs
                };

                // If an element in the list is positioned relative to this one, then
                // we want to insert this one before it in the list.
                var itemIndex = _.findIndex(relativeItems, { refNode: node });
                if (itemIndex > -1) {
                    relativeItems.splice(itemIndex, 0, item);
                } else {
                    relativeItems.push(item);
                }
            }
        }

        for (var i = 0, n = relativeItems.length; i < n; i++) {
            item = relativeItems[i];
            node = item.node;
            normalAttrs = item.normalAttributes;
            refNode = item.refNode;

            // Find the reference element bounding box. If no reference was provided, we
            // use the model's bounding box.
            var refNodeId = refNode ? V.ensureId(refNode) : '';
            var refBBox = bboxCache[refNodeId];
            if (!refBBox) {
                // Get the bounding box of the reference element relative to the `rotatable` `<g>` (without rotation)
                // or to the root `<g>` element if no rotatable group present if reference node present.
                // Uses the model bounding box with origin at 0,0 otherwise.
                refBBox = bboxCache[refNodeId] = (refNode)
                    ? V(refNode).bbox(false, (this.rotatableNode || this.vel))
                    : g.Rect(model.get('size'));
            }

            if (attrs) {
                // if there was a special attribute affecting the position amongst passed-in attributes
                // we have to merge it with the rest of the element's attributes as they are necessary
                // to update the position relatively (i.e `ref-x` && 'ref-dx')
                processedAttrs = this.processAttributes(item.modelAttributes, node, { dry: true });
                relativeAttrs = _.extend(processedAttrs.relative, item.relativeAttributes);
                // Handle also the special transform property.
                var transform = processedAttrs.normal.transform;
                if (transform !== undefined) {
                    normalAttrs.transform = transform;
                }
            } else {
                relativeAttrs = item.relativeAttributes;
            }

            this.updateRelativeAttributes(node, relativeAttrs, refBBox.clone(), normalAttrs);
        }
    },

    getAttributeDefinition: function(attrName) {

        return this.model.constructor.getAttributeDefinition(attrName);
    },

    setNodeAttributes: function(node, attrs) {

        if (!_.isEmpty(attrs)) {
            if (node instanceof SVGElement) {
                V(node).attr(attrs);
            } else {
                $(node).attr(attrs);
            }
        }
    },

    processAttributes: function(attrs, el, opt) {

        var dry = !!(opt && opt.dry);
        var attrName, attrVal, def, i, n;
        var normalAttributes = {};
        var relativeAttributes = {};
        var specialAttributeNames = [];
        // divide the attributes between normal and special
        for (attrName in attrs) {
            if (!attrs.hasOwnProperty(attrName)) continue;
            attrVal = attrs[attrName];
            def = this.getAttributeDefinition(attrName);
            if (def && (!_.isFunction(def.qualify) || def.qualify.call(this, attrVal, el, attrs))) {
                if (attrVal != null) {
                    specialAttributeNames.push(attrName);
                }
            } else {
                normalAttributes[attrName] = attrVal;
            }
        }

        // handle the rest of attributes via related method
        // from the special attributes namespace.
        for (i = 0, n = specialAttributeNames.length; i < n; i++) {
            attrName = specialAttributeNames[i];
            attrVal = attrs[attrName];
            def = this.getAttributeDefinition(attrName);
            if (!dry && _.isFunction(def.set)) {
                var setResult = def.set.call(this, attrVal, el, attrs);
                if (_.isObject(setResult)) {
                    _.extend(normalAttributes, setResult);
                } else if (setResult !== undefined) {
                    normalAttributes[attrName] = setResult;
                }
            } else if (_.isString(def.set)) {
                // If the set is a string, use this string for the attribute name
                normalAttributes[def.set] = attrVal;
            }
            if (def.anchor || def.position || def.size) {
                relativeAttributes[attrName] = attrVal;
            }
        }

        return {
            normal: normalAttributes,
            relative: relativeAttributes
        };
    },

    updateRelativeAttributes: function(node, attrs, refBBox, nodeAttrs) {

        // Check if the node is a descendant of the scalable group.
        var sx, sy;
        var scalableNode = this.scalableNode;
        if (scalableNode && scalableNode.contains(node)) {
            var scale = scalableNode.scale();
            sx = 1 / scale.sx;
            sy = 1 / scale.sy;
        } else {
            sx = 1;
            sy = 1;
        }

        // The final translation of the subelement.
        var nodePosition = g.Point(0,0);
        var translation, attrName, attrVal;
        var anchors = [];

        for (attrName in attrs) {
            if (!attrs.hasOwnProperty(attrName)) continue;

            attrVal = attrs[attrName];
            if (!_.isUndefined(attrVal)) {

                var def = this.getAttributeDefinition(attrName);
                if (!def) continue;

                // SIZE - size function should return attributes to be set on the node,
                // which will affect the node dimensions based on the reference bounding
                // box. e.g. `width`, `height`, `d`, `rx`, `ry`, `points`
                var sizeFn = def.size;
                if (_.isFunction(sizeFn)) {
                    var sizeResult = sizeFn.call(this, attrVal, refBBox, node);
                    if (_.isObject(sizeResult)) {
                        _.extend(nodeAttrs, sizeResult);
                    } else if (sizeResult !== undefined) {
                        nodeAttrs[attrName] = sizeResult;
                    }
                }

                // POSITION - position function should return a point from the
                // reference bounding box. The default position of the node is x:0, y:0 of
                // the reference bounding box or could be further specify by some
                // SVG attributes e.g. `x`, `y`
                var positionFn = def.position;
                if (_.isFunction(positionFn)) {
                    translation = positionFn.call(this, attrVal, refBBox, node);
                    if (translation) {
                        nodePosition.offset(translation.scale(sx, sy));
                    }
                }

                // ANCHOR - anchor function should return a point from the element
                // bounding box. The default anchor point is x:0, y:0 (origin) or could be further
                // specify with some SVG attributes e.g. `text-anchor`, `cx`, `cy`
                if (def.anchor) {
                    anchors.push(attrName);
                }
            }
        }

        var nodeTransform = nodeAttrs.transform || '';
        var nodeMatrix = V.transformStringToMatrix(nodeTransform);
        if (nodeTransform) {
            nodeAttrs = _.omit(nodeAttrs, 'transform');
        }

        this.setNodeAttributes(node, nodeAttrs);

        if (node instanceof HTMLElement) {
            // TODO: setting the `transform` attribute on HTMLElements
            // via `node.style.transform = 'matrix(...)';` would introduce
            // a breaking change (e.g. basic.TextBlock).
            return;
        }

        // The node bounding box could depend on the `size` set from the previous loop.
        // Here we know, that all the size attributes have been already set.
        var anchorsCount = anchors.length;
        if (anchorsCount > 0) {
            var nodeBBox = V.transformRect(node.getBBox(), nodeMatrix).scale(1 / sx, 1 / sy);
            for (var i = 0; i < anchorsCount; i++) {
                attrName = anchors[i];
                var anchorFn = this.getAttributeDefinition(attrName).anchor;
                if (_.isFunction(anchorFn)) {
                    attrVal = attrs[attrName];
                    translation = anchorFn.call(this, attrVal, nodeBBox, node);
                    if (translation) {
                        nodePosition.offset(translation.scale(-sx, -sy));
                    }
                }
            }
        }

        // Round the coordinates to 1 decimal point.
        nodePosition.offset(nodeMatrix.e, nodeMatrix.f).round(1);
        nodeMatrix.e = nodePosition.x;
        nodeMatrix.f = nodePosition.y;
        node.setAttribute('transform', V.matrixToTransformString(nodeMatrix));
    },

    // `prototype.markup` is rendered by default. Set the `markup` attribute on the model if the
    // default markup is not desirable.
    renderMarkup: function() {

        var markup = this.model.get('markup') || this.model.markup;

        if (markup) {

            var svg = joint.util.template(markup)();
            var nodes = V(svg);

            this.vel.append(nodes);

        } else {

            throw new Error('properties.markup is missing while the default render() implementation is used.');
        }
    },

    render: function() {

        this.$el.empty();

        this.renderMarkup();
        this.rotatableNode = this.vel.findOne('.rotatable');
        this.scalableNode = this.vel.findOne('.scalable');
        this.update();
        this.resize();
        this.rotate();
        this.translate();

        return this;
    },

    resize: function(cell, changed, opt) {

        var model = this.model;
        var size = model.get('size') || { width: 1, height: 1 };
        var angle = model.get('angle') || 0;

        var scalable = this.scalableNode;
        if (!scalable) {

            if (angle !== 0) {
                // update the origin of the rotation
                this.rotate();
            }
            // update the ref attributes
            this.update();

            // If there is no scalable elements, than there is nothing to scale.
            return;
        }

        var scalableBbox = scalable.bbox(true);
        // Make sure `scalableBbox.width` and `scalableBbox.height` are not zero which can happen if the element does not have any content. By making
        // the width/height 1, we prevent HTML errors of the type `scale(Infinity, Infinity)`.
        scalable.attr('transform', 'scale(' + (size.width / (scalableBbox.width || 1)) + ',' + (size.height / (scalableBbox.height || 1)) + ')');

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
        if (rotation && rotation !== 'null') {

            rotatable.attr('transform', rotation + ' rotate(' + (-angle) + ',' + (size.width / 2) + ',' + (size.height / 2) + ')');
            var rotatableBbox = scalable.bbox(false, this.paper.viewport);

            // Store new x, y and perform rotate() again against the new rotation origin.
            model.set('position', { x: rotatableBbox.x, y: rotatableBbox.y }, opt);
            this.rotate();
        }

        // Update must always be called on non-rotated element. Otherwise, relative positioning
        // would work with wrong (rotated) bounding boxes.
        this.update();
    },

    translate: function(model, changes, opt) {

        var position = this.model.get('position') || { x: 0, y: 0 };

        this.vel.attr('transform', 'translate(' + position.x + ',' + position.y + ')');
    },

    rotate: function() {

        var rotatable = this.rotatableNode;
        if (!rotatable) {
            // If there is no rotatable elements, then there is nothing to rotate.
            return;
        }

        var angle = this.model.get('angle') || 0;
        var size = this.model.get('size') || { width: 1, height: 1 };

        var ox = size.width / 2;
        var oy = size.height / 2;

        if (angle !== 0) {
            rotatable.attr('transform', 'rotate(' + angle + ',' + ox + ',' + oy + ')');
        } else {
            rotatable.removeAttr('transform');
        }
    },

    getBBox: function(opt) {

        if (opt && opt.useModelGeometry) {
            var bbox = this.model.getBBox().bbox(this.model.get('angle'));
            return this.paper.localToPaperRect(bbox);
        }

        return joint.dia.CellView.prototype.getBBox.apply(this, arguments);
    },

    // Embedding mode methods
    // ----------------------

    prepareEmbedding: function(opt) {

        opt = opt || {};

        var model = opt.model || this.model;
        var paper = opt.paper || this.paper;
        var graph = paper.model;

        model.startBatch('to-front', opt);

        // Bring the model to the front with all his embeds.
        model.toFront({ deep: true, ui: true });

        // Note that at this point cells in the collection are not sorted by z index (it's running in the batch, see
        // the dia.Graph._sortOnChangeZ), so we can't assume that the last cell in the collection has the highest z.
        var maxZ = graph.get('cells').max('z').get('z');
        var connectedLinks = graph.getConnectedLinks(model, { deep: true });

        // Move to front also all the inbound and outbound links that are connected
        // to any of the element descendant. If we bring to front only embedded elements,
        // links connected to them would stay in the background.
        _.invoke(connectedLinks, 'set', 'z', maxZ + 1, { ui: true });

        model.stopBatch('to-front');

        // Before we start looking for suitable parent we remove the current one.
        var parentId = model.get('parent');
        parentId && graph.getCell(parentId).unembed(model, { ui: true });
    },

    processEmbedding: function(opt) {

        opt = opt || {};

        var model = opt.model || this.model;
        var paper = opt.paper || this.paper;

        var paperOptions = paper.options;
        var candidates = paper.model.findModelsUnderElement(model, { searchBy: paperOptions.findParentBy });

        if (paperOptions.frontParentOnly) {
            // pick the element with the highest `z` index
            candidates = candidates.slice(-1);
        }

        var newCandidateView = null;
        var prevCandidateView = this._candidateEmbedView;

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
            this.clearEmbedding();
            this._candidateEmbedView = newCandidateView.highlight(null, { embedding: true });
        }

        if (!newCandidateView && prevCandidateView) {
            // No candidate view found. Unhighlight the previous candidate.
            this.clearEmbedding();
        }
    },

    clearEmbedding: function() {

        var candidateView = this._candidateEmbedView;
        if (candidateView) {
            // No candidate view found. Unhighlight the previous candidate.
            candidateView.unhighlight(null, { embedding: true });
            this._candidateEmbedView = null;
        }
    },

    finalizeEmbedding: function(opt) {

        opt = opt || {};

        var candidateView = this._candidateEmbedView;
        var model = opt.model || this.model;
        var paper = opt.paper || this.paper;

        if (candidateView) {

            // We finished embedding. Candidate view is chosen to become the parent of the model.
            candidateView.model.embed(model, { ui: true });
            candidateView.unhighlight(null, { embedding: true });

            delete this._candidateEmbedView;
        }

        _.invoke(paper.model.getConnectedLinks(model, { deep: true }), 'reparent', { ui: true });
    },

    // Interaction. The controller part.
    // ---------------------------------

    pointerdown: function(evt, x, y) {

        var paper = this.paper;

        if (
            evt.target.getAttribute('magnet') &&
            this.can('addLinkFromMagnet') &&
            paper.options.validateMagnet.call(paper, this, evt.target)
        ) {

            this.model.startBatch('add-link');

            var link = paper.getDefaultLink(this, evt.target);

            link.set({
                source: {
                    id: this.model.id,
                    selector: this.getSelector(evt.target),
                    port: evt.target.getAttribute('port')
                },
                target: { x: x, y: y }
            });

            paper.model.addCell(link);

            var linkView = this._linkView = paper.findViewByModel(link);

            linkView.pointerdown(evt, x, y);
            linkView.startArrowheadMove('target', { whenNotAllowed: 'remove' });

        } else {

            this._dx = x;
            this._dy = y;

            this.restrictedArea = paper.getRestrictedArea(this);

            joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
            this.notify('element:pointerdown', evt, x, y);
        }
    },

    pointermove: function(evt, x, y) {

        if (this._linkView) {

            // let the linkview deal with this event
            this._linkView.pointermove(evt, x, y);

        } else {

            var grid = this.paper.options.gridSize;

            if (this.can('elementMove')) {

                var position = this.model.get('position');

                // Make sure the new element's position always snaps to the current grid after
                // translate as the previous one could be calculated with a different grid size.
                var tx = g.snapToGrid(position.x, grid) - position.x + g.snapToGrid(x - this._dx, grid);
                var ty = g.snapToGrid(position.y, grid) - position.y + g.snapToGrid(y - this._dy, grid);

                this.model.translate(tx, ty, { restrictedArea: this.restrictedArea, ui: true });

                if (this.paper.options.embeddingMode) {

                    if (!this._inProcessOfEmbedding) {
                        // Prepare the element for embedding only if the pointer moves.
                        // We don't want to do unnecessary action with the element
                        // if an user only clicks/dblclicks on it.
                        this.prepareEmbedding();
                        this._inProcessOfEmbedding = true;
                    }

                    this.processEmbedding();
                }
            }

            this._dx = g.snapToGrid(x, grid);
            this._dy = g.snapToGrid(y, grid);

            joint.dia.CellView.prototype.pointermove.apply(this, arguments);
            this.notify('element:pointermove', evt, x, y);
        }
    },

    pointerup: function(evt, x, y) {

        if (this._linkView) {

            // Let the linkview deal with this event.
            this._linkView.pointerup(evt, x, y);
            this._linkView = null;
            this.model.stopBatch('add-link');

        } else {

            if (this._inProcessOfEmbedding) {
                this.finalizeEmbedding();
                this._inProcessOfEmbedding = false;
            }

            this.notify('element:pointerup', evt, x, y);
            joint.dia.CellView.prototype.pointerup.apply(this, arguments);
        }
    },

    mouseenter: function(evt) {

        joint.dia.CellView.prototype.mouseenter.apply(this, arguments);
        this.notify('element:mouseenter', evt);
    },

    mouseleave: function(evt) {

        joint.dia.CellView.prototype.mouseleave.apply(this, arguments);
        this.notify('element:mouseleave', evt);
    }
});
