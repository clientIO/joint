import { assign, invoke, isFunction, toArray } from './util.js';
import { CellView } from './cellView.mjs';
import { Cell } from './joint.dia.cell.js';
import V from './vectorizer.js';
import { elementViewPortPrototype } from './ports.js';
import { Rect, snapToGrid } from './geometry.js';

var FLAG_RENDER = 1<<0;
var FLAG_UPDATE = 1<<1;
var FLAG_TRANSLATE = 1<<2;
var FLAG_ROTATE = 1<<3;
var FLAG_RESIZE = 1<<4;
var FLAG_PORTS = 1<<5;

// Element base view and controller.
// -------------------------------------------

export const ElementView = CellView.extend({

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

    initFlag: FLAG_RENDER,

    presentationAttributes: {
        'attrs': FLAG_UPDATE,
        'position': FLAG_TRANSLATE,
        'size': FLAG_RESIZE | FLAG_PORTS,
        'angle': FLAG_ROTATE,
        'markup': FLAG_RENDER,
        'ports': FLAG_PORTS
    },

    UPDATE_PRIORITY: 0,

    FLAG_RENDER: FLAG_RENDER,
    FLAG_UPDATE: FLAG_UPDATE,
    FLAG_TRANSLATE: FLAG_TRANSLATE,
    FLAG_ROTATE: FLAG_ROTATE,
    FLAG_RESIZE: FLAG_RESIZE,
    FLAG_PORTS: FLAG_PORTS,

    onAttributesChange: function(model, opt) {
        var flag = model.getChangeFlag(this.presentationAttributes);
        if (opt.updateHandled || !flag) return;
        if (opt.dirty && flag & FLAG_UPDATE) flag |= FLAG_RENDER;
        var paper = this.paper;
        if (paper) paper.requestViewUpdate(this, flag, this.UPDATE_PRIORITY, opt);
    },

    confirmUpdate: function(flag, opt) {
        if (flag & FLAG_RENDER) {
            this.render();
            return 0;
        }
        if (flag & FLAG_RESIZE) {
            this.resize(opt);
            flag ^= flag & (FLAG_RESIZE | FLAG_UPDATE);
        }
        if (flag & FLAG_UPDATE) {
            this.updateNodesAttributes();
            flag ^= FLAG_UPDATE;
        }
        if (flag & FLAG_TRANSLATE) {
            this.translate();
            flag ^= FLAG_TRANSLATE;
        }
        if (flag & FLAG_ROTATE) {
            this.rotate();
            flag ^= FLAG_ROTATE;
        }
        if (flag & FLAG_PORTS) {
            this._refreshPorts();
            flag ^= FLAG_PORTS;
        }
        return 0;
    },

    /**
     * @abstract
     */
    _initializePorts: function() {

    },

    update: function(_, renderingOnlyAttrs) {

        this._removePorts();

        this.updateNodesAttributes(renderingOnlyAttrs);

        this._renderPorts();
    },

    updateNodesAttributes: function(renderingOnlyAttrs) {

        this.cleanNodesCache();

        var model = this.model;
        var modelAttrs = model.attr();
        this.updateDOMSubtreeAttributes(this.el, modelAttrs, {
            rootBBox: new Rect(model.size()),
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
        if (!markup) throw new Error('dia.ElementView: markup required');
        if (Array.isArray(markup)) return this.renderJSONMarkup(markup);
        if (typeof markup === 'string') return this.renderStringMarkup(markup);
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
            this.updateNodesAttributes();
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

        if (this.scalableNode) return this.sgResize(opt);
        if (this.model.attributes.angle) this.rotate();
        this.updateNodesAttributes();
    },

    translate: function() {

        if (this.rotatableNode) return this.rgTranslate();
        this.updateTransformation();
    },

    rotate: function() {

        if (this.rotatableNode) {
            this.rgRotate();
            // It's necessary to call the update for the nodes outside
            // the rotatable group referencing nodes inside the group
            this.updateNodesAttributes();
            return;
        }
        this.updateTransformation();
    },

    updateTransformation: function() {

        var transformation = this.getTranslateString();
        var rotateString = this.getRotateString();
        if (rotateString) transformation += ' ' + rotateString;
        this.vel.attr('transform', transformation);
    },

    getTranslateString: function() {

        var position = this.model.attributes.position;
        return 'translate(' + position.x + ',' + position.y + ')';
    },

    getRotateString: function() {
        var attributes = this.model.attributes;
        var angle = attributes.angle;
        if (!angle) return null;
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
            var rotatableBBox = scalable.getBBox({ target: this.paper.viewport });

            // Store new x, y and perform rotate() again against the new rotation origin.
            model.set('position', { x: rotatableBBox.x, y: rotatableBBox.y }, assign({ updateHandled: true }, opt));
            this.translate();
            this.rotate();
        }

        // Update must always be called on non-rotated element. Otherwise, relative positioning
        // would work with wrong (rotated) bounding boxes.
        this.updateNodesAttributes();
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
            if (link.attributes.z <= maxZ) link.set('z', maxZ + 1, { ui: true });
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
            if (model.isLink()) break;
            if (!model.isEmbedded() || view.can('stopDelegation')) return view;
            model = model.getParentCell();
            view = paper.findViewByModel(model);
        }

        return null;
    },

    // Interaction. The controller part.
    // ---------------------------------

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

        if (this.isPropagationStopped(evt)) return;

        CellView.prototype.pointerdown.apply(this, arguments);
        this.notify('element:pointerdown', evt, x, y);

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
                CellView.prototype.pointermove.apply(this, arguments);
                this.notify('element:pointermove', evt, x, y);
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
                this.notify('element:pointerup', evt, x, y);
                CellView.prototype.pointerup.apply(this, arguments);
        }

        var magnet = data.targetMagnet;
        if (magnet) this.magnetpointerclick(evt, magnet, x, y);
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
        if (!view || !view.can('elementMove')) return;

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

        if (!this.can('addLinkFromMagnet')) return;

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

        // backwards compatiblity events
        CellView.prototype.pointerdown.apply(linkView, [evt, x, y]);
        linkView.notify('link:pointerdown', evt, x, y);

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
        var { pointerOffset, restrictedArea, embedding } = data;

        // Make sure the new element's position always snaps to the current grid
        var elX = snapToGrid(x + pointerOffset.x, grid);
        var elY = snapToGrid(y + pointerOffset.y, grid);

        element.position(elX, elY, { restrictedArea, deep: true, ui: true });

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
            embedding
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
                if (targetMagnet === currentTarget || V(targetMagnet).contains(currentTarget)) return;
            } else {
                // magnetThreshold defined as a number of movements
                if (paper.eventData(evt).mousemoved <= magnetThreshold) return;
            }
            this.dragLinkStart(evt, targetMagnet, x, y);
        }
    },

    // Drag End Handlers

    dragEnd: function(evt, x, y) {

        var data = this.eventData(evt);
        if (data.embedding) this.finalizeEmbedding(data);
    },

    dragMagnetEnd: function(evt, x, y) {

        var data = this.eventData(evt);
        var linkView = data.linkView;
        if (!linkView) return;
        linkView.pointerup(evt, x, y);
        this.model.stopBatch('add-link');
    },

    magnetpointerclick: function(evt, magnet, x, y) {
        var paper = this.paper;
        if (paper.eventData(evt).mousemoved > paper.options.clickThreshold) return;
        this.notify('element:magnet:pointerclick', evt, magnet, x, y);
    }

});

assign(ElementView.prototype, elementViewPortPrototype);
