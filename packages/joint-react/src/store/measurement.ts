import { mvc, type dia } from '@joint/core';
import type { CellId, ElementLayout } from '../types/cell.types';
import type { PaperStore } from './paper-store';
import { simpleScheduler } from '../utils/scheduler';
import { warnResizeOnAutoSizedElement } from '../utils/dev-warnings';

/**
 * `dia.Cell.set()` option key used to mark writes that originate from the
 * auto-size / measurement pipeline. `change:size` listeners can read it to
 * distinguish measurement writes from external ones (controlled-mode sync,
 * `cell.resize`, interactive tools) and avoid feedback loops. Exported for
 * plugin authors and `@joint/react-plus` via `@joint/react/internal`.
 */
export const AUTO_SIZE_OPTION = 'autoSize';

/**
 * Reference point that stays fixed when an auto-sized element's measured size
 * changes. Mirrors CSS `transform-origin` semantics.
 *
 * - `'top-left'` (default): element grows right/down, top-left stays put.
 * - `'center'`: element grows symmetrically, geometric center stays put.
 *
 * Only affects writes from the {@link useMeasureElement} pipeline. Manual `cell.resize()`,
 * interactive resize tools, and direct `cell.set('size', ...)` calls are unaffected.
 * @group Types
 */
export type AutoSizeOrigin = 'top-left' | 'center';

const OBSERVER_OPTIONS: ResizeObserverOptions = { box: 'border-box' };
/** Tolerance that absorbs sub-pixel rendering jitter (notably on Safari). */
const EPSILON = 0.5;

/** A measured layout: `width`/`height` are required, `x`/`y` may be omitted. */
type MeasuredLayout = Pick<ElementLayout, 'width' | 'height'> &
  Partial<Pick<ElementLayout, 'x' | 'y'>>;

/**
 * The element's measurement, passed to a {@link TransformElementLayout} callback.
 * Carries the element's current `x`, `y`, and `angle` together with the freshly
 * measured `width` and `height`, plus the underlying model and cell id.
 * @expand
 * @group Types
 */
export interface TransformElementLayoutParams extends Required<ElementLayout> {
  /** The JointJS `dia.Element` instance being measured. */
  readonly model: dia.Element;
  /** Id of the cell being measured. */
  readonly id: CellId;
}

/**
 * Adjusts a measured element layout before it is written to the graph. Receives
 * the element's current geometry plus its newly measured size, and returns the
 * `width`/`height` (and optionally `x`/`y`) to apply — use it to clamp sizes,
 * snap to a grid, or reposition while auto-sizing. Pass it via the `transform`
 * option of {@link useMeasureElement}.
 * @example
 * ```tsx
 * import type { TransformElementLayout } from '@joint/react';
 *
 * // Never let a measured element shrink below 80px wide.
 * const transform: TransformElementLayout = ({ width, height }) => ({
 *   width: Math.max(width, 80),
 *   height,
 * });
 * ```
 * @see {@link TransformElementLayoutParams}
 * @group Types
 */
export type TransformElementLayout = (params: TransformElementLayoutParams) => MeasuredLayout;

/** A DOM node whose size drives the size of the element `id`. */
interface MeasuredNode {
  readonly id: CellId;
  readonly node: HTMLElement | SVGElement;
  readonly transform?: TransformElementLayout;
}

/** A registered {@link MeasuredNode} plus the last size it reported. */
interface ObservedNode extends MeasuredNode {
  lastWidth?: number;
  lastHeight?: number;
}

interface Options {
  readonly graph: dia.Graph;
  readonly autoSizeOrigin: AutoSizeOrigin;
  /** The graph store's live paper registry: papers are what render and measure. */
  readonly paperStores: ReadonlyMap<string, PaperStore>;
}

const isSameSize = (a: number, b: number) => Math.abs(a - b) <= EPSILON;
const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

/**
 * Everything `@joint/react` knows about measuring elements, for one graph:
 * sizing elements from their rendered DOM node ({@link useMeasureElement}) and
 * telling when sizes are settled ({@link useOnElementsMeasured}).
 *
 * The sizing version changes once per settled change. An element is outstanding from
 * arriving in the graph until it is accounted for: its React content committed
 * without registering a node (`markRendered`), no paper renders it
 * (`settleUnrendered`), the node it registered was measured, or it left the
 * graph. A zero size is never read as "waiting": it is a legal final size.
 * Sizes the application writes are not measurements and never bump.
 *
 * The `ResizeObserver` is created by the first `observe()`, so a diagram that
 * never measures does not have one.
 * @param options - the graph, the auto-size origin and the paper registry
 * @returns the measurement controller owned by the graph store
 */
export function createMeasurement(options: Options) {
  const { graph, autoSizeOrigin, paperStores } = options;
  // `0` while nothing is measured; otherwise the latest of `lastVersion`, which
  // only grows, so a reset followed by a pass never repeats a value.
  let version = 0;
  let lastVersion = 0;
  const versionListeners = new Set<() => void>();
  const subscribe = (versionListener: () => void) => {
    versionListeners.add(versionListener);
    return () => {
      versionListeners.delete(versionListener);
    };
  };
  const setVersion = (next: number) => {
    version = next;
    for (const versionListener of versionListeners) versionListener();
  };
  let elementCount = 0;
  const outstanding = new Set<CellId>();
  let hasUndeliveredChange = false;
  // Registered nodes per element: the last one is the observed one, and the
  // previous one takes over again when it unmounts.
  const nodesById = new Map<CellId, ObservedNode[]>();
  const observedByNode = new WeakMap<Element, ObservedNode>();
  let resizeObserver: ResizeObserver | undefined;

  const deliver = () => {
    if (!hasUndeliveredChange) return;
    // Papers account for outstanding elements; without one nothing renders or
    // measures, so there is nothing to wait for.
    if (outstanding.size > 0 && paperStores.size > 0) return;
    hasUndeliveredChange = false;
    // An empty diagram has nothing to lay out. It is still the same diagram,
    // so the version is kept: only a reset starts a new history.
    if (elementCount === 0) return;
    lastVersion += 1;
    setVersion(lastVersion);
  };
  // One round later than the graph events that settle an element: the
  // projection commits those events in the round they are queued in, and a
  // subscriber of the new version reads the committed cells.
  const deliverNextRound = () => simpleScheduler(deliver);
  const scheduleDelivery = () => simpleScheduler(deliverNextRound);
  /** A change the subscribers are owed an event for, once nothing is outstanding. */
  const markChanged = () => {
    hasUndeliveredChange = true;
    scheduleDelivery();
  };
  // Settling is a change in itself: a pass delivered while no paper was mounted
  // leaves its elements outstanding, and the paper that renders them later owes
  // the event for their sizes.
  const settle = (id: CellId) => {
    if (outstanding.delete(id)) markChanged();
  };
  /**
   * Settles an element that nothing measures any more: it is not waiting for a
   * measurement either. Checked after this tick, because an effect that re-runs
   * (StrictMode) registers the node again right away.
   */
  const settleOnceUnobserved = (id: CellId) =>
    simpleScheduler(() => {
      if (!nodesById.has(id)) settle(id);
    });
  const track =(element: dia.Element) => {
    elementCount += 1;
    outstanding.add(element.id);
    markChanged();
  };

  /**
   * Whether some paper mounted the element's view and renders React content
   * into it, the only way a node gets registered.
   */
  const isRendered = (id: CellId) => {
    for (const { renderElement, paper } of paperStores.values()) {
      if (!renderElement) continue;
      const view = paper.getElementView(id);
      if (view?.el.isConnected && paper.getCellViewPortalNode(view)) return true;
    }
    return false;
  };

  const write = (model: dia.Element, layout: MeasuredLayout) => {
    const { width, height, x, y } = layout;
    const attributes: dia.Cell.Attributes = { size: { width, height } };
    if (x !== undefined && y !== undefined) {
      attributes.position = { x, y };
    } else if (autoSizeOrigin === 'center') {
      // Keep the geometric center fixed. With 'top-left' the position is not
      // written: the top-left stays put and the element grows right/down.
      const center = model.getCenter();
      attributes.position = { x: center.x - width / 2, y: center.y - height / 2 };
    }
    model.set(attributes, { [AUTO_SIZE_OPTION]: true });
  };

  /**
   * The write a reported box asks for, or `undefined` when there is none: a
   * hidden (`display: none`) or detached node reports zero, which is never
   * written, and a box equal to the model's size or to the last report is a no-op.
   */
  const toWrite = (observed: ObservedNode, box: ResizeObserverSize | undefined) => {
    if (!box) return;
    const width = roundToTwoDecimals(box.inlineSize);
    const height = roundToTwoDecimals(box.blockSize);
    if (width <= 0 || height <= 0) return;
    const { id, transform, lastWidth = 0, lastHeight = 0 } = observed;
    const model = graph.getCell(id);
    if (!model?.isElement()) return;
    const size = model.size();
    if (isSameSize(size.width, width) && isSameSize(size.height, height)) return;
    if (isSameSize(lastWidth, width) && isSameSize(lastHeight, height)) return;
    observed.lastWidth = width;
    observed.lastHeight = height;
    const { x, y } = model.position();
    const params = { x, y, angle: model.angle(), model, width, height, id };
    return [model, transform ? transform(params) : { width, height }] as const;
  };

  const onResize: ResizeObserverCallback = (entries) => {
    const writes: Array<readonly [dia.Element, MeasuredLayout]> = [];
    for (const { target, borderBoxSize } of entries) {
      const observed = observedByNode.get(target);
      if (!observed) continue;
      // Measured, whether or not a size is written: a measurement equal to the
      // model's size (the application pre-sized it) writes nothing.
      settle(observed.id);
      const pending = toWrite(observed, borderBoxSize?.[0]);
      if (pending) writes.push(pending);
    }
    if (writes.length === 0) return;
    graph.startBatch('auto-size');
    for (const [model, layout] of writes) write(model, layout);
    graph.stopBatch('auto-size');
  };

  const startObserving = (observed: ObservedNode) => {
    resizeObserver ??= new ResizeObserver(onResize);
    resizeObserver.observe(observed.node, OBSERVER_OPTIONS);
    observedByNode.set(observed.node, observed);
  };
  const stopObserving = (observed: ObservedNode) => {
    resizeObserver?.unobserve(observed.node);
    observedByNode.delete(observed.node);
  };
  /**
   * Measures every registered node again, as if it had just registered. Content
   * can survive a reset that keeps its ids (the HTML overlay keeps its nodes),
   * and a browser does not report an unchanged box again; the last report is
   * forgotten too, since the id may name a replacement model of another size.
   */
  const remeasureRegistered = () => {
    for (const nodes of nodesById.values()) {
      const active = nodes.at(-1);
      if (!active) continue;
      active.lastWidth = undefined;
      active.lastHeight = undefined;
      stopObserving(active);
      startObserving(active);
    }
  };

  // An external graph may already hold elements.
  for (const element of graph.getElements()) track(element);

  const listener = new mvc.Listener();
  listener.listenTo(graph, 'add', (cell: dia.Cell) => {
    if (cell.isElement()) track(cell);
  });
  listener.listenTo(graph, 'remove', (cell: dia.Cell) => {
    if (!cell.isElement()) return;
    // What is left has to be laid out again, so a removal is a change too.
    elementCount -= 1;
    outstanding.delete(cell.id);
    markChanged();
  });
  listener.listenTo(graph, 'reset', () => {
    // The reset replaces the diagram: until its first settled pass nothing is measured.
    elementCount = 0;
    outstanding.clear();
    hasUndeliveredChange = false;
    if (version > 0) setVersion(0);
    // `reset` suppresses the per-cell `add` events, and the collection it
    // carries holds only the default layer's cells.
    for (const element of graph.getElements()) track(element);
    remeasureRegistered();
  });
  listener.listenTo(
    graph,
    'change:size',
    (cell: dia.Cell, _size: dia.Size, changeOptions: dia.Cell.Options = {}) => {
      if (changeOptions[AUTO_SIZE_OPTION]) {
        outstanding.delete(cell.id);
        markChanged();
      } else if (nodesById.has(cell.id)) {
        // The measured content size overrides this resize.
        warnResizeOnAutoSizedElement(cell.id);
      }
    }
  );

  return {
    /**
     * The sizing version: `0` while nothing is measured, otherwise a number
     * that changes once per settled change. See {@link useOnElementsMeasured}.
     */
    getSizingVersion: () => version,
    /**
     * Whether the current version describes the diagram as it is: no element
     * is waiting to be measured and no change waits for its delivery.
     */
    isSettled: () => !hasUndeliveredChange && outstanding.size === 0,
    /**
     * Calls `versionListener` each time the sizing version changes.
     * @param versionListener - called synchronously with the change
     * @returns the unsubscribe function
     */
    subscribe,
    /**
     * Sizes the element from `node`, for as long as the returned cleanup has not run.
     * @param measured - the element id, its DOM node and an optional transform
     * @returns cleanup that stops measuring the node
     */
    observe(measured: MeasuredNode) {
      const { id } = measured;
      const observed: ObservedNode = { ...measured };
      const nodes = nodesById.get(id) ?? [];
      const active = nodes.at(-1);
      if (active) stopObserving(active);
      else nodesById.set(id, nodes);
      nodes.push(observed);
      startObserving(observed);
      return () => {
        const registered = nodesById.get(id);
        const index = registered?.indexOf(observed) ?? -1;
        if (!registered || index === -1) return;
        const wasObserved = index === registered.length - 1;
        registered.splice(index, 1);
        if (!wasObserved) return;
        stopObserving(observed);
        const previous = registered.at(-1);
        if (previous) startObserving(previous);
        else {
          nodesById.delete(id);
          settleOnceUnobserved(id);
        }
      };
    },
    /**
     * An element's React content committed. Called after its subtree's layout
     * effects, so an element that registered a node stays outstanding until
     * measured, while one that nothing measures is settled now.
     * @param id - the rendered element
     */
    markRendered(id: CellId) {
      if (!nodesById.has(id)) settle(id);
    },
    /**
     * A paper finished a render pass (`render:done`, or `render:idle` after a
     * pass that only culled): every view it mounts for this pass is in the DOM now. An outstanding element that no paper renders
     * (viewport culling, `cellVisibility`, a hidden group) is not going to be
     * measured, so it is settled with the size it has. O(outstanding), which is
     * empty between changes.
     */
    settleUnrendered() {
      for (const id of outstanding) {
        if (!nodesById.has(id) && !isRendered(id)) settle(id);
      }
    },
    /**
     * A paper was removed. Only papers hold outstanding elements back, so with
     * the last one gone the event is due. Checked on the next pass, not now: a
     * paper re-created right away (StrictMode, a hot reload) keeps them waiting.
     */
    onPaperRemoved: scheduleDelivery,
    /** Stops listening to the graph and observing nodes. */
    destroy() {
      listener.stopListening();
      resizeObserver?.disconnect();
      nodesById.clear();
    },
  };
}

/** Controller returned by {@link createMeasurement}. */
export type Measurement = ReturnType<typeof createMeasurement>;
