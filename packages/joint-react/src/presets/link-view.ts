import { dia } from '@joint/core';

const LINK_CONNECTING_CLASS = 'jj-is-connecting';
const LINK_SNAPPED_CN = 'jj-is-snapped';

/**
 * Custom LinkView that adds CSS class hooks for link interaction states.
 *
 * - `jj-is-connecting` — while dragging an arrowhead (before snapping)
 * - `jj-is-snapped` — while the arrowhead is snapped to a valid target
 */
export class LinkView extends dia.LinkView {

  _beforeArrowheadMove(data: unknown) {
    // @ts-expect-error Protected method override
    super._beforeArrowheadMove(data);
    this.el.classList.add(LINK_CONNECTING_CLASS);
  }

  _afterArrowheadMove(data: unknown) {
    // @ts-expect-error Protected method override
    super._afterArrowheadMove(data);
    this.el.classList.remove(LINK_CONNECTING_CLASS, LINK_SNAPPED_CN);
  }

  _snapArrowhead(event_: dia.Event, x: number, y: number) {
    // @ts-expect-error Protected method override
    const isSnapped = super._snapArrowhead(event_, x, y);
    this.el.classList.toggle(LINK_CONNECTING_CLASS, !isSnapped);
    this.el.classList.toggle(LINK_SNAPPED_CN, !!isSnapped);
    return isSnapped;
  }
}
