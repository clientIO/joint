import { useLayoutEffect, type RefObject } from 'react';
import { useCellId } from './use-cell-id';
import { useGraphStore } from './use-graph-store';
import type { OnSetSize } from '../store/create-elements-size-observer';

export interface MeasureNodeOptions {
  /**
   * Overwrite default node set function with custom handling.
   * Useful for adding another padding, or just check element size.
   * @default it sets element via cell.set('size', {width, height})
   */
  readonly setSize?: OnSetSize;
}

const EMPTY_OBJECT: MeasureNodeOptions = {};

/**
 * Custom hook to measure the size of a node and update its size in the graph.
 * It uses the `createElementSizeObserver` utility to observe size changes.
 *
 * **Important:** Only one `useNodeSize` hook can be used per element.
 * Using multiple `useNodeSize` hooks for the same element will throw an error in development
 * and cause unexpected behavior. If you need multiple measurements, use a single `useNodeSize`
 * hook with a custom `setSize` handler.
 * @param elementRef - A reference to the HTML or SVG element to measure.
 * @param options - Options for measuring the node size.
 * @throws {Error} If multiple `useNodeSize` hooks are used for the same element.
 * @group Hooks
 * @example
 * ```tsx
 * import { useNodeSize } from '@joint/react';
 * import { useRef } from 'react';
 *
 * function RenderElement() {
 *   const elementRef = useRef<HTMLDivElement>(null);
 *   useNodeSize(elementRef);
 *   return <div ref={elementRef}>Content</div>;
 * }
 * ```
 * @example
 * With custom size handler:
 * ```tsx
 * import { useNodeSize } from '@joint/react';
 * import { useRef } from 'react';
 * import type { dia } from '@joint/core';
 *
 * function RenderElement() {
 *   const elementRef = useRef<HTMLDivElement>(null);
 *   useNodeSize(elementRef, {
 *     setSize: ({ element, size }) => {
 *       // Custom size handling
 *       element.set('size', { width: size.width + 10, height: size.height + 10 });
 *     },
 *   });
 *   return <div ref={elementRef}>Content</div>;
 * }
 * ```
 */
export function useNodeSize(
  elementRef: RefObject<HTMLElement | SVGElement | null>,
  options?: MeasureNodeOptions
) {
  const { setSize } = options ?? EMPTY_OBJECT;
  const { graph, setMeasuredNode, hasMeasuredNode } = useGraphStore();
  const id = useCellId();

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) throw new Error('useNodeSize: elementRef.current must not be null');

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
            `- If you need multiple measurements, use a single useNodeSize hook with a custom \`setSize\` handler\n` +
            `- Check your renderElement function to ensure you're not using multiple useNodeSize hooks for the same element`;

      throw new Error(errorMessage);
    }
    if (!elementRef.current) {
      return;
    }
    const clean = setMeasuredNode({ id, element: elementRef.current, setSize });
    return clean;
  }, [elementRef, graph, hasMeasuredNode, id, setMeasuredNode, setSize]);

  // This hook itself does not return anything.
}
