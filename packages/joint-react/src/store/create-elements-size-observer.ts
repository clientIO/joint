import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { FlatElementData } from '../types/element-types';
import type { GraphStoreSnapshot, NodeLayout } from './graph-store';

const DEFAULT_OBSERVER_OPTIONS: ResizeObserverOptions = { box: 'border-box' };
// Epsilon value to avoid jitter due to sub-pixel rendering
// especially on Safari
const EPSILON = 0.5;

export type NodeLayoutOptionalXY = Pick<NodeLayout, 'width' | 'height'> &
  Partial<Pick<NodeLayout, 'x' | 'y'>>;

/**
 * Options passed to the setSize callback when an element's size changes.
 */
export interface TransformOptions extends Required<NodeLayout> {
  /** The JointJS element instance */
  readonly element: dia.Element;
  readonly id: CellId;
}

/**
 * Callback function called when an element's size is measured.
 * Allows custom handling of size updates before they're applied to the graph.
 */
export type OnTransformElement = (options: TransformOptions) => NodeLayoutOptionalXY;

/**
 * Options for registering an element to be measured for size changes.
 */
export interface SetMeasuredNodeOptions {
  /** The DOM node (HTML or SVG) to observe for size changes */
  readonly node: HTMLElement | SVGElement;
  /** Optional callback to handle size updates before they're applied */
  readonly transform?: OnTransformElement;
  /** The ID of the cell in the graph that corresponds to this DOM node */
  readonly id: CellId;
  /**
   * DOM node to hide until measurement is complete.
   * When `undefined`, nothing is hidden.
   */
  readonly visibilityNode?: HTMLElement | SVGElement;
}

interface ObservedElement {
  readonly id: CellId;
  readonly node: HTMLElement | SVGElement;
  readonly visibilityNode?: HTMLElement | SVGElement;
  readonly transform?: OnTransformElement;
  lastWidth?: number;
  lastHeight?: number;
  isMeasured: boolean;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function identityTransform(options: TransformOptions) {
  const { width, height, x, y } = options;
  return { width, height, x, y };
}
/**
 * Options for creating an elements size observer.
 */
interface Options {
  /** Options to pass to the ResizeObserver constructor */
  readonly resizeObserverOptions?: ResizeObserverOptions;
  /** Function to get the current size of a cell from the graph */
  readonly getCellTransform: (
    id: CellId
  ) => NodeLayoutOptionalXY & { element: dia.Element; angle: number };
  /** Function to get the current public snapshot containing all elements */
  readonly getPublicSnapshot: () => GraphStoreSnapshot;
  /** Callback function called when a batch of elements needs to be updated */
  readonly onBatchUpdate: (data: Record<CellId, FlatElementData>) => void;
}

/**
 * Observer interface for tracking element size changes.
 * Uses ResizeObserver to automatically detect when DOM elements change size
 * and updates the corresponding graph elements.
 */
export interface GraphStoreObserver {
  /**
   * Adds an element to be observed for size changes.
   * @param options - Configuration for the measured node
   * @returns Cleanup function to stop observing
   */
  readonly add: (options: SetMeasuredNodeOptions) => () => void;
  /**
   * Cleans up all observers and resources.
   */
  readonly clean: () => void;
  /**
   * Checks if a node is currently being observed.
   * @param id - The ID of the cell to check
   * @returns True if the node is being observed
   */
  readonly has: (id: CellId) => boolean;
}

/**
 * Rounds a number to two decimals.
 * @param value - The value to round to two decimals
 * @returns The rounded value
 */
function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Options for processing a single element's size change.
 */
interface ProcessSizeChangeOptions {
  readonly measuredWidth: number;
  readonly measuredHeight: number;
  readonly observedElement: ObservedElement;
  readonly getCellTransform: Options['getCellTransform'];
  readonly updatedElementsData: Record<CellId, FlatElementData>;
}

/**
 * Processes a size change for a single element.
 * Returns true if the element was updated, false otherwise.
 * @param options - The options containing size data and element references
 * @returns True if the element was updated, false otherwise
 */
function processSizeChange(options: ProcessSizeChangeOptions): boolean {
  const { measuredWidth, measuredHeight, observedElement, getCellTransform, updatedElementsData } =
    options;
  const currentCellTransform = getCellTransform(observedElement.id);
  const graphElement = updatedElementsData[observedElement.id];

  if (!graphElement) {
    return false;
  }

  if (
    Math.abs(currentCellTransform.width - measuredWidth) <= EPSILON &&
    Math.abs(currentCellTransform.height - measuredHeight) <= EPSILON
  ) {
    return false;
  }

  if (
    Math.abs((observedElement.lastWidth ?? 0) - measuredWidth) <= EPSILON &&
    Math.abs((observedElement.lastHeight ?? 0) - measuredHeight) <= EPSILON
  ) {
    return false;
  }

  observedElement.lastWidth = measuredWidth;
  observedElement.lastHeight = measuredHeight;

  const { x, y, angle, element: cell } = currentCellTransform;
  const transform = observedElement.transform ?? identityTransform;
  updatedElementsData[observedElement.id] = {
    ...graphElement,
    ...transform({
      x: x ?? 0,
      y: y ?? 0,
      angle: angle ?? 0,
      element: cell,
      width: measuredWidth,
      height: measuredHeight,
      id: observedElement.id,
    }),
  };

  return true;
}

/**
 * Creates an observer for element size changes using the ResizeObserver API.
 *
 * This function sets up automatic size tracking for DOM elements that correspond to graph elements.
 * When a DOM element's size changes (e.g., due to content changes or CSS updates), the observer
 * automatically updates the corresponding graph element's size.
 *
 * **Features:**
 * - Uses ResizeObserver for efficient size tracking
 * - Compares sizes with epsilon to avoid jitter from sub-pixel rendering
 * - Supports custom size update handlers
 * @param options - The options for creating the size observer
 * @returns A GraphStoreObserver instance with methods to add/remove observers
 */
export function createElementsSizeObserver(options: Options): GraphStoreObserver {
  const {
    resizeObserverOptions = DEFAULT_OBSERVER_OPTIONS,
    getCellTransform,
    onBatchUpdate,
    getPublicSnapshot,
  } = options;
  const observedElementsByCellId = new Map<CellId, ObservedElement>();
  const observedElementsByDomElement = new WeakMap<HTMLElement | SVGElement, ObservedElement>();

  const observer = new ResizeObserver((entries) => {
    let hasAnySizeChange = false;
    const publicSnapshot = getPublicSnapshot();
    const elementsRecord = publicSnapshot.elements as Record<CellId, FlatElementData>;
    const updatedElementsData: Record<CellId, FlatElementData> = { ...elementsRecord };

    for (const entry of entries) {
      // We must be careful to not mutate the snapshot data.
      const { target, borderBoxSize } = entry;
      const observedElement = observedElementsByDomElement.get(target as HTMLElement | SVGElement);
      if (!observedElement) continue;

      if (!observedElement) continue;
      observedElement.visibilityNode?.style.removeProperty('visibility');

      // If borderBoxSize is not available or empty, continue to the next entry.
      if (!borderBoxSize || borderBoxSize.length === 0) {
        continue;
      }

      const [size] = borderBoxSize;
      const { inlineSize, blockSize } = size;

      const measuredWidth = roundToTwoDecimals(inlineSize);
      const measuredHeight = roundToTwoDecimals(blockSize);

      // Skip zero-size entries. This happens when an element is hidden (display:none)
      // or removed from the DOM. We must never propagate 0-size to the model.
      if (measuredWidth <= 0 || measuredHeight <= 0) {
        continue;
      }

      const wasUpdated = processSizeChange({
        measuredWidth,
        measuredHeight,
        observedElement,
        getCellTransform,
        updatedElementsData,
      });

      if (wasUpdated) {
        hasAnySizeChange = true;
      }
    }

    if (!hasAnySizeChange) {
      return;
    }

    onBatchUpdate(updatedElementsData);
  });

  return {
    add({ id, node, transform, visibilityNode }: SetMeasuredNodeOptions) {
      visibilityNode?.style.setProperty('visibility', 'hidden');
      const observedElement: ObservedElement = {
        id,
        node,
        visibilityNode,
        transform,
        isMeasured: false,
      };
      observer.observe(node, resizeObserverOptions);
      observedElementsByCellId.set(id, observedElement);
      observedElementsByDomElement.set(node, observedElement);

      return () => {
        observer.unobserve(node);
        observedElementsByCellId.delete(id);
        observedElementsByDomElement.delete(node);
      };
    },
    clean() {
      for (const [, { node }] of observedElementsByCellId.entries()) {
        observer.unobserve(node);
      }
      observedElementsByCellId.clear();
      observer.disconnect();
    },
    has(id: CellId) {
      return observedElementsByCellId.has(id);
    },
  };
}
