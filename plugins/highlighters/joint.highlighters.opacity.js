joint.highlighters.opacity = {

    highlight: function(cellView, magnetEl, opt) {

        V(magnetEl).addClass('joint-highlight-opacity');
    },

    unhighlight: function(cellView, magnetEl, opt) {

        V(magnetEl).removeClass('joint-highlight-opacity');
    }
};
