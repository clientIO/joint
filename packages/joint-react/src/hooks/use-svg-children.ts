import { cloneElement, useRef } from 'react';

/**
 * Custom hook to handle SVG children elements.
 * @group Hooks
 */
export function useSvgChildren(children: unknown, externalRef?: React.Ref<SVGElement>) {
  const elementRef = useRef<SVGElement | null>(null);

  // Merge internal and external refs
  const setRef = (node: SVGElement | null) => {
    elementRef.current = node;
    if (typeof externalRef === 'function') {
      externalRef(node);
    } else if (externalRef) {
      (externalRef as React.RefObject<SVGElement | null>).current = node;
    }
  };

  if (!children) {
    return {
      elementRef,
      svgChildren: null,
    };
  }

  const svgChildren = cloneElement(children as never, { ref: setRef });

  return { elementRef, svgChildren };
}
