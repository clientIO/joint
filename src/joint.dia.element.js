/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//      JointJS library.
//      (c) 2011-2013 client IO


// joint.dia.Element base model.
// -----------------------------

joint.dia.Element = joint.dia.Cell.extend({

    defaults: {
	size: { width: 1, height: 1 }
    },

    position: function(x, y) {

        this.set('position', { x: x, y: y });
    },
    
    translate: function(tx, ty, opt) {

        ty = ty || 0;

        if (tx === 0 && ty === 0) {
            // Like nothing has happened.
            return this;
        }

        var position = this.get('position') || { x: 0, y: 0 };
        
        this.set('position', {

            x: position.x + tx || 0,
            y: position.y + ty || 0
            
        }, opt);

        // Recursively call `translate()` on all the embeds cells.
        _.invoke(this.getEmbeddedCells(), 'translate', tx, ty);

        return this;
    },

    resize: function(width, height) {

	this.trigger('batch:start');
        this.set('size', { width: width, height: height });
	this.trigger('batch:stop');

	return this;
    },

    rotate: function(angle, absolute) {

        return this.set('angle', absolute ? angle : ((this.get('angle') || 0) + angle) % 360);
    },

    getBBox: function() {

	var position = this.get('position');
	var size = this.get('size');

	return g.rect(position.x, position.y, size.width, size.height);
    }
});

// joint.dia.Element base view and controller.
// -------------------------------------------

joint.dia.ElementView = joint.dia.CellView.extend({
    
    initialize: function() {

        _.bindAll(this, 'translate', 'resize', 'rotate');

        joint.dia.CellView.prototype.initialize.apply(this, arguments);
        
        // Assign CSS class to the element based on the element type.
        V(this.el).attr({
            
            'class': 'element ' + this.model.get('type').split('.').join(' '),
            'model-id': this.model.id
        });

        this.model.on({

            'change:position': this.translate,
            'change:size': this.resize,
            'change:angle': this.rotate
        });
    },

    // Default is to process the `attrs` object and set attributes on subelements based on the selectors.
    update: function(cell, renderingOnlyAttrs) {

        var rotatable = V(this.$('.rotatable')[0]);
        if (rotatable) {

            var rotation = rotatable.attr('transform');
            rotatable.attr('transform', '');
        }
        
        var relativelyPositioned = [];

        var attrs = renderingOnlyAttrs || this.model.get('attrs');
        
        _.each(attrs, function(attrs, selector) {

            // Elements that should be updated.
            var $selected = this.findBySelector(selector);

            // No element matched by the `selector` was found. We're done then.
            if ($selected.length === 0) return;

            // Special attributes are treated by JointJS, not by SVG.
            var specialAttributes = ['style', 'text', 'ref-x', 'ref-y', 'ref-dx', 'ref-dy', 'ref', 'x-alignment', 'y-alignment'];

            // Set regular attributes on the `$selected` subelement. Note that we cannot use the jQuery attr()
            // method as some of the attributes might be namespaced (e.g. xlink:href) which fails with jQuery attr().
            var finalAttributes = _.omit(attrs, specialAttributes);
            $selected.each(function() {
                
                V(this).attr(finalAttributes);
            });

            // `style` attribute is special in the sense that it sets the CSS style of the subelement.
            if (attrs.style) {

                $selected.css(attrs.style);
            }
            
            // Make special case for `text` attribute. So that we can set text content of the `<text>` element
            // via the `attrs` object as well.
            if (!_.isUndefined(attrs.text)) {

                $selected.each(function() {

                    V(this).text(attrs.text + '');
                });
            }

            // Special `ref-x` and `ref-y` attributes make it possible to set both absolute or
            // relative positioning of subelements.
            if (!_.isUndefined(attrs['ref-x']) ||
                !_.isUndefined(attrs['ref-y']) ||
                !_.isUndefined(attrs['ref-dx']) ||
                !_.isUndefined(attrs['ref-dy']) ||
		!_.isUndefined(attrs['x-alignment']) ||
		!_.isUndefined(attrs['y-alignment'])
               ) {

                relativelyPositioned.push($selected);
            }
            
        }, this);

        // We don't want the sub elements to affect the bounding box of the root element when
        // positioning the sub elements relatively to the bounding box.
        //_.invoke(relativelyPositioned, 'hide');
        //_.invoke(relativelyPositioned, 'show');

        // Note that we're using the bounding box without transformation because we are already inside
        // a transformed coordinate system.
        var bbox = this.el.getBBox();        

        _.each(relativelyPositioned, function($el) {

            this.positionRelative($el, bbox, attrs);
            
        }, this);

        if (rotatable) {

            rotatable.attr('transform', rotation || '');
        }
    },

    positionRelative: function($el, bbox, attrs) {

        var elAttrs = attrs[$el.selector];
        
        var refX = parseFloat(elAttrs['ref-x']);
        var refY = parseFloat(elAttrs['ref-y']);
        var refDx = parseFloat(elAttrs['ref-dx']);
        var refDy = parseFloat(elAttrs['ref-dy']);
        var yAlignment = elAttrs['y-alignment'];
        var xAlignment = elAttrs['x-alignment'];

        // `ref` is the selector of the reference element. If no `ref` is passed, reference
        // element is the root element.

        var isScalable = _.contains(_.pluck(_.pluck($el.parents('g'), 'className'), 'baseVal'), 'scalable');

        var ref = elAttrs['ref'];
        if (ref) {

            // Get the bounding box of the reference element relative to the root `<g>` element.
            bbox = V(this.findBySelector(ref)[0]).bbox(false, this.el);
        }

        var vel = V($el[0]);

        // Remove the previous translate() from the transform attribute and translate the element
        // relative to the root bounding box following the `ref-x` and `ref-y` attributes.
        if (vel.attr('transform')) {

            vel.attr('transform', vel.attr('transform').replace(/translate\([^)]*\)/g, '') || '');
        }

        function isDefined(x) {
            return _.isNumber(x) && !_.isNaN(x);
        }

        // The final translation of the subelement.
        var tx = 0;
        var ty = 0;

        // `ref-dx` and `ref-dy` define the offset of the subelement relative to the right and/or bottom
        // coordinate of the reference element.
        if (isDefined(refDx)) {

            if (isScalable) {

                // Compensate for the scale grid in case the elemnt is in the scalable group.
                var scale = V(this.$('.scalable')[0]).scale();
                tx = bbox.x + bbox.width + refDx / scale.sx;
                
            } else {
                
                tx = bbox.x + bbox.width + refDx;
            }
        }
        if (isDefined(refDy)) {

            if (isScalable) {
                
                // Compensate for the scale grid in case the elemnt is in the scalable group.
                var scale = V(this.$('.scalable')[0]).scale();
                ty = bbox.y + bbox.height + refDy / scale.sy;
            } else {
                
                ty = bbox.y + bbox.height + refDy;
            }
        }

        // if `refX` is in [0, 1] then `refX` is a fraction of bounding box width
        // if `refX` is < 0 then `refX`'s absolute values is the right coordinate of the bounding box
        // otherwise, `refX` is the left coordinate of the bounding box
        // Analogical rules apply for `refY`.
        if (isDefined(refX)) {

            if (refX > 0 && refX < 1) {

                tx = bbox.x + bbox.width * refX;

            } else if (isScalable) {

                // Compensate for the scale grid in case the elemnt is in the scalable group.
                var scale = V(this.$('.scalable')[0]).scale();
                tx = bbox.x + refX / scale.sx;
                
            } else {

                tx = bbox.x + refX;
            }
        }
        if (isDefined(refY)) {

            if (refY > 0 && refY < 1) {
                
                ty = bbox.y + bbox.height * refY;
                
            } else if (isScalable) {

                // Compensate for the scale grid in case the elemnt is in the scalable group.
                var scale = V(this.$('.scalable')[0]).scale();
                ty = bbox.y + refY / scale.sy;
                
            } else {

                ty = bbox.y + refY;
            }
        }

	var velbbox = vel.bbox(false, this.paper.viewport);
        // `y-alignment` when set to `middle` causes centering of the subelement around its new y coordinate.
        if (yAlignment === 'middle') {

            ty -= velbbox.height/2;
            
        } else if (isDefined(yAlignment)) {

            ty += (yAlignment > 0 && yAlignment < 1) ?  velbbox.height * yAlignment : yAlignment;
        }

        // `x-alignment` when set to `middle` causes centering of the subelement around its new x coordinate.
        if (xAlignment === 'middle') {
            
            tx -= velbbox.width/2;
            
        } else if (isDefined(xAlignment)) {

            tx += (xAlignment > 0 && xAlignment < 1) ?  velbbox.width * xAlignment : xAlignment;
        }

        vel.translate(tx, ty);
    },

    // `prototype.markup` is rendered by default. Set the `markup` attribute on the model if the
    // default markup is not desirable.
    render: function() {

        var markup = this.model.markup || this.model.get('markup');
        
        if (markup) {

            var nodes = V(markup);
            V(this.el).append(nodes);
            
        } else {

            throw new Error('properties.markup is missing while the default render() implementation is used.');
        }

        this.update();

        this.resize();
        this.rotate();
        this.translate();        

        return this;
    },

    // Scale the whole `<g>` group. Note the difference between `scale()` and `resize()` here.
    // `resize()` doesn't scale the whole `<g>` group but rather adjusts the `box.sx`/`box.sy` only.
    // `update()` is then responsible for scaling only those elements that have the `follow-scale`
    // attribute set to `true`. This is desirable in elements that have e.g. a `<text>` subelement
    // that is not supposed to be scaled together with a surrounding `<rect>` element that IS supposed
    // be be scaled.
    scale: function(sx, sy) {

        // TODO: take into account the origin coordinates `ox` and `oy`.
        V(this.el).scale(sx, sy);
    },

    resize: function() {

        var size = this.model.get('size') || { width: 1, height: 1 };
        var angle = this.model.get('angle') || 0;
        
        var scalable = V(this.$('.scalable')[0]);
        if (!scalable) {
            // If there is no scalable elements, than there is nothing to resize.
            return;
        }
        var scalableBbox = scalable.bbox(true);
        
        scalable.attr('transform', 'scale(' + (size.width / scalableBbox.width) + ',' + (size.height / scalableBbox.height) + ')');

        // Now the interesting part. The goal is to be able to store the object geometry via just `x`, `y`, `angle`, `width` and `height`
        // Order of transformations is significant but we want to reconstruct the object always in the order:
        // resize(), rotate(), translate() no matter of how the object was transformed. For that to work,
        // we must adjust the `x` and `y` coordinates of the object whenever we resize it (because the origin of the
        // rotation changes). The new `x` and `y` coordinates are computed by canceling the previous rotation
        // around the center of the resized object (which is a different origin then the origin of the previous rotation)
        // and getting the top-left corner of the resulting object. Then we clean up the rotation back to what it originally was.
        
        // Cancel the rotation but now around a different origin, which is the center of the scaled object.
        var rotatable = V(this.$('.rotatable')[0]);
        var rotation = rotatable && rotatable.attr('transform');
        if (rotation && rotation !== 'null') {

            rotatable.attr('transform', rotation + ' rotate(' + (-angle) + ',' + (size.width/2) + ',' + (size.height/2) + ')');
            var rotatableBbox = scalable.bbox(false, this.paper.viewport);
            
            // Store new x, y and perform rotate() again against the new rotation origin.
            this.model.set('position', { x: rotatableBbox.x, y: rotatableBbox.y });
            this.rotate();
        }

        // Update must always be called on non-rotated element. Otherwise, relative positioning
        // would work with wrong (rotated) bounding boxes.
        this.update();
    },

    translate: function(model, changes, opt) {

        var position = this.model.get('position') || { x: 0, y: 0 };

        if (opt && opt.animation) {

            var animateTransform = V('animateTransform', {
                attributeName: 'transform',
                attributeType: 'XML',
                type: 'translate',
                from: (this.model.previous('position').x || 0) + ' ' + (this.model.previous('position').y || 0),
                to: position.x + ' ' + position.y,
                dur: '100ms',
                fill: 'freeze'
            });
            V(this.el).append(animateTransform);
            animateTransform.node.beginElement();
            
        } else {

            V(this.el).attr('transform', 'translate(' + position.x + ',' + position.y + ')');
        }
    },

    rotate: function() {

        var rotatable = V(this.$('.rotatable')[0]);
        if (!rotatable) {
            // If there is no rotatable elements, then there is nothing to rotate.
            return;
        }
        
        var angle = this.model.get('angle') || 0;
        var size = this.model.get('size') || { width: 1, height: 1 };

        var ox = size.width/2;
        var oy = size.height/2;
        

        rotatable.attr('transform', 'rotate(' + angle + ',' + ox + ',' + oy + ')');
    },

    // Interaction. The controller part.
    // ---------------------------------

    
    pointerdown: function(evt, x, y) {

        this._dx = x;
        this._dy = y;

        joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
    },

    pointermove: function(evt, x, y) {

        if (this.options.interactive !== false) {

            this.model.translate(x - this._dx, y - this._dy);
        }
        
        this._dx = x;
        this._dy = y;

        joint.dia.CellView.prototype.pointermove.apply(this, arguments);
    }
});
