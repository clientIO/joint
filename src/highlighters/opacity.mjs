import * as util from '../util/util.js';
import V from '../Vectorizer.mjs';

export const opacity = {

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     */
    highlight: function(cellView, magnetEl) {

        V(magnetEl).addClass(util.addClassNamePrefix('highlight-opacity'));
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     */
    unhighlight: function(cellView, magnetEl) {

        V(magnetEl).removeClass(util.addClassNamePrefix('highlight-opacity'));
    }
};
