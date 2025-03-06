import { memo, useLayoutEffect } from 'react';
import { useChildrenRef } from '../../hooks/use-children-ref';
import {
  createElementSizeObserver,
  type SizeObserver,
} from '../../utils/create-element-size-observer';
import { useGraph } from 'src/hooks/use-graph';
import { useCellId } from 'src/hooks/use-cell-id';
import type { dia } from '@joint/core';

export interface MeasuredNodeProps {
  /**
   * The child element to measure.
   * It can be only HTML or SVG element.
   */
  readonly children: React.ReactNode | null;
  /**
   * Overwrite default node set function with custom handling.
   * Useful for adding another padding, or just check element size.
   * @default it set element via `cell.set('size', {width, height})`
   */
  readonly onSetSize?: (element: dia.Cell, size: SizeObserver) => void;
  /**
   * The padding to add to the width of the element.
   * @default 0
   */
  readonly widthPadding: number;
  /**
   * The padding to add to the height of the element.
   * @default 0
   */
  readonly heightPadding: number;
}

function Component(props: MeasuredNodeProps) {
  const { children, onSetSize: onSizeChange, widthPadding = 0, heightPadding = 0 } = props;
  const { elementRef, elementChildren } = useChildrenRef(children);

  const graph = useGraph();
  const cellID = useCellId();

  useLayoutEffect(() => {
    if (!elementRef.current) {
      throw new Error('MeasuredNode must have a child element');
    }

    // verify element is instance of HTML element
    const isHTMLElement = elementRef.current instanceof HTMLElement;
    const isSVGElement = elementRef.current instanceof SVGElement;
    if (!isHTMLElement && !isSVGElement) {
      throw new Error('Element must be an instance of HTML or SVG element');
    }

    const cell = graph.getCell(cellID);
    if (!cell) {
      throw new Error(`Cell with id ${cellID} not found`);
    }

    return createElementSizeObserver(elementRef.current, ({ height, width }) => {
      const newSize: SizeObserver = {
        height: height + heightPadding,
        width: width + widthPadding,
      };
      if (onSizeChange) {
        return onSizeChange(cell, newSize);
      }
      cell.set('size', newSize);
    });
  }, [cellID, elementRef, graph, heightPadding, onSizeChange, widthPadding]);

  return elementChildren;
}

/**
 * Measured node component automatically detects the size of its `children` and updates the graph element (node) width and height automatically when elements resize.
 *
 * It must be used inside `renderElement` context
 *
 * @see Paper
 * @see PaperProps
 * @group Components
 * @example
 * Example with a simple div:
 * ```tsx
 * import { MeasuredNode } from '@joint/react';
 *
 * function RenderElement() {
 *   return (
 *     <MeasuredNode>
 *       <div style={{ width: 100, height: 50 }}>Content</div>
 *     </MeasuredNode>
 *   );
 * }
 * ```
 *
 * Example with a simple div without explicit size defined:
 * ```tsx
 * import { MeasuredNode } from '@joint/react';
 *
 * function RenderElement() {
 *   return (
 *     <MeasuredNode>
 *       <div style={{ padding: 10 }}>Content</div>
 *     </MeasuredNode>
 *   );
 * }
 * ```
 *
 * @example
 * Example with custom size handling:
 * ```tsx
 * import { MeasuredNode } from '@joint/react';
 * import type { dia } from '@joint/core';
 *
 * function RenderElement() {
 *   const handleSizeChange = (element: dia.Cell, size: { width: number; height: number }) => {
 *     console.log('New size:', size);
 *     element.set('size', { width: size.width + 10, height: size.height + 10 });
 *   };
 *
 *   return (
 *     <MeasuredNode onSetSize={handleSizeChange}>
 *       <div style={{ width: 100, height: 50 }}>Content</div>
 *     </MeasuredNode>
 *   );
 * }
 * ```
 */
export const MeasuredNode = memo(Component);
