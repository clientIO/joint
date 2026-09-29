import {
  useLayoutEffect,
  useMemo,
  type ComponentType,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import typedMemo from '../../../utils/typed-react';
import { useGraphStore } from '../../../hooks/use-graph-store';
import { useCells } from '../../../hooks/use-cells';
import { usePaper } from '../../../hooks/use-paper';
import { useCellId } from '../../../hooks/use-cell-id';
import type { ElementRecord } from '../../../types/cell.types';

/**
 * Props for element item portal components.
 * Reads the current cell id from `CellIdContext` and subscribes to its
 * record via the graph store directly.
 */
export interface ElementItemProps {
  /**
   * Element renderer. Invoked as a JSX component with the element's `data`
   * spread as props, so wrapping it in `React.memo` works (React calls the
   * memo wrapper, not the inner function). Use `useCell(c => c.id)` inside
   * the renderer when the id is needed.
   */
  readonly renderElement: ComponentType<Record<string, unknown>>;
  /** The DOM element to portal into. */
  readonly portalElement: SVGElement | HTMLElement | null;
  /** Whether all auto-sized elements have been measured. */
  readonly areElementsMeasured: boolean;
}

/**
 * SVG element portal component. Subscribes only to the element's `data`
 * slice, position and size are handled by JointJS's view transform and
 * never cause a React re-render here. Clears cached views after
 * measurement to force re-render with correct dimensions.
 * @param props - render/portal props
 * @internal
 */
function SVGElementItemComponent(props: ElementItemProps) {
  const { renderElement: RenderElement, portalElement, areElementsMeasured } = props;
  const id = useCellId();
  // Subscribe to just this element's `data` slice (missing-tolerant — the portal
  // can mount before the record lands in the store, and briefly after removal).
  // `data`'s reference is stable across position/size/angle changes, so React
  // skips the re-render unless `data` itself changed.
  const data = useCells(id, (cell) => cell?.data);
  const graphStore = useGraphStore();
  const { paper } = usePaper();
  useLayoutEffect(() => {
    if (!paper) return;
    graphStore.clearViewForElementAndLinks({
      cellId: id,
      paper,
    });
  }, [id, graphStore, areElementsMeasured, paper]);

  if (!portalElement) {
    return null;
  }

  // Render as JSX (not function call) so a `React.memo`-wrapped
  // `RenderElement` actually short-circuits on prop equality.
  return createPortal(<RenderElement {...(data ?? {})} />, portalElement);
}

/**
 * SVG portal wrapper used by `renderElement`.
 * @internal
 */
export const SVGElementItem = typedMemo(SVGElementItemComponent);

/**
 * HTML element portal component with absolute positioning. Reads
 * `position` / `size` directly from the element record; `renderElement`
 * only receives `data` and is memoised on the `data` reference so position
 * or size updates re-style the wrapper without re-invoking the user render.
 * @param props - render/portal props
 * @internal
 */
function HTMLElementItemComponent(props: ElementItemProps) {
  const { renderElement: RenderElement, portalElement } = props;
  const id = useCellId();
  // Subscribe to the whole element record (missing-tolerant — the portal can
  // mount before the record lands in the store, and briefly after removal).
  const element = useCells<ElementRecord>(id, (cell) => cell);

  const x = element?.position?.x ?? 0;
  const y = element?.position?.y ?? 0;
  const width = element?.size?.width ?? 0;
  const height = element?.size?.height ?? 0;

  const style = useMemo(
    (): CSSProperties => ({
      width,
      height,
      position: 'absolute',
      left: 0,
      top: 0,
      transform: `translate(${x}px, ${y}px)`,
      pointerEvents: 'auto',
    }),
    [height, width, x, y]
  );

  if (!portalElement) {
    return null;
  }

  // Render as JSX (not function call) so a `React.memo`-wrapped
  // `RenderElement` actually short-circuits on prop equality.
  const dataProps = element?.data ?? {};

  return createPortal(
    <div model-id={id} style={style}>
      <RenderElement {...dataProps} />
    </div>,
    portalElement
  );
}

/**
 * HTML portal wrapper used by `renderElement` with `useHTMLOverlay`.
 * @internal
 */
export const HTMLElementItem = typedMemo(HTMLElementItemComponent);

/**
 * SVG hit area for elements rendered in the HTML overlay layer.
 * Renders a transparent rectangle matching the element's size so that
 * pointer events (click, hover, drag) are captured by the SVG paper.
 * @internal
 */
export function ElementHitArea() {
  const id = useCellId();
  const element = useCells<ElementRecord>(id, (cell) => cell);
  const width = element?.size?.width ?? 0;
  const height = element?.size?.height ?? 0;
  return <rect width={width} height={height} fill="transparent" />;
}
