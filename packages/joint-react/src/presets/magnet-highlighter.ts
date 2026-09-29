import type { dia} from '@joint/core';
import { highlighters, V } from '@joint/core';
import { CONNECTING_CLASS_NAME } from './link-view';

/** Name used to register this highlighter in the paper's highlighterNamespace. */
export const MAGNET_HIGHLIGHTER_NAME = 'magnetHighlighter';

/**
 * Custom highlighter that combines a stroke outline with a CSS class
 * on the magnet element. The stroke element carries `jj-magnet-highlighter` which
 * allows CSS @starting-style transitions to animate the highlighter's appearance.
 */
export const MagnetHighlighter = highlighters.stroke.extend({
    className: 'jj-magnet-highlighter',
    classNamePrefix: '',

    highlight(this: highlighters.stroke, cellView: dia.CellView, node: SVGElement): void {
        V(node).addClass(CONNECTING_CLASS_NAME);
        highlighters.stroke.prototype.highlight.call(this, cellView, node);
    },

    unhighlight(_cellView: dia.CellView, node: SVGElement): void {
        V(node).removeClass(CONNECTING_CLASS_NAME);
        // @ts-expect-error - calling protected method of parent class
        highlighters.stroke.prototype.unhighlight.call(this, _cellView, node);
    },
});
