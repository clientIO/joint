import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import { HighlighterView } from '../dia/HighlighterView.mjs';

export const opacity = HighlighterView.extend({

    UPDATABLE: false,
    MOUNTABLE: false,

    opacityClassName: util.addClassNamePrefix('highlight-opacity'),

    highlight: function(_cellView, node) {
        V(node).addClass(this.opacityClassName);
    },

    unhighlight: function(_cellView, node) {
        V(node).removeClass(this.opacityClassName);
    }

});
