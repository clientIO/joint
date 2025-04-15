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
   * @default it sets element via cell.set('size', {width, height})
   */
  readonly setSize?: OnSetSize;
}

const EMPTY_OBJECT: MeasureNodeOptions = {};

/**
 * Custom hook to measure the size of a node and update its size in the graph.
 * It uses the `createElementSizeObserver` utility to observe size changes.
 * @param elementRef - A reference to the HTML or SVG element to measure.
 * @param options - Options for measuring the node size.
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
    const element = elementRef.current;
    if (!element) throw new Error('MeasuredNode must have a child element');

    const cell = graph.getCell(cellID);
    if (!cell?.isElement()) throw new Error('Cell not valid');

    const previous = { width: 0, height: 0 };

    // elementRef.current?.getBoundingClientRect

    // Create the observer that calls back on measurement changes
    const stop = createElementSizeObserver(element, ({ width, height }) => {
      // Only update when dimensions actually change
      if (previous.width === width && previous.height === height) return;
      previous.width = width;
      previous.height = height;

      // Always update the size (whether via the user-defined setSize or the default)
      if (onSetSizeRef.current) {
        onSetSizeRef.current({ element: cell, size: { width, height } });
      } else {
        cell.set('size', { width, height }, { async: false });
      }
    });

    // Cleanup on unmount or when dependencies change.
    return () => {
      stop();
    };
  }, [cellID, elementRef, graph]);

  // This hook itself does not return anything.
}
