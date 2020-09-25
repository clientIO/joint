import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import { HighlighterView } from '../dia/HighlighterView.mjs';

const className = util.addClassNamePrefix('highlighted');

export const addClass = HighlighterView.extend({

    UPDATABLE: false,
    MOUNTABLE: false,

    options: {
        className
    },

    highlight: function(_cellView, node) {
        V(node).addClass(this.options.className);
    },

    unhighlight: function(_cellView, node) {
        V(node).removeClass(this.options.className);
    }

}, {
    // Backwards Compatibility
    className
});
