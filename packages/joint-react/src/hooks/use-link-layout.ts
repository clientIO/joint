import { useMemo } from 'react';
import { useCellId } from './use-cell-id';
import { usePaperStore } from './use-paper';
import { useInternalData } from './use-stores';
import { createSelectPaperVersion } from '../selectors';
import { getLinkLayout } from '../store/update-layout-state';
import type { LinkLayout } from '../types/cell-data';

/**
 * Read the current link's rendered geometry from the paper it lives on —
 * `{ sourceX, sourceY, targetX, targetY, d }`, where `d` is the serialised SVG
 * path computed by JointJS's `LinkView`.
 *
 * Paper-scoped because link geometry is not a property of the graph record —
 * a single link can appear on multiple papers (e.g. main canvas + minimap)
 * with different routing. The layout is read from the paper context via
 * `usePaperStore()` and re-read whenever the paper version bumps (JointJS
 * calls `afterRender`, the paper store fires `setPaperViews`, which bumps
 * the version).
 *
 * Must be called inside `renderLink` (or a component mounted from one) so
 * `CellIdContext` resolves the target link id. Returns `undefined` while the
 * link view is still being created or when the link's source / target are
 * not yet positioned.
 * @returns the current link's layout, or undefined when unavailable
 */
export function useLinkLayout(): LinkLayout | undefined {
  const id = useCellId();
  const paperStore = usePaperStore();
  const selector = useMemo(
    () => createSelectPaperVersion(paperStore.paperId),
    [paperStore.paperId]
  );
  const version = useInternalData(selector);

  return useMemo(() => {
    const linkView = paperStore.getLinkView(id);
    if (!linkView) return;
    return getLinkLayout(linkView);
    // `version` drives re-memoisation when JointJS re-renders the link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, paperStore, version]);
}
