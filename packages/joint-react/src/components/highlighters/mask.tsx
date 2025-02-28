import type { PropsWithChildren } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import type { OnAddHighlighter } from './custom';
import { Custom } from './custom';
import type { dia } from '@joint/core';
import { highlighters } from '@joint/core';

export interface MaskHighlighterProps extends React.SVGProps<SVGPathElement>, PropsWithChildren {
  readonly layer?: string;
  readonly selector?: string;
  readonly children?: React.ReactNode | null | false;
  readonly padding?: number;
}

const DEFAULT_MASK_HIGHLIGHTER_PROPS: MaskHighlighterProps = {
  stroke: '#4666E5',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  fill: 'none',
};

/**
 * Adds a stroke around an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#mask
 */
export function Component(props: MaskHighlighterProps, forwardedRef: React.Ref<SVGElement>) {
  const { layer, children, padding, ...svgAttributes } = props;
  const options = useMemo((): dia.HighlighterView.Options => {
    const data: dia.HighlighterView.Options = {
      layer,
      attrs: {
        ...DEFAULT_MASK_HIGHLIGHTER_PROPS,
        ...svgAttributes,
      },
    };
    if (padding !== undefined) {
      data.padding = padding;
    }
    return data;
  }, [layer, padding, svgAttributes]);

  const onAdd: OnAddHighlighter = useCallback((cellView, element, highlighterId, hOptions) => {
    return highlighters.mask.add(cellView, element, highlighterId, hOptions);
  }, []);

  return (
    <Custom options={options} ref={forwardedRef} onAdd={onAdd}>
      {children}
    </Custom>
  );
}

/**
 * Mask highlighter component.
 * Adds a stroke around an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#mask
 * @group Components
 
 */
export const Mask = forwardRef(Component);
