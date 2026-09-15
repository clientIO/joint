// Paper `guard` composed into every `<Paper>`'s `dia.Paper.options.guard` so a
// wheel or a touch over a scrollable node body scrolls the box instead of driving
// the paper (`paper:pan` / `paper:pinch`, a press, a drag). Regions opt in with
// `data-jj-scrollable`; native `<textarea>` is covered free.
// `Ctrl`/`Cmd`+wheel is the paper's pinch-zoom modifier — never guarded.
interface GuardEvent {
  readonly type: string;
  readonly target: EventTarget | null;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
}

/**
 * DOM attribute that opts an element into the scroll guards: a wheel or a touch
 * whose target sits inside a marked element that has actual overflow tells
 * `dia.Paper` that the element owns the input, so `paper:pan` / `paper:pinch` do
 * not fire and no press or drag starts.
 * @group Constants
 */
export const SCROLLABLE_ATTRIBUTE = 'data-jj-scrollable';

const SCROLLABLE_SELECTOR = `textarea, [${SCROLLABLE_ATTRIBUTE}]`;

function overflows(element: Element): boolean {
  return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

/**
 * Whether `target` sits inside a natively scrollable region (a `<textarea>` or
 * an element carrying {@link SCROLLABLE_ATTRIBUTE}, either with actual overflow).
 * @param target - event target to test
 * @returns `true` when a scrollable region owns the input
 */
function isInsideScrollableRegion(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  for (
    let element: Element | null = target.closest(SCROLLABLE_SELECTOR);
    element;
    element = element.parentElement?.closest(SCROLLABLE_SELECTOR) ?? null
  ) {
    if (overflows(element)) return true;
  }
  return false;
}

/**
 * Predicate for `dia.Paper.options.guard`. Returns `true` when a wheel event
 * targets a scrollable region (native `<textarea>` or an element carrying
 * {@link SCROLLABLE_ATTRIBUTE} — both with actual overflow), so the paper
 * ignores it and the region scrolls natively. `Ctrl`/`Cmd`+wheel is always
 * allowed through so the paper's pinch-zoom keeps working.
 * @param event - wheel-like event dispatched to `paper.guard`
 * @returns `true` to short-circuit the paper's mousewheel pipeline
 * @group Utils
 */
export function wheelGuard(event: GuardEvent): boolean {
  if (!/wheel/i.test(event.type)) return false;
  if (event.ctrlKey || event.metaKey) return false;
  return isInsideScrollableRegion(event.target);
}

/**
 * Predicate for `dia.Paper.options.guard`. Returns `true` when a touch starts inside a
 * scrollable region (the same regions {@link wheelGuard} honors), so the paper neither
 * presses nor drags and the finger scrolls the region natively. Only `touchstart`
 * reaches `guard()`; the moves and the lift never do.
 * @param event - touch event dispatched to `paper.guard`
 * @returns `true` to keep the touch off the paper
 * @group Utils
 */
export function touchGuard(event: GuardEvent): boolean {
  if (event.type !== 'touchstart') return false;
  return isInsideScrollableRegion(event.target);
}
