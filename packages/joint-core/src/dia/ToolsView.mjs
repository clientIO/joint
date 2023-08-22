import * as mvc from '../mvc/index.mjs';
import * as util from '../util/index.mjs';
import { CellView } from './CellView.mjs';
import { LayersNames } from './PaperLayer.mjs';
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
        // layer?: LayersNames.TOOLS
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
        var tools = this.tools;
        if (!tools) return this;
        var isRendered = this.isRendered;
        for (var i = 0, n = tools.length; i < n; i++) {
            var tool = tools[i];
            if (!isRendered) {
                // First update executes render()
                tool.render();
            } else if (opt.tool !== tool.cid && tool.isVisible()) {
                tool.update();
            }
        }
        if (!this.isMounted()) {
            this.mount();
        }
        if (!isRendered) {
            // Make sure tools are visible (if they were hidden and the tool removed)
            this.blurTool();
            this.isRendered = true;
        }
        return this;
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
            if (tool !== blurredTool && !tool.isVisible()) {
                tool.show();
                tool.update();
            }
        }
        return this;
    },

    hide: function() {
        return this.focusTool(null);
    },

    show: function() {
        return this.blurTool(null);
    },

    onRemove: function() {
        var tools = this.tools;
        if (!tools) return this;
        for (var i = 0, n = tools.length; i < n; i++) {
            tools[i].remove();
        }
        this.tools = null;
    },

    mount: function() {
        const { options, el } = this;
        const { relatedView, layer = LayersNames.TOOLS, z } = options;
        if (relatedView) {
            if (layer) {
                relatedView.paper.getLayerView(layer).insertSortedNode(el, z);
            } else {
                relatedView.el.appendChild(el);
            }
        }
        return this;
    }

});
