import type { dia } from '@joint/core';
import { useCallback, useState } from 'react';
import type { OnPaperRenderElement } from '../utils/create-paper';

/**
 * A custom hook that manages the rendering of SVG elements in a JointJS paper.
 * @param onReady - A callback function that is called when the SVG element is ready.
 * @returns An object containing the rendered SVG elements and a function to handle rendering.
 * @group hooks
 * @description
 * This hook is used to manage the rendering of SVG elements in a JointJS paper.
 * It provides a function to handle the rendering of elements and a state to store the rendered SVG elements.
 * It can be used to trigger a callback when the SVG element is ready.
 * @private
 * @internal
 */
export function usePaperElementRenderer() {
  const [svgGElements, setSvgGElements] = useState<Record<dia.Cell.ID, SVGElement>>({});

  const onRenderElement: OnPaperRenderElement = useCallback((element, nodeSvgGElement) => {
    setSvgGElements((previousState) => {
      return {
        ...previousState,
        [element.id]: nodeSvgGElement,
      };
    });
  }, []);

  return { svgGElements, onRenderElement };
}
