import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphStoreDerivedSnapshot, GraphStoreSnapshot } from './graph-store';
import type { MarkDeepReadOnly } from '../utils/create-state';

const DEFAULT_OBSERVER_OPTIONS: ResizeObserverOptions = { box: 'border-box' };

// Epsilon value to avoid jitter due to sub-pixel rendering (especially Safari)
const EPSILON = 0.9;

/**
 * Size information for an observed element.
 */
export interface TransformResult {
  /** Width of the element in pixels */
  readonly width: number;
  /** Height of the element in pixels */
  readonly height: number;
  readonly x?: number;
  readonly y?: number;
}

/**
 * Options passed to the setSize callback when an element's size changes.
 */
export interface TransformOptions extends TransformResult {
  /** The JointJS element instance */
  readonly element: dia.Element;
}

/**
 * Callback function called when an element's size is measured.
 * Allows custom handling of size updates before they're applied to the graph.
 */
export type OnTransformElement = (options: TransformOptions) => TransformResult;

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

interface ElementItem {
  readonly element: HTMLElement | SVGElement;
  readonly transform?: OnTransformElement;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function defaultTransform(options: TransformOptions) {
  const { width, height, x, y } = options;
  return { width, height, x, y };
}

const DEFAULT_OBJECT: Partial<ElementItem> = {
  transform: defaultTransform,
};

/**
 * Options for creating an elements size observer.
 */
interface Options {
  /** Options to pass to the ResizeObserver constructor */
  readonly resizeObserverOptions?: ResizeObserverOptions;
  /** Function to get the current size of a cell from the graph */
  readonly getCellTransform: (id: dia.Cell.ID) => TransformResult & { element: dia.Element };
  /** Function to get the current IDs snapshot for efficient lookups */
  readonly getIdsSnapshot: () => MarkDeepReadOnly<GraphStoreDerivedSnapshot>;
  /** Function to get the current public snapshot containing all elements */
  readonly getPublicSnapshot: () => MarkDeepReadOnly<GraphStoreSnapshot>;
  /** Callback function called when a batch of elements needs to be updated */
  readonly onBatchUpdate: (elements: GraphElement[]) => void;
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

function readEntrySize(entry: ResizeObserverEntry): { width: number; height: number } | null {
  // Prefer devicePixelContentBoxSize when available; it tends to be more stable.
  const dpr = window.devicePixelRatio || 1;

  const devicePixel = (
    entry as unknown as {
      devicePixelContentBoxSize?: Array<{ inlineSize: number; blockSize: number }>;
    }
  ).devicePixelContentBoxSize?.[0];

  if (devicePixel) {
    return { width: devicePixel.inlineSize / dpr, height: devicePixel.blockSize / dpr };
  }

  const border = (
    entry as unknown as { borderBoxSize?: Array<{ inlineSize: number; blockSize: number }> }
  ).borderBoxSize?.[0];

  if (border) {
    return { width: border.inlineSize, height: border.blockSize };
  }

  const content = (
    entry as unknown as { contentBoxSize?: Array<{ inlineSize: number; blockSize: number }> }
  ).contentBoxSize?.[0];

  if (content) {
    return { width: content.inlineSize, height: content.blockSize };
  }

  // Legacy fallback
  if (entry.contentRect) {
    return { width: entry.contentRect.width, height: entry.contentRect.height };
  }

  return null;
}

function snapToDevicePixel(px: number): number {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(px * dpr) / dpr;
}

/**
 * Creates an observer for element size changes using the ResizeObserver API.
 *
 * Safari can throw/print "ResizeObserver loop completed with undelivered notifications"
 * when the observer callback causes synchronous layout changes which trigger more resize
 * notifications in the same frame. To prevent this we:
 * - batch updates
 * - apply them in requestAnimationFrame
 * - guard against re-entrancy
 * - snap sizes to device pixels to reduce sub-pixel jitter
 * @param options - Options for the observer
 * @returns GraphStoreObserver instance
 * @example
 * ```ts
 * const observer = createElementsSizeObserver({
 *   getCellTransform: (id) => {
 *     return { width: 100, height: 100 };
 *   },
 * });
 * ```
 */
export function createElementsSizeObserver(options: Options): GraphStoreObserver {
  const {
    resizeObserverOptions = DEFAULT_OBSERVER_OPTIONS,
    getCellTransform,
    getIdsSnapshot,
    onBatchUpdate,
    getPublicSnapshot,
  } = options;

  const elements = new Map<dia.Cell.ID, ElementItem>();
  const invertedIndex = new Map<HTMLElement | SVGElement, dia.Cell.ID>();

  // Pending measured sizes to apply (batched).
  const pending = new Map<dia.Cell.ID, { width: number; height: number }>();

  // Remembers last size we applied, so we can ignore immediate echoes.
  const lastApplied = new Map<dia.Cell.ID, { width: number; height: number }>();

  let rafScheduled = false;
  let suppress = false;

  const flush = () => {
    rafScheduled = false;
    if (pending.size === 0) return;

    const idsSnapshot = getIdsSnapshot();
    const publicSnapshot = getPublicSnapshot();
    const newElements: GraphElement[] = [...publicSnapshot.elements] as GraphElement[];

    let hasChange = false;

    for (const [id, measured] of pending) {
      pending.delete(id);

      const elementIndex = idsSnapshot.elementIds[id];
      if (elementIndex == null) {
        continue;
      }

      const cellTransform = getCellTransform(id);

      const isChanged =
        Math.abs(cellTransform.width - measured.width) > EPSILON ||
        Math.abs(cellTransform.height - measured.height) > EPSILON;

      if (!isChanged) continue;

      const element = newElements[elementIndex];
      if (!element) continue;

      const { transform = defaultTransform } = elements.get(id) ?? DEFAULT_OBJECT;
      const { x, y, element: cell } = cellTransform;

      newElements[elementIndex] = {
        ...element,
        ...transform({
          x,
          y,
          element: cell,
          width: measured.width,
          height: measured.height,
        }),
      };

      lastApplied.set(id, measured);
      hasChange = true;
    }

    if (!hasChange) return;

    suppress = true;
    try {
      onBatchUpdate(newElements);
    } finally {
      suppress = false;
    }
  };

  const scheduleFlush = () => {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(flush);
  };

  const observer = new ResizeObserver((entries) => {
    if (suppress) return;

    for (const entry of entries) {
      const target = entry.target as HTMLElement | SVGElement;
      const id = invertedIndex.get(target);
      if (!id) continue;

      const size = readEntrySize(entry);
      if (!size) continue;

      const width = snapToDevicePixel(size.width);
      const height = snapToDevicePixel(size.height);

      // Ignore the "echo" right after we applied the same size.
      const previous = lastApplied.get(id);
      if (
        previous &&
        Math.abs(previous.width - width) <= EPSILON &&
        Math.abs(previous.height - height) <= EPSILON
      ) {
        continue;
      }

      pending.set(id, { width, height });
    }

    if (pending.size > 0) scheduleFlush();
  });

  return {
    add({ id, element, transform }: SetMeasuredNodeOptions) {
      observer.observe(element, resizeObserverOptions);
      elements.set(id, { element, transform });
      invertedIndex.set(element, id);

      return () => {
        observer.unobserve(element);
        elements.delete(id);
        invertedIndex.delete(element);
        pending.delete(id);
        lastApplied.delete(id);
      };
    },

    clean() {
      for (const [, { element }] of elements.entries()) {
        observer.unobserve(element);
      }
      elements.clear();
      invertedIndex.clear();
      pending.clear();
      lastApplied.clear();
      observer.disconnect();
    },

    has(id: dia.Cell.ID) {
      return elements.has(id);
    },
  };
}
