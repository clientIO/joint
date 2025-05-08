export interface SizeObserver {
  readonly width: number;
  readonly height: number;
}

/**
 * Create element size observer with cleanup function.
 * It uses ResizeObserver to observe changes in the size of the HTML element.
 * @param element The HTML element to observe.
 * @param onResize The callback function to call when the size of the element changes.
 * @group Utils
 * @returns A cleanup function to disconnect the observer.
 * @example
 * ```tsx
 * const element = document.getElementById('element-id');
 * const onResize = (position) => {
 *   console.log('Element size changed:', position);
 * };
 * const cleanup = createElementSizeObserver(element, onResize);
 * ```
 */
export function createElementSizeObserver<AnyHTMLOrSVGElement extends HTMLElement | SVGElement>(
  element: AnyHTMLOrSVGElement,
  onResize: (position: SizeObserver) => void
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

  // trigger the observer immediately
  const { width, height } = element.getBoundingClientRect();
  onResize({ width, height });

  // Start observing the HTML element.
  observer.observe(element, { box: 'border-box' });
  // Cleanup function to disconnect the observer when the component unmounts or dependencies change.
  return () => {
    observer.disconnect();
  };
}
