import { useLayoutEffect, useRef, useCallback, type Ref } from 'react';
import { useGraph } from './use-graph';
import { useCellId } from './use-cell-id';
import { createElementSizeObserver } from '../utils/create-element-size-observer';
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
  ref?: Ref<AnyHtmlOrSvgElement | null>
) {
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

    return createElementSizeObserver(elementRef.current, (position) => {
      cell.set('size', position);
    });
  }, [id, graph]);

  return setRefs;
}
