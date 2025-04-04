/* eslint-disable @eslint-react/no-clone-element */
import { cloneElement, useCallback, useMemo, useRef, type Ref } from 'react';

/**
 * Custom hook to return children and children ref. Children must be a `HTML` or `SVG` element.
 *
 * It automatically merges internal and external refs.
 * @param children The children elements.
 * @param externalRef The external reference.
 * @group Hooks
 * @internal
 * @returns The element ref and the children with the ref.
 * @example
 * ```tsx
 * const { elementRef, elementChildren } = useChildrenRef(children, externalRef);
 * ```
 * @private
 * @description
 * This hook is used to return children and children ref. Children must be a `HTML` or `SVG` element.
 */
export function useChildrenRef<HTMLOrSVG extends HTMLElement | SVGElement>(
  children: unknown,
  externalRef?: Ref<HTMLOrSVG>
) {
  const elementRef = useRef<HTMLOrSVG | null>(null);

  // Merge internal and external refs
  const setRef = useCallback(
    (node: HTMLOrSVG | null) => {
      elementRef.current = node;
      if (typeof externalRef === 'function') {
        externalRef(node);
      } else if (externalRef) {
        (externalRef as React.RefObject<HTMLOrSVG | null>).current = node;
      }
    },
    [externalRef]
  );

  const props = useMemo(() => {
    return {
      ref: setRef,
    };
  }, [setRef]);

  if (!children) {
    return {
      elementRef,
      svgChildren: null,
    };
  }

  const elementChildren = cloneElement(children as never, props);

  return { elementRef, elementChildren };
}
