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
 * Returns the current link's rendered geometry, its source and target endpoint
 * coordinates plus the SVG path string (`{ sourceX, sourceY, targetX, targetY,
 * d }`, where `d` is the path computed by JointJS). Use it to draw custom link
 * decorations, labels, or overlays that need to follow the link's actual route.
 *
 * Geometry is per-paper: the same link can render with different routing on
 * different papers (e.g. the main canvas and a minimap), so the hook reports the
 * geometry on the paper it is mounted under. The value stays in sync, it
 * re-reads after every render pass, covering drags, programmatic position
 * changes, source/target reconnections, and resizes.
 *
 * Call it inside `renderLink` (or a component mounted from one) so the target
 * link id resolves from context. Returns `undefined` only until the link view
 * exists — no paper has mounted yet, or the view is still being created. Once the
 * view appears the value is always defined; it may briefly report zeroed
 * coordinates and an empty path string until JointJS computes the first route.
 * @returns The current link's layout, or `undefined` while no link view exists yet.
 * @experimental Depends on `renderLink`, which is itself experimental.
 * @group Hooks
 * @example
 * ```tsx
 * import { GraphProvider, Paper, useLinkLayout } from '@joint/react';
 *
 * // A badge that tracks the midpoint of the link as it is routed.
 * function LinkMidpointBadge() {
 *   const layout = useLinkLayout();
 *   if (!layout) return null;
 *   const midX = (layout.sourceX + layout.targetX) / 2;
 *   const midY = (layout.sourceY + layout.targetY) / 2;
 *   return <circle cx={midX} cy={midY} r={4} fill="tomato" />;
 * }
 *
 * <GraphProvider>
 *   <Paper renderLink={() => <LinkMidpointBadge />} />
 * </GraphProvider>
 * ```
 */
export function useLinkLayout(): LinkLayout | undefined {
  const id = useCellId();
  const paperStore = usePaperStore();
  const paper = paperStore?.paper;
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
    if (!paperStore) return undefined;
    const linkView = paperStore.getLinkView(id);
    const next = linkView ? getLinkLayout(linkView) : undefined;
    if (isSameLayout(cachedRef.current, next)) return cachedRef.current;
    cachedRef.current = next;
    return next;
  }, [id, paperStore]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
