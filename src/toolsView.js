import { View } from './mvc';
import { CellView } from './cellView';
import { ToolView } from './toolView';
import * as util from './util';

export const ToolsView = View.extend({
    tagName: 'g',
    className: 'tools',
    svgElement: true,
    tools: null,
    options: {
        tools: null,
        relatedView: null,
        name: null,
        component: false
    },

    configure: function(options) {
        options = util.assign(this.options, options);
        const tools = options.tools;
        if (!Array.isArray(tools)) return this;
        const relatedView = options.relatedView;
        if (!(relatedView instanceof CellView)) return this;
        const views = this.tools = [];
        for (let i = 0, n = tools.length; i < n; i++) {
            const tool = tools[i];
            if (!(tool instanceof ToolView)) continue;
            tool.configure(relatedView, this);
            tool.render();
            this.vel.append(tool.el);
            views.push(tool);
        }
        return this;
    },

    getName: function() {
        return this.options.name;
    },

    update: function(opt) {

        opt || (opt = {});
        const tools = this.tools;
        if (!tools) return;
        for (let i = 0, n = tools.length; i < n; i++) {
            const tool = tools[i];
            if (opt.tool !== tool.cid && tool.isVisible()) {
                tool.update();
            }
        }
        return this;
    },

    focusTool: function(focusedTool) {

        const tools = this.tools;
        if (!tools) return this;
        for (let i = 0, n = tools.length; i < n; i++) {
            const tool = tools[i];
            if (focusedTool === tool) {
                tool.show();
            } else {
                tool.hide();
            }
        }
        return this;
    },

    blurTool: function(blurredTool) {
        const tools = this.tools;
        if (!tools) return this;
        for (let i = 0, n = tools.length; i < n; i++) {
            const tool = tools[i];
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

        const tools = this.tools;
        if (!tools) return this;
        for (let i = 0, n = tools.length; i < n; i++) {
            tools[i].remove();
        }
        this.tools = null;
    },

    mount: function() {
        const options = this.options;
        const relatedView = options.relatedView;
        if (relatedView) {
            const container = (options.component) ? relatedView.el : relatedView.paper.tools;
            container.appendChild(this.el);
        }
        return this;
    }

});

