export interface SizeObserver {
  readonly width: number;
  readonly height: number;
}

// Epsilon value to avoid jitter due to sub-pixel rendering
const EPSILON = 0.5;

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
  element: AnyHTMLOrSVGElement | null | undefined,
  onResize: (position: SizeObserver) => void
) {
  // Safety check: return no-op cleanup if element is invalid
  if (!element) {
    return () => {
      // No-op cleanup
    };
  }

  let isCleanedUp = false;
  let previousSize: SizeObserver | null = null;

  // Helper to check if size has meaningfully changed
  const hasSizeChanged = (newSize: SizeObserver): boolean => {
    if (previousSize === null) {
      return true;
    }
    return (
      Math.abs(previousSize.width - newSize.width) >= EPSILON ||
      Math.abs(previousSize.height - newSize.height) >= EPSILON
    );
  };

  // Helper to safely call onResize only if size changed and not cleaned up
  const safeOnResize = (size: SizeObserver): void => {
    if (isCleanedUp) {
      return;
    }
    if (hasSizeChanged(size)) {
      previousSize = size;
      onResize(size);
    }
  };

  // Create a ResizeObserver to observe changes in the size of the HTML element.
  const observer = new ResizeObserver((entries) => {
    if (isCleanedUp) {
      return;
    }

    for (const entry of entries) {
      const { borderBoxSize } = entry;

      // If borderBoxSize is not available or empty, continue to the next entry.
      if (!borderBoxSize || borderBoxSize.length === 0) continue;

      const [size] = borderBoxSize;
      const { inlineSize, blockSize } = size;
      safeOnResize({ width: inlineSize, height: blockSize });
      break; // We only care about the first entry
    }
  });

  // Trigger initial measurement
  requestAnimationFrame(() => {
    if (isCleanedUp || !element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const { width, height } = rect;
    if (width > 0 && height > 0) {
      safeOnResize({ width, height });
    }
  });

  // Start observing the HTML element.
  observer.observe(element, { box: 'border-box' });

  // Cleanup function to disconnect the observer when the component unmounts or dependencies change.
  return () => {
    isCleanedUp = true;
    observer.disconnect();
  };
}
