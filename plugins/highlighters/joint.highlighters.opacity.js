joint.highlighters.opacity = {

    highlight: function(cellView, magnetEl, opt) {

        V(magnetEl).addClass(joint.util.addClassNamePrefix('highlight-opacity'));
    },

    unhighlight: function(cellView, magnetEl, opt) {

        V(magnetEl).removeClass(joint.util.addClassNamePrefix('highlight-opacity'));
    }
};
