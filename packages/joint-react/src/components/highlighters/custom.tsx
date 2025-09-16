import type React from 'react';
import { forwardRef, useId } from 'react';
import { useCellId } from '../../hooks/use-cell-id';
import { usePaper } from '../../hooks/use-paper';
import type { dia } from '@joint/core';
import { useChildrenRef } from '../../hooks/use-children-ref';
import typedMemo from '../../utils/typed-memo';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { assignOptions, dependencyExtract } from '../../utils/object-utilities';

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

  useImperativeApi(
    {
      onLoad() {
        const cellView = paper.findViewByModel(id);
        if (!cellView) {
          throw new Error('CellView not found for highlighter');
        }
        const instance = onCreateHighlighter(
          cellView,
          elementRef.current ?? {},
          highlighterId,
          options
        );
        return {
          instance,
          cleanup() {
            instance?.remove();
          },
        };
      },
      onUpdate(instance) {
        const oldOptions = instance?.options ?? {};
        assignOptions(oldOptions, options as Partial<Highlighter>);
        // @ts-expect-error Internal API
        instance.update();
      },
      isDisabled: isHidden ?? false,
    },
    dependencyExtract(options)
  );

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
