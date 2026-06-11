import { dia, highlighters, V } from '@joint/core';
import { SNAPPED_CLASS_NAME } from './link-view';

/** Name used to register this highlighter in the paper's highlighterNamespace. */
export const CONNECTING_HIGHLIGHTER_NAME = 'connecting';

/**
 * Custom connecting highlighter that combines a stroke outline with a CSS class
 * on the port element. The stroke element carries `jj-connecting-stroke` which
 * allows CSS @starting-style transitions to animate the highlight's appearance.
 */
export const ConnectingHighlighter = highlighters.stroke.extend({
    className: `joint-highlight-stroke jj-highlight-connecting`,
    classNamePrefix: '',

    highlight(this: highlighters.stroke, cellView: dia.CellView, node: SVGElement): void {
        V(node).addClass(SNAPPED_CLASS_NAME);
        highlighters.stroke.prototype.highlight.call(this, cellView, node);
    },

    unhighlight(_cellView: dia.CellView, node: SVGElement): void {
        V(node).removeClass(SNAPPED_CLASS_NAME);
        // @ts-expect-error - calling protected method of parent class
        highlighters.stroke.prototype.unhighlight.call(this, _cellView, node);
    },
});
