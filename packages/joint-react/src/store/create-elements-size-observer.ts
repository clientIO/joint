import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphStoreIdsSnapshot, GraphStorePublicSnapshot } from './graph-store';
import type { MarkDeepReadOnly } from '../utils/create-state';

const DEFAULT_OBSERVER_OPTIONS: ResizeObserverOptions = { box: 'border-box' };
// Epsilon value to avoid jitter due to sub-pixel rendering
// especially on Safari
const EPSILON = 0.5;

export interface SizeObserver {
  readonly width: number;
  readonly height: number;
}

export interface OnSetOptions {
  readonly element: dia.Element;
  readonly size: SizeObserver;
}
export type OnSetSize = (options: OnSetOptions) => void;

export interface SetMeasuredNodeOptions {
  readonly element: HTMLElement | SVGElement;
  readonly setSize?: OnSetSize;
  readonly id: dia.Cell.ID;
}

interface ElementItem {
  readonly element: HTMLElement | SVGElement;
  readonly setSize?: OnSetSize;
}

interface Options<Element extends GraphElement> {
  readonly resizeObserverOptions?: ResizeObserverOptions;
  readonly getCellSize: (id: dia.Cell.ID) => SizeObserver;
  readonly getIdsSnapshot: () => MarkDeepReadOnly<GraphStoreIdsSnapshot>;
  readonly getPublicSnapshot: () => MarkDeepReadOnly<GraphStorePublicSnapshot<Element, Link>>;
  readonly onBatchUpdate: (elements: Element[]) => void;
}

export interface GraphStoreObserver {
  readonly add: (options: SetMeasuredNodeOptions) => () => void;
  readonly clean: () => void;
  readonly has: (id: dia.Cell.ID) => boolean;
}

export function createElementsSizeObserver<Element extends GraphElement>(
  options: Options<Element>
): GraphStoreObserver {
  const {
    resizeObserverOptions = DEFAULT_OBSERVER_OPTIONS,
    getCellSize,
    getIdsSnapshot,
    onBatchUpdate,
    getPublicSnapshot,
  } = options;
  const elements = new Map<dia.Cell.ID, ElementItem>();
  const invertedIndex = new Map<HTMLElement | SVGElement, dia.Cell.ID>();
  const observer = new ResizeObserver((entries) => {
    // we can consider this as single batch of
    let hasChange = false;
    const idsSnapshot = getIdsSnapshot();
    const publicSnapshot = getPublicSnapshot();
    const newElements = [...publicSnapshot.elements];
    for (const entry of entries) {
      // We must be careful to not mutate the snapshot data.
      const { target, borderBoxSize } = entry;

      const id = invertedIndex.get(target as HTMLElement | SVGElement);
      if (!id) {
        throw new Error(`Element with id ${id} not found in resize observer`);
      }

      // If borderBoxSize is not available or empty, continue to the next entry.
      if (!borderBoxSize || borderBoxSize.length === 0) continue;

      const [size] = borderBoxSize;
      const { inlineSize, blockSize } = size;

      const width = inlineSize;
      const height = blockSize;
      const actualSize = getCellSize(id);
      // Here we compare the actual size with the border box size
      const isChanged =
        Math.abs(actualSize.width - width) > EPSILON ||
        Math.abs(actualSize.height - height) > EPSILON;

      if (!isChanged) {
        return;
      }

      const elementIndex = idsSnapshot.elementIds[id];
      if (elementIndex == undefined) {
        throw new Error(`Element with id ${id} not found in graph data ref`);
      }
      const element = newElements[elementIndex];
      if (!element) {
        throw new Error(`Element with id ${id} not found in graph data ref`);
      }
      newElements[elementIndex] = { ...element, width, height };
      hasChange = true;
    }

    if (!hasChange) {
      return;
    }

    onBatchUpdate(newElements);
  });

  return {
    add({ id, element, setSize }: SetMeasuredNodeOptions) {
      observer.observe(element, resizeObserverOptions);
      elements.set(id, { element, setSize });
      invertedIndex.set(element, id);
      return () => {
        observer.unobserve(element);
        elements.delete(id);
        invertedIndex.delete(element);
      };
    },
    clean() {
      for (const [, { element }] of elements.entries()) {
        observer.unobserve(element);
      }
      elements.clear();
      invertedIndex.clear();
      observer.disconnect();
    },
    has(id: dia.Cell.ID) {
      return elements.has(id);
    },
  };
}
