import { Cell } from './Cell.mjs';
import { Point, toRad, normalizeAngle, Rect } from '../g/index.mjs';
import { isNumber, isObject, interpolate, assign, invoke, normalizeSides } from '../util/index.mjs';
import { elementPortPrototype } from './ports.mjs';

// Element base model.
// -----------------------------

export const Element = Cell.extend({

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

        const isSetter = isNumber(y);
        opt = (isSetter ? opt : x) || {};
        const { parentRelative, deep, restrictedArea } = opt;


        // option `parentRelative` for setting the position relative to the element's parent.
        let parentPosition;
        if (parentRelative) {

            // Getting the parent's position requires the collection.
            // Cell.parent() holds cell id only.
            if (!this.graph) throw new Error('Element must be part of a graph.');

            const parent = this.getParentCell();
            if (parent && !parent.isLink()) {
                parentPosition = parent.get('position');
            }
        }

        if (isSetter) {

            if (parentPosition) {
                x += parentPosition.x;
                y += parentPosition.y;
            }

            if (deep || restrictedArea) {
                const { x: x0, y: y0 } = this.get('position');
                this.translate(x - x0, y - y0, opt);
            } else {
                this.set('position', { x, y }, opt);
            }

            return this;

        } else { // Getter returns a geometry point.

            const elementPosition = Point(this.get('position'));
            return parentRelative
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
        var ra = opt.restrictedArea;
        if (ra && opt.translateBy === this.id) {

            if (typeof ra === 'function') {

                var newPosition = ra.call(this, position.x + tx, position.y + ty, opt);

                tx = newPosition.x - position.x;
                ty = newPosition.y - position.y;

            } else  {
                // We are restricting the translation for the element itself only. We get
                // the bounding box of the element including all its embeds.
                // All embeds have to be translated the exact same way as the element.
                var bbox = this.getBBox({ deep: true });
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
        }

        var translatedPosition = {
            x: position.x + tx,
            y: position.y + ty
        };

        // To find out by how much an element was translated in event 'change:position' handlers.
        opt.tx = tx;
        opt.ty = ty;

        if (opt.transition) {

            if (!isObject(opt.transition)) opt.transition = {};

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
            var angle = normalizeAngle(this.get('angle') || 0);

            // This is a rectangle in size of the un-rotated element.
            var bbox = this.getBBox();

            var origin;

            if (angle) {

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

                // Pick the corner point on the element, which meant to stay on its place before and
                // after the rotation.
                var fixedPoint = bbox[['bottomLeft', 'corner', 'topRight', 'origin'][quadrant]]();

                // Find  an image of the previous indent point. This is the position, where is the
                // point actually located on the screen.
                var imageFixedPoint = Point(fixedPoint).rotate(bbox.center(), -angle);

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
                alpha -= toRad(angle);

                // With this angle and distance we can easily calculate the centre of the un-rotated element.
                // Note that fromPolar constructor accepts an angle in radians.
                var center = Point.fromPolar(radius, alpha, imageFixedPoint);

                // The top left corner on the un-rotated element has to be half a width on the left
                // and half a height to the top from the center. This will be the origin of rectangle
                // we were looking for.
                origin = Point(center).offset(width / -2, height / -2);

            } else {
                // calculation for the origin Point when there is no rotation of the element
                origin = bbox.topLeft();

                switch (opt.direction) {
                    case 'top':
                    case 'top-right':
                        origin.offset(0, bbox.height - height);
                        break;
                    case 'left':
                    case 'bottom-left':
                        origin.offset(bbox.width -width, 0);
                        break;
                    case 'top-left':
                        origin.offset(bbox.width - width, bbox.height - height);
                        break;
                }
            }

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

        return this.fitToChildren(opt);
    },

    fitToChildren: function(opt = {}) {

        // Getting the children's size and position requires the collection.
        // Cell.get('embeds') holds an array of cell ids only.
        const { graph } = this;
        if (!graph) throw new Error('Element must be part of a graph.');

        const childElements = this.getEmbeddedCells().filter(cell => cell.isElement());
        if (childElements.length === 0) return this;

        this.startBatch('fit-embeds', opt);

        if (opt.deep) {
            // `opt.deep = true` means "fit to all descendants".
            // As the first action of the fitting algorithm, recursively apply `fitToChildren()` on all descendants.
            // - i.e. the algorithm is applied in reverse-depth order - start from deepest descendant, then go up (= this element).
            invoke(childElements, 'fitToChildren', opt);
        }

        // Set new size and position of this element, based on:
        // - union of bboxes of all children
        // - inflated by given `opt.padding`
        this._fitToElements(Object.assign({ elements: childElements }, opt));

        this.stopBatch('fit-embeds');

        return this;
    },

    fitParent: function(opt = {}) {

        const { graph } = this;
        if (!graph) throw new Error('Element must be part of a graph.');

        // When `opt.deep = true`, we want `opt.terminator` to be the last ancestor processed.
        // If the current element is `opt.terminator`, it means that this element has already been processed as parent so we can exit now.
        if (opt.deep && opt.terminator && ((opt.terminator === this) || (opt.terminator === this.id))) return this;

        const parentElement = this.getParentCell();
        if (!parentElement || !parentElement.isElement()) return this;

        // Get all children of parent element (i.e. this element + any sibling elements).
        const siblingElements = parentElement.getEmbeddedCells().filter(cell => cell.isElement());
        if (siblingElements.length === 0) return this;

        this.startBatch('fit-parent', opt);

        // Set new size and position of parent element, based on:
        // - union of bboxes of all children of parent element (i.e. this element + any sibling elements)
        // - inflated by given `opt.padding`
        parentElement._fitToElements(Object.assign({ elements: siblingElements }, opt));

        if (opt.deep) {
            // `opt.deep = true` means "fit all ancestors to their respective children".
            // As the last action of the fitting algorithm, recursively apply `fitParent()` on all ancestors.
            // - i.e. the algorithm is applied in reverse-depth order - start from deepest descendant (= this element), then go up.
            parentElement.fitParent(opt);
        }

        this.stopBatch('fit-parent');

        return this;
    },

    // Assumption: This element is part of a graph.
    _fitToElements: function(opt = {}) {

        const elementsBBox = this.graph.getCellsBBox(opt.elements);
        // If no `opt.elements` were provided, do nothing.
        if (!elementsBBox) return;

        const { expandOnly, shrinkOnly } = opt;
        // This combination is meaningless, do nothing.
        if (expandOnly && shrinkOnly) return;

        // Calculate new size and position of this element based on:
        // - union of bboxes of `opt.elements`
        // - inflated by `opt.padding` (if not provided, all four properties = 0)
        let { x, y, width, height } = elementsBBox;
        const { left, right, top, bottom } = normalizeSides(opt.padding);
        x -= left;
        y -= top;
        width += left + right;
        height += bottom + top;
        let resultBBox = new Rect(x, y, width, height);

        if (expandOnly) {
            // Non-shrinking is enforced by taking union of this element's current bbox with bbox calculated from `opt.elements`.
            resultBBox = this.getBBox().union(resultBBox);

        } else if (shrinkOnly) {
            // Non-expansion is enforced by taking intersection of this element's current bbox with bbox calculated from `opt.elements`.
            const intersectionBBox = this.getBBox().intersect(resultBBox);
            // If all children are outside this element's current bbox, then `intersectionBBox` is `null` - does not make sense, do nothing.
            if (!intersectionBBox) return;

            resultBBox =  intersectionBBox;
        }

        // Set the new size and position of this element.
        this.set({
            position: { x: resultBBox.x, y: resultBBox.y },
            size: { width: resultBBox.width, height: resultBBox.height }
        }, opt);
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
        return normalizeAngle(this.get('angle') || 0);
    },

    getBBox: function(opt = {}) {

        const { graph, attributes } = this;
        const { deep, rotate } = opt;

        if (deep && graph) {
            // Get all the embedded elements using breadth first algorithm.
            const elements = this.getEmbeddedCells({ deep: true, breadthFirst: true });
            // Add the model itself.
            elements.push(this);
            // Note: the default of getCellsBBox() is rotate=true and can't be
            // changed without a breaking change
            return graph.getCellsBBox(elements, opt);
        }

        const { angle = 0, position: { x, y }, size: { width, height }} = attributes;
        const bbox = new Rect(x, y, width, height);
        if (rotate) {
            bbox.rotateAroundCenter(angle);
        }
        return bbox;
    },

    getPointFromConnectedLink: function(link, endType) {
        // Center of the model
        var bbox = this.getBBox();
        var center = bbox.center();
        // Center of a port
        var endDef = link.get(endType);
        if (!endDef) return center;
        var portId = endDef.port;
        if (!portId || !this.hasPort(portId)) return center;
        var portGroup = this.portProp(portId, ['group']);
        var portsPositions = this.getPortsPositions(portGroup);
        var portCenter = new Point(portsPositions[portId]).offset(bbox.origin());
        var angle = this.angle();
        if (angle) portCenter.rotate(center, -angle);
        return portCenter;
    }
});

assign(Element.prototype, elementPortPrototype);

