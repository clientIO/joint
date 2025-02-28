import type { PropsWithChildren } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import type { OnAddHighlighter } from './custom';
import { Custom } from './custom';
import type { dia } from '@joint/core';
import { highlighters } from '@joint/core';

export interface StrokeHighlighterProps extends PropsWithChildren, React.SVGProps<SVGPathElement> {
  readonly layer: string;
  readonly padding?: number;
  readonly rx?: number;
  readonly ry?: number;
  readonly useFirstSubpath?: boolean;
  readonly nonScalingStroke?: boolean;
}

/**
 * Adds a stroke around an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#stroke
 */
export function Component(props: StrokeHighlighterProps, forwardedRef: React.Ref<SVGElement>) {
  const { children, layer, padding, rx, ry, useFirstSubpath, nonScalingStroke, ...svgAttributes } =
    props;
  const options = useMemo((): dia.HighlighterView.Options => {
    const data: dia.HighlighterView.Options = {
      padding,
      layer,
      attrs: svgAttributes,
      useFirstSubpath,
      nonScalingStroke,
      rx,
      ry,
    };
    return data;
  }, [svgAttributes, layer, nonScalingStroke, padding, rx, ry, useFirstSubpath]);

  const onAdd: OnAddHighlighter = useCallback((cellView, element, highlighterId, hOptions) => {
    return highlighters.stroke.add(cellView, element, highlighterId, hOptions);
  }, []);

  return (
    <Custom options={options} ref={forwardedRef} onAdd={onAdd}>
      {children}
    </Custom>
  );
}

/**
 * Stroke highlighter component.
 * Adds a stroke around an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#stroke
 * @group Components
 
 */
export const Stroke = forwardRef(Component);
