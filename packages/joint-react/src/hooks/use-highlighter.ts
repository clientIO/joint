import type { dia } from '@joint/core';
import { util } from '@joint/core';
import { useEffect, useRef } from 'react';

interface HighlighterBase {
  remove: () => void;
}

/**
 * Just internal util hook to manage highlighter lifecycle with automatic remove and update.
 * @group Hooks
 * @param create - Function to create a highlighter instance.
 * @param update - Function to update the highlighter instance.
 * @param options - Options to create the highlighter instance.
 * @param isDisabled - Flag to disable the highlighter
 * @internal
 */
export function useHighlighter<
  Highlighter extends HighlighterBase,
  HighlighterOptions extends dia.HighlighterView.Options,
>(
  create: (options: HighlighterOptions) => Highlighter | undefined,
  update: (instance: Highlighter, options: HighlighterOptions) => void,
  options: HighlighterOptions,
  isDisabled?: boolean
) {
  const highlighter = useRef<Highlighter | null>(null);
  const previousOptions = useRef<HighlighterOptions | null>(null);

  // This effect is called only on mount and un-mount of the component itself
  useEffect(() => {
    if (isDisabled) {
      highlighter.current?.remove();
      highlighter.current = null;
      previousOptions.current = null;
      return;
    }
    const instance = create(options);
    if (!instance) {
      return;
    }
    highlighter.current = instance;
    return () => {
      highlighter.current?.remove();
      highlighter.current = null;
      previousOptions.current = null;
    };
    // listen only to isDisabled change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled]);

  // This effect is called on every options change
  useEffect(() => {
    if (!highlighter.current) {
      return;
    }
    if (util.isEqual(options, previousOptions.current)) {
      return;
    }
    update(highlighter.current, options);
    previousOptions.current = options;
  }, [options, update]);
}
