import * as util from '../util/index.mjs';
import V from '../V/index.mjs';

export const addClass = {

    className: util.addClassNamePrefix('highlighted'),

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    highlight: function(cellView, magnetEl, opt) {

        var options = opt || {};
        var className = options.className || this.className;
        V(magnetEl).addClass(className);
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    unhighlight: function(cellView, magnetEl, opt) {

        var options = opt || {};
        var className = options.className || this.className;
        V(magnetEl).removeClass(className);
    }
};
