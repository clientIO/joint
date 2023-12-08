import * as mvc from '../mvc/index.mjs';
import V from '../V/index.mjs';
import { isPlainObject, result } from '../util/util.mjs';

function toArray(obj) {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return [obj];
}

export const HighlighterView = mvc.View.extend({

    tagName: 'g',
    svgElement: true,
    className: 'highlight',

    HIGHLIGHT_FLAG: 1,
    UPDATE_PRIORITY: 3,
    DETACHABLE: false,
    UPDATABLE: true,
    MOUNTABLE: true,

    cellView: null,
    nodeSelector: null,
    node: null,
    updateRequested: false,
    postponedUpdate: false,
    transformGroup: null,
    detachedTransformGroup: null,

    requestUpdate(cellView, nodeSelector) {
        const { paper } = cellView;
        this.cellView = cellView;
        this.nodeSelector = nodeSelector;
        if (paper) {
            this.updateRequested = true;
            paper.requestViewUpdate(this, this.HIGHLIGHT_FLAG, this.UPDATE_PRIORITY);
        }
    },

    confirmUpdate() {
        // The cellView is now rendered/updated since it has a higher update priority.
        this.updateRequested = false;
        const { cellView, nodeSelector } = this;
        if (!cellView.isMounted()) {
            this.postponedUpdate = true;
            return 0;
        }
        this.update(cellView, nodeSelector);
        this.mount();
        this.transform();
        return 0;
    },

    findNode(cellView, nodeSelector = null) {
        let el;
        if (typeof nodeSelector === 'string') {
            el = cellView.findNode(nodeSelector);
        } else if (isPlainObject(nodeSelector)) {
            const isLink = cellView.model.isLink();
            const { label = null, port, selector } = nodeSelector;
            if (isLink && label !== null) {
                // Link Label Selector
                el = cellView.findLabelNode(label, selector);
            } else if (!isLink && port) {
                // Element Port Selector
                el = cellView.findPortNode(port, selector);
            } else {
                // Cell Selector
                el = cellView.findNode(selector);
            }
        } else if (nodeSelector) {
            el = V.toNode(nodeSelector);
            if (!(el instanceof SVGElement)) el = null;
        }
        return el ? el : null;
    },

    getNodeMatrix(cellView, node) {
        const { options } = this;
        const { layer } = options;
        const { rotatableNode } = cellView;
        const nodeMatrix = cellView.getNodeMatrix(node);
        if (rotatableNode) {
            if (layer) {
                if (rotatableNode.contains(node)) {
                    return nodeMatrix;
                }
                // The node is outside of the rotatable group.
                // Compensate the rotation set by transformGroup.
                return cellView.getRootRotateMatrix().inverse().multiply(nodeMatrix);
            } else {
                return cellView.getNodeRotateMatrix(node).multiply(nodeMatrix);
            }
        }
        return nodeMatrix;
    },

    mount() {
        const { MOUNTABLE, cellView, el, options, transformGroup, detachedTransformGroup, postponedUpdate, nodeSelector } = this;
        if (!MOUNTABLE || transformGroup) return;
        if (postponedUpdate) {
            // The cellView was not mounted when the update was requested.
            // The update was postponed until the cellView is mounted.
            this.update(cellView, nodeSelector);
            this.transform();
            return;
        }
        const { vel: cellViewRoot, paper } = cellView;
        const { layer: layerName } = options;
        if (layerName) {
            let vGroup;
            if (detachedTransformGroup) {
                vGroup = detachedTransformGroup;
                this.detachedTransformGroup = null;
            } else {
                vGroup = V('g').addClass('highlight-transform').append(el);
            }
            this.transformGroup = vGroup;
            paper.getLayerView(layerName).insertSortedNode(vGroup.node, options.z);
        } else {
            // TODO: prepend vs append
            if (!el.parentNode || el.nextSibling) {
                // Not appended yet or not the last child
                cellViewRoot.append(el);
            }
        }
    },

    unmount() {
        const { MOUNTABLE, transformGroup, vel } = this;
        if (!MOUNTABLE) return;
        if (transformGroup) {
            this.transformGroup = null;
            this.detachedTransformGroup = transformGroup;
            transformGroup.remove();
        } else {
            vel.remove();
        }
    },

    transform() {
        const { transformGroup, cellView, updateRequested } = this;
        if (!transformGroup || cellView.model.isLink() || updateRequested) return;
        const translateMatrix = cellView.getRootTranslateMatrix();
        const rotateMatrix = cellView.getRootRotateMatrix();
        const transformMatrix = translateMatrix.multiply(rotateMatrix);
        transformGroup.attr('transform', V.matrixToTransformString(transformMatrix));
    },

    update() {
        const { node: prevNode, cellView, nodeSelector, updateRequested, id } = this;
        if (updateRequested) return;
        this.postponedUpdate = false;
        const node = this.node = this.findNode(cellView, nodeSelector);
        if (prevNode) {
            this.unhighlight(cellView, prevNode);
        }
        if (node) {
            this.highlight(cellView, node);
            this.mount();
        } else {
            this.unmount();
            cellView.notify('cell:highlight:invalid', id, this);
        }
    },

    onRemove() {
        const { node, cellView, id, constructor } = this;
        if (node) {
            this.unhighlight(cellView, node);
        }
        this.unmount();
        constructor._removeRef(cellView, id);
    },

    highlight(_cellView, _node) {
        // to be overridden
    },

    unhighlight(_cellView, _node) {
        // to be overridden
    },

    // Update Attributes

    listenToUpdateAttributes(cellView) {
        const attributes = result(this, 'UPDATE_ATTRIBUTES');
        if (!Array.isArray(attributes) || attributes.length === 0) return;
        this.listenTo(cellView.model, 'change', this.onCellAttributeChange);
    },

    onCellAttributeChange() {
        const { cellView } = this;
        if (!cellView) return;
        const { model, paper } = cellView;
        const attributes = result(this, 'UPDATE_ATTRIBUTES');
        if (!attributes.some(attribute => model.hasChanged(attribute))) return;
        paper.requestViewUpdate(this, this.HIGHLIGHT_FLAG, this.UPDATE_PRIORITY);
    }

}, {

    _views: {},

    // Used internally by CellView highlight()
    highlight: function(cellView, node, opt) {
        const id = this.uniqueId(node, opt);
        this.add(cellView, node, id, opt);
    },

    // Used internally by CellView unhighlight()
    unhighlight: function(cellView, node, opt) {
        const id = this.uniqueId(node, opt);
        this.remove(cellView, id);
    },

    get(cellView, id = null) {
        const { cid } = cellView;
        const { _views } = this;
        const refs = _views[cid];
        if (id === null) {
            // all highlighters
            const views = [];
            if (!refs) return views;
            for (let hid in refs) {
                const ref = refs[hid];
                if (ref instanceof this) {
                    views.push(ref);
                }
            }
            return views;
        } else {
            // single highlighter
            if (!refs) return null;
            if (id in refs) {
                const ref = refs[id];
                if (ref instanceof this) return ref;
            }
            return null;
        }
    },

    add(cellView, nodeSelector, id, opt = {}) {
        if (!id) throw new Error('dia.HighlighterView: An ID required.');
        // Search the existing view amongst all the highlighters
        const previousView = HighlighterView.get(cellView, id);
        if (previousView) previousView.remove();
        const view = new this(opt);
        view.id = id;
        this._addRef(cellView, id, view);
        view.requestUpdate(cellView, nodeSelector);
        view.listenToUpdateAttributes(cellView);
        return view;
    },

    _addRef(cellView, id, view) {
        const { cid } = cellView;
        const { _views } = this;
        let refs = _views[cid];
        if (!refs) refs = _views[cid] = {};
        refs[id] = view;
    },

    _removeRef(cellView, id) {
        const { cid } = cellView;
        const { _views } = this;
        const refs = _views[cid];
        if (!refs) return;
        if (id) delete refs[id];
        for (let _ in refs) return;
        delete _views[cid];
    },

    remove(cellView, id = null) {
        toArray(this.get(cellView, id)).forEach(view => {
            view.remove();
        });
    },

    removeAll(paper, id = null) {
        const { _views } = this;

        for (let cid in _views) {
            for (let hid in _views[cid]) {
                const view = _views[cid][hid];

                if (view.cellView.paper === paper && view instanceof this && (id === null || hid === id)) {
                    view.remove();
                }
            }
        }
    },

    update(cellView, id = null, dirty = false) {
        toArray(this.get(cellView, id)).forEach(view => {
            if (dirty || view.UPDATABLE) view.update();
        });
    },

    transform(cellView, id = null) {
        toArray(this.get(cellView, id)).forEach(view => {
            if (view.UPDATABLE) view.transform();
        });
    },

    unmount(cellView, id = null) {
        toArray(this.get(cellView, id)).forEach(view => view.unmount());
    },

    mount(cellView, id = null) {
        toArray(this.get(cellView, id)).forEach(view => view.mount());
    },

    uniqueId(node, opt = '') {
        return V.ensureId(node) + JSON.stringify(opt);
    }

});
