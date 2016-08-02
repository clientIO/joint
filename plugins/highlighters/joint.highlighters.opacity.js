joint.highlighters.opacity = {

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     */
    highlight: function(cellView, magnetEl) {

        V(magnetEl).addClass(joint.util.addClassNamePrefix('highlight-opacity'));
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     */
    unhighlight: function(cellView, magnetEl) {

        V(magnetEl).removeClass(joint.util.addClassNamePrefix('highlight-opacity'));
    }
};
