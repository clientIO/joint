import { memo, useLayoutEffect } from 'react';
import { useChildrenRef } from '../../hooks/use-children-ref';
import {
  createElementSizeObserver,
  type PositionObserver,
} from '../../utils/create-element-size-observer';
import { useGraph } from 'src/hooks/use-graph';
import { useCellId } from 'src/hooks/use-cell-id';

export interface MeasuredNodeProps {
  /**
   * The child element to measure.
   * It can be only HTML or SVG element.
   */
  readonly children: React.ReactNode | null;
  /**
   * Observer function that is called when the size of the element changes.
   */
  readonly onSizeChange?: (position: PositionObserver) => void;
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
  const { children, onSizeChange, widthPadding = 0, heightPadding = 0 } = props;
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
      const newWidth = width + widthPadding;
      const newHeight = height + heightPadding;
      cell.set('size', { width: newWidth, height: newHeight });
      onSizeChange?.({ width: newWidth, height: newHeight });
    });
  }, [cellID, elementRef, graph, heightPadding, onSizeChange, widthPadding]);

  return elementChildren;
}

/**
 *
 */
export const MeasuredNode = memo(Component);
