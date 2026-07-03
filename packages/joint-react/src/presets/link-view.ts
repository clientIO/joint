import { dia } from '@joint/core';

/** Applied to a link view while its arrowhead is being dragged. */
export const CONNECTING_CLASS_NAME = 'jj-is-connecting';

/** Applied to a link view while its arrowhead is snapped to a valid target. */
const SNAPPED_CLASS_NAME = 'jj-is-snapped';

/**
 * Custom LinkView that adds CSS class hooks for link interaction states.
 *
 * - `jj-is-connecting`, while dragging an arrowhead (before snapping)
 * - `jj-is-snapped`, while the arrowhead is snapped to a valid target
 */
export class LinkView extends dia.LinkView {
  // Suppress the `joint-theme-default` class that `mvc.View.initialize` would
  // otherwise add via `setTheme(this.options.theme || this.defaultTheme)`.
  // `preinitialize` runs BEFORE `initialize` in Backbone's View constructor,
  // so the instance defaults are set in time for `setTheme` to read them.
  // Empty strings are falsy — `addThemeClassName` bails without adding a class.
  preinitialize() {
    this.theme = '';
    this.defaultTheme = '';
  }

  _beforeArrowheadMove(data: unknown) {
    // @ts-expect-error Protected method override
    super._beforeArrowheadMove(data);
    this.el.classList.add(CONNECTING_CLASS_NAME);
  }

  _afterArrowheadMove(data: unknown) {
    // @ts-expect-error Protected method override
    super._afterArrowheadMove(data);
    this.el.classList.remove(CONNECTING_CLASS_NAME, SNAPPED_CLASS_NAME);
  }

  _snapArrowhead(event_: dia.Event, x: number, y: number) {
    // @ts-expect-error Protected method override
    const isSnapped = super._snapArrowhead(event_, x, y);
    this.el.classList.toggle(CONNECTING_CLASS_NAME, !isSnapped);
    this.el.classList.toggle(SNAPPED_CLASS_NAME, !!isSnapped);
    return isSnapped;
  }
}
