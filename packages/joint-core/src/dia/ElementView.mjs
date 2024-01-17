import { assign, isFunction, toArray } from '../util/index.mjs';
import { CellView } from './CellView.mjs';
import { Cell } from './Cell.mjs';
import V from '../V/index.mjs';
import { elementViewPortPrototype } from './ports.mjs';
import { Rect, snapToGrid } from '../g/index.mjs';

const Flags = {
    TOOLS: CellView.Flags.TOOLS,
    UPDATE: 'UPDATE',
    TRANSLATE: 'TRANSLATE',
    RESIZE: 'RESIZE',
    PORTS: 'PORTS',
    ROTATE: 'ROTATE',
    RENDER: 'RENDER'
};

const DragActions = {
    MOVE: 'move',
    MAGNET: 'magnet',
};
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

    presentationAttributes: {
        'attrs': [Flags.UPDATE],
        'position': [Flags.TRANSLATE, Flags.TOOLS],
        'size': [Flags.RESIZE, Flags.PORTS, Flags.TOOLS],
        'angle': [Flags.ROTATE, Flags.TOOLS],
        'markup': [Flags.RENDER],
        'ports': [Flags.PORTS],
    },

    initFlag: [Flags.RENDER],

    UPDATE_PRIORITY: 0,

    confirmUpdate: function(flag, opt) {

        const { useCSSSelectors } = this;
        if (this.hasFlag(flag, Flags.PORTS)) {
            this._removePorts();
            this._cleanPortsCache();
        }
        let transformHighlighters = false;
        if (this.hasFlag(flag, Flags.RENDER)) {
            this.render();
            this.updateTools(opt);
            this.updateHighlighters(true);
            transformHighlighters = true;
            flag = this.removeFlag(flag, [Flags.RENDER, Flags.UPDATE, Flags.RESIZE, Flags.TRANSLATE, Flags.ROTATE, Flags.PORTS, Flags.TOOLS]);
        } else {
            let updateHighlighters = false;

            // Skip this branch if render is required
            if (this.hasFlag(flag, Flags.RESIZE)) {
                this.resize(opt);
                updateHighlighters = true;
                // Resize method is calling `update()` internally
                flag = this.removeFlag(flag, [Flags.RESIZE, Flags.UPDATE]);
                if (useCSSSelectors) {
                    // `resize()` rendered the ports when useCSSSelectors are enabled
                    flag = this.removeFlag(flag, Flags.PORTS);
                }
            }
            if (this.hasFlag(flag, Flags.UPDATE)) {
                this.update(this.model, null, opt);
                flag = this.removeFlag(flag, Flags.UPDATE);
                updateHighlighters = true;
                if (useCSSSelectors) {
                    // `update()` will render ports when useCSSSelectors are enabled
                    flag = this.removeFlag(flag, Flags.PORTS);
                }
            }
            if (this.hasFlag(flag, Flags.TRANSLATE)) {
                this.translate();
                flag = this.removeFlag(flag, Flags.TRANSLATE);
                transformHighlighters = true;
            }
            if (this.hasFlag(flag, Flags.ROTATE)) {
                this.rotate();
                flag = this.removeFlag(flag, Flags.ROTATE);
                transformHighlighters = true;
            }
            if (this.hasFlag(flag, Flags.PORTS)) {
                this._renderPorts();
                updateHighlighters = true;
                flag = this.removeFlag(flag, Flags.PORTS);
            }

            if (updateHighlighters) {
                this.updateHighlighters(false);
            }
        }

        if (transformHighlighters) {
            this.transformHighlighters();
        }

        if (this.hasFlag(flag, Flags.TOOLS)) {
            this.updateTools(opt);
            flag = this.removeFlag(flag, Flags.TOOLS);
        }

        return flag;
    },

    /**
     * @abstract
     */
    _initializePorts: function() {

    },

    update: function(_, renderingOnlyAttrs) {

        this.cleanNodesCache();

        // When CSS selector strings are used, make sure no rule matches port nodes.
        const { useCSSSelectors } = this;
        if (useCSSSelectors) this._removePorts();

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

        if (useCSSSelectors) {
            this._renderPorts();
        }
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
        if (!this.useCSSSelectors) this._renderPorts();
        return this;
    },

    resize: function(opt) {

        if (this.scalableNode) return this.sgResize(opt);
        if (this.model.attributes.angle) this.rotate();
        this.update();
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
            this.update();
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

    prepareEmbedding: function(data = {}) {

        const element = data.model || this.model;
        const paper = data.paper || this.paper;
        const graph = paper.model;

        const initialZIndices = data.initialZIndices = {};
        const embeddedCells = element.getEmbeddedCells({ deep: true });
        const connectedLinks = graph.getConnectedLinks(element, { deep: true, includeEnclosed: true });

        // Note: an embedded cell can be a connect link, but it's fine
        // to iterate over the cell twice.
        [
            element,
            ...embeddedCells,
            ...connectedLinks
        ].forEach(cell => initialZIndices[cell.id] = cell.attributes.z);

        element.startBatch('to-front');

        // Bring the model to the front with all his embeds.
        element.toFront({ deep: true, ui: true });

        // Note that at this point cells in the collection are not sorted by z index (it's running in the batch, see
        // the dia.Graph._sortOnChangeZ), so we can't assume that the last cell in the collection has the highest z.
        const maxZ = graph.getElements().reduce((max, cell) => Math.max(max, cell.attributes.z || 0), 0);

        // Move to front also all the inbound and outbound links that are connected
        // to any of the element descendant. If we bring to front only embedded elements,
        // links connected to them would stay in the background.
        connectedLinks.forEach((link) => {
            if (link.attributes.z <= maxZ) {
                link.set('z', maxZ + 1, { ui: true });
            }
        });

        element.stopBatch('to-front');

        // Before we start looking for suitable parent we remove the current one.
        const parentId = element.parent();
        if (parentId) {
            const parent = graph.getCell(parentId);
            parent.unembed(element, { ui: true });
            data.initialParentId = parentId;
        } else {
            data.initialParentId = null;
        }
    },

    processEmbedding: function(data = {}, evt, x, y) {

        const model = data.model || this.model;
        const paper = data.paper || this.paper;
        const graph = paper.model;
        const { findParentBy, frontParentOnly, validateEmbedding } = paper.options;

        let candidates;
        if (isFunction(findParentBy)) {
            candidates = toArray(findParentBy.call(graph, this, evt, x, y));
        } else if (findParentBy === 'pointer') {
            candidates = toArray(graph.findModelsFromPoint({ x, y }));
        } else {
            candidates = graph.findModelsUnderElement(model, { searchBy: findParentBy });
        }

        candidates = candidates.filter((el) => {
            return (el instanceof Cell) && (model.id !== el.id) && !el.isEmbeddedIn(model);
        });

        if (frontParentOnly) {
            // pick the element with the highest `z` index
            candidates = candidates.slice(-1);
        }

        let newCandidateView = null;
        const prevCandidateView = data.candidateEmbedView;

        // iterate over all candidates starting from the last one (has the highest z-index).
        for (let i = candidates.length - 1; i >= 0; i--) {
            const candidate = candidates[i];
            if (prevCandidateView && prevCandidateView.model.id == candidate.id) {
                // candidate remains the same
                newCandidateView = prevCandidateView;
                break;
            } else {
                const view = candidate.findView(paper);
                if (!isFunction(validateEmbedding) || validateEmbedding.call(paper, this, view)) {
                    // flip to the new candidate
                    newCandidateView = view;
                    break;
                }
            }
        }

        if (newCandidateView && newCandidateView != prevCandidateView) {
            // A new candidate view found. Highlight the new one.
            this.clearEmbedding(data);
            data.candidateEmbedView = newCandidateView.highlight(
                newCandidateView.findProxyNode(null, 'container'),
                { embedding: true }
            );
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
            candidateView.unhighlight(
                candidateView.findProxyNode(null, 'container'),
                { embedding: true }
            );
            data.candidateEmbedView = null;
        }
    },

    finalizeEmbedding: function(data = {}) {

        const candidateView = data.candidateEmbedView;
        const element = data.model || this.model;
        const paper = data.paper || this.paper;

        if (candidateView) {

            // We finished embedding. Candidate view is chosen to become the parent of the model.
            candidateView.model.embed(element, { ui: true });
            candidateView.unhighlight(candidateView.findProxyNode(null, 'container'), { embedding: true });

            data.candidateEmbedView = null;

        } else {

            const { validateUnembedding } = paper.options;
            const { initialParentId } = data;
            // The element was originally embedded into another element.
            // The interaction would unembed the element. Let's validate
            // if the element can be unembedded.
            if (
                initialParentId &&
                typeof validateUnembedding === 'function' &&
                !validateUnembedding.call(paper, this)
            ) {
                this._disallowUnembed(data);
                return;
            }
        }

        paper.model.getConnectedLinks(element, { deep: true }).forEach(link => {
            link.reparent({ ui: true });
        });
    },

    _disallowUnembed: function(data) {
        const { model, whenNotAllowed = 'revert' } = data;
        const element = model || this.model;
        const paper = data.paper || this.paper;
        const graph = paper.model;
        switch (whenNotAllowed) {
            case 'remove': {
                element.remove({ ui: true });
                break;
            }
            case 'revert': {
                const { initialParentId, initialPosition, initialZIndices } = data;
                // Revert the element's position (and the position of its embedded cells if any)
                if (initialPosition) {
                    const { x, y } = initialPosition;
                    element.position(x, y, { deep: true, ui: true });
                }
                // Revert all the z-indices changed during the embedding
                if (initialZIndices) {
                    Object.keys(initialZIndices).forEach(id => {
                        const cell = graph.getCell(id);
                        if (cell) {
                            cell.set('z', initialZIndices[id], { ui: true });
                        }
                    });
                }
                // Revert the original parent
                const parent = graph.getCell(initialParentId);
                if (parent) {
                    parent.embed(element, { ui: true });
                }
                break;
            }
        }
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

    findProxyNode: function(el, type) {
        el || (el = this.el);
        const nodeSelector = el.getAttribute(`${type}-selector`);
        if (nodeSelector) {
            const port = this.findAttribute('port', el);
            if (port) {
                const proxyPortNode = this.findPortNode(port, nodeSelector);
                if (proxyPortNode) return proxyPortNode;
            } else {
                const proxyNode = this.findNode(nodeSelector);
                if (proxyNode) return proxyNode;
            }
        }
        return el;
    },

    // Interaction. The controller part.
    // ---------------------------------

    notifyPointerdown(evt, x, y) {
        CellView.prototype.pointerdown.call(this, evt, x, y);
        this.notify('element:pointerdown', evt, x, y);
    },

    notifyPointermove(evt, x, y) {
        CellView.prototype.pointermove.call(this, evt, x, y);
        this.notify('element:pointermove', evt, x, y);
    },

    notifyPointerup(evt, x, y) {
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

        this.notifyPointerdown(evt, x, y);
        this.dragStart(evt, x, y);
    },

    pointermove: function(evt, x, y) {

        const data = this.eventData(evt);
        const { targetMagnet, action, delegatedView } = data;

        if (targetMagnet) {
            this.magnetpointermove(evt, targetMagnet, x, y);
        }

        switch (action) {
            case DragActions.MAGNET:
                this.dragMagnet(evt, x, y);
                break;
            case DragActions.MOVE:
                (delegatedView || this).drag(evt, x, y);
            // eslint: no-fallthrough=false
            default:
                if (data.preventPointerEvents) break;
                this.notifyPointermove(evt, x, y);
                break;
        }

        // Make sure the element view data is passed along.
        // It could have been wiped out in the handlers above.
        this.eventData(evt, data);
    },

    pointerup: function(evt, x, y) {

        const data = this.eventData(evt);
        const { targetMagnet, action, delegatedView } = data;

        if (targetMagnet) {
            this.magnetpointerup(evt, targetMagnet, x, y);
        }

        switch (action) {
            case DragActions.MAGNET:
                this.dragMagnetEnd(evt, x, y);
                break;
            case DragActions.MOVE:
                (delegatedView || this).dragEnd(evt, x, y);
            // eslint: no-fallthrough=false
            default:
                if (data.preventPointerEvents) break;
                this.notifyPointerup(evt, x, y);
        }

        if (targetMagnet) {
            this.magnetpointerclick(evt, targetMagnet, x, y);
        }

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

        const { currentTarget: targetMagnet } = evt;
        this.magnetpointerdown(evt, targetMagnet, x, y);
        this.eventData(evt, { targetMagnet });
        this.dragMagnetStart(evt, x, y);
    },

    magnetpointerdown: function(evt, magnet, x, y) {

        this.notify('element:magnet:pointerdown', evt, magnet, x, y);
    },

    magnetpointermove: function(evt, magnet, x, y) {

        this.notify('element:magnet:pointermove', evt, magnet, x, y);
    },

    magnetpointerup: function(evt, magnet, x, y) {

        this.notify('element:magnet:pointerup', evt, magnet, x, y);
    },

    magnetpointerdblclick: function(evt, magnet, x, y) {

        this.notify('element:magnet:pointerdblclick', evt, magnet, x, y);
    },

    magnetcontextmenu: function(evt, magnet, x, y) {

        this.notify('element:magnet:contextmenu', evt, magnet, x, y);
    },

    // Drag Start Handlers

    dragStart: function(evt, x, y) {

        if (this.isDefaultInteractionPrevented(evt)) return;

        var view = this.getDelegatedView();
        if (!view || !view.can('elementMove')) return;

        this.eventData(evt, {
            action: DragActions.MOVE,
            delegatedView: view
        });

        const position = view.model.position();
        view.eventData(evt, {
            initialPosition: position,
            pointerOffset: position.difference(x, y),
            restrictedArea: this.paper.getRestrictedArea(view, x, y)
        });
    },

    dragMagnetStart: function(evt, x, y) {

        const { paper } = this;
        const isPropagationAlreadyStopped = evt.isPropagationStopped();
        if (isPropagationAlreadyStopped) {
            // Special case when the propagation was already stopped
            // on the `element:magnet:pointerdown` event.
            // Do not trigger any `element:pointer*` events
            // but still start the magnet dragging.
            this.eventData(evt, { preventPointerEvents: true });
        }

        if (this.isDefaultInteractionPrevented(evt) || !this.can('addLinkFromMagnet')) {
            // Stop the default action, which is to start dragging a link.
            return;
        }

        const { targetMagnet = evt.currentTarget } = this.eventData(evt);
        evt.stopPropagation();

        // Invalid (Passive) magnet. Start dragging the element.
        if (!paper.options.validateMagnet.call(paper, this, targetMagnet, evt)) {
            if (isPropagationAlreadyStopped) {
                // Do not trigger `element:pointerdown` and start element dragging
                // if the propagation was stopped.
                this.dragStart(evt, x, y);
                // The `element:pointerdown` event is not triggered because
                // of `preventPointerEvents` flag.
            } else {
                // We need to reset the action
                // to `MOVE` so that the element is dragged.
                this.pointerdown(evt, x, y);
            }
            return;
        }

        // Valid magnet. Start dragging a link.
        if (paper.options.magnetThreshold <= 0) {
            this.dragLinkStart(evt, targetMagnet, x, y);
        }
        this.eventData(evt, { action: DragActions.MAGNET });
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
            this.processEmbedding(data, evt, x, y);
        }

        this.eventData(evt, {
            embedding
        });
    },

    dragMagnet: function(evt, x, y) {
        this.dragLink(evt, x, y);
    },

    // Drag End Handlers

    dragEnd: function(evt, x, y) {

        var data = this.eventData(evt);
        if (data.embedding) this.finalizeEmbedding(data);
    },

    dragMagnetEnd: function(evt, x, y) {
        this.dragLinkEnd(evt, x, y);
    },

    magnetpointerclick: function(evt, magnet, x, y) {
        var paper = this.paper;
        if (paper.eventData(evt).mousemoved > paper.options.clickThreshold) return;
        this.notify('element:magnet:pointerclick', evt, magnet, x, y);
    }

}, {

    Flags: Flags,
});

assign(ElementView.prototype, elementViewPortPrototype);
