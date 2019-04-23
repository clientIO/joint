import * as util from '../../src/util.js';
import V from '../../src/vectorizer.js';

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
