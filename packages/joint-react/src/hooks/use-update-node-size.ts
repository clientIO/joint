import { useLayoutEffect, useRef, useCallback, type Ref } from 'react';
import { useGraph } from './use-graph';
import { useCellId } from './use-cell-id';
import {
  createElementSizeObserver,
  type PositionObserver,
} from '../utils/create-element-size-observer';

export interface SizeObserverOptions {
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

  readonly onChange?: (position: PositionObserver) => void;
}
const DEFAULT_OPTIONS: SizeObserverOptions = {
  widthPadding: 0,
  heightPadding: 0,
};

/**
 * Function to update node (element) `width` and `height` based on the provided element ref.
 * Returns new created function to set the ref.
 * It must be used inside the paper `renderElement` function.
 * @see Paper
 * @see `useGraph`
 * @see `useCellId`
 * @param {React.RefObject<HTMLElement | SVGRectElement | null | undefined>} ref The reference to the HTML or SVG element.
 *
 * @group Hooks
 */
export function useUpdateNodeSize<AnyHtmlOrSvgElement extends HTMLElement | SVGRectElement>(
  ref?: Ref<AnyHtmlOrSvgElement | null>,
  options: SizeObserverOptions = DEFAULT_OPTIONS
) {
  const { widthPadding, heightPadding, onChange } = options;
  const graph = useGraph();
  const id = useCellId();
  const elementRef = useRef<AnyHtmlOrSvgElement | null>(null);

  // Update the forwarded ref and the internal ref
  const setRefs = useCallback(
    (node: AnyHtmlOrSvgElement | null) => {
      elementRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  useLayoutEffect(() => {
    if (elementRef.current === null) {
      return;
    }

    const cell = graph.getCell(id);
    if (!cell) {
      return;
    }

    return createElementSizeObserver(elementRef.current, ({ height, width }) => {
      const newWidth = width + widthPadding;
      const newHeight = height + heightPadding;
      cell.set('size', { width: newWidth, height: newHeight });
      onChange?.({ width: newWidth, height: newHeight });
    });
  }, [id, graph, widthPadding, heightPadding, onChange]);

  return setRefs;
}
