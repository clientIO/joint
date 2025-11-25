import { useEffect, useState } from 'react';
import { createElementSizeObserver } from '../utils/create-element-size-observer';
interface Options {
  readonly element: React.RefObject<HTMLElement | SVGElement | null>;
  readonly isEnabled: boolean;
}
/**
 * A hook to get the layout size of an element.
 * It uses the `createElementSizeObserver` utility to observe size changes.
 * @param options - The options for the hook, including the element to observe and whether to enable the observer.
 * @returns The layout size of the element.
 */
export function useLayoutSize(options: Options) {
  const { element, isEnabled } = options;
  const [layout, setLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (!isEnabled) return;
    if (!element.current) return;
    const cleanup = createElementSizeObserver(element.current, ({ width, height }) => {
      setLayout({ width, height });
    });
    return () => cleanup();
  }, [element, isEnabled]);

  return layout;
}
