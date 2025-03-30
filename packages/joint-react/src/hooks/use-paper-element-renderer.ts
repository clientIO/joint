import type { dia } from '@joint/core';
import { useCallback, useState } from 'react';
import type { OnPaperRenderElement } from '../utils/create-paper';

export function usePaperElementRenderer(onReady?: () => void) {
  const [svgGElements, setSvgGElements] = useState<Record<dia.Cell.ID, SVGGElement>>({});

  const onRenderElement: OnPaperRenderElement = useCallback(
    (element, nodeSvgGElement) => {
      onReady?.();
      setSvgGElements((previousState) => {
        return {
          ...previousState,
          [element.id]: nodeSvgGElement,
        };
      });
    },
    [onReady]
  );

  return { svgGElements, onRenderElement };
}
