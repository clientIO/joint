import { useLayoutEffect, type RefObject } from 'react';
import { useCellId } from './use-cell-id';
import { useGraphStore } from './use-graph-store';
import type { OnTransformElement, TransformResult } from '../store/create-elements-size-observer';
import { useElement } from './use-element';

/**
 * Options for configuring how the node size is measured and applied.
 */
export interface MeasureNodeOptions {
  /**
   * Custom transform function to modify the measured size before applying it to the graph element.
   *
   * This function receives the measured dimensions from the DOM element and the current graph element,
   * allowing you to add padding, apply scaling, or perform other transformations.
   * @param options - The measured size and the graph element instance
   * @param options.width - The measured width of the DOM element in pixels
   * @param options.height - The measured height of the DOM element in pixels
   * @param options.x - The current x position of the graph element (optional)
   * @param options.y - The current y position of the graph element (optional)
   * @param options.element - The JointJS element instance that will be updated
   * @returns The size values to apply to the graph element. Must include `width` and `height`.
   * @default By default, the measured size is applied directly via `element.set('size', {width, height})`
   * @example
   * ```tsx
   * const transform = ({ width, height }) => ({
   *   width: width + 20, // Add 10px padding on each side
   *   height: height + 20,
   * });
   * useNodeSize(elementRef, { transform });
   * ```
   */
  readonly transform?: OnTransformElement;
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
 * 1. Observes the DOM element referenced by `elementRef` for size changes
 * 2. When the DOM element's size changes, applies the size (or transformed size) to the graph element
 * 3. Returns the current graph element's dimensions, which are always defined
 *
 * **Important constraints:**
 * - Only one `useNodeSize` hook can be used per element. Using multiple hooks for the same element
 *   will throw an error and cause unexpected behavior.
 * - Must be used within a `renderElement` function or a component rendered from within it.
 * - The returned values are always defined (width and height default to 0 if not set).
 *
 * @param elementRef - A reference to the HTML or SVG element to measure. The element must be rendered
 *                     in the DOM when the hook runs.
 * @param options - Optional configuration for measuring and transforming the node size.
 * @returns An object containing the current graph element's dimensions:
 *   - `width`: The current width of the graph element in pixels (always defined, defaults to 0)
 *   - `height`: The current height of the graph element in pixels (always defined, defaults to 0)
 *   - `x`: The current x position of the graph element (optional, may be undefined)
 *   - `y`: The current y position of the graph element (optional, may be undefined)
 * @throws {Error} If multiple `useNodeSize` hooks are used for the same element.
 * @throws {Error} If the cell is not a valid element.
 * @group Hooks
 * @example
 * Basic usage with SVG element:
 * ```tsx
 * import { useNodeSize } from '@joint/react';
 * import { useRef } from 'react';
 *
 * function RenderElement() {
 *   const rectRef = useRef<SVGRectElement>(null);
 *   const { width, height } = useNodeSize(rectRef);
 *
 *   return (
 *     <rect ref={rectRef} width={80} height={120} fill="#333" />
 *   );
 * }
 * ```
 *
 * @example
 * Using returned values for calculations:
 * ```tsx
 * function Card() {
 *   const frameRef = useRef<SVGRectElement>(null);
 *   const { width, height } = useNodeSize(frameRef);
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
 *
 * @example
 * With custom transform to add padding:
 * ```tsx
 * import { useNodeSize, type OnTransformElement } from '@joint/react';
 * import { useRef, useCallback } from 'react';
 *
 * function ListElement() {
 *   const elementRef = useRef<HTMLDivElement>(null);
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
 *   const { width, height } = useNodeSize(elementRef, { transform });
 *
 *   return (
 *     <>
 *       <rect width={width} height={height} fill="#121826" />
 *       <foreignObject x={padding} y={headerHeight} width={width - 2 * padding} height={height - headerHeight - padding}>
 *         <div ref={elementRef}>Content</div>
 *       </foreignObject>
 *     </>
 *   );
 * }
 * ```
 */
export function useNodeSize(
  elementRef: RefObject<HTMLElement | SVGElement | null>,
  options?: MeasureNodeOptions
): TransformResult {
  const { transform } = options ?? EMPTY_OBJECT;
  const { graph, setMeasuredNode, hasMeasuredNode } = useGraphStore();
  const id = useCellId();

  const { x, y, width = 0, height = 0 } = useElement();

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const cell = graph.getCell(id);
    if (!cell?.isElement()) throw new Error('Cell not valid');
    // Check if another useNodeSize hook is already measuring this element
    if (hasMeasuredNode(id)) {
      const errorMessage =
        process.env.NODE_ENV === 'production'
          ? `Multiple useNodeSize hooks detected for element "${id}". Only one useNodeSize hook can be used per element.`
          : `Multiple useNodeSize hooks detected for element with id "${id}".\n\n` +
            `Only one useNodeSize hook can be used per element. Multiple useNodeSize hooks ` +
            `trying to set the size for the same element will cause conflicts and unexpected behavior.\n\n` +
            `Solution:\n` +
            `- Use only one useNodeSize hook per element\n` +
            `- If you need multiple measurements, use a single useNodeSize hook with a custom \`transform\` handler\n` +
            `- Check your renderElement function to ensure you're not using multiple useNodeSize hooks for the same element`;

      throw new Error(errorMessage);
    }
    if (!elementRef.current) {
      return;
    }
    const clean = setMeasuredNode({ id, element: elementRef.current, transform });
    return () => {
      clean();
    };
    // transform is not a dependency because it is a function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef, graph, hasMeasuredNode, id, setMeasuredNode]);

  // This hook itself does not return anything.
  return { x, y, width, height };
}
