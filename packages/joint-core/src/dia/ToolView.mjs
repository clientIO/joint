import * as mvc from '../mvc/index.mjs';

export const ToolView = mvc.View.extend({
    name: null,
    tagName: 'g',
    className: 'tool',
    svgElement: true,
    _visible: true,
    _visibleExplicit: true,

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

    // Evaluate the visibility of the tool and update the `display` CSS property
    updateVisibility: function() {
        const isVisible = this.computeVisibility();
        this.el.style.display = isVisible ? '' : 'none';
        this._visible = isVisible;
    },

    // Evaluate the visibility of the tool. The method returns `true` if the tool
    // should be visible in the DOM.
    computeVisibility() {
        if (!this.isExplicitlyVisible()) return false;
        const { visibility } = this.options;
        if (typeof visibility !== 'function') return true;
        return !!visibility.call(this, this.relatedView, this);
    },

    show: function() {
        this._visibleExplicit = true;
        this.updateVisibility();
    },

    hide: function() {
        this._visibleExplicit = false;
        this.updateVisibility();
    },

    // The method returns `false` if the `hide()` method was called on the tool.
    isExplicitlyVisible: function() {
        return !!this._visibleExplicit;
    },

    // The method returns `false` if the tool is not visible (it has `display: none`).
    // This can happen if the `hide()` method was called or the tool is not visible
    // because of the `visibility` option was evaluated to `false`.
    isVisible: function() {
        return !!this._visible;
    },

    isOverlay: function() {
        return !!this.parentView && this.parentView.hasLayer();
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

