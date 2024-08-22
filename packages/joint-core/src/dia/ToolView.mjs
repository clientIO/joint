import * as mvc from '../mvc/index.mjs';

export const ToolView = mvc.View.extend({
    name: null,
    tagName: 'g',
    className: 'tool',
    svgElement: true,
    _visible: true,

    init: function() {
        var name = this.name;
        if (name) this.vel.attr('data-tool-name', name);
    },

    configure: function(view, toolsView) {
        this.relatedView = view;
        this.paper = view.paper;
        this.parentView = toolsView;
        this.simulateRelatedView(this.el);
        // Delegate events in case the ToolView was removed from the DOM and reused.
        this.delegateEvents();
        return this;
    },

    simulateRelatedView: function(el) {
        if (el) el.setAttribute('model-id', this.relatedView.model.id);
    },

    getName: function() {
        return this.name;
    },

    updateVisibility: function() {
        let isVisible;
        if (this.isVisible()) {
            const { visibility } = this.options;
            if (typeof visibility === 'function') {
                isVisible = !!visibility.call(this, this.relatedView, this);
            } else {
                isVisible = true;
            }
        } else {
            isVisible = false;
        }
        this.el.style.display = isVisible ? '' : 'none';
    },

    show: function() {
        this._visible = true;
        this.updateVisibility();
    },

    hide: function() {
        this._visible = false;
        this.updateVisibility();
    },

    isVisible: function() {
        return !!this._visible;
    },

    focus: function() {
        var opacity = this.options.focusOpacity;
        if (isFinite(opacity)) this.el.style.opacity = opacity;
        this.parentView.focusTool(this);
    },

    blur: function() {
        this.el.style.opacity = '';
        this.parentView.blurTool(this);
    },

    update: function() {
        // to be overridden
    },

    guard: function(evt) {
        // Let the context-menu event bubble up to the relatedView
        const { paper, relatedView } = this;
        if (!paper || !relatedView) return true;
        return paper.guard(evt, relatedView);
    }
});

