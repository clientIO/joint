import * as mvc from '../mvc/index.mjs';
import V from '../V/index.mjs';

export const HighlighterView = mvc.View.extend({

    tagName: 'g',
    svgElement: true,

    HIGHLIGHT_FLAG: 1,
    UPDATE_PRIORITY: 3,
    DETACHABLE: false,
    UPDATABLE: true,

    cellView: null,
    nodeSelector: null,
    node: null,
    updateRequested: false,

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
        // The cellView is now rendered/updated as it has higher update priority.
        this.updateRequested = false;
        const { cellView, nodeSelector } = this;
        this.update(cellView, nodeSelector);
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
        const { cellView } = this;
        cellView.vel.append(this.el);
        // cellView.paper.highlighters.appendChild(this.el);
    },

    update(cellView, nodeSelector) {
        const { node: prevNode } = this;
        const node = this.node = this.findNode(cellView, nodeSelector);
        if (prevNode) {
            this.unhighlight(cellView, prevNode);
        }
        if (node) {
            this.highlight(cellView, node);
        }
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

    get(cellView, id) {
        const { cid } = cellView;
        const { _views } = this;
        if ((cid in _views) && (id in _views[cid])) {
            return _views[cid][id];
        }
        return null;
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
        const highlighters = _views[cid];
        if (!highlighters) return;
        const views = [];
        if (!id) {
            for (let hid in highlighters) {
                views.push(highlighters[hid]);
            }
            delete _views[cid];
        } else if (highlighters[id]) {
            views.push(highlighters[id]);
            delete highlighters[id];
            if (Object.keys(highlighters).length === 0) {
                delete _views[cid];
            }
        }
        views.forEach(view => this.removeView(view));
    },

    update(cellView, id = null) {
        const { cid } = cellView;
        const { _views } = this;
        const highlighters = _views[cid];
        if (!highlighters) return;
        const views = [];
        if (!id) {
            for (let hid in highlighters) {
                views.push(highlighters[hid]);
            }
        } else if (highlighters[id]) {
            views.push(highlighters[id]);
        }
        views.forEach(view => this.updateView(view));
    },

    updateView(view) {
        const { id, updateRequested, nodeSelector,cellView, UPDATABLE } = view;
        if (UPDATABLE && !updateRequested) {
            view.update(cellView, nodeSelector);
            if (!view.node) {
                // Node has been removed from the cellView
                // TODO: should be the highlighter disposed?
                this.remove(cellView, id);
            }
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
