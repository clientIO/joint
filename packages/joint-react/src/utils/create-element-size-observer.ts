export interface PositionObserver {
  readonly width: number;
  readonly height: number;
}

/**
 * Create element size observer with cleanup function.
 * It uses ResizeObserver to observe changes in the size of the HTML element.
 * @param {HTMLElement | SVGElement} element The HTML element to observe.
 * @param {(position: PositionObserver) => void} onResize The callback function to call when the size of the element changes.
 * @group Utils
 *
 * @example
 * ```tsx
 * const element = document.getElementById('element-id');
 * const onResize = (position) => {
 *   console.log('Element size changed:', position);
 * };
 * const cleanup = createElementSizeObserver(element, onResize);
 * ```
 */
export function createElementSizeObserver<AnyHtmlOrSvgElement extends HTMLElement | SVGElement>(
  element: AnyHtmlOrSvgElement,
  onResize: (position: PositionObserver) => void
) {
  // Create a ResizeObserver to observe changes in the size of the HTML element.
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { borderBoxSize } = entry;

      // If borderBoxSize is not available or empty, continue to the next entry.
      if (!borderBoxSize || borderBoxSize.length === 0) continue;

      const [size] = borderBoxSize;
      const { inlineSize, blockSize } = size;
      // Update the size of the cell in the graph.
      onResize({ width: inlineSize, height: blockSize });
    }
  });

  // Start observing the HTML element.
  observer.observe(element, { box: 'border-box' });
  // Cleanup function to disconnect the observer when the component unmounts or dependencies change.
  return () => {
    observer.disconnect();
  };
}
