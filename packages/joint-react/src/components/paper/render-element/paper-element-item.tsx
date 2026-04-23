import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import typedMemo from '../../../utils/typed-react';
import { useGraphStore, usePaper } from '../../../hooks';
import { useCellId } from '../../../hooks/use-cell-id';
import type { CellId, ElementRecord } from '../../../types/cell.types';

/**
 * Props for element item portal components.
 * Reads the current cell id from `CellIdContext` and subscribes to its
 * record via the graph store directly.
 */
export interface ElementItemProps {
  /** Renderer receiving only the element's `data` slice. */
  readonly renderElement: (data: unknown) => ReactNode;
  /** The DOM element to portal into. */
  readonly portalElement: SVGElement | HTMLElement | null;
  /** Whether all auto-sized elements have been measured. */
  readonly areElementsMeasured: boolean;
}

/**
 * Subscribe only to the `data` slice of the current element. Returns the
 * same reference across unrelated cell updates (position / size / angle
 * changes preserve the `data` ref via `mergeElementRecord`), so React
 * skips the re-render unless `data` actually changed.
 * @returns current element's `data`, possibly undefined
 */
function useElementDataSnapshot(id: CellId): unknown {
  const store = useGraphStore();
  const { cells } = store.graphView;
  const subscribe = useCallback(
    (listener: () => void) => cells.subscribe(id, listener),
    [cells, id]
  );
  const getSnapshot = useCallback(
    () => (cells.get(id) as ElementRecord | undefined)?.data,
    [cells, id]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Read the current element record (full cell). Used by the HTML portal
 * wrapper which also needs position and size for its absolute-positioned
 * container div.
 * @returns current element record, or a placeholder when missing
 */
function useCurrentElementRecord(id: CellId): ElementRecord {
  const store = useGraphStore();
  const { cells } = store.graphView;
  const subscribe = useCallback(
    (listener: () => void) => cells.subscribe(id, listener),
    [cells, id]
  );
  const getSnapshot = useCallback(() => cells.get(id), [cells, id]);
  const cell = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return (cell ?? { id, type: '' }) as unknown as ElementRecord;
}

/**
 * SVG element portal component. Subscribes only to the element's `data`
 * slice — position and size are handled by JointJS's view transform and
 * never cause a React re-render here. Clears cached views after
 * measurement to force re-render with correct dimensions.
 * @param props - render/portal props
 * @internal
 */
function SVGElementItemComponent(props: ElementItemProps) {
  const { renderElement: RenderElement, portalElement, areElementsMeasured } = props;
  const id = useCellId();
  const data = useElementDataSnapshot(id);
  const graphStore = useGraphStore();
  const { paper } = usePaper();
  useLayoutEffect(() => {
    graphStore.clearViewForElementAndLinks({
      cellId: id,
      paper,
    });
  }, [id, graphStore, areElementsMeasured, paper]);

  if (!portalElement) {
    return null;
  }

  return createPortal(RenderElement(data), portalElement);
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
  const element = useCurrentElementRecord(id);

  const x = element.position?.x ?? 0;
  const y = element.position?.y ?? 0;
  const width = element.size?.width ?? 0;
  const height = element.size?.height ?? 0;

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

  // Only re-invoke the user's render when `data` actually changes — position
  // and size changes flow into `style` above without touching the renderer.
  const renderedContent = useMemo(
    () => RenderElement(element.data),
    [RenderElement, element.data]
  );

  if (!portalElement) {
    return null;
  }

  const container = (
    <div model-id={id} style={style}>
      {renderedContent}
    </div>
  );

  return createPortal(container, portalElement);
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
  const element = useCurrentElementRecord(id);
  const width = element.size?.width ?? 0;
  const height = element.size?.height ?? 0;
  return <rect width={width} height={height} fill="transparent" />;
}
