import type { FC, PropsWithChildren } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import type { OnAddHighlighter } from './custom';
import { Custom } from './custom';
import type { dia } from '@joint/core';
import { highlighters } from '@joint/core';

export interface OpacityHighlighterProps extends PropsWithChildren {
  /**
   * Opacity value between 0-1
   * @default 1
   */
  readonly alphaValue: number;
  /**
   * If the highlighter is disabled or not.
   */
  readonly isHidden?: boolean;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: OpacityHighlighterProps, forwardedRef: React.Ref<SVGElement>) {
  const { children, alphaValue = 1, isHidden } = props;
  const options = useMemo((): dia.HighlighterView.Options => {
    const data: dia.HighlighterView.Options = {
      alphaValue,
    };
    return data;
  }, [alphaValue]);

  const onAdd: OnAddHighlighter = useCallback((cellView, element, highlighterId, hOptions) => {
    return highlighters.opacity.add(cellView, element, highlighterId, hOptions);
  }, []);

  return (
    <Custom options={options} ref={forwardedRef} onAdd={onAdd} isHidden={isHidden}>
      {children}
    </Custom>
  );
}

/**
 * Opacity highlighter component.
 * Changes the opacity of an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#opacity
 * @group Components
 * @example
 * ```tsx
 * import { Highlighter } from '@joint/react'
 * return <Highlighter.Opacity />
 * ```
 */
export const Opacity: FC<OpacityHighlighterProps> = forwardRef(Component);
