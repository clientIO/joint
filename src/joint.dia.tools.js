(function(joint, util) {

    var ToolView = joint.mvc.View.extend({
        tagName: 'g',
        className: 'tool',
        svgElement: true,
        _visible: true,
        configure: function(view, toolsView) {
            this.relatedView = view;
            this.paper = view.paper;
            this.parentView = toolsView;
        },
        show: function() {
            this.el.style.display = '';
            this._visible = true;
        },
        hide: function() {
            this.el.style.display = 'none';
            this._visible = false;
        },
        isVisible: function() {
            return !!this._visible;
        },
        focus: function() {
            var opacity = this.options.activateOpacity;
            if (isFinite(opacity)) this.el.style.opacity = opacity;
            this.parentView.focusTool(this);
        },
        blur: function() {
            this.el.style.opacity = '';
            this.parentView.blurTool(this);
        }
    });

    var ToolsView = joint.mvc.View.extend({
        tagName: 'g',
        className: 'tools',
        svgElement: true,
        tools: null,
        options: {
            tools: null,
            relatedView: null,
            name: null
        },

        configure: function(options) {
            options = util.assign({}, this.options, options)
            var tools = options.tools;
            if (!Array.isArray(tools)) return this;
            var relatedView = options.relatedView;
            if (!(relatedView instanceof joint.dia.CellView)) return this;
            var views = this.tools = [];
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                if (!(tool instanceof ToolView)) continue;
                tool.configure(relatedView, this);
                tool.render();
                this.vel.append(tool.el);
                views.push(tool);
            }
        },

        getName: function() {
            return this.options.name;
        },

        update: function(opt) {

            opt || (opt = {});
            var tools = this.tools;
            if (!tools) return;
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                if (opt.tool !== tool.cid && tool.isVisible()) {
                    tool.update();
                }
            }
            return this;
        },

        focusTool: function(focusedTool) {

            var tools = this.tools;
            if (!tools) return this;
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                if (focusedTool !== tool) {
                    tool.hide();
                } else {
                    tool.show();
                }
            }
            return this;
        },

        blurTool: function() {
            var tools = this.tools;
            if (!tools) return this;
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                tool.show();
                tool.update();
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
        }
    });

    joint.dia.ToolsView = ToolsView;
    joint.dia.ToolView = ToolView;

})(joint, joint.util);
