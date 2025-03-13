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
  readonly isDisabled?: boolean;
}

/**
 * Changes the opacity of an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#opacity
 */
function Component(props: OpacityHighlighterProps, forwardedRef: React.Ref<SVGElement>) {
  const { children, alphaValue = 1, isDisabled } = props;
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
    <Custom options={options} ref={forwardedRef} onAdd={onAdd} isDisabled={isDisabled}>
      {children}
    </Custom>
  );
}

/**
 * Opacity highlighter component.
 * Changes the opacity of an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#opacity
 * @group Components
 
 */
export const Opacity: FC<OpacityHighlighterProps> = forwardRef(Component);
