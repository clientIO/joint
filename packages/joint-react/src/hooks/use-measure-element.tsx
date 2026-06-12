import { useContext, useLayoutEffect, type RefObject } from 'react';
import { CellIdContext } from '../context';
import { useGraphStore } from './use-graph-store';
import type { TransformElementLayout } from '../store/create-elements-size-observer';
import { usePaper } from './use-paper';
import type { ElementSize } from '../types/cell.types';
import { useCell } from './use-cell';
import { selectElementSize } from '../selectors';
import { MEASURING_CLASS_NAME } from '../utils/class-names';

/**
 * Options for configuring how the node size is measured and applied.
 */
export interface MeasureElementOptions {
  /**
   * Custom transform function to modify the measured size before applying it to the graph element.
   *
   * This function receives the measured dimensions from the DOM node and the current graph element,
   * allowing you to add padding, apply scaling, or perform other transformations.
   * @param options - The measured size and the graph element instance (width, height, x, y, element)
   * @returns The size values to apply to the graph element. Must include `width` and `height`.
   * @default By default, the measured size is applied directly via `element.set('size', {width, height})`
   * @example
   * ```tsx
   * const transform = ({ width, height }) => ({
   *   width: width + 20, // Add 10px padding on each side
   *   height: height + 20,
   * });
   * useMeasureElement(nodeRef, { transform });
   * ```
   */
  readonly transform?: TransformElementLayout;
}

const EMPTY_OBJECT: MeasureElementOptions = {};

/**
 * Custom hook to automatically measure the size of a DOM element and synchronize it with the graph element's size.
 *
 * This hook uses the ResizeObserver API to monitor size changes of the referenced DOM element
 * and automatically updates the corresponding graph element's size. The returned values represent
 * the current size of the graph element (which may differ from the measured DOM size if a custom
 * `transform` function is provided).
 *
 * **How it works:**
 * 1. Observes the DOM element referenced by `nodeRef` for size changes
 * 2. When the DOM element's size changes, applies the size (or transformed size) to the graph element
 * 3. Returns the current graph element's dimensions, which are always defined
 *
 * **Important constraints:**
 * - When multiple `useMeasureElement` hooks target the same element, the most recently mounted hook
 *   takes precedence. When it unmounts, the previous hook becomes active again (stack semantics).
 * - Must be used within a `renderElement` function or a component rendered from within it.
 * - The returned values are always defined (width and height default to 0 if not set).
 *
 * **Anti-pattern — do not combine with `useCell(selectElementSize)`:**
 * Do not pair this hook with `useCell((cell) => cell.size)` (or the equivalent
 * `selectElementSize` selector) in the same component. This hook already
 * synchronizes the measured size to the graph element and returns the live
 * `width` / `height`. Reading the value back through `useCell` adds a redundant
 * subscription and an extra render. Prefer the returned `width`/`height` from
 * this hook directly.
 * @param nodeRef - A reference to the HTML or SVG element to measure. The element must be rendered
 *                     in the DOM when the hook runs.
 * @param options - Optional configuration for measuring and transforming the node size.
 * @returns An object containing the current graph element's dimensions:
 *   - `width`: The current width of the graph element in pixels (defaults to 0)
 *   - `height`: The current height of the graph element in pixels (defaults to 0)
 *   - `x`: The current x position of the graph element (defaults to 0)
 *   - `y`: The current y position of the graph element (defaults to 0)
 *   - `angle`: The current angle of the graph element (defaults to 0)
 * @throws {Error} If the cell is not a valid element.
 *
 * **Important:** Do not combine with `useCell((cell) => cell.size)` (or
 * `selectElementSize` / similar selectors) in the same component. This hook
 * already synchronizes the measured size to the graph element. Use the
 * returned `width` / `height` from this hook directly rather than reading
 * the value back from the model — combining both creates a redundant
 * round-trip and can fight on the first measurement.
 * @group Hooks
 * @example
 * Basic usage with SVG element:
 * ```tsx
 * import { useMeasureElement } from '@joint/react';
 * import { useRef } from 'react';
 *
 * function RenderElement() {
 *   const rectRef = useRef<SVGRectElement>(null);
 *   const { width, height } = useMeasureElement(rectRef);
 *
 *   return (
 *     <rect ref={rectRef} width={80} height={120} fill="#333" />
 *   );
 * }
 * ```
 * @example
 * Using returned values for calculations:
 * ```tsx
 * function Card() {
 *   const frameRef = useRef<SVGRectElement>(null);
 *   const { width, height } = useMeasureElement(frameRef);
 *   const gap = 10;
 *   const imageWidth = Math.max(width - gap * 2, 0);
 *   const imageHeight = Math.max(height - gap * 2, 0);
 *
 *   return (
 *     <>
 *       <rect ref={frameRef} width={80} height={120} fill="#333" />
 *       <image href={iconURL} x={gap} y={gap} width={imageWidth} height={imageHeight} />
 *     </>
 *   );
 * }
 * ```
 * @example
 * With custom transform to add padding:
 * ```tsx
 * import { useMeasureElement, type TransformMeasurement } from '@joint/react';
 * import { useRef, useCallback } from 'react';
 *
 * function ListElement() {
 *   const nodeRef = useRef<HTMLDivElement>(null);
 *   const padding = 10;
 *   const headerHeight = 50;
 *
 *   const transform: TransformMeasurement = useCallback(
 *     ({ width: measuredWidth, height: measuredHeight }) => {
 *       return {
 *         width: padding + measuredWidth + padding,
 *         height: headerHeight + measuredHeight + padding,
 *       };
 *     },
 *     []
 *   );
 *
 *   const { width, height } = useMeasureElement(nodeRef, { transform });
 *
 *   return (
 *     <>
 *       <rect width={width} height={height} fill="#121826" />
 *       <foreignObject x={padding} y={headerHeight} width={width - 2 * padding} height={height - headerHeight - padding}>
 *         <div ref={nodeRef}>Content</div>
 *       </foreignObject>
 *     </>
 *   );
 * }
 * ```
 */
export function useMeasureElement(
  nodeRef: RefObject<HTMLElement | SVGElement | null>,
  options: MeasureElementOptions = EMPTY_OBJECT
): Required<ElementSize> {
  const { transform } = options;
  const { graph, setMeasuredNode } = useGraphStore();
  const { paper } = usePaper();
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useMeasureElement() must be used inside renderElement');
  }
  const size = useCell(selectElementSize);

  useLayoutEffect(() => {
    const element = nodeRef.current;
    if (!element) return;

    const cell = graph.getCell(id);
    if (!cell?.isElement()) {
      throw new Error(
        '`useMeasureElement` can only be used with elements, not links. ' +
          `The cell with id "${id}" is not an element.`
      );
    }
    if (!nodeRef.current) {
      return;
    }

    // Hide the element view's until the element view is updated by the paper's
    // update cycle. This prevents flashes of incorrect position when the element
    // is measured, but waits for the paper to apply the new position.
    const view = paper?.findViewByModel(id);
    if (view && paper) {
      view.el.classList.add(MEASURING_CLASS_NAME);
      // Request a view update to remove the measuring class as part of its
      // next update cycle.
      // Note: the class will be removed even if the size will not change
      // after the measurement (e.g. if the transform returns the same size
      // or if the measured size is the same as the current model size).
      paper.requestViewUpdate(view, paper.FLAG_MEASURE, view.UPDATE_PRIORITY);
    }

    const clean = setMeasuredNode({ id, node: nodeRef.current, transform });
    return () => {
      // No class cleanup here: views aren't recycled today, so the view
      // is gone with the cell.
      clean();
    };
    // transform is not a dependency because it doesn't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeRef, graph, id, paper, setMeasuredNode]);

  return size;
}
