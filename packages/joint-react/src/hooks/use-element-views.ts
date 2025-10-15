import type { dia } from '@joint/core';
import { useCallback, useState } from 'react';

export type OnPaperRenderElement = (elementView: dia.ElementView) => void;

/**
 * A custom hook that manages the rendering of `ElementView` elements in a JointJS paper.
 * @returns An object containing the rendered `ElementView` elements and a function to handle rendering.
 * @group hooks
 * @param idExtractor - A function to extract the ID from the `ElementView`. If not provided, the model's ID will be used.
 * @description
 * This hook is used to manage the rendering of `ElementView` elements in a JointJS paper.
 * It provides a function to handle the rendering of elements and a state to store the rendered SVG elements.
 * It can be used to trigger a callback when the `ElementView` element is ready.
 * @private
 * @internal
 */
export function useElementViews(idExtractor?: (elementView: dia.ElementView) => string) {
  const [elementViews, setElements] = useState<Record<dia.Cell.ID, dia.ElementView>>({});

  const onRenderElement: OnPaperRenderElement = useCallback(
    (elementView) => {
      const id = idExtractor ? idExtractor(elementView) : elementView.model.id;
      return setElements((previous) => {
        const newElements = { ...previous, [id]: elementView };
        return newElements;
      });
    },
    // Extractor must be pure
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { elementViews, onRenderElement };
}
