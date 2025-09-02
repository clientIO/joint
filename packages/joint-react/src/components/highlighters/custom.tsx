import type React from 'react';
import { forwardRef, useCallback, useEffect, useId } from 'react';
import { useCellId } from '../../hooks/use-cell-id';
import { usePaper } from '../../hooks/use-paper';
import type { dia } from '@joint/core';
import { useChildrenRef } from '../../hooks/use-children-ref';
import { useHighlighter } from '../../hooks/use-highlighter';
import typedMemo from '../../utils/typed-memo';

export type OnCreateHighlighter<
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
  /**
   * Child elements to render inside the highlighter.
   */
  readonly children?: React.ReactNode | null | false;
  /**
   * Callback function should return any highlighter.
   * @param cellView - The cell view to which the highlighter is attached.
   * @param element - The SVG element to which the highlighter is attached.
   * @param highlighterId - The ID of the highlighter.
   * @param options - The options for the highlighter.
   * @returns The created highlighter.
   */
  readonly onCreateHighlighter: OnCreateHighlighter<Highlighter>;

  /**
   * This should be memoized
   */
  readonly options: Highlighter;
  /**
   * If the highlighter is disabled or not.
   */
  readonly isHidden?: boolean;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function RawComponent<
  Highlighter extends dia.HighlighterView.Options = dia.HighlighterView.Options,
>(props: CustomHighlighterProps<Highlighter>, forwardedRef?: React.Ref<SVGElement>) {
  const { children, options, onCreateHighlighter, isHidden } = props;
  const id = useCellId();
  const paper = usePaper();
  const highlighterId = useId();
  const { elementRef, elementChildren } = useChildrenRef(children, forwardedRef);

  // ERROR HANDLING
  useEffect(() => {
    if (!elementRef.current) {
      throw new Error('Highlighter children component must have accessible ref');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const create = useCallback(
    (hOptions: Highlighter) => {
      const cellView = paper.findViewByModel(id);
      if (!cellView) {
        return;
      }
      return onCreateHighlighter(cellView, elementRef.current ?? {}, highlighterId, hOptions);
    },
    [onCreateHighlighter, elementRef, highlighterId, id, paper]
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

    // @ts-expect-error Internal API
    instance.update();
  }, []);
  useHighlighter(create, update, options, isHidden);
  return elementChildren;
}

const ForwardedComponent = forwardRef(RawComponent);

/**
 * Custom highlighter component.
 * Allows to create a custom highlighter.
 * @group Components
 * @example
 * ```tsx
 * import { Highlighter } from '@joint/react'
 * return <Highlighter.Custom />
 * ```
 */
export const Custom = typedMemo(ForwardedComponent);
