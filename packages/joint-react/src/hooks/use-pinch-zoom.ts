import { mvc, type dia } from '@joint/core';
import { useEffect } from 'react';
import type { PaperStore } from '../store/paper-store';

/**
 * Zoom limits for the built-in pinch-zoom behavior of `<Paper>`.
 * @group Types
 */
export interface PinchZoomBounds {
  /**
   * Lower zoom bound.
   * @default 0.2
   */
  readonly min?: number;
  /**
   * Upper zoom bound.
   * @default 5
   */
  readonly max?: number;
}

const DEFAULT_MIN_ZOOM = 0.2;
const DEFAULT_MAX_ZOOM = 5;

/**
 * Count subscribers of a paper event — the same internal `_events`
 * introspection joint-core uses to gate its ctrl+wheel pinch handling.
 * @param paper - The paper whose subscriptions are inspected.
 * @param eventName - Paper event name.
 * @returns Number of handlers currently subscribed.
 */
function countSubscribers(paper: dia.Paper, eventName: string): number {
  const events = (paper as unknown as { _events?: Record<string, readonly unknown[]> })._events;
  return events?.[eventName]?.length ?? 0;
}

function isTouchSourced(event: dia.Event): boolean {
  const type = (event as { type?: string }).type ?? '';
  return type.startsWith('touch');
}

/**
 * Built-in pinch-zoom behavior for `<Paper>`: applies `paper:pinch` samples as
 * a clamped `scaleUniformAtPoint` around the gesture point, and touch-sourced
 * `paper:pan` samples as a translation — so pinch-to-zoom and two-finger pan
 * work out of the box on a touchscreen and a touchpad (ctrl+wheel).
 *
 * Self-yielding: whenever any other subscriber listens to the same event (an
 * `onPaperPinch` / `onPaperPan` prop, a scroller's interactions), that
 * subscriber owns the gesture and the built-in does nothing. Checked per
 * event, so handlers subscribed at any time are honored.
 * @param paperStore - Store owning the paper, or nullish before creation.
 * @param zoomOnPinch - The `zoomOnPinch` prop: `false` disables, an object tunes the bounds.
 * @internal
 */
export function usePinchZoom(
  paperStore: PaperStore | null | undefined,
  zoomOnPinch: boolean | PinchZoomBounds | undefined
): void {
  const isEnabled = zoomOnPinch !== false;
  const bounds = typeof zoomOnPinch === 'object' ? zoomOnPinch : undefined;
  const minZoom = bounds?.min ?? DEFAULT_MIN_ZOOM;
  const maxZoom = bounds?.max ?? DEFAULT_MAX_ZOOM;
  const paper = paperStore?.paper;

  useEffect(() => {
    if (!paper || !isEnabled) return;
    const onPinch = (_event: dia.Event, x: number, y: number, scale: number) => {
      if (countSubscribers(paper, 'paper:pinch') > 1) return;
      const currentScale = paper.scale().sx;
      const nextScale = Math.min(maxZoom, Math.max(minZoom, currentScale * scale));
      if (nextScale === currentScale) return;
      paper.scaleUniformAtPoint(nextScale, { x, y });
    };
    const onPan = (event: dia.Event, deltaX: number, deltaY: number) => {
      // Touch gestures only: wheel emits `paper:pan` for every plain scroll,
      // and out-of-the-box wheel panning is not part of this behavior.
      if (!isTouchSourced(event)) return;
      if (countSubscribers(paper, 'paper:pan') > 1) return;
      const { tx, ty } = paper.translate();
      paper.translate(tx - deltaX, ty - deltaY);
    };
    const controller = new mvc.Listener();
    controller.listenTo(paper, 'paper:pinch', onPinch);
    controller.listenTo(paper, 'paper:pan', onPan);
    return () => controller.stopListening();
  }, [paper, isEnabled, minZoom, maxZoom]);
}
