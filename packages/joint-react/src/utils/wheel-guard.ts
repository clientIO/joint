// Paper `guard` composed into every `<Paper>`'s `dia.Paper.options.guard` so a
// wheel over a scrollable node body scrolls the box instead of firing the
// paper's own `paper:pan` / `paper:pinch` events. Regions opt in with
// `data-jj-scrollable`; native `<textarea>` is covered free.
// `Ctrl`/`Cmd`+wheel is the paper's pinch-zoom modifier — never guarded.
interface GuardEvent {
  readonly type: string;
  readonly target: EventTarget | null;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
}

/**
 * DOM attribute that opts an element into the wheel-guard: a wheel whose target
 * sits inside a marked element that has actual overflow tells `dia.Paper` that
 * the element owns the wheel input, so `paper:pan` / `paper:pinch` do not fire.
 * @group Constants
 */
export const SCROLLABLE_ATTRIBUTE = 'data-jj-scrollable';

const SCROLLABLE_SELECTOR = `textarea, [${SCROLLABLE_ATTRIBUTE}]`;

function overflows(el: Element): boolean {
  return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
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
  if (!(event.target instanceof Element)) return false;
  for (
    let el: Element | null = event.target.closest(SCROLLABLE_SELECTOR);
    el;
    el = el.parentElement?.closest(SCROLLABLE_SELECTOR) ?? null
  ) {
    if (overflows(el)) return true;
  }
  return false;
}
