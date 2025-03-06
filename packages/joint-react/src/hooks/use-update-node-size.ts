// import { useLayoutEffect, useRef, useCallback, type Ref } from 'react';
// import { useGraph } from './use-graph';
// import { useCellId } from './use-cell-id';
// import {
//   createElementSizeObserver,
//   type SizeObserver,
// } from '../utils/create-element-size-observer';
// import type { dia } from '@joint/core';

// export interface SizeObserverOptions {
//   /**
//    * The padding to add to the width of the element.
//    * @default 0
//    */
//   readonly widthPadding: number;
//   /**
//    * The padding to add to the height of the element.
//    * @default 0
//    */
//   readonly heightPadding: number;

//   /**
//    * Overwrite default node set function with custom handling.
//    * Useful for adding another padding, or just check element size.
//    * @default it set element via `cell.set('size', {width, height})`
//    */
//   readonly onSetSize?: (element: dia.Cell, size: SizeObserver) => void;
// }
// const DEFAULT_OPTIONS: SizeObserverOptions = {
//   widthPadding: 0,
//   heightPadding: 0,
// };

// /**
//  * Function to update node (element) `width` and `height` based on the provided element ref.
//  * Returns new created function to set the ref.
//  * It must be used inside the paper `renderElement` function.
//  * @see Paper
//  * @see `useGraph`
//  * @see `useCellId`
//  * @param {React.RefObject<HTMLElement | SVGRectElement | null | undefined>} ref The reference to the HTML or SVG element.
//  *
//  * @group Hooks
//  */
// export function useUpdateNodeSize<AnyHtmlOrSvgElement extends HTMLElement | SVGRectElement>(
//   ref?: Ref<AnyHtmlOrSvgElement | null>,
//   options: SizeObserverOptions = DEFAULT_OPTIONS
// ) {
//   const { widthPadding, heightPadding, onSetSize } = options;
//   const graph = useGraph();
//   const id = useCellId();
//   const elementRef = useRef<AnyHtmlOrSvgElement | null>(null);

//   // Update the forwarded ref and the internal ref
//   const setRefs = useCallback(
//     (node: AnyHtmlOrSvgElement | null) => {
//       elementRef.current = node;
//       if (typeof ref === 'function') {
//         ref(node);
//       } else if (ref && 'current' in ref) {
//         ref.current = node;
//       }
//     },
//     [ref]
//   );

//   useLayoutEffect(() => {
//     if (elementRef.current === null) {
//       return;
//     }

//     if (!elementRef.current) {
//       throw new Error('MeasuredNode must have a child element');
//     }

//     // verify element is instance of HTML element
//     const isHTMLElement = elementRef.current instanceof HTMLElement;
//     const isSVGElement = elementRef.current instanceof SVGElement;
//     if (!isHTMLElement && !isSVGElement) {
//       throw new Error('Element must be an instance of HTML or SVG element');
//     }

//     const cell = graph.getCell(id);
//     if (!cell) {
//       return;
//     }

//     return createElementSizeObserver(elementRef.current, ({ height, width }) => {
//       const newSize: SizeObserver = {
//         height: height + heightPadding,
//         width: width + widthPadding,
//       };
//       if (onSetSize) {
//         return onSetSize(cell, newSize);
//       }
//       cell.set('size', newSize);
//     });
//   }, [id, graph, widthPadding, heightPadding, onSetSize]);

//   return setRefs;
// }
