joint.highlighters.addClass = {

    className: 'highlighted',

    highlight: function(cellView, magnetEl, opt) {
        var className = opt.className || this.className;
        V(magnetEl).addClass(className);
    },

    unhighlight: function(cellView, magnetEl, opt) {
        var className = opt.className || this.className;
        V(magnetEl).removeClass(className);
    }
};
