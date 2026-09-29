import { useContext, useLayoutEffect, type RefObject } from 'react';
import { CellIdContext } from '../context';
import { useGraphStore } from './use-graph-store';
import type { TransformElementLayout } from '../store/create-elements-size-observer';
import { usePaper } from './use-paper';
import type { ElementSize } from '../types/cell.types';
import { useCell } from './use-cell';
import { selectElementSize } from '../selectors';
import { MEASURING_CLASS_NAME } from '../utils/class-names';

/**
 * Options for {@link useMeasureElement}, controlling how the measured DOM size is
 * turned into the graph element's size.
 * @group Types
 * @expand
 */
export interface MeasureElementOptions {
  /**
   * Adjusts the measured size before it is written to the graph element, e.g. to
   * add padding or reserve space for a header. Receives the measured dimensions
   * plus the element's current layout ({@link TransformElementLayoutParams}) and
   * returns the `width`/`height` (and optionally `x`/`y`) to apply.
   * @default When omitted, the measured `width`/`height` are applied to the element unchanged.
   * @example
   * ```tsx
   * const transform = ({ width, height }) => ({
   *   width: width + 20, // 10px padding on each side
   *   height: height + 20,
   * });
   * useMeasureElement(nodeRef, { transform });
   * ```
   */
  readonly transform?: TransformElementLayout;
}

const EMPTY_OBJECT: MeasureElementOptions = {};

/**
 * Measures a rendered DOM node and keeps the graph element's size in sync with
 * it. Point `nodeRef` at the HTML or SVG node that defines the element's size;
 * whenever that node resizes, the matching graph element is resized to match
 * (optionally adjusted by a `transform`, see {@link MeasureElementOptions}), and
 * the element's current `width`/`height` are returned for your own layout math.
 *
 * Reach for it when an element's size is driven by its rendered content rather
 * than fixed up front, e.g. text that wraps or a list that grows.
 * @remarks
 * - Call this inside a `renderElement` callback (or a component rendered from
 *   one); it reads the current cell from context and throws otherwise.
 * - When several `useMeasureElement` calls target the same element, the most
 *   recently mounted one wins. When it unmounts, the previous one takes over
 *   again.
 * - Do not also read the size back with the {@link selectElementSize} selector
 *   (or `useCell((cell) => cell.size)`) in the same component. This hook already
 *   syncs the size and returns the live `width`/`height`; reading it again only
 *   adds a redundant subscription and an extra render.
 * @param nodeRef - Ref to the HTML or SVG node to measure. It must be mounted in
 *   the DOM while the hook runs.
 * @param options - Optional {@link MeasureElementOptions}; the main option is a
 *   `transform` that adjusts the measured size before it is applied.
 * @returns The graph element's current `width` and `height` (always defined).
 * @throws If used outside a `renderElement` context, or if the current cell is a
 *   link rather than an element.
 * @group Hooks
 * @example Basic usage
 * ```tsx
 * import { useMeasureElement } from '@joint/react';
 * import { useRef } from 'react';
 *
 * // The element grows to fit its text label.
 * function LabelElement() {
 *   const textRef = useRef<SVGTextElement>(null);
 *   const { width, height } = useMeasureElement(textRef);
 *
 *   return (
 *     <>
 *       <rect width={width} height={height} fill="#333" />
 *       <text ref={textRef} x={4} y={16} fill="#fff">Hello world</text>
 *     </>
 *   );
 * }
 * ```
 * @example Use the returned size
 * ```tsx
 * import { useMeasureElement } from '@joint/react';
 * import { useRef } from 'react';
 *
 * const iconURL = 'https://example.com/icon.svg';
 *
 * // Size follows the HTML content; use the returned size to place an icon inside.
 * function Card() {
 *   const contentRef = useRef<HTMLDivElement>(null);
 *   const { width, height } = useMeasureElement(contentRef);
 *   const iconSize = 16;
 *
 *   return (
 *     <>
 *       <rect width={width} height={height} fill="#333" />
 *       <image href={iconURL} x={width - iconSize} y={0} width={iconSize} height={iconSize} />
 *       <foreignObject width={width} height={height}>
 *         <div ref={contentRef} style={{ padding: 8, color: '#fff' }}>Card content</div>
 *       </foreignObject>
 *     </>
 *   );
 * }
 * ```
 * @example Adjust size with a transform
 * ```tsx
 * import { useMeasureElement, type TransformElementLayout } from '@joint/react';
 * import { useRef, useCallback } from 'react';
 *
 * function ListElement() {
 *   const divRef = useRef<HTMLDivElement>(null);
 *   const padding = 10;
 *   const headerHeight = 50;
 *
 *   const transform: TransformElementLayout = useCallback(
 *     ({ width: measuredWidth, height: measuredHeight }) => {
 *       return {
 *         width: padding + measuredWidth + padding,
 *         height: headerHeight + measuredHeight + padding,
 *       };
 *     },
 *     []
 *   );
 *
 *   const { width, height } = useMeasureElement(divRef, { transform });
 *
 *   return (
 *     <>
 *       <rect width={width} height={height} fill="#121826" />
 *       <foreignObject x={padding} y={headerHeight} width={width - 2 * padding} height={height - headerHeight - padding}>
 *         <div ref={divRef}>Content</div>
 *       </foreignObject>
 *     </>
 *   );
 * }
 * ```
 */
export function useMeasureElement(
  nodeRef: RefObject<HTMLElement | SVGElement | null>,
  options: MeasureElementOptions = EMPTY_OBJECT
): Required<ElementSize> {
  const { transform } = options;
  const { graph, setMeasuredNode } = useGraphStore();
  const { paper } = usePaper();
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useMeasureElement() must be used inside renderElement');
  }
  const size = useCell(selectElementSize);

  useLayoutEffect(() => {
    const element = nodeRef.current;
    if (!element) return;

    const cell = graph.getCell(id);
    if (!cell?.isElement()) {
      throw new Error(
        '`useMeasureElement` can only be used with elements, not links. ' +
          `The cell with id "${id}" is not an element.`
      );
    }
    if (!nodeRef.current) {
      return;
    }

    // Hide the element view's until the element view is updated by the paper's
    // update cycle. This prevents flashes of incorrect position when the element
    // is measured, but waits for the paper to apply the new position.
    const view = paper?.findViewByModel(id);
    if (view && paper) {
      view.el.classList.add(MEASURING_CLASS_NAME);
      // Request a view update to remove the measuring class as part of its
      // next update cycle.
      // Note: the class will be removed even if the size will not change
      // after the measurement (e.g. if the transform returns the same size
      // or if the measured size is the same as the current model size).
      paper.requestViewUpdate(view, paper.FLAG_MEASURE, view.UPDATE_PRIORITY);
    }

    const clean = setMeasuredNode({ id, node: nodeRef.current, transform });
    return () => {
      // No class cleanup here: views aren't recycled today, so the view
      // is gone with the cell.
      clean();
    };
    // transform is not a dependency because it doesn't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeRef, graph, id, paper, setMeasuredNode]);

  return size;
}
