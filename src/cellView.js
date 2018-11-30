// joint.dia.CellView base view and controller.
// --------------------------------------------

// This is the base view and controller for `joint.dia.ElementView` and `joint.dia.LinkView`.

import { View } from './mvc';
import * as util from './util';
import { V } from './vectorizer';
import * as g from './geometry';
import { ToolsView } from './toolsView';

export const CellView = View.extend({

    tagName: 'g',

    svgElement: true,

    selector: 'root',

    className: function() {

        const classNames = ['cell'];
        const type = this.model.get('type');

        if (type) {

            type.toLowerCase().split('.').forEach(function(value, index, list) {
                classNames.push('type-' + list.slice(0, index + 1).join('-'));
            });
        }

        return classNames.join(' ');
    },

    attributes: function() {

        return { 'model-id': this.model.id };
    },

    constructor: function(options) {

        // Make sure a global unique id is assigned to this view. Store this id also to the properties object.
        // The global unique id makes sure that the same view can be rendered on e.g. different machines and
        // still be associated to the same object among all those clients. This is necessary for real-time
        // collaboration mechanism.
        options.id = options.id || util.guid(this);

        View.call(this, options);
    },

    init: function() {

        util.bindAll(this, 'remove', 'update');

        // Store reference to this to the <g> DOM element so that the view is accessible through the DOM tree.
        this.$el.data('view', this);

        // Add the cell's type to the view's element as a data attribute.
        this.$el.attr('data-type', this.model.get('type'));

        this.listenTo(this.model, 'change:attrs', this.onChangeAttrs);
    },


    parseDOMJSON: function(markup, root) {

        const doc = util.parseDOMJSON(markup);
        const selectors = doc.selectors;
        const groups = doc.groupSelectors;
        for (const group in groups) {
            if (selectors[group]) throw new Error('dia.CellView: ambigious group selector');
            selectors[group] = groups[group];
        }
        if (root) {
            const rootSelector = this.selector;
            if (selectors[rootSelector]) throw new Error('dia.CellView: ambiguous root selector.');
            selectors[rootSelector] = root;
        }
        return { fragment: doc.fragment, selectors: selectors };
    },

    onChangeAttrs: function(cell, attrs, opt) {

        if (opt.dirty) {

            // dirty flag could be set when a model attribute was removed and it needs to be cleared
            // also from the DOM element. See cell.removeAttr().
            return this.render();
        }

        return this.update(cell, attrs, opt);
    },

    // Return `true` if cell link is allowed to perform a certain UI `feature`.
    // Example: `can('vertexMove')`, `can('labelMove')`.
    can: function(feature) {

        const interactive = util.isFunction(this.options.interactive)
            ? this.options.interactive(this)
            : this.options.interactive;

        return (util.isObject(interactive) && interactive[feature] !== false) ||
            (util.isBoolean(interactive) && interactive !== false);
    },

    findBySelector: function(selector, root, selectors) {

        root || (root = this.el);
        selectors || (selectors = this.selectors);

        // These are either descendants of `this.$el` of `this.$el` itself.
        // `.` is a special selector used to select the wrapping `<g>` element.
        if (!selector || selector === '.') return [root];
        if (selectors) {
            const nodes = selectors[selector];
            if (nodes) {
                if (Array.isArray(nodes)) return nodes;
                return [nodes];
            }
        }
        // Maintaining backwards compatibility
        // e.g. `circle:first` would fail with querySelector() call
        return $(root).find(selector).toArray();
    },

    notify: function(eventName) {

        if (this.paper) {

            const args = Array.prototype.slice.call(arguments, 1);

            // Trigger the event on both the element itself and also on the paper.
            this.trigger.apply(this, [eventName].concat(args));

            // Paper event handlers receive the view object as the first argument.
            this.paper.trigger.apply(this.paper, [eventName, this].concat(args));
        }
    },

    // ** Deprecated **
    getStrokeBBox: function(el) {
        // Return a bounding box rectangle that takes into account stroke.
        // Note that this is a naive and ad-hoc implementation that does not
        // works only in certain cases and should be replaced as soon as browsers will
        // start supporting the getStrokeBBox() SVG method.
        // @TODO any better solution is very welcome!

        const isMagnet = !!el;

        el = el || this.el;
        const bbox = V(el).getBBox({ target: this.paper.viewport });
        let strokeWidth;
        if (isMagnet) {

            strokeWidth = V(el).attr('stroke-width');

        } else {

            strokeWidth = this.model.attr('rect/stroke-width') || this.model.attr('circle/stroke-width') || this.model.attr('ellipse/stroke-width') || this.model.attr('path/stroke-width');
        }

        strokeWidth = parseFloat(strokeWidth) || 0;

        return g.rect(bbox).moveAndExpand({ x: -strokeWidth / 2, y: -strokeWidth / 2, width: strokeWidth, height: strokeWidth });
    },

    getBBox: function() {

        return this.vel.getBBox({ target: this.paper.svg });
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

        let $el = this.$(el);
        const $rootEl = this.$el;

        if ($el.length === 0) {
            $el = $rootEl;
        }

        do {

            const magnet = $el.attr('magnet');
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

        let selector;

        if (el === this.el) {
            if (typeof prevSelector === 'string') selector = '> ' + prevSelector;
            return selector;
        }

        if (el) {

            const nthChild = V(el).index() + 1;
            selector = el.tagName + ':nth-child(' + nthChild + ')';

            if (prevSelector) {
                selector += ' > ' + prevSelector;
            }

            selector = this.getSelector(el.parentNode, selector);
        }

        return selector;
    },

    getLinkEnd: function(magnet, x, y, link, endType) {

        const model = this.model;
        const id = model.id;
        const port = this.findAttribute('port', magnet);
        // Find a unique `selector` of the element under pointer that is a magnet.
        const selector = magnet.getAttribute('joint-selector');

        let end = { id: id };
        if (selector != null) end.magnet = selector;
        if (port != null) {
            end.port = port;
            if (!model.hasPort(port) && !selector) {
                // port created via the `port` attribute (not API)
                end.selector = this.getSelector(magnet);
            }
        } else if (selector == null && this.el !== magnet) {
            end.selector = this.getSelector(magnet);
        }

        const paper = this.paper;
        const connectionStrategy = paper.options.connectionStrategy;
        if (typeof connectionStrategy === 'function') {
            const strategy = connectionStrategy.call(paper, end, this, magnet, new g.Point(x, y), link, endType);
            if (strategy) end = strategy;
        }

        return end;
    },

    getMagnetFromLinkEnd: function(end) {

        const root = this.el;
        const port = end.port;
        let selector = end.magnet;
        let magnet;
        if (port != null && this.model.hasPort(port)) {
            magnet = this.findPortNode(port, selector) || root;
        } else {
            if (!selector) selector = end.selector;
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

        if (!util.isEmpty(attrs)) {
            if (node instanceof SVGElement) {
                V(node).attr(attrs);
            } else {
                $(node).attr(attrs);
            }
        }
    },

    processNodeAttributes: function(node, attrs) {

        let attrName, attrVal, def, i, n;
        let normalAttrs, setAttrs, positionAttrs, offsetAttrs;
        const relatives = [];
        // divide the attributes between normal and special
        for (attrName in attrs) {
            if (!attrs.hasOwnProperty(attrName)) continue;
            attrVal = attrs[attrName];
            def = this.getAttributeDefinition(attrName);
            if (def && (!util.isFunction(def.qualify) || def.qualify.call(this, attrVal, node, attrs))) {
                if (util.isString(def.set)) {
                    normalAttrs || (normalAttrs = {});
                    normalAttrs[def.set] = attrVal;
                }
                if (attrVal !== null) {
                    relatives.push(attrName, def);
                }
            } else {
                normalAttrs || (normalAttrs = {});
                normalAttrs[util.toKebabCase(attrName)] = attrVal;
            }
        }

        // handle the rest of attributes via related method
        // from the special attributes namespace.
        for (i = 0, n = relatives.length; i < n; i+=2) {
            attrName = relatives[i];
            def = relatives[i+1];
            attrVal = attrs[attrName];
            if (util.isFunction(def.set)) {
                setAttrs || (setAttrs = {});
                setAttrs[attrName] = attrVal;
            }
            if (util.isFunction(def.position)) {
                positionAttrs || (positionAttrs = {});
                positionAttrs[attrName] = attrVal;
            }
            if (util.isFunction(def.offset)) {
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

        let attrName, attrVal, def;
        const rawAttrs = attrs.raw || {};
        let nodeAttrs = attrs.normal || {};
        const setAttrs = attrs.set;
        const positionAttrs = attrs.position;
        const offsetAttrs = attrs.offset;

        for (attrName in setAttrs) {
            attrVal = setAttrs[attrName];
            def = this.getAttributeDefinition(attrName);
            // SET - set function should return attributes to be set on the node,
            // which will affect the node dimensions based on the reference bounding
            // box. e.g. `width`, `height`, `d`, `rx`, `ry`, `points
            const setResult = def.set.call(this, attrVal, refBBox.clone(), node, rawAttrs);
            if (util.isObject(setResult)) {
                util.assign(nodeAttrs, setResult);
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

        // The final translation of the sub-element.
        const nodeTransform = nodeAttrs.transform;
        const nodeMatrix = V.transformStringToMatrix(nodeTransform);
        const nodePosition = g.Point(nodeMatrix.e, nodeMatrix.f);
        if (nodeTransform) {
            nodeAttrs = util.omit(nodeAttrs, 'transform');
            nodeMatrix.e = nodeMatrix.f = 0;
        }

        // Calculate node scale determined by the scalable group
        // only if later needed.
        let sx, sy, translation;
        if (positionAttrs || offsetAttrs) {
            const nodeScale = this.getNodeScale(node, opt.scalableNode);
            sx = nodeScale.sx;
            sy = nodeScale.sy;
        }

        let positioned = false;
        for (attrName in positionAttrs) {
            attrVal = positionAttrs[attrName];
            def = this.getAttributeDefinition(attrName);
            // POSITION - position function should return a point from the
            // reference bounding box. The default position of the node is x:0, y:0 of
            // the reference bounding box or could be further specify by some
            // SVG attributes e.g. `x`, `y`
            translation = def.position.call(this, attrVal, refBBox.clone(), node, rawAttrs);
            if (translation) {
                nodePosition.offset(g.Point(translation).scale(sx, sy));
                positioned || (positioned = true);
            }
        }

        // The node bounding box could depend on the `size` set from the previous loop.
        // Here we know, that all the size attributes have been already set.
        this.setNodeAttributes(node, nodeAttrs);

        let offseted = false;
        if (offsetAttrs) {
            // Check if the node is visible
            const nodeClientRect = node.getBoundingClientRect();
            if (nodeClientRect.width > 0 && nodeClientRect.height > 0) {
                const nodeBBox = V.transformRect(node.getBBox(), nodeMatrix).scale(1 / sx, 1 / sy);
                for (attrName in offsetAttrs) {
                    attrVal = offsetAttrs[attrName];
                    def = this.getAttributeDefinition(attrName);
                    // OFFSET - offset function should return a point from the element
                    // bounding box. The default offset point is x:0, y:0 (origin) or could be further
                    // specify with some SVG attributes e.g. `text-anchor`, `cx`, `cy`
                    translation = def.offset.call(this, attrVal, nodeBBox, node, rawAttrs);
                    if (translation) {
                        nodePosition.offset(g.Point(translation).scale(sx, sy));
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
        let sx, sy;
        if (scalableNode && scalableNode.contains(node)) {
            const scale = scalableNode.scale();
            sx = 1 / scale.sx;
            sy = 1 / scale.sy;
        } else {
            sx = 1;
            sy = 1;
        }

        return { sx: sx, sy: sy };
    },

    findNodesAttributes: function(attrs, root, selectorCache, selectors) {

        let i, n, nodeAttrs, nodeId;
        const nodesAttrs = {};
        const mergeIds = [];
        for (const selector in attrs) {
            if (!attrs.hasOwnProperty(selector)) continue;
            const selected = selectorCache[selector] = this.findBySelector(selector, root, selectors);
            for (i = 0, n = selected.length; i < n; i++) {
                const node = selected[i];
                nodeId = V.ensureId(node);
                nodeAttrs = attrs[selector];
                // "unique" selectors are selectors that referencing a single node (defined by `selector`)
                // groupSelector referencing a single node is not "unique"
                const unique = (selectors && selectors[selector] === node);
                const prevNodeAttrs = nodesAttrs[nodeId];
                if (prevNodeAttrs) {
                    // Note, that nodes referenced by deprecated `CSS selectors` are not taken into account.
                    // e.g. css:`.circle` and selector:`circle` can be applied in a random order
                    if (!prevNodeAttrs.array) {
                        mergeIds.push(nodeId);
                        prevNodeAttrs.array = true;
                        prevNodeAttrs.attributes = [prevNodeAttrs.attributes];
                        prevNodeAttrs.selectedLength = [prevNodeAttrs.selectedLength];
                    }
                    const attributes = prevNodeAttrs.attributes;
                    const selectedLength = prevNodeAttrs.selectedLength;
                    if (unique) {
                        // node referenced by `selector`
                        attributes.unshift(nodeAttrs);
                        selectedLength.unshift(-1);
                    } else {
                        // node referenced by `groupSelector`
                        const sortIndex = util.sortedIndex(selectedLength, n);
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
            nodeAttrs.attributes = util.merge.apply(util, [{}].concat(nodeAttrs.attributes.reverse()));
        }

        return nodesAttrs;
    },

    getEventTarget: function(evt) {
        // Touchmove/Touchend event's target is not reflecting the element under the coordinates as mousemove does.
        // It holds the element when a touchstart triggered.
        const type = evt.type;
        if (type === 'touchmove' || type === 'touchend') {
            return document.elementFromPoint(evt.clientX, evt.clientY);
        }

        return evt.target;
    },

    // Default is to process the `model.attributes.attrs` object and set attributes on sub-elements based on the selectors,
    // unless `attrs` parameter was passed.
    updateDOMSubtreeAttributes: function(rootNode, attrs, opt) {

        opt || (opt = {});
        opt.rootBBox || (opt.rootBBox = g.Rect());
        opt.selectors || (opt.selectors = this.selectors); // selector collection to use

        // Cache table for query results and bounding box calculation.
        // Note that `selectorCache` needs to be invalidated for all
        // `updateAttributes` calls, as the selectors might pointing
        // to nodes designated by an attribute or elements dynamically
        // created.
        const selectorCache = {};
        const bboxCache = {};
        const relativeItems = [];
        let item, node, nodeAttrs, nodeData, processedAttrs;

        const roAttrs = opt.roAttributes;
        const nodesAttrs = this.findNodesAttributes(roAttrs || attrs, rootNode, selectorCache, opt.selectors);
        // `nodesAttrs` are different from all attributes, when
        // rendering only  attributes sent to this method.
        const nodesAllAttrs = (roAttrs)
            ? this.findNodesAttributes(attrs, rootNode, selectorCache, opt.selectors)
            : nodesAttrs;

        for (const nodeId in nodesAttrs) {
            nodeData = nodesAttrs[nodeId];
            nodeAttrs = nodeData.attributes;
            node = nodeData.node;
            processedAttrs = this.processNodeAttributes(node, nodeAttrs);

            if (!processedAttrs.set && !processedAttrs.position && !processedAttrs.offset) {
                // Set all the normal attributes right on the SVG/HTML element.
                this.setNodeAttributes(node, processedAttrs.normal);

            } else {

                const nodeAllAttrs = nodesAllAttrs[nodeId] && nodesAllAttrs[nodeId].attributes;
                const refSelector = (nodeAllAttrs && (nodeAttrs.ref === undefined))
                    ? nodeAllAttrs.ref
                    : nodeAttrs.ref;

                let refNode;
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
                const itemIndex = relativeItems.findIndex(function(item) {
                    return item.refNode === node;
                });

                if (itemIndex > -1) {
                    relativeItems.splice(itemIndex, 0, item);
                } else {
                    relativeItems.push(item);
                }
            }
        }

        let refNode;
        for (let i = 0, n = relativeItems.length; i < n; i++) {
            item = relativeItems[i];
            node = item.node;
            refNode = item.refNode;

            // Find the reference element bounding box. If no reference was provided, we
            // use the optional bounding box.
            const refNodeId = refNode ? V.ensureId(refNode) : '';
            let refBBox = bboxCache[refNodeId];
            if (!refBBox) {
                // Get the bounding box of the reference element relative to the `rotatable` `<g>` (without rotation)
                // or to the root `<g>` element if no rotatable group present if reference node present.
                // Uses the bounding box provided.
                refBBox = bboxCache[refNodeId] = (refNode)
                    ? V(refNode).getBBox({ target: (opt.rotatableNode || rootNode) })
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

            this.updateRelativeAttributes(node, processedAttrs, refBBox, opt);
        }
    },

    mergeProcessedAttributes: function(processedAttrs, roProcessedAttrs) {

        processedAttrs.set || (processedAttrs.set = {});
        processedAttrs.position || (processedAttrs.position = {});
        processedAttrs.offset || (processedAttrs.offset = {});

        util.assign(processedAttrs.set, roProcessedAttrs.set);
        util.assign(processedAttrs.position, roProcessedAttrs.position);
        util.assign(processedAttrs.offset, roProcessedAttrs.offset);

        // Handle also the special transform property.
        const transform = processedAttrs.normal && processedAttrs.normal.transform;
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
        const toolsView = this._toolsView;
        if (!toolsView) return false;
        if (!name) return true;
        return (toolsView.getName() === name);
    },

    addTools: function(toolsView) {

        this.removeTools();

        if (toolsView instanceof ToolsView) {
            this._toolsView = toolsView;
            toolsView.configure({ relatedView: this });
            toolsView.listenTo(this.paper, 'tools:event', this.onToolEvent.bind(this));
            toolsView.mount();
        }
        return this;
    },

    updateTools: function(opt) {

        const toolsView = this._toolsView;
        if (toolsView) toolsView.update(opt);
        return this;
    },

    removeTools: function() {

        const toolsView = this._toolsView;
        if (toolsView) {
            toolsView.remove();
            this._toolsView = null;
        }
        return this;
    },

    hideTools: function() {

        const toolsView = this._toolsView;
        if (toolsView) toolsView.hide();
        return this;
    },

    showTools: function() {

        const toolsView = this._toolsView;
        if (toolsView) toolsView.show();
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

    // These functions are supposed to be overridden by the views that inherit from `joint.dia.Cell`,
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

    setInteractivity: function(value) {

        this.options.interactive = value;
    }
}, {

    dispatchToolsEvent: function(paper, event) {
        //TODO v.talas es6 paper
        if ((typeof event === 'string') && (paper instanceof joint.dia.Paper)) {
            paper.trigger('tools:event', event);
        }
    }
});
