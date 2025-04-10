import { useEffect, useRef, type RefObject } from 'react';
import { useGraph } from './use-graph';
import { useCellId } from './use-cell-id';
import {
  createElementSizeObserver,
  type SizeObserver,
} from '../utils/create-element-size-observer';
import type { dia } from '@joint/core';

export interface OnSetOptions {
  readonly element: dia.Element;
  readonly size: SizeObserver;
}
export type OnSetSize = (options: OnSetOptions) => void;
export interface MeasureNodeOptions {
  /**
   * Overwrite default node set function with custom handling.
   * Useful for adding another padding, or just check element size.
   * @default it set element via `cell.set('size', {width, height})`
   */
  readonly setSize?: OnSetSize;
}
const EMPTY_OBJECT: MeasureNodeOptions = {};
/**
 * Function to measure (update) node (element) `width` and `height` based on the provided element ref.
 * Returns new created function to set the ref.
 * It must be used inside the paper `renderElement` function.
 *
 * Ref must be just a reference to the HTML or SVG element.
 * @param elementRef - The ref to the element to measure.
 * @param options - The options for the hook.
 * @see Paper
 * @see `useGraph`
 * @see `useCellId`
 * @group Hooks
 */
export function useMeasureNodeSize<AnyHtmlOrSvgElement extends HTMLElement | SVGElement>(
  elementRef: RefObject<AnyHtmlOrSvgElement | null>,
  options?: MeasureNodeOptions
) {
  const { setSize } = options ?? EMPTY_OBJECT;
  const graph = useGraph();
  const cellID = useCellId();

  const onSetSizeRef = useRef(setSize);
  useEffect(() => {
    onSetSizeRef.current = setSize;
  }, [setSize]);

  useEffect(() => {
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
    if (!cell.isElement()) {
      throw new Error(`Cell is not element`);
    }

    return createElementSizeObserver(elementRef.current, ({ height, width }) => {
      if (onSetSizeRef.current) {
        return onSetSizeRef.current({
          element: cell,
          size: { height, width },
        });
      }
      cell.set('size', { height, width });
    });
  }, [cellID, elementRef, graph]);
}
