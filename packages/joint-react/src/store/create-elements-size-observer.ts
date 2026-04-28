/**
 * Element size observer with stack-based multi-hook support.
 *
 * Tracks DOM element sizes via ResizeObserver and syncs them to the graph.
 * Multiple `useMeasureNode` hooks can target the same cell ID — only the
 * most recently added (active) node is observed. When it unmounts, the
 * previous node in the stack becomes active again.
 *
 * Internal data structures:
 * - `observedStacksByCellId`  — `Map<CellId, ObservedElement[]>` (last = active)
 * - `activeObservedElementByDomNode` — `WeakMap` for O(1) lookup in the ResizeObserver callback
 */
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell.types';
import type { ElementLayout } from '../types/cell-data';
import type { ElementRecord } from '../types/cell.types';

const DEFAULT_OBSERVER_OPTIONS: ResizeObserverOptions = { box: 'border-box' };
// Epsilon value to avoid jitter due to sub-pixel rendering
// especially on Safari
const EPSILON = 0.5;

export type ElementLayoutOptionalXY = Pick<ElementLayout, 'width' | 'height'> &
  Partial<Pick<ElementLayout, 'x' | 'y'>>;

/**
 * Options passed to the setSize callback when an element's size changes.
 */
export interface TransformOptions extends Required<ElementLayout> {
  /** The JointJS element instance */
  readonly element: dia.Element;
  readonly id: CellId;
}

/**
 * Callback function called when an element's size is measured.
 * Allows custom handling of size updates before they're applied to the graph.
 */
export type OnTransformElement = (options: TransformOptions) => ElementLayoutOptionalXY;

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
  ) => ElementLayoutOptionalXY & { element: dia.Element; angle: number };
  /** Function to get the elements from the container */
  readonly getElements: () => Map<CellId, ElementRecord>;
  /** Callback function called when a batch of elements needs to be updated */
  readonly onBatchUpdate: (data: Record<CellId, ElementLayoutOptionalXY>) => void;
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
  readonly elements: Map<CellId, ElementRecord>;
  readonly mutableLayouts: Record<CellId, ElementLayoutOptionalXY>;
}

/**
 * Processes a size change for a single element.
 * Returns true if the element was updated, false otherwise.
 * @param options - The options containing size data and element references
 * @returns True if the element was updated, false otherwise
 */
function processSizeChange(options: ProcessSizeChangeOptions): boolean {
  const {
    measuredWidth,
    measuredHeight,
    observedElement,
    getCellTransform,
    elements,
    mutableLayouts,
  } = options;
  const currentCellTransform = getCellTransform(observedElement.id);

  if (!elements.has(observedElement.id)) {
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

  mutableLayouts[observedElement.id] = transform({
    x: x ?? 0,
    y: y ?? 0,
    angle: angle ?? 0,
    element: cell,
    width: measuredWidth,
    height: measuredHeight,
    id: observedElement.id,
  });

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
    getElements,
  } = options;

  // Stack per cell ID: last entry is the active (observed) node.
  // When the active node unmounts, the previous one becomes active again.
  const observedStacksByCellId = new Map<CellId, ObservedElement[]>();

  // Maps only the active DOM node to its ObservedElement for O(1) lookup in the ResizeObserver callback.
  const activeObservedElementByDomNode = new WeakMap<HTMLElement | SVGElement, ObservedElement>();

  // eslint-disable-next-line jsdoc/require-param, jsdoc/require-returns
  /** Returns the active (last) element from the stack, or `undefined` if empty. */
  function getActiveElement(stack: readonly ObservedElement[]): ObservedElement | undefined {
    return stack.at(-1);
  }

  // eslint-disable-next-line jsdoc/require-param
  /** Starts observing the given element and registers it in the active DOM node lookup. */
  function activateElement(observedElement: ObservedElement) {
    observer.observe(observedElement.node, resizeObserverOptions);
    activeObservedElementByDomNode.set(observedElement.node, observedElement);
  }

  // eslint-disable-next-line jsdoc/require-param
  /** Stops observing the given element and removes it from the active DOM node lookup. */
  function deactivateElement(observedElement: ObservedElement) {
    observer.unobserve(observedElement.node);
    activeObservedElementByDomNode.delete(observedElement.node);
  }

  const observer = new ResizeObserver((entries) => {
    let hasAnySizeChange = false;
    const elements = getElements();
    const mutableLayouts: Record<CellId, ElementLayoutOptionalXY> = {};

    for (const entry of entries) {
      const { target, borderBoxSize } = entry;

      const observedElement = activeObservedElementByDomNode.get(
        target as HTMLElement | SVGElement
      );
      if (!observedElement) continue;

      observedElement.visibilityNode?.style.removeProperty('visibility');

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
        mutableLayouts,
        elements,
      });

      if (wasUpdated) {
        hasAnySizeChange = true;
      }
    }

    if (!hasAnySizeChange) {
      return;
    }

    onBatchUpdate(mutableLayouts);
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

      let stack = observedStacksByCellId.get(id);

      if (!stack) {
        stack = [];
        observedStacksByCellId.set(id, stack);
      }

      // Deactivate the current active node before pushing the new one
      const previousActive = getActiveElement(stack);
      if (previousActive) {
        deactivateElement(previousActive);
      }

      stack.push(observedElement);
      activateElement(observedElement);

      return () => {
        const currentStack = observedStacksByCellId.get(id);
        if (!currentStack) return;

        const isActive = getActiveElement(currentStack) === observedElement;

        if (isActive) {
          deactivateElement(observedElement);
          currentStack.pop();

          // Fall back to the previous node in the stack
          const newActive = getActiveElement(currentStack);
          if (newActive) {
            activateElement(newActive);
          }
        } else {
          // Remove non-active entry from the middle of the stack
          const index = currentStack.indexOf(observedElement);
          if (index !== -1) {
            currentStack.splice(index, 1);
          }
        }

        if (currentStack.length === 0) {
          observedStacksByCellId.delete(id);
        }
      };
    },
    clean() {
      // cleanup all observed nodes and clear all stacks
      for (const [, stack] of observedStacksByCellId.entries()) {
        for (const { node } of stack) {
          observer.unobserve(node);
        }
      }
      observedStacksByCellId.clear();
      observer.disconnect();
    },
    has(id: CellId) {
      const stack = observedStacksByCellId.get(id);
      return !!stack && stack.length > 0;
    },
  };
}
