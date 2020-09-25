import * as mvc from '../mvc/index.mjs';
import V from '../V/index.mjs';

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
        this.transform(cellView);
        return 0;
    },

    findNode(cellView, nodeSelector = null) {
        let el;
        if (typeof nodeSelector === 'string') {
            [el = null] = cellView.findBySelector(nodeSelector);
        } else if (Array.isArray(nodeSelector)) {
            el = cellView.findPortNode(...nodeSelector);
        } else if (nodeSelector) {
            el = V.toNode(nodeSelector);
        }
        return el;
    },

    mount() {
        const { MOUNTABLE, cellView, el, options, transformGroup } = this;
        if (!MOUNTABLE) return;
        const { vel: cellViewRoot, paper } = cellView;
        if (options.layer) {
            // TODO: paper layers (e.g. change ordering)
            this.transformGroup = V('g')
                .addClass('highlighter-transform-group')
                .append(el)
                .appendTo(paper.highlighters);
        } else if (!transformGroup) {
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
        const { transformGroup, cellView } = this;
        if (!transformGroup || cellView.model.isLink()) return;
        const translateMatrix = cellView.getRootTranslateMatrix();
        const rotateMatrix = cellView.getRootRotateMatrix();
        const transformMatrix = translateMatrix.multiply(rotateMatrix);
        transformGroup.attr('transform', V.matrixToTransformString(transformMatrix));
    },

    update() {
        const { node: prevNode, cellView, nodeSelector } = this;
        const node = this.node = this.findNode(cellView, nodeSelector);
        if (prevNode) {
            this.unhighlight(cellView, prevNode);
        }
        if (node) {
            this.highlight(cellView, node);
            this.mount();
        }
    },

    onRemove() {
        this.unmount();
    },

    highlight(_cellView, _node) {
        // to be overridden
    },

    unhighlight(_cellView, _node) {
        // to be overridden
    }

}, {

    Types: {
        CUSTOM: 'custom',
        EMBEDDING: 'embedding',
        CONNECTING: 'connecting',
        MAGNET_AVAILABILITY: 'magnetAvailability',
        ELEMENT_AVAILABILITY: 'elementAvailability'
    },

    _views: {},

    highlight: function(cellView, node, opt) {
        const id = this.uniqueId(node, opt);
        this.add(cellView, node, id, opt);
    },

    unhighlight: function(cellView, node, opt) {
        const id = this.uniqueId(node, opt);
        this.remove(cellView, id);
    },

    get(cellView, id = null) {
        const { cid } = cellView;
        const { _views } = this;
        const cellHighlighters = _views[cid];
        if (id === null) {
            // all highlighters
            const views = [];
            if (!cellHighlighters) return views;
            for (let hid in cellHighlighters) {
                views.push(cellHighlighters[hid]);
            }
            return views;
        } else {
            // single highlighter
            if (!cellHighlighters) return null;
            if (id in cellHighlighters) {
                return cellHighlighters[id];
            }
            return null;
        }
    },

    add(cellView, el, id, opt = {}) {
        let view = this.get(cellView, id);
        if (view) return view;
        const { cid } = cellView;
        const { _views } = this;
        _views[cid] || (_views[cid] = {});
        view = _views[cid][id] = new this(opt);
        view.id = id;
        view.requestUpdate(cellView, el);
        return view;
    },

    remove(cellView, id = null) {
        const { cid } = cellView;
        const { _views } = this;
        const cellHighlighters = _views[cid];
        if (!cellHighlighters) return;
        const views = [];
        if (!id) {
            for (let hid in cellHighlighters) {
                views.push(cellHighlighters[hid]);
            }
            delete _views[cid];
        } else if (cellHighlighters[id]) {
            views.push(cellHighlighters[id]);
            delete cellHighlighters[id];
            if (Object.keys(cellHighlighters).length === 0) {
                delete _views[cid];
            }
        }
        views.forEach(view => this.removeView(view));
    },

    update(cellView) {
        this.get(cellView).forEach(view => this.updateView(view));
    },

    transform(cellView) {
        this.get(cellView).forEach(view => this.transformView(view));
    },

    updateView(view) {
        const { id, updateRequested, UPDATABLE } = view;
        if (UPDATABLE && !updateRequested) {
            view.update();
            if (!view.node) {
                // Node has been removed from the cellView
                // TODO: should be the highlighter disposed?
                this.remove(view.cellView, id);
            }
        }
    },

    transformView(view) {
        const { updateRequested, UPDATABLE } = view;
        if (UPDATABLE && !updateRequested) {
            view.transform();
        }
    },

    removeView(view) {
        const { node, cellView } = view;
        if (node) {
            view.unhighlight(cellView, node);
        }
        view.remove();
    },

    uniqueId(node, opt = '') {
        return V.ensureId(node) + JSON.stringify(opt);
    }

});
