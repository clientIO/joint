import {
  useLayoutEffect,
  useMemo,
  useRef,
  startTransition,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type { ExternalStoreLike } from '../utils/create-state';
import type { GraphStoreSnapshot } from '../store';
import { isUpdater } from '../utils/is';
import { util } from '@joint/core';

import type { dia } from '@joint/core';

/**
 * Options for converting React state to an external store interface.
 * @template Element - The type of elements
 * @template Link - The type of links
 */
interface Options<Element extends dia.Element | GraphElement, Link extends dia.Link | GraphLink> {
  /** Current elements array from React state */
  readonly elements?: Element[];
  /** Current links array from React state */
  readonly links?: Link[];
  /** Callback function called when elements change */
  readonly onElementsChange?: Dispatch<SetStateAction<Element[]>>;
  /** Callback function called when links change */
  readonly onLinksChange?: Dispatch<SetStateAction<Link[]>>;
}

/**
 * Converts React state (elements, links, and their change handlers) into an external store-like interface.
 *
 * This function enables React-controlled mode by wrapping React state setters in an ExternalStoreLike
 * interface that GraphStore can use. It handles:
 * - Subscribing to prop changes and notifying subscribers
 * - Converting setState calls back to React state updates
 * - Maintaining a snapshot for efficient comparisons
 *
 * Returns undefined if no change handlers are provided (uncontrolled mode).
 * @template Element - The type of elements
 * @template Link - The type of links
 * @param options - The options containing elements, links, and their change handlers
 * @returns An external store-like interface compatible with GraphStore, or undefined if uncontrolled
 */
export function useStateToExternalStore<Element extends GraphElement, Link extends GraphLink>(
  options: Options<Element, Link>
): ExternalStoreLike<GraphStoreSnapshot<Element, Link>> | undefined {
  const { elements = [], links = [], onElementsChange, onLinksChange } = options;
  const subscribers = useRef<Set<() => void>>(new Set());
  const snapshot = useRef<GraphStoreSnapshot<Element, Link>>({ elements, links });

  const hasOnChange = typeof onElementsChange === 'function' || typeof onLinksChange === 'function';
  const notifySubscribers = useRef(() => {
    if (!hasOnChange) {
      return;
    }
    for (const subscriber of subscribers.current) {
      subscriber();
    }
  });

  useLayoutEffect(() => {
    if (!hasOnChange) {
      return;
    }
    // Sync external prop changes (changes not initiated by setState)
    const newSnapshot = { elements, links };
    if (util.isEqual(newSnapshot, snapshot.current)) {
      return;
    }
    snapshot.current = newSnapshot;
    notifySubscribers.current();
  }, [elements, hasOnChange, links]);

  const store = useMemo((): ExternalStoreLike<GraphStoreSnapshot<Element, Link>> | undefined => {
    if (!hasOnChange) {
      return undefined;
    }
    return {
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

        snapshot.current = updatedSnapshot;
        // Notify subscribers immediately (synchronous, like createState)
        notifySubscribers.current();

        // Then trigger React state updates wrapped in startTransition for better performance
        // This keeps the UI responsive during large updates (e.g., 450 nodes)
        // When new props come in, useLayoutEffect will see they match snapshot.current
        // and won't notify again (avoiding double notifications)
        startTransition(() => {
          onElementsChange?.(updatedSnapshot.elements);
          onLinksChange?.(updatedSnapshot.links);
        });
      },
    };
  }, [hasOnChange, onElementsChange, onLinksChange]);
  return store;
}
