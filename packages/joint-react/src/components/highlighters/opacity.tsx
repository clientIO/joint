import type { PropsWithChildren } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import type { OnAddHighlighter } from './custom';
import { Custom } from './custom';
import type { dia } from '@joint/core';
import { highlighters } from '@joint/core';

export interface OpacityHighlighterProps extends PropsWithChildren {
  readonly alphaValue: number;
}

/**
 * Changes the opacity of an arbitrary cell view's SVG node.
 * @see https://docs.jointjs.com/api/highlighters/#opacity
 */
export function Component(props: OpacityHighlighterProps, forwardedRef: React.Ref<SVGElement>) {
  const { children, alphaValue = 1 } = props;
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
    <Custom options={options} ref={forwardedRef} onAdd={onAdd}>
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
export const Opacity = forwardRef(Component);
