import { dia } from '@joint/core';

const LINK_CONNECTING_CLASS = 'jr-link--connecting';
const LINK_SNAPPED_CN = 'jr-link--snapped';

/**
 * Custom LinkView for PortalLink models.
 */
export class PortalLinkView extends dia.LinkView {

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

  _snapArrowhead(evt: dia.Event, x: number, y: number) {
    // @ts-expect-error Protected method override
    const isSnapped = super._snapArrowhead(evt, x, y);
    this.el.classList.toggle(LINK_CONNECTING_CLASS, !isSnapped);
    this.el.classList.toggle(LINK_SNAPPED_CN, !!isSnapped);
    return isSnapped;
  }
}
