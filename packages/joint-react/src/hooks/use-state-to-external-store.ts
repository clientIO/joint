import { useLayoutEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type { ExternalStoreLike } from '../utils/create-state';
import type { GraphStorePublicSnapshot } from '../store';
import { isUpdater } from '../utils/is';
import { util } from '@joint/core';
import { sendToDevTool } from '../utils/dev-tools';

interface Options<Element extends GraphElement, Link extends GraphLink> {
  readonly elements: Element[];
  readonly links: Link[];
  readonly onElementsChange: Dispatch<SetStateAction<Element[]>>;
  readonly onLinksChange: Dispatch<SetStateAction<Link[]>>;
}
export function useStateToExternalStore<Element extends GraphElement, Link extends GraphLink>(
  options: Options<Element, Link>
): ExternalStoreLike<GraphStorePublicSnapshot<Element, Link>> {
  const { elements, links, onElementsChange, onLinksChange } = options;
  const subscribers = useRef<Set<() => void>>(new Set());
  const snapshot = useRef<GraphStorePublicSnapshot<Element, Link>>({ elements, links });

  const notifySubscribers = useRef(() => {
    for (const subscriber of subscribers.current) {
      subscriber();
    }
  });

  useLayoutEffect(() => {
    // Sync external prop changes (changes not initiated by setState)
    const newSnapshot = { elements, links };
    if (util.isEqual(newSnapshot, snapshot.current)) {
      return;
    }
    snapshot.current = newSnapshot;
    notifySubscribers.current();
  }, [elements, links]);

  const store = useMemo(
    (): ExternalStoreLike<GraphStorePublicSnapshot<Element, Link>> => ({
      getSnapshot: () => {
        return snapshot.current;
      },
      subscribe: (listener) => {
        subscribers.current.add(listener);

        return () => {
          subscribers.current.delete(listener);
        };
      },
      setState: (updater) => {
        const updatedSnapshot = isUpdater(updater) ? updater({ ...snapshot.current }) : updater;
        if (util.isEqual(updatedSnapshot, snapshot.current)) {
          return;
        }

        sendToDevTool({
          name: 'AHA',
          type: 'set',
          value: updatedSnapshot,
        });
        snapshot.current = updatedSnapshot;
        // Notify subscribers immediately (synchronous, like createState)

        // Then trigger React state updates which will cause re-render
        // When new props come in, useLayoutEffect will see they match snapshot.current
        // and won't notify again (avoiding double notifications)
        onElementsChange?.(updatedSnapshot.elements);
        onLinksChange?.(updatedSnapshot.links);
      },
    }),
    [onElementsChange, onLinksChange]
  );
  return store;
}
