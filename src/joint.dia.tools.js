(function(joint, util) {

    var ToolView = joint.mvc.View.extend({
        tagName: 'g',
        className: 'tool',
        svgElement: true,
        _visible: true,
        setRelatedView: function(view, toolsView) {
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
        focus: function() {
            var opacity = this.options.activateOpacity;
            if (isFinite(opacity)) this.el.style.opacity = opacity;
            this.parentView.focusTool(this);
        },
        blur: function() {
            this.el.style.opacity = '';
            this.parentView.blurTool(this);
        },
        isVisible: function() {
            return !!this._visible;
        }
    });

    var ToolsView = joint.mvc.View.extend({
        tagName: 'g',
        className: 'tools',
        svgElement: true,
        tools: null,

        init: function() {

            var tools = this.options.tools;
            var relatedView = this.options.relatedView;
            if (!Array.isArray(tools)) return this;
            var views = this.tools = [];
            for (var i = 0, n = tools.length; i < n; i++) {
                var tool = tools[i];
                if (!(tool instanceof ToolView)) continue;
                tool.setRelatedView(relatedView, this);
                tool.render();
                this.vel.append(tool.el);
                views.push(tool);
            }

            return this;
        },

        update: function(opt) {

            opt || (opt = {});
            var tools = this.tools;
            if (tools) {
                for (var i = 0, n = tools.length; i < n; i++) {
                    var tool = tools[i];
                    if (opt.tool !== tool.cid) {
                        tools[i].update();
                    }
                }
            }
            return this;
        },

        focusTool: function(focusedTool) {

            var tools = this.tools;
            if (tools) {
                for (var i = 0, n = tools.length; i < n; i++) {
                    var tool = tools[i];
                    if (focusedTool !== tool) {
                        tool.hide();
                    } else {
                        tool.show();
                    }
                }
            }
            return this;
        },

        blurTool: function() {
            var tools = this.tools;
            if (tools) {
                for (var i = 0, n = tools.length; i < n; i++) {
                    var tool = tools[i];
                    tool.show();
                    tool.update();
                }
            }
            return this;
        },

        onRemove: function() {

            var tools = this.tools;
            if (tools) {
                for (var i = 0, n = tools.length; i < n; i++) {
                    tools[i].remove();
                }
                this.tools = null;
            }
        }
    });

    joint.dia.ToolsView = ToolsView;
    joint.dia.ToolView = ToolView;

})(joint, joint.util);
