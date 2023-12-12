import { HighlighterView } from '../dia/HighlighterView.mjs';

export const opacity = HighlighterView.extend({

    UPDATABLE: false,
    MOUNTABLE: false,

    highlight: function(_cellView, node) {
        const { alphaValue = 0.3 } = this.options;
        node.style.opacity = alphaValue;
    },

    unhighlight: function(_cellView, node) {
        node.style.opacity = '';
    }

});
