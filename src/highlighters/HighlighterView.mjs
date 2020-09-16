import * as mvc from '../mvc/index.mjs';
import V from '../V/index.mjs';

export const HighlighterView = mvc.View.extend({

    tagName: 'g',
    svgElement: true,

    HIGHLIGHT_FLAG: 1,
    UPDATE_PRIORITY: 3,
    DETACHABLE: false,

    requestUpdate() {
        const { cellView } = this.options;
        const { paper } = cellView;
        if (paper) {
            paper.requestViewUpdate(this, this.HIGHLIGHT_FLAG, this.UPDATE_PRIORITY);
        }
    },

    confirmUpdate() {
        // The cellView is now rendered/updated as it has higher update priority.
        const { cellView, nodeSelector } = this.options;
        let el;
        if (typeof nodeSelector === 'string') {
            [el = cellView.el] = cellView.findBySelector(nodeSelector);
        } else {
            el = V.toNode(nodeSelector);
        }
        this.highlight(cellView, el);
        return 0;
    },

    highlight() {

    },

    unhighlight() {
        this.vel.remove();
    },

    mount(cellView) {
        cellView.vel.append(this.el);
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
        const options = Object.assign({
            cellView,
            nodeSelector: el
        }, opt);
        _views[cid] || (_views[cid] = {});
        view = _views[cid][id] = new this(options);
        view.requestUpdate(cellView);
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
            view.unhighlight(cellView);
            view.requestUpdate(cellView);
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
            view.unhighlight(cellView);
            view.remove();
        });
    },

    getId(el, opt) {
        return el.id + JSON.stringify(opt);
    }
});
