import { forwardRef, memo } from 'react';
import { useChildrenRef } from '../../hooks/use-children-ref';
import { useMeasureNodeSize, type MeasureNodeOptions } from '../../hooks/use-measure-node-size';

export interface MeasuredNodeProps extends MeasureNodeOptions {
  /**
   * The child element to measure.
   * It can be only HTML or SVG element.
   */
  readonly children: React.ReactNode | null;
}

function Component(
  props: MeasuredNodeProps,
  forwardedRef: React.ForwardedRef<HTMLElement | SVGAElement>
) {
  const { children, ...options } = props;
  const { elementRef, elementChildren } = useChildrenRef(children, forwardedRef);
  useMeasureNodeSize(elementRef, options);
  return elementChildren;
}

const ForwardedRefComponent = forwardRef(Component);

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
 *     <MeasuredNode setSize={handleSizeChange}>
 *       <div style={{ width: 100, height: 50 }}>Content</div>
 *     </MeasuredNode>
 *   );
 * }
 * ```
 */
export const MeasuredNode = memo(ForwardedRefComponent);
