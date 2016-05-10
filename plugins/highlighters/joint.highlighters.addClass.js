joint.highlighters.addClass = {

    className: joint.util.addClassNamePrefix('highlighted'),

    highlight: function(cellView, magnetEl, opt) {
        var className = opt.className || this.className;
        V(magnetEl).addClass(className);
    },

    unhighlight: function(cellView, magnetEl, opt) {
        var className = opt.className || this.className;
        V(magnetEl).removeClass(className);
    }
};
