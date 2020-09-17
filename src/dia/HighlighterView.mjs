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

    requestUpdate(cellView, el) {
        const { paper } = cellView;
        this.cellView = cellView;
        this.nodeSelector = el;
        if (paper) {
            paper.requestViewUpdate(this, this.HIGHLIGHT_FLAG, this.UPDATE_PRIORITY);
        }
    },

    confirmUpdate() {
        // The cellView is now rendered/updated as it has higher update priority.
        const { cellView, nodeSelector } = this;
        const node = this.findNode(cellView, nodeSelector);
        this.node = node;
        this.highlight(cellView, node);
        return 0;
    },

    findNode(cellView, nodeSelector) {
        let el;
        if (typeof nodeSelector === 'string') {
            [el = cellView.el] = cellView.findBySelector(nodeSelector);
        } else {
            el = V.toNode(nodeSelector);
        }
        return el;
    },

    mount() {
        const { cellView } = this;
        cellView.vel.append(this.el);
        // cellView.paper.highlighters.appendChild(this.el);
    },

    update(cellView, node) {
        this.unhighlight(cellView, node);
        this.highlight(cellView, node);
    },

    highlight(_cellView, _node) {
        // to be overridden
    },

    unhighlight(_cellView, _node) {
        // to be overridden
    }

}, {

    _views: {},

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
        view.requestUpdate(cellView, el);
        return view;
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
        views.forEach(view => {
            const { node, UPDATABLE } = view;
            if (node && UPDATABLE) {
                view.update(cellView, node);
            }
        });
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
        }
        views.forEach(view => {
            view.unhighlight(cellView, view.node);
            view.remove();
        });
    },

    getId(el, opt) {
        return el.id + JSON.stringify(opt);
    },

    highlight: function(cellView, magnetEl, opt) {
        const id = this.getId(magnetEl, opt);
        this.add(cellView, magnetEl, id, opt);
    },

    unhighlight: function(cellView, magnetEl, opt) {
        const id = this.getId(magnetEl, opt);
        this.remove(cellView, id);
    }

});
