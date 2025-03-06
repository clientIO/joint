import { useLayoutEffect, type RefObject } from 'react';
import { useGraph } from './use-graph';
import { useCellId } from './use-cell-id';
import {
  createElementSizeObserver,
  type SizeObserver,
} from '../utils/create-element-size-observer';
import type { dia } from '@joint/core';

export interface MeasureNodeOptions {
  /**
   * The padding to add to the width of the element.
   * @default 0
   */
  readonly widthPadding?: number;
  /**
   * The padding to add to the height of the element.
   * @default 0
   */
  readonly heightPadding?: number;

  /**
   * Overwrite default node set function with custom handling.
   * Useful for adding another padding, or just check element size.
   * @default it set element via `cell.set('size', {width, height})`
   */
  readonly onSetSize?: (element: dia.Cell, size: SizeObserver) => void;
}
const DEFAULT_OPTIONS: MeasureNodeOptions = {
  widthPadding: 0,
  heightPadding: 0,
};

/**
 * Function to measure (update) node (element) `width` and `height` based on the provided element ref.
 * Returns new created function to set the ref.
 * It must be used inside the paper `renderElement` function.
 *
 * Ref must be just a reference to the HTML or SVG element.
 * @see Paper
 * @see `useGraph`
 * @see `useCellId`
 *
 * @group Hooks
 */
export function useMeasureNodeSize<AnyHtmlOrSvgElement extends HTMLElement | SVGElement>(
  elementRef: RefObject<AnyHtmlOrSvgElement | null>,
  options: MeasureNodeOptions = DEFAULT_OPTIONS
) {
  const { widthPadding = 0, heightPadding = 0, onSetSize } = options;
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
      if (onSetSize) {
        return onSetSize(cell, newSize);
      }
      cell.set('size', newSize);
    });
  }, [cellID, elementRef, graph, heightPadding, onSetSize, widthPadding]);
}
