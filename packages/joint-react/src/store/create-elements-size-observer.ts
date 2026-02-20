/* eslint-disable sonarjs/cognitive-complexity */
import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphStoreSnapshot, NodeLayout } from './graph-store';
import type { MarkDeepReadOnly } from '../utils/create-state';

const DEFAULT_OBSERVER_OPTIONS: ResizeObserverOptions = { box: 'border-box' };
// Epsilon value to avoid jitter due to sub-pixel rendering
// especially on Safari
const EPSILON = 0.5;

export interface NodeLayoutOptionalXY {
  /** X position of the node */
  readonly x?: number;
  /** Y position of the node */
  readonly y?: number;
  /** Width of the node */
  readonly width: number;
  /** Height of the node */
  readonly height: number;
}

/**
 * Options passed to the setSize callback when an element's size changes.
 */
export interface TransformOptions extends Required<NodeLayout> {
  /** The JointJS element instance */
  readonly element: dia.Element;
  readonly id: dia.Cell.ID;
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
  /** The DOM element (HTML or SVG) to observe for size changes */
  readonly element: HTMLElement | SVGElement;
  /** Optional callback to handle size updates before they're applied */
  readonly transform?: OnTransformElement;
  /** The ID of the cell in the graph that corresponds to this DOM element */
  readonly id: dia.Cell.ID;
}

interface ObservedElement {
  readonly element: HTMLElement | SVGElement;
  readonly transform?: OnTransformElement;
  lastWidth?: number;
  lastHeight?: number;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function defaultTransform(options: TransformOptions) {
  const { width, height, x, y } = options;
  return { width, height, x, y };
}
const DEFAULT_OBSERVED_ELEMENT: Partial<ObservedElement> = {
  transform: defaultTransform,
};
/**
 * Options for creating an elements size observer.
 */
interface Options {
  /** Options to pass to the ResizeObserver constructor */
  readonly resizeObserverOptions?: ResizeObserverOptions;
  /** Function to get the current size of a cell from the graph */
  readonly getCellTransform: (
    id: dia.Cell.ID
  ) => NodeLayoutOptionalXY & { element: dia.Element; angle: number };
  /** Function to get the current public snapshot containing all elements */
  readonly getPublicSnapshot: () => MarkDeepReadOnly<GraphStoreSnapshot>;
  /** Callback function called when a batch of elements needs to be updated */
  readonly onBatchUpdate: (elements: Record<dia.Cell.ID, GraphElement>) => void;
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
  readonly has: (id: dia.Cell.ID) => boolean;
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
  readonly cellId: dia.Cell.ID;
  readonly measuredWidth: number;
  readonly measuredHeight: number;
  readonly observedElement: ObservedElement | Partial<ObservedElement>;
  readonly getCellTransform: Options['getCellTransform'];
  readonly updatedElements: Record<dia.Cell.ID, GraphElement>;
}

/**
 * Processes a size change for a single element.
 * Returns true if the element was updated, false otherwise.
 */
function processSizeChange(options: ProcessSizeChangeOptions): boolean {
  const {
    cellId,
    measuredWidth,
    measuredHeight,
    observedElement,
    getCellTransform,
    updatedElements,
  } = options;

  const currentCellTransform = getCellTransform(cellId);

  // Compare the measured size with the current cell size using epsilon to avoid jitter
  const hasSizeChanged =
    Math.abs(currentCellTransform.width - measuredWidth) > EPSILON ||
    Math.abs(currentCellTransform.height - measuredHeight) > EPSILON;

  if (!hasSizeChanged) {
    return false;
  }

  // We observe just width and height, not x and y
  if (
    currentCellTransform.width === measuredWidth &&
    currentCellTransform.height === measuredHeight
  ) {
    return false;
  }

  const graphElement = updatedElements[cellId];
  if (!graphElement) {
    return false;
  }

  const { transform: sizeTransformFunction = defaultTransform } = observedElement;

  const lastWidth = roundToTwoDecimals(observedElement.lastWidth ?? 0);
  const lastHeight = roundToTwoDecimals(observedElement.lastHeight ?? 0);

  // Check if the change is significant compared to the last observed size
  const widthDifference = Math.abs(lastWidth - measuredWidth);
  const heightDifference = Math.abs(lastHeight - measuredHeight);
  if (widthDifference <= EPSILON && heightDifference <= EPSILON) {
    return false;
  }

  // Update cached size values
  observedElement.lastWidth = measuredWidth;
  observedElement.lastHeight = measuredHeight;

  const { x, y, angle, element: cell } = currentCellTransform;
  updatedElements[cellId] = {
    ...graphElement,
    ...sizeTransformFunction({
      x: x ?? 0,
      y: y ?? 0,
      angle: angle ?? 0,
      element: cell,
      width: measuredWidth,
      height: measuredHeight,
      id: cellId,
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
 * - Batches multiple size changes together for performance
 * - Compares sizes with epsilon to avoid jitter from sub-pixel rendering
 * - Supports custom size update handlers
 * - Performs immediate synchronous measurement on add to prevent flickering
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
  const observedElementsByCellId = new Map<dia.Cell.ID, ObservedElement>();
  const cellIdByDomElement = new Map<HTMLElement | SVGElement, dia.Cell.ID>();

  // Pending immediate measurements to batch
  const pendingImmediateMeasurements = new Map<dia.Cell.ID, { width: number; height: number }>();
  let isImmediateBatchScheduled = false;

  /**
   * Flushes all pending immediate measurements in a single batch update.
   */
  function flushImmediateMeasurements() {
    if (pendingImmediateMeasurements.size === 0) {
      isImmediateBatchScheduled = false;
      return;
    }

    const publicSnapshot = getPublicSnapshot();
    const elementsRecord = publicSnapshot.elements as Record<dia.Cell.ID, GraphElement>;
    const updatedElements: Record<dia.Cell.ID, GraphElement> = { ...elementsRecord };
    let hasAnySizeChange = false;

    for (const [cellId, { width, height }] of pendingImmediateMeasurements) {
      const observedElement = observedElementsByCellId.get(cellId) ?? DEFAULT_OBSERVED_ELEMENT;

      const measuredWidth = roundToTwoDecimals(width);
      const measuredHeight = roundToTwoDecimals(height);

      const wasUpdated = processSizeChange({
        cellId,
        measuredWidth,
        measuredHeight,
        observedElement,
        getCellTransform,
        updatedElements,
      });

      if (wasUpdated) {
        hasAnySizeChange = true;
      }
    }

    pendingImmediateMeasurements.clear();
    isImmediateBatchScheduled = false;

    if (hasAnySizeChange) {
      onBatchUpdate(updatedElements);
    }
  }

  /**
   * Schedules an immediate measurement to be processed in the current microtask batch.
   */
  function scheduleImmediateMeasurement(cellId: dia.Cell.ID, width: number, height: number) {
    pendingImmediateMeasurements.set(cellId, { width, height });

    if (!isImmediateBatchScheduled) {
      isImmediateBatchScheduled = true;
      // Use queueMicrotask for synchronous-like batching within the same execution context
      queueMicrotask(flushImmediateMeasurements);
    }
  }

  const observer = new ResizeObserver((entries) => {
    // Process all entries as a single batch
    let hasAnySizeChange = false;
    const publicSnapshot = getPublicSnapshot();
    // Convert Record to array for batch update (preserving compatibility)
    const elementsRecord = publicSnapshot.elements as Record<dia.Cell.ID, GraphElement>;
    const updatedElements: Record<dia.Cell.ID, GraphElement> = { ...elementsRecord };

    for (const entry of entries) {
      // We must be careful to not mutate the snapshot data.
      const { target, borderBoxSize } = entry;

      const cellId = cellIdByDomElement.get(target as HTMLElement | SVGElement);
      if (!cellId) {
        throw new Error('DOM element not found in resize observer');
      }

      // If borderBoxSize is not available or empty, continue to the next entry.
      if (!borderBoxSize || borderBoxSize.length === 0) {
        continue;
      }

      const [size] = borderBoxSize;
      const { inlineSize, blockSize } = size;

      const measuredWidth = roundToTwoDecimals(inlineSize);
      const measuredHeight = roundToTwoDecimals(blockSize);
      const observedElement = observedElementsByCellId.get(cellId) ?? DEFAULT_OBSERVED_ELEMENT;

      const wasUpdated = processSizeChange({
        cellId,
        measuredWidth,
        measuredHeight,
        observedElement,
        getCellTransform,
        updatedElements,
      });

      if (wasUpdated) {
        hasAnySizeChange = true;
      }
    }

    if (!hasAnySizeChange) {
      return;
    }

    // Pass updated elements as Record
    onBatchUpdate(updatedElements);
  });

  return {
    add({ id, element, transform }: SetMeasuredNodeOptions) {
      // Register with ResizeObserver for future changes
      observer.observe(element, resizeObserverOptions);
      observedElementsByCellId.set(id, { element, transform });
      cellIdByDomElement.set(element, id);

      // Perform immediate synchronous measurement to prevent flickering
      // This eliminates the 2ms delay from ResizeObserver callback
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        scheduleImmediateMeasurement(id, rect.width, rect.height);
      }

      return () => {
        observer.unobserve(element);
        observedElementsByCellId.delete(id);
        cellIdByDomElement.delete(element);
        pendingImmediateMeasurements.delete(id);
      };
    },
    clean() {
      for (const [, { element }] of observedElementsByCellId.entries()) {
        observer.unobserve(element);
      }
      observedElementsByCellId.clear();
      cellIdByDomElement.clear();
      pendingImmediateMeasurements.clear();
      isImmediateBatchScheduled = false;
      observer.disconnect();
    },
    has(id: dia.Cell.ID) {
      return observedElementsByCellId.has(id);
    },
  };
}
