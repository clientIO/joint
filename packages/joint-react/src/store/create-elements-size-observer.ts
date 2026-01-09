import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphStoreDerivedSnapshot, GraphStoreSnapshot } from './graph-store';
import type { MarkDeepReadOnly } from '../utils/create-state';

const DEFAULT_OBSERVER_OPTIONS: ResizeObserverOptions = { box: 'border-box' };
// Epsilon value to avoid jitter due to sub-pixel rendering
// especially on Safari
const EPSILON = 0.5;

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
 * @param options - The options for creating the size observer
 * @returns A GraphStoreObserver instance with methods to add/remove observers
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
  const observer = new ResizeObserver((entries) => {
    // we can consider this as single batch of
    let hasChange = false;
    const idsSnapshot = getIdsSnapshot();
    const publicSnapshot = getPublicSnapshot();
    const newElements: GraphElement[] = [...publicSnapshot.elements] as GraphElement[];
    for (const entry of entries) {
      // We must be careful to not mutate the snapshot data.
      const { target, borderBoxSize } = entry;

      const id = invertedIndex.get(target as HTMLElement | SVGElement);
      if (!id) {
        throw new Error(`Element with id ${id} not found in resize observer`);
      }

      // If borderBoxSize is not available or empty, continue to the next entry.
      if (!borderBoxSize || borderBoxSize.length === 0) continue;

      const [size] = borderBoxSize;
      const { inlineSize, blockSize } = size;

      const width = inlineSize;
      const height = blockSize;
      const cellTransform = getCellTransform(id);
      // Here we compare the actual size with the border box size
      const isChanged =
        Math.abs(cellTransform.width - width) > EPSILON ||
        Math.abs(cellTransform.height - height) > EPSILON;

      if (!isChanged) {
        return;
      }
      // we observe just width and height, not x and y
      if (cellTransform.width === width && cellTransform.height === height) {
        return;
      }

      const elementIndex = idsSnapshot.elementIds[id];
      if (elementIndex == undefined) {
        throw new Error(`Element with id ${id} not found in graph data ref`);
      }
      const element = newElements[elementIndex];
      const { transform = defaultTransform } = elements.get(id) ?? DEFAULT_OBJECT;
      if (!element) {
        throw new Error(`Element with id ${id} not found in graph data ref`);
      }
      const { x, y, element: cell } = cellTransform;
      newElements[elementIndex] = {
        ...element,
        ...transform({
          x,
          y,
          element: cell,
          width,
          height,
        }),
      };
      hasChange = true;
    }

    if (!hasChange) {
      return;
    }

    onBatchUpdate(newElements);
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
      };
    },
    clean() {
      for (const [, { element }] of elements.entries()) {
        observer.unobserve(element);
      }
      elements.clear();
      invertedIndex.clear();
      observer.disconnect();
    },
    has(id: dia.Cell.ID) {
      return elements.has(id);
    },
  };
}
