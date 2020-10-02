import * as mvc from '../mvc/index.mjs';
import V from '../V/index.mjs';
import { isPlainObject } from '../util/util.mjs';

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
    transformGroup: null,

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
        this.update(cellView, nodeSelector);
        this.mount();
        this.transform();
        return 0;
    },

    findNode(cellView, nodeSelector = null) {
        let el;
        if (typeof nodeSelector === 'string') {
            [el] = cellView.findBySelector(nodeSelector);
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
                [el] = cellView.findBySelector(selector);
            }
        } else if (nodeSelector) {
            el = V.toNode(nodeSelector);
            if (!(el instanceof SVGElement)) el = null;
        }
        return el ? el : null;
    },

    mount() {
        const { MOUNTABLE, cellView, el, options, transformGroup } = this;
        if (!MOUNTABLE || transformGroup) return;
        const { vel: cellViewRoot, paper } = cellView;
        const { layer: layerName } = options;
        if (layerName) {
            this.transformGroup = V('g')
                .addClass('highlight-transform')
                .append(el)
                .appendTo(paper.getLayerNode(layerName));
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

    uniqueId(node, opt = '') {
        return V.ensureId(node) + JSON.stringify(opt);
    }

});
