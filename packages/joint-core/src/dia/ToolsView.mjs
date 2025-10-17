import * as mvc from '../mvc/index.mjs';
import * as util from '../util/index.mjs';
import { CellView } from './CellView.mjs';
import { Paper } from './Paper.mjs';
import { ToolView } from './ToolView.mjs';

export const ToolsView = mvc.View.extend({
    tagName: 'g',
    className: 'tools',
    svgElement: true,
    tools: null,
    isRendered: false,
    options: {
        tools: null,
        relatedView: null,
        name: null,
        // layer?: Paper.Layers.TOOLS
        // z?: number
    },

    configure: function(options) {
        options = util.assign(this.options, options);
        var tools = options.tools;
        if (!Array.isArray(tools)) return this;
        var relatedView = options.relatedView;
        if (!(relatedView instanceof CellView)) return this;
        var views = this.tools = [];
        for (var i = 0, n = tools.length; i < n; i++) {
            var tool = tools[i];
            if (!(tool instanceof ToolView)) continue;
            tool.configure(relatedView, this);
            this.vel.append(tool.el);
            views.push(tool);
        }
        this.isRendered = false;
        relatedView.requestUpdate(relatedView.getFlag('TOOLS'));
        return this;
    },

    getName: function() {
        return this.options.name;
    },

    update: function(opt) {

        opt || (opt = {});
        const tools = this.tools;
        if (!tools) return this;
        const n = tools.length;
        const wasRendered = this.isRendered;
        for (let i = 0; i < n; i++) {
            const tool = tools[i];
            tool.updateVisibility();
            if (!tool.isVisible()) continue;
            if (this.ensureToolRendered(tools, i) && opt.tool !== tool.cid) {
                tool.update();
            }
        }
        if (!this.isRendered && n > 0) {
            // None of the tools is visible
            // Note: ToolsView with no tools are always mounted
            return this;
        }
        if (!this.isMounted()) {
            this.mount();
        }
        if (!wasRendered) {
            // Make sure tools are visible (if they were hidden and the tool removed)
            this.blurTool();
        }
        return this;
    },

    ensureToolRendered(tools, i) {
        if (!this.isRendered) {
            // There is at least one visible tool
            this.isRendered = Array(tools.length).fill(false);
        }
        if (!this.isRendered[i]) {
            // First update executes render()
            tools[i].render();
            this.isRendered[i] = true;
            return false;
        }
        return true;
    },

    focusTool: function(focusedTool) {

        var tools = this.tools;
        if (!tools) return this;
        for (var i = 0, n = tools.length; i < n; i++) {
            var tool = tools[i];
            if (focusedTool === tool) {
                tool.show();
            } else {
                tool.hide();
            }
        }
        return this;
    },

    blurTool: function(blurredTool) {
        var tools = this.tools;
        if (!tools) return this;
        for (var i = 0, n = tools.length; i < n; i++) {
            var tool = tools[i];
            if (tool !== blurredTool && !tool.isExplicitlyVisible()) {
                tool.show();
                // Check if the tool is conditionally visible too
                if (tool.isVisible()) {
                    this.ensureToolRendered(tools, i) && tool.update();
                }
            }
        }
        return this;
    },

    hide: function() {
        return this.focusTool(null);
    },

    show: function() {
        this.blurTool(null);
        // If this the first time the tools are shown, make sure they are mounted
        if (!this.isMounted()) {
            this.mount();
        }
        return this;
    },

    onRemove: function() {
        var tools = this.tools;
        if (!tools) return this;
        for (var i = 0, n = tools.length; i < n; i++) {
            tools[i].remove();
        }
        this.tools = null;
    },

    getLayer() {
        const { layer = Paper.Layers.TOOLS } = this.options;
        return layer;
    },

    hasLayer() {
        return !!this.getLayer();
    },

    mount: function() {
        const { options, el } = this;
        const { relatedView, z } = options;
        if (relatedView) {
            if (this.hasLayer()) {
                relatedView.paper.getLayerView(this.getLayer()).insertSortedNode(el, z);
            } else {
                relatedView.el.appendChild(el);
            }
        }
        return this;
    }

});
