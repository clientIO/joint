import type { FC, PropsWithChildren } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import type { OnCreateHighlighter } from './custom';
import { Custom } from './custom';
import type { dia } from '@joint/core';
import { highlighters } from '@joint/core';

export interface StrokeHighlighterProps extends PropsWithChildren, React.SVGProps<SVGPathElement> {
  /**
   * The stacking order of the highlighter. See dia.HighlighterView for supported values.
   */
  readonly layer?: string;
  /**
   * The space between the stroke and the element
   */
  readonly padding?: number;
  /**
   * The stroke's border radius on the x-axis
   */
  readonly rx?: number;
  /**
   * The stroke's border radius on the y-axis
   */
  readonly ry?: number;
  /**
   * Draw the stroke by using the first subpath of the target el compound path.
   */
  readonly useFirstSubpath?: boolean;
  /**
   * When enabled the stroke width of the highlighter is not dependent on the transformations of the paper (e.g. zoom level). It defaults to false.
   */
  readonly nonScalingStroke?: boolean;
  /**
   * If the highlighter is disabled or not.
   */
  readonly isHidden?: boolean;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: StrokeHighlighterProps, forwardedRef: React.Ref<SVGElement>) {
  const {
    children,
    layer,
    padding,
    rx,
    ry,
    useFirstSubpath,
    nonScalingStroke,
    isHidden,
    ...svgAttributes
  } = props;
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

  const onAdd: OnCreateHighlighter = useCallback((cellView, element, highlighterId, hOptions) => {
    return highlighters.stroke.add(cellView, element, highlighterId, hOptions);
  }, []);

  return (
    <Custom options={options} ref={forwardedRef} onCreateHighlighter={onAdd} isHidden={isHidden}>
      {children}
    </Custom>
  );
}

/**
 * Stroke highlighter component.
 * Adds a stroke around an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#stroke
 * @group Components
 * @example
 * ```tsx
 * import { Highlighter } from '@joint/react'
 * return <Highlighter.Stroke />
 * ```
 */
export const Stroke: FC<StrokeHighlighterProps> = forwardRef(Component);
