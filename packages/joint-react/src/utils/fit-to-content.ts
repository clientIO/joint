import type { dia, g } from '@joint/core';
import type { FitToContentOptions, FitToContentRefit } from '../components/paper/paper.types';
import { warnFitResizeUnderScroller } from './dev-warnings';

/**
 * A fully defaulted {@link FitToContentOptions}: `mode` and `refit` are always
 * present, so callers never re-apply defaults.
 * @internal
 */
export type ResolvedFitOptions =
  | (Readonly<dia.Paper.TransformToFitContentOptions> & {
      readonly mode: 'zoom';
      readonly refit: FitToContentRefit;
    })
  | (Readonly<dia.Paper.FitToContentOptions> & {
      readonly mode: 'resize';
      readonly refit: FitToContentRefit;
    });

const DEFAULT_REFIT: FitToContentRefit = 'resize';

/**
 * Fills in the defaults for the `fitToContent` prop, turning its
 * `boolean | FitToContentOptions` shape into one resolved object.
 *
 * Every default is applied with `??` *after* the caller's options are spread.
 * Spreading defaults first would let an explicit `undefined` erase them — and a
 * caller assembling the object from optional fields (`verticalAlign: align`)
 * passes exactly that, which would silently fall back to core's top-left
 * framing instead of the centred framing this prop promises.
 * @param input - The raw prop value; omitted or `undefined` switches fitting off.
 * @returns Resolved options, or `null` when fitting is switched off.
 * @internal
 */
export function normalizeFitOptions(
  input?: boolean | FitToContentOptions
): ResolvedFitOptions | null {
  if (!input) return null;
  const options: FitToContentOptions = input === true ? {} : input;
  const refit = options.refit ?? DEFAULT_REFIT;
  if (options.mode === 'resize') {
    return {
      ...options,
      mode: 'resize',
      refit,
      useModelGeometry: options.useModelGeometry ?? true,
    };
  }
  // Centred, model-geometry framing — what the effect this prop replaces did by hand.
  return {
    ...options,
    mode: 'zoom',
    refit,
    useModelGeometry: options.useModelGeometry ?? true,
    verticalAlign: options.verticalAlign ?? 'middle',
    horizontalAlign: options.horizontalAlign ?? 'middle',
  };
}

/** Feature key `@joint/react-plus` registers its `ui.PaperScroller` under. */
const PAPER_SCROLLER_FEATURE = 'paperScroller';

/**
 * The `zoomToRect` options the fit passes. Declared locally because the
 * `ui.PaperScroller` types live in `@joint/plus`, which `@joint/react` does not
 * depend on.
 */
interface FitZoomToRectOptions extends Readonly<dia.Paper.TransformToFitContentOptions> {
  readonly minScale?: number;
  readonly maxScale?: number;
}

/**
 * The only part of a `<PaperScroller>` the fit uses. Nothing else about the
 * scroller is assumed, so `@joint/react` stays free of a `@joint/plus` import.
 * @internal
 */
export interface FitScrollerLike {
  readonly el: HTMLElement;
  readonly zoomToRect: (rect: g.Rect, options?: FitZoomToRectOptions) => void;
  readonly getZoomBounds: () => { readonly min: number; readonly max: number };
}

/**
 * Narrows an unknown registered feature instance to {@link FitScrollerLike}.
 * A type guard rather than a cast: `Feature.instance` is `unknown`, and this is
 * the only place the shape is trusted.
 * @param instance - The feature instance to inspect.
 * @returns True when the instance exposes the scroller surface the fit calls.
 * @internal
 */
export function isFitScroller(instance: unknown): instance is FitScrollerLike {
  return (
    typeof instance === 'object' &&
    instance !== null &&
    'zoomToRect' in instance &&
    typeof instance.zoomToRect === 'function' &&
    'getZoomBounds' in instance &&
    typeof instance.getZoomBounds === 'function' &&
    'el' in instance &&
    instance.el instanceof HTMLElement
  );
}

/**
 * The paper surface `runFit` drives. Declared structurally so the unit tests can
 * exercise it without mounting a real paper.
 * @internal
 */
interface FitPaperLike {
  readonly el: HTMLElement;
  readonly getContentArea: (options: { useModelGeometry: boolean }) => g.Rect;
  readonly transformToFitContent: (options?: dia.Paper.TransformToFitContentOptions) => void;
  readonly fitToContent: (options?: dia.Paper.FitToContentOptions) => g.Rect;
}

/**
 * The store slice `runFit` reads: the paper plus the registered features.
 * @internal
 */
export interface FitStoreLike {
  readonly paperId: string;
  readonly paper: FitPaperLike;
  readonly features: Readonly<Record<string, { readonly instance: unknown } | undefined>>;
}

/**
 * Finds a `<PaperScroller>` registered against this paper, if any.
 * @param paperStore - The paper's store.
 * @returns The scroller, or `null` when none is registered.
 * @internal
 */
export function resolveFitScroller(paperStore: FitStoreLike): FitScrollerLike | null {
  const instance = paperStore.features[PAPER_SCROLLER_FEATURE]?.instance;
  return isFitScroller(instance) ? instance : null;
}

/**
 * The element whose size changes should trigger a re-fit: the scroller's
 * viewport when one owns the paper, otherwise the paper's own host.
 * @param paperStore - The paper's store.
 * @returns The element to observe.
 * @internal
 */
export function resolveFitHost(paperStore: FitStoreLike): Element {
  return resolveFitScroller(paperStore)?.el ?? paperStore.paper.el;
}

/**
 * Frames the paper's content once, routing through a `<PaperScroller>` when one
 * owns the viewport.
 * @param paperStore - The paper's store.
 * @param options - Resolved fit options from {@link normalizeFitOptions}.
 * @internal
 */
export function runFit(paperStore: FitStoreLike, options: ResolvedFitOptions): void {
  const { paper } = paperStore;
  const contentArea = paper.getContentArea({ useModelGeometry: options.useModelGeometry ?? true });
  if (contentArea.width <= 0 || contentArea.height <= 0) return;

  const scroller = resolveFitScroller(paperStore);
  if (scroller) {
    if (options.mode === 'resize') {
      warnFitResizeUnderScroller(paperStore.paperId);
      return;
    }
    // The scroller owns the viewport: `paper.getComputedSize()` is the sheet,
    // not the visible window, so `transformToFitContent` would fit to the wrong
    // box and never scroll. Same call `usePaperScroller().zoomToFit()` makes.
    const { min, max } = scroller.getZoomBounds();
    scroller.zoomToRect(contentArea, { minScale: min, maxScale: max, ...options });
    return;
  }

  if (options.mode === 'resize') {
    paper.fitToContent(options);
    return;
  }
  paper.transformToFitContent(options);
}
