import { useCallback, useRef, useSyncExternalStore } from 'react';
import { useCellId } from './use-cell-id';
import { usePaperStore } from './use-paper';
import { getLinkLayout } from '../store/update-layout-state';
import type { LinkLayout } from '../types/cell.types';

/**
 * Returns `true` when both layouts are structurally identical. Used to hold
 * the cached `useSyncExternalStore` snapshot stable across `render:done`
 * events that didn't actually change the link's geometry.
 * @param a - first layout (may be undefined)
 * @param b - second layout (may be undefined)
 * @returns whether `a` and `b` describe the same rendered geometry
 */
function isSameLayout(a: LinkLayout | undefined, b: LinkLayout | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.sourceX === b.sourceX &&
    a.sourceY === b.sourceY &&
    a.targetX === b.targetX &&
    a.targetY === b.targetY &&
    a.d === b.d
  );
}

/**
 * Read the current link's rendered geometry from the paper it lives on —
 * `{ sourceX, sourceY, targetX, targetY, d }`, where `d` is the serialised
 * SVG path computed by JointJS's `LinkView`.
 *
 * Paper-scoped because link geometry is not a property of the graph record —
 * a single link can appear on multiple papers (e.g. main canvas + minimap)
 * with different routing. The layout is read from the paper context via
 * `usePaperStore()` and re-read whenever the paper finishes a render pass
 * (JointJS's `render:done` event), which covers every case that can change
 * a link's geometry — drag, programmatic position change, source/target
 * reconnection, resize, etc.
 *
 * Must be called inside `renderLink` (or a component mounted from one) so
 * `CellIdContext` resolves the target link id. Returns `undefined` while the
 * link view is still being created or when the link's source / target are
 * not yet positioned.
 *
 * The snapshot is memoised by structural equality, which is required by
 * `useSyncExternalStore` — returning a fresh object on every read would
 * trigger an infinite re-render loop because `Object.is` would see every
 * render as a store change.
 * @returns the current link's layout, or undefined when unavailable
 */
export function useLinkLayout(): LinkLayout | undefined {
  const id = useCellId();
  const paperStore = usePaperStore();
  const { paper } = paperStore;
  const cachedRef = useRef<LinkLayout | undefined>(undefined);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!paper) return () => {};
      // `render:done` fires after JointJS finishes any render pass — drag
      // ticks, programmatic position changes, layout recomputes, link
      // reconnections all produce one. This single subscription covers
      // every reason link geometry could have updated.
      paper.on('render:done', listener);
      return () => {
        paper.off('render:done', listener);
      };
    },
    [paper]
  );

  const getSnapshot = useCallback((): LinkLayout | undefined => {
    const linkView = paperStore.getLinkView(id);
    const next = linkView ? getLinkLayout(linkView) : undefined;
    if (isSameLayout(cachedRef.current, next)) return cachedRef.current;
    cachedRef.current = next;
    return next;
  }, [id, paperStore]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
