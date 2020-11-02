import { config } from '../config/index.mjs';
import { View } from '../mvc/index.mjs';
import {
    assign,
    guid,
    omit,
    parseDOMJSON,
    isFunction,
    isObject,
    isPlainObject,
    isBoolean,
    isEmpty,
    isString,
    toKebabCase,
    sortedIndex,
    merge,
    uniq
} from '../util/index.mjs';
import { Point, Rect } from '../g/index.mjs';
import V from '../V/index.mjs';
import $ from 'jquery';
import { HighlighterView } from './HighlighterView.mjs';

const HighlightingTypes = {
    DEFAULT: 'default',
    EMBEDDING: 'embedding',
    CONNECTING: 'connecting',
    MAGNET_AVAILABILITY: 'magnetAvailability',
    ELEMENT_AVAILABILITY: 'elementAvailability'
};

// CellView base view and controller.
// --------------------------------------------

// This is the base view and controller for `ElementView` and `LinkView`.
export const CellView = View.extend({

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
            if (!presentationAttributes.hasOwnProperty(attribute)) continue;
            var labels = presentationAttributes[attribute];
            if (!Array.isArray(labels)) labels = [labels];
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
        if (!Array.isArray(initFlag)) initFlag = [initFlag];
        for (i = 0, n = initFlag.length; i < n; i++) {
            label = initFlag[i];
            if (!flags[label]) flags[label] = 1<<(shift++);
        }

        // 26 - 30 are reserved for paper flags
        // 31+ overflows maximal number
        if (shift > 25) throw new Error('dia.CellView: Maximum number of flags exceeded.');

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
        if (!flags) return 0;
        var flag = 0;
        if (Array.isArray(label)) {
            for (var i = 0, n = label.length; i < n; i++) flag |= flags[label[i]];
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
        if (opt.updateHandled || !flag) return;
        if (opt.dirty && this.hasFlag(flag, 'UPDATE')) flag |= this.getFlag('RENDER');
        // TODO: tool changes does not need to be sync
        // Fix Segments tools
        if (opt.tool) opt.async = false;
        this.requestUpdate(flag, opt);
    },

    requestUpdate: function(flags, opt) {
        const { paper } = this;
        if (paper && flags > 0) {
            paper.requestViewUpdate(this, flags, this.UPDATE_PRIORITY, opt);
        }
    },

    parseDOMJSON: function(markup, root) {

        var doc = parseDOMJSON(markup);
        var selectors = doc.selectors;
        var groups = doc.groupSelectors;
        for (var group in groups) {
            if (selectors[group]) throw new Error('dia.CellView: ambiguous group selector');
            selectors[group] = groups[group];
        }
        if (root) {
            var rootSelector = this.selector;
            if (selectors[rootSelector]) throw new Error('dia.CellView: ambiguous root selector.');
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
        if (!selector || selector === '.') return [root];
        if (selectors) {
            var nodes = selectors[selector];
            if (nodes) {
                if (Array.isArray(nodes)) return nodes;
                return [nodes];
            }
        }

        // Maintaining backwards compatibility
        // e.g. `circle:first` would fail with querySelector() call
        if (config.useCSSSelectors) return $(root).find(selector).toArray();

        return [];
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

    _notifyHighlight: function(eventName, el, opt = {}) {
        const { el: rootNode } = this;
        let node;
        if (typeof el === 'string') {
            [node = rootNode] = this.findBySelector(el);
        } else {
            [node = rootNode] = this.$(el);
        }
        // set partial flag if the highlighted element is not the entire view.
        opt.partial = (node !== rootNode);
        // translate type flag into a type string
        if (opt.type === undefined) {
            let type;
            switch (true) {
                case opt.embedding:
                    type = HighlightingTypes.EMBEDDING;
                    break;
                case opt.connecting:
                    type = HighlightingTypes.CONNECTING;
                    break;
                case opt.magnetAvailability:
                    type = HighlightingTypes.MAGNET_AVAILABILITY;
                    break;
                case opt.elementAvailability:
                    type = HighlightingTypes.ELEMENT_AVAILABILITY;
                    break;
                default:
                    type = HighlightingTypes.DEFAULT;
                    break;
            }
            opt.type = type;
        }
        this.notify(eventName, node, opt);
        return this;
    },

    highlight: function(el, opt) {
        return this._notifyHighlight('cell:highlight', el, opt);
    },

    unhighlight: function(el, opt = {}) {
        return this._notifyHighlight('cell:unhighlight', el, opt);
    },

    // Find the closest element that has the `magnet` attribute set to `true`. If there was not such
    // an element found, return the root element of the cell view.
    findMagnet: function(el) {

        const root = this.el;
        let magnet = this.$(el)[0];
        if (!magnet) {
            magnet = root;
        }

        do {
            const magnetAttribute = magnet.getAttribute('magnet');
            const isMagnetRoot = (magnet === root);
            if ((magnetAttribute || isMagnetRoot) && magnetAttribute !== 'false') {
                return magnet;
            }
            if (isMagnetRoot) {
                // If the overall cell has set `magnet === false`, then return `undefined` to
                // announce there is no magnet found for this cell.
                // This is especially useful to set on cells that have 'ports'. In this case,
                // only the ports have set `magnet === true` and the overall element has `magnet === false`.
                return undefined;
            }
            magnet = magnet.parentNode;
        } while (magnet);

        return undefined;
    },

    findProxyNode: function(el, type) {
        el || (el = this.el);
        const nodeSelector = el.getAttribute(`${type}-selector`);
        if (nodeSelector) {
            const [proxyNode] = this.findBySelector(nodeSelector);
            if (proxyNode) return proxyNode;
        }
        return el;
    },

    // Construct a unique selector for the `el` element within this view.
    // `prevSelector` is being collected through the recursive call.
    // No value for `prevSelector` is expected when using this method.
    getSelector: function(el, prevSelector) {

        var selector;

        if (el === this.el) {
            if (typeof prevSelector === 'string') selector = '> ' + prevSelector;
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

    getLinkEnd: function(magnet, ...args) {

        var model = this.model;
        var id = model.id;
        var port = this.findAttribute('port', magnet);
        // Find a unique `selector` of the element under pointer that is a magnet.
        var selector = magnet.getAttribute('joint-selector');

        var end = { id: id };
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

        return this.customizeLinkEnd(end, magnet, ...args);
    },

    customizeLinkEnd: function(end, magnet, x, y, link, endType) {
        const { paper } = this;
        const { connectionStrategy } = paper.options;
        if (typeof connectionStrategy === 'function') {
            var strategy = connectionStrategy.call(paper, end, this, magnet, new Point(x, y), link, endType, paper);
            if (strategy) return strategy;
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
            if (!selector) selector = end.selector;
            if (!selector && port != null) {
                // link end has only `id` and `port` property referencing
                // a port created via the `port` attribute (not API).
                selector = '[port="' + port + '"]';
            }
            magnet = this.findBySelector(selector, root, this.selectors)[0];
        }

        return this.findProxyNode(magnet, 'magnet');
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
            if (!attrs.hasOwnProperty(attrName)) continue;
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
        var nodePosition = Point(nodeMatrix.e, nodeMatrix.f);
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
                nodePosition.offset(Point(translation).scale(sx, sy));
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
                        nodePosition.offset(Point(translation).scale(sx, sy));
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
        if (!metrics) return {};
        var id = V.ensureId(magnet);
        var value = metrics[id];
        if (!value) value = metrics[id] = {};
        return value;
    },

    getNodeData: function(magnet) {

        var metrics = this.nodeCache(magnet);
        if (!metrics.data) metrics.data = {};
        return metrics.data;
    },

    getNodeBoundingRect: function(magnet) {

        var metrics = this.nodeCache(magnet);
        if (metrics.boundingRect === undefined) metrics.boundingRect = V(magnet).getBBox();
        return new Rect(metrics.boundingRect);
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
        if (metrics.geometryShape === undefined) metrics.geometryShape = V(magnet).toGeometryShape();
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
            if (!attrs.hasOwnProperty(selector)) continue;
            nodeAttrs = attrs[selector];
            if (!isPlainObject(nodeAttrs)) continue; // Not a valid selector-attributes pair
            var selected = selectorCache[selector] = this.findBySelector(selector, root, selectors);
            for (i = 0, n = selected.length; i < n; i++) {
                var node = selected[i];
                nodeId = V.ensureId(node);
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
            nodeAttrs.attributes = merge({}, ...nodeAttrs.attributes.reverse());
        }

        return nodesAttrs;
    },

    getEventTarget: function(evt, opt = {}) {
        // Touchmove/Touchend event's target is not reflecting the element under the coordinates as mousemove does.
        // It holds the element when a touchstart triggered.
        const { target, type, clientX = 0, clientY = 0 } = evt;
        if (opt.fromPoint || type === 'touchmove' || type === 'touchend') {
            return document.elementFromPoint(clientX, clientY);
        }

        return target;
    },

    // Default is to process the `model.attributes.attrs` object and set attributes on subelements based on the selectors,
    // unless `attrs` parameter was passed.
    updateDOMSubtreeAttributes: function(rootNode, attrs, opt) {

        opt || (opt = {});
        opt.rootBBox || (opt.rootBBox = Rect());
        opt.selectors || (opt.selectors = this.selectors); // selector collection to use

        // Cache table for query results and bounding box calculation.
        // Note that `selectorCache` needs to be invalidated for all
        // `updateAttributes` calls, as the selectors might pointing
        // to nodes designated by an attribute or elements dynamically
        // created.
        var selectorCache = {};
        var bboxCache = {};
        var relativeItems = [];
        var relativeRefItems = [];
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
                        throw new Error('dia.CellView: "' + refSelector + '" reference does not exist.');
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

                if (refNode) {
                    // If an element in the list is positioned relative to this one, then
                    // we want to insert this one before it in the list.
                    var itemIndex = relativeRefItems.findIndex(function(item) {
                        return item.refNode === node;
                    });

                    if (itemIndex > -1) {
                        relativeRefItems.splice(itemIndex, 0, item);
                    } else {
                        relativeRefItems.push(item);
                    }
                } else {
                    // A node with no ref attribute. To be updated before the nodes referencing other nodes.
                    // The order of no-ref-items is not specified/important.
                    relativeItems.push(item);
                }
            }
        }

        relativeItems.push(...relativeRefItems);

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
                if (!rotatableMatrix) rotatableMatrix = V.transformStringToMatrix(vRotatable.attr('transform'));
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
        this.removeHighlighters();
    },

    _toolsView: null,

    hasTools: function(name) {
        var toolsView = this._toolsView;
        if (!toolsView) return false;
        if (!name) return true;
        return (toolsView.getName() === name);
    },

    addTools: function(toolsView) {

        this.removeTools();

        if (toolsView) {
            this._toolsView = toolsView;
            toolsView.configure({ relatedView: this });
            toolsView.listenTo(this.paper, 'tools:event', this.onToolEvent.bind(this));
        }
        return this;
    },

    updateTools: function(opt) {

        var toolsView = this._toolsView;
        if (toolsView) toolsView.update(opt);
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
        if (toolsView) toolsView.hide();
        return this;
    },

    showTools: function() {

        var toolsView = this._toolsView;
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

    removeHighlighters: function() {
        HighlighterView.remove(this);
    },

    updateHighlighters: function(dirty = false) {
        HighlighterView.update(this, null, dirty);
    },

    transformHighlighters: function() {
        HighlighterView.transform(this);
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

        const { model } = this;
        const { graph } = model;
        if (graph) {
            model.startBatch('pointer');
            this.eventData(evt, { graph });
        }

        this.notify('cell:pointerdown', evt, x, y);
    },

    pointermove: function(evt, x, y) {

        this.notify('cell:pointermove', evt, x, y);
    },

    pointerup: function(evt, x, y) {

        const { graph } = this.eventData(evt);

        this.notify('cell:pointerup', evt, x, y);

        if (graph) {
            // we don't want to trigger event on model as model doesn't
            // need to be member of collection anymore (remove)
            graph.stopBatch('pointer', { cell: this.model });
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

    checkMouseleave(evt) {
        const { paper } = this;
        if (paper.isAsync()) {
            // Do the updates of the current view synchronously now
            paper.dumpView(this);
        }
        const target = this.getEventTarget(evt, { fromPoint: true });
        const view = paper.findView(target);
        if (view === this) return;
        // Leaving the current view
        this.mouseleave(evt);
        if (!view) return;
        // Entering another view
        view.mouseenter(evt);
    },

    setInteractivity: function(value) {

        this.options.interactive = value;
    }
}, {

    Highlighting: HighlightingTypes,

    addPresentationAttributes: function(presentationAttributes) {
        return merge({}, this.prototype.presentationAttributes, presentationAttributes, function(a, b) {
            if (!a || !b) return;
            if (typeof a === 'string') a = [a];
            if (typeof b === 'string') b = [b];
            if (Array.isArray(a) && Array.isArray(b)) return uniq(a.concat(b));
        });
    }
});
