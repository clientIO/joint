import type { FC, PropsWithChildren } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import type { OnAddHighlighter } from './custom';
import { Custom } from './custom';
import type { dia } from '@joint/core';
import { highlighters } from '@joint/core';

export interface MaskHighlighterProps extends React.SVGProps<SVGPathElement>, PropsWithChildren {
  /**
   * The layer on which the mask will be rendered.
   */
  readonly layer?: string;
  /**
   * A CSS selector string for targeting elements.
   */
  readonly selector?: string;
  /**
   * Child elements to render inside the mask.
   */
  readonly children?: React.ReactNode | null | false;
  /**
   * The space between the stroke and the element
   */
  readonly padding?: number;
  /**
   * If the highlighter is disabled or not.
   */
  readonly isHidden?: boolean;
}

const DEFAULT_MASK_HIGHLIGHTER_PROPS: MaskHighlighterProps = {
  stroke: '#4666E5',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  fill: 'none',
};

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: MaskHighlighterProps, forwardedRef: React.Ref<SVGElement>) {
  const { layer, children, padding, isHidden, ...svgAttributes } = props;
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
    <Custom options={options} ref={forwardedRef} onAdd={onAdd} isHidden={isHidden}>
      {children}
    </Custom>
  );
}

/**
 * Mask highlighter component.
 * Adds a stroke around an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#mask
 * @group Components
 * @example
 * ```tsx
 * import { Highlighter } from '@joint/react'
 * return <Highlighter.Mask />
 * ```
 */
export const Mask: FC<MaskHighlighterProps> = forwardRef(Component);
