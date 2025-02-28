/* eslint-disable no-shadow */
import type { dia } from '@joint/core';
import { util } from '@joint/core';
import { useEffect, useRef } from 'react';

interface HighlighterBase {
  remove: () => void;
}

/**
 * Just internal util hook to manage highlighter lifecycle with automatic remove and update.
 *
 * @group Hooks
 *
 * @param create - Function to create a highlighter instance.
 * @param update - Function to update the highlighter instance.
 * @param options - Options for creating/updating the highlighter.
 */
export function useHighlighter<H extends HighlighterBase, T extends dia.HighlighterView.Options>(
  create: (options: T) => H | undefined,
  update: (instance: H, options: T) => void,
  options: T
) {
  const highlighter = useRef<H | null>(null);
  const previousOptions = useRef<T | null>(null);

  // This effect is called only on mount and un-mount of the component itself
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
