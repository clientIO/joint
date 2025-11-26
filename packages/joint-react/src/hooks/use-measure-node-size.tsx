import { useEffect, useRef, type RefObject } from 'react';
import { useCellId } from './use-cell-id';
import {
  createElementSizeObserver,
  type SizeObserver,
} from '../utils/create-element-size-observer';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';

export interface OnSetOptions {
  readonly element: dia.Element;
  readonly size: SizeObserver;
}
export type OnSetSize = (options: OnSetOptions) => void;
export interface MeasureNodeOptions {
  /**
   * Overwrite default node set function with custom handling.
   * Useful for adding another padding, or just check element size.
   * @default it sets element via cell.set('size', {width, height})
   */
  readonly setSize?: OnSetSize;
}

const EMPTY_OBJECT: MeasureNodeOptions = {};
// Epsilon value to avoid jitter due to sub-pixel rendering
const EPSILON = 0.5;

/**
 * Custom hook to measure the size of a node and update its size in the graph.
 * It uses the `createElementSizeObserver` utility to observe size changes.
 *
 * **Important:** Only one `MeasuredNode` (or `useMeasureNodeSize` hook) can be used per element.
 * Using multiple `MeasuredNode` components for the same element will throw an error in development
 * and cause unexpected behavior. If you need multiple measurements, use a single `MeasuredNode`
 * with a custom `setSize` handler.
 * @param elementRef - A reference to the HTML or SVG element to measure.
 * @param options - Options for measuring the node size.
 * @throws {Error} If multiple `MeasuredNode` components are used for the same element.
 * @group Hooks
 * @example
 * ```tsx
 * import { useMeasureNodeSize } from '@joint/react';
 * import { useRef } from 'react';
 *
 * function RenderElement() {
 *   const elementRef = useRef<HTMLDivElement>(null);
 *   useMeasureNodeSize(elementRef);
 *   return <div ref={elementRef}>Content</div>;
 * }
 * ```
 * @example
 * With custom size handler:
 * ```tsx
 * import { useMeasureNodeSize } from '@joint/react';
 * import { useRef } from 'react';
 * import type { dia } from '@joint/core';
 *
 * function RenderElement() {
 *   const elementRef = useRef<HTMLDivElement>(null);
 *   useMeasureNodeSize(elementRef, {
 *     setSize: ({ element, size }) => {
 *       // Custom size handling
 *       element.set('size', { width: size.width + 10, height: size.height + 10 });
 *     },
 *   });
 *   return <div ref={elementRef}>Content</div>;
 * }
 * ```
 */
export function useMeasureNodeSize<AnyHTMLOrSVGElement extends HTMLElement | SVGElement>(
  elementRef: RefObject<AnyHTMLOrSVGElement | null>,
  options?: MeasureNodeOptions
) {
  const { setSize } = options ?? EMPTY_OBJECT;
  const { graph, setMeasuredNode, hasMeasuredNode } = useGraphStore();
  const id = useCellId();

  const onSetSizeRef = useRef(setSize);

  useEffect(() => {
    onSetSizeRef.current = setSize;
  }, [setSize]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) throw new Error('MeasuredNode must have a child element');

    const cell = graph.getCell(id);
    if (!cell?.isElement()) throw new Error('Cell not valid');

    // Check if another MeasuredNode is already measuring this element
    if (hasMeasuredNode(id)) {
      const errorMessage =
        process.env.NODE_ENV === 'production'
          ? `Multiple MeasuredNode components detected for element "${id}". Only one MeasuredNode can be used per element.`
          : `Multiple MeasuredNode components detected for element with id "${id}".\n\n` +
            `Only one MeasuredNode can be used per element. Multiple MeasuredNode components ` +
            `trying to set the size for the same element will cause conflicts and unexpected behavior.\n\n` +
            `Solution:\n` +
            `- Use only one MeasuredNode per element\n` +
            `- If you need multiple measurements, use a single MeasuredNode with a custom \`setSize\` handler\n` +
            `- Check your renderElement function to ensure you're not rendering multiple MeasuredNode components for the same element`;

      throw new Error(errorMessage);
    }

    const previous = { width: 0, height: 0 };

    const clean = setMeasuredNode(id);

    const stop = createElementSizeObserver(element, ({ width, height }) => {
      // normalize to avoid float jitter in Safari
      const nextWidth = Math.round(width);
      const nextHeight = Math.round(height);

      if (
        Math.abs(previous.width - nextWidth) < EPSILON &&
        Math.abs(previous.height - nextHeight) < EPSILON
      ) {
        return;
      }

      // Only update when dimensions actually change meaningfully
      if (previous.width === nextWidth && previous.height === nextHeight) {
        return;
      }

      previous.width = nextWidth;
      previous.height = nextHeight;

      if (onSetSizeRef.current) {
        onSetSizeRef.current({
          element: cell,
          size: { width: nextWidth, height: nextHeight },
        });
      } else {
        cell.set('size', { width: nextWidth, height: nextHeight }, { async: false });
      }
    });

    // Cleanup on unmount or when dependencies change.

    return () => {
      clean();
      stop();
    };
  }, [id, elementRef, graph, hasMeasuredNode, setMeasuredNode]);

  // This hook itself does not return anything.
}
