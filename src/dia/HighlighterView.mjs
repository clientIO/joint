import * as mvc from '../mvc/index.mjs';
import V from '../V/index.mjs';
import { toArray } from '../util/util.mjs';

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
        const { transformGroup, cellView, updateRequested } = this;
        if (!transformGroup || cellView.model.isLink() || updateRequested) return;
        const translateMatrix = cellView.getRootTranslateMatrix();
        const rotateMatrix = cellView.getRootRotateMatrix();
        const transformMatrix = translateMatrix.multiply(rotateMatrix);
        transformGroup.attr('transform', V.matrixToTransformString(transformMatrix));
    },

    update() {
        const { node: prevNode, cellView, nodeSelector, updateRequested } = this;
        if (updateRequested) return;
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
        const { node, cellView, id, constructor } = this;
        if (node) {
            this.unhighlight(cellView, node);
        }
        this.unmount();
        constructor.clean(cellView, id);
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
        const refs = _views[cid];
        if (id === null) {
            // all highlighters
            const views = [];
            if (!refs) return views;
            for (let hid in refs) {
                views.push(refs[hid]);
            }
            return views;
        } else {
            // single highlighter
            if (!refs) return null;
            if (id in refs) {
                return refs[id];
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

    clean(cellView, id) {
        const { cid } = cellView;
        const { _views } = this;
        const refs = _views[cid];
        if (!refs) return;
        if (id) delete refs[id];
        for (let _ in refs) return;
        delete _views[cid];
    },

    remove(cellView, id = null) {
        if (id) {
            const view = this.get(cellView, id);
            if (view) view.remove();
        } else {
            this.get(cellView).forEach(view => view.remove());
        }
    },

    update(cellView, id = null) {
        toArray(this.get(cellView, id)).forEach(view => {
            if (view.UPDATABLE) view.update();
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
