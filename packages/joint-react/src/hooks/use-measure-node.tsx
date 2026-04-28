import { useContext, useLayoutEffect, type RefObject } from 'react';
import { CellIdContext } from '../context';
import { useGraphStore } from './use-graph-store';
import type { OnTransformElement } from '../store/create-elements-size-observer';
import { usePaper } from './use-paper';
import type { ElementSize } from '../types/cell-data';
import { useCell } from './use-cell';
import type { ResolvedElementRecord } from '../types/cell.types';

/**
 * Controls element visibility until the first measurement completes.
 * - `'show-all'` — hides nothing; the element is visible immediately
 * - `'hide-node'` — hides the observed DOM element (default)
 * - `'hide-all'` — hides the entire element view (`cellView.el`)
 */
export type VisibilityStrategy = 'show-all' | 'hide-node' | 'hide-all';

/**
 * Options for configuring how the node size is measured and applied.
 */
export interface MeasureNodeOptions {
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
   * useMeasureNode(nodeRef, { transform });
   * ```
   */
  readonly transform?: OnTransformElement;

  /**
   * Controls element visibility until the first measurement completes.
   * - `'show-all'` — hides nothing; the element is visible immediately
   * - `'hide-node'` — hides the observed DOM element
   * - `'hide-all'` — hides the entire element view (`cellView.el`)
   * @default 'hide-all'
   */
  readonly visibility?: VisibilityStrategy;
}

const EMPTY_OBJECT: MeasureNodeOptions = {};

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
 * - When multiple `useMeasureNode` hooks target the same element, the most recently mounted hook
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
 * import { useMeasureNode } from '@joint/react';
 * import { useRef } from 'react';
 *
 * function RenderElement() {
 *   const rectRef = useRef<SVGRectElement>(null);
 *   const { width, height } = useMeasureNode(rectRef);
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
 *   const { width, height } = useMeasureNode(frameRef);
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
 * import { useMeasureNode, type OnTransformElement } from '@joint/react';
 * import { useRef, useCallback } from 'react';
 *
 * function ListElement() {
 *   const nodeRef = useRef<HTMLDivElement>(null);
 *   const padding = 10;
 *   const headerHeight = 50;
 *
 *   const transform: OnTransformElement = useCallback(
 *     ({ width: measuredWidth, height: measuredHeight }) => {
 *       return {
 *         width: padding + measuredWidth + padding,
 *         height: headerHeight + measuredHeight + padding,
 *       };
 *     },
 *     []
 *   );
 *
 *   const { width, height } = useMeasureNode(nodeRef, { transform });
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
export function useMeasureNode(
  nodeRef: RefObject<HTMLElement | SVGElement | null>,
  options?: MeasureNodeOptions
): Required<ElementSize> {
  const { transform, visibility } = options ?? EMPTY_OBJECT;
  const { graph, setMeasuredNode } = useGraphStore();
  const { paper } = usePaper();
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useMeasureNode() must be used inside renderElement');
  }
  const layout = useCell((element: ResolvedElementRecord) => element.size);
  if (layout === undefined) {
    throw new Error(`useMeasureNode(): no element with id "${String(id)}"`);
  }

  useLayoutEffect(() => {
    const element = nodeRef.current;
    if (!element) return;

    const cell = graph.getCell(id);
    if (!cell?.isElement()) {
      throw new Error(
        '`useMeasureNode` can only be used with elements, not links. ' +
          `The cell with id "${id}" is not an element.`
      );
    }
    if (!nodeRef.current) {
      return;
    }

    // DOM node to hide (visibility: hidden) until the first measurement completes.
    let visibilityNode: HTMLElement | SVGElement | undefined;
    if (visibility === 'hide-node') {
      visibilityNode = nodeRef.current;
    } else if (visibility !== 'show-all') {
      // 'hide-all' (default)
      visibilityNode = paper.findViewByModel(id)?.el;
    }

    const clean = setMeasuredNode({ id, node: nodeRef.current, transform, visibilityNode });
    return () => {
      clean();
    };
    // transform and visibility are not dependencies because they don't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeRef, graph, id, paper, setMeasuredNode]);

  return layout;
}
