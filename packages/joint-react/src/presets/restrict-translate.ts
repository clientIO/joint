import type { dia } from '@joint/core';

/** Context passed to a `restrictTranslate` callback. */
export interface RestrictTranslateContext {
  /** The element being dragged. */
  readonly model: dia.Element;
  /** Pointer coordinates in paper space at the moment the drag started. */
  readonly pointerStart: dia.Point;
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

/**
 * Callback form of `restrictTranslate` with a structured context.
 * Returns the same shape JointJS expects — a bounding box, a boolean, or a
 * per-point constraint callback.
 */
export type RestrictTranslateCallback = (
  context: RestrictTranslateContext,
) => dia.BBox | boolean | dia.Paper.PointConstraintCallback;

/** Value accepted by the `restrictTranslate` Paper prop. */
export type RestrictTranslate = boolean | dia.BBox | RestrictTranslateCallback;

/**
 * Translates a `RestrictTranslate` prop value into the native
 * `dia.Paper.Options['restrictTranslate']` form. Booleans and `BBox`
 * pass through unchanged; a callback is rewrapped from the structured
 * context into JointJS's positional `(elementView, x0, y0)` signature.
 * @param value - The prop value (or `undefined`).
 * @returns The native option value, or `undefined` when the prop is omitted.
 */
export function toNativeRestrictTranslate(
  value: RestrictTranslate | undefined,
): dia.Paper.Options['restrictTranslate'] {
  if (typeof value !== 'function') return value;
  return (elementView, x0, y0) => {
    const paper = elementView.paper!;
    return value({
      model: elementView.model,
      pointerStart: { x: x0, y: y0 },
      paper,
      graph: paper.model,
    });
  };
}
