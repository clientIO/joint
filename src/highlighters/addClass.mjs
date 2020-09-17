import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import { HighlighterView } from '../dia/HighlighterView.mjs';

export const addClass = HighlighterView.extend({

    UPDATABLE: false,

    options: {
        className: util.addClassNamePrefix('highlighted')
    },

    highlight: function(_cellView, node) {
        V(node).addClass(this.options.className);
    },

    unhighlight: function(_cellView, node) {
        V(node).removeClass(this.options.className);
    }

});
