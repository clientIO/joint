import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import typedMemo from '../../../utils/typed-react';
import { useGraphStore, usePaper } from '../../../hooks';
import { useCellId } from '../../../hooks/use-cell-id';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';
import type { CellId, ElementRecord } from '../../../types/cell.types';

/**
 * Props for element item portal components.
 * Reads the current cell id from `CellIdContext` and subscribes to its
 * record via the graph store directly.
 */
export interface ElementItemProps {
  /**
   * Element renderer. Invoked as a JSX component with the element's `data`
   * spread as props — so wrapping it in `React.memo` works (React calls the
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
 * Subscribe only to the `data` slice of the current element. Returns the
 * same reference across unrelated cell updates (position / size / angle
 * changes preserve the `data` ref via `mergeElementRecord`), so React
 * skips the re-render unless `data` actually changed.
 * @param id - cell id to subscribe to
 * @returns current element's `data`, possibly undefined
 */
function useElementDataSnapshot(id: CellId): Record<string, unknown> | undefined {
  const store = useGraphStore();
  const { cells } = store.graphView;
  const subscribe = useCallback(
    (listener: () => void) => cells.subscribe(id, listener),
    [cells, id]
  );
  const getSnapshot = useCallback(
    () => (cells.get(id) as ElementRecord | undefined)?.data as Record<string, unknown> | undefined,
    [cells, id]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribes to the cell by id and returns the raw (un-resolved)
 * `ElementRecord`. Returns a `{ id, type }` placeholder during the brief
 * window between `insertView` firing and the cell landing in the store, so
 * portal wrappers can mount a 0×0 container synchronously rather than
 * crashing. Callers must tolerate optional `position` / `size`.
 *
 * Contrast with the public `useCell()` hook, which returns the
 * `Computed<ElementRecord>` (position/size/angle/data required) and throws
 * when the cell is missing.
 * @param id - cell id to subscribe to
 * @returns current element record, or a `{ id, type }` placeholder when missing
 */
function useUnresolvedElement(id: CellId): ElementRecord {
  const store = useGraphStore();
  const { cells } = store.graphView;
  const subscribe = useCallback(
    (listener: () => void) => cells.subscribe(id, listener),
    [cells, id]
  );
  const getSnapshot = useCallback(() => cells.get(id), [cells, id]);
  const cell = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (cell === undefined) {
    // Placeholder when the cell is not (yet) in the store — only the id is
    // truly known. The full ElementRecord shape is partially populated.
    const placeholder: ElementRecord = { id, type: ELEMENT_MODEL_TYPE, data: undefined };
    return placeholder;
  }
  return cell as ElementRecord;
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
  const element = useUnresolvedElement(id);

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

  if (!portalElement) {
    return null;
  }

  // Render as JSX (not function call) so a `React.memo`-wrapped
  // `RenderElement` actually short-circuits on prop equality.
  const dataProps = (element.data as Record<string, unknown> | undefined) ?? {};

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
  const element = useUnresolvedElement(id);
  const width = element.size?.width ?? 0;
  const height = element.size?.height ?? 0;
  return <rect width={width} height={height} fill="transparent" />;
}
