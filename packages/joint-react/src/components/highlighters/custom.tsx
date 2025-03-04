import type React from 'react';
import { forwardRef, useCallback, useId } from 'react';
import { useCellId } from '../../hooks/use-cell-id';
import { usePaper } from '../../hooks/use-paper';
import type { dia } from '@joint/core';
import { useChildrenRef } from '../../hooks/use-children-ref';
import { useHighlighter } from '../../hooks/use-highlighter';
import typedMemo from '../../utils/typed-memo';

export type OnAddHighlighter<
  Highlighter extends dia.HighlighterView.Options = dia.HighlighterView.Options,
> = (
  cellView:
    | dia.ElementView<dia.Element<dia.Element.Attributes, dia.ModelSetOptions>>
    | dia.LinkView<dia.Link<dia.Link.Attributes, dia.ModelSetOptions>>,
  element: SVGElement | Record<string, unknown>,
  highlighterId: string,
  options: Highlighter
) => dia.HighlighterView<Highlighter>;

export interface CustomHighlighterProps<
  Highlighter extends dia.HighlighterView.Options = dia.HighlighterView.Options,
> {
  readonly children?: React.ReactNode | null | false;
  readonly onAdd: OnAddHighlighter<Highlighter>;

  /**
   * This should be memoized
   */
  readonly options: Highlighter;
}

function RawComponent<
  Highlighter extends dia.HighlighterView.Options = dia.HighlighterView.Options,
>(props: CustomHighlighterProps<Highlighter>, forwardedRef: React.Ref<SVGElement>) {
  const { children, options, onAdd } = props;
  const id = useCellId();
  const paper = usePaper();
  const highlighterId = useId();
  const { elementRef, svgChildren } = useChildrenRef(children, forwardedRef);

  const create = useCallback(
    (hOptions: Highlighter) => {
      const cellView = paper.findViewByModel(id);
      if (!cellView) {
        return;
      }
      return onAdd(cellView, elementRef.current ?? {}, highlighterId, hOptions);
    },
    [onAdd, elementRef, highlighterId, id, paper]
  );

  const update = useCallback((instance: ReturnType<typeof create>, hOptions: Highlighter) => {
    const oldOptions = instance?.options ?? {};
    if (!instance?.options) {
      return;
    }
    instance.options = {
      ...oldOptions,
      ...hOptions,
    };
    // TODO: METHOD IS protected by TS, so it need to be fixed in core
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    instance.update();
  }, []);
  useHighlighter(create, update, options);
  return svgChildren;
}

const ForwardedComponent = forwardRef(RawComponent);

/**
 * Custom highlighter component.
 * Allows to create a custom highlighter.
 * @group Components
 
 */
export const Custom = typedMemo(ForwardedComponent);
