import { memo, useLayoutEffect } from 'react';
import { useChildrenRef } from '../../hooks/use-children-ref';
import {
  createElementSizeObserver,
  type PositionObserver,
} from '../../utils/create-element-size-observer';

export interface MeasuredNodeProps {
  readonly children: React.ReactNode | null;
  readonly onSizeChange?: (position: PositionObserver) => void;
}
export function Component(props: MeasuredNodeProps) {
  const { children, onSizeChange } = props;
  const { elementRef, svgChildren } = useChildrenRef(children);

  useLayoutEffect(() => {
    if (!elementRef.current) {
      return;
    }

    // verify element is instance of HTML element
    const isHTMLElement = elementRef.current instanceof HTMLElement;
    const isSVGElement = elementRef.current instanceof SVGElement;
    if (!isHTMLElement && !isSVGElement) {
      throw new Error('Element must be an instance of HTML or SVG element');
    }

    return createElementSizeObserver(elementRef.current, (position) => {
      console.log('Element size changed:', position);
      onSizeChange?.(position);
    });
  }, [children, elementRef, onSizeChange]);
  return svgChildren;
}

export const MeasuredNode = memo(Component);
